import type { ResultSetHeader } from "mysql2";
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