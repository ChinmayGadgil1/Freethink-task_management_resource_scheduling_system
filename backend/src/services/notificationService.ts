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
    created_at: string;
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

/**
 * Syncs and populates real early completions, possible delays,
 * and relevant leave requests / approvals / rejections.
 * Purges any obsolete/unsupported notifications.
 */
export async function syncTaskRiskNotifications(userId: number, userRole: string): Promise<void> {
    const pool = getPool();

    // 1. Purge any random/generic notifications (preserve supported task risk, verification & leave alert types)
    await pool.query(
        `DELETE FROM notifications WHERE type NOT IN (
            'EARLY_COMPLETION',
            'POSSIBLE_DELAY',
            'LEAVE_REQUESTED',
            'LEAVE_APPROVED',
            'LEAVE_REJECTED',
            'TASK_VERIFICATION',
            'TASK_ASSIGNED',
            'TASK_CREATED'
        )`
    );

    // 2. Check existing task notifications for this user
    const [existingTaskRows] = await pool.query<RowDataPacket[]>(
        `SELECT notification_id FROM notifications WHERE user_id = ? AND type IN ('EARLY_COMPLETION', 'POSSIBLE_DELAY')`,
        [userId]
    );

    // Populate task risks if not already present
    if (existingTaskRows.length === 0) {

    // 3. Populate from actual database tasks
    if (userRole === "RESOURCE") {
        // Fetch tasks assigned to this resource
        const [tasks] = await pool.query<RowDataPacket[]>(
            `SELECT t.task_id, t.title, t.status, t.deadline, t.actual_end, t.expected_effort, t.actual_effort, t.progress, t.is_deadline_at_risk, t.is_schedule_at_risk, p.name as project_name
             FROM tasks t
             JOIN task_assignments ta ON t.task_id = ta.task_id
             LEFT JOIN projects p ON t.project_id = p.project_id
             WHERE ta.user_id = ?
             ORDER BY t.created_at DESC`,
            [userId]
        );

        for (const t of tasks) {
            const taskId = Number(t.task_id);
            const title = String(t.title);
            const status = String(t.status);
            const deadline = t.deadline ? String(t.deadline).split("T")[0] : null;
            const progress = Number(t.progress) || 0;
            const actualEffort = Number(t.actual_effort) || 0;
            const expectedEffort = Number(t.expected_effort) || 0;
            const link = `/app/resource-dashboard/task-details/${taskId}`;

            // Case A: Early Completion
            if (status === "COMPLETED") {
                const diffHours = expectedEffort - actualEffort;
                let reason = "Task was finished ahead of time with all deliverables verified.";
                if (diffHours > 0) {
                    reason = `Task finished with ${actualEffort}h logged (${diffHours}h less than the ${expectedEffort}h planned allocation).`;
                } else if (deadline) {
                    reason = `Task completed successfully on or before the ${deadline} deadline.`;
                }

                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                     VALUES (?, 'EARLY_COMPLETION', ?, ?, ?, FALSE, NOW() - INTERVAL 2 HOUR)`,
                    [
                        userId,
                        `Early Completion: ${title}`,
                        reason,
                        link,
                    ]
                );
            }

            // Case B: Possible Delay
            if (status === "IN_PROGRESS" || status === "SCHEDULED") {
                const isAtRisk = Boolean(t.is_deadline_at_risk || t.is_schedule_at_risk);
                const effortRatio = expectedEffort > 0 ? (actualEffort / expectedEffort) : 0;
                const isEffortWarning = effortRatio >= 0.7 && progress < 70;

                let delayReason = "";
                if (isAtRisk) {
                    delayReason = `Task schedule engine flagged potential deadline risk (${deadline || 'upcoming'}). Current progress is ${progress}%.`;
                } else if (isEffortWarning) {
                    delayReason = `Effort consumption reached ${Math.round(effortRatio * 100)}% (${actualEffort}h of ${expectedEffort}h) with ${progress}% completion. Potential delay risk.`;
                } else if (deadline && progress < 60) {
                    delayReason = `Target deadline is ${deadline}. Progress is currently at ${progress}%. Possible delay if pace is not maintained.`;
                }

                if (delayReason) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                         VALUES (?, 'POSSIBLE_DELAY', ?, ?, ?, FALSE, NOW() - INTERVAL 45 MINUTE)`,
                        [
                            userId,
                            `Possible Delay: ${title}`,
                            delayReason,
                            link,
                        ]
                    );
                }
            }
        }
    } else {
        // Project Manager: inspect project tasks
        const [tasks] = await pool.query<RowDataPacket[]>(
            `SELECT t.task_id, t.title, t.status, t.deadline, t.actual_end, t.expected_effort, t.actual_effort, t.progress, t.is_deadline_at_risk, t.is_schedule_at_risk, p.name as project_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.project_id
             WHERE p.project_manager_id = ?
             ORDER BY t.created_at DESC`,
            [userId]
        );

        for (const t of tasks) {
            const taskId = Number(t.task_id);
            const title = String(t.title);
            const status = String(t.status);
            const deadline = t.deadline ? String(t.deadline).split("T")[0] : null;
            const progress = Number(t.progress) || 0;
            const actualEffort = Number(t.actual_effort) || 0;
            const expectedEffort = Number(t.expected_effort) || 0;
            const link = `/pm/tasks`;

            // Case A: Early Completion (limit to notable completed tasks)
            if (status === "COMPLETED") {
                const diffHours = expectedEffort - actualEffort;
                let reason = `Deliverable completed ahead of schedule with 100% progress logged.`;
                if (diffHours > 0) {
                    reason = `Task completed early saving ${diffHours} hours of planned project effort.`;
                } else if (deadline) {
                    reason = `Task completed and reviewed ahead of ${deadline} milestone.`;
                }

                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                     VALUES (?, 'EARLY_COMPLETION', ?, ?, ?, FALSE, NOW() - INTERVAL 3 HOUR)`,
                    [
                        userId,
                        `Early Completion: ${title}`,
                        reason,
                        link,
                    ]
                );
            }

            // Case B: Possible Delay
            if (status === "IN_PROGRESS" || status === "SCHEDULED") {
                const isAtRisk = Boolean(t.is_deadline_at_risk || t.is_schedule_at_risk);
                const effortRatio = expectedEffort > 0 ? (actualEffort / expectedEffort) : 0;
                const isEffortWarning = effortRatio >= 0.7 && progress < 70;

                let delayReason = "";
                if (isAtRisk) {
                    delayReason = `Critical path schedule detects possible deadline slippage for ${deadline || 'target'}. Progress: ${progress}%.`;
                } else if (isEffortWarning) {
                    delayReason = `Task consumed ${Math.round(effortRatio * 100)}% of effort budget (${actualEffort}h / ${expectedEffort}h) while progress is ${progress}%. Possible delay expected.`;
                } else if (deadline && progress < 70) {
                    delayReason = `Approaching milestone (${deadline}). Deliverable is at ${progress}%. Review pacing with assigned team members.`;
                }

                if (delayReason) {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                         VALUES (?, 'POSSIBLE_DELAY', ?, ?, ?, FALSE, NOW() - INTERVAL 1 HOUR)`,
                        [
                            userId,
                            `Possible Delay: ${title}`,
                            delayReason,
                            link,
                        ]
                    );
                }
            }
        }
    }
}

    // 3. Sync existing leave notifications from database
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

            const [exists] = await pool.query<RowDataPacket[]>(
                `SELECT notification_id FROM notifications WHERE user_id = ? AND type = ? AND link = ? AND title LIKE ?`,
                [userId, notifType, link, `%${leaveDate}%`]
            );

            if (exists.length === 0) {
                const approver = l.approver_name || "Project Manager";
                const title = isApproved ? `Leave Approved: ${leaveDate}` : `Leave Rejected: ${leaveDate}`;
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

            const [exists] = await pool.query<RowDataPacket[]>(
                `SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'LEAVE_REQUESTED' AND link = ? AND message LIKE ?`,
                [userId, link, `%${pl.resource_name}%${leaveDate}%`]
            );

            if (exists.length === 0) {
                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                     VALUES (?, 'LEAVE_REQUESTED', ?, ?, ?, FALSE, NOW())`,
                    [
                        userId,
                        `Leave Requested: ${pl.resource_name}`,
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
    const pool = getPool();

    // Ensure user has task risk and leave notifications populated
    await syncTaskRiskNotifications(userId, userRole);

    let query = `
        SELECT notification_id, user_id, type, title, message, link, is_read, created_at
        FROM notifications
        WHERE user_id = ?
          AND type IN (
            'EARLY_COMPLETION',
            'POSSIBLE_DELAY',
            'LEAVE_REQUESTED',
            'LEAVE_APPROVED',
            'LEAVE_REJECTED',
            'TASK_VERIFICATION'
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
           AND type IN (
             'EARLY_COMPLETION',
             'POSSIBLE_DELAY',
             'LEAVE_REQUESTED',
             'LEAVE_APPROVED',
             'LEAVE_REJECTED',
             'TASK_VERIFICATION'
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
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE user_id = ? 
           AND is_read = FALSE 
           AND type IN (
             'EARLY_COMPLETION',
             'POSSIBLE_DELAY',
             'LEAVE_REQUESTED',
             'LEAVE_APPROVED',
             'LEAVE_REJECTED',
             'TASK_VERIFICATION'
           )`,
        [userId]
    );
    return result.affectedRows;
}

/**
 * Deletes a notification
 */
export async function deleteNotification(userId: number, notificationId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM notifications WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId]
    );
    return result.affectedRows > 0;
}
