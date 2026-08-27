import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { addTicket, listTickets } from "../controllers/supportController.js";

const supportRoutes = Router();

// Protect all routes with JWT authentication
supportRoutes.use(authenticate);

supportRoutes.post("/tickets", addTicket);
supportRoutes.get("/tickets", listTickets);

export default supportRoutes;
