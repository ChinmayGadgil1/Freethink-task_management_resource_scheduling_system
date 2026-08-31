import { Router } from "express";
import { signup, login, resetPasswordController, forgotPasswordController, resetPasswordTokenController } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password-token", resetPasswordTokenController);
export default authRoutes;