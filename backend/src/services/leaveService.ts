import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { UserLeave, CreateLeaveDTO } from "../models/leaveModel.js";
import { recalculate } from "./scheduler/SchedulingEngine.js";
import { getResourceProjects } from "./resourceService.js";

/**
 * Apply/Add a new user leave with resource checks, hours checks, and schedule recalculation.
 */
export async function applyLeave(data: CreateLeaveDTO): Promise<UserLeave> {
    const pool = getPool();
    const { user_id, leave_date } = data;
    const leave_hours = data.leave_hours !== undefined ? Number(data.leave_hours) : 8.00;

    // 1. Validate resource exists, is active, and has the role RESOURCE
    const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id, is_active, role FROM users WHERE user_id = ?`,
        [user_id]
    );

    const user = userRows[0];
    if (!user) {
        const error = new Error("Resource not found.");
        (error as any).status = 404;
        throw error;
    }

    if (!user.is_active) {
        const error = new Error("Resource is inactive.");
        (error as any).status = 400;
        throw error;
    }

    if (user.role !== "RESOURCE") {
        const error = new Error("User is not a resource.");
        (error as any).status = 400;
        throw error;
    }

    // 2. Validate leave hours (must be positive and <= 24)
    if (isNaN(leave_hours) || leave_hours <= 0 || leave_hours > 24) {
        const error = new Error("Leave hours must be a positive number up to 24.");
        (error as any).status = 400;
        throw error;
    }

    // 3. Format and validate Date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const formattedDate = leave_date.includes("T") ? leave_date.split("T")[0]! : leave_date;
    if (!dateRegex.test(formattedDate)) {
        const error = new Error("Invalid date format. Expected YYYY-MM-DD.");
        (error as any).status = 400;
        throw error;
    }
    const dateObj = new Date(`${formattedDate}T00:00:00Z`);
    if (isNaN(dateObj.getTime())) {
        const error = new Error("Invalid date.");
        (error as any).status = 400;
        throw error;
    }

    // 4. Duplicate leave check
    const [existingLeaves] = await pool.query<RowDataPacket[]>(
        `SELECT leave_id FROM user_leaves WHERE user_id = ? AND leave_date = ?`,
        [user_id, formattedDate]
    );

    if (existingLeaves.length > 0) {
        const error = new Error("A leave request already exists for this resource on this date.");
        (error as any).status = 409;
        throw error;
    }

    // 5. Insert leave record
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO user_leaves (user_id, leave_date, leave_hours) VALUES (?, ?, ?)`,
        [user_id, formattedDate, leave_hours]
    );

    // 6. Recalculate schedules for all projects this resource belongs to
    try {
        const projects = await getResourceProjects(user_id);
        for (const project of projects) {
            await recalculate(Number(project.project_id));
        }
    } catch (schedError) {
        console.error("Warning: Failed to recalculate project schedules after applying leave:", schedError);
    }

    return {
        leave_id: result.insertId,
        user_id,
        leave_date: formattedDate,
        leave_hours
    };
}

/**
 * Remove/Cancel a user leave and recalculate schedule.
 */
export async function cancelLeave(leaveId: number, reqUser: { user_id: number; role: string }): Promise<void> {
    const pool = getPool();

    // 1. Fetch leave to verify existence and check user ownership
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `SELECT leave_id, user_id FROM user_leaves WHERE leave_id = ?`,
        [leaveId]
    );

    const leave = leaveRows[0];
    if (!leave) {
        const error = new Error("Leave record not found.");
        (error as any).status = 404;
        throw error;
    }

    // 2. Access control: RESOURCE role can only cancel their own leaves
    if (reqUser.role === "RESOURCE" && Number(leave.user_id) !== Number(reqUser.user_id)) {
        const error = new Error("Access denied. You can only cancel your own leaves.");
        (error as any).status = 403;
        throw error;
    }

    // 3. Delete leave record
    await pool.query(
        `DELETE FROM user_leaves WHERE leave_id = ?`,
        [leaveId]
    );

    // 4. Recalculate schedules for all projects this resource belongs to
    try {
        const projects = await getResourceProjects(Number(leave.user_id));
        for (const project of projects) {
            await recalculate(Number(project.project_id));
        }
    } catch (schedError) {
        console.error("Warning: Failed to recalculate project schedules after cancelling leave:", schedError);
    }
}

/**
 * Get leaves list with optional filters for user_id, startDate, and endDate.
 */
export async function getLeaves(filters: { user_id?: number; startDate?: string; endDate?: string }): Promise<UserLeave[]> {
    const pool = getPool();
    let query = `
        SELECT 
            leave_id,
            user_id,
            DATE_FORMAT(leave_date, '%Y-%m-%d') as leave_date,
            leave_hours
        FROM user_leaves
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.user_id !== undefined) {
        conditions.push(`user_id = ?`);
        params.push(filters.user_id);
    }

    if (filters.startDate) {
        conditions.push(`leave_date >= ?`);
        params.push(filters.startDate);
    }

    if (filters.endDate) {
        conditions.push(`leave_date <= ?`);
        params.push(filters.endDate);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY leave_date ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    // Ensure decimal leave hours is mapped to a Javascript number
    return rows.map(r => ({
        leave_id: Number(r.leave_id),
        user_id: Number(r.user_id),
        leave_date: String(r.leave_date),
        leave_hours: Number(r.leave_hours)
    }));
}
