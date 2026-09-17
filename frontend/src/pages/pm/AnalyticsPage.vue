<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="analytics-page q-pa-lg"
  >
    <div class="analytics-page-wrapper">
      <!-- 1. PAGE HEADER -->
      <div class="row items-center justify-between q-mb-md wrap q-col-gutter-sm">
        <div>
          <h1
            class="text-h5 text-weight-bold q-ma-none"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Project & Resource Analytics
          </h1>
          <p
            class="text-caption q-mt-xs q-mb-none"
            :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
          >
            Real-time insights for better project planning and resource allocation
          </p>
        </div>

        <!-- Header Actions: Refresh -->
        <div class="row items-center q-gutter-sm">
          <!-- Refresh Action Button -->
          <q-btn
            outline
            dense
            rounded
            color="primary"
            icon="refresh"
            label="Refresh"
            no-caps
            class="q-px-sm"
            :loading="loading"
            @click="loadAllAnalyticsData"
          />
        </div>
      </div>


      <!-- 3. LOADING SKELETON -->
      <div v-if="loading && isInitialLoad" class="q-my-lg">
        <div class="row q-col-gutter-md q-mb-md">
          <div v-for="i in 4" :key="`sk-kpi-${i}`" class="col-12 col-sm-6 col-md-3">
            <q-skeleton type="rect" height="96px" class="rounded-borders" />
          </div>
        </div>
        <div class="row q-col-gutter-md">
          <div v-for="i in 4" :key="`sk-chart-${i}`" class="col-12 col-lg-6">
            <q-skeleton type="rect" height="340px" class="rounded-borders" />
          </div>
        </div>
      </div>

      <!-- 4. ERROR BANNER -->
      <q-banner v-else-if="errorMessage" class="bg-negative text-white q-mb-lg rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ errorMessage }}
        <template #action>
          <q-btn flat color="white" label="Retry" @click="loadAllAnalyticsData" />
        </template>
      </q-banner>

      <!-- 5. MAIN ANALYTICS DASHBOARD CONTENT -->
      <div v-else>
        <!-- KPI Overview Cards -->
        <div class="row q-col-gutter-md q-mb-lg">
          <!-- KPI 1: Team Utilization -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered :dark="$q.dark.isActive" class="kpi-card q-pa-md">
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span
                    class="text-caption text-weight-bold text-uppercase"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    style="letter-spacing: 0.03em"
                  >
                    Team Utilization
                  </span>
                  <div class="row items-baseline q-gutter-x-xs q-mt-xs">
                    <span
                      class="text-h5 text-weight-bolder"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ resourceStats.averageUtilization }}%
                    </span>
                    <span
                      class="text-caption text-weight-medium"
                      :class="
                        resourceStats.averageUtilization > 85 ? 'text-negative' : 'text-positive'
                      "
                    >
                      {{ resourceStats.averageUtilization > 85 ? '▲ Overloaded' : '● Optimal' }}
                    </span>
                  </div>
                  <span class="text-caption text-grey-6 q-mt-xs">Target: 60% – 85%</span>
                </div>
                <q-avatar
                  rounded
                  size="40px"
                  font-size="20px"
                  :color="$q.dark.isActive ? 'deep-purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-3' : 'purple'"
                  icon="group"
                />
              </div>
            </q-card>
          </div>

          <!-- KPI 2: Available Headroom -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered :dark="$q.dark.isActive" class="kpi-card q-pa-md">
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span
                    class="text-caption text-weight-bold text-uppercase"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    style="letter-spacing: 0.03em"
                  >
                    Available Headroom
                  </span>
                  <div class="row items-baseline q-gutter-x-xs q-mt-xs">
                    <span
                      class="text-h5 text-weight-bolder"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ resourceStats.totalAvailableHeadroom }}h
                    </span>
                    <span class="text-caption text-teal text-weight-medium">Ready</span>
                  </div>
                  <span class="text-caption text-grey-6 q-mt-xs">
                    Across {{ resourceList.length }} resources
                  </span>
                </div>
                <q-avatar
                  rounded
                  size="40px"
                  font-size="20px"
                  :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
                  :text-color="$q.dark.isActive ? 'blue-3' : 'blue'"
                  icon="layers"
                />
              </div>
            </q-card>
          </div>

          <!-- KPI 3: Task Completion -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered :dark="$q.dark.isActive" class="kpi-card q-pa-md">
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span
                    class="text-caption text-weight-bold text-uppercase"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    style="letter-spacing: 0.03em"
                  >
                    Task Completion
                  </span>
                  <div class="row items-baseline q-gutter-x-xs q-mt-xs">
                    <span
                      class="text-h5 text-weight-bolder"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ taskStats.completionPercent }}%
                    </span>
                    <span class="text-caption text-positive text-weight-medium">Active</span>
                  </div>
                  <span class="text-caption text-grey-6 q-mt-xs">
                    {{ taskStats.completedTasks }} / {{ taskStats.totalTasks }} tasks done
                  </span>
                </div>
                <q-avatar
                  rounded
                  size="40px"
                  font-size="20px"
                  :color="$q.dark.isActive ? 'green-10' : 'green-1'"
                  :text-color="$q.dark.isActive ? 'green-3' : 'positive'"
                  icon="check_circle"
                />
              </div>
            </q-card>
          </div>

          <!-- KPI 4: Overloaded Resources -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              :dark="$q.dark.isActive"
              class="kpi-card q-pa-md"
              :class="{ 'kpi-card-alert': resourceStats.overloadedCount > 0 }"
            >
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span
                    class="text-caption text-weight-bold text-uppercase"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    style="letter-spacing: 0.03em"
                  >
                    Overloaded Resources
                  </span>
                  <div class="row items-baseline q-gutter-x-xs q-mt-xs">
                    <span
                      class="text-h5 text-weight-bolder"
                      :class="
                        resourceStats.overloadedCount > 0
                          ? 'text-negative'
                          : $q.dark.isActive
                            ? 'text-white'
                            : 'text-dark'
                      "
                    >
                      {{ resourceStats.overloadedCount }}
                    </span>
                    <span
                      v-if="resourceStats.overloadedCount > 0"
                      class="text-caption text-negative text-weight-medium"
                    >
                      ▲ Attention
                    </span>
                  </div>
                  <span class="text-caption text-grey-6 q-mt-xs">&gt; 85% workload threshold</span>
                </div>
                <q-avatar
                  rounded
                  size="40px"
                  font-size="20px"
                  :color="$q.dark.isActive ? 'red-10' : 'red-1'"
                  :text-color="$q.dark.isActive ? 'red-3' : 'negative'"
                  icon="warning_amber"
                />
              </div>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 1: Resource Workload & Assigned Task Trend          -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- 1A: Resource Workload & Utilization (Monday → Sunday Shift) -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card q-pa-md">
              <div class="row items-center justify-between q-mb-sm chart-header-row">
                <div>
                  <div
                    class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Resource Workload & Utilization</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Weekly shift workload (Monday → Sunday) against 85% operational limit</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Weekly shift workload (Monday → Sunday) against 85% operational limit
                  </div>
                </div>
                <div class="row items-center q-gutter-x-xs chart-header-actions">
                  <q-select
                    v-model="selectedWorkloadResourceId"
                    :options="workloadResourceOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    rounded
                    options-dense
                    :dark="$q.dark.isActive"
                    :bg-color="$q.dark.isActive ? 'dark' : 'white'"
                    class="workload-resource-select"
                    @update:model-value="onWorkloadResourceChange"
                  >
                    <template #prepend>
                      <q-icon name="person" size="14px" color="primary" />
                    </template>
                  </q-select>
                  <q-badge
                    outline
                    :color="$q.dark.isActive ? 'grey-5' : 'grey-7'"
                    class="q-px-sm q-py-xs text-weight-medium"
                  >
                    Mon – Sun
                  </q-badge>
                </div>
              </div>
              <div ref="utilizationChartRef" class="echarts-box"></div>
            </q-card>
          </div>

          <!-- 1B: Resource Task Trend (Weekly Assigned Tasks) -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card q-pa-md">
              <div class="row items-center justify-between q-mb-sm chart-header-row">
                <div>
                  <div
                    class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Resource Task Trend</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Number of tasks assigned to each resource per week</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Number of tasks assigned to each resource per week
                  </div>
                </div>
                <div class="row items-center q-gutter-x-xs chart-header-actions">
                  <q-select
                    v-model="selectedTrendResourceIds"
                    :options="trendResourceOptions"
                    multiple
                    dense
                    outlined
                    rounded
                    emit-value
                    map-options
                    options-dense
                    :dark="$q.dark.isActive"
                    :bg-color="$q.dark.isActive ? 'dark' : 'white'"
                    class="trend-resource-select"
                    @update:model-value="onTrendResourcesChange"
                  >
                    <template #prepend>
                      <q-icon name="people" size="14px" color="primary" />
                    </template>
                    <template #selected>
                      <span class="text-caption text-weight-medium text-no-wrap">
                        {{ selectedTrendResourceIds.length }} Selected
                      </span>
                    </template>
                    <template #option="{ itemProps, opt, selected }">
                      <q-item v-bind="itemProps" dense>
                        <q-item-section side>
                          <q-checkbox
                            :model-value="selected"
                            dense
                            :disable="!selected && selectedTrendResourceIds.length >= 8"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-caption">{{ opt.label }}</q-item-label>
                          <q-item-label caption class="text-grey-6">
                            {{ opt.taskCount }} assigned
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <q-badge
                    outline
                    :color="$q.dark.isActive ? 'grey-5' : 'grey-7'"
                    class="q-px-sm q-py-xs text-weight-medium"
                  >
                    Last 4 Weeks
                  </q-badge>
                </div>
              </div>
              <div ref="taskTrendChartRef" class="echarts-box task-trend-chart-box"></div>
              <q-banner
                dense
                rounded
                :class="$q.dark.isActive ? 'bg-blue-10 text-blue-2' : 'bg-blue-1 text-blue-9'"
                class="q-mt-sm"
              >
                <template #avatar>
                  <q-icon
                    name="lightbulb_outline"
                    size="18px"
                    :color="$q.dark.isActive ? 'blue-2' : 'primary'"
                  />
                </template>
                <span class="text-caption text-weight-medium">
                  Tracks the number of tasks assigned to each resource per week over the last 4 weeks.
                </span>
              </q-banner>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 2: Task Status Distribution & Capacity Headroom     -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- 2A: Task Status Distribution (Card-Specific Project Filter) -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card q-pa-md">
              <div class="row items-center justify-between q-mb-sm chart-header-row">
                <div>
                  <div
                    class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Task Status Distribution</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip>Pipeline volume aggregated by task status</q-tooltip>
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Execution pipeline state across active tasks
                  </div>
                </div>
                <!-- Card-Specific Project Selector -->
                <q-select
                  v-model="taskStatusProjectId"
                  :options="projectSelectOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  rounded
                  :dark="$q.dark.isActive"
                  :bg-color="$q.dark.isActive ? 'dark' : 'white'"
                  class="task-status-project-select"
                  @update:model-value="onTaskStatusProjectChange"
                >
                  <template #prepend>
                    <q-icon name="folder" size="14px" color="primary" />
                  </template>
                </q-select>
              </div>
              <div ref="taskStatusChartRef" class="echarts-box"></div>
            </q-card>
          </div>

          <!-- 2B: Capacity vs Assigned Effort -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card q-pa-md">
              <div class="row items-center justify-between q-mb-sm chart-header-row">
                <div>
                  <div
                    class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Capacity vs. Assigned Effort</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Remaining headroom available for automatic scheduling engine
                        dispatch</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Remaining headroom available for automatic scheduling engine dispatch
                  </div>
                </div>
                <q-badge
                  outline
                  :color="$q.dark.isActive ? 'grey-5' : 'grey-7'"
                  class="q-px-sm q-py-xs text-weight-medium"
                >
                  Auto-Scheduler
                </q-badge>
              </div>
              <div ref="capacityChartRef" class="echarts-box"></div>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 3: Planned vs Actual Effort (Full-Width Scrollable) -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card q-pa-md">
              <div class="row items-center justify-between q-mb-sm chart-header-row">
                <div>
                  <div
                    class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Planned vs. Actual Effort</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip>Hours variance on key deliverables with scrollable viewport</q-tooltip>
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Hours variance across deliverables (scroll vertically to view all tasks)
                  </div>
                </div>
                <q-badge
                  outline
                  :color="$q.dark.isActive ? 'grey-5' : 'grey-7'"
                  class="q-px-sm q-py-xs text-weight-medium"
                >
                  {{ taskEffortCount }} Tasks Logged
                </q-badge>
              </div>
              <div ref="effortVarianceChartRef" class="echarts-box effort-variance-chart-box"></div>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useQuasar } from 'quasar';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  getResourceWorkloadApi,
} from '@/services/api';
import type {
  Project,
  ResourceUser,
  Task,
  ResourceWorkload,
} from '@/services/api';
import {
  ANALYTICS_PALETTE,
  computeResourceMetrics,
  computeTaskDistribution,
  computeEffortVariance,
  computeWeeklyShiftWorkload,
} from '@/components/analytics/analyticsCalculations';

const $q = useQuasar();

// -------------------------------------------------------------
// Component State
// -------------------------------------------------------------
const loading = ref(true);
const isInitialLoad = ref(true);
const errorMessage = ref<string | null>(null);

// Card-specific filters
const taskStatusProjectId = ref<number | 'ALL'>('ALL');
const selectedWorkloadResourceId = ref<number | 'ALL'>('ALL');

// Raw live datasets fetched from backend
const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);
const workloadsMap = ref<Record<number, ResourceWorkload | null>>({});

// DOM chart container references
const utilizationChartRef = ref<HTMLDivElement | null>(null);
const taskTrendChartRef = ref<HTMLDivElement | null>(null);
const taskStatusChartRef = ref<HTMLDivElement | null>(null);
const effortVarianceChartRef = ref<HTMLDivElement | null>(null);
const capacityChartRef = ref<HTMLDivElement | null>(null);

// ECharts instances
let utilizationChart: ECharts | null = null;
let taskTrendChart: ECharts | null = null;
let taskStatusChart: ECharts | null = null;
let effortVarianceChart: ECharts | null = null;
let capacityChart: ECharts | null = null;

let resizeObserver: ResizeObserver | null = null;

function getOrInitChart(el: HTMLDivElement | null): ECharts | null {
  if (!el) return null;
  const existing = echarts.getInstanceByDom(el);
  if (existing) {
    return existing;
  }
  return echarts.init(el);
}

const FONT_FAMILY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function getThemeColors() {
  const isDark = $q.dark.isActive;
  return {
    isDark,
    darkText: isDark ? '#F1F5F9' : '#1D2433',
    mutedText: isDark ? '#94A3B8' : '#697386',
    border: isDark ? '#283042' : '#E6E8ED',
    gridLine: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F2F5',
    cardBg: isDark ? '#181D28' : '#FFFFFF',
    headroomBar: isDark ? '#14B8A6' : '#BEE7E4',
    tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? '#334155' : '#E6E8ED',
    tooltipShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(29, 36, 51, 0.08)',
  };
}

function getCommonTooltip(theme: ReturnType<typeof getThemeColors>) {
  return {
    confine: true,
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    textStyle: {
      color: theme.darkText,
      fontFamily: FONT_FAMILY,
      fontSize: 12,
    },
    extraCssText: `box-shadow: ${theme.tooltipShadow}; border-radius: 8px; padding: 10px 14px; max-width: 280px; white-space: normal; word-break: break-word;`,
  };
}

// -------------------------------------------------------------
// Formatted Display & Card-Specific Filtering Computeds
// -------------------------------------------------------------
const projectSelectOptions = computed(() => {
  const options: Array<{ label: string; value: number | 'ALL' }> = [
    { label: 'All Projects', value: 'ALL' },
  ];
  projectList.value.forEach((p) => {
    options.push({ label: p.name, value: p.project_id });
  });
  return options;
});

// Card-scoped task list for Task Status Distribution
const taskStatusFilteredTasks = computed(() => {
  if (taskStatusProjectId.value === 'ALL') return taskList.value;
  return taskList.value.filter((t) => t.project_id === taskStatusProjectId.value);
});

// Team-wide stats for top KPI Overview cards
const resourceStats = computed(() =>
  computeResourceMetrics(
    resourceList.value,
    workloadsMap.value,
    taskList.value,
    'ALL',
  ),
);

// Task Status Distribution scoped strictly to card project selector
const taskStats = computed(() => computeTaskDistribution(taskStatusFilteredTasks.value));

// Planned vs Actual deliverables (preserves all tasks from backend)
const effortVarianceTasks = computed(() => computeEffortVariance(taskList.value));
const taskEffortCount = computed(() => effortVarianceTasks.value.length);

// Workload Resource Options & Monday-to-Sunday Shift Data
const workloadResourceOptions = computed(() => [
  { label: 'All Resources (Team)', value: 'ALL' as const },
  ...resourceList.value.map((r) => ({ label: r.name, value: r.user_id })),
]);

const weeklyShiftWorkload = computed(() =>
  computeWeeklyShiftWorkload(
    resourceList.value,
    workloadsMap.value,
    selectedWorkloadResourceId.value,
  ),
);

// Resource Task Trend Selection Filter (Scalability: cap at 8 selected resources)
const selectedTrendResourceIds = ref<number[]>([]);

const trendResourceOptions = computed(() => {
  const allTasks = taskList.value;
  return resourceList.value
    .map((r) => {
      const assignedTasks = allTasks.filter(
        (t) =>
          t.assigned_resource_ids?.includes(r.user_id) ||
          t.assigned_resources?.some((ar) => ar.user_id === r.user_id) ||
          t.assigned_resource_names?.some((name) => name.toLowerCase() === r.name.toLowerCase()),
      );
      return {
        label: r.name,
        value: r.user_id,
        taskCount: assignedTasks.length,
      };
    })
    .sort((a, b) => b.taskCount - a.taskCount || a.label.localeCompare(b.label));
});

function initDefaultTrendResources() {
  const opts = trendResourceOptions.value;
  if (!opts.length) {
    selectedTrendResourceIds.value = [];
    return;
  }
  // Max 8 resources, prioritizing those with highest assigned tasks
  const count = Math.min(8, opts.length);
  selectedTrendResourceIds.value = opts.slice(0, count).map((o) => o.value);
}

function onTrendResourcesChange(val: number[]) {
  if (val.length > 8) {
    selectedTrendResourceIds.value = val.slice(0, 8);
    $q.notify({
      type: 'warning',
      message: 'Maximum 8 resources can be displayed simultaneously for optimal readability.',
      timeout: 2000,
    });
  } else if (val.length === 0 && trendResourceOptions.value.length > 0) {
    // Keep at least 1 resource selected
    selectedTrendResourceIds.value = [trendResourceOptions.value[0]!.value];
  } else {
    selectedTrendResourceIds.value = val;
  }
  initTaskTrendChart();
}

function onTaskStatusProjectChange() {
  initTaskStatusChart();
}

function onWorkloadResourceChange() {
  initUtilizationChart();
}

// -------------------------------------------------------------
// Live Backend Data Loading
// -------------------------------------------------------------
async function loadAllAnalyticsData() {
  loading.value = true;
  errorMessage.value = null;

  try {
    // 1. Fetch primary entities in parallel
    const [projects, tasks, resources] = await Promise.all([
      getProjectsApi(),
      getTasksApi(),
      getResourcesApi(),
    ]);

    projectList.value = projects;
    taskList.value = tasks;
    resourceList.value = resources;

    // 2. Fetch resource workloads in parallel
    const wMap: Record<number, ResourceWorkload | null> = {};

    await Promise.all(
      resources.map(async (r) => {
        const wRes = await getResourceWorkloadApi(r.user_id).catch(() => null);
        wMap[r.user_id] = wRes;
      }),
    );

    workloadsMap.value = wMap;
  } catch (err) {
    console.error('Failed to load analytics data:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Unable to connect to analytics services.';
  } finally {
    loading.value = false;
    isInitialLoad.value = false;
    initDefaultTrendResources();
    void nextTick(() => {
      renderAllCharts();
    });
  }
}

// -------------------------------------------------------------
// Chart Renderers (Using Real Calculated Data)
// -------------------------------------------------------------
function renderAllCharts() {
  void nextTick(() => {
    initUtilizationChart();
    initTaskTrendChart();
    initTaskStatusChart();
    initEffortVarianceChart();
    initCapacityChart();
    resizeAll();
  });
}

// 1. Resource Workload & Utilization (Weekly Shift: Monday → Sunday)
function initUtilizationChart() {
  if (!utilizationChartRef.value) return;
  utilizationChart = getOrInitChart(utilizationChartRef.value);
  if (!utilizationChart) return;

  const theme = getThemeColors();
  const shiftData = weeklyShiftWorkload.value;
  const dayNames = shiftData.map((d) => d.dayLabel);
  const el = utilizationChartRef.value;
  const containerWidth = el.clientWidth || window.innerWidth;
  const isVeryNarrow = containerWidth < 400;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const d = shiftData[items[0]?.dataIndex ?? 0];
        if (!d) return '';

        let statusColor: string;
        let statusText: string;

        if (d.utilization >= 100) {
          statusColor = '#EF4444';
          statusText = 'Over operational limit';
        } else if (d.utilization >= 85) {
          statusColor = '#F59E0B';
          statusText = 'Near operational limit';
        } else if (d.utilization > 0) {
          statusColor = d.utilization >= 60 ? '#10B981' : '#06B6D4';
          statusText = 'Within operational limit';
        } else {
          statusColor = theme.mutedText;
          statusText = d.isWeekend ? 'Non-working weekend' : 'Within operational limit (0h)';
        }

        return `
          <div style="font-weight: 700; font-size: 13px; color: ${theme.darkText};">${d.dayLabel}</div>
          <div style="font-size: 11px; color: ${theme.mutedText}; margin-bottom: 6px;">Date: ${d.dateStr}</div>
          <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
            <span>Utilization:</span>
            <strong style="color:${statusColor}; font-weight:700;">${d.utilization}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
            <span>Scheduled:</span>
            <strong>${d.allocatedHours}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
            <span>Daily Capacity:</span>
            <strong>${d.capacityHours}h</strong>
          </div>
          <div style="margin-top:6px; padding-top:4px; border-top:1px dashed ${theme.border}; font-weight:600; font-size:11px; color:${statusColor};">
            Status: ${statusText}
          </div>
        `;
      },
    },
    grid: {
      top: '14%',
      left: isVeryNarrow ? '1%' : '3%',
      right: isVeryNarrow ? '2%' : '4%',
      bottom: isVeryNarrow ? '14%' : '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dayNames,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: isVeryNarrow ? 9.5 : 10.5,
        fontWeight: 600,
        rotate: isVeryNarrow ? 35 : 0,
      },
    },
    yAxis: {
      type: 'value',
      name: isVeryNarrow ? '' : 'Utilization (%)',
      nameTextStyle: { color: theme.mutedText, fontSize: 11 },
      max: (value) => Math.max(100, Math.ceil(value.max * 1.15)),
      axisLabel: {
        formatter: '{value}%',
        color: theme.mutedText,
        fontSize: isVeryNarrow ? 10 : 11,
      },
      splitLine: {
        lineStyle: { color: theme.gridLine, type: 'dashed' },
      },
    },
    series: [
      {
        name: 'Workload Utilization',
        type: 'bar',
        barWidth: isVeryNarrow ? 16 : 24,
        data: shiftData.map((d) => {
          let barColor: string;
          if (d.utilization >= 100) {
            barColor = '#EF4444';
          } else if (d.utilization >= 85) {
            barColor = '#F59E0B';
          } else if (d.utilization >= 60) {
            barColor = '#10B981';
          } else if (d.utilization > 0) {
            barColor = '#06B6D4';
          } else {
            barColor = theme.isDark ? '#334155' : '#cbd5e1';
          }

          return {
            value: d.utilization,
            itemStyle: {
              color: barColor,
              borderRadius: [4, 4, 0, 0],
            },
          };
        }),
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: theme.mutedText,
          fontSize: isVeryNarrow ? 9.5 : 11,
          fontWeight: 600,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#DC2626', type: 'dashed', width: 2 },
          label: {
            formatter: '85% Limit',
            position: 'insideEndTop',
            fontSize: 10,
            fontWeight: 700,
            color: '#DC2626',
          },
          data: [{ yAxis: 85 }],
          z: 10,
        },
      },
    ],
  };

  utilizationChart.setOption(option, true);
}

// 2. Resource Task Trend (Multi-series Line Chart over 4 Weeks - Weekly Assigned Tasks)
function initTaskTrendChart() {
  if (!taskTrendChartRef.value) return;
  taskTrendChart = getOrInitChart(taskTrendChartRef.value);
  if (!taskTrendChart) return;

  const theme = getThemeColors();
  const el = taskTrendChartRef.value;
  const containerWidth = el.clientWidth || window.innerWidth;
  const isVeryNarrow = containerWidth < 400;

  // Filter resources to only selected resources (capped at 8 for readability)
  const selectedSet = new Set(selectedTrendResourceIds.value);
  let resources = resourceList.value.filter((r) => selectedSet.has(r.user_id));
  if (!resources.length && resourceList.value.length > 0) {
    initDefaultTrendResources();
    const fallbackSet = new Set(selectedTrendResourceIds.value);
    resources = resourceList.value.filter((r) => fallbackSet.has(r.user_id));
  }
  const allTasks = taskList.value;

  // Define 4 weekly intervals (Last 4 Weeks up to now)
  const now = new Date();
  const weeks = [
    {
      label: 'Week 1',
      start: new Date(now.getTime() - 28 * 86400000),
      end: new Date(now.getTime() - 21 * 86400000),
    },
    {
      label: 'Week 2',
      start: new Date(now.getTime() - 21 * 86400000),
      end: new Date(now.getTime() - 14 * 86400000),
    },
    {
      label: 'Week 3',
      start: new Date(now.getTime() - 14 * 86400000),
      end: new Date(now.getTime() - 7 * 86400000),
    },
    {
      label: 'Week 4',
      start: new Date(now.getTime() - 7 * 86400000),
      end: now,
    },
  ];

  const RESOURCE_COLOR_MAP: Record<string, string> = {
    'chinmay gadgil': '#7654D6',
    'hridham chimulkar': '#06B6D4',
    'sana shaikh': '#2563EB',
    'shikhaa prabhudesai': '#22C55E',
    'tanvi khandeparkar': '#EF4444',
  };

  const DEFAULT_COLORS = [
    '#7654D6',
    '#06B6D4',
    '#2563EB',
    '#22C55E',
    '#EF4444',
    '#F59E0B',
    '#8B5CF6',
    '#10B981',
  ];

  // Calculate ASSIGNED task counts per resource during each week (using real assignment/schedule/creation dates)
  const seriesData = resources.map((r, index) => {
    const rTasks = allTasks.filter(
      (t) =>
        t.assigned_resource_ids?.includes(r.user_id) ||
        t.assigned_resources?.some((ar) => ar.user_id === r.user_id) ||
        t.assigned_resource_names?.some((name) => name.toLowerCase() === r.name.toLowerCase()),
    );

    const weeklyCounts = weeks.map((w) => {
      const assignedThisWeek = rTasks.filter((t) => {
        const ar = t.assigned_resources?.find((a) => a.user_id === r.user_id);
        if (!ar || !ar.assigned_at) return false;
        const assignDate = new Date(ar.assigned_at);
        return !isNaN(assignDate.getTime()) && assignDate >= w.start && assignDate <= w.end;
      });
      return assignedThisWeek.length;
    });

    const seriesColor =
      RESOURCE_COLOR_MAP[r.name.trim().toLowerCase()] ||
      DEFAULT_COLORS[index % DEFAULT_COLORS.length] ||
      '#7654D6';

    const visualSpread = (index - 2) * 0.045;
    const displayCounts = weeklyCounts.map((c) =>
      c > 0 ? Number((c + visualSpread).toFixed(3)) : 0,
    );

    return {
      name: r.name,
      type: 'line' as const,
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: isVeryNarrow ? 5 : 6,
      itemStyle: {
        color: seriesColor,
      },
      lineStyle: {
        width: isVeryNarrow ? 1.8 : 2.2,
        color: seriesColor,
      },
      endLabel: {
        show: !isVeryNarrow,
        formatter: () => String(weeklyCounts[3]),
        color: '#ffffff',
        backgroundColor: seriesColor,
        borderRadius: 8,
        padding: [2, 5],
        fontSize: 10,
        fontWeight: 700,
        distance: 6,
      },
      data: displayCounts,
      rawWeeklyCounts: weeklyCounts,
    };
  });

  const maxRecorded = Math.max(...seriesData.flatMap((s) => s.rawWeeklyCounts), 0);
  const yMax = Math.max(5, maxRecorded + 1);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: theme.border,
          type: 'dashed',
        },
      },
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params];
        if (!list.length) return '';
        const firstItem = list[0] as {
          axisValueLabel?: string;
          name?: string;
          dataIndex?: number;
        };
        const weekLabel = firstItem?.axisValueLabel || firstItem?.name || '';
        const dataIndex = typeof firstItem?.dataIndex === 'number' ? firstItem.dataIndex : 0;
        let html = `<div style="font-weight:700; font-size:12px; margin-bottom:6px; color:${theme.darkText};">${weekLabel}</div>`;
        seriesData.forEach((s) => {
          const color = s.itemStyle.color;
          const count = s.rawWeeklyCounts[dataIndex] ?? 0;
          html += `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:3px; font-size:11.5px;">
              <span style="display:flex; align-items:center; gap:6px; color:${theme.darkText};">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${color};"></span>
                ${s.name}
              </span>
              <strong style="color:${color}; font-weight:700;">${count} ${count === 1 ? 'task' : 'tasks'} assigned</strong>
            </div>
          `;
        });
        return html;
      },
    },
    legend: {
      top: '0%',
      left: 'center',
      icon: 'circle',
      itemWidth: isVeryNarrow ? 6 : 8,
      itemHeight: isVeryNarrow ? 6 : 8,
      itemGap: isVeryNarrow ? 8 : 12,
      textStyle: {
        color: theme.darkText,
        fontFamily: FONT_FAMILY,
        fontSize: isVeryNarrow ? 9.5 : 10.5,
        fontWeight: 500,
      },
      data: resources.map((r) => r.name),
    },
    grid: {
      top: isVeryNarrow ? 40 : 50,
      left: isVeryNarrow ? '2%' : '4%',
      right: isVeryNarrow ? '6%' : '8%',
      bottom: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        color: theme.mutedText,
        fontFamily: FONT_FAMILY,
        fontSize: isVeryNarrow ? 10 : 11,
      },
    },
    yAxis: {
      type: 'value',
      name: isVeryNarrow ? '' : 'Assigned Tasks',
      nameLocation: 'middle',
      nameGap: isVeryNarrow ? 0 : 28,
      min: 0,
      max: yMax,
      interval: 1,
      nameTextStyle: {
        color: theme.mutedText,
        fontFamily: FONT_FAMILY,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { color: theme.gridLine, type: 'dashed' },
      },
      axisLabel: {
        color: theme.mutedText,
        fontFamily: FONT_FAMILY,
        fontSize: isVeryNarrow ? 10 : 11,
      },
    },
    series: seriesData,
  };

  taskTrendChart.setOption(option, true);
}

// 3. Task Status Distribution (Card-Scoped Project Filter)
function initTaskStatusChart() {
  if (!taskStatusChartRef.value) return;
  taskStatusChart = getOrInitChart(taskStatusChartRef.value);
  if (!taskStatusChart) return;

  const theme = getThemeColors();
  const stats = taskStats.value;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const it = params as { name: string; value: number; percent: number; color: string };
        return `
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px; color:${theme.darkText};">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${it.color};"></span>
            <strong>${it.name}</strong>
          </div>
          <div style="color:${theme.mutedText};">${it.value} tasks (${it.percent}%)</div>
        `;
      },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.mutedText, fontSize: 11 },
      formatter: (name: string) => {
        const item = stats.items.find((d) => d.label === name);
        return `${name}  ${item ? item.count : ''}`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 3,
          borderColor: theme.cardBg,
          borderWidth: 2,
        },
        label: { show: false },
        data: stats.items.map((d) => ({
          name: d.label,
          value: d.count,
          itemStyle: { color: d.color },
        })),
      },
    ],
    title: {
      text: `${stats.totalTasks}`,
      subtext: 'TASKS',
      left: '49%',
      top: '36%',
      textAlign: 'center',
      textStyle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.darkText,
        fontFamily: FONT_FAMILY,
      },
      subtextStyle: {
        fontSize: 10,
        fontWeight: 600,
        color: theme.mutedText,
        fontFamily: FONT_FAMILY,
      },
    },
  };

  taskStatusChart.setOption(option, true);
}

// 4. Planned vs Actual Effort (Horizontal Scrollable View)
function initEffortVarianceChart() {
  if (!effortVarianceChartRef.value) return;
  effortVarianceChart = getOrInitChart(effortVarianceChartRef.value);
  if (!effortVarianceChart) return;

  const theme = getThemeColors();
  const el = effortVarianceChartRef.value;
  const containerWidth = el.clientWidth || window.innerWidth;
  const isVeryNarrow = containerWidth < 400;
  const maxLabelLen = isVeryNarrow ? 15 : 28;

  const taskEfforts = effortVarianceTasks.value;
  const titles = taskEfforts.map((t) => t.title);
  const hasOverflow = taskEfforts.length > 6;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const t = taskEfforts[items[0]?.dataIndex ?? 0];
        if (!t) return '';
        const varianceText =
          t.variance > 0 ? `+${t.variance}h Overrun` : `${t.variance}h Within Estimate`;
        const varianceColor = t.isOverrun ? ANALYTICS_PALETTE.danger : ANALYTICS_PALETTE.green;
        return `
          <div style="font-weight:600; font-size:12px; margin-bottom:4px; color:${theme.darkText};">${t.title}</div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Planned Effort:</span>
            <strong>${t.plannedHours}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Actual Logged:</span>
            <strong>${t.actualHours}h</strong>
          </div>
          <div style="margin-top:4px; font-weight:600; color:${varianceColor};">
            ${varianceText}
          </div>
        `;
      },
    },
    legend: {
      top: '0%',
      right: '2%',
      itemWidth: isVeryNarrow ? 8 : 10,
      itemHeight: isVeryNarrow ? 8 : 10,
      textStyle: { color: theme.mutedText, fontSize: isVeryNarrow ? 9.5 : 11 },
      data: ['Planned (hrs)', 'Actual (hrs)'],
    },
    grid: {
      top: '10%',
      left: isVeryNarrow ? '1%' : '3%',
      right: isVeryNarrow ? '8%' : hasOverflow ? '8%' : '4%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: isVeryNarrow ? '' : 'Hours',
      nameTextStyle: { color: theme.mutedText, fontSize: 10 },
      axisLabel: { formatter: '{value}h', color: theme.mutedText, fontSize: isVeryNarrow ? 10 : 11 },
      splitLine: { lineStyle: { color: theme.gridLine, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: titles,
      inverse: true,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: isVeryNarrow ? 10 : 11,
        fontWeight: 500,
        formatter: (val: string) => (val.length > maxLabelLen ? val.substring(0, maxLabelLen - 1) + '…' : val),
      },
    },
    dataZoom: hasOverflow
      ? [
          {
            type: 'slider',
            yAxisIndex: 0,
            width: isVeryNarrow ? 10 : 12,
            right: '1%',
            startValue: 0,
            endValue: Math.min(6, taskEfforts.length - 1),
            showDetail: false,
            brushSelect: false,
            fillerColor: 'rgba(118, 84, 214, 0.25)',
            borderColor: theme.border,
            handleStyle: {
              color: '#7654D6',
            },
          },
          {
            type: 'inside',
            yAxisIndex: 0,
            zoomOnMouseWheel: false,
            moveOnMouseMove: true,
            moveOnMouseWheel: true,
          },
        ]
      : [],
    series: [
      {
        name: 'Planned (hrs)',
        type: 'bar',
        barWidth: isVeryNarrow ? 10 : 12,
        data: taskEfforts.map((d) => d.plannedHours),
        itemStyle: { color: ANALYTICS_PALETTE.primary, borderRadius: [0, 3, 3, 0] },
      },
      {
        name: 'Actual (hrs)',
        type: 'bar',
        barWidth: isVeryNarrow ? 10 : 12,
        data: taskEfforts.map((d) => ({
          value: d.actualHours,
          itemStyle: {
            color: d.isOverrun ? ANALYTICS_PALETTE.danger : ANALYTICS_PALETTE.teal,
            borderRadius: [0, 3, 3, 0],
          },
        })),
      },
    ],
  };

  effortVarianceChart.setOption(option, true);
}

// 7. Capacity vs Assigned Effort (Scheduling Intelligence)
function initCapacityChart() {
  if (!capacityChartRef.value) return;
  capacityChart = getOrInitChart(capacityChartRef.value);
  if (!capacityChart) return;

  const theme = getThemeColors();
  const el = capacityChartRef.value;
  const containerWidth = el.clientWidth || window.innerWidth;
  const isVeryNarrow = containerWidth < 400;
  const maxNameLen = isVeryNarrow ? 13 : 18;

  // Sort resources consistently by assigned effort / utilization descending
  const data = [...resourceStats.value.items].sort(
    (a, b) => b.assignedHours - a.assignedHours || b.utilization - a.utilization,
  );
  const names = data.map((d) => d.name);
  const hasOverflow = data.length > 8;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const r = data[items[0]?.dataIndex ?? 0];
        if (!r) return '';
        const dispatchBadge = r.isEligibleForDispatch
          ? `<span style="color:${ANALYTICS_PALETTE.teal}; font-weight:600;">Eligible for Auto-Dispatch (+${r.remainingHeadroom}h free)</span>`
          : `<span style="color:${ANALYTICS_PALETTE.danger}; font-weight:600;">Capacity Constrained (&lt; 4h headroom)</span>`;
        return `
          <div style="font-weight:600; font-size:13px; color:${theme.darkText};">${r.name}</div>
          <div style="font-size:11px; color:${theme.mutedText}; margin-bottom:6px;">${r.role}</div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Weekly Capacity:</span>
            <strong>${r.weeklyCapacity}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Assigned Workload:</span>
            <strong style="color:${ANALYTICS_PALETTE.primary};">${r.assignedHours}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Schedulable Headroom:</span>
            <strong style="color:${ANALYTICS_PALETTE.teal};">${r.remainingHeadroom}h</strong>
          </div>
          <div style="margin-top:6px; padding-top:4px; border-top:1px dashed ${theme.border};">
            ${dispatchBadge}
          </div>
        `;
      },
    },
    legend: {
      top: '0%',
      right: '2%',
      itemWidth: isVeryNarrow ? 8 : 10,
      itemHeight: isVeryNarrow ? 8 : 10,
      textStyle: { color: theme.mutedText, fontSize: isVeryNarrow ? 9.5 : 11 },
      data: ['Assigned Effort', 'Schedulable Headroom'],
    },
    grid: {
      top: '12%',
      left: isVeryNarrow ? '1%' : '3%',
      right: isVeryNarrow ? '8%' : hasOverflow ? '8%' : '4%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: isVeryNarrow ? '' : 'Hours / Week',
      nameTextStyle: { color: theme.mutedText, fontSize: 10 },
      axisLabel: { formatter: '{value}h', color: theme.mutedText, fontSize: isVeryNarrow ? 10 : 11 },
      splitLine: { lineStyle: { color: theme.gridLine, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: isVeryNarrow ? 10 : 11,
        fontWeight: 500,
        formatter: (val: string) => (val.length > maxNameLen ? val.substring(0, maxNameLen - 1) + '…' : val),
      },
    },
    dataZoom: hasOverflow
      ? [
          {
            type: 'slider',
            yAxisIndex: 0,
            width: isVeryNarrow ? 10 : 12,
            right: '1%',
            startValue: 0,
            endValue: 7,
            showDetail: false,
            brushSelect: false,
            fillerColor: 'rgba(22, 166, 161, 0.25)',
            borderColor: theme.border,
            handleStyle: {
              color: '#16A6A1',
            },
          },
          {
            type: 'inside',
            yAxisIndex: 0,
            zoomOnMouseWheel: false,
            moveOnMouseMove: true,
            moveOnMouseWheel: true,
          },
        ]
      : [],
    series: [
      {
        name: 'Assigned Effort',
        type: 'bar',
        stack: 'capacity',
        barWidth: isVeryNarrow ? 12 : 14,
        data: data.map((d) => d.assignedHours),
        itemStyle: { color: ANALYTICS_PALETTE.primary, borderRadius: [4, 0, 0, 4] },
      },
      {
        name: 'Schedulable Headroom',
        type: 'bar',
        stack: 'capacity',
        barWidth: isVeryNarrow ? 12 : 14,
        data: data.map((d) => d.remainingHeadroom),
        itemStyle: {
          color: theme.headroomBar,
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  };

  capacityChart.setOption(option, true);
}

// -------------------------------------------------------------
// Lifecycle & Responsiveness
// -------------------------------------------------------------
function resizeAll() {
  if (utilizationChart) initUtilizationChart();
  if (taskTrendChart) initTaskTrendChart();
  if (taskStatusChart) initTaskStatusChart();
  if (effortVarianceChart) initEffortVarianceChart();
  if (capacityChart) initCapacityChart();

  utilizationChart?.resize();
  taskTrendChart?.resize();
  taskStatusChart?.resize();
  effortVarianceChart?.resize();
  capacityChart?.resize();
}

onMounted(() => {
  void loadAllAnalyticsData();

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      resizeAll();
    });
    const container = document.querySelector('.analytics-page-wrapper');
    if (container) {
      resizeObserver.observe(container);
    }
  }

  window.addEventListener('resize', resizeAll);
});

watch(taskStatusProjectId, () => {
  void nextTick(() => {
    initTaskStatusChart();
  });
});

watch(selectedWorkloadResourceId, () => {
  void nextTick(() => {
    initUtilizationChart();
  });
});

watch(
  () => $q.dark.isActive,
  () => {
    void nextTick(() => {
      renderAllCharts();
    });
  },
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll);

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  utilizationChart?.dispose();
  utilizationChart = null;

  taskTrendChart?.dispose();
  taskTrendChart = null;

  taskStatusChart?.dispose();
  taskStatusChart = null;

  effortVarianceChart?.dispose();
  effortVarianceChart = null;

  capacityChart?.dispose();
  capacityChart = null;
});
</script>

<style scoped lang="scss">
.analytics-page {
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 599px) {
    padding: 12px 8px !important;
  }
  @media (max-width: 399px) {
    padding: 8px 4px !important;
  }
}

.analytics-page-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.chart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  @media (max-width: 599px) {
    flex-direction: column;
    align-items: flex-start !important;
  }
}

.chart-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 599px) {
    width: 100%;
    justify-content: flex-start;
  }
}

.task-status-project-select {
  min-width: 140px;
  max-width: 220px;
  font-size: 11.5px;

  @media (max-width: 480px) {
    max-width: 100% !important;
    flex-grow: 1;
  }

  :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
    padding: 0 10px;
  }

  :deep(.q-field__marginal) {
    height: 30px;
  }

  :deep(.q-field__native) {
    padding: 0;
    min-height: 30px;
    font-size: 11.5px;
  }
}

.workload-resource-select {
  min-width: 140px;
  max-width: 190px;
  font-size: 11px;

  @media (max-width: 480px) {
    max-width: 100% !important;
    flex-grow: 1;
  }

  :deep(.q-field__control) {
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
  }

  :deep(.q-field__marginal) {
    height: 28px;
  }

  :deep(.q-field__native) {
    padding: 0;
    min-height: 28px;
  }
}

.trend-resource-select {
  min-width: 130px;
  max-width: 165px;
  font-size: 11px;

  @media (max-width: 480px) {
    max-width: 100% !important;
    flex-grow: 1;
  }

  :deep(.q-field__control) {
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
  }

  :deep(.q-field__marginal) {
    height: 28px;
  }

  :deep(.q-field__native) {
    padding: 0;
    min-height: 28px;
  }
}

/* KPI Cards */
.kpi-card {
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--wo-primary, #8b6fd8) !important;
    box-shadow: 0 8px 20px rgba(139, 111, 216, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
    transform: translateY(-2px);
  }

  &.kpi-card-alert {
    border-color: #f5c2c7;
    background: #fffafa;

    &:hover {
      border-color: #e05260 !important;
      box-shadow: 0 8px 20px rgba(224, 82, 96, 0.15);
      transform: translateY(-2px);
    }
  }
}

/* Chart Cards */
.chart-card {
  border-radius: 12px;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--wo-primary, #8b6fd8) !important;
    box-shadow: 0 8px 22px rgba(139, 111, 216, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
    transform: translateY(-2px);
  }
}

.echarts-box {
  width: 100%;
  height: 290px;
}

.task-trend-chart-box {
  height: 265px;
}

.effort-variance-chart-box {
  height: 320px;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* Dark Mode Scoped Overrides */
body.body--dark {
  .kpi-card:hover,
  .chart-card:hover {
    border-color: var(--wo-primary, #8b6fd8) !important;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 111, 216, 0.3);
  }

  .kpi-card.kpi-card-alert {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.1);

    &:hover {
      border-color: #f87171 !important;
      box-shadow: 0 8px 22px rgba(239, 68, 68, 0.25);
    }
  }
}
</style>
