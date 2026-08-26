import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { getProjectById, isProjectMember } from "../services/projectService.js";
import { getProjectSchedule, recalculateProjectSchedule } from "../services/schedulerService.js";

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
