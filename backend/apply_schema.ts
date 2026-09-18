import { getPool, createDatabasePool } from "./src/config/database.js";

async function run() {
    await createDatabasePool();
    const pool = getPool();
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_checkouts (
                user_id BIGINT NOT NULL,
                checkout_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, checkout_date),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        console.log("daily_checkouts table created successfully.");
    } catch (e) {
        console.error("Error creating table:", e);
    } finally {
        process.exit(0);
    }
}

run();
