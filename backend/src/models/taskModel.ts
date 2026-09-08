export type TaskStatus = 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PredecessorTaskInfo {
    task_id: number;
    project_id: number;
    project_name?: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: string | null;
    planned_start?: string | null;
    planned_end?: string | null;
    expected_effort: number;
    actual_effort: number;
    progress: number;
    is_schedule_at_risk?: boolean;
    is_deadline_at_risk?: boolean;
    assigned_resource_names?: string[];
    supervisor_name?: string | null;
}

export interface Task {
    task_id: number;
    project_id: number;
    created_by?: number;
    created_by_name?: string | null;
    created_by_role?: string | null;
    supervisor_id?: number | null;
    supervisor_name?: string | null;
    supervisor_email?: string | null;
    title: string;
    description: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    deadline: string | null;   // ISO Date string (YYYY-MM-DD)
    planned_start?: string | null; // ISO Datetime string (YYYY-MM-DD HH:mm:ss)
    planned_end?: string | null;   // ISO Datetime string (YYYY-MM-DD HH:mm:ss)
    actual_start: string | null; // ISO Datetime string (YYYY-MM-DD HH:mm:ss)
    actual_end: string | null;   // ISO Datetime string (YYYY-MM-DD HH:mm:ss)
    expected_effort: number;   // in hours
    actual_effort: number;     // in hours
    progress: number;          // percentage 0 to 100
    is_schedule_at_risk?: boolean;
    is_deadline_at_risk?: boolean;
    assigned_resource_ids?: number[];
    assigned_resource_names?: string[];
    predecessor_task_ids?: number[];
    predecessors?: PredecessorTaskInfo[];
    deleted_at?: Date | string | null;
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
