export type TaskStatus = 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
    task_id: number;
    project_id: number;
    title: string;
    description: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    deadline: string | null;   // ISO Date string (YYYY-MM-DD)
    planned_start?: string | null;
    planned_end?: string | null;
    actual_start: string | null; // ISO Date string (YYYY-MM-DD)
    actual_end: string | null;   // ISO Date string (YYYY-MM-DD)
    expected_effort: number;   // in hours
    actual_effort: number;     // in hours
    progress: number;          // percentage 0 to 100
    is_schedule_at_risk?: boolean;
    is_deadline_at_risk?: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface TaskAssignment {
    task_id: number;
    user_id: number;
    created_at: Date;
}

export interface TaskDependency {
    task_id: number;
    predecessor_task_id: number;
}

export interface TaskProgressLog {
    log_id: number;
    task_id: number;
    user_id: number;
    progress_percentage: number;
    status: TaskStatus;
    update_details: string | null;
    logged_date: string;       // ISO Date string (YYYY-MM-DD)
    created_at: Date;
}
