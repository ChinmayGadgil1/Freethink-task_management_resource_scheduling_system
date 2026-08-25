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
