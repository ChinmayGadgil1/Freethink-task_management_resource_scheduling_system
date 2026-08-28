import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool } from "../config/database.js";
import type { UserRole } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "./emailService.js";

export async function signupUser(
  name: string,
  username: string,
  email: string,
  password: string,
  role: UserRole,
) {
  const pool = getPool();

  const [existingUsers] = await pool.query<RowDataPacket[]>(
    `
        SELECT user_id, email, username
        FROM users
        WHERE email = ? OR username = ?
        LIMIT 1
        `,
    [email, username],
  );

  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0]!;
    if (existingUser.email === email) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    } else {
      throw new Error("USERNAME_ALREADY_EXISTS");
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query<ResultSetHeader>(
    `
        INSERT INTO users
            (name, username, email, password_hash, role)
        VALUES
            (?, ?, ?, ?, ?)
        `,
    [name, username, email, passwordHash, role],
  );

  return {
    user_id: result.insertId,
    name,
    username,
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
            username,
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
            username,
            email,
            password_hash,
            role,
            is_active
        FROM users
        WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
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
        username: user.username,
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
         WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
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

/**
 * Generates a password reset token, saves it to DB, and sends the reset email.
 * Always returns success (even if email not found) to avoid user enumeration.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const pool = getPool();

  // Look up user by email
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT user_id, name, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
    [email]
  );

  // Silently succeed if user not found (security best practice)
  if (users.length === 0) return;

  const user = users[0]!;

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Invalidate any previous unused tokens for this user
  await pool.query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE`,
    [user.user_id]
  );

  // Save the new token
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
    [user.user_id, token, expiresAt]
  );

  // Send the reset email
  await sendPasswordResetEmail(user.email as string, user.name as string, token);
}

/**
 * Validates the reset token and updates the user's password.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<void> {
  const pool = getPool();

  // Look up the token
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
     FROM password_reset_tokens prt
     WHERE prt.token = ?
     LIMIT 1`,
    [token]
  );

  if (rows.length === 0) {
    throw new Error("INVALID_TOKEN");
  }

  const record = rows[0]!;

  if (record.used) {
    throw new Error("TOKEN_ALREADY_USED");
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  // Hash the new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update the user's password
  await pool.query(
    `UPDATE users SET password_hash = ? WHERE user_id = ?`,
    [newPasswordHash, record.user_id]
  );

  // Mark the token as used
  await pool.query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE id = ?`,
    [record.id]
  );
}
