import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { createTask, getTasksList, getTaskById, assignResourceToTask, addTaskDependency, updateTask, getBottleneckTasks, deleteTask, unassignResource, removeTaskDependency } from "../services/taskService.js";
import { getProjectById, isProjectMember, getProjectIdsByMember, getProjectsByManager } from "../services/projectService.js";
import { getResourceWorkload, propagateScheduleChanges, checkSchedulingImpact, handleTaskCompletionImpact } from "../services/schedulingService.js";
import { createWorkLog, getWorkLogsByTask } from "../services/workLogService.js";

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
            let actualResourceId = resourceId;
    
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
                actualResourceId = userId; // Resources only see their own assigned tasks
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
    
            const tasks = await getTasksList({ resourceId: actualResourceId, projectIds });

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

        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        if (userRole === "PROJECT_MANAGER") {
            const project = await getProjectById(task.project_id);
            if (!project || project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to update tasks for this project" });
            }
        } else if (userRole === "RESOURCE") {
            const isAssigned = (task.assigned_resource_ids || []).includes(userId);
            if (!isAssigned) {
                return res.status(403).json({ message: "You are not authorized to update this task" });
            }
        }

        if (parsed.start_date && parsed.deadline && parsed.start_date > parsed.deadline) {
            return res.status(400).json({ message: "Deadline cannot be before start date" });
        }

        let shiftDays = 0;
        if (parsed.deadline && task.deadline) {
            const oldDeadline = new Date(task.deadline);
            const newDeadline = new Date(parsed.deadline);
            const diffTime = newDeadline.getTime() - oldDeadline.getTime();
            shiftDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        await updateTask(taskId, parsed);

        if (shiftDays > 0) {
            await propagateScheduleChanges(taskId, shiftDays);
        }

        if (parsed.status === "COMPLETED" && task.status !== "COMPLETED") {
            const today = new Date().toISOString().split("T")[0];
            if (today) {
                await handleTaskCompletionImpact(taskId, today);
            }
        }

        const updatedTask = await getTaskById(taskId);

        return res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask
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
        const userRole = req.user?.role;
        const userId = req.user?.user_id;
        const taskId = Number(req.params.id);
        const parsed = dependencySchema.parse(req.body);

        if (taskId === parsed.predecessor_task_id) {
            return res.status(400).json({ message: "A task cannot depend on itself" });
        }

        const task = await getTaskById(taskId) as any;
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const predTask = await getTaskById(parsed.predecessor_task_id) as any;
        if (!predTask) {
            return res.status(404).json({ message: "Predecessor task not found" });
        }

        if (userRole === "PROJECT_MANAGER") {
            const project = await getProjectById(task.project_id);
            if (!project || project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to manage dependencies for this project" });
            }
        }

        await addTaskDependency(taskId, parsed.predecessor_task_id);

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
        let resourceId = (req.params.resourceId && req.params.resourceId !== "me") 
            ? Number(req.params.resourceId) 
            : userId;

        if (isNaN(resourceId)) {
            resourceId = userId;
        }

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
        let resourceId = (req.params.resourceId && req.params.resourceId !== "me") 
            ? Number(req.params.resourceId) 
            : userId;

        if (isNaN(resourceId)) {
            resourceId = userId;
        }

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

export async function assignResource(
    req: AuthRequest<{ id: string }>,
    res: Response
) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({
                message: "Only project managers can assign resources"
            });
        }

        const taskId = Number(req.params.id);
        const resourceId = Number(req.body.user_id);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        if (!Number.isInteger(resourceId) || resourceId <= 0) {
            return res.status(400).json({
                message: "Invalid resource ID"
            });
        }

        const assignment = await assignResourceToTask(
            taskId,
            req.user.user_id,
            resourceId
        );

        return res.status(201).json({
            message: "Resource assigned to task successfully",
            assignment
        });
    } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (error.message === "RESOURCE_NOT_FOUND") {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        if (error.message === "RESOURCE_NOT_PROJECT_MEMBER") {
            return res.status(400).json({
                message: "Resource is not assigned to this project"
            });
        }

        if (error.message === "RESOURCE_ALREADY_ASSIGNED") {
            return res.status(409).json({
                message: "Resource is already assigned to this task"
            });
        }

        console.error("Assign resource to task error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

const workLogSchema = z.object({
    hours_logged: z.number().positive(),
    progress_logged: z.number().min(0).max(100),
    notes: z.string().min(1),
    log_date: z.string()
});

export async function addWorkLog(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const parsed = workLogSchema.parse(req.body);
        
        if (req.user?.role !== "RESOURCE") {
            return res.status(403).json({ message: "Only resources can log work" });
        }

        const log = await createWorkLog(
            taskId,
            req.user.user_id,
            parsed.hours_logged,
            parsed.progress_logged,
            parsed.notes,
            parsed.log_date
        );

        return res.status(201).json({ message: "Work log created successfully", log });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function getBottlenecksController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can view bottlenecks" });
        }
        const tasks = await getBottleneckTasks(req.user.user_id);
        return res.status(200).json({ tasks });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function getWorkLogs(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const logs = await getWorkLogsByTask(taskId);
        return res.status(200).json({ logs });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function deleteTaskController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can delete tasks" });
        }
        const taskId = Number((req.params as any).id);
        const task = await getTaskById(taskId) as any;
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        
        const project = await getProjectById(task.project_id);
        if (!project || project.project_manager_id !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to delete this task" });
        }
        
        const success = await deleteTask(taskId);
        if (!success) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function unassignResourceController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can unassign resources" });
        }
        const taskId = Number((req.params as any).id);
        const userId = Number((req.params as any).userId);
        
        const task = await getTaskById(taskId) as any;
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        const project = await getProjectById(task.project_id);
        if (!project || project.project_manager_id !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to modify this task" });
        }
        
        const success = await unassignResource(taskId, userId);
        if (!success) return res.status(404).json({ message: "Resource not assigned to task" });
        
        return res.status(200).json({ message: "Resource unassigned successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function removeTaskDependencyController(req: AuthRequest, res: Response) {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            return res.status(403).json({ message: "Only project managers can remove dependencies" });
        }
        const taskId = Number((req.params as any).id);
        const predecessorTaskId = Number((req.params as any).predecessorId);
        
        const task = await getTaskById(taskId) as any;
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        const project = await getProjectById(task.project_id);
        if (!project || project.project_manager_id !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to modify this task" });
        }
        
        const success = await removeTaskDependency(taskId, predecessorTaskId);
        if (!success) return res.status(404).json({ message: "Dependency not found" });
        
        return res.status(200).json({ message: "Dependency removed successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}