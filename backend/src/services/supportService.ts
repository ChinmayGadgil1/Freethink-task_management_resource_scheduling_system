import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { SupportTicket, CreateTicketDTO } from "../models/supportModel.js";

/**
 * Save a new support ticket in the database.
 */
export async function createTicket(data: CreateTicketDTO): Promise<SupportTicket> {
    const pool = getPool();
    const { user_id, name, email, category, description } = data;

    // 1. Verify user exists
    const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id FROM users WHERE user_id = ?`,
        [user_id]
    );
    if (userRows.length === 0) {
        const error = new Error("User not found.");
        (error as any).status = 404;
        throw error;
    }

    // 2. Insert ticket
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO support_tickets (user_id, name, email, category, description) VALUES (?, ?, ?, ?, ?)`,
        [user_id, name, email, category, description]
    );

    // 3. Fetch and return inserted ticket
    const [ticketRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM support_tickets WHERE ticket_id = ?`,
        [result.insertId]
    );

    const ticket = ticketRows[0] as SupportTicket;
    if (!ticket) {
        throw new Error("Failed to retrieve created support ticket.");
    }
    return ticket;
}

/**
 * Fetch all support tickets for a specific user.
 */
export async function getTicketsForUser(userId: number): Promise<SupportTicket[]> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    return rows as SupportTicket[];
}
