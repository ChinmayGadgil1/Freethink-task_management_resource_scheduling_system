<template>
  <div class="analytics-prototype-container q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="row items-center gap-sm">
          <h1 class="text-h6 text-weight-bold text-dark q-ma-none">Project & Resource Analytics</h1>
          <q-badge outline color="primary" class="text-caption"> Prototype Preview </q-badge>
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Performance metrics, workload forecasting, and scheduling engine capacity.
        </div>
      </div>

      <div class="row items-center gap-sm">
        <q-btn-toggle
          v-model="activeTimeframe"
          no-caps
          rounded
          dense
          unelevated
          toggle-color="primary"
          toggle-text-color="white"
          color="grey-2"
          text-color="grey-8"
          :options="[
            { label: 'Current Week', value: 'week' },
            { label: 'Sprint (14d)', value: 'sprint' },
            { label: 'Quarter', value: 'quarter' },
          ]"
          @update:model-value="refreshAllCharts"
        />
        <q-btn
          outline
          dense
          color="primary"
          icon="refresh"
          no-caps
          class="q-px-sm"
          @click="handleRefresh"
          :loading="isRefreshing"
        />
      </div>
    </div>

    <!-- Compact KPI Overview -->
    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-box">
          <div class="text-caption text-grey-7">Team Utilization</div>
          <div class="row items-baseline gap-xs q-mt-xs">
            <span class="text-h5 text-weight-bold text-dark">{{ kpis.averageUtilization }}%</span>
            <span class="text-caption text-positive font-medium">Optimal</span>
          </div>
          <div class="kpi-subtext">Target benchmark: 60% – 85%</div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-box">
          <div class="text-caption text-grey-7">Schedulable Headroom</div>
          <div class="row items-baseline gap-xs q-mt-xs">
            <span class="text-h5 text-weight-bold text-dark"
              >{{ kpis.availableHeadroomHours }}h</span
            >
            <span class="text-caption text-teal-8 font-medium">Available</span>
          </div>
          <div class="kpi-subtext">Across 5 tracked resources</div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-box">
          <div class="text-caption text-grey-7">Task Completion</div>
          <div class="row items-baseline gap-xs q-mt-xs">
            <span class="text-h5 text-weight-bold text-dark"
              >{{ kpis.taskCompletionPercent }}%</span
            >
            <span class="text-caption text-grey-6">38 / 92 done</span>
          </div>
          <div class="kpi-subtext">54 in-progress or queued</div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-box" :class="{ 'kpi-alert': kpis.overallocatedCount > 0 }">
          <div class="text-caption text-grey-7">Allocation Attention</div>
          <div class="row items-baseline gap-xs q-mt-xs">
            <span class="text-h5 text-weight-bold text-negative"
              >{{ kpis.overallocatedCount }} Overloaded</span
            >
            <span class="text-caption text-negative font-medium">&gt; 90% load</span>
          </div>
          <div class="kpi-subtext">Sarah Jenkins (95% capacity)</div>
        </q-card>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- SECTION 1: RESOURCE PERFORMANCE                           -->
    <!-- ========================================================= -->
    <div class="section-title q-mb-sm">Resource Performance</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <!-- 1A: Resource Workload & Utilization -->
      <div class="col-12 col-lg-6">
        <q-card flat bordered class="chart-card">
          <div class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-bold text-dark">
                Resource Workload & Utilization
              </div>
              <div class="text-caption text-grey-6">
                Current allocation against 85% operational limit
              </div>
            </div>
            <span class="text-caption text-grey-6">Weekly</span>
          </div>
          <div ref="utilizationChartRef" class="echarts-surface"></div>
        </q-card>
      </div>

      <!-- 1B: Workload Trend (4 Weeks) -->
      <div class="col-12 col-lg-6">
        <q-card flat bordered class="chart-card">
          <div class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-bold text-dark">Resource Workload Trend</div>
              <div class="text-caption text-grey-6">
                4-week trajectory toward capacity threshold
              </div>
            </div>
            <span class="text-caption text-grey-6">4-Week Rolling</span>
          </div>
          <div ref="trendChartRef" class="echarts-surface"></div>
        </q-card>
      </div>

      <!-- 1C: Resource Availability Heatmap -->
      <div class="col-12">
        <q-card flat bordered class="chart-card">
          <div class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-bold text-dark">
                Resource Availability Heatmap
              </div>
              <div class="text-caption text-grey-6">
                Daily schedule status for automated task dispatch
              </div>
            </div>
            <div class="row items-center gap-md text-caption text-grey-7">
              <span class="row items-center gap-xs">
                <span class="legend-dot bg-teal"></span> Available
              </span>
              <span class="row items-center gap-xs">
                <span class="legend-dot bg-green"></span> Moderate
              </span>
              <span class="row items-center gap-xs">
                <span class="legend-dot bg-warning"></span> High Load
              </span>
              <span class="row items-center gap-xs">
                <span class="legend-dot bg-negative"></span> Fully Booked
              </span>
            </div>
          </div>
          <div ref="heatmapChartRef" class="echarts-surface-tall"></div>
        </q-card>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- SECTION 2: PROJECT PERFORMANCE                            -->
    <!-- ========================================================= -->
    <div class="section-title q-mb-sm">Project Performance</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <!-- 2A: Task Status Distribution -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="chart-card">
          <div class="card-header">
            <div class="text-subtitle2 text-weight-bold text-dark">Task Status Distribution</div>
            <div class="text-caption text-grey-6">Execution pipeline state across active tasks</div>
          </div>
          <div ref="taskStatusChartRef" class="echarts-surface"></div>
        </q-card>
      </div>

      <!-- 2B: Project Schedule Health -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="chart-card">
          <div class="card-header">
            <div class="text-subtitle2 text-weight-bold text-dark">Project Schedule Health</div>
            <div class="text-caption text-grey-6">Actual milestone completion vs. planned pace</div>
          </div>
          <div ref="projectScheduleChartRef" class="echarts-surface"></div>
        </q-card>
      </div>

      <!-- 2C: Planned vs. Actual Effort -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="chart-card">
          <div class="card-header">
            <div class="text-subtitle2 text-weight-bold text-dark">Planned vs. Actual Effort</div>
            <div class="text-caption text-grey-6">
              Hours variance on critical project deliverables
            </div>
          </div>
          <div ref="effortVarianceChartRef" class="echarts-surface"></div>
        </q-card>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- SECTION 3: SCHEDULING INTELLIGENCE                        -->
    <!-- ========================================================= -->
    <div class="section-title q-mb-sm">Scheduling Intelligence</div>

    <div class="row q-col-gutter-md">
      <!-- 3A: Capacity vs Assigned Effort -->
      <div class="col-12">
        <q-card flat bordered class="chart-card">
          <div class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-bold text-dark">
                Capacity vs. Assigned Effort
              </div>
              <div class="text-caption text-grey-6">
                Remaining headroom available for automatic scheduling engine dispatch
              </div>
            </div>
            <div class="text-caption text-teal text-weight-medium">
              57 Hours Available Schedulable Headroom
            </div>
          </div>
          <div ref="capacityChartRef" class="echarts-surface"></div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import {
  ANALYTICS_PALETTE,
  MOCK_SUMMARY_KPIS,
  MOCK_RESOURCE_UTILIZATION,
  MOCK_RESOURCE_TRENDS,
  MOCK_HEATMAP_DAYS,
  MOCK_HEATMAP_RESOURCES,
  MOCK_HEATMAP_DATA,
  MOCK_TASK_STATUS_DISTRIBUTION,
  MOCK_PROJECT_SCHEDULE,
  MOCK_TASK_EFFORT,
  MOCK_CAPACITY_SCHEDULING,
} from './mockData';

const activeTimeframe = ref<'week' | 'sprint' | 'quarter'>('week');
const isRefreshing = ref(false);
const kpis = ref(MOCK_SUMMARY_KPIS);

// Chart DOM containers
const utilizationChartRef = ref<HTMLDivElement | null>(null);
const trendChartRef = ref<HTMLDivElement | null>(null);
const heatmapChartRef = ref<HTMLDivElement | null>(null);
const taskStatusChartRef = ref<HTMLDivElement | null>(null);
const projectScheduleChartRef = ref<HTMLDivElement | null>(null);
const effortVarianceChartRef = ref<HTMLDivElement | null>(null);
const capacityChartRef = ref<HTMLDivElement | null>(null);

// Chart instances
let utilizationChart: ECharts | null = null;
let trendChart: ECharts | null = null;
let heatmapChart: ECharts | null = null;
let taskStatusChart: ECharts | null = null;
let projectScheduleChart: ECharts | null = null;
let effortVarianceChart: ECharts | null = null;
let capacityChart: ECharts | null = null;

let resizeObserver: ResizeObserver | null = null;

const FONT_STACK = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const TOOLTIP_BASE = {
  backgroundColor: '#FFFFFF',
  borderColor: ANALYTICS_PALETTE.border,
  borderWidth: 1,
  textStyle: {
    color: ANALYTICS_PALETTE.darkText,
    fontFamily: FONT_STACK,
    fontSize: 12,
  },
  extraCssText:
    'box-shadow: 0 4px 12px rgba(29, 36, 51, 0.08); border-radius: 6px; padding: 8px 12px;',
};

// -------------------------------------------------------------
// 1. RESOURCE UTILIZATION (Horizontal Bar)
// -------------------------------------------------------------
function initUtilizationChart() {
  if (!utilizationChartRef.value) return;
  if (!utilizationChart) utilizationChart = echarts.init(utilizationChartRef.value);

  const data = MOCK_RESOURCE_UTILIZATION;
  const names = data.map((d) => d.name);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params;
        const r = data[item.dataIndex as number];
        if (!r) return '';
        const color =
          r.status === 'over'
            ? ANALYTICS_PALETTE.danger
            : r.status === 'under'
              ? ANALYTICS_PALETTE.teal
              : ANALYTICS_PALETTE.green;
        return `
          <div style="font-weight: 600; font-size: 13px;">${r.name}</div>
          <div style="font-size: 11px; color: ${ANALYTICS_PALETTE.mutedText}; margin-bottom: 6px;">${r.role}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Utilization:</span>
            <strong style="color:${color};">${r.utilizationPercent}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Assigned Effort:</span>
            <strong>${r.assignedHours}h / ${r.weeklyCapacity}h</strong>
          </div>
        `;
      },
    },
    grid: {
      top: '8%',
      left: '3%',
      right: '6%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: ANALYTICS_PALETTE.mutedText,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { color: ANALYTICS_PALETTE.gridLine, type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: {
        color: ANALYTICS_PALETTE.darkText,
        fontSize: 12,
        fontWeight: 500,
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        data: data.map((d) => ({
          value: d.utilizationPercent,
          itemStyle: {
            color:
              d.status === 'over'
                ? ANALYTICS_PALETTE.danger
                : d.status === 'under'
                  ? ANALYTICS_PALETTE.teal
                  : ANALYTICS_PALETTE.green,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: ANALYTICS_PALETTE.mutedText,
          fontSize: 11,
          fontWeight: 600,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: ANALYTICS_PALETTE.danger, type: 'dashed', width: 1.5 },
          label: {
            formatter: '85% Limit',
            position: 'insideEndTop',
            fontSize: 10,
            color: ANALYTICS_PALETTE.danger,
          },
          data: [{ xAxis: 85 }],
        },
      },
    ],
  };

  utilizationChart.setOption(option);
}

// -------------------------------------------------------------
// 2. RESOURCE WORKLOAD TREND (4-Week Line Chart)
// -------------------------------------------------------------
function initTrendChart() {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);

  const data = MOCK_RESOURCE_TRENDS;
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const lineColors = [
    ANALYTICS_PALETTE.primary,
    ANALYTICS_PALETTE.teal,
    ANALYTICS_PALETTE.blue,
    ANALYTICS_PALETTE.green,
    ANALYTICS_PALETTE.danger, // Sarah Jenkins (critical surge)
  ];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const items = params as Array<{ seriesName: string; value: number; color: string }>;
        if (!Array.isArray(items) || items.length === 0) return '';
        const title = items[0]?.seriesName ? '4-Week Load Trajectory' : '';
        const rows = items
          .map(
            (it) => `
          <div style="display:flex; justify-content:space-between; gap:16px; margin-top:2px;">
            <span><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${it.color}; margin-right:6px;"></span>${it.seriesName}</span>
            <strong>${it.value}%</strong>
          </div>`,
          )
          .join('');
        return `<div style="font-weight:600; font-size:12px; margin-bottom:4px;">${title}</div>${rows}`;
      },
    },
    legend: {
      top: '0%',
      right: '2%',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: ANALYTICS_PALETTE.mutedText,
        fontSize: 11,
      },
      data: data.map((d) => d.name),
    },
    grid: {
      top: '16%',
      left: '3%',
      right: '4%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: weeks,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: { color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
      splitLine: {
        lineStyle: { color: ANALYTICS_PALETTE.gridLine, type: 'dashed' },
      },
    },
    series: [
      ...data.map((r, i) => {
        const color = lineColors[i] ?? ANALYTICS_PALETTE.primary;
        return {
          name: r.name,
          type: 'line' as const,
          smooth: true,
          data: [...r.weeks],
          lineStyle: { width: i === 4 ? 2.5 : 1.8, color },
          itemStyle: { color },
          symbolSize: 6,
        };
      }),
      {
        name: 'Limit',
        type: 'line' as const,
        data: [],
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: ANALYTICS_PALETTE.danger, type: 'dashed', width: 1.2 },
          label: {
            formatter: '85% Limit',
            position: 'insideEndTop',
            fontSize: 10,
            color: ANALYTICS_PALETTE.danger,
          },
          data: [{ yAxis: 85 }],
        },
      },
    ],
  };

  trendChart.setOption(option);
}

// -------------------------------------------------------------
// 3. RESOURCE AVAILABILITY HEATMAP (Working Days)
// -------------------------------------------------------------
function initHeatmapChart() {
  if (!heatmapChartRef.value) return;
  if (!heatmapChart) heatmapChart = echarts.init(heatmapChartRef.value);

  const days = MOCK_HEATMAP_DAYS;
  const resources = MOCK_HEATMAP_RESOURCES;
  const data = MOCK_HEATMAP_DATA;

  const STATUS_CONFIG = [
    { label: 'Available (> 6h free)', color: '#16A6A1' },
    { label: 'Moderate (3-5h free)', color: '#32A56B' },
    { label: 'High Utilization (< 2h free)', color: '#F08A24' },
    { label: 'Fully Booked (0h free)', color: '#E05260' },
  ];

  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const item = params as { value: [number, number, number] };
        const day = days[item.value[0]] ?? '';
        const res = resources[item.value[1]] ?? '';
        const statusIdx = item.value[2] ?? 0;
        const status = STATUS_CONFIG[statusIdx] ?? { label: 'Available', color: '#16A6A1' };
        return `
          <div style="font-weight:600;">${res} – ${day}</div>
          <div style="margin-top:4px; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:${status.color};"></span>
            <span>Status: <strong>${status.label}</strong></span>
          </div>
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
      data: days,
      splitArea: { show: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: { color: ANALYTICS_PALETTE.darkText, fontSize: 12, fontWeight: 500 },
    },
    yAxis: {
      type: 'category',
      data: resources,
      splitArea: { show: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: { color: ANALYTICS_PALETTE.darkText, fontSize: 12, fontWeight: 500 },
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
        data: data.map(([d, r, v]) => [d, r, v]),
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
          borderColor: '#FFFFFF',
          borderWidth: 3,
        },
      },
    ],
  };

  heatmapChart.setOption(option);
}

// -------------------------------------------------------------
// 4. TASK STATUS DISTRIBUTION (Doughnut)
// -------------------------------------------------------------
function initTaskStatusChart() {
  if (!taskStatusChartRef.value) return;
  if (!taskStatusChart) taskStatusChart = echarts.init(taskStatusChartRef.value);

  const data = MOCK_TASK_STATUS_DISTRIBUTION;
  const total = data.reduce((acc, cur) => acc + cur.count, 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const it = params as { name: string; value: number; percent: number; color: string };
        return `
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${it.color};"></span>
            <strong>${it.name}</strong>
          </div>
          <div>${it.value} tasks (${it.percent}%)</div>
        `;
      },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 3,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: { show: false },
        data: data.map((d) => ({
          name: d.label,
          value: d.count,
          itemStyle: { color: d.color },
        })),
      },
    ],
    title: {
      text: `${total}`,
      subtext: 'TASKS',
      left: '49%',
      top: '36%',
      textAlign: 'center',
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: ANALYTICS_PALETTE.darkText,
        fontFamily: FONT_STACK,
      },
      subtextStyle: {
        fontSize: 10,
        fontWeight: 600,
        color: ANALYTICS_PALETTE.mutedText,
        fontFamily: FONT_STACK,
      },
    },
  };

  taskStatusChart.setOption(option);
}

// -------------------------------------------------------------
// 5. PROJECT SCHEDULE HEALTH (Progress vs. Planned Pace)
// -------------------------------------------------------------
function initProjectScheduleChart() {
  if (!projectScheduleChartRef.value) return;
  if (!projectScheduleChart) projectScheduleChart = echarts.init(projectScheduleChartRef.value);

  const data = MOCK_PROJECT_SCHEDULE;
  const projectNames = data.map((d) => d.name);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const p = data[items[0]?.dataIndex ?? 0];
        if (!p) return '';
        return `
          <div style="font-weight:600; font-size:13px;">${p.name}</div>
          <div style="font-size:11px; color:${ANALYTICS_PALETTE.mutedText}; margin-bottom:6px;">Target: ${p.deadline}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Actual Progress:</span>
            <strong>${p.actualProgress}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
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
      textStyle: { color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
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
      axisLabel: { formatter: '{value}%', color: ANALYTICS_PALETTE.mutedText, fontSize: 10 },
      splitLine: { lineStyle: { color: ANALYTICS_PALETTE.gridLine, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: projectNames,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: {
        color: ANALYTICS_PALETTE.darkText,
        fontSize: 11,
        formatter: (val: string) => (val.length > 14 ? val.substring(0, 13) + '…' : val),
      },
    },
    series: [
      {
        name: 'Actual Progress',
        type: 'bar',
        barWidth: 8,
        data: data.map((d) => ({
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
        data: data.map((d) => d.plannedPace),
        itemStyle: {
          color: '#E2E5EB',
          borderRadius: [0, 3, 3, 0],
        },
      },
    ],
  };

  projectScheduleChart.setOption(option);
}

// -------------------------------------------------------------
// 6. PLANNED VS ACTUAL EFFORT (Task Variance)
// -------------------------------------------------------------
function initEffortVarianceChart() {
  if (!effortVarianceChartRef.value) return;
  if (!effortVarianceChart) effortVarianceChart = echarts.init(effortVarianceChartRef.value);

  const data = MOCK_TASK_EFFORT;
  const taskNames = data.map((d) => d.taskName);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const t = data[items[0]?.dataIndex ?? 0];
        if (!t) return '';
        const varianceText =
          t.variance > 0 ? `+${t.variance}h Overrun` : `${t.variance}h Within Estimate`;
        const varianceColor = t.isOverrun ? ANALYTICS_PALETTE.danger : ANALYTICS_PALETTE.green;
        return `
          <div style="font-weight:600; font-size:12px; margin-bottom:4px;">${t.taskName}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Planned:</span>
            <strong>${t.plannedHours}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Actual:</span>
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
      textStyle: { color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
      data: ['Planned (hrs)', 'Actual (hrs)'],
    },
    grid: {
      top: '14%',
      left: '3%',
      right: '4%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: taskNames,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: {
        color: ANALYTICS_PALETTE.darkText,
        fontSize: 10,
        formatter: (val: string) => (val.length > 10 ? val.substring(0, 9) + '…' : val),
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}h', color: ANALYTICS_PALETTE.mutedText, fontSize: 10 },
      splitLine: { lineStyle: { color: ANALYTICS_PALETTE.gridLine, type: 'dashed' } },
    },
    series: [
      {
        name: 'Planned (hrs)',
        type: 'bar',
        barWidth: 10,
        data: data.map((d) => d.plannedHours),
        itemStyle: { color: ANALYTICS_PALETTE.primary, borderRadius: [2, 2, 0, 0] },
      },
      {
        name: 'Actual (hrs)',
        type: 'bar',
        barWidth: 10,
        data: data.map((d) => ({
          value: d.actualHours,
          itemStyle: {
            color: d.isOverrun ? ANALYTICS_PALETTE.danger : ANALYTICS_PALETTE.teal,
            borderRadius: [2, 2, 0, 0],
          },
        })),
      },
    ],
  };

  effortVarianceChart.setOption(option);
}

// -------------------------------------------------------------
// 7. CAPACITY VS ASSIGNED EFFORT (Scheduling Intelligence)
// -------------------------------------------------------------
function initCapacityChart() {
  if (!capacityChartRef.value) return;
  if (!capacityChart) capacityChart = echarts.init(capacityChartRef.value);

  const data = MOCK_CAPACITY_SCHEDULING;
  const names = data.map((d) => d.name);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_BASE,
      formatter: (params: unknown) => {
        const items = params as Array<{ dataIndex: number }>;
        const r = data[items[0]?.dataIndex ?? 0];
        if (!r) return '';
        const dispatchBadge = r.isAvailableForDispatch
          ? `<span style="color:${ANALYTICS_PALETTE.teal}; font-weight:600;">Eligible for Auto-Schedule</span>`
          : `<span style="color:${ANALYTICS_PALETTE.danger}; font-weight:600;">Capacity Constrained (&lt;5h)</span>`;
        return `
          <div style="font-weight:600; font-size:13px;">${r.name}</div>
          <div style="font-size:11px; color:${ANALYTICS_PALETTE.mutedText}; margin-bottom:6px;">${r.role}</div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Weekly Capacity:</span>
            <strong>${r.totalCapacity}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Assigned Workload:</span>
            <strong style="color:${ANALYTICS_PALETTE.primary};">${r.assignedEffort}h</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px;">
            <span>Schedulable Headroom:</span>
            <strong style="color:${ANALYTICS_PALETTE.teal};">${r.remainingHeadroom}h</strong>
          </div>
          <div style="margin-top:6px; padding-top:4px; border-top:1px dashed #eee;">
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
      textStyle: { color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
      data: ['Assigned Effort', 'Schedulable Headroom'],
    },
    grid: {
      top: '12%',
      left: '3%',
      right: '4%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: ANALYTICS_PALETTE.border } },
      axisLabel: { color: ANALYTICS_PALETTE.darkText, fontSize: 12, fontWeight: 500 },
    },
    yAxis: {
      type: 'value',
      name: 'Hours / Week',
      nameTextStyle: { color: ANALYTICS_PALETTE.mutedText, fontSize: 10 },
      axisLabel: { color: ANALYTICS_PALETTE.mutedText, fontSize: 11 },
      splitLine: { lineStyle: { color: ANALYTICS_PALETTE.gridLine, type: 'dashed' } },
    },
    series: [
      {
        name: 'Assigned Effort',
        type: 'bar',
        stack: 'capacity',
        barWidth: 28,
        data: data.map((d) => d.assignedEffort),
        itemStyle: { color: ANALYTICS_PALETTE.primary },
      },
      {
        name: 'Schedulable Headroom',
        type: 'bar',
        stack: 'capacity',
        barWidth: 28,
        data: data.map((d) => d.remainingHeadroom),
        itemStyle: {
          color: '#BEE7E4', // Soft light teal representing headroom
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  capacityChart.setOption(option);
}

// -------------------------------------------------------------
// Lifecycle & Responsiveness
// -------------------------------------------------------------
function refreshAllCharts() {
  void nextTick(() => {
    initUtilizationChart();
    initTrendChart();
    initHeatmapChart();
    initTaskStatusChart();
    initProjectScheduleChart();
    initEffortVarianceChart();
    initCapacityChart();
  });
}

function resizeAll() {
  utilizationChart?.resize();
  trendChart?.resize();
  heatmapChart?.resize();
  taskStatusChart?.resize();
  projectScheduleChart?.resize();
  effortVarianceChart?.resize();
  capacityChart?.resize();
}

function handleRefresh() {
  isRefreshing.value = true;
  setTimeout(() => {
    isRefreshing.value = false;
    refreshAllCharts();
  }, 350);
}

onMounted(() => {
  refreshAllCharts();

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      resizeAll();
    });
    const container = document.querySelector('.analytics-prototype-container');
    if (container) {
      resizeObserver.observe(container);
    }
  }

  window.addEventListener('resize', resizeAll);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll);

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  utilizationChart?.dispose();
  utilizationChart = null;

  trendChart?.dispose();
  trendChart = null;

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
.analytics-prototype-container {
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

.kpi-box {
  border-radius: 8px;
  border-color: #e6e8ed;
  background: #ffffff;
  padding: 12px 14px;
  transition: border-color 0.2s ease;

  &.kpi-alert {
    border-color: #e05260;
    background: #fffafa;
  }
}

.kpi-subtext {
  font-size: 11px;
  color: #697386;
  margin-top: 4px;
}

.font-medium {
  font-weight: 600;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #697386;
  margin-top: 10px;
}

.chart-card {
  border-radius: 8px;
  border-color: #e6e8ed;
  background: #ffffff;
  padding: 16px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(29, 36, 51, 0.04);
  }
}

.card-header {
  margin-bottom: 12px;
}

.echarts-surface {
  width: 100%;
  height: 280px;
}

.echarts-surface-tall {
  width: 100%;
  height: 250px;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
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
