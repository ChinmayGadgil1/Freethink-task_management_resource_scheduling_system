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
    console.log("🌱 Starting Freethink database seeding with 8 resources, 2 PMs...");

    const pool = await initializeDatabase({ dropExisting: true });

    console.log("\n🔑 Creating users...");
    const defaultPassword = "Password123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const usersData = [
        // PMs
        { name: "Alice Manager", username: "alice", email: "alice@gmail.com", role: "PROJECT_MANAGER", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Bob Manager", username: "bob", email: "bob@gmail.com", role: "PROJECT_MANAGER", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        // Resources
        { name: "Charlie Developer", username: "charlie", email: "charlie@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "David Designer", username: "david", email: "david@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Eve Engineer", username: "eve", email: "eve@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Frank Tester", username: "frank", email: "frank@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Grace Analyst", username: "grace", email: "grace@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Heidi DevOps", username: "heidi", email: "heidi@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Ivan Architect", username: "ivan", email: "ivan@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Judy Data", username: "judy", email: "judy@gmail.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true }
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

    console.log("\n📁 Creating projects...");
    const projectsData = [
        {
            key: "freelance_website",
            pm: "alice@gmail.com",
            name: "FREELANCE WEBSITE",
            description: "A platform for freelancers to showcase work and find clients.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            start_date: getOffsetDate(0), // 24 Sept
            deadline: getOffsetDate(30),
            progress: 0.0
        },
        {
            key: "ecommerce_website",
            pm: "alice@gmail.com",
            name: "E-COMMERCE WEBSITE",
            description: "Online store and shopping cart platform.",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            start_date: getOffsetDate(5), 
            deadline: getOffsetDate(40),
            progress: 0.0
        },
        {
            key: "general_booking",
            pm: "bob@gmail.com",
            name: "GENERAL BOOKING APPLICATION",
            description: "Application for booking appointments and reservations.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            start_date: getOffsetDate(0), // 24 Sept
            deadline: getOffsetDate(30),
            progress: 0.0
        },
        {
            key: "task_management",
            pm: "bob@gmail.com",
            name: "TASK MANAGEMENT SYSTEM",
            description: "Enterprise task management and tracking software.",
            status: "IN_PROGRESS",
            priority: "CRITICAL",
            start_date: getOffsetDate(10),
            deadline: getOffsetDate(60),
            progress: 0.0
        },
        // --- PAST COMPLETED PROJECTS ---
        {
            key: "legacy_upgrade",
            pm: "alice@gmail.com",
            name: "LEGACY SYSTEM UPGRADE",
            description: "Upgraded legacy database and services.",
            status: "COMPLETED",
            priority: "HIGH",
            start_date: getOffsetDate(-60),
            deadline: getOffsetDate(-30),
            progress: 100.0
        },
        {
            key: "mobile_app_v1",
            pm: "bob@gmail.com",
            name: "MOBILE APP V1",
            description: "Initial release of the mobile application.",
            status: "COMPLETED",
            priority: "CRITICAL",
            start_date: getOffsetDate(-45),
            deadline: getOffsetDate(-15),
            progress: 100.0
        },
        {
            key: "internal_tooling",
            pm: "alice@gmail.com",
            name: "INTERNAL TOOLING",
            description: "Development of internal CLI tools.",
            status: "COMPLETED",
            priority: "MEDIUM",
            start_date: getOffsetDate(-30),
            deadline: getOffsetDate(-5),
            progress: 100.0
        }
    ];

    const projectMap: Record<string, number> = {};
    for (const p of projectsData) {
        const pmId = userMap[p.pm];
        const [res] = await pool.query<ResultSetHeader>(
            `INSERT INTO projects (project_manager_id, name, description, status, priority, start_date, deadline, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [pmId, p.name, p.description, p.status, p.priority, p.start_date, p.deadline, p.progress]
        );
        projectMap[p.key] = res.insertId;
    }
    console.log(`✅ Inserted ${projectsData.length} projects.`);

    const projectResourceAssignments: Record<string, string[]> = {
        freelance_website: ["charlie@gmail.com", "david@gmail.com", "eve@gmail.com", "heidi@gmail.com", "ivan@gmail.com", "alice@gmail.com"],
        ecommerce_website: ["charlie@gmail.com", "david@gmail.com", "frank@gmail.com", "grace@gmail.com", "judy@gmail.com", "alice@gmail.com"],
        general_booking: ["charlie@gmail.com", "david@gmail.com", "eve@gmail.com", "frank@gmail.com", "grace@gmail.com", "judy@gmail.com", "bob@gmail.com"],
        task_management: ["eve@gmail.com", "heidi@gmail.com", "ivan@gmail.com", "judy@gmail.com", "bob@gmail.com"],
        legacy_upgrade: ["charlie@gmail.com", "eve@gmail.com", "heidi@gmail.com"],
        mobile_app_v1: ["david@gmail.com", "frank@gmail.com", "grace@gmail.com"],
        internal_tooling: ["ivan@gmail.com", "judy@gmail.com", "charlie@gmail.com"]
    };

    for (const [projectKey, emails] of Object.entries(projectResourceAssignments)) {
        const projectId = projectMap[projectKey];
        if (!projectId) continue;
        for (const email of emails) {
            const userId = userMap[email];
            if (userId) {
                await pool.query(`INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`, [projectId, userId]);
            }
        }
    }
    console.log("✅ Project memberships created.");

    console.log("\n📋 Creating tasks...");
    const tasksData = [
        // ===================================
        // 1. FREELANCE WEBSITE (Sept 24) - PM: Alice
        // ===================================
        {
            key: "fw_db", projectKey: "freelance_website", createdBy: "alice@gmail.com",
            title: "DB SCHEMA DESIGN", description: "Design database schema for freelance website.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(10), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["ivan@gmail.com"] // Single resource
        },
        {
            key: "fw_auth", projectKey: "freelance_website", createdBy: "alice@gmail.com",
            title: "AUTH", description: "Implement authentication and authorization.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(15), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["charlie@gmail.com", "eve@gmail.com"] // Multi resource
        },
        {
            key: "fw_ui", projectKey: "freelance_website", createdBy: "alice@gmail.com",
            title: "UI DESIGN", description: "Design UI for the freelance website.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(12), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["david@gmail.com"] 
        },
        {
            key: "fw_dash", projectKey: "freelance_website", createdBy: "alice@gmail.com",
            title: "DASHBOARD", description: "Develop user dashboard.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(20), actual_start: null, actual_end: null,
            expected_effort: 32, actual_effort: 0, progress: 0, assignees: ["charlie@gmail.com", "david@gmail.com"] 
        },
        {
            key: "fw_backend", projectKey: "freelance_website", createdBy: "alice@gmail.com",
            title: "BACKEND", description: "Develop backend API services.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(22), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["eve@gmail.com", "ivan@gmail.com"] 
        },
        {
            key: "fw_deploy", projectKey: "freelance_website", createdBy: "alice@gmail.com",
            title: "DEPLOYMENT", description: "Deploy to production environment.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(28), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["heidi@gmail.com", "alice@gmail.com"] // Supervisor
        },

        // ===================================
        // 2. E-COMMERCE WEBSITE - PM: Alice
        // ===================================
        {
            key: "ec_db", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "DB SCHEMA DESIGN", description: "Design e-commerce schema.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(10), actual_start: null, actual_end: null,
            expected_effort: 20, actual_effort: 0, progress: 0, assignees: ["judy@gmail.com"]
        },
        {
            key: "ec_auth", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "AUTH", description: "Implement auth system.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(15), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["charlie@gmail.com"]
        },
        {
            key: "ec_ui", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "UI DESIGN", description: "E-commerce interface design.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(15), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["david@gmail.com"]
        },
        {
            key: "ec_product", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "PRODUCT MANAGEMENT", description: "Product inventory management module.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(20), actual_start: null, actual_end: null,
            expected_effort: 30, actual_effort: 0, progress: 0, assignees: ["grace@gmail.com"]
        },
        {
            key: "ec_cart", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "CART & CHECKOUT", description: "Shopping cart and checkout flow.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(25), actual_start: null, actual_end: null,
            expected_effort: 32, actual_effort: 0, progress: 0, assignees: ["charlie@gmail.com", "david@gmail.com"]
        },
        {
            key: "ec_payment", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "PAYMENT INTEGRATION", description: "Stripe and PayPal integration.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(28), actual_start: null, actual_end: null,
            expected_effort: 20, actual_effort: 0, progress: 0, assignees: ["frank@gmail.com", "alice@gmail.com"] // Supervisor
        },
        {
            key: "ec_order", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "ORDER MANAGEMENT", description: "Order tracking and history.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(32), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["grace@gmail.com"]
        },
        {
            key: "ec_api", projectKey: "ecommerce_website", createdBy: "alice@gmail.com",
            title: "API DEVELOPMENT", description: "E-commerce REST APIs.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(35), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["frank@gmail.com", "judy@gmail.com"]
        },

        // ===================================
        // 3. GENERAL BOOKING APPLICATION (Sept 24) - PM: Bob
        // ===================================
        {
            key: "gb_db", projectKey: "general_booking", createdBy: "bob@gmail.com",
            title: "DB DESIGN", description: "Design database for booking application.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(10), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["judy@gmail.com"] // Single resource
        },
        {
            key: "gb_auth", projectKey: "general_booking", createdBy: "bob@gmail.com",
            title: "AUTH", description: "Implement auth for booking app.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(14), actual_start: null, actual_end: null,
            expected_effort: 20, actual_effort: 0, progress: 0, assignees: ["charlie@gmail.com", "eve@gmail.com"] // Multi resource
        },
        {
            key: "gb_ui", projectKey: "general_booking", createdBy: "bob@gmail.com",
            title: "UI DESIGN", description: "Design UI for booking app.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(12), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["david@gmail.com"]
        },
        {
            key: "gb_user_dash", projectKey: "general_booking", createdBy: "bob@gmail.com",
            title: "USER DASHBOARD", description: "Develop dashboard for users.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(22), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["charlie@gmail.com", "david@gmail.com"]
        },
        {
            key: "gb_admin_dash", projectKey: "general_booking", createdBy: "bob@gmail.com",
            title: "ADMIN DASHBOARD", description: "Develop dashboard for admins.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(24), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["grace@gmail.com", "frank@gmail.com"]
        },
        {
            key: "gb_service", projectKey: "general_booking", createdBy: "bob@gmail.com",
            title: "BOOKING SERVICE", description: "Develop core booking logic.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(26), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["bob@gmail.com", "eve@gmail.com"] // Supervisor task
        },

        // ===================================
        // 4. TASK MANAGEMENT SYSTEM - PM: Bob
        // ===================================
        {
            key: "tm_db", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "DB DESIGN", description: "Task management database schema.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(20), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["judy@gmail.com"]
        },
        {
            key: "tm_auth", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "AUTH", description: "Authentication layer.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(22), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["eve@gmail.com"]
        },
        {
            key: "tm_ui", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "UI DESIGN", description: "UI for task board.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(25), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["heidi@gmail.com"]
        },
        {
            key: "tm_user_dash", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "USER DASHBOARD", description: "Task list and personal dashboard.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(30), actual_start: null, actual_end: null,
            expected_effort: 30, actual_effort: 0, progress: 0, assignees: ["heidi@gmail.com"]
        },
        {
            key: "tm_pm", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "PROJECT MANAGEMENT", description: "Project creation and tracking.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(35), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["ivan@gmail.com", "bob@gmail.com"] // Supervisor
        },
        {
            key: "tm_task", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "TASK MANAGEMENT", description: "Task creation, assignment, dependencies.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(40), actual_start: null, actual_end: null,
            expected_effort: 50, actual_effort: 0, progress: 0, assignees: ["eve@gmail.com", "ivan@gmail.com"]
        },
        {
            key: "tm_worklog", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "WORK LOG SYSTEM", description: "Time tracking and work logs.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(45), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["judy@gmail.com"]
        },
        {
            key: "tm_api", projectKey: "task_management", createdBy: "bob@gmail.com",
            title: "API DEVELOPMENT", description: "Task management endpoints.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(50), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["eve@gmail.com", "judy@gmail.com"]
        },

        // ===================================
        // 5. LEGACY SYSTEM UPGRADE (Past) - PM: Alice
        // ===================================
        {
            key: "lu_db", projectKey: "legacy_upgrade", createdBy: "alice@gmail.com",
            title: "MIGRATE DATABASE", description: "Migrate from v1 to v2 database.",
            priority: "CRITICAL", status: "COMPLETED", deadline: getOffsetDate(-45), actual_start: getOffsetDateTime(-58), actual_end: getOffsetDateTime(-46),
            expected_effort: 40, actual_effort: 42, progress: 100, assignees: ["heidi@gmail.com"]
        },
        {
            key: "lu_api", projectKey: "legacy_upgrade", createdBy: "alice@gmail.com",
            title: "UPDATE APIS", description: "Update legacy APIs.",
            priority: "HIGH", status: "COMPLETED", deadline: getOffsetDate(-35), actual_start: getOffsetDateTime(-45), actual_end: getOffsetDateTime(-32),
            expected_effort: 60, actual_effort: 55, progress: 100, assignees: ["charlie@gmail.com", "eve@gmail.com"]
        },

        // ===================================
        // 6. MOBILE APP V1 (Past) - PM: Bob
        // ===================================
        {
            key: "ma_ui", projectKey: "mobile_app_v1", createdBy: "bob@gmail.com",
            title: "DESIGN SCREENS", description: "Design all app screens.",
            priority: "HIGH", status: "COMPLETED", deadline: getOffsetDate(-35), actual_start: getOffsetDateTime(-44), actual_end: getOffsetDateTime(-36),
            expected_effort: 30, actual_effort: 30, progress: 100, assignees: ["david@gmail.com"]
        },
        {
            key: "ma_dev", projectKey: "mobile_app_v1", createdBy: "bob@gmail.com",
            title: "APP DEVELOPMENT", description: "React Native implementation.",
            priority: "CRITICAL", status: "COMPLETED", deadline: getOffsetDate(-20), actual_start: getOffsetDateTime(-35), actual_end: getOffsetDateTime(-22),
            expected_effort: 80, actual_effort: 90, progress: 100, assignees: ["frank@gmail.com", "grace@gmail.com"]
        },

        // ===================================
        // 7. INTERNAL TOOLING (Past) - PM: Alice
        // ===================================
        {
            key: "it_cli", projectKey: "internal_tooling", createdBy: "alice@gmail.com",
            title: "BUILD CLI", description: "Build deployment CLI.",
            priority: "MEDIUM", status: "COMPLETED", deadline: getOffsetDate(-15), actual_start: getOffsetDateTime(-28), actual_end: getOffsetDateTime(-16),
            expected_effort: 40, actual_effort: 38, progress: 100, assignees: ["ivan@gmail.com", "judy@gmail.com"]
        },
        {
            key: "it_test", projectKey: "internal_tooling", createdBy: "alice@gmail.com",
            title: "TESTING", description: "Write tests for CLI.",
            priority: "LOW", status: "COMPLETED", deadline: getOffsetDate(-5), actual_start: getOffsetDateTime(-15), actual_end: getOffsetDateTime(-6),
            expected_effort: 20, actual_effort: 25, progress: 100, assignees: ["charlie@gmail.com"]
        }
    ];

    const taskMap: Record<string, number> = {};
    for (const t of tasksData) {
        const projectId = projectMap[t.projectKey];
        const createdById = userMap[t.createdBy];

        const [res] = await pool.query<ResultSetHeader>(
            `INSERT INTO tasks (project_id, created_by, title, description, priority, status, deadline, actual_start, actual_end, expected_effort, actual_effort, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [projectId, createdById, t.title, t.description, t.priority, t.status, t.deadline, t.actual_start, t.actual_end, t.expected_effort, t.actual_effort, t.progress]
        );
        const taskId = res.insertId;
        taskMap[t.key] = taskId;

        for (const email of t.assignees) {
            const userId = userMap[email];
            if (userId) {
                await pool.query(`INSERT IGNORE INTO task_assignments (task_id, user_id) VALUES (?, ?)`, [taskId, userId]);
            }
        }
    }
    console.log(`✅ Inserted tasks.`);

    console.log("\n🔗 Creating task dependencies...");
    const dependenciesData = [
        // Freelance Website Dependencies
        { taskKey: "fw_backend", predecessorKey: "fw_db" },
        { taskKey: "fw_auth", predecessorKey: "fw_backend" },
        { taskKey: "fw_dash", predecessorKey: "fw_ui" },
        { taskKey: "fw_dash", predecessorKey: "fw_auth" },
        { taskKey: "fw_deploy", predecessorKey: "fw_backend" },
        { taskKey: "fw_deploy", predecessorKey: "fw_dash" },

        // E-Commerce Dependencies
        { taskKey: "ec_api", predecessorKey: "ec_db" },
        { taskKey: "ec_auth", predecessorKey: "ec_api" },
        { taskKey: "ec_product", predecessorKey: "ec_api" },
        { taskKey: "ec_cart", predecessorKey: "ec_product" },
        { taskKey: "ec_cart", predecessorKey: "ec_ui" },
        { taskKey: "ec_payment", predecessorKey: "ec_cart" },
        { taskKey: "ec_order", predecessorKey: "ec_payment" },

        // Booking App Dependencies
        { taskKey: "gb_service", predecessorKey: "gb_db" },
        { taskKey: "gb_user_dash", predecessorKey: "gb_ui" },
        { taskKey: "gb_admin_dash", predecessorKey: "gb_ui" },
        { taskKey: "gb_user_dash", predecessorKey: "gb_auth" },
        { taskKey: "gb_user_dash", predecessorKey: "gb_service" },
        { taskKey: "gb_admin_dash", predecessorKey: "gb_service" },

        // Task Management Dependencies
        { taskKey: "tm_api", predecessorKey: "tm_db" },
        { taskKey: "tm_auth", predecessorKey: "tm_api" },
        { taskKey: "tm_pm", predecessorKey: "tm_api" },
        { taskKey: "tm_task", predecessorKey: "tm_pm" },
        { taskKey: "tm_worklog", predecessorKey: "tm_task" },
        { taskKey: "tm_user_dash", predecessorKey: "tm_auth" },
        { taskKey: "tm_user_dash", predecessorKey: "tm_ui" }
    ];

    for (const dep of dependenciesData) {
        const taskId = taskMap[dep.taskKey];
        const predId = taskMap[dep.predecessorKey];
        if (taskId && predId) {
            await pool.query(`INSERT IGNORE INTO task_dependencies (task_id, predecessor_task_id) VALUES (?, ?)`, [taskId, predId]);
        }
    }
    console.log(`✅ Inserted dependencies.`);

    console.log("\n⚙️ Running SchedulingEngine...");
    for (const [key, projectId] of Object.entries(projectMap)) {
        if (projectId) {
            await recalculate(projectId);
        }
    }

    console.log("\n🕰️ Simulating past schedules and work logs...");
    const pastTasks = [
        "lu_db", "lu_api", "ma_ui", "ma_dev", "it_cli", "it_test"
    ];
    for (const tk of pastTasks) {
        const tid = taskMap[tk];
        const tdata = tasksData.find(d => d.key === tk);
        if (!tid || !tdata) continue;
        
        const effortPerUser = tdata.actual_effort / tdata.assignees.length;
        const daysToSpread = Math.max(1, Math.floor(effortPerUser / 8));
        
        let startD = new Date(tdata.actual_start as string);
        for (const email of tdata.assignees) {
            const uid = userMap[email];
            if (!uid) continue;
            let currentD = new Date(startD);
            let remaining = effortPerUser;
            while(remaining > 0) {
                const hours = Math.min(8, remaining);
                const dateStr = currentD.toISOString().split("T")[0];
                
                // Insert Schedule
                await pool.query(
                    `INSERT INTO task_schedules (task_id, user_id, schedule_date, allocated_hours, schedule_version) VALUES (?, ?, ?, ?, ?)`,
                    [tid, uid, dateStr, hours, 1]
                );
                
                // Insert Work Log
                await pool.query(
                    `INSERT INTO work_logs (task_id, user_id, log_date, hours_logged, notes, status, progress_logged) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [tid, uid, dateStr, hours, "Completed assigned work", "COMPLETED", Math.min(100, (hours / tdata.actual_effort) * 100)]
                );
                
                remaining -= hours;
                currentD.setDate(currentD.getDate() + 1);
                // Skip weekends
                if (currentD.getDay() === 0 || currentD.getDay() === 6) {
                    currentD.setDate(currentD.getDate() + (currentD.getDay() === 6 ? 2 : 1));
                }
            }
        }
    }

    try {
        await generateSqlDump(pool);
    } catch (err) {}

    console.log("✅ SEEDING COMPLETE.");
    process.exit(0);
}

async function generateSqlDump(pool: any) {
    const tables = ["users", "projects", "project_members", "tasks", "task_assignments", "task_dependencies", "task_schedules"];
    let sql = `SET FOREIGN_KEY_CHECKS = 0;\n`;
    for (const table of tables) {
        const [rows]: any = await pool.query(`SELECT * FROM \`${table}\``);
        sql += `DELETE FROM \`${table}\`;\n`;
        if (rows.length > 0) {
            const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(", ");
            sql += `INSERT INTO \`${table}\` (${cols}) VALUES\n`;
            const valStrings: string[] = [];
            for (const row of rows) {
                const vals = Object.values(row).map(v => {
                    if (v === null || v === undefined) return "NULL";
                    if (typeof v === "boolean") return v ? 1 : 0;
                    if (typeof v === "number") return String(v);
                    if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
                    return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
                });
                valStrings.push(`(${vals.join(", ")})`);
            }
            sql += valStrings.join(",\n") + ";\n";
        }
    }
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    fs.writeFileSync(path.join(__dirname, "seed_demo.sql"), sql, "utf-8");
}

seed().catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
});
