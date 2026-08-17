import { Router } from "express";
import { signup, signin, resetPasswordController } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/signin", signin);
authRoutes.post("/reset-password", resetPasswordController);
export default authRoutes;