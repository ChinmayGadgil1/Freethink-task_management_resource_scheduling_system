import pool from "../config/database.js";

async function initializeDatabase() {
    try {
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

        console.log("Users table created successfully.");
    }
    catch (error) {
        console.error("Failed to create users table:", error);
    }
    finally {
        await pool.end();
    }
}

initializeDatabase();