import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../services/notificationService.js";

export async function getNotifications(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.user_id;
        const role = req.user?.role || "RESOURCE";

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const unreadOnly = req.query.unread_only === "true";
        const data = await getUserNotifications(userId, unreadOnly, role);

        return res.status(200).json(data);
    } catch (error: any) {
        console.error("Failed to get notifications:", error);
        return res.status(500).json({ message: error.message || "Failed to fetch notifications" });
    }
}

export async function markAsRead(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const userId = req.user?.user_id;
        const notificationId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (isNaN(notificationId)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }

        const success = await markNotificationAsRead(userId, notificationId);
        if (!success) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ message: "Notification marked as read" });
    } catch (error: any) {
        console.error("Failed to mark notification as read:", error);
        return res.status(500).json({ message: error.message || "Failed to update notification" });
    }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const count = await markAllNotificationsAsRead(userId);
        return res.status(200).json({ message: "All notifications marked as read", updatedCount: count });
    } catch (error: any) {
        console.error("Failed to mark all notifications as read:", error);
        return res.status(500).json({ message: error.message || "Failed to update notifications" });
    }
}

export async function removeNotification(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const userId = req.user?.user_id;
        const notificationId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (isNaN(notificationId)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }

        const success = await deleteNotification(userId, notificationId);
        if (!success) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ message: "Notification deleted" });
    } catch (error: any) {
        console.error("Failed to delete notification:", error);
        return res.status(500).json({ message: error.message || "Failed to delete notification" });
    }
}
