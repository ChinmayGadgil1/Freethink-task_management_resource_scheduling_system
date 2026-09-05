import { getPool } from "../../config/database.js";
import type { RowDataPacket } from "mysql2";
import type { Task, TaskDependency } from "../../models/taskModel.js";

import { calculateUrgencyScore, sortTasksByUrgency, type ScoredTask } from "./PriorityEngine.js";
import { getDownstreamDependencyCount, detectCycles } from "./DependencyEngine.js";

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

    return Math.max(0, availableHours);
}

export function canCompleteBy(
    task: Task,
    targetDate: string,
    taskResources: Map<number, number[]>,
    holidays: Set<string>,
    leaves: Map<number, Map<string, number>>,
    resourceConfigs: Map<number, ResourceScheduleConfig> = new Map(),
    initialAllocations?: Map<number, Map<string, number>>,
    earliestStart?: Date
): boolean {
    const resourceIds = taskResources.get(task.task_id) ?? [];

    let remainingEffort = Math.max(
        0,
        Number(task.expected_effort) - Number(task.actual_effort)
    );

    if (remainingEffort <= 0) {
        return true;
    }

    if (resourceIds.length === 0) {
        return false;
    }

    const riskSchedule = new Map<number, Map<string, number>>();
    if (initialAllocations) {
        for (const [userId, dateMap] of initialAllocations.entries()) {
            riskSchedule.set(userId, new Map(dateMap));
        }
    }

    const currentDate = earliestStart ? new Date(earliestStart) : new Date();
    currentDate.setHours(0, 0, 0, 0);

    const endDate = parseDateLocal(targetDate);

    while (
        currentDate <= endDate &&
        remainingEffort > 0
    ) {
        const date = formatDateLocal(currentDate);

        for (const userId of resourceIds) {
            if (remainingEffort <= 0) {
                break;
            }

            const availableHours = calculateAvailableHours(
                userId,
                date,
                resourceConfigs,
                holidays,
                leaves,
                riskSchedule
            );

            if (availableHours <= 0) {
                continue;
            }

            const hoursToAllocate = Math.min(
                availableHours,
                remainingEffort
            );

            if (!riskSchedule.has(userId)) {
                riskSchedule.set(userId, new Map());
            }

            const userSchedule = riskSchedule.get(userId)!;

            userSchedule.set(
                date,
                (userSchedule.get(date) ?? 0) + hoursToAllocate
            );

            remainingEffort -= hoursToAllocate;
        }

        currentDate.setDate(
            currentDate.getDate() + 1
        );
    }

    return remainingEffort <= 0;
}

export function calculateRisks(
    task: Task,
    plannedEnd: string | null,
    taskResources: Map<number, number[]>,
    holidays: Set<string>,
    leaves: Map<number, Map<string, number>>,
    resourceConfigs: Map<number, ResourceScheduleConfig> = new Map(),
    initialAllocations?: Map<number, Map<string, number>>,
    earliestStart?: Date
): {
    is_schedule_at_risk: boolean;
    is_deadline_at_risk: boolean;
} {
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
            earliestStart
        );

    const isDeadlineAtRisk =
        task.deadline !== null &&
        !canCompleteBy(
            task,
            task.deadline,
            taskResources,
            holidays,
            leaves,
            resourceConfigs,
            initialAllocations,
            earliestStart
        );

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
            GROUP_CONCAT(DISTINCT ta.user_id) AS assigned_resource_ids
        FROM tasks t
        LEFT JOIN task_assignments ta
            ON t.task_id = ta.task_id
        WHERE t.project_id = ?
          AND t.status != 'COMPLETED'
        GROUP BY t.task_id
        `,
        [projectId]
    );

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

    const [dependencyRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            td.task_id,
            td.predecessor_task_id
        FROM task_dependencies td
        INNER JOIN tasks t
            ON td.task_id = t.task_id
        WHERE t.project_id = ?
        `,
        [projectId]
    );

    const dependencies: TaskDependency[] = dependencyRows.map(row => ({
        task_id: Number(row.task_id),
        predecessor_task_id: Number(row.predecessor_task_id)
    }));

    // Validate that task graph is acyclic before running scheduling calculations
    try {
        detectCycles(tasks, dependencies);
    } catch (cycleError: any) {
        console.error(`SchedulingEngine: Cycle detected in project ${projectId}:`, cycleError.message);
        throw cycleError;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inDegree = new Map<number, number>();
    const adjList = new Map<number, number[]>();

    for (const task of tasks) {
        inDegree.set(task.task_id, 0);
        adjList.set(task.task_id, []);
    }

    for (const dep of dependencies) {
        if (inDegree.has(dep.task_id) && inDegree.has(dep.predecessor_task_id)) {
            adjList.get(dep.predecessor_task_id)!.push(dep.task_id);
            inDegree.set(dep.task_id, inDegree.get(dep.task_id)! + 1);
        }
    }

    const downstreamCountMap = new Map<number, number>();
    for (const task of tasks) {
        downstreamCountMap.set(task.task_id, getDownstreamDependencyCount(task.task_id, dependencies));
    }

    let availableTasks: ScoredTask[] = [];
    for (const task of tasks) {
        if (inDegree.get(task.task_id) === 0) {
            availableTasks.push({
                ...task,
                urgency_score: calculateUrgencyScore(task, downstreamCountMap.get(task.task_id) ?? 0, today)
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

    // Fetch leave dates for resources involved in this project
    const [leaveRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            ul.user_id,
            ul.leave_date,
            ul.leave_hours
        FROM user_leaves ul
        INNER JOIN (
            SELECT DISTINCT ta.user_id
            FROM task_assignments ta
            INNER JOIN tasks t
                ON ta.task_id = t.task_id
            WHERE t.project_id = ?
        ) project_resources
            ON ul.user_id = project_resources.user_id
        WHERE ul.status = 'APPROVED'
        `,
        [projectId]
    );

    // Fetch non_working_days and daily_working_hours for resources involved in this project
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
            UNION
            SELECT DISTINCT pm.user_id
            FROM project_members pm
            WHERE pm.project_id = ?
        ) project_resources
            ON u.user_id = project_resources.user_id
        `,
        [projectId, projectId]
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

    for (const row of leaveRows) {
        const userId = Number(row.user_id);
        const date = String(row.leave_date).split("T")[0]!;
        const leaveHours = Number(row.leave_hours);

        if (!leaves.has(userId)) {
            leaves.set(userId, new Map());
        }

        const userLeaveMap = leaves.get(userId)!;
        const currentHours = userLeaveMap.get(date) || 0;
        userLeaveMap.set(date, currentHours + leaveHours);
    }

    const resourceSchedule = new Map<number, Map<string, number>>();

    const resourceUserIds = Array.from(resourceConfigs.keys());

    // Preload existing task allocations from other projects for these resources
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
            WHERE ts.user_id IN (?)
              AND t.project_id != ?
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

    const getAvailableHours = (userId: number, date: string): number => {
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
    for (const task of tasks) {
        earliestStarts.set(task.task_id, new Date(today));
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
        let remainingEffort = Math.max(
            0,
            Number(task.expected_effort) - Number(task.actual_effort)
        );

        let plannedStart: string | null = null;
        let plannedEnd: string | null = null;
        
        let taskEarliestStart = earliestStarts.get(task.task_id) ?? new Date(today);
        let taskFinalEnd: Date | null = null;

        if (remainingEffort > 0 && resourceIds.length > 0 && task.status !== "UNASSIGNED") {
            let currentDate = new Date(taskEarliestStart);
            currentDate.setHours(0, 0, 0, 0);

            const initialAllocationsForRisk = new Map<number, Map<string, number>>();
            for (const [uid, datesMap] of resourceSchedule.entries()) {
                initialAllocationsForRisk.set(uid, new Map(datesMap));
            }

            while (remainingEffort > 0) {
                const date = formatDateLocal(currentDate);
                let dependencyHourOffset = 0;
                if (date === formatDateLocal(taskEarliestStart)) {
                    dependencyHourOffset = Math.max(0, taskEarliestStart.getHours() - 10 + taskEarliestStart.getMinutes() / 60);
                }

                let dailyCapacity = 0;

                for (const userId of resourceIds) {
                    const avail = getAvailableHours(userId, date);
                    const userSched = resourceSchedule.get(userId);
                    const alreadySched = userSched?.get(date) ?? 0;
                    const extraLost = Math.max(0, dependencyHourOffset - alreadySched);
                    dailyCapacity += Math.max(0, avail - extraLost);
                }

                if (dailyCapacity > 0) {
                    let hoursRemainingToday = Math.min(
                        remainingEffort,
                        dailyCapacity
                    );

                    for (const userId of resourceIds) {
                        if (hoursRemainingToday <= 0) {
                            break;
                        }

                        const availableHours = getAvailableHours(userId, date);
                        const userSchedMap = resourceSchedule.get(userId);
                        const alreadyScheduled = userSchedMap?.get(date) ?? 0;
                        const extraLost = Math.max(0, dependencyHourOffset - alreadyScheduled);
                        const effectiveAvailableHours = Math.max(0, availableHours - extraLost);

                        if (effectiveAvailableHours <= 0) {
                            continue;
                        }

                        const hoursToAllocate = Math.min(
                            effectiveAvailableHours,
                            hoursRemainingToday
                        );

                        if (!resourceSchedule.has(userId)) {
                            resourceSchedule.set(userId, new Map());
                        }

                        const userSchedule = resourceSchedule.get(userId)!;
                        const startHourOffset = Math.max(alreadyScheduled, dependencyHourOffset);
                        const endHourOffset = startHourOffset + hoursToAllocate;
                        
                        const currentStartTime = formatDateTimeLocal(currentDate, startHourOffset);
                        const currentEndTime = formatDateTimeLocal(currentDate, endHourOffset);

                        if (plannedStart === null || currentStartTime < plannedStart) {
                            plannedStart = currentStartTime;
                        }
                        if (plannedEnd === null || currentEndTime > plannedEnd) {
                            plannedEnd = currentEndTime;
                        }

                        userSchedule.set(
                            date,
                            startHourOffset + hoursToAllocate
                        );

                        taskScheduleEntries.push({
                            task_id: task.task_id,
                            user_id: userId,
                            schedule_date: date,
                            allocated_hours: hoursToAllocate
                        });

                        hoursRemainingToday -= hoursToAllocate;
                        remainingEffort -= hoursToAllocate;
                    }

                    if (plannedEnd) {
                        taskFinalEnd = new Date(plannedEnd.replace(' ', 'T'));
                    } else {
                        taskFinalEnd = new Date(currentDate);
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            const risks = calculateRisks(
                task,
                plannedEnd,
                taskResources,
                holidays,
                leaves,
                resourceConfigs,
                initialAllocationsForRisk,
                taskEarliestStart
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
            
            const risks = calculateRisks(
                task,
                task.planned_end ?? null,
                taskResources,
                holidays,
                leaves,
                resourceConfigs,
                initialAllocationsForRisk,
                taskEarliestStart
            );
            
            taskUpdates.set(task.task_id, {
                planned_start: task.planned_start ?? null,
                planned_end: task.planned_end ?? null,
                is_schedule_at_risk: risks.is_schedule_at_risk,
                is_deadline_at_risk: risks.is_deadline_at_risk
            });
            
            taskFinalEnd = new Date(taskEarliestStart);
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
                    urgency_score: calculateUrgencyScore(succTask, downstreamCountMap.get(succ) ?? 0, today)
                });
            }
        }
    }

    // Delete all task_schedules belonging to this project (purging allocations of completed tasks as well)
    await pool.query(
        `
        DELETE ts FROM task_schedules ts
        INNER JOIN tasks t ON ts.task_id = t.task_id
        WHERE t.project_id = ?
        `,
        [projectId]
    );
    
    for (const [taskId, update] of taskUpdates.entries()) {
        await pool.query(
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
                today
            );

            await pool.query(
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

        await pool.query(
            `
            INSERT INTO task_schedules
                (task_id, user_id, schedule_date, allocated_hours, schedule_version)
            VALUES ?
            `,
            [values]
        );
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
              AND p.status IN ('ACTIVE', 'PUBLISHED')
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
