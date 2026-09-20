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

        <!-- Quick action buttons -->
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
            :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            @click="goToSchedule()"
          />
          <q-btn
            flat
            no-caps
            icon="trending_up"
            label="Progress"
            class="action-btn text-weight-medium gt-xs"
            :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
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
        <!-- 02. REUSABLE STAT CARDS (4 KPI METRICS) -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <StatCard
              title="Total Tasks"
              :value="tasks.length"
              subtitle="All assigned deliverables"
              icon="task_alt"
              color="blue"
              note-class="note-blue"
              @click="goToTaskDetails()"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <StatCard
              title="In Progress"
              :value="activeTasksCount"
              :subtitle="
                tasks.length
                  ? `${Math.round((activeTasksCount / tasks.length) * 100)}% active workload`
                  : 'No active tasks'
              "
              icon="sync"
              color="purple"
              note-class="note-purple"
              @click="goToTaskDetails(undefined, { status: 'IN_PROGRESS' })"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <StatCard
              title="Supervised"
              :value="supervisedTasksCount"
              subtitle="Deliverables under review"
              icon="verified_user"
              color="green"
              note-class="note-green"
              @click="goToTaskDetails(undefined, { scope: 'supervised' })"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <StatCard
              title="Delayed"
              :value="delayedTasksCount"
              :subtitle="
                delayedTasksCount > 0
                  ? `${delayedTasksCount} ${delayedTasksCount === 1 ? 'task needs' : 'tasks need'} attention`
                  : 'All tasks on schedule'
              "
              icon="warning"
              color="red"
              note-class="note-red"
              :negative="delayedTasksCount > 0"
              @click="goToTaskDetails(undefined, { atRisk: 'true' })"
            />
          </div>
        </div>

        <!-- 03. BALANCED 2-COLUMN SPLIT (EQUAL HEIGHT, ZERO DEAD SPACE) -->
        <div class="row q-col-gutter-lg q-mt-xs">
          <!-- LEFT COLUMN: Tasks Across Projects & Attention Items -->
          <div class="col-12 col-md-7 col-lg-8">
            <div class="column q-gutter-y-lg">
              <!-- Projects Breakdown -->
              <ProjectsBreakdownCard v-if="projectSummary.length" :projects="projectSummary" />

              <!-- Tasks Requiring Attention -->
              <q-card flat bordered class="rounded-borders overflow-hidden">
                <q-card-section class="q-pa-md row items-center justify-between no-wrap">
                  <div style="min-width: 0" class="q-pr-sm">
                    <div
                      class="text-subtitle1 text-weight-bold ellipsis"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      Tasks Requiring Attention
                    </div>
                    <div
                      class="text-caption ellipsis"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                    >
                      Overdue and critical deliverables
                    </div>
                  </div>
                  <q-badge
                    v-if="attentionTasks.length"
                    color="negative"
                    outline
                    :label="`${attentionTasks.length} items`"
                    class="text-weight-bold col-auto"
                  />
                </q-card-section>

                <q-separator />

                <div v-if="!attentionTasks.length" class="q-pa-lg text-center text-grey-6">
                  <q-icon name="check_circle" size="34px" color="positive" />
                  <div
                    class="text-body2 q-mt-sm"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    You're on track — no tasks need immediate attention.
                  </div>
                </div>

                <q-list v-else separator>
                  <q-item
                    v-for="t in attentionTasks"
                    :key="t.task_id"
                    clickable
                    v-ripple
                    class="q-py-sm cursor-pointer"
                    @click="goToTaskDetails(t.task_id)"
                  >
                    <q-item-section avatar>
                      <q-avatar
                        size="32px"
                        rounded
                        :color="
                          attentionMeta(t).color === 'negative'
                            ? $q.dark.isActive
                              ? 'red-10'
                              : 'red-1'
                            : $q.dark.isActive
                              ? 'orange-10'
                              : 'orange-1'
                        "
                        :text-color="
                          attentionMeta(t).color === 'negative' ? 'negative' : 'deep-orange'
                        "
                        :icon="attentionMeta(t).icon"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label
                        class="text-weight-bold ellipsis"
                        :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                        :title="t.title"
                      >
                        {{ t.title }}
                      </q-item-label>
                      <q-item-label caption class="text-grey-6 ellipsis">
                        {{ t.project_name || `Project #${t.project_id}` }}
                        <span v-if="t.deadline"> · Due {{ formatDate(t.deadline) }}</span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip
                        dense
                        square
                        :color="
                          attentionMeta(t).color === 'negative'
                            ? $q.dark.isActive
                              ? 'red-10'
                              : 'red-1'
                            : $q.dark.isActive
                              ? 'orange-10'
                              : 'orange-1'
                        "
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

              <!-- Self-Assigned Tasks (Displayed when available to avoid empty blank boxes) -->
              <q-card
                v-if="selfAssignedTasks.length > 0"
                flat
                bordered
                class="rounded-borders overflow-hidden"
              >
                <q-card-section class="q-pa-md row items-center justify-between no-wrap">
                  <div style="min-width: 0" class="q-pr-sm">
                    <div
                      class="text-subtitle1 text-weight-bold ellipsis"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      Self-Assigned Tasks
                    </div>
                    <div
                      class="text-caption ellipsis"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                    >
                      Tasks initiated by you
                    </div>
                  </div>
                  <q-chip
                    dense
                    square
                    :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                    :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                    class="text-caption text-weight-bold col-auto"
                  >
                    {{ selfAssignedTasks.length }}
                  </q-chip>
                </q-card-section>

                <q-separator />

                <q-list separator>
                  <q-item
                    v-for="taskItem in selfAssignedTasks.slice(0, 4)"
                    :key="taskItem.task_id"
                    clickable
                    v-ripple
                    class="q-py-sm cursor-pointer"
                    @click="goToTaskDetails(taskItem.task_id)"
                  >
                    <q-item-section>
                      <q-item-label
                        class="text-weight-bold ellipsis"
                        :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                        :title="taskItem.title"
                      >
                        {{ taskItem.title }}
                      </q-item-label>
                      <q-item-label caption class="text-grey-6 ellipsis">
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
                        <div
                          class="text-caption text-weight-bold"
                          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                        >
                          {{ Number(taskItem.progress) || 0 }}%
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>

              <!-- Supervised Tasks (Tasks you oversee & review, separated from self-initiated tasks) -->
              <q-card
                v-if="supervisedTasks.length > 0"
                flat
                bordered
                class="rounded-borders overflow-hidden"
              >
                <q-card-section class="q-pa-md row items-center justify-between no-wrap">
                  <div style="min-width: 0" class="q-pr-sm">
                    <div
                      class="text-subtitle1 text-weight-bold ellipsis row items-center gap-xs"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      <q-icon name="verified_user" size="20px" color="amber-9" class="q-mr-xs" />
                      <span>Supervised Tasks</span>
                    </div>
                    <div
                      class="text-caption ellipsis"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                    >
                      Deliverables you oversee &amp; review
                    </div>
                  </div>
                  <q-chip
                    dense
                    square
                    :color="$q.dark.isActive ? 'amber-10' : 'amber-1'"
                    :text-color="$q.dark.isActive ? 'amber-2' : 'amber-9'"
                    class="text-caption text-weight-bold col-auto"
                  >
                    {{ supervisedTasks.length }}
                  </q-chip>
                </q-card-section>

                <q-separator />

                <q-list separator>
                  <q-item
                    v-for="taskItem in supervisedTasks.slice(0, 4)"
                    :key="taskItem.task_id"
                    clickable
                    v-ripple
                    class="q-py-sm cursor-pointer"
                    @click="goToTaskDetails(taskItem.task_id)"
                  >
                    <q-item-section>
                      <q-item-label
                        class="text-weight-bold ellipsis"
                        :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                        :title="taskItem.title"
                      >
                        {{ taskItem.title }}
                      </q-item-label>
                      <q-item-label caption class="text-grey-6 ellipsis">
                        {{ taskItem.project_name || `Project #${taskItem.project_id}` }}
                        <span v-if="taskItem.created_by_name"> · Assigned by {{ taskItem.created_by_name }}</span>
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
                        <div
                          class="text-caption text-weight-bold"
                          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                        >
                          {{ Number(taskItem.progress) || 0 }}%
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </div>

          <!-- RIGHT COLUMN: Effort & Workload and Task Distribution -->
          <div class="col-12 col-md-5 col-lg-4">
            <div class="column q-gutter-y-lg">
              <!-- Effort & Workload -->
              <WorkloadCard
                :allocated-hours="workload.expectedEffort"
                :actual-hours="workload.actualEffort"
                :remaining-hours="workload.remainingEffort"
                :assigned-tasks="workload.activeTasks"
              />

              <!-- Task Status Distribution -->
              <TaskStatusCard :items="taskStatus" />
            </div>
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
import StatCard from '@/components/dashboard/StatCard.vue';
import WorkloadCard from '@/components/resource/WorkloadCard.vue';
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue';
import ProjectsBreakdownCard, {
  type ProjectBreakdownRow,
} from '@/components/resource/ProjectsBreakdownCard.vue';
import { formatDate, formatNumber } from '@/utils/formatters';
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
  const activeTasks = inProgressTasksCount.value;

  return {
    expectedEffort: formatNumber(expected),
    actualEffort: formatNumber(actual),
    remainingEffort: remaining,
    activeTasks,
    consumedPct,
    overEstimate: actual > expected,
  };
});

const taskStatus = computed(() => {
  const counts: Record<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED', number> = {
    SCHEDULED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
  };
  tasks.value.forEach((t) => {
    if (t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS' || t.status === 'COMPLETED') {
      counts[t.status]++;
    }
  });

  return [
    { label: 'Scheduled', value: counts.SCHEDULED, color: '#8b6fd8' },
    { label: 'In Progress', value: counts.IN_PROGRESS, color: '#2e90fa' },
    { label: 'Completed', value: counts.COMPLETED, color: '#12b76a' },
  ];
});

const attentionTasks = computed(() => {
  return tasks.value
    .filter((t) => t.status !== 'COMPLETED' && (isOverdue(t) || t.priority === 'HIGH'))
    .slice(0, 5);
});

const selfAssignedTasks = computed(() => {
  const myId = currentUserId.value;
  if (!myId) return [];
  return tasks.value.filter((t) => Number(t.created_by) === myId);
});

const supervisedTasks = computed(() => {
  const myId = currentUserId.value;
  if (!myId) return [];
  return tasks.value.filter(
    (t) => Number(t.supervisor_id) === myId && Number(t.created_by) !== myId,
  );
});

const projectSummary = computed<ProjectBreakdownRow[]>(() => {
  const map = new Map<
    string,
    { total: number; done: number; deadline: string; delayed: boolean }
  >();
  tasks.value.forEach((t) => {
    const key = t.project_name || `Project #${t.project_id}`;
    const curr = map.get(key) || {
      total: 0,
      done: 0,
      deadline: t.deadline || '',
      delayed: false,
    };
    curr.total++;
    if (t.status === 'COMPLETED') curr.done++;
    if (isOverdue(t) && t.status !== 'COMPLETED') curr.delayed = true;
    if (t.deadline && (!curr.deadline || new Date(t.deadline) < new Date(curr.deadline))) {
      curr.deadline = t.deadline;
    }
    map.set(key, curr);
  });

  return Array.from(map.entries()).map(([project, data]) => {
    const progress = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
    let status: ProjectBreakdownRow['status'] = 'On Track';
    if (data.delayed) {
      status = 'Delayed';
    } else if (progress < 50 && data.deadline && new Date(data.deadline) < new Date()) {
      status = 'At Risk';
    }

    return {
      project,
      tasks: data.total,
      status,
      progress,
      deadline: data.deadline ? formatDate(data.deadline) : 'No due date',
    };
  });
});

function attentionMeta(t: Task) {
  if (isOverdue(t)) {
    return { label: 'Overdue', color: 'negative', icon: 'warning' };
  }
  return { label: 'High Priority', color: 'warning', icon: 'priority_high' };
}

function statusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return $q.dark.isActive ? 'green-10' : 'green-1';
    case 'IN_PROGRESS':
      return $q.dark.isActive ? 'blue-10' : 'blue-1';
    case 'SCHEDULED':
      return $q.dark.isActive ? 'purple-10' : 'purple-1';
    case 'ON_HOLD':
      return $q.dark.isActive ? 'orange-10' : 'orange-1';
    case 'CANCELLED':
      return $q.dark.isActive ? 'red-10' : 'red-1';
    default:
      return $q.dark.isActive ? 'grey-9' : 'grey-2';
  }
}

function statusTextColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return $q.dark.isActive ? 'green-2' : 'positive';
    case 'IN_PROGRESS':
      return $q.dark.isActive ? 'blue-2' : 'blue-8';
    case 'SCHEDULED':
      return $q.dark.isActive ? 'purple-2' : 'primary';
    case 'ON_HOLD':
      return $q.dark.isActive ? 'orange-2' : 'deep-orange';
    case 'CANCELLED':
      return $q.dark.isActive ? 'red-2' : 'negative';
    default:
      return $q.dark.isActive ? 'grey-4' : 'grey-8';
  }
}

function goToTaskDetails(taskId?: number, queryParams?: Record<string, string>) {
  const query: Record<string, string> = { ...queryParams };
  if (taskId) {
    query.taskId = String(taskId);
  }
  void router.push({
    path: '/app/resource-dashboard/task-details',
    query,
  });
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
  min-height: 100vh;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
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
</style>
