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
    console.log("🌱 Starting canonical Freethink database seeding with 35+ resources & planned vs actual effort datasets...");

    // 1. Drop existing tables and recreate cleanly
    const pool = await initializeDatabase({ dropExisting: true });

    console.log("\n🔑 Creating canonical team users with encrypted passwords...");
    const defaultPassword = "Password123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1 Project Manager + 35 Team Resources (5 Original Core + 30 Extended Engineering Resources)
    const usersData = [
        // Project Manager
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
        // Core Team Members (1-5)
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
        },
        // 30 Additional Resources (6-35)
        {
            name: "Aarav Sharma",
            username: "aarav",
            email: "aarav.sharma@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Ananya Iyer",
            username: "ananya",
            email: "ananya.iyer@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Rohan Mehta",
            username: "rohan",
            email: "rohan.mehta@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Priya Nair",
            username: "priya",
            email: "priya.nair@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Vikram Malhotra",
            username: "vikram",
            email: "vikram.malhotra@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Neha Kulkarni",
            username: "neha",
            email: "neha.kulkarni@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Aditya Deshmukh",
            username: "aditya",
            email: "aditya.deshmukh@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Pooja Verma",
            username: "pooja",
            email: "pooja.verma@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Rahul Sengupta",
            username: "rahul",
            email: "rahul.sengupta@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Sneha Joshi",
            username: "sneha",
            email: "sneha.joshi@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Siddharth Rao",
            username: "siddharth",
            email: "siddharth.rao@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Divya Pillai",
            username: "divya",
            email: "divya.pillai@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Karan Kapoor",
            username: "karan",
            email: "karan.kapoor@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Meera Nambiar",
            username: "meera",
            email: "meera.nambiar@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Varun Hegde",
            username: "varun",
            email: "varun.hegde@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Ritu Saxena",
            username: "ritu",
            email: "ritu.saxena@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Nikhil Bhatt",
            username: "nikhil",
            email: "nikhil.bhatt@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Kavita Menon",
            username: "kavita",
            email: "kavita.menon@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Arjun Reddy",
            username: "arjun",
            email: "arjun.reddy@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Deepa Nayak",
            username: "deepa",
            email: "deepa.nayak@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Gaurav Chawla",
            username: "gaurav",
            email: "gaurav.chawla@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Ishita Roy",
            username: "ishita",
            email: "ishita.roy@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Kunal Patil",
            username: "kunal",
            email: "kunal.patil@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Lavanya Raman",
            username: "lavanya",
            email: "lavanya.raman@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Mayank Agarwal",
            username: "mayank",
            email: "mayank.agarwal@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Nandini Sen",
            username: "nandini",
            email: "nandini.sen@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Omkar Sawant",
            username: "omkar",
            email: "omkar.sawant@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Payal Trivedi",
            username: "payal",
            email: "payal.trivedi@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Rishabh Jain",
            username: "rishabh",
            email: "rishabh.jain@freethink.com",
            role: "RESOURCE",
            is_active: true,
            non_working_days: JSON.stringify(["SATURDAY", "SUNDAY"]),
            daily_working_hours: 8.00,
            schedule_configured: true
        },
        {
            name: "Shreya Ghoshal",
            username: "shreya",
            email: "shreya.ghoshal@freethink.com",
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
    console.log(`✅ Inserted ${usersData.length} users (1 PM and 35 Resources).`);

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
        },
        {
            email: "aarav.sharma@freethink.com",
            leave_date: getOffsetDate(5),
            leave_hours: 8.00,
            status: "APPROVED",
            approver_email: "shlok@freethink.com",
            approved_at: getOffsetDateTime(-3, 11, 0)
        },
        {
            email: "vikram.malhotra@freethink.com",
            leave_date: getOffsetDate(2),
            leave_hours: 8.00,
            status: "APPROVED",
            approver_email: "shlok@freethink.com",
            approved_at: getOffsetDateTime(-1, 15, 30)
        },
        {
            email: "ananya.iyer@freethink.com",
            leave_date: getOffsetDate(6),
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
            name: "Enterprise Booking & Reservation Engine",
            description: "A comprehensive booking and reservation management system featuring schedule coordination, customer booking workflows, and real-time availability management.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            start_date: getOffsetDate(-15),
            deadline: getOffsetDate(30),
            progress: 42.0
        },
        {
            key: "freethink_cloud",
            pm: "shlok@freethink.com",
            name: "Cloud Infrastructure & Microservices Migration",
            description: "Enterprise containerization, Kubernetes cluster orchestration, Kafka event streaming pipelines, and distributed tracing setup.",
            status: "IN_PROGRESS",
            priority: "CRITICAL",
            start_date: getOffsetDate(-20),
            deadline: getOffsetDate(25),
            progress: 54.0
        },
        {
            key: "freethink_analytics",
            pm: "shlok@freethink.com",
            name: "Real-Time Telemetry & AI Analytics Platform",
            description: "Time-series telemetry ingestion, automated anomaly detection, executive dashboard KPIs, and capacity forecasting ML models.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            start_date: getOffsetDate(-10),
            deadline: getOffsetDate(35),
            progress: 35.0
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

    // 5. Assign Project Members (Ensure every single resource is a member of relevant projects)
    console.log("\n👥 Assigning project members for all 35 resources...");
    const projectResourceAssignments: Record<string, string[]> = {
        freethink_main: [
            "chinmay@freethink.com", "sana@freethink.com", "shikhaa@freethink.com", "tanvi@freethink.com", "hridham@freethink.com",
            "aarav.sharma@freethink.com", "ananya.iyer@freethink.com", "rohan.mehta@freethink.com", "priya.nair@freethink.com",
            "vikram.malhotra@freethink.com", "neha.kulkarni@freethink.com", "aditya.deshmukh@freethink.com", "pooja.verma@freethink.com",
            "rahul.sengupta@freethink.com", "sneha.joshi@freethink.com", "siddharth.rao@freethink.com", "divya.pillai@freethink.com"
        ],
        freethink_login: [
            "chinmay@freethink.com", "sana@freethink.com", "shikhaa@freethink.com", "tanvi@freethink.com", "hridham@freethink.com",
            "karan.kapoor@freethink.com", "meera.nambiar@freethink.com"
        ],
        freethink_booking: [
            "karan.kapoor@freethink.com", "meera.nambiar@freethink.com", "varun.hegde@freethink.com", "ritu.saxena@freethink.com",
            "nikhil.bhatt@freethink.com", "kavita.menon@freethink.com", "arjun.reddy@freethink.com", "deepa.nayak@freethink.com",
            "gaurav.chawla@freethink.com", "ishita.roy@freethink.com", "ananya.iyer@freethink.com", "rohan.mehta@freethink.com"
        ],
        freethink_cloud: [
            "vikram.malhotra@freethink.com", "kunal.patil@freethink.com", "lavanya.raman@freethink.com", "mayank.agarwal@freethink.com",
            "nandini.sen@freethink.com", "omkar.sawant@freethink.com", "payal.trivedi@freethink.com", "rishabh.jain@freethink.com",
            "shreya.ghoshal@freethink.com", "aditya.deshmukh@freethink.com", "sneha.joshi@freethink.com", "arjun.reddy@freethink.com"
        ],
        freethink_analytics: [
            "pooja.verma@freethink.com", "nikhil.bhatt@freethink.com", "lavanya.raman@freethink.com", "mayank.agarwal@freethink.com",
            "siddharth.rao@freethink.com", "omkar.sawant@freethink.com", "payal.trivedi@freethink.com", "shreya.ghoshal@freethink.com",
            "chinmay@freethink.com", "sana@freethink.com", "tanvi@freethink.com"
        ]
    };

    for (const [projectKey, emails] of Object.entries(projectResourceAssignments)) {
        const projectId = projectMap[projectKey];
        if (!projectId) continue;
        for (const email of emails) {
            const userId = userMap[email];
            if (userId) {
                await pool.query(
                    `INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`,
                    [projectId, userId]
                );
            }
        }
    }
    console.log("✅ Project memberships created across all projects.");

    // 6. Create Distinct Tasks with Planned vs Actual Effort Scenarios for all 35 Resources
    console.log("\n📋 Creating distinct tasks with varied planned vs actual effort...");

    interface TaskSeedDef {
        key: string;
        projectKey: string;
        createdBy: string;
        title: string;
        description: string;
        priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        status: "UNASSIGNED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
        deadline: string | null;
        actual_start: string | null;
        actual_end: string | null;
        expected_effort: number;
        actual_effort: number;
        progress: number;
        assignees: string[];
    }

    const tasksData: TaskSeedDef[] = [
        // ==========================================
        // PROJECT 1: SMART TASK MANAGEMENT & SCHEDULING
        // ==========================================
        // 1. Chinmay Gadgil
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
            actual_effort: 32, // Exact effort
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
            actual_effort: 18, // In progress
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

        // 2. Sana Shaikh
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
            actual_effort: 40, // Effort Overrun (+8h / +25%)
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
            actual_effort: 16, // Effort Savings / High Efficiency (-4h)
            progress: 100,
            assignees: ["sana@freethink.com"]
        },

        // 3. Shikhaa Prabhudesai
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
            actual_effort: 12, // High Efficiency (-4h)
            progress: 100,
            assignees: ["shikhaa@freethink.com"]
        },

        // 4. Tanvi Khandeparkar
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
            actual_effort: 30, // Overrun (+6h)
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

        // 5. Hridham Chimulkar
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
            actual_effort: 20, // Overrun (+4h)
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

        // 6. Aarav Sharma (Backend & Microservices)
        {
            key: "t_aarav_cache",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Redis Distributed Cache & Session Store Layer",
            description: "Integrate Redis clustering for fast task query caching, session persistence, and cache eviction hooks.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-6),
            actual_start: getOffsetDateTime(-16, 9, 0),
            actual_end: getOffsetDateTime(-6, 17, 0),
            expected_effort: 28,
            actual_effort: 36, // Overrun (+8h / +28.5%)
            progress: 100,
            assignees: ["aarav.sharma@freethink.com"]
        },
        {
            key: "t_aarav_ratelimit",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "API Rate Limiting & DoS Protection Middleware",
            description: "Token bucket rate limiting middleware per IP and per authenticated user with sliding window counters.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDateTime(-3, 10, 0),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 8,
            progress: 50,
            assignees: ["aarav.sharma@freethink.com"]
        },

        // 7. Ananya Iyer (Frontend Architecture)
        {
            key: "t_ananya_theme",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Dark Mode Theming & Custom Design Tokens",
            description: "CSS variables, Quasar dark mode toggle, harmonious color palettes, and accessibility contrast verification.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-10),
            actual_start: getOffsetDateTime(-20, 9, 0),
            actual_end: getOffsetDateTime(-10, 18, 0),
            expected_effort: 24,
            actual_effort: 18, // High Efficiency (-6h / -25%)
            progress: 100,
            assignees: ["ananya.iyer@freethink.com"]
        },
        {
            key: "t_ananya_notifications",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Real-time Notification Bell & Drawer Component",
            description: "Interactive notification dropdown, mark-all-as-read, notification sound triggers, and route links.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(5),
            actual_start: getOffsetDateTime(-2, 11, 0),
            actual_end: null,
            expected_effort: 18,
            actual_effort: 12,
            progress: 65,
            assignees: ["ananya.iyer@freethink.com"]
        },

        // 8. Rohan Mehta (Full Stack)
        {
            key: "t_rohan_export",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Gantt PDF / Excel Report Export Engine",
            description: "Server-side and client-side exporter for project schedules, task breakdown sheets, and effort variances.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-3),
            actual_start: getOffsetDateTime(-12, 9, 0),
            actual_end: getOffsetDateTime(-3, 17, 0),
            expected_effort: 22,
            actual_effort: 22, // Exact effort
            progress: 100,
            assignees: ["rohan.mehta@freethink.com"]
        },
        {
            key: "t_rohan_audit",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Task History & Audit Log Timeline View",
            description: "Visual timeline detailing every edit made to a task, field diffs, timestamped users, and rollback capability.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(12),
            actual_start: getOffsetDateTime(-1, 9, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 6,
            progress: 30,
            assignees: ["rohan.mehta@freethink.com"]
        },

        // 9. Priya Nair (QA Automation)
        {
            key: "t_priya_e2e",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "End-to-End Cypress / Playwright Test Automation Suite",
            description: "Automated regression testing for PM workflows, task assignment, live sessions, and Gantt rendering.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-5),
            actual_start: getOffsetDateTime(-18, 9, 0),
            actual_end: getOffsetDateTime(-5, 18, 0),
            expected_effort: 30,
            actual_effort: 42, // Overrun (+12h / +40%)
            progress: 100,
            assignees: ["priya.nair@freethink.com"]
        },
        {
            key: "t_priya_loadtest",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "K6 Load Testing for Concurrent Task Updates",
            description: "Simulate 500 concurrent project managers recalculating schedules and updating daily work logs.",
            priority: "HIGH",
            status: "SCHEDULED",
            deadline: getOffsetDate(16),
            actual_start: null,
            actual_end: null,
            expected_effort: 16,
            actual_effort: 0,
            progress: 0,
            assignees: ["priya.nair@freethink.com"]
        },

        // 10. Vikram Malhotra (DevOps Architect)
        {
            key: "t_vikram_cicd",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "GitHub Actions Multi-Stage CI/CD Deployment Pipeline",
            description: "Automated linting, TypeScript checking, unit tests, Docker build, and deployment to staging clusters.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-15),
            actual_start: getOffsetDateTime(-24, 9, 0),
            actual_end: getOffsetDateTime(-15, 16, 0),
            expected_effort: 24,
            actual_effort: 18, // High Efficiency (-6h)
            progress: 100,
            assignees: ["vikram.malhotra@freethink.com"]
        },
        {
            key: "t_vikram_monitoring",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Prometheus & Grafana Health Dashboard Setup",
            description: "Application metric exporters, MySQL connection pool monitoring, memory utilization, and latency alerts.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(6),
            actual_start: getOffsetDateTime(-4, 10, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 16,
            progress: 80,
            assignees: ["vikram.malhotra@freethink.com"]
        },

        // 11. Neha Kulkarni (UI/UX Designer)
        {
            key: "t_neha_figma",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Design System & Figma Component Library",
            description: "High-fidelity mockups, responsive grid layouts, interactive prototypes, and iconography guide.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-18),
            actual_start: getOffsetDateTime(-25, 9, 0),
            actual_end: getOffsetDateTime(-18, 17, 0),
            expected_effort: 24,
            actual_effort: 24, // Exact effort
            progress: 100,
            assignees: ["neha.kulkarni@freethink.com"]
        },
        {
            key: "t_neha_usability",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Usability Testing & Micro-Interactions Polish",
            description: "Refine hover states, dialog transitions, loading skeletons, and empty state graphics.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDateTime(-2, 14, 0),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 8,
            progress: 50,
            assignees: ["neha.kulkarni@freethink.com"]
        },

        // 12. Aditya Deshmukh (Systems Engineer)
        {
            key: "t_aditya_db_opt",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Database Query Index Optimization & Partitioning",
            description: "Index tuning on task_schedules, tasks, and work_logs tables for sub-50ms analytics aggregation.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-11),
            actual_start: getOffsetDateTime(-20, 9, 0),
            actual_end: getOffsetDateTime(-11, 17, 0),
            expected_effort: 20,
            actual_effort: 28, // Overrun (+8h / +40%)
            progress: 100,
            assignees: ["aditya.deshmukh@freethink.com"]
        },
        {
            key: "t_aditya_backups",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Automated Nightly Database Snapshots & Backup Rotation",
            description: "Cron-driven mysqldump with gzip encryption, S3 upload, and automated point-in-time recovery test.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(9),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 14,
            actual_effort: 6,
            progress: 45,
            assignees: ["aditya.deshmukh@freethink.com"]
        },

        // 13. Pooja Verma (Data Engineer)
        {
            key: "t_pooja_etl",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Historical Effort Analytics ETL Aggregation Job",
            description: "Daily scheduled ETL calculating team velocity, standard deviation of effort estimates, and burn-down data.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-7),
            actual_start: getOffsetDateTime(-16, 9, 0),
            actual_end: getOffsetDateTime(-7, 18, 0),
            expected_effort: 26,
            actual_effort: 20, // High Efficiency (-6h)
            progress: 100,
            assignees: ["pooja.verma@freethink.com"]
        },
        {
            key: "t_pooja_kpi",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Team Velocity & Estimation Accuracy Heatmaps",
            description: "Visual heatmaps comparing planned vs actual effort variance per department and individual contributor.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(11),
            actual_start: getOffsetDateTime(-3, 9, 0),
            actual_end: null,
            expected_effort: 22,
            actual_effort: 14,
            progress: 65,
            assignees: ["pooja.verma@freethink.com"]
        },

        // 14. Rahul Sengupta (Security Analyst)
        {
            key: "t_rahul_audit",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "OWASP Top 10 Security Audit & SQL Injection Sanitization",
            description: "Static and dynamic penetration testing, parameterized query validation, and CORS policy hardening.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-13),
            actual_start: getOffsetDateTime(-22, 9, 0),
            actual_end: getOffsetDateTime(-13, 16, 30),
            expected_effort: 24,
            actual_effort: 24, // Exact effort
            progress: 100,
            assignees: ["rahul.sengupta@freethink.com"]
        },
        {
            key: "t_rahul_2fa",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Two-Factor Authentication (TOTP / Authenticator App)",
            description: "QR code generation, TOTP secret verification, recovery codes generation, and 2FA enforcement for PMs.",
            priority: "HIGH",
            status: "SCHEDULED",
            deadline: getOffsetDate(14),
            actual_start: null,
            actual_end: null,
            expected_effort: 20,
            actual_effort: 0,
            progress: 0,
            assignees: ["rahul.sengupta@freethink.com"]
        },

        // 15. Sneha Joshi (Cloud Infrastructure)
        {
            key: "t_sneha_vpc",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "AWS VPC Architecture & Security Group Rules",
            description: "Terraform configuration for public/private subnets, NAT gateways, ALB, and bastion host jumpbox.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-9),
            actual_start: getOffsetDateTime(-19, 9, 0),
            actual_end: getOffsetDateTime(-9, 17, 0),
            expected_effort: 22,
            actual_effort: 30, // Overrun (+8h / +36%)
            progress: 100,
            assignees: ["sneha.joshi@freethink.com"]
        },
        {
            key: "t_sneha_waf",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "AWS WAF & CloudFront CDN Edge Caching",
            description: "Global asset delivery acceleration via CloudFront and bot mitigation rules via AWS WAF.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(7),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 10,
            progress: 60,
            assignees: ["sneha.joshi@freethink.com"]
        },

        // 16. Siddharth Rao (Performance Tuning)
        {
            key: "t_siddharth_profile",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Node.js Event Loop Profiling & Memory Leak Audit",
            description: "Clinic.js and Chrome DevTools heap profiling to eliminate memory leaks during bulk schedule updates.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-8),
            actual_start: getOffsetDateTime(-17, 9, 0),
            actual_end: getOffsetDateTime(-8, 18, 0),
            expected_effort: 20,
            actual_effort: 15, // High Efficiency (-5h)
            progress: 100,
            assignees: ["siddharth.rao@freethink.com"]
        },
        {
            key: "t_siddharth_bundle",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Vite Bundle Size Optimization & Code Splitting",
            description: "Dynamic route chunking, Tree shaking ECharts and DHTMLX modules to reduce main chunk size below 200KB.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDateTime(-2, 11, 0),
            actual_end: null,
            expected_effort: 14,
            actual_effort: 8,
            progress: 60,
            assignees: ["siddharth.rao@freethink.com"]
        },

        // 17. Divya Pillai (Mobile & Responsive)
        {
            key: "t_divya_touch",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "Mobile Touch Gestures & Responsive Drawer Layout",
            description: "Swipe gestures for task cards, bottom sheet actions on mobile viewports, and mobile Gantt pinch-zoom.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-4),
            actual_start: getOffsetDateTime(-14, 9, 0),
            actual_end: getOffsetDateTime(-4, 17, 30),
            expected_effort: 20,
            actual_effort: 26, // Overrun (+6h / +30%)
            progress: 100,
            assignees: ["divya.pillai@freethink.com"]
        },
        {
            key: "t_divya_pwa",
            projectKey: "freethink_main",
            createdBy: "shlok@freethink.com",
            title: "PWA Service Worker & Offline Task Caching",
            description: "Installable PWA manifest, service worker background sync, and offline cached task viewing.",
            priority: "MEDIUM",
            status: "SCHEDULED",
            deadline: getOffsetDate(15),
            actual_start: null,
            actual_end: null,
            expected_effort: 18,
            actual_effort: 0,
            progress: 0,
            assignees: ["divya.pillai@freethink.com"]
        },

        // ==========================================
        // PROJECT 2: SIMPLE LOGIN SYSTEM (COMPLETED)
        // ==========================================
        // 18. Karan Kapoor & 19. Meera Nambiar
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
            assignees: ["chinmay@freethink.com", "hridham@freethink.com", "karan.kapoor@freethink.com"]
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
            actual_effort: 28, // Overrun (+4h)
            progress: 100,
            assignees: ["shikhaa@freethink.com", "sana@freethink.com", "meera.nambiar@freethink.com"]
        },

        // ==========================================
        // PROJECT 3: ENTERPRISE BOOKING & RESERVATION
        // ==========================================
        // 18. Karan Kapoor
        {
            key: "t_karan_booking_api",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Slot Availability & Conflict Detection Engine",
            description: "Time-interval intersection algorithm preventing double bookings and allocating resource slots dynamically.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-5),
            actual_start: getOffsetDateTime(-15, 9, 0),
            actual_end: getOffsetDateTime(-5, 17, 0),
            expected_effort: 26,
            actual_effort: 34, // Overrun (+8h / +30%)
            progress: 100,
            assignees: ["karan.kapoor@freethink.com"]
        },
        {
            key: "t_karan_webhooks",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Webhook Dispatcher & Third-party Calendar Sync",
            description: "Google Calendar and Outlook two-way event synchronization with exponential backoff retries.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDateTime(-3, 9, 0),
            actual_end: null,
            expected_effort: 22,
            actual_effort: 14,
            progress: 65,
            assignees: ["karan.kapoor@freethink.com"]
        },

        // 19. Meera Nambiar
        {
            key: "t_meera_docs",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Interactive OpenAPI / Swagger Documentation",
            description: "Complete Swagger UI specifications with request/response examples and mock server.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-8),
            actual_start: getOffsetDateTime(-14, 9, 0),
            actual_end: getOffsetDateTime(-8, 16, 0),
            expected_effort: 16,
            actual_effort: 12, // High Efficiency (-4h)
            progress: 100,
            assignees: ["meera.nambiar@freethink.com"]
        },
        {
            key: "t_meera_email_templates",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Transactional Email Templates & PDF Invoicing",
            description: "HTML responsive email templates for booking confirmations, reminders, and cancellation receipts.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 18,
            actual_effort: 9,
            progress: 50,
            assignees: ["meera.nambiar@freethink.com"]
        },

        // 20. Varun Hegde (DBA)
        {
            key: "t_varun_locking",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Pessimistic Row-Level Locking for High-Concurrency Slots",
            description: "Implement SELECT ... FOR UPDATE transactions to guarantee zero overbooking during flash sales.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-6),
            actual_start: getOffsetDateTime(-15, 9, 0),
            actual_end: getOffsetDateTime(-6, 18, 0),
            expected_effort: 24,
            actual_effort: 24, // Exact effort
            progress: 100,
            assignees: ["varun.hegde@freethink.com"]
        },
        {
            key: "t_varun_partitioning",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Monthly Booking Table Partitioning & Archiving",
            description: "Range partitioning by booking_date and cold storage archiving for reservations older than 12 months.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(12),
            actual_start: getOffsetDateTime(-1, 9, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 6,
            progress: 30,
            assignees: ["varun.hegde@freethink.com"]
        },

        // 21. Ritu Saxena (Frontend)
        {
            key: "t_ritu_wizard",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Multi-Step Customer Booking Wizard UI",
            description: "Interactive stepper component with real-time seat selector, add-on services, and payment gateway integration.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-7),
            actual_start: getOffsetDateTime(-16, 9, 0),
            actual_end: getOffsetDateTime(-7, 17, 30),
            expected_effort: 28,
            actual_effort: 36, // Overrun (+8h)
            progress: 100,
            assignees: ["ritu.saxena@freethink.com"]
        },
        {
            key: "t_ritu_responsive",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Booking Admin Grid & Daily Agenda View",
            description: "Staff agenda scheduler with drag-and-drop appointment rescheduling and color-coded status badges.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(9),
            actual_start: getOffsetDateTime(-3, 11, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 12,
            progress: 60,
            assignees: ["ritu.saxena@freethink.com"]
        },

        // 22. Nikhil Bhatt (ML & Analytics)
        {
            key: "t_nikhil_recommend",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Optimal Slot Recommendation & No-Show Prediction",
            description: "Scikit-Learn classification model predicting customer no-show probabilities to optimize overbooking safety margins.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-4),
            actual_start: getOffsetDateTime(-14, 9, 0),
            actual_end: getOffsetDateTime(-4, 18, 0),
            expected_effort: 30,
            actual_effort: 22, // High Efficiency (-8h / -26%)
            progress: 100,
            assignees: ["nikhil.bhatt@freethink.com"]
        },
        {
            key: "t_nikhil_pricing",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Dynamic Surge Pricing Algorithm for Peak Slots",
            description: "Demand-driven pricing adjustments based on historical occupancy rates and holiday calendar surges.",
            priority: "HIGH",
            status: "SCHEDULED",
            deadline: getOffsetDate(18),
            actual_start: null,
            actual_end: null,
            expected_effort: 24,
            actual_effort: 0,
            progress: 0,
            assignees: ["nikhil.bhatt@freethink.com"]
        },

        // 23. Kavita Menon (Product Designer)
        {
            key: "t_kavita_booking_ux",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Customer Journey Mapping & Frictionless Checkout UX",
            description: "UX audit reducing checkout steps from 6 to 3, with integrated address autocomplete and Apple Pay buttons.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-10),
            actual_start: getOffsetDateTime(-18, 9, 0),
            actual_end: getOffsetDateTime(-10, 16, 0),
            expected_effort: 18,
            actual_effort: 18, // Exact effort
            progress: 100,
            assignees: ["kavita.menon@freethink.com"]
        },
        {
            key: "t_kavita_mobile_ux",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Mobile App Wireframes & Interactive Flow",
            description: "Mobile-first responsive wireframes for Android & iOS client booking applications.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(7),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 10,
            progress: 60,
            assignees: ["kavita.menon@freethink.com"]
        },

        // 24. Arjun Reddy (SRE)
        {
            key: "t_arjun_gateway",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "API Gateway Routing & Distributed Rate Throttling",
            description: "Envoy proxy setup with circuit breakers and automated traffic shedding during peak traffic bursts.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-8),
            actual_start: getOffsetDateTime(-17, 9, 0),
            actual_end: getOffsetDateTime(-8, 17, 0),
            expected_effort: 22,
            actual_effort: 30, // Overrun (+8h / +36%)
            progress: 100,
            assignees: ["arjun.reddy@freethink.com"]
        },
        {
            key: "t_arjun_slo",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "SLI/SLO Alerting & Error Budget Dashboard",
            description: "Datadog synthetic monitors tracking 99.95% API uptime and P99 latency under 200ms.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(11),
            actual_start: getOffsetDateTime(-1, 9, 0),
            actual_end: null,
            expected_effort: 18,
            actual_effort: 6,
            progress: 35,
            assignees: ["arjun.reddy@freethink.com"]
        },

        // 25. Deepa Nayak (Quality & Compliance)
        {
            key: "t_deepa_gdpr",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "GDPR / CCPA Data Privacy & Export Pipeline",
            description: "One-click customer data anonymization, Right-to-be-Forgotten purge jobs, and consent audit logs.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-6),
            actual_start: getOffsetDateTime(-15, 9, 0),
            actual_end: getOffsetDateTime(-6, 17, 0),
            expected_effort: 20,
            actual_effort: 16, // High Efficiency (-4h)
            progress: 100,
            assignees: ["deepa.nayak@freethink.com"]
        },
        {
            key: "t_deepa_security_tests",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Payment Card Security (PCI-DSS) Compliance Verification",
            description: "End-to-end tokenization audit ensuring raw credit card details never touch internal application servers.",
            priority: "CRITICAL",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(6),
            actual_start: getOffsetDateTime(-3, 10, 0),
            actual_end: null,
            expected_effort: 22,
            actual_effort: 18,
            progress: 80,
            assignees: ["deepa.nayak@freethink.com"]
        },

        // 26. Gaurav Chawla (Distributed Systems)
        {
            key: "t_gaurav_locks",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Distributed Redlock Leader Election for Scheduled Crons",
            description: "Redlock algorithm ensuring cron tasks execute exactly once across multi-region server clusters.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-9),
            actual_start: getOffsetDateTime(-18, 9, 0),
            actual_end: getOffsetDateTime(-9, 18, 0),
            expected_effort: 24,
            actual_effort: 24, // Exact effort
            progress: 100,
            assignees: ["gaurav.chawla@freethink.com"]
        },
        {
            key: "t_gaurav_cdc",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Debezium Change Data Capture (CDC) to Kafka",
            description: "Stream MySQL binlogs directly into Kafka topics for instant real-time downstream cache invalidation.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(13),
            actual_start: getOffsetDateTime(-1, 9, 0),
            actual_end: null,
            expected_effort: 22,
            actual_effort: 8,
            progress: 35,
            assignees: ["gaurav.chawla@freethink.com"]
        },

        // 27. Ishita Roy (Accessibility & Design System)
        {
            key: "t_ishita_a11y",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "WCAG 2.1 AA Accessibility & Screen Reader Audit",
            description: "ARIA live regions for real-time calendar updates, keyboard focus traps in dialogs, and high-contrast styling.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-5),
            actual_start: getOffsetDateTime(-14, 9, 0),
            actual_end: getOffsetDateTime(-5, 16, 30),
            expected_effort: 18,
            actual_effort: 26, // Overrun (+8h / +44%)
            progress: 100,
            assignees: ["ishita.roy@freethink.com"]
        },
        {
            key: "t_ishita_components",
            projectKey: "freethink_booking",
            createdBy: "shlok@freethink.com",
            title: "Reusable Calendar Heatmap Component Package",
            description: "Vue 3 / Quasar reusable component displaying daily reservation density with customizable color scales.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(9),
            actual_start: getOffsetDateTime(-2, 11, 0),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 10,
            progress: 60,
            assignees: ["ishita.roy@freethink.com"]
        },

        // ==========================================
        // PROJECT 4: CLOUD INFRASTRUCTURE & MIGRATION
        // ==========================================
        // 28. Kunal Patil (Middleware & Streaming)
        {
            key: "t_kunal_kafka",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Apache Kafka Multi-Broker Cluster & Topic Partitioning",
            description: "Provision 3-node Kafka cluster with Avro schema registry, consumer groups, and dead-letter queues.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-10),
            actual_start: getOffsetDateTime(-20, 9, 0),
            actual_end: getOffsetDateTime(-10, 18, 0),
            expected_effort: 32,
            actual_effort: 26, // High Efficiency (-6h)
            progress: 100,
            assignees: ["kunal.patil@freethink.com"]
        },
        {
            key: "t_kunal_flink",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Apache Flink Stream Processing for Real-Time Metrics",
            description: "Tumbling window stream aggregations for instantaneous resource utilization calculation.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDateTime(-3, 9, 0),
            actual_end: null,
            expected_effort: 26,
            actual_effort: 15,
            progress: 55,
            assignees: ["kunal.patil@freethink.com"]
        },

        // 29. Lavanya Raman (Data Viz)
        {
            key: "t_lavanya_dashboards",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Infrastructure Cost & Resource Allocation Visualizations",
            description: "Interactive ECharts charts showing daily cloud spend, CPU/Memory quotas, and underutilized nodes.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-7),
            actual_start: getOffsetDateTime(-16, 9, 0),
            actual_end: getOffsetDateTime(-7, 17, 0),
            expected_effort: 22,
            actual_effort: 30, // Overrun (+8h / +36%)
            progress: 100,
            assignees: ["lavanya.raman@freethink.com"]
        },
        {
            key: "t_lavanya_topology",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Microservice Network Topology Visualizer",
            description: "Graph visualization displaying inter-service dependencies, RPC latency edges, and error rates.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 20,
            actual_effort: 12,
            progress: 60,
            assignees: ["lavanya.raman@freethink.com"]
        },

        // 30. Mayank Agarwal (Microservices Architect)
        {
            key: "t_mayank_k8s",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Kubernetes Helm Charts & Ingress Controller Setup",
            description: "Modular Helm chart templates, cert-manager auto SSL renewals, and HPA autoscaling policies.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-12),
            actual_start: getOffsetDateTime(-22, 9, 0),
            actual_end: getOffsetDateTime(-12, 18, 0),
            expected_effort: 30,
            actual_effort: 30, // Exact effort
            progress: 100,
            assignees: ["mayank.agarwal@freethink.com"]
        },
        {
            key: "t_mayank_mesh",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Istio Service Mesh mTLS & Traffic Splitting (Canary)",
            description: "Mutual TLS encryption for pod-to-pod communication and percentage-based canary traffic routing.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(9),
            actual_start: getOffsetDateTime(-3, 10, 0),
            actual_end: null,
            expected_effort: 24,
            actual_effort: 16,
            progress: 65,
            assignees: ["mayank.agarwal@freethink.com"]
        },

        // 31. Nandini Sen (Security Auditor)
        {
            key: "t_nandini_vault",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "HashiCorp Vault Secret Management & Dynamic DB Credentials",
            description: "Vault agent sidecars in Kubernetes generating short-lived dynamic database connection credentials.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-8),
            actual_start: getOffsetDateTime(-17, 9, 0),
            actual_end: getOffsetDateTime(-8, 17, 30),
            expected_effort: 24,
            actual_effort: 18, // High Efficiency (-6h)
            progress: 100,
            assignees: ["nandini.sen@freethink.com"]
        },
        {
            key: "t_nandini_trivy",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Trivy Container Vulnerability Scanning in CI Pipeline",
            description: "Block container builds with Critical / High CVEs and generate automated vulnerability SBOM reports.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(7),
            actual_start: getOffsetDateTime(-2, 11, 0),
            actual_end: null,
            expected_effort: 16,
            actual_effort: 10,
            progress: 60,
            assignees: ["nandini.sen@freethink.com"]
        },

        // 32. Omkar Sawant (Realtime Specialist)
        {
            key: "t_omkar_ws",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "WebSocket Cluster Gateway with Redis Pub/Sub",
            description: "Scalable Socket.IO cluster synchronizing live task updates across thousands of connected clients.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-6),
            actual_start: getOffsetDateTime(-16, 9, 0),
            actual_end: getOffsetDateTime(-6, 18, 0),
            expected_effort: 26,
            actual_effort: 34, // Overrun (+8h / +30%)
            progress: 100,
            assignees: ["omkar.sawant@freethink.com"]
        },
        {
            key: "t_omkar_reconnect",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Client Offline Queue & Resilient Reconnection Protocol",
            description: "Local buffer caching task updates during network dropouts with automatic batch replay on reconnection.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(11),
            actual_start: getOffsetDateTime(-2, 9, 0),
            actual_end: null,
            expected_effort: 18,
            actual_effort: 8,
            progress: 45,
            assignees: ["omkar.sawant@freethink.com"]
        },

        // 33. Payal Trivedi (Test Automation Lead)
        {
            key: "t_payal_contract",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Pact Consumer-Driven Contract Testing for Microservices",
            description: "Automated contract verification ensuring breaking changes are caught before merging cross-service pull requests.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-9),
            actual_start: getOffsetDateTime(-18, 9, 0),
            actual_end: getOffsetDateTime(-9, 17, 0),
            expected_effort: 22,
            actual_effort: 22, // Exact effort
            progress: 100,
            assignees: ["payal.trivedi@freethink.com"]
        },
        {
            key: "t_payal_chaos",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Chaos Engineering Experiments with Chaos Mesh",
            description: "Simulate pod kills, network latency injections, and disk pressure to test service failover resilience.",
            priority: "MEDIUM",
            status: "SCHEDULED",
            deadline: getOffsetDate(16),
            actual_start: null,
            actual_end: null,
            expected_effort: 20,
            actual_effort: 0,
            progress: 0,
            assignees: ["payal.trivedi@freethink.com"]
        },

        // 34. Rishabh Jain (Network Engineer)
        {
            key: "t_rishabh_vpn",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "WireGuard Developer VPN & Split-Tunneling Setup",
            description: "Fast, encrypted peer-to-peer WireGuard mesh allowing engineers to access development clusters securely.",
            priority: "HIGH",
            status: "COMPLETED",
            deadline: getOffsetDate(-11),
            actual_start: getOffsetDateTime(-20, 9, 0),
            actual_end: getOffsetDateTime(-11, 16, 0),
            expected_effort: 20,
            actual_effort: 16, // High Efficiency (-4h)
            progress: 100,
            assignees: ["rishabh.jain@freethink.com"]
        },
        {
            key: "t_rishabh_dns",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "CoreDNS Tuning & Latency Benchmarks in Kubernetes",
            description: "Configure CoreDNS caching, NodeLocal DNSCache daemons, and reduce external lookup timeouts.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(8),
            actual_start: getOffsetDateTime(-3, 10, 0),
            actual_end: null,
            expected_effort: 14,
            actual_effort: 8,
            progress: 55,
            assignees: ["rishabh.jain@freethink.com"]
        },

        // 35. Shreya Ghoshal (UX Researcher)
        {
            key: "t_shreya_interviews",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "DevOps Engineer Personas & Workflow Pain Point Interviews",
            description: "Conducted 15 in-depth user interviews with cloud architects to streamline resource allocation UX.",
            priority: "MEDIUM",
            status: "COMPLETED",
            deadline: getOffsetDate(-14),
            actual_start: getOffsetDateTime(-24, 9, 0),
            actual_end: getOffsetDateTime(-14, 17, 0),
            expected_effort: 24,
            actual_effort: 32, // Overrun (+8h / +33%)
            progress: 100,
            assignees: ["shreya.ghoshal@freethink.com"]
        },
        {
            key: "t_shreya_analytics_ux",
            projectKey: "freethink_cloud",
            createdBy: "shlok@freethink.com",
            title: "Executive Analytics Dashboard Usability Benchmark",
            description: "Benchmarked time-to-insight for PMs evaluating planned vs actual effort across 30+ resources.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(10),
            actual_start: getOffsetDateTime(-2, 9, 0),
            actual_end: null,
            expected_effort: 18,
            actual_effort: 10,
            progress: 55,
            assignees: ["shreya.ghoshal@freethink.com"]
        },

        // ==========================================
        // PROJECT 5: REAL-TIME TELEMETRY & AI ANALYTICS
        // ==========================================
        {
            key: "t_analytics_ingest",
            projectKey: "freethink_analytics",
            createdBy: "shlok@freethink.com",
            title: "Time-Series Telemetry Ingestion Pipeline (ClickHouse)",
            description: "Ingest 50,000 effort telemetry events/sec into ClickHouse columnar storage for real-time analytics.",
            priority: "CRITICAL",
            status: "COMPLETED",
            deadline: getOffsetDate(-3),
            actual_start: getOffsetDateTime(-10, 9, 0),
            actual_end: getOffsetDateTime(-3, 18, 0),
            expected_effort: 28,
            actual_effort: 28, // Exact effort
            progress: 100,
            assignees: ["pooja.verma@freethink.com", "nikhil.bhatt@freethink.com"]
        },
        {
            key: "t_analytics_forecasting",
            projectKey: "freethink_analytics",
            createdBy: "shlok@freethink.com",
            title: "Prophet Time-Series Resource Capacity Forecasting Model",
            description: "Predict future sprint bottlenecks and overallocation risks based on historical velocity trends.",
            priority: "HIGH",
            status: "IN_PROGRESS",
            deadline: getOffsetDate(14),
            actual_start: getOffsetDateTime(-2, 10, 0),
            actual_end: null,
            expected_effort: 32,
            actual_effort: 14,
            progress: 45,
            assignees: ["nikhil.bhatt@freethink.com", "lavanya.raman@freethink.com"]
        },
        {
            key: "t_analytics_anomaly",
            projectKey: "freethink_analytics",
            createdBy: "shlok@freethink.com",
            title: "Automated Effort Overrun Anomaly Detection Alerts",
            description: "Identify tasks where actual effort velocity deviates >30% from the critical path baseline.",
            priority: "HIGH",
            status: "SCHEDULED",
            deadline: getOffsetDate(20),
            actual_start: null,
            actual_end: null,
            expected_effort: 20,
            actual_effort: 0,
            progress: 0,
            assignees: ["mayank.agarwal@freethink.com", "payal.trivedi@freethink.com"]
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
    console.log(`✅ Inserted ${tasksData.length} distinct tasks across 5 projects with assignments for all 35 resources.`);

    // 7. Insert Logical Task Dependencies (Temporal and Architectural)
    console.log("\n🔗 Creating task dependencies...");
    const dependenciesData = [
        // Freethink Main
        { taskKey: "t_bottlenecks", predecessorKey: "t_cpm_engine" },
        { taskKey: "t_workload", predecessorKey: "t_holidays" },
        { taskKey: "t_leave_approval", predecessorKey: "t_leaves_ui" },
        { taskKey: "t_search", predecessorKey: "t_jwt_security" },
        { taskKey: "t_aarav_ratelimit", predecessorKey: "t_aarav_cache" },
        { taskKey: "t_ananya_notifications", predecessorKey: "t_ananya_theme" },
        { taskKey: "t_rohan_audit", predecessorKey: "t_rohan_export" },
        { taskKey: "t_priya_loadtest", predecessorKey: "t_priya_e2e" },
        { taskKey: "t_vikram_monitoring", predecessorKey: "t_vikram_cicd" },
        { taskKey: "t_neha_usability", predecessorKey: "t_neha_figma" },
        { taskKey: "t_aditya_backups", predecessorKey: "t_aditya_db_opt" },
        { taskKey: "t_pooja_kpi", predecessorKey: "t_pooja_etl" },
        { taskKey: "t_rahul_2fa", predecessorKey: "t_rahul_audit" },
        { taskKey: "t_sneha_waf", predecessorKey: "t_sneha_vpc" },
        { taskKey: "t_siddharth_bundle", predecessorKey: "t_siddharth_profile" },
        { taskKey: "t_divya_pwa", predecessorKey: "t_divya_touch" },

        // Freethink Booking
        { taskKey: "t_karan_webhooks", predecessorKey: "t_karan_booking_api" },
        { taskKey: "t_varun_partitioning", predecessorKey: "t_varun_locking" },
        { taskKey: "t_ritu_responsive", predecessorKey: "t_ritu_wizard" },
        { taskKey: "t_nikhil_pricing", predecessorKey: "t_nikhil_recommend" },
        { taskKey: "t_kavita_mobile_ux", predecessorKey: "t_kavita_booking_ux" },
        { taskKey: "t_arjun_slo", predecessorKey: "t_arjun_gateway" },
        { taskKey: "t_deepa_security_tests", predecessorKey: "t_deepa_gdpr" },
        { taskKey: "t_gaurav_cdc", predecessorKey: "t_gaurav_locks" },
        { taskKey: "t_ishita_components", predecessorKey: "t_ishita_a11y" },

        // Freethink Cloud
        { taskKey: "t_kunal_flink", predecessorKey: "t_kunal_kafka" },
        { taskKey: "t_lavanya_topology", predecessorKey: "t_lavanya_dashboards" },
        { taskKey: "t_mayank_mesh", predecessorKey: "t_mayank_k8s" },
        { taskKey: "t_nandini_trivy", predecessorKey: "t_nandini_vault" },
        { taskKey: "t_omkar_reconnect", predecessorKey: "t_omkar_ws" },
        { taskKey: "t_payal_chaos", predecessorKey: "t_payal_contract" },
        { taskKey: "t_rishabh_dns", predecessorKey: "t_rishabh_vpn" },
        { taskKey: "t_shreya_analytics_ux", predecessorKey: "t_shreya_interviews" },

        // Freethink Analytics
        { taskKey: "t_analytics_forecasting", predecessorKey: "t_analytics_ingest" },
        { taskKey: "t_analytics_anomaly", predecessorKey: "t_analytics_forecasting" }
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

    // 8. Insert Realistic Work Logs for Completed and In-Progress Tasks
    console.log("\n📝 Creating work logs...");
    const workLogsData: Array<{
        taskKey: string;
        email: string;
        hours: number;
        progress: number;
        status: string;
        notes: string;
        blockers: string | null;
        log_date: string;
    }> = [];

    // Automatically generate work logs for tasks that have actual effort
    for (const t of tasksData) {
        if (t.actual_effort > 0 && t.assignees.length > 0) {
            const assigneeEmail = t.assignees[0]!;
            if (t.status === "COMPLETED") {
                // For completed tasks, create 1 or 2 work logs
                if (t.actual_effort > 16) {
                    const halfEffort = Math.round(t.actual_effort / 2);
                    workLogsData.push({
                        taskKey: t.key,
                        email: assigneeEmail,
                        hours: halfEffort,
                        progress: 50,
                        status: "IN_PROGRESS",
                        notes: `Initial development milestone for ${t.title}. Core components drafted.`,
                        blockers: null,
                        log_date: getOffsetDate(-12)
                    });
                    workLogsData.push({
                        taskKey: t.key,
                        email: assigneeEmail,
                        hours: t.actual_effort - halfEffort,
                        progress: 100,
                        status: "COMPLETED",
                        notes: `Finalized implementation, integration tests, and peer review for ${t.title}.`,
                        blockers: null,
                        log_date: getOffsetDate(-5)
                    });
                } else {
                    workLogsData.push({
                        taskKey: t.key,
                        email: assigneeEmail,
                        hours: t.actual_effort,
                        progress: 100,
                        status: "COMPLETED",
                        notes: `Completed full deliverable and test suite for ${t.title}.`,
                        blockers: null,
                        log_date: getOffsetDate(-4)
                    });
                }
            } else if (t.status === "IN_PROGRESS") {
                workLogsData.push({
                    taskKey: t.key,
                    email: assigneeEmail,
                    hours: t.actual_effort,
                    progress: t.progress,
                    status: "IN_PROGRESS",
                    notes: `Sprint work in progress on ${t.title}. Reached ${t.progress}% completion.`,
                    blockers: null,
                    log_date: getOffsetDate(0)
                });
            }
        }
    }

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

    // 10. Run SchedulingEngine.recalculate on All Active Projects
    console.log("\n⚙️ Running SchedulingEngine to compute Gantt schedules, capacity allocations, and risk flags across all projects...");
    for (const [key, projectId] of Object.entries(projectMap)) {
        if (projectId) {
            console.log(`  Calculating schedules for Project '${key}' (ID: ${projectId})...`);
            await recalculate(projectId);
        }
    }
    console.log("✅ SchedulingEngine calculations complete for all projects.");

    // 11. Generate standalone seed_demo.sql
    try {
        console.log("\n📄 Exporting standalone seed_demo.sql...");
        await generateSqlDump(pool);
        console.log("✅ seed_demo.sql generated successfully.");
    } catch (sqlErr) {
        console.error("Warning: Failed to write seed_demo.sql file:", sqlErr);
    }

    console.log("\n================================================================================");
    console.log("🎉 FREETHINK ENTERPRISE DATABASE SEEDED WITH 35 RESOURCES & PLANNED VS ACTUAL EFFORT!");
    console.log("================================================================================");
    console.log("Credentials (Password for all accounts: Password123!):");
    console.log("--------------------------------------------------------------------------------");
    console.log("PROJECT MANAGER:");
    console.log("  • shlok@freethink.com         / shlok       (Shlok Zambreker - Project Manager / Mentor)");
    console.log("\nTEAM RESOURCES (35 Active Engineering, QA, DevOps & Data Members):");
    for (const u of usersData) {
        if (u.role === "RESOURCE") {
            console.log(`  • ${u.email.padEnd(30, " ")} / ${u.username.padEnd(14, " ")} (${u.name})`);
        }
    }
    console.log("================================================================================\n");

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
