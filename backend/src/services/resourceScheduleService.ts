import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type {
    DayOfWeek,
    ResourceScheduleDTO,
    UpdateResourceScheduleDTO
} from "../models/resourceScheduleModel.js";
import { recalculate } from "./scheduler/SchedulingEngine.js";

export const ALL_DAYS: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
];

/**
 * Retrieve resource non-working days and daily working hours configuration from the users table.
 * If non_working_days is null or empty, all 7 days are considered working days.
 * If daily_working_hours is null, default 8.0h is returned.
 */
export async function getResourceWorkSchedule(userId: number): Promise<ResourceScheduleDTO> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            user_id,
            role,
            non_working_days,
            daily_working_hours
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (rows.length === 0) {
        const error = new Error("Resource not found.");
        (error as any).status = 404;
        throw error;
    }

    const row = rows[0]!;
    let nonWorkingDays: DayOfWeek[] = [];
    let isCustom = false;

    if (row.non_working_days !== null && row.non_working_days !== undefined) {
        isCustom = true;
        try {
            const raw = typeof row.non_working_days === "string"
                ? JSON.parse(row.non_working_days)
                : row.non_working_days;
            if (Array.isArray(raw)) {
                nonWorkingDays = raw.filter((d: any): d is DayOfWeek => ALL_DAYS.includes(d));
            }
        } catch {
            nonWorkingDays = [];
        }
    }

    // All days not present in non_working_days are automatically working days
    const workingDays = ALL_DAYS.filter(d => !nonWorkingDays.includes(d));

    const dailyHours = row.daily_working_hours !== null && row.daily_working_hours !== undefined
        ? Number(row.daily_working_hours)
        : 8.0;

    return {
        user_id: userId,
        non_working_days: nonWorkingDays,
        working_days: workingDays,
        daily_working_hours: dailyHours,
        is_custom: isCustom
    };
}

/**
 * Update resource non-working days and daily working hours in the users table.
 * PMs can update any resource, and resources can update their own schedule.
 */
export async function updateResourceWorkSchedule(
    userId: number,
    data: UpdateResourceScheduleDTO
): Promise<ResourceScheduleDTO> {
    const pool = getPool();

    // 1. Validate non_working_days
    if (!Array.isArray(data.non_working_days)) {
        const error = new Error("non_working_days must be an array.");
        (error as any).status = 400;
        throw error;
    }

    const invalidDays = data.non_working_days.filter(d => !ALL_DAYS.includes(d));
    if (invalidDays.length > 0) {
        const error = new Error(`Invalid non-working day(s): ${invalidDays.join(", ")}`);
        (error as any).status = 400;
        throw error;
    }

    // Remove duplicates
    const uniqueNonWorkingDays = Array.from(new Set(data.non_working_days));

    if (uniqueNonWorkingDays.length >= 7) {
        const error = new Error("A resource cannot mark all 7 days as non-working. At least 1 working day is required.");
        (error as any).status = 400;
        throw error;
    }

    // 2. Validate daily_working_hours if provided
    let dailyHours: number | undefined;
    if (data.daily_working_hours !== undefined) {
        const hoursNum = Number(data.daily_working_hours);
        if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
            const error = new Error("daily_working_hours must be a number between 0.5 and 24 hours.");
            (error as any).status = 400;
            throw error;
        }
        dailyHours = hoursNum;
    }

    const jsonString = JSON.stringify(uniqueNonWorkingDays);

    let query: string;
    let params: any[];

    if (dailyHours !== undefined) {
        query = `
            UPDATE users
            SET non_working_days = ?, daily_working_hours = ?
            WHERE user_id = ? AND role = 'RESOURCE'
        `;
        params = [jsonString, dailyHours, userId];
    } else {
        query = `
            UPDATE users
            SET non_working_days = ?
            WHERE user_id = ? AND role = 'RESOURCE'
        `;
        params = [jsonString, userId];
    }

    const [result] = await pool.query<ResultSetHeader>(query, params);

    if (result.affectedRows === 0) {
        // Check if user exists and is a resource
        const [userCheck] = await pool.query<RowDataPacket[]>(
            `SELECT user_id, role, daily_working_hours FROM users WHERE user_id = ?`,
            [userId]
        );
        if (userCheck.length === 0) {
            const error = new Error("Resource not found.");
            (error as any).status = 404;
            throw error;
        }
        if (userCheck[0]?.role !== "RESOURCE") {
            const error = new Error("Only users with role RESOURCE can have a work schedule configured.");
            (error as any).status = 400;
            throw error;
        }
    }

    const workingDays = ALL_DAYS.filter(d => !uniqueNonWorkingDays.includes(d));

    // Fetch latest daily hours if not updated
    let finalDailyHours = dailyHours;
    if (finalDailyHours === undefined) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT daily_working_hours FROM users WHERE user_id = ?`,
            [userId]
        );
        finalDailyHours = rows[0]?.daily_working_hours ? Number(rows[0].daily_working_hours) : 8.0;
    }

    // Recalculate schedules for all active projects this resource is assigned to or a member of
    try {
        const [projectRows] = await pool.query<RowDataPacket[]>(
            `
            SELECT DISTINCT p.project_id
            FROM projects p
            WHERE p.status NOT IN ('COMPLETED', 'CANCELLED')
              AND (
                p.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
                OR p.project_id IN (
                    SELECT t.project_id
                    FROM tasks t
                    INNER JOIN task_assignments ta ON t.task_id = ta.task_id
                    WHERE ta.user_id = ?
                )
              )
            `,
            [userId, userId]
        );

        for (const project of projectRows) {
            try {
                await recalculate(Number(project.project_id));
            } catch (projErr) {
                console.error(`Warning: Failed to recalculate project ${project.project_id} after resource schedule update:`, projErr);
            }
        }
    } catch (schedError) {
        console.error("Warning: Failed to query active projects for recalculation after resource schedule update:", schedError);
    }

    return {
        user_id: userId,
        non_working_days: uniqueNonWorkingDays,
        working_days: workingDays,
        daily_working_hours: finalDailyHours,
        is_custom: true
    };
}
