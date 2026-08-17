import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { create, list } from "../controllers/taskController.js";

const taskRoutes = Router();

// Apply authenticate middleware to all task endpoints
taskRoutes.use(authenticate);

taskRoutes.post("/", create);
taskRoutes.get("/", list);

export default taskRoutes;
