import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { getProjectById, isProjectMember } from "../services/projectService.js";
import { getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2";

/**
 * Controller to serve calculated schedule data for Gantt chart visualization
 * GET /api/scheduler/project/:projectId
 */
export async function getProjectScheduleData(req: AuthRequest<{ projectId: string }>, res: Response) {
    try {
        const projectId = Number(req.params.projectId);
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Authorization check: PM must own the project, RESOURCE must be a member
        if (userRole === "PROJECT_MANAGER") {
            if (project.project_manager_id !== userId) {
                return res.status(403).json({ message: "You are not authorized to view the schedule for this project" });
            }
        } else if (userRole === "RESOURCE") {
            const isMember = await isProjectMember(projectId, userId!);
            if (!isMember) {
                return res.status(403).json({ message: "You are not authorized to view the schedule for this project" });
            }
        }

        const pool = getPool();

        // 1. Fetch project tasks with assignees and dependencies
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

        // 2. Fetch project task_schedules if table exists
        let schedules: RowDataPacket[] = [];
        try {
            const [scheduleRows] = await pool.query<RowDataPacket[]>(
                `SELECT ts.*, u.name as resource_name
                 FROM task_schedules ts
                 JOIN tasks t ON ts.task_id = t.task_id
                 LEFT JOIN users u ON ts.user_id = u.user_id
                 WHERE t.project_id = ?
                 ORDER BY ts.schedule_date ASC`,
                [projectId]
            );
            schedules = scheduleRows;
        } catch {
            // If task_schedules table not created yet by Dev 1, fallback to empty array
            schedules = [];
        }

        // 3. Fetch holidays if table exists
        let holidays: RowDataPacket[] = [];
        try {
            const [holidayRows] = await pool.query<RowDataPacket[]>(
                `SELECT holiday_id, holiday_date, description FROM holidays ORDER BY holiday_date ASC`
            );
            holidays = holidayRows;
        } catch {
            holidays = [];
        }

        // 4. Transform and enrich tasks with pacing indicators
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
                start_date: t.start_date,
                deadline: t.deadline,
                actual_start: t.actual_start ?? null,
                actual_end: t.actual_end ?? null,
                expected_effort: expected,
                actual_effort: actual,
                progress: Number(t.progress || 0),
                assigned_resource_ids: t.assigned_resource_ids
                    ? String(t.assigned_resource_ids).split(",").map(Number)
                    : [],
                predecessor_task_ids: t.predecessor_task_ids
                    ? String(t.predecessor_task_ids).split(",").map(Number)
                    : [],
                pacing: {
                    is_overrun: isOverrun,
                    is_behind_schedule: isBehindSchedule,
                    warning: isBehindSchedule
                        ? (isOverrun ? "Effort overrun" : "Past deadline")
                        : null
                }
            };
        });

        return res.status(200).json({
            project: {
                project_id: project.project_id,
                name: project.name,
                status: project.status,
                start_date: project.start_date,
                deadline: project.deadline,
                progress: project.progress
            },
            tasks: formattedTasks,
            schedules,
            holidays
        });
    } catch (error: any) {
        console.error("Error fetching project schedule data:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
}
