import { getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2";
import { recalculate as recalculateSchedule, canCompleteBy, calculateRisks } from "./scheduler/SchedulingEngine.js";
import type { Task, TaskPriority } from "../models/taskModel.js";

export interface TaskWorkload {
    task_id: number;
    project_id: number;
    project_name: string;
    title: string;
    priority: string;
    status: string;
    deadline: string | null;
    planned_start: string | null;
    planned_end: string | null;
    expected_effort: number;
    actual_effort: number;
    progress: number;
    is_schedule_at_risk: boolean;
    is_deadline_at_risk: boolean;
}

/**
 * Triggers full dependency CPM and priority scheduling recalculation for a project
 */
export async function recalculateProjectSchedule(projectId: number): Promise<void> {
    await recalculateSchedule(projectId);
}

/**
 * Fetches the complete schedule data for a project for Gantt and calendar visualization
 */
export async function getProjectSchedule(projectId: number) {
    const pool = getPool();

    // 1. Fetch project details
    const [projectRows] = await pool.query<RowDataPacket[]>(
        `SELECT project_id, name, status, priority, start_date, deadline, progress
         FROM projects
         WHERE project_id = ?`,
        [projectId]
    );

    if (projectRows.length === 0) {
        return null;
    }
    const project = projectRows[0]!;

    // 2. Fetch project tasks with assignees, dependencies, and calculated risks
    const [tasks] = await pool.query<RowDataPacket[]>(
        `SELECT t.*,
                GROUP_CONCAT(DISTINCT ta.user_id) as assigned_resource_ids,
                GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
         FROM tasks t
         LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
         LEFT JOIN task_dependencies td ON t.task_id = td.task_id
         WHERE t.project_id = ?
         GROUP BY t.task_id
         ORDER BY t.created_at ASC`,
        [projectId]
    );

    // 3. Fetch project task_schedules (Gantt daily allocations)
    const [schedules] = await pool.query<RowDataPacket[]>(
        `SELECT ts.*, u.name as resource_name
         FROM task_schedules ts
         JOIN tasks t ON ts.task_id = t.task_id
         LEFT JOIN users u ON ts.user_id = u.user_id
         WHERE t.project_id = ?
         ORDER BY ts.schedule_date ASC`,
        [projectId]
    );

    // 4. Fetch holidays
    const [holidays] = await pool.query<RowDataPacket[]>(
        `SELECT holiday_id, holiday_date, description FROM holidays ORDER BY holiday_date ASC`
    );

    // 5. Transform tasks with risk and pacing indicators
    const todayStr = new Date().toISOString().split("T")[0]!;
    const formattedTasks = tasks.map(t => {
        const expected = Number(t.expected_effort || 0);
        const actual = Number(t.actual_effort || 0);
        const isOverrun = actual > expected;
        const isBehindSchedule = !['COMPLETED'].includes(t.status) && (
            (t.deadline && String(t.deadline).split("T")[0]! < todayStr) ||
            isOverrun
        );

        return {
            task_id: Number(t.task_id),
            project_id: Number(t.project_id),
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            deadline: t.deadline ? String(t.deadline).split("T")[0]! : null,
            planned_start: t.planned_start ? String(t.planned_start).split("T")[0]! : null,
            planned_end: t.planned_end ? String(t.planned_end).split("T")[0]! : null,
            actual_start: t.actual_start ?? null,
            actual_end: t.actual_end ?? null,
            expected_effort: expected,
            actual_effort: actual,
            progress: Number(t.progress || 0),
            is_schedule_at_risk: Boolean(t.is_schedule_at_risk),
            is_deadline_at_risk: Boolean(t.is_deadline_at_risk),
            assigned_resource_ids: t.assigned_resource_ids
                ? String(t.assigned_resource_ids).split(",").map(Number)
                : [],
            predecessor_task_ids: t.predecessor_task_ids
                ? String(t.predecessor_task_ids).split(",").map(Number)
                : [],
            pacing: {
                is_overrun: isOverrun,
                is_behind_schedule: isBehindSchedule,
                warning: t.is_deadline_at_risk
                    ? "Deadline at risk"
                    : (t.is_schedule_at_risk ? "Schedule at risk" : (isBehindSchedule ? "Past deadline" : null))
            }
        };
    });

    return {
        project: {
            project_id: project.project_id,
            name: project.name,
            status: project.status,
            priority: project.priority,
            start_date: project.start_date,
            deadline: project.deadline,
            progress: project.progress
        },
        tasks: formattedTasks,
        schedules,
        holidays
    };
}

/**
 * Calculates a resource's workload across all projects, including daily scheduled allocations.
 */
export async function getResourceWorkload(resourceId: number) {
    const pool = getPool();

    // Fetch all active/scheduled tasks assigned to the resource across all projects
    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.*, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        JOIN task_assignments ta ON t.task_id = ta.task_id
        WHERE ta.user_id = ? AND t.status IN ('SCHEDULED', 'IN_PROGRESS')
        ORDER BY t.deadline ASC
        `,
        [resourceId]
    );

    // Fetch daily allocated hours from task_schedules for this resource
    const [scheduleRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT schedule_date, SUM(allocated_hours) as total_hours
        FROM task_schedules
        WHERE user_id = ? AND schedule_date >= CURDATE()
        GROUP BY schedule_date
        ORDER BY schedule_date ASC
        `,
        [resourceId]
    );

    let totalExpectedEffort = 0;
    let totalActualEffort = 0;
    const taskDetails: TaskWorkload[] = [];

    for (const row of tasks) {
        totalExpectedEffort += Number(row.expected_effort);
        totalActualEffort += Number(row.actual_effort);
        taskDetails.push({
            task_id: Number(row.task_id),
            project_id: Number(row.project_id),
            project_name: row.project_name,
            title: row.title,
            priority: row.priority,
            status: row.status,
            deadline: row.deadline ? String(row.deadline).split("T")[0]! : null,
            planned_start: row.planned_start ? String(row.planned_start).split("T")[0]! : null,
            planned_end: row.planned_end ? String(row.planned_end).split("T")[0]! : null,
            expected_effort: Number(row.expected_effort),
            actual_effort: Number(row.actual_effort),
            progress: Number(row.progress),
            is_schedule_at_risk: Boolean(row.is_schedule_at_risk),
            is_deadline_at_risk: Boolean(row.is_deadline_at_risk)
        });
    }

    const dailyAllocations = scheduleRows.map(row => ({
        date: String(row.schedule_date).split("T")[0]!,
        allocated_hours: Number(row.total_hours)
    }));

    return {
        resource_id: resourceId,
        active_tasks_count: taskDetails.length,
        total_expected_effort: totalExpectedEffort,
        total_actual_effort: totalActualEffort,
        daily_allocations: dailyAllocations,
        tasks: taskDetails
    };
}

/**
 * Checks scheduling impact when assigning or sizing a task for a resource,
 * accounting for 9h daily capacity, company holidays, and leaves.
 */
export async function checkSchedulingImpact(
    resourceId: number,
    deadlineStr: string,
    priority: TaskPriority,
    expectedEffort: number
) {
    const pool = getPool();
    const cleanDeadline = deadlineStr.includes("T") ? deadlineStr.split("T")[0]! : deadlineStr;

    // Fetch user leaves
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `SELECT leave_date, leave_hours FROM user_leaves WHERE user_id = ?`,
        [resourceId]
    );
    const leavesMap = new Map<number, Map<string, number>>();
    const userLeaves = new Map<string, number>();
    for (const row of leaveRows) {
        userLeaves.set(String(row.leave_date).split("T")[0]!, Number(row.leave_hours));
    }
    leavesMap.set(resourceId, userLeaves);

    // Fetch holidays
    const [holidayRows] = await pool.query<RowDataPacket[]>(`SELECT holiday_date FROM holidays`);
    const holidays = new Set<string>();
    for (const row of holidayRows) {
        holidays.add(String(row.holiday_date).split("T")[0]!);
    }

    const taskResources = new Map<number, number[]>();
    taskResources.set(0, [resourceId]);

    const dummyTask: Task = {
        task_id: 0,
        project_id: 0,
        title: "Impact Check Task",
        description: null,
        priority: priority,
        status: "SCHEDULED",
        deadline: cleanDeadline,
        actual_start: null,
        actual_end: null,
        expected_effort: expectedEffort,
        actual_effort: 0,
        progress: 0,
        created_at: new Date(),
        updated_at: new Date()
    };

    const isFeasible = canCompleteBy(
        dummyTask,
        cleanDeadline,
        taskResources,
        holidays,
        leavesMap
    );

    const workloadInfo = await getResourceWorkload(resourceId);

    return {
        resource_id: resourceId,
        target_deadline: cleanDeadline,
        expected_effort: expectedEffort,
        is_deadline_achievable: isFeasible,
        capacity_exceeded: !isFeasible,
        active_tasks_count: workloadInfo.active_tasks_count,
        warning: !isFeasible
            ? `Warning: Resource cannot complete ${expectedEffort}h of work before ${cleanDeadline} due to existing capacity/holidays/leaves.`
            : null
    };
}
