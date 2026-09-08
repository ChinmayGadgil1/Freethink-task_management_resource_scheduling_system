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

export interface ResourceUtilizationMetric {
  resourceId: number;
  name: string;
  role: string;
  utilizationPercent: number;
  assignedHours: number;
  weeklyCapacity: number;
  status: 'optimal' | 'under' | 'over';
}

export interface ResourceTrendMetric {
  resourceId: number;
  name: string;
  weeks: [number, number, number, number]; // 4 weeks of % load
}

export interface HeatmapCell {
  dayIndex: number; // 0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri
  resourceIndex: number; // 0 to 4
  hoursAllocated: number; // e.g. 0 to 8
  statusLevel: 0 | 1 | 2 | 3; // 0: Available, 1: Moderate, 2: High, 3: Fully Booked
}

export interface TaskStatusMetric {
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'ON_HOLD';
  label: string;
  count: number;
  color: string;
}

export interface ProjectScheduleMetric {
  projectId: number;
  name: string;
  actualProgress: number;
  plannedPace: number;
  health: 'On Track' | 'At Risk' | 'Behind';
  deadline: string;
  healthColor: string;
}

export interface TaskEffortMetric {
  taskName: string;
  plannedHours: number;
  actualHours: number;
  variance: number; // actual - planned
  isOverrun: boolean;
}

export interface CapacitySchedulingMetric {
  resourceId: number;
  name: string;
  role: string;
  totalCapacity: number;
  assignedEffort: number;
  remainingHeadroom: number;
  isAvailableForDispatch: boolean;
}

export interface AnalyticsSummaryKPIs {
  averageUtilization: number;
  availableHeadroomHours: number;
  taskCompletionPercent: number;
  overallocatedCount: number;
  projectsAtRiskCount: number;
}

// -------------------------------------------------------------
// Realistic Mock Datasets (Isolated Prototype)
// -------------------------------------------------------------

export const MOCK_SUMMARY_KPIS: AnalyticsSummaryKPIs = {
  averageUtilization: 71,
  availableHeadroomHours: 57,
  taskCompletionPercent: 41,
  overallocatedCount: 1,
  projectsAtRiskCount: 2,
};

export const MOCK_RESOURCE_UTILIZATION: ResourceUtilizationMetric[] = [
  {
    resourceId: 101,
    name: 'Alex Chen',
    role: 'Senior Full Stack',
    utilizationPercent: 85,
    assignedHours: 34,
    weeklyCapacity: 40,
    status: 'optimal',
  },
  {
    resourceId: 102,
    name: 'Priya Sharma',
    role: 'Backend Specialist',
    utilizationPercent: 72,
    assignedHours: 29,
    weeklyCapacity: 40,
    status: 'optimal',
  },
  {
    resourceId: 103,
    name: 'Marcus Vance',
    role: 'Frontend Engineer',
    utilizationPercent: 60,
    assignedHours: 24,
    weeklyCapacity: 40,
    status: 'under',
  },
  {
    resourceId: 104,
    name: 'Elena Rostova',
    role: 'DevOps & Systems',
    utilizationPercent: 45,
    assignedHours: 18,
    weeklyCapacity: 40,
    status: 'under',
  },
  {
    resourceId: 105,
    name: 'Sarah Jenkins',
    role: 'QA & Test Automation',
    utilizationPercent: 95,
    assignedHours: 38,
    weeklyCapacity: 40,
    status: 'over',
  },
];

export const MOCK_RESOURCE_TRENDS: ResourceTrendMetric[] = [
  { resourceId: 101, name: 'Alex Chen', weeks: [68, 74, 80, 85] },
  { resourceId: 102, name: 'Priya Sharma', weeks: [65, 70, 71, 72] },
  { resourceId: 103, name: 'Marcus Vance', weeks: [75, 70, 64, 60] },
  { resourceId: 104, name: 'Elena Rostova', weeks: [50, 48, 44, 45] },
  { resourceId: 105, name: 'Sarah Jenkins', weeks: [64, 76, 88, 95] },
];

export const MOCK_HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const MOCK_HEATMAP_RESOURCES = [
  'Alex Chen',
  'Priya Sharma',
  'Marcus Vance',
  'Elena Rostova',
  'Sarah Jenkins',
];

// Matrix: [dayIdx, resourceIdx, statusLevel (0: Available, 1: Moderate, 2: High, 3: Full)]
export const MOCK_HEATMAP_DATA: [number, number, number][] = [
  // Alex Chen (res 0): High load, available Friday afternoon
  [0, 0, 2],
  [1, 0, 2],
  [2, 0, 2],
  [3, 0, 2],
  [4, 0, 1],

  // Priya Sharma (res 1): Balanced moderate load
  [0, 1, 1],
  [1, 1, 1],
  [2, 1, 2],
  [3, 1, 1],
  [4, 1, 0],

  // Marcus Vance (res 2): Available前半, moderate後半
  [0, 2, 0],
  [1, 2, 0],
  [2, 2, 1],
  [3, 2, 1],
  [4, 2, 1],

  // Elena Rostova (res 3): Available across most days
  [0, 3, 0],
  [1, 3, 0],
  [2, 3, 1],
  [3, 3, 0],
  [4, 3, 0],

  // Sarah Jenkins (res 4): Full capacity / constrained all week
  [0, 4, 3],
  [1, 4, 3],
  [2, 4, 3],
  [3, 4, 2],
  [4, 4, 3],
];

export const MOCK_TASK_STATUS_DISTRIBUTION: TaskStatusMetric[] = [
  { status: 'COMPLETED', label: 'Completed', count: 38, color: ANALYTICS_PALETTE.green },
  { status: 'IN_PROGRESS', label: 'In Progress', count: 24, color: ANALYTICS_PALETTE.primary },
  { status: 'SCHEDULED', label: 'Scheduled', count: 20, color: ANALYTICS_PALETTE.blue },
  { status: 'ON_HOLD', label: 'On Hold', count: 10, color: ANALYTICS_PALETTE.warning },
];

export const MOCK_PROJECT_SCHEDULE: ProjectScheduleMetric[] = [
  {
    projectId: 1,
    name: 'Resource Scheduling Platform',
    actualProgress: 82,
    plannedPace: 80,
    health: 'On Track',
    deadline: 'Oct 15',
    healthColor: ANALYTICS_PALETTE.green,
  },
  {
    projectId: 2,
    name: 'Task Management Portal',
    actualProgress: 65,
    plannedPace: 78,
    health: 'Behind',
    deadline: 'Nov 01',
    healthColor: ANALYTICS_PALETTE.danger,
  },
  {
    projectId: 3,
    name: 'Client Management System',
    actualProgress: 90,
    plannedPace: 90,
    health: 'On Track',
    deadline: 'Sep 30',
    healthColor: ANALYTICS_PALETTE.green,
  },
  {
    projectId: 4,
    name: 'Mobile Application',
    actualProgress: 48,
    plannedPace: 54,
    health: 'At Risk',
    deadline: 'Dec 10',
    healthColor: ANALYTICS_PALETTE.warning,
  },
  {
    projectId: 5,
    name: 'Internal Operations Tool',
    actualProgress: 35,
    plannedPace: 30,
    health: 'On Track',
    deadline: 'Dec 28',
    healthColor: ANALYTICS_PALETTE.green,
  },
];

export const MOCK_TASK_EFFORT: TaskEffortMetric[] = [
  {
    taskName: 'Auto Dispatch Engine',
    plannedHours: 32,
    actualHours: 42,
    variance: 10,
    isOverrun: true,
  },
  {
    taskName: 'Conflict Matrix Logic',
    plannedHours: 24,
    actualHours: 22,
    variance: -2,
    isOverrun: false,
  },
  {
    taskName: 'Gantt Timeline Engine',
    plannedHours: 28,
    actualHours: 36,
    variance: 8,
    isOverrun: true,
  },
  {
    taskName: 'RBAC Permission Guard',
    plannedHours: 16,
    actualHours: 15,
    variance: -1,
    isOverrun: false,
  },
  {
    taskName: 'Calendar Sync Worker',
    plannedHours: 20,
    actualHours: 18,
    variance: -2,
    isOverrun: false,
  },
  {
    taskName: 'Capacity Report Export',
    plannedHours: 18,
    actualHours: 25,
    variance: 7,
    isOverrun: true,
  },
];

export const MOCK_CAPACITY_SCHEDULING: CapacitySchedulingMetric[] = [
  {
    resourceId: 101,
    name: 'Alex Chen',
    role: 'Senior Full Stack',
    totalCapacity: 40,
    assignedEffort: 34,
    remainingHeadroom: 6,
    isAvailableForDispatch: true,
  },
  {
    resourceId: 102,
    name: 'Priya Sharma',
    role: 'Backend Specialist',
    totalCapacity: 40,
    assignedEffort: 29,
    remainingHeadroom: 11,
    isAvailableForDispatch: true,
  },
  {
    resourceId: 103,
    name: 'Marcus Vance',
    role: 'Frontend Engineer',
    totalCapacity: 40,
    assignedEffort: 24,
    remainingHeadroom: 16,
    isAvailableForDispatch: true,
  },
  {
    resourceId: 104,
    name: 'Elena Rostova',
    role: 'DevOps & Systems',
    totalCapacity: 40,
    assignedEffort: 18,
    remainingHeadroom: 22,
    isAvailableForDispatch: true,
  },
  {
    resourceId: 105,
    name: 'Sarah Jenkins',
    role: 'QA & Testing',
    totalCapacity: 40,
    assignedEffort: 38,
    remainingHeadroom: 2,
    isAvailableForDispatch: false, // Under 5h headroom
  },
];
