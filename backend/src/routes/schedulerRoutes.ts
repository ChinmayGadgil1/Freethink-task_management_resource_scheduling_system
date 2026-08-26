import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getProjectScheduleData, triggerRecalculateController } from "../controllers/schedulerController.js";

const schedulerRoutes = Router();

// Apply authentication middleware
schedulerRoutes.use(authenticate);

// GET /api/scheduler/project/:projectId - full dataset for Gantt visualization
schedulerRoutes.get("/project/:projectId", getProjectScheduleData);

// POST /api/scheduler/project/:projectId/recalculate - manual recalculation trigger
schedulerRoutes.post("/project/:projectId/recalculate", triggerRecalculateController);

export default schedulerRoutes;
