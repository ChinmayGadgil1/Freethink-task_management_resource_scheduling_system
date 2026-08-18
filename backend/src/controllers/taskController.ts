import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { createTask, getTasksList } from "../services/taskService.js";
import { getProjectById } from "../services/projectService.js";

const createTaskSchema = z.object({
    project_id: z.number().int().positive(),
    title: z.string().min(1, "Task title is required"),
    description: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]).default("PENDING"),
    start_date: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(),
    expected_effort: z.number().positive("Expected effort must be positive"),
    assigned_resource_ids: z.array(z.number().int().positive()).optional()
});

export async function create(req: AuthRequest, res: Response) {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.user_id;
        const parsed = createTaskSchema.parse(req.body);

        if (parsed.start_date && parsed.deadline && parsed.start_date > parsed.deadline) {
            return res.status(400).json({ message: "Deadline cannot be before start date" });
        }

        const project = await getProjectById(parsed.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (userRole === "PROJECT_MANAGER" && project.project_manager_id !== userId) {
            return res.status(403).json({ message: "You are not authorized to manage tasks for this project" });
        }

        // If self-assigned by a RESOURCE, assign them automatically
        let resourceIds = parsed.assigned_resource_ids;
        if (userRole === "RESOURCE") {
            resourceIds = [req.user!.user_id];
        }

        const task = await createTask(
            parsed.project_id,
            parsed.title,
            parsed.description ?? null,
            parsed.priority,
            parsed.status,
            parsed.start_date ?? null,
            parsed.deadline ?? null,
            parsed.expected_effort,
            resourceIds
        );

        return res.status(201).json({
            message: "Task created successfully",
            task
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function list(req: AuthRequest, res: Response) {
    try {
        const userRole = req.user!.role;
        const userId = req.user!.user_id;

        const projectId = req.query.project_id ? Number(req.query.project_id) : undefined;
        let resourceId = req.query.resource_id ? Number(req.query.resource_id) : undefined;

        // Security rule: Resource can view only their own assigned tasks
        if (userRole === "RESOURCE") {
            resourceId = userId;
        }

        const tasks = await getTasksList({ projectId, resourceId });

        return res.status(200).json({ tasks });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}
