import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { initializeDatabase } from "./init.js";
import type { ResultSetHeader } from "mysql2/promise";
import { recalculate } from "../services/scheduler/SchedulingEngine.js";

function getOffsetDate(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function seed() {
    console.log("🌱 Starting fresh database initialization & seeding...");

    // 1. Drop existing tables and recreate cleanly
    const pool = await initializeDatabase({ dropExisting: true });

    console.log("\n🔑 Creating default users with encrypted passwords...");
    const defaultPassword = "Password123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const usersData = [
        { name: "Alex Morgan", username: "alex.pm", email: "alex.pm@company.com", role: "PROJECT_MANAGER", is_active: true, non_working_days: null, daily_working_hours: 8.00, schedule_configured: false },
        { name: "Sarah Connor", username: "sarah.pm", email: "sarah.pm@company.com", role: "PROJECT_MANAGER", is_active: true, non_working_days: null, daily_working_hours: 8.00, schedule_configured: false },
        { name: "John Doe", username: "john.dev", email: "john.dev@company.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Jane Smith", username: "jane.dev", email: "jane.dev@company.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["FRIDAY", "SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Alice Wong", username: "alice.ui", email: "alice.ui@company.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Bob Miller", username: "bob.qa", email: "bob.qa@company.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "David Patel", username: "david.devops", email: "david.devops@company.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Inactive User", username: "inactive.user", email: "inactive.user@company.com", role: "RESOURCE", is_active: false, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
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

    // 2. Insert Company Holidays (Upcoming holiday on +2 days e.g. Thursday Sep 3)
    console.log("\n🎉 Inserting company holidays...");
    const upcomingHolidayDate = getOffsetDate(2);
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
    console.log(`✅ Inserted ${holidaysData.length} holidays.`);

    // 3. Insert User Leaves:
    // - John: Approved leave on +1 day (Tomorrow Sep 2)
    // - Jane: Approved partial leave on +4 day (Saturday Sep 5)
    // - David: PENDING leave on +3 day (Friday Sep 4, which is currently an active working day for Task 5!)
    console.log("\n🌴 Inserting user leave requests...");
    const johnLeaveDate = getOffsetDate(1);
    const davidLeaveDate = getOffsetDate(3); // Friday Sep 4 (Active working day!)
    const leavesData = [
        {
            email: "john.dev@company.com",
            leave_date: johnLeaveDate,
            leave_hours: 8.00,
            status: "APPROVED",
            approver_email: "alex.pm@company.com",
            approved_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        },
        {
            email: "jane.dev@company.com",
            leave_date: getOffsetDate(4),
            leave_hours: 4.00,
            status: "APPROVED",
            approver_email: "alex.pm@company.com",
            approved_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        },
        {
            email: "david.devops@company.com",
            leave_date: davidLeaveDate,
            leave_hours: 8.00,
            status: "PENDING", // On Friday Sep 4!
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

    // 4. Insert Projects
    console.log("\n📁 Creating projects...");
    const projectsData = [
        {
            key: "p1",
            pm: "alex.pm@company.com",
            name: "Cloud Architecture & Scheduling Showcase",
            description: "Active project designed to test non-working days, holidays, approved leaves, and CPM dependencies.",
            status: "ACTIVE",
            priority: "CRITICAL",
            start_date: getOffsetDate(-10),
            deadline: getOffsetDate(20),
            progress: 35.0
        },
        {
            key: "p2",
            pm: "alex.pm@company.com",
            name: "AI Analytics & Real-Time Engine",
            description: "High-priority streaming analytics platform with multi-resource assignments and cross-project load.",
            status: "PUBLISHED",
            priority: "HIGH",
            start_date: getOffsetDate(-5),
            deadline: getOffsetDate(15),
            progress: 20.0
        },
        {
            key: "p3",
            pm: "sarah.pm@company.com",
            name: "Core ERP Modernization",
            description: "Enterprise overhaul for financial and inventory processing.",
            status: "ON_HOLD",
            priority: "HIGH",
            start_date: getOffsetDate(-20),
            deadline: getOffsetDate(40),
            progress: 50.0
        },
        {
            key: "p4",
            pm: "sarah.pm@company.com",
            name: "Customer Mobile App v2.0",
            description: "Completed project for testing archive and historical views.",
            status: "COMPLETED",
            priority: "MEDIUM",
            start_date: getOffsetDate(-60),
            deadline: getOffsetDate(-10),
            progress: 100.0
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

    // 5. Assign Project Members
    console.log("\n👥 Assigning project members...");
    const projectMembers = [
        { projectKey: "p1", emails: ["john.dev@company.com", "jane.dev@company.com", "alice.ui@company.com", "david.devops@company.com", "bob.qa@company.com"] },
        { projectKey: "p2", emails: ["john.dev@company.com", "jane.dev@company.com", "alice.ui@company.com", "bob.qa@company.com"] },
        { projectKey: "p3", emails: ["jane.dev@company.com", "alice.ui@company.com", "bob.qa@company.com"] },
        { projectKey: "p4", emails: ["john.dev@company.com", "alice.ui@company.com", "bob.qa@company.com"] }
    ];

    for (const pm of projectMembers) {
        const projectId = projectMap[pm.projectKey];
        for (const email of pm.emails) {
            const userId = userMap[email];
            await pool.query(
                `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
                [projectId, userId]
            );
        }
    }
    console.log("✅ Project members assigned.");

    // 6. Create Tasks
    console.log("\n📋 Creating tasks...");
    const tasksData = [
        // Project 1: Cloud Architecture & Scheduling Showcase
        {
            key: "t1_arch",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Task 1: System Topology & Baseline Architecture",
            description: "Predecessor task completed previously.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-2),
            actual_start: getOffsetDate(-8),
            actual_end: getOffsetDate(-2),
            expected_effort: 24,
            actual_effort: 24,
            progress: 100,
            assignees: ["david.devops@company.com"]
        },
        {
            key: "t1_john_leaves",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Task 2: API Gateway & Service Mesh (John - Has Approved Leave & Holiday)",
            description: "32 hours total effort (8h logged, 24h remaining = 3 working days). Starts Today (8h), skips Tomorrow (Leave) and Next Day (Holiday), resumes Friday (8h), skips Weekend, and finishes Monday (8h).",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDate(0),
            actual_end: null,
            expected_effort: 32,
            actual_effort: 8,
            progress: 25,
            assignees: ["john.dev@company.com"]
        },
        {
            key: "t1_jane_custom_schedule",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Task 3: Backend Data Persistence (Jane - 4-Day Work Week Fri-Sun Off)",
            description: "Assigned to Jane Smith who has Fridays, Saturdays, and Sundays configured as non-working days.",
            priority: "HIGH",
            status: "SCHEDULED",
            deadline: getOffsetDate(10),
            actual_start: null,
            actual_end: null,
            expected_effort: 24,
            actual_effort: 0,
            progress: 0,
            assignees: ["jane.dev@company.com"]
        },
        {
            key: "t1_dependent_chain",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Task 4: End-to-End Integration & Load Verification",
            description: "Depends on Task 2 and Task 3. Dynamically scheduled to start only after both finish.",
            priority: "MEDIUM",
            status: "SCHEDULED",
            deadline: getOffsetDate(18),
            actual_start: null,
            actual_end: null,
            expected_effort: 16,
            actual_effort: 0,
            progress: 0,
            assignees: ["bob.qa@company.com"]
        },
        {
            key: "t1_tight_deadline_risk",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Task 5: Security Compliance & Penetration Test (David - Has Pending Leave on Friday)",
            description: "32h total effort, 8h logged, 24h remaining. Scheduled on Tue (8h), Wed (8h), and Fri (8h). Approving David's pending Friday leave will push his final 8h to Monday!",
            priority: "CRITICAL",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDate(0),
            actual_end: null,
            expected_effort: 32,
            actual_effort: 8,
            progress: 25,
            assignees: ["david.devops@company.com"]
        },

        // Project 2: AI Analytics & Real-Time Engine
        {
            key: "t2_pipeline",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Kafka Real-Time Streaming Ingestion",
            description: "Streaming pipeline for model feeds.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(6),
            actual_start: getOffsetDate(-3),
            actual_end: null,
            expected_effort: 30,
            actual_effort: 14,
            progress: 45,
            assignees: ["jane.dev@company.com"]
        },
        {
            key: "t2_ui",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Analytics Dashboard UI Widgets",
            description: "Interactive metric charts and widgets.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(12),
            actual_start: getOffsetDate(-1),
            actual_end: null,
            expected_effort: 32,
            actual_effort: 8,
            progress: 25,
            assignees: ["alice.ui@company.com"]
        },
        {
            key: "t2_model_overrun",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Inference Model Pipeline (Effort Overrun)",
            description: "Model integration exceeding expected effort to test overrun detection.",
            priority: "CRITICAL",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDate(-4),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 22, // Overrun
            progress: 60,
            assignees: ["john.dev@company.com"]
        },

        // Project 4: Mobile App v2.0 (Completed)
        {
            key: "t4_auth",
            projectKey: "p4",
            createdBy: "sarah.pm@company.com",
            title: "Biometric Authentication",
            description: "FaceID and fingerprint integration.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-30),
            actual_start: getOffsetDate(-50),
            actual_end: getOffsetDate(-32),
            expected_effort: 24,
            actual_effort: 24,
            progress: 100,
            assignees: ["john.dev@company.com"]
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
            await pool.query(
                `INSERT IGNORE INTO task_assignments (task_id, user_id) VALUES (?, ?)`,
                [taskId, userId]
            );
        }
    }
    console.log(`✅ Inserted ${tasksData.length} tasks and assigned resources.`);

    // 7. Insert Task Dependencies
    console.log("\n🔗 Creating task dependencies...");
    const dependenciesData = [
        // Project 1
        { taskKey: "t1_john_leaves", predecessorKey: "t1_arch" },
        { taskKey: "t1_jane_custom_schedule", predecessorKey: "t1_arch" },
        { taskKey: "t1_dependent_chain", predecessorKey: "t1_john_leaves" },
        { taskKey: "t1_dependent_chain", predecessorKey: "t1_jane_custom_schedule" },

        // Project 2
        { taskKey: "t2_ui", predecessorKey: "t2_pipeline" },
        { taskKey: "t2_model_overrun", predecessorKey: "t2_pipeline" }
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

    // 8. Insert Work Logs
    console.log("\n📝 Creating work logs...");
    const workLogsData = [
        {
            taskKey: "t1_arch",
            email: "david.devops@company.com",
            hours: 24,
            progress: 100,
            status: "COMPLETED",
            notes: "Architecture setup and cloud verification complete.",
            blockers: null,
            log_date: getOffsetDate(-3)
        },
        {
            taskKey: "t1_john_leaves",
            email: "john.dev@company.com",
            hours: 8,
            progress: 25,
            status: "IN_PROGRESS",
            notes: "Setup Gateway routing configurations.",
            blockers: null,
            log_date: getOffsetDate(0)
        },
        {
            taskKey: "t1_tight_deadline_risk",
            email: "david.devops@company.com",
            hours: 8,
            progress: 25,
            status: "IN_PROGRESS",
            notes: "Started compliance scans.",
            blockers: null,
            log_date: getOffsetDate(0)
        },
        {
            taskKey: "t2_pipeline",
            email: "jane.dev@company.com",
            hours: 14,
            progress: 45,
            status: "IN_PROGRESS",
            notes: "Kafka brokers online.",
            blockers: null,
            log_date: getOffsetDate(-1)
        },
        {
            taskKey: "t2_model_overrun",
            email: "john.dev@company.com",
            hours: 22,
            progress: 60,
            status: "IN_PROGRESS",
            notes: "Quantization model pipeline required additional compute tuning.",
            blockers: "Memory pressure exceeded baseline.",
            log_date: getOffsetDate(0)
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

    // 9. Active Task Sessions
    console.log("\n⏱️ Creating sample active task session...");
    const activeTaskId = taskMap["t1_john_leaves"];
    const activeUserId = userMap["john.dev@company.com"];
    if (activeTaskId && activeUserId) {
        await pool.query(
            `INSERT INTO task_sessions (task_id, user_id, start_time, is_active) VALUES (?, ?, NOW(), TRUE)`,
            [activeTaskId, activeUserId]
        );
        console.log("✅ Active task session created for John Doe.");
    }

    // 10. Run SchedulingEngine.recalculate on active projects
    console.log("\n⚙️ Running SchedulingEngine to compute initial Gantt schedules and risk flags...");
    for (const key of ["p1", "p2", "p3"]) {
        const projectId = projectMap[key];
        if (projectId) {
            console.log(`  Calculating schedules for Project ID: ${projectId}...`);
            await recalculate(projectId);
        }
    }
    console.log("✅ SchedulingEngine calculations complete.");

    console.log("\n=======================================================");
    console.log("🎉 DATABASE SEEDED & SYNCHRONIZED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("User Credentials for Testing (Password for all: Password123!):");
    console.log("-------------------------------------------------------");
    console.log("PROJECT MANAGERS:");
    console.log("  • alex.pm@company.com   / alex.pm   (Alex Morgan - Active Projects & Risks)");
    console.log("  • sarah.pm@company.com  / sarah.pm  (Sarah Connor - Completed/ERP Projects)");
    console.log("\nRESOURCES:");
    console.log("  • john.dev@company.com     / john.dev     (John Doe - Approved Leave Tomorrow Wed Sep 2)");
    console.log("  • jane.dev@company.com     / jane.dev     (Jane Smith - Custom 4-Day week: Fri/Sat/Sun off)");
    console.log("  • alice.ui@company.com     / alice.ui     (Alice Wong - Frontend/UI)");
    console.log("  • bob.qa@company.com       / bob.qa       (Bob Miller - QA Engineer)");
    console.log("  • david.devops@company.com / david.devops (David Patel - DevOps, Pending Leave on Fri Sep 4)");
    console.log("=======================================================\n");

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
});
