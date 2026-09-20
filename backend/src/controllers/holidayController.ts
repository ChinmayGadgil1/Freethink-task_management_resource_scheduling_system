import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import * as holidayService from "../services/holidayService.js";

/**
 * GET /api/holidays
 * Get all holidays with optional startDate/endDate query filters
 */
export async function getHolidays(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { startDate, endDate } = req.query;
        const holidays = await holidayService.getAllHolidays(
            startDate ? String(startDate) : undefined,
            endDate ? String(endDate) : undefined
        );
        res.status(200).json({
            success: true,
            data: holidays,
            count: holidays.length
        });
    } catch (error: any) {
        console.error("Error fetching holidays:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to fetch holidays."
        });
    }
}

/**
 * GET /api/holidays/:id
 * Get single holiday by ID
 */
export async function getHolidayById(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        const holidayId = Number(req.params.id);
        if (isNaN(holidayId)) {
            res.status(400).json({ success: false, message: "Invalid holiday ID." });
            return;
        }

        const holiday = await holidayService.getHolidayById(holidayId);
        if (!holiday) {
            res.status(404).json({ success: false, message: "Holiday not found." });
            return;
        }

        res.status(200).json({ success: true, data: holiday });
    } catch (error: any) {
        console.error("Error fetching holiday:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to fetch holiday."
        });
    }
}

/** * POST /api/holidays
    * Create a new holiday (Project Manager only)*/
export async function createHoliday(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            res.status(403).json({
                success: false,
                message: "Access denied. Only Project Managers can create holidays."
            });
            return;
        }

        const { holiday_date, description } = req.body;
        if (!holiday_date || !description) {
            res.status(400).json({
                success: false,
                message: "Both holiday_date (YYYY-MM-DD) and description are required."
            });
            return;
        }

        const newHoliday = await holidayService.createHoliday({ holiday_date, description });
        res.status(201).json({
            success: true,
            message: "Holiday created successfully.",
            data: newHoliday
        });
    } catch (error: any) {
        console.error("Error creating holiday:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to create holiday."
        });
    }
}

/**
 * PUT /api/holidays/:id
 * Update an existing holiday (Project Manager only)    */
export async function updateHoliday(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            res.status(403).json({
                success: false,
                message: "Access denied. Only Project Managers can update holidays."
            });
            return;
        }

        const holidayId = Number(req.params.id);
        if (isNaN(holidayId)) {
            res.status(400).json({ success: false, message: "Invalid holiday ID." });
            return;
        }

        const { holiday_date, description } = req.body;
        const updated = await holidayService.updateHoliday(holidayId, { holiday_date, description });

        res.status(200).json({
            success: true,
            message: "Holiday updated successfully.",
            data: updated
        });
    } catch (error: any) {
        console.error("Error updating holiday:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to update holiday."
        });
    }
}

/**
 * DELETE /api/holidays/:id
 * Delete a holiday (Project Manager only)
 */
export async function deleteHoliday(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            res.status(403).json({
                success: false,
                message: "Access denied. Only Project Managers can delete holidays."
            });
            return;
        }

        const holidayId = Number(req.params.id);
        if (isNaN(holidayId)) {
            res.status(400).json({ success: false, message: "Invalid holiday ID." });
            return;
        }

        await holidayService.deleteHoliday(holidayId);
        res.status(200).json({
            success: true,
            message: "Holiday deleted successfully."
        });
    } catch (error: any) {
        console.error("Error deleting holiday:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to delete holiday."
        });
    }
}

/**
 * POST /api/holidays/batch
 * Batch import holidays (Project Manager only)
 */
export async function batchCreateHolidaysController(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (req.user?.role !== "PROJECT_MANAGER") {
            res.status(403).json({
                success: false,
                message: "Access denied. Only Project Managers can import holidays."
            });
            return;
        }

        const { holidays } = req.body;
        if (!Array.isArray(holidays) || holidays.length === 0) {
            res.status(400).json({
                success: false,
                message: "A non-empty array of holidays is required."
            });
            return;
        }

        const result = await holidayService.batchCreateHolidays(holidays);
        res.status(200).json({
            success: true,
            message: `Successfully imported ${result.inserted} holidays (${result.skipped} skipped).`,
            data: result
        });
    } catch (error: any) {
        console.error("Error batch importing holidays:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to batch import holidays."
        });
    }
}
