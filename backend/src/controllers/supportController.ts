import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import * as supportService from "../services/supportService.js";

const addTicketSchema = z.object({
    name: z.string({ message: "Name is required" }).trim().min(1, "Name cannot be empty"),
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
    category: z.string({ message: "Category is required" }).trim().min(1, "Category cannot be empty"),
    description: z.string({ message: "Description is required" }).trim().min(1, "Description cannot be empty"),
});

/**
 * POST /api/support/tickets
 * Create a new support ticket.
 */
export async function addTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
        const parsed = addTicketSchema.parse(req.body);
        const userId = req.user?.user_id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized. User session not found."
            });
            return;
        }

        const ticket = await supportService.createTicket({
            user_id: userId,
            name: parsed.name,
            email: parsed.email,
            category: parsed.category,
            description: parsed.description,
        });

        res.status(201).json({
            success: true,
            message: "Support ticket submitted successfully.",
            data: ticket
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

        console.error("Submit support ticket error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to submit support ticket."
        });
    }
}

/**
 * GET /api/support/tickets
 * Fetch support tickets for the current user.
 */
export async function listTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized. User session not found."
            });
            return;
        }

        const tickets = await supportService.getTicketsForUser(userId);

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error: any) {
        console.error("List support tickets error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve support tickets."
        });
    }
}
