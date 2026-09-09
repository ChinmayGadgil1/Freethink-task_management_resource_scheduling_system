import { getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2";
import {
    recalculate as recalculateSchedule,
    canCompleteBy,
    calculateRisks,
    parseResourceScheduleConfig,
    getWeekdayFromDate,
    formatDateLocal,
    parseDateLocal,
    type ResourceScheduleConfig
} from "./scheduler/SchedulingEngine.js";
import type { Task, TaskPriority } from "../models/taskModel.js";
import type {
    AvailabilityStatus,
    DailyAvailabilityDTO,
    ResourceAvailabilityResponseDTO,
    DayOfWeek
} from "../models/resourceScheduleModel.js";

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
    is_external?: boolean;
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
        `SELECT project_id, project_manager_id, name, description, status, priority, start_date, deadline, progress, created_at, updated_at
         FROM projects
         WHERE project_id = ?
           AND deleted_at IS NULL`,
        [projectId]
    );

    if (projectRows.length === 0) {
        return null;
    }
    const project = projectRows[0]!;

    // 2. Fetch project tasks with assignees, dependencies, and calculated risks (excluding special verification tasks from Gantt)
    const [tasks] = await pool.query<RowDataPacket[]>(
        `SELECT t.*,
                GROUP_CONCAT(DISTINCT ta.user_id) as assigned_resource_ids,
                GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
         FROM tasks t
         LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
         LEFT JOIN task_dependencies td ON t.task_id = td.task_id
         WHERE t.project_id = ?
           AND t.deleted_at IS NULL
           AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
           AND t.verified_task_id IS NULL
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
           AND t.deleted_at IS NULL
           AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
           AND t.verified_task_id IS NULL
         ORDER BY ts.schedule_date ASC`,
        [projectId]
    );

    // Fetch assignees with profile names
    const taskIds = tasks.map(t => t.task_id);
    const assignmentMap = new Map<number, { user_id: number; name: string; email: string }[]>();
    if (taskIds.length > 0) {
        const [assignments] = await pool.query<RowDataPacket[]>(
            `SELECT ta.task_id, ta.user_id, u.name as resource_name, u.email as resource_email
             FROM task_assignments ta
             JOIN users u ON ta.user_id = u.user_id
             WHERE ta.task_id IN (?)`,
            [taskIds]
        );
        for (const a of assignments) {
            const tId = Number(a.task_id);
            if (!assignmentMap.has(tId)) {
                assignmentMap.set(tId, []);
            }
            assignmentMap.get(tId)!.push({
                user_id: Number(a.user_id),
                name: String(a.resource_name),
                email: String(a.resource_email)
            });
        }
    }

    // 4. Fetch holidays
    const [holidays] = await pool.query<RowDataPacket[]>(
        `SELECT holiday_id, holiday_date, description FROM holidays ORDER BY holiday_date ASC`
    );

    const scheduleMap = new Map<number, any[]>();
    for (const s of schedules) {
        const tId = Number(s.task_id);
        if (!scheduleMap.has(tId)) {
            scheduleMap.set(tId, []);
        }
        scheduleMap.get(tId)!.push({
            schedule_id: Number(s.schedule_id),
            task_id: tId,
            user_id: Number(s.user_id),
            schedule_date: s.schedule_date instanceof Date ? s.schedule_date.toISOString().split("T")[0] : String(s.schedule_date).split("T")[0],
            allocated_hours: Number(Number(s.allocated_hours).toFixed(2)),
            schedule_version: Number(s.schedule_version),
            resource_name: s.resource_name || undefined
        });
    }

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
            assigned_resources: assignmentMap.get(Number(t.task_id)) || [],
            predecessor_task_ids: t.predecessor_task_ids
                ? String(t.predecessor_task_ids).split(",").map(Number)
                : [],
            schedules: scheduleMap.get(Number(t.task_id)) || [],
            is_external: false,
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
 * Fetches the schedule dataset for a specific resource for Gantt visualization.
 * When requested by a Project Manager (pmProjectIds is provided):
 * ONLY tasks belonging to the PM's managed projects are returned (other projects' tasks are completely skipped/omitted).
 */
export async function getResourceSchedule(resourceId: number, pmProjectIds?: Set<number>) {
    const pool = getPool();

    // 1. Fetch resource details
    const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id, name, email, role, is_active, non_working_days, daily_working_hours
         FROM users
         WHERE user_id = ?`,
        [resourceId]
    );

    if (userRows.length === 0) {
        return null;
    }
    const resource = userRows[0]!;

    // 2. Fetch all tasks assigned to this resource (with project info & dependency links)
    const [tasks] = await pool.query<RowDataPacket[]>(
        `SELECT t.*,
                p.name as project_name,
                GROUP_CONCAT(DISTINCT ta_all.user_id) as assigned_resource_ids,
                GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
         FROM tasks t
         JOIN projects p ON t.project_id = p.project_id
         JOIN task_assignments ta ON t.task_id = ta.task_id
         LEFT JOIN task_assignments ta_all ON t.task_id = ta_all.task_id
         LEFT JOIN task_dependencies td ON t.task_id = td.task_id
         WHERE ta.user_id = ?
           AND t.deleted_at IS NULL
           AND p.deleted_at IS NULL
           AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
           AND t.verified_task_id IS NULL
         GROUP BY t.task_id
         ORDER BY t.planned_start ASC, t.created_at ASC`,
        [resourceId]
    );

    // If pmProjectIds is provided, strictly filter to tasks belonging to PM-controlled projects (skip others entirely)
    const visibleTasks = pmProjectIds
        ? tasks.filter(t => pmProjectIds.has(Number(t.project_id)))
        : tasks;

    const visibleTaskIds = new Set(visibleTasks.map(t => Number(t.task_id)));

    // 3. Fetch task_schedules for this resource
    const [schedules] = await pool.query<RowDataPacket[]>(
        `SELECT ts.*, u.name as resource_name
         FROM task_schedules ts
         JOIN tasks t ON ts.task_id = t.task_id
         JOIN projects p ON t.project_id = p.project_id
         LEFT JOIN users u ON ts.user_id = u.user_id
         WHERE ts.user_id = ?
           AND t.deleted_at IS NULL
           AND p.deleted_at IS NULL
           AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
           AND t.verified_task_id IS NULL
         ORDER BY ts.schedule_date ASC`,
        [resourceId]
    );

    const visibleSchedules = pmProjectIds
        ? schedules.filter(s => visibleTaskIds.has(Number(s.task_id)))
        : schedules;

    // Fetch assignees with profile names for visible tasks
    const assignmentMap = new Map<number, { user_id: number; name: string; email: string }[]>();
    const visibleTaskIdsArray = Array.from(visibleTaskIds);
    if (visibleTaskIdsArray.length > 0) {
        const [assignments] = await pool.query<RowDataPacket[]>(
            `SELECT ta.task_id, ta.user_id, u.name as resource_name, u.email as resource_email
             FROM task_assignments ta
             JOIN users u ON ta.user_id = u.user_id
             WHERE ta.task_id IN (?)`,
            [visibleTaskIdsArray]
        );
        for (const a of assignments) {
            const tId = Number(a.task_id);
            if (!assignmentMap.has(tId)) {
                assignmentMap.set(tId, []);
            }
            assignmentMap.get(tId)!.push({
                user_id: Number(a.user_id),
                name: String(a.resource_name),
                email: String(a.resource_email)
            });
        }
    }

    // 4. Fetch holidays
    const [holidays] = await pool.query<RowDataPacket[]>(
        `SELECT holiday_id, holiday_date, description FROM holidays ORDER BY holiday_date ASC`
    );

    const scheduleMap = new Map<number, any[]>();
    for (const s of visibleSchedules) {
        const tId = Number(s.task_id);
        if (!scheduleMap.has(tId)) {
            scheduleMap.set(tId, []);
        }
        scheduleMap.get(tId)!.push({
            schedule_id: Number(s.schedule_id),
            task_id: tId,
            user_id: Number(s.user_id),
            schedule_date: s.schedule_date instanceof Date ? s.schedule_date.toISOString().split("T")[0] : String(s.schedule_date).split("T")[0],
            allocated_hours: Number(Number(s.allocated_hours).toFixed(2)),
            schedule_version: Number(s.schedule_version),
            resource_name: s.resource_name || undefined
        });
    }

    const todayStr = new Date().toISOString().split("T")[0]!;

    // 5. Transform visible tasks
    const formattedTasks = visibleTasks.map(t => {
        const projectId = Number(t.project_id);
        const expected = Number(t.expected_effort || 0);
        const actual = Number(t.actual_effort || 0);
        const isOverrun = actual > expected;
        const isBehindSchedule = !['COMPLETED'].includes(t.status) && (
            (t.deadline && String(t.deadline).split("T")[0]! < todayStr) ||
            isOverrun
        );

        return {
            task_id: Number(t.task_id),
            project_id: projectId,
            project_name: t.project_name,
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
                : [resourceId],
            assigned_resources: assignmentMap.get(Number(t.task_id)) || [],
            predecessor_task_ids: t.predecessor_task_ids
                ? String(t.predecessor_task_ids).split(",").map(Number)
                : [],
            schedules: scheduleMap.get(Number(t.task_id)) || [],
            is_external: false,
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
        resource: {
            user_id: resource.user_id,
            name: resource.name,
            email: resource.email,
            role: resource.role,
            is_active: resource.is_active,
            daily_working_hours: resource.daily_working_hours
        },
        tasks: formattedTasks,
        schedules: visibleSchedules,
        holidays,
        pm_project_ids: pmProjectIds ? Array.from(pmProjectIds) : undefined
    };
}

/**
 * Calculates a resource's workload.
 * When requested by a Project Manager (pmProjectIds is provided):
 * ONLY tasks belonging to the PM's managed projects are counted.
 */
export async function getResourceWorkload(resourceId: number, pmProjectIds?: Set<number>) {
    const pool = getPool();

    // Fetch active/scheduled tasks assigned to the resource
    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.*, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        JOIN task_assignments ta ON t.task_id = ta.task_id
        WHERE ta.user_id = ? AND t.status IN ('SCHEDULED', 'IN_PROGRESS')
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
          AND t.verified_task_id IS NULL
        ORDER BY t.deadline ASC
        `,
        [resourceId]
    );

    const visibleTasks = pmProjectIds
        ? tasks.filter(t => pmProjectIds.has(Number(t.project_id)))
        : tasks;

    const visibleTaskIds = new Set(visibleTasks.map(t => Number(t.task_id)));

    // Fetch daily allocated hours from task_schedules for this resource
    const [scheduleRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT ts.schedule_date, ts.task_id, ts.allocated_hours
        FROM task_schedules ts
        JOIN tasks t ON ts.task_id = t.task_id
        WHERE ts.user_id = ? AND ts.schedule_date >= CURDATE()
          AND t.deleted_at IS NULL
          AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
          AND t.verified_task_id IS NULL
        ORDER BY ts.schedule_date ASC
        `,
        [resourceId]
    );

    const visibleScheduleRows = pmProjectIds
        ? scheduleRows.filter(s => visibleTaskIds.has(Number(s.task_id)))
        : scheduleRows;

    const dailyMap = new Map<string, number>();
    for (const r of visibleScheduleRows) {
        const d = String(r.schedule_date).split("T")[0]!;
        dailyMap.set(d, (dailyMap.get(d) || 0) + Number(r.allocated_hours));
    }
    const dailyAllocations = Array.from(dailyMap.entries()).map(([date, allocated_hours]) => ({
        date,
        allocated_hours
    }));

    let totalExpectedEffort = 0;
    let totalActualEffort = 0;
    const taskDetails: TaskWorkload[] = [];

    for (const row of visibleTasks) {
        totalExpectedEffort += Number(row.expected_effort);
        totalActualEffort += Number(row.actual_effort);
        const projectId = Number(row.project_id);

        taskDetails.push({
            task_id: Number(row.task_id),
            project_id: projectId,
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
            is_deadline_at_risk: Boolean(row.is_deadline_at_risk),
            is_external: false
        });
    }

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
 * accounting for resource-specific daily working hours, non-working days, company holidays, and leaves.
 */
export async function checkSchedulingImpact(
    resourceId: number,
    deadlineStr: string,
    priority: TaskPriority,
    expectedEffort: number
) {
    const pool = getPool();
    const cleanDeadline = deadlineStr.includes("T") ? deadlineStr.split("T")[0]! : deadlineStr;

    // Fetch user schedule configuration (non_working_days, daily_working_hours)
    const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id, non_working_days, daily_working_hours FROM users WHERE user_id = ?`,
        [resourceId]
    );
    const resourceConfigs = new Map<number, ResourceScheduleConfig>();
    if (userRows.length > 0) {
        const config = parseResourceScheduleConfig(userRows[0] as any);
        resourceConfigs.set(config.userId, config);
    }

    // Fetch user leaves
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `SELECT DATE_FORMAT(leave_date, '%Y-%m-%d') as leave_date, leave_hours FROM user_leaves WHERE user_id = ? AND status IN ('APPROVED', 'PENDING')`,
        [resourceId]
    );
    const leavesMap = new Map<number, Map<string, number>>();
    const userLeaves = new Map<string, number>();
    for (const row of leaveRows) {
        const dateStr = String(row.leave_date).split("T")[0]!;
        const current = userLeaves.get(dateStr) || 0;
        userLeaves.set(dateStr, current + Number(row.leave_hours));
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

    // Fetch existing task allocations for this resource from task_schedules
    const [allocRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            DATE_FORMAT(ts.schedule_date, '%Y-%m-%d') AS schedule_date,
            SUM(ts.allocated_hours) AS allocated_hours
        FROM task_schedules ts
        JOIN tasks t ON ts.task_id = t.task_id
        WHERE ts.user_id = ? AND ts.schedule_date >= CURDATE()
          AND t.deleted_at IS NULL
          AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
          AND t.verified_task_id IS NULL
        GROUP BY DATE_FORMAT(ts.schedule_date, '%Y-%m-%d')
        `,
        [resourceId]
    );

    const initialAllocations = new Map<number, Map<string, number>>();
    const userAllocMap = new Map<string, number>();
    for (const row of allocRows) {
        userAllocMap.set(String(row.schedule_date), Number(row.allocated_hours));
    }
    initialAllocations.set(resourceId, userAllocMap);

    const isFeasible = canCompleteBy(
        dummyTask,
        cleanDeadline,
        taskResources,
        holidays,
        leavesMap,
        resourceConfigs,
        initialAllocations
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
            ? `Warning: Resource cannot complete ${expectedEffort}h of work before ${cleanDeadline} due to existing capacity/holidays/leaves/scheduled allocations.`
            : null
    };
}

/**
 * Calculates day-by-day availability for a specific resource across a date range.
 * Considers non_working_days, daily_working_hours, company holidays, user leaves, and task_schedules.
 */
export async function getResourceAvailability(
    userId: number,
    startDateStr?: string,
    endDateStr?: string
): Promise<ResourceAvailabilityResponseDTO> {
    const pool = getPool();

    // 1. Validate resource exists, is active, and has role RESOURCE
    const [userRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT user_id, name, email, role, is_active, non_working_days, daily_working_hours
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (userRows.length === 0) {
        const error = new Error("Resource not found.");
        (error as any).status = 404;
        throw error;
    }

    const userRow = userRows[0]!;

    if (!userRow.is_active) {
        const error = new Error("Resource is inactive.");
        (error as any).status = 400;
        throw error;
    }

    if (userRow.role !== "RESOURCE") {
        const error = new Error("Only users with role RESOURCE have availability schedules.");
        (error as any).status = 400;
        throw error;
    }

    // 2. Validate and normalize date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const defaultStart = formatDateLocal(today);
    const thirtyDaysAhead = new Date(today.getTime());
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
    const defaultEnd = formatDateLocal(thirtyDaysAhead);

    const cleanStartStr = startDateStr
        ? (startDateStr.includes("T") ? startDateStr.split("T")[0]! : startDateStr)
        : defaultStart;
    const cleanEndStr = endDateStr
        ? (endDateStr.includes("T") ? endDateStr.split("T")[0]! : endDateStr)
        : defaultEnd;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(cleanStartStr) || !dateRegex.test(cleanEndStr)) {
        const error = new Error("Invalid date format. Expected YYYY-MM-DD.");
        (error as any).status = 400;
        throw error;
    }

    const startDate = parseDateLocal(cleanStartStr);
    const endDate = parseDateLocal(cleanEndStr);

    if (startDate > endDate) {
        const error = new Error("startDate cannot be after endDate.");
        (error as any).status = 400;
        throw error;
    }

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 366) {
        const error = new Error("Date range cannot exceed 366 days.");
        (error as any).status = 400;
        throw error;
    }

    // 3. Parse resource schedule configuration
    const resourceConfig = parseResourceScheduleConfig(userRow as any);
    const dailyWorkingHours = resourceConfig.dailyHours;

    // 4. Fetch company holidays in range
    const [holidayRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT DATE_FORMAT(holiday_date, '%Y-%m-%d') as holiday_date
        FROM holidays
        WHERE holiday_date BETWEEN ? AND ?
        `,
        [cleanStartStr, cleanEndStr]
    );

    const holidays = new Set<string>();
    for (const row of holidayRows) {
        holidays.add(String(row.holiday_date));
    }

    // 5. Fetch user leaves in range (APPROVED and PENDING leaves)
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT DATE_FORMAT(leave_date, '%Y-%m-%d') as leave_date, leave_hours, leave_type
        FROM user_leaves
        WHERE user_id = ? AND status IN ('APPROVED', 'PENDING') AND leave_date BETWEEN ? AND ?
        `,
        [userId, cleanStartStr, cleanEndStr]
    );

    const leaves = new Map<string, { hours: number; leave_type?: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF" }>();
    for (const row of leaveRows) {
        const dateStr = String(row.leave_date);
        const rowHours = Number(row.leave_hours);
        const rowType = (row.leave_type as "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF") || (rowHours >= dailyWorkingHours ? "FULL_DAY" : "FIRST_HALF");
        
        const current = leaves.get(dateStr);
        if (current) {
            // If already set as partial and another partial comes, check if they cover different halves
            if (current.leave_type !== rowType && (current.leave_type === 'FIRST_HALF' || current.leave_type === 'SECOND_HALF') && (rowType === 'FIRST_HALF' || rowType === 'SECOND_HALF')) {
                current.hours = dailyWorkingHours;
                current.leave_type = "FULL_DAY";
            }
        } else {
            leaves.set(dateStr, {
                hours: rowHours,
                leave_type: rowType
            });
        }
    }

    // 6. Fetch task allocations in range
    const [allocRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT DATE_FORMAT(ts.schedule_date, '%Y-%m-%d') as schedule_date, SUM(ts.allocated_hours) as allocated_hours
        FROM task_schedules ts
        JOIN tasks t ON ts.task_id = t.task_id
        WHERE ts.user_id = ? AND ts.schedule_date BETWEEN ? AND ?
          AND t.deleted_at IS NULL
          AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
          AND t.verified_task_id IS NULL
        GROUP BY DATE_FORMAT(ts.schedule_date, '%Y-%m-%d')
        `,
        [userId, cleanStartStr, cleanEndStr]
    );

    const allocations = new Map<string, number>();
    for (const row of allocRows) {
        allocations.set(String(row.schedule_date), Number(row.allocated_hours));
    }

    // 7. Day-by-day availability calculation
    const days: DailyAvailabilityDTO[] = [];
    let totalAvailable = 0;
    let totalAllocated = 0;

    const currentDate = new Date(startDate.getTime());

    while (currentDate <= endDate) {
        const dateStr = formatDateLocal(currentDate);
        const weekday = getWeekdayFromDate(currentDate);

        const isHoliday = holidays.has(dateStr);
        const isNonWorkingDay = resourceConfig.nonWorkingDays.has(weekday);
        const leaveInfo = leaves.get(dateStr);
        const leaveHours = leaveInfo?.hours ?? 0;
        const allocatedHours = allocations.get(dateStr) ?? 0;
        const dailyCapacity = dailyWorkingHours;

        let availableHours = 0;
        let status: AvailabilityStatus;

        if (isHoliday) {
            availableHours = 0;
            status = "HOLIDAY";
        } else if (isNonWorkingDay) {
            availableHours = 0;
            status = "NON_WORKING_DAY";
        } else {
            const netCapacity = Math.max(0, dailyCapacity - leaveHours);
            availableHours = Math.max(0, Number((netCapacity - allocatedHours).toFixed(2)));

            if (leaveHours >= dailyCapacity) {
                status = "ON_LEAVE";
            } else if (leaveHours > 0) {
                status = "PARTIAL_LEAVE";
            } else if (availableHours === 0) {
                status = "FULLY_BOOKED";
            } else if (allocatedHours > 0) {
                status = "PARTIALLY_AVAILABLE";
            } else {
                status = "AVAILABLE";
            }
        }

        totalAvailable = Number((totalAvailable + availableHours).toFixed(2));
        totalAllocated = Number((totalAllocated + allocatedHours).toFixed(2));

        days.push({
            date: dateStr,
            weekday,
            daily_working_hours: Number(dailyCapacity.toFixed(2)),
            leave_hours: Number(leaveHours.toFixed(2)),
            leave_type: leaveInfo?.leave_type || (leaveHours >= dailyCapacity ? "FULL_DAY" : (leaveHours > 0 ? "FIRST_HALF" : undefined)),
            allocated_hours: Number(allocatedHours.toFixed(2)),
            available_hours: Number(availableHours.toFixed(2)),
            status
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        user_id: userId,
        name: userRow.name,
        daily_working_hours: dailyWorkingHours,
        non_working_days: Array.from(resourceConfig.nonWorkingDays) as DayOfWeek[],
        start_date: cleanStartStr,
        end_date: cleanEndStr,
        total_available_hours: Number(totalAvailable.toFixed(2)),
        total_allocated_hours: Number(totalAllocated.toFixed(2)),
        days
    };
}
