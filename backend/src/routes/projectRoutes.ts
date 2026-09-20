import { Router } from "express";
import {
    create,
    getProjects,
    assignResource,
    getProjectByIdController,
    updateProjectController,
    deleteProjectController,
    removeProjectMemberController,
    getGlobalProgressFeedController,
    archiveProjectController,
    unarchiveProjectController
} from "../controllers/projectController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const projectRoutes = Router();

// Apply authenticate middleware to all project endpoints
projectRoutes.use(authenticate);

projectRoutes.post("/", requireRole("PROJECT_MANAGER"), create);
projectRoutes.get("/", getProjects);
projectRoutes.get("/feed/progress", requireRole("PROJECT_MANAGER"), getGlobalProgressFeedController);

projectRoutes.post("/:project_id/members", requireRole("PROJECT_MANAGER"), assignResource);
projectRoutes.delete("/:id/members/:userId", requireRole("PROJECT_MANAGER"), removeProjectMemberController);

projectRoutes.get("/:id", getProjectByIdController);
projectRoutes.patch("/:id", requireRole("PROJECT_MANAGER"), updateProjectController);
projectRoutes.delete("/:id", requireRole("PROJECT_MANAGER"), deleteProjectController);
projectRoutes.post("/:id/archive", requireRole("PROJECT_MANAGER"), archiveProjectController);
projectRoutes.post("/:id/unarchive", requireRole("PROJECT_MANAGER"), unarchiveProjectController);

export default projectRoutes;