<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">
        Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-xs">Here's an overview of your work today.</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- 01 — OVERVIEW -->
      <WorkspaceSection
        number="01"
        label="Overview"
        title="Your work at a glance"
        description="A quick snapshot of everything on your plate right now."
      >
        <div class="stat-strip">
          <StatCard
            v-for="stat in statCards"
            :key="stat.title"
            :title="stat.title"
            :value="stat.value"
            :subtitle="stat.subtitle"
            :icon="stat.icon"
            :color="stat.color"
          />
        </div>
      </WorkspaceSection>

      <!-- 02 — WORKLOAD -->
      <WorkspaceSection
        number="02"
        label="Capacity"
        title="My workload"
        description="How much of your daily capacity is currently booked, and how your open tasks are distributed by status."
      >
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <WorkloadCard
              :utilization="workload.utilization"
              :allocated-hours="workload.allocatedHours"
              :daily-capacity="workload.dailyCapacity"
              :remaining="workload.remaining"
              :assigned-tasks="workload.assignedTasks"
            />
          </div>
          <div class="col-12 col-md-6">
            <TaskStatusCard :items="taskStatus" />
          </div>
        </div>
      </WorkspaceSection>

      <!-- 03 — UPCOMING -->
      <WorkspaceSection
        number="03"
        label="Deadlines"
        title="Upcoming tasks"
        description="Tasks approaching their deadlines, ordered by how soon they're due."
        action-label="View all tasks"
        @action="goToTasks"
      >
        <UpcomingTasksCard :tasks="upcomingTasks" @view-all="goToTasks" />
      </WorkspaceSection>

      <!-- 04 — PROJECTS -->
      <WorkspaceSection
        number="04"
        label="Projects"
        title="Tasks across projects"
        description="Your assigned work grouped by the project it belongs to."
      >
        <ProjectsBreakdownCard :projects="projectSummary" />
      </WorkspaceSection>

      <!-- 05 — GANTT -->
      <WorkspaceSection
        number="05"
        label="Timeline"
        title="My Gantt"
        description="Your own assigned tasks plotted against their start and deadline dates."
      >
        <ResourceGanttChart :tasks="ganttTasks" />
      </WorkspaceSection>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import StatCard from '@/components/dashboard/StatCard.vue';
import WorkspaceSection from '@/components/resource/WorkspaceSection.vue';
import WorkloadCard from '@/components/resource/WorkloadCard.vue';
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue';
import UpcomingTasksCard from '@/components/resource/UpcomingTasksCard.vue';
import ProjectsBreakdownCard from '@/components/resource/ProjectsBreakdownCard.vue';
import ResourceGanttChart from '@/components/resource/ResourceGanttChart.vue';

import {
  getTasksApi,
  getResourceWorkloadApi,
  type Task,
  type ResourceWorkload,
} from '@/services/api';

const router = useRouter();

const loading = ref(true);
const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);

const storedUser = localStorage.getItem('user');
const userFirstName = computed(() => {
  if (!storedUser) return '';
  try {
    const parsed = JSON.parse(storedUser) as { name?: string };
    return parsed.name?.split(' ')[0] ?? '';
  } catch {
    return '';
  }
});

function isOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || !task.deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0);

  return deadline < today;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDue(deadlineStr: string | null): string {
  if (!deadlineStr) return 'No deadline';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Due Today';
  if (diffDays === 1) return 'Due Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)}d Overdue`;
  return formatDate(deadlineStr);
}

function normalizePriority(p: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  const upper = p.toUpperCase();
  if (upper === 'LOW') return 'Low';
  if (upper === 'HIGH') return 'High';
  if (upper === 'CRITICAL') return 'Critical';
  return 'Medium';
}

async function loadDashboardData() {
  loading.value = true;
  try {
    const [fetchedTasks, fetchedWorkload] = await Promise.all([
      getTasksApi(),
      getResourceWorkloadApi().catch(() => null),
    ]);
    tasks.value = fetchedTasks;
    workloadData.value = fetchedWorkload;
  } catch (error) {
    console.error('Failed to load resource dashboard data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDashboardData();
});

const stats = computed(() => {
  const total = tasks.value.length;
  const inProgress = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;
  const delayed = tasks.value.filter(isOverdue).length;
  const upcoming = tasks.value.filter(
    (t) => !isOverdue(t) && t.status !== 'COMPLETED' && !!t.deadline,
  ).length;

  return { total, inProgress, completed, delayed, upcoming };
});

const statCards = computed(() => [
  {
    title: 'My Tasks',
    value: stats.value.total,
    subtitle: 'Assigned to you',
    icon: 'task_alt',
    color: '#8B6FD8',
  },
  {
    title: 'In Progress',
    value: stats.value.inProgress,
    subtitle: 'Currently working',
    icon: 'autorenew',
    color: '#2E90FA',
  },
  {
    title: 'Completed',
    value: stats.value.completed,
    subtitle: 'Tasks completed',
    icon: 'check_circle_outline',
    color: '#27AE60',
  },
  {
    title: 'Delayed',
    value: stats.value.delayed,
    subtitle: 'Needs attention',
    icon: 'warning_amber',
    color: '#E15263',
  },
  {
    title: 'Upcoming',
    value: stats.value.upcoming,
    subtitle: 'Approaching deadline',
    icon: 'schedule',
    color: '#E89532',
  },
]);

const workload = computed(() => {
  const assignedTasks = tasks.value.length;
  const activeTasks = tasks.value.filter((t) => t.status !== 'COMPLETED');
  const activeEffort = activeTasks.reduce((sum, t) => sum + (Number(t.expected_effort) || 0), 0);
  const totalEffort = workloadData.value
    ? Number(workloadData.value.total_expected_effort) || activeEffort
    : activeEffort;

  const dailyCapacity = 8;
  const standardWeeklyCapacity = 40;
  const utilization = Math.min(150, Math.round((totalEffort / standardWeeklyCapacity) * 100));
  const remaining = Math.max(0, standardWeeklyCapacity - totalEffort);

  return {
    assignedTasks,
    allocatedHours: totalEffort,
    dailyCapacity,
    utilization,
    remaining,
  };
});

const taskStatus = computed(() => {
  const comp = tasks.value.filter((t) => t.status === 'COMPLETED').length;
  const inProg = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  const pend = tasks.value.filter((t) => t.status === 'PENDING').length;
  const hold = tasks.value.filter((t) => t.status === 'ON_HOLD').length;

  return [
    { label: 'Completed', value: comp, color: '#27AE60' },
    { label: 'In Progress', value: inProg, color: '#2E90FA' },
    { label: 'Pending', value: pend, color: '#98A2B3' },
    { label: 'On Hold', value: hold, color: '#E89532' },
  ];
});

const upcomingTasks = computed(() => {
  return tasks.value
    .filter((t) => t.status !== 'COMPLETED' && !!t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)
    .map((t) => ({
      id: t.task_id,
      name: t.title,
      project: t.project_name || `Project #${t.project_id}`,
      priority: normalizePriority(t.priority),
      progress: Number(t.progress) || 0,
      due: formatDue(t.deadline),
    }));
});

const projectSummary = computed(() => {
  interface ProjectAcc {
    project: string;
    tasks: number;
    progressSum: number;
    deadlines: string[];
    hasDelayed: boolean;
  }

  const map = new Map<string, ProjectAcc>();

  for (const t of tasks.value) {
    const pName = t.project_name || `Project #${t.project_id}`;
    if (!map.has(pName)) {
      map.set(pName, {
        project: pName,
        tasks: 0,
        progressSum: 0,
        deadlines: [],
        hasDelayed: false,
      });
    }

    const item = map.get(pName)!;
    item.tasks += 1;
    item.progressSum += Number(t.progress) || 0;
    if (t.deadline) item.deadlines.push(t.deadline);
    if (isOverdue(t)) item.hasDelayed = true;
  }

  return Array.from(map.values()).map((p) => ({
    project: p.project,
    tasks: p.tasks,
    progress: Math.round(p.progressSum / (p.tasks || 1)),
    status: p.hasDelayed ? ('Delayed' as const) : ('On Track' as const),
    deadline: p.deadlines.length ? formatDate(p.deadlines.sort()[p.deadlines.length - 1]!) : 'TBD',
  }));
});

const ganttTasks = computed(() => {
  return tasks.value.map((t) => {
    const start = t.start_date
      ? t.start_date.split('T')[0]!
      : t.created_at
        ? t.created_at.split('T')[0]!
        : new Date().toISOString().split('T')[0]!;
    const end = t.deadline ? t.deadline.split('T')[0]! : new Date().toISOString().split('T')[0]!;

    return {
      id: t.task_id,
      name: t.title,
      project: t.project_name || `Project #${t.project_id}`,
      start,
      end,
      progress: Number(t.progress) || 0,
      priority: normalizePriority(t.priority),
    };
  });
});

function goToTasks() {
  void router.push('/app/resource-dashboard/tasks');
}
</script>

<style scoped lang="scss">
.workspace-page {
  background: var(--wo-bg-page, #f8f9fa);
}

.stat-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>

