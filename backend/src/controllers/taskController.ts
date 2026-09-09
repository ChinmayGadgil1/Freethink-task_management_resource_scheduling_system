import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { createTask, getTasksList, getTaskById, assignResourceToTask, addTaskDependency, updateTask, getBottleneckTasks, deleteTask, moveToBinTask, unassignResource, removeTaskDependency, assignVerificationTask } from "../services/taskService.js";
import { getProjectById, isProjectMember, getProjectIdsByMember, getProjectsByManager } from "../services/projectService.js";
import { getResourceWorkload, checkSchedulingImpact } from "../services/schedulingService.js";
// Work log and task session services for progress tracking and co-assignee updates
import { createWorkLog, getWorkLogsByTask, getActiveSessionsForTask } from "../services/workLogService.js";
import { recalculate as recalculateSchedule } from "../services/scheduler/SchedulingEngine.js";

const createTaskSchema = z.object({
    project_id: z.number().int().positive(),
    title: z.string().min(1, "Task title is required"),
    description: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    status: z.enum(["UNASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]).optional(),
    deadline: z.string().nullable().optional(),
    expected_effort: z.number().positive("Expected effort must be positive"),
    assigned_resource_ids: z.array(z.number().int().positive()).optional(),
    supervisor_id: z.number().int().positive().nullable().optional()
});

function validateTaskDeadlineAgainstProject(
    taskDeadlineInput: string | null | undefined,
    project: any
): string | null {
    if (!taskDeadlineInput) {
        return null;
    }

    const taskDeadline = taskDeadlineInput.includes("T")
        ? taskDeadlineInput.split("T")[0]!
        : taskDeadlineInput;

    if (project.start_date) {
        const projStart = String(project.start_date).includes("T")
            ? String(project.start_date).split("T")[0]!
            : String(project.start_date);

        if (taskDeadline < projStart) {
            return `Task deadline (${taskDeadline}) cannot be earlier than project start date (${projStart})`;
        }
    }

    if (project.deadline) {
        const projDeadline = String(project.deadline).includes("T")
            ? String(project.deadline).split("T")[0]!
            : String(project.deadline);

        if (taskDeadline > projDeadline) {
            return `Task deadline (${taskDeadline}) cannot be later than project deadline (${projDeadline})`;
        }
    }

    return null;
}

export async function create(req: AuthRequest, res: Response) {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.user_id;
        const parsed = createTaskSchema.parse(req.body);

        const project = await getProjectById(parsed.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (userRole === "PROJECT_MANAGER" && project.project_manager_id !== userId) {
            return res.status(403).json({ message: "You are not authorized to manage tasks for this project" });
        } else if (userRole === "RESOURCE") {
            const isMember = await isProjectMember(parsed.project_id, userId!);
            if (!isMember) {
                return res.status(403).json({ message: "You can only create tasks in projects you are assigned to" });
            }
        }

        if (parsed.deadline) {
            const deadlineError = validateTaskDeadlineAgainstProject(parsed.deadline, project);
            if (deadlineError) {
                return res.status(400).json({ message: deadlineError });
            }
        }

        // If self-assigned by a RESOURCE, assign them automatically
        let resourceIds = parsed.assigned_resource_ids;
        if (userRole === "RESOURCE" && (!resourceIds || resourceIds.length === 0)) {
            resourceIds = [req.user!.user_id];
        }

        // Determine status based on assignment presence if not explicitly provided
        let taskStatus = parsed.status;
        if (!taskStatus) {
            taskStatus = (resourceIds && resourceIds.length > 0) ? "SCHEDULED" : "UNASSIGNED";
        }

        const task = await createTask(
            parsed.project_id,
            userId!,
            parsed.title,
            parsed.description ?? null,
            parsed.priority,
            taskStatus as any,
            parsed.deadline ?? null,
            parsed.expected_effort,
            resourceIds,
            parsed.supervisor_id ?? null
        );

        // Hook to trigger recalculation for the project
        try {
            await recalculateSchedule(parsed.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation on task create:", scheduleErr);
        }

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
        const scope = typeof req.query.scope === "string" ? req.query.scope : undefined;

        let projectIds: number[] | undefined;
        let actualResourceId = resourceId;
        let assignedOrSupervisedUserId: number | undefined;

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
            if (scope === "assigned") {
                actualResourceId = userId;
            } else if (scope === "supervised") {
                // Will filter tasks where supervisor_id = userId
                assignedOrSupervisedUserId = userId;
            } else {
                // Default: resources see all tasks they are assigned to OR supervise
                assignedOrSupervisedUserId = userId;
            }

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

        const tasks = await getTasksList({
            resourceId: actualResourceId,
            projectIds,
            assignedOrSupervisedByUserId: assignedOrSupervisedUserId
        });

        // If scope is explicitly 'supervised', filter in memory if needed
        const filteredTasks = (userRole === "RESOURCE" && scope === "supervised")
            ? tasks.filter(t => Number(t.supervisor_id) === userId)
            : tasks;

        return res.status(200).json({ tasks: filteredTasks });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function getTaskController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        const task = await getTaskById(taskId) as any;
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await getProjectById(task.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (userRole === "PROJECT_MANAGER") {
            if (project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to view this task" });
            }
        } else if (userRole === "RESOURCE") {
            const isMember = await isProjectMember(task.project_id, userId!);
            if (!isMember) {
                return res.status(403).json({ message: "You are not authorized to view this task" });
            }
        }

        return res.status(200).json({ task });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    supervisor_id: z.number().int().positive().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    status: z.enum(["UNASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]).optional(),
    deadline: z.string().nullable().optional(),
    expected_effort: z.number().positive().optional(),
    actual_effort: z.number().nonnegative().optional(),
    progress: z.number().min(0).max(100).optional()
});

const dependencySchema = z.object({
    predecessor_task_id: z.number().int().positive()
});

const checkImpactSchema = z.object({
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

        const project = await getProjectById(task.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (userRole === "PROJECT_MANAGER") {
            if (project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to update tasks for this project" });
            }
        } else if (userRole === "RESOURCE") {
            const isAssigned = (task.assigned_resource_ids || []).includes(userId);
            if (!isAssigned) {
                return res.status(403).json({ message: "You are not authorized to alter progress or update this task. Only assigned resources can make updates." });
            }
        }

        if (parsed.deadline !== undefined && parsed.deadline !== null) {
            const deadlineError = validateTaskDeadlineAgainstProject(parsed.deadline, project);
            if (deadlineError) {
                return res.status(400).json({ message: deadlineError });
            }
        }

        /* BACKEND STATUS & PROGRESS SYNCHRONIZATION:
        Automatically sync task status and progress if one is provided without the other:
            0% progress     -> 'SCHEDULED'
            100% progress   -> 'COMPLETED'
            1% - 99% progress -> 'IN_PROGRESS'
        If status is explicitly updated without progress:
         - 'COMPLETED' -> 100% progress
         - 'SCHEDULED' -> 0% progress */
        if (parsed.progress !== undefined && parsed.status === undefined) {
            if (parsed.progress <= 0) {
                parsed.status = "SCHEDULED";
            } else if (parsed.progress >= 100) {
                parsed.status = "COMPLETED";
            } else {
                parsed.status = "IN_PROGRESS";
            }
        } else if (parsed.status !== undefined && parsed.progress === undefined) {
            if (parsed.status === "COMPLETED") {
                parsed.progress = 100;
            } else if (parsed.status === "SCHEDULED") {
                parsed.progress = 0;
            }
        }

        await updateTask(taskId, parsed);

        // Hook SchedulingEngine.recalculate when priority, effort, deadline, or status updates
        if (
            parsed.priority !== undefined ||
            parsed.expected_effort !== undefined ||
            parsed.deadline !== undefined ||
            parsed.status !== undefined
        ) {
            try {
                await recalculateSchedule(task.project_id);
            } catch (scheduleErr) {
                console.error("Error triggering schedule recalculation on task update:", scheduleErr);
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

        if (task.project_id !== predTask.project_id) {
            return res.status(400).json({ message: "Dependencies cannot be added between tasks in different projects" });
        }

        if (userRole === "PROJECT_MANAGER") {
            const project = await getProjectById(task.project_id);
            if (!project || project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to manage dependencies for this project" });
            }
        }

        await addTaskDependency(taskId, parsed.predecessor_task_id);

        // Hook recalculation
        try {
            await recalculateSchedule(task.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation on addDependency:", scheduleErr);
        }

        return res.status(200).json({ message: "Dependency added successfully" });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        if (
            error.message &&
            (error.message.includes("circular dependency") ||
                error.message.includes("Cross-project") ||
                error.message.includes("depend on itself") ||
                error.message.includes("Cannot add dependency"))
        ) {
            return res.status(400).json({ message: error.message });
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

        let pmProjectIds: Set<number> | undefined = undefined;
        if (userRole === "PROJECT_MANAGER") {
            const pmProjects = await getProjectsByManager(userId);
            pmProjectIds = new Set(pmProjects.map(p => Number(p.project_id)));
        }

        const workload = await getResourceWorkload(resourceId, pmProjectIds);
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

        // Hook recalculation
        try {
            await recalculateSchedule(assignment.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation on assignResource:", scheduleErr);
        }

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
    status: z.enum(["UNASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]),
    notes: z.string().min(1),
    blockers: z.string().nullable().optional(),
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
            parsed.status,
            parsed.notes,
            parsed.blockers ?? null,
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
        const userRole = req.user!.role;
        const userId = req.user!.user_id;

        const task = await getTaskById(taskId) as any;

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (userRole === "RESOURCE") {
            const isAssigned = (task.assigned_resource_ids || []).includes(userId);
            const isSupervisor = Number(task.supervisor_id) === userId;

            if (!isAssigned && !isSupervisor) {
                return res.status(403).json({
                    message: "You are not authorized to view this task's progress history"
                });
            }
        } else if (userRole === "PROJECT_MANAGER") {
            const project = await getProjectById(task.project_id);

            if (!project || project.project_manager_id !== userId) {
                return res.status(403).json({
                    message: "You are not authorized to view this task's progress history"
                });
            }
        }

        const logs = await getWorkLogsByTask(taskId);

        return res.status(200).json({ logs });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Internal server error"
        });
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
        
        const result = await moveToBinTask(taskId);
        if (!result.success) {
            return res.status(400).json({ message: result.message || "Failed to move task to bin" });
        }

        // Hook recalculation
        try {
            await recalculateSchedule(task.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation on deleteTask:", scheduleErr);
        }

        return res.status(200).json({ message: "Task moved to Recycle Bin successfully" });
    } catch (error: any) {
        if (error.message && error.message.startsWith("CANNOT_DELETE_ACTIVE_TASK")) {
            return res.status(400).json({
                message: error.message.replace("CANNOT_DELETE_ACTIVE_TASK: ", "")
            });
        }
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
        
        // Hook recalculation
        try {
            await recalculateSchedule(task.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation on unassignResource:", scheduleErr);
        }

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
        
        // Hook recalculation
        try {
            await recalculateSchedule(task.project_id);
        } catch (scheduleErr) {
            console.error("Error triggering schedule recalculation on removeTaskDependency:", scheduleErr);
        }

        return res.status(200).json({ message: "Dependency removed successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function startSessionController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        if (req.user?.role !== "RESOURCE") {
            return res.status(403).json({ message: "Only resources can start a session" });
        }
        const taskId = Number(req.params.id);
        const { startSession } = await import("../services/workLogService.js");
        const session = await startSession(taskId, req.user.user_id);
        return res.status(201).json({ message: "Session started", session });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

const stopSessionSchema = z.object({
    progress_logged: z.number().min(0).max(100),
    notes: z.string().min(1),
    blockers: z.string().nullable().optional()
});

export async function stopSessionController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        if (req.user?.role !== "RESOURCE") {
            return res.status(403).json({ message: "Only resources can stop a session" });
        }
        const parsed = stopSessionSchema.parse(req.body);
        const { stopSession } = await import("../services/workLogService.js");
        const log = await stopSession(
            req.user.user_id,
            parsed.progress_logged,
            parsed.notes,
            parsed.blockers ?? null
        );
        return res.status(200).json({ message: "Session stopped and work logged", log });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

export async function getActiveSessionController(req: AuthRequest, res: Response) {
    try {
        if (!req.user || req.user.role !== "RESOURCE") {
            return res.status(200).json({ session: null });
        }
        const { getActiveSession } = await import("../services/workLogService.js");
        const session = await getActiveSession(req.user.user_id);
        return res.status(200).json({ session: session || null });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

// Fetch all active sessions on a specific task so co-assigned resources can see live work in progress
export async function getTaskActiveSessionsController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        // Verify task exists
        const task = await getTaskById(taskId) as any;
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Verify authorization: resources must be assigned to this task; PM must own the project
        if (userRole === "RESOURCE") {
            const isAssigned = (task.assigned_resource_ids || []).includes(userId);
            if (!isAssigned) {
                return res.status(403).json({
                    message: "You are not authorized to view active sessions for this task"
                });
            }
        } else if (userRole === "PROJECT_MANAGER") {
            const project = await getProjectById(task.project_id);
            if (!project || project.project_manager_id !== userId) {
                return res.status(403).json({
                    message: "You are not authorized to view active sessions for this task"
                });
            }
        }

        // Retrieve active sessions for this task across all assigned co-resources
        const sessions = await getActiveSessionsForTask(taskId);
        return res.status(200).json({ sessions });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}

const assignVerificationSchema = z.object({
    verifier_id: z.number().int().positive("Verifier ID is required"),
    notes: z.string().optional(),
    expected_effort: z.number().positive().optional()
});

export async function assignVerificationController(req: AuthRequest<{ id: string }>, res: Response) {
    try {
        const taskId = Number(req.params.id);
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const task = await getTaskById(taskId) as any;
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await getProjectById(task.project_id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Authorization check: User must be PM of the project or a resource on the project / assigned to the task
        if (userRole === "PROJECT_MANAGER") {
            if (project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to assign verification for this task" });
            }
        } else if (userRole === "RESOURCE") {
            const isMember = await isProjectMember(task.project_id, userId);
            const isAssigned = (task.assigned_resource_ids || []).includes(userId);
            if (!isMember && !isAssigned) {
                return res.status(403).json({ message: "You are not authorized to assign verification for this task" });
            }
        }

        const parsed = assignVerificationSchema.parse(req.body);

        const result = await assignVerificationTask(
            taskId,
            parsed.verifier_id,
            userId,
            parsed.notes,
            parsed.expected_effort
        );

        return res.status(201).json({
            message: "Verification task assigned successfully",
            verification_task: result
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        if (error.message && (error.message.includes("INVALID_VERIFIER") || error.message.includes("CANNOT_VERIFY_OWN_TASK"))) {
            return res.status(400).json({ message: error.message.replace(/^[A-Z_]+:\s*/, "") });
        }
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}