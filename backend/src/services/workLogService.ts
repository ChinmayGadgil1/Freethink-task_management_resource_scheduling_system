import { getPool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { recalculate as recalculateSchedule } from "./scheduler/SchedulingEngine.js";

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

        // Insert the work log
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO work_logs (task_id, user_id, hours_logged, progress_logged, status, notes, blockers, log_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [taskId, userId, hoursLogged, progressLogged, status, notes, blockers, logDate]
        );

        // Update the task actual effort, progress, and status
        const oldActualEffort = Number(task.actual_effort);
        const expectedEffort = Number(task.expected_effort);
        const newActualEffort = oldActualEffort + Number(hoursLogged);
        const newProgress = Number(progressLogged);

        // 1. If first log, set actual_start = log_date and transition to IN_PROGRESS (if not already completed)
        let newStatus = status;
        if (isFirstLog && (task.status === "UNASSIGNED" || task.status === "SCHEDULED" || task.status === "PENDING")) {
            if (status !== "COMPLETED") {
                newStatus = "IN_PROGRESS";
            }
        }

        // Dynamically build UPDATE query for tasks
        // We set actual_start on first log if supported, and actual_end on COMPLETED
        const updateFields: string[] = ["actual_effort = ?", "progress = ?", "status = ?"];
        const updateParams: any[] = [newActualEffort, newProgress, newStatus];

        // Check if actual_start / actual_end columns exist or can be updated safely
        if (isFirstLog) {
            try {
                // If actual_start column exists, update it
                updateFields.push("actual_start = COALESCE(actual_start, ?)");
                updateParams.push(logDate);
            } catch {
                // Ignore if column not present yet
            }
        }

        if (newStatus === "COMPLETED") {
            try {
                updateFields.push("actual_end = ?");
                updateParams.push(logDate);
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

        // 4. Hook SchedulingEngine.recalculate(projectId) if:
        // - total logged > expected (overrun)
        // - OR if completed early (marked COMPLETED and (actual_effort < expected_effort OR completed before deadline))
        const isOverrun = newActualEffort > expectedEffort;
        const isEarlyCompletion = newStatus === "COMPLETED" && (
            newActualEffort < expectedEffort ||
            (task.deadline && logDate < String(task.deadline).split("T")[0]!)
        );

        if (isOverrun || isEarlyCompletion) {
            try {
                await recalculateSchedule(task.project_id);
            } catch (scheduleErr) {
                console.error("Error triggering schedule recalculation in workLogService:", scheduleErr);
            }
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

    const [logs] = await pool.query<RowDataPacket[]>(
        `SELECT wl.*, u.name as author_name 
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
