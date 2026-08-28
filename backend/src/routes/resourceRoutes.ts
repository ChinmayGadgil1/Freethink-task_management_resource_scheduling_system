import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    listResources,
    getResource,
    getResourceProjectsController,
    getWorkScheduleController,
    updateWorkScheduleController,
    getResourceAvailabilityController
} from "../controllers/resourceController.js";

const resourceRoutes = Router();

resourceRoutes.use(authenticate);

resourceRoutes.get("/", listResources);
resourceRoutes.get("/:id", getResource);
resourceRoutes.get("/:id/projects", getResourceProjectsController);
resourceRoutes.get("/:id/availability", getResourceAvailabilityController);
resourceRoutes.get("/:id/schedule-config", getWorkScheduleController);
resourceRoutes.put("/:id/schedule-config", updateWorkScheduleController);
resourceRoutes.get("/:id/non-working-days", getWorkScheduleController);
resourceRoutes.put("/:id/non-working-days", updateWorkScheduleController);

export default resourceRoutes;