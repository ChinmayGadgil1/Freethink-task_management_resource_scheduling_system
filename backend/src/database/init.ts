import { createDatabasePool, getPool } from "../config/database.js";

export async function initializeDatabase(options: { dropExisting?: boolean } = {}) {
    const pool = await createDatabasePool();

    if (options.dropExisting) {
        console.log("Dropping existing tables...");
        await pool.query("SET FOREIGN_KEY_CHECKS = 0");
        const tables = [
            "password_reset_tokens",
            "support_tickets",
            "task_schedules",
            "task_sessions",
            "work_logs",
            "task_dependencies",
            "task_assignments",
            "project_members",
            "user_leaves",
            "holidays",
            "tasks",
            "projects",
            "users"
        ];
        for (const table of tables) {
            await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
        }
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("All tables dropped.");
    }

    // 1. Users table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('PROJECT_MANAGER', 'RESOURCE') NOT NULL,
            non_working_days JSON NULL,
            daily_working_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log("Users table is ready.");

    // 2. Projects table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            project_manager_id BIGINT NOT NULL,
            name VARCHAR(150) NOT NULL,
            description TEXT,
            status ENUM(
                'DRAFT',
                'PUBLISHED',
                'ACTIVE',
                'ON_HOLD',
                'COMPLETED',
                'CANCELLED'
            ) NOT NULL DEFAULT 'DRAFT',
            priority ENUM(
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            ) NOT NULL DEFAULT 'MEDIUM',
            start_date DATE,
            deadline DATE,
            progress DECIMAL(5,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_manager_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Projects table is ready.");

    // 3. Tasks table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            project_id BIGINT NOT NULL,
            created_by BIGINT NOT NULL,
            title VARCHAR(150) NOT NULL,
            description TEXT,
            priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
            status ENUM('UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'UNASSIGNED',
            deadline DATE,
            planned_start DATE,
            planned_end DATE,
            actual_start DATE,
            actual_end DATE,
            expected_effort DECIMAL(8,2) NOT NULL DEFAULT 0,
            actual_effort DECIMAL(8,2) NOT NULL DEFAULT 0,
            progress DECIMAL(5,2) NOT NULL DEFAULT 0,
            is_schedule_at_risk BOOLEAN NOT NULL DEFAULT FALSE,
            is_deadline_at_risk BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Tasks table is ready.");

    // 4. Project Members table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS project_members (
            project_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Project members table is ready.");

    // 5. Task Assignments table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS task_assignments (
            task_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (task_id, user_id),
            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Task assignments table is ready.");

    // 6. Task Dependencies table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS task_dependencies (
            task_id BIGINT NOT NULL,
            predecessor_task_id BIGINT NOT NULL,
            PRIMARY KEY (task_id, predecessor_task_id),
            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (predecessor_task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
        )
    `);
    console.log("Task dependencies table is ready.");

    // 7. Work Logs table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS work_logs (
            log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            task_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            hours_logged DECIMAL(5,2) NOT NULL DEFAULT 0,
            progress_logged DECIMAL(5,2) NOT NULL DEFAULT 0,
            status ENUM('UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED') NOT NULL,
            notes TEXT,
            blockers TEXT,
            log_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Work logs table is ready.");

    // 8. Task Sessions table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS task_sessions (
            session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            task_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Task sessions table is ready.");

    // 9. Task Schedules table (Gantt allocations)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS task_schedules (
            schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            task_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            schedule_date DATE NOT NULL,
            allocated_hours DECIMAL(5,2) NOT NULL,
            schedule_version INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            INDEX idx_task_date (task_id, schedule_date),
            INDEX idx_user_date (user_id, schedule_date)
        )
    `);
    console.log("Task schedules table is ready.");

    // 10. Holidays table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS holidays (
            holiday_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            holiday_date DATE NOT NULL UNIQUE,
            description VARCHAR(255) NOT NULL
        )
    `);
    console.log("Holidays table is ready.");

    // 11. User Leaves table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_leaves (
            leave_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            leave_date DATE NOT NULL,
            leave_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_leave (user_id, leave_date)
        )
    `);
    console.log("User leaves table is ready.");

    // Migration check: ensure non_working_days and daily_working_hours columns exist in users table
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN non_working_days JSON NULL`);
    } catch (e: any) {
        // Ignore if column already exists (ER_DUP_FIELDNAME)
    }
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN daily_working_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00`);
    } catch (e: any) {
        // Ignore if column already exists (ER_DUP_FIELDNAME)
    }

    // 12. Support Tickets table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
            ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);
    console.log("Support tickets table is ready.");

    // 13. Password Reset Tokens table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id)
        )
    `);
    console.log("Password reset tokens table is ready.");

    return pool;
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith("init.ts") || process.argv[1]?.endsWith("init.js")) {
    const shouldDrop = process.argv.includes("--drop") || process.argv.includes("-d");
    initializeDatabase({ dropExisting: shouldDrop })
        .then(() => {
            console.log("🎉 Database initialization completed successfully.");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Database initialization failed:", err);
            process.exit(1);
        });
}