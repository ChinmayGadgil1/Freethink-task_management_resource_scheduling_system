import { z } from "zod";
import type { Request, Response } from "express";
import { signupUser, loginUser, resetPassword, requestPasswordReset, resetPasswordWithToken } from "../services/authService.js";


const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be at most 50 characters"),
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

const loginSchema = z.object({
    identifier: z.string().min(1, "Username or Email is required").optional(),
    email: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(6, "Password must contain at least 6 characters")
}).refine((data) => !!(data.identifier || data.email || data.username), {
    message: "Username or Email is required",
    path: ["identifier"]
});

const resetPasswordSchema = z.object({
    email: z.email("Invalid email format"),
    oldPassword: z.string(),
    newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters")
        .regex(/^[A-Z]/, "New password must start with a capital letter")
        .regex(/[0-9]/, "New password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "New password must contain at least one special character")
});


export async function signup(
    req: Request,
    res: Response
) {
    try {
        const parsedData = signupSchema.parse(req.body);

        const user = await signupUser(
            parsedData.name,
            parsedData.username,
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

        if (error.message === "USERNAME_ALREADY_EXISTS") {
            return res.status(409).json({
                message: "Username is already taken",
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const parsedData = loginSchema.parse(req.body);
        const loginIdentifier = (parsedData.identifier || parsedData.email || parsedData.username || "").trim();

        const user = await loginUser(
            loginIdentifier,
            parsedData.password
        );

        return res.status(200).json({
            message: "Sign in successful",
            user
        });
    }
    catch (error: any) {
        console.error("Login error", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error", 
                errors: error.issues
            });
        }

        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                message: "Invalid username/email or password"
            });
        }

        if (error.message === "USER_INACTIVE") {
            return res.status(403).json({
                message: "User account is inactive"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function resetPasswordController(req: Request, res: Response) {
    try {
        const parsedData = resetPasswordSchema.parse(req.body);

        await resetPassword(
            parsedData.email,
            parsedData.oldPassword,
            parsedData.newPassword
        );

        return res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error: any) {
        console.error("Reset Password error", error);

        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Invalid request data",
                errors: error.issues
            });
        }

        if (error.message === "USER_NOT_FOUND") {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                message: "Invalid old password"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// ── Forgot Password ──────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
    email: z.email("Invalid email format"),
});

const resetPasswordTokenSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^[A-Z]/, "Password must start with a capital letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email if the email exists.
 */
export async function forgotPasswordController(req: Request, res: Response) {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        // Always respond with 200 — don't reveal whether the email exists
        await requestPasswordReset(email);
        return res.status(200).json({
            message: "If that email is registered, a reset link has been sent.",
        });
    } catch (error: any) {
        console.error("Forgot password error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * POST /api/auth/reset-password-token
 * Validates the token and sets the new password.
 */
export async function resetPasswordTokenController(req: Request, res: Response) {
    try {
        const { token, newPassword } = resetPasswordTokenSchema.parse(req.body);
        await resetPasswordWithToken(token, newPassword);
        return res.status(200).json({ message: "Password reset successfully." });
    } catch (error: any) {
        console.error("Reset password token error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }

        if (error.message === "INVALID_TOKEN") {
            return res.status(400).json({ message: "Invalid or unknown reset token." });
        }

        if (error.message === "TOKEN_ALREADY_USED") {
            return res.status(400).json({ message: "This reset link has already been used." });
        }

        if (error.message === "TOKEN_EXPIRED") {
            return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
}