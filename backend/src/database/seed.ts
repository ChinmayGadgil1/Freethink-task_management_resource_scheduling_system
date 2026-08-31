import bcrypt from "bcryptjs";
import { initializeDatabase } from "./init.js";
import type { ResultSetHeader } from "mysql2/promise";
import { recalculate } from "../services/scheduler/SchedulingEngine.js";

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
        { name: "Jane Smith", username: "jane.dev", email: "jane.dev@company.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
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

    // 2. Insert Holidays
    console.log("\nInserting company holidays...");
        const holidaysData = [
        { holiday_date: "2026-01-26", description: "Republic Day" },
        { holiday_date: "2026-03-03", description: "Holi" },
        { holiday_date: "2026-03-19", description: "Gudi Padava" },
        { holiday_date: "2026-03-21", description: "Id-Ul Fitr (Depends on Moon)" },
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

    // 3. Insert User Leaves
    console.log("\n🌴 Inserting user leave requests...");
    const leavesData = [
        {
            email: "jane.dev@company.com",
            leave_date: "2026-09-02",
            leave_hours: 9.00,
            status: "APPROVED",
            approver_email: "alex.pm@company.com",
            approved_at: "2026-08-30 10:00:00"
        },
        {
            email: "john.dev@company.com",
            leave_date: "2026-09-04",
            leave_hours: 4.50,
            status: "APPROVED",
            approver_email: "alex.pm@company.com",
            approved_at: "2026-08-30 11:30:00"
        },
        {
            email: "david.devops@company.com",
            leave_date: "2026-09-10",
            leave_hours: 9.00,
            status: "PENDING",
            approver_email: null,
            approved_at: null
        },
        {
            email: "jane.dev@company.com",
            leave_date: "2026-09-15",
            leave_hours: 8.00,
            status: "PENDING",
            approver_email: null,
            approved_at: null
        },
        {
            email: "michael.fe@company.com",
            leave_date: "2026-09-18",
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
                `INSERT INTO user_leaves (user_id, leave_date, leave_hours, status, approver_id, approved_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, l.leave_date, l.leave_hours, l.status, approverId, l.approved_at]
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
            name: "NextGen Cloud Migration",
            description: "Migrate legacy infrastructure to AWS microservices and Kubernetes cluster.",
            status: "ACTIVE",
            priority: "CRITICAL",
            start_date: "2026-08-01",
            deadline: "2026-10-31",
            progress: 45.0
        },
        {
            key: "p2",
            pm: "alex.pm@company.com",
            name: "AI Analytics & Dashboard Portal",
            description: "Building predictive analytics dashboard with real-time streaming pipelines.",
            status: "PUBLISHED",
            priority: "HIGH",
            start_date: "2026-08-10",
            deadline: "2026-11-15",
            progress: 20.0
        },
        {
            key: "p3",
            pm: "sarah.pm@company.com",
            name: "Core ERP Modernization",
            description: "Overhauling finance, supply chain, and HR modules.",
            status: "ON_HOLD",
            priority: "HIGH",
            start_date: "2026-07-01",
            deadline: "2026-12-31",
            progress: 55.0
        },
        {
            key: "p4",
            pm: "sarah.pm@company.com",
            name: "Customer Mobile App v2.0",
            description: "Revamped iOS and Android mobile app with biometrics and offline mode.",
            status: "COMPLETED",
            priority: "MEDIUM",
            start_date: "2026-05-01",
            deadline: "2026-08-15",
            progress: 100.0
        },
        {
            key: "p5",
            pm: "alex.pm@company.com",
            name: "Internal Developer Platform & CI/CD",
            description: "Automated deployment templates, preview environments, and security scanners.",
            status: "DRAFT",
            priority: "LOW",
            start_date: "2026-09-01",
            deadline: "2026-12-01",
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

    // 5. Assign Project Members
    console.log("\n👥 Assigning project members...");
    const projectMembers = [
        { projectKey: "p1", emails: ["john.dev@company.com", "jane.dev@company.com", "alice.ui@company.com", "david.devops@company.com", "bob.qa@company.com"] },
        { projectKey: "p2", emails: ["john.dev@company.com", "jane.dev@company.com", "alice.ui@company.com", "bob.qa@company.com"] },
        { projectKey: "p3", emails: ["jane.dev@company.com", "alice.ui@company.com", "bob.qa@company.com"] },
        { projectKey: "p4", emails: ["john.dev@company.com", "alice.ui@company.com", "bob.qa@company.com"] },
        { projectKey: "p5", emails: ["david.devops@company.com", "john.dev@company.com"] }
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
        // Project 1 Tasks (NextGen Cloud Migration)
        {
            key: "t1_arch",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Architecture & Infrastructure Design",
            description: "Finalize Kubernetes topology and VPC peering setup.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: "2026-08-08",
            actual_start: "2026-08-01",
            actual_end: "2026-08-08",
            expected_effort: 30,
            actual_effort: 32,
            progress: 100,
            assignees: ["david.devops@company.com", "jane.dev@company.com"]
        },
        {
            key: "t1_db",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Database Migration & Schema Sync",
            description: "Migrate MySQL instances to AWS Aurora and verify replication latency.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: "2026-09-05",
            actual_start: "2026-08-09",
            actual_end: null,
            expected_effort: 40,
            actual_effort: 28,
            progress: 70,
            assignees: ["jane.dev@company.com"]
        },
        {
            key: "t1_microservices",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Microservices Containerization",
            description: "Build Docker images and configure Helm charts for backend services.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: "2026-09-10",
            actual_start: "2026-08-12",
            actual_end: null,
            expected_effort: 50,
            actual_effort: 35,
            progress: 60,
            assignees: ["john.dev@company.com", "david.devops@company.com"]
        },
        {
            key: "t1_qa",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Performance & Failover Testing",
            description: "Execute load testing under simulated high peak traffic.",
            priority: "MEDIUM",
            status: "SCHEDULED",
            deadline: "2026-09-25",
            actual_start: null,
            actual_end: null,
            expected_effort: 25,
            actual_effort: 0,
            progress: 0,
            assignees: ["bob.qa@company.com"]
        },
        {
            key: "t1_security_tight_deadline",
            projectKey: "p1",
            createdBy: "alex.pm@company.com",
            title: "Security & Compliance Audit",
            description: "Audit IAM roles, security groups, and encryption keys. Tight deadline.",
            priority: "CRITICAL",
            status: "IN_PROGRESS",
            deadline: "2026-08-28", // Very tight deadline -> triggers deadline risk
            actual_start: "2026-08-20",
            actual_end: null,
            expected_effort: 35,
            actual_effort: 10,
            progress: 30,
            assignees: ["david.devops@company.com"]
        },

        // Project 2 Tasks (AI Analytics)
        {
            key: "t2_pipeline",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Data Ingestion Pipeline",
            description: "Kafka stream consumer and ETL processing job.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: "2026-09-02",
            actual_start: "2026-08-10",
            actual_end: null,
            expected_effort: 35,
            actual_effort: 20,
            progress: 50,
            assignees: ["jane.dev@company.com"]
        },
        {
            key: "t2_ui",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Interactive Charts & Visualizations",
            description: "Build dynamic widgets for metrics tracking using Apache ECharts/D3.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: "2026-09-15",
            actual_start: "2026-08-15",
            actual_end: null,
            expected_effort: 40,
            actual_effort: 15,
            progress: 30,
            assignees: ["alice.ui@company.com"]
        },
        {
            key: "t2_model",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Predictive Model Integration",
            description: "Integrate forecast models via gRPC endpoint. Exceeded planned hours.",
            priority: "CRITICAL",
            status: "IN_PROGRESS",
            deadline: "2026-09-08",
            actual_start: "2026-08-12",
            actual_end: null,
            expected_effort: 20,
            actual_effort: 26, // Overrun effort
            progress: 40,
            assignees: ["john.dev@company.com"]
        },
        {
            key: "t2_unassigned",
            projectKey: "p2",
            createdBy: "alex.pm@company.com",
            title: "Anomaly Detection Module",
            description: "Module for auto-flagging outlier spikes.",
            priority: "MEDIUM",
            status: "UNASSIGNED",
            deadline: "2026-09-30",
            actual_start: null,
            actual_end: null,
            expected_effort: 25,
            actual_effort: 0,
            progress: 0,
            assignees: []
        },

        // Project 3 Tasks (Core ERP)
        {
            key: "t3_finance",
            projectKey: "p3",
            createdBy: "sarah.pm@company.com",
            title: "Finance Module Refactor",
            description: "Re-architect General Ledger and Accounts Payable business logic.",
            priority: "CRITICAL",
            status: "IN_PROGRESS",
            deadline: "2026-09-30",
            actual_start: "2026-07-05",
            actual_end: null,
            expected_effort: 60,
            actual_effort: 35,
            progress: 50,
            assignees: ["jane.dev@company.com"]
        },
        {
            key: "t3_supply",
            projectKey: "p3",
            createdBy: "sarah.pm@company.com",
            title: "Inventory & Supply Chain Integration",
            description: "Connect warehouse barcode scanning APIs.",
            priority: "MEDIUM",
            status: "SCHEDULED",
            deadline: "2026-10-15",
            actual_start: null,
            actual_end: null,
            expected_effort: 45,
            actual_effort: 0,
            progress: 0,
            assignees: ["alice.ui@company.com", "jane.dev@company.com"]
        },

        // Project 4 Tasks (Mobile App v2.0 - Completed)
        {
            key: "t4_auth",
            projectKey: "p4",
            createdBy: "sarah.pm@company.com",
            title: "Biometric Authentication (FaceID/Fingerprint)",
            description: "Secure login flow with hardware keystore integration.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: "2026-06-01",
            actual_start: "2026-05-05",
            actual_end: "2026-05-30",
            expected_effort: 30,
            actual_effort: 28,
            progress: 100,
            assignees: ["john.dev@company.com"]
        },
        {
            key: "t4_offline",
            projectKey: "p4",
            createdBy: "sarah.pm@company.com",
            title: "Offline Data Sync Engine",
            description: "SQLite local cache with automatic sync on network restoration.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: "2026-07-15",
            actual_start: "2026-06-02",
            actual_end: "2026-07-10",
            expected_effort: 40,
            actual_effort: 40,
            progress: 100,
            assignees: ["john.dev@company.com", "alice.ui@company.com"]
        },
        {
            key: "t4_release",
            projectKey: "p4",
            createdBy: "sarah.pm@company.com",
            title: "Store Submission & Release QA",
            description: "Apple App Store and Google Play Store verification and rollout.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: "2026-08-10",
            actual_start: "2026-07-20",
            actual_end: "2026-08-08",
            expected_effort: 20,
            actual_effort: 18,
            progress: 100,
            assignees: ["bob.qa@company.com"]
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
        { taskKey: "t1_db", predecessorKey: "t1_arch" },
        { taskKey: "t1_microservices", predecessorKey: "t1_arch" },
        { taskKey: "t1_qa", predecessorKey: "t1_db" },
        { taskKey: "t1_qa", predecessorKey: "t1_microservices" },

        // Project 2
        { taskKey: "t2_ui", predecessorKey: "t2_pipeline" },
        { taskKey: "t2_model", predecessorKey: "t2_pipeline" },

        // Project 4
        { taskKey: "t4_offline", predecessorKey: "t4_auth" },
        { taskKey: "t4_release", predecessorKey: "t4_offline" }
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
            hours: 16,
            progress: 50,
            status: "IN_PROGRESS",
            notes: "Drafted Kubernetes cluster manifest and Terraform configs.",
            blockers: null,
            log_date: "2026-08-03"
        },
        {
            taskKey: "t1_arch",
            email: "jane.dev@company.com",
            hours: 16,
            progress: 100,
            status: "COMPLETED",
            notes: "VPC Peering validated and signoff received from security team.",
            blockers: null,
            log_date: "2026-08-07"
        },
        {
            taskKey: "t1_db",
            email: "jane.dev@company.com",
            hours: 14,
            progress: 40,
            status: "IN_PROGRESS",
            notes: "Initial schema sync scripts executed without data loss.",
            blockers: null,
            log_date: "2026-08-11"
        },
        {
            taskKey: "t1_db",
            email: "jane.dev@company.com",
            hours: 14,
            progress: 70,
            status: "IN_PROGRESS",
            notes: "Configured continuous replication stream. Monitoring latency.",
            blockers: "Occasional throttle on source DB pool.",
            log_date: "2026-08-16"
        },
        {
            taskKey: "t1_microservices",
            email: "john.dev@company.com",
            hours: 20,
            progress: 40,
            status: "IN_PROGRESS",
            notes: "Dockerized auth and project services.",
            blockers: null,
            log_date: "2026-08-14"
        },
        {
            taskKey: "t1_microservices",
            email: "david.devops@company.com",
            hours: 15,
            progress: 60,
            status: "IN_PROGRESS",
            notes: "Helm templates configured with ingress rules.",
            blockers: null,
            log_date: "2026-08-18"
        },
        {
            taskKey: "t2_pipeline",
            email: "jane.dev@company.com",
            hours: 20,
            progress: 50,
            status: "IN_PROGRESS",
            notes: "Kafka consumer group setup and schema registry connected.",
            blockers: null,
            log_date: "2026-08-15"
        },
        {
            taskKey: "t2_ui",
            email: "alice.ui@company.com",
            hours: 15,
            progress: 30,
            status: "IN_PROGRESS",
            notes: "Created reusable widget components.",
            blockers: null,
            log_date: "2026-08-18"
        },
        {
            taskKey: "t2_model",
            email: "john.dev@company.com",
            hours: 26,
            progress: 40,
            status: "IN_PROGRESS",
            notes: "Memory spikes with batch inference.",
            blockers: "High memory utilization requires quantization.",
            log_date: "2026-08-19"
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
    const activeTaskId = taskMap["t1_db"];
    const activeUserId = userMap["jane.dev@company.com"];
    if (activeTaskId && activeUserId) {
        await pool.query(
            `INSERT INTO task_sessions (task_id, user_id, start_time, is_active) VALUES (?, ?, NOW(), TRUE)`,
            [activeTaskId, activeUserId]
        );
        console.log("✅ Active task session created for Jane Smith.");
    }

    // 10. Run SchedulingEngine.recalculate on active projects to populate task_schedules and risk flags
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
    console.log("  • john.dev@company.com     / john.dev     (John Doe - Fullstack Dev)");
    console.log("  • jane.dev@company.com     / jane.dev     (Jane Smith - Backend Lead)");
    console.log("  • alice.ui@company.com     / alice.ui     (Alice Wong - Frontend/UI)");
    console.log("  • bob.qa@company.com       / bob.qa       (Bob Miller - QA Engineer)");
    console.log("  • david.devops@company.com / david.devops (David Patel - DevOps)");
    console.log("  • inactive.user@company.com / inactive.user (Inactive User)");
    console.log("=======================================================\n");

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
});
