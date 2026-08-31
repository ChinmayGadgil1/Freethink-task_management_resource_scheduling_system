import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { getProjectById, isProjectMember, getProjectsByManager } from "../services/projectService.js";
import { getProjectSchedule, getResourceSchedule, recalculateProjectSchedule } from "../services/schedulerService.js";
import { getResourceById } from "../services/resourceService.js";

/**
 * Controller to serve calculated schedule data for Gantt chart visualization
 * GET /api/scheduler/project/:projectId
 */
export async function getProjectScheduleData(req: AuthRequest<{ projectId: string }>, res: Response) {
    try {
        const projectId = Number(req.params.projectId);
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Authorization check: PM must own the project, RESOURCE must be a member
        if (userRole === "PROJECT_MANAGER") {
            if (project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to view the schedule for this project" });
            }
        } else if (userRole === "RESOURCE") {
            const isMember = await isProjectMember(projectId, userId!);
            if (!isMember) {
                return res.status(403).json({ message: "You are not authorized to view the schedule for this project" });
            }
        }

        const scheduleData = await getProjectSchedule(projectId);
        if (!scheduleData) {
            return res.status(404).json({ message: "Schedule data not found" });
        }

        return res.status(200).json(scheduleData);
    } catch (error: any) {
        console.error("Error fetching project schedule data:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * Controller to serve calculated schedule data for Resource Gantt chart visualization.
 * When requested by a Project Manager:
 * The resource's schedule across all projects is returned, but tasks under projects NOT managed
 * by this PM have sensitive details (title, description, project name, logs) masked.
 * GET /api/scheduler/resource/:resourceId
 */
export async function getResourceScheduleData(req: AuthRequest<{ resourceId: string }>, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const userRole = req.user.role;
        const currentUserId = req.user.user_id;
        const paramId = req.params.resourceId;

        let targetResourceId: number;

        if (!paramId || paramId === "me") {
            targetResourceId = currentUserId;
        } else {
            const parsed = Number(paramId);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return res.status(400).json({ message: "Invalid resource ID" });
            }
            targetResourceId = parsed;
        }

        // Access control: RESOURCE role can only view their own schedule
        if (userRole === "RESOURCE" && targetResourceId !== currentUserId) {
            return res.status(403).json({
                message: "Access denied. You can only view your own schedule."
            });
        }

        let pmProjectIds: Set<number> | undefined = undefined;

        if (userRole === "PROJECT_MANAGER") {
            const pmProjects = await getProjectsByManager(currentUserId);
            pmProjectIds = new Set(pmProjects.map(p => Number(p.project_id)));
        }

        const scheduleData = await getResourceSchedule(targetResourceId, pmProjectIds);
        if (!scheduleData) {
            return res.status(404).json({ message: "Resource schedule not found" });
        }

        return res.status(200).json(scheduleData);
    } catch (error: any) {
        console.error("Error fetching resource schedule data:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * Controller to manually trigger full recalculation of project schedule
 * POST /api/scheduler/project/:projectId/recalculate
 */
export async function triggerRecalculateController(req: AuthRequest<{ projectId: string }>, res: Response) {
    try {
        const projectId = Number(req.params.projectId);
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (userRole !== "PROJECT_MANAGER" || project.project_manager_id !== userId) {
            return res.status(403).json({ message: "Only the project manager can trigger schedule recalculation" });
        }

        await recalculateProjectSchedule(projectId);
        const updatedSchedule = await getProjectSchedule(projectId);

        return res.status(200).json({
            message: "Project schedule successfully recalculated",
            schedule: updatedSchedule
        });
    } catch (error: any) {
        console.error("Error recalculating project schedule:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

