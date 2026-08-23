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
                                : task.status === 'SCHEDULED'
                                  ? 'purple-7'
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

        <!-- 6. SCHEDULE & GANTT ROADMAP SECTION (MATCHING PM SIDE SCHEDULE PAGE EXACTLY) -->
        <section class="gantt-section-row">
          <q-card flat bordered class="resource-schedule-card">
            <!-- Header Section with View Mode Switcher -->
            <q-card-section class="gantt-header-section q-pb-none">
              <div class="row items-center justify-between gap-md q-mb-sm">
                <div>
                  <div class="text-subtitle1 text-weight-bold text-dark">Schedule & Gantt Roadmap</div>
                  <div class="text-caption text-grey-6">
                    Interactive timeline of your assigned work across projects, dates, and milestones.
                  </div>
                </div>

                <div class="row items-center q-gutter-sm">
                  <!-- View Toggle Buttons: Week, Day, Month, Gantt, List -->
                  <q-btn-toggle
                    v-model="scheduleViewMode"
                    toggle-color="primary"
                    toggle-text-color="white"
                    color="white"
                    text-color="grey-8"
                    dense
                    rounded
                    unelevated
                    class="view-toggle-btn shadow-subtle"
                    :options="[
                      { label: 'Week', value: 'week', icon: 'view_week' },
                      { label: 'Day', value: 'day', icon: 'view_day' },
                      { label: 'Month', value: 'month', icon: 'calendar_month' },
                      { label: 'Gantt', value: 'gantt', icon: 'timeline' },
                      { label: 'List', value: 'table', icon: 'table_rows' },
                    ]"
                  />
                </div>
              </div>

              <!-- Toolbar: Date Navigation & Filter Controls (Matching PM Schedule Page) -->
              <div class="toolbar-content row items-center justify-between q-py-sm border-top-subtle">
                <!-- Date Navigation Controls -->
                <div class="date-nav-block row items-center gap-xs">
                  <q-btn
                    flat
                    round
                    dense
                    icon="chevron_left"
                    size="sm"
                    class="nav-arrow-btn"
                    title="Previous"
                    @click="navigateDate(-1)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="chevron_right"
                    size="sm"
                    class="nav-arrow-btn"
                    title="Next"
                    @click="navigateDate(1)"
                  />
                  <q-btn
                    outline
                    dense
                    no-caps
                    label="Today"
                    class="today-btn q-px-sm"
                    @click="goToToday"
                  />
                  <div class="current-range-label q-ml-sm">
                    {{ formattedDateRangeHeader }}
                  </div>
                </div>

                <!-- Filter Controls -->
                <div class="filter-controls-row row items-center gap-xs">
                  <q-input
                    v-model="ganttSearchQuery"
                    outlined
                    dense
                    clearable
                    placeholder="Search..."
                    class="filter-input-search"
                  >
                    <template #prepend>
                      <q-icon name="search" size="16px" />
                    </template>
                  </q-input>

                  <q-select
                    v-model="ganttProjectFilter"
                    outlined
                    dense
                    emit-value
                    map-options
                    :options="ganttProjectFilterOptions"
                    label="Project"
                    class="filter-select-box"
                  />

                  <q-select
                    v-model="ganttStatusFilter"
                    outlined
                    dense
                    emit-value
                    map-options
                    :options="ganttStatusFilterOptions"
                    label="Status"
                    class="filter-select-box"
                  />

                  <q-select
                    v-model="ganttPriorityFilter"
                    outlined
                    dense
                    emit-value
                    map-options
                    :options="ganttPriorityFilterOptions"
                    label="Priority"
                    class="filter-select-box"
                  />
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-none">
              <!-- A. WEEK / DAY INTERACTIVE TIME-GRID VIEW (MATCHING PM SCHEDULE PAGE IMAGE EXACTLY) -->
              <div
                v-if="scheduleViewMode === 'week' || scheduleViewMode === 'day'"
                class="calendar-scroll-wrapper"
              >
                <div
                  class="calendar-table-grid"
                  :style="{
                    gridTemplateColumns: `64px repeat(${displayedDays.length}, minmax(${scheduleViewMode === 'day' ? '360px' : '150px'}, 1fr))`,
                  }"
                >
                  <!-- Top Left Time Corner Header -->
                  <div class="cal-cell time-corner-header">
                    <span class="time-header-text">Time</span>
                  </div>

                  <!-- Date Column Headers -->
                  <div
                    v-for="day in displayedDays"
                    :key="day.toISOString()"
                    class="cal-cell date-col-header"
                    :class="{ 'is-today-col': isSameDay(day, todayDate), 'is-weekend-col': isWeekend(day) }"
                  >
                    <div class="col-weekday-name">{{ formatWeekdayName(day) }}</div>
                    <div class="col-day-badge" :class="{ 'today-day-badge': isSameDay(day, todayDate) }">
                      {{ day.getDate() }}
                    </div>
                    <div v-if="isSameDay(day, todayDate)" class="today-tag-pill">TODAY</div>
                  </div>

                  <!-- Hour Rows (08:00 to 18:00) -->
                  <template v-for="hour in TIME_HOURS" :key="hour">
                    <!-- Time Column Label -->
                    <div class="cal-cell time-label-cell">
                      <span class="time-slot-label">{{ hour }}</span>
                    </div>

                    <!-- Track Cells -->
                    <div
                      v-for="day in displayedDays"
                      :key="`${day.toISOString()}-${hour}`"
                      class="cal-cell time-track-cell"
                      :class="{ 'is-today-col': isSameDay(day, todayDate), 'is-weekend-col': isWeekend(day) }"
                    />
                  </template>

                  <!-- Rendered Task Blocks placed over the Grid -->
                  <div
                    v-for="item in positionedCalendarTasks"
                    :key="item.task.task_id"
                    class="calendar-task-block cursor-pointer"
                    :style="item.style"
                    @click="goToTaskDetails(item.task.task_id)"
                  >
                    <div class="task-block-inner">
                      <div class="block-top-row row items-center justify-between no-wrap">
                        <span class="block-time-range">{{ item.timeRange }}</span>
                        <span class="block-priority-dot" :class="`prio-dot-${item.task.priority.toLowerCase()}`" />
                      </div>

                      <div class="block-task-title ellipsis" :title="item.task.title">
                        {{ item.task.title }}
                      </div>

                      <div class="block-project-name ellipsis" :title="item.task.project_name">
                        {{ item.task.project_name }}
                      </div>

                      <div class="block-bottom-row row items-center justify-between no-wrap q-mt-xs">
                        <span class="text-caption font-bold opacity-80">{{ item.task.status.replace('_', ' ') }}</span>
                        <div class="block-progress-pill font-bold">
                          {{ Number(item.task.progress) || 0 }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- B. MONTH MATRIX VIEW -->
              <div v-else-if="scheduleViewMode === 'month'" class="month-calendar-wrapper">
                <div class="month-weekday-header-grid">
                  <div v-for="wDay in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="wDay" class="month-wday-cell">
                    {{ wDay }}
                  </div>
                </div>

                <div class="month-days-matrix">
                  <div
                    v-for="mDay in monthMatrixDays"
                    :key="mDay.date.toISOString()"
                    class="month-day-cell"
                    :class="{
                      'is-current-month': mDay.isCurrentMonth,
                      'is-other-month': !mDay.isCurrentMonth,
                      'is-month-today': isSameDay(mDay.date, todayDate),
                    }"
                  >
                    <div class="month-day-top row items-center justify-between no-wrap">
                      <span class="m-day-number">{{ mDay.date.getDate() }}</span>
                      <span v-if="isSameDay(mDay.date, todayDate)" class="today-badge-micro">TODAY</span>
                    </div>

                    <div class="month-day-tasks-list">
                      <div
                        v-for="t in getTasksOnDate(mDay.date)"
                        :key="t.task_id"
                        class="month-task-pill cursor-pointer ellipsis"
                        :style="getMonthTaskPillStyle(t)"
                        :title="`${t.title} (${t.project_name})`"
                        @click.stop="goToTaskDetails(t.task_id)"
                      >
                        <span class="pill-dot" />
                        <span class="pill-text">{{ t.title }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- C. GANTT ROADMAP VIEW (REUSING PM's GanttChart Component Directly) -->
              <div v-else-if="scheduleViewMode === 'gantt'" class="gantt-wrapper-container q-pa-sm">
                <GanttChart
                  :tasks="filteredGanttTasks"
                  title="My Gantt Timeline"
                  subtitle="Visual timeline of your assigned task durations, progress and deadlines"
                  empty-title="No matching schedule items"
                  empty-subtitle="Adjust your filters to view tasks on the Gantt timeline."
                />
              </div>

              <!-- D. LIST BREAKDOWN TABLE VIEW -->
              <div v-else-if="scheduleViewMode === 'table'" class="q-pa-none">
                <q-table
                  flat
                  :rows="filteredTasksList"
                  :columns="scheduleTableColumns"
                  row-key="task_id"
                  :pagination="{ rowsPerPage: 10 }"
                  class="schedule-table"
                >
                  <template #body-cell-title="props">
                    <q-td :props="props">
                      <div class="task-title-cell cursor-pointer" @click="goToTaskDetails(props.row.task_id)">
                        <div class="task-cell-title ellipsis" :title="props.row.title">
                          {{ props.row.title }}
                        </div>
                        <div v-if="props.row.description" class="task-cell-desc ellipsis" :title="props.row.description">
                          {{ props.row.description }}
                        </div>
                      </div>
                    </q-td>
                  </template>

                  <template #body-cell-project="props">
                    <q-td :props="props">
                      <q-chip dense square class="project-badge">
                        <q-icon name="folder" size="12px" class="q-mr-xs" />
                        {{ props.row.project_name || `Project #${props.row.project_id}` }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-priority="props">
                    <q-td :props="props">
                      <q-chip dense square :class="['priority-chip', getPriorityClass(props.row.priority)]">
                        {{ props.row.priority }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-status="props">
                    <q-td :props="props">
                      <q-chip dense square :class="['status-chip', getTaskStatusClass(props.row.status)]">
                        {{ formatStatus(props.row.status) }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-dates="props">
                    <q-td :props="props" class="date-cell">
                      <div class="row items-center no-wrap">
                        <span>{{ formatDate(props.row.start_date) }}</span>
                        <span class="q-mx-xs text-grey-5">→</span>
                        <span>{{ formatDate(props.row.deadline) }}</span>
                      </div>
                    </q-td>
                  </template>

                  <template #body-cell-progress="props">
                    <q-td :props="props">
                      <div class="progress-cell-wrapper">
                        <div class="row justify-between progress-label-row">
                          <span class="text-weight-bold">{{ Number(props.row.progress) || 0 }}%</span>
                          <span v-if="isOverdue(props.row)" class="text-negative text-weight-medium">Overdue</span>
                        </div>
                        <q-linear-progress
                          rounded
                          size="6px"
                          :value="(Number(props.row.progress) || 0) / 100"
                          :color="isOverdue(props.row) ? 'negative' : props.row.status === 'COMPLETED' ? 'positive' : 'primary'"
                          track-color="grey-3"
                        />
                      </div>
                    </q-td>
                  </template>
                </q-table>
              </div>
            </q-card-section>
          </q-card>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import WorkloadCard from '@/components/resource/WorkloadCard.vue';
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue';
import ProjectsBreakdownCard from '@/components/resource/ProjectsBreakdownCard.vue';
import GanttChart, { type GanttTask } from '@/components/gantt/GanttChart.vue';
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

// View mode and Navigation Controls (Matching PM Schedule Page)
const scheduleViewMode = ref<'week' | 'day' | 'month' | 'gantt' | 'table'>('week');
const currentAnchorDate = ref<Date>(new Date());
const todayDate = new Date();

const TIME_HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

interface TaskPastelTheme {
  bg: string;
  border: string;
  text: string;
  badge: string;
}

const DEFAULT_TASK_THEME: TaskPastelTheme = {
  bg: '#EDE7FF',
  border: '#C7B5F8',
  text: '#4C1D95',
  badge: '#7c3aed',
};

const TASK_PASTEL_THEMES: TaskPastelTheme[] = [
  DEFAULT_TASK_THEME,
  { bg: '#E0F2FE', border: '#BAE0FD', text: '#0369A1', badge: '#0284c7' }, // Sky
  { bg: '#ECFDF5', border: '#B3ECC9', text: '#047857', badge: '#059669' }, // Mint
  { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', badge: '#ea580c' }, // Peach
  { bg: '#FCE7F3', border: '#FBCFE8', text: '#BE185D', badge: '#db2777' }, // Rose
  { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', badge: '#d97706' }, // Amber
];

function getTaskPastelTheme(taskId: number): TaskPastelTheme {
  const idx = Math.abs(taskId) % TASK_PASTEL_THEMES.length;
  return TASK_PASTEL_THEMES[idx] ?? DEFAULT_TASK_THEME;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function formatWeekdayName(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d);
}

function goToToday() {
  currentAnchorDate.value = new Date();
}

function navigateDate(direction: number) {
  const cur = new Date(currentAnchorDate.value);
  if (scheduleViewMode.value === 'day') {
    cur.setDate(cur.getDate() + direction);
  } else if (scheduleViewMode.value === 'month') {
    cur.setMonth(cur.getMonth() + direction);
  } else {
    cur.setDate(cur.getDate() + direction * 7);
  }
  currentAnchorDate.value = cur;
}

const displayedDays = computed<Date[]>(() => {
  const anchor = new Date(currentAnchorDate.value);
  if (scheduleViewMode.value === 'day') {
    return [anchor];
  }

  const dayOfWeek = anchor.getDay();
  const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMon);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
});

const formattedDateRangeHeader = computed<string>(() => {
  if (scheduleViewMode.value === 'day') {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(currentAnchorDate.value);
  }

  if (scheduleViewMode.value === 'month') {
    return new Intl.DateTimeFormat('en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(currentAnchorDate.value);
  }

  if (displayedDays.value.length >= 7) {
    const first = displayedDays.value[0];
    const last = displayedDays.value[6];
    if (first && last) {
      const fStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(first);
      const lStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(last);
      return `${fStr} – ${lStr}`;
    }
  }
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(currentAnchorDate.value);
});

// Month matrix calculation
const monthMatrixDays = computed(() => {
  const anchor = new Date(currentAnchorDate.value);
  const currentMonth = anchor.getMonth();
  const currentYear = anchor.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const diffToMon = (startDayOfWeek === 0 ? -6 : 1) - startDayOfWeek;

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() + diffToMon);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === currentMonth,
    });
  }
  return days;
});

function getTasksOnDate(date: Date): Task[] {
  const targetDateStr = date.toISOString().slice(0, 10);
  return filteredTasksList.value.filter((t) => {
    const startStr = t.start_date ? t.start_date.slice(0, 10) : '';
    const endStr = t.deadline ? t.deadline.slice(0, 10) : startStr;

    if (!startStr && !endStr) return false;
    if (startStr && !endStr) return startStr === targetDateStr;
    if (!startStr && endStr) return endStr === targetDateStr;
    return targetDateStr >= startStr && targetDateStr <= endStr;
  });
}

function getMonthTaskPillStyle(task: Task) {
  const theme = getTaskPastelTheme(task.task_id);
  return {
    background: theme.bg,
    color: theme.text,
    borderLeft: `3px solid ${theme.badge}`,
  };
}

// Filter Controls
const ganttSearchQuery = ref('');
const ganttProjectFilter = ref<string>('ALL');
const ganttStatusFilter = ref<string>('ALL');
const ganttPriorityFilter = ref<string>('ALL');

const ganttStatusFilterOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const ganttPriorityFilterOptions = [
  { label: 'All Priorities', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const ganttProjectFilterOptions = computed(() => {
  const set = new Set<string>();
  tasks.value.forEach((t) => {
    const pName = t.project_name || `Project #${t.project_id}`;
    set.add(pName);
  });
  const opts = [...set].map((name) => ({ label: name, value: name }));
  return [{ label: 'All Projects', value: 'ALL' }, ...opts];
});

const filteredTasksList = computed<Task[]>(() => {
  const q = ganttSearchQuery.value.trim().toLowerCase();

  return tasks.value.filter((task) => {
    const pName = task.project_name || `Project #${task.project_id}`;
    const matchesSearch =
      !q ||
      task.title.toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q) ||
      (task.description || '').toLowerCase().includes(q);

    const matchesProject =
      ganttProjectFilter.value === 'ALL' || pName === ganttProjectFilter.value;
    const matchesStatus =
      ganttStatusFilter.value === 'ALL' || task.status === ganttStatusFilter.value;
    const matchesPriority =
      ganttPriorityFilter.value === 'ALL' || task.priority === ganttPriorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

// Positioned Tasks for the Week / Day Calendar Grid Overlay
interface PositionedTask {
  task: Task;
  timeRange: string;
  style: Record<string, string | number>;
}

const positionedCalendarTasks = computed<PositionedTask[]>(() => {
  const results: PositionedTask[] = [];
  const days = displayedDays.value;
  if (!days.length) return results;

  const startHour = 8;
  const hourHeightPx = 54;
  const headerHeightPx = 48;

  const dayBuckets: Record<number, Task[]> = {};
  for (let d = 0; d < days.length; d++) {
    dayBuckets[d] = [];
  }

  filteredTasksList.value.forEach((task) => {
    const taskStartStr = task.start_date ? task.start_date.slice(0, 10) : '';
    const taskEndStr = task.deadline ? task.deadline.slice(0, 10) : taskStartStr;

    days.forEach((dayObj, colIdx) => {
      const curDateStr = dayObj.toISOString().slice(0, 10);
      const isScheduledToday =
        (taskStartStr && curDateStr >= taskStartStr && curDateStr <= taskEndStr) ||
        (!taskStartStr && taskEndStr === curDateStr);

      if (isScheduledToday) {
        if (!dayBuckets[colIdx]) {
          dayBuckets[colIdx] = [];
        }
        dayBuckets[colIdx]?.push(task);
      }
    });
  });

  days.forEach((dayObj, colIdx) => {
    const bucket = dayBuckets[colIdx] || [];
    bucket.forEach((task, taskIdx) => {
      let startH = 9 + (taskIdx % 5) * 1.5;
      const effortNum = Number(task.expected_effort) || 8;
      let durationHours = Math.min(4, Math.max(1, effortNum / 3));

      if (task.start_date && task.start_date.includes('T')) {
        const timePart = task.start_date.split('T')[1];
        if (timePart) {
          const [hh, mm] = timePart.split(':').map(Number);
          if (hh !== undefined && !Number.isNaN(hh)) {
            startH = Math.max(8, Math.min(16, hh + (mm ? mm / 60 : 0)));
          }
        }
      }

      if (startH + durationHours > 18) {
        durationHours = Math.max(1, 18 - startH);
      }

      const topOffsetPx = headerHeightPx + (startH - startHour) * hourHeightPx;
      const heightPx = Math.max(48, durationHours * hourHeightPx - 6);

      const endH = startH + durationHours;
      const fmtH = (h: number) => {
        const fullH = Math.floor(h);
        const mins = Math.round((h - fullH) * 60);
        return `${String(fullH).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      };

      const timeRange = `${fmtH(startH)} – ${fmtH(endH)}`;
      const theme = getTaskPastelTheme(task.task_id);

      results.push({
        task,
        timeRange,
        style: {
          gridColumn: colIdx + 2,
          top: `${topOffsetPx}px`,
          height: `${heightPx}px`,
          background: theme.bg,
          borderColor: theme.border,
          color: theme.text,
          borderLeft: `4px solid ${theme.badge}`,
        },
      });
    });
  });

  return results;
});

function normalizePriorityForGantt(p?: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  const up = (p || '').toUpperCase();
  if (up === 'LOW') return 'Low';
  if (up === 'HIGH') return 'High';
  if (up === 'CRITICAL') return 'Critical';
  return 'Medium';
}

const filteredGanttTasks = computed<GanttTask[]>(() => {
  const today = new Date().toISOString().slice(0, 10);

  return filteredTasksList.value.map((task) => {
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
      expectedEffort: Number(task.expected_effort) || undefined,
      actualEffort: Number(task.actual_effort) || 0,
      actualStart: task.actual_start || null,
      actualEnd: task.actual_end || null,
      overdue: isOverdue(task),
      isOverrun: task.pacing?.is_overrun,
      isBehindSchedule: task.pacing?.is_behind_schedule,
      pacingWarning: task.pacing?.warning || null,
    };
  });
});

const scheduleTableColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  { name: 'project', label: 'Project', field: (t) => t.project_name || t.project_id, align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'dates', label: 'Start & Deadline', field: () => '', align: 'left' },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
];

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTaskStatusClass(status: string): string {
  if (status === 'COMPLETED') return 'chip-soft-green';
  if (status === 'IN_PROGRESS') return 'chip-soft-blue';
  if (status === 'SCHEDULED') return 'chip-soft-purple';
  return 'chip-soft-grey';
}

function getPriorityClass(priority: string): string {
  if (priority === 'CRITICAL') return 'chip-soft-red';
  if (priority === 'HIGH') return 'chip-soft-orange';
  if (priority === 'MEDIUM') return 'chip-soft-blue';
  return 'chip-soft-purple';
}

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

// Stats computations
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

/* 6. Direct Gantt & Schedule Section Styles */
.resource-schedule-card {
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  overflow: hidden;
}

.gantt-header-section {
  padding: 18px 20px 10px;
}

.border-top-subtle {
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.view-toggle-btn {
  border: 1px solid var(--wo-border, #e2e8f0);
  background: var(--wo-bg-card, #ffffff);

  :deep(.q-btn) {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
  }
}

.date-nav-block {
  .nav-arrow-btn {
    color: var(--wo-text-muted, #64748b);
    border: 1px solid var(--wo-border, #e2e8f0);
    border-radius: 8px;
    &:hover {
      color: var(--wo-primary, #8b6fd8);
      background: rgba(139, 111, 216, 0.08);
    }
  }

  .today-btn {
    font-size: 11.5px;
    font-weight: 600;
    border-radius: 8px;
    color: var(--wo-text-main, #334155);
    border-color: var(--wo-border, #e2e8f0);
  }

  .current-range-label {
    font-size: 14px;
    font-weight: 700;
    color: var(--wo-text-main, #1e293b);
  }
}

.filter-controls-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  .filter-input-search {
    width: 140px;
  }

  .filter-select-box {
    width: 125px;
  }

  :deep(.q-field__control) {
    min-height: 34px;
    border-radius: 8px;
  }

  :deep(.q-field__label),
  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 11.5px;
  }
}

/* ===================================================
   Calendar Time-Grid Layout (Week / Day) - EXACT PM MATCH
   =================================================== */
.calendar-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}

.calendar-table-grid {
  display: grid;
  position: relative;
  min-width: 850px;
  border-collapse: collapse;
}

.cal-cell {
  border-right: 1px solid var(--wo-border-subtle, #eef0f4);
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f4);
}

.time-corner-header {
  height: 48px;
  background: var(--wo-bg-page, #fafbfc);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--wo-border, #e5e7ec);
  border-right: 1px solid var(--wo-border, #e5e7ec);

  .time-header-text {
    font-size: 11px;
    font-weight: 700;
    color: var(--wo-text-muted, #94a3b8);
    text-transform: uppercase;
  }
}

.date-col-header {
  height: 48px;
  padding: 6px 10px;
  background: var(--wo-bg-page, #fafbfc);
  border-bottom: 1px solid var(--wo-border, #e5e7ec);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;

  .col-weekday-name {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--wo-text-muted, #64748b);
  }

  .col-day-badge {
    font-size: 13px;
    font-weight: 700;
    color: var(--wo-text-main, #1e293b);
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.today-day-badge {
      background: var(--wo-primary, #8b6fd8);
      color: #ffffff;
    }
  }

  .today-tag-pill {
    position: absolute;
    top: 4px;
    right: 6px;
    font-size: 9px;
    font-weight: 800;
    color: var(--wo-primary, #8b6fd8);
    background: rgba(139, 111, 216, 0.12);
    padding: 1px 4px;
    border-radius: 4px;
  }

  &.is-today-col {
    background: rgba(139, 111, 216, 0.04);
  }

  &.is-weekend-col {
    background: rgba(241, 245, 249, 0.4);
  }
}

.time-label-cell {
  height: 54px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  background: var(--wo-bg-page, #fafbfc);
  border-right: 1px solid var(--wo-border, #e5e7ec);

  .time-slot-label {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--wo-text-muted, #94a3b8);
  }
}

.time-track-cell {
  height: 54px;

  &.is-today-col {
    background: rgba(139, 111, 216, 0.02);
  }

  &.is-weekend-col {
    background: rgba(241, 245, 249, 0.25);
  }
}

/* ===================================================
   Calendar Task Block Overlay - EXACT PM MATCH
   =================================================== */
.calendar-task-block {
  position: absolute;
  left: 3px;
  right: 3px;
  z-index: 5;
  border-radius: 9px;
  border: 1px solid transparent;
  padding: 6px 8px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.12);
    z-index: 10;
  }

  .block-top-row {
    margin-bottom: 2px;
  }

  .block-time-range {
    font-size: 9.5px;
    font-weight: 700;
    opacity: 0.85;
  }

  .block-priority-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;

    &.prio-dot-critical { background: #ef4444; }
    &.prio-dot-high { background: #f97316; }
    &.prio-dot-medium { background: #8b6fd8; }
    &.prio-dot-low { background: #10b981; }
  }

  .block-task-title {
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.25;
  }

  .block-project-name {
    font-size: 10px;
    opacity: 0.8;
  }

  .block-progress-pill {
    font-size: 9.5px;
    opacity: 0.9;
  }
}

/* ===================================================
   Month Matrix Grid View
   =================================================== */
.month-weekday-header-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--wo-bg-page, #fafbfc);
  border-bottom: 1px solid var(--wo-border, #e5e7ec);

  .month-wday-cell {
    padding: 8px;
    text-align: center;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--wo-text-muted, #64748b);
  }
}

.month-days-matrix {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 460px;

  .month-day-cell {
    min-height: 90px;
    border-right: 1px solid var(--wo-border-subtle, #f0f2f5);
    border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
    padding: 6px;
    display: flex;
    flex-direction: column;

    &.is-other-month {
      background: rgba(248, 250, 252, 0.4);
      .m-day-number { opacity: 0.35; }
    }

    &.is-month-today {
      background: rgba(139, 111, 216, 0.03);
      .m-day-number {
        background: var(--wo-primary, #8b6fd8);
        color: #ffffff;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .month-day-top {
    margin-bottom: 4px;
  }

  .m-day-number {
    font-size: 11px;
    font-weight: 700;
    color: var(--wo-text-main, #334155);
  }

  .today-badge-micro {
    font-size: 8px;
    font-weight: 800;
    color: var(--wo-primary, #8b6fd8);
  }

  .month-day-tasks-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
    max-height: 65px;
  }

  .month-task-pill {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 4px;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 4px;

    .pill-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }
  }
}

/* Schedule Table */
.schedule-table :deep(th) {
  height: 40px;
  padding: 0 14px;
  background: var(--wo-bg-page, #fafbfc);
  color: var(--wo-text-muted, #647087);
  font-size: 11px;
  font-weight: 600;
  border-bottom: 1px solid var(--wo-border, #e9ebef);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.schedule-table :deep(td) {
  height: 52px;
  padding: 8px 14px;
  color: var(--wo-text-main, #334155);
  font-size: 12.5px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.schedule-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover, #faf9ff);
}

.task-title-cell {
  max-width: 280px;
}

.task-cell-title {
  color: var(--wo-text-main, #172033);
  font-size: 13px;
  font-weight: 600;
}

.task-cell-desc {
  font-size: 11.5px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 2px;
}

.project-badge {
  background: rgba(139, 111, 216, 0.12);
  color: var(--wo-primary, #8b6fd8);
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  padding: 3px 8px;
}

.status-chip,
.priority-chip {
  min-height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
}

.chip-soft-purple {
  background: #f3eefc;
  color: #8b6fd8;
}

.chip-soft-blue {
  background: #eaf1fd;
  color: #2e90fa;
}

.chip-soft-green {
  background: #eaf7f0;
  color: #27ae60;
}

.chip-soft-grey {
  background: #f0f2f5;
  color: #667085;
}

.chip-soft-red {
  background: #fdeef0;
  color: #e15263;
}

.chip-soft-orange {
  background: #fff0eb;
  color: #e56b45;
}

.progress-cell-wrapper {
  min-width: 130px;
}

.progress-label-row {
  font-size: 11.5px;
  margin-bottom: 4px;
  color: var(--wo-text-main, #1e293b);
}

.date-cell {
  color: var(--wo-text-muted, #64748b);
  font-size: 12px;
  white-space: nowrap;
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
