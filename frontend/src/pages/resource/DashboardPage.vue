<template>
  <q-page class="pm-page resource-dashboard-page">
    <div class="q-mx-auto" style="max-width: 1380px">
      <!-- 1. HEADER / GREETING SECTION -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div class="page-title">Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}!</div>
          <div class="page-subtitle">
            Here's a real-time overview of your workload, progress, and scheduled tasks.
          </div>
        </div>

        <q-btn
          outline
          no-caps
          icon="refresh"
          label="Refresh"
          class="action-btn-outline"
          :loading="loading"
          @click="loadDashboardData"
        />
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
      <div v-else class="dashboard-body-container">
        <!-- 2. HERO ROW: TODAY'S FOCUS + PRODUCTIVITY OVERVIEW (MATCHING PM SIDE) -->
        <div class="q-mb-lg">
          <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
            <div class="row">
              <!-- Left Side: Hero Workspace Image Container with Overlaid Text & Actions -->
              <div
                class="col-12 col-md-7 q-pa-lg text-white row column justify-between"
                :style="{
                  backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.35) 100%), url('/projects/todays_focus_hero.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '280px',
                }"
              >
                <div>
                  <div class="row items-center justify-between q-mb-md">
                    <q-chip dense color="white" text-color="purple-9" class="text-weight-bold">
                      ✦ TODAY'S FOCUS
                    </q-chip>
                    <q-btn
                      round
                      flat
                      dense
                      icon="arrow_forward"
                      color="white"
                      title="View Task Specs"
                      @click="goToTaskDetails()"
                    />
                  </div>

                  <h2 class="text-h5 text-weight-bold text-white q-ma-none q-mb-xs">
                    Plan. Prioritize. Achieve.
                  </h2>
                  <p
                    class="text-body2 q-mb-md"
                    style="max-width: 480px; color: rgba(255, 255, 255, 0.88)"
                  >
                    Stay on top of active deliverables, monitor your deadlines, and log progress
                    seamlessly.
                  </p>
                </div>

                <div class="row items-center justify-between wrap gap-sm">
                  <q-btn
                    unelevated
                    no-caps
                    color="white"
                    text-color="primary"
                    label="View Task Specs"
                    icon-right="arrow_forward"
                    class="text-weight-bold"
                    style="border-radius: 8px"
                    @click="goToTaskDetails()"
                  />
                  <div class="row items-center q-gutter-xs gt-xs">
                    <q-chip
                      clickable
                      dense
                      color="black"
                      text-color="white"
                      icon="assignment"
                      class="text-caption text-weight-bold"
                      @click="goToTaskDetails()"
                    >
                      Tasks
                    </q-chip>
                    <q-chip
                      clickable
                      dense
                      color="black"
                      text-color="blue-4"
                      icon="calendar_month"
                      class="text-caption text-weight-bold"
                      @click="goToSchedule()"
                    >
                      Schedule
                    </q-chip>
                    <q-chip
                      clickable
                      dense
                      color="black"
                      text-color="green-4"
                      icon="trending_up"
                      class="text-caption text-weight-bold"
                      @click="goToProgress()"
                    >
                      Progress
                    </q-chip>
                  </div>
                </div>
              </div>

              <!-- Right Side: Structured Productivity & Overview Panel -->
              <div
                class="col-12 col-md-5 q-pa-lg row column justify-between border-left-subtle bg-card text-main"
              >
                <div>
                  <div class="row items-center justify-between q-mb-sm">
                    <div>
                      <div class="text-subtitle1 text-weight-bold text-main">
                        Productivity & Overview
                      </div>
                      <div class="text-caption text-muted">Workload & effort tracking</div>
                    </div>
                    <q-chip
                      dense
                      square
                      :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                      :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                      class="text-weight-bold"
                    >
                      {{ workload.activeTasks }} Active Tasks
                    </q-chip>
                  </div>

                  <div class="row items-center gap-md q-mt-md">
                    <div class="productivity-ring-container">
                      <svg viewBox="0 0 86 86" class="productivity-svg">
                        <circle
                          cx="43"
                          cy="43"
                          r="36"
                          fill="none"
                          stroke="var(--wo-border, #eef0f4)"
                          stroke-width="7"
                        />
                        <circle
                          cx="43"
                          cy="43"
                          r="36"
                          fill="none"
                          stroke="var(--wo-primary, #8b6fd8)"
                          stroke-width="7"
                          :stroke-dasharray="226.19"
                          :stroke-dashoffset="226.19 * (1 - workload.consumedPct / 100)"
                          stroke-linecap="round"
                          style="
                            transform: rotate(-90deg);
                            transform-origin: center;
                            transition: stroke-dashoffset 0.5s ease;
                          "
                        />
                      </svg>
                      <div class="productivity-ring-center">
                        <div
                          class="text-subtitle1 text-weight-bolder text-primary"
                          style="line-height: 1"
                        >
                          {{ workload.consumedPct }}%
                        </div>
                        <div class="ring-sub-label">CONSUMED</div>
                      </div>
                    </div>

                    <div class="column gap-xs">
                      <div class="row items-center gap-xs">
                        <q-badge rounded style="background: #8b6fd8; width: 8px; height: 8px" />
                        <span class="text-body2 text-main">
                          <strong>{{ workload.activeTasks }}</strong> Active Tasks
                        </span>
                      </div>
                      <div class="row items-center gap-xs">
                        <q-badge rounded style="background: #3b82f6; width: 8px; height: 8px" />
                        <span class="text-body2 text-main">
                          <strong>{{ formatHours(workload.actualEffort) }}</strong> Actual Logged
                        </span>
                      </div>
                      <div class="row items-center gap-xs">
                        <q-badge rounded style="background: #10b981; width: 8px; height: 8px" />
                        <span class="text-body2 text-main">
                          <strong>{{ formatHours(workload.remainingEffort) }}</strong> Remaining
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="row items-center justify-between q-mt-md q-pt-sm text-caption text-muted border-top-subtle"
                >
                  <span>Capacity Allocated: {{ formatHours(workload.expectedEffort) }}</span>
                  <span
                    class="text-weight-bold"
                    :class="workload.consumedPct > 100 ? 'text-negative' : 'text-positive'"
                  >
                    {{ workload.consumedPct > 100 ? 'Over Allocated' : 'On Track' }}
                  </span>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- 3. FOUR PASTEL STAT CARDS -->
        <div class="row q-col-gutter-md">
          <div v-for="stat in pastelStatCards" :key="stat.title" class="col-12 col-sm-6 col-md-3">
            <StatCard
              :title="stat.title"
              :value="stat.value"
              :subtitle="stat.subtitle"
              :badge="stat.badge"
              :icon="stat.icon"
              :color="stat.color"
              :negative="stat.negative"
            />
          </div>
        </div>

        <!-- 4. WORKLOAD + TASK STATUS ROW -->
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <WorkloadCard
              :allocated-hours="workload.expectedEffort"
              :actual-hours="workload.actualEffort"
              :remaining-hours="workload.remainingEffort"
              :assigned-tasks="workload.activeTasks"
            />
          </div>
          <div class="col-12 col-md-6">
            <TaskStatusCard :items="taskStatus" />
          </div>
        </div>

        <!-- 5. PROJECTS BREAKDOWN (FULL WIDTH) -->
        <div v-if="projectSummary.length">
          <ProjectsBreakdownCard :projects="projectSummary" />
        </div>

        <!-- 6. NEEDS ATTENTION (FULL WIDTH) -->
        <div>
          <q-card flat bordered class="dashboard-card" style="border-radius: 14px">
            <q-card-section class="row items-center justify-between q-pa-md">
              <div>
                <div class="text-subtitle1 text-weight-bold text-main">Needs Attention</div>
                <div class="text-caption text-muted">Tasks requiring urgent review or action</div>
              </div>
              <q-badge
                v-if="attentionTasks.length"
                color="negative"
                outline
                :label="`${attentionTasks.length} items`"
              />
            </q-card-section>

            <q-separator />

            <div v-if="!attentionTasks.length" class="q-pa-lg text-center text-muted">
              <q-icon name="check_circle" size="34px" color="positive" />
              <div class="text-body2 q-mt-sm text-main">
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
                  <q-avatar
                    size="34px"
                    :color="attentionMeta(t).color === 'negative' ? 'red-1' : 'orange-1'"
                    :text-color="attentionMeta(t).color === 'negative' ? 'negative' : 'deep-orange'"
                    :icon="attentionMeta(t).icon"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-main">{{ t.title }}</q-item-label>
                  <q-item-label caption class="text-muted">{{
                    t.project_name || `Project #${t.project_id}`
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    dense
                    square
                    :color="attentionMeta(t).color === 'negative' ? 'red-1' : 'orange-1'"
                    :text-color="attentionMeta(t).color === 'negative' ? 'negative' : 'deep-orange'"
                    class="text-caption text-weight-bold"
                  >
                    {{ attentionMeta(t).label }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- 7. SELF ASSIGNED TASKS (FULL WIDTH) -->
        <div>
          <q-card flat bordered class="dashboard-card" style="border-radius: 14px">
            <q-card-section class="row items-center justify-between q-pa-md">
              <div>
                <div class="text-subtitle1 text-weight-bold text-main">Self-Assigned Tasks</div>
                <div class="text-caption text-muted">Tasks created by you</div>
              </div>
              <q-chip
                dense
                square
                color="purple-1"
                text-color="primary"
                class="text-caption text-weight-bold"
              >
                {{ selfAssignedTasks.length }} tasks
              </q-chip>
            </q-card-section>

            <q-separator />

            <div v-if="selfAssignedTasks.length === 0" class="q-pa-lg text-center text-muted">
              <q-avatar size="44px" color="grey-2" text-color="grey-7" icon="assignment_ind" />
              <div class="text-body2 q-mt-sm text-main">No self-assigned tasks yet.</div>
              <div class="text-caption q-mt-xs">Tasks you create yourself will appear here.</div>
            </div>

            <q-list v-else separator>
              <q-item v-for="taskItem in selfAssignedTasks" :key="taskItem.task_id">
                <q-item-section avatar>
                  <q-avatar
                    size="34px"
                    color="purple-1"
                    text-color="primary"
                    icon="assignment_ind"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-main">{{
                    taskItem.title
                  }}</q-item-label>
                  <q-item-label caption class="text-muted">{{
                    taskItem.project_name || `Project #${taskItem.project_id}`
                  }}</q-item-label>
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
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate, formatHours, formatNumber } from '@/utils/formatters';
import { isOverdue } from '@/utils/taskHelpers';
import {
  getTasksApi,
  getResourceWorkloadApi,
  type Task,
  type ResourceWorkload,
} from '@/services/api';
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

const activeTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED').length,
);

const completedTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'COMPLETED').length,
);

const delayedTasksCount = computed(
  () => tasks.value.filter((t) => isOverdue(t) && t.status !== 'COMPLETED').length,
);

const pastelStatCards = computed(() => [
  {
    title: 'Total Tasks',
    value: tasks.value.length,
    subtitle: 'All assigned tasks',
    badge: 'Workspace',
    icon: 'task_alt',
    color: 'sky',
    negative: false,
  },
  {
    title: 'In Progress',
    value: activeTasksCount.value,
    subtitle: 'Active work',
    badge: 'Ongoing',
    icon: 'sync',
    color: 'amber',
    negative: false,
  },
  {
    title: 'Completed',
    value: completedTasksCount.value,
    subtitle: 'Done',
    badge: 'Delivered',
    icon: 'check_circle',
    color: 'mint',
    negative: false,
  },
  {
    title: 'Delayed',
    value: delayedTasksCount.value,
    subtitle: 'Need attention',
    badge: 'Urgent',
    icon: 'warning',
    color: 'rose',
    negative: delayedTasksCount.value > 0,
  },
]);

const workload = computed(() => {
  if (workloadData.value) {
    const expected = Number(workloadData.value.total_expected_effort) || 0;
    const actual = Number(workloadData.value.total_actual_effort) || 0;
    const remaining = Math.max(0, formatNumber(expected - actual));
    const consumedPct = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
    const activeTasks = Number(workloadData.value.active_tasks_count) || activeTasksCount.value;

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
  tasks.value.forEach((t) => {
    expected += Number(t.expected_effort) || 0;
    actual += Number(t.actual_effort) || 0;
  });

  const remaining = Math.max(0, formatNumber(expected - actual));
  const consumedPct = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;

  return {
    expectedEffort: formatNumber(expected),
    actualEffort: formatNumber(actual),
    remainingEffort: remaining,
    activeTasks: activeTasksCount.value,
    consumedPct,
    overEstimate: actual > expected,
  };
});

const taskStatus = computed(() => {
  const unassigned = tasks.value.filter((t) => t.status === 'UNASSIGNED').length;
  const scheduled = tasks.value.filter((t) => t.status === 'SCHEDULED').length;
  const inProgress = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;

  return [
    { label: 'Unassigned', value: unassigned, color: '#64748B' },
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
    project_id: p.project_id,
    project: p.project,
    tasks: p.tasks,
    progress: Math.round(p.progressSum / (p.tasks || 1)),
    status: p.hasDelayed ? ('Delayed' as const) : ('On Track' as const),
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

function goToTaskDetails(id?: number) {
  if (id) {
    void router.push(`/app/resource-dashboard/task-details/${id}`);
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
.border-subtle {
  border: 1px solid var(--wo-border, #eaecef);
}

.border-left-subtle {
  border-left: 1px solid var(--wo-border, #eaecef);
}

.border-top-subtle {
  border-top: 1px solid var(--wo-border, #eaecef);
}

.bg-subtle {
  background: var(--wo-bg-subtle, #f8fafc);
}

@media (max-width: 1023px) {
  .border-left-subtle {
    border-left: none !important;
    border-top: 1px solid var(--wo-border, #eaecef) !important;
  }
}

.productivity-ring-container {
  position: relative;
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 86px;
}

.productivity-svg {
  width: 100%;
  height: 100%;
}

.productivity-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.ring-sub-label {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--wo-text-muted, #94a3b8);
  line-height: 1;
  margin-top: 2px;
}

.resource-dashboard-page {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.dashboard-body-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;

  > div {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
}

body.body--dark {
  .border-subtle {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  .border-left-subtle {
    border-left-color: rgba(255, 255, 255, 0.08) !important;
  }
  .border-top-subtle {
    border-top-color: rgba(255, 255, 255, 0.08) !important;
  }
  .bg-subtle {
    background: rgba(255, 255, 255, 0.04) !important;
  }
}
</style>
