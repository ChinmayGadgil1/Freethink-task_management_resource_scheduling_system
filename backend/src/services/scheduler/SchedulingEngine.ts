import { getPool } from "../../config/database.js";
import type { RowDataPacket } from "mysql2";
import type { Task, TaskDependency } from "../../models/taskModel.js";

import { calculateUrgencyScore, sortTasksByUrgency, type ScoredTask } from "./PriorityEngine.js";
import { getDownstreamDependencyCount, detectCycles, pruneCycles } from "./DependencyEngine.js";

export interface ResourceScheduleConfig {
    userId: number;
    nonWorkingDays: Set<string>;
    dailyHours: number;
}

const WEEKDAY_NAMES: string[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
];

export function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function parseDateLocal(dateStr: string): Date {
    const clean = dateStr.includes("T") ? dateStr.split("T")[0]! : dateStr.split(" ")[0]!;
    const [yearStr, monthStr, dayStr] = clean.split("-");
    const d = new Date(parseInt(yearStr!, 10), parseInt(monthStr!, 10) - 1, parseInt(dayStr!, 10));
    d.setHours(0, 0, 0, 0);
    return d;
}

export function getWeekdayFromDate(dateInput: Date | string): string {
    if (typeof dateInput === "string") {
        const cleanDate = dateInput.includes("T") ? dateInput.split("T")[0]! : dateInput.split(" ")[0]!;
        const [yearStr, monthStr, dayStr] = cleanDate.split("-");
        if (yearStr && monthStr && dayStr) {
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10) - 1;
            const day = parseInt(dayStr, 10);
            const d = new Date(year, month, day);
            return WEEKDAY_NAMES[d.getDay()]!;
        }
        const d = new Date(cleanDate);
        return WEEKDAY_NAMES[d.getDay()] ?? "MONDAY";
    }
    return WEEKDAY_NAMES[dateInput.getDay()]!;
}

export function parseResourceScheduleConfig(row: {
    user_id: number | string;
    non_working_days?: any;
    daily_working_hours?: any;
}): ResourceScheduleConfig {
    const userId = Number(row.user_id);
    let nonWorkingDays = new Set<string>();

    if (row.non_working_days !== null && row.non_working_days !== undefined) {
        try {
            const raw = typeof row.non_working_days === "string"
                ? JSON.parse(row.non_working_days)
                : row.non_working_days;
            if (Array.isArray(raw)) {
                for (const d of raw) {
                    if (typeof d === "string" && d.trim().length > 0) {
                        nonWorkingDays.add(d.trim().toUpperCase());
                    }
                }
            }
        } catch {
            nonWorkingDays = new Set<string>(["SATURDAY", "SUNDAY"]);
        }
    } else {
        // Default to Saturday & Sunday off for unconfigured resources
        nonWorkingDays = new Set<string>(["SATURDAY", "SUNDAY"]);
    }

    let dailyHours = 8.0;
    if (row.daily_working_hours !== null && row.daily_working_hours !== undefined) {
        const parsedHours = Number(row.daily_working_hours);
        if (!isNaN(parsedHours) && parsedHours > 0 && parsedHours <= 24) {
            dailyHours = parsedHours;
        }
    }

    return {
        userId,
        nonWorkingDays,
        dailyHours
    };
}

/**
 * Single source of truth for resource daily available hours calculation.
 * 1. If date is a company holiday -> 0
 * 2. If resource's weekday is in users.non_working_days -> 0
 * 3. Otherwise -> max(0, daily_working_hours - leave_hours - allocated_hours)
 */
export function calculateAvailableHours(
    userId: number,
    date: string,
    resourceConfigs: Map<number, ResourceScheduleConfig>,
    holidays: Set<string>,
    leaves: Map<number, Map<string, number>>,
    allocatedSchedule?: Map<number, Map<string, number>>
): number {
    // 1. Company holiday -> 0 capacity
    if (holidays.has(date)) {
        return 0;
    }

    const config = resourceConfigs.get(userId);
    const dailyHours = config?.dailyHours ?? 8.0;
    const nonWorkingDays = config?.nonWorkingDays;

    // 2. Resource non-working weekday -> 0 capacity
    const weekday = getWeekdayFromDate(date);
    if (nonWorkingDays && nonWorkingDays.has(weekday)) {
        return 0;
    }

    // 3. Normal working capacity minus leaves and allocations
    let availableHours = dailyHours;

    const userLeave = leaves.get(userId)?.get(date);
    if (userLeave !== undefined) {
        availableHours -= userLeave;
    }

    const allocatedHours = allocatedSchedule?.get(userId)?.get(date) ?? 0;
    availableHours -= allocatedHours;

    return Math.max(0, Number(availableHours.toFixed(2)));
}

export function canCompleteBy(
    task: Task,
    targetDate: string,
    taskResources: Map<number, number[]>,
    holidays: Set<string>,
    leaves: Map<number, Map<string, number>>,
    resourceConfigs: Map<number, ResourceScheduleConfig> = new Map(),
    initialAllocations?: Map<number, Map<string, number>>,
    earliestStart?: Date,
    taskUserActualLogs?: Map<string, number>
): boolean {
    const resourceIds = taskResources.get(task.task_id) ?? [];
    const taskSupervisorId = task.supervisor_id ? Number(task.supervisor_id) : null;

    if (task.status === "COMPLETED") {
        return true;
    }

    if (resourceIds.length === 0) {
        return false;
    }

    const N = resourceIds.length;
    const sharePerAssignee = Number((Number(task.expected_effort) / N).toFixed(2));
    const actualPerAssignee = Number((Number(task.actual_effort) / N).toFixed(2));
    const taskProgress = Math.min(100, Math.max(0, Number(task.progress) || 0));

    const remainingPerResource = new Map<number, number>();
    let totalAssigneeRem = 0;
    for (const uid of resourceIds) {
        const userLogged = taskUserActualLogs?.get(`${task.task_id}_${uid}`) ?? (N === 1 ? Number(task.actual_effort) : actualPerAssignee);
        let rem = 0;
        if (taskProgress < 100) {
            rem = Math.max(0, Number((sharePerAssignee - userLogged).toFixed(2)));
        }
        remainingPerResource.set(uid, rem);
        totalAssigneeRem = Number((totalAssigneeRem + rem).toFixed(2));
    }

    let supRemaining = 0;
    if (taskSupervisorId && taskProgress < 100) {
        supRemaining = Number((Number(task.expected_effort) * 0.20).toFixed(2));
    }

    if (totalAssigneeRem <= 0 && supRemaining <= 0) {
        return true;
    }

    const riskSchedule = new Map<number, Map<string, number>>();
    if (initialAllocations) {
        for (const [userId, dateMap] of initialAllocations.entries()) {
            riskSchedule.set(userId, new Map(dateMap));
        }
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const initialStart = earliestStart ? new Date(earliestStart) : new Date();
    const currentDate = new Date(Math.max(initialStart.getTime(), todayMidnight.getTime()));
    currentDate.setHours(0, 0, 0, 0);

    const endDate = parseDateLocal(targetDate);

    while (currentDate <= endDate && (totalAssigneeRem > 0 || supRemaining > 0)) {
        const date = formatDateLocal(currentDate);

        // Schedule assignees up to their target share
        if (totalAssigneeRem > 0) {
            for (const userId of resourceIds) {
                const userRem = remainingPerResource.get(userId) ?? 0;
                if (userRem <= 0) continue;

                const availableHours = calculateAvailableHours(
                    userId,
                    date,
                    resourceConfigs,
                    holidays,
                    leaves,
                    riskSchedule
                );

                if (availableHours <= 0) continue;

                const hoursToAllocate = Math.min(availableHours, userRem);
                if (!riskSchedule.has(userId)) {
                    riskSchedule.set(userId, new Map());
                }
                const userSchedule = riskSchedule.get(userId)!;
                userSchedule.set(date, (userSchedule.get(date) ?? 0) + hoursToAllocate);

                remainingPerResource.set(userId, Number((userRem - hoursToAllocate).toFixed(2)));
                totalAssigneeRem = Number((totalAssigneeRem - hoursToAllocate).toFixed(2));
            }
        }

        // Once assignees are complete, schedule supervisor review
        if (totalAssigneeRem <= 0 && supRemaining > 0 && taskSupervisorId) {
            const availableHours = calculateAvailableHours(
                taskSupervisorId,
                date,
                resourceConfigs,
                holidays,
                leaves,
                riskSchedule
            );

            if (availableHours > 0) {
                const hoursToAllocate = Math.min(availableHours, supRemaining);
                if (!riskSchedule.has(taskSupervisorId)) {
                    riskSchedule.set(taskSupervisorId, new Map());
                }
                const userSchedule = riskSchedule.get(taskSupervisorId)!;
                userSchedule.set(date, (userSchedule.get(date) ?? 0) + hoursToAllocate);

                supRemaining = Number((supRemaining - hoursToAllocate).toFixed(2));
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalAssigneeRem <= 0 && supRemaining <= 0;
}

export function calculateRisks(
    task: Task,
    plannedEnd: string | null,
    taskResources: Map<number, number[]>,
    holidays: Set<string>,
    leaves: Map<number, Map<string, number>>,
    resourceConfigs: Map<number, ResourceScheduleConfig> = new Map(),
    initialAllocations?: Map<number, Map<string, number>>,
    earliestStart?: Date,
    projectDeadline?: string | null,
    taskUserActualLogs?: Map<string, number>
): {
    is_schedule_at_risk: boolean;
    is_deadline_at_risk: boolean;
} {
    if (task.status === "COMPLETED" || task.status === "UNASSIGNED") {
        return {
            is_schedule_at_risk: false,
            is_deadline_at_risk: false
        };
    }

    const resourceIds = taskResources.get(task.task_id) ?? [];
    if (resourceIds.length === 0) {
        return {
            is_schedule_at_risk: false,
            is_deadline_at_risk: false
        };
    }

    const isScheduleAtRisk =
        plannedEnd !== null &&
        !canCompleteBy(
            task,
            plannedEnd,
            taskResources,
            holidays,
            leaves,
            resourceConfigs,
            initialAllocations,
            earliestStart,
            taskUserActualLogs
        );

    // Effective deadline is the task-specific deadline if present, otherwise project-level deadline
    const effectiveDeadline = task.deadline || projectDeadline || null;

    let isDeadlineAtRisk = false;
    if (effectiveDeadline !== null) {
        if (plannedEnd !== null) {
            const cleanPlannedEnd = plannedEnd.includes("T") ? plannedEnd.split("T")[0]! : plannedEnd.split(" ")[0]!;
            const cleanDeadline = effectiveDeadline.includes("T") ? effectiveDeadline.split("T")[0]! : effectiveDeadline.split(" ")[0]!;
            if (cleanPlannedEnd > cleanDeadline) {
                isDeadlineAtRisk = true;
            }
        }
        if (!isDeadlineAtRisk) {
            isDeadlineAtRisk = !canCompleteBy(
                task,
                effectiveDeadline,
                taskResources,
                holidays,
                leaves,
                resourceConfigs,
                initialAllocations,
                earliestStart,
                taskUserActualLogs
            );
        }
    }

    return {
        is_schedule_at_risk: isScheduleAtRisk,
        is_deadline_at_risk: isDeadlineAtRisk
    };
}

export function parseAndFormatDatetime(val: any): string {
    if (!val) return "";
    const d = typeof val === "string" ? new Date(val) : val;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
        return String(val);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDateTimeLocal(date: Date, hourOffset: number): string {
    const d = new Date(date);
    d.setHours(10 + Math.floor(hourOffset), (hourOffset % 1) * 60, 0, 0); // 10 AM is start of workday
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function recalculate(projectId: number, isCascaded = false): Promise<void> {
    const pool = getPool();

    const [taskRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            t.*,
            p.start_date AS project_start_date,
            p.deadline AS project_deadline,
            GROUP_CONCAT(DISTINCT ta.user_id) AS assigned_resource_ids
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
        WHERE t.project_id = ?
          AND t.status != 'COMPLETED'
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
          AND t.verified_task_id IS NULL
        GROUP BY t.task_id
        `,
        [projectId]
    );

    let projectDeadline: string | null = null;
    let projectStartDate: Date | null = null;
    if (taskRows.length > 0) {
        if (taskRows[0]?.project_deadline) {
            projectDeadline = String(taskRows[0].project_deadline).split("T")[0]!;
        }
        if (taskRows[0]?.project_start_date) {
            projectStartDate = new Date(taskRows[0].project_start_date);
        }
    } else {
        const [pRows] = await pool.query<RowDataPacket[]>(
            `SELECT start_date, deadline FROM projects WHERE project_id = ? LIMIT 1`,
            [projectId]
        );
        if (pRows.length > 0) {
            if (pRows[0]?.deadline) {
                projectDeadline = String(pRows[0].deadline).split("T")[0]!;
            }
            if (pRows[0]?.start_date) {
                projectStartDate = new Date(pRows[0].start_date);
            }
        }
    }

    const taskResources = new Map<number, number[]>();

    for (const row of taskRows) {
        const taskId = Number(row.task_id);

        const resourceIds = row.assigned_resource_ids
            ? String(row.assigned_resource_ids)
                .split(",")
                .map(Number)
            : [];

        taskResources.set(taskId, resourceIds);
    }

    const tasks: Task[] = taskRows.map(row => ({
        task_id: Number(row.task_id),
        project_id: Number(row.project_id),
        supervisor_id: row.supervisor_id ? Number(row.supervisor_id) : null,
        title: String(row.title),
        description: row.description ?? null,
        priority: row.priority,
        status: row.status,
        deadline: row.deadline ? String(row.deadline).split("T")[0]! : null,
        planned_start: row.planned_start ? parseAndFormatDatetime(row.planned_start) : null,
        planned_end: row.planned_end ? parseAndFormatDatetime(row.planned_end) : null,
        actual_start: row.actual_start ? parseAndFormatDatetime(row.actual_start) : null,
        actual_end: row.actual_end ? parseAndFormatDatetime(row.actual_end) : null,
        expected_effort: Number(row.expected_effort),
        actual_effort: Number(row.actual_effort),
        progress: Number(row.progress),
        is_schedule_at_risk: Boolean(row.is_schedule_at_risk),
        is_deadline_at_risk: Boolean(row.is_deadline_at_risk),
        created_at: row.created_at,
        updated_at: row.updated_at
    }));

    const taskIds = tasks.map(t => t.task_id);
    const taskUserActualLogs = new Map<string, number>();
    if (taskIds.length > 0) {
        const [logRows] = await pool.query<RowDataPacket[]>(
            `SELECT task_id, user_id, SUM(hours_logged) as user_logged_hours
             FROM work_logs
             WHERE task_id IN (?)
             GROUP BY task_id, user_id`,
            [taskIds]
        );
        for (const l of logRows) {
            taskUserActualLogs.set(`${Number(l.task_id)}_${Number(l.user_id)}`, Number(l.user_logged_hours || 0));
        }
    }

    const [dependencyRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            td.task_id,
            td.predecessor_task_id,
            pred.status AS pred_status,
            pred.actual_end AS pred_actual_end,
            pred.planned_end AS pred_planned_end
        FROM task_dependencies td
        INNER JOIN tasks t ON td.task_id = t.task_id
        INNER JOIN tasks pred ON td.predecessor_task_id = pred.task_id
        WHERE t.project_id = ?
          AND t.deleted_at IS NULL
          AND pred.deleted_at IS NULL
          AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
          AND t.verified_task_id IS NULL
          AND (pred.task_type IS NULL OR pred.task_type != 'VERIFICATION')
          AND pred.verified_task_id IS NULL
        `,
        [projectId]
    );

    const activeTaskIds = new Set(tasks.map(t => t.task_id));
    const completedPredMinStart = new Map<number, Date>();
    let dependencies: TaskDependency[] = [];

    for (const row of dependencyRows) {
        const taskId = Number(row.task_id);
        const predId = Number(row.predecessor_task_id);
        const predStatus = String(row.pred_status);

        if (predStatus === 'COMPLETED') {
            const rawEnd = row.pred_actual_end || row.pred_planned_end;
            if (rawEnd) {
                const predEndDate = new Date(rawEnd);
                if (!isNaN(predEndDate.getTime())) {
                    const existing = completedPredMinStart.get(taskId);
                    if (!existing || predEndDate > existing) {
                        completedPredMinStart.set(taskId, predEndDate);
                    }
                }
            }
        } else if (activeTaskIds.has(taskId) && activeTaskIds.has(predId)) {
            dependencies.push({
                task_id: taskId,
                predecessor_task_id: predId
            });
        }
    }

    // Validate that task graph is acyclic before running scheduling calculations
    try {
        detectCycles(tasks, dependencies);
    } catch (cycleError: any) {
        console.warn(`SchedulingEngine: Cycle detected in project ${projectId}. Pruning invalid dependencies:`, cycleError.message);
        const { validDependencies, removedDependencies } = pruneCycles(tasks, dependencies);
        dependencies = validDependencies;
        for (const rem of removedDependencies) {
            await pool.query(
                `DELETE FROM task_dependencies WHERE task_id = ? AND predecessor_task_id = ?`,
                [rem.task_id, rem.predecessor_task_id]
            );
        }
    }

    const baselineDate = projectStartDate ? new Date(projectStartDate) : new Date();
    baselineDate.setHours(0, 0, 0, 0);

    const inDegree = new Map<number, number>();
    const adjList = new Map<number, number[]>();

    for (const task of tasks) {
        inDegree.set(task.task_id, 0);
        adjList.set(task.task_id, []);
    }

    for (const dep of dependencies) {
        const currentInDegree = inDegree.get(dep.task_id) ?? 0;
        inDegree.set(dep.task_id, currentInDegree + 1);

        const currentAdj = adjList.get(dep.predecessor_task_id) ?? [];
        currentAdj.push(dep.task_id);
        adjList.set(dep.predecessor_task_id, currentAdj);
    }

    // Precalculate downstream dependency counts (transitive fan-out) for all tasks
    const downstreamCountMap = new Map<number, number>();
    for (const task of tasks) {
        downstreamCountMap.set(task.task_id, getDownstreamDependencyCount(task.task_id, dependencies));
    }

    let availableTasks: ScoredTask[] = [];
    for (const task of tasks) {
        if (inDegree.get(task.task_id) === 0) {
            availableTasks.push({
                ...task,
                urgency_score: calculateUrgencyScore(task, downstreamCountMap.get(task.task_id) ?? 0, baselineDate)
            });
        }
    }

    // Fetch project holidays
    const [holidayRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT holiday_date
        FROM holidays
        `
    );

    // Fetch leave dates for resources involved in this project (including task supervisors)
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            ul.user_id,
            ul.leave_date,
            ul.leave_hours,
            ul.leave_type
        FROM user_leaves ul
        INNER JOIN (
            SELECT DISTINCT ta.user_id
            FROM task_assignments ta
            INNER JOIN tasks t
                ON ta.task_id = t.task_id
            WHERE t.project_id = ?
              AND t.deleted_at IS NULL
              AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
              AND t.verified_task_id IS NULL
            UNION
            SELECT DISTINCT pm.user_id
            FROM project_members pm
            JOIN projects p ON pm.project_id = p.project_id
            WHERE pm.project_id = ?
              AND p.deleted_at IS NULL
            UNION
            SELECT DISTINCT t.supervisor_id AS user_id
            FROM tasks t
            WHERE t.project_id = ?
              AND t.supervisor_id IS NOT NULL
              AND t.deleted_at IS NULL
        ) project_resources
            ON ul.user_id = project_resources.user_id
        WHERE ul.status = 'APPROVED'
        `,
        [projectId, projectId, projectId]
    );

    // Fetch non_working_days and daily_working_hours for resources involved in this project (including supervisors)
    const [userRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            u.user_id,
            u.non_working_days,
            u.daily_working_hours
        FROM users u
        INNER JOIN (
            SELECT DISTINCT ta.user_id
            FROM task_assignments ta
            INNER JOIN tasks t
                ON ta.task_id = t.task_id
            WHERE t.project_id = ?
              AND t.deleted_at IS NULL
              AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
              AND t.verified_task_id IS NULL
            UNION
            SELECT DISTINCT pm.user_id
            FROM project_members pm
            JOIN projects p ON pm.project_id = p.project_id
            WHERE pm.project_id = ?
              AND p.deleted_at IS NULL
            UNION
            SELECT DISTINCT t.supervisor_id AS user_id
            FROM tasks t
            WHERE t.project_id = ?
              AND t.supervisor_id IS NOT NULL
              AND t.deleted_at IS NULL
        ) project_resources
            ON u.user_id = project_resources.user_id
        `,
        [projectId, projectId, projectId]
    );

    const resourceConfigs = new Map<number, ResourceScheduleConfig>();

    for (const row of userRows) {
        const config = parseResourceScheduleConfig(row as any);
        resourceConfigs.set(config.userId, config);
    }

    const holidays = new Set<string>();

    for (const row of holidayRows) {
        holidays.add(String(row.holiday_date).split("T")[0]!);
    }

    const leaves = new Map<number, Map<string, number>>();
    const leaveTypes = new Map<number, Map<string, string>>();

    for (const row of leaveRows) {
        const userId = Number(row.user_id);
        const date = String(row.leave_date).split("T")[0]!;
        const leaveHours = Number(row.leave_hours);
        const leaveType = (row.leave_type as string) || (leaveHours >= 8 ? 'FULL_DAY' : 'FIRST_HALF');

        if (!leaves.has(userId)) {
            leaves.set(userId, new Map());
        }
        if (!leaveTypes.has(userId)) {
            leaveTypes.set(userId, new Map());
        }

        const userLeaveMap = leaves.get(userId)!;
        const currentHours = userLeaveMap.get(date) || 0;
        userLeaveMap.set(date, currentHours + leaveHours);
        leaveTypes.get(userId)!.set(date, leaveType);
    }

    const resourceUserIds = Array.from(resourceConfigs.keys());

    const checkedOutDays = new Set<string>();

    if (resourceUserIds.length > 0) {
        const [checkoutRows] = await pool.query<RowDataPacket[]>(
            `SELECT user_id, DATE_FORMAT(checkout_date, '%Y-%m-%d') as checkout_date
             FROM daily_checkouts
             WHERE user_id IN (?)`,
            [resourceUserIds]
        );
        for (const row of checkoutRows) {
            checkedOutDays.add(`${row.user_id}_${row.checkout_date}`);
        }
    }

    const resourceSchedule = new Map<number, Map<string, number>>();

    // Preload existing task allocations from other active projects for these resources
    if (resourceUserIds.length > 0) {
        const [crossProjectAllocRows] = await pool.query<RowDataPacket[]>(
            `
            SELECT
                ts.user_id,
                DATE_FORMAT(ts.schedule_date, '%Y-%m-%d') AS schedule_date,
                SUM(ts.allocated_hours) AS busy_hours
            FROM task_schedules ts
            INNER JOIN tasks t
                ON ts.task_id = t.task_id
            INNER JOIN projects p
                ON t.project_id = p.project_id
            WHERE ts.user_id IN (?)
              AND t.project_id != ?
              AND t.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND p.status NOT IN ('COMPLETED', 'CANCELLED', 'ARCHIVED')
              AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
              AND t.verified_task_id IS NULL
              AND ts.schedule_date >= CURDATE()
            GROUP BY ts.user_id, DATE_FORMAT(ts.schedule_date, '%Y-%m-%d')
            `,
            [resourceUserIds, projectId]
        );

        for (const row of crossProjectAllocRows) {
            const userId = Number(row.user_id);
            const date = String(row.schedule_date);
            const busyHours = Number(row.busy_hours);

            if (!resourceSchedule.has(userId)) {
                resourceSchedule.set(userId, new Map());
            }


            resourceSchedule.get(userId)!.set(date, busyHours);
        }
    }

    const todayStr = formatDateLocal(new Date());

    const isTaskLocked = (taskId: number, status: string, resourceIds: number[], supervisorId: number | null): boolean => {
        if (status !== 'IN_PROGRESS') return false;
        
        let activeUsers = [...resourceIds];
        if (activeUsers.length === 0 && supervisorId) {
            activeUsers = [supervisorId];
        }
        
        if (activeUsers.length === 0) return false; // Edge case: no one to check out
        
        // Locked if ANY active user has NOT checked out today
        return activeUsers.some(uid => !checkedOutDays.has(`${uid}_${todayStr}`));
    };

    // Preload existing allocations for locked IN_PROGRESS tasks in the current project
    if (resourceUserIds.length > 0) {
        const [lockedAllocRows] = await pool.query<RowDataPacket[]>(
            `
            SELECT
                ts.task_id,
                ts.user_id,
                DATE_FORMAT(ts.schedule_date, '%Y-%m-%d') AS schedule_date,
                ts.allocated_hours AS busy_hours,
                t.status
            FROM task_schedules ts
            INNER JOIN tasks t
                ON ts.task_id = t.task_id
            WHERE t.project_id = ?
              AND t.status = 'IN_PROGRESS'
              AND t.deleted_at IS NULL
              AND ts.schedule_date >= CURDATE()
            `,
            [projectId]
        );

        for (const row of lockedAllocRows) {
            const taskId = Number(row.task_id);
            const status = String(row.status);
            const resourceIds = taskResources.get(taskId) ?? [];
            const task = tasks.find(t => t.task_id === taskId);
            const supervisorId = task?.supervisor_id ?? null;
            
            if (isTaskLocked(taskId, status, resourceIds, supervisorId)) {
                const userId = Number(row.user_id);
                const date = String(row.schedule_date);
                const busyHours = Number(row.busy_hours);

                if (!resourceSchedule.has(userId)) {
                    resourceSchedule.set(userId, new Map());
                }

                const currMap = resourceSchedule.get(userId)!;
                currMap.set(date, (currMap.get(date) ?? 0) + busyHours);
            }
        }
    }

    const getAvailableHours = (userId: number, date: string): number => {
        if (checkedOutDays.has(`${userId}_${date}`)) {
            return 0; // If checked out for the day, capacity is 0
        }
        return calculateAvailableHours(
            userId,
            date,
            resourceConfigs,
            holidays,
            leaves,
            resourceSchedule
        );
    };

    const taskScheduleEntries: {
        task_id: number;
        user_id: number;
        schedule_date: string;
        allocated_hours: number;
    }[] = [];

    const earliestStarts = new Map<number, Date>();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    for (const task of tasks) {
        const minStart = completedPredMinStart.get(task.task_id);
        const hasStarted = Boolean(task.actual_start || Number(task.progress || 0) > 0);
        const effectiveBaseline = hasStarted
            ? baselineDate
            : (baselineDate < todayMidnight ? todayMidnight : baselineDate);

        if (minStart && minStart > effectiveBaseline) {
            earliestStarts.set(task.task_id, new Date(minStart));
        } else {
            earliestStarts.set(task.task_id, new Date(effectiveBaseline));
        }
    }

    const taskUpdates = new Map<number, {
        planned_start: string | null;
        planned_end: string | null;
        is_schedule_at_risk: boolean;
        is_deadline_at_risk: boolean;
    }>();

    while (availableTasks.length > 0) {
        availableTasks = sortTasksByUrgency(availableTasks);
        const task = availableTasks.shift()!;
        
        const resourceIds = taskResources.get(task.task_id) ?? [];
        const taskSupervisorId = task.supervisor_id ? Number(task.supervisor_id) : null;
        const N = resourceIds.length;

        const sharePerAssignee = N > 0 ? Number((Number(task.expected_effort) / N).toFixed(2)) : 0;
        const actualPerAssignee = N > 0 ? Number((Number(task.actual_effort) / N).toFixed(2)) : 0;
        const remainingEffortPerResource = new Map<number, number>();
        let totalAssigneeRemaining = 0;
        for (const uid of resourceIds) {
            const userLogged = taskUserActualLogs.get(`${task.task_id}_${uid}`) ?? (N === 1 ? Number(task.actual_effort) : actualPerAssignee);
            const rem = Math.max(0, Number((sharePerAssignee - userLogged).toFixed(2)));
            remainingEffortPerResource.set(uid, rem);
            totalAssigneeRemaining = Number((totalAssigneeRemaining + rem).toFixed(2));
        }

        const supLogged = taskSupervisorId ? (taskUserActualLogs.get(`${task.task_id}_${taskSupervisorId}`) ?? 0) : 0;
        let supervisorRemaining = taskSupervisorId
            ? Math.max(0, Number((Number(task.expected_effort) * 0.20 - supLogged).toFixed(2)))
            : 0;

        let plannedStart: string | null = null;
        let plannedEnd: string | null = null;
        
        let taskEarliestStart = earliestStarts.get(task.task_id) ?? new Date(baselineDate);
        let taskFinalEnd: Date | null = null;

        const hasStarted = Boolean(task.actual_start || task.status === "IN_PROGRESS");
        const isLocked = isTaskLocked(task.task_id, task.status, resourceIds, taskSupervisorId);

        if (!isLocked && (totalAssigneeRemaining > 0 || supervisorRemaining > 0) && resourceIds.length > 0 && task.status !== "UNASSIGNED") {
            const allocationStartDate = new Date(Math.max(taskEarliestStart.getTime(), todayMidnight.getTime()));
            let currentDate = new Date(allocationStartDate);
            currentDate.setHours(0, 0, 0, 0);

            const initialAllocationsForRisk = new Map<number, Map<string, number>>();
            for (const [uid, datesMap] of resourceSchedule.entries()) {
                initialAllocationsForRisk.set(uid, new Map(datesMap));
            }

            // For multi-resource tasks, find the earliest working day where all assignees have capacity to work concurrently
            if (resourceIds.length > 1) {
                let checkDate = new Date(currentDate);
                let daysChecked = 0;
                while (daysChecked < 10) {
                    const dStr = formatDateLocal(checkDate);
                    if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6 && !holidays.has(dStr)) {
                        const allAvailable = resourceIds.every(uid => {
                            const avail = getAvailableHours(uid, dStr);
                            return avail > 0;
                        });
                        if (allAvailable) {
                            currentDate = checkDate;
                            break;
                        }
                    }
                    checkDate.setDate(checkDate.getDate() + 1);
                    daysChecked++;
                }
            }

            // Phase 1: Schedule assignees concurrently up to their target share
            let phase1Days = 0;
            const MAX_SCHEDULE_DAYS = 730;

            while (totalAssigneeRemaining > 0 && phase1Days < MAX_SCHEDULE_DAYS) {
                phase1Days++;
                const date = formatDateLocal(currentDate);
                let dependencyHourOffset = 0;
                if (date === formatDateLocal(taskEarliestStart)) {
                    dependencyHourOffset = Math.max(0, taskEarliestStart.getHours() - 10 + taskEarliestStart.getMinutes() / 60);
                }

                let allocatedAnyToday = false;

                for (const userId of resourceIds) {
                    const userRemaining = remainingEffortPerResource.get(userId) ?? 0;
                    if (userRemaining <= 0) {
                        continue;
                    }

                    const availableHours = getAvailableHours(userId, date);
                    const dailyHours = resourceConfigs.get(userId)?.dailyHours ?? 8;
                    const prevEndOffset = resourceSchedule.get(userId)?.get(date) ?? 0;
                    const userLeaveType = leaveTypes.get(userId)?.get(date);
                    let leaveStartOffset = 0;
                    if (userLeaveType === 'FIRST_HALF') {
                        leaveStartOffset = 4;
                    }
                    const startHourOffset = Math.max(prevEndOffset, dependencyHourOffset, leaveStartOffset);
                    const remainingSpanToday = Math.max(0, dailyHours - startHourOffset);
                    const effectiveAvailableHours = Number(Math.min(availableHours, remainingSpanToday).toFixed(2));

                    if (effectiveAvailableHours <= 0) {
                        continue;
                    }

                    const hoursToAllocate = Number(Math.min(
                        effectiveAvailableHours,
                        userRemaining
                    ).toFixed(2));

                    if (hoursToAllocate <= 0) {
                        continue;
                    }

                    const endHourOffset = Number((startHourOffset + hoursToAllocate).toFixed(2));
                    
                    const currentStartTime = formatDateTimeLocal(currentDate, startHourOffset);
                    const currentEndTime = formatDateTimeLocal(currentDate, endHourOffset);

                    if (plannedStart === null || currentStartTime < plannedStart) {
                        plannedStart = currentStartTime;
                    }
                    if (plannedEnd === null || currentEndTime > plannedEnd) {
                        plannedEnd = currentEndTime;
                    }

                    if (!resourceSchedule.has(userId)) {
                        resourceSchedule.set(userId, new Map());
                    }
                    const currentAlloc = resourceSchedule.get(userId)!.get(date) ?? 0;
                    resourceSchedule.get(userId)!.set(
                        date,
                        Number((currentAlloc + hoursToAllocate).toFixed(2))
                    );

                    taskScheduleEntries.push({
                        task_id: task.task_id,
                        user_id: userId,
                        schedule_date: date,
                        allocated_hours: hoursToAllocate
                    });

                    remainingEffortPerResource.set(userId, Number((userRemaining - hoursToAllocate).toFixed(2)));
                    totalAssigneeRemaining = Number((totalAssigneeRemaining - hoursToAllocate).toFixed(2));
                    allocatedAnyToday = true;
                }

                if (allocatedAnyToday && plannedEnd) {
                    taskFinalEnd = new Date(plannedEnd.replace(' ', 'T'));
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Phase 2: Schedule supervisor review (20% of base effort)
            if (taskSupervisorId && supervisorRemaining > 0) {
                let supDate = taskFinalEnd ? new Date(taskFinalEnd) : new Date(allocationStartDate);
                if (supDate < todayMidnight) {
                    supDate = new Date(todayMidnight);
                }
                let supHourOffset = Math.max(0, supDate.getHours() - 10 + supDate.getMinutes() / 60);
                if (supHourOffset >= 8) {
                    supDate.setDate(supDate.getDate() + 1);
                    supHourOffset = 0;
                }
                supDate.setHours(0, 0, 0, 0);

                let phase2Days = 0;
                while (supervisorRemaining > 0 && phase2Days < MAX_SCHEDULE_DAYS) {
                    phase2Days++;
                    const dateStr = formatDateLocal(supDate);
                    const availableHours = getAvailableHours(taskSupervisorId, dateStr);
                    const dailyHours = resourceConfigs.get(taskSupervisorId)?.dailyHours ?? 8;
                    const prevEndOffset = resourceSchedule.get(taskSupervisorId)?.get(dateStr) ?? 0;
                    const userLeaveType = leaveTypes.get(taskSupervisorId)?.get(dateStr);
                    let leaveStartOffset = 0;
                    if (userLeaveType === 'FIRST_HALF') {
                        leaveStartOffset = 4;
                    }
                    const startHourOffset = Math.max(prevEndOffset, supHourOffset, leaveStartOffset);
                    const remainingSpanToday = Math.max(0, dailyHours - startHourOffset);
                    const effectiveAvailableHours = Number(Math.min(availableHours, remainingSpanToday).toFixed(2));

                    if (effectiveAvailableHours > 0) {
                        const hoursToAllocate = Number(Math.min(
                            effectiveAvailableHours,
                            supervisorRemaining
                        ).toFixed(2));

                        if (hoursToAllocate > 0) {
                            const endHourOffset = Number((startHourOffset + hoursToAllocate).toFixed(2));

                            const currentStartTime = formatDateTimeLocal(supDate, startHourOffset);
                            const currentEndTime = formatDateTimeLocal(supDate, endHourOffset);

                            if (plannedStart === null || currentStartTime < plannedStart) {
                                plannedStart = currentStartTime;
                            }
                            if (plannedEnd === null || currentEndTime > plannedEnd) {
                                plannedEnd = currentEndTime;
                            }

                            if (!resourceSchedule.has(taskSupervisorId)) {
                                resourceSchedule.set(taskSupervisorId, new Map());
                            }
                            const currentAlloc = resourceSchedule.get(taskSupervisorId)!.get(dateStr) ?? 0;
                            resourceSchedule.get(taskSupervisorId)!.set(
                                dateStr,
                                Number((currentAlloc + hoursToAllocate).toFixed(2))
                            );

                            taskScheduleEntries.push({
                                task_id: task.task_id,
                                user_id: taskSupervisorId,
                                schedule_date: dateStr,
                                allocated_hours: hoursToAllocate
                            });

                            supervisorRemaining = Number((supervisorRemaining - hoursToAllocate).toFixed(2));
                            if (plannedEnd) {
                                taskFinalEnd = new Date(plannedEnd.replace(' ', 'T'));
                            }
                        }
                    }

                    supHourOffset = 0;
                    supDate.setDate(supDate.getDate() + 1);
                }
            }

            if (hasStarted && task.planned_start) {
                plannedStart = task.planned_start; // Preserve original planned_start
            }

            const risks = calculateRisks(
                task,
                plannedEnd,
                taskResources,
                holidays,
                leaves,
                resourceConfigs,
                initialAllocationsForRisk,
                taskEarliestStart,
                projectDeadline,
                taskUserActualLogs
            );

            taskUpdates.set(task.task_id, {
                planned_start: plannedStart,
                planned_end: plannedEnd,
                is_schedule_at_risk: risks.is_schedule_at_risk,
                is_deadline_at_risk: risks.is_deadline_at_risk
            });

        } else {
            const initialAllocationsForRisk = new Map<number, Map<string, number>>();
            for (const [uid, datesMap] of resourceSchedule.entries()) {
                initialAllocationsForRisk.set(uid, new Map(datesMap));
            }
            
            let currentPlannedStart = task.planned_start ?? null;
            let currentPlannedEnd = task.planned_end ?? null;

            let isScheduleAtRisk = false;
            let isDeadlineAtRisk = false;

            if (isLocked) {
                const effectiveDeadline = task.deadline || projectDeadline || null;
                if (effectiveDeadline !== null && currentPlannedEnd !== null) {
                    const cleanPlannedEnd = currentPlannedEnd.includes("T") ? currentPlannedEnd.split("T")[0]! : currentPlannedEnd.split(" ")[0]!;
                    const cleanDeadline = effectiveDeadline.includes("T") ? effectiveDeadline.split("T")[0]! : effectiveDeadline.split(" ")[0]!;
                    if (cleanPlannedEnd > cleanDeadline) {
                        isDeadlineAtRisk = true;
                        isScheduleAtRisk = true;
                    }
                }
                if (currentPlannedEnd) {
                    taskFinalEnd = new Date(currentPlannedEnd.replace(' ', 'T'));
                } else {
                    taskFinalEnd = new Date(taskEarliestStart);
                }
            } else {
                const risks = calculateRisks(
                    task,
                    currentPlannedEnd,
                    taskResources,
                    holidays,
                    leaves,
                    resourceConfigs,
                    initialAllocationsForRisk,
                    taskEarliestStart,
                    projectDeadline,
                    taskUserActualLogs
                );
                isScheduleAtRisk = risks.is_schedule_at_risk;
                isDeadlineAtRisk = risks.is_deadline_at_risk;
                taskFinalEnd = new Date(taskEarliestStart);
            }
            
            taskUpdates.set(task.task_id, {
                planned_start: currentPlannedStart,
                planned_end: currentPlannedEnd,
                is_schedule_at_risk: isScheduleAtRisk,
                is_deadline_at_risk: isDeadlineAtRisk
            });
        }

        const successors = adjList.get(task.task_id) ?? [];
        for (const succ of successors) {
            if (taskFinalEnd) {
                const currentSuccStart = earliestStarts.get(succ)!;
                if (taskFinalEnd > currentSuccStart) {
                    earliestStarts.set(succ, new Date(taskFinalEnd));
                }
            }
            
            const newInDegree = inDegree.get(succ)! - 1;
            inDegree.set(succ, newInDegree);
            
            if (newInDegree === 0) {
                const succTask = tasks.find(t => t.task_id === succ)!;
                availableTasks.push({
                    ...succTask,
                    urgency_score: calculateUrgencyScore(succTask, downstreamCountMap.get(succ) ?? 0, baselineDate)
                });
            }
        }
    }

    const lockedTaskIds = tasks.filter(t => isTaskLocked(t.task_id, t.status, taskResources.get(t.task_id) ?? [], t.supervisor_id ?? null)).map(t => t.task_id);
    let excludeLockedTasksSql = "";
    const queryParams: any[] = [projectId];

    if (lockedTaskIds.length > 0) {
        excludeLockedTasksSql = "AND t.task_id NOT IN (?)";
        queryParams.push(lockedTaskIds);
    }

    // Delete task_schedules belonging to uncompleted tasks (excluding locked IN_PROGRESS tasks), and purge obsolete future allocations of completed tasks
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `
            DELETE ts FROM task_schedules ts
            INNER JOIN tasks t ON ts.task_id = t.task_id
            WHERE t.project_id = ?
              ${excludeLockedTasksSql}
              AND (t.status != 'COMPLETED' OR ts.schedule_date > DATE(COALESCE(t.actual_end, NOW())))
            `,
            queryParams
        );
        
        for (const [taskId, update] of taskUpdates.entries()) {
            await connection.query(
                `
                UPDATE tasks
                SET planned_start = ?,
                    planned_end = ?,
                    is_schedule_at_risk = ?,
                    is_deadline_at_risk = ?
                WHERE task_id = ?
                `,
                [
                    update.planned_start,
                    update.planned_end,
                    update.is_schedule_at_risk,
                    update.is_deadline_at_risk,
                    taskId
                ]
            );
        }
        
        for (const task of tasks) {
            if (!taskUpdates.has(task.task_id)) {
                const risks = calculateRisks(
                    task,
                    task.planned_end ?? null,
                    taskResources,
                    holidays,
                    leaves,
                    resourceConfigs,
                    resourceSchedule,
                    baselineDate,
                    projectDeadline,
                    taskUserActualLogs
                );

                await connection.query(
                    `
                    UPDATE tasks
                    SET is_schedule_at_risk = ?,
                        is_deadline_at_risk = ?
                    WHERE task_id = ?
                    `,
                    [
                        risks.is_schedule_at_risk,
                        risks.is_deadline_at_risk,
                        task.task_id
                    ]
                );
            }
        }

        if (taskScheduleEntries.length > 0) {
            const values = taskScheduleEntries.map(entry => [
                entry.task_id,
                entry.user_id,
                entry.schedule_date,
                entry.allocated_hours,
                1
            ]);

            await connection.query(
                `
                INSERT INTO task_schedules
                    (task_id, user_id, schedule_date, allocated_hours, schedule_version)
                VALUES ?
                `,
                [values]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    // Cascade recalculate other active projects that share resources with this project
    // (guarded with isCascaded to prevent recursive loops)
    if (!isCascaded && resourceUserIds.length > 0) {
        const [otherProjects] = await pool.query<RowDataPacket[]>(
            `
            SELECT DISTINCT t.project_id
            FROM tasks t
            INNER JOIN task_assignments ta ON t.task_id = ta.task_id
            INNER JOIN projects p ON t.project_id = p.project_id
            WHERE ta.user_id IN (?)
              AND t.project_id != ?
              AND p.status NOT IN ('COMPLETED', 'CANCELLED', 'ARCHIVED')
              AND p.deleted_at IS NULL
              AND t.deleted_at IS NULL
              AND (t.task_type IS NULL OR t.task_type != 'VERIFICATION')
              AND t.verified_task_id IS NULL
            `,
            [resourceUserIds, projectId]
        );

        for (const row of otherProjects) {
            const otherPid = Number(row.project_id);
            if (otherPid) {
                await recalculate(otherPid, true);
            }
        }
    }
}
