export type TaskStatus = 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ResourceTask {
  id: number;
  name: string;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  deadline: string | null;
  hoursWorked: number;
  estimatedHours: number;
  workUpdate: string;
  description?: string | null;
}
