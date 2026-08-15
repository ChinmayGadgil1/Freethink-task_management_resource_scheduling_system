import { z } from "zod";
import type { Request, Response } from "express";
import { signupUser } from "../services/authService.js";

const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["PROJECT_MANAGER", "RESOURCE"], {
        message: "Invalid role"
    }),
});

export async function signup(
    req: Request,
    res: Response
) {
    try {
        const parsedData = signupSchema.parse(req.body);

        const user = await signupUser(
            parsedData.name,
            parsedData.email,
            parsedData.password,
            parsedData.role
        );

        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error: any) {
        console.error("Signup error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }

        if (error.message === "EMAIL_ALREADY_EXISTS") {
            return res.status(409).json({
                message: "Email is already registered",
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}