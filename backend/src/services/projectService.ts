import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../config/database.js";
import type { ProjectPriority, ProjectStatus } from "../models/projectModel.js";

export async function createProject(
    projectManagerId: number,
    name: string,
    description: string | null,
    status: ProjectStatus,
    priority: ProjectPriority,
    startDate: string | null,
    deadline: string | null
) {
    const pool = getPool();

    const [result] = await pool.query<ResultSetHeader>(
        `
        INSERT INTO projects
            (
                project_manager_id,
                name,
                description,
                status,
                priority,
                start_date,
                deadline
            )
        VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            projectManagerId,
            name,
            description,
            status,
            priority,
            startDate,
            deadline
        ]
    );

    return {
        project_id: result.insertId,
        project_manager_id: projectManagerId,
        name,
        description,
        status,
        priority,
        start_date: startDate,
        deadline,
        progress: 0
    };
}

export async function getProjectsByManager(projectManagerId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            project_id,
            project_manager_id,
            name,
            description,
            status,
            priority,
            start_date,
            deadline,
            progress,
            created_at,
            updated_at
        FROM projects
        WHERE project_manager_id = ?
        ORDER BY created_at DESC
        `,
        [projectManagerId]
    );

    return projects;
}

export async function getProjectsByMember(userId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            p.project_id,
            p.project_manager_id,
            p.name,
            p.description,
            p.status,
            p.priority,
            p.start_date,
            p.deadline,
            p.progress,
            p.created_at,
            p.updated_at
        FROM projects p
        JOIN project_members pm ON p.project_id = pm.project_id
        WHERE pm.user_id = ?
        ORDER BY p.created_at DESC
        `,
        [userId]
    );

    return projects;
}

export async function getProjectById(projectId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            project_id,
            project_manager_id,
            name,
            description,
            status,
            priority,
            start_date,
            deadline,
            progress,
            created_at,
            updated_at
        FROM projects
        WHERE project_id = ?
        `,
        [projectId]
    );

    if (projects.length === 0) {
        return null;
    }

    return projects[0];
}
export async function assignResourceToProject(
    projectId: number,
    projectManagerId: number,
    resourceId: number
) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT project_id
        FROM projects
        WHERE project_id = ?
          AND project_manager_id = ?
        LIMIT 1
        `,
        [projectId, projectManagerId]
    );

    if (projects.length === 0)
        throw new Error("PROJECT_NOT_FOUND");

    const [users] = await pool.query<RowDataPacket[]>(
        `
        SELECT user_id
        FROM users
        WHERE user_id = ?
          AND role = 'RESOURCE'
          AND is_active = TRUE
        LIMIT 1
        `,
        [resourceId]
    );

    if (users.length === 0)
        throw new Error("RESOURCE_NOT_FOUND");

    const [existingAssignments] = await pool.query<RowDataPacket[]>(
        `
        SELECT project_id
        FROM project_members
        WHERE project_id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [projectId, resourceId]
    );

    if (existingAssignments.length > 0)
        throw new Error("RESOURCE_ALREADY_ASSIGNED");

    await pool.query(
        `
        INSERT INTO project_members
            (project_id, user_id)
        VALUES
            (?, ?)
        `,
        [projectId, resourceId]
    );

    return {
        project_id: projectId,
        user_id: resourceId
    };
}

export async function getProjectIdsByMember(userId: number): Promise<number[]> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT project_id
        FROM project_members
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows.map(r => Number(r.project_id));
}

export async function isProjectMember(
    projectId: number,
    userId: number
): Promise<boolean> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT 1
        FROM project_members
        WHERE project_id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [projectId, userId]
    );

    return rows.length > 0;
}

export async function updateProject(
    projectId: number,
    projectManagerId: number,
    name: string,
    description: string | null,
    status: ProjectStatus,
    priority: ProjectPriority,
    startDate: string | null,
    deadline: string | null
) {
    const pool = getPool();

    const [result] = await pool.query<ResultSetHeader>(
        `
        UPDATE projects
        SET
            name = ?,
            description = ?,
            status = ?,
            priority = ?,
            start_date = ?,
            deadline = ?
        WHERE project_id = ?
          AND project_manager_id = ?
        `,
        [
            name,
            description,
            status,
            priority,
            startDate,
            deadline,
            projectId,
            projectManagerId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getProjectById(projectId);
}

export async function deleteProject(projectId: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [tasks] = await connection.query<RowDataPacket[]>(
            "SELECT task_id FROM tasks WHERE project_id = ?",
            [projectId]
        );

        if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.task_id);
            await connection.query(
                "DELETE FROM task_dependencies WHERE task_id IN (?) OR predecessor_task_id IN (?)",
                [taskIds, taskIds]
            );
            await connection.query("DELETE FROM task_assignments WHERE task_id IN (?)", [taskIds]);
            await connection.query("DELETE FROM work_logs WHERE task_id IN (?)", [taskIds]);
            await connection.query("DELETE FROM tasks WHERE project_id = ?", [projectId]);
        }

        await connection.query("DELETE FROM project_members WHERE project_id = ?", [projectId]);

        const [result] = await connection.query<ResultSetHeader>(
            "DELETE FROM projects WHERE project_id = ?",
            [projectId]
        );

        await connection.commit();
        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        "DELETE FROM project_members WHERE project_id = ? AND user_id = ?",
        [projectId, userId]
    );
    return result.affectedRows > 0;
}

export async function archiveProject(projectId: number, projectManagerId: number) {
    const pool = getPool();
    const project = await getProjectById(projectId);

    if (!project || project.project_manager_id !== projectManagerId) {
        return { error: "NOT_FOUND_OR_UNAUTHORIZED" };
    }

    if (project.status !== "COMPLETED") {
        return { error: "PROJECT_NOT_COMPLETED" };
    }

    await pool.query(
        "UPDATE projects SET status = 'ARCHIVED' WHERE project_id = ? AND project_manager_id = ?",
        [projectId, projectManagerId]
    );

    return { project: await getProjectById(projectId) };
}

export async function unarchiveProject(projectId: number, projectManagerId: number) {
    const pool = getPool();
    const project = await getProjectById(projectId);

    if (!project || project.project_manager_id !== projectManagerId) {
        return { error: "NOT_FOUND_OR_UNAUTHORIZED" };
    }

    if (project.status !== "ARCHIVED") {
        return { error: "PROJECT_NOT_ARCHIVED" };
    }

    await pool.query(
        "UPDATE projects SET status = 'COMPLETED' WHERE project_id = ? AND project_manager_id = ?",
        [projectId, projectManagerId]
    );

    return { project: await getProjectById(projectId) };
}