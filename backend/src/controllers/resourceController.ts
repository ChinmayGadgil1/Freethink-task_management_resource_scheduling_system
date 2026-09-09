import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { getResources, getResourceById, getResourceProjects } from "../services/resourceService.js";

export async function listResources(
    req: AuthRequest,
    res: Response
) {
    try {
        const projectIdParam = req.query.project_id;
        const managerIdParam = req.query.manager_id;

        let projectId: number | undefined;
        let managerId: number | undefined;

        if (projectIdParam !== undefined) {
            projectId = Number(projectIdParam);

            if (!Number.isInteger(projectId) || projectId <= 0) {
                return res.status(400).json({
                    message: "Invalid project ID"
                });
            }
        }

        if (managerIdParam !== undefined) {
            managerId = Number(managerIdParam);

            if (!Number.isInteger(managerId) || managerId <= 0) {
                return res.status(400).json({
                    message: "Invalid manager ID"
                });
            }
        }

        const resources = await getResources(projectId, managerId);

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

/**
 * GET /api/resources/:id/schedule-config (or /api/resources/me/schedule-config)
 * Retrieve working days and daily hours for a resource.
 */
export async function getWorkScheduleController(
    req: AuthRequest<{ id?: string }>,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userRole = req.user.role;
        const currentUserId = req.user.user_id;
        const paramId = req.params.id;

        let targetUserId: number;

        if (!paramId || paramId === "me") {
            targetUserId = currentUserId;
        } else {
            const parsed = Number(paramId);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return res.status(400).json({ message: "Invalid resource ID" });
            }
            targetUserId = parsed;
        }

        // Access control: RESOURCE role can only view their own schedule
        if (userRole === "RESOURCE" && targetUserId !== currentUserId) {
            return res.status(403).json({
                message: "Access denied. You can only view your own work schedule."
            });
        }

        const { getResourceWorkSchedule } = await import("../services/resourceScheduleService.js");
        const schedule = await getResourceWorkSchedule(targetUserId);

        return res.status(200).json({
            success: true,
            data: schedule
        });
    } catch (error: any) {
        console.error("Get work schedule error:", error);
        return res.status(error.status || 500).json({
            message: error.message || "Internal server error"
        });
    }
}

/**
 * PUT /api/resources/:id/schedule-config (or /api/resources/me/schedule-config)
 * Update working days and daily hours for a resource.
 */
export async function updateWorkScheduleController(
    req: AuthRequest<{ id?: string }>,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userRole = req.user.role;
        const currentUserId = req.user.user_id;
        const paramId = req.params.id;

        let targetUserId: number;

        if (!paramId || paramId === "me") {
            targetUserId = currentUserId;
        } else {
            const parsed = Number(paramId);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return res.status(400).json({ message: "Invalid resource ID" });
            }
            targetUserId = parsed;
        }

        // Access control: RESOURCE role can only modify their own schedule
        if (userRole === "RESOURCE" && targetUserId !== currentUserId) {
            return res.status(403).json({
                message: "Access denied. You can only modify your own work schedule."
            });
        }

        const { updateResourceWorkSchedule } = await import("../services/resourceScheduleService.js");
        const updated = await updateResourceWorkSchedule(targetUserId, req.body, userRole);

        return res.status(200).json({
            success: true,
            message: "Work schedule updated successfully",
            data: updated
        });
    } catch (error: any) {
        console.error("Update work schedule error:", error);
        return res.status(error.status || 500).json({
            message: error.message || "Internal server error"
        });
    }
}

/**
 * GET /api/resources/:id/availability (or /api/resources/me/availability)
 * Retrieve day-by-day resource availability across a requested date range.
 */
export async function getResourceAvailabilityController(
    req: AuthRequest<{ id?: string }>,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userRole = req.user.role;
        const currentUserId = req.user.user_id;
        const paramId = req.params.id;

        let targetUserId: number;

        if (!paramId || paramId === "me") {
            targetUserId = currentUserId;
        } else {
            const parsed = Number(paramId);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return res.status(400).json({ message: "Invalid resource ID" });
            }
            targetUserId = parsed;
        }

        // Access control: RESOURCE role can only view their own availability
        if (userRole === "RESOURCE" && targetUserId !== currentUserId) {
            return res.status(403).json({
                message: "Access denied. You can only view your own availability."
            });
        }

        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const { getResourceAvailability } = await import("../services/schedulerService.js");
        const availability = await getResourceAvailability(targetUserId, startDate, endDate);

        return res.status(200).json({
            success: true,
            data: availability
        });
    } catch (error: any) {
        console.error("Get resource availability error:", error);
        return res.status(error.status || 500).json({
            message: error.message || "Internal server error"
        });
    }
}