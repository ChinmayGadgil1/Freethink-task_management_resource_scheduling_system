import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export interface AuthRequest<P = {}, ResBody = any, ReqBody = any, ReqQuery = any> 
extends Request<P, ResBody, ReqBody, ReqQuery> {
    user?: {
        user_id: number,
        role: 'PROJECT_MANAGER' | 'RESOURCE'
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            message: 'Authentication token missing.',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as JwtPayload;

        req.user = {
            user_id: decoded.user_id,
            role: decoded.role,
        };

        next();
    } catch {
        res.status(401).json({
            message: 'Invalid or expired token.',
        });
    }
};