import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { addLeave, removeLeave, listLeaves, approveLeaveController, rejectLeaveController } from "../controllers/leaveController.js";

const leaveRoutes = Router();

// Protect all routes with JWT authentication
leaveRoutes.use(authenticate);

// Leave endpoints
leaveRoutes.post("/", addLeave);
leaveRoutes.patch("/:id/approve", approveLeaveController);
leaveRoutes.patch("/:id/reject", rejectLeaveController);
leaveRoutes.delete("/:id", removeLeave);
leaveRoutes.get("/", listLeaves);

export default leaveRoutes;

