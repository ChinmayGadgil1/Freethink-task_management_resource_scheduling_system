export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PARTIALLY_COMPLETED' | 'COMPLETED'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface ResourceTask {
  id: number
  name: string
  project: string
  priority: TaskPriority
  status: TaskStatus
  progress: number
  deadline: string // ISO date
  hoursWorked: number
  estimatedHours: number
  workUpdate: string
}
