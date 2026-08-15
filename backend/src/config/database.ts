import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

const DB_HOST = getEnv("DB_HOST");
const DB_USER = getEnv("DB_USER");
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_PORT = Number(getEnv("DB_PORT"));
const DB_NAME = getEnv("DB_NAME");

const mysqlConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
};

// Store the pool instance here
let pool: mysql.Pool;

export async function createDatabasePool() {
    // Prevent creating multiple pools if called more than once
    if (pool) return pool;

    const connection = await mysql.createConnection(mysqlConfig);

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``
        );

        console.log(`Database "${DB_NAME}" is ready.`);
    } finally {
        await connection.end();
    }

    pool = mysql.createPool({
        ...mysqlConfig,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    return pool;
}

// Export a getter so services can access the initialized pool directly
export function getPool(): mysql.Pool {
    if (!pool) {
        throw new Error("Database pool not initialized. Server must call initializeDatabase() first.");
    }
    return pool;
}