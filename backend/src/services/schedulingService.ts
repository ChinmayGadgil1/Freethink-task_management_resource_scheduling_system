import { getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2";
import { getTaskById, updateTask } from "./taskService.js";

interface TaskWorkload {
    task_id: number;
    project_id: number;
    project_name: string;
    title: string;
    priority: string;
    status: string;
    start_date: string | null;
    deadline: string | null;
    expected_effort: number;
    actual_effort: number;
    progress: number;
}

/**
 * Calculates a resource's workload across all projects, including detailed allocations and timeline load.
 */
export async function getResourceWorkload(resourceId: number) {
    const pool = getPool();

    // Fetch all active/pending tasks assigned to the resource across all projects
    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.*, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        JOIN task_assignments ta ON t.task_id = ta.task_id
        WHERE ta.user_id = ? AND t.status IN ('PENDING', 'IN_PROGRESS', 'ON_HOLD')
        ORDER BY t.start_date ASC
        `,
        [resourceId]
    );

    let totalExpectedEffort = 0;
    let totalActualEffort = 0;
    const taskDetails: TaskWorkload[] = [];

    for (const row of tasks) {
        const task = row as TaskWorkload;
        totalExpectedEffort += Number(task.expected_effort);
        totalActualEffort += Number(task.actual_effort);
        taskDetails.push({
            task_id: Number(task.task_id),
            project_id: Number(task.project_id),
            project_name: task.project_name,
            title: task.title,
            priority: task.priority,
            status: task.status,
            start_date: task.start_date,
            deadline: task.deadline,
            expected_effort: Number(task.expected_effort),
            actual_effort: Number(task.actual_effort),
            progress: Number(task.progress)
        });
    }

    return {
        resource_id: resourceId,
        active_tasks_count: taskDetails.length,
        total_expected_effort: totalExpectedEffort,
        total_actual_effort: totalActualEffort,
        tasks: taskDetails
    };
}

/**
 * Recursively propagates deadline shifts/delays to successor tasks in the dependency chain.
 */
export async function propagateScheduleChanges(taskId: number, shiftDays: number): Promise<void> {
    if (shiftDays === 0) return;

    const pool = getPool();

    // Find all successor tasks of the current task
    const [successors] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.* 
        FROM tasks t
        JOIN task_dependencies td ON t.task_id = td.task_id
        WHERE td.predecessor_task_id = ?
        `,
        [taskId]
    );

    for (const succ of successors) {
        const succId = Number(succ.task_id);
        const updates: Record<string, any> = {};

        if (succ.start_date) {
            const newStart = new Date(succ.start_date);
            newStart.setDate(newStart.getDate() + shiftDays);
            updates.start_date = newStart.toISOString().split("T")[0];
        }

        if (succ.deadline) {
            const newDeadline = new Date(succ.deadline);
            newDeadline.setDate(newDeadline.getDate() + shiftDays);
            updates.deadline = newDeadline.toISOString().split("T")[0];
        }

        if (Object.keys(updates).length > 0) {
            await updateTask(succId, updates);
            // Recursively propagate the shift to its successors
            await propagateScheduleChanges(succId, shiftDays);
        }
    }
}

/**
 * Checks the scheduling impact when introducing or changing task parameters for a resource.
 */
export async function checkSchedulingImpact(
    resourceId: number,
    startDateStr: string,
    deadlineStr: string,
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    expectedEffort: number
) {
    const workloadInfo = await getResourceWorkload(resourceId);
    const start = new Date(startDateStr);
    const end = new Date(deadlineStr);
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const taskDailyLoad = expectedEffort / durationDays;

    const overlappingTasks: TaskWorkload[] = [];
    let overlapDailyLoad = 0;

    for (const t of workloadInfo.tasks) {
        if (!t.start_date || !t.deadline) continue;
        const tStart = new Date(t.start_date);
        const tEnd = new Date(t.deadline);

        // Check if date ranges overlap
        if (start <= tEnd && end >= tStart) {
            overlappingTasks.push(t);
            const tDuration = Math.max(1, Math.ceil((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)));
            overlapDailyLoad += t.expected_effort / tDuration;
        }
    }

    const totalDailyLoad = overlapDailyLoad + taskDailyLoad;
    const capacityExceeded = totalDailyLoad > 8; // Assumes standard 8-hour daily capacity

    return {
        resource_id: resourceId,
        overlap_daily_load: overlapDailyLoad,
        new_task_daily_load: taskDailyLoad,
        total_daily_load: totalDailyLoad,
        capacity_exceeded: capacityExceeded,
        overlapping_tasks_count: overlappingTasks.length,
        overlapping_tasks: overlappingTasks.map(t => ({
            task_id: t.task_id,
            title: t.title,
            priority: t.priority,
            start_date: t.start_date,
            deadline: t.deadline,
            expected_effort: t.expected_effort
        })),
        warning: capacityExceeded
            ? `Warning: Resource daily commitment (${totalDailyLoad.toFixed(1)} hrs) exceeds 8-hour daily capacity.`
            : null
    };
}
