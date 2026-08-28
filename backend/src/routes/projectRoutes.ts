import { Router } from "express";
import {
    create,
    getProjects,
    assignResource,
    getProjectByIdController,
    updateProjectController,
    deleteProjectController,
    removeProjectMemberController,
    getGlobalProgressFeedController
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const projectRoutes = Router();

projectRoutes.post("/", authenticate, create);
projectRoutes.get("/", authenticate, getProjects);
projectRoutes.get("/feed/progress", authenticate, getGlobalProgressFeedController);

projectRoutes.post("/:project_id/members", authenticate, assignResource);
projectRoutes.delete("/:id/members/:userId", authenticate, removeProjectMemberController);

projectRoutes.get("/:id", authenticate, getProjectByIdController);
projectRoutes.patch("/:id", authenticate, updateProjectController);
projectRoutes.delete("/:id", authenticate, deleteProjectController);

export default projectRoutes;