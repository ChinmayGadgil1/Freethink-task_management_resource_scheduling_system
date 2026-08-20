<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="dashboard-container">
      <!-- HEADER -->
      <div class="dashboard-header row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold text-dark">
            Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}!
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            Here's a real-time overview of your workload and schedule.
          </div>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn
            outline
            no-caps
            icon="refresh"
            label="Refresh"
            color="primary"
            class="refresh-btn"
            :loading="loading"
            @click="loadDashboardData"
          />
        </div>
      </div>

      <!-- SKELETON LOADING -->
      <div v-if="loading" class="row q-col-gutter-md q-mt-xs">
        <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
          <q-skeleton type="rect" height="100px" style="border-radius: 12px" />
        </div>
      </div>

      <!-- ERROR BANNER -->
      <q-banner v-else-if="error" class="bg-negative text-white rounded-borders q-mt-md">
        {{ error }}
        <template #action>
          <q-btn flat no-caps label="Retry" @click="loadDashboardData" />
        </template>
      </q-banner>

      <!-- MAIN DASHBOARD BODY -->
      <div v-else class="dashboard-body">
        <!-- 01 — STAT STRIP -->
        <section class="dashboard-section">
          <div class="stat-grid">
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
        </section>

        <!-- 02 — WORKLOAD + TASK STATUS -->
        <section class="dashboard-section">
          <div class="row q-col-gutter-lg">
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
        </section>

        <!-- 03 — GANTT CHART SCHEDULE (Replaces Upcoming Tasks) -->
        <section class="dashboard-section">
          <ResourceGanttChart :tasks="ganttTasks" />
        </section>

        <!-- 04 — PROJECTS & ATTENTION / SELF-ASSIGNED -->
        <section class="dashboard-section">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-6">
              <ProjectsBreakdownCard :projects="projectSummary" />
            </div>

            <div class="col-12 col-md-6 column q-gutter-y-lg">
              <!-- NEEDS ATTENTION -->
              <q-card flat bordered class="dashboard-card">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle1 text-weight-bold">Needs Attention</div>
                    <div class="text-caption text-grey-6">
                      Tasks requiring urgent review or action
                    </div>
                  </div>
                  <q-badge
                    v-if="attentionTasks.length"
                    color="negative"
                    outline
                    :label="`${attentionTasks.length} items`"
                  />
                </q-card-section>

                <q-separator />

                <div v-if="!attentionTasks.length" class="empty-block">
                  <q-icon name="check_circle" size="32px" color="positive" />
                  <div class="text-body2 text-grey-6 q-mt-sm">
                    You're on track — no tasks need immediate attention.
                  </div>
                </div>

                <q-list v-else separator>
                  <q-item
                    v-for="t in attentionTasks"
                    :key="t.task_id"
                    clickable
                    @click="goToTaskDetails(t.task_id)"
                  >
                    <q-item-section avatar>
                      <q-icon :name="attentionMeta(t).icon" :color="attentionMeta(t).color" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ t.title }}</q-item-label>
                      <q-item-label caption>{{
                        t.project_name || `Project #${t.project_id}`
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge :color="attentionMeta(t).color" :label="attentionMeta(t).label" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>

              <!-- SELF ASSIGNED TASKS -->
              <q-card flat bordered class="dashboard-card">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle1 text-weight-bold">Self-assigned tasks</div>
                    <div class="text-caption text-grey-6">Tasks created by you</div>
                  </div>
                  <q-badge color="primary" :label="`${selfAssignedTasks.length} tasks`" />
                </q-card-section>

                <q-separator />

                <div v-if="selfAssignedTasks.length === 0" class="empty-block">
                  <q-icon name="assignment_ind" size="32px" color="grey-5" />
                  <div class="text-body2 text-grey-6 q-mt-sm">No self-assigned tasks yet.</div>
                  <div class="text-caption text-grey-5 q-mt-xs">
                    Tasks you create yourself will appear here.
                  </div>
                </div>

                <q-list v-else separator>
                  <q-item v-for="task in selfAssignedTasks" :key="task.task_id">
                    <q-item-section avatar>
                      <q-avatar
                        size="32px"
                        color="primary"
                        text-color="white"
                        icon="assignment_ind"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ task.title }}</q-item-label>
                      <q-item-label caption>{{
                        task.project_name || `Project #${task.project_id}`
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="column items-end q-gutter-xs">
                        <q-badge
                          :color="
                            task.status === 'COMPLETED'
                              ? 'positive'
                              : task.status === 'IN_PROGRESS'
                                ? 'primary'
                                : task.status === 'ON_HOLD'
                                  ? 'warning'
                                  : 'grey-7'
                          "
                          :label="task.status.replace('_', ' ')"
                        />
                        <div class="text-caption text-grey-6 font-weight-bold">
                          {{ Number(task.progress) || 0 }}%
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import StatCard from '@/components/dashboard/StatCard.vue';
import WorkloadCard from '@/components/resource/WorkloadCard.vue';
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue';
import ProjectsBreakdownCard from '@/components/resource/ProjectsBreakdownCard.vue';
import ResourceGanttChart from '@/components/resource/ResourceGanttChart.vue';
import {
  getTasksApi,
  getResourceWorkloadApi,
  type Task,
  type ResourceWorkload,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');
const tasks = ref<Task[]>([]);

const workloadData = ref<ResourceWorkload | null>(null);

// Logged-in Resource ID
const currentUserId = computed(() => authStore.user?.user_id ?? null);
const userFirstName = computed(() => authStore.user?.name?.split(' ')[0] ?? '');

async function loadDashboardData() {
  loading.value = true;
  error.value = '';

  try {
    const tasksData = await getTasksApi();
    tasks.value = tasksData;

    try {
      workloadData.value = await getResourceWorkloadApi();
    } catch {
      workloadData.value = null;
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard data.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDashboardData();
});

// Helper for dates
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(task: Task): boolean {
  if (!task.deadline || task.status === 'COMPLETED') return false;
  return new Date(task.deadline) < new Date();
}

function normalizePriorityForGantt(p?: string): 'High' | 'Medium' | 'Low' | 'Critical' {
  const up = (p || '').toUpperCase();
  if (up === 'LOW') return 'Low';
  if (up === 'HIGH') return 'High';
  if (up === 'CRITICAL') return 'Critical';
  return 'Medium';
}

// Stats computations
const activeTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING').length,
);

const completedTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'COMPLETED').length,
);

const delayedTasksCount = computed(
  () => tasks.value.filter((t) => isOverdue(t) && t.status !== 'COMPLETED').length,
);

const statCards = computed(() => [
  {
    title: 'Total Tasks',
    value: tasks.value.length,
    subtitle: 'All assigned tasks',
    icon: 'task_alt',
    color: 'primary',
  },
  {
    title: 'In Progress',
    value: activeTasksCount.value,
    subtitle: 'Active work',
    icon: 'sync',
    color: 'info',
  },
  {
    title: 'Completed',
    value: completedTasksCount.value,
    subtitle: 'Done',
    icon: 'check_circle',
    color: 'positive',
  },
  {
    title: 'Delayed',
    value: delayedTasksCount.value,
    subtitle: 'Need attention',
    icon: 'warning',
    color: 'negative',
  },
]);

// Workload metrics fallback
const workload = computed(() => {
  if (workloadData.value) {
    const expected = Number(workloadData.value.total_expected_effort) || 0;
    const actual = Number(workloadData.value.total_actual_effort) || 0;
    const remaining = Math.max(0, expected - actual);
    const consumedPct = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
    const activeTasks = Number(workloadData.value.active_tasks_count) || activeTasksCount.value;

    return {
      expectedEffort: expected,
      actualEffort: actual,
      remainingEffort: remaining,
      activeTasks,
      consumedPct,
      overEstimate: actual > expected,
    };
  }

  // Fallback calculated from tasks list if workload endpoint failed
  let expected = 0;
  let actual = 0;
  tasks.value.forEach((t) => {
    expected += Number(t.expected_effort) || 0;
    actual += Number(t.actual_effort) || 0;
  });

  const remaining = Math.max(0, expected - actual);
  const consumedPct = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;

  return {
    expectedEffort: expected,
    actualEffort: actual,
    remainingEffort: remaining,
    activeTasks: activeTasksCount.value,
    consumedPct,
    overEstimate: actual > expected,
  };
});

// Status Distribution
const taskStatus = computed(() => {
  const pending = tasks.value.filter((t) => t.status === 'PENDING').length;
  const inProgress = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;
  const onHold = tasks.value.filter((t) => t.status === 'ON_HOLD').length;

  return [
    { label: 'Pending', value: pending, color: '#F59E0B' },
    { label: 'In Progress', value: inProgress, color: '#3B82F6' },
    { label: 'Completed', value: completed, color: '#10B981' },
    { label: 'On Hold', value: onHold, color: '#6B7280' },
  ];
});

// Urgent / Attention Needed Tasks
const attentionTasks = computed(() => {
  return tasks.value
    .filter((t) => t.status !== 'COMPLETED' && (isOverdue(t) || t.priority === 'CRITICAL'))
    .slice(0, 5);
});

function attentionMeta(t: Task) {
  if (isOverdue(t)) {
    return { icon: 'warning', color: 'negative', label: 'Overdue' };
  }
  return { icon: 'priority_high', color: 'deep-orange', label: 'Critical' };
}

// Self-assigned tasks
const selfAssignedTasks = computed(() => {
  if (!currentUserId.value) return [];
  return tasks.value.filter((t) => t.created_by === currentUserId.value);
});

// Project Summary
const projectSummary = computed(() => {
  const map = new Map<
    number,
    {
      project_id: number;
      project: string;
      tasks: number;
      progressSum: number;
      hasDelayed: boolean;
      deadlines: string[];
    }
  >();

  tasks.value.forEach((t) => {
    const pId = t.project_id;
    const pName = t.project_name || `Project #${pId}`;
    if (!map.has(pId)) {
      map.set(pId, {
        project_id: pId,
        project: pName,
        tasks: 0,
        progressSum: 0,
        hasDelayed: false,
        deadlines: [],
      });
    }

    const item = map.get(pId)!;
    item.tasks += 1;
    item.progressSum += Number(t.progress) || 0;
    if (isOverdue(t)) item.hasDelayed = true;
    if (t.deadline) item.deadlines.push(t.deadline);
  });

  return Array.from(map.values()).map((p) => ({
    project_id: p.project_id,
    project: p.project,
    tasks: p.tasks,
    progress: Math.round(p.progressSum / (p.tasks || 1)),
    status: p.hasDelayed ? ('Delayed' as const) : ('On Track' as const),
    deadline: p.deadlines.length ? formatDate(p.deadlines.sort()[p.deadlines.length - 1]) : 'TBD',
  }));
});

const ganttTasks = computed(() =>
  tasks.value.map((task) => {
    const today = new Date().toISOString().slice(0, 10);

    const start = task.start_date ? (task.start_date.split('T')[0] ?? today) : today;

    const end = task.deadline ? (task.deadline.split('T')[0] ?? start) : start;

    return {
      id: task.task_id,
      name: task.title,
      project: task.project_name || `Project #${task.project_id}`,
      start,
      end,
      progress: Math.min(100, Math.max(0, Number(task.progress) || 0)),
      status: task.status,
      priority: normalizePriorityForGantt(task.priority),
      overdue: isOverdue(task),
    };
  }),
);

function goToTaskDetails(id: number) {
  void router.push(`/app/resource-dashboard/task-details/${id}`);
}
</script>

<style scoped lang="scss">
.workspace-page {
  background: var(--wo-bg-page, #f8f9fa);
  min-height: 100vh;
}

.dashboard-container {
  width: 100%;
}

.dashboard-header {
  margin-bottom: 24px;
}

.refresh-btn {
  border-radius: 9px;
  padding: 6px 14px;
}

.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-section {
  width: 100%;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.dashboard-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
}

.empty-block {
  padding: 28px 16px;
  text-align: center;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-body {
    gap: 16px;
  }
}
</style>
