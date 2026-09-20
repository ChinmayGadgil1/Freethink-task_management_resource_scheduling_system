import type { Project, Task, ResourceUser, ResourceWorkload } from '@/services/api';
import {
  computeProjectScheduleHealth,
  computeResourceMetrics,
  computeResourcePerformanceData,
} from '@/components/analytics/analyticsCalculations';
import { isVerificationTask } from '@/utils/taskHelpers';

/**
 * Safely extracts a clean 'YYYY-MM-DD' date string from any ISO, datetime, or date representation.
 */
export function extractDateOnly(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;
  const part = trimmed.split('T')[0]!.split(' ')[0]!;
  return part || null;
}

// --- Report 1: Project Progress ---
export interface ProjectProgressReportRow {
  projectId: number;
  name: string;
  status: string;
  priority: string;
  startDate: string;
  deadline: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  scheduledTasks: number;
  unassignedTasks: number;
  expectedEffort: number;
  actualEffort: number;
  effortVariance: number;
  health: 'On Track' | 'At Risk' | 'Behind';
  healthColor: string;
}

export interface ProjectProgressReportSummary {
  activeProjects: number;
  averageProgress: number;
  onTrackCount: number;
  slippingCount: number;
  totalProjects: number;
}

export function computeProjectProgressReport(
  projects: Project[],
  tasks: Task[],
): {
  rows: ProjectProgressReportRow[];
  summary: ProjectProgressReportSummary;
} {
  const healthList = computeProjectScheduleHealth(projects);
  const healthMap = new Map(healthList.map((h) => [h.projectId, h]));

  const rows: ProjectProgressReportRow[] = projects.map((p) => {
    const projTasks = tasks.filter((t) => t.project_id === p.project_id && !isVerificationTask(t));
    const totalTasks = projTasks.length;
    const completedTasks = projTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressTasks = projTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const scheduledTasks = projTasks.filter((t) => t.status === 'SCHEDULED').length;
    const unassignedTasks = projTasks.filter((t) => t.status === 'UNASSIGNED').length;

    const expectedEffort =
      Math.round(projTasks.reduce((sum, t) => sum + (Number(t.expected_effort) || 0), 0) * 10) / 10;
    const actualEffort =
      Math.round(projTasks.reduce((sum, t) => sum + (Number(t.actual_effort) || 0), 0) * 10) / 10;
    const effortVariance = Math.round((actualEffort - expectedEffort) * 10) / 10;

    const h = healthMap.get(p.project_id);
    const health = h?.health || 'On Track';
    const healthColor = h?.healthColor || '#32A56B';

    return {
      projectId: p.project_id,
      name: p.name,
      status: p.status,
      priority: p.priority,
      startDate: extractDateOnly(p.start_date) || '—',
      deadline: extractDateOnly(p.deadline) || '—',
      progress: Math.round(Number(p.progress) || 0),
      totalTasks,
      completedTasks,
      inProgressTasks,
      scheduledTasks,
      unassignedTasks,
      expectedEffort,
      actualEffort,
      effortVariance,
      health,
      healthColor,
    };
  });

  const active = rows.filter(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'ARCHIVED',
  );
  const activeProjects = active.length;
  const averageProgress =
    active.length > 0
      ? Math.round(active.reduce((acc, r) => acc + r.progress, 0) / active.length)
      : rows.length > 0
        ? Math.round(rows.reduce((acc, r) => acc + r.progress, 0) / rows.length)
        : 0;

  const onTrackCount = rows.filter((r) => r.health === 'On Track').length;
  const slippingCount = rows.filter((r) => r.health === 'At Risk' || r.health === 'Behind').length;

  return {
    rows,
    summary: {
      activeProjects,
      averageProgress,
      onTrackCount,
      slippingCount,
      totalProjects: rows.length,
    },
  };
}

// --- Report 2: Task Completion ---
export interface TaskCompletionReportRow {
  taskId: number;
  title: string;
  projectId: number;
  projectName: string;
  assignedResources: string;
  status: string;
  completionDate: string;
  expectedEffort: number;
  actualEffort: number;
  effortVariance: number;
  onTimeStatus: 'On Time' | 'Late' | 'No Deadline';
  turnaroundDays: number | null;
}

export interface TaskCompletionReportSummary {
  completedTasksCount: number;
  totalTasksCount: number;
  completionRate: number;
  avgTurnaroundDays: number;
  onTimeCount: number;
  lateCount: number;
}

export function computeTaskCompletionReport(
  tasks: Task[],
  projects: Project[],
): {
  rows: TaskCompletionReportRow[];
  summary: TaskCompletionReportSummary;
} {
  const projectMap = new Map(projects.map((p) => [p.project_id, p.name]));
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' && !isVerificationTask(t));

  let totalTurnaroundDays = 0;
  let turnaroundCount = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  const rows: TaskCompletionReportRow[] = completedTasks.map((t) => {
    const expectedEffort = Math.round((Number(t.expected_effort) || 0) * 10) / 10;
    const actualEffort = Math.round((Number(t.actual_effort) || 0) * 10) / 10;
    const effortVariance = Math.round((actualEffort - expectedEffort) * 10) / 10;

    const completionDate = extractDateOnly(t.actual_end) || extractDateOnly(t.updated_at) || '—';

    let onTimeStatus: 'On Time' | 'Late' | 'No Deadline' = 'No Deadline';
    const dline = extractDateOnly(t.deadline);
    if (dline && completionDate !== '—') {
      if (completionDate <= dline) {
        onTimeStatus = 'On Time';
        onTimeCount++;
      } else {
        onTimeStatus = 'Late';
        lateCount++;
      }
    }

    let turnaroundDays: number | null = null;
    const startDateStr = extractDateOnly(t.actual_start || t.planned_start || t.created_at);
    if (startDateStr && completionDate !== '—') {
      const sMs = new Date(startDateStr).getTime();
      const eMs = new Date(completionDate).getTime();
      if (!isNaN(sMs) && !isNaN(eMs) && eMs >= sMs) {
        turnaroundDays = Math.max(0, Math.round((eMs - sMs) / (1000 * 60 * 60 * 24)));
        totalTurnaroundDays += turnaroundDays;
        turnaroundCount++;
      }
    }

    let assignedResources = 'Unassigned';
    if (Array.isArray(t.assigned_resources) && t.assigned_resources.length > 0) {
      assignedResources = t.assigned_resources
        .map((r) =>
          typeof r === 'object' && r !== null ? r.name || `User #${r.user_id}` : String(r),
        )
        .join(', ');
    } else if (Array.isArray(t.assigned_resource_names) && t.assigned_resource_names.length > 0) {
      assignedResources = t.assigned_resource_names.join(', ');
    }

    return {
      taskId: t.task_id,
      title: t.title,
      projectId: t.project_id,
      projectName: projectMap.get(t.project_id) || `Project #${t.project_id}`,
      assignedResources,
      status: t.status,
      completionDate,
      expectedEffort,
      actualEffort,
      effortVariance,
      onTimeStatus,
      turnaroundDays,
    };
  });

  const completedTasksCount = completedTasks.length;
  const totalTasksCount = tasks.length;
  const completionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const avgTurnaroundDays =
    turnaroundCount > 0 ? Math.round((totalTurnaroundDays / turnaroundCount) * 10) / 10 : 0;

  return {
    rows,
    summary: {
      completedTasksCount,
      totalTasksCount,
      completionRate,
      avgTurnaroundDays,
      onTimeCount,
      lateCount,
    },
  };
}

// --- Report 3: Delayed Tasks ---
export interface DelayedTaskReportRow {
  taskId: number;
  title: string;
  projectId: number;
  projectName: string;
  assignees: string;
  deadline: string;
  plannedEnd: string;
  daysOverdue: number;
  expectedEffort: number;
  actualEffort: number;
  effortOverrun: number;
  isDeadlineAtRisk: boolean;
  isScheduleAtRisk: boolean;
  delayTypes: string[];
}

export function computeDelayedTasksReport(
  tasks: Task[],
  projects: Project[],
): {
  rows: DelayedTaskReportRow[];
  totalDelayed: number;
  totalOverdue: number;
  totalOverrun: number;
} {
  const projectMap = new Map(projects.map((p) => [p.project_id, p.name]));
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMs = new Date(todayStr).getTime();

  let totalOverdue = 0;
  let totalOverrun = 0;

  const rows: DelayedTaskReportRow[] = [];

  tasks.forEach((t) => {
    // Exclude verification sub-tasks and completed tasks
    if (isVerificationTask(t)) return;
    if (t.status === 'COMPLETED') return;

    const deadlineStr = extractDateOnly(t.deadline);
    const isPastDeadline = Boolean(deadlineStr && deadlineStr < todayStr);

    const expected = Number(t.expected_effort) || 0;
    const actual = Number(t.actual_effort) || 0;
    const isEffortOverrun = actual > expected;

    const isDeadlineRisk = Boolean(t.is_deadline_at_risk);
    const isScheduleRisk = Boolean(t.is_schedule_at_risk);

    const isDelayed = isPastDeadline || isEffortOverrun || isDeadlineRisk || isScheduleRisk;

    if (!isDelayed) return;

    const delayTypes: string[] = [];
    if (isPastDeadline) {
      delayTypes.push('Overdue Deadline');
      totalOverdue++;
    }
    if (isDeadlineRisk) delayTypes.push('Deadline Slippage');
    if (isScheduleRisk) delayTypes.push('Schedule Bottleneck');
    if (isEffortOverrun) {
      delayTypes.push('Effort Overrun');
      totalOverrun++;
    }

    let daysOverdue = 0;
    if (deadlineStr && deadlineStr < todayStr) {
      const dMs = new Date(deadlineStr).getTime();
      daysOverdue = Math.max(0, Math.round((nowMs - dMs) / (1000 * 60 * 60 * 24)));
    } else if (t.planned_end && deadlineStr) {
      const pEndStr = extractDateOnly(t.planned_end);
      if (pEndStr && pEndStr > deadlineStr) {
        const pMs = new Date(pEndStr).getTime();
        const dMs = new Date(deadlineStr).getTime();
        daysOverdue = Math.max(0, Math.round((pMs - dMs) / (1000 * 60 * 60 * 24)));
      }
    }

    let assignees = 'Unassigned';
    if (Array.isArray(t.assigned_resources) && t.assigned_resources.length > 0) {
      assignees = t.assigned_resources
        .map((r) =>
          typeof r === 'object' && r !== null ? r.name || `User #${r.user_id}` : String(r),
        )
        .join(', ');
    } else if (Array.isArray(t.assigned_resource_names) && t.assigned_resource_names.length > 0) {
      assignees = t.assigned_resource_names.join(', ');
    }

    rows.push({
      taskId: t.task_id,
      title: t.title,
      projectId: t.project_id,
      projectName: projectMap.get(t.project_id) || `Project #${t.project_id}`,
      assignees,
      deadline: deadlineStr || '—',
      plannedEnd: extractDateOnly(t.planned_end) || '—',
      daysOverdue,
      expectedEffort: expected,
      actualEffort: actual,
      effortOverrun: Math.max(0, Math.round((actual - expected) * 10) / 10),
      isDeadlineAtRisk: isDeadlineRisk,
      isScheduleAtRisk: isScheduleRisk,
      delayTypes,
    });
  });

  return {
    rows,
    totalDelayed: rows.length,
    totalOverdue,
    totalOverrun,
  };
}

// --- Report 4: Resource Workload ---
export interface ResourceWorkloadReportRow {
  resourceId: number;
  name: string;
  role: string;
  assignedTasksCount: number;
  scheduledEffort: number;
  weeklyCapacity: number;
  availableHeadroom: number;
  workloadPercent: number;
  status: 'Normal' | 'Overloaded' | 'Underutilized';
}

export function computeResourceWorkloadReport(
  resources: ResourceUser[],
  workloadsMap: Record<number, ResourceWorkload | null>,
  tasks: Task[],
  selectedProjectId?: number | 'ALL',
): {
  rows: ResourceWorkloadReportRow[];
  totalCapacity: number;
  totalScheduled: number;
  totalHeadroom: number;
  overloadedCount: number;
} {
  const metrics = computeResourceMetrics(resources, workloadsMap, tasks, selectedProjectId);

  const rows: ResourceWorkloadReportRow[] = metrics.items.map((item) => {
    let assignedTasksCount: number;
    if (selectedProjectId && selectedProjectId !== 'ALL') {
      assignedTasksCount = tasks.filter(
        (t) =>
          !isVerificationTask(t) &&
          t.project_id === selectedProjectId &&
          t.status !== 'COMPLETED' &&
          (t.assigned_resource_ids?.includes(item.resourceId) ||
            t.assigned_resources?.some((ar) => ar.user_id === item.resourceId)),
      ).length;
    } else {
      assignedTasksCount = tasks.filter(
        (t) =>
          !isVerificationTask(t) &&
          t.status !== 'COMPLETED' &&
          (t.assigned_resource_ids?.includes(item.resourceId) ||
            t.assigned_resources?.some((ar) => ar.user_id === item.resourceId)),
      ).length;
    }

    const status: 'Normal' | 'Overloaded' | 'Underutilized' =
      item.utilization > 85 ? 'Overloaded' : item.utilization < 50 ? 'Underutilized' : 'Normal';

    return {
      resourceId: item.resourceId,
      name: item.name,
      role: item.role,
      assignedTasksCount,
      scheduledEffort: item.assignedHours,
      weeklyCapacity: item.weeklyCapacity,
      availableHeadroom: item.remainingHeadroom,
      workloadPercent: item.utilization,
      status,
    };
  });

  const totalCapacity = rows.reduce((acc, r) => acc + r.weeklyCapacity, 0);
  const totalScheduled = rows.reduce((acc, r) => acc + r.scheduledEffort, 0);
  const totalHeadroom = rows.reduce((acc, r) => acc + r.availableHeadroom, 0);
  const overloadedCount = rows.filter((r) => r.status === 'Overloaded').length;

  return {
    rows,
    totalCapacity,
    totalScheduled: Math.round(totalScheduled * 10) / 10,
    totalHeadroom: Math.round(totalHeadroom * 10) / 10,
    overloadedCount,
  };
}

// --- Report 5: Resource Utilization ---
export interface ResourceUtilizationReportRow {
  resourceId: number;
  name: string;
  role: string;
  weeklyCapacity: number;
  scheduledHours: number;
  loggedHours: number;
  utilizationPercent: number;
  category: 'Underutilized' | 'Optimal' | 'Overloaded';
}

export function computeResourceUtilizationReport(
  resources: ResourceUser[],
  tasks: Task[],
  workloadsMap: Record<number, ResourceWorkload | null>,
): {
  rows: ResourceUtilizationReportRow[];
  averageUtilization: number;
  optimalCount: number;
  overloadedCount: number;
  underutilizedCount: number;
} {
  const perfData = computeResourcePerformanceData(resources, tasks, workloadsMap);

  const rows: ResourceUtilizationReportRow[] = perfData.rows.map((row) => {
    const category: 'Underutilized' | 'Optimal' | 'Overloaded' =
      row.utilization > 85 ? 'Overloaded' : row.utilization < 50 ? 'Underutilized' : 'Optimal';

    return {
      resourceId: row.resourceId,
      name: row.name,
      role: row.role,
      weeklyCapacity: row.weeklyCapacity,
      scheduledHours: row.assignedHours,
      loggedHours: row.actualEffort,
      utilizationPercent: row.utilization,
      category,
    };
  });

  const totalUtilization = rows.reduce((acc, r) => acc + r.utilizationPercent, 0);
  const averageUtilization = rows.length > 0 ? Math.round(totalUtilization / rows.length) : 0;
  const optimalCount = rows.filter((r) => r.category === 'Optimal').length;
  const overloadedCount = rows.filter((r) => r.category === 'Overloaded').length;
  const underutilizedCount = rows.filter((r) => r.category === 'Underutilized').length;

  return {
    rows,
    averageUtilization,
    optimalCount,
    overloadedCount,
    underutilizedCount,
  };
}

// --- Report 6: Deadline Variance ---
export interface DeadlineVarianceReportRow {
  taskId: number;
  title: string;
  projectId: number;
  projectName: string;
  deadline: string;
  plannedEnd: string;
  actualEnd: string;
  status: string;
  varianceDays: number;
  category: 'Ahead' | 'On Time' | 'Delayed';
}

export function computeDeadlineVarianceReport(
  tasks: Task[],
  projects: Project[],
): {
  rows: DeadlineVarianceReportRow[];
  aheadCount: number;
  onTimeCount: number;
  delayedCount: number;
} {
  const projectMap = new Map(projects.map((p) => [p.project_id, p.name]));
  let aheadCount = 0;
  let onTimeCount = 0;
  let delayedCount = 0;

  const rows: DeadlineVarianceReportRow[] = [];

  tasks.forEach((t) => {
    if (isVerificationTask(t)) return;
    const deadlineStr = extractDateOnly(t.deadline);
    if (!deadlineStr) return;

    const deadlineMs = new Date(deadlineStr).getTime();

    let comparisonDateStr: string | null = null;
    if (t.status === 'COMPLETED' && t.actual_end) {
      comparisonDateStr = extractDateOnly(t.actual_end);
    } else if (t.planned_end) {
      comparisonDateStr = extractDateOnly(t.planned_end);
    }

    if (!comparisonDateStr) return;

    const compMs = new Date(comparisonDateStr).getTime();
    const diffMs = compMs - deadlineMs;
    const varianceDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let category: 'Ahead' | 'On Time' | 'Delayed';
    if (varianceDays < 0) {
      category = 'Ahead';
      aheadCount++;
    } else if (varianceDays > 0) {
      category = 'Delayed';
      delayedCount++;
    } else {
      category = 'On Time';
      onTimeCount++;
    }

    rows.push({
      taskId: t.task_id,
      title: t.title,
      projectId: t.project_id,
      projectName: projectMap.get(t.project_id) || `Project #${t.project_id}`,
      deadline: deadlineStr,
      plannedEnd: extractDateOnly(t.planned_end) || '—',
      actualEnd: extractDateOnly(t.actual_end) || '—',
      status: t.status,
      varianceDays,
      category,
    });
  });

  return {
    rows,
    aheadCount,
    onTimeCount,
    delayedCount,
  };
}

// --- Report 7: Current Schedule Snapshot (Transparent Schedule Baseline) ---
export interface ScheduleSnapshotRow {
  taskId: number;
  title: string;
  projectId: number;
  projectName: string;
  plannedStart: string;
  plannedEnd: string;
  deadline: string;
  status: string;
  scheduleHealth: string;
}

export function computeScheduleSnapshotReport(
  tasks: Task[],
  projects: Project[],
): ScheduleSnapshotRow[] {
  const projectMap = new Map(projects.map((p) => [p.project_id, p.name]));

  return tasks
    .filter((t) => !isVerificationTask(t))
    .map((t) => {
      let scheduleHealth = 'On Schedule';
      if (t.status === 'COMPLETED') {
        scheduleHealth = 'Completed';
      } else if (t.is_deadline_at_risk) {
        scheduleHealth = 'Deadline Slipping';
      } else if (t.is_schedule_at_risk) {
        scheduleHealth = 'Schedule At Risk';
      }

      return {
        taskId: t.task_id,
        title: t.title,
        projectId: t.project_id,
        projectName: projectMap.get(t.project_id) || `Project #${t.project_id}`,
        plannedStart: extractDateOnly(t.planned_start) || '—',
        plannedEnd: extractDateOnly(t.planned_end) || '—',
        deadline: extractDateOnly(t.deadline) || '—',
        status: t.status,
        scheduleHealth,
      };
    });
}
