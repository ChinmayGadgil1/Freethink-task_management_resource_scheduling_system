export interface UserLeave {
    leave_id: number;
    user_id: number;
    leave_date: string; // ISO date string (YYYY-MM-DD)
    leave_hours: number;
}

export interface CreateLeaveDTO {
    user_id: number;
    leave_date: string;
    leave_hours?: number | undefined;
}
