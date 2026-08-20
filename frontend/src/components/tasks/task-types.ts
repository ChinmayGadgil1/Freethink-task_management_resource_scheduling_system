export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ResourceTask {
  id: number;
  name: string;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  deadline: string | null;
  startDate: string | null;
  hoursWorked: number;
  estimatedHours: number;
  workUpdate: string;
  description?: string | null;
}
