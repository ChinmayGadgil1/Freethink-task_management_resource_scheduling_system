import { randomUUID } from "crypto";
import { createDatabasePool, getPool } from "../config/database.js";
import type { RowDataPacket } from "mysql2/promise";

export async function initializeDatabase(options: { dropExisting?: boolean } = {}) {
    const pool = await createDatabasePool();

    if (options.dropExisting) {
        console.log("Dropping existing tables...");
        await pool.query("SET FOREIGN_KEY_CHECKS = 0");
        const tables = [
            "notifications",
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
            schedule_configured BOOLEAN NOT NULL DEFAULT FALSE,
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
                'NOT_STARTED',
                'IN_PROGRESS',
                'ON_HOLD',
                'COMPLETED',
                'CANCELLED',
                'ARCHIVED'
            ) NOT NULL DEFAULT 'NOT_STARTED',
            priority ENUM(
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            ) NOT NULL DEFAULT 'MEDIUM',
            start_date DATE,
            deadline DATE,
            progress DECIMAL(5,2) NOT NULL DEFAULT 0,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_projects_deleted (deleted_at),
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
            supervisor_id BIGINT NULL,
            title VARCHAR(150) NOT NULL,
            description TEXT,
            priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
            status ENUM('UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'UNASSIGNED',
            deadline DATE,
            planned_start DATETIME,
            planned_end DATETIME,
            actual_start DATETIME,
            actual_end DATETIME,
            expected_effort DECIMAL(8,2) NOT NULL DEFAULT 0,
            actual_effort DECIMAL(8,2) NOT NULL DEFAULT 0,
            progress DECIMAL(5,2) NOT NULL DEFAULT 0,
            is_schedule_at_risk BOOLEAN NOT NULL DEFAULT FALSE,
            is_deadline_at_risk BOOLEAN NOT NULL DEFAULT FALSE,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tasks_deleted (deleted_at),
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (supervisor_id) REFERENCES users(user_id) ON DELETE SET NULL
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
            request_id VARCHAR(36) NULL,
            user_id BIGINT NOT NULL,
            leave_date DATE NOT NULL,
            leave_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
            leave_type ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY',
            status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
            approver_id BIGINT NULL,
            rejection_reason VARCHAR(255) NULL,
            approved_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (approver_id) REFERENCES users(user_id) ON DELETE SET NULL,
            UNIQUE KEY unique_user_leave_type (user_id, leave_date, leave_type),
            INDEX idx_leave_request_id (request_id)
        )
    `);
    console.log("User leaves table is ready.");

    // 12. Notifications table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            link VARCHAR(255) NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            INDEX idx_user_read (user_id, is_read),
            INDEX idx_user_created (user_id, created_at)
        )
    `);
    console.log("Notifications table is ready.");

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

    // Migration check: ensure status, approver_id, rejection_reason, approved_at columns exist in user_leaves
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED'`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN approver_id BIGINT NULL`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN rejection_reason VARCHAR(255) NULL`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN approved_at DATETIME NULL`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN leave_type ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY'`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD COLUMN request_id VARCHAR(36) NULL`);
    } catch (e: any) {
        // Ignore if column already exists
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD INDEX idx_leave_request_id (request_id)`);
    } catch (e: any) {
        // Ignore if index already exists
    }

    // Migration check: update unique constraint on user_leaves to allow multiple non-overlapping half days on same date
    try {
        await pool.query(`ALTER TABLE user_leaves DROP INDEX unique_user_leave`);
    } catch (e: any) {
        // Ignore if index does not exist
    }
    try {
        await pool.query(`ALTER TABLE user_leaves ADD UNIQUE KEY unique_user_leave_type (user_id, leave_date, leave_type)`);
    } catch (e: any) {
        // Ignore if index already exists
    }

    // Migration check: assign request_id to any legacy rows in user_leaves
    try {
        const [nullReqRows] = await pool.query<RowDataPacket[]>(
            `SELECT leave_id, user_id, created_at FROM user_leaves WHERE request_id IS NULL ORDER BY user_id, leave_date`
        );
        if (nullReqRows && nullReqRows.length > 0) {
            const batchMap = new Map<string, number[]>();
            for (const r of nullReqRows) {
                const timeSec = r.created_at ? Math.floor(new Date(r.created_at).getTime() / 5000) : r.leave_id;
                const batchKey = `${r.user_id}_${timeSec}`;
                if (!batchMap.has(batchKey)) batchMap.set(batchKey, []);
                batchMap.get(batchKey)!.push(Number(r.leave_id));
            }
            for (const [, ids] of batchMap) {
                const reqId = randomUUID();
                await pool.query(
                    `UPDATE user_leaves SET request_id = ? WHERE leave_id IN (?)`,
                    [reqId, ids]
                );
            }
        }
    } catch (e: any) {
        console.error("Migration warning: failed to backfill request_id in user_leaves:", e);
    }

    // Migration check: backfill approver_id for APPROVED leaves where approver_id is NULL
    try {
        await pool.query(`
            UPDATE user_leaves ul
            SET approver_id = (
                SELECT p.project_manager_id
                FROM project_members pm
                INNER JOIN projects p ON pm.project_id = p.project_id
                WHERE pm.user_id = ul.user_id
                LIMIT 1
            )
            WHERE ul.status = 'APPROVED' AND ul.approver_id IS NULL
        `);
        await pool.query(`
            UPDATE user_leaves ul
            SET approver_id = (
                SELECT user_id FROM users WHERE role = 'PROJECT_MANAGER' LIMIT 1
            )
            WHERE ul.status = 'APPROVED' AND ul.approver_id IS NULL
        `);
    } catch (e: any) {
        console.error("Migration warning: failed to backfill approver_id in user_leaves:", e);
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

    // Migration check: Ensure task date columns are DATETIME
    try {
        await pool.query(`ALTER TABLE tasks MODIFY planned_start DATETIME, MODIFY planned_end DATETIME, MODIFY actual_start DATETIME, MODIFY actual_end DATETIME`);
        console.log("Migrated: task date columns updated to DATETIME.");
    } catch (e: any) {
        console.log("Warning: task date columns migration encountered an error (they might already be DATETIME).", e.message);
    }

    // Migration check: Ensure projects status ENUM is updated
    try {
        await pool.query(`ALTER TABLE projects MODIFY status VARCHAR(50)`);
        await pool.query(`UPDATE projects SET status = 'NOT_STARTED' WHERE status = 'DRAFT'`);
        await pool.query(`UPDATE projects SET status = 'IN_PROGRESS' WHERE status IN ('PUBLISHED', 'ACTIVE')`);
        await pool.query(`
            ALTER TABLE projects MODIFY status ENUM(
                'NOT_STARTED',
                'IN_PROGRESS',
                'ON_HOLD',
                'COMPLETED',
                'CANCELLED',
                'ARCHIVED'
            ) NOT NULL DEFAULT 'NOT_STARTED'
        `);
        console.log("Migrated: projects status ENUM updated.");
    } catch (e: any) {
        console.log("Warning: projects status ENUM migration encountered an error.", e.message);
    }

    // Migration & Data Normalization
    try {
        const [columns] = await pool.query<RowDataPacket[]>(
            `SHOW COLUMNS FROM users LIKE 'schedule_configured'`
        );
        if (columns.length === 0) {
            await pool.query(
                `ALTER TABLE users ADD COLUMN schedule_configured BOOLEAN NOT NULL DEFAULT FALSE AFTER daily_working_hours`
            );
            console.log("Migrated: added schedule_configured column to users table.");
        }

        // Lock schedule for existing resources that already have non_working_days configured
        await pool.query(`
            UPDATE users
            SET schedule_configured = TRUE
            WHERE role = 'RESOURCE'
              AND non_working_days IS NOT NULL
              AND schedule_configured = FALSE
        `);

        // Normalize all daily working capacity values to 8.00 hours
        await pool.query(`
            UPDATE users
            SET daily_working_hours = 8.00
            WHERE daily_working_hours != 8.00
               OR daily_working_hours IS NULL
        `);
        console.log("Normalized daily_working_hours to 8.00 and synced schedule_configured state.");

        // Migration check: ensure supervisor_id column exists in tasks table
        try {
            const [taskCols] = await pool.query<RowDataPacket[]>(
                `SHOW COLUMNS FROM tasks LIKE 'supervisor_id'`
            );
            if (taskCols.length === 0) {
                await pool.query(`
                    ALTER TABLE tasks 
                    ADD COLUMN supervisor_id BIGINT NULL AFTER created_by,
                    ADD CONSTRAINT fk_tasks_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(user_id) ON DELETE SET NULL
                `);
                console.log("Migrated: added supervisor_id column with foreign key to tasks table.");
            }
        } catch (supErr: any) {
            console.log("Supervisor migration check warning:", supErr.message);
        }

        // Migration check: ensure deleted_at column exists in projects table
        try {
            const [projCols] = await pool.query<RowDataPacket[]>(
                `SHOW COLUMNS FROM projects LIKE 'deleted_at'`
            );
            if (projCols.length === 0) {
                await pool.query(`
                    ALTER TABLE projects 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER progress,
                    ADD INDEX idx_projects_deleted (deleted_at)
                `);
                console.log("Migrated: added deleted_at column to projects table.");
            }
        } catch (projErr: any) {
            console.log("Projects deleted_at migration check warning:", projErr.message);
        }

        // Migration check: ensure deleted_at column exists in tasks table
        try {
            const [taskDelCols] = await pool.query<RowDataPacket[]>(
                `SHOW COLUMNS FROM tasks LIKE 'deleted_at'`
            );
            if (taskDelCols.length === 0) {
                await pool.query(`
                    ALTER TABLE tasks 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_deadline_at_risk,
                    ADD INDEX idx_tasks_deleted (deleted_at)
                `);
                console.log("Migrated: added deleted_at column to tasks table.");
            }
        } catch (taskDelErr: any) {
            console.log("Tasks deleted_at migration check warning:", taskDelErr.message);
        }
    } catch (migErr) {
        console.error("Warning: Migration check in initializeDatabase encountered an error:", migErr);
    }

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