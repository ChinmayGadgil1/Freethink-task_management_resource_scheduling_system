<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="analytics-page q-pa-lg"
  >
    <div class="analytics-page-wrapper">
      <!-- 1. PAGE HEADER -->
      <div class="row items-center justify-between q-mb-md wrap gap-sm">
        <div>
          <h1
            class="page-title text-h5 text-weight-bold q-ma-none"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Project & Resource Analytics
          </h1>
          <p
            class="page-subtitle text-caption q-mt-xs q-mb-none"
            :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
          >
            Real-time insights for better project planning and resource allocation
          </p>
        </div>

        <!-- Header Actions: Project Filter, Date Range, Refresh -->
        <div class="row items-center gap-sm">
          <!-- Project Filter Dropdown -->
          <q-select
            v-model="selectedProjectId"
            :options="projectSelectOptions"
            emit-value
            map-options
            dense
            outlined
            rounded
            :dark="$q.dark.isActive"
            :bg-color="$q.dark.isActive ? 'dark' : 'white'"
            class="project-filter-select"
            @update:model-value="handleProjectFilterChange"
          >
            <template #prepend>
              <q-icon name="folder" size="16px" color="primary" />
            </template>
          </q-select>

          <!-- Interactive Date Range Picker Filter -->
          <div
            class="date-range-badge row items-center gap-xs gt-xs cursor-pointer"
            :class="{ 'date-range-badge-dark': $q.dark.isActive }"
          >
            <q-icon
              name="calendar_today"
              size="14px"
              :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            />
            <span>{{ formattedWeekRange }}</span>
            <q-icon
              name="arrow_drop_down"
              size="14px"
              :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            />
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="customDateRange"
                range
                mask="YYYY-MM-DD"
                color="primary"
                :dark="$q.dark.isActive"
                @update:model-value="onDateRangeChange"
              >
                <div class="row items-center justify-end q-gutter-xs q-pa-xs">
                  <q-btn
                    v-close-popup
                    label="Reset Week"
                    flat
                    dense
                    color="primary"
                    @click="resetToCurrentWeek"
                  />
                  <q-btn v-close-popup label="Done" color="primary" dense class="q-px-sm" />
                </div>
              </q-date>
            </q-popup-proxy>
          </div>

          <!-- Refresh Action Button -->
          <q-btn
            outline
            dense
            color="primary"
            icon="refresh"
            label="Refresh"
            no-caps
            class="q-px-sm refresh-btn"
            :class="{ 'refresh-btn-dark': $q.dark.isActive }"
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
            <q-card flat bordered :dark="$q.dark.isActive" class="kpi-card">
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span class="kpi-title" :class="$q.dark.isActive ? 'text-grey-4' : ''"
                    >Team Utilization</span
                  >
                  <div class="row items-baseline gap-xs q-mt-xs">
                    <span class="kpi-value" :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                      >{{ resourceStats.averageUtilization }}%</span
                    >
                    <span
                      class="kpi-delta text-weight-medium"
                      :class="
                        resourceStats.averageUtilization > 85 ? 'text-negative' : 'text-positive'
                      "
                    >
                      {{ resourceStats.averageUtilization > 85 ? '▲ Overloaded' : '● Optimal' }}
                    </span>
                  </div>
                  <span class="kpi-subtitle">Target: 60% – 85%</span>
                </div>
                <div class="kpi-icon-box bg-purple-soft text-purple">
                  <q-icon name="group" size="20px" />
                </div>
              </div>
            </q-card>
          </div>

          <!-- KPI 2: Available Headroom -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered :dark="$q.dark.isActive" class="kpi-card">
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span class="kpi-title" :class="$q.dark.isActive ? 'text-grey-4' : ''"
                    >Available Headroom</span
                  >
                  <div class="row items-baseline gap-xs q-mt-xs">
                    <span class="kpi-value" :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                      >{{ resourceStats.totalAvailableHeadroom }}h</span
                    >
                    <span class="kpi-delta text-teal text-weight-medium">Ready</span>
                  </div>
                  <span class="kpi-subtitle">Across {{ resourceList.length }} resources</span>
                </div>
                <div class="kpi-icon-box bg-blue-soft text-blue">
                  <q-icon name="layers" size="20px" />
                </div>
              </div>
            </q-card>
          </div>

          <!-- KPI 3: Task Completion -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered :dark="$q.dark.isActive" class="kpi-card">
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span class="kpi-title" :class="$q.dark.isActive ? 'text-grey-4' : ''"
                    >Task Completion</span
                  >
                  <div class="row items-baseline gap-xs q-mt-xs">
                    <span class="kpi-value" :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                      >{{ taskStats.completionPercent }}%</span
                    >
                    <span class="kpi-delta text-positive text-weight-medium">Active</span>
                  </div>
                  <span class="kpi-subtitle">
                    {{ taskStats.completedTasks }} / {{ taskStats.totalTasks }} tasks done
                  </span>
                </div>
                <div class="kpi-icon-box bg-green-soft text-positive">
                  <q-icon name="check_circle" size="20px" />
                </div>
              </div>
            </q-card>
          </div>

          <!-- KPI 4: Overloaded Resources -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              :dark="$q.dark.isActive"
              class="kpi-card"
              :class="{ 'kpi-card-alert': resourceStats.overloadedCount > 0 }"
            >
              <div class="row items-center justify-between no-wrap">
                <div class="column">
                  <span class="kpi-title" :class="$q.dark.isActive ? 'text-grey-4' : ''"
                    >Overloaded Resources</span
                  >
                  <div class="row items-baseline gap-xs q-mt-xs">
                    <span
                      class="kpi-value"
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
                      class="kpi-delta text-negative text-weight-medium"
                    >
                      ▲ Attention
                    </span>
                  </div>
                  <span class="kpi-subtitle">&gt; 85% workload threshold</span>
                </div>
                <div class="kpi-icon-box bg-red-soft text-negative">
                  <q-icon name="warning_amber" size="20px" />
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 1: Resource Workload & 4-Week Trajectory Trend     -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- 1A: Resource Workload & Utilization -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Resource Workload & Utilization</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Current allocation percentage against the 85% operational limit</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Current allocation against 85% operational limit
                  </div>
                </div>
                <div class="badge-tag" :class="{ 'badge-tag-dark': $q.dark.isActive }">Weekly</div>
              </div>
              <div ref="utilizationChartRef" class="echarts-box"></div>
            </q-card>
          </div>

          <!-- 1B: Resource Task Trend -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Resource Task Trend</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Number of active tasks assigned to each resource over time</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Number of active tasks assigned to each resource over time
                  </div>
                </div>
                <div class="badge-tag" :class="{ 'badge-tag-dark': $q.dark.isActive }">
                  Last 4 Weeks
                </div>
              </div>
              <div ref="taskTrendChartRef" class="echarts-box task-trend-chart-box"></div>
              <div
                class="trend-insight-banner row items-center q-px-md q-py-xs q-mt-sm"
                :class="{ 'trend-insight-banner-dark': $q.dark.isActive }"
              >
                <q-icon
                  name="lightbulb_outline"
                  size="16px"
                  :color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  class="q-mr-xs"
                />
                <span
                  class="trend-insight-text"
                  :class="{ 'trend-insight-text-dark': $q.dark.isActive }"
                  >Shows how your active task count has changed over the last 4 weeks.</span
                >
              </div>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 2: Availability Heatmap & Task Status Doughnut      -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- 2A: Resource Availability Heatmap -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Resource Availability Heatmap</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Daily working schedule availability for automated task dispatch</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Daily schedule status for automated task dispatch
                  </div>
                </div>
                <div
                  class="row items-center gap-sm text-caption gt-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  <span class="row items-center gap-xs">
                    <span class="legend-dot bg-teal"></span> Available
                  </span>
                  <span class="row items-center gap-xs">
                    <span class="legend-dot bg-positive"></span> Moderate
                  </span>
                  <span class="row items-center gap-xs">
                    <span class="legend-dot bg-warning"></span> High Load
                  </span>
                  <span class="row items-center gap-xs">
                    <span class="legend-dot bg-negative"></span> Fully Booked
                  </span>
                </div>
              </div>
              <div ref="heatmapChartRef" class="echarts-box"></div>
            </q-card>
          </div>

          <!-- 2B: Task Status Distribution -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Task Status Distribution</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip>Pipeline volume aggregated by task status</q-tooltip>
                    </q-icon>
                  </div>
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Execution pipeline state across active tasks
                  </div>
                </div>
                <div class="badge-tag" :class="{ 'badge-tag-dark': $q.dark.isActive }">
                  {{ selectedProjectName }}
                </div>
              </div>
              <div ref="taskStatusChartRef" class="echarts-box"></div>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 3: Project Schedule Health & Planned vs Actual      -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- 3A: Project Schedule Health -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Project Schedule Health</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip
                        >Actual completion progress against planned pace derived from milestone
                        dates</q-tooltip
                      >
                    </q-icon>
                  </div>
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Actual milestone completion vs. planned pace
                  </div>
                </div>
                <div
                  class="row items-center gap-md text-caption gt-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  <span class="row items-center gap-xs">
                    <span class="legend-dot" style="background-color: #7654d6"></span> Actual
                    Progress
                  </span>
                  <span class="row items-center gap-xs">
                    <span
                      class="legend-dot"
                      :style="{ backgroundColor: $q.dark.isActive ? '#334155' : '#e2e5eb' }"
                    ></span>
                    Planned Pace
                  </span>
                </div>
              </div>
              <div ref="projectScheduleChartRef" class="echarts-box"></div>
            </q-card>
          </div>

          <!-- 3B: Planned vs Actual Effort -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Planned vs. Actual Effort</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip>Hours variance on key project deliverables</q-tooltip>
                    </q-icon>
                  </div>
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Hours variance on critical project deliverables
                  </div>
                </div>
                <div
                  class="row items-center gap-md text-caption gt-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  <span class="row items-center gap-xs">
                    <span class="legend-dot" style="background-color: #7654d6"></span> Planned (hrs)
                  </span>
                  <span class="row items-center gap-xs">
                    <span class="legend-dot" style="background-color: #16a6a1"></span> Actual (hrs)
                  </span>
                </div>
              </div>
              <div ref="effortVarianceChartRef" class="echarts-box"></div>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 4: Capacity vs Assigned Effort (Full Width)        -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- 4A: Capacity vs Assigned Effort (Full Width) -->
          <div class="col-12">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card">
              <div class="chart-card-header row items-center justify-between">
                <div>
                  <div
                    class="chart-title row items-center gap-xs"
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
                  <div class="chart-caption" :class="$q.dark.isActive ? 'text-grey-4' : ''">
                    Remaining headroom available for automatic scheduling engine dispatch
                  </div>
                </div>
                <div class="badge-tag" :class="{ 'badge-tag-dark': $q.dark.isActive }">
                  Auto-Scheduler
                </div>
              </div>
              <div ref="capacityChartRef" class="echarts-box"></div>
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
  getResourceAvailabilityApi,
} from '@/services/api';
import type {
  Project,
  ResourceUser,
  Task,
  ResourceWorkload,
  ResourceAvailabilityResponseDTO,
} from '@/services/api';
import {
  ANALYTICS_PALETTE,
  getCurrentWeekWorkingDays,
  computeResourceMetrics,
  computeTaskDistribution,
  computeProjectScheduleHealth,
  computeEffortVariance,
  computeAvailabilityHeatmap,
} from '@/components/analytics/analyticsCalculations';

const $q = useQuasar();

// -------------------------------------------------------------
// Component State
// -------------------------------------------------------------
const loading = ref(true);
const isInitialLoad = ref(true);
const errorMessage = ref<string | null>(null);

const selectedProjectId = ref<number | 'ALL'>('ALL');

// Raw live datasets fetched from backend
const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);
const workloadsMap = ref<Record<number, ResourceWorkload | null>>({});
const availabilityMap = ref<Record<number, ResourceAvailabilityResponseDTO | null>>({});

// DOM chart container references
const utilizationChartRef = ref<HTMLDivElement | null>(null);
const taskTrendChartRef = ref<HTMLDivElement | null>(null);
const heatmapChartRef = ref<HTMLDivElement | null>(null);
const taskStatusChartRef = ref<HTMLDivElement | null>(null);
const projectScheduleChartRef = ref<HTMLDivElement | null>(null);
const effortVarianceChartRef = ref<HTMLDivElement | null>(null);
const capacityChartRef = ref<HTMLDivElement | null>(null);

// ECharts instances
let utilizationChart: ECharts | null = null;
let taskTrendChart: ECharts | null = null;
let heatmapChart: ECharts | null = null;
let taskStatusChart: ECharts | null = null;
let projectScheduleChart: ECharts | null = null;
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
    plannedBar: isDark ? '#334155' : '#E2E5EB',
    headroomBar: isDark ? '#14B8A6' : '#BEE7E4',
    tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? '#334155' : '#E6E8ED',
    tooltipShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(29, 36, 51, 0.08)',
  };
}

function getCommonTooltip(theme: ReturnType<typeof getThemeColors>) {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    textStyle: {
      color: theme.darkText,
      fontFamily: FONT_FAMILY,
      fontSize: 12,
    },
    extraCssText: `box-shadow: ${theme.tooltipShadow}; border-radius: 8px; padding: 10px 14px;`,
  };
}

// -------------------------------------------------------------
// Formatted Display & Filtering Computeds
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

const selectedProjectName = computed(() => {
  if (selectedProjectId.value === 'ALL') return 'All Projects';
  const found = projectList.value.find((p) => p.project_id === selectedProjectId.value);
  return found?.name ?? 'Filtered Project';
});

const filteredTasks = computed(() => {
  if (selectedProjectId.value === 'ALL') return taskList.value;
  return taskList.value.filter((t) => t.project_id === selectedProjectId.value);
});

const filteredProjects = computed(() => {
  if (selectedProjectId.value === 'ALL') return projectList.value;
  return projectList.value.filter((p) => p.project_id === selectedProjectId.value);
});

const defaultWorkingDays = getCurrentWeekWorkingDays();
const defaultStartDate = defaultWorkingDays[0]?.dateStr ?? '';
const defaultEndDate = defaultWorkingDays[defaultWorkingDays.length - 1]?.dateStr ?? '';

const customDateRange = ref<{ from: string; to: string } | string>({
  from: defaultStartDate,
  to: defaultEndDate,
});

const formattedWeekRange = computed(() => {
  if (typeof customDateRange.value === 'string') {
    return customDateRange.value;
  }
  if (customDateRange.value?.from && customDateRange.value?.to) {
    return `${customDateRange.value.from} – ${customDateRange.value.to}`;
  }
  return `${defaultStartDate} – ${defaultEndDate}`;
});

function onDateRangeChange() {
  void loadAllAnalyticsData();
}

function resetToCurrentWeek() {
  customDateRange.value = {
    from: defaultStartDate,
    to: defaultEndDate,
  };
  void loadAllAnalyticsData();
}

// Computed statistical analytics - dynamically scoped to selected project
const resourceStats = computed(() =>
  computeResourceMetrics(
    resourceList.value,
    workloadsMap.value,
    filteredTasks.value,
    selectedProjectId.value,
  ),
);

const taskStats = computed(() => computeTaskDistribution(filteredTasks.value));

// -------------------------------------------------------------
// Live Backend Data Loading
// -------------------------------------------------------------
async function loadAllAnalyticsData() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const startDate =
      typeof customDateRange.value === 'string'
        ? customDateRange.value
        : customDateRange.value?.from || defaultStartDate;
    const endDate =
      typeof customDateRange.value === 'string'
        ? customDateRange.value
        : customDateRange.value?.to || defaultEndDate;

    // 1. Fetch primary entities in parallel
    const [projects, tasks, resources] = await Promise.all([
      getProjectsApi(),
      getTasksApi(),
      getResourcesApi(),
    ]);

    projectList.value = projects;
    taskList.value = tasks;
    resourceList.value = resources;

    // 2. Fetch resource workloads and availability in parallel
    const wMap: Record<number, ResourceWorkload | null> = {};
    const aMap: Record<number, ResourceAvailabilityResponseDTO | null> = {};

    await Promise.all(
      resources.map(async (r) => {
        const [wRes, aRes] = await Promise.all([
          getResourceWorkloadApi(r.user_id).catch(() => null),
          getResourceAvailabilityApi(r.user_id, startDate, endDate).catch(() => null),
        ]);
        wMap[r.user_id] = wRes;
        aMap[r.user_id] = aRes;
      }),
    );

    workloadsMap.value = wMap;
    availabilityMap.value = aMap;
  } catch (err) {
    console.error('Failed to load analytics data:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Unable to connect to analytics services.';
  } finally {
    loading.value = false;
    isInitialLoad.value = false;
    void nextTick(() => {
      renderAllCharts();
    });
  }
}

function handleProjectFilterChange() {
  renderAllCharts();
}

// -------------------------------------------------------------
// Chart Renderers (Using Real Calculated Data)
// -------------------------------------------------------------
function renderAllCharts() {
  void nextTick(() => {
    initUtilizationChart();
    initTaskTrendChart();
    initHeatmapChart();
    initTaskStatusChart();
    initProjectScheduleChart();
    initEffortVarianceChart();
    initCapacityChart();
    resizeAll();
  });
}

// 1. Resource Workload & Utilization
function initUtilizationChart() {
  if (!utilizationChartRef.value) return;
  utilizationChart = getOrInitChart(utilizationChartRef.value);
  if (!utilizationChart) return;

  const theme = getThemeColors();
  const data = resourceStats.value.items;
  const names = data.map((d) => d.name);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params;
        const r = data[item.dataIndex as number];
        if (!r) return '';
        const color = r.isOverloaded
          ? ANALYTICS_PALETTE.danger
          : r.utilization >= 60
            ? ANALYTICS_PALETTE.green
            : ANALYTICS_PALETTE.teal;
        return `
          <div style="font-weight: 600; font-size: 13px; color: ${theme.darkText};">${r.name}</div>
          <div style="font-size: 11px; color: ${theme.mutedText}; margin-bottom: 6px;">${r.role}</div>
          <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
            <span>Utilization:</span>
            <strong style="color:${color};">${r.utilization}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
            <span>Allocated Effort:</span>
            <strong>${r.assignedHours}h / ${r.weeklyCapacity}h</strong>
          </div>
        `;
      },
    },
    grid: {
      top: '8%',
      left: '3%',
      right: '8%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: (value) => Math.max(100, Math.ceil(value.max * 1.1)),
      axisLabel: {
        formatter: '{value}%',
        color: theme.mutedText,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { color: theme.gridLine, type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: 12,
        fontWeight: 500,
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        data: data.map((d) => ({
          value: d.utilization,
          itemStyle: {
            color: d.isOverloaded
              ? ANALYTICS_PALETTE.danger
              : d.utilization >= 60
                ? ANALYTICS_PALETTE.green
                : ANALYTICS_PALETTE.teal,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: theme.mutedText,
          fontSize: 11,
          fontWeight: 600,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: ANALYTICS_PALETTE.danger, type: 'dashed', width: 1.5 },
          label: {
            formatter: '85%',
            position: 'insideEndTop',
            fontSize: 10,
            color: ANALYTICS_PALETTE.danger,
          },
          data: [{ xAxis: 85 }],
        },
      },
    ],
  };

  utilizationChart.setOption(option, true);
}

// 2. Resource Task Trend (Multi-series Line Chart over 4 Weeks)
function initTaskTrendChart() {
  if (!taskTrendChartRef.value) return;
  taskTrendChart = getOrInitChart(taskTrendChartRef.value);
  if (!taskTrendChart) return;

  const theme = getThemeColors();
  const resources = resourceList.value;
  const tasks = filteredTasks.value;

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

  // Specific color palette matching SaaS dashboard design
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

  // Calculate active task counts per resource across the 4 weeks
  const seriesData = resources.map((r, index) => {
    const rTasks = tasks.filter(
      (t) =>
        t.assigned_resource_ids?.includes(r.user_id) ||
        t.assigned_resources?.some((ar) => ar.user_id === r.user_id) ||
        t.assigned_resource_names?.some((name) => name.toLowerCase() === r.name.toLowerCase()),
    );

    const weeklyCounts = weeks.map((w) => {
      const active = rTasks.filter((t) => {
        const start = t.actual_start
          ? new Date(t.actual_start)
          : t.start_date
            ? new Date(t.start_date)
            : t.planned_start
              ? new Date(t.planned_start)
              : t.created_at
                ? new Date(t.created_at)
                : null;

        if (start && start > w.end) return false;

        if (t.status === 'COMPLETED') {
          const end = t.actual_end
            ? new Date(t.actual_end)
            : t.planned_end
              ? new Date(t.planned_end)
              : t.updated_at
                ? new Date(t.updated_at)
                : null;
          if (end && end < w.start) return false;
        }

        return true;
      });
      return active.length;
    });

    const seriesColor =
      RESOURCE_COLOR_MAP[r.name.trim().toLowerCase()] ||
      DEFAULT_COLORS[index % DEFAULT_COLORS.length] ||
      '#7654D6';

    // Micro-separation (+/- 0.05) so multiple lines with identical counts (e.g. 2 or 1)
    // curve cleanly alongside each other without completely hiding one another
    const visualSpread = (index - 2) * 0.045;
    const displayCounts = weeklyCounts.map((c) =>
      c > 0 ? Number((c + visualSpread).toFixed(3)) : 0,
    );

    return {
      name: r.name,
      type: 'line' as const,
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: seriesColor,
      },
      lineStyle: {
        width: 2.2,
        color: seriesColor,
      },
      endLabel: {
        show: true,
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
  // Guarantee Y-axis goes to at least 5 (matching SaaS reference mockup) to leave generous headroom
  // and prevent lines from ever touching the legend or top ceiling
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
              <strong style="color:${color}; font-weight:700;">${count} ${count === 1 ? 'task' : 'tasks'}</strong>
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
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
      textStyle: {
        color: theme.darkText,
        fontFamily: FONT_FAMILY,
        fontSize: 10.5,
        fontWeight: 500,
      },
      data: resources.map((r) => r.name),
    },
    grid: {
      top: 50,
      left: '4%',
      right: '8%',
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
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Active Tasks',
      nameLocation: 'middle',
      nameGap: 28,
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
        fontSize: 11,
      },
    },
    series: seriesData,
  };

  taskTrendChart.setOption(option, true);
}

// 3. Resource Availability Heatmap
function initHeatmapChart() {
  if (!heatmapChartRef.value) return;
  heatmapChart = getOrInitChart(heatmapChartRef.value);
  if (!heatmapChart) return;

  const theme = getThemeColors();
  const heatmap = computeAvailabilityHeatmap(
    resourceList.value,
    availabilityMap.value,
    workloadsMap.value,
  );

  const STATUS_LABELS = [
    { label: 'Available', color: '#16A6A1' },
    { label: 'Moderate', color: '#32A56B' },
    { label: 'High Load', color: '#F08A24' },
    { label: 'Fully Booked', color: '#E05260' },
  ];

  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const item = params as { value: [number, number, number] };
        const day = heatmap.days[item.value[0]] ?? '';
        const res = heatmap.resources[item.value[1]] ?? '';
        const detailKey = `${item.value[0]}_${item.value[1]}`;
        const detail = heatmap.details[detailKey];
        const statusIdx = item.value[2];
        const statusConfig = STATUS_LABELS[statusIdx] ?? STATUS_LABELS[0]!;

        return `
          <div style="font-weight:600; color:${theme.darkText};">${res} – ${day}</div>
          <div style="margin-top:4px; display:flex; align-items:center; gap:6px; color:${theme.darkText};">
            <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:${statusConfig.color};"></span>
            <span>Status: <strong>${detail?.label || statusConfig.label}</strong></span>
          </div>
          ${detail?.hours ? `<div style="font-size:11px; color:${theme.mutedText}; margin-top:2px;">Scheduled: ${detail.hours}h</div>` : ''}
        `;
      },
    },
    grid: {
      top: '4%',
      left: '3%',
      right: '3%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: heatmap.days,
      splitArea: { show: false },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: { interval: 0, color: theme.darkText, fontSize: 12, fontWeight: 500 },
    },
    yAxis: {
      type: 'category',
      data: heatmap.resources,
      splitArea: { show: false },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: { interval: 0, color: theme.darkText, fontSize: 12, fontWeight: 500 },
    },
    visualMap: {
      show: false,
      min: 0,
      max: 3,
      pieces: [
        { value: 0, color: '#16A6A1' },
        { value: 1, color: '#32A56B' },
        { value: 2, color: '#F08A24' },
        { value: 3, color: '#E05260' },
      ],
    },
    series: [
      {
        type: 'heatmap',
        data: heatmap.matrix.map(([d, r, v]) => [d, r, v]),
        label: {
          show: true,
          formatter: (params: unknown) => {
            const p = params as { value?: [number, number, number] };
            const v = p.value ? p.value[2] : 0;
            return v === 0 ? 'Free' : v === 1 ? 'Partial' : v === 2 ? 'High' : 'Booked';
          },
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 600,
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: theme.cardBg,
          borderWidth: 3,
        },
      },
    ],
  };

  heatmapChart.setOption(option, true);
}

// 4. Task Status Distribution
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

// 5. Project Schedule Health
function initProjectScheduleChart() {
  if (!projectScheduleChartRef.value) return;
  projectScheduleChart = getOrInitChart(projectScheduleChartRef.value);
  if (!projectScheduleChart) return;

  const theme = getThemeColors();
  const projects = computeProjectScheduleHealth(filteredProjects.value);
  const names = projects.map((p) => p.name);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...getCommonTooltip(theme),
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const p = projects[items[0]?.dataIndex ?? 0];
        if (!p) return '';
        return `
          <div style="font-weight:600; font-size:13px; color:${theme.darkText};">${p.name}</div>
          <div style="font-size:11px; color:${theme.mutedText}; margin-bottom:6px;">Target Deadline: ${p.deadline}</div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Actual Progress:</span>
            <strong>${p.actualProgress}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; color:${theme.darkText};">
            <span>Planned Pace:</span>
            <strong>${p.plannedPace}%</strong>
          </div>
          <div style="margin-top:4px; font-weight:600; color:${p.healthColor};">
            Health: ${p.health}
          </div>
        `;
      },
    },
    legend: {
      top: '0%',
      right: '2%',
      itemWidth: 10,
      itemHeight: 8,
      textStyle: { color: theme.mutedText, fontSize: 11 },
      data: ['Actual Progress', 'Planned Pace'],
    },
    grid: {
      top: '14%',
      left: '3%',
      right: '6%',
      bottom: '4%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', color: theme.mutedText, fontSize: 10 },
      splitLine: { lineStyle: { color: theme.gridLine, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: 11,
        formatter: (val: string) => (val.length > 24 ? val.substring(0, 23) + '…' : val),
      },
    },
    series: [
      {
        name: 'Actual Progress',
        type: 'bar',
        barWidth: 8,
        data: projects.map((d) => ({
          value: d.actualProgress,
          itemStyle: {
            color: d.healthColor,
            borderRadius: [0, 3, 3, 0],
          },
        })),
      },
      {
        name: 'Planned Pace',
        type: 'bar',
        barWidth: 8,
        data: projects.map((d) => d.plannedPace),
        itemStyle: {
          color: theme.plannedBar,
          borderRadius: [0, 3, 3, 0],
        },
      },
    ],
  };

  projectScheduleChart.setOption(option, true);
}

// 6. Planned vs Actual Effort
function initEffortVarianceChart() {
  if (!effortVarianceChartRef.value) return;
  effortVarianceChart = getOrInitChart(effortVarianceChartRef.value);
  if (!effortVarianceChart) return;

  const theme = getThemeColors();
  const taskEfforts = computeEffortVariance(filteredTasks.value);
  const titles = taskEfforts.map((t) => t.title);

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
      itemWidth: 10,
      itemHeight: 8,
      textStyle: { color: theme.mutedText, fontSize: 11 },
      data: ['Planned (hrs)', 'Actual (hrs)'],
    },
    grid: {
      top: '14%',
      left: '3%',
      right: '4%',
      bottom: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: titles,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: 10,
        rotate: 15,
        formatter: (val: string) => (val.length > 18 ? val.substring(0, 17) + '…' : val),
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}h', color: theme.mutedText, fontSize: 10 },
      splitLine: { lineStyle: { color: theme.gridLine, type: 'dashed' } },
    },
    series: [
      {
        name: 'Planned (hrs)',
        type: 'bar',
        barWidth: 10,
        data: taskEfforts.map((d) => d.plannedHours),
        itemStyle: { color: ANALYTICS_PALETTE.primary, borderRadius: [2, 2, 0, 0] },
      },
      {
        name: 'Actual (hrs)',
        type: 'bar',
        barWidth: 10,
        data: taskEfforts.map((d) => ({
          value: d.actualHours,
          itemStyle: {
            color: d.isOverrun ? ANALYTICS_PALETTE.danger : ANALYTICS_PALETTE.teal,
            borderRadius: [2, 2, 0, 0],
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
  const data = resourceStats.value.items;
  const names = data.map((d) => d.name);

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
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.mutedText, fontSize: 11 },
      data: ['Assigned Effort', 'Schedulable Headroom'],
    },
    grid: {
      top: '12%',
      left: '3%',
      right: '3%',
      bottom: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: 12,
        fontWeight: 600,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Hours / Week',
      nameTextStyle: { color: theme.mutedText, fontSize: 10 },
      axisLabel: { color: theme.mutedText, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.gridLine, type: 'dashed' } },
    },
    series: [
      {
        name: 'Assigned Effort',
        type: 'bar',
        stack: 'capacity',
        barWidth: 32,
        data: data.map((d) => d.assignedHours),
        itemStyle: { color: ANALYTICS_PALETTE.primary },
      },
      {
        name: 'Schedulable Headroom',
        type: 'bar',
        stack: 'capacity',
        barWidth: 32,
        data: data.map((d) => d.remainingHeadroom),
        itemStyle: {
          color: theme.headroomBar,
          borderRadius: [4, 4, 0, 0],
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
  utilizationChart?.resize();
  taskTrendChart?.resize();
  heatmapChart?.resize();
  taskStatusChart?.resize();
  projectScheduleChart?.resize();
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



watch(selectedProjectId, () => {
  void nextTick(() => {
    renderAllCharts();
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

  heatmapChart?.dispose();
  heatmapChart = null;

  taskStatusChart?.dispose();
  taskStatusChart = null;

  projectScheduleChart?.dispose();
  projectScheduleChart = null;

  effortVarianceChart?.dispose();
  effortVarianceChart = null;

  capacityChart?.dispose();
  capacityChart = null;
});
</script>

<style scoped lang="scss">
.analytics-page {
  background-color: #f7f7fa;
  min-height: 100%;
  transition: background-color 0.2s ease;
}

.analytics-page-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  font-family:
    'Manrope',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  color: #1d2433;
}

.page-title {
  letter-spacing: -0.01em;
}

.project-filter-select {
  min-width: 180px;
  max-width: 260px;
}

.date-range-badge {
  background: #ffffff;
  border: 1px solid #e6e8ed;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 11px;
  color: #555f71;
  font-weight: 500;
  transition: all 0.2s ease;

  &.date-range-badge-dark {
    background: #181d28;
    border-color: #283042;
    color: #f3f4f6;
  }
}

.refresh-btn {
  border-radius: 8px;

  &.refresh-btn-dark {
    border-color: rgba(158, 132, 236, 0.4);
    color: #c4b5fd !important;
  }
}



/* KPI Cards */
.kpi-card {
  border-radius: 12px;
  border: 1px solid var(--wo-border, #e6e8ed);
  background: var(--wo-bg-card, #ffffff);
  padding: 14px 16px;
  cursor: pointer;
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

.kpi-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #697386;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  color: #1d2433;
}

.kpi-delta {
  font-size: 11px;
}

.kpi-subtitle {
  font-size: 11px;
  color: #8c97a8;
  margin-top: 4px;
}

.kpi-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Soft Color Boxes */
.bg-purple-soft {
  background-color: #f0ecfa;
}

.bg-blue-soft {
  background-color: #edf3fb;
}

.bg-green-soft {
  background-color: #edf7f1;
}

.bg-red-soft {
  background-color: #fdf0f1;
}

/* Chart Cards */
.chart-card {
  border-radius: 12px;
  border: 1px solid var(--wo-border, #e6e8ed);
  background: var(--wo-bg-card, #ffffff);
  padding: 16px;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

.chart-card-header {
  margin-bottom: 8px;
}

.chart-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #1d2433;
}

.chart-caption {
  font-size: 11px;
  color: #7a869a;
  margin-top: 2px;
}

.badge-tag {
  font-size: 10.5px;
  font-weight: 600;
  color: #697386;
  background: #f2f4f7;
  padding: 3px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &.badge-tag-dark {
    background: #222938;
    color: #94a3b8;
  }
}

.echarts-box {
  width: 100%;
  height: 290px;
}

.task-trend-chart-box {
  height: 265px;
}

.trend-insight-banner {
  background: #f0f7ff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  min-height: 34px;
  transition: all 0.2s ease;

  &.trend-insight-banner-dark {
    background: rgba(37, 99, 235, 0.12);
    border-color: rgba(59, 130, 246, 0.25);
  }
}

.trend-insight-text {
  font-size: 11.5px;
  color: #1e40af;
  font-weight: 500;

  &.trend-insight-text-dark {
    color: #bfdbfe;
  }
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* Milestones Table */
.milestones-table-box {
  border: 1px solid #edf0f4;
  border-radius: 6px;
  overflow: hidden;
}

.milestones-table :deep(thead tr th) {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #697386;
  background-color: #fafbfc;
  padding: 10px 12px;
}

.milestones-table :deep(tbody tr td) {
  font-size: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f2f4f7;
}

/* Dark Mode Scoped Overrides */
body.body--dark {
  .analytics-page {
    background-color: var(--wo-bg-page, #0f1219);
  }

  .analytics-page-wrapper {
    color: var(--wo-text-main, #f3f4f6);
  }

  .date-range-badge {
    background: #181d28;
    border-color: #283042;
    color: #f3f4f6;
  }



  .kpi-card {
    border-color: var(--wo-border, #283042);
    background: var(--wo-bg-card, #181d28);

    &:hover {
      border-color: var(--wo-primary, #8b6fd8) !important;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 111, 216, 0.3);
      transform: translateY(-2px);
    }

    &.kpi-card-alert {
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.1);

      &:hover {
        border-color: #f87171 !important;
        box-shadow: 0 8px 22px rgba(239, 68, 68, 0.25);
        transform: translateY(-2px);
      }
    }
  }

  .kpi-title {
    color: #94a3b8;
  }

  .kpi-value {
    color: #f3f4f6;
  }

  .kpi-subtitle {
    color: #64748b;
  }

  .bg-purple-soft {
    background-color: rgba(118, 84, 214, 0.2);
  }

  .bg-blue-soft {
    background-color: rgba(63, 127, 213, 0.2);
  }

  .bg-green-soft {
    background-color: rgba(50, 165, 107, 0.2);
  }

  .bg-red-soft {
    background-color: rgba(224, 82, 96, 0.2);
  }

  .chart-card {
    border-color: var(--wo-border, #283042);
    background: var(--wo-bg-card, #181d28);

    &:hover {
      border-color: var(--wo-primary, #8b6fd8) !important;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 111, 216, 0.3);
      transform: translateY(-2px);
    }
  }

  .chart-title {
    color: #f3f4f6;
  }

  .chart-caption {
    color: #94a3b8;
  }

  .badge-tag {
    background: #222938;
    color: #94a3b8;
  }

  .milestones-table-box {
    border-color: #283042;
  }

  .milestones-table :deep(thead tr th) {
    color: #94a3b8;
    background-color: #1e2433;
  }

  .milestones-table :deep(tbody tr td) {
    color: #f3f4f6;
    border-bottom: 1px solid #283042;
  }
}

.gap-xs {
  gap: 6px;
}

.gap-sm {
  gap: 12px;
}

.gap-md {
  gap: 16px;
}
</style>
