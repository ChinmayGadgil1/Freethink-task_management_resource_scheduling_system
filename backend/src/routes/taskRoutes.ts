import { Router } from "express";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";
import { create, list, getTaskController, update, addDependency, getResourceWorkloadController, checkImpactController, assignResource, addWorkLog, getWorkLogs, getBottlenecksController, deleteTaskController, unassignResourceController, removeTaskDependencyController, startSessionController, stopSessionController, getActiveSessionController, getTaskActiveSessionsController, assignVerificationController, getDailyAllocationsController } from "../controllers/taskController.js";

const taskRoutes = Router();

// Apply authenticate middleware to all task endpoints
taskRoutes.use(authenticate);

taskRoutes.post("/", create);
taskRoutes.get("/", list);
taskRoutes.get("/daily-allocations", requireRole("RESOURCE"), getDailyAllocationsController);
taskRoutes.get("/session/active", getActiveSessionController);
taskRoutes.get("/bottlenecks", requireRole("PROJECT_MANAGER"), getBottlenecksController);
taskRoutes.get("/:id", getTaskController);
taskRoutes.put("/:id", update);
taskRoutes.patch("/:id", update);
taskRoutes.delete("/:id", requireRole("PROJECT_MANAGER"), deleteTaskController);
taskRoutes.post("/:id/assign", requireRole("PROJECT_MANAGER"), assignResource);
taskRoutes.post("/:id/assign-verification", assignVerificationController);
taskRoutes.delete("/:id/assignees/:userId", requireRole("PROJECT_MANAGER"), unassignResourceController);
taskRoutes.post("/:id/dependencies", requireRole("PROJECT_MANAGER"), addDependency);
taskRoutes.delete("/:id/dependencies/:predecessorId", requireRole("PROJECT_MANAGER"), removeTaskDependencyController);
taskRoutes.post("/:id/work-logs", requireRole("RESOURCE"), addWorkLog);
taskRoutes.get("/:id/work-logs", getWorkLogs);
taskRoutes.get("/resources/:resourceId/workload", getResourceWorkloadController);
taskRoutes.post("/resources/:resourceId/check-impact", checkImpactController);
taskRoutes.post("/:id/session/start", requireRole("RESOURCE"), startSessionController);
taskRoutes.post("/:id/session/stop", requireRole("RESOURCE"), stopSessionController);
taskRoutes.get("/:id/sessions/active", getTaskActiveSessionsController); // Route to get active sessions currently ongoing on a specific task for co-assigned resources

export default taskRoutes;
