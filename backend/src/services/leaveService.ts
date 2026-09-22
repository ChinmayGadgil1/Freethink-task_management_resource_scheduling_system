import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { UserLeave, CreateLeaveDTO, LeaveStatus } from "../models/leaveModel.js";
import { recalculate } from "./scheduler/SchedulingEngine.js";
import { getResourceProjects } from "./resourceService.js";
import { createNotification } from "./notificationService.js";
import { randomUUID } from "node:crypto";

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
 * Assigns a common request_id to group all days of the application together.
 */
export async function applyLeave(data: CreateLeaveDTO, userRole?: string, creatorId?: number): Promise<UserLeave> {
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

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (userRole === "RESOURCE" && startDateStr <= todayStr) {
        const error = new Error(`Leaves must be requested at least 1 day in advance. The start date (${startDateStr}) cannot be today or in the past.`);
        (error as any).status = 400;
        throw error;
    }

    if (userRole === "PROJECT_MANAGER" && startDateStr < todayStr) {
        const error = new Error(`Cannot apply leave for a past date (${startDateStr}).`);
        (error as any).status = 400;
        throw error;
    }

    // 1. Validate resource exists, is active, and has the role RESOURCE
    const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id, name, email, is_active, role, daily_working_hours, non_working_days FROM users WHERE user_id = ?`,
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

    // Removed PM restriction: PMs can apply leave for any resource.

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

    // Determine initial status: PM applying on behalf is pre-approved; resource applying is PENDING
    const initialStatus: LeaveStatus = (userRole === "PROJECT_MANAGER") ? "APPROVED" : "PENDING";
    const approverId = (userRole === "PROJECT_MANAGER" && creatorId) ? creatorId : null;
    let approverName: string | null = null;
    if (approverId) {
        const [approverRows] = await pool.query<RowDataPacket[]>(
            `SELECT name FROM users WHERE user_id = ?`,
            [approverId]
        );
        approverName = approverRows[0]?.name || null;
    }
    const approvedAt = (initialStatus === "APPROVED") ? new Date() : null;
    const requestId = randomUUID();

    // Prepare leave records to insert
    const leavesToCreate: {
        request_id: string;
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
            request_id: requestId,
            user_id,
            leave_date: dateStr,
            leave_hours: leaveHours,
            leave_type: dayLeaveType,
            status: initialStatus,
            approver_id: approverId,
            approved_at: approvedAt ? approvedAt.toISOString() : null
        });
    }

    // 2. Duplicate / Overlap leave check
    const [existingLeaves] = await pool.query<RowDataPacket[]>(
        `SELECT leave_id, DATE_FORMAT(leave_date, '%Y-%m-%d') as leave_date, status, leave_type 
         FROM user_leaves 
         WHERE user_id = ? AND leave_date IN (?)`,
        [user_id, workingDates]
    );

    const activeLeaves = existingLeaves.filter(e => e.status !== "REJECTED");
    for (const item of leavesToCreate) {
        const existingForDate = activeLeaves.filter(e => String(e.leave_date) === item.leave_date);
        const totalExistingHours = existingForDate.reduce(
            (sum, e) => sum + (Number(e.leave_hours) || (e.leave_type === 'FULL_DAY' ? maxDailyHours : maxDailyHours / 2)),
            0
        );

        if (totalExistingHours + item.leave_hours > maxDailyHours) {
            const error = new Error(`Cannot apply leave on ${item.leave_date}: total leave hours would exceed daily working capacity (${maxDailyHours}h).`);
            (error as any).status = 409;
            throw error;
        }

        for (const exist of existingForDate) {
            const existType = exist.leave_type || 'FULL_DAY';
            if (existType === 'FULL_DAY') {
                const error = new Error(`A full-day leave already exists for this resource on ${item.leave_date}.`);
                (error as any).status = 409;
                throw error;
            }
            if (item.leave_type === 'FULL_DAY') {
                const label = existType === 'FIRST_HALF' ? 'first-half' : 'second-half';
                const error = new Error(`Cannot apply full-day leave on ${item.leave_date} because a ${label} leave already exists.`);
                (error as any).status = 409;
                throw error;
            }
            if (existType === item.leave_type) {
                const label = item.leave_type === 'FIRST_HALF' ? 'first-half' : 'second-half';
                const error = new Error(`A ${label} leave already exists for this resource on ${item.leave_date}.`);
                (error as any).status = 409;
                throw error;
            }
        }
    }

    // Clean up any previously rejected leave rows on these dates to prevent MySQL unique key conflict
    await pool.query(
        `DELETE FROM user_leaves WHERE user_id = ? AND leave_date IN (?) AND status = 'REJECTED'`,
        [user_id, workingDates]
    );

    // 3. Insert records
    let firstInsertId = 0;
    const daysBreakdown: { leave_id: number; leave_date: string; leave_hours: number; leave_type: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF'; status: LeaveStatus }[] = [];
    let totalHours = 0;

    for (const item of leavesToCreate) {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO user_leaves (request_id, user_id, leave_date, leave_hours, leave_type, status, approver_id, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.request_id, item.user_id, item.leave_date, item.leave_hours, item.leave_type, item.status, item.approver_id, approvedAt]
        );

        if (!firstInsertId) firstInsertId = result.insertId;
        totalHours += item.leave_hours;

        daysBreakdown.push({
            leave_id: result.insertId,
            leave_date: item.leave_date,
            leave_hours: item.leave_hours,
            leave_type: item.leave_type,
            status: item.status
        });
    }

    // 4. Recalculate schedules if approved immediately and includes future dates >= today
    if (initialStatus === "APPROVED") {
        const now = new Date();
        const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const hasUpcomingLeave = leavesToCreate.some((item) => {
            const dStr = String(item.leave_date).split("T")[0]!;
            return dStr >= curDateStr;
        });

        if (hasUpcomingLeave) {
            try {
                const projects = await getResourceProjects(user_id);
                for (const project of projects) {
                    await recalculate(Number(project.project_id));
                }
            } catch (schedError) {
                console.error("Warning: Failed to recalculate project schedules after applying approved leave:", schedError);
            }
        }
    } else {
        // Resource submitted a pending leave request: notify relevant Project Managers
        try {
            const [pmRows] = await pool.query<RowDataPacket[]>(
                `SELECT DISTINCT p.project_manager_id
                 FROM projects p
                 INNER JOIN project_members pm ON p.project_id = pm.project_id
                 WHERE pm.user_id = ? AND p.project_manager_id IS NOT NULL`,
                [user_id]
            );

            const pmIds = new Set<number>();
            for (const r of pmRows) {
                if (r.project_manager_id) pmIds.add(Number(r.project_manager_id));
            }

            // If resource is not yet in any project, notify active PMs
            if (pmIds.size === 0) {
                const [allPms] = await pool.query<RowDataPacket[]>(
                    `SELECT user_id FROM users WHERE role = 'PROJECT_MANAGER' AND is_active = 1`
                );
                for (const r of allPms) {
                    pmIds.add(Number(r.user_id));
                }
            }

            const rangeStr = workingDates.length > 1
                ? `${workingDates[0]} to ${workingDates[workingDates.length - 1]} (${workingDates.length} days, ${totalHours}h)`
                : `${workingDates[0]} (${totalHours}h)`;

            for (const pmId of pmIds) {
                await createNotification({
                    userId: pmId,
                    type: "LEAVE_REQUESTED",
                    title: `Leave Requested: ${user.name} (${workingDates[0]})`,
                    message: `${user.name} submitted a leave request for ${rangeStr}. Please review.`,
                    link: "/pm/leaves",
                });
            }
        } catch (notifErr) {
            console.error("Warning: Failed to create leave request notifications for PMs:", notifErr);
        }
    }

    return {
        leave_id: firstInsertId,
        request_id: requestId,
        user_id,
        user_name: user.name,
        user_email: user.email,
        leave_date: workingDates[0]!,
        start_date: workingDates[0]!,
        end_date: workingDates[workingDates.length - 1]!,
        start_day_type: daysBreakdown[0]?.leave_type || 'FULL_DAY',
        end_day_type: daysBreakdown[daysBreakdown.length - 1]?.leave_type || 'FULL_DAY',
        total_days: workingDates.length,
        total_hours: totalHours,
        leave_hours: totalHours,
        leave_type: daysBreakdown.length === 1 ? daysBreakdown[0]!.leave_type : 'FULL_DAY',
        status: initialStatus,
        approver_id: approverId,
        approver_name: approverName,
        approved_at: approvedAt ? approvedAt.toISOString() : null,
        days_breakdown: daysBreakdown
    };
}

/**
 * Helper to fetch all rows belonging to a leave request group (by leaveId or requestId).
 */
async function getLeaveGroupRows(identifier: string | number): Promise<RowDataPacket[]> {
    const pool = getPool();
    let query = `
        SELECT 
            ul.leave_id,
            ul.request_id,
            ul.user_id,
            DATE_FORMAT(ul.leave_date, '%Y-%m-%d') as leave_date,
            ul.leave_hours,
            ul.leave_type,
            ul.status,
            u.name as user_name
        FROM user_leaves ul
        INNER JOIN users u ON ul.user_id = u.user_id
    `;
    const isNum = typeof identifier === "number" || /^\d+$/.test(String(identifier));

    if (isNum) {
        // Find if row has request_id
        const [targetRow] = await pool.query<RowDataPacket[]>(
            `SELECT request_id FROM user_leaves WHERE leave_id = ?`,
            [Number(identifier)]
        );
        if (!targetRow || targetRow.length === 0) return [];
        const reqId = targetRow[0]?.request_id;
        if (reqId) {
            const [rows] = await pool.query<RowDataPacket[]>(
                `${query} WHERE ul.request_id = ? ORDER BY ul.leave_date ASC`,
                [reqId]
            );
            return rows;
        } else {
            const [rows] = await pool.query<RowDataPacket[]>(
                `${query} WHERE ul.leave_id = ?`,
                [Number(identifier)]
            );
            return rows;
        }
    } else {
        const [rows] = await pool.query<RowDataPacket[]>(
            `${query} WHERE ul.request_id = ? ORDER BY ul.leave_date ASC`,
            [String(identifier)]
        );
        return rows;
    }
}

/**
 * Approve a pending user leave request (approves all days in the request group).
 * Enforces business rule: The leave can only be approved before or during the leave period (cannot be approved once the leave dates have passed).
 * Automatically recalculates schedules for all projects associated with the resource upon approval.
 */
export async function approveLeave(identifier: number | string, pmUserId: number): Promise<UserLeave> {
    const pool = getPool();
    const rows = await getLeaveGroupRows(identifier);

    if (rows.length === 0) {
        const error = new Error("Leave record not found.");
        (error as any).status = 404;
        throw error;
    }

    const firstRow = rows[0]!;
    const userId = Number(firstRow.user_id);
    const requestId = firstRow.request_id ? String(firstRow.request_id) : null;

    const alreadyApproved = rows.every(r => r.status === "APPROVED");
    if (alreadyApproved) {
        const error = new Error("This leave is already approved.");
        (error as any).status = 400;
        throw error;
    }

    // Removed PM restriction: PMs can approve leaves for any resource.

    // Date Validation: leave dates must not have already passed (today <= latestDate)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const earliestDate = String(rows[0]!.leave_date);
    const latestDate = String(rows[rows.length - 1]!.leave_date);

    if (todayStr > latestDate) {
        const error = new Error(`Cannot approve a leave request whose dates have already passed (${latestDate}).`);
        (error as any).status = 400;
        throw error;
    }

    // Update all records in the group
    if (requestId) {
        await pool.query(
            `UPDATE user_leaves SET status = 'APPROVED', approver_id = ?, approved_at = NOW(), rejection_reason = NULL WHERE request_id = ?`,
            [pmUserId, requestId]
        );
    } else {
        const leaveIds = rows.map(r => Number(r.leave_id));
        await pool.query(
            `UPDATE user_leaves SET status = 'APPROVED', approver_id = ?, approved_at = NOW(), rejection_reason = NULL WHERE leave_id IN (?)`,
            [pmUserId, leaveIds]
        );
    }

    // Scheduling Boundary Check: only recalculate future schedules if leave dates include dates on or after today
    const hasUpcomingLeave = rows.some(r => {
        const dStr = r.leave_date instanceof Date
            ? r.leave_date.toISOString().split("T")[0]!
            : String(r.leave_date).split("T")[0]!;
        return dStr >= todayStr;
    });

    if (hasUpcomingLeave) {
        try {
            const projects = await getResourceProjects(userId);
            for (const project of projects) {
                await recalculate(Number(project.project_id));
            }
        } catch (schedError) {
            console.error("Warning: Failed to recalculate project schedules after approving leave:", schedError);
        }
    }

    // Fetch PM name for response
    const [pmUserRows] = await pool.query<RowDataPacket[]>(
        `SELECT name FROM users WHERE user_id = ?`,
        [pmUserId]
    );
    const pmName = pmUserRows[0]?.name || null;

    const totalHours = rows.reduce((acc, r) => acc + Number(r.leave_hours), 0);

    const approvedResult = {
        leave_id: Number(firstRow.leave_id),
        request_id: requestId,
        user_id: userId,
        user_name: firstRow.user_name,
        leave_date: earliestDate,
        start_date: earliestDate,
        end_date: String(rows[rows.length - 1]!.leave_date),
        start_day_type: (rows[0]!.leave_type as any) || 'FULL_DAY',
        end_day_type: (rows[rows.length - 1]!.leave_type as any) || 'FULL_DAY',
        total_days: rows.length,
        total_hours: totalHours,
        leave_hours: totalHours,
        leave_type: rows.length === 1 ? (firstRow.leave_type as any) : 'FULL_DAY',
        status: "APPROVED" as const,
        approver_id: pmUserId,
        approver_name: pmName,
        approved_at: new Date().toISOString()
    };

    // Notify resource that their leave was approved
    try {
        const dateRangeText = rows.length > 1
            ? `${earliestDate} to ${String(rows[rows.length - 1]!.leave_date)} (${totalHours}h)`
            : `${earliestDate} (${totalHours}h)`;

        await createNotification({
            userId: userId,
            type: "LEAVE_APPROVED",
            title: `Leave Approved: ${earliestDate}`,
            message: `Your leave request for ${dateRangeText} was approved by ${pmName || 'Project Manager'}.`,
            link: "/app/resource-dashboard/leaves",
        });
    } catch (notifErr) {
        console.error("Warning: Failed to create leave approved notification:", notifErr);
    }

    // Notify other PMs (who share this resource) that the leave was approved
    try {
        const [otherPmRows] = await pool.query<RowDataPacket[]>(
            `SELECT DISTINCT p.project_manager_id
             FROM projects p
             INNER JOIN project_members pm ON p.project_id = pm.project_id
             WHERE pm.user_id = ? AND p.project_manager_id IS NOT NULL AND p.project_manager_id != ?`,
            [userId, pmUserId]
        );

        const dateRangeText = rows.length > 1
            ? `${earliestDate} to ${String(rows[rows.length - 1]!.leave_date)} (${totalHours}h)`
            : `${earliestDate} (${totalHours}h)`;

        for (const r of otherPmRows) {
            const otherPmId = Number(r.project_manager_id);
            await createNotification({
                userId: otherPmId,
                type: "LEAVE_APPROVED",
                title: `Leave Approved: ${firstRow.user_name} (${earliestDate})`,
                message: `Leave for ${firstRow.user_name} (${dateRangeText}) has been approved by ${pmName || 'Project Manager'}.`,
                link: "/pm/leaves",
            });
        }
    } catch (notifErr) {
        console.error("Warning: Failed to create cross-PM leave approved notifications:", notifErr);
    }

    return approvedResult;
}

/**
 * Reject a pending user leave request (rejects all days in the request group).
 */
export async function rejectLeave(identifier: number | string, pmUserId: number, reason?: string): Promise<UserLeave> {
    const pool = getPool();
    const rows = await getLeaveGroupRows(identifier);

    if (rows.length === 0) {
        const error = new Error("Leave record not found.");
        (error as any).status = 404;
        throw error;
    }

    const firstRow = rows[0]!;
    const userId = Number(firstRow.user_id);
    const requestId = firstRow.request_id ? String(firstRow.request_id) : null;

    // Removed PM restriction: PMs can reject leaves for any resource.

    const hadApproved = rows.some(r => r.status === "APPROVED");

    // Update status to REJECTED for entire group
    if (requestId) {
        await pool.query(
            `UPDATE user_leaves SET status = 'REJECTED', approver_id = ?, rejection_reason = ?, approved_at = NULL WHERE request_id = ?`,
            [pmUserId, reason ?? "Rejected by Project Manager", requestId]
        );
    } else {
        const leaveIds = rows.map(r => Number(r.leave_id));
        await pool.query(
            `UPDATE user_leaves SET status = 'REJECTED', approver_id = ?, rejection_reason = ?, approved_at = NULL WHERE leave_id IN (?)`,
            [pmUserId, reason ?? "Rejected by Project Manager", leaveIds]
        );
    }

    // If previously approved, recalculate to restore capacity
    if (hadApproved) {
        try {
            const projects = await getResourceProjects(userId);
            for (const project of projects) {
                await recalculate(Number(project.project_id));
            }
        } catch (schedError) {
            console.error("Warning: Failed to recalculate project schedules after rejecting leave:", schedError);
        }
    }

    // Fetch PM name for response
    const [pmUserRows] = await pool.query<RowDataPacket[]>(
        `SELECT name FROM users WHERE user_id = ?`,
        [pmUserId]
    );
    const pmName = pmUserRows[0]?.name || null;

    const totalHours = rows.reduce((acc, r) => acc + Number(r.leave_hours), 0);

    const rejectedResult = {
        leave_id: Number(firstRow.leave_id),
        request_id: requestId,
        user_id: userId,
        user_name: firstRow.user_name,
        leave_date: String(firstRow.leave_date),
        start_date: String(firstRow.leave_date),
        end_date: String(rows[rows.length - 1]!.leave_date),
        start_day_type: (rows[0]!.leave_type as any) || 'FULL_DAY',
        end_day_type: (rows[rows.length - 1]!.leave_type as any) || 'FULL_DAY',
        total_days: rows.length,
        total_hours: totalHours,
        leave_hours: totalHours,
        leave_type: rows.length === 1 ? (firstRow.leave_type as any) : 'FULL_DAY',
        status: "REJECTED" as const,
        approver_id: pmUserId,
        approver_name: pmName,
        rejection_reason: reason ?? "Rejected by Project Manager",
    };

    // Notify resource that their leave was rejected
    try {
        const startDate = String(firstRow.leave_date);
        const dateRangeText = rows.length > 1
            ? `${startDate} to ${String(rows[rows.length - 1]!.leave_date)}`
            : `${startDate}`;

        await createNotification({
            userId: userId,
            type: "LEAVE_REJECTED",
            title: `Leave Rejected: ${startDate}`,
            message: `Your leave request for ${dateRangeText} was rejected by ${pmName || 'Project Manager'}.${reason ? ` Reason: ${reason}` : ''}`,
            link: "/app/resource-dashboard/leaves",
        });
    } catch (notifErr) {
        console.error("Warning: Failed to create leave rejected notification:", notifErr);
    }

    return rejectedResult;
}

/**
 * Remove/Cancel a user leave request group and recalculate schedule if it was approved.
 */
export async function cancelLeave(identifier: number | string, reqUser: { user_id: number; role: string }): Promise<void> {
    const pool = getPool();
    const rows = await getLeaveGroupRows(identifier);

    if (rows.length === 0) {
        const error = new Error("Leave record not found.");
        (error as any).status = 404;
        throw error;
    }

    const firstRow = rows[0]!;
    const userId = Number(firstRow.user_id);
    const requestId = firstRow.request_id ? String(firstRow.request_id) : null;

    // Access control: RESOURCE role can only cancel their own leaves
    if (reqUser.role === "RESOURCE" && userId !== Number(reqUser.user_id)) {
        const error = new Error("Access denied. You can only cancel your own leaves.");
        (error as any).status = 403;
        throw error;
    }

    const hadApproved = rows.some(r => r.status === "APPROVED");

    // Delete entire group
    if (requestId) {
        await pool.query(
            `DELETE FROM user_leaves WHERE request_id = ?`,
            [requestId]
        );
    } else {
        const leaveIds = rows.map(r => Number(r.leave_id));
        await pool.query(
            `DELETE FROM user_leaves WHERE leave_id IN (?)`,
            [leaveIds]
        );
    }

    // Recalculate schedules if it was approved
    if (hadApproved) {
        try {
            const projects = await getResourceProjects(userId);
            for (const project of projects) {
                await recalculate(Number(project.project_id));
            }
        } catch (schedError) {
            console.error("Warning: Failed to recalculate project schedules after cancelling leave:", schedError);
        }
    }
}

/**
 * Get leaves list grouped by leave request (request_id or single leave_id).
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
            ul.request_id,
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
        conditions.push(`(
            ul.user_id = ?
            OR ul.approver_id = ?
            OR ul.user_id IN (
                SELECT DISTINCT pm.user_id
                FROM project_members pm
                INNER JOIN projects p ON pm.project_id = p.project_id
                WHERE p.project_manager_id = ?
            )
        )`);
        params.push(filters.manager_id, filters.manager_id, filters.manager_id);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY ul.leave_date ASC, ul.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Deduplicate by leave_id to ensure no Cartesian product from joins
    const uniqueRowsMap = new Map<number, RowDataPacket>();
    for (const r of rows) {
        if (!uniqueRowsMap.has(Number(r.leave_id))) {
            uniqueRowsMap.set(Number(r.leave_id), r);
        }
    }

    // Group rows by request_id (or fallback to individual leave_id)
    const groupsMap = new Map<string, RowDataPacket[]>();
    for (const r of uniqueRowsMap.values()) {
        let groupKey: string;
        if (r.request_id) {
            groupKey = String(r.request_id);
        } else {
            groupKey = `leave_${r.leave_id}`;
        }
        if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, []);
        }
        groupsMap.get(groupKey)!.push(r);
    }

    const groupedLeaves: UserLeave[] = [];

    for (const [, groupRows] of groupsMap) {
        groupRows.sort((a, b) => String(a.leave_date).localeCompare(String(b.leave_date)));
        const first = groupRows[0]!;
        const last = groupRows[groupRows.length - 1]!;

        const totalHours = groupRows.reduce((acc, r) => acc + Number(r.leave_hours), 0);
        
        let aggregatedStatus: LeaveStatus = first.status as LeaveStatus;
        if (groupRows.some(r => r.status === "PENDING")) {
            aggregatedStatus = "PENDING";
        } else if (groupRows.every(r => r.status === "APPROVED")) {
            aggregatedStatus = "APPROVED";
        } else if (groupRows.every(r => r.status === "REJECTED")) {
            aggregatedStatus = "REJECTED";
        }

        const daysBreakdown = groupRows.map(r => ({
            leave_id: Number(r.leave_id),
            leave_date: String(r.leave_date),
            leave_hours: Number(r.leave_hours),
            leave_type: (r.leave_type as any) || 'FULL_DAY',
            status: r.status as LeaveStatus
        }));

        const approverRow = groupRows.find(r => r.approver_name) || groupRows.find(r => r.approver_id) || first;
        const approverId = (aggregatedStatus === "PENDING") ? null : (approverRow.approver_id ? Number(approverRow.approver_id) : null);
        const approverName = (aggregatedStatus === "PENDING") ? null : (approverRow.approver_name || null);
        const rejectionReason = (aggregatedStatus === "REJECTED")
            ? (groupRows.find(r => r.rejection_reason)?.rejection_reason || first.rejection_reason || null)
            : null;
        const approvedAtVal = (aggregatedStatus === "APPROVED")
            ? (groupRows.find(r => r.approved_at)?.approved_at || first.approved_at)
            : null;

        const uniqueDates = Array.from(new Set(groupRows.map(r => String(r.leave_date))));
        const isMultiDay = uniqueDates.length > 1 && String(first.leave_date) !== String(last.leave_date);
        const resolvedSingleType = groupRows.length === 1 
            ? ((first.leave_type as any) || 'FULL_DAY') 
            : (first.leave_type === last.leave_type ? first.leave_type : 'FULL_DAY');

        groupedLeaves.push({
            leave_id: Number(first.leave_id),
            request_id: first.request_id ? String(first.request_id) : null,
            user_id: Number(first.user_id),
            user_name: first.user_name,
            user_email: first.user_email,
            leave_date: String(first.leave_date),
            start_date: String(first.leave_date),
            end_date: String(last.leave_date),
            start_day_type: isMultiDay ? ((first.leave_type as any) || 'FULL_DAY') : resolvedSingleType,
            end_day_type: isMultiDay ? ((last.leave_type as any) || 'FULL_DAY') : resolvedSingleType,
            total_days: uniqueDates.length,
            total_hours: totalHours,
            leave_hours: totalHours,
            leave_type: isMultiDay ? 'FULL_DAY' : resolvedSingleType,
            status: aggregatedStatus,
            approver_id: approverId,
            approver_name: approverName,
            rejection_reason: rejectionReason,
            approved_at: approvedAtVal ? new Date(approvedAtVal).toISOString() : null,
            created_at: first.created_at ? new Date(first.created_at).toISOString() : null,
            days_breakdown: daysBreakdown
        });
    }

    // Sort grouped requests by start_date DESC
    groupedLeaves.sort((a, b) => b.leave_date.localeCompare(a.leave_date));

    return groupedLeaves;
}

