import { Router } from "express";
import { signup, signin, resetPasswordController, forgotPasswordController, resetPasswordTokenController } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/signin", signin);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password-token", resetPasswordTokenController);
export default authRoutes;