export type ProjectStatus =
    | "DRAFT"
    | "PUBLISHED"
    | "ACTIVE"
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
    created_at: Date;
    updated_at: Date;
}