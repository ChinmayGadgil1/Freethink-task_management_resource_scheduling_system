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
        { name: "Alice Manager", username: "alice", email: "alice@freethink.com", role: "PROJECT_MANAGER", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Bob Manager", username: "bob", email: "bob@freethink.com", role: "PROJECT_MANAGER", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        // Resources
        { name: "Charlie Developer", username: "charlie", email: "charlie@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "David Designer", username: "david", email: "david@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Eve Engineer", username: "eve", email: "eve@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Frank Tester", username: "frank", email: "frank@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Grace Analyst", username: "grace", email: "grace@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Heidi DevOps", username: "heidi", email: "heidi@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Ivan Architect", username: "ivan", email: "ivan@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true },
        { name: "Judy Data", username: "judy", email: "judy@freethink.com", role: "RESOURCE", is_active: true, non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]), daily_working_hours: 8.00, schedule_configured: true }
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
            pm: "alice@freethink.com",
            name: "FREELANCE WEBSITE",
            description: "A platform for freelancers to showcase work and find clients.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            start_date: getOffsetDate(1), // 24 Sept
            deadline: getOffsetDate(30),
            progress: 0.0
        },
        {
            key: "ecommerce_website",
            pm: "alice@freethink.com",
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
            pm: "bob@freethink.com",
            name: "GENERAL BOOKING APPLICATION",
            description: "Application for booking appointments and reservations.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            start_date: getOffsetDate(1), // 24 Sept
            deadline: getOffsetDate(30),
            progress: 0.0
        },
        {
            key: "task_management",
            pm: "bob@freethink.com",
            name: "TASK MANAGEMENT SYSTEM",
            description: "Enterprise task management and tracking software.",
            status: "IN_PROGRESS",
            priority: "CRITICAL",
            start_date: getOffsetDate(10),
            deadline: getOffsetDate(60),
            progress: 0.0
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
        freelance_website: ["charlie@freethink.com", "david@freethink.com", "eve@freethink.com", "heidi@freethink.com", "ivan@freethink.com", "alice@freethink.com"],
        ecommerce_website: ["charlie@freethink.com", "david@freethink.com", "frank@freethink.com", "grace@freethink.com", "judy@freethink.com", "alice@freethink.com"],
        general_booking: ["charlie@freethink.com", "david@freethink.com", "eve@freethink.com", "frank@freethink.com", "grace@freethink.com", "judy@freethink.com", "bob@freethink.com"],
        task_management: ["eve@freethink.com", "heidi@freethink.com", "ivan@freethink.com", "judy@freethink.com", "bob@freethink.com"]
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
            key: "fw_db", projectKey: "freelance_website", createdBy: "alice@freethink.com",
            title: "DB SCHEMA DESIGN", description: "Design database schema for freelance website.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(10), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["ivan@freethink.com"] // Single resource
        },
        {
            key: "fw_auth", projectKey: "freelance_website", createdBy: "alice@freethink.com",
            title: "AUTH", description: "Implement authentication and authorization.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(15), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["charlie@freethink.com", "eve@freethink.com"] // Multi resource
        },
        {
            key: "fw_ui", projectKey: "freelance_website", createdBy: "alice@freethink.com",
            title: "UI DESIGN", description: "Design UI for the freelance website.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(12), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["david@freethink.com"] 
        },
        {
            key: "fw_dash", projectKey: "freelance_website", createdBy: "alice@freethink.com",
            title: "DASHBOARD", description: "Develop user dashboard.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(20), actual_start: null, actual_end: null,
            expected_effort: 32, actual_effort: 0, progress: 0, assignees: ["charlie@freethink.com", "david@freethink.com"] 
        },
        {
            key: "fw_backend", projectKey: "freelance_website", createdBy: "alice@freethink.com",
            title: "BACKEND", description: "Develop backend API services.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(22), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["eve@freethink.com", "ivan@freethink.com"] 
        },
        {
            key: "fw_deploy", projectKey: "freelance_website", createdBy: "alice@freethink.com",
            title: "DEPLOYMENT", description: "Deploy to production environment.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(28), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["heidi@freethink.com", "alice@freethink.com"] // Supervisor
        },

        // ===================================
        // 2. E-COMMERCE WEBSITE - PM: Alice
        // ===================================
        {
            key: "ec_db", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "DB SCHEMA DESIGN", description: "Design e-commerce schema.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(10), actual_start: null, actual_end: null,
            expected_effort: 20, actual_effort: 0, progress: 0, assignees: ["judy@freethink.com"]
        },
        {
            key: "ec_auth", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "AUTH", description: "Implement auth system.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(15), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["charlie@freethink.com"]
        },
        {
            key: "ec_ui", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "UI DESIGN", description: "E-commerce interface design.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(15), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["david@freethink.com"]
        },
        {
            key: "ec_product", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "PRODUCT MANAGEMENT", description: "Product inventory management module.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(20), actual_start: null, actual_end: null,
            expected_effort: 30, actual_effort: 0, progress: 0, assignees: ["grace@freethink.com"]
        },
        {
            key: "ec_cart", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "CART & CHECKOUT", description: "Shopping cart and checkout flow.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(25), actual_start: null, actual_end: null,
            expected_effort: 32, actual_effort: 0, progress: 0, assignees: ["charlie@freethink.com", "david@freethink.com"]
        },
        {
            key: "ec_payment", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "PAYMENT INTEGRATION", description: "Stripe and PayPal integration.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(28), actual_start: null, actual_end: null,
            expected_effort: 20, actual_effort: 0, progress: 0, assignees: ["frank@freethink.com", "alice@freethink.com"] // Supervisor
        },
        {
            key: "ec_order", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "ORDER MANAGEMENT", description: "Order tracking and history.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(32), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["grace@freethink.com"]
        },
        {
            key: "ec_api", projectKey: "ecommerce_website", createdBy: "alice@freethink.com",
            title: "API DEVELOPMENT", description: "E-commerce REST APIs.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(35), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["frank@freethink.com", "judy@freethink.com"]
        },

        // ===================================
        // 3. GENERAL BOOKING APPLICATION (Sept 24) - PM: Bob
        // ===================================
        {
            key: "gb_db", projectKey: "general_booking", createdBy: "bob@freethink.com",
            title: "DB DESIGN", description: "Design database for booking application.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(10), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["judy@freethink.com"] // Single resource
        },
        {
            key: "gb_auth", projectKey: "general_booking", createdBy: "bob@freethink.com",
            title: "AUTH", description: "Implement auth for booking app.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(14), actual_start: null, actual_end: null,
            expected_effort: 20, actual_effort: 0, progress: 0, assignees: ["charlie@freethink.com", "eve@freethink.com"] // Multi resource
        },
        {
            key: "gb_ui", projectKey: "general_booking", createdBy: "bob@freethink.com",
            title: "UI DESIGN", description: "Design UI for booking app.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(12), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["david@freethink.com"]
        },
        {
            key: "gb_user_dash", projectKey: "general_booking", createdBy: "bob@freethink.com",
            title: "USER DASHBOARD", description: "Develop dashboard for users.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(22), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["charlie@freethink.com", "david@freethink.com"]
        },
        {
            key: "gb_admin_dash", projectKey: "general_booking", createdBy: "bob@freethink.com",
            title: "ADMIN DASHBOARD", description: "Develop dashboard for admins.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(24), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["grace@freethink.com", "frank@freethink.com"]
        },
        {
            key: "gb_service", projectKey: "general_booking", createdBy: "bob@freethink.com",
            title: "BOOKING SERVICE", description: "Develop core booking logic.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(26), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["bob@freethink.com", "eve@freethink.com"] // Supervisor task
        },

        // ===================================
        // 4. TASK MANAGEMENT SYSTEM - PM: Bob
        // ===================================
        {
            key: "tm_db", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "DB DESIGN", description: "Task management database schema.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(20), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["judy@freethink.com"]
        },
        {
            key: "tm_auth", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "AUTH", description: "Authentication layer.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(22), actual_start: null, actual_end: null,
            expected_effort: 16, actual_effort: 0, progress: 0, assignees: ["eve@freethink.com"]
        },
        {
            key: "tm_ui", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "UI DESIGN", description: "UI for task board.",
            priority: "MEDIUM", status: "SCHEDULED", deadline: getOffsetDate(25), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["heidi@freethink.com"]
        },
        {
            key: "tm_user_dash", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "USER DASHBOARD", description: "Task list and personal dashboard.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(30), actual_start: null, actual_end: null,
            expected_effort: 30, actual_effort: 0, progress: 0, assignees: ["heidi@freethink.com"]
        },
        {
            key: "tm_pm", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "PROJECT MANAGEMENT", description: "Project creation and tracking.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(35), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["ivan@freethink.com", "bob@freethink.com"] // Supervisor
        },
        {
            key: "tm_task", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "TASK MANAGEMENT", description: "Task creation, assignment, dependencies.",
            priority: "CRITICAL", status: "SCHEDULED", deadline: getOffsetDate(40), actual_start: null, actual_end: null,
            expected_effort: 50, actual_effort: 0, progress: 0, assignees: ["eve@freethink.com", "ivan@freethink.com"]
        },
        {
            key: "tm_worklog", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "WORK LOG SYSTEM", description: "Time tracking and work logs.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(45), actual_start: null, actual_end: null,
            expected_effort: 24, actual_effort: 0, progress: 0, assignees: ["judy@freethink.com"]
        },
        {
            key: "tm_api", projectKey: "task_management", createdBy: "bob@freethink.com",
            title: "API DEVELOPMENT", description: "Task management endpoints.",
            priority: "HIGH", status: "SCHEDULED", deadline: getOffsetDate(50), actual_start: null, actual_end: null,
            expected_effort: 40, actual_effort: 0, progress: 0, assignees: ["eve@freethink.com", "judy@freethink.com"]
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
