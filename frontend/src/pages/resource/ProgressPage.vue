<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <!-- PAGE HEADER -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div
          class="page-title text-h5 text-weight-bold"
          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
        >
          Progress
        </div>
        <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          Track your work, effort, deadlines and task progress.
        </div>
      </div>

      <q-btn
        outline
        no-caps
        dense
        icon="refresh"
        label="Refresh"
        :color="$q.dark.isActive ? 'grey-4' : 'primary'"
        :loading="loading"
        @click="loadTasks"
      />
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
        <q-skeleton type="rect" height="140px" animation="fade" class="rounded-borders" />
      </div>
    </div>

    <!-- ERROR -->
    <q-banner v-else-if="error" class="bg-negative text-white q-mb-lg" rounded>
      {{ error }}
      <template #action>
        <q-btn flat no-caps label="Retry" @click="loadTasks" />
      </template>
    </q-banner>

    <template v-else>
      <!-- PROGRESS SUMMARY CARDS -->
      <div class="row q-col-gutter-md q-mb-lg items-stretch">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Overall Progress"
            :value="`${overallProgress}%`"
            icon="insights"
            color="primary"
            :progress="overallProgress"
            @click="router.push('/app/resource-dashboard/task-details')"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed"
            :value="completedTasks"
            :subtitle="`${completedTasks} of ${assignedTasks.length} tasks completed`"
            icon="check_circle"
            color="positive"
            note-class="stat-green"
            @click="
              router.push({
                path: '/app/resource-dashboard/task-details',
                query: { status: 'COMPLETED' },
              })
            "
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Active Tasks"
            :value="activeTasks"
            subtitle="Tasks currently in progress"
            icon="autorenew"
            color="info"
            note-class="stat-blue"
            @click="
              router.push({
                path: '/app/resource-dashboard/task-details',
                query: { status: 'IN_PROGRESS' },
              })
            "
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Remaining Effort"
            :value="formatHours(actualHoursRemaining)"
            :subtitle="`${delayedTasks} delayed`"
            icon="hourglass_empty"
            color="warning"
            :note-class="delayedTasks ? 'note-red' : 'note-green'"
            :negative="delayedTasks > 0"
            @click="
              router.push({
                path: '/app/resource-dashboard/task-details',
                query: { atRisk: 'true' },
              })
            "
          />
        </div>
      </div>

      <!-- ROW 1: STATUS DISTRIBUTION + EFFORT ANALYSIS -->
      <div class="row q-col-gutter-md q-mb-lg items-stretch">
        <!-- 1. Status Distribution: My Task Status (Donut) -->
        <div class="col-12 col-lg-5">
          <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
            <div class="chart-card-header row items-center justify-between">
              <div class="row items-center">
                <q-avatar
                  size="34px"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="donut_large"
                />
                <div class="q-ml-sm">
                  <div class="chart-title" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                    My Task Status
                  </div>
                  <div
                    class="chart-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Current breakdown of your assigned tasks
                  </div>
                </div>
              </div>
              <div class="badge-tag" :class="$q.dark.isActive ? 'badge-dark' : ''">
                Distribution
              </div>
            </div>
            <q-card-section class="q-pa-sm relative-position">
              <div ref="statusChartRef" class="echarts-box"></div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 2. Effort Analysis: My Effort Analysis (Grouped Horizontal Bar) -->
        <div class="col-12 col-lg-7">
          <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
            <div class="chart-card-header row items-center justify-between">
              <div class="row items-center">
                <q-avatar
                  size="34px"
                  :color="$q.dark.isActive ? 'orange-10' : 'orange-1'"
                  :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'"
                  icon="timer"
                />
                <div class="q-ml-sm">
                  <div class="chart-title" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                    My Effort Analysis
                  </div>
                  <div
                    class="chart-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Planned, actual and remaining effort across your tasks
                  </div>
                </div>
              </div>
              <div class="badge-tag" :class="$q.dark.isActive ? 'badge-dark' : ''">
                Effort Hours
              </div>
            </div>
            <q-card-section class="q-pa-sm relative-position">
              <div ref="effortChartRef" class="echarts-box"></div>
              <!-- Summary effort stat row -->
              <div class="row q-col-gutter-sm q-mt-xs q-px-sm">
                <div class="col-6 col-sm-3 text-center">
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Total Planned
                  </div>
                  <div class="text-weight-bold" style="color: #7654d6">
                    {{ formatHours(expectedEffort) }}
                  </div>
                </div>
                <div class="col-6 col-sm-3 text-center">
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Total Logged
                  </div>
                  <div class="text-weight-bold" style="color: #3f7fd5">
                    {{ formatHours(actualEffort) }}
                  </div>
                </div>
                <div class="col-6 col-sm-3 text-center">
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Hours Left
                  </div>
                  <div class="text-weight-bold" style="color: #16a6a1">
                    {{ formatHours(actualHoursRemaining) }}
                  </div>
                </div>
                <div class="col-6 col-sm-3 text-center">
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Consumed
                  </div>
                  <div
                    class="text-weight-bold"
                    :class="effortPercentage > 90 ? 'text-warning' : 'text-primary'"
                  >
                    {{ effortPercentage }}%
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- ROW 2: MY TASK PROGRESS + DEADLINE PERFORMANCE -->
      <div class="row q-col-gutter-md q-mb-lg items-stretch">
        <!-- 3. My Task Progress (Horizontal Bar) -->
        <div class="col-12 col-lg-6">
          <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
            <div class="chart-card-header row items-center justify-between">
              <div class="row items-center">
                <q-avatar
                  size="34px"
                  :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
                  :text-color="$q.dark.isActive ? 'blue-2' : 'blue-8'"
                  icon="trending_up"
                />
                <div class="q-ml-sm">
                  <div class="chart-title" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                    My Task Progress
                  </div>
                  <div
                    class="chart-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Progress across your assigned tasks
                  </div>
                </div>
              </div>
              <div class="badge-tag" :class="$q.dark.isActive ? 'badge-dark' : ''">
                Completion %
              </div>
            </div>
            <q-card-section class="q-pa-sm relative-position">
              <div ref="taskProgressChartRef" class="echarts-box"></div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 4. Deadline Performance (ECharts Breakdown + Quick Cards) -->
        <div class="col-12 col-lg-6">
          <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
            <div class="chart-card-header row items-center justify-between">
              <div class="row items-center">
                <q-avatar
                  size="34px"
                  :color="$q.dark.isActive ? 'orange-10' : 'orange-1'"
                  :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'"
                  icon="event"
                />
                <div class="q-ml-sm">
                  <div class="chart-title" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                    Deadline Performance
                  </div>
                  <div
                    class="chart-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Overview of your upcoming and overdue deadlines
                  </div>
                </div>
              </div>
              <div class="badge-tag" :class="$q.dark.isActive ? 'badge-dark' : ''">Deadlines</div>
            </div>
            <q-card-section class="q-pa-sm relative-position">
              <div ref="deadlineChartRef" class="echarts-box"></div>
              <!-- Quick action filter cards (All 5 deadline categories matching the chart) -->
              <div class="row q-col-gutter-xs q-mt-xs">
                <div v-for="d in deadlinePerformance" :key="d.label" class="col-6 col-sm">
                  <q-card
                    flat
                    bordered
                    :dark="$q.dark.isActive"
                    class="full-height cursor-pointer"
                    @click="handleDeadlineCardClick(d.label)"
                  >
                    <q-card-section class="q-pa-xs text-center">
                      <div
                        class="text-caption ellipsis"
                        :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                      >
                        {{ d.label }}
                      </div>
                      <div class="text-h6 text-weight-bold" :class="`text-${d.color}`">
                        {{ d.value }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- PROJECT PROGRESS -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar
                size="36px"
                :color="$q.dark.isActive ? 'purple-10' : 'blue-1'"
                :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                icon="folder"
              />
              <div class="q-ml-sm">
                <div
                  class="text-subtitle1 text-weight-bold"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  Project Progress
                </div>
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  Your tasks grouped by project.
                </div>
              </div>
            </div>

            <q-chip
              dense
              square
              :color="$q.dark.isActive ? 'purple-10' : 'deep-purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              class="text-caption text-weight-bold"
            >
              {{ projectProgress.length }} projects
            </q-chip>
          </div>
        </q-card-section>

        <q-separator />

        <q-list v-if="projectProgress.length" separator :dark="$q.dark.isActive">
          <q-item
            v-for="p in projectProgress"
            :key="p.project"
            clickable
            class="q-py-md"
            @click="
              router.push({
                path: '/app/resource-dashboard/task-details',
                query: { project: p.project },
              })
            "
          >
            <q-item-section avatar>
              <q-avatar
                size="38px"
                :color="$q.dark.isActive ? 'purple-10' : 'blue-1'"
                :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                icon="folder"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label
                class="text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >{{ p.project }}</q-item-label
              >
              <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                {{ p.completed }}/{{ p.tasks }} completed · {{ p.active }} active
              </q-item-label>

              <q-linear-progress
                :value="p.progress / 100"
                color="primary"
                rounded
                size="6px"
                class="q-mt-sm"
                :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
              />
            </q-item-section>

            <q-item-section side>
              <q-chip
                dense
                square
                color="primary"
                text-color="white"
                class="text-caption text-weight-bold"
                >{{ p.progress }}%</q-chip
              >
              <div
                class="text-caption q-mt-xs"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                {{ formatHours(p.expectedEffort) }} est
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">
                {{ formatHours(p.actualEffort) }} logged
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div
          v-else
          class="column items-center q-pa-xl"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          <q-avatar
            size="48px"
            :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
            icon="folder_off"
          />
          <div class="text-caption q-mt-sm">No projects to show yet.</div>
        </div>
      </q-card>

      <!-- WORK INSIGHTS -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section>
          <div class="row items-center">
            <q-avatar
              size="36px"
              :color="$q.dark.isActive ? 'amber-10' : 'amber-1'"
              :text-color="$q.dark.isActive ? 'amber-2' : 'amber-9'"
              icon="lightbulb"
            />
            <div class="q-ml-sm">
              <div
                class="text-subtitle1 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Work Insights
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Computed from your current tasks and progress.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-list v-if="insights.length" separator :dark="$q.dark.isActive">
          <q-item v-for="(insight, i) in insights" :key="i" class="q-py-md">
            <q-item-section avatar>
              <q-avatar
                size="32px"
                :color="$q.dark.isActive ? 'purple-10' : 'blue-1'"
                :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                icon="lightbulb"
              />
            </q-item-section>

            <q-item-section :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
              {{ insight }}
            </q-item-section>
          </q-item>
        </q-list>

        <div
          v-else
          class="column items-center q-pa-xl"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          <q-avatar
            size="48px"
            :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
            icon="task_alt"
          />
          <div class="text-caption q-mt-sm">Nothing to flag right now.</div>
        </div>
      </q-card>

      <!-- TASK PROGRESS TABLE -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar size="36px" color="primary" text-color="white" icon="checklist" />
            <div class="q-ml-sm">
              <div
                class="text-subtitle1 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Task Progress
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Every assigned task with progress, effort and deadline details.
              </div>
            </div>
          </div>

          <q-chip
            dense
            square
            color="primary"
            text-color="white"
            class="text-caption text-weight-bold"
          >
            {{ assignedTasks.length }} tasks
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-table
          v-if="assignedTasks.length"
          flat
          :dark="$q.dark.isActive"
          :rows="taskRows"
          :columns="columns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="priorityColor(props.row.priority)"
                :text-color="priorityTextColor(props.row.priority)"
                class="text-caption text-weight-bold"
              >
                {{ props.row.priority }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="statusColor(props.row.status)"
                :text-color="statusTextColor(props.row.status)"
                class="text-caption text-weight-bold"
              >
                {{ statusLabel(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-linear-progress
                  :value="props.row.progress / 100"
                  color="primary"
                  rounded
                  class="col"
                  style="min-width: 60px"
                  :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                />
                <span
                  class="text-caption text-weight-bold q-ml-sm"
                  :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                >
                  {{ props.row.progress }}%
                </span>
              </div>
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td
              :props="props"
              :class="{
                'text-negative text-weight-medium': props.row.overdue,
              }"
            >
              <q-chip
                v-if="props.row.overdue"
                dense
                square
                :color="$q.dark.isActive ? 'red-10' : 'red-1'"
                :text-color="$q.dark.isActive ? 'red-2' : 'negative'"
                icon="warning"
                class="text-caption text-weight-bold"
              >
                {{ props.row.deadlineLabel }}
              </q-chip>

              <span v-else>
                {{ props.row.deadlineLabel }}
              </span>
            </q-td>
          </template>
        </q-table>

        <div
          v-else
          class="column items-center q-pa-xl"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          <q-avatar
            size="48px"
            :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
            icon="task_alt"
          />
          <div class="text-body2 q-mt-sm">No tasks assigned to you.</div>
        </div>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate, formatHours } from '@/utils/formatters';
import { isOverdue } from '@/utils/taskHelpers';
import { useAuthStore } from '@/stores/auth';

import { getTasksApi } from '@/services/api';
import type { Task } from '@/services/api';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const currentUserId = computed(() => authStore.user?.user_id);

const tasks = ref<Task[]>([]);

const loading = ref(true);
const error = ref('');

// Chart DOM refs
const statusChartRef = ref<HTMLDivElement | null>(null);
const effortChartRef = ref<HTMLDivElement | null>(null);
const taskProgressChartRef = ref<HTMLDivElement | null>(null);
const deadlineChartRef = ref<HTMLDivElement | null>(null);

// ECharts instances
let statusChart: ECharts | null = null;
let effortChart: ECharts | null = null;
let taskProgressChart: ECharts | null = null;
let deadlineChart: ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

function getOrInitChart(el: HTMLDivElement | null): ECharts | null {
  if (!el) return null;
  const existing = echarts.getInstanceByDom(el);
  if (existing) return existing;
  return echarts.init(el);
}

function getCommonTooltipBase(isDark: boolean) {
  return {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E6E8ED',
    borderWidth: 1,
    textStyle: {
      color: isDark ? '#F1F5F9' : '#1D2433',
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: 12,
    },
    extraCssText:
      'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15); border-radius: 8px; padding: 10px 14px;',
  };
}

async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    const fetchedTasks = await getTasksApi();
    tasks.value = fetchedTasks;
  } catch (err) {
    console.error('Failed to load progress:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load your progress.';
  } finally {
    loading.value = false;
    void nextTick(() => {
      renderAllCharts();
    });
  }
}

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cleanDate = deadline.includes('T') ? deadline : `${deadline}T00:00:00`;
  const d = new Date(cleanDate);
  d.setHours(0, 0, 0, 0);

  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function getTaskExpectedEffortForMe(t: Task): number {
  const myId = currentUserId.value;
  const isAssignee =
    t.assigned_resource_ids?.includes(myId as number) ||
    t.assigned_resources?.some((ar) => Number(ar.user_id) === myId);
  const assigneesCount = Math.max(
    1,
    t.assigned_resource_ids?.length || t.assigned_resources?.length || 1,
  );
  if (isAssignee) {
    return (Number(t.expected_effort) || 0) / assigneesCount;
  }
  if (myId && Number(t.supervisor_id) === myId) {
    return ((Number(t.expected_effort) || 0) * 0.2) / assigneesCount;
  }
  return (Number(t.expected_effort) || 0) / assigneesCount;
}

// Ensure tasks are strictly scoped to the logged-in resource (assigned or supervised)
const assignedTasks = computed(() => {
  const myId = currentUserId.value;
  if (!myId) return tasks.value;
  return tasks.value.filter(
    (t) =>
      t.assigned_resource_ids?.includes(myId) ||
      t.assigned_resources?.some((ar) => Number(ar.user_id) === myId) ||
      Number(t.supervisor_id) === myId,
  );
});

const completedTasks = computed(
  () => assignedTasks.value.filter((t) => t.status === 'COMPLETED').length,
);
const activeTasks = computed(
  () =>
    assignedTasks.value.filter((t) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')
      .length,
);
const delayedTasks = computed(() => assignedTasks.value.filter(isOverdue).length);

const overallProgress = computed(() => {
  if (!assignedTasks.value.length) return 0;
  const total = assignedTasks.value.reduce((sum, t) => sum + (Number(t.progress) || 0), 0);
  const avg = Math.round(total / assignedTasks.value.length);
  return isNaN(avg) ? 0 : Math.max(0, Math.min(100, avg));
});

const expectedEffort = computed(() =>
  assignedTasks.value.reduce((s, t) => s + getTaskExpectedEffortForMe(t), 0),
);

const actualEffort = computed(() =>
  assignedTasks.value.reduce((s, t) => s + (Number(t.actual_effort) || 0), 0),
);

const actualHoursRemaining = computed(() =>
  assignedTasks.value
    .filter((t) => t.status !== 'COMPLETED')
    .reduce(
      (s, t) => s + Math.max(0, getTaskExpectedEffortForMe(t) - (Number(t.actual_effort) || 0)),
      0,
    ),
);

const effortPercentage = computed(() => {
  if (!expectedEffort.value || isNaN(expectedEffort.value) || expectedEffort.value <= 0) return 0;
  const actual = actualEffort.value || 0;
  if (isNaN(actual) || actual <= 0) return 0;
  const pct = Math.round((actual / expectedEffort.value) * 100);
  return isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
});

const deadlinePerformance = computed(() => {
  const overdue = assignedTasks.value.filter(
    (t) => t.status !== 'COMPLETED' && isOverdue(t),
  ).length;

  const dueSoon = assignedTasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;
    const days = daysUntil(t.deadline);
    return days >= 0 && days <= 7;
  }).length;

  const upcoming = assignedTasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;
    return daysUntil(t.deadline) > 7;
  }).length;

  const completed = assignedTasks.value.filter((t) => t.status === 'COMPLETED').length;

  const noDeadline = assignedTasks.value.filter(
    (t) => !t.deadline && t.status !== 'COMPLETED',
  ).length;

  return [
    {
      label: 'Overdue',
      value: overdue,
      icon: 'warning',
      color: 'negative',
    },
    {
      label: 'Due ≤ 7 Days',
      value: dueSoon,
      icon: 'schedule',
      color: 'warning',
    },
    {
      label: 'Upcoming',
      value: upcoming,
      icon: 'event',
      color: 'primary',
    },
    {
      label: 'Completed',
      value: completed,
      icon: 'check_circle',
      color: 'positive',
    },
    {
      label: 'No Deadline',
      value: noDeadline,
      icon: 'event_busy',
      color: 'grey-6',
    },
  ];
});

const projectProgress = computed(() => {
  const groups = new Map<
    string,
    {
      project: string;
      tasks: number;
      completed: number;
      active: number;
      progressTotal: number;
      expectedEffort: number;
      actualEffort: number;
    }
  >();

  for (const task of assignedTasks.value) {
    const project = task.project_name ?? `Project #${task.project_id}`;
    const existing = groups.get(project);

    const isActive = task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS';
    if (existing) {
      existing.tasks += 1;
      existing.completed += task.status === 'COMPLETED' ? 1 : 0;
      existing.active += isActive ? 1 : 0;
      existing.progressTotal += Number(task.progress) || 0;
      existing.expectedEffort += getTaskExpectedEffortForMe(task);
      existing.actualEffort += Number(task.actual_effort) || 0;
    } else {
      groups.set(project, {
        project,
        tasks: 1,
        completed: task.status === 'COMPLETED' ? 1 : 0,
        active: isActive ? 1 : 0,
        progressTotal: Number(task.progress) || 0,
        expectedEffort: getTaskExpectedEffortForMe(task),
        actualEffort: Number(task.actual_effort) || 0,
      });
    }
  }

  return Array.from(groups.values()).map((p) => ({
    project: p.project,
    tasks: p.tasks,
    completed: p.completed,
    active: p.active,
    progress: p.tasks ? Math.round(p.progressTotal / p.tasks) : 0,
    expectedEffort: p.expectedEffort,
    actualEffort: p.actualEffort,
    remainingEffort: Math.max(p.expectedEffort - p.actualEffort, 0),
  }));
});

const insights = computed(() => {
  const result: string[] = [];

  if (delayedTasks.value > 0) {
    result.push(
      `${delayedTasks.value} task${delayedTasks.value > 1 ? 's are' : ' is'} currently overdue.`,
    );
  }

  if (actualEffort.value > expectedEffort.value && expectedEffort.value > 0) {
    result.push(
      'Logged effort is higher than the planned effort. Review remaining work and task estimates.',
    );
  }

  const dueSoon = assignedTasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;
    const days = daysUntil(t.deadline);
    return days >= 0 && days <= 7;
  }).length;

  if (dueSoon > 0) {
    result.push(`${dueSoon} task${dueSoon > 1 ? 's are' : ' is'} due within the next 7 days.`);
  }

  if (completedTasks.value === assignedTasks.value.length && assignedTasks.value.length > 0) {
    result.push('All assigned tasks are completed.');
  }

  return result;
});

const columns = [
  {
    name: 'title',
    label: 'Task',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'project',
    label: 'Project',
    field: 'project',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Priority',
    field: 'priority',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'progress',
    label: 'Progress',
    field: 'progress',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: 'deadlineLabel',
    align: 'left' as const,
    sortable: true,
  },
];

const taskRows = computed(() =>
  assignedTasks.value.map((task) => ({
    ...task,
    project: task.project_name ?? `Project #${task.project_id}`,
    progress: Number(task.progress) || 0,
    deadlineLabel: formatDate(task.deadline),
    overdue: isOverdue(task),
  })),
);

// -------------------------------------------------------------
// Chart Initializations
// -------------------------------------------------------------

// 1. My Task Status (Donut Chart)
function initStatusChart() {
  if (!statusChartRef.value) return;
  statusChart = getOrInitChart(statusChartRef.value);
  if (!statusChart) return;

  const isDark = $q.dark.isActive;
  const darkText = isDark ? '#F1F5F9' : '#1D2433';
  const mutedText = isDark ? '#94A3B8' : '#697386';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';

  const myTasks = assignedTasks.value;
  const total = myTasks.length;

  const overdueTasks = myTasks.filter((t) => t.status !== 'COMPLETED' && isOverdue(t));
  const completedTasksList = myTasks.filter((t) => t.status === 'COMPLETED');
  const inProgressTasks = myTasks.filter((t) => t.status === 'IN_PROGRESS' && !isOverdue(t));
  const scheduledTasks = myTasks.filter((t) => t.status === 'SCHEDULED' && !isOverdue(t));
  const otherTasks = myTasks.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.status !== 'IN_PROGRESS' &&
      t.status !== 'SCHEDULED' &&
      !isOverdue(t),
  );

  const rawData = [
    {
      name: 'Completed',
      value: completedTasksList.length,
      color: '#32A56B',
      tasks: completedTasksList,
    },
    {
      name: 'In Progress',
      value: inProgressTasks.length,
      color: '#7654D6',
      tasks: inProgressTasks,
    },
    { name: 'Scheduled', value: scheduledTasks.length, color: '#3F7FD5', tasks: scheduledTasks },
    { name: 'Overdue', value: overdueTasks.length, color: '#E05260', tasks: overdueTasks },
    ...(otherTasks.length > 0
      ? [{ name: 'Unassigned', value: otherTasks.length, color: '#98A2B3', tasks: otherTasks }]
      : []),
  ];

  const chartData = rawData.filter((d) => d.value > 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      ...getCommonTooltipBase(isDark),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        const found = rawData.find((d) => d.name === p.name);
        const taskPreviews = found?.tasks.slice(0, 3) || [];
        const extraCount = (found?.tasks.length || 0) - taskPreviews.length;

        let taskListHtml = '';
        if (taskPreviews.length > 0) {
          taskListHtml = `
            <div style="margin-top:6px; padding-top:4px; border-top:1px dashed ${isDark ? '#475569' : '#E2E8F0'}; font-size:11px; color:${mutedText};">
              ${taskPreviews.map((t) => `<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">• ${t.title}</div>`).join('')}
              ${extraCount > 0 ? `<div style="font-style:italic;">+${extraCount} more...</div>` : ''}
            </div>
          `;
        }

        return `
          <div style="font-weight:600; font-size:13px; color:${darkText};">${p.name}</div>
          <div style="display:flex; justify-content:space-between; gap:16px; margin-top:2px;">
            <span style="color:${mutedText};">Tasks:</span>
            <strong style="color:${darkText};">${p.value} (${p.percent}%)</strong>
          </div>
          ${taskListHtml}
        `;
      },
    },
    legend: {
      show: chartData.length > 0,
      orient: 'horizontal',
      bottom: '0%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: mutedText, fontSize: 11 },
      formatter: (name: string) => {
        const item = rawData.find((d) => d.name === name);
        return `${name} (${item?.value || 0})`;
      },
    },
    series: [
      {
        name: 'Task Status',
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: cardBg,
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 5,
          label: { show: false },
        },
        data:
          chartData.length > 0
            ? chartData.map((d) => ({
                name: d.name,
                value: d.value,
                itemStyle: { color: d.color },
              }))
            : [
                {
                  name: 'No tasks',
                  value: 1,
                  itemStyle: { color: isDark ? '#334155' : '#E2E8F0' },
                },
              ],
      },
    ],
    graphic:
      total > 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: '36%',
              style: {
                text: String(total),
                font: 'bold 24px Manrope, sans-serif',
                fill: darkText,
              },
            },
            {
              type: 'text',
              left: 'center',
              top: '47%',
              style: {
                text: total === 1 ? 'Assigned Task' : 'Assigned Tasks',
                font: '500 11px Manrope, sans-serif',
                fill: mutedText,
              },
            },
          ]
        : [
            {
              type: 'text',
              left: 'center',
              top: '40%',
              style: {
                text: 'No tasks assigned',
                font: 'bold 13px Manrope, sans-serif',
                fill: mutedText,
              },
            },
          ],
  };

  statusChart.setOption(option, true);
  statusChart.off('click');
  statusChart.on('click', (params) => {
    if (params.name) {
      handleStatusSegClick(params.name);
    }
  });
}

// 2. My Effort Analysis (Grouped Horizontal Bar Chart)
function initEffortChart() {
  if (!effortChartRef.value) return;
  effortChart = getOrInitChart(effortChartRef.value);
  if (!effortChart) return;

  const isDark = $q.dark.isActive;
  const darkText = isDark ? '#F1F5F9' : '#1D2433';
  const mutedText = isDark ? '#94A3B8' : '#697386';
  const border = isDark ? '#334155' : '#E6E8ED';
  const gridLine = isDark ? 'rgba(255,255,255,0.06)' : '#F0F2F5';

  const myTasks = assignedTasks.value;

  // Sort tasks, prioritizing non-completed tasks
  const sortedTasks = [...myTasks].sort((a, b) => {
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
    return getTaskExpectedEffortForMe(b) - getTaskExpectedEffortForMe(a);
  });

  const taskTitles = sortedTasks.map((t) => t.title);
  const plannedData = sortedTasks.map((t) => Number(getTaskExpectedEffortForMe(t).toFixed(1)));
  const actualData = sortedTasks.map((t) => Number(t.actual_effort) || 0);
  const remainingData = sortedTasks.map((t) =>
    t.status === 'COMPLETED'
      ? 0
      : Number(
          Math.max(0, getTaskExpectedEffortForMe(t) - (Number(t.actual_effort) || 0)).toFixed(1),
        ),
  );

  const hasOverflow = sortedTasks.length > 6;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltipBase(isDark),
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const task = sortedTasks[items[0]?.dataIndex ?? 0];
        if (!task) return '';
        const planned = Number(getTaskExpectedEffortForMe(task).toFixed(1));
        const actual = Number(task.actual_effort) || 0;
        const remaining =
          task.status === 'COMPLETED' ? 0 : Number(Math.max(0, planned - actual).toFixed(1));
        return `
          <div style="font-weight:600; font-size:13px; color:${darkText};">${task.title}</div>
          <div style="font-size:11px; color:${mutedText}; margin-bottom:6px;">${task.project_name || `Project #${task.project_id}`}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Planned Effort:</span>
            <strong style="color:#7654D6;">${planned}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Actual Logged:</span>
            <strong style="color:#3F7FD5;">${actual}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Remaining:</span>
            <strong style="color:#16A6A1;">${remaining}h</strong>
          </div>
        `;
      },
    },
    legend: {
      show: sortedTasks.length > 0,
      top: '0%',
      right: '2%',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: mutedText, fontSize: 11 },
      data: ['Planned Effort', 'Actual Logged', 'Remaining'],
    },
    grid: {
      top: '14%',
      left: '3%',
      right: hasOverflow ? 65 : 50,
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      show: sortedTasks.length > 0,
      type: 'value',
      name: 'Hours',
      nameLocation: 'end',
      nameTextStyle: { color: mutedText, fontSize: 10 },
      minInterval: 1,
      axisLabel: { color: mutedText, fontSize: 11 },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
    },
    yAxis: {
      show: sortedTasks.length > 0,
      type: 'category',
      inverse: true,
      data: taskTitles,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
      axisLabel: {
        interval: 0,
        color: darkText,
        fontSize: 11,
        fontWeight: 500,
        formatter: (val: string) => (val.length > 18 ? `${val.substring(0, 16)}…` : val),
      },
    },
    series: [
      {
        name: 'Planned Effort',
        type: 'bar',
        barWidth: 8,
        data: plannedData,
        itemStyle: { color: '#7654D6', borderRadius: [0, 3, 3, 0] },
      },
      {
        name: 'Actual Logged',
        type: 'bar',
        barWidth: 8,
        data: actualData,
        itemStyle: { color: '#3F7FD5', borderRadius: [0, 3, 3, 0] },
      },
      {
        name: 'Remaining',
        type: 'bar',
        barWidth: 8,
        data: remainingData,
        itemStyle: { color: '#16A6A1', borderRadius: [0, 3, 3, 0] },
      },
    ],
    graphic:
      sortedTasks.length === 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: '45%',
              style: {
                text: 'No tasks with effort estimates yet',
                font: 'bold 13px Manrope, sans-serif',
                fill: mutedText,
              },
            },
          ]
        : [],
  };

  if (hasOverflow) {
    option.dataZoom = [
      {
        type: 'inside',
        yAxisIndex: 0,
        startValue: 0,
        endValue: 5,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
      {
        type: 'slider',
        yAxisIndex: 0,
        width: 10,
        right: 4,
        startValue: 0,
        endValue: 5,
        borderColor: 'transparent',
        fillerColor: isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(118, 84, 214, 0.2)',
        handleStyle: {
          color: '#7654D6',
          borderColor: '#7654D6',
        },
        showDetail: false,
        brushSelect: false,
      },
    ];
  }

  effortChart.setOption(option, true);
  effortChart.off('click');
  effortChart.on('click', (params) => {
    const task = sortedTasks[params.dataIndex];
    if (task) {
      openTask(task.task_id);
    }
  });
}

// 3. My Task Progress (Horizontal Bar Chart)
function initTaskProgressChart() {
  if (!taskProgressChartRef.value) return;
  taskProgressChart = getOrInitChart(taskProgressChartRef.value);
  if (!taskProgressChart) return;

  const isDark = $q.dark.isActive;
  const darkText = isDark ? '#F1F5F9' : '#1D2433';
  const mutedText = isDark ? '#94A3B8' : '#697386';
  const border = isDark ? '#334155' : '#E6E8ED';
  const gridLine = isDark ? 'rgba(255,255,255,0.06)' : '#F0F2F5';

  const myTasks = assignedTasks.value;

  // Prioritize active or delayed tasks
  const progressList = [...myTasks].sort((a, b) => {
    if (isOverdue(a) && !isOverdue(b)) return -1;
    if (!isOverdue(a) && isOverdue(b)) return 1;
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    return (Number(b.progress) || 0) - (Number(a.progress) || 0);
  });

  const taskTitles = progressList.map((t) => t.title);
  const hasOverflow = progressList.length > 7;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltipBase(isDark),
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params;
        const task = progressList[item?.dataIndex ?? 0];
        if (!task) return '';
        const pct = Number(task.progress) || 0;
        return `
          <div style="font-weight:600; font-size:13px; color:${darkText};">${task.title}</div>
          <div style="font-size:11px; color:${mutedText}; margin-bottom:6px;">${task.project_name || `Project #${task.project_id}`}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Status:</span>
            <strong>${statusLabel(task.status)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Priority:</span>
            <strong>${task.priority}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Deadline:</span>
            <strong>${task.deadline ? formatDate(task.deadline) : 'No deadline'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; margin-top:4px; padding-top:4px; border-top:1px dashed ${isDark ? '#475569' : '#E2E8F0'};">
            <span style="color:${mutedText};">Progress:</span>
            <strong style="color:${pct === 100 ? '#32A56B' : isOverdue(task) ? '#E05260' : '#7654D6'}; font-size:13px;">${pct}%</strong>
          </div>
        `;
      },
    },
    grid: {
      top: '8%',
      left: '3%',
      right: hasOverflow ? 65 : 55,
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      show: progressList.length > 0,
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: mutedText,
        fontSize: 11,
      },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
    },
    yAxis: {
      show: progressList.length > 0,
      type: 'category',
      inverse: true,
      data: taskTitles,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
      axisLabel: {
        interval: 0,
        color: darkText,
        fontSize: 11,
        fontWeight: 500,
        formatter: (val: string) => (val.length > 18 ? `${val.substring(0, 16)}…` : val),
      },
    },
    series: [
      {
        name: 'Progress',
        type: 'bar',
        barWidth: 14,
        data: progressList.map((t) => {
          const val = Number(t.progress) || 0;
          let barColor = '#3F7FD5';
          if (t.status === 'COMPLETED' || val >= 100) {
            barColor = '#32A56B';
          } else if (isOverdue(t)) {
            barColor = '#E05260';
          } else if (val > 50) {
            barColor = '#7654D6';
          }
          return {
            value: val,
            itemStyle: {
              color: barColor,
              borderRadius: [0, 4, 4, 0],
            },
          };
        }),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: darkText,
          fontSize: 11,
          fontWeight: 600,
        },
      },
    ],
    graphic:
      progressList.length === 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: '45%',
              style: {
                text: 'No assigned tasks yet',
                font: 'bold 13px Manrope, sans-serif',
                fill: mutedText,
              },
            },
          ]
        : [],
  };

  if (hasOverflow) {
    option.dataZoom = [
      {
        type: 'inside',
        yAxisIndex: 0,
        startValue: 0,
        endValue: 6,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
      {
        type: 'slider',
        yAxisIndex: 0,
        width: 10,
        right: 4,
        startValue: 0,
        endValue: 6,
        borderColor: 'transparent',
        fillerColor: isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(118, 84, 214, 0.2)',
        handleStyle: {
          color: '#7654D6',
          borderColor: '#7654D6',
        },
        showDetail: false,
        brushSelect: false,
      },
    ];
  }

  taskProgressChart.setOption(option, true);
  taskProgressChart.off('click');
  taskProgressChart.on('click', (params) => {
    const task = progressList[params.dataIndex];
    if (task) {
      openTask(task.task_id);
    }
  });
}

// 4. Deadline Performance (Urgency Breakdown Chart)
function initDeadlineChart() {
  if (!deadlineChartRef.value) return;
  deadlineChart = getOrInitChart(deadlineChartRef.value);
  if (!deadlineChart) return;

  const isDark = $q.dark.isActive;
  const darkText = isDark ? '#F1F5F9' : '#1D2433';
  const mutedText = isDark ? '#94A3B8' : '#697386';
  const border = isDark ? '#334155' : '#E6E8ED';
  const gridLine = isDark ? 'rgba(255,255,255,0.06)' : '#F0F2F5';

  const myTasks = assignedTasks.value;

  const overdueTasks = myTasks.filter((t) => t.status !== 'COMPLETED' && isOverdue(t));
  const dueSoonTasks = myTasks.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;
    const days = daysUntil(t.deadline);
    return days >= 0 && days <= 7;
  });
  const upcomingTasks = myTasks.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;
    return daysUntil(t.deadline) > 7;
  });
  const completedTasksList = myTasks.filter((t) => t.status === 'COMPLETED');
  const noDeadlineTasks = myTasks.filter((t) => !t.deadline && t.status !== 'COMPLETED');

  const categories = [
    { label: 'Overdue', count: overdueTasks.length, color: '#E05260', tasks: overdueTasks },
    { label: 'Due ≤ 7 Days', count: dueSoonTasks.length, color: '#F08A24', tasks: dueSoonTasks },
    { label: 'Upcoming', count: upcomingTasks.length, color: '#3F7FD5', tasks: upcomingTasks },
    {
      label: 'Completed',
      count: completedTasksList.length,
      color: '#32A56B',
      tasks: completedTasksList,
    },
    {
      label: 'No Deadline',
      count: noDeadlineTasks.length,
      color: '#98A2B3',
      tasks: noDeadlineTasks,
    },
  ];

  const catNames = categories.map((c) => c.label);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltipBase(isDark),
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params;
        const cat = categories[item?.dataIndex ?? 0];
        if (!cat) return '';
        const taskPreviews = cat.tasks.slice(0, 3);
        const extra = cat.tasks.length - taskPreviews.length;
        let previewHtml = '';
        if (taskPreviews.length > 0) {
          previewHtml = `
            <div style="margin-top:6px; padding-top:4px; border-top:1px dashed ${isDark ? '#475569' : '#E2E8F0'}; font-size:11px; color:${mutedText};">
              ${taskPreviews.map((t) => `<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">• ${t.title} ${t.deadline ? `(${formatDate(t.deadline)})` : ''}</div>`).join('')}
              ${extra > 0 ? `<div style="font-style:italic;">+${extra} more...</div>` : ''}
            </div>
          `;
        }
        return `
          <div style="font-weight:600; font-size:13px; color:${darkText};">${cat.label}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span style="color:${mutedText};">Task Count:</span>
            <strong style="color:${cat.color}; font-size:13px;">${cat.count} tasks</strong>
          </div>
          ${previewHtml}
        `;
      },
    },
    grid: {
      top: '8%',
      left: '3%',
      right: 65,
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      show: myTasks.length > 0,
      type: 'value',
      minInterval: 1,
      name: 'Tasks',
      nameLocation: 'end',
      nameTextStyle: { color: mutedText, fontSize: 10 },
      axisLabel: { color: mutedText, fontSize: 11 },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
    },
    yAxis: {
      show: myTasks.length > 0,
      type: 'category',
      inverse: true,
      data: catNames,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
      axisLabel: {
        interval: 0,
        color: darkText,
        fontSize: 11,
        fontWeight: 500,
      },
    },
    series: [
      {
        name: 'Tasks',
        type: 'bar',
        barWidth: 14,
        data: categories.map((c) => ({
          value: c.count,
          itemStyle: {
            color: c.color,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: unknown) => {
            const v = (p as { value: number })?.value ?? 0;
            return `${v} ${v === 1 ? 'task' : 'tasks'}`;
          },
          color: darkText,
          fontSize: 11,
          fontWeight: 600,
        },
      },
    ],
    graphic:
      myTasks.length === 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: '45%',
              style: {
                text: 'No assigned tasks with deadlines',
                font: 'bold 13px Manrope, sans-serif',
                fill: mutedText,
              },
            },
          ]
        : [],
  };

  deadlineChart.setOption(option, true);
  deadlineChart.off('click');
  deadlineChart.on('click', (params) => {
    const cat = categories[params.dataIndex];
    if (cat) {
      handleDeadlineCardClick(cat.label);
    }
  });
}

function renderAllCharts() {
  void nextTick(() => {
    initStatusChart();
    initEffortChart();
    initTaskProgressChart();
    initDeadlineChart();
    resizeAllCharts();
  });
}

function resizeAllCharts() {
  statusChart?.resize();
  effortChart?.resize();
  taskProgressChart?.resize();
  deadlineChart?.resize();
}

onMounted(() => {
  void loadTasks();

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      resizeAllCharts();
    });
    const pageEl = document.querySelector('.q-page');
    if (pageEl) {
      resizeObserver.observe(pageEl);
    }
  }

  window.addEventListener('resize', resizeAllCharts);
});

watch(
  () => $q.dark.isActive,
  () => {
    renderAllCharts();
  },
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAllCharts);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  statusChart?.dispose();
  statusChart = null;
  effortChart?.dispose();
  effortChart = null;
  taskProgressChart?.dispose();
  taskProgressChart = null;
  deadlineChart?.dispose();
  deadlineChart = null;
});

function priorityColor(priority: Task['priority']): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-10';
      case 'MEDIUM':
        return 'purple-10';
      case 'HIGH':
        return 'orange-10';
      case 'CRITICAL':
        return 'red-10';
      default:
        return 'grey-9';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-1';
    case 'MEDIUM':
      return 'deep-purple-1';
    case 'HIGH':
      return 'orange-1';
    case 'CRITICAL':
      return 'red-1';
    default:
      return 'grey-2';
  }
}

function priorityTextColor(priority: Task['priority']): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-2';
      case 'MEDIUM':
        return 'purple-2';
      case 'HIGH':
        return 'orange-2';
      case 'CRITICAL':
        return 'red-2';
      default:
        return 'grey-2';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-8';
    case 'MEDIUM':
      return 'primary';
    case 'HIGH':
      return 'orange-8';
    case 'CRITICAL':
      return 'red-8';
    default:
      return 'grey-8';
  }
}

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

function statusLabel(status: Task['status']) {
  return (
    {
      UNASSIGNED: 'Unassigned',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
    }[status] || status
  );
}

function openTask(taskId: number) {
  void router.push(`/app/resource-dashboard/task-details/${taskId}`);
}

function handleStatusSegClick(label: string) {
  if (label === 'Overdue') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { atRisk: 'true' },
    });
  } else if (label === 'In Progress') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { status: 'IN_PROGRESS' },
    });
  } else if (label === 'Completed') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { status: 'COMPLETED' },
    });
  } else if (label === 'Scheduled') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { status: 'SCHEDULED' },
    });
  } else {
    void router.push('/app/resource-dashboard/task-details');
  }
}

function handleDeadlineCardClick(label: string) {
  if (label === 'Overdue') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { atRisk: 'true' },
    });
  } else if (label === 'Completed') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { status: 'COMPLETED' },
    });
  } else if (label.includes('Due') || label.includes('7')) {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { dueSoon: 'true' },
    });
  } else if (label === 'Upcoming') {
    void router.push({
      path: '/app/resource-dashboard/task-details',
      query: { status: 'SCHEDULED' },
    });
  } else {
    void router.push('/app/resource-dashboard/task-details');
  }
}
</script>

<style scoped lang="scss">
.chart-card {
  border-radius: 10px;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-card-header {
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.body--dark .chart-card-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chart-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.chart-caption {
  font-size: 11px;
  margin-top: 2px;
}

.badge-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 4px;
  background: #f0f2f5;
  color: #475569;
}

.badge-dark {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #cbd5e1 !important;
}

.echarts-box {
  width: 100%;
  min-height: 270px;
  height: 290px;
}
</style>
