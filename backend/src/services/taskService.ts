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
    supervisorId?: number | null,
    taskType?: "STANDARD" | "VERIFICATION",
    verifiedTaskId?: number | null
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
            (project_id, created_by, supervisor_id, task_type, verified_task_id, title, description, priority, status, deadline, expected_effort, progress)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `,
            [
                projectId,
                createdBy,
                supervisorId ?? null,
                taskType || "STANDARD",
                verifiedTaskId ?? null,
                title,
                description,
                priority,
                initialStatus,
                deadline,
                expectedEffort
            ]
        );

        const taskId = result.insertId;

        const [creatorRows] = await connection.query<RowDataPacket[]>(
            "SELECT name, role FROM users WHERE user_id = ?",
            [createdBy]
        );
        const creatorFirst = creatorRows[0];
        const creatorName = creatorFirst?.name ? String(creatorFirst.name) : null;
        const creatorRole = creatorFirst?.role ? String(creatorFirst.role) : null;

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

            // Generate notification for assigned resources (self-assigned vs manager-assigned)
            for (const rId of assignedResourceIds) {
                const isSelf = Number(rId) === createdBy;
                const notifType = isSelf ? "TASK_CREATED" : "TASK_ASSIGNED";
                const notifTitle = isSelf
                    ? `Self-Assigned Task: ${title}`
                    : `Task Assignment: ${title}`;
                const notifMessage = isSelf
                    ? `You created and assigned yourself to task "${title}".`
                    : `${creatorName || "Project Manager"} assigned you to task "${title}".`;
                const notifLink = `/app/resource-dashboard/task-details/${taskId}`;

                await connection.query(
                    `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                     VALUES (?, ?, ?, ?, ?, FALSE, NOW())`,
                    [rId, notifType, notifTitle, notifMessage, notifLink]
                );
            }

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
                created_by_name: creatorName,
                created_by_role: creatorRole,
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
            created_by_name: creatorName,
            created_by_role: creatorRole,
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
            u_creator.name as created_by_name,
            u_creator.role as created_by_role,
            verified_t.title as verified_task_title,
            verified_t.status as verified_task_status,
            GROUP_CONCAT(DISTINCT ta.user_id) as assigned_resource_ids,
            GROUP_CONCAT(DISTINCT u_res.name SEPARATOR ', ') as assigned_resource_names,
            GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN users u_sup ON t.supervisor_id = u_sup.user_id
        LEFT JOIN users u_creator ON t.created_by = u_creator.user_id
        LEFT JOIN tasks verified_t ON t.verified_task_id = verified_t.task_id
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

    whereClauses.push("t.deleted_at IS NULL");
    whereClauses.push("(p.deleted_at IS NULL OR p.deleted_at IS NOT NULL AND t.project_id IS NULL)");

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

    const [verifications] = await pool.query<RowDataPacket[]>(
        `SELECT vt.task_id as verification_task_id, vt.verified_task_id, vt.status, vt.progress, vt.expected_effort, vt.actual_effort, vt.created_at,
                ta.user_id as verifier_id, u.name as verifier_name
         FROM tasks vt
         LEFT JOIN task_assignments ta ON vt.task_id = ta.task_id
         LEFT JOIN users u ON ta.user_id = u.user_id
         WHERE vt.verified_task_id IN (?) AND vt.task_type = 'VERIFICATION' AND vt.deleted_at IS NULL
         ORDER BY vt.created_at DESC`,
        [taskIds]
    );

    const verificationMap = new Map<number, any[]>();
    for (const v of verifications) {
        const vParentId = Number(v.verified_task_id);
        if (!verificationMap.has(vParentId)) {
            verificationMap.set(vParentId, []);
        }
        verificationMap.get(vParentId)!.push({
            verification_task_id: Number(v.verification_task_id),
            verifier_id: Number(v.verifier_id),
            verifier_name: String(v.verifier_name || 'Assigned Verifier'),
            status: v.status,
            progress: Number(v.progress || 0),
            expected_effort: Number(v.expected_effort || 0),
            actual_effort: Number(v.actual_effort || 0),
            created_at: v.created_at
        });
    }

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

        const taskVerifs = verificationMap.get(Number(t.task_id)) || [];
        const latestVerif = taskVerifs.length > 0 ? taskVerifs[0] : null;

        return {
            ...t,
            created_by: t.created_by ? Number(t.created_by) : undefined,
            created_by_name: t.created_by_name || null,
            created_by_role: t.created_by_role || null,
            supervisor_id: t.supervisor_id ? Number(t.supervisor_id) : null,
            supervisor_name: t.supervisor_name || null,
            supervisor_email: t.supervisor_email || null,
            task_type: t.task_type || 'STANDARD',
            verified_task_id: t.verified_task_id ? Number(t.verified_task_id) : null,
            verified_task_title: t.verified_task_title || null,
            verified_task_status: t.verified_task_status || null,
            verification_task: latestVerif,
            verifications: taskVerifs,
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
               u_creator.name as created_by_name,
               u_creator.role as created_by_role,
               verified_t.title as verified_task_title,
               verified_t.status as verified_task_status,
               GROUP_CONCAT(DISTINCT ta.user_id) as assigned_resource_ids,
               GROUP_CONCAT(DISTINCT u_res.name SEPARATOR ', ') as assigned_resource_names,
               GROUP_CONCAT(DISTINCT td.predecessor_task_id) as predecessor_task_ids
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN users u_sup ON t.supervisor_id = u_sup.user_id
        LEFT JOIN users u_creator ON t.created_by = u_creator.user_id
        LEFT JOIN tasks verified_t ON t.verified_task_id = verified_t.task_id
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

    const [verifications] = await pool.query<RowDataPacket[]>(
        `SELECT vt.task_id as verification_task_id, vt.verified_task_id, vt.status, vt.progress, vt.expected_effort, vt.actual_effort, vt.created_at,
                ta.user_id as verifier_id, u.name as verifier_name
         FROM tasks vt
         LEFT JOIN task_assignments ta ON vt.task_id = ta.task_id
         LEFT JOIN users u ON ta.user_id = u.user_id
         WHERE vt.verified_task_id = ? AND vt.task_type = 'VERIFICATION' AND vt.deleted_at IS NULL
         ORDER BY vt.created_at DESC`,
        [taskId]
    );

    const formattedVerifications = verifications.map(v => ({
        verification_task_id: Number(v.verification_task_id),
        verifier_id: Number(v.verifier_id),
        verifier_name: String(v.verifier_name || 'Assigned Verifier'),
        status: v.status,
        progress: Number(v.progress || 0),
        expected_effort: Number(v.expected_effort || 0),
        actual_effort: Number(v.actual_effort || 0),
        created_at: v.created_at
    }));

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
        created_by: task.created_by ? Number(task.created_by) : undefined,
        created_by_name: task.created_by_name || null,
        created_by_role: task.created_by_role || null,
        supervisor_id: task.supervisor_id ? Number(task.supervisor_id) : null,
        supervisor_name: task.supervisor_name || null,
        supervisor_email: task.supervisor_email || null,
        task_type: task.task_type || 'STANDARD',
        verified_task_id: task.verified_task_id ? Number(task.verified_task_id) : null,
        verified_task_title: task.verified_task_title || null,
        verified_task_status: task.verified_task_status || null,
        verification_task: formattedVerifications.length > 0 ? formattedVerifications[0] : null,
        verifications: formattedVerifications,
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

export async function assignVerificationTask(
    completedTaskId: number,
    verifierId: number,
    createdBy: number,
    notes?: string,
    expectedEffort?: number
) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Fetch original completed task
        const [taskRows] = await connection.query<RowDataPacket[]>(
            `SELECT t.*, p.name as project_name, p.project_manager_id
             FROM tasks t
             JOIN projects p ON t.project_id = p.project_id
             WHERE t.task_id = ? AND t.deleted_at IS NULL`,
            [completedTaskId]
        );

        if (taskRows.length === 0) {
            throw new Error("TASK_NOT_FOUND");
        }

        const originalTask = taskRows[0]!;

        // 2. Validate verifier user
        const [userRows] = await connection.query<RowDataPacket[]>(
            `SELECT user_id, name, email, role FROM users WHERE user_id = ? AND is_active = TRUE`,
            [verifierId]
        );

        if (userRows.length === 0 || userRows[0]!.role !== "RESOURCE") {
            throw new Error("INVALID_VERIFIER: Verifier must be an active resource.");
        }

        const verifier = userRows[0]!;

        // 3. Create new verification task
        const verificationTitle = `Verification: ${originalTask.title}`;
        const verificationDesc = notes && notes.trim()
            ? `Verification for completed task "${originalTask.title}".\n\nInstructions / Notes:\n${notes.trim()}`
            : `Verification for completed task "${originalTask.title}". Please review deliverables and confirm completion.`;
        const effort = (expectedEffort && Number(expectedEffort) > 0) ? Number(expectedEffort) : 2.0;

        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO tasks (
                project_id, created_by, task_type, verified_task_id,
                title, description, priority, status, deadline,
                expected_effort, actual_effort, progress
            ) VALUES (?, ?, 'VERIFICATION', ?, ?, ?, 'NONE', 'SCHEDULED', ?, ?, 0, 0)`,
            [
                originalTask.project_id,
                createdBy,
                completedTaskId,
                verificationTitle,
                verificationDesc,
                originalTask.deadline || null,
                effort
            ]
        );

        const verificationTaskId = result.insertId;

        // 4. Assign verifier to verification task
        await connection.query(
            `INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)`,
            [verificationTaskId, verifierId]
        );

        // 5. Ensure verifier is in project_members
        await connection.query(
            `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
            [originalTask.project_id, verifierId]
        );

        // 6. Create notification for the verifier
        const [creatorRows] = await connection.query<RowDataPacket[]>(
            `SELECT name FROM users WHERE user_id = ?`,
            [createdBy]
        );
        const assignerName = creatorRows[0]?.name || "Team Member";

        await connection.query(
            `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
             VALUES (?, 'TASK_VERIFICATION', ?, ?, ?, FALSE, NOW())`,
            [
                verifierId,
                `Verification Request: ${originalTask.title}`,
                `${assignerName} assigned you to verify completed task "${originalTask.title}".`,
                `/app/resource-dashboard/task-details/${verificationTaskId}`
            ]
        );

        await connection.commit();

        return {
            task_id: verificationTaskId,
            project_id: originalTask.project_id,
            title: verificationTitle,
            task_type: "VERIFICATION" as const,
            verified_task_id: completedTaskId,
            verified_task_title: originalTask.title,
            priority: "NONE" as const,
            status: "SCHEDULED" as const,
            expected_effort: effort,
            progress: 0,
            assigned_resource_ids: [verifierId],
            assigned_resources: [{ user_id: verifierId, name: verifier.name, email: verifier.email }]
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
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

        // Fetch task and PM info to generate notification
        const [taskInfoRows] = await connection.query<RowDataPacket[]>(
            `SELECT t.title, u.name as pm_name
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.project_id
             LEFT JOIN users u ON p.project_manager_id = u.user_id
             WHERE t.task_id = ?`,
            [taskId]
        );
        const taskTitle = taskInfoRows[0]?.title || "Task";
        const pmName = taskInfoRows[0]?.pm_name || "Project Manager";

        await connection.query(
            `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
             VALUES (?, 'TASK_ASSIGNED', ?, ?, ?, FALSE, NOW())`,
            [
                resourceId,
                `Task Assignment: ${taskTitle}`,
                `${pmName} assigned you to task "${taskTitle}".`,
                `/app/resource-dashboard/task-details/${taskId}`
            ]
        );

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
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
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

/**
 * Move Task to Recycle Bin (Fake Delete / Soft Delete)
 * Safeguard: Blocks deletion if task is IN_PROGRESS or has an active timer session.
 */
export async function moveToBinTask(taskId: number): Promise<{ success: boolean; projectId?: number; message?: string }> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check for IN_PROGRESS status or active timer session
        const [taskRows] = await connection.query<RowDataPacket[]>(
            `
            SELECT t.task_id, t.project_id, t.title, t.status,
                   EXISTS (
                       SELECT 1 FROM task_sessions ts
                       WHERE ts.task_id = t.task_id AND ts.is_active = TRUE
                   ) as has_active_session
            FROM tasks t
            WHERE t.task_id = ? AND t.deleted_at IS NULL
            FOR UPDATE
            `,
            [taskId]
        );

        if (taskRows.length === 0) {
            await connection.rollback();
            return { success: false, message: "Task not found or already in bin." };
        }

        const task = taskRows[0]!;
        if (task.status === "IN_PROGRESS") {
            throw new Error(`CANNOT_DELETE_ACTIVE_TASK: Task "${task.title}" is currently in progress. Please pause or complete it before moving to the bin.`);
        }

        if (Boolean(task.has_active_session)) {
            throw new Error(`CANNOT_DELETE_ACTIVE_TASK: Task "${task.title}" currently has an active work timer running. Please stop the timer first.`);
        }

        const projectId = Number(task.project_id);

        // 2. Soft delete the task
        await connection.query(
            "UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE task_id = ?",
            [taskId]
        );

        // 3. Clear Gantt daily allocations for this task to immediately release resource capacity
        await connection.query("DELETE FROM task_schedules WHERE task_id = ?", [taskId]);

        await connection.commit();
        return { success: true, projectId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get all binned tasks for a project manager or project
 */
export async function getBinnedTasks(projectManagerId: number) {
    const pool = getPool();

    const [tasks] = await pool.query<RowDataPacket[]>(
        `
        SELECT 
            t.task_id,
            t.project_id,
            t.title,
            t.description,
            t.priority,
            t.status,
            t.deadline,
            t.expected_effort,
            t.actual_effort,
            t.progress,
            t.deleted_at,
            p.name as project_name,
            p.deleted_at as project_deleted_at,
            GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as assigned_resource_names
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
        LEFT JOIN users u ON ta.user_id = u.user_id
        WHERE p.project_manager_id = ?
          AND t.deleted_at IS NOT NULL
        GROUP BY t.task_id
        ORDER BY t.deleted_at DESC
        `,
        [projectManagerId]
    );

    return tasks;
}

/**
 * Restore a task from the bin
 */
export async function restoreTaskFromBin(taskId: number): Promise<{ success: boolean; projectId?: number; error?: string }> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [taskRows] = await connection.query<RowDataPacket[]>(
            `
            SELECT t.task_id, t.project_id, t.title, p.deleted_at as project_deleted_at
            FROM tasks t
            JOIN projects p ON t.project_id = p.project_id
            WHERE t.task_id = ? AND t.deleted_at IS NOT NULL
            FOR UPDATE
            `,
            [taskId]
        );

        if (taskRows.length === 0) {
            await connection.rollback();
            return { success: false, error: "Task not found in bin." };
        }

        const task = taskRows[0]!;
        const projectId = Number(task.project_id);

        // Safeguard: If parent project is still binned, restore parent project as well or alert
        if (task.project_deleted_at !== null) {
            await connection.query("UPDATE projects SET deleted_at = NULL WHERE project_id = ?", [projectId]);
        }

        await connection.query("UPDATE tasks SET deleted_at = NULL WHERE task_id = ?", [taskId]);

        await connection.commit();
        return { success: true, projectId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function deleteTask(taskId: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query("DELETE FROM task_schedules WHERE task_id = ?", [taskId]);
        await connection.query(
            "DELETE FROM task_dependencies WHERE task_id = ? OR predecessor_task_id = ?",
            [taskId, taskId]
        );

        await connection.query("DELETE FROM task_assignments WHERE task_id = ?", [taskId]);
        await connection.query("DELETE FROM work_logs WHERE task_id = ?", [taskId]);
        await connection.query("DELETE FROM task_sessions WHERE task_id = ?", [taskId]);

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
