import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./init.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { recalculate } from "../services/scheduler/SchedulingEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getOffsetDate(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getOffsetDateTime(daysOffset: number, hours = 9, minutes = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, minutes, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
}

async function seed() {
    console.log("🌱 Starting canonical Freethink database seeding...");

    // 1. Drop existing tables and recreate cleanly
    const pool = await initializeDatabase({ dropExisting: true });

    console.log("\n🔑 Creating canonical team users with encrypted passwords...");
    const defaultPassword = "Password123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Team Structure:
    // - Shlok Zambreker (Project Manager / Mentor)
    // - Chinmay Gadgil (Resource)
    // - Sana Shaikh (Resource)
    // - Shikhaa Prabhudesai (Resource)
    // - Tanvi Khandeparkar (Resource)
    // - Hridham Chimulkar (Resource)
    const usersData = [
        {
            name: "Shlok Zambreker",
            username: "shlok",
            email: "shlok@freethink.com",
            role: "PROJECT_MANAGER",
            is_active: true,
            non_working_days: null,
            daily_working_hours: 8.00,
            schedule_configured: false
        },
        {
            name: "Chinmay Gadgil",
            username: "chinmay",
            email: "chinmay@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Sana Shaikh",
            username: "sana",
            email: "sana@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Shikhaa Prabhudesai",
            username: "shikhaa",
            email: "shikhaa@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Tanvi Khandeparkar",
            username: "tanvi",
            email: "tanvi@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Hridham Chimulkar",
            username: "hridham",
            email: "hridham@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        }
    ];

    const userMap: Record<string, number> = {};

    for (const u of usersData) {
        const [res] = await pool.query<ResultSetHeader>(
            `INSERT INTO users (name, username, email, password_hash, role, non_working_days, daily_working_hours, schedule_configured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.name, u.username, u.email, passwordHash, u.role, u.non_working_days, u.daily_working_hours, u.schedule_configured, u.is_active]
        );
        userMap[u.email] = res.insertId;
    }
    console.log(`✅ Inserted ${usersData.length} users.`);

    // 2. Insert Official Company Holidays
    console.log("\n🎉 Inserting official holidays...");
    const holidaysData = [
        { holiday_date: "2026-01-26", description: "Republic Day" },
        { holiday_date: "2026-03-03", description: "Holi" },
        { holiday_date: "2026-03-19", description: "Gudi Padava" },
        { holiday_date: "2026-03-21", description: "Id-Ul Fitr" },
        { holiday_date: "2026-03-26", description: "Ram Navami" },
        { holiday_date: "2026-04-03", description: "Good Friday" },
        { holiday_date: "2026-04-14", description: "Birth Anniversary of Dr. Babasaheb Ambedkar" },
        { holiday_date: "2026-05-01", description: "May Day" },
        { holiday_date: "2026-08-15", description: "Independence Day" },
        { holiday_date: "2026-09-14", description: "Ganesh Chaturthi (1st Day)" },
        { holiday_date: "2026-09-15", description: "Ganesh Chaturthi (2nd Day)" },
        { holiday_date: "2026-10-02", description: "Gandhi Jayanti" },
        { holiday_date: "2026-11-08", description: "Diwali (Deepavali)" },
        { holiday_date: "2026-12-19", description: "Goa Liberation Day" },
        { holiday_date: "2026-12-25", description: "Christmas Day" }
    ];

    for (const h of holidaysData) {
        await pool.query(
            `INSERT INTO holidays (holiday_date, description) VALUES (?, ?)`,
            [h.holiday_date, h.description]
        );
    }
    console.log(`✅ Inserted ${holidaysData.length} official holidays.`);

    // 3. Insert Realistic User Leaves
    console.log("\n🌴 Inserting user leave records...");
    const leavesData = [
        {
            email: "hridham@freethink.com",
            leave_date: getOffsetDate(1),
            leave_hours: 8.00,
            status: "APPROVED",
            approver_email: "shlok@freethink.com",
            approved_at: getOffsetDateTime(-1, 10, 30)
        },
        {
            email: "shikhaa@freethink.com",
            leave_date: getOffsetDate(4),
            leave_hours: 4.00,
            status: "APPROVED",
            approver_email: "shlok@freethink.com",
            approved_at: getOffsetDateTime(-2, 14, 0)
        },
        {
            email: "sana@freethink.com",
            leave_date: getOffsetDate(3),
            leave_hours: 8.00,
            status: "PENDING",
            approver_email: null,
            approved_at: null
        }
    ];

    for (const l of leavesData) {
        const userId = userMap[l.email];
        const approverId = l.approver_email ? userMap[l.approver_email] : null;
        if (userId) {
            await pool.query(
                `INSERT INTO user_leaves (request_id, user_id, leave_date, leave_hours, status, approver_id, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [randomUUID(), userId, l.leave_date, l.leave_hours, l.status, approverId, l.approved_at]
            );
        }
    }
    console.log(`✅ Inserted ${leavesData.length} user leave records.`);

    // 4. Insert Freethink Projects
    console.log("\n📁 Creating Freethink projects...");
    const projectsData = [
        {
            key: "freethink_main",
            pm: "shlok@freethink.com",
            name: "Smart Project Task Management & Resource Scheduling System",
            description: "Freethink flagship system featuring CPM-based automated resource scheduling, DHTMLX Gantt timeline visualization, dynamic holiday and leave capacity constraints, and real-time task progress tracking.",
            status: "IN_PROGRESS",
            priority: "CRITICAL",
            start_date: getOffsetDate(-25),
            deadline: getOffsetDate(20),
            progress: 68.0
        },
        {
            key: "freethink_login",
            pm: "shlok@freethink.com",
            name: "Simple Login System",
            description: "A Vue-based login and authentication learning project using Pinia for state management and Quasar for modern UI components.",
            status: "COMPLETED",
            priority: "HIGH",
            start_date: getOffsetDate(-50),
            deadline: getOffsetDate(-26),
            progress: 100.0
        },
        {
            key: "freethink_booking",
            pm: "shlok@freethink.com",
            name: "Booking System",
            description: "A comprehensive booking and reservation management system featuring schedule coordination, customer booking workflows, and real-time availability management.",
            status: "NOT_STARTED",
            priority: "MEDIUM",
            start_date: getOffsetDate(1),
            deadline: getOffsetDate(45),
            progress: 0.0
        }
    ];

    const projectMap: Record<string, number> = {};

    for (const p of projectsData) {
        const pmId = userMap[p.pm];
        const [res] = await pool.query<ResultSetHeader>(
            `INSERT INTO projects (project_manager_id, name, description, status, priority, start_date, deadline, progress)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [pmId, p.name, p.description, p.status, p.priority, p.start_date, p.deadline, p.progress]
        );
        projectMap[p.key] = res.insertId;
    }
    console.log(`✅ Inserted ${projectsData.length} projects.`);

    // 5. Assign Project Members (All 5 team members)
    console.log("\n👥 Assigning project members...");
    const allResourceEmails = [
        "chinmay@freethink.com",
        "sana@freethink.com",
        "shikhaa@freethink.com",
        "tanvi@freethink.com",
        "hridham@freethink.com"
    ];

    for (const projectKey of ["freethink_main", "freethink_login"]) {
        const projectId = projectMap[projectKey];
        for (const email of allResourceEmails) {
            const userId = userMap[email];
            if (projectId && userId) {
                await pool.query(
                    `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
                    [projectId, userId]
                );
            }
        }
    }
    console.log("✅ Project members assigned for all 5 team members.");

    // 6. Create Tasks Mapped to Real Git Contributions
    console.log("\n📋 Creating tasks mapped to actual team contributions...");
    const tasksData = [
        // Tasks for Project 1: Smart Project Task Management & Resource Scheduling System
        // Chinmay Gadgil's Contributions: Scheduling Engine, Task Sessions, Bottlenecks
        {
            key: "t_cpm_engine",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Critical Path Scheduling Engine & Urgency Scoring",
            description: "Implement CPM topological sort, cycle detection, urgency score sorting, and hourly precision allocation.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-10),
            actual_start: getOffsetDateTime(-24, 9, 0),
            actual_end: getOffsetDateTime(-10, 17, 0),
            expected_effort: 32,
            actual_effort: 32,
            progress: 100,
            assignees: ["chinmay@freethink.com"]
        },
        {
            key: "t_sessions",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Task Sessions & Live Tracking Engine",
            description: "Schema and backend service for live start/stop task tracking sessions, active session sync, and elapsed time calculation.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDateTime(-5, 9, 30),
            actual_end: null,
            expected_effort: 24,
            actual_effort: 18,
            progress: 75,
            assignees: ["chinmay@freethink.com"]
        },
        {
            key: "t_bottlenecks",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Bottleneck Task Detection & Impact Analysis",
            description: "Service to calculate task slack time and alert on bottleneck tasks delaying downstream milestones.",
            priority: "HIGH",
            status: "SCHEDULED",
            deadline: getOffsetDate(18),
            actual_start: null,
            actual_end: null,
            expected_effort: 16,
            actual_effort: 0,
            progress: 0,
            assignees: ["chinmay@freethink.com"]
        },

        // Sana Shaikh's Contributions: Gantt Chart Timeline, Resource Workload, PM Workflows
        {
            key: "t_gantt",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Interactive Segmented Gantt Chart Timeline",
            description: "DHTMLX Gantt timeline rendering with segmented task_schedules, custom zoom scales, and column scrolling.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-8),
            actual_start: getOffsetDateTime(-22, 10, 0),
            actual_end: getOffsetDateTime(-8, 18, 0),
            expected_effort: 32,
            actual_effort: 32,
            progress: 100,
            assignees: ["sana@freethink.com"]
        },
        {
            key: "t_workload",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Resource Workload & Availability Engine",
            description: "Dynamic capacity calculation, 8h workday normalization, resource schedule locking, and workload KPIs.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDateTime(-3, 9, 0),
            actual_end: null,
            expected_effort: 24,
            actual_effort: 15,
            progress: 60,
            assignees: ["sana@freethink.com"]
        },
        {
            key: "t_pm_workflows",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "PM Dashboard Workflows & Health Metrics",
            description: "PM dashboard overview, project health calculation algorithms, and project edit/update dialogs.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-5),
            actual_start: getOffsetDateTime(-18, 9, 0),
            actual_end: getOffsetDateTime(-5, 17, 30),
            expected_effort: 20,
            actual_effort: 20,
            progress: 100,
            assignees: ["sana@freethink.com"]
        },

        // Shikhaa Prabhudesai's Contributions: Auth UI, Leaves Management, Resource Views
        {
            key: "t_auth_ui",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Authentication UI & Password Reset Workflows",
            description: "Responsive login/signup forms, auth layout, reset password flow, and Pinia auth store integration.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-12),
            actual_start: getOffsetDateTime(-25, 9, 0),
            actual_end: getOffsetDateTime(-12, 16, 0),
            expected_effort: 24,
            actual_effort: 24,
            progress: 100,
            assignees: ["shikhaa@freethink.com"]
        },
        {
            key: "t_leaves_ui",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Resource Leave Management & Requests System",
            description: "LeavesPage UI, leave request modal, leave deletion, and employee leave balance display.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(7),
            actual_start: getOffsetDateTime(-4, 11, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 14,
            progress: 70,
            assignees: ["shikhaa@freethink.com"]
        },
        {
            key: "t_resource_views",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "PM Resource Directory & Details Visualization",
            description: "Resource card listing, resource detail pages, skill cards, and assigned tasks view.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-6),
            actual_start: getOffsetDateTime(-16, 9, 0),
            actual_end: getOffsetDateTime(-6, 17, 0),
            expected_effort: 16,
            actual_effort: 16,
            progress: 100,
            assignees: ["shikhaa@freethink.com"]
        },

        // Tanvi Khandeparkar's Contributions: Holiday Calendar, Daily Progress, Resource Dashboard
        {
            key: "t_holidays",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Holiday Calendar Management & Non-Working Days",
            description: "Quasar QCalendar integration, official holiday management, weekend off, and non-working day indicators.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-7),
            actual_start: getOffsetDateTime(-20, 9, 0),
            actual_end: getOffsetDateTime(-7, 18, 0),
            expected_effort: 24,
            actual_effort: 24,
            progress: 100,
            assignees: ["tanvi@freethink.com"]
        },
        {
            key: "t_progress",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Daily Progress Reporting & Automated Status Sync",
            description: "Daily update modal, work log submissions, status badge transitions based on progress percentage.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(9),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 10,
            progress: 50,
            assignees: ["tanvi@freethink.com"]
        },
        {
            key: "t_resource_dash",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Resource Dashboard & Self-Assigned Tasks",
            description: "Resource dashboard UI, task specs view, self-assign task toggle, and session progress bar.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-4),
            actual_start: getOffsetDateTime(-15, 9, 0),
            actual_end: getOffsetDateTime(-4, 17, 0),
            expected_effort: 18,
            actual_effort: 18,
            progress: 100,
            assignees: ["tanvi@freethink.com"]
        },

        // Hridham Chimulkar's Contributions: JWT Security, Dependencies, Leave Approval, Search
        {
            key: "t_jwt_security",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "JWT Security, Route Guards & User Schema",
            description: "MySQL user table setup, JWT generation/validation, role-based route protection, login by username.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-14),
            actual_start: getOffsetDateTime(-25, 9, 0),
            actual_end: getOffsetDateTime(-14, 18, 0),
            expected_effort: 24,
            actual_effort: 24,
            progress: 100,
            assignees: ["hridham@freethink.com"]
        },
        {
            key: "t_dependencies",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Task Dependency Graph & Cycle Prevention Service",
            description: "Dependency deletion, cycle validation engine, and including dependency graphs in task responses.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-9),
            actual_start: getOffsetDateTime(-19, 10, 0),
            actual_end: getOffsetDateTime(-9, 17, 30),
            expected_effort: 16,
            actual_effort: 16,
            progress: 100,
            assignees: ["hridham@freethink.com"]
        },
        {
            key: "t_leave_approval",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Leave Approval Workflow & Project Archival",
            description: "PM leave approval/rejection endpoints, project archiving and unarchiving logic.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(6),
            actual_start: getOffsetDateTime(-3, 9, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 16,
            progress: 80,
            assignees: ["hridham@freethink.com"]
        },
        {
            key: "t_search",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Global Search & Command Palette (Ctrl+K)",
            description: "Fast keyboard navigation and command palette search across tasks, projects, and resources.",
            priority: "MEDIUM",
            status: "SCHEDULED",
            deadline: getOffsetDate(15),
            actual_start: null,
            actual_end: null,
            expected_effort: 16,
            actual_effort: 0,
            progress: 0,
            assignees: ["hridham@freethink.com"]
        },

        // Subproject 2: Freethink MVP
        {
            key: "t_mvp_schema",
            projectKey: "freethink_login",
            createdBy: "shlok@freethink.com",
            title: "Initial Database Schema & Connection Pool",
            description: "Configured MySQL database connection pooling and base tables.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-35),
            actual_start: getOffsetDateTime(-50, 9, 0),
            actual_end: getOffsetDateTime(-35, 18, 0),
            expected_effort: 20,
            actual_effort: 20,
            progress: 100,
            assignees: ["chinmay@freethink.com", "hridham@freethink.com"]
        },
        {
            key: "t_mvp_auth",
            projectKey: "freethink_login",
            createdBy: "shlok@freethink.com",
            title: "Baseline User Registration & Password Hashing",
            description: "User registration endpoints, bcrypt password encryption, and validation rules.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-27),
            actual_start: getOffsetDateTime(-35, 9, 0),
            actual_end: getOffsetDateTime(-27, 18, 0),
            expected_effort: 24,
            actual_effort: 24,
            progress: 100,
            assignees: ["shikhaa@freethink.com", "sana@freethink.com", "tanvi@freethink.com"]
        }
    ];

    const taskMap: Record<string, number> = {};

    for (const t of tasksData) {
        const projectId = projectMap[t.projectKey];
        const createdById = userMap[t.createdBy];

        const [res] = await pool.query<ResultSetHeader>(
            `INSERT INTO tasks (
                project_id, created_by, title, description, priority, status, 
                deadline, actual_start, actual_end, expected_effort, actual_effort, progress
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectId,
                createdById,
                t.title,
                t.description,
                t.priority,
                t.status,
                t.deadline,
                t.actual_start,
                t.actual_end,
                t.expected_effort,
                t.actual_effort,
                t.progress
            ]
        );
        const taskId = res.insertId;
        taskMap[t.key] = taskId;

        // Assign resources
        for (const email of t.assignees) {
            const userId = userMap[email];
            if (userId) {
                await pool.query(
                    `INSERT IGNORE INTO task_assignments (task_id, user_id) VALUES (?, ?)`,
                    [taskId, userId]
                );
            }
        }
    }
    console.log(`✅ Inserted ${tasksData.length} tasks and assigned team members.`);

    // 7. Insert Logical Task Dependencies (Temporal and Architectural)
    console.log("\n🔗 Creating task dependencies...");
    const dependenciesData = [
        // Bottleneck detection requires scheduling engine
        { taskKey: "t_bottlenecks", predecessorKey: "t_cpm_engine" },
        // Resource workload engine requires holiday calendar and non-working days
        { taskKey: "t_workload", predecessorKey: "t_holidays" },
        // Leave approval requires resource leave requests UI
        { taskKey: "t_leave_approval", predecessorKey: "t_leaves_ui" },
        // Global search requires security and route protection foundation
        { taskKey: "t_search", predecessorKey: "t_jwt_security" }
    ];

    for (const dep of dependenciesData) {
        const taskId = taskMap[dep.taskKey];
        const predId = taskMap[dep.predecessorKey];
        if (taskId && predId) {
            await pool.query(
                `INSERT IGNORE INTO task_dependencies (task_id, predecessor_task_id) VALUES (?, ?)`,
                [taskId, predId]
            );
        }
    }
    console.log(`✅ Inserted ${dependenciesData.length} task dependencies.`);

    // 8. Insert Realistic Work Logs
    console.log("\n📝 Creating work logs...");
    const workLogsData = [
        {
            taskKey: "t_cpm_engine",
            email: "chinmay@freethink.com",
            hours: 32,
            progress: 100,
            status: "COMPLETED",
            notes: "Implemented topological sorting, cycle detection, urgency scoring and hourly allocation.",
            blockers: null,
            log_date: getOffsetDate(-10)
        },
        {
            taskKey: "t_sessions",
            email: "chinmay@freethink.com",
            hours: 18,
            progress: 75,
            status: "IN_PROGRESS",
            notes: "Configured task sessions schema and live start/stop session sync.",
            blockers: null,
            log_date: getOffsetDate(0)
        },
        {
            taskKey: "t_gantt",
            email: "sana@freethink.com",
            hours: 32,
            progress: 100,
            status: "COMPLETED",
            notes: "Integrated DHTMLX Gantt chart with task_schedules timeline segmentation.",
            blockers: null,
            log_date: getOffsetDate(-8)
        },
        {
            taskKey: "t_workload",
            email: "sana@freethink.com",
            hours: 15,
            progress: 60,
            status: "IN_PROGRESS",
            notes: "Implemented capacity calculation formulas and non-working day locking.",
            blockers: null,
            log_date: getOffsetDate(-1)
        },
        {
            taskKey: "t_pm_workflows",
            email: "sana@freethink.com",
            hours: 20,
            progress: 100,
            status: "COMPLETED",
            notes: "PM dashboard metric cards and project update dialogs completed.",
            blockers: null,
            log_date: getOffsetDate(-5)
        },
        {
            taskKey: "t_auth_ui",
            email: "shikhaa@freethink.com",
            hours: 24,
            progress: 100,
            status: "COMPLETED",
            notes: "Login, signup, forgot password, and reset password UI completed with Pinia store.",
            blockers: null,
            log_date: getOffsetDate(-12)
        },
        {
            taskKey: "t_leaves_ui",
            email: "shikhaa@freethink.com",
            hours: 14,
            progress: 70,
            status: "IN_PROGRESS",
            notes: "LeavesPage component, leave creation modal, and status display completed.",
            blockers: null,
            log_date: getOffsetDate(0)
        },
        {
            taskKey: "t_resource_views",
            email: "shikhaa@freethink.com",
            hours: 16,
            progress: 100,
            status: "COMPLETED",
            notes: "PM resource cards and individual resource details page connected.",
            blockers: null,
            log_date: getOffsetDate(-6)
        },
        {
            taskKey: "t_holidays",
            email: "tanvi@freethink.com",
            hours: 24,
            progress: 100,
            status: "COMPLETED",
            notes: "QCalendar integration, official holiday dataset, and non-working day grid styling.",
            blockers: null,
            log_date: getOffsetDate(-7)
        },
        {
            taskKey: "t_progress",
            email: "tanvi@freethink.com",
            hours: 10,
            progress: 50,
            status: "IN_PROGRESS",
            notes: "Added daily task update modal with status badge auto-transition based on progress percentage.",
            blockers: null,
            log_date: getOffsetDate(0)
        },
        {
            taskKey: "t_resource_dash",
            email: "tanvi@freethink.com",
            hours: 18,
            progress: 100,
            status: "COMPLETED",
            notes: "Resource personal dashboard, my tasks list, and session progress bar completed.",
            blockers: null,
            log_date: getOffsetDate(-4)
        },
        {
            taskKey: "t_jwt_security",
            email: "hridham@freethink.com",
            hours: 24,
            progress: 100,
            status: "COMPLETED",
            notes: "JWT authentication, token verification middleware, and route guard protection completed.",
            blockers: null,
            log_date: getOffsetDate(-14)
        },
        {
            taskKey: "t_dependencies",
            email: "hridham@freethink.com",
            hours: 16,
            progress: 100,
            status: "COMPLETED",
            notes: "Task dependency deletion and cyclic check validation logic added.",
            blockers: null,
            log_date: getOffsetDate(-9)
        },
        {
            taskKey: "t_leave_approval",
            email: "hridham@freethink.com",
            hours: 16,
            progress: 80,
            status: "IN_PROGRESS",
            notes: "PM leave approval/rejection endpoints and project archival workflows implemented.",
            blockers: null,
            log_date: getOffsetDate(-1)
        }
    ];

    for (const wl of workLogsData) {
        const taskId = taskMap[wl.taskKey];
        const userId = userMap[wl.email];
        if (taskId && userId) {
            await pool.query(
                `INSERT INTO work_logs (task_id, user_id, hours_logged, progress_logged, status, notes, blockers, log_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [taskId, userId, wl.hours, wl.progress, wl.status, wl.notes, wl.blockers, wl.log_date]
            );
        }
    }
    console.log(`✅ Inserted ${workLogsData.length} work logs.`);

    // 9. Active Task Session for Real-Time Demo
    console.log("\n⏱️ Creating sample active task session...");
    const activeTaskId = taskMap["t_sessions"];
    const activeUserId = userMap["chinmay@freethink.com"];
    if (activeTaskId && activeUserId) {
        await pool.query(
            `INSERT INTO task_sessions (task_id, user_id, start_time, is_active) VALUES (?, ?, NOW(), TRUE)`,
            [activeTaskId, activeUserId]
        );
        console.log("✅ Active task session created for Chinmay Gadgil on Task Sessions engine.");
    }

    // 10. Run SchedulingEngine.recalculate on Project
    console.log("\n⚙️ Running SchedulingEngine to compute Gantt schedules and risk flags...");
    const mainProjectId = projectMap["freethink_main"];
    if (mainProjectId) {
        console.log(`  Calculating schedules for Project ID: ${mainProjectId}...`);
        await recalculate(mainProjectId);
    }
    console.log("✅ SchedulingEngine calculations complete.");

    // 11. Generate standalone seed_demo.sql
    try {
        console.log("\n📄 Exporting standalone seed_demo.sql...");
        await generateSqlDump(pool);
        console.log("✅ seed_demo.sql generated successfully.");
    } catch (sqlErr) {
        console.error("Warning: Failed to write seed_demo.sql file:", sqlErr);
    }

    console.log("\n=======================================================");
    console.log("🎉 FREETHINK CANONICAL DATABASE SEEDED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("Team Credentials (Password for all: Password123!):");
    console.log("-------------------------------------------------------");
    console.log("PROJECT MANAGER:");
    console.log("  • shlok@freethink.com   / shlok       (Shlok Zambreker - Mentor / Project Manager)");
    console.log("\nTEAM RESOURCES (Actual 5 Team Members):");
    console.log("  • chinmay@freethink.com / chinmay     (Chinmay Gadgil - Resource)");
    console.log("  • sana@freethink.com        / sana        (Sana Shaikh - Gantt & Workload, Pending Leave)");
    console.log("  • shikhaa@freethink.com     / shikhaa     (Shikhaa Prabhudesai - Auth & Leaves, Approved Leave)");
    console.log("  • tanvi@freethink.com       / tanvi       (Tanvi Khandeparkar - Calendar & Progress Updates)");
    console.log("  • hridham@freethink.com     / hridham     (Hridham Chimulkar - Security & Approvals, Approved Leave)");
    console.log("=======================================================\n");

    process.exit(0);
}

/**
 * Generates an SQL dump string from current tables and saves to seed_demo.sql
 */
async function generateSqlDump(pool: any) {
    const tables = [
        "users",
        "holidays",
        "user_leaves",
        "projects",
        "project_members",
        "tasks",
        "task_assignments",
        "task_dependencies",
        "work_logs",
        "task_sessions",
        "task_schedules"
    ];

    let sql = `-- ====================================================================\n`;
    sql += `-- Freethink Canonical Demo Database Seed Dump\n`;
    sql += `-- Project: Smart Project Task Management & Resource Scheduling System\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ====================================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
        const [rows]: any = await pool.query(`SELECT * FROM \`${table}\``);
        sql += `-- Table: ${table}\n`;
        sql += `DELETE FROM \`${table}\`;\n`;
        if (rows.length > 0) {
            const cols = Object.keys(rows[0]!).map(c => `\`${c}\``).join(", ");
            sql += `INSERT INTO \`${table}\` (${cols}) VALUES\n`;
            const valStrings: string[] = [];
            for (const row of rows) {
                const vals = Object.values(row).map(v => {
                    if (v === null || v === undefined) return "NULL";
                    if (typeof v === "boolean") return v ? 1 : 0;
                    if (typeof v === "number") return String(v);
                    if (v instanceof Date) {
                        const y = v.getFullYear();
                        const m = String(v.getMonth() + 1).padStart(2, "0");
                        const d = String(v.getDate()).padStart(2, "0");
                        const hh = String(v.getHours()).padStart(2, "0");
                        const mm = String(v.getMinutes()).padStart(2, "0");
                        const ss = String(v.getSeconds()).padStart(2, "0");
                        return `'${y}-${m}-${d} ${hh}:${mm}:${ss}'`;
                    }
                    const escaped = String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                    return `'${escaped}'`;
                });
                valStrings.push(`(${vals.join(", ")})`);
            }
            sql += valStrings.join(",\n") + ";\n";
        }
        sql += `\n`;
    }

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const dumpPath = path.join(__dirname, "seed_demo.sql");
    fs.writeFileSync(dumpPath, sql, "utf-8");
}

seed().catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
});
