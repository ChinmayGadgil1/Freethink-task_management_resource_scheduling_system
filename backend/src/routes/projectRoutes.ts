import { Router } from "express";
import { create, getProjects, assignResource } from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const projectRoutes = Router();

projectRoutes.post("/", create);
projectRoutes.get("/", authenticate, getProjects);
projectRoutes.post("/:project_id/members", authenticate, assignResource);

export default projectRoutes;