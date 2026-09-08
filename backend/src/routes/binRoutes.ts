import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    getBinContentsController,
    restoreProjectController,
    restoreTaskController,
    permanentDeleteProjectController,
    permanentDeleteTaskController,
    emptyBinController
} from "../controllers/binController.js";

const router = Router();

router.use(authenticate);

// Bin management endpoints
router.get("/", getBinContentsController);
router.post("/projects/:id/restore", restoreProjectController);
router.post("/tasks/:id/restore", restoreTaskController);
router.delete("/projects/:id", permanentDeleteProjectController);
router.delete("/tasks/:id", permanentDeleteTaskController);
router.post("/empty", emptyBinController);

export default router;
