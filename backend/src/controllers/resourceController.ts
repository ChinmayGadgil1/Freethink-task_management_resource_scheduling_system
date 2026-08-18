import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { getResources, getResourceById, getResourceProjects } from "../services/resourceService.js";

export async function listResources(
    req: AuthRequest,
    res: Response
) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can view resources"
            });
        }

        const resources = await getResources();

        return res.status(200).json(resources);
    } catch (error: any) {
        console.error("Get resources error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getResource(
    req: AuthRequest<{ id: string }>,
    res: Response
) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can view resources"
            });
        }

        const resourceId = Number(req.params.id);

        if (!Number.isInteger(resourceId) || resourceId <= 0) {
            return res.status(400).json({
                message: "Invalid resource ID"
            });
        }

        const resource = await getResourceById(resourceId);

        return res.status(200).json(resource);
    } catch (error: any) {
        if (error.message === "RESOURCE_NOT_FOUND") {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        console.error("Get resource error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getResourceProjectsController(
    req: AuthRequest<{ id: string }>,
    res: Response
) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can view resources"
            });
        }

        const resourceId = Number(req.params.id);

        if (!Number.isInteger(resourceId) || resourceId <= 0) {
            return res.status(400).json({
                message: "Invalid resource ID"
            });
        }

        const projects = await getResourceProjects(resourceId);

        return res.status(200).json(projects);
    } catch (error) {
        console.error("Get resource projects error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}