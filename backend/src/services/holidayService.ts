import { getPool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Holiday, CreateHolidayDTO, UpdateHolidayDTO } from "../models/holidayModel.js";

/**
 * Format a Date object or date string to YYYY-MM-DD
 */
export function formatDateKey(dateInput: Date | string): string {
    if (typeof dateInput === "string") {
        return dateInput.includes("T") ? dateInput.split("T")[0]! : dateInput;
    }
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Validates ISO date format YYYY-MM-DD
 */
export function isValidDateString(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(`${dateStr}T00:00:00Z`);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

/**
 * Fetch all holidays with optional date range filter
 */
export async function getAllHolidays(startDate?: string, endDate?: string): Promise<Holiday[]> {
    const pool = getPool();
    let query = `
        SELECT 
            holiday_id,
            DATE_FORMAT(holiday_date, '%Y-%m-%d') as holiday_date,
            description
        FROM holidays
    `;
    const params: any[] = [];

    if (startDate && endDate) {
        query += ` WHERE holiday_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    } else if (startDate) {
        query += ` WHERE holiday_date >= ?`;
        params.push(startDate);
    } else if (endDate) {
        query += ` WHERE holiday_date <= ?`;
        params.push(endDate);
    }

    query += ` ORDER BY holiday_date ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Holiday[];
}

/**
 * Fetch a single holiday by ID
 */
export async function getHolidayById(holidayId: number): Promise<Holiday | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 
            holiday_id,
            DATE_FORMAT(holiday_date, '%Y-%m-%d') as holiday_date,
            description
        FROM holidays 
        WHERE holiday_id = ?`,
        [holidayId]
    );

    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Holiday;
}

/**
 * Create a new holiday with duplicate date check
 */
export async function createHoliday(data: CreateHolidayDTO): Promise<Holiday> {
    const pool = getPool();
    const formattedDate = formatDateKey(data.holiday_date);

    if (!isValidDateString(formattedDate)) {
        const error = new Error("Invalid date format. Expected YYYY-MM-DD.");
        (error as any).status = 400;
        throw error;
    }

    if (!data.description || data.description.trim() === "") {
        const error = new Error("Holiday description is required.");
        (error as any).status = 400;
        throw error;
    }

    // Duplicate date check
    const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT holiday_id, description FROM holidays WHERE holiday_date = ?`,
        [formattedDate]
    );

    if (existing.length > 0) {
        const error = new Error(`A holiday already exists for date ${formattedDate}: "${existing[0]?.description}".`);
        (error as any).status = 409;
        throw error;
    }

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO holidays (holiday_date, description) VALUES (?, ?)`,
        [formattedDate, data.description.trim()]
    );

    return {
        holiday_id: result.insertId,
        holiday_date: formattedDate,
        description: data.description.trim()
    };
}

/**
 * Update an existing holiday with duplicate date check
 */
export async function updateHoliday(holidayId: number, data: UpdateHolidayDTO): Promise<Holiday> {
    const pool = getPool();
    const existing = await getHolidayById(holidayId);

    if (!existing) {
        const error = new Error("Holiday not found.");
        (error as any).status = 404;
        throw error;
    }

    const targetDate = data.holiday_date ? formatDateKey(data.holiday_date) : existing.holiday_date;
    const targetDescription = data.description !== undefined ? data.description.trim() : existing.description;

    if (!isValidDateString(targetDate)) {
        const error = new Error("Invalid date format. Expected YYYY-MM-DD.");
        (error as any).status = 400;
        throw error;
    }

    if (!targetDescription) {
        const error = new Error("Holiday description cannot be empty.");
        (error as any).status = 400;
        throw error;
    }

    // Check if new date is already taken by another holiday ID
    if (targetDate !== existing.holiday_date) {
        const [duplicateCheck] = await pool.query<RowDataPacket[]>(
            `SELECT holiday_id, description FROM holidays WHERE holiday_date = ? AND holiday_id != ?`,
            [targetDate, holidayId]
        );

        if (duplicateCheck.length > 0) {
            const error = new Error(`A holiday already exists for date ${targetDate}: "${duplicateCheck[0]?.description}".`);
            (error as any).status = 409;
            throw error;
        }
    }

    await pool.query(
        `UPDATE holidays SET holiday_date = ?, description = ? WHERE holiday_id = ?`,
        [targetDate, targetDescription, holidayId]
    );

    return {
        holiday_id: holidayId,
        holiday_date: targetDate,
        description: targetDescription
    };
}

//Delete a holiday by ID 
export async function deleteHoliday(holidayId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM holidays WHERE holiday_id = ?`,
        [holidayId]
    );

    if (result.affectedRows === 0) {
        const error = new Error("Holiday not found.");
        (error as any).status = 404;
        throw error;
    }

    return true;
}

//Returns a Set of holiday date strings (YYYY-MM-DD) for high-performance lookups
export async function getHolidayDatesSet(startDate?: string, endDate?: string): Promise<Set<string>> {
    const holidays = await getAllHolidays(startDate, endDate);
    const holidaySet = new Set<string>();
    for (const h of holidays) {
        holidaySet.add(h.holiday_date);
    }
    return holidaySet;
}

// Checks if a given date is a working day (Monday-Friday and not in holidaySet)
export function isWorkingDay(dateInput: Date | string, holidaySet: Set<string>): boolean {
    const dateStr = formatDateKey(dateInput);
    const dateObj = typeof dateInput === "string" ? new Date(`${dateStr}T00:00:00`) : dateInput;
    const dayOfWeek = dateObj.getDay();

    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }

    // Company Holiday
    if (holidaySet.has(dateStr)) {
        return false;
    }

    return true;
}

// Adds working days to a start date, skipping weekends and holidays
export function addWorkingDays(startDateInput: Date | string, workingDays: number, holidaySet: Set<string>): string {
    const startStr = formatDateKey(startDateInput);
    const current = new Date(`${startStr}T00:00:00`);

    let daysAdded = 0;
    while (daysAdded < workingDays) {
        current.setDate(current.getDate() + 1);
        if (isWorkingDay(current, holidaySet)) {
            daysAdded++;
        }
    }

    return formatDateKey(current);
}

/* Counts total working days between two dates inclusive */
export function countWorkingDays(startDateInput: Date | string, endDateInput: Date | string, holidaySet: Set<string>): number {
    const startStr = formatDateKey(startDateInput);
    const endStr = formatDateKey(endDateInput);
    const current = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);

    if (current > end) return 0;

    let count = 0;
    while (current <= end) {
        if (isWorkingDay(current, holidaySet)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}
