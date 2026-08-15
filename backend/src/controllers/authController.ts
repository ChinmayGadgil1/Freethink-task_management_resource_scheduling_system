import { z } from "zod";
import type { Request, Response } from "express";
import { signupUser, signinUser } from "../services/authService.js";
import { PassThrough } from "node:stream";

const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email format"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^[A-Z]/, "Password must start with a capital letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    role: z.enum(["PROJECT_MANAGER", "RESOURCE"], {
        message: "Invalid role"
    }),
});

const signinSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(6, "Password must contain at least 6 characters")
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

export async function signin(req: Request, res: Response) {
    try {
        const parsedData = signinSchema.parse(req.body);

        const user = await signinUser(
            parsedData.email,
            parsedData.password
        );

        return res.status(200).json({
            message: "Sign in successful",
            user
        });
    }
    catch (error: any) {
        console.error("SignIn error", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error", 
                errors: error.issues
            });
        }

        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (error.message === "USER_INACTIVE") {
            return res.status(402).json({
                message: "User account is inactive"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}