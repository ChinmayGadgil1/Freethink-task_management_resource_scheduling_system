import bcrypt from "bcryptjs";
import { createDatabasePool } from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const THIRTY_USERS = [
    { name: "Aarav Sharma", username: "aarav.sharma", email: "aarav.sharma@freethink.com" },
    { name: "Pooja Patel", username: "pooja.patel", email: "pooja.patel@freethink.com" },
    { name: "Rohan Mehta", username: "rohan.mehta", email: "rohan.mehta@freethink.com" },
    { name: "Neha Verma", username: "neha.verma", email: "neha.verma@freethink.com" },
    { name: "Aditya Joshi", username: "aditya.joshi", email: "aditya.joshi@freethink.com" },
    { name: "Ananya Rao", username: "ananya.rao", email: "ananya.rao@freethink.com" },
    { name: "Vikram Kulkarni", username: "vikram.kulkarni", email: "vikram.kulkarni@freethink.com" },
    { name: "Kavya Nair", username: "kavya.nair", email: "kavya.nair@freethink.com" },
    { name: "Rahul Deshmukh", username: "rahul.deshmukh", email: "rahul.deshmukh@freethink.com" },
    { name: "Sneha Roy", username: "sneha.roy", email: "sneha.roy@freethink.com" },
    { name: "Arjun Gupta", username: "arjun.gupta", email: "arjun.gupta@freethink.com" },
    { name: "Priyanka Sen", username: "priyanka.sen", email: "priyanka.sen@freethink.com" },
    { name: "Karan Singhania", username: "karan.singhania", email: "karan.singhania@freethink.com" },
    { name: "Divya Iyer", username: "divya.iyer", email: "divya.iyer@freethink.com" },
    { name: "Manish Reddy", username: "manish.reddy", email: "manish.reddy@freethink.com" },
    { name: "Rhea Chawla", username: "rhea.chawla", email: "rhea.chawla@freethink.com" },
    { name: "Siddharth Bhatia", username: "siddharth.bhatia", email: "siddharth.bhatia@freethink.com" },
    { name: "Ishita Saxena", username: "ishita.saxena", email: "ishita.saxena@freethink.com" },
    { name: "Gaurav Malhotra", username: "gaurav.malhotra", email: "gaurav.malhotra@freethink.com" },
    { name: "Meera Menon", username: "meera.menon", email: "meera.menon@freethink.com" },
    { name: "Nikhil Sawant", username: "nikhil.sawant", email: "nikhil.sawant@freethink.com" },
    { name: "Swati Agarwal", username: "swati.agarwal", email: "swati.agarwal@freethink.com" },
    { name: "Abhishek Pandey", username: "abhishek.pandey", email: "abhishek.pandey@freethink.com" },
    { name: "Tara Hegde", username: "tara.hegde", email: "tara.hegde@freethink.com" },
    { name: "Varun Nambiar", username: "varun.nambiar", email: "varun.nambiar@freethink.com" },
    { name: "Ritu Kapoor", username: "ritu.kapoor", email: "ritu.kapoor@freethink.com" },
    { name: "Devendra Patil", username: "devendra.patil", email: "devendra.patil@freethink.com" },
    { name: "Simran Kaur", username: "simran.kaur", email: "simran.kaur@freethink.com" },
    { name: "Omkar Nadkarni", username: "omkar.nadkarni", email: "omkar.nadkarni@freethink.com" },
    { name: "Zoya Qureshi", username: "zoya.qureshi", email: "zoya.qureshi@freethink.com" }
];

async function addUsers() {
    console.log("🚀 Initializing database connection...");
    const pool = await createDatabasePool();

    // 1. Get the target project (Smart Project Task Management & Resource Scheduling System or first active project)
    const [projects] = await pool.query<RowDataPacket[]>(
        `SELECT project_id, name FROM projects ORDER BY project_id ASC`
    );

    if (projects.length === 0) {
        console.error("❌ No projects found in database. Please run db:seed first.");
        process.exit(1);
    }

    console.log(`\n📋 Found ${projects.length} project(s):`);
    for (const p of projects) {
        console.log(`   - Project ID ${p.project_id}: ${p.name}`);
    }

    // Default to project 1 (Smart Project Task Management & Resource Scheduling System)
    const targetProject = projects[0]!;
    const projectId = targetProject.project_id;
    console.log(`\n🎯 Target Project for 30 users: [ID: ${projectId}] "${targetProject.name}"`);

    // 2. Hash default password
    const defaultPassword = "Password123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const nonWorkingDays = JSON.stringify(["SATURDAY", "SUNDAY"]);

    let createdCount = 0;
    let linkedCount = 0;

    console.log("\n👥 Inserting 30 users and adding them to the project...");

    for (const u of THIRTY_USERS) {
        let userId: number;

        // Check if user already exists
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT user_id FROM users WHERE email = ? OR username = ?`,
            [u.email, u.username]
        );

        if (existing.length > 0) {
            userId = existing[0]!.user_id;
            console.log(`   ℹ️ User already exists: ${u.name} (ID: ${userId})`);
        } else {
            const [res] = await pool.query<ResultSetHeader>(
                `INSERT INTO users (name, username, email, password_hash, role, non_working_days, daily_working_hours, schedule_configured, is_active)
                 VALUES (?, ?, ?, ?, 'RESOURCE', ?, 8.00, TRUE, TRUE)`,
                [u.name, u.username, u.email, passwordHash, nonWorkingDays]
            );
            userId = res.insertId;
            createdCount++;
            console.log(`   ✅ Created user: ${u.name} (ID: ${userId}, Email: ${u.email})`);
        }

        // Link into project_members for this project (and all other projects if desired)
        for (const proj of projects) {
            const [memberCheck] = await pool.query<RowDataPacket[]>(
                `SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?`,
                [proj.project_id, userId]
            );

            if (memberCheck.length === 0) {
                await pool.query(
                    `INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`,
                    [proj.project_id, userId]
                );
                if (proj.project_id === projectId) {
                    linkedCount++;
                }
            }
        }
    }

    console.log(`\n🎉 Success!`);
    console.log(`   - New users created: ${createdCount}`);
    console.log(`   - Users assigned to Project [${projectId}] "${targetProject.name}": ${THIRTY_USERS.length}`);
    console.log(`   - Default Password for all created users: "${defaultPassword}"`);

    await pool.end();
    process.exit(0);
}

addUsers().catch((err) => {
    console.error("❌ Error adding users:", err);
    process.exit(1);
});
