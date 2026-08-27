import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import * as leaveService from "../services/leaveService.js";

const addLeaveSchema = z.object({
    user_id: z.number({ message: "User ID is required" }).int().positive("User ID must be a positive integer"),
    leave_date: z.string({ message: "Leave date is required" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD"),
    leave_hours: z.number().positive("Leave hours must be positive").max(24, "Leave hours cannot exceed 24").optional()
});

const getLeavesQuerySchema = z.object({
    user_id: z.string().transform(val => Number(val)).pipe(z.number().int().positive()).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid startDate format. Expected YYYY-MM-DD").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid endDate format. Expected YYYY-MM-DD").optional()
});

/**
 * POST /api/leaves
 * Apply / add a leave request.
 */
export async function addLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
        const parsed = addLeaveSchema.parse(req.body);

        // Access control: RESOURCE can only request leaves for themselves
        if (req.user?.role === "RESOURCE" && parsed.user_id !== req.user.user_id) {
            res.status(403).json({
                success: false,
                message: "Access denied. Resources can only apply leaves for themselves."
            });
            return;
        }

        const leave = await leaveService.applyLeave({
            user_id: parsed.user_id,
            leave_date: parsed.leave_date,
            ...(parsed.leave_hours !== undefined ? { leave_hours: parsed.leave_hours } : {})
        });

        res.status(201).json({
            success: true,
            message: "Leave applied successfully.",
            data: leave
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.issues
            });
            return;
        }

        console.error("Apply leave error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to apply leave."
        });
    }
}

/**
 * DELETE /api/leaves/:id
 * Remove / cancel a leave request.
 */
export async function removeLeave(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        const leaveId = Number(req.params.id);
        if (isNaN(leaveId)) {
            res.status(400).json({
                success: false,
                message: "Invalid leave ID."
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        await leaveService.cancelLeave(leaveId, req.user);

        res.status(200).json({
            success: true,
            message: "Leave cancelled successfully."
        });
    } catch (error: any) {
        console.error("Cancel leave error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to cancel leave."
        });
    }
}

/**
 * GET /api/leaves
 * List leaves with optional filters.
 */
export async function listLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
        const queryParsed = getLeavesQuerySchema.parse(req.query);

        let filterUserId = queryParsed.user_id;

        // Access control: RESOURCE can only query their own leaves
        if (req.user?.role === "RESOURCE") {
            if (filterUserId !== undefined && filterUserId !== req.user.user_id) {
                res.status(403).json({
                    success: false,
                    message: "Access denied. Resources can only view their own leaves."
                });
                return;
            }
            // Auto-default to their own user_id if not specified
            filterUserId = req.user.user_id;
        }

        const leaves = await leaveService.getLeaves({
            ...(filterUserId !== undefined ? { user_id: filterUserId } : {}),
            ...(queryParsed.startDate !== undefined ? { startDate: queryParsed.startDate } : {}),
            ...(queryParsed.endDate !== undefined ? { endDate: queryParsed.endDate } : {})
        });

        res.status(200).json({
            success: true,
            data: leaves,
            count: leaves.length
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation error in query parameters",
                errors: error.issues
            });
            return;
        }

        console.error("List leaves error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to fetch leaves."
        });
    }
}
