import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import * as leaveService from "../services/leaveService.js";

const addLeaveSchema = z.object({
    user_id: z.number({ message: "User ID is required" }).int().positive("User ID must be a positive integer"),
    leave_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD").optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start_date format. Expected YYYY-MM-DD").optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end_date format. Expected YYYY-MM-DD").optional(),
    leave_type: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]).optional(),
    start_day_type: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]).optional(),
    end_day_type: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]).optional(),
}).refine(data => data.start_date || data.leave_date, {
    message: "Either start_date or leave_date is required",
    path: ["start_date"]
}).refine(data => {
    const s = data.start_date || data.leave_date;
    const e = data.end_date || s;
    return !s || !e || s <= e;
}, {
    message: "start_date must be before or equal to end_date",
    path: ["end_date"]
});

const getLeavesQuerySchema = z.object({
    user_id: z.string().transform(val => Number(val)).pipe(z.number().int().positive()).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid startDate format. Expected YYYY-MM-DD").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid endDate format. Expected YYYY-MM-DD").optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
});

const rejectLeaveSchema = z.object({
    reason: z.string().max(255, "Reason cannot exceed 255 characters").optional()
});

/**
 * POST /api/leaves
 * Apply / add a leave request (supports single day or date range).
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

        const leave = await leaveService.applyLeave(
            {
                user_id: parsed.user_id,
                leave_date: parsed.leave_date,
                start_date: parsed.start_date,
                end_date: parsed.end_date,
                ...(parsed.leave_type !== undefined ? { leave_type: parsed.leave_type as any } : {}),
                ...(parsed.start_day_type !== undefined ? { start_day_type: parsed.start_day_type as any } : {}),
                ...(parsed.end_day_type !== undefined ? { end_day_type: parsed.end_day_type as any } : {})
            },
            req.user?.role,
            req.user?.user_id
        );

        res.status(201).json({
            success: true,
            message: req.user?.role === "PROJECT_MANAGER" ? "Leave recorded and approved successfully." : "Leave requested successfully (pending approval).",
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
 * PATCH /api/leaves/:id/approve
 * PM approves a pending leave. Recalculates affected project schedules.
 */
export async function approveLeaveController(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        const idParam = req.params.id;
        if (!idParam) {
            res.status(400).json({
                success: false,
                message: "Leave ID or Request ID is required."
            });
            return;
        }

        if (req.user?.role !== "PROJECT_MANAGER") {
            res.status(403).json({
                success: false,
                message: "Access denied. Only Project Managers can approve leaves."
            });
            return;
        }

        const updatedLeave = await leaveService.approveLeave(idParam, req.user.user_id);

        res.status(200).json({
            success: true,
            message: "Leave approved successfully and schedule recalculated.",
            data: updatedLeave
        });
    } catch (error: any) {
        console.error("Approve leave error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to approve leave."
        });
    }
}

/**
 * PATCH /api/leaves/:id/reject
 * PM rejects a pending leave.
 */
export async function rejectLeaveController(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        const idParam = req.params.id;
        if (!idParam) {
            res.status(400).json({
                success: false,
                message: "Leave ID or Request ID is required."
            });
            return;
        }

        if (req.user?.role !== "PROJECT_MANAGER") {
            res.status(403).json({
                success: false,
                message: "Access denied. Only Project Managers can reject leaves."
            });
            return;
        }

        const parsed = rejectLeaveSchema.parse(req.body || {});
        const updatedLeave = await leaveService.rejectLeave(idParam, req.user.user_id, parsed.reason);

        res.status(200).json({
            success: true,
            message: "Leave rejected.",
            data: updatedLeave
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

        console.error("Reject leave error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to reject leave."
        });
    }
}

/**
 * DELETE /api/leaves/:id
 * Remove / cancel a leave request.
 */
export async function removeLeave(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        const idParam = req.params.id;
        if (!idParam) {
            res.status(400).json({
                success: false,
                message: "Leave ID or Request ID is required."
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

        await leaveService.cancelLeave(idParam, req.user);

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
            ...(queryParsed.endDate !== undefined ? { endDate: queryParsed.endDate } : {}),
            ...(queryParsed.status !== undefined ? { status: queryParsed.status } : {}),
            ...(req.user?.role === "PROJECT_MANAGER" ? { manager_id: req.user.user_id } : {})
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

