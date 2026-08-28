import { getPool } from "../../config/database.js";
import type { RowDataPacket } from "mysql2";
import type { Task, TaskDependency } from "../../models/taskModel.js";
import { getTaskAvailability } from "./DependencyEngine.js";
import { calculateUrgencyScore, sortTasksByUrgency, type ScoredTask } from "./PriorityEngine.js";
import { getDownstreamDependencyCount } from "./DependencyEngine.js";

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
    const clean = dateStr.includes("T") ? dateStr.split("T")[0]! : dateStr;
    const [yearStr, monthStr, dayStr] = clean.split("-");
    const d = new Date(parseInt(yearStr!, 10), parseInt(monthStr!, 10) - 1, parseInt(dayStr!, 10));
    d.setHours(0, 0, 0, 0);
    return d;
}

export function getWeekdayFromDate(dateInput: Date | string): string {
    if (typeof dateInput === "string") {
        const cleanDate = dateInput.includes("T") ? dateInput.split("T")[0]! : dateInput;
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
            nonWorkingDays = new Set<string>();
        }
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
    initialAllocations?: Map<number, Map<string, number>>
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

    const currentDate = new Date();
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
    initialAllocations?: Map<number, Map<string, number>>
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
            initialAllocations
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
            initialAllocations
        );

    return {
        is_schedule_at_risk: isScheduleAtRisk,
        is_deadline_at_risk: isDeadlineAtRisk
    };
}

export async function recalculate(projectId: number): Promise<void> {
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
        planned_start: row.planned_start ? String(row.planned_start).split("T")[0]! : null,
        planned_end: row.planned_end ? String(row.planned_end).split("T")[0]! : null,
        actual_start: row.actual_start ?? null,
        actual_end: row.actual_end ?? null,
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

    const { AVAILABLE } = getTaskAvailability(tasks, dependencies);

    const currentDate = new Date();

    const schedulableTasks = AVAILABLE.filter(
        task => task.status !== "UNASSIGNED"
    );

    const scoredTasks: ScoredTask[] = schedulableTasks.map(task => {
        const downstreamCount = getDownstreamDependencyCount(
            task.task_id,
            dependencies
        );

        return {
            ...task,
            urgency_score: calculateUrgencyScore(task, downstreamCount, currentDate)
        };
    });

    const sortedTasks = sortTasksByUrgency(scoredTasks);

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

        leaves.get(userId)!.set(date, leaveHours);
    }

    const resourceSchedule = new Map<number, Map<string, number>>();
    const crossProjectAllocations = new Map<number, Map<string, number>>();

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
            if (!crossProjectAllocations.has(userId)) {
                crossProjectAllocations.set(userId, new Map());
            }

            resourceSchedule.get(userId)!.set(date, busyHours);
            crossProjectAllocations.get(userId)!.set(date, busyHours);
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

    const scheduledTaskIds = new Set<number>();

    for (const task of sortedTasks) {
        const resourceIds = taskResources.get(task.task_id) ?? [];

        let remainingEffort = Math.max(
            0,
            Number(task.expected_effort) - Number(task.actual_effort)
        );

        if (remainingEffort <= 0 || resourceIds.length === 0) {
            continue;
        }

        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        let plannedStart: string | null = null;
        let plannedEnd: string | null = null;

        while (remainingEffort > 0) {
            const date = formatDateLocal(currentDate);

            let dailyCapacity = 0;

            for (const userId of resourceIds) {
                dailyCapacity += getAvailableHours(userId, date);
            }

            if (dailyCapacity > 0) {
                if (plannedStart === null) {
                    plannedStart = date;
                }

                let hoursRemainingToday = Math.min(
                    remainingEffort,
                    dailyCapacity
                );

                for (const userId of resourceIds) {
                    if (hoursRemainingToday <= 0) {
                        break;
                    }

                    const availableHours = getAvailableHours(userId, date);

                    if (availableHours <= 0) {
                        continue;
                    }

                    const hoursToAllocate = Math.min(
                        availableHours,
                        hoursRemainingToday
                    );

                    if (!resourceSchedule.has(userId)) {
                        resourceSchedule.set(userId, new Map());
                    }

                    const userSchedule = resourceSchedule.get(userId)!;

                    userSchedule.set(
                        date,
                        (userSchedule.get(date) ?? 0) + hoursToAllocate
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

                plannedEnd = date;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (plannedStart !== null && plannedEnd !== null) {
            scheduledTaskIds.add(task.task_id);
            const risks = calculateRisks(
                task,
                plannedEnd,
                taskResources,
                holidays,
                leaves,
                resourceConfigs,
                crossProjectAllocations
            );

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
                    plannedStart,
                    plannedEnd,
                    risks.is_schedule_at_risk,
                    risks.is_deadline_at_risk,
                    task.task_id
                ]
            );
        }
    }

    // For any uncompleted tasks not scheduled above (e.g. UNASSIGNED, blocked by dependencies, or 0 remaining effort)
    for (const task of tasks) {
        if (!scheduledTaskIds.has(task.task_id)) {
            const risks = calculateRisks(
                task,
                task.planned_end ?? null,
                taskResources,
                holidays,
                leaves,
                resourceConfigs,
                crossProjectAllocations
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

    if (tasks.length > 0) {
        const taskIds = tasks.map(task => task.task_id);

        const placeholders = taskIds.map(() => "?").join(", ");

        await pool.query(
            `
            DELETE FROM task_schedules
            WHERE task_id IN (${placeholders})
            `,
            taskIds
        );
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
}
