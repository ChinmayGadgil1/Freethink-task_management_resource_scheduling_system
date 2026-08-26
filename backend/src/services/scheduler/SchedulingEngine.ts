import { getPool } from "../../config/database.js";
import type { RowDataPacket } from "mysql2";
import type { Task, TaskDependency } from "../../models/taskModel.js";
import { getTaskAvailability } from "./DependencyEngine.js";
import { calculateUrgencyScore, sortTasksByUrgency, type ScoredTask } from "./PriorityEngine.js";
import { getDownstreamDependencyCount } from "./DependencyEngine.js";

export function canCompleteBy(
    task: Task,
    targetDate: string,
    taskResources: Map<number, number[]>,
    holidays: Set<string>,
    leaves: Map<number, Map<string, number>>
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

    const getRiskAvailableHours = (
        userId: number,
        date: string
    ): number => {
        if (holidays.has(date)) {
            return 0;
        }

        let availableHours = 9;

        const userLeave = leaves.get(userId)?.get(date);

        if (userLeave !== undefined) {
            availableHours -= userLeave;
        }

        const allocatedHours =
            riskSchedule.get(userId)?.get(date) ?? 0;

        availableHours -= allocatedHours;

        return Math.max(0, availableHours);
    };

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const cleanTargetDate = targetDate.includes("T") ? targetDate.split("T")[0]! : targetDate;
    const endDate = new Date(`${cleanTargetDate}T00:00:00`);

    while (
        currentDate <= endDate &&
        remainingEffort > 0
    ) {
        const date = currentDate.toISOString().split("T")[0]!;

        for (const userId of resourceIds) {
            if (remainingEffort <= 0) {
                break;
            }

            const availableHours =
                getRiskAvailableHours(userId, date);

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
    leaves: Map<number, Map<string, number>>
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
            leaves
        );

    const isDeadlineAtRisk =
        task.deadline !== null &&
        !canCompleteBy(
            task,
            task.deadline,
            taskResources,
            holidays,
            leaves
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

    const getAvailableHours = (userId: number, date: string): number => {
        // Holiday → nobody can work
        if (holidays.has(date)) {
            return 0;
        }

        // Normal working capacity
        let availableHours = 9;

        // Subtract resource-specific leave
        const userLeave = leaves.get(userId)?.get(date);

        if (userLeave !== undefined) {
            availableHours -= userLeave;
        }

        // Subtract work already allocated during this recalculation
        const allocatedHours =
            resourceSchedule.get(userId)?.get(date) ?? 0;

        availableHours -= allocatedHours;

        // Never allow negative capacity
        return Math.max(0, availableHours);
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
            const date = currentDate.toISOString().split("T")[0]!;

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
                leaves
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
                leaves
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
