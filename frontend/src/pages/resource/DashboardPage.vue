<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="q-pa-lg resource-dashboard-page"
  >
    <div class="q-mx-auto column q-gutter-y-lg" style="max-width: 1400px">
      <!-- 01. HEADER & ACTIONS ROW -->
      <div class="row items-center justify-between wrap gap-md">
        <div>
          <div class="page-title">Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}!</div>
          <div class="page-subtitle">
            Here's a real-time overview of your workload, progress, and scheduled tasks.
          </div>
        </div>

        <!-- Clean, unified quick action buttons -->
        <div class="row items-center q-gutter-xs wrap">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="history_edu"
            label="Daily Work Logs"
            class="action-btn text-weight-bold"
            @click="router.push('/app/resource-dashboard/work-logs')"
          />
          <q-btn
            flat
            no-caps
            icon="assignment"
            label="Tasks"
            class="action-btn text-weight-medium"
            :class="$q.dark.isActive ? 'bg-dark-subtle' : 'bg-white'"
            @click="goToTaskDetails()"
          />
          <q-btn
            flat
            no-caps
            icon="calendar_month"
            label="Schedule"
            class="action-btn text-weight-medium"
            :class="$q.dark.isActive ? 'bg-dark-subtle' : 'bg-white'"
            @click="goToSchedule()"
          />
          <q-btn
            flat
            no-caps
            icon="trending_up"
            label="Progress"
            class="action-btn text-weight-medium gt-xs"
            :class="$q.dark.isActive ? 'bg-dark-subtle' : 'bg-white'"
            @click="goToProgress()"
          />
          <q-btn
            flat
            round
            dense
            icon="refresh"
            class="q-ml-xs"
            :loading="loading"
            @click="loadDashboardData"
          >
            <q-tooltip>Refresh Dashboard</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="44px" />
      </div>

      <!-- ERROR BANNER -->
      <q-banner v-else-if="error" class="bg-red-1 text-negative rounded-borders q-mb-lg">
        <div class="row items-center justify-between">
          <span>{{ error }}</span>
          <q-btn flat dense no-caps label="Retry" color="negative" @click="loadDashboardData" />
        </div>
      </q-banner>

      <!-- MAIN DASHBOARD BODY -->
      <template v-else>
        <!-- 02. KEY METRICS STRIP (4 KPI CARDS) -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered class="kpi-card cursor-pointer" @click="goToTaskDetails()">
              <div class="row items-center justify-between">
                <span class="kpi-label">Total Tasks</span>
                <div class="kpi-icon-wrap kpi-blue">
                  <q-icon name="task_alt" size="18px" />
                </div>
              </div>
              <div class="kpi-value q-mt-xs">{{ tasks.length }}</div>
              <div class="kpi-meta text-muted">All assigned deliverables</div>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="kpi-card cursor-pointer"
              @click="goToTaskDetails(undefined, { status: 'IN_PROGRESS' })"
            >
              <div class="row items-center justify-between">
                <span class="kpi-label">In Progress</span>
                <div class="kpi-icon-wrap kpi-purple">
                  <q-icon name="sync" size="18px" />
                </div>
              </div>
              <div class="kpi-value q-mt-xs">{{ activeTasksCount }}</div>
              <div class="kpi-meta text-muted">
                {{
                  tasks.length
                    ? `${Math.round((activeTasksCount / tasks.length) * 100)}% active workload`
                    : 'No active tasks'
                }}
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="kpi-card cursor-pointer"
              @click="goToTaskDetails(undefined, { scope: 'supervised' })"
            >
              <div class="row items-center justify-between">
                <span class="kpi-label">Supervised</span>
                <div class="kpi-icon-wrap kpi-green">
                  <q-icon name="verified_user" size="18px" />
                </div>
              </div>
              <div class="kpi-value q-mt-xs">{{ supervisedTasksCount }}</div>
              <div class="kpi-meta text-muted">Deliverables under review</div>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="kpi-card cursor-pointer"
              :class="{ 'kpi-card-warning': delayedTasksCount > 0 }"
              @click="goToTaskDetails(undefined, { atRisk: 'true' })"
            >
              <div class="row items-center justify-between">
                <span class="kpi-label">Delayed</span>
                <div
                  class="kpi-icon-wrap"
                  :class="delayedTasksCount > 0 ? 'kpi-red' : 'kpi-neutral'"
                >
                  <q-icon name="warning" size="18px" />
                </div>
              </div>
              <div class="kpi-value q-mt-xs" :class="{ 'text-negative': delayedTasksCount > 0 }">
                {{ delayedTasksCount }}
              </div>
              <div
                class="kpi-meta"
                :class="delayedTasksCount > 0 ? 'text-negative text-weight-bold' : 'text-muted'"
              >
                {{
                  delayedTasksCount > 0
                    ? `${delayedTasksCount} task${delayedTasksCount === 1 ? '' : 's'} need attention`
                    : 'All tasks on schedule'
                }}
              </div>
            </q-card>
          </div>
        </div>

        <!-- 03. MAIN DASHBOARD SPLIT VIEW (2-COLUMN LAYOUT) -->
        <div class="row q-col-gutter-lg">
          <!-- LEFT COLUMN: Tasks Across Projects & Attention Items (col-lg-8) -->
          <div class="col-12 col-lg-8 column q-gutter-y-lg">
            <!-- Projects Breakdown -->
            <ProjectsBreakdownCard v-if="projectSummary.length" :projects="projectSummary" />

            <!-- Needs Attention Card -->
            <q-card flat bordered class="content-panel">
              <div class="panel-header row items-center justify-between q-pa-md">
                <div>
                  <div class="panel-title">Tasks Requiring Attention</div>
                  <div class="panel-subtitle">Overdue and critical deliverables</div>
                </div>
                <q-badge
                  v-if="attentionTasks.length"
                  color="negative"
                  outline
                  :label="`${attentionTasks.length} items`"
                />
              </div>

              <q-separator />

              <div v-if="!attentionTasks.length" class="q-pa-lg text-center text-muted">
                <q-icon name="check_circle" size="34px" color="positive" />
                <div class="text-body2 q-mt-sm text-main">
                  You're on track — no tasks need immediate attention.
                </div>
              </div>

              <q-list v-else separator class="clean-list">
                <q-item
                  v-for="t in attentionTasks"
                  :key="t.task_id"
                  clickable
                  v-ripple
                  class="attention-item q-py-sm"
                  @click="goToTaskDetails(t.task_id)"
                >
                  <q-item-section avatar>
                    <div
                      class="attention-icon-wrap"
                      :class="
                        attentionMeta(t).color === 'negative' ? 'wrap-negative' : 'wrap-warning'
                      "
                    >
                      <q-icon :name="attentionMeta(t).icon" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-main">{{ t.title }}</q-item-label>
                    <q-item-label caption class="text-muted">
                      {{ t.project_name || `Project #${t.project_id}` }}
                      <span v-if="t.deadline"> · Due {{ formatDate(t.deadline) }}</span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-chip
                      dense
                      square
                      :color="attentionMeta(t).color === 'negative' ? 'red-1' : 'orange-1'"
                      :text-color="
                        attentionMeta(t).color === 'negative' ? 'negative' : 'deep-orange'
                      "
                      class="text-caption text-weight-bold"
                    >
                      {{ attentionMeta(t).label }}
                    </q-chip>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <!-- RIGHT COLUMN: Effort & Workload, Task Distribution, Self-Assigned Tasks (col-lg-4) -->
          <div class="col-12 col-lg-4 column q-gutter-y-lg">
            <!-- Effort & Workload -->
            <WorkloadCard
              :allocated-hours="workload.expectedEffort"
              :actual-hours="workload.actualEffort"
              :remaining-hours="workload.remainingEffort"
              :assigned-tasks="workload.activeTasks"
            />

            <!-- Task Status Distribution -->
            <TaskStatusCard :items="taskStatus" />

            <!-- Self-Assigned Tasks Panel -->
            <q-card flat bordered class="content-panel">
              <div class="panel-header row items-center justify-between q-pa-md">
                <div>
                  <div class="panel-title">Self-Assigned Tasks</div>
                  <div class="panel-subtitle">Tasks initiated by you</div>
                </div>
                <q-chip
                  dense
                  square
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  class="text-caption text-weight-bold"
                >
                  {{ selfAssignedTasks.length }}
                </q-chip>
              </div>

              <q-separator />

              <div v-if="selfAssignedTasks.length === 0" class="q-pa-lg text-center text-muted">
                <q-icon name="assignment_ind" size="32px" color="grey-5" />
                <div class="text-body2 q-mt-sm text-main">No self-assigned tasks</div>
                <div class="text-caption text-muted">Tasks you create will appear here.</div>
              </div>

              <q-list v-else separator class="clean-list">
                <q-item
                  v-for="taskItem in selfAssignedTasks.slice(0, 4)"
                  :key="taskItem.task_id"
                  clickable
                  v-ripple
                  class="q-py-sm"
                  @click="goToTaskDetails(taskItem.task_id)"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-main ellipsis">{{
                      taskItem.title
                    }}</q-item-label>
                    <q-item-label caption class="text-muted ellipsis">
                      {{ taskItem.project_name || `Project #${taskItem.project_id}` }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="column items-end gap-xs">
                      <q-chip
                        dense
                        square
                        :color="statusColor(taskItem.status)"
                        :text-color="statusTextColor(taskItem.status)"
                        class="text-caption text-weight-bold"
                      >
                        {{ taskItem.status.replace('_', ' ') }}
                      </q-chip>
                      <div class="text-caption text-weight-bold text-main">
                        {{ Number(taskItem.progress) || 0 }}%
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import WorkloadCard from '@/components/resource/WorkloadCard.vue';
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue';
import ProjectsBreakdownCard from '@/components/resource/ProjectsBreakdownCard.vue';
import { formatDate, formatHours, formatNumber } from '@/utils/formatters';
import { isOverdue } from '@/utils/taskHelpers';
import { getTasksApi, getResourceWorkloadApi } from '@/services/api';
import type { Task, ResourceWorkload } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');
const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);

type UserLike = { user_id?: number | string; id?: number | string; userId?: number | string };

const currentUserId = computed(() => {
  const u = (authStore.user || authStore.currentUser) as UserLike | null;
  if (u) {
    const id = u.user_id ?? u.id ?? u.userId;
    if (id) return Number(id);
  }
  try {
    const rawAuth = sessionStorage.getItem('auth');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth) as { user?: UserLike };
      const id = parsed?.user?.user_id ?? parsed?.user?.id ?? parsed?.user?.userId;
      if (id) return Number(id);
    }
  } catch {
    // ignore
  }
  return null;
});
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

const inProgressTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);

const supervisedTasksCount = computed(
  () =>
    tasks.value.filter(
      (t) => currentUserId.value && Number(t.supervisor_id) === currentUserId.value,
    ).length,
);

const delayedTasksCount = computed(
  () => tasks.value.filter((t) => isOverdue(t) && t.status !== 'COMPLETED').length,
);

const activeTasksCount = computed(() => inProgressTasksCount.value);
const workload = computed(() => {
  if (workloadData.value) {
    const expected = Number(workloadData.value.total_expected_effort) || 0;
    const actual = Number(workloadData.value.total_actual_effort) || 0;
    const remaining = Math.max(0, formatNumber(expected - actual));
    const consumedPct = expected > 0 ? Math.round((actual / expected) * 100) : 0;
    const activeTasks = inProgressTasksCount.value;

    return {
      expectedEffort: formatNumber(expected),
      actualEffort: formatNumber(actual),
      remainingEffort: remaining,
      activeTasks,
      consumedPct,
      overEstimate: actual > expected,
    };
  }

  let expected = 0;
  let actual = 0;
  const myId = currentUserId.value;
  tasks.value.forEach((t) => {
    if (t.status === 'COMPLETED') return;
    const isSupervisor = Boolean(myId && Number(t.supervisor_id) === myId);
    const isAssignee =
      t.assigned_resource_ids?.includes(myId as number) ||
      t.assigned_resources?.some((ar) => Number(ar.user_id) === myId);

    const assigneesCount = Math.max(
      1,
      t.assigned_resource_ids?.length || t.assigned_resources?.length || 1,
    );

    if (isAssignee) {
      expected += (Number(t.expected_effort) || 0) / assigneesCount;
      actual += (Number(t.actual_effort) || 0) / assigneesCount;
    } else if (isSupervisor) {
      expected += (Number(t.expected_effort) || 0) * 0.2;
      actual += Number(t.actual_effort) || 0;
    }
  });

  const remaining = Math.max(0, formatNumber(expected - actual));
  const consumedPct = expected > 0 ? Math.round((actual / expected) * 100) : 0;

  return {
    expectedEffort: formatNumber(expected),
    actualEffort: formatNumber(actual),
    remainingEffort: remaining,
    activeTasks: inProgressTasksCount.value,
    consumedPct,
    overEstimate: actual > expected,
  };
});

const taskStatus = computed(() => {
  const scheduled = tasks.value.filter((t) => t.status === 'SCHEDULED').length;
  const inProgress = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;

  return [
    { label: 'Scheduled', value: scheduled, color: '#8B6FD8' },
    { label: 'In Progress', value: inProgress, color: '#3B82F6' },
    { label: 'Completed', value: completed, color: '#10B981' },
  ];
});

const attentionTasks = computed(() => {
  return tasks.value
    .filter((t) => t.status !== 'COMPLETED' && (isOverdue(t) || t.priority === 'CRITICAL'))
    .slice(0, 5);
});

function attentionMeta(t: Task) {
  if (isOverdue(t)) {
    return {
      icon: 'warning',
      color: 'negative',
      label: 'Overdue',
    };
  }
  return {
    icon: 'priority_high',
    color: 'deep-orange',
    label: 'Critical',
  };
}

const selfAssignedTasks = computed(() => {
  if (!currentUserId.value) return [];
  return tasks.value.filter((t) => Number(t.created_by) === currentUserId.value);
});

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
    project: p.project,
    tasks: p.tasks,
    progress: Math.round(p.progressSum / (p.tasks || 1)),
    status: (p.hasDelayed ? 'Delayed' : 'On Track') as 'Delayed' | 'On Track',
    deadline: p.deadlines.length ? formatDate(p.deadlines.sort()[p.deadlines.length - 1]) : 'TBD',
  }));
});

function statusColor(status: Task['status']): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-10';
      case 'IN_PROGRESS':
        return 'blue-10';
      case 'COMPLETED':
        return 'green-10';
      default:
        return 'grey-9';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'deep-purple-1';
    case 'IN_PROGRESS':
      return 'blue-1';
    case 'COMPLETED':
      return 'green-1';
    default:
      return 'grey-2';
  }
}

function statusTextColor(status: Task['status']): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-2';
      case 'IN_PROGRESS':
        return 'blue-2';
      case 'COMPLETED':
        return 'green-2';
      default:
        return 'grey-3';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'primary';
    case 'IN_PROGRESS':
      return 'blue-8';
    case 'COMPLETED':
      return 'green-8';
    default:
      return 'grey-8';
  }
}

function goToTaskDetails(id?: number, query?: Record<string, string>) {
  if (id) {
    void router.push(`/app/resource-dashboard/task-details/${id}`);
  } else if (query) {
    void router.push({ path: '/app/resource-dashboard/task-details', query });
  } else {
    void router.push('/app/resource-dashboard/task-details');
  }
}

function goToSchedule() {
  void router.push('/app/resource-dashboard/schedule');
}

function goToProgress() {
  void router.push('/app/resource-dashboard/progress');
}
</script>

<style scoped lang="scss">
.resource-dashboard-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 13.5px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 2px;
}

.action-btn {
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
}

/* KPI CARDS */
.kpi-card {
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.02);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--wo-primary, #8b6fd8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
  }
}

.kpi-card-warning {
  border-left: 3px solid #f04438;
}

.kpi-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--wo-text-main, #172033);
}

.kpi-meta {
  font-size: 11.5px;
  margin-top: 6px;
}

.kpi-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-purple {
  background: rgba(139, 111, 216, 0.12);
  color: #8b6fd8;
}

.kpi-blue {
  background: rgba(46, 144, 250, 0.12);
  color: #2e90fa;
}

.kpi-green {
  background: rgba(18, 183, 106, 0.12);
  color: #12b76a;
}

.kpi-red {
  background: rgba(240, 68, 56, 0.12);
  color: #f04438;
}

.kpi-neutral {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

/* PANELS */
.content-panel {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.02);
  overflow: hidden;
}

.panel-header {
  background: transparent;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
  letter-spacing: -0.01em;
}

.panel-subtitle {
  font-size: 11.5px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 1px;
}

.clean-list {
  background: transparent;
}

.attention-item {
  transition: background 0.15s ease;
  &:hover {
    background: rgba(0, 0, 0, 0.015);
  }
}

.attention-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-negative {
  background: rgba(240, 68, 56, 0.1);
  color: #f04438;
}

.wrap-warning {
  background: rgba(247, 144, 9, 0.1);
  color: #f79009;
}

body.body--dark {
  .bg-dark-subtle {
    background: rgba(255, 255, 255, 0.06);
  }
  .kpi-card,
  .content-panel {
    background: #1e2433;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .kpi-value,
  .panel-title {
    color: #f1f5f9;
  }
  .kpi-label,
  .panel-subtitle {
    color: #94a3b8;
  }
  .attention-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }
}
</style>
