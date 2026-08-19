import { getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2";

export async function getResources(projectId?: number) {
    const pool = getPool();

    let query = `
        SELECT
            u.user_id,
            u.name,
            u.email,
            u.role,
            u.is_active,
            u.created_at
        FROM users u
    `;

    const params: number[] = [];

    if (projectId !== undefined) {
        query += `
            INNER JOIN project_members pm
                ON u.user_id = pm.user_id
        `;
    }

    query += `
        WHERE u.role = 'RESOURCE'
          AND u.is_active = TRUE
    `;

    if (projectId !== undefined) {
        query += `
          AND pm.project_id = ?
        `;
        params.push(projectId);
    }

    query += `
        ORDER BY u.name ASC
    `;

    const [resources] = await pool.query<RowDataPacket[]>(query, params);

    return resources;
}

export async function getResourceById(resourceId: number) {
    const pool = getPool();

    const [resources] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            user_id,
            name,
            email,
            role,
            is_active,
            created_at
        FROM users
        WHERE user_id = ?
          AND role = 'RESOURCE'
        LIMIT 1
        `,
        [resourceId]
    );

    if (resources.length === 0)
        throw new Error("RESOURCE_NOT_FOUND");

    return resources[0];
}

export async function getResourceProjects(resourceId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            p.project_id,
            p.name,
            p.description,
            p.status,
            p.progress,
            p.deadline
        FROM projects p
        INNER JOIN project_members pm
            ON p.project_id = pm.project_id
        WHERE pm.user_id = ?
        ORDER BY p.name ASC
        `,
        [resourceId]
    );

    return projects;
}