import { getPool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { TaskPriority, TaskStatus } from "../models/taskModel.js";
import { wouldCreateCycle } from "./scheduler/DependencyEngine.js";

export async function createTask(
    projectId: number,
    createdBy: number,
    title: string,
    description: string | null,
    priority: TaskPriority,
    status: TaskStatus,
    deadline: string | null,
    expectedEffort: number,
    assignedResourceIds?: number[],
    supervisorId?: number | null
) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Determine appropriate initial status if default/unspecified
        let initialStatus = status;
        if (!initialStatus || initialStatus === "PENDING" as any || initialStatus === "UNASSIGNED" as any) {
            initialStatus = (assignedResourceIds && assignedResourceIds.length > 0)
                ? ("SCHEDULED" as TaskStatus)
                : ("UNASSIGNED" as TaskStatus);
        }

        const [result] = await connection.query<ResultSetHeader>(
            `
        INSERT INTO tasks
            (project_id, created_by, supervisor_id, title, description, priority, status, deadline, expected_effort, progress)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `,
            [projectId, createdBy, supervisorId ?? null, title, description, priority, initialStatus, deadline, expectedEffort]
        );

        const taskId = result.insertId;

        if (assignedResourceIds && assignedResourceIds.length > 0) {
            // Verify roles and fetch profile details
            const [users] = await connection.query<RowDataPacket[]>(
                "SELECT user_id, name, email, role FROM users WHERE user_id IN (?)",
                [assignedResourceIds]
            );

            const invalidUsers = users.filter(u => u.role !== "RESOURCE");
            if (invalidUsers.length > 0) {
                throw new Error("Only users with RESOURCE role can be assigned to tasks");
            }

            const values = assignedResourceIds.map(userId => [taskId, userId]);
            await connection.query(
                "INSERT INTO task_assignments (task_id, user_id) VALUES ?",
                [values]
            );

            // Ensure assigned resources are also members of the project
            const memberValues = assignedResourceIds.map(userId => [projectId, userId]);
            await connection.query(
                "INSERT IGNORE INTO project_members (project_id, user_id) VALUES ?",
                [memberValues]
            );

            await connection.commit();

            const assignedResources = users.map(u => ({
                user_id: Number(u.user_id),
                name: String(u.name),
                email: String(u.email)
            }));

            return {
                task_id: taskId,
                project_id: projectId,
                created_by: createdBy,
                title,
                description,
                priority,
                status: initialStatus,
                deadline,
                expected_effort: expectedEffort,
                actual_effort: 0,
                progress: 0,
                assigned_resource_ids: assignedResourceIds || [],
                assigned_resources: assignedResources
            };
        }

        await connection.commit();

        return {
            task_id: taskId,
            project_id: projectId,
            created_by: createdBy,
            title,
            description,
            priority,
            status: initialStatus,
            deadline,
            expected_effort: expectedEffort,
            actual_effort: 0,
            progress: 0,
            assigned_resource_ids: [],
            assigned_resources: []
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getPredecessorDetailsMap(allPredIds: number[]): Promise<Map<number, any>> {
    if (allPredIds.length === 0) return new Map();
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT t.task_id, t.project_id, p.name as project_name, t.title, t.status, t.priority, t.deadline,
                t.planned_start, t.planned_end, t.expected_effort, t.actual_effort, t.progress,
                t.is_schedule_at_risk, t.is_deadline_at_risk,
                u_sup.name as supervisor_name,
                GROUP_CONCAT(DISTINCT u_res.name SEPARATOR ', ') as assigned_resource_names
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.project_id
         LEFT JOIN users u_sup ON t.supervisor_id = u_sup.user_id
         LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
         LEFT JOIN users u_res ON ta.user_id = u_res.user_id
         WHERE t.task_id IN (?)
         GROUP BY t.task_id`,
        [allPredIds]
    );

    const map = new Map<number, any>();
    for (const r of rows) {
        map.set(Number(r.task_id), {
            task_id: Number(r.task_id),
            project_id: Number(r.project_id),
            project_name: r.project_name || undefined,
            title: r.title,
            status: r.status,
            priority: r.priority,
            deadline: r.deadline ? (r.deadline instanceof Date ? r.deadline.toISOString().split("T")[0] : String(r.deadline).split("T")[0]) : null,
            planned_start: r.planned_start ? String(r.planned_start) : null,
            planned_end: r.planned_end ? String(r.planned_end) : null,
            expected_effort: Number(r.expected_effort || 0),
            actual_effort: Number(r.actual_effort || 0),
            progress: Number(r.progress || 0),
            is_schedule_at_risk: Boolean(r.is_schedule_at_risk),
            is_deadline_at_risk: Boolean(r.is_deadline_at_risk),
            assigned_resource_names: r.assigned_resource_names ? String(r.assigned_resource_names).split(", ").filter(Boolean) : [],
            supervisor_name: r.supervisor_name || null
        });
    }
    return map;
}

export async function getTasksList(filters: {
    projectId?: number | undefined;
    resourceId?: number | undefined;
    projectIds?: number[] | undefined;
    assignedOrSupervisedByUserId?: number | undefined;
}) {
    const pool = getPool();

    let query = `
        SELECT t.*, 
            p.name as project_name,
            u_sup.name as supervisor_name,
            u_sup.email as supervisor_email,
            GROUP_CONCAT(DISTINCT ta.user_id) as assigned_resource_ids,
            GROUP_CONCAT(DISTINCT u_res.name SEPARATOR ', ') as assigned_resource_names,
            GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN users u_sup ON t.supervisor_id = u_sup.user_id
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
        LEFT JOIN users u_res ON ta.user_id = u_res.user_id
        LEFT JOIN task_dependencies td ON t.task_id = td.task_id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (filters.projectId) {
        whereClauses.push("t.project_id = ?");
        params.push(filters.projectId);
    }

    if (filters.projectIds) {
        if (filters.projectIds.length > 0) {
            whereClauses.push("t.project_id IN (?)");
            params.push(filters.projectIds);
        } else {
            whereClauses.push("1 = 0");
        }
    }

    if (filters.assignedOrSupervisedByUserId) {
        whereClauses.push("(t.task_id IN (SELECT task_id FROM task_assignments WHERE user_id = ?) OR t.supervisor_id = ?)");
        params.push(filters.assignedOrSupervisedByUserId, filters.assignedOrSupervisedByUserId);
    } else if (filters.resourceId) {
        whereClauses.push("t.task_id IN (SELECT task_id FROM task_assignments WHERE user_id = ?)");
        params.push(filters.resourceId);
    }

    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " GROUP BY t.task_id ORDER BY t.created_at DESC";

    const [tasks] = await pool.query<RowDataPacket[]>(query, params);
    if (tasks.length === 0) {
        return [];
    }

    const taskIds = tasks.map(t => t.task_id);
    const [schedules] = await pool.query<RowDataPacket[]>(
        `SELECT ts.schedule_id, ts.task_id, ts.user_id, ts.schedule_date, ts.allocated_hours, ts.schedule_version, u.name as resource_name
         FROM task_schedules ts
         LEFT JOIN users u ON ts.user_id = u.user_id
         WHERE ts.task_id IN (?)
         ORDER BY ts.schedule_date ASC`,
        [taskIds]
    );

    const [assignments] = await pool.query<RowDataPacket[]>(
        `SELECT ta.task_id, ta.user_id, u.name as resource_name, u.email as resource_email
         FROM task_assignments ta
         JOIN users u ON ta.user_id = u.user_id
         WHERE ta.task_id IN (?)`,
        [taskIds]
    );

    const assignmentMap = new Map<number, { user_id: number; name: string; email: string }[]>();
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

    // Collect all unique predecessor task IDs across all fetched tasks
    const allPredecessorIdsSet = new Set<number>();
    for (const t of tasks) {
        if (t.predecessor_task_ids) {
            String(t.predecessor_task_ids).split(",").map(Number).forEach(id => {
                if (id && !isNaN(id)) allPredecessorIdsSet.add(id);
            });
        }
    }

    const predDetailsMap = await getPredecessorDetailsMap(Array.from(allPredecessorIdsSet));

    return tasks.map(t => {
        const predIds = t.predecessor_task_ids
            ? String(t.predecessor_task_ids).split(",").map(Number).filter(id => !isNaN(id))
            : [];
        const predecessors = predIds
            .map(id => predDetailsMap.get(id))
            .filter(Boolean);

        return {
            ...t,
            supervisor_id: t.supervisor_id ? Number(t.supervisor_id) : null,
            supervisor_name: t.supervisor_name || null,
            supervisor_email: t.supervisor_email || null,
            assigned_resource_ids: t.assigned_resource_ids
                ? String(t.assigned_resource_ids).split(",").map(Number).filter(id => !isNaN(id))
                : [],
            assigned_resources: assignmentMap.get(Number(t.task_id)) || [],
            assigned_resource_names: t.assigned_resource_names
                ? String(t.assigned_resource_names).split(", ").filter(Boolean)
                : (assignmentMap.get(Number(t.task_id)) || []).map(a => a.name),
            predecessor_task_ids: predIds,
            predecessors,
            schedules: scheduleMap.get(Number(t.task_id)) || []
        };
    });
}

export async function getTaskById(taskId: number) {
    const pool = getPool();
    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.*, 
               p.name as project_name,
               u_sup.name as supervisor_name,
               u_sup.email as supervisor_email,
               GROUP_CONCAT(DISTINCT ta.user_id) as assigned_resource_ids,
               GROUP_CONCAT(DISTINCT u_res.name SEPARATOR ', ') as assigned_resource_names,
               GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN users u_sup ON t.supervisor_id = u_sup.user_id
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
        LEFT JOIN users u_res ON ta.user_id = u_res.user_id
        LEFT JOIN task_dependencies td ON t.task_id = td.task_id
        WHERE t.task_id = ?
        GROUP BY t.task_id
        `,
        [taskId]
    );

    if (tasks.length === 0) {
        return null;
    }

    const task = tasks[0];
    if (!task) {
        return null;
    }

    const [schedules] = await pool.query<RowDataPacket[]>(
        `SELECT ts.schedule_id, ts.task_id, ts.user_id, ts.schedule_date, ts.allocated_hours, ts.schedule_version, u.name as resource_name
         FROM task_schedules ts
         LEFT JOIN users u ON ts.user_id = u.user_id
         WHERE ts.task_id = ?
         ORDER BY ts.schedule_date ASC`,
        [taskId]
    );

    const [assignments] = await pool.query<RowDataPacket[]>(
        `SELECT ta.task_id, ta.user_id, u.name as resource_name, u.email as resource_email
         FROM task_assignments ta
         JOIN users u ON ta.user_id = u.user_id
         WHERE ta.task_id = ?`,
        [taskId]
    );

    const assignedResources = assignments.map(a => ({
        user_id: Number(a.user_id),
        name: String(a.resource_name),
        email: String(a.resource_email)
    }));

    const formattedSchedules = schedules.map(s => ({
        schedule_id: Number(s.schedule_id),
        task_id: Number(s.task_id),
        user_id: Number(s.user_id),
        schedule_date: s.schedule_date instanceof Date ? s.schedule_date.toISOString().split("T")[0] : String(s.schedule_date).split("T")[0],
        allocated_hours: Number(Number(s.allocated_hours).toFixed(2)),
        schedule_version: Number(s.schedule_version),
        resource_name: s.resource_name || undefined
    }));

    const predIds = task.predecessor_task_ids
        ? String(task.predecessor_task_ids).split(",").map(Number).filter((id: number) => !isNaN(id))
        : [];
    const predDetailsMap = await getPredecessorDetailsMap(predIds);
    const predecessors = predIds.map((id: number) => predDetailsMap.get(id)).filter(Boolean);

    return {
        ...task,
        supervisor_id: task.supervisor_id ? Number(task.supervisor_id) : null,
        supervisor_name: task.supervisor_name || null,
        supervisor_email: task.supervisor_email || null,
        assigned_resource_ids: task.assigned_resource_ids
            ? String(task.assigned_resource_ids).split(",").map(Number).filter(id => !isNaN(id))
            : [],
        assigned_resources: assignedResources,
        assigned_resource_names: task.assigned_resource_names
            ? String(task.assigned_resource_names).split(", ").filter(Boolean)
            : assignedResources.map(a => a.name),
        predecessor_task_ids: predIds,
        predecessors,
        schedules: formattedSchedules
    } as any;
}

export async function assignResourceToTask(
    taskId: number,
    projectManagerId: number,
    resourceId: number
) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [tasks] = await connection.query<RowDataPacket[]>(
            `
            SELECT t.task_id, t.project_id, t.status
            FROM tasks t
            JOIN projects p
                ON t.project_id = p.project_id
            WHERE t.task_id = ?
              AND p.project_manager_id = ?
            LIMIT 1
            `,
            [taskId, projectManagerId]
        );

        if (tasks.length === 0)
            throw new Error("TASK_NOT_FOUND");

        const task = tasks[0]!;

        const [users] = await connection.query<RowDataPacket[]>(
            `
            SELECT user_id
            FROM users
            WHERE user_id = ?
              AND role = 'RESOURCE'
              AND is_active = TRUE
            LIMIT 1
            `,
            [resourceId]
        );

        if (users.length === 0)
            throw new Error("RESOURCE_NOT_FOUND");

        const [members] = await connection.query<RowDataPacket[]>(
            `
            SELECT user_id
            FROM project_members
            WHERE project_id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [task.project_id, resourceId]
        );

        if (members.length === 0)
            throw new Error("RESOURCE_NOT_PROJECT_MEMBER");

        const [existingAssignments] = await connection.query<RowDataPacket[]>(
            `
            SELECT task_id
            FROM task_assignments
            WHERE task_id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [taskId, resourceId]
        );

        if (existingAssignments.length > 0)
            throw new Error("RESOURCE_ALREADY_ASSIGNED");

        await connection.query(
            `
            INSERT INTO task_assignments
                (task_id, user_id)
            VALUES
                (?, ?)
            `,
            [taskId, resourceId]
        );

        // If task is UNASSIGNED or PENDING, transition to SCHEDULED
        if (task.status === "UNASSIGNED" || task.status === "PENDING") {
            await connection.query(
                `UPDATE tasks SET status = 'SCHEDULED' WHERE task_id = ?`,
                [taskId]
            );
        }

        await connection.commit();

        return {
            task_id: taskId,
            user_id: resourceId,
            project_id: task.project_id
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function addTaskDependency(taskId: number, predecessorTaskId: number) {
    const pool = getPool();

    if (taskId === predecessorTaskId) {
        throw new Error("A task cannot depend on itself.");
    }

    // Verify both tasks exist and belong to the same project
    const [taskRows] = await pool.query<RowDataPacket[]>(
        "SELECT task_id, project_id, title FROM tasks WHERE task_id IN (?, ?)",
        [taskId, predecessorTaskId]
    );

    if (taskRows.length < 2) {
        throw new Error("One or both tasks could not be found.");
    }

    const currentTask = taskRows.find(r => Number(r.task_id) === taskId);
    const predTask = taskRows.find(r => Number(r.task_id) === predecessorTaskId);

    if (!currentTask || !predTask) {
        throw new Error("Task not found.");
    }

    if (currentTask.project_id !== predTask.project_id) {
        throw new Error("Cross-project dependencies are not supported.");
    }

    // Check if the dependency already exists
    const [existing] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM task_dependencies WHERE task_id = ? AND predecessor_task_id = ?",
        [taskId, predecessorTaskId]
    );
    if (existing.length > 0) return;

    // Fetch all existing dependencies for this project to check for cycles
    const [projectDeps] = await pool.query<RowDataPacket[]>(
        `
        SELECT td.task_id, td.predecessor_task_id
        FROM task_dependencies td
        INNER JOIN tasks t ON td.task_id = t.task_id
        WHERE t.project_id = ?
        `,
        [currentTask.project_id]
    );

    const dependenciesList = projectDeps.map(r => ({
        task_id: Number(r.task_id),
        predecessor_task_id: Number(r.predecessor_task_id)
    }));

    const cycleCheck = wouldCreateCycle(taskId, predecessorTaskId, dependenciesList);
    if (cycleCheck.hasCycle) {
        throw new Error(
            `Cannot add dependency: "${predTask.title}" already depends on "${currentTask.title}". Adding this dependency would create a circular dependency loop.`
        );
    }

    await pool.query(
        "INSERT INTO task_dependencies (task_id, predecessor_task_id) VALUES (?, ?)",
        [taskId, predecessorTaskId]
    );
}

export async function getTaskDependencies(taskId: number): Promise<number[]> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT predecessor_task_id FROM task_dependencies WHERE task_id = ?",
        [taskId]
    );
    return rows.map(r => Number(r.predecessor_task_id));
}

export async function updateTask(taskId: number, updates: Record<string, any>) {
    const pool = getPool();
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const params = [...Object.values(updates), taskId];

    await pool.query(`UPDATE tasks SET ${setClause} WHERE task_id = ?`, params);
}

export async function getBottleneckTasks(projectManagerId: number) {
    const pool = getPool();
    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT t.*, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        WHERE p.project_manager_id = ?
          AND t.status != 'COMPLETED'
          AND (
              (t.deadline IS NOT NULL AND t.deadline < CURRENT_DATE)
              OR
              (t.actual_effort > t.expected_effort)
          )
        ORDER BY t.deadline ASC
        `,
        [projectManagerId]
    );
    return tasks;
}

export async function deleteTask(taskId: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            "DELETE FROM task_dependencies WHERE task_id = ? OR predecessor_task_id = ?",
            [taskId, taskId]
        );

        await connection.query("DELETE FROM task_assignments WHERE task_id = ?", [taskId]);
        await connection.query("DELETE FROM work_logs WHERE task_id = ?", [taskId]);

        const [result] = await connection.query<ResultSetHeader>(
            "DELETE FROM tasks WHERE task_id = ?",
            [taskId]
        );

        await connection.commit();
        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function unassignResource(taskId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query<ResultSetHeader>(
            "DELETE FROM task_assignments WHERE task_id = ? AND user_id = ?",
            [taskId, userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        // Check if there are remaining assignees
        const [remaining] = await connection.query<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM task_assignments WHERE task_id = ?",
            [taskId]
        );
        const count = remaining[0]?.count ?? 0;

        // If no assignees left and status is SCHEDULED or PENDING, revert status to UNASSIGNED
        if (count === 0) {
            await connection.query(
                `UPDATE tasks SET status = 'UNASSIGNED' WHERE task_id = ? AND status IN ('SCHEDULED', 'PENDING')`,
                [taskId]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function removeTaskDependency(taskId: number, predecessorTaskId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        "DELETE FROM task_dependencies WHERE task_id = ? AND predecessor_task_id = ?",
        [taskId, predecessorTaskId]
    );
    return result.affectedRows > 0;
}
