import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name cannot be empty").max(150, "Name is too long"),
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be at most 50 characters")
        .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens"),
});

export async function getCurrentUserProfileController(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const pool = getPool();

        // 1. Fetch user base profile
        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT user_id, name, username, email, role, daily_working_hours, non_working_days, schedule_configured, created_at, updated_at
             FROM users
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0]!;

        // 2. Fetch compact stats based on role
        let stats: { [key: string]: any } = {};

        if (user.role === "PROJECT_MANAGER") {
            const [projRows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    COUNT(*) AS total_projects,
                    SUM(CASE WHEN status = 'ACTIVE' OR status = 'PUBLISHED' THEN 1 ELSE 0 END) AS active_projects,
                    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_projects
                 FROM projects
                 WHERE project_manager_id = ?`,
                [userId]
            );

            const [taskRows] = await pool.query<RowDataPacket[]>(
                `SELECT COUNT(*) AS active_tasks
                 FROM tasks t
                 JOIN projects p ON t.project_id = p.project_id
                 WHERE p.project_manager_id = ? AND t.status IN ('SCHEDULED', 'IN_PROGRESS')`,
                [userId]
            );

            stats = {
                total_projects: Number(projRows[0]?.total_projects || 0),
                active_projects: Number(projRows[0]?.active_projects || 0),
                completed_projects: Number(projRows[0]?.completed_projects || 0),
                active_tasks: Number(taskRows[0]?.active_tasks || 0),
            };
        } else {
            // RESOURCE
            const [taskRows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    COUNT(DISTINCT ta.task_id) AS total_assigned_tasks,
                    SUM(CASE WHEN t.status IN ('SCHEDULED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS active_tasks,
                    SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks
                 FROM task_assignments ta
                 JOIN tasks t ON ta.task_id = t.task_id
                 WHERE ta.user_id = ?`,
                [userId]
            );

            const rawNonWorking = user.non_working_days;
            let nonWorkingCount = 2; // Default Sat/Sun
            if (rawNonWorking) {
                try {
                    const parsed = typeof rawNonWorking === "string" ? JSON.parse(rawNonWorking) : rawNonWorking;
                    if (Array.isArray(parsed)) nonWorkingCount = parsed.length;
                } catch {
                    // ignore
                }
            }
            const workingDaysCount = Math.max(0, 7 - nonWorkingCount);
            const dailyHours = Number(user.daily_working_hours) || 8;
            const weeklyCapacity = workingDaysCount * dailyHours;

            stats = {
                total_assigned_tasks: Number(taskRows[0]?.total_assigned_tasks || 0),
                active_tasks: Number(taskRows[0]?.active_tasks || 0),
                completed_tasks: Number(taskRows[0]?.completed_tasks || 0),
                weekly_capacity_hours: weeklyCapacity,
                daily_working_hours: dailyHours,
            };
        }

        return res.status(200).json({
            user: {
                user_id: user.user_id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            stats,
        });
    } catch (error: any) {
        console.error("Get user profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateUserProfileController(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const parseResult = updateProfileSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                message: parseResult.error.issues[0]?.message || "Invalid input data",
            });
        }

        const { name, username } = parseResult.data;
        const pool = getPool();

        // Check if username is taken by another user
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT user_id FROM users WHERE username = ? AND user_id != ? LIMIT 1`,
            [username, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Username is already taken by another account" });
        }

        await pool.query<ResultSetHeader>(
            `UPDATE users SET name = ?, username = ? WHERE user_id = ?`,
            [name, username, userId]
        );

        // Fetch updated user record
        const [updatedUsers] = await pool.query<RowDataPacket[]>(
            `SELECT user_id, name, username, email, role, created_at, updated_at FROM users WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUsers[0],
        });
    } catch (error: any) {
        console.error("Update user profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
