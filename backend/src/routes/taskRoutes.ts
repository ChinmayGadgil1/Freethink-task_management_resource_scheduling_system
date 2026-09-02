import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { create, list, update, addDependency, getResourceWorkloadController, checkImpactController, assignResource, addWorkLog, getWorkLogs, getBottlenecksController, deleteTaskController, unassignResourceController, removeTaskDependencyController, startSessionController, stopSessionController, getActiveSessionController, getTaskActiveSessionsController } from "../controllers/taskController.js";

const taskRoutes = Router();

// Apply authenticate middleware to all task endpoints
taskRoutes.use(authenticate);

taskRoutes.post("/", create);
taskRoutes.get("/", list);
taskRoutes.get("/session/active", getActiveSessionController);
taskRoutes.get("/bottlenecks", getBottlenecksController);
taskRoutes.put("/:id", update);
taskRoutes.patch("/:id", update);
taskRoutes.delete("/:id", deleteTaskController);
taskRoutes.post("/:id/assign", assignResource);
taskRoutes.delete("/:id/assignees/:userId", unassignResourceController);
taskRoutes.post("/:id/dependencies", addDependency);
taskRoutes.delete("/:id/dependencies/:predecessorId", removeTaskDependencyController);
taskRoutes.post("/:id/work-logs", addWorkLog);
taskRoutes.get("/:id/work-logs", getWorkLogs);
taskRoutes.get("/resources/:resourceId/workload", getResourceWorkloadController);
taskRoutes.post("/resources/:resourceId/check-impact", checkImpactController);
taskRoutes.post("/:id/session/start", startSessionController);
taskRoutes.post("/:id/session/stop", stopSessionController);
taskRoutes.get("/:id/sessions/active", getTaskActiveSessionsController); // Route to get active sessions currently ongoing on a specific task for co-assigned resources

export default taskRoutes;
