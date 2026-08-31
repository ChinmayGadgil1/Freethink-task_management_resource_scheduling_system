export type UserRole =
    | "PROJECT_MANAGER"
    | "RESOURCE";

export interface User {
    user_id: number;
    name: string;
    username: string;
    email: string;
    password_hash: string;
    role: UserRole;
    non_working_days?: string[] | string | null;
    daily_working_hours?: number;
    schedule_configured?: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}