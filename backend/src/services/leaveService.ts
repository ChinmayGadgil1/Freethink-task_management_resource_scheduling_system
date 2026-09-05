import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { UserLeave, CreateLeaveDTO, LeaveStatus } from "../models/leaveModel.js";
import { recalculate } from "./scheduler/SchedulingEngine.js";
import { getResourceProjects } from "./resourceService.js";

const DAY_OF_WEEK_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

function parseNonWorkingDaysList(raw: any): string[] {
    if (!raw) return ['SATURDAY', 'SUNDAY'];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // fallback
        }
    }
    return ['SATURDAY', 'SUNDAY'];
}

function formatDateISO(d: Date): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDatesBetween(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = [];
    const current = new Date(`${startDateStr}T00:00:00Z`);
    const end = new Date(`${endDateStr}T00:00:00Z`);
    while (current <= end) {
        dates.push(formatDateISO(current));
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}

/**
 * Apply/Add a new user leave (supports single-day or multi-day range with half-day options).
 * If applied by PM, default to APPROVED and trigger schedule recalculation.
 * If applied by RESOURCE, default to PENDING (pending PM approval, no immediate recalculation).
 */
export async function applyLeave(data: CreateLeaveDTO, userRole?: string, creatorId?: number): Promise<UserLeave | UserLeave[]> {
    const pool = getPool();
    const { user_id } = data;

    const startDateStr = (data.start_date || data.leave_date || '').split('T')[0]!;
    const endDateStr = (data.end_date || startDateStr).split('T')[0]!;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
        const error = new Error("Invalid date format. Expected YYYY-MM-DD.");
        (error as any).status = 400;
        throw error;
    }

    if (startDateStr > endDateStr) {
        const error = new Error("Start date cannot be after end date.");
        (error as any).status = 400;
        throw error;
    }

    // 1. Validate resource exists, is active, and has the role RESOURCE
    const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id, is_active, role, daily_working_hours, non_working_days FROM users WHERE user_id = ?`,
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

    const userDailyHours = user.daily_working_hours !== null && user.daily_working_hours !== undefined
        ? Number(user.daily_working_hours)
        : 8.00;
        
    const maxDailyHours = !isNaN(userDailyHours) && userDailyHours > 0 && userDailyHours <= 24
        ? userDailyHours
        : 8.00;

    // Fetch company holidays
    const [holidayRows] = await pool.query<RowDataPacket[]>(
        `SELECT DATE_FORMAT(holiday_date, '%Y-%m-%d') as holiday_date FROM holidays`
    );
    const holidaySet = new Set(holidayRows.map(h => String(h.holiday_date)));

    const nonWorkingDays = parseNonWorkingDaysList(user.non_working_days);
    const allDatesInRange = getDatesBetween(startDateStr, endDateStr);

    const isSingleDayRequest = startDateStr === endDateStr;

    // Filter to working days
    const workingDates: string[] = [];
    for (const dStr of allDatesInRange) {
        const dObj = new Date(`${dStr}T00:00:00Z`);
        const dayOfWeek = DAY_OF_WEEK_NAMES[dObj.getUTCDay()]!;
        const isNonWorking = nonWorkingDays.includes(dayOfWeek);
        const isHoliday = holidaySet.has(dStr);

        if (isSingleDayRequest) {
            if (isNonWorking || isHoliday) {
                const reason = isHoliday ? "a company holiday" : "a non-working day";
                const error = new Error(`Cannot apply leave on ${dStr} as it is ${reason}.`);
                (error as any).status = 400;
                throw error;
            }
            workingDates.push(dStr);
        } else {
            // In multi-day range, skip non-working days and holidays
            if (!isNonWorking && !isHoliday) {
                workingDates.push(dStr);
            }
        }
    }

    if (workingDates.length === 0) {
        const error = new Error(`No working days found in the selected date range (${startDateStr} to ${endDateStr}).`);
        (error as any).status = 400;
        throw error;
    }

    // 2. Duplicate leave check
    const [existingLeaves] = await pool.query<RowDataPacket[]>(
        `SELECT leave_id, DATE_FORMAT(leave_date, '%Y-%m-%d') as leave_date, status 
         FROM user_leaves 
         WHERE user_id = ? AND leave_date IN (?)`,
        [user_id, workingDates]
    );

    const conflicting = existingLeaves.filter(e => e.status !== "REJECTED");
    if (conflicting.length > 0) {
        const conflictDates = conflicting.map(e => String(e.leave_date)).join(", ");
        const error = new Error(`A leave request already exists for this resource on: ${conflictDates}.`);
        (error as any).status = 409;
        throw error;
    }

    // Determine initial status: PM applying on behalf is pre-approved; resource applying is PENDING
    const initialStatus: LeaveStatus = (userRole === "PROJECT_MANAGER") ? "APPROVED" : "PENDING";
    const approverId = (userRole === "PROJECT_MANAGER" && creatorId) ? creatorId : null;
    const approvedAt = (initialStatus === "APPROVED") ? new Date() : null;

    // Prepare leave records to insert
    const leavesToCreate: {
        user_id: number;
        leave_date: string;
        leave_hours: number;
        leave_type: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
        status: LeaveStatus;
        approver_id: number | null;
        approved_at: string | null;
    }[] = [];

    for (let i = 0; i < workingDates.length; i++) {
        const dateStr = workingDates[i]!;
        let dayLeaveType: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' = 'FULL_DAY';

        if (workingDates.length === 1) {
            dayLeaveType = data.leave_type || data.start_day_type || 'FULL_DAY';
        } else if (i === 0) {
            // First working day in range
            dayLeaveType = data.start_day_type || data.leave_type || 'FULL_DAY';
        } else if (i === workingDates.length - 1) {
            // Last working day in range
            dayLeaveType = data.end_day_type || 'FULL_DAY';
        } else {
            // In-between working days are always full days
            dayLeaveType = 'FULL_DAY';
        }

        const leaveHours = dayLeaveType === 'FULL_DAY' ? maxDailyHours : (maxDailyHours / 2);

        leavesToCreate.push({
            user_id,
            leave_date: dateStr,
            leave_hours: leaveHours,
            leave_type: dayLeaveType,
            status: initialStatus,
            approver_id: approverId,
            approved_at: approvedAt ? approvedAt.toISOString() : null
        });
    }

    // 3. Insert records
    const createdLeaves: UserLeave[] = [];
    for (const item of leavesToCreate) {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO user_leaves (user_id, leave_date, leave_hours, leave_type, status, approver_id, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [item.user_id, item.leave_date, item.leave_hours, item.leave_type, item.status, item.approver_id, approvedAt]
        );

        createdLeaves.push({
            leave_id: result.insertId,
            user_id: item.user_id,
            leave_date: item.leave_date,
            leave_hours: item.leave_hours,
            leave_type: item.leave_type,
            status: item.status,
            approver_id: item.approver_id,
            approved_at: item.approved_at
        });
    }

    // 4. Recalculate schedules if approved immediately
    if (initialStatus === "APPROVED") {
        try {
            const projects = await getResourceProjects(user_id);
            for (const project of projects) {
                await recalculate(Number(project.project_id));
            }
        } catch (schedError) {
            console.error("Warning: Failed to recalculate project schedules after applying approved leave:", schedError);
        }
    }

    return createdLeaves.length === 1 ? createdLeaves[0]! : createdLeaves;
}

/**
 * Approve a pending user leave request.
 * Enforces business rule: The leave can only be approved BEFORE the applied leave date.
 * Automatically recalculates schedules for all projects associated with the resource upon approval.
 */
export async function approveLeave(leaveId: number, pmUserId: number): Promise<UserLeave> {
    const pool = getPool();

    // 1. Fetch leave record with resource details
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT 
            ul.leave_id,
            ul.user_id,
            DATE_FORMAT(ul.leave_date, '%Y-%m-%d') as leave_date,
            ul.leave_hours,
            ul.leave_type,
            ul.status,
            u.name as user_name
        FROM user_leaves ul
        INNER JOIN users u ON ul.user_id = u.user_id
        WHERE ul.leave_id = ?
        `,
        [leaveId]
    );

    const leave = leaveRows[0];
    if (!leave) {
        const error = new Error("Leave record not found.");
        (error as any).status = 404;
        throw error;
    }

    if (leave.status === "APPROVED") {
        const error = new Error("This leave is already approved.");
        (error as any).status = 400;
        throw error;
    }

    // 2. Validate PM has authority (resource must be on a project managed by this PM)
    const [pmProjects] = await pool.query<RowDataPacket[]>(
        `
        SELECT p.project_id
        FROM projects p
        INNER JOIN project_members pm ON p.project_id = pm.project_id
        WHERE p.project_manager_id = ? AND pm.user_id = ?
        `,
        [pmUserId, leave.user_id]
    );

    if (pmProjects.length === 0) {
        const error = new Error("Access denied. You can only approve leaves for resources assigned to your projects.");
        (error as any).status = 403;
        throw error;
    }

    // 3. Date Validation: Leave can only be approved BEFORE the date applied for (today < leave_date)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const leaveDateStr = String(leave.leave_date);

    if (todayStr >= leaveDateStr) {
        const error = new Error(`Leaves can only be approved before the date the resource applied for. Leave date (${leaveDateStr}) has arrived or already passed.`);
        (error as any).status = 400;
        throw error;
    }

    // 4. Update status to APPROVED
    await pool.query(
        `UPDATE user_leaves SET status = 'APPROVED', approver_id = ?, approved_at = NOW(), rejection_reason = NULL WHERE leave_id = ?`,
        [pmUserId, leaveId]
    );

    // 5. Recalculate schedules for all projects the resource is assigned to
    try {
        const projects = await getResourceProjects(Number(leave.user_id));
        for (const project of projects) {
            await recalculate(Number(project.project_id));
        }
    } catch (schedError) {
        console.error("Warning: Failed to recalculate project schedules after approving leave:", schedError);
    }

    return {
        leave_id: leave.leave_id,
        user_id: Number(leave.user_id),
        user_name: leave.user_name,
        leave_date: leaveDateStr,
        leave_hours: Number(leave.leave_hours),
        leave_type: leave.leave_type as any,
        status: "APPROVED",
        approver_id: pmUserId,
        approved_at: new Date().toISOString()
    };
}

/**
 * Reject a pending user leave request.
 */
export async function rejectLeave(leaveId: number, pmUserId: number, reason?: string): Promise<UserLeave> {
    const pool = getPool();

    // 1. Fetch leave record
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT 
            ul.leave_id,
            ul.user_id,
            DATE_FORMAT(ul.leave_date, '%Y-%m-%d') as leave_date,
            ul.leave_hours,
            ul.leave_type,
            ul.status,
            u.name as user_name
        FROM user_leaves ul
        INNER JOIN users u ON ul.user_id = u.user_id
        WHERE ul.leave_id = ?
        `,
        [leaveId]
    );

    const leave = leaveRows[0];
    if (!leave) {
        const error = new Error("Leave record not found.");
        (error as any).status = 404;
        throw error;
    }

    // 2. Validate PM has authority
    const [pmProjects] = await pool.query<RowDataPacket[]>(
        `
        SELECT p.project_id
        FROM projects p
        INNER JOIN project_members pm ON p.project_id = pm.project_id
        WHERE p.project_manager_id = ? AND pm.user_id = ?
        `,
        [pmUserId, leave.user_id]
    );

    if (pmProjects.length === 0) {
        const error = new Error("Access denied. You can only reject leaves for resources assigned to your projects.");
        (error as any).status = 403;
        throw error;
    }

    const wasApproved = leave.status === "APPROVED";

    // 3. Update status to REJECTED
    await pool.query(
        `UPDATE user_leaves SET status = 'REJECTED', approver_id = ?, rejection_reason = ?, approved_at = NULL WHERE leave_id = ?`,
        [pmUserId, reason ?? "Rejected by Project Manager", leaveId]
    );

    // 4. If previously approved, recalculate to restore capacity
    if (wasApproved) {
        try {
            const projects = await getResourceProjects(Number(leave.user_id));
            for (const project of projects) {
                await recalculate(Number(project.project_id));
            }
        } catch (schedError) {
            console.error("Warning: Failed to recalculate project schedules after rejecting leave:", schedError);
        }
    }

    return {
        leave_id: leave.leave_id,
        user_id: Number(leave.user_id),
        user_name: leave.user_name,
        leave_date: String(leave.leave_date),
        leave_hours: Number(leave.leave_hours),
        leave_type: leave.leave_type as any,
        status: "REJECTED",
        approver_id: pmUserId,
        rejection_reason: reason ?? "Rejected by Project Manager"
    };
}

/**
 * Remove/Cancel a user leave and recalculate schedule if it was approved.
 */
export async function cancelLeave(leaveId: number, reqUser: { user_id: number; role: string }): Promise<void> {
    const pool = getPool();

    // 1. Fetch leave to verify existence and check user ownership
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `SELECT leave_id, user_id, status FROM user_leaves WHERE leave_id = ?`,
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

    // 4. Recalculate schedules for all projects this resource belongs to if it was APPROVED
    if (leave.status === "APPROVED") {
        try {
            const projects = await getResourceProjects(Number(leave.user_id));
            for (const project of projects) {
                await recalculate(Number(project.project_id));
            }
        } catch (schedError) {
            console.error("Warning: Failed to recalculate project schedules after cancelling leave:", schedError);
        }
    }
}

/**
 * Get leaves list with optional filters for user_id, startDate, endDate, status, and manager_id.
 */
export async function getLeaves(filters: {
    user_id?: number;
    startDate?: string;
    endDate?: string;
    status?: LeaveStatus;
    manager_id?: number;
}): Promise<UserLeave[]> {
    const pool = getPool();
    let query = `
        SELECT 
            ul.leave_id,
            ul.user_id,
            u.name as user_name,
            u.email as user_email,
            DATE_FORMAT(ul.leave_date, '%Y-%m-%d') as leave_date,
            ul.leave_hours,
            ul.leave_type,
            ul.status,
            ul.approver_id,
            approver.name as approver_name,
            ul.rejection_reason,
            ul.approved_at,
            ul.created_at
        FROM user_leaves ul
        INNER JOIN users u ON ul.user_id = u.user_id
        LEFT JOIN users approver ON ul.approver_id = approver.user_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.user_id !== undefined) {
        conditions.push(`ul.user_id = ?`);
        params.push(filters.user_id);
    }

    if (filters.startDate) {
        conditions.push(`ul.leave_date >= ?`);
        params.push(filters.startDate);
    }

    if (filters.endDate) {
        conditions.push(`ul.leave_date <= ?`);
        params.push(filters.endDate);
    }

    if (filters.status) {
        conditions.push(`ul.status = ?`);
        params.push(filters.status);
    }

    if (filters.manager_id !== undefined) {
        conditions.push(`ul.user_id IN (
            SELECT DISTINCT pm.user_id 
            FROM project_members pm
            INNER JOIN projects p ON pm.project_id = p.project_id
            WHERE p.project_manager_id = ?
        )`);
        params.push(filters.manager_id);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY ul.leave_date ASC, ul.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    // Ensure decimal leave hours is mapped to a Javascript number
    return rows.map(r => ({
        leave_id: Number(r.leave_id),
        user_id: Number(r.user_id),
        user_name: r.user_name,
        user_email: r.user_email,
        leave_date: String(r.leave_date),
        leave_hours: Number(r.leave_hours),
        leave_type: (r.leave_type as any) || 'FULL_DAY',
        status: r.status as LeaveStatus,
        approver_id: r.approver_id ? Number(r.approver_id) : null,
        approver_name: r.approver_name || null,
        rejection_reason: r.rejection_reason || null,
        approved_at: r.approved_at ? new Date(r.approved_at).toISOString() : null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null
    }));
}

