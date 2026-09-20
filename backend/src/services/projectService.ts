import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../config/database.js";
import type { ProjectPriority, ProjectStatus } from "../models/projectModel.js";
import { recalculate } from "./scheduler/SchedulingEngine.js";

export async function createProject(
    projectManagerId: number,
    name: string,
    description: string | null,
    status: ProjectStatus,
    priority: ProjectPriority,
    startDate: string | null,
    deadline: string | null
) {
    if (startDate && deadline) {
        const startIso = startDate.includes("T") ? startDate.split("T")[0]! : startDate;
        const deadlineIso = deadline.includes("T") ? deadline.split("T")[0]! : deadline;
        if (startIso > deadlineIso) {
            throw new Error(`INVALID_PROJECT_DATES: Project start date (${startIso}) cannot be later than deadline (${deadlineIso})`);
        }
    }

    const pool = getPool();

    const [result] = await pool.query<ResultSetHeader>(
        `
        INSERT INTO projects
            (
                project_manager_id,
                name,
                description,
                status,
                priority,
                start_date,
                deadline
            )
        VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            projectManagerId,
            name,
            description,
            status,
            priority,
            startDate,
            deadline
        ]
    );

    return {
        project_id: result.insertId,
        project_manager_id: projectManagerId,
        name,
        description,
        status,
        priority,
        start_date: startDate,
        deadline,
        progress: 0
    };
}

/**
 * Automatically calculate and synchronize effort-weighted project progress:
 * Project Progress = SUM(Task Progress * Expected Effort) / SUM(Expected Effort)
 * Fallback to unweighted average if total expected effort is 0.
 * Excludes soft-deleted tasks and verification tasks.
 * Also synchronizes project status transitions (e.g. IN_PROGRESS -> COMPLETED at 100%).
 */
export async function syncProjectProgress(projectId: number): Promise<number> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            COUNT(*) AS total_tasks,
            COALESCE(SUM(expected_effort), 0) AS total_effort,
            COALESCE(SUM(progress * expected_effort), 0) AS weighted_progress_sum,
            COALESCE(SUM(progress), 0) AS simple_progress_sum
        FROM tasks
        WHERE project_id = ?
          AND deleted_at IS NULL
          AND (task_type IS NULL OR task_type != 'VERIFICATION')
          AND verified_task_id IS NULL
        `,
        [projectId]
    );

    const stats = rows[0];
    const totalTasks = Number(stats?.total_tasks || 0);
    const totalEffort = Number(stats?.total_effort || 0);
    const weightedProgressSum = Number(stats?.weighted_progress_sum || 0);
    const simpleProgressSum = Number(stats?.simple_progress_sum || 0);

    let calculatedProgress = 0;
    if (totalTasks > 0) {
        if (totalEffort > 0) {
            calculatedProgress = Math.round(weightedProgressSum / totalEffort);
        } else {
            calculatedProgress = Math.round(simpleProgressSum / totalTasks);
        }
        calculatedProgress = Math.max(0, Math.min(100, calculatedProgress));
    }

    // Fetch current project status to handle smart state transitions
    const [projRows] = await pool.query<RowDataPacket[]>(
        `SELECT status FROM projects WHERE project_id = ? AND deleted_at IS NULL`,
        [projectId]
    );

    if (projRows.length === 0) return calculatedProgress;

    const currentStatus = projRows[0]?.status;
    let nextStatus = currentStatus;

    if (calculatedProgress >= 100) {
        nextStatus = "COMPLETED";
    } else if (currentStatus === "COMPLETED" && calculatedProgress < 100) {
        nextStatus = "IN_PROGRESS";
    } else if (currentStatus === "NOT_STARTED" && calculatedProgress > 0) {
        nextStatus = "IN_PROGRESS";
    }

    if (nextStatus !== currentStatus) {
        await pool.query(
            `UPDATE projects SET progress = ?, status = ?, updated_at = NOW() WHERE project_id = ?`,
            [calculatedProgress, nextStatus, projectId]
        );
    } else {
        await pool.query(
            `UPDATE projects SET progress = ?, updated_at = NOW() WHERE project_id = ?`,
            [calculatedProgress, projectId]
        );
    }

    return calculatedProgress;
}

export async function getProjectsByManager(projectManagerId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            p.project_id,
            p.project_manager_id,
            u.name AS project_manager_name,
            p.name,
            p.description,
            p.status,
            p.priority,
            p.start_date,
            p.deadline,
            p.progress,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.project_manager_id = u.user_id
        WHERE p.project_manager_id = ?
          AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        `,
        [projectManagerId]
    );

    return projects;
}

export async function getProjectsByMember(userId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            p.project_id,
            p.project_manager_id,
            u.name AS project_manager_name,
            p.name,
            p.description,
            p.status,
            p.priority,
            p.start_date,
            p.deadline,
            p.progress,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.project_manager_id = u.user_id
        JOIN project_members pm ON p.project_id = pm.project_id
        WHERE pm.user_id = ?
          AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        `,
        [userId]
    );

    return projects;
}

export async function getProjectById(projectId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            p.project_id,
            p.project_manager_id,
            u.name AS project_manager_name,
            p.name,
            p.description,
            p.status,
            p.priority,
            p.start_date,
            p.deadline,
            p.progress,
            p.deleted_at,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.project_manager_id = u.user_id
        WHERE p.project_id = ?
          AND p.deleted_at IS NULL
        `,
        [projectId]
    );

    if (projects.length === 0) {
        return null;
    }

    return projects[0];
}
export async function assignResourceToProject(
    projectId: number,
    projectManagerId: number,
    resourceId: number
) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT project_id
        FROM projects
        WHERE project_id = ?
          AND project_manager_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [projectId, projectManagerId]
    );

    if (projects.length === 0)
        throw new Error("PROJECT_NOT_FOUND");

    const [users] = await pool.query<RowDataPacket[]>(
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

    const [existingAssignments] = await pool.query<RowDataPacket[]>(
        `
        SELECT project_id
        FROM project_members
        WHERE project_id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [projectId, resourceId]
    );

    if (existingAssignments.length > 0)
        throw new Error("RESOURCE_ALREADY_ASSIGNED");

    await pool.query(
        `
        INSERT INTO project_members
            (project_id, user_id)
        VALUES
            (?, ?)
        `,
        [projectId, resourceId]
    );

    return {
        project_id: projectId,
        user_id: resourceId
    };
}

export async function getProjectIdsByMember(userId: number): Promise<number[]> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT pm.project_id
        FROM project_members pm
        JOIN projects p ON pm.project_id = p.project_id
        WHERE pm.user_id = ?
          AND p.deleted_at IS NULL
        `,
        [userId]
    );

    return rows.map(r => Number(r.project_id));
}

export async function isProjectMember(
    projectId: number,
    userId: number
): Promise<boolean> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT 1
        FROM project_members pm
        JOIN projects p ON pm.project_id = p.project_id
        WHERE pm.project_id = ?
          AND pm.user_id = ?
          AND p.deleted_at IS NULL
        LIMIT 1
        `,
        [projectId, userId]
    );

    return rows.length > 0;
}

export async function updateProject(
    projectId: number,
    projectManagerId: number,
    name: string,
    description: string | null,
    status: ProjectStatus,
    priority: ProjectPriority,
    startDate: string | null,
    deadline: string | null
) {
    if (startDate && deadline) {
        const startIso = startDate.includes("T") ? startDate.split("T")[0]! : startDate;
        const deadlineIso = deadline.includes("T") ? deadline.split("T")[0]! : deadline;
        if (startIso > deadlineIso) {
            throw new Error(`INVALID_PROJECT_DATES: Project start date (${startIso}) cannot be later than deadline (${deadlineIso})`);
        }
    }

    const pool = getPool();

    const [result] = await pool.query<ResultSetHeader>(
        `
        UPDATE projects
        SET
            name = ?,
            description = ?,
            status = ?,
            priority = ?,
            start_date = ?,
            deadline = ?
        WHERE project_id = ?
          AND project_manager_id = ?
          AND deleted_at IS NULL
        `,
        [
            name,
            description,
            status,
            priority,
            startDate,
            deadline,
            projectId,
            projectManagerId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    // Trigger auto-scheduler recalculation to update Gantt schedules and deadline risks with new project dates
    try {
        await recalculate(projectId);
    } catch (schedError) {
        console.error("Failed to recalculate project schedules after updating project:", schedError);
    }

    return getProjectById(projectId);
}

/**
 * Move Project to Recycle Bin (Fake Delete / Soft Delete)
 * Safeguard: Blocks deletion if any task is IN_PROGRESS or has an active timer session.
 */
export async function moveToBinProject(projectId: number, projectManagerId?: number): Promise<{ success: boolean; message?: string }> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check project existence and PM ownership if projectManagerId is supplied
        let projCheckQuery = "SELECT project_id FROM projects WHERE project_id = ? AND deleted_at IS NULL";
        const projCheckParams: any[] = [projectId];
        if (projectManagerId !== undefined) {
            projCheckQuery += " AND project_manager_id = ?";
            projCheckParams.push(projectManagerId);
        }

        const [projRows] = await connection.query<RowDataPacket[]>(projCheckQuery, projCheckParams);
        if (projRows.length === 0) {
            await connection.rollback();
            return { success: false, message: "Project not found or unauthorized." };
        }

        // 1. Check for IN_PROGRESS tasks
        const [activeTasks] = await connection.query<RowDataPacket[]>(
            `
            SELECT t.task_id, t.title, t.status
            FROM tasks t
            WHERE t.project_id = ?
              AND t.deleted_at IS NULL
              AND t.status = 'IN_PROGRESS'
            FOR UPDATE
            `,
            [projectId]
        );

        if (activeTasks.length > 0) {
            const taskTitles = activeTasks.map(t => `"${t.title}"`).slice(0, 3).join(", ");
            const extra = activeTasks.length > 3 ? ` and ${activeTasks.length - 3} more` : "";
            throw new Error(`CANNOT_DELETE_ACTIVE_PROJECT: The project contains task(s) currently in progress (${taskTitles}${extra}). Please complete or pause active work first.`);
        }

        // 2. Soft delete project
        let softDeleteQuery = "UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = ? AND deleted_at IS NULL";
        const softDeleteParams: any[] = [projectId];
        if (projectManagerId !== undefined) {
            softDeleteQuery += " AND project_manager_id = ?";
            softDeleteParams.push(projectManagerId);
        }

        const [projResult] = await connection.query<ResultSetHeader>(softDeleteQuery, softDeleteParams);

        if (projResult.affectedRows === 0) {
            await connection.rollback();
            return { success: false, message: "Project not found or already in bin." };
        }

        // 3. Soft delete all child tasks
        await connection.query(
            "UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = ? AND deleted_at IS NULL",
            [projectId]
        );

        // 4. Clear Gantt task allocations for these tasks to immediately free resource capacity
        await connection.query(
            `
            DELETE ts FROM task_schedules ts
            JOIN tasks t ON ts.task_id = t.task_id
            WHERE t.project_id = ?
            `,
            [projectId]
        );

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get all binned projects for a project manager
 */
export async function getBinnedProjects(projectManagerId: number) {
    const pool = getPool();

    const [projects] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            p.project_id,
            p.project_manager_id,
            p.name,
            p.description,
            p.status,
            p.priority,
            p.start_date,
            p.deadline,
            p.progress,
            p.deleted_at,
            p.created_at,
            p.updated_at,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.project_id AND t.deleted_at IS NOT NULL) as binned_task_count
        FROM projects p
        WHERE p.project_manager_id = ?
          AND p.deleted_at IS NOT NULL
        ORDER BY p.deleted_at DESC
        `,
        [projectManagerId]
    );

    return projects;
}

/**
 * Restore a Project and its child tasks from the Bin
 */
export async function restoreProjectFromBin(projectId: number, projectManagerId?: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let updateQuery = "UPDATE projects SET deleted_at = NULL WHERE project_id = ? AND deleted_at IS NOT NULL";
        const updateParams: any[] = [projectId];
        if (projectManagerId !== undefined) {
            updateQuery += " AND project_manager_id = ?";
            updateParams.push(projectManagerId);
        }

        const [projResult] = await connection.query<ResultSetHeader>(updateQuery, updateParams);

        if (projResult.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        // Restore child tasks
        await connection.query(
            "UPDATE tasks SET deleted_at = NULL WHERE project_id = ?",
            [projectId]
        );

        // Prune any dead dependency links where predecessors no longer exist in the system
        await connection.query(
            `DELETE td FROM task_dependencies td
             INNER JOIN tasks t ON td.task_id = t.task_id
             WHERE t.project_id = ?
               AND td.predecessor_task_id NOT IN (SELECT task_id FROM tasks WHERE deleted_at IS NULL)`,
            [projectId]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Hard delete (permanent delete from database)
 */
export async function deleteProject(projectId: number, projectManagerId?: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check project existence and PM ownership if projectManagerId is supplied
        let projQuery = "SELECT project_id FROM projects WHERE project_id = ?";
        const projParams: any[] = [projectId];
        if (projectManagerId !== undefined) {
            projQuery += " AND project_manager_id = ?";
            projParams.push(projectManagerId);
        }

        const [projRows] = await connection.query<RowDataPacket[]>(projQuery, projParams);
        if (projRows.length === 0) {
            await connection.rollback();
            return false;
        }

        const [tasks] = await connection.query<RowDataPacket[]>(
            "SELECT task_id FROM tasks WHERE project_id = ?",
            [projectId]
        );

        if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.task_id);
            await connection.query("DELETE FROM task_schedules WHERE task_id IN (?)", [taskIds]);
            await connection.query(
                "DELETE FROM task_dependencies WHERE task_id IN (?) OR predecessor_task_id IN (?)",
                [taskIds, taskIds]
            );
            await connection.query("DELETE FROM task_assignments WHERE task_id IN (?)", [taskIds]);
            await connection.query("DELETE FROM work_logs WHERE task_id IN (?)", [taskIds]);
            await connection.query("DELETE FROM task_sessions WHERE task_id IN (?)", [taskIds]);
            await connection.query("DELETE FROM tasks WHERE project_id = ?", [projectId]);
        }

        await connection.query("DELETE FROM project_members WHERE project_id = ?", [projectId]);

        const [result] = await connection.query<ResultSetHeader>(
            "DELETE FROM projects WHERE project_id = ?",
            [projectId]
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

export async function removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Find all tasks in this project assigned to this user
        const [assignedTasks] = await connection.query<RowDataPacket[]>(
            `SELECT t.task_id
             FROM tasks t
             INNER JOIN task_assignments ta ON t.task_id = ta.task_id
             WHERE t.project_id = ? AND ta.user_id = ?`,
            [projectId, userId]
        );

        if (assignedTasks.length > 0) {
            const taskIds = assignedTasks.map(t => Number(t.task_id));

            // Delete task assignments
            await connection.query(
                "DELETE FROM task_assignments WHERE task_id IN (?) AND user_id = ?",
                [taskIds, userId]
            );

            // Check if any of these tasks now have 0 assignees and revert status if appropriate
            for (const tId of taskIds) {
                const [remaining] = await connection.query<RowDataPacket[]>(
                    "SELECT COUNT(*) as count FROM task_assignments WHERE task_id = ?",
                    [tId]
                );
                const count = remaining[0]?.count ?? 0;
                if (count === 0) {
                    await connection.query(
                        `UPDATE tasks SET status = 'UNASSIGNED' WHERE task_id = ? AND status IN ('SCHEDULED', 'PENDING')`,
                        [tId]
                    );
                }
            }
        }

        // 2. Remove project membership
        const [result] = await connection.query<ResultSetHeader>(
            "DELETE FROM project_members WHERE project_id = ? AND user_id = ?",
            [projectId, userId]
        );

        await connection.commit();

        // 3. Trigger Gantt schedule recalculation
        try {
            await recalculate(projectId);
        } catch (schedErr) {
            console.error(`Warning: Failed to recalculate schedule for project ${projectId} after removing member:`, schedErr);
        }

        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function archiveProject(projectId: number, projectManagerId: number) {
    const pool = getPool();
    const project = await getProjectById(projectId);

    if (!project || project.project_manager_id !== projectManagerId) {
        return { error: "NOT_FOUND_OR_UNAUTHORIZED" };
    }

    if (project.status !== "COMPLETED") {
        return { error: "PROJECT_NOT_COMPLETED" };
    }

    await pool.query(
        "UPDATE projects SET status = 'ARCHIVED' WHERE project_id = ? AND project_manager_id = ?",
        [projectId, projectManagerId]
    );

    return { project: await getProjectById(projectId) };
}

export async function unarchiveProject(projectId: number, projectManagerId: number) {
    const pool = getPool();
    const project = await getProjectById(projectId);

    if (!project || project.project_manager_id !== projectManagerId) {
        return { error: "NOT_FOUND_OR_UNAUTHORIZED" };
    }

    if (project.status !== "ARCHIVED") {
        return { error: "PROJECT_NOT_ARCHIVED" };
    }

    await pool.query(
        "UPDATE projects SET status = 'COMPLETED' WHERE project_id = ? AND project_manager_id = ?",
        [projectId, projectManagerId]
    );

    return { project: await getProjectById(projectId) };
}