import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", removeNotification);

export default router;
