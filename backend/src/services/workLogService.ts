import { getPool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { recalculate as recalculateSchedule } from "./scheduler/SchedulingEngine.js";
import { syncProjectProgress } from "./projectService.js";

/**
 * Synchronizes a task's actual_effort, progress, and status based on all existing work_logs.
 * Handles multi-assignee equal effort distribution and status progression.
 */
export async function syncTaskProgressAndEffort(taskId: number, existingConnection?: any) {
    const pool = getPool();
    const connection = existingConnection || await pool.getConnection();
    const shouldRelease = !existingConnection;

    try {
        // 1. Get total effort across ALL logs for this task
        const [effortRows] = await connection.query(
            `SELECT COALESCE(SUM(hours_logged), 0) as total_effort FROM work_logs WHERE task_id = ?`,
            [taskId]
        );
        const newActualEffort = Number((effortRows as any[])[0]?.total_effort || 0);

        // 2. Calculate progress and status across assigned resources:
        // Since effort is divided equally among co-assignees, each assignee's latest reported progress
        // contributes their equal share to the overall task progress.
        const [assigneeRows] = await connection.query(
            `SELECT user_id FROM task_assignments WHERE task_id = ?`,
            [taskId]
        );

        // Fetch the latest work log for each user who has logged work on this task
        const [userLatestLogs] = await connection.query(
            `SELECT wl.user_id, wl.progress_logged, wl.status, wl.created_at
             FROM work_logs wl
             INNER JOIN (
                 SELECT user_id, MAX(created_at) as max_created
                 FROM work_logs
                 WHERE task_id = ?
                 GROUP BY user_id
             ) latest ON wl.user_id = latest.user_id AND wl.created_at = latest.max_created
             WHERE wl.task_id = ?`,
            [taskId, taskId]
        );

        const userLogMap = new Map<number, number>();
        for (const uLog of (userLatestLogs as any[])) {
            userLogMap.set(Number(uLog.user_id), Number(uLog.progress_logged));
        }

        let newProgress = 0;
        const assignees = assigneeRows as any[];
        const latestLogs = userLatestLogs as any[];

        if (assignees.length > 0) {
            let totalProgressSum = 0;
            for (const aRow of assignees) {
                const uId = Number(aRow.user_id);
                const userProgress = userLogMap.get(uId) ?? 0;
                totalProgressSum += userProgress;
            }
            newProgress = Math.round((totalProgressSum / assignees.length) * 100) / 100;
        } else if (latestLogs.length > 0) {
            const totalProgressSum = latestLogs.reduce((sum: number, l: any) => sum + Number(l.progress_logged), 0);
            newProgress = Math.round((totalProgressSum / latestLogs.length) * 100) / 100;
        }

        newProgress = Math.min(100, Math.max(0, newProgress));

        // Check if there is an active pending verification deliverable
        const [pendingVerificationRows] = await connection.query(
            `SELECT task_id, title FROM tasks WHERE verified_task_id = ? AND task_type = 'VERIFICATION' AND deleted_at IS NULL AND status != 'COMPLETED' LIMIT 1`,
            [taskId]
        );
        const hasPendingVerification = (pendingVerificationRows as any[]).length > 0;

        let newStatus: string;
        if (newProgress >= 100) {
            // Cannot mark COMPLETED if verification deliverable is still pending review
            newStatus = hasPendingVerification ? "IN_PROGRESS" : "COMPLETED";
        } else if (newProgress <= 0) {
            newStatus = assignees.length > 0 ? "SCHEDULED" : "UNASSIGNED";
        } else {
            newStatus = "IN_PROGRESS";
        }

        const updateFields: string[] = ["actual_effort = ?", "progress = ?", "status = ?"];
        const updateParams: any[] = [newActualEffort, newProgress, newStatus];

        // Check if this task has actual_start set, if not, set it
        const [taskRows] = await connection.query(
            `SELECT actual_start FROM tasks WHERE task_id = ?`,
            [taskId]
        );
        
        const tasks = taskRows as any[];
        if (tasks.length > 0 && !tasks[0]?.actual_start && (newProgress > 0 || newActualEffort > 0)) {
            updateFields.push("actual_start = NOW()");
        }
        
        if (newStatus === "COMPLETED") {
            updateFields.push("actual_end = NOW()");
        } else {
            updateFields.push("actual_end = NULL");
        }

        updateParams.push(taskId);

        await connection.query(
            `UPDATE tasks SET ${updateFields.join(", ")} WHERE task_id = ?`,
            updateParams
        );

        // If this was a verification task and it just completed, re-sync the parent verified task
        const [currentTaskRows] = await connection.query(
            `SELECT task_type, verified_task_id FROM tasks WHERE task_id = ?`,
            [taskId]
        );
        const currentTask = (currentTaskRows as any[])[0];
        if (currentTask?.task_type === "VERIFICATION" && currentTask?.verified_task_id && newStatus === "COMPLETED") {
            await syncTaskProgressAndEffort(Number(currentTask.verified_task_id), connection);
        }

        return { newActualEffort, newProgress, newStatus };
    } finally {
        if (shouldRelease) {
            connection.release();
        }
    }
}

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

        // Validate task existence and user assignment/supervisor status
        const [tasks] = await connection.query<RowDataPacket[]>(
            `SELECT t.task_id, t.project_id, t.supervisor_id, t.status, t.progress, t.actual_effort,
                    GROUP_CONCAT(ta.user_id) as assigned_user_ids
             FROM tasks t
             LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
             WHERE t.task_id = ? AND t.deleted_at IS NULL
             GROUP BY t.task_id`,
            [taskId]
        );

        if (tasks.length === 0) {
            throw new Error("Task not found or has been deleted");
        }

        const task = tasks[0]!;
        const assignedIds = task.assigned_user_ids
            ? String(task.assigned_user_ids).split(",").map(Number)
            : [];
        const isAssigned = assignedIds.includes(userId);
        const isSupervisor = Number(task.supervisor_id) === userId;

        if (!isAssigned && !isSupervisor) {
            throw new Error("Task not found or you are neither assigned to nor supervising this task");
        }

        const isSupervisorOnly = isSupervisor && !isAssigned;

        // Check if predecessor tasks are 100% complete
        const [incompletePredecessors] = await connection.query<RowDataPacket[]>(
            `SELECT p.title 
             FROM task_dependencies td
             JOIN tasks p ON td.predecessor_task_id = p.task_id
             WHERE td.task_id = ? AND p.status != 'COMPLETED' AND p.deleted_at IS NULL`,
            [taskId]
        );
        if (incompletePredecessors.length > 0) {
            throw new Error("Cannot log work: Predecessor tasks must be 100% complete first.");
        }

        // Count previous work logs to detect if this is the first work log
        const [workLogCountRows] = await connection.query<RowDataPacket[]>(
            `SELECT COUNT(*) as log_count FROM work_logs WHERE task_id = ?`,
            [taskId]
        );
        const isFirstLog = (workLogCountRows[0]?.log_count ?? 0) === 0;

        // Check if there is an active pending verification deliverable
        const [pendingVerificationRows] = await connection.query<RowDataPacket[]>(
            `SELECT task_id, title FROM tasks WHERE verified_task_id = ? AND task_type = 'VERIFICATION' AND deleted_at IS NULL AND status != 'COMPLETED' LIMIT 1`,
            [taskId]
        );
        const hasPendingVerification = (pendingVerificationRows as any[]).length > 0;

        let newProgress = Number(progressLogged);
        let newStatus: string;

        if (isSupervisorOnly) {
            // Time-based oversight log for supervisor: preserve task progress and status
            newProgress = Number(task.progress || 0);
            newStatus = String(task.status);
        } else {
            /* BACKEND STATUS SYNCHRONIZATION FOR ASSIGNEES:
             0% progress     -> 'SCHEDULED' (planned / not started)
             100% progress   -> 'COMPLETED' (all work finished), unless verification is pending
             1% - 99% progress -> 'IN_PROGRESS' (work actively ongoing) */
            if (newProgress <= 0) {
                newStatus = "SCHEDULED";
            } else if (newProgress >= 100) {
                newStatus = hasPendingVerification ? "IN_PROGRESS" : "COMPLETED";
            } else {
                newStatus = "IN_PROGRESS";
            }
        }

        // Insert the work log with the progress-aligned status
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO work_logs (task_id, user_id, hours_logged, progress_logged, status, notes, blockers, log_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [taskId, userId, hoursLogged, isSupervisorOnly ? newProgress : progressLogged, newStatus, notes, blockers, logDate]
        );

        // Immediately synchronize the task actual_effort, progress, and status in real-time
        const syncedTask = await syncTaskProgressAndEffort(taskId, connection);

        await connection.commit();

        // Synchronize project progress immediately so PM dashboards/analytics update in real-time
        syncProjectProgress(Number(task.project_id)).catch((err) => {
            console.error(`Error synchronizing project progress for project ${task.project_id}:`, err);
        });

        return {
            log_id: result.insertId,
            task_id: taskId,
            user_id: userId,
            hours_logged: hoursLogged,
            progress_logged: progressLogged,
            status: syncedTask.newStatus,
            notes,
            blockers,
            log_date: logDate,
            task_updated_status: syncedTask.newStatus,
            task_updated_progress: syncedTask.newProgress,
            task_updated_actual_effort: syncedTask.newActualEffort
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

    // Fetch all work logs for the specified task joined with users table to provide author details for co-assignees & supervisors
    const [logs] = await pool.query<RowDataPacket[]>(
        `SELECT wl.*, u.name as author_name, u.email as author_email,
                (wl.user_id = t.supervisor_id) as is_supervisor_log
         FROM work_logs wl
         JOIN users u ON wl.user_id = u.user_id
         JOIN tasks t ON wl.task_id = t.task_id
         WHERE wl.task_id = ?
         ORDER BY wl.created_at DESC`,
        [taskId]
    );

    // Fetch the latest progress snapshot per user — used by the frontend to show per-assignee
    // individual progress bars in the Task Progress & Effort tab without recalculating from raw logs.
    const [assigneeProgress] = await pool.query<RowDataPacket[]>(
        `SELECT wl.user_id, u.name as author_name, u.email as author_email,
                wl.progress_logged, wl.hours_logged, wl.log_date, wl.created_at
         FROM work_logs wl
         JOIN users u ON wl.user_id = u.user_id
         INNER JOIN (
             SELECT user_id, MAX(log_id) as max_log_id
             FROM work_logs
             WHERE task_id = ?
             GROUP BY user_id
         ) latest ON wl.log_id = latest.max_log_id
         WHERE wl.task_id = ?
         ORDER BY wl.user_id ASC`,
        [taskId, taskId]
    );

    return { logs, assigneeProgress };
}

export async function getDailyWorkAllocationsForResource(userId: number, dateStr: string, clientToday?: string) {
    const pool = getPool();
    const todayStr = clientToday || new Date().toISOString().split("T")[0]!;
    const isToday = dateStr === todayStr;

    // 1. Fetch tasks scheduled or assigned to this resource for dateStr
    // A task is relevant if:
    // a) It has a task_schedule on that date for this user
    // b) Or the user has logged work on this task on this date
    // c) Or dateStr IS TODAY and the user is assigned/supervisor and the task is active (SCHEDULED or IN_PROGRESS)
    const [tasks] = await pool.query<RowDataPacket[]>(
        `SELECT
            t.task_id,
            t.project_id,
            p.name as project_name,
            t.title,
            t.description,
            t.priority,
            t.status,
            t.deadline,
            t.planned_start,
            t.planned_end,
            t.expected_effort,
            t.actual_effort,
            t.progress,
            t.supervisor_id,
            (t.supervisor_id = ?) as is_supervisor,
            COALESCE(MAX(ts.allocated_hours), 0) as scheduled_hours_today,
            EXISTS (
                SELECT 1 FROM task_dependencies td 
                JOIN tasks p_task ON td.predecessor_task_id = p_task.task_id 
                WHERE td.task_id = t.task_id AND p_task.status != 'COMPLETED' AND p_task.deleted_at IS NULL
            ) as is_blocked
         FROM tasks t
         JOIN projects p ON t.project_id = p.project_id
         LEFT JOIN task_assignments ta ON t.task_id = ta.task_id AND ta.user_id = ?
         LEFT JOIN task_schedules ts ON t.task_id = ts.task_id AND ts.user_id = ? AND ts.schedule_date = ?
         WHERE t.deleted_at IS NULL
           AND p.deleted_at IS NULL
           AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
           AND t.verified_task_id IS NULL
           AND (
             ta.user_id IS NOT NULL
             OR t.supervisor_id = ?
             OR EXISTS (SELECT 1 FROM work_logs wl WHERE wl.task_id = t.task_id AND wl.user_id = ? AND wl.log_date = ?)
           )
           AND (
             ts.schedule_id IS NOT NULL
             OR EXISTS (SELECT 1 FROM work_logs wl WHERE wl.task_id = t.task_id AND wl.user_id = ? AND wl.log_date = ?)
           )
         GROUP BY t.task_id, p.name
         ORDER BY (EXISTS (SELECT 1 FROM work_logs wl WHERE wl.task_id = t.task_id AND wl.user_id = ? AND wl.log_date = ?)) DESC,
                  scheduled_hours_today > 0 DESC,
                  CASE t.priority
                      WHEN 'CRITICAL' THEN 1
                      WHEN 'HIGH' THEN 2
                      WHEN 'MEDIUM' THEN 3
                      WHEN 'LOW' THEN 4
                      ELSE 5
                  END ASC,
                  t.title ASC`,
        [userId, userId, userId, dateStr, userId, userId, dateStr, userId, dateStr, userId, dateStr]
    );
    console.log("DEBUG SCHEDULED HOURS:", tasks.map(t => t.scheduled_hours_today));

    // 2. Fetch all work logs logged by this user on dateStr
    const [logs] = await pool.query<RowDataPacket[]>(
        `SELECT wl.*, u.name as author_name, u.email as author_email, t.title as task_title, p.name as project_name
         FROM work_logs wl
         JOIN users u ON wl.user_id = u.user_id
         JOIN tasks t ON wl.task_id = t.task_id
         JOIN projects p ON t.project_id = p.project_id
         WHERE wl.user_id = ? AND wl.log_date = ?
         ORDER BY wl.created_at DESC`,
        [userId, dateStr]
    );

    let existingLogsMap = new Map<number, RowDataPacket[]>();
    for (const l of logs) {
        const tId = Number(l.task_id);
        if (!existingLogsMap.has(tId)) {
            existingLogsMap.set(tId, []);
        }
        existingLogsMap.get(tId)!.push(l);
    }

    // 3. Attach logged work & calculate summary
    const allocations = tasks.map(t => {
        const tId = Number(t.task_id);
        const logsForTask = existingLogsMap.get(tId) || [];
        const totalLoggedToday = logsForTask.reduce((sum, item) => sum + Number(item.hours_logged || 0), 0);
        return {
            ...t,
            scheduled_hours: Number(t.scheduled_hours_today || 0),
            hours_logged_today: totalLoggedToday,
            logs_today: logsForTask
        };
    });

    // 4. Check if user is checked out for this date
    const [checkoutRows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM daily_checkouts WHERE user_id = ? AND checkout_date = ?`,
        [userId, dateStr]
    );
    const is_checked_out = checkoutRows.length > 0;

    return {
        allocations,
        is_checked_out
    };
}

export async function getMyWorkLogs(userId: number, limit: number = 100) {
    const pool = getPool();

    const [logs] = await pool.query<RowDataPacket[]>(
        `SELECT wl.*, t.title as task_title, t.status as task_status, t.priority as task_priority,
                p.project_id, p.name as project_name, u.name as author_name, u.email as author_email
         FROM work_logs wl
         JOIN tasks t ON wl.task_id = t.task_id
         JOIN projects p ON t.project_id = p.project_id
         JOIN users u ON wl.user_id = u.user_id
         WHERE wl.user_id = ?
         ORDER BY wl.log_date DESC, wl.created_at DESC
         LIMIT ?`,
        [userId, limit]
    );

    const [stats] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(hours_logged), 0) as total_hours, COUNT(*) as total_logs
         FROM work_logs
         WHERE user_id = ?`,
        [userId]
    );

    return {
        logs,
        total_hours: Number(stats[0]?.total_hours || 0),
        total_logs: Number(stats[0]?.total_logs || 0)
    };
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

        // Verify task exists and user is assigned or supervisor of this task
        const [tasks] = await connection.query<RowDataPacket[]>(
            `SELECT t.task_id, t.supervisor_id FROM tasks t
             LEFT JOIN task_assignments ta ON t.task_id = ta.task_id AND ta.user_id = ?
             WHERE t.task_id = ? AND (ta.user_id = ? OR t.supervisor_id = ?)`,
            [userId, taskId, userId, userId]
        );

        if (tasks.length === 0) {
            throw new Error("Cannot start session: You are neither assigned to nor supervising this task");
        }

        // Check if predecessor tasks are 100% complete
        const [incompletePredecessors] = await connection.query<RowDataPacket[]>(
            `SELECT p.title 
             FROM task_dependencies td
             JOIN tasks p ON td.predecessor_task_id = p.task_id
             WHERE td.task_id = ? AND p.status != 'COMPLETED' AND p.deleted_at IS NULL`,
            [taskId]
        );
        if (incompletePredecessors.length > 0) {
            throw new Error("Cannot start session: Predecessor tasks must be 100% complete first.");
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
    
    // Ensure at least a small amount of time is logged if they start and stop immediately, and cap max duration
    if (hoursLogged < 0.01) hoursLogged = 0.01;
    if (hoursLogged > 12) hoursLogged = 12;

    // First mark session as inactive
    await pool.query(
        "UPDATE task_sessions SET end_time = NOW(), is_active = FALSE WHERE session_id = ?",
        [activeSession.session_id]
    );

    // Call createWorkLog
    const logDate = `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, '0')}-${String(endTime.getDate()).padStart(2, '0')}`;
    
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

export async function submitDailyLogs(userId: number, dateStr: string) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert into daily_checkouts, ignoring if already checked out
        await connection.query(
            `INSERT IGNORE INTO daily_checkouts (user_id, checkout_date) VALUES (?, ?)`,
            [userId, dateStr]
        );

        // 1.5 Apply all work logs logged by this user today to the tasks table
        const [logs] = await connection.query<RowDataPacket[]>(
            `SELECT DISTINCT task_id FROM work_logs WHERE user_id = ? AND log_date = ?`,
            [userId, dateStr]
        );

        for (const row of logs) {
            await syncTaskProgressAndEffort(row.task_id, connection);
        }

        // 2. Find all active projects this user is involved in so we can trigger recalculation
        const [projectRows] = await connection.query<RowDataPacket[]>(
            `SELECT DISTINCT p.project_id
             FROM projects p
             LEFT JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = ?
             LEFT JOIN tasks t ON p.project_id = t.project_id
             LEFT JOIN task_assignments ta ON t.task_id = ta.task_id AND ta.user_id = ?
             WHERE p.deleted_at IS NULL
               AND p.status NOT IN ('COMPLETED', 'CANCELLED', 'ARCHIVED')
               AND (pm.user_id IS NOT NULL OR ta.user_id IS NOT NULL OR t.supervisor_id = ? OR t.created_by = ?)`,
            [userId, userId, userId, userId]
        );

        await connection.commit();

        // 3. Trigger schedule recalculation and project progress sync for those projects
        const projectIds = projectRows.map(row => Number(row.project_id));
        for (const pid of projectIds) {
            try {
                await syncProjectProgress(pid);
                await recalculateSchedule(pid);
            } catch (scheduleErr) {
                console.error(`Error synchronizing/recalculating schedule for project ${pid} during daily checkout:`, scheduleErr);
            }
        }

        return { message: "Daily logs submitted and schedule recalculated" };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
