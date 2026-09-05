<template>
  <q-page class="pm-page schedule-page">
    <!-- 1. PAGE HEADER -->
    <div class="page-header-row">
      <div class="header-left">
        <div class="page-title">Schedule</div>
        <div class="page-subtitle">Plan and track your work across projects and milestones</div>
      </div>

      <div class="header-actions row items-center q-gutter-sm">
        <!-- View Toggle Buttons: Week, Day, Month, Gantt, Table -->
        <q-btn-toggle
          v-model="scheduleViewMode"
          toggle-color="primary"
          toggle-text-color="white"
          color="white"
          text-color="grey-8"
          dense
          unelevated
          class="view-toggle-btn shadow-subtle q-mr-xs"
          :options="[
            { label: 'Week', value: 'week', icon: 'view_week' },
            { label: 'Day', value: 'day', icon: 'view_day' },
            { label: 'Month', value: 'month', icon: 'calendar_month' },
            { label: 'Gantt', value: 'gantt', icon: 'timeline' },
            { label: 'List', value: 'table', icon: 'table_rows' },
          ]"
        />

        <q-btn
          outline
          no-caps
          icon="refresh"
          label="Refresh"
          class="action-btn-outline"
          :loading="loading"
          @click="loadData"
        />
      </div>
    </div>

    <!-- 2. STAT SUMMARY CARDS -->
    <div class="stats-grid q-mb-md">
      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-purple">
            <q-icon name="event_note" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Assigned Tasks</div>
            <div class="stat-value">{{ tasks.length }}</div>
            <div class="stat-note stat-purple-text">Across all projects</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-blue-bg">
            <q-icon name="sync" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">In Progress</div>
            <div class="stat-value">{{ inProgressCount }}</div>
            <div class="stat-note stat-blue">Actively moving</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-green-bg">
            <q-icon name="check_circle" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Completed</div>
            <div class="stat-value">{{ completedCount }}</div>
            <div class="stat-note stat-green">Milestones reached</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-red-bg">
            <q-icon name="warning" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Overdue Tasks</div>
            <div class="stat-value">{{ overdueCount }}</div>
            <div class="stat-note stat-red">Requires attention</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 3. CALENDAR TOOLBAR & FILTERS -->
    <q-card flat bordered class="calendar-toolbar-card q-mb-md">
      <div class="toolbar-content row items-center justify-between q-pa-sm">
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
          <q-btn outline dense no-caps label="Today" class="today-btn q-px-sm" @click="goToToday" />
          <div class="current-range-label q-ml-sm">
            {{ formattedDateRangeHeader }}
          </div>
        </div>

        <!-- Filter Selects -->
        <div class="filter-controls-row row items-center gap-xs">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            clearable
            placeholder="Search tasks..."
            class="filter-input-search"
          >
            <template #prepend>
              <q-icon name="search" size="16px" color="grey-6" />
            </template>
          </q-input>

          <q-select
            v-model="projectFilter"
            outlined
            dense
            emit-value
            map-options
            :options="projectFilterOptions"
            label="Project"
            class="filter-select-box"
          />

          <q-select
            v-model="statusFilter"
            outlined
            dense
            emit-value
            map-options
            :options="statusFilterOptions"
            label="Status"
            class="filter-select-box"
          />

          <q-select
            v-model="priorityFilter"
            outlined
            dense
            emit-value
            map-options
            :options="priorityFilterOptions"
            label="Priority"
            class="filter-select-box"
          />
        </div>
      </div>
    </q-card>

    <!-- LOADING STATE -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="44px" />
    </div>

    <!-- 4. CALENDAR DAY & WEEK COLUMN VIEW -->
    <q-card
      v-else-if="scheduleViewMode === 'week' || scheduleViewMode === 'day'"
      flat
      bordered
      class="calendar-grid-card q-mb-lg"
    >
      <div class="calendar-scroll-wrapper">
        <div
          class="calendar-columns-grid"
          :style="{
            gridTemplateColumns: `repeat(${displayedDays.length}, minmax(${scheduleViewMode === 'day' ? '360px' : '175px'}, 1fr))`,
          }"
        >
          <!-- Date Column for each day -->
          <div
            v-for="day in displayedDays"
            :key="day.toISOString()"
            class="day-column-cell"
            :class="{ 'is-today-col': isSameDay(day, todayDate), 'is-weekend-col': isWeekend(day) }"
          >
            <!-- Date Column Header -->
            <div class="date-col-header">
              <div class="col-weekday-name">{{ formatWeekdayName(day) }}</div>
              <div class="col-day-badge" :class="{ 'today-day-badge': isSameDay(day, todayDate) }">
                {{ day.getDate() }}
              </div>
              <div v-if="isSameDay(day, todayDate)" class="today-tag-pill">TODAY</div>

              <!-- Resource Availability Status Chip -->
              <q-chip
                v-if="getDayAvailability(day)"
                dense
                square
                size="xs"
                :color="getAvailBadgeColor(getDayAvailability(day)!.status)"
                text-color="white"
                class="avail-status-chip text-weight-bold"
                :icon="getAvailIcon(getDayAvailability(day)!.status)"
              >
                {{ getAvailShortLabel(getDayAvailability(day)!) }}
                <q-tooltip>
                  {{ getAvailTooltip(getDayAvailability(day)!) }}
                </q-tooltip>
              </q-chip>
            </div>

            <!-- Tasks Container for this Day -->
            <div class="day-tasks-list q-pa-sm q-gutter-y-sm">
              <template v-if="getTasksOnDate(day).length > 0">
                <div
                  v-for="task in getTasksOnDate(day)"
                  :key="task.task_id"
                  class="calendar-day-task-card cursor-pointer"
                  :style="getTaskCardStyle(task)"
                  @click="goToTask(task.task_id)"
                >
                  <!-- Card Header: Effort / Status & Priority Dot -->
                  <div class="card-top-row row items-center justify-between no-wrap">
                    <span class="card-effort-badge">
                      {{ getTaskEffortBadgeText(task, day) }}
                    </span>
                    <span
                      class="block-priority-dot"
                      :class="`prio-dot-${task.priority.toLowerCase()}`"
                      :title="`Priority: ${task.priority}`"
                    />
                  </div>

                  <!-- Task Title -->
                  <div class="block-task-title ellipsis q-mt-xs" :title="task.title">
                    {{ task.title }}
                  </div>

                  <!-- Project Name -->
                  <div class="block-project-name ellipsis" :title="getProjectName(task.project_id)">
                    {{ getProjectName(task.project_id) }}
                  </div>

                  <!-- Bottom Row: Status Tag & Progress -->
                  <div class="block-bottom-row row items-center justify-between no-wrap q-mt-xs">
                    <span class="block-status-tag">{{ task.status.replace('_', ' ') }}</span>
                    <div class="block-progress-pill font-bold">
                      {{ Number(task.progress) || 0 }}%
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="empty-day-state text-center text-caption text-grey-5 q-py-lg">
                No tasks
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- 5. MONTH VIEW (Calendar Matrix) -->
    <q-card v-else-if="scheduleViewMode === 'month'" flat bordered class="month-grid-card q-mb-lg">
      <div class="month-calendar-wrapper">
        <!-- Weekday header strip -->
        <div class="month-weekday-header-grid">
          <div
            v-for="wDay in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
            :key="wDay"
            class="month-wday-cell"
          >
            {{ wDay }}
          </div>
        </div>

        <!-- Month Day Cells Matrix -->
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
              <div class="row items-center gap-xs">
                <span class="m-day-number">{{ mDay.date.getDate() }}</span>
                <span v-if="isSameDay(mDay.date, todayDate)" class="today-badge-micro">TODAY</span>
              </div>

              <!-- Month Cell Availability Chip -->
              <q-chip
                v-if="getDayAvailability(mDay.date)"
                dense
                square
                size="xs"
                :color="getAvailBadgeColor(getDayAvailability(mDay.date)!.status)"
                text-color="white"
                class="text-weight-bold"
                style="font-size: 8px; height: 16px; padding: 0 4px"
              >
                {{ getAvailShortLabel(getDayAvailability(mDay.date)!) }}
                <q-tooltip>
                  {{ getAvailTooltip(getDayAvailability(mDay.date)!) }}
                </q-tooltip>
              </q-chip>
            </div>

            <!-- Tasks on this month day -->
            <div class="month-day-tasks-list">
              <div
                v-for="task in getTasksOnDate(mDay.date)"
                :key="task.task_id"
                class="month-task-pill cursor-pointer ellipsis"
                :style="getMonthTaskPillStyle(task)"
                :title="`${task.title} (${getProjectName(task.project_id)})`"
                @click.stop="goToTask(task.task_id)"
              >
                <span class="pill-dot" />
                <span class="pill-text">{{ task.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- 6. GANTT ROADMAP VIEW (DHTMLX GANTT) -->
    <div v-else-if="scheduleViewMode === 'gantt'" class="q-mb-lg">
      <DhtmlxGanttTimeline
        :tasks="filteredTasks"
        :projects="projects"
        :holidays="holidays"
        :availability="Array.from(availabilityMap.values())"
        :is-resource-view="true"
        title="Gantt Timeline Roadmap"
        @task-click="(task) => goToTask(task.task_id)"
      />
    </div>

    <!-- 7. DETAILED BREAKDOWN TABLE (List View) -->
    <q-card v-else-if="scheduleViewMode === 'table'" flat bordered class="table-card">
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">Schedule Breakdown</div>
          <div class="text-caption text-grey-6">
            Detailed timeline records for all {{ filteredTasks.length }} tasks
          </div>
        </div>

        <q-chip dense square class="project-badge text-weight-bold">
          {{ filteredTasks.length }} Tasks
        </q-chip>
      </q-card-section>

      <q-table
        flat
        :rows="filteredTasks"
        :columns="tableColumns"
        row-key="task_id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        class="schedule-table"
      >
        <template #body-cell-title="props">
          <q-td :props="props">
            <div class="task-title-cell cursor-pointer" @click="goToTask(props.row.task_id)">
              <div class="task-cell-title ellipsis" :title="props.row.title">
                {{ props.row.title }}
              </div>
              <div
                v-if="props.row.description"
                class="task-cell-desc ellipsis"
                :title="props.row.description"
              >
                {{ props.row.description }}
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-project="props">
          <q-td :props="props">
            <q-chip dense square class="project-badge">
              <q-icon name="folder" size="12px" class="q-mr-xs" />
              {{ getProjectName(props.row.project_id) }}
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
            <div class="column">
              <div class="row items-center no-wrap">
                <span>{{
                  formatDate(
                    props.row.planned_start || props.row.actual_start || props.row.start_date,
                  )
                }}</span>
                <span class="q-mx-xs text-grey-5">→</span>
                <span>{{ formatDate(props.row.planned_end || props.row.deadline) }}</span>
              </div>
              <div
                v-if="props.row.is_deadline_at_risk || props.row.is_schedule_at_risk"
                class="row items-center gap-xs q-mt-xs"
              >
                <q-chip
                  v-if="props.row.is_deadline_at_risk"
                  dense
                  square
                  color="red-1"
                  text-color="red-9"
                  icon="warning"
                  style="font-size: 10px; height: 18px"
                >
                  Deadline Risk
                </q-chip>
                <q-chip
                  v-if="props.row.is_schedule_at_risk"
                  dense
                  square
                  color="amber-1"
                  text-color="amber-9"
                  icon="schedule"
                  style="font-size: 10px; height: 18px"
                >
                  Schedule Risk
                </q-chip>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-progress="props">
          <q-td :props="props">
            <div class="progress-cell-wrapper">
              <div class="progress-label-row row justify-between">
                <span class="text-weight-bold">{{ Number(props.row.progress) || 0 }}%</span>
                <span class="text-caption text-grey-6"
                  >{{ Number(props.row.actual_effort) || 0 }}h logged</span
                >
              </div>
              <q-linear-progress
                :value="(Number(props.row.progress) || 0) / 100"
                rounded
                size="6px"
                color="primary"
                track-color="grey-3"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  getTasksApi,
  getProjectsApi,
  getResourceAvailabilityApi,
  getHolidaysApi,
} from '@/services/api';
import type {
  Task,
  Project,
  DailyAvailabilityDTO,
  AvailabilityStatus,
  HolidayItem,
} from '@/services/api';
import { isOverdue } from '@/utils/taskHelpers';
import DhtmlxGanttTimeline from '@/components/gantt/DhtmlxGanttTimeline.vue';

const $q = useQuasar();
const router = useRouter();

const loading = ref(true);
const holidays = ref<HolidayItem[]>([]);
const STORAGE_KEY_VIEW_MODE = 'taskflow_res_schedule_view_mode';
const storedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE) as
  | 'week'
  | 'day'
  | 'month'
  | 'gantt'
  | 'table'
  | null;
const scheduleViewMode = ref<'week' | 'day' | 'month' | 'gantt' | 'table'>(
  storedViewMode || 'week',
);

watch(scheduleViewMode, (newMode) => {
  if (newMode) {
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, newMode);
  }
});
const currentAnchorDate = ref<Date>(new Date());
const todayDate = new Date();

const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);

const searchQuery = ref('');
const projectFilter = ref<string | null>(null);
const statusFilter = ref<string | null>(null);
const priorityFilter = ref<string | null>(null);

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

function getTaskPastelTheme(task: Task): TaskPastelTheme {
  const idx =
    Math.abs(Number(task.task_id) || Number(task.project_id) || 0) % TASK_PASTEL_THEMES.length;
  const theme = TASK_PASTEL_THEMES[idx];
  return theme ?? DEFAULT_TASK_THEME;
}

const inProgressCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);
const completedCount = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);
const overdueCount = computed(() => {
  return tasks.value.filter((t) => isOverdue(t) && t.status !== 'COMPLETED').length;
});

const projectFilterOptions = computed(() => [
  { label: 'All Projects', value: null },
  ...projects.value.map((p) => ({ label: p.name, value: String(p.project_id) })),
]);

const statusFilterOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Unassigned', value: 'UNASSIGNED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const priorityFilterOptions = [
  { label: 'All Priorities', value: null },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    if (
      searchQuery.value &&
      !t.title.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
      !t.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    ) {
      return false;
    }
    if (projectFilter.value && String(t.project_id) !== String(projectFilter.value)) {
      return false;
    }
    if (statusFilter.value && t.status !== statusFilter.value) {
      return false;
    }
    if (priorityFilter.value && t.priority !== priorityFilter.value) {
      return false;
    }
    return true;
  });
});

// ----------------------------------------------------
// Date Navigation & Range Computation
// ----------------------------------------------------
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isWeekend(d: Date): boolean {
  const avail = getDayAvailability(d);
  if (avail) {
    return avail.status === 'NON_WORKING_DAY';
  }
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

  // Week Mode: start on Monday of the current anchor's week
  const dayOfWeek = anchor.getDay(); // 0 = Sun, 1 = Mon ...
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
      const fStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
        first,
      );
      const lStr = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(last);
      return `${fStr} – ${lStr}`;
    }
  }

  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    currentAnchorDate.value,
  );
});

// Month matrix calculation (42 cells: 6 rows of 7 days)
const monthMatrixDays = computed(() => {
  const anchor = new Date(currentAnchorDate.value);
  const currentMonth = anchor.getMonth();
  const currentYear = anchor.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
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
  const targetDateStr = formatLocalDate(date);
  const dayAvail = getDayAvailability(date);

  // If the day is a holiday, non-working day, or approved full-day leave, do not show tasks on this date
  if (
    dayAvail &&
    (dayAvail.status === 'HOLIDAY' ||
      dayAvail.status === 'NON_WORKING_DAY' ||
      dayAvail.status === 'ON_LEAVE' ||
      (dayAvail.leave_hours && dayAvail.leave_hours >= (dayAvail.daily_working_hours || 8)))
  ) {
    return [];
  }

  if (holidays.value && holidays.value.some((h) => String(h.holiday_date).slice(0, 10) === targetDateStr)) {
    return [];
  }

  return filteredTasks.value.filter((t) => {
    if (t.schedules && t.schedules.length > 0) {
      return t.schedules.some(
        (s) =>
          String(s.schedule_date).slice(0, 10) === targetDateStr && Number(s.allocated_hours) > 0,
      );
    }

    if (isWeekend(date)) {
      return false;
    }

    const startStr =
      t.planned_start || t.actual_start || t.start_date
        ? (t.planned_start || t.actual_start || t.start_date)!.slice(0, 10)
        : '';
    const endStr =
      t.planned_end || t.deadline ? (t.planned_end || t.deadline)!.slice(0, 10) : startStr;

    if (!startStr && !endStr) return false;
    if (startStr && !endStr) return startStr === targetDateStr;
    if (!startStr && endStr) return endStr === targetDateStr;
    return targetDateStr >= startStr && targetDateStr <= endStr;
  });
}

function getDailyAllocatedHours(task: Task, dateObj: Date): number | null {
  const dateStr = formatLocalDate(dateObj);
  if (task.schedules && task.schedules.length > 0) {
    const s = task.schedules.find((sch) => String(sch.schedule_date).slice(0, 10) === dateStr);
    if (s && Number(s.allocated_hours) > 0) {
      return Number(s.allocated_hours);
    }
  }
  return null;
}

function formatHours(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0';
  const num = Number(val);
  return parseFloat(num.toFixed(2)).toString();
}

function getTaskEffortBadgeText(task: Task, dateObj: Date): string {
  const dailyAlloc = getDailyAllocatedHours(task, dateObj);
  if (dailyAlloc !== null) {
    return `${formatHours(dailyAlloc)}h scheduled`;
  }
  if (task.expected_effort) {
    return `${formatHours(task.expected_effort)}h effort`;
  }
  return task.status ? task.status.replace(/_/g, ' ') : 'Task';
}

function getTaskCardStyle(task: Task) {
  const theme = getTaskPastelTheme(task);
  return {
    background: theme.bg,
    borderColor: theme.border,
    color: theme.text,
    borderLeft: `4px solid ${theme.badge}`,
  };
}

function getMonthTaskPillStyle(task: Task) {
  const theme = getTaskPastelTheme(task);
  return {
    background: theme.bg,
    color: theme.text,
    borderLeft: `3px solid ${theme.badge}`,
  };
}

const tableColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: 'title', align: 'left', sortable: true },
  { name: 'project', label: 'Project', field: 'project_name', align: 'left', sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'center', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  {
    name: 'dates',
    label: 'Timeline Dates',
    field: (row) => row.planned_start,
    align: 'left',
    sortable: true,
  },
  { name: 'progress', label: 'Progress', field: 'progress', align: 'left', sortable: true },
];

function getProjectName(projectId?: number) {
  if (!projectId) return 'General';
  const p = projects.value.find((proj) => Number(proj.project_id) === Number(projectId));
  return p ? p.name : `Project #${projectId}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

function formatStatus(status?: string): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ');
}

function getTaskStatusClass(status?: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'status-completed';
    case 'IN_PROGRESS':
      return 'status-in-progress';
    case 'SCHEDULED':
      return 'status-scheduled';
    default:
      return 'status-unassigned';
  }
}

function getPriorityClass(priority?: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'prio-critical';
    case 'HIGH':
      return 'prio-high';
    case 'MEDIUM':
      return 'prio-medium';
    default:
      return 'prio-low';
  }
}

function goToTask(taskId: number | string) {
  void router.push(`/app/resource-dashboard/task-details/${taskId}`);
}

// ----------------------------------------------------
// Real Backend Availability Integration ('me')
// ----------------------------------------------------
const availabilityMap = ref<Map<string, DailyAvailabilityDTO>>(new Map());
const availabilityLoading = ref(false);

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayAvailability(d: Date): DailyAvailabilityDTO | undefined {
  const dateStr = formatLocalDate(d);
  return availabilityMap.value.get(dateStr);
}

function getAvailBadgeColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'positive';
    case 'PARTIALLY_AVAILABLE':
      return 'cyan-8';
    case 'FULLY_BOOKED':
      return 'amber-9';
    case 'ON_LEAVE':
      return 'purple-8';
    case 'PARTIAL_LEAVE':
      return 'indigo-7';
    case 'HOLIDAY':
      return 'deep-orange-8';
    case 'NON_WORKING_DAY':
      return 'grey-7';
    default:
      return 'grey-6';
  }
}

function getAvailIcon(status: AvailabilityStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'check_circle';
    case 'PARTIALLY_AVAILABLE':
      return 'timelapse';
    case 'FULLY_BOOKED':
      return 'event_busy';
    case 'ON_LEAVE':
      return 'beach_access';
    case 'PARTIAL_LEAVE':
      return 'event_repeat';
    case 'HOLIDAY':
      return 'celebration';
    case 'NON_WORKING_DAY':
      return 'nightlight_round';
    default:
      return 'help_outline';
  }
}

function getAvailShortLabel(day: DailyAvailabilityDTO): string {
  switch (day.status) {
    case 'AVAILABLE':
      return `${formatHours(day.available_hours)}h Free`;
    case 'PARTIALLY_AVAILABLE':
      return `${formatHours(day.available_hours)}h Free`;
    case 'FULLY_BOOKED':
      return 'Booked';
    case 'ON_LEAVE':
      return 'On Leave';
    case 'PARTIAL_LEAVE':
      return `Leave (${formatHours(day.leave_hours)}h)`;
    case 'HOLIDAY':
      return 'Holiday';
    case 'NON_WORKING_DAY':
      return 'Off';
    default:
      return day.status;
  }
}

function getAvailTooltip(day: DailyAvailabilityDTO): string {
  switch (day.status) {
    case 'AVAILABLE':
      return `Available: ${formatHours(day.available_hours)}h capacity free`;
    case 'PARTIALLY_AVAILABLE':
      return `Partially available: ${formatHours(day.available_hours)}h free (${formatHours(day.allocated_hours)}h allocated)`;
    case 'FULLY_BOOKED':
      return `Fully booked: ${formatHours(day.allocated_hours)}h allocated of ${formatHours(day.daily_working_hours)}h`;
    case 'ON_LEAVE':
      return `On Leave: ${formatHours(day.leave_hours)}h full-day leave`;
    case 'PARTIAL_LEAVE':
      return `Partial leave: ${formatHours(day.leave_hours)}h leave (${formatHours(day.available_hours)}h available)`;
    case 'HOLIDAY':
      return `Company Holiday (0h working capacity)`;
    case 'NON_WORKING_DAY':
      return `Non-Working Day (Scheduled day off)`;
    default:
      return day.status;
  }
}

async function fetchAvailabilityForVisibleRange() {
  let startDateStr: string;
  let endDateStr: string;

  if (scheduleViewMode.value === 'day') {
    startDateStr = formatLocalDate(currentAnchorDate.value);
    endDateStr = startDateStr;
  } else if (scheduleViewMode.value === 'week') {
    const days = displayedDays.value;
    if (days.length > 0) {
      startDateStr = formatLocalDate(days[0]!);
      endDateStr = formatLocalDate(days[days.length - 1]!);
    } else {
      startDateStr = formatLocalDate(currentAnchorDate.value);
      endDateStr = startDateStr;
    }
  } else if (scheduleViewMode.value === 'month') {
    const matrixDays = monthMatrixDays.value;
    if (matrixDays.length > 0) {
      startDateStr = formatLocalDate(matrixDays[0]!.date);
      endDateStr = formatLocalDate(matrixDays[matrixDays.length - 1]!.date);
    } else {
      startDateStr = formatLocalDate(
        new Date(currentAnchorDate.value.getFullYear(), currentAnchorDate.value.getMonth(), 1),
      );
      endDateStr = formatLocalDate(
        new Date(currentAnchorDate.value.getFullYear(), currentAnchorDate.value.getMonth() + 1, 0),
      );
    }
  } else {
    // Gantt or Table view: fetch current month +/- 60-90 days to ensure full roadmap coverage
    const anchor = currentAnchorDate.value;
    startDateStr = formatLocalDate(new Date(anchor.getFullYear(), anchor.getMonth() - 2, 1));
    endDateStr = formatLocalDate(new Date(anchor.getFullYear(), anchor.getMonth() + 3, 0));
  }

  availabilityLoading.value = true;
  try {
    const res = await getResourceAvailabilityApi('me', startDateStr, endDateStr);
    const newMap = new Map<string, DailyAvailabilityDTO>();
    if (res && res.days) {
      for (const d of res.days) {
        newMap.set(d.date, d);
      }
    }
    availabilityMap.value = newMap;
  } catch (err) {
    console.error('Failed to load resource availability for schedule range:', err);
  } finally {
    availabilityLoading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const [tasksRes, projectsRes, holidaysRes] = await Promise.all([
      getTasksApi(),
      getProjectsApi(),
      getHolidaysApi().catch(() => []),
      fetchAvailabilityForVisibleRange(),
    ]);
    tasks.value = tasksRes || [];
    projects.value = projectsRes || [];
    holidays.value = holidaysRes || [];
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load schedule data',
    });
  } finally {
    loading.value = false;
  }
}

watch([currentAnchorDate, scheduleViewMode], () => {
  void fetchAvailabilityForVisibleRange();
});

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.schedule-page {
  padding: 20px 28px 36px;
  background: var(--wo-bg-page, #f8f9fa);
  min-height: 100vh;
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

/* ===================================================
   Calendar Toolbar & Filter Strip
   =================================================== */
.calendar-toolbar-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
}

.toolbar-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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
    font-size: 14.5px;
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
   Calendar Columns Layout (Week / Day)
   =================================================== */
.calendar-grid-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  overflow: hidden;
}

.calendar-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}

.calendar-columns-grid {
  display: grid;
  min-width: 850px;
  border-collapse: collapse;
}

.day-column-cell {
  border-right: 1px solid var(--wo-border-subtle, #eef0f4);
  display: flex;
  flex-direction: column;
  min-height: 480px;
  background: var(--wo-bg-card, #ffffff);

  &:last-child {
    border-right: none;
  }

  &.is-today-col {
    background: rgba(139, 111, 216, 0.03);
  }

  &.is-weekend-col {
    background: rgba(241, 245, 249, 0.35);
  }
}

.date-col-header {
  height: 52px;
  padding: 8px 10px;
  background: var(--wo-bg-page, #fafbfc);
  border-bottom: 1px solid var(--wo-border, #e5e7ec);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;

  .col-weekday-name {
    font-size: 12px;
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
    top: 3px;
    right: 5px;
    font-size: 8.5px;
    font-weight: 800;
    color: var(--wo-primary, #8b6fd8);
    background: rgba(139, 111, 216, 0.12);
    padding: 1px 3px;
    border-radius: 3px;
  }

  .avail-status-chip {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 8px !important;
    height: 15px !important;
    padding: 0 4px !important;
  }
}

.day-tasks-list {
  flex: 1;
}

/* ===================================================
   Calendar Task Card (Day / Week View)
   =================================================== */
.calendar-day-task-card {
  border-radius: 9px;
  border: 1px solid transparent;
  padding: 8px 10px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.12);
  }

  .card-top-row {
    margin-bottom: 2px;
  }

  .card-effort-badge {
    font-size: 10px;
    font-weight: 700;
    opacity: 0.85;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .block-priority-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;

    &.prio-dot-critical {
      background: #ef4444;
    }
    &.prio-dot-high {
      background: #f97316;
    }
    &.prio-dot-medium {
      background: #8b6fd8;
    }
    &.prio-dot-low {
      background: #10b981;
    }
  }

  .block-task-title {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
  }

  .block-project-name {
    font-size: 10.5px;
    opacity: 0.8;
  }

  .block-status-tag {
    font-size: 10px;
    font-weight: 600;
    text-transform: capitalize;
    opacity: 0.8;
  }

  .block-progress-pill {
    font-size: 10px;
    opacity: 0.9;
  }
}

.empty-day-state {
  opacity: 0.6;
}

/* ===================================================
   Month Matrix Grid View
   =================================================== */
.month-grid-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  overflow: hidden;
}

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
  min-height: 500px;

  .month-day-cell {
    min-height: 95px;
    border-right: 1px solid var(--wo-border-subtle, #f0f2f5);
    border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
    padding: 6px;
    display: flex;
    flex-direction: column;

    &.is-other-month {
      background: rgba(248, 250, 252, 0.4);
      .m-day-number {
        opacity: 0.35;
      }
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
    max-height: 70px;
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

.table-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  overflow: hidden;
}

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

.status-completed {
  background: rgba(19, 174, 118, 0.12);
  color: #13ae76;
}

.status-in-progress {
  background: rgba(46, 144, 250, 0.12);
  color: #2e90fa;
}

.status-scheduled {
  background: rgba(139, 111, 216, 0.12);
  color: #8b6fd8;
}

.status-unassigned {
  background: #f1f3f7;
  color: #64748b;
}

.prio-critical {
  background: rgba(237, 91, 103, 0.12);
  color: #ed5b67;
}

.prio-high {
  background: rgba(242, 138, 23, 0.12);
  color: #f28a17;
}

.prio-medium {
  background: rgba(139, 111, 216, 0.12);
  color: #8b6fd8;
}

.prio-low {
  background: rgba(19, 174, 118, 0.12);
  color: #13ae76;
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
</style>
