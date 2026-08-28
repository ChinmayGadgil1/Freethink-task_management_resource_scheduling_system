/**
 * Check whether a task is past its deadline and not yet completed.
 */
export function isTaskOverdue(
  task: { deadline?: string | null; status?: string | null } | null | undefined,
): boolean {
  if (!task || !task.deadline) return false;
  if (task.status === 'COMPLETED') return false;
  const deadlineDate = new Date(task.deadline);
  if (isNaN(deadlineDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

/**
 * Drop-in alias for isTaskOverdue.
 */
export const isOverdue = isTaskOverdue;

/**
 * Standard CSS status chip class mapping.
 */
export function getTaskStatusClass(status: string | null | undefined): string {
  if (status === 'COMPLETED') return 'chip-soft-green';
  if (status === 'IN_PROGRESS') return 'chip-soft-blue';
  if (status === 'SCHEDULED') return 'chip-soft-purple';
  return 'chip-soft-grey';
}

/**
 * Standard CSS priority chip class mapping.
 */
export function getPriorityClass(priority: string | null | undefined): string {
  const p = (priority || '').toUpperCase();
  if (p === 'CRITICAL') return 'chip-soft-red';
  if (p === 'HIGH') return 'chip-soft-orange';
  if (p === 'MEDIUM') return 'chip-soft-blue';
  return 'chip-soft-purple';
}

/**
 * Normalize priority enum/string to Gantt-compatible titlecase format.
 */
export function normalizePriority(
  priority: string | null | undefined,
): 'Low' | 'Medium' | 'High' | 'Critical' {
  const up = (priority || '').toUpperCase();
  if (up === 'CRITICAL') return 'Critical';
  if (up === 'HIGH') return 'High';
  if (up === 'LOW') return 'Low';
  return 'Medium';
}

/**
 * Automatically determine task status from its progress percentage:
 * - 0%  -> 'SCHEDULED'
 * - 100% -> 'COMPLETED'
 * - 1-99% -> 'IN_PROGRESS'
 */
export function getStatusFromProgress(
  progress: number | string | null | undefined,
): 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' {
  const prog = Number(progress) || 0;
  if (prog <= 0) return 'SCHEDULED';
  if (prog >= 100) return 'COMPLETED';
  return 'IN_PROGRESS';
}

/**
 * Get human-readable label for a task status.
 */
export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Scheduled';
  const s = status.toUpperCase();
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'SCHEDULED') return 'Scheduled';
  if (s === 'UNASSIGNED') return 'Unassigned';
  return status.replace(/_/g, ' ');
}
