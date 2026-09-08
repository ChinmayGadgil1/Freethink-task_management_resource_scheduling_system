import type {
  Project,
  ResourceUser,
  Task,
  ResourceWorkload,
  ResourceAvailabilityResponseDTO,
} from '@/services/api';
import { calculateResourceWeeklyCapacity } from '@/services/api';

export const ANALYTICS_PALETTE = {
  primary: '#7654D6',
  blue: '#3F7FD5',
  teal: '#16A6A1',
  green: '#32A56B',
  warning: '#F08A24',
  danger: '#E05260',
  darkText: '#1D2433',
  mutedText: '#697386',
  border: '#E6E8ED',
  gridLine: '#F0F2F5',
  cardBg: '#FFFFFF',
} as const;

export interface ResourceMetricItem {
  resourceId: number;
  name: string;
  role: string;
  utilization: number;
  assignedHours: number;
  weeklyCapacity: number;
  remainingHeadroom: number;
  isOverloaded: boolean;
  isEligibleForDispatch: boolean;
}

export interface TaskDistributionItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ProjectScheduleHealthItem {
  projectId: number;
  name: string;
  actualProgress: number;
  plannedPace: number;
  deadline: string;
  health: 'On Track' | 'At Risk' | 'Behind';
  healthColor: string;
}

export interface TaskEffortVarianceItem {
  taskId: number;
  title: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
  isOverrun: boolean;
}

export interface HeatmapGridData {
  days: string[];
  resources: string[];
  matrix: [number, number, number][]; // [dayIndex, resourceIndex, statusLevel (0: Free, 1: Partial, 2: High, 3: Booked)]
  details: Record<string, { label: string; hours: number }>;
}

export interface MilestoneItem {
  taskId: number;
  title: string;
  projectName: string;
  deadline: string;
  health: 'On Track' | 'At Risk' | 'Behind';
  healthColor: string;
}

/**
 * Returns Monday through Friday dates for the current calendar week.
 */
export function getCurrentWeekWorkingDays(): { dateStr: string; dayLabel: string }[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (currentDay + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const days: { dateStr: string; dayLabel: string }[] = [];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0]!;
    days.push({ dateStr, dayLabel: labels[i] ?? `Day ${i + 1}` });
  }
  return days;
}

/**
 * Derives comprehensive resource workload & capacity metrics from live backend data.
 */
export function computeResourceMetrics(
  resources: ResourceUser[],
  workloadsMap: Record<number, ResourceWorkload | null>,
  tasks: Task[],
  selectedProjectId?: number | 'ALL',
): {
  items: ResourceMetricItem[];
  averageUtilization: number;
  totalAvailableHeadroom: number;
  overloadedCount: number;
} {
  let totalAssignedHours = 0;
  let totalCapacityHours = 0;
  let totalHeadroom = 0;
  let overloadedCount = 0;

  const isProjectFiltered = Boolean(selectedProjectId && selectedProjectId !== 'ALL');

  const items: ResourceMetricItem[] = resources.map((r) => {
    const weeklyCapacity = calculateResourceWeeklyCapacity(r) || 40;
    const workload = workloadsMap[r.user_id];

    let scheduledEffort: number;

    if (isProjectFiltered) {
      // Filter tasks to only those belonging to the selected project and assigned to this resource
      const userProjectTasks = tasks.filter(
        (t) =>
          t.project_id === selectedProjectId &&
          (t.assigned_resource_ids?.includes(r.user_id) ||
            t.assigned_resources?.some((ar) => ar.user_id === r.user_id)),
      );

      scheduledEffort = userProjectTasks.reduce(
        (sum, t) =>
          sum +
          (t.status === 'COMPLETED'
            ? 0
            : Math.max(0, (Number(t.expected_effort) || 0) - (Number(t.actual_effort) || 0))),
        0,
      );
    } else {
      if (workload?.daily_allocations && workload.daily_allocations.length > 0) {
        scheduledEffort = workload.daily_allocations.reduce(
          (sum, d) => sum + (Number(d.allocated_hours) || 0),
          0,
        );
      } else if (workload?.tasks && workload.tasks.length > 0) {
        scheduledEffort = workload.tasks.reduce(
          (sum, t) =>
            sum + Math.max(0, (Number(t.expected_effort) || 0) - (Number(t.actual_effort) || 0)),
          0,
        );
      } else {
        const userTasks = tasks.filter(
          (t) =>
            t.status !== 'COMPLETED' &&
            (t.assigned_resource_ids?.includes(r.user_id) ||
              t.assigned_resources?.some((ar) => ar.user_id === r.user_id)),
        );
        scheduledEffort = userTasks.reduce(
          (sum, t) =>
            sum + Math.max(0, (Number(t.expected_effort) || 0) - (Number(t.actual_effort) || 0)),
          0,
        );
      }
    }

    const assignedHours = Math.round(scheduledEffort * 10) / 10;
    const utilization = Math.round((assignedHours / Math.max(1, weeklyCapacity)) * 100);
    const remainingHeadroom = Math.max(0, weeklyCapacity - assignedHours);
    const isOverloaded = utilization > 85;
    const isEligibleForDispatch = remainingHeadroom >= 4;

    totalAssignedHours += assignedHours;
    totalCapacityHours += weeklyCapacity;
    totalHeadroom += remainingHeadroom;
    if (isOverloaded) overloadedCount++;

    return {
      resourceId: r.user_id,
      name: r.name,
      role: r.role === 'RESOURCE' ? 'Team Resource' : 'Project Manager',
      utilization,
      assignedHours,
      weeklyCapacity,
      remainingHeadroom,
      isOverloaded,
      isEligibleForDispatch,
    };
  });

  const averageUtilization =
    totalCapacityHours > 0 ? Math.round((totalAssignedHours / totalCapacityHours) * 100) : 0;

  return {
    items,
    averageUtilization,
    totalAvailableHeadroom: Math.round(totalHeadroom),
    overloadedCount,
  };
}

/**
 * Aggregates task distribution by status.
 */
export function computeTaskDistribution(tasks: Task[]): {
  items: TaskDistributionItem[];
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
} {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      items: [
        { status: 'COMPLETED', label: 'Completed', count: 0, percentage: 0, color: ANALYTICS_PALETTE.green },
        { status: 'IN_PROGRESS', label: 'In Progress', count: 0, percentage: 0, color: ANALYTICS_PALETTE.primary },
        { status: 'SCHEDULED', label: 'Scheduled', count: 0, percentage: 0, color: ANALYTICS_PALETTE.blue },
        { status: 'UNASSIGNED', label: 'On Hold / Queued', count: 0, percentage: 0, color: ANALYTICS_PALETTE.warning },
      ],
      totalTasks: 0,
      completedTasks: 0,
      completionPercent: 0,
    };
  }

  const counts: Record<string, number> = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    SCHEDULED: 0,
    UNASSIGNED: 0,
  };

  tasks.forEach((t) => {
    const s = t.status || 'UNASSIGNED';
    if (counts[s] !== undefined) {
      counts[s]++;
    } else {
      counts.UNASSIGNED = (counts.UNASSIGNED ?? 0) + 1;
    }
  });

  const completedTasks = counts.COMPLETED ?? 0;
  const completionPercent = Math.round((completedTasks / totalTasks) * 100);

  const items: TaskDistributionItem[] = [
    {
      status: 'COMPLETED',
      label: 'Completed',
      count: counts.COMPLETED ?? 0,
      percentage: Math.round(((counts.COMPLETED ?? 0) / totalTasks) * 100),
      color: ANALYTICS_PALETTE.green,
    },
    {
      status: 'IN_PROGRESS',
      label: 'In Progress',
      count: counts.IN_PROGRESS ?? 0,
      percentage: Math.round(((counts.IN_PROGRESS ?? 0) / totalTasks) * 100),
      color: ANALYTICS_PALETTE.primary,
    },
    {
      status: 'SCHEDULED',
      label: 'Scheduled',
      count: counts.SCHEDULED ?? 0,
      percentage: Math.round(((counts.SCHEDULED ?? 0) / totalTasks) * 100),
      color: ANALYTICS_PALETTE.blue,
    },
    {
      status: 'UNASSIGNED',
      label: 'On Hold / Queued',
      count: counts.UNASSIGNED ?? 0,
      percentage: Math.round(((counts.UNASSIGNED ?? 0) / totalTasks) * 100),
      color: ANALYTICS_PALETTE.warning,
    },
  ];

  return { items, totalTasks, completedTasks, completionPercent };
}

/**
 * Computes Project Schedule Health comparing actual progress vs. planned pace based on start and deadline dates.
 */
export function computeProjectScheduleHealth(projects: Project[]): ProjectScheduleHealthItem[] {
  const now = Date.now();

  return projects.map((p) => {
    const actualProgress = Math.round(Number(p.progress) || 0);

    let plannedPace = 50;
    if (p.start_date && p.deadline) {
      const startMs = new Date(p.start_date).getTime();
      const deadlineMs = new Date(p.deadline).getTime();
      const totalDuration = deadlineMs - startMs;

      if (totalDuration > 0) {
        const elapsed = now - startMs;
        plannedPace = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
      }
    } else if (p.status === 'COMPLETED') {
      plannedPace = 100;
    }

    let health: 'On Track' | 'At Risk' | 'Behind' = 'On Track';
    let healthColor: string = ANALYTICS_PALETTE.green;

    if (actualProgress < plannedPace - 15) {
      health = 'Behind';
      healthColor = ANALYTICS_PALETTE.danger;
    } else if (actualProgress < plannedPace - 5) {
      health = 'At Risk';
      healthColor = ANALYTICS_PALETTE.warning;
    }

    const deadlineFormatted = p.deadline ? p.deadline.split('T')[0]! : 'No deadline';

    return {
      projectId: p.project_id,
      name: p.name,
      actualProgress,
      plannedPace,
      deadline: deadlineFormatted,
      health,
      healthColor,
    };
  });
}

/**
 * Compares Planned vs Actual effort for tasks that have logged effort or are in progress/completed.
 */
export function computeEffortVariance(tasks: Task[]): TaskEffortVarianceItem[] {
  const applicableTasks = tasks.filter(
    (t) => Number(t.expected_effort) > 0 || Number(t.actual_effort) > 0,
  );

  return applicableTasks
    .map((t) => {
      const plannedHours = Math.round(Number(t.expected_effort) || 0);
      const actualHours = Math.round(Number(t.actual_effort) || 0);
      const variance = actualHours - plannedHours;
      const isOverrun = actualHours > plannedHours;

      return {
        taskId: t.task_id,
        title: t.title,
        plannedHours,
        actualHours,
        variance,
        isOverrun,
      };
    })
    .sort((a, b) => b.plannedHours - a.plannedHours)
    .slice(0, 7); // Show top 7 key deliverables for clean bar readability
}

/**
 * Generates the Resource Availability Heatmap grid from real availability responses or daily allocations.
 */
export function computeAvailabilityHeatmap(
  resources: ResourceUser[],
  availabilityMap: Record<number, ResourceAvailabilityResponseDTO | null>,
  workloadsMap: Record<number, ResourceWorkload | null>,
): HeatmapGridData {
  const workingDays = getCurrentWeekWorkingDays();
  const dayLabels = workingDays.map((d) => d.dayLabel);
  const resourceNames = resources.map((r) => r.name);
  const matrix: [number, number, number][] = [];
  const details: Record<string, { label: string; hours: number }> = {};

  resources.forEach((r, resIdx) => {
    const availDto = availabilityMap[r.user_id];
    const workload = workloadsMap[r.user_id];

    workingDays.forEach((wd, dayIdx) => {
      let statusLevel: 0 | 1 | 2 | 3 = 0; // 0: Free, 1: Partial, 2: High, 3: Booked
      let statusText = 'Available';
      let allocatedHours = 0;

      if (availDto?.days && availDto.days.length > 0) {
        const matchedDay = availDto.days.find((d) => d.date === wd.dateStr);
        if (matchedDay) {
          allocatedHours = matchedDay.allocated_hours;
          if (matchedDay.status === 'FULLY_BOOKED') {
            statusLevel = 3;
            statusText = 'Fully Booked';
          } else if (matchedDay.status === 'ON_LEAVE' || matchedDay.status === 'PARTIAL_LEAVE') {
            statusLevel = 3;
            statusText = matchedDay.status === 'ON_LEAVE' ? 'On Leave' : 'Partial Leave';
          } else if (matchedDay.status === 'NON_WORKING_DAY' || matchedDay.status === 'HOLIDAY') {
            statusLevel = 3;
            statusText = matchedDay.status === 'HOLIDAY' ? 'Holiday' : 'Non-Working';
          } else if (matchedDay.allocated_hours >= 6) {
            statusLevel = 2;
            statusText = 'High Load';
          } else if (matchedDay.allocated_hours > 0) {
            statusLevel = 1;
            statusText = 'Moderate';
          } else {
            statusLevel = 0;
            statusText = 'Available';
          }
        }
      } else if (workload?.daily_allocations) {
        // Fallback from daily allocations in workload
        const matchedAlloc = workload.daily_allocations.find((d) => d.date === wd.dateStr);
        allocatedHours = matchedAlloc ? Number(matchedAlloc.allocated_hours) || 0 : 0;
        if (allocatedHours >= 8) {
          statusLevel = 3;
          statusText = 'Fully Booked';
        } else if (allocatedHours >= 5) {
          statusLevel = 2;
          statusText = 'High Load';
        } else if (allocatedHours > 0) {
          statusLevel = 1;
          statusText = 'Moderate';
        } else {
          statusLevel = 0;
          statusText = 'Available';
        }
      }

      matrix.push([dayIdx, resIdx, statusLevel]);
      details[`${dayIdx}_${resIdx}`] = {
        label: statusText,
        hours: allocatedHours,
      };
    });
  });

  return {
    days: dayLabels,
    resources: resourceNames,
    matrix,
    details,
  };
}

/**
 * Derives upcoming milestones and risks from tasks approaching deadline.
 */
export function computeUpcomingMilestones(
  tasks: Task[],
  projects: Project[],
): MilestoneItem[] {
  const projectMap = new Map<number, string>();
  projects.forEach((p) => projectMap.set(p.project_id, p.name));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return tasks
    .filter((t) => t.deadline && t.status !== 'COMPLETED')
    .map((t) => {
      const deadlineDate = new Date(t.deadline!);
      const isOverdue = deadlineDate < now;
      const progress = Number(t.progress) || 0;

      let health: 'On Track' | 'At Risk' | 'Behind' = 'On Track';
      let healthColor: string = ANALYTICS_PALETTE.green;

      if (isOverdue || (progress < 50 && (deadlineDate.getTime() - now.getTime()) / 86400000 < 3)) {
        health = 'Behind';
        healthColor = ANALYTICS_PALETTE.danger;
      } else if (progress < 80 && (deadlineDate.getTime() - now.getTime()) / 86400000 < 7) {
        health = 'At Risk';
        healthColor = ANALYTICS_PALETTE.warning;
      }

      return {
        taskId: t.task_id,
        title: t.title,
        projectName: projectMap.get(t.project_id) || `Project #${t.project_id}`,
        deadline: t.deadline ? t.deadline.split('T')[0]! : '-',
        health,
        healthColor,
      };
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);
}
