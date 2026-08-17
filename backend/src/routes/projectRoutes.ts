import { Router } from "express";
import { create } from "../controllers/projectController.js";

const projectRoutes = Router();

projectRoutes.post("/", create);

export default projectRoutes;