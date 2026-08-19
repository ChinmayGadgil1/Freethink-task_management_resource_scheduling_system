import { createDatabasePool } from "../config/database.js";

export async function initializeDatabase() {
    const pool = await createDatabasePool();

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('PROJECT_MANAGER', 'RESOURCE') NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    console.log("Users table is ready.");

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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (project_manager_id)
            REFERENCES users(user_id)
        )
    `);

    console.log("Projects table created successfully.");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            project_id BIGINT NOT NULL,
            created_by BIGINT NOT NULL,
            title VARCHAR(150) NOT NULL,
            description TEXT,
            priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
            status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'PENDING',
            start_date DATE,
            deadline DATE,
            expected_effort DECIMAL(8,2) NOT NULL DEFAULT 0,
            actual_effort DECIMAL(8,2) NOT NULL DEFAULT 0,
            progress DECIMAL(5,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id),
            FOREIGN KEY (created_by) REFERENCES users(user_id)
        )
    `);

    console.log("Tasks table created successfully.");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS project_members (
            project_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (project_id, user_id),

            FOREIGN KEY (project_id)
                REFERENCES projects(project_id)
                ON DELETE CASCADE,

            FOREIGN KEY (user_id)
                REFERENCES users(user_id)
                ON DELETE CASCADE
        )
    `);

    console.log("Project members table created successfully.");

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

    console.log("Task assignments table created successfully.");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS task_dependencies (
            task_id BIGINT NOT NULL,
            predecessor_task_id BIGINT NOT NULL,
            PRIMARY KEY (task_id, predecessor_task_id),
            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (predecessor_task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
        )
    `);

    console.log("Task dependencies table created successfully.");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS work_logs (
            log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            task_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            hours_logged DECIMAL(5,2) NOT NULL DEFAULT 0,
            progress_logged DECIMAL(5,2) NOT NULL DEFAULT 0,
            status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL,
            notes TEXT,
            blockers TEXT,
            log_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);

    console.log("Work logs table created successfully.");

    return pool;
}