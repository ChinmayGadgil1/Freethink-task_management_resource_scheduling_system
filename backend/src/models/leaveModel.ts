export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserLeave {
    leave_id: number;
    user_id: number;
    user_name?: string;
    user_email?: string;
    leave_date: string; // ISO date string (YYYY-MM-DD)
    leave_hours: number;
    status: LeaveStatus;
    approver_id?: number | null;
    approver_name?: string | null;
    rejection_reason?: string | null;
    approved_at?: string | null;
    created_at?: string | null;
}

export interface CreateLeaveDTO {
    user_id: number;
    leave_date: string;
    leave_hours?: number | undefined;
    status?: LeaveStatus | undefined;
    approver_id?: number | null | undefined;
}

