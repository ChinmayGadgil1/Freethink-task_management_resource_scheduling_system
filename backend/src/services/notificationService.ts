import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type NotificationType =
    | "EARLY_COMPLETION"
    | "POSSIBLE_DELAY"
    | "LEAVE_REQUESTED"
    | "LEAVE_APPROVED"
    | "LEAVE_REJECTED"
    | "TASK_VERIFICATION"
    | "TASK_ASSIGNED"
    | "TASK_CREATED";

export interface NotificationRecord {
    notification_id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    deleted_at?: string | null;
    created_at: string;
}

let hasEnsuredDeletedAt = false;
export async function ensureDeletedAtColumn(): Promise<void> {
    if (hasEnsuredDeletedAt) return;
    try {
        const pool = getPool();
        await pool.query(`ALTER TABLE notifications ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_read`);
    } catch {
        // Column already exists or table not ready
    }
    hasEnsuredDeletedAt = true;
}

export interface CreateNotificationPayload {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string | null;
}

/**
 * Creates a new notification for a specific user
 */
export async function createNotification(payload: CreateNotificationPayload): Promise<number> {
    await ensureDeletedAtColumn();
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO notifications (user_id, type, title, message, link, is_read)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [
            payload.userId,
            payload.type,
            payload.title,
            payload.message,
            payload.link || null,
        ]
    );
    return result.insertId;
}

function evaluateEarlyCompletion(t: {
    status: string;
    deadline: string | null;
    actual_end: any;
    expected_effort: number;
    actual_effort: number;
}): { isEarly: boolean; reason: string } {
    if (t.status !== "COMPLETED") {
        return { isEarly: false, reason: "" };
    }

    const expectedEffort = Number(t.expected_effort) || 0;
    const actualEffort = Number(t.actual_effort) || 0;
    const diffHours = expectedEffort - actualEffort;
    const hasEffortSavings = expectedEffort > 0 && actualEffort > 0 && diffHours >= 1.0;

    // Check if task completed late past deadline
    let isPastDeadline = false;
    if (t.deadline && t.actual_end) {
        const deadlineTime = new Date(t.deadline.includes("T") ? t.deadline : `${t.deadline}T23:59:59`).getTime();
        const endTime = new Date(t.actual_end).getTime();
        if (!isNaN(deadlineTime) && !isNaN(endTime) && endTime > deadlineTime) {
            isPastDeadline = true;
        }
    }

    if (isPastDeadline) {
        return { isEarly: false, reason: "" };
    }

    if (hasEffortSavings) {
        return {
            isEarly: true,
            reason: `Task completed efficiently with ${actualEffort}h logged (saving ${Number(diffHours.toFixed(1))}h of planned effort).`
        };
    }

    if (t.deadline && t.actual_end) {
        const deadlineTime = new Date(t.deadline.includes("T") ? t.deadline : `${t.deadline}T23:59:59`).getTime();
        const endTime = new Date(t.actual_end).getTime();
        if (!isNaN(deadlineTime) && !isNaN(endTime) && endTime < deadlineTime) {
            const cleanDeadline = t.deadline.includes("T") ? t.deadline.split("T")[0] : t.deadline;
            return {
                isEarly: true,
                reason: `Task completed successfully ahead of the ${cleanDeadline} deadline milestone.`
            };
        }
    }

    return { isEarly: false, reason: "" };
}

function evaluatePossibleDelay(t: {
    status: string;
    deadline: string | null;
    planned_start: any;
    planned_end: any;
    expected_effort: number;
    actual_effort: number;
    progress: number;
    is_deadline_at_risk: boolean;
    is_schedule_at_risk: boolean;
}): { isDelay: boolean; reason: string } {
    if (t.status !== "IN_PROGRESS" && t.status !== "SCHEDULED") {
        return { isDelay: false, reason: "" };
    }

    const progress = Number(t.progress) || 0;
    const actualEffort = Number(t.actual_effort) || 0;
    const expectedEffort = Number(t.expected_effort) || 0;
    const isAtRisk = Boolean(t.is_deadline_at_risk || t.is_schedule_at_risk);
    const cleanDeadline = t.deadline ? (t.deadline.includes("T") ? t.deadline.split("T")[0]! : t.deadline) : null;

    // 1. Critical path / scheduling engine risk
    if (isAtRisk) {
        if (t.is_deadline_at_risk && cleanDeadline) {
            return {
                isDelay: true,
                reason: `Scheduling engine detected deadline capacity risk for ${cleanDeadline}. Current progress: ${progress}%.`
            };
        }
        return {
            isDelay: true,
            reason: `Scheduling engine flagged timeline delay based on resource capacity allocations. Current progress: ${progress}%.`
        };
    }

    // 2. Overdue task (past target deadline)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (cleanDeadline && cleanDeadline < todayStr && progress < 100) {
        return {
            isDelay: true,
            reason: `Task is overdue past its target deadline of ${cleanDeadline}. Current progress: ${progress}%.`
        };
    }

    // 3. Effort overrun / budget risk
    if (expectedEffort > 0) {
        const effortRatio = actualEffort / expectedEffort;
        if (actualEffort > expectedEffort && progress < 100) {
            const overrun = Number((actualEffort - expectedEffort).toFixed(1));
            return {
                isDelay: true,
                reason: `Effort budget exceeded by ${overrun}h (${actualEffort}h logged of ${expectedEffort}h) with ${progress}% completion.`
            };
        }
        if (effortRatio >= 0.85 && progress < 50) {
            return {
                isDelay: true,
                reason: `Task consumed ${Math.round(effortRatio * 100)}% of effort budget (${actualEffort}h / ${expectedEffort}h) with only ${progress}% completion.`
            };
        }
    }

    // 4. Timeline pacing lag (significantly into scheduled timeline with minimal progress)
    if (t.planned_start && (t.planned_end || cleanDeadline)) {
        const startDate = new Date(t.planned_start).getTime();
        const endDate = new Date(t.planned_end || cleanDeadline).getTime();
        const now = Date.now();

        if (!isNaN(startDate) && !isNaN(endDate) && endDate > startDate && now > startDate) {
            const totalDuration = endDate - startDate;
            const elapsed = now - startDate;
            const elapsedRatio = elapsed / totalDuration;

            if (elapsedRatio >= 0.75 && progress < 30) {
                return {
                    isDelay: true,
                    reason: `75% of scheduled timeline has elapsed with only ${progress}% completion. Potential delay risk.`
                };
            }
        }
    }

    return { isDelay: false, reason: "" };
}

/**
 * Syncs and populates real early completions, possible delays,
 * and relevant leave requests / approvals / rejections.
 * Purges any obsolete/unsupported notifications.
 */
export async function syncTaskRiskNotifications(userId: number, userRole: string): Promise<void> {
    await ensureDeletedAtColumn();
    const pool = getPool();

    // 1. Populate from actual database tasks (per-task deduplication; never regenerates dismissed alerts)
    if (userRole === "RESOURCE") {
        // Fetch non-deleted tasks assigned to this resource
        const [tasks] = await pool.query<RowDataPacket[]>(
            `SELECT t.task_id, t.title, t.status, t.deadline, t.planned_start, t.planned_end, t.actual_start, t.actual_end,
                    t.expected_effort, t.actual_effort, t.progress, t.is_deadline_at_risk, t.is_schedule_at_risk, p.name as project_name
             FROM tasks t
             JOIN task_assignments ta ON t.task_id = ta.task_id
             LEFT JOIN projects p ON t.project_id = p.project_id
             WHERE ta.user_id = ? AND t.deleted_at IS NULL AND (p.deleted_at IS NULL OR t.project_id IS NULL)
             ORDER BY t.created_at DESC
             LIMIT 50`,
            [userId]
        );

        for (const t of tasks) {
            const taskId = Number(t.task_id);
            const title = String(t.title);
            const link = `/app/resource-dashboard/task-details/${taskId}`;

            // Case A: Early Completion
            const earlyCheck = evaluateEarlyCompletion(t as any);
            if (earlyCheck.isEarly) {
                const notifTitle = `Early Completion: ${title}`;
                const [exists] = await pool.query<RowDataPacket[]>(
                    `SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'EARLY_COMPLETION' AND (link = ? OR title = ?)`,
                    [userId, link, notifTitle]
                );

                if (exists.length === 0) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                         VALUES (?, 'EARLY_COMPLETION', ?, ?, ?, FALSE, NOW())`,
                        [userId, notifTitle, earlyCheck.reason, link]
                    );
                }
            }

            // Case B: Possible Delay
            const delayCheck = evaluatePossibleDelay(t as any);
            if (delayCheck.isDelay) {
                const notifTitle = `Possible Delay: ${title}`;
                const [exists] = await pool.query<RowDataPacket[]>(
                    `SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'POSSIBLE_DELAY' AND (link = ? OR title = ?)`,
                    [userId, link, notifTitle]
                );

                if (exists.length === 0) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                         VALUES (?, 'POSSIBLE_DELAY', ?, ?, ?, FALSE, NOW())`,
                        [userId, notifTitle, delayCheck.reason, link]
                    );
                }
            } else {
                // If task is no longer at risk, remove any stale unread POSSIBLE_DELAY alert for this task
                await pool.query(
                    `DELETE FROM notifications WHERE user_id = ? AND type = 'POSSIBLE_DELAY' AND link = ? AND is_read = FALSE`,
                    [userId, link]
                );
            }
        }
    } else {
        // Project Manager: inspect non-deleted project tasks
        const [tasks] = await pool.query<RowDataPacket[]>(
            `SELECT t.task_id, t.title, t.status, t.deadline, t.planned_start, t.planned_end, t.actual_start, t.actual_end,
                    t.expected_effort, t.actual_effort, t.progress, t.is_deadline_at_risk, t.is_schedule_at_risk, p.name as project_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.project_id
             WHERE p.project_manager_id = ? AND t.deleted_at IS NULL AND p.deleted_at IS NULL
             ORDER BY t.created_at DESC
             LIMIT 50`,
            [userId]
        );

        for (const t of tasks) {
            const taskId = Number(t.task_id);
            const title = String(t.title);
            const link = `/pm/tasks?taskId=${taskId}`;

            // Case A: Early Completion
            const earlyCheck = evaluateEarlyCompletion(t as any);
            if (earlyCheck.isEarly) {
                const notifTitle = `Early Completion: ${title}`;
                const [exists] = await pool.query<RowDataPacket[]>(
                    `SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'EARLY_COMPLETION' AND (link = ? OR title = ?)`,
                    [userId, link, notifTitle]
                );

                if (exists.length === 0) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                         VALUES (?, 'EARLY_COMPLETION', ?, ?, ?, FALSE, NOW())`,
                        [userId, notifTitle, earlyCheck.reason, link]
                    );
                }
            }

            // Case B: Possible Delay
            const delayCheck = evaluatePossibleDelay(t as any);
            if (delayCheck.isDelay) {
                const notifTitle = `Possible Delay: ${title}`;
                const [exists] = await pool.query<RowDataPacket[]>(
                    `SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'POSSIBLE_DELAY' AND (link = ? OR title = ?)`,
                    [userId, link, notifTitle]
                );

                if (exists.length === 0) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                         VALUES (?, 'POSSIBLE_DELAY', ?, ?, ?, FALSE, NOW())`,
                        [userId, notifTitle, delayCheck.reason, link]
                    );
                }
            } else {
                // If task is no longer at risk, remove any stale unread POSSIBLE_DELAY alert for this task
                await pool.query(
                    `DELETE FROM notifications WHERE user_id = ? AND type = 'POSSIBLE_DELAY' AND link = ? AND is_read = FALSE`,
                    [userId, link]
                );
            }
        }
    }

    // 2. Sync existing leave notifications from database (preserves dismissed ones)
    if (userRole === "RESOURCE") {
        // Fetch approved / rejected leaves for this resource
        const [leaves] = await pool.query<RowDataPacket[]>(
            `SELECT ul.leave_id, ul.request_id, DATE_FORMAT(ul.leave_date, '%Y-%m-%d') as leave_date, ul.leave_hours, ul.status, ul.rejection_reason, u.name as approver_name
             FROM user_leaves ul
             LEFT JOIN users u ON ul.approver_id = u.user_id
             WHERE ul.user_id = ? AND ul.status IN ('APPROVED', 'REJECTED')
             ORDER BY ul.created_at DESC
             LIMIT 15`,
            [userId]
        );

        for (const l of leaves) {
            const isApproved = l.status === "APPROVED";
            const notifType: NotificationType = isApproved ? "LEAVE_APPROVED" : "LEAVE_REJECTED";
            const leaveDate = String(l.leave_date);
            const link = "/app/resource-dashboard/leaves";
            const approver = l.approver_name || "Project Manager";
            const title = isApproved ? `Leave Approved: ${leaveDate}` : `Leave Rejected: ${leaveDate}`;

            const [exists] = await pool.query<RowDataPacket[]>(
                `SELECT notification_id FROM notifications WHERE user_id = ? AND type = ? AND (link = ? OR title = ?)`,
                [userId, notifType, link, title]
            );

            if (exists.length === 0) {
                const message = isApproved
                    ? `Your leave request for ${leaveDate} (${l.leave_hours}h) was approved by ${approver}.`
                    : `Your leave request for ${leaveDate} was rejected by ${approver}.${l.rejection_reason ? ` Reason: ${l.rejection_reason}` : ''}`;

                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                     VALUES (?, ?, ?, ?, ?, FALSE, NOW())`,
                    [userId, notifType, title, message, link]
                );
            }
        }
    } else {
        // PM: fetch pending leave requests from resources assigned to PM's projects
        const [pendingLeaves] = await pool.query<RowDataPacket[]>(
            `SELECT ul.leave_id, ul.request_id, ul.user_id, DATE_FORMAT(ul.leave_date, '%Y-%m-%d') as leave_date, ul.leave_hours, u.name as resource_name
             FROM user_leaves ul
             INNER JOIN project_members pm ON ul.user_id = pm.user_id
             INNER JOIN projects p ON pm.project_id = p.project_id
             INNER JOIN users u ON ul.user_id = u.user_id
             WHERE p.project_manager_id = ? AND ul.status = 'PENDING'
             GROUP BY ul.leave_id
             ORDER BY ul.created_at DESC
             LIMIT 15`,
            [userId]
        );

        for (const pl of pendingLeaves) {
            const leaveDate = String(pl.leave_date);
            const link = "/pm/leaves";
            const title = `Leave Requested: ${pl.resource_name}`;

            const [exists] = await pool.query<RowDataPacket[]>(
                `SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'LEAVE_REQUESTED' AND link = ? AND (title = ? OR message LIKE ?)`,
                [userId, link, title, `%${pl.resource_name}%${leaveDate}%`]
            );

            if (exists.length === 0) {
                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                     VALUES (?, 'LEAVE_REQUESTED', ?, ?, ?, FALSE, NOW())`,
                    [
                        userId,
                        title,
                        `${pl.resource_name} has requested leave for ${leaveDate} (${pl.leave_hours}h). Please review and respond.`,
                        link
                    ]
                );
            }
        }
    }
}

/**
 * Fetches all notifications for a given user
 */
export async function getUserNotifications(
    userId: number,
    unreadOnly = false,
    userRole = "RESOURCE"
): Promise<{ notifications: NotificationRecord[]; unreadCount: number }> {
    await ensureDeletedAtColumn();
    const pool = getPool();

    // Ensure user has task risk and leave notifications populated
    await syncTaskRiskNotifications(userId, userRole);

    let query = `
        SELECT notification_id, user_id, type, title, message, link, is_read, created_at
        FROM notifications
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND type IN (
            'EARLY_COMPLETION',
            'POSSIBLE_DELAY',
            'LEAVE_REQUESTED',
            'LEAVE_APPROVED',
            'LEAVE_REJECTED',
            'TASK_VERIFICATION',
            'TASK_ASSIGNED',
            'TASK_CREATED'
          )
    `;
    const params: any[] = [userId];

    if (unreadOnly) {
        query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY is_read ASC, created_at DESC LIMIT 60`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Get unread count
    const [unreadRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as unread_count 
         FROM notifications 
         WHERE user_id = ? 
           AND is_read = FALSE 
           AND deleted_at IS NULL
           AND type IN (
             'EARLY_COMPLETION',
             'POSSIBLE_DELAY',
             'LEAVE_REQUESTED',
             'LEAVE_APPROVED',
             'LEAVE_REJECTED',
             'TASK_VERIFICATION',
             'TASK_ASSIGNED',
             'TASK_CREATED'
           )`,
        [userId]
    );
    const unreadCount = Number(unreadRows[0]?.unread_count || 0);

    const notifications: NotificationRecord[] = rows.map((r: any) => ({
        notification_id: Number(r.notification_id),
        user_id: Number(r.user_id),
        type: r.type as NotificationType,
        title: String(r.title),
        message: String(r.message),
        link: r.link ? String(r.link) : null,
        is_read: Boolean(r.is_read),
        created_at: r.created_at,
    }));

    return { notifications, unreadCount };
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(userId: number, notificationId: number): Promise<boolean> {
    await ensureDeletedAtColumn();
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId]
    );
    return result.affectedRows > 0;
}

/**
 * Marks all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: number): Promise<number> {
    await ensureDeletedAtColumn();
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE user_id = ? 
           AND is_read = FALSE
           AND deleted_at IS NULL
           AND type IN (
             'EARLY_COMPLETION',
             'POSSIBLE_DELAY',
             'LEAVE_REQUESTED',
             'LEAVE_APPROVED',
             'LEAVE_REJECTED',
             'TASK_VERIFICATION',
             'TASK_ASSIGNED',
             'TASK_CREATED'
           )`,
        [userId]
    );
    return result.affectedRows;
}

/**
 * Deletes a notification (soft-delete to preserve dismissal and prevent zombie re-creation)
 */
export async function deleteNotification(userId: number, notificationId: number): Promise<boolean> {
    await ensureDeletedAtColumn();
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE notifications SET deleted_at = CURRENT_TIMESTAMP, is_read = TRUE WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId]
    );
    return result.affectedRows > 0;
}
