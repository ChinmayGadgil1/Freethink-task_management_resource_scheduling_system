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
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}