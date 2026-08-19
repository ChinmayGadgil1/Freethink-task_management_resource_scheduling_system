<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="row items-center justify-between q-mb-lg q-gutter-sm">
      <div>
        <div class="text-h5 text-weight-bold">
          Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">Here's an overview of your work today.</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat no-caps dense icon="refresh" label="Refresh" color="grey-7" @click="loadDashboardData" />
        <q-btn unelevated no-caps dense icon="edit_note" label="Update Progress" color="primary" @click="updateDialog = true" />
        <q-btn outline no-caps dense icon="list_alt" label="My Tasks" color="primary" @click="goToTasks" />
      </div>
    </div>

    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 5" :key="n" class="col-12 col-sm-6 col-md">
        <q-skeleton
          type="rect"
          height="96px"
          animation="fade"
        />
      </div>
    </div>

    <q-banner v-else-if="error" class="bg-negative text-white q-mb-lg" rounded>
      {{ error }}
      <template #action>
        <q-btn flat no-caps label="Retry" @click="loadDashboardData" />
      </template>
    </q-banner>

    <template v-else>
      <!-- 01 — OVERVIEW -->
      <WorkspaceSection
        number="01"
        label="Overview"
        title="Your work at a glance"
        description="A snapshot of everything currently assigned to you, across all projects."
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

      <!-- 02 — WORKLOAD + STATUS -->
      <WorkspaceSection
        number="02"
        label="Capacity"
        title="Workload & effort"
        description="Allocated vs. actual effort, and how your open tasks are distributed by status."
      >
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <WorkloadCard
              :allocated-hours="workload.expectedEffort"
              :actual-hours="workload.actualEffort"
              :remaining-hours="workload.remainingEffort"
              :assigned-tasks="workload.activeTasks"
              :consumed-pct="workload.consumedPct"
              :over-estimate="workload.overEstimate"
            />
          </div>
          <div class="col-12 col-md-6">
            <TaskStatusCard :items="taskStatus" />
          </div>
        </div>
      </WorkspaceSection>

      <!-- 03 — DEADLINES -->
      <WorkspaceSection
        number="03"
        label="Deadlines"
        title="Upcoming deadlines"
        description="Tasks due today or within the next 7 days, ordered by urgency."
        action-label="View all tasks"
        @action="goToTasks"
      >
        <UpcomingTasksCard :tasks="upcomingTasks" @view-all="goToTasks" />
      </WorkspaceSection>

      <!-- 04 — NEEDS ATTENTION -->
      <WorkspaceSection
        number="04"
        label="Attention"
        title="Needs attention"
        description="Overdue first, then approaching deadlines, then incomplete high/critical priority work."
      >
        <q-card flat bordered>
          <div v-if="!attentionTasks.length" class="empty-block">
            <q-icon name="check_circle" size="32px" color="positive" />
            <div class="text-body2 text-grey-6 q-mt-sm">
              You're on track — no tasks need immediate attention.
            </div>
          </div>
          <q-list v-else separator>
            <q-item v-for="t in attentionTasks" :key="t.task_id" clickable @click="goToTaskDetails(t.task_id)">
              <q-item-section avatar>
                <q-icon :name="attentionMeta(t).icon" :color="attentionMeta(t).color" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ t.title }}</q-item-label>
                <q-item-label caption>{{ t.project_name || `Project #${t.project_id}` }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="attentionMeta(t).color" :label="attentionMeta(t).label" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </WorkspaceSection>

      <!-- 05 — SELF-ASSIGNED (scaffolded, activates once backend returns created_by) -->
      <WorkspaceSection
        number="05"
        label="Ownership"
        title="Self-assigned tasks"
        description="Tasks you created yourself, versus tasks assigned to you by a project manager."
      >
        <q-card flat bordered>
          <q-card-section class="row items-center q-gutter-sm">
            <q-icon name="info" color="grey-6" size="20px" />
            <div class="text-body2 text-grey-7">
              Not available yet — the task API doesn't return who created each task
              (<code>created_by</code>). This section is wired up and will populate automatically once
              that field is added to the backend response.
            </div>
          </q-card-section>
        </q-card>
      </WorkspaceSection>

      <!-- 06 — PROJECTS -->
      <WorkspaceSection
        number="06"
        label="Projects"
        title="Tasks across projects"
        description="Your assigned work grouped by the project it belongs to."
      >
        <ProjectsBreakdownCard :projects="projectSummary" />
      </WorkspaceSection>

      <!-- 07 — GANTT -->
      <WorkspaceSection
        number="07"
        label="Timeline"
        title="My Gantt"
        description="Your own assigned tasks plotted against their real start and deadline dates."
      >
        <ResourceGanttChart :tasks="ganttTasks" />
      </WorkspaceSection>
    </template>

    <UpdateProgressDialog v-model="updateDialog" :tasks="tasks" @saved="handleProgressSaved" />
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
import UpdateProgressDialog from '@/components/resource/UpdateProgressDialog.vue';
import { getTasksApi, getResourceWorkloadApi, type Task, type ResourceWorkload } from '@/services/api';

const router = useRouter();
const loading = ref(true);
const error = ref('');
const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);
const updateDialog = ref(false);

const storedUser = localStorage.getItem('user');
const userFirstName = computed(() => {
  if (!storedUser) return '';
  try {
    return (JSON.parse(storedUser) as { name?: string }).name?.split(' ')[0] ?? '';
  } catch {
    return '';
  }
});

function isOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || !task.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.deadline) < today;
}
function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
function isUpcoming(task: Task): boolean {
  // "Upcoming" = due today through the next 7 days, not overdue, not completed.
  if (task.status === 'COMPLETED' || !task.deadline || isOverdue(task)) return false;
  const d = daysUntil(task.deadline);
  return d >= 0 && d <= 7;
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDue(deadlineStr: string | null): string {
  if (!deadlineStr) return 'No deadline';
  const diff = daysUntil(deadlineStr);
  if (diff === 0) return 'Due Today';
  if (diff === 1) return 'Due Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d Overdue`;
  return formatDate(deadlineStr);
}

function normalizePriority(
  priority: Task['priority']
): 'Low' | 'Medium' | 'High' | 'Critical' {
  switch (String(priority).toUpperCase()) {
    case 'LOW':
      return 'Low'
    case 'HIGH':
      return 'High'
    case 'CRITICAL':
      return 'Critical'
    case 'MEDIUM':
    default:
      return 'Medium'
  }
}

async function loadDashboardData() {
  loading.value = true;
  error.value = '';
  try {
    const [fetchedTasks, fetchedWorkload] = await Promise.all([
      getTasksApi(),
      getResourceWorkloadApi().catch(() => null),
    ]);
    tasks.value = fetchedTasks;
    workloadData.value = fetchedWorkload;
  } catch (err) {
    console.error('Failed to load resource dashboard data:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load your dashboard.';
  } finally {
    loading.value = false;
  }
}
onMounted(() => void loadDashboardData());

function handleProgressSaved(updated: Task) {
  const idx = tasks.value.findIndex((t) => t.task_id === updated.task_id);
  if (idx !== -1) tasks.value[idx] = updated;
}

// Total, active (not completed), completed — kept distinct, never conflated.
const stats = computed(() => {
  const total = tasks.value.length;
  const inProgress = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;
  const active = tasks.value.filter((t) => t.status !== 'COMPLETED').length;
  const overdue = tasks.value.filter(isOverdue).length;
  const upcoming = tasks.value.filter(isUpcoming).length;
  return { total, inProgress, completed, active, overdue, upcoming };
});

const statCards = computed(() => [
  { title: 'Total Tasks', value: stats.value.total, subtitle: 'Assigned to you', icon: 'task_alt', color: '#8B6FD8' },
  { title: 'Active', value: stats.value.active, subtitle: 'Not yet completed', icon: 'autorenew', color: '#2E90FA' },
  { title: 'Completed', value: stats.value.completed, subtitle: 'Tasks completed', icon: 'check_circle_outline', color: '#27AE60' },
  { title: 'Overdue', value: stats.value.overdue, subtitle: 'Past deadline', icon: 'warning_amber', color: '#E15263' },
  { title: 'Upcoming', value: stats.value.upcoming, subtitle: 'Due within 7 days', icon: 'schedule', color: '#E89532' },
]);

const workload = computed(() => {
  const fallbackExpected = tasks.value.reduce((s, t) => s + (Number(t.expected_effort) || 0), 0);
  const fallbackActual = tasks.value.reduce((s, t) => s + (Number(t.actual_effort) || 0), 0);
  const expectedEffort = workloadData.value ? Number(workloadData.value.total_expected_effort) || 0 : fallbackExpected;
  const actualEffort = workloadData.value ? Number(workloadData.value.total_actual_effort) || 0 : fallbackActual;
  const activeTasks = workloadData.value ? workloadData.value.active_tasks_count : stats.value.active;
  const overEstimate = actualEffort > expectedEffort && expectedEffort > 0;
  return {
    activeTasks,
    expectedEffort,
    actualEffort,
    remainingEffort: Math.max(expectedEffort - actualEffort, 0),
    // Clamped 0–100 so exceeding the estimate never renders a misleading >100% bar.
    consumedPct: expectedEffort ? Math.min(100, Math.round((actualEffort / expectedEffort) * 100)) : 0,
    overEstimate,
  };
});

const taskStatus = computed(() => [
  { label: 'Completed', value: tasks.value.filter((t) => t.status === 'COMPLETED').length, color: '#27AE60' },
  { label: 'In Progress', value: tasks.value.filter((t) => t.status === 'IN_PROGRESS').length, color: '#2E90FA' },
  { label: 'Pending', value: tasks.value.filter((t) => t.status === 'PENDING').length, color: '#98A2B3' },
  { label: 'On Hold', value: tasks.value.filter((t) => t.status === 'ON_HOLD').length, color: '#E89532' },
]);

const upcomingTasks = computed(() =>
  tasks.value
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
    })),
);

function attentionMeta(t: Task) {
  if (isOverdue(t)) return { label: 'Overdue', color: 'negative', icon: 'error_outline' };
  if (t.deadline && daysUntil(t.deadline) <= 3) return { label: 'Due Soon', color: 'orange', icon: 'schedule' };
  return { label: `${t.priority} Priority`, color: 'deep-orange', icon: 'flag' };
}

const attentionTasks = computed(() => {
  const seen = new Set<number>();
  const result: Task[] = [];
  const overdue = [...tasks.value].filter(isOverdue).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  const approaching = tasks.value.filter((t) => t.status !== 'COMPLETED' && t.deadline && !isOverdue(t) && daysUntil(t.deadline) <= 3);
  const criticalIncomplete = tasks.value.filter((t) => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.priority === 'CRITICAL'));
  for (const group of [overdue, approaching, criticalIncomplete]) {
    for (const t of group) {
      if (!seen.has(t.task_id)) {
        seen.add(t.task_id);
        result.push(t);
      }
    }
  }
  return result.slice(0, 6);
});

const projectSummary = computed(() => {
  interface Acc { project: string; tasks: number; progressSum: number; deadlines: string[]; hasDelayed: boolean }
  const map = new Map<string, Acc>();
  for (const t of tasks.value) {
    const pName = t.project_name || `Project #${t.project_id}`;
    if (!map.has(pName)) map.set(pName, { project: pName, tasks: 0, progressSum: 0, deadlines: [], hasDelayed: false });
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

const ganttTasks = computed(() =>
  tasks.value.map((task) => {
    const today = new Date().toISOString().slice(0, 10)

    const start = task.start_date
      ? task.start_date.split('T')[0] ?? today
      : today

    const end = task.deadline
      ? task.deadline.split('T')[0] ?? start
      : start

    return {
      id: task.task_id,
      name: task.title,
      project: task.project_name || `Project #${task.project_id}`,
      start,
      end,
      progress: Math.min(
        100,
        Math.max(0, Number(task.progress) || 0)
      ),
      status: task.status,
      priority: normalizePriority(task.priority),
      overdue: isOverdue(task)
    }
  })
)

function goToTasks() {
  void router.push('/app/resource-dashboard/tasks');
}
function goToTaskDetails(id: number) {
  void router.push(`/app/resource-dashboard/task-details/${id}`);
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
.empty-block {
  padding: 32px 16px;
  text-align: center;
}
</style>
