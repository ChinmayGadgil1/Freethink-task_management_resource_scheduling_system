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

    return pool;
}