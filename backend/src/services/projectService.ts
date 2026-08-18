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