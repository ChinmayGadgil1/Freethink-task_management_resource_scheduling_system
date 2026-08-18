import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { createTask, getTasksList, getTaskById, addTaskDependency, updateTask } from "../services/taskService.js";
import { getProjectById, isProjectMember, getProjectIdsByMember, getProjectsByManager } from "../services/projectService.js";
import { getResourceWorkload, propagateScheduleChanges, checkSchedulingImpact } from "../services/schedulingService.js";

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
        const resourceId = req.query.resource_id ? Number(req.query.resource_id) : undefined;

        let projectIds: number[] | undefined;

        if (userRole === "PROJECT_MANAGER") {
            if (projectId !== undefined) {
                const project = await getProjectById(projectId);
                if (!project) {
                    return res.status(404).json({ message: "Project not found" });
                }
                if (project.project_manager_id !== userId) {
                    return res.status(403).json({ message: "You are not authorized to view tasks for this project" });
                }
                projectIds = [projectId];
            } else {
                const projects = await getProjectsByManager(userId);
                projectIds = projects.map(p => Number(p.project_id));
            }
        } else if (userRole === "RESOURCE") {
            if (projectId !== undefined) {
                const project = await getProjectById(projectId);
                if (!project) {
                    return res.status(404).json({ message: "Project not found" });
                }
                const isMember = await isProjectMember(projectId, userId);
                if (!isMember) {
                    return res.status(403).json({ message: "You are not authorized to view tasks for this project" });
                }
                projectIds = [projectId];
            } else {
                projectIds = await getProjectIdsByMember(userId);
            }
        }

        const tasks = await getTasksList({ resourceId, projectIds });

        return res.status(200).json({ tasks });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional(),
    start_date: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(),
    expected_effort: z.number().positive().optional(),
    actual_effort: z.number().nonnegative().optional(),
    progress: z.number().min(0).max(100).optional()
});

const dependencySchema = z.object({
    predecessor_task_id: z.number().int().positive()
});

const checkImpactSchema = z.object({
    start_date: z.string().min(1),
    deadline: z.string().min(1),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    expected_effort: z.number().positive()
});

export async function update(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const parsed = updateTaskSchema.parse(req.body);

        const task = await getTaskById(taskId) as any;
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await getProjectById(task.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (req.user?.role === "PROJECT_MANAGER" && project.project_manager_id !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to modify tasks for this project" });
        }

        if (req.user?.role === "RESOURCE") {
            const isMember = await isProjectMember(task.project_id, req.user.user_id);
            if (!isMember) {
                return res.status(403).json({ message: "Not authorized to modify tasks for this project" });
            }
        }

        let shiftDays = 0;
        if (parsed.deadline && task.deadline) {
            const oldDeadline = new Date(task.deadline);
            const newDeadline = new Date(parsed.deadline);
            shiftDays = Math.round((newDeadline.getTime() - oldDeadline.getTime()) / (1000 * 60 * 60 * 24));
        }

        await updateTask(taskId, parsed);

        if (shiftDays !== 0) {
            await propagateScheduleChanges(taskId, shiftDays);
        }

        const updatedTask = await getTaskById(taskId);
        return res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask,
            schedule_shifted_days: shiftDays
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function addDependency(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const { predecessor_task_id } = dependencySchema.parse(req.body);

        const task = await getTaskById(taskId) as any;
        const predecessor = await getTaskById(predecessor_task_id) as any;

        if (!task || !predecessor) {
            return res.status(404).json({ message: "One or both tasks not found" });
        }

        if (task.project_id !== predecessor.project_id) {
            return res.status(400).json({ message: "Tasks must belong to the same project" });
        }

        const project = await getProjectById(task.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (req.user?.role === "PROJECT_MANAGER" && project.project_manager_id !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to manage tasks for this project" });
        }

        if (req.user?.role === "RESOURCE") {
            const isMember = await isProjectMember(task.project_id, req.user.user_id);
            if (!isMember) {
                return res.status(403).json({ message: "Not authorized to manage tasks for this project" });
            }
        }

        await addTaskDependency(taskId, predecessor_task_id);

        return res.status(200).json({ message: "Dependency added successfully" });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function getResourceWorkloadController(req: AuthRequest<{ resourceId?: string }>, res: Response) {
    try {
        const userRole = req.user!.role;
        const userId = req.user!.user_id;
        let resourceId = req.params.resourceId ? Number(req.params.resourceId) : userId;

        if (userRole === "RESOURCE" && resourceId !== userId) {
            return res.status(403).json({ message: "Resource cannot view other resources' workload" });
        }

        const workload = await getResourceWorkload(resourceId);
        return res.status(200).json(workload);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function checkImpactController(req: AuthRequest<{ resourceId?: string }>, res: Response) {
    try {
        const userRole = req.user!.role;
        const userId = req.user!.user_id;
        let resourceId = req.params.resourceId ? Number(req.params.resourceId) : userId;

        if (userRole === "RESOURCE" && resourceId !== userId) {
            return res.status(403).json({ message: "Not authorized to check impact for other resource" });
        }

        const parsed = checkImpactSchema.parse(req.body);
        const impact = await checkSchedulingImpact(
            resourceId,
            parsed.start_date,
            parsed.deadline,
            parsed.priority,
            parsed.expected_effort
        );

        return res.status(200).json(impact);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}
