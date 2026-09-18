import { createDatabasePool } from '../config/database.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

async function main() {
    const pool = await createDatabasePool();
    console.log("Connected to DB.");

    // 1. Check for non-0.5 hour work logs
    const [nonHalfHourLogs] = await pool.query<RowDataPacket[]>(
        "SELECT log_id, task_id, user_id, hours_logged, progress_logged, status, notes, log_date FROM work_logs WHERE MOD(ROUND(hours_logged * 10), 5) != 0"
    );
    console.log(`Found ${nonHalfHourLogs.length} work logs with non-0.5 hour increments:`);
    for (const l of nonHalfHourLogs) {
        console.log(`  Log #${l.log_id} (Task #${l.task_id}, User #${l.user_id}): ${l.hours_logged}h -> Target: ${Math.round(Number(l.hours_logged) * 2) / 2}h`);
    }

    // 2. Patch non-0.5 hour logs
    if (nonHalfHourLogs.length > 0) {
        const [updateRes] = await pool.query<ResultSetHeader>(
            `UPDATE work_logs 
             SET hours_logged = GREATEST(0.5, ROUND(hours_logged * 2) / 2) 
             WHERE MOD(ROUND(hours_logged * 10), 5) != 0`
        );
        console.log(`Patched ${updateRes.affectedRows} work logs to nearest 0.5-hour increments.`);
    }

    // 3. Check for any remaining active task sessions
    const [activeSessions] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM task_sessions WHERE is_active = TRUE"
    );
    console.log(`Found ${activeSessions.length} active sessions lingering in task_sessions:`);
    for (const s of activeSessions) {
        console.log(`  Session #${s.session_id} (Task #${s.task_id}, User #${s.user_id}) started at ${s.start_time}`);
    }

    // Deactivate lingering sessions since session-based work tracking is retired
    if (activeSessions.length > 0) {
        const [sessionUpdate] = await pool.query<ResultSetHeader>(
            "UPDATE task_sessions SET is_active = FALSE, end_time = COALESCE(end_time, NOW()) WHERE is_active = TRUE"
        );
        console.log(`Deactivated ${sessionUpdate.affectedRows} lingering task sessions.`);
    }

    // 4. Reconcile task actual_effort with sum of work_logs
    console.log("Checking consistency of task actual_effort vs logged hours...");
    const [tasksEffortMismatch] = await pool.query<RowDataPacket[]>(
        `SELECT t.task_id, t.title, t.actual_effort, COALESCE(SUM(wl.hours_logged), 0) as total_logged
         FROM tasks t
         LEFT JOIN work_logs wl ON t.task_id = wl.task_id
         WHERE t.deleted_at IS NULL
         GROUP BY t.task_id
         HAVING ABS(t.actual_effort - total_logged) > 0.01`
    );
    console.log(`Found ${tasksEffortMismatch.length} tasks with effort mismatches:`);
    for (const m of tasksEffortMismatch) {
        console.log(`  Task #${m.task_id} "${m.title}": current actual_effort=${m.actual_effort}, sum of work_logs=${m.total_logged}`);
    }

    // Reconcile task actual_effort
    if (tasksEffortMismatch.length > 0) {
        for (const m of tasksEffortMismatch) {
            await pool.query(
                "UPDATE tasks SET actual_effort = ? WHERE task_id = ?",
                [m.total_logged, m.task_id]
            );
        }
        console.log(`Reconciled actual_effort for ${tasksEffortMismatch.length} tasks.`);
    }

    // 5. Reconcile project progress
    console.log("Checking project progress consistency...");
    const { syncProjectProgress } = await import('../services/projectService.js');
    const [projects] = await pool.query<RowDataPacket[]>(
        "SELECT project_id FROM projects WHERE deleted_at IS NULL"
    );
    for (const p of projects) {
        await syncProjectProgress(Number(p.project_id));
    }
    console.log(`Synchronized progress for ${projects.length} projects.`);

    console.log("Database patching completed successfully!");
    process.exit(0);
}

main().catch(err => {
    console.error("Patch script error:", err);
    process.exit(1);
});
