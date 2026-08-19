import { getPool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { handleTaskCompletionImpact } from "./schedulingService.js";

export async function createWorkLog(
    taskId: number,
    userId: number,
    hoursLogged: number,
    progressLogged: number,
    notes: string,
    logDate: string
) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if task exists and user is assigned
        const [tasks] = await connection.query<RowDataPacket[]>(
            `SELECT t.task_id, t.actual_effort, t.progress, t.status 
             FROM tasks t
             JOIN task_assignments ta ON t.task_id = ta.task_id
             WHERE t.task_id = ? AND ta.user_id = ?`,
            [taskId, userId]
        );

        if (tasks.length === 0) {
            throw new Error("Task not found or user is not assigned to this task");
        }

        const task = tasks[0]!;

        // Insert the work log
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO work_logs (task_id, user_id, hours_logged, progress_logged, notes, log_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [taskId, userId, hoursLogged, progressLogged, notes, logDate]
        );

        // Update the task actual effort, progress, and status
        const newActualEffort = Number(task.actual_effort) + Number(hoursLogged);
        const newProgress = Number(progressLogged);
        let newStatus = task.status;

        if (newProgress >= 100) {
            newStatus = "COMPLETED";
        } else if (newProgress > 0 && task.status === "PENDING") {
            newStatus = "IN_PROGRESS";
        }

        await connection.query(
            `UPDATE tasks 
             SET actual_effort = ?, progress = ?, status = ?
             WHERE task_id = ?`,
            [newActualEffort, newProgress, newStatus, taskId]
        );

        await connection.commit();

        if (newStatus === "COMPLETED" && task.status !== "COMPLETED") {
            await handleTaskCompletionImpact(taskId, logDate);
        }

        return {
            log_id: result.insertId,
            task_id: taskId,
            user_id: userId,
            hours_logged: hoursLogged,
            progress_logged: progressLogged,
            notes,
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
