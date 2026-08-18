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
    projectIds?: number[] | undefined;
}) {
    const pool = getPool();

    let query = `
        SELECT t.*, p.name as project_name,
               GROUP_CONCAT(ta.user_id) as assigned_resource_ids
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (filters.projectId) {
        whereClauses.push("t.project_id = ?");
        params.push(filters.projectId);
    }

    if (filters.projectIds) {
        if (filters.projectIds.length > 0) {
            whereClauses.push("t.project_id IN (?)");
            params.push(filters.projectIds);
        } else {
            whereClauses.push("1 = 0");
        }
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

export async function getTaskById(taskId: number) {
    const pool = getPool();
    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.*, 
               GROUP_CONCAT(ta.user_id) as assigned_resource_ids
        FROM tasks t
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
        WHERE t.task_id = ?
        GROUP BY t.task_id
        `,
        [taskId]
    );

    if (tasks.length === 0) {
        return null;
    }

    const task = tasks[0];
    if (!task) {
        return null;
    }
    return {
        ...task,
        assigned_resource_ids: task.assigned_resource_ids 
            ? task.assigned_resource_ids.split(",").map(Number)
            : []
    } as any;
}

export async function addTaskDependency(taskId: number, predecessorTaskId: number) {
    const pool = getPool();
    
    // Check if the dependency already exists
    const [existing] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM task_dependencies WHERE task_id = ? AND predecessor_task_id = ?",
        [taskId, predecessorTaskId]
    );
    if (existing.length > 0) return;

    await pool.query(
        "INSERT INTO task_dependencies (task_id, predecessor_task_id) VALUES (?, ?)",
        [taskId, predecessorTaskId]
    );
}

export async function getTaskDependencies(taskId: number): Promise<number[]> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT predecessor_task_id FROM task_dependencies WHERE task_id = ?",
        [taskId]
    );
    return rows.map(r => Number(r.predecessor_task_id));
}

export async function updateTask(taskId: number, updates: Record<string, any>) {
    const pool = getPool();
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const params = [...Object.values(updates), taskId];

    await pool.query(`UPDATE tasks SET ${setClause} WHERE task_id = ?`, params);
}

