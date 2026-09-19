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
                    <span class="text-caption text-teal text-weight-medium">Active</span>
                  </div>
                  <span class="text-caption text-grey-6 q-mt-xs">
                    {{ taskStats.completedTasks }} / {{ taskStats.totalTasks }} tasks done
                  </span>
                </div>
                <q-avatar
                  rounded
                  size="40px"
                  font-size="20px"
                  :color="$q.dark.isActive ? 'teal-10' : 'teal-1'"
                  :text-color="$q.dark.isActive ? 'teal-3' : 'teal'"
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
        <!-- ROW 1: Resource Workload & Utilization (Full Width)      -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- Resource Workload & Utilization (Monday → Sunday Shift) -->
          <div class="col-12">
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
                        >Weekly shift workload (Monday → Sunday) against 85% operational
                        limit</q-tooltip
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
                  >
                    <template #prepend>
                      <q-icon name="person" size="14px" color="primary" />
                    </template>
                  </q-select>
                  <q-btn flat round dense icon="chevron_left" size="sm" @click="workloadWeekOffset--" />
                  <q-badge
                    outline
                    :color="$q.dark.isActive ? 'grey-5' : 'grey-7'"
                    class="q-px-sm q-py-xs text-weight-medium"
                  >
                    {{ workloadWeekOffset === 0 ? 'This Week' : workloadWeekOffset === -1 ? 'Last Week' : workloadWeekOffset === 1 ? 'Next Week' : (workloadWeekOffset > 0 ? `+${workloadWeekOffset} Weeks` : `${workloadWeekOffset} Weeks`) }}
                    <span v-if="weeklyShiftWorkload && weeklyShiftWorkload.length > 0" class="q-ml-xs text-grey-6" style="font-size: 0.9em;">
                      ({{ formatDateShort(weeklyShiftWorkload[0]?.dateStr) }} - {{ formatDateShort(weeklyShiftWorkload[6]?.dateStr) }})
                    </span>
                  </q-badge>
                  <q-btn flat round dense icon="chevron_right" size="sm" @click="workloadWeekOffset++" />
                </div>
              </div>
              <div ref="utilizationChartRef" class="echarts-box"></div>
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
                      <q-tooltip
                        >Hours variance on key deliverables with scrollable viewport</q-tooltip
                      >
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

        <!-- ======================================================= -->
        <!-- ======================================================= -->
        <!-- ROW 4: Resource Performance Overview Analytics          -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12">
            <q-card flat bordered :dark="$q.dark.isActive" class="chart-card q-pa-md">
              <!-- Section Header & Controls -->
              <div
                class="row items-center justify-between q-mb-sm chart-header-row wrap q-col-gutter-sm"
              >
                <div>
                  <div
                    class="text-subtitle1 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Resource Performance</span>
                    <q-icon name="info_outline" size="16px" class="text-grey-5">
                      <q-tooltip>
                        Compare resource performance across key delivery and workload metrics
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Resource-wise task delivery and workload analytics
                  </div>
                </div>

                <!-- Section Filters: Resource Selector, Metric Selector & Resource Count -->
                <div class="row items-center q-gutter-xs chart-header-actions">
                  <!-- Section-Specific Resource Filter -->
                  <q-select
                    v-model="selectedPerformanceResourceId"
                    :options="performanceResourceOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    rounded
                    options-dense
                    :dark="$q.dark.isActive"
                    :bg-color="$q.dark.isActive ? 'dark' : 'white'"
                    class="performance-resource-select"
                  >
                    <template #prepend>
                      <q-icon name="person" size="14px" color="primary" />
                    </template>
                  </q-select>

                  <!-- View By Metric Selector -->
                  <div class="row items-center q-gutter-x-xs">
                    <span class="text-caption text-grey-6 gt-xs">View by:</span>
                    <q-select
                      v-model="selectedPerformanceMetric"
                      :options="performanceMetricOptions"
                      emit-value
                      map-options
                      dense
                      outlined
                      rounded
                      options-dense
                      :dark="$q.dark.isActive"
                      :bg-color="$q.dark.isActive ? 'dark' : 'white'"
                      class="performance-metric-select"
                    />
                  </div>

                  <q-badge
                    outline
                    :color="$q.dark.isActive ? 'grey-5' : 'grey-7'"
                    class="q-px-sm q-py-xs text-weight-medium"
                  >
                    {{ performanceRows.length }}
                    {{ performanceRows.length === 1 ? 'Resource' : 'Resources' }}
                  </q-badge>
                </div>
              </div>

              <!-- Single Interactive ECharts Visualization -->
              <div
                ref="resourceOverviewChartRef"
                class="echarts-box resource-overview-chart-box"
              ></div>

              <!-- Contextual Dynamic Insight -->
              <q-banner
                dense
                rounded
                :class="
                  $q.dark.isActive ? 'bg-deep-purple-10 text-purple-2' : 'bg-purple-1 text-purple-9'
                "
                class="q-mt-sm"
              >
                <template #avatar>
                  <q-icon
                    name="info"
                    size="18px"
                    :color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  />
                </template>
                <span class="text-caption text-weight-medium">
                  {{ dynamicPerformanceInsight }}
                </span>
              </q-banner>
            </q-card>
          </div>
        </div>

        <!-- ======================================================= -->
        <!-- ROW 4D: Detailed Resource Metrics Table (Supporting)    -->
        <!-- ======================================================= -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12">
            <q-card
              flat
              bordered
              :dark="$q.dark.isActive"
              class="chart-card q-pa-md"
              style="min-height: auto"
            >
              <div class="row items-center justify-between q-mb-md chart-header-row">
                <div>
                  <div
                    class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    <span>Detailed Resource Metrics</span>
                    <q-icon name="info_outline" size="14px" class="text-grey-5">
                      <q-tooltip>
                        Detailed drill-down across assigned tasks, completion rate, utilization, and
                        logged effort
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <div class="text-caption text-grey-6">
                    Supporting drill-down view of task completion, utilization, and logged effort
                  </div>
                </div>
              </div>

              <!-- Performance Table -->
              <q-table
                flat
                bordered
                :dark="$q.dark.isActive"
                :rows="performanceRows"
                :columns="performanceColumns"
                row-key="resourceId"
                v-model:pagination="performancePagination"
                :rows-per-page-options="[10, 20, 50]"
                class="performance-table"
              >
                <!-- Resource Name Cell -->
                <template #body-cell-name="props">
                  <q-td :props="props">
                    <div class="row items-center no-wrap q-gutter-x-sm">
                      <q-avatar
                        size="28px"
                        color="primary"
                        text-color="white"
                        class="text-caption text-weight-bold"
                      >
                        {{ getInitials(props.row.name) }}
                      </q-avatar>
                      <div class="column ellipsis" style="max-width: 180px">
                        <span
                          class="text-weight-bold ellipsis"
                          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                          :title="props.row.name"
                        >
                          {{ props.row.name }}
                        </span>
                        <span class="text-caption text-grey-6">
                          {{ props.row.role }}
                        </span>
                      </div>
                    </div>
                  </q-td>
                </template>

                <!-- Completion Rate Cell -->
                <template #body-cell-completionRate="props">
                  <q-td :props="props">
                    <div v-if="props.row.completionRate === null">
                      <q-chip
                        dense
                        square
                        :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
                        :text-color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
                        class="text-caption text-weight-medium"
                      >
                        N/A
                      </q-chip>
                    </div>
                    <div
                      v-else
                      class="row items-center justify-center no-wrap q-gutter-x-xs"
                      style="min-width: 110px"
                    >
                      <q-linear-progress
                        :value="props.row.completionRate / 100"
                        :color="props.row.completionRate === 100 ? 'positive' : 'primary'"
                        rounded
                        size="6px"
                        class="col"
                        style="min-width: 50px"
                        :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                      />
                      <span
                        class="text-caption text-weight-bold"
                        :class="props.row.completionRate === 100 ? 'text-positive' : ''"
                      >
                        {{ props.row.completionRate }}%
                      </span>
                    </div>
                  </q-td>
                </template>

                <!-- Utilization Cell -->
                <template #body-cell-utilization="props">
                  <q-td :props="props">
                    <q-chip
                      dense
                      square
                      :color="
                        props.row.utilization > 85
                          ? $q.dark.isActive
                            ? 'red-10'
                            : 'red-1'
                          : props.row.utilization > 70
                            ? $q.dark.isActive
                              ? 'blue-10'
                              : 'blue-1'
                            : $q.dark.isActive
                              ? 'green-10'
                              : 'green-1'
                      "
                      :text-color="
                        props.row.utilization > 85
                          ? $q.dark.isActive
                            ? 'red-2'
                            : 'negative'
                          : props.row.utilization > 70
                            ? $q.dark.isActive
                              ? 'blue-2'
                              : 'primary'
                            : $q.dark.isActive
                              ? 'green-2'
                              : 'positive'
                      "
                      class="text-caption text-weight-bold"
                    >
                      <q-icon
                        v-if="props.row.utilization > 85"
                        name="warning"
                        size="12px"
                        class="q-mr-xs"
                      />
                      {{ props.row.utilization }}%
                    </q-chip>
                  </q-td>
                </template>

                <!-- Effort Cells -->
                <template #body-cell-plannedEffort="props">
                  <q-td :props="props">
                    <span class="text-weight-medium">{{
                      formatHours(props.row.plannedEffort)
                    }}</span>
                  </q-td>
                </template>

                <template #body-cell-actualEffort="props">
                  <q-td :props="props">
                    <span class="text-weight-medium">{{
                      formatHours(props.row.actualEffort)
                    }}</span>
                  </q-td>
                </template>

                <template #body-cell-remainingEffort="props">
                  <q-td :props="props">
                    <span
                      class="text-weight-medium"
                      :class="props.row.remainingEffort > 0 ? 'text-teal' : 'text-grey-6'"
                    >
                      {{ formatHours(props.row.remainingEffort) }}
                    </span>
                  </q-td>
                </template>

                <!-- Empty State -->
                <template #no-data>
                  <div class="full-width column items-center q-pa-lg text-grey-6">
                    <q-icon name="person_off" size="32px" />
                    <span class="q-mt-xs text-caption">No resource metrics found</span>
                  </div>
                </template>
              </q-table>
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
import type { Project, ResourceUser, Task, ResourceWorkload } from '@/services/api';
import {
  ANALYTICS_PALETTE,
  computeResourceMetrics,
  computeTaskDistribution,
  computeEffortVariance,
  computeWeeklyShiftWorkload,
  computeResourcePerformanceData,
} from '@/components/analytics/analyticsCalculations';
import { formatHours, getInitials, formatDateShort } from '@/utils/formatters';

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
const selectedPerformanceResourceId = ref<number | 'ALL'>('ALL');
const workloadWeekOffset = ref(0);

type PerformanceMetric = 'COMPLETION_RATE' | 'TASKS_COMPLETED' | 'UTILIZATION' | 'ASSIGNED_EFFORT';
const selectedPerformanceMetric = ref<PerformanceMetric>('COMPLETION_RATE');
const performanceMetricOptions = [
  { label: 'Completion Rate', value: 'COMPLETION_RATE' },
  { label: 'Tasks Completed', value: 'TASKS_COMPLETED' },
  { label: 'Utilization', value: 'UTILIZATION' },
  { label: 'Assigned Effort', value: 'ASSIGNED_EFFORT' },
];

// Performance table pagination state
const performancePagination = ref({
  sortBy: 'completionRate',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

// Raw live datasets fetched from backend
const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);
const workloadsMap = ref<Record<number, ResourceWorkload | null>>({});

// DOM chart container references
const utilizationChartRef = ref<HTMLDivElement | null>(null);
const taskStatusChartRef = ref<HTMLDivElement | null>(null);
const effortVarianceChartRef = ref<HTMLDivElement | null>(null);
const capacityChartRef = ref<HTMLDivElement | null>(null);
const resourceOverviewChartRef = ref<HTMLDivElement | null>(null);

// ECharts instances
let utilizationChart: ECharts | null = null;
let taskStatusChart: ECharts | null = null;
let effortVarianceChart: ECharts | null = null;
let capacityChart: ECharts | null = null;
let resourceOverviewChart: ECharts | null = null;

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
  computeResourceMetrics(resourceList.value, workloadsMap.value, taskList.value, 'ALL'),
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
    workloadWeekOffset.value
  ),
);

watch(workloadWeekOffset, () => {
  initUtilizationChart();
});

// -------------------------------------------------------------
// Resource-wise Analytics & Performance Computeds
// -------------------------------------------------------------
const performanceResourceOptions = computed(() => [
  { label: 'All Resources', value: 'ALL' as const },
  ...resourceList.value.map((r) => ({ label: r.name, value: r.user_id })),
]);

const performanceData = computed(() =>
  computeResourcePerformanceData(resourceList.value, taskList.value, workloadsMap.value),
);

const performanceRows = computed(() => {
  const all = performanceData.value.rows;
  if (selectedPerformanceResourceId.value === 'ALL') {
    return all;
  }
  return all.filter((r) => r.resourceId === selectedPerformanceResourceId.value);
});

const selectedPerformanceRow = computed(() => {
  if (selectedPerformanceResourceId.value === 'ALL') return null;
  return (
    performanceData.value.rows.find((r) => r.resourceId === selectedPerformanceResourceId.value) ||
    null
  );
});

const dynamicPerformanceInsight = computed(() => {
  const isSingleResource = selectedPerformanceResourceId.value !== 'ALL';
  const singleRow = selectedPerformanceRow.value;
  const summary = performanceData.value.summary;
  const metric = selectedPerformanceMetric.value;

  if (isSingleResource && singleRow) {
    if (metric === 'COMPLETION_RATE') {
      const rateStr =
        singleRow.completionRate !== null
          ? `${singleRow.completionRate}% · ${singleRow.completedTasks} of ${singleRow.assignedTasks} tasks`
          : 'N/A · 0 assigned tasks';
      return `${singleRow.name} · Completion rate: ${rateStr}`;
    }
    if (metric === 'TASKS_COMPLETED') {
      return `${singleRow.name} · Completed tasks: ${singleRow.completedTasks} (${singleRow.assignedTasks} assigned)`;
    }
    if (metric === 'UTILIZATION') {
      return `${singleRow.name} · Utilization: ${singleRow.utilization}% · ${singleRow.assignedHours}h assigned`;
    }
    if (metric === 'ASSIGNED_EFFORT') {
      return `${singleRow.name} · Assigned effort: ${singleRow.plannedEffort}h (${singleRow.actualEffort}h logged, ${singleRow.remainingEffort}h remaining)`;
    }
  }

  // Objective team insight by selected metric
  if (metric === 'COMPLETION_RATE') {
    if (summary.highestCompletionRate) {
      return `Highest completion rate: ${summary.highestCompletionRate.name} · ${summary.highestCompletionRate.rate}% · ${summary.highestCompletionRate.completed} of ${summary.highestCompletionRate.assigned} tasks`;
    }
    return 'No task completion recorded yet across the team.';
  }

  if (metric === 'TASKS_COMPLETED') {
    if (summary.mostTasksCompleted) {
      return `Most tasks completed: ${summary.mostTasksCompleted.name} · ${summary.mostTasksCompleted.completed} tasks`;
    }
    return 'No completed tasks recorded yet across the team.';
  }

  if (metric === 'UTILIZATION') {
    if (summary.highestUtilization) {
      return `Highest utilization: ${summary.highestUtilization.name} · ${summary.highestUtilization.utilization}%`;
    }
    return 'No resource utilization recorded yet across the team.';
  }

  if (metric === 'ASSIGNED_EFFORT') {
    if (summary.highestAssignedEffort) {
      return `Highest assigned effort: ${summary.highestAssignedEffort.name} · ${summary.highestAssignedEffort.hours}h`;
    }
    return 'No assigned effort recorded yet across the team.';
  }

  return 'No resource performance metrics recorded yet.';
});

const performanceColumns = [
  {
    name: 'name',
    label: 'Resource',
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'assignedTasks',
    label: 'Assigned Tasks',
    field: 'assignedTasks',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'completedTasks',
    label: 'Completed',
    field: 'completedTasks',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'completionRate',
    label: 'Completion Rate',
    field: 'completionRate',
    align: 'center' as const,
    sortable: true,
    sort: (a: number | null, b: number | null) => {
      if (a === null && b === null) return 0;
      if (a === null) return -1;
      if (b === null) return 1;
      return a - b;
    },
  },
  {
    name: 'utilization',
    label: 'Utilization',
    field: 'utilization',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'plannedEffort',
    label: 'Planned Effort',
    field: 'plannedEffort',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'actualEffort',
    label: 'Actual Effort',
    field: 'actualEffort',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'remainingEffort',
    label: 'Remaining Effort',
    field: 'remainingEffort',
    align: 'right' as const,
    sortable: true,
  },
];

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
    initTaskStatusChart();
    initEffortVarianceChart();
    initCapacityChart();
    initResourceOverviewChart();
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
  const el = utilizationChartRef.value;
  const containerWidth = el.clientWidth || window.innerWidth;
  const isVeryNarrow = containerWidth < 400;
  const dayNames = shiftData.map((d) => (isVeryNarrow ? d.shortLabel : d.dayLabel));

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#7654D6',
          type: 'dashed',
          width: 1.5,
        },
      },
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
      left: isVeryNarrow ? '2%' : '4%',
      right: isVeryNarrow ? '4%' : '6%',
      bottom: isVeryNarrow ? '10%' : '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dayNames,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: {
        interval: 0,
        color: theme.darkText,
        fontSize: isVeryNarrow ? 9.5 : 11,
        fontFamily: FONT_FAMILY,
        fontWeight: 600,
      },
    },
    yAxis: {
      type: 'value',
      name: isVeryNarrow ? '' : 'Utilization (%)',
      nameTextStyle: { color: theme.mutedText, fontSize: 11 },
      min: 0,
      max: (value) => Math.max(100, Math.ceil(value.max * 1.15)),
      axisLabel: {
        formatter: '{value}%',
        color: theme.mutedText,
        fontSize: isVeryNarrow ? 10 : 11,
        fontFamily: FONT_FAMILY,
      },
      splitLine: {
        lineStyle: { color: theme.gridLine, type: 'dashed' },
      },
    },
    series: [
      {
        name: 'Workload Utilization',
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: isVeryNarrow ? 6 : 8,
        showSymbol: true,
        lineStyle: {
          color: '#7654D6',
          width: 2.8,
        },
        itemStyle: {
          color: '#7654D6',
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(118, 84, 214, 0.42)' },
            { offset: 0.75, color: 'rgba(118, 84, 214, 0.08)' },
            { offset: 1, color: 'rgba(118, 84, 214, 0.0)' },
          ]),
        },
        data: shiftData.map((d) => d.utilization),
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: theme.mutedText,
          fontSize: isVeryNarrow ? 9 : 10.5,
          fontFamily: FONT_FAMILY,
          fontWeight: 600,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#DC2626', type: 'dashed', width: 1.8 },
          label: {
            formatter: '85% Limit',
            position: 'insideEndTop',
            fontSize: 10,
            fontWeight: 700,
            color: '#DC2626',
            fontFamily: FONT_FAMILY,
          },
          data: [{ yAxis: 85 }],
          z: 10,
        },
      },
    ],
  };

  utilizationChart.setOption(option, true);
}

// 3. Task Status Distribution (Card-Scoped Project Filter)
function initTaskStatusChart() {
  if (!taskStatusChartRef.value) return;
  taskStatusChart = getOrInitChart(taskStatusChartRef.value);
  if (!taskStatusChart) return;

  const theme = getThemeColors();
  const stats = taskStats.value;
  const isZeroTasks = stats.totalTasks === 0;

  const option: EChartsOption = {
    tooltip: isZeroTasks
      ? {
          trigger: 'item',
          ...getCommonTooltip(theme),
          formatter: () =>
            `<div style="color:${theme.mutedText}; font-size: 12px; padding: 2px 4px;">No tasks in this project</div>`,
        }
      : {
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
      data: stats.items.map((d) => ({
        name: d.label,
        itemStyle: { color: d.label === 'Completed' ? theme.headroomBar : d.color },
      })),
      selectedMode: !isZeroTasks,
      bottom: '0%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.mutedText, fontSize: 11 },
      formatter: (name: string) => {
        const item = stats.items.find((d) => d.label === name);
        return `${name}  ${item ? item.count : 0}`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: isZeroTasks ? 0 : 3,
          borderColor: theme.cardBg,
          borderWidth: isZeroTasks ? 0 : 2,
        },
        emphasis: {
          scale: !isZeroTasks,
        },
        label: { show: false },
        data: isZeroTasks
          ? [
              {
                name: 'No Tasks',
                value: 1,
                itemStyle: {
                  color: theme.isDark ? '#334155' : '#E2E8F0',
                  borderColor: theme.cardBg,
                  borderWidth: 0,
                },
              },
            ]
          : stats.items.map((d) => ({
              name: d.label,
              value: d.count,
              itemStyle: { color: d.label === 'Completed' ? theme.headroomBar : d.color },
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
        const varianceColor = t.isOverrun ? ANALYTICS_PALETTE.danger : theme.headroomBar;
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
      data: [
        { name: 'Planned (hrs)', itemStyle: { color: ANALYTICS_PALETTE.primary } },
        { name: 'Actual (hrs)', itemStyle: { color: theme.headroomBar } },
      ],
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
      axisLabel: {
        formatter: '{value}h',
        color: theme.mutedText,
        fontSize: isVeryNarrow ? 10 : 11,
      },
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
        formatter: (val: string) =>
          val.length > maxLabelLen ? val.substring(0, maxLabelLen - 1) + '…' : val,
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
        itemStyle: {
          color: theme.headroomBar,
          borderRadius: [0, 3, 3, 0],
        },
        data: taskEfforts.map((d) => ({
          value: d.actualHours,
          itemStyle: {
            color: d.isOverrun ? ANALYTICS_PALETTE.danger : theme.headroomBar,
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
      axisLabel: {
        formatter: '{value}h',
        color: theme.mutedText,
        fontSize: isVeryNarrow ? 10 : 11,
      },
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
        formatter: (val: string) =>
          val.length > maxNameLen ? val.substring(0, maxNameLen - 1) + '…' : val,
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
// 5. Resource Performance Vertical Bar Chart (Multi-Metric View)
// X: Resources | Y: Metric Value | Horizontal dataZoom for 35+ resources
// -------------------------------------------------------------
function initResourceOverviewChart() {
  if (!resourceOverviewChartRef.value) return;
  resourceOverviewChart = getOrInitChart(resourceOverviewChartRef.value);
  if (!resourceOverviewChart) return;

  const theme = getThemeColors();
  const el = resourceOverviewChartRef.value;
  const containerWidth = el.clientWidth || window.innerWidth;
  const isVeryNarrow = containerWidth < 400;

  const metric = selectedPerformanceMetric.value;
  const allRows = performanceRows.value;

  // Filter if single resource is selected
  const rows: (typeof allRows)[number][] =
    selectedPerformanceResourceId.value !== 'ALL'
      ? allRows.filter((r) => r.resourceId === selectedPerformanceResourceId.value)
      : [...allRows];

  if (rows.length === 0) {
    resourceOverviewChart.setOption(
      {
        title: {
          text: 'No resources found',
          subtext: 'No performance metrics available for the current filter',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: theme.mutedText,
            fontFamily: FONT_FAMILY,
            fontSize: 13,
            fontWeight: 500,
          },
          subtextStyle: {
            color: theme.mutedText,
            fontFamily: FONT_FAMILY,
            fontSize: 11,
          },
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      },
      true,
    );
    return;
  }

  // Sort rows descending depending on selected metric
  if (metric === 'COMPLETION_RATE') {
    rows.sort((a, b) => {
      // Valid completion rates first, sorted descending
      if (a.completionRate !== null && b.completionRate !== null) {
        if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
        if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
        return a.name.localeCompare(b.name);
      }
      if (a.completionRate !== null) return -1;
      if (b.completionRate !== null) return 1;
      return a.name.localeCompare(b.name);
    });
  } else if (metric === 'TASKS_COMPLETED') {
    rows.sort((a, b) => {
      if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
      if (b.assignedTasks !== a.assignedTasks) return b.assignedTasks - a.assignedTasks;
      return a.name.localeCompare(b.name);
    });
  } else if (metric === 'UTILIZATION') {
    rows.sort((a, b) => {
      if (b.utilization !== a.utilization) return b.utilization - a.utilization;
      return a.name.localeCompare(b.name);
    });
  } else if (metric === 'ASSIGNED_EFFORT') {
    rows.sort((a, b) => {
      if (b.plannedEffort !== a.plannedEffort) return b.plannedEffort - a.plannedEffort;
      return a.name.localeCompare(b.name);
    });
  }

  // Build X-axis categories (Resource names)
  const resourceNames = rows.map((r) => r.name);

  // Build series data and formatters based on metric
  interface BarDataItem {
    value: number;
    fullName: string;
    role: string;
    completedTasks: number;
    assignedTasks: number;
    completionRate: number | null;
    isNA: boolean;
    utilization: number;
    assignedHours: number;
    weeklyCapacity: number;
    plannedEffort: number;
    actualEffort: number;
    remainingEffort: number;
    itemStyle?: {
      color?: string | echarts.graphic.LinearGradient;
      borderRadius?: number[];
      borderColor?: string;
      borderWidth?: number;
      borderType?: 'solid' | 'dashed' | 'dotted';
    };
  }

  const barData: BarDataItem[] = rows.map((r) => {
    let val = 0;
    let isNA = false;
    let itemStyle: {
      color?: string | echarts.graphic.LinearGradient;
      borderRadius?: number[];
      borderColor?: string;
      borderWidth?: number;
      borderType?: 'solid' | 'dashed' | 'dotted';
    } = {
      borderRadius: [4, 4, 0, 0],
    };

    if (metric === 'COMPLETION_RATE') {
      if (r.completionRate === null) {
        val = 0;
        isNA = true;
        itemStyle = {
          color: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: theme.border,
          borderWidth: 1,
          borderType: 'dashed',
          borderRadius: [4, 4, 0, 0],
        };
      } else {
        val = r.completionRate;
        itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#7654D6' },
          { offset: 1, color: '#906FE2' },
        ]);
      }
    } else if (metric === 'TASKS_COMPLETED') {
      val = r.completedTasks;
      itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#3B82F6' },
        { offset: 1, color: '#60A5FA' },
      ]);
    } else if (metric === 'UTILIZATION') {
      val = r.utilization;
      // Semantic coloring by 85% operational limit threshold
      if (r.utilization > 85) {
        itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#EF4444' },
          { offset: 1, color: '#F87171' },
        ]);
      } else if (r.utilization >= 70) {
        itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#F59E0B' },
          { offset: 1, color: '#FBBF24' },
        ]);
      } else {
        itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#10B981' },
          { offset: 1, color: '#34D399' },
        ]);
      }
    } else if (metric === 'ASSIGNED_EFFORT') {
      val = r.plannedEffort;
      itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#8B5CF6' },
        { offset: 1, color: '#A78BFA' },
      ]);
    }

    return {
      value: val,
      fullName: r.name,
      role: r.role,
      completedTasks: r.completedTasks,
      assignedTasks: r.assignedTasks,
      completionRate: r.completionRate,
      isNA,
      utilization: r.utilization,
      assignedHours: r.assignedHours,
      weeklyCapacity: r.weeklyCapacity,
      plannedEffort: r.plannedEffort,
      actualEffort: r.actualEffort,
      remainingEffort: r.remainingEffort,
      itemStyle,
    };
  });

  // Dynamic Y-axis setup
  let yAxisName = '';
  let yAxisMax: number | ((params: { max: number }) => number) | undefined = undefined;
  let yAxisInterval: number | undefined = undefined;
  let yAxisFormatter = '{value}';

  if (metric === 'COMPLETION_RATE') {
    yAxisName = isVeryNarrow ? '' : 'Completion Rate (%)';
    yAxisMax = 100;
    yAxisFormatter = '{value}%';
  } else if (metric === 'TASKS_COMPLETED') {
    yAxisName = isVeryNarrow ? '' : 'Tasks Completed';
    const maxVal = Math.max(...rows.map((r) => r.completedTasks), 1);
    yAxisMax = maxVal < 5 ? 5 : undefined;
    yAxisInterval = maxVal <= 10 ? 1 : undefined;
  } else if (metric === 'UTILIZATION') {
    yAxisName = isVeryNarrow ? '' : 'Utilization (%)';
    yAxisMax = (v: { max: number }) => Math.max(100, Math.ceil((v.max + 10) / 10) * 10);
    yAxisFormatter = '{value}%';
  } else if (metric === 'ASSIGNED_EFFORT') {
    yAxisName = isVeryNarrow ? '' : 'Assigned Effort (h)';
    yAxisFormatter = '{value}h';
  }

  // Label Formatter above each bar
  const labelFormatter = (params: unknown) => {
    const p = params as { data?: BarDataItem };
    const d = p?.data;
    if (!d) return '';
    if (metric === 'COMPLETION_RATE') {
      if (d.isNA) return 'N/A';
      return `${d.value}%`;
    }
    if (metric === 'TASKS_COMPLETED') {
      return `${d.value}`;
    }
    if (metric === 'UTILIZATION') {
      return `${d.value}%`;
    }
    if (metric === 'ASSIGNED_EFFORT') {
      return `${d.value}h`;
    }
    return `${d.value}`;
  };

  // Rich Tooltip Formatter
  const tooltipFormatter = (params: unknown) => {
    const p = params as { data?: BarDataItem };
    const d = p?.data;
    if (!d) return '';

    if (metric === 'COMPLETION_RATE') {
      const rateStr = d.isNA
        ? '<span style="color: #94A3B8;">N/A (No tasks assigned)</span>'
        : `<strong style="color: #7654D6; font-weight:700;">${d.completionRate}%</strong>`;
      return `
        <div style="font-weight: 700; font-size: 13px; color: ${theme.darkText};">${d.fullName}</div>
        <div style="font-size: 11px; color: ${theme.mutedText}; margin-bottom: 6px;">${d.role}</div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Completed Tasks:</span>
          <strong>${d.completedTasks}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Assigned Tasks:</span>
          <strong>${d.assignedTasks}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText}; margin-top:4px;">
          <span>Completion Rate:</span>
          ${rateStr}
        </div>
      `;
    }

    if (metric === 'TASKS_COMPLETED') {
      return `
        <div style="font-weight: 700; font-size: 13px; color: ${theme.darkText};">${d.fullName}</div>
        <div style="font-size: 11px; color: ${theme.mutedText}; margin-bottom: 6px;">${d.role}</div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Completed Tasks:</span>
          <strong style="color: #3B82F6; font-weight:700;">${d.completedTasks}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Assigned Tasks:</span>
          <strong>${d.assignedTasks}</strong>
        </div>
      `;
    }

    if (metric === 'UTILIZATION') {
      let statusColor = '#10B981';
      let statusText = 'Normal (<70%)';
      if (d.utilization > 85) {
        statusColor = '#EF4444';
        statusText = 'Over operational limit (>85%)';
      } else if (d.utilization >= 70) {
        statusColor = '#F59E0B';
        statusText = 'Approaching operational limit (70–85%)';
      }
      const availableCap = Math.max(0, Math.round((d.weeklyCapacity - d.assignedHours) * 10) / 10);
      return `
        <div style="font-weight: 700; font-size: 13px; color: ${theme.darkText};">${d.fullName}</div>
        <div style="font-size: 11px; color: ${theme.mutedText}; margin-bottom: 6px;">${d.role}</div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Utilization:</span>
          <strong style="color: ${statusColor}; font-weight:700;">${d.utilization}%</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Assigned Effort:</span>
          <strong>${d.assignedHours}h</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Available Capacity:</span>
          <strong>${availableCap}h</strong>
        </div>
        <div style="margin-top:6px; padding-top:4px; border-top:1px dashed ${theme.border}; font-size:11px; font-weight:600; color:${statusColor};">
          Status: ${statusText}
        </div>
      `;
    }

    if (metric === 'ASSIGNED_EFFORT') {
      return `
        <div style="font-weight: 700; font-size: 13px; color: ${theme.darkText};">${d.fullName}</div>
        <div style="font-size: 11px; color: ${theme.mutedText}; margin-bottom: 6px;">${d.role}</div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Assigned Effort:</span>
          <strong style="color: #8B5CF6; font-weight:700;">${d.assignedHours}h</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Planned Effort:</span>
          <strong>${d.plannedEffort}h</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Actual Effort:</span>
          <strong>${d.actualEffort}h</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:16px; color: ${theme.darkText};">
          <span>Remaining Effort:</span>
          <strong>${d.remainingEffort}h</strong>
        </div>
      `;
    }

    return '';
  };

  // Horizontal dataZoom setup for 35+ resources
  // Displays ~8-10 bars initially and allows horizontal navigation
  const showDataZoom = rows.length > 8;
  const initialBarsVisible = isVeryNarrow ? 6 : containerWidth < 768 ? 7 : 9;
  const endValue = Math.min(rows.length - 1, initialBarsVisible - 1);

  const dataZoomConfig: (
    echarts.InsideDataZoomComponentOption | echarts.SliderDataZoomComponentOption
  )[] = showDataZoom
    ? [
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
          startValue: 0,
          endValue,
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          bottom: 6,
          height: 20,
          borderColor: 'transparent',
          backgroundColor: theme.isDark ? '#1E222D' : '#F1F5F9',
          fillerColor: theme.isDark ? 'rgba(118, 84, 214, 0.28)' : 'rgba(118, 84, 214, 0.18)',
          handleStyle: {
            color: '#7654D6',
            borderColor: '#7654D6',
          },
          moveHandleStyle: {
            color: '#7654D6',
          },
          textStyle: {
            color: theme.mutedText,
            fontSize: 9.5,
            fontFamily: FONT_FAMILY,
          },
          brushSelect: false,
          startValue: 0,
          endValue,
        },
      ]
    : [];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      ...getCommonTooltip(theme),
      formatter: tooltipFormatter,
    },
    grid: {
      top: metric === 'UTILIZATION' ? 36 : 28,
      left: isVeryNarrow ? 36 : 52,
      right: isVeryNarrow ? 16 : 24,
      bottom: showDataZoom ? (isVeryNarrow ? 70 : 60) : isVeryNarrow ? 50 : 38,
      containLabel: true,
    },
    dataZoom: dataZoomConfig,
    xAxis: {
      type: 'category',
      data: resourceNames,
      axisLabel: {
        color: theme.mutedText,
        fontSize: isVeryNarrow ? 9 : 10.5,
        fontFamily: FONT_FAMILY,
        interval: 0,
        rotate: isVeryNarrow ? 35 : containerWidth < 768 ? 25 : 0,
        formatter: (val: string) => {
          const maxLen = isVeryNarrow ? 7 : containerWidth < 768 ? 9 : 12;
          return val.length > maxLen ? val.slice(0, maxLen - 1) + '…' : val;
        },
      },
      axisLine: { lineStyle: { color: theme.border } },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameLocation: 'end',
      nameTextStyle: {
        color: theme.mutedText,
        fontSize: 10.5,
        fontFamily: FONT_FAMILY,
      },
      min: 0,
      ...(yAxisMax !== undefined ? { max: yAxisMax } : {}),
      ...(yAxisInterval !== undefined ? { interval: yAxisInterval } : {}),
      axisLabel: {
        formatter: yAxisFormatter,
        color: theme.mutedText,
        fontSize: isVeryNarrow ? 9.5 : 10.5,
        fontFamily: FONT_FAMILY,
      },
      splitLine: {
        lineStyle: { color: theme.gridLine, type: 'dashed' },
      },
      axisLine: { lineStyle: { color: theme.border } },
    },
    series: [
      {
        name: 'Resource Performance',
        type: 'bar',
        barMaxWidth: isVeryNarrow ? 26 : 38,
        barMinWidth: 12,
        data: barData,
        label: {
          show: true,
          position: 'top',
          formatter: labelFormatter,
          color: theme.darkText,
          fontSize: isVeryNarrow ? 9 : 10.5,
          fontFamily: FONT_FAMILY,
          fontWeight: 600,
        },
        ...(metric === 'UTILIZATION'
          ? {
              markLine: {
                silent: true,
                symbol: 'none',
                data: [
                  {
                    yAxis: 85,
                    name: '85% Operational Limit',
                    lineStyle: {
                      color: '#EF4444',
                      type: 'dashed',
                      width: 1.8,
                    },
                    label: {
                      show: true,
                      position: 'end',
                      formatter: '85% Operational Limit',
                      color: '#EF4444',
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: FONT_FAMILY,
                    },
                  },
                ],
              },
            }
          : {}),
      },
    ],
  };

  resourceOverviewChart.setOption(option, true);
}

// -------------------------------------------------------------
// Lifecycle & Responsiveness
// -------------------------------------------------------------
function resizeAll() {
  if (utilizationChart) initUtilizationChart();
  if (taskStatusChart) initTaskStatusChart();
  if (effortVarianceChart) initEffortVarianceChart();
  if (capacityChart) initCapacityChart();
  if (resourceOverviewChart) initResourceOverviewChart();
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

watch(selectedPerformanceResourceId, () => {
  void nextTick(() => {
    initResourceOverviewChart();
  });
});

watch(selectedPerformanceMetric, () => {
  void nextTick(() => {
    initResourceOverviewChart();
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

  taskStatusChart?.dispose();
  taskStatusChart = null;

  effortVarianceChart?.dispose();
  effortVarianceChart = null;

  capacityChart?.dispose();
  capacityChart = null;

  resourceOverviewChart?.dispose();
  resourceOverviewChart = null;
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

.performance-resource-select {
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

.performance-metric-select {
  min-width: 135px;
  max-width: 175px;
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
    box-shadow:
      0 8px 20px rgba(139, 111, 216, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.04);
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
    box-shadow:
      0 8px 22px rgba(139, 111, 216, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.04);
    transform: translateY(-2px);
  }
}

.echarts-box {
  width: 100%;
  height: 290px;
}

.effort-variance-chart-box {
  height: 320px;
}

.resource-overview-chart-box {
  height: 380px;
  width: 100%;
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
    box-shadow:
      0 8px 22px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(139, 111, 216, 0.3);
  }

  .kpi-card.kpi-card-alert {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.1);
  }
}

/* Performance Section Scoped Styles */
.performance-resource-select,
.performance-metric-select {
  min-width: 150px;
  max-width: 190px;
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

.performance-table {
  border-radius: 8px;
  overflow: hidden;
}
</style>
