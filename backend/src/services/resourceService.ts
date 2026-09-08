import { getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2";

function formatResourceRow(row: any) {
    let nonWorkingDays: string[] = ["SATURDAY", "SUNDAY"];
    if (row.non_working_days !== null && row.non_working_days !== undefined) {
        try {
            const parsed = typeof row.non_working_days === "string"
                ? JSON.parse(row.non_working_days)
                : row.non_working_days;
            if (Array.isArray(parsed)) {
                nonWorkingDays = parsed;
            }
        } catch {
            nonWorkingDays = ["SATURDAY", "SUNDAY"];
        }
    }

    const dailyWorkingHours = row.daily_working_hours !== null && row.daily_working_hours !== undefined
        ? Number(row.daily_working_hours)
        : 8.0;

    return {
        user_id: Number(row.user_id),
        name: row.name,
        email: row.email,
        role: row.role,
        is_active: Boolean(row.is_active),
        non_working_days: nonWorkingDays,
        daily_working_hours: dailyWorkingHours,
        schedule_configured: Boolean(row.schedule_configured),
        created_at: row.created_at
    };
}

export async function getResources(projectId?: number, managerId?: number) {
    const pool = getPool();

    let query = `
        SELECT DISTINCT
            u.user_id,
            u.name,
            u.email,
            u.role,
            u.is_active,
            u.non_working_days,
            u.daily_working_hours,
            u.schedule_configured,
            u.created_at
        FROM users u
    `;

    const params: number[] = [];

    if (projectId !== undefined && managerId !== undefined) {
        query += `
            INNER JOIN project_members pm
                ON u.user_id = pm.user_id
            INNER JOIN projects p
                ON pm.project_id = p.project_id
        `;
    } else if (projectId !== undefined) {
        query += `
            INNER JOIN project_members pm
                ON u.user_id = pm.user_id
        `;
    } else if (managerId !== undefined) {
        query += `
            INNER JOIN project_members pm
                ON u.user_id = pm.user_id
            INNER JOIN projects p
                ON pm.project_id = p.project_id
        `;
    }

    query += `
        WHERE u.role = 'RESOURCE'
          AND u.is_active = TRUE
    `;

    if (projectId !== undefined && managerId !== undefined) {
        query += `
          AND pm.project_id = ?
          AND p.project_manager_id = ?
        `;
        params.push(projectId, managerId);
    } else if (projectId !== undefined) {
        query += `
          AND pm.project_id = ?
        `;
        params.push(projectId);
    } else if (managerId !== undefined) {
        query += `
          AND p.project_manager_id = ?
        `;
        params.push(managerId);
    }

    query += `
        ORDER BY u.name ASC
    `;

    const [resources] = await pool.query<RowDataPacket[]>(query, params);

    const seenUserIds = new Set<number>();
    const uniqueResources: ReturnType<typeof formatResourceRow>[] = [];
    for (const row of resources) {
        const formatted = formatResourceRow(row);
        if (!seenUserIds.has(formatted.user_id)) {
            seenUserIds.add(formatted.user_id);
            uniqueResources.push(formatted);
        }
    }

    return uniqueResources;
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
            non_working_days,
            daily_working_hours,
            schedule_configured,
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

    return formatResourceRow(resources[0]);
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