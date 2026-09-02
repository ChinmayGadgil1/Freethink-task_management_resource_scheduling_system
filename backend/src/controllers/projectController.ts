import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";

import {
    createProject,
    getProjectsByManager,
    assignResourceToProject,
    getProjectById,
    updateProject,
    deleteProject,
    removeProjectMember,
    getProjectsByMember,
    isProjectMember,
    archiveProject,
    unarchiveProject
} from "../services/projectService.js";
import { getRecentWorkLogsForManager } from "../services/workLogService.js";

const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    priority: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]).default("MEDIUM"),
    start_date: z.string().nullable().optional(),
    deadline: z.string().nullable().optional()
});
const updateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().nullable().optional(),
    status: z.enum([
        "NOT_STARTED",
        "IN_PROGRESS",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED",
        "ARCHIVED"
    ]),
    priority: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]),
    start_date: z.string().nullable().optional(),
    deadline: z.string().nullable().optional()
});

export async function create(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can create projects"
            });
        }

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
            req.user.user_id,
            parsedData.name,
            parsedData.description ?? null,
            "NOT_STARTED",
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

export async function getProjects(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let projects;
        if (req.user.role === "PROJECT_MANAGER") {
            projects = await getProjectsByManager(req.user.user_id);
        } else if (req.user.role === "RESOURCE") {
            projects = await getProjectsByMember(req.user.user_id);
        } else {
            return res.status(403).json({
                message: "You are not authorized to view projects"
            });
        }

        return res.status(200).json({
            projects
        });
    }
    catch (error) {
        console.error("Fetch projects error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function assignResource(
    req: AuthRequest<{ project_id: string }>,
    res: Response
) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can assign resources"
            });
        }

        const projectId = Number(req.params.project_id);
        const resourceId = Number(req.body.user_id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        if (!Number.isInteger(resourceId) || resourceId <= 0) {
            return res.status(400).json({
                message: "Invalid resource ID"
            });
        }

        const assignment = await assignResourceToProject(
            projectId,
            req.user.user_id,
            resourceId
        );

        return res.status(201).json({
            message: "Resource assigned successfully",
            assignment
        });
    }
    catch (error: any) {
        console.error("Assign resource error:", error);

        if (error.message === "PROJECT_NOT_FOUND") {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (error.message === "RESOURCE_NOT_FOUND") {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        if (error.message === "RESOURCE_ALREADY_ASSIGNED") {
            return res.status(409).json({
                message: "Resource is already assigned to this project"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getProjectByIdController(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (req.user.role !== "PROJECT_MANAGER" && req.user.role !== "RESOURCE") {
            return res.status(403).json({
                message: "You are not authorized to view projects"
            });
        }

        const projectId = Number((req.params as { id: string }).id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const project = await getProjectById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (req.user.role === "PROJECT_MANAGER") {
            // A project manager should only be able to access their own project.
            if (project.project_manager_id !== req.user.user_id) {
                return res.status(403).json({
                    message: "You do not have access to this project"
                });
            }
        } else if (req.user.role === "RESOURCE") {
            // A resource should only be able to access projects they are members of.
            const isMember = await isProjectMember(projectId, req.user.user_id);
            if (!isMember) {
                return res.status(403).json({
                    message: "You do not have access to this project"
                });
            }
        }

        return res.status(200).json({
            project
        });
    }
    catch (error) {
        console.error("Fetch project error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function updateProjectController(
    req: AuthRequest,
    res: Response
) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can update projects"
            });
        }

        const projectId = Number((req.params as { id: string }).id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const parsedData = updateProjectSchema.parse(req.body);

        if (
            parsedData.start_date &&
            parsedData.deadline &&
            parsedData.start_date > parsedData.deadline
        ) {
            return res.status(400).json({
                message: "Deadline cannot be before start date"
            });
        }

        const project = await updateProject(
            projectId,
            req.user.user_id,
            parsedData.name,
            parsedData.description ?? null,
            parsedData.status,
            parsedData.priority,
            parsedData.start_date ?? null,
            parsedData.deadline ?? null
        );

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        return res.status(200).json({
            message: "Project updated successfully",
            project
        });
    }
    catch (error: unknown) {
        console.error("Update project error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function deleteProjectController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can delete projects" });
        }
        
        const projectId = Number((req.params as any).id);
        const project = await getProjectById(projectId);
        
        if (!project || project.project_manager_id !== req.user.user_id) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }
        
        const success = await deleteProject(projectId);
        if (!success) {
            return res.status(404).json({ message: "Project not found" });
        }
        
        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error: any) {
        console.error("Delete project error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function removeProjectMemberController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can manage project members" });
        }
        
        const projectId = Number((req.params as any).id);
        const userId = Number((req.params as any).userId);
        
        const project = await getProjectById(projectId);
        if (!project || project.project_manager_id !== req.user.user_id) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }
        
        const success = await removeProjectMember(projectId, userId);
        if (!success) {
            return res.status(404).json({ message: "Member not found in project" });
        }
        
        return res.status(200).json({ message: "Member removed successfully" });
    } catch (error: any) {
        console.error("Remove project member error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getGlobalProgressFeedController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can view the global progress feed" });
        }
        
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        
        const logs = await getRecentWorkLogsForManager(req.user.user_id, limit);
        
        return res.status(200).json({ logs });
    } catch (error: any) {
        console.error("Global progress feed error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function archiveProjectController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can archive projects" });
        }

        const projectId = Number((req.params as any).id);
        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const result = await archiveProject(projectId, req.user.user_id);

        if (result.error === "NOT_FOUND_OR_UNAUTHORIZED") {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        if (result.error === "PROJECT_NOT_COMPLETED") {
            return res.status(400).json({ message: "Only completed projects can be archived" });
        }

        return res.status(200).json({
            message: "Project archived successfully",
            project: result.project
        });
    } catch (error: any) {
        console.error("Archive project error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function unarchiveProjectController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can unarchive projects" });
        }

        const projectId = Number((req.params as any).id);
        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const result = await unarchiveProject(projectId, req.user.user_id);

        if (result.error === "NOT_FOUND_OR_UNAUTHORIZED") {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        if (result.error === "PROJECT_NOT_ARCHIVED") {
            return res.status(400).json({ message: "Only archived projects can be unarchived" });
        }

        return res.status(200).json({
            message: "Project unarchived successfully",
            project: result.project
        });
    } catch (error: any) {
        console.error("Unarchive project error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}