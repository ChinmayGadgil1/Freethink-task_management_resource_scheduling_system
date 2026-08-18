import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { create, list, update, addDependency, getResourceWorkloadController, checkImpactController, assignResource } from "../controllers/taskController.js";

const taskRoutes = Router();

// Apply authenticate middleware to all task endpoints
taskRoutes.use(authenticate);

taskRoutes.post("/", create);
taskRoutes.get("/", list);
taskRoutes.put("/:id", update);
taskRoutes.post("/:id/assign", assignResource);
taskRoutes.post("/:id/dependencies", addDependency);
taskRoutes.get("/resources/:resourceId/workload", getResourceWorkloadController);
taskRoutes.post("/resources/:resourceId/check-impact", checkImpactController);

export default taskRoutes;
