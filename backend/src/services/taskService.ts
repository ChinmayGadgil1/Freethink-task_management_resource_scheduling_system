import { getPool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { TaskPriority, TaskStatus } from "../models/taskModel.js";

export async function createTask(
    projectId: number,
    title: string,
    description: string | null,
    priority: TaskPriority,
    status: TaskStatus,
    startDate: string | null,
    deadline: string | null,
    expectedEffort: number,
    assignedResourceIds?: number[]
) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query<ResultSetHeader>(
            `
            INSERT INTO tasks
                (project_id, title, description, priority, status, start_date, deadline, expected_effort, progress)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, 0)
            `,
            [projectId, title, description, priority, status, startDate, deadline, expectedEffort]
        );

        const taskId = result.insertId;

        if (assignedResourceIds && assignedResourceIds.length > 0) {
            // Verify roles
            const [users] = await connection.query<RowDataPacket[]>(
                "SELECT user_id, role FROM users WHERE user_id IN (?)",
                [assignedResourceIds]
            );

            const invalidUsers = users.filter(u => u.role !== "RESOURCE");
            if (invalidUsers.length > 0) {
                throw new Error("Only users with RESOURCE role can be assigned to tasks");
            }

            const values = assignedResourceIds.map(userId => [taskId, userId]);
            await connection.query(
                "INSERT INTO task_assignments (task_id, user_id) VALUES ?",
                [values]
            );
        }

        await connection.commit();

        return {
            task_id: taskId,
            project_id: projectId,
            title,
            description,
            priority,
            status,
            start_date: startDate,
            deadline,
            expected_effort: expectedEffort,
            actual_effort: 0,
            progress: 0,
            assigned_resource_ids: assignedResourceIds || []
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function getTasksList(filters: {
    projectId?: number | undefined;
    resourceId?: number | undefined;
}) {
    const pool = getPool();

    let query = `
        SELECT t.*, 
               GROUP_CONCAT(ta.user_id) as assigned_resource_ids
        FROM tasks t
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (filters.projectId) {
        whereClauses.push("t.project_id = ?");
        params.push(filters.projectId);
    }

    if (filters.resourceId) {
        whereClauses.push("t.task_id IN (SELECT task_id FROM task_assignments WHERE user_id = ?)");
        params.push(filters.resourceId);
    }

    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " GROUP BY t.task_id ORDER BY t.created_at DESC";

    const [tasks] = await pool.query<RowDataPacket[]>(query, params);
    return tasks.map(t => ({
        ...t,
        assigned_resource_ids: t.assigned_resource_ids 
            ? t.assigned_resource_ids.split(",").map(Number)
            : []
    }));
}
