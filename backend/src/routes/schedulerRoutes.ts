import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getProjectScheduleData, getResourceScheduleData, triggerRecalculateController } from "../controllers/schedulerController.js";

const schedulerRoutes = Router();

// Apply authentication middleware
schedulerRoutes.use(authenticate);

// GET /api/scheduler/project/:projectId - full dataset for Project Gantt visualization
schedulerRoutes.get("/project/:projectId", getProjectScheduleData);

// GET /api/scheduler/resource/:resourceId - full dataset for Resource Gantt visualization with PM-scoped masking
schedulerRoutes.get("/resource/:resourceId", getResourceScheduleData);

// POST /api/scheduler/project/:projectId/recalculate - manual recalculation trigger
schedulerRoutes.post("/project/:projectId/recalculate", triggerRecalculateController);

export default schedulerRoutes;

