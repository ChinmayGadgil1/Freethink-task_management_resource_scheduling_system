import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool } from "../config/database.js";
import type { UserRole } from "../models/userModel.js";

export async function signupUser(
    name: string,
    email: string,
    password: string,
    role: UserRole
) {
    const pool = getPool();

    const [existingUsers] = await pool.query<RowDataPacket[]>(
        `
        SELECT user_id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email]
    );

    if (existingUsers.length > 0) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query<ResultSetHeader>(
        `
        INSERT INTO users
            (name, email, password_hash, role)
        VALUES
            (?, ?, ?, ?)
        `,
        [name, email, passwordHash, role]
    );

    return {
        user_id: result.insertId,
        name,
        email,
        role,
    };
}