<template>
  <q-page class="resource-dashboard-page">
    <div class="dashboard-wrapper">
      <!-- 1. HEADER / GREETING SECTION -->
      <div class="dashboard-header-row row items-center justify-between">
        <div class="header-text-block">
          <h1 class="welcome-heading">
            Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}!
          </h1>
          <p class="welcome-subtitle">
            Here's a real-time overview of your workload and schedule.
          </p>
        </div>
        <div class="header-action-block row items-center gap-sm">
          <q-btn
            unelevated
            no-caps
            icon="refresh"
            label="Refresh"
            class="refresh-action-btn"
            :loading="loading"
            @click="loadDashboardData"
          />
        </div>
      </div>

      <!-- SKELETON LOADING -->
      <div v-if="loading" class="row q-col-gutter-md q-mt-xs">
        <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
          <q-skeleton type="rect" height="110px" style="border-radius: 16px" />
        </div>
        <div class="col-12 q-mt-md">
          <q-skeleton type="rect" height="220px" style="border-radius: 16px" />
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
      <div v-else class="dashboard-content-grid">
        <!-- 2. HERO ROW: TODAY'S FOCUS + PRODUCTIVITY OVERVIEW -->
        <section class="hero-section-row">
          <div class="hero-grid">
            <!-- Today's Focus Card -->
            <div class="focus-hero-card">
              <div class="focus-hero-inner">
                <div class="focus-top-badge">
                  <span class="sparkle-icon">✦</span>
                  <span>Today's Focus</span>
                </div>
                <h2 class="focus-title">Plan. Prioritize. Achieve.</h2>
                <p class="focus-desc">
                  Stay on top of active deliverables, monitor your deadlines, and log progress seamlessly.
                </p>

                <div class="focus-footer-row">
                  <div class="suggested-tags-wrap gt-xs">
                    <span class="suggested-label">Suggested:</span>
                    <span class="suggested-pill" @click="goToTaskDetails()">
                      <q-icon name="assignment" size="13px" /> Tasks
                    </span>
                    <span class="suggested-pill" @click="goToProgress()">
                      <q-icon name="trending_up" size="13px" /> Progress
                    </span>
                  </div>

                  <q-btn
                    unelevated
                    no-caps
                    label="View Task Specs"
                    icon-right="arrow_forward"
                    class="focus-cta-btn"
                    @click="goToTaskDetails()"
                  />
                </div>
              </div>
            </div>

            <!-- Productivity & Workload Card -->
            <div class="productivity-card">
              <div class="productivity-header">
                <div class="prod-title">Productivity & Overview</div>
                <div class="prod-subtitle">Workload & effort tracking</div>
              </div>

              <div class="prod-metric-wrap">
                <div class="prod-circle-metric">
                  <span class="circle-val">{{ workload.consumedPct }}%</span>
                  <span class="circle-caption">Consumed</span>
                </div>
                <div class="prod-details">
                  <div class="prod-stat-line">
                    <span class="stat-dot dot-purple"></span>
                    <span class="stat-text"><strong>{{ workload.activeTasks }}</strong> Active Tasks</span>
                  </div>
                  <div class="prod-stat-line">
                    <span class="stat-dot dot-blue"></span>
                    <span class="stat-text"><strong>{{ workload.actualEffort }}h</strong> Actual Logged</span>
                  </div>
                  <div class="prod-stat-line">
                    <span class="stat-dot dot-green"></span>
                    <span class="stat-text"><strong>{{ workload.remainingEffort }}h</strong> Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. FOUR PASTEL STAT CARDS -->
        <section class="stat-cards-section">
          <div class="stat-cards-grid">
            <div
              v-for="stat in pastelStatCards"
              :key="stat.title"
              class="pastel-stat-card"
              :class="stat.themeClass"
            >
              <div class="stat-card-top">
                <div class="stat-icon-bubble">
                  <q-icon :name="stat.icon" size="20px" />
                </div>
                <span class="stat-badge-pill">{{ stat.badge }}</span>
              </div>
              <div class="stat-card-bottom">
                <div class="stat-card-value">{{ stat.value }}</div>
                <div class="stat-card-title">{{ stat.title }}</div>
                <div class="stat-card-subtitle">{{ stat.subtitle }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. WORKLOAD + TASK STATUS ROW -->
        <section class="dashboard-row-two-col">
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
        </section>

        <!-- 5. PROJECTS BREAKDOWN & ATTENTION / SELF-ASSIGNED -->
        <section class="dashboard-row-two-col">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-6">
              <ProjectsBreakdownCard :projects="projectSummary" />
            </div>

            <div class="col-12 col-md-6 column q-gutter-y-lg">
              <!-- NEEDS ATTENTION -->
              <q-card flat bordered class="attention-dashboard-card">
                <q-card-section class="row items-center justify-between q-pa-lg">
                  <div>
                    <div class="card-section-title">Needs Attention</div>
                    <div class="card-section-subtitle text-caption text-grey-6 q-mt-xs">
                      Tasks requiring urgent review or action
                    </div>
                  </div>
                  <q-badge
                    v-if="attentionTasks.length"
                    color="negative"
                    outline
                    :label="`${attentionTasks.length} items`"
                    class="attention-badge"
                  />
                </q-card-section>

                <q-separator />

                <div v-if="!attentionTasks.length" class="empty-block q-pa-lg text-center">
                  <q-icon name="check_circle" size="34px" color="positive" />
                  <div class="text-body2 text-grey-6 q-mt-sm">
                    You're on track — no tasks need immediate attention.
                  </div>
                </div>

                <q-list v-else separator class="attention-list">
                  <q-item
                    v-for="t in attentionTasks"
                    :key="t.task_id"
                    clickable
                    class="attention-item"
                    @click="goToTaskDetails(t.task_id)"
                  >
                    <q-item-section avatar>
                      <div class="attention-icon-box" :class="attentionMeta(t).boxClass">
                        <q-icon :name="attentionMeta(t).icon" size="18px" />
                      </div>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="attention-item-title">{{ t.title }}</q-item-label>
                      <q-item-label caption class="attention-item-project">{{
                        t.project_name || `Project #${t.project_id}`
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge :color="attentionMeta(t).color" :label="attentionMeta(t).label" class="urgency-pill" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>

              <!-- SELF ASSIGNED TASKS -->
              <q-card flat bordered class="self-assigned-dashboard-card">
                <q-card-section class="row items-center justify-between q-pa-lg">
                  <div>
                    <div class="card-section-title">Self-assigned tasks</div>
                    <div class="card-section-subtitle text-caption text-grey-6 q-mt-xs">
                      Tasks created by you
                    </div>
                  </div>
                  <q-badge color="primary" :label="`${selfAssignedTasks.length} tasks`" class="self-badge" />
                </q-card-section>

                <q-separator />

                <div v-if="selfAssignedTasks.length === 0" class="empty-block q-pa-lg text-center">
                  <q-icon name="assignment_ind" size="34px" color="grey-5" />
                  <div class="text-body2 text-grey-6 q-mt-sm">No self-assigned tasks yet.</div>
                  <div class="text-caption text-grey-5 q-mt-xs">
                    Tasks you create yourself will appear here.
                  </div>
                </div>

                <q-list v-else separator class="self-list">
                  <q-item v-for="task in selfAssignedTasks" :key="task.task_id" class="self-item">
                    <q-item-section avatar>
                      <div class="self-icon-box">
                        <q-icon name="assignment_ind" size="18px" />
                      </div>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="self-item-title">{{ task.title }}</q-item-label>
                      <q-item-label caption class="self-item-project">{{
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
                          class="status-badge"
                        />
                        <div class="text-caption text-weight-bold text-dark">
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

        <!-- 6. MY GANTT / TIMELINE SECTION -->
        <section class="gantt-section-row">
          <div class="gantt-card-wrapper">
            <ResourceGanttChart :tasks="ganttTasks" />
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
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

const pastelStatCards = computed(() => [
  {
    title: 'Total Tasks',
    value: tasks.value.length,
    subtitle: 'All assigned tasks',
    badge: 'Workspace',
    icon: 'task_alt',
    themeClass: 'stat-theme-sky',
  },
  {
    title: 'In Progress',
    value: activeTasksCount.value,
    subtitle: 'Active work',
    badge: 'Ongoing',
    icon: 'sync',
    themeClass: 'stat-theme-amber',
  },
  {
    title: 'Completed',
    value: completedTasksCount.value,
    subtitle: 'Done',
    badge: 'Delivered',
    icon: 'check_circle',
    themeClass: 'stat-theme-mint',
  },
  {
    title: 'Delayed',
    value: delayedTasksCount.value,
    subtitle: 'Need attention',
    badge: 'Urgent',
    icon: 'warning',
    themeClass: 'stat-theme-rose',
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
    { label: 'On Hold', value: onHold, color: '#8B6FD8' },
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
    return {
      icon: 'warning',
      color: 'negative',
      label: 'Overdue',
      boxClass: 'box-red',
    };
  }
  return {
    icon: 'priority_high',
    color: 'deep-orange',
    label: 'Critical',
    boxClass: 'box-orange',
  };
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

function goToTaskDetails(id?: number) {
  if (id) {
    void router.push(`/app/resource-dashboard/task-details/${id}`);
  } else {
    void router.push('/app/resource-dashboard/task-details');
  }
}

function goToProgress() {
  void router.push('/app/resource-dashboard/progress');
}
</script>

<style scoped lang="scss">
.resource-dashboard-page {
  padding: 24px 32px 48px;
  background: var(--wo-bg-page, #f8f9fa);
  min-height: 100vh;
}

.dashboard-wrapper {
  max-width: 1380px;
  margin: 0 auto;
}

/* 1. Header Section */
.dashboard-header-row {
  margin-bottom: 22px;
}

.welcome-heading {
  font-size: 24px;
  font-weight: 800;
  color: var(--wo-text-main, #121620);
  letter-spacing: -0.02em;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 13.5px;
  color: var(--wo-text-muted, #64748b);
  margin: 0;
}

.refresh-action-btn {
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #1e293b);
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 10px;
  font-weight: 700;
  font-size: 12.5px;
  padding: 7px 16px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  transition: all 0.16s ease;

  &:hover {
    color: var(--wo-primary, #8b6fd8);
    border-color: var(--wo-primary, #8b6fd8);
    background: var(--wo-primary-light, #f5f3ff);
  }
}

.dashboard-content-grid {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* 2. Hero Section */
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.2fr);
  gap: 16px;
}

.focus-hero-card {
  border-radius: 18px;
  background-image: url('/projects/todays_focus_hero.jpg');
  background-size: cover;
  background-position: center;
  color: #ffffff;
  padding: 26px 28px;
  box-shadow: 0 8px 24px rgba(18, 22, 32, 0.14);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 220px;

  /* Crisp Dark Overlay for Maximum Readability */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(15, 23, 42, 0.85) 0%,
      rgba(30, 27, 75, 0.68) 50%,
      rgba(15, 23, 42, 0.32) 100%
    );
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.focus-top-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.focus-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.focus-desc {
  font-size: 13px;
  opacity: 0.95;
  line-height: 1.45;
  max-width: 480px;
  margin: 0 0 20px 0;
}

.focus-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.suggested-tags-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggested-label {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.9;
}

.suggested-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-1px);
  }
}

.focus-cta-btn {
  background: #ffffff;
  color: #121620;
  border-radius: 10px;
  font-weight: 800;
  font-size: 12px;
  padding: 7px 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  transition: all 0.16s ease;

  &:hover {
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
  }
}

/* Productivity Overview Card */
.productivity-card {
  border-radius: 18px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  padding: 22px 24px;
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.prod-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.prod-subtitle {
  font-size: 11.5px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 2px;
}

.prod-metric-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 14px;
}

.prod-circle-metric {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 111, 216, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
  border: 3px solid var(--wo-primary, #8b6fd8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .circle-val {
    font-size: 18px;
    font-weight: 800;
    color: var(--wo-primary, #8b6fd8);
    line-height: 1;
  }

  .circle-caption {
    font-size: 9.5px;
    font-weight: 700;
    color: var(--wo-text-muted, #64748b);
    text-transform: uppercase;
    margin-top: 2px;
  }
}

.prod-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prod-stat-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--wo-text-main, #334155);
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-purple { background: #8b6fd8; }
  &.dot-blue { background: #3b82f6; }
  &.dot-green { background: #10b981; }
}

/* 3. Pastel Stat Cards Section */
.stat-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.pastel-stat-card {
  border-radius: 16px;
  padding: 16px 18px;
  border: 1px solid var(--wo-border, #edf0f5);
  background: var(--wo-bg-card, #ffffff);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 110px;
  transition: transform 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 24, 40, 0.06);
  }

  &.stat-theme-sky {
    background: #f0f7ff;
    border-color: #dbeafe;
    .stat-icon-bubble { background: #dbeafe; color: #1d4ed8; }
    .stat-badge-pill { background: #dbeafe; color: #1d4ed8; }
    .stat-card-value { color: #1e3a8a; }
  }

  &.stat-theme-amber {
    background: #fffbf0;
    border-color: #fef3c7;
    .stat-icon-bubble { background: #fef3c7; color: #d97706; }
    .stat-badge-pill { background: #fef3c7; color: #d97706; }
    .stat-card-value { color: #92400e; }
  }

  &.stat-theme-mint {
    background: #f0fdf4;
    border-color: #dcfce7;
    .stat-icon-bubble { background: #dcfce7; color: #059669; }
    .stat-badge-pill { background: #dcfce7; color: #059669; }
    .stat-card-value { color: #065f46; }
  }

  &.stat-theme-rose {
    background: #fff5f5;
    border-color: #fee2e2;
    .stat-icon-bubble { background: #fee2e2; color: #dc2626; }
    .stat-badge-pill { background: #fee2e2; color: #dc2626; }
    .stat-card-value { color: #991b1b; }
  }
}

body.body--dark {
  .pastel-stat-card {
    background: #181d28 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;

    .stat-card-value { color: #f3f4f6 !important; }
    .stat-card-title { color: #cbd5e1 !important; }
    .stat-card-subtitle { color: #94a3b8 !important; }
  }
}

.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-icon-bubble {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-badge-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.stat-card-bottom {
  margin-top: 10px;
}

.stat-card-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-card-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #334155);
  margin-top: 4px;
}

.stat-card-subtitle {
  font-size: 11px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 1px;
}

/* 4 & 5. Section Rows */
.attention-dashboard-card,
.self-assigned-dashboard-card {
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
}

.card-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.attention-badge,
.self-badge {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
}

.attention-item,
.self-item {
  padding: 12px 18px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--wo-bg-page, #f8fafc);
  }
}

.attention-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.box-red {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
  &.box-orange {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
  }
}

.self-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(139, 111, 216, 0.12);
  color: var(--wo-primary, #8b6fd8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.attention-item-title,
.self-item-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.attention-item-project,
.self-item-project {
  font-size: 11px;
  color: var(--wo-text-muted, #64748b);
}

.urgency-pill,
.status-badge {
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 7px;
}

/* 6. Gantt Schedule Row */
.gantt-card-wrapper {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--wo-border, #eaecef);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
}

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .stat-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .resource-dashboard-page {
    padding: 16px;
  }

  .stat-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>

