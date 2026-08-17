import { z } from "zod";
import type { Request, Response } from "express";
import { createProject } from "../services/projectService.js";

const createProjectSchema = z.object({
    project_manager_id: z.number().int().positive(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.enum([
        "DRAFT",
        "PUBLISHED",
        "ACTIVE",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED"
    ]).default("DRAFT"),
    priority: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]).default("MEDIUM"),
    start_date: z.string().nullable().optional(),
    deadline: z.string().nullable().optional()
});

export async function create(
    req: Request,
    res: Response
) {
    try {
        const parsedData = createProjectSchema.parse(req.body);

        if (
            parsedData.start_date &&
            parsedData.deadline &&
            parsedData.start_date > parsedData.deadline
        ) {
            return res.status(400).json({
                message: "Deadline cannot be before start date"
            });
        }

        const project = await createProject(
            parsedData.project_manager_id,
            parsedData.name,
            parsedData.description ?? null,
            parsedData.status,
            parsedData.priority,
            parsedData.start_date ?? null,
            parsedData.deadline ?? null
        );

        return res.status(201).json({
            message: "Project created successfully",
            project
        });
    }
    catch (error: any) {
        console.error("Create project error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                message: "Project manager does not exist"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}