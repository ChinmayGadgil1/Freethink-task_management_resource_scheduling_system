import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { listResources, getResource, getResourceProjectsController } from "../controllers/resourceController.js";

const resourceRoutes = Router();

resourceRoutes.use(authenticate);

resourceRoutes.get("/", listResources);
resourceRoutes.get("/:id", getResource);
resourceRoutes.get("/:id/projects", getResourceProjectsController);

export default resourceRoutes;