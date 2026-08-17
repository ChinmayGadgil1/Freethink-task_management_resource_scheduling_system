import { Router } from "express";
import { create, getProjects } from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const projectRoutes = Router();

projectRoutes.post("/", create);
projectRoutes.get("/", authenticate, getProjects);

export default projectRoutes;