import { getPool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { recalculate as recalculateSchedule } from "./scheduler/SchedulingEngine.js";
import { syncProjectProgress } from "./projectService.js";

export async function createWorkLog(
    taskId: number,
    userId: number,
    hoursLogged: number,
    progressLogged: number,
    status: string,
    notes: string,
    blockers: string | null,
    logDate: string
) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if task exists and user is assigned
        const [tasks] = await connection.query<RowDataPacket[]>(
            `SELECT t.task_id, t.project_id, t.expected_effort, t.actual_effort, t.progress, t.status, t.deadline
             FROM tasks t
             JOIN task_assignments ta ON t.task_id = ta.task_id
             WHERE t.task_id = ? AND ta.user_id = ?`,
            [taskId, userId]
        );

        if (tasks.length === 0) {
            throw new Error("Task not found or user is not assigned to this task");
        }

        const task = tasks[0]!;

        // Count previous work logs to detect if this is the first work log
        const [workLogCountRows] = await connection.query<RowDataPacket[]>(
            `SELECT COUNT(*) as log_count FROM work_logs WHERE task_id = ?`,
            [taskId]
        );
        const isFirstLog = (workLogCountRows[0]?.log_count ?? 0) === 0;

        // Calculate updated effort and progress values
        const oldActualEffort = Number(task.actual_effort);
        const expectedEffort = Number(task.expected_effort);
        const newActualEffort = oldActualEffort + Number(hoursLogged);
        const newProgress = Number(progressLogged);

        /* BACKEND STATUS SYNCHRONIZATION:
         Automatically determine task status based on progress logged:
         0% progress     -> 'SCHEDULED' (planned / not started)
         100% progress   -> 'COMPLETED' (all work finished)
         1% - 99% progress -> 'IN_PROGRESS' (work actively ongoing) */

        let newStatus: string;
        if (newProgress <= 0) {
            newStatus = "SCHEDULED";
        } else if (newProgress >= 100) {
            newStatus = "COMPLETED";
        } else {
            newStatus = "IN_PROGRESS";
        }

        // Insert the work log with the progress-aligned status
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO work_logs (task_id, user_id, hours_logged, progress_logged, status, notes, blockers, log_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [taskId, userId, hoursLogged, progressLogged, newStatus, notes, blockers, logDate]
        );

        // Dynamically build UPDATE query for tasks
        // We set actual_start on first log if supported, and actual_end on COMPLETED
        const updateFields: string[] = ["actual_effort = ?", "progress = ?", "status = ?"];
        const updateParams: any[] = [newActualEffort, newProgress, newStatus];

        // Check if actual_start / actual_end columns exist or can be updated safely
        if (isFirstLog) {
            try {
                // If actual_start column exists, update it
                updateFields.push("actual_start = COALESCE(actual_start, NOW())");
            } catch {
                // Ignore if column not present yet
            }
        }

        if (newStatus === "COMPLETED") {
            try {
                updateFields.push("actual_end = NOW()");
            } catch {
                // Ignore if column not present yet
            }
        }

        updateParams.push(taskId);

        try {
            await connection.query(
                `UPDATE tasks SET ${updateFields.join(", ")} WHERE task_id = ?`,
                updateParams
            );
        } catch (updateErr: any) {
            // Fallback in case actual_start or actual_end column has not been added by Dev 1 yet
            await connection.query(
                `UPDATE tasks SET actual_effort = ?, progress = ?, status = ? WHERE task_id = ?`,
                [newActualEffort, newProgress, newStatus, taskId]
            );
        }

        await connection.commit();

        // 4. Hook project progress auto-rollup and SchedulingEngine.recalculate whenever work is logged
        try {
            await syncProjectProgress(task.project_id);
        } catch (syncErr) {
            console.error("Error synchronizing project progress in workLogService:", syncErr);
        }

        try {
            await recalculateSchedule(task.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation in workLogService:", scheduleErr);
        }

        return {
            log_id: result.insertId,
            task_id: taskId,
            user_id: userId,
            hours_logged: hoursLogged,
            progress_logged: progressLogged,
            status: newStatus,
            notes,
            blockers,
            log_date: logDate,
            task_updated_status: newStatus,
            task_updated_progress: newProgress,
            task_updated_actual_effort: newActualEffort
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function getWorkLogsByTask(taskId: number) {
    const pool = getPool();

    // Fetch all work logs for the specified task joined with users table to provide author details for co-assignees
    const [logs] = await pool.query<RowDataPacket[]>(
        `SELECT wl.*, u.name as author_name, u.email as author_email 
         FROM work_logs wl
         JOIN users u ON wl.user_id = u.user_id
         WHERE wl.task_id = ?
         ORDER BY wl.created_at DESC`,
        [taskId]
    );

    return logs;
}

export async function getRecentWorkLogsForManager(projectManagerId: number, limit: number = 50) {
    const pool = getPool();

    const [logs] = await pool.query<RowDataPacket[]>(
        `SELECT wl.*, u.name as author_name, t.title as task_title, p.name as project_name 
         FROM work_logs wl
         JOIN users u ON wl.user_id = u.user_id
         JOIN tasks t ON wl.task_id = t.task_id
         JOIN projects p ON t.project_id = p.project_id
         WHERE p.project_manager_id = ?
         ORDER BY wl.created_at DESC
         LIMIT ?`,
        [projectManagerId, limit]
    );

    return logs;
}

export async function startSession(taskId: number, userId: number) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Verify task exists and user is assigned to this task
        const [tasks] = await connection.query<RowDataPacket[]>(
            `SELECT t.task_id FROM tasks t
             JOIN task_assignments ta ON t.task_id = ta.task_id
             WHERE t.task_id = ? AND ta.user_id = ?`,
            [taskId, userId]
        );

        if (tasks.length === 0) {
            throw new Error("Cannot start session: You are not assigned to this task");
        }

        // Ensure user has no other active sessions
        const [activeSessions] = await connection.query<RowDataPacket[]>(
            "SELECT session_id, task_id FROM task_sessions WHERE user_id = ? AND is_active = TRUE",
            [userId]
        );

        if (activeSessions.length > 0) {
            throw new Error(`User already has an active session for task ${activeSessions[0]!.task_id}`);
        }

        const [result] = await connection.query<ResultSetHeader>(
            "INSERT INTO task_sessions (task_id, user_id, start_time, is_active) VALUES (?, ?, NOW(), TRUE)",
            [taskId, userId]
        );

        await connection.commit();
        return { session_id: result.insertId, task_id: taskId, start_time: new Date() };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function getActiveSession(userId: number) {
    const pool = getPool();
    const [sessions] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM task_sessions WHERE user_id = ? AND is_active = TRUE LIMIT 1",
        [userId]
    );
    return sessions.length > 0 ? sessions[0] : null;
}

// Fetch all active sessions currently in progress on a specific task across all assigned resources
export async function getActiveSessionsForTask(taskId: number) {
    const pool = getPool();
    // Query active sessions joined with users so co-assignees can see who is currently working
    const [sessions] = await pool.query<RowDataPacket[]>(
        `SELECT ts.session_id, ts.task_id, ts.user_id, ts.start_time, ts.is_active, u.name as user_name, u.email as user_email
         FROM task_sessions ts
         JOIN users u ON ts.user_id = u.user_id
         WHERE ts.task_id = ? AND ts.is_active = TRUE
         ORDER BY ts.start_time ASC`,
        [taskId]
    );
    return sessions;
}

export async function stopSession(userId: number, progressLogged: number, notes: string, blockers: string | null) {
    const pool = getPool();
    
    // Get active session
    const activeSession = await getActiveSession(userId);
    if (!activeSession) {
        throw new Error("No active session found for this user");
    }

    const taskId = activeSession.task_id;
    const startTime = new Date(activeSession.start_time);
    const endTime = new Date();
    
    // Calculate hours logged
    const diffMs = endTime.getTime() - startTime.getTime();
    let hoursLogged = diffMs / (1000 * 60 * 60);
    
    // Ensure at least a small amount of time is logged if they start and stop immediately
    if (hoursLogged < 0.01) hoursLogged = 0.01;

    // First mark session as inactive
    await pool.query(
        "UPDATE task_sessions SET end_time = NOW(), is_active = FALSE WHERE session_id = ?",
        [activeSession.session_id]
    );

    // Call createWorkLog
    const logDate = endTime.toISOString().split('T')[0]!;
    
    // Fetch task current status
    const [tasks] = await pool.query<RowDataPacket[]>("SELECT status FROM tasks WHERE task_id = ?", [taskId]);
    const currentStatus = tasks[0]?.status || 'IN_PROGRESS';
    
    const workLog = await createWorkLog(
        taskId,
        userId,
        hoursLogged,
        progressLogged,
        currentStatus,
        notes,
        blockers,
        logDate
    );
    
    return workLog;
}
