export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';

export interface UserLeave {
    leave_id: number;
    user_id: number;
    user_name?: string;
    user_email?: string;
    leave_date: string; // ISO date string (YYYY-MM-DD)
    leave_hours: number;
    leave_type: LeaveType;
    status: LeaveStatus;
    approver_id?: number | null;
    approver_name?: string | null;
    rejection_reason?: string | null;
    approved_at?: string | null;
    created_at?: string | null;
}

export interface CreateLeaveDTO {
    user_id: number;
    leave_date?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    leave_type?: LeaveType | undefined;
    start_day_type?: LeaveType | undefined;
    end_day_type?: LeaveType | undefined;
    status?: LeaveStatus | undefined;
    approver_id?: number | null | undefined;
}

