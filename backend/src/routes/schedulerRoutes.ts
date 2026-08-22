import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getProjectScheduleData } from "../controllers/schedulerController.js";

const schedulerRoutes = Router();

// Apply authentication middleware
schedulerRoutes.use(authenticate);

// GET /api/scheduler/project/:projectId - full dataset for Gantt visualization
schedulerRoutes.get("/project/:projectId", getProjectScheduleData);

export default schedulerRoutes;
