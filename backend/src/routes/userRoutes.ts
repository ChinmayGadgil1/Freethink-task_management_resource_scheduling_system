import { Router } from "express";
import {
    getCurrentUserProfileController,
    updateUserProfileController
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const userRoutes = Router();

userRoutes.get("/me", authenticate, getCurrentUserProfileController);
userRoutes.patch("/me", authenticate, updateUserProfileController);

export default userRoutes;
