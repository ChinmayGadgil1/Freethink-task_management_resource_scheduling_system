import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool } from "../config/database.js";
import type { UserRole } from "../models/userModel.js";
import jwt from "jsonwebtoken";

export async function signupUser(
  name: string,
  email: string,
  password: string,
  role: UserRole,
) {
  const pool = getPool();

  const [existingUsers] = await pool.query<RowDataPacket[]>(
    `
        SELECT user_id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
    [email],
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
    [name, email, passwordHash, role],
  );

  return {
    user_id: result.insertId,
    name,
    email,
    role,
  };
}

export async function signinUser(identifier: string, password: string) {
  const pool = getPool();

  const isEmail = identifier.includes("@");
  const query = isEmail
    ? `SELECT
            user_id,
            name,
            email,
            password_hash,
            role,
            is_active
        FROM users
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1`
    : `SELECT
            user_id,
            name,
            email,
            password_hash,
            role,
            is_active
        FROM users
        WHERE LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?)
        LIMIT 1`;

  const queryParams = isEmail ? [identifier] : [identifier, identifier];

  const [users] = await pool.query<RowDataPacket[]>(query, queryParams);

  if (users.length === 0) throw new Error("INVALID_CREDENTIALS");

  const user = users[0]!;

  if (!user.is_active) throw new Error("USER_INACTIVE");

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) throw new Error("INVALID_CREDENTIALS");

    const token = jwt.sign(
        {
            user_id: user.user_id,
            role: user.role,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: '1d',
        }
    );

    return {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
    };
}


export async function resetPassword(
  identifier: string,
  oldPassword: string,
  newPassword: string,
) {
  const pool = getPool();

  const isEmail = identifier.includes("@");
  const query = isEmail
    ? `SELECT user_id, email, password_hash
         FROM users
         WHERE LOWER(email) = LOWER(?)
         LIMIT 1`
    : `SELECT user_id, email, password_hash
         FROM users
         WHERE LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?)
         LIMIT 1`;

  const queryParams = isEmail ? [identifier] : [identifier, identifier];

  const [users] = await pool.query<RowDataPacket[]>(query, queryParams);

  if (users.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = users[0]!;

  const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);

  if (!passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
    [newPasswordHash, user.user_id],
  );

  if (result.affectedRows === 0) {
    throw new Error("PASSWORD_UPDATE_FAILED");
  }
}
