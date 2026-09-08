export type ProjectStatus =
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "ON_HOLD"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED";

export type ProjectPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

export interface Project {
    project_id: number;
    project_manager_id: number;
    name: string;
    description: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: Date | null;
    deadline: Date | null;
    progress: number;
    deleted_at?: Date | string | null;
    created_at: Date;
    updated_at: Date;
}