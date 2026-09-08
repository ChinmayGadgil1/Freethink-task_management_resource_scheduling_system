import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import {
    getBinnedProjects,
    restoreProjectFromBin,
    deleteProject
} from "../services/projectService.js";
import {
    getBinnedTasks,
    restoreTaskFromBin,
    deleteTask
} from "../services/taskService.js";
import { recalculate } from "../services/scheduler/SchedulingEngine.js";

/**
 * GET /api/bin - Fetch all binned projects and tasks for the authenticated project manager
 */
export async function getBinContentsController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can access the Recycle Bin" });
        }

        const projectManagerId = req.user.user_id;
        const [projects, tasks] = await Promise.all([
            getBinnedProjects(projectManagerId),
            getBinnedTasks(projectManagerId)
        ]);

        return res.status(200).json({
            projects,
            tasks,
            total_items: projects.length + tasks.length
        });
    } catch (error: any) {
        console.error("Fetch bin contents error:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * POST /api/bin/projects/:id/restore - Restore a project and its child tasks from the Recycle Bin
 */
export async function restoreProjectController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can restore projects" });
        }

        const projectId = Number(req.params.id);
        const success = await restoreProjectFromBin(projectId);

        if (!success) {
            return res.status(404).json({ message: "Project not found in Recycle Bin" });
        }

        // Trigger Gantt schedule recalculation
        try {
            await recalculate(projectId);
        } catch (scheduleErr) {
            console.error("Error recalculating schedule after project restore:", scheduleErr);
        }

        return res.status(200).json({ message: "Project and tasks restored successfully" });
    } catch (error: any) {
        console.error("Restore project error:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * POST /api/bin/tasks/:id/restore - Restore an individual task from the Recycle Bin
 */
export async function restoreTaskController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can restore tasks" });
        }

        const taskId = Number(req.params.id);
        const result = await restoreTaskFromBin(taskId);

        if (!result.success) {
            return res.status(404).json({ message: result.error || "Task not found in Recycle Bin" });
        }

        // Trigger Gantt schedule recalculation for the parent project
        if (result.projectId) {
            try {
                await recalculate(result.projectId);
            } catch (scheduleErr) {
                console.error("Error recalculating schedule after task restore:", scheduleErr);
            }
        }

        return res.status(200).json({ message: "Task restored successfully", projectId: result.projectId });
    } catch (error: any) {
        console.error("Restore task error:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * DELETE /api/bin/projects/:id - Permanently delete a project and all associated tasks from database
 */
export async function permanentDeleteProjectController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can permanently delete projects" });
        }

        const projectId = Number(req.params.id);
        const success = await deleteProject(projectId);

        if (!success) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.status(200).json({ message: "Project permanently erased from database" });
    } catch (error: any) {
        console.error("Permanent delete project error:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * DELETE /api/bin/tasks/:id - Permanently delete a single task from database
 */
export async function permanentDeleteTaskController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can permanently delete tasks" });
        }

        const taskId = Number(req.params.id);
        const success = await deleteTask(taskId);

        if (!success) {
            return res.status(404).json({ message: "Task not found" });
        }

        return res.status(200).json({ message: "Task permanently erased from database" });
    } catch (error: any) {
        console.error("Permanent delete task error:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

/**
 * POST /api/bin/empty - Bulk purge all binned items for this project manager
 */
export async function emptyBinController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can empty the Recycle Bin" });
        }

        const projectManagerId = req.user.user_id;
        const [projects, tasks] = await Promise.all([
            getBinnedProjects(projectManagerId),
            getBinnedTasks(projectManagerId)
        ]);

        for (const p of projects) {
            await deleteProject(Number(p.project_id));
        }

        for (const t of tasks) {
            await deleteTask(Number(t.task_id));
        }

        return res.status(200).json({
            message: `Recycle Bin emptied successfully (${projects.length} projects, ${tasks.length} tasks purged)`
        });
    } catch (error: any) {
        console.error("Empty bin error:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}
