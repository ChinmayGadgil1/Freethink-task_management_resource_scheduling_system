<template>
  <q-card flat bordered class="dhtmlx-roadmap-card">
    <!-- 1. GANTT HEADER ROW -->
    <div class="gantt-header-row row items-center justify-between wrap q-px-md q-py-sm gap-sm">
      <!-- Left: Title, Icon & Dynamic Date Range -->
      <div class="header-left-block row items-center no-wrap">
        <div class="gantt-brand-icon q-mr-sm">
          <span class="bar bar-1"></span>
          <span class="bar bar-2"></span>
          <span class="bar bar-3"></span>
        </div>
        <div>
          <div class="gantt-title-text">{{ title }}</div>
          <div class="gantt-date-range-sub">{{ displayDateRange }}</div>
        </div>
      </div>

      <!-- Right: Search, Scale Selectors, Tree Expand/Collapse, Today, Links Toggle -->
      <div class="header-right-controls row items-center q-gutter-x-xs wrap">
        <!-- Search Input -->
        <q-input
          v-model="internalSearchQuery"
          dense
          outlined
          placeholder="Search tasks..."
          class="gantt-search-input"
          clearable
        >
          <template #prepend>
            <q-icon name="search" size="16px" color="grey-6" />
          </template>
        </q-input>

        <!-- Scale Toggle Group: Hour | Day | Week | Month -->
        <div class="scale-toggle-group row items-center no-wrap">
          <!-- <button
            type="button"
            class="scale-btn"
            :class="{ active: activeScale === 'hour' }"
            @click="setScale('hour')"
          >
            Hour
          </button> -->
          <button
            type="button"
            class="scale-btn"
            :class="{ active: activeScale === 'day' }"
            @click="setScale('day')"
          >
            Day
          </button>
          <button
            type="button"
            class="scale-btn"
            :class="{ active: activeScale === 'week' }"
            @click="setScale('week')"
          >
            Week
          </button>
          <button
            type="button"
            class="scale-btn"
            :class="{ active: activeScale === 'month' }"
            @click="setScale('month')"
          >
            Month
          </button>
        </div>

        <!-- Hierarchy Mode Toggle -->
        <button
          type="button"
          class="ctrl-pill-btn hierarchy-btn row items-center no-wrap"
          :class="{ 'is-active-pill': isHierarchical }"
          title="Toggle Project Hierarchy"
          @click="toggleHierarchy"
        >
          <q-icon name="account_tree" size="14px" class="q-mr-xs text-purple-7" />
          <span>{{ isHierarchical ? 'Projects' : 'Flat' }}</span>
        </button>

        <!-- Columns Toggle (Status, Priority, Duration) -->
        <button
          type="button"
          class="ctrl-pill-btn columns-toggle-btn row items-center no-wrap"
          :class="{ 'is-active-pill': showExtraColumns }"
          :title="
            showExtraColumns
              ? 'Collapse Status, Priority & Duration columns'
              : 'Expand Status, Priority & Duration columns'
          "
          @click="toggleExtraColumns"
        >
          <q-icon
            :name="showExtraColumns ? 'view_week' : 'view_column'"
            size="14px"
            class="q-mr-xs text-purple-7"
          />
          <span>{{ showExtraColumns ? 'Columns On' : 'Columns Off' }}</span>
          <q-icon
            :name="showExtraColumns ? 'chevron_left' : 'chevron_right'"
            size="14px"
            class="q-ml-xs text-grey-7"
          />
        </button>

        <!-- Expand / Collapse All (when hierarchical) -->
        <template v-if="isHierarchical">
          <button
            type="button"
            class="ctrl-icon-pill-btn"
            title="Expand All Projects"
            @click="expandAll"
          >
            <q-icon name="unfold_more" size="15px" color="grey-8" />
          </button>
          <button
            type="button"
            class="ctrl-icon-pill-btn"
            title="Collapse All Projects"
            @click="collapseAll"
          >
            <q-icon name="unfold_less" size="15px" color="grey-8" />
          </button>
        </template>

        <!-- Today Button (Visible ONLY in Day view scale) -->
        <button
          v-if="activeScale === 'day'"
          type="button"
          class="ctrl-pill-btn today-btn row items-center no-wrap"
          @click="scrollToToday"
        >
          <q-icon name="gps_fixed" size="14px" class="q-mr-xs text-purple-7" />
          <span>Today</span>
        </button>

        <!-- Links Toggle Button -->
        <button
          type="button"
          class="ctrl-pill-btn links-btn row items-center no-wrap"
          :class="{ 'links-active': showDependencies }"
          @click="toggleDependencies"
        >
          <q-icon name="link" size="15px" class="q-mr-xs text-indigo-7" />
          <span>{{ showDependencies ? 'Links On' : 'Links Off' }}</span>
        </button>
      </div>
    </div>

    <!-- 2. SUBHEADER LEGEND ROW -->
    <div class="gantt-legend-row row items-center justify-between q-px-md q-py-xs wrap gap-sm">
      <!-- Left: Timeline Line & Shading Guide -->
      <div class="legend-guide-list row items-center q-gutter-x-md text-caption wrap">
        <!-- Leave Indicator -->
        <div
          v-if="isResourceView || (availability && availability.length > 0)"
          class="legend-item row items-center no-wrap"
          title="Approved Leave (Teal dashed vertical line & highlight in Day view)"
        >
          <span class="legend-line-sample sample-leave q-mr-xs"></span>
          <span class="text-cyan-9 text-weight-bold">Leave</span>
        </div>

        <!-- Non-Working / Weekend -->
        <div
          v-if="isResourceView || (availability && availability.length > 0)"
          class="legend-item row items-center no-wrap"
          title="Non-working day / Weekend off (Muted slate shading in Day view)"
        >
          <span class="legend-box-sample sample-nwd q-mr-xs"></span>
          <span class="text-grey-7">Off-Day</span>
        </div>

        <span
          v-if="activeScale !== 'day' && activeScale !== 'hour'"
          class="text-caption text-grey-5 q-ml-xs"
        >
          (Switch to Day view to see vertical holiday &amp; leave markers)
        </span>
      </div>

      <!-- Right: Priority Dots, Status & Dependency -->
      <div class="legend-priority-list row items-center q-gutter-x-md text-caption wrap">
        <span class="legend-label text-weight-bold">Tasks:</span>
        <div class="legend-item row items-center no-wrap" title="Low Priority">
          <span class="p-dot dot-low q-mr-xs"></span>
          <span>Low</span>
        </div>
        <div class="legend-item row items-center no-wrap" title="Medium Priority">
          <span class="p-dot dot-medium q-mr-xs"></span>
          <span>Med</span>
        </div>
        <div class="legend-item row items-center no-wrap" title="High Priority">
          <span class="p-dot dot-high q-mr-xs"></span>
          <span>High</span>
        </div>
        <div class="legend-item row items-center no-wrap" title="Critical Priority">
          <span class="p-dot dot-critical q-mr-xs"></span>
          <span class="text-red-9 text-weight-bold">Critical</span>
        </div>

        <!-- Status: Completed -->
        <div class="legend-item row items-center no-wrap" title="Completed Task (100% Progress)">
          <span class="p-dot dot-completed q-mr-xs"></span>
          <span class="text-positive text-weight-bold">Completed</span>
        </div>

        <!-- Predecessor Dependency Line Indicator -->
        <div
          class="legend-dependency-indicator row items-center no-wrap"
          title="Task dependency link"
        >
          <q-icon name="trending_flat" size="16px" class="q-mr-xs text-indigo-7" />
          <span class="text-indigo-8 text-weight-medium">Dependency</span>
        </div>
      </div>
    </div>

    <q-separator class="header-divider" />

    <!-- 3. DHTMLX GANTT CANVAS MOUNT -->
    <div class="gantt-canvas-wrapper" :class="{ 'is-dark': isDark }">
      <div ref="ganttContainer" class="gantt-chart-viewport" />

      <!-- Empty State Overlay -->
      <div v-if="!hasTasks" class="gantt-no-data-overlay flex flex-center column q-pa-xl">
        <q-avatar size="54px" class="avatar-purple q-mb-sm">
          <q-icon name="search_off" size="26px" />
        </q-avatar>
        <div class="text-subtitle1 text-weight-bold text-dark">No tasks to display</div>
        <div class="text-caption text-grey-6 text-center q-mt-xs" style="max-width: 320px">
          Try clearing search keywords or adjusting your schedule filters to view tasks.
        </div>
      </div>
    </div>

    <!-- 4. GANTT FOOTER ROW -->
    <div class="gantt-footer-row row items-center justify-between q-px-md q-py-sm">
      <div class="footer-left row items-center no-wrap">
        <q-icon name="check_circle" size="15px" color="positive" class="q-mr-xs" />
        <span class="text-positive text-caption text-weight-medium">
          Interactive timeline with actual scheduled work segments &amp; dependencies
        </span>
      </div>

      <div class="footer-right row items-center no-wrap text-caption text-grey-6 q-gutter-x-sm">
        <span
          >Scale: <strong class="text-uppercase text-grey-8">{{ activeScale }}</strong></span
        >
        <span>Showing {{ visibleCount }} of {{ totalCount }} tasks</span>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import type {
  Task,
  Project,
  ResourceUser,
  HolidayItem,
  DailyAvailabilityDTO,
  LeaveResponseDTO,
  TaskScheduleItem,
} from '@/services/api';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { isVerificationTask } from '@/utils/taskHelpers';

export interface GanttTimelineProps {
  tasks: Task[];
  projects?: Project[];
  resources?: ResourceUser[];
  holidays?: HolidayItem[] | Array<{ holiday_date: string; description?: string }>;
  availability?: DailyAvailabilityDTO[];
  globalLeaves?: LeaveResponseDTO[];
  isResourceView?: boolean;
  title?: string;
  initialScale?: 'hour' | 'day' | 'week' | 'month';
  groupByProject?: boolean;
}

export interface TaskWorkSegment {
  startDate: Date;
  endDate: Date;
  startStr: string;
  endStr: string;
  durationDays: number;
  allocatedHours: number;
  daysCount: number;
  isFirstHalf?: boolean;
  isSecondHalf?: boolean;
}

export interface DhtmlxGanttTaskItem {
  id: string | number;
  text: string;
  start_date: string | Date;
  end_date: string | Date;
  duration?: number;
  duration_hours?: number;
  progress?: number;
  parent?: string | number;
  type?: 'project' | 'task' | 'milestone';
  open?: boolean;
  priority?: string;
  status?: string;
  project_name?: string;
  project_id?: number;
  assignee_name?: string;
  supervisor_id?: number | null;
  supervisor_name?: string | null;
  is_supervised?: boolean;
  expected_effort?: number;
  total_expected_effort?: number;
  base_expected_effort?: number;
  assignees_count?: number;
  effort_per_assignee?: number;
  actual_effort?: number;
  supervisor_effort?: number;
  task_count?: number;
  segments?: TaskWorkSegment[];
  total_hours?: number;
  is_segmented?: boolean;
  is_external?: boolean;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  $open?: boolean;
}

interface GanttMarkerExtension {
  addMarker?: (marker: Record<string, unknown>) => string | number;
  deleteMarker?: (id: string | number) => void;
  renderMarkers?: () => void;
}

const props = withDefaults(defineProps<GanttTimelineProps>(), {
  projects: () => [],
  resources: () => [],
  holidays: () => [],
  availability: () => [],
  isResourceView: false,
  title: 'Gantt Timeline Roadmap',
  initialScale: 'week',
  groupByProject: true,
});

const emit = defineEmits<{
  (e: 'task-click', task: Task): void;
  (
    e: 'task-updated',
    event: { taskId: number; title: string; startDate: string; endDate: string; progress: number },
  ): void;
  (e: 'link-added', event: { sourceTaskId: number; targetTaskId: number }): void;
  (e: 'date-range-changed', rangeText: string): void;
}>();

const themeStore = useThemeStore();
const authStore = useAuthStore();
const isDark = computed(() => themeStore.isDark);

const holidayDateSet = computed(() => {
  const set = new Set<string>();
  if (props.holidays) {
    for (const h of props.holidays) {
      if (h && h.holiday_date) {
        set.add(String(h.holiday_date).split('T')[0]!);
      }
    }
  }
  return set;
});

const availabilityMap = computed(() => {
  const map = new Map<string, DailyAvailabilityDTO>();
  if (props.availability) {
    for (const a of props.availability) {
      if (a && a.date) {
        map.set(String(a.date).split('T')[0]!, a);
      }
    }
  }
  return map;
});

const customMarkerIds = ref<(string | number)[]>([]);

const ganttContainer = ref<HTMLElement | null>(null);
const internalSearchQuery = ref('');
const STORAGE_KEY_SCALE = 'taskflow_gantt_scale';
const storedScale = localStorage.getItem(STORAGE_KEY_SCALE) as
  'hour' | 'day' | 'week' | 'month' | null;
const activeScale = ref<'hour' | 'day' | 'week' | 'month'>(storedScale || props.initialScale);

watch(activeScale, (newScale) => {
  if (newScale) {
    localStorage.setItem(STORAGE_KEY_SCALE, newScale);
  }
});
const isHierarchical = ref(props.groupByProject);
const showDependencies = ref(true);
const displayDateRange = ref('');
const hasTasks = ref(true);

// Cache maps for lookup
const resourceMap = computed(() => {
  const map = new Map<number, ResourceUser>();
  props.resources.forEach((r) => map.set(r.user_id, r));
  return map;
});

const projectMap = computed(() => {
  const map = new Map<number, Project>();
  props.projects.forEach((p) => map.set(p.project_id, p));
  return map;
});

const validGanttTasks = computed(() =>
  (props.tasks || []).filter((t) => !isVerificationTask(t) && t.status !== 'UNASSIGNED'),
);
const totalCount = computed(() => validGanttTasks.value.length);
const visibleCount = ref(0);
const showExtraColumns = ref(false); // Collapsed/compact by default (only TASK & PROJECT visible)
const projectOpenStates = ref<Record<string, boolean>>({});

// ----------------------------------------------------
// Date & Segmentation Utilities
// ----------------------------------------------------
function parseDateLocal(dateStr: string): Date | null {
  const cleanStr = String(dateStr).split('T')[0]!;
  if (!cleanStr || cleanStr === 'null' || cleanStr === 'undefined') return null;
  const parts = cleanStr.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10) - 1;
  const d = parseInt(parts[2]!, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1970 || y > 9999) return null;
  const result = new Date(y, m, d, 0, 0, 0, 0);
  return isNaN(result.getTime()) ? null : result;
}

function isValidDate(d: Date | null | undefined): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

function parseIsoToDate(val: string | Date | undefined | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isValidDate(val) ? new Date(val.getTime()) : null;

  // Reject obviously invalid strings before parsing
  const str = String(val).trim();
  if (!str || str === 'null' || str === 'undefined' || str.startsWith('0000')) return null;

  // If it's a date-only string like YYYY-MM-DD, parse locally first to avoid UTC midnight drift
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const local = parseDateLocal(str);
    if (isValidDate(local)) return local;
  }

  // Try native parse first for exact datetime
  const d = new Date(str.replace(' ', 'T'));
  if (isValidDate(d)) return d;

  const local = parseDateLocal(str);
  return isValidDate(local) ? local : null;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d.getTime());
  res.setDate(res.getDate() + days);
  return res;
}

function snapToGanttWorkTime(d: Date | null): Date | null {
  if (!d) return null;
  const next = new Date(d.getTime());
  const h = next.getHours();
  if (h >= 18) {
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  } else if (h < 10) {
    next.setHours(10, 0, 0, 0);
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  }
  return next;
}

function addWorkingHours(startDate: Date, hours: number): Date {
  const result = new Date(startDate.getTime());
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
    result.setHours(10, 0, 0, 0);
  }
  if (result.getHours() < 10) {
    result.setHours(10, 0, 0, 0);
  } else if (result.getHours() >= 18) {
    result.setDate(result.getDate() + 1);
    result.setHours(10, 0, 0, 0);
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }
  }

  let remainingHours = hours;
  while (remainingHours > 0) {
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
      result.setHours(10, 0, 0, 0);
    }

    const currentHourDecimal =
      result.getHours() + result.getMinutes() / 60 + result.getSeconds() / 3600;
    const hoursLeftToday = Math.max(0, 18 - currentHourDecimal);

    if (remainingHours <= hoursLeftToday) {
      const finishDecimal = currentHourDecimal + remainingHours;
      const h = Math.floor(finishDecimal);
      const m = Math.floor((finishDecimal - h) * 60);
      const s = Math.round(((finishDecimal - h) * 60 - m) * 60);
      result.setHours(h, m, s, 0);
      remainingHours = 0;
    } else {
      remainingHours -= hoursLeftToday;
      result.setDate(result.getDate() + 1);
      result.setHours(10, 0, 0, 0);
    }
  }

  return result;
}

function getMacroDate(d: Date | null, isStart: boolean): Date | null {
  if (!d) return null;
  const next = new Date(d.getTime());
  if (isStart) {
    if (next.getHours() <= 10) {
      next.setHours(0, 0, 0, 0);
    } else if (next.getHours() >= 11 && next.getHours() <= 15) {
      // Half-day start: starts in the second half (at 12:00 = 50% of the day cell)
      next.setHours(12, 0, 0, 0);
    }
  } else {
    if (next.getHours() >= 17) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    } else if (next.getHours() >= 11 && next.getHours() <= 15) {
      // Half-day end: ends in the first half (at 12:00 = 50% of the day cell)
      next.setHours(12, 0, 0, 0);
    }
  }
  return next;
}

/**
 * Determines whether a task allocation on a specific date is on the 'first' half,
 * 'second' half, or 'full' day.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolveTaskDateHalf(
  task: Task,
  dateStr: string,
  isStartDay: boolean,
  isSingleDay: boolean,
): 'first' | 'second' | 'full' {
  if (!task || !dateStr) return 'full';

  // 1. Check explicit planned/actual start/end times
  const pStart = parseIsoToDate(task.actual_start || task.planned_start);
  const pEnd = parseIsoToDate(task.actual_end || task.planned_end);

  if (isSingleDay) {
    if (pStart && formatDateIso(pStart) === dateStr) {
      const startH = pStart.getHours();
      if (startH >= 12) return 'second';
    }
    if (pEnd && formatDateIso(pEnd) === dateStr) {
      const endH = pEnd.getHours();
      if (endH >= 11 && endH <= 14) return 'first';
    }
  } else {
    if (isStartDay && pStart && formatDateIso(pStart) === dateStr) {
      const h = pStart.getHours();
      if (h >= 12) return 'second';
    }
    if (!isStartDay && pEnd && formatDateIso(pEnd) === dateStr) {
      const h = pEnd.getHours();
      if (h >= 11 && h <= 14) return 'first';
      if (h >= 17) return 'full';
    }
  }

  // 2. Check resource availability/leave for this date
  const avail = availabilityMap.value.get(dateStr);
  if (avail) {
    const isSecondHalfLeave =
      avail.leave_type === 'SECOND_HALF' ||
      String(avail.leave_type || '')
        .toUpperCase()
        .includes('SECOND') ||
      String(avail.leave_type || '')
        .toUpperCase()
        .includes('2');
    const isFirstHalfLeave =
      avail.leave_type === 'FIRST_HALF' ||
      String(avail.leave_type || '')
        .toUpperCase()
        .includes('FIRST') ||
      String(avail.leave_type || '')
        .toUpperCase()
        .includes('1');

    if (isFirstHalfLeave) {
      // User on leave in 1st half -> task allocation must be in 2nd half
      return 'second';
    }
    if (isSecondHalfLeave) {
      // User on leave in 2nd half -> task allocation must be in 1st half
      return 'first';
    }
  }

  // 3. Check task schedules for this date
  const sched = (task.schedules || []).find(
    (s) => s && s.schedule_date && String(s.schedule_date).split('T')[0] === dateStr,
  );
  if (sched && Number(sched.allocated_hours) > 0 && Number(sched.allocated_hours) <= 4) {
    const tasksOnDate = (props.tasks || []).filter((t) =>
      (t.schedules || []).some(
        (s) =>
          s &&
          s.schedule_date &&
          String(s.schedule_date).split('T')[0] === dateStr &&
          Number(s.allocated_hours) > 0,
      ),
    );
    if (tasksOnDate.length > 1) {
      const sorted = [...tasksOnDate].sort((a, b) => {
        const startA = a.actual_start || a.planned_start || '';
        const startB = b.actual_start || b.planned_start || '';
        if (startA && startB && startA !== startB) return startA.localeCompare(startB);
        return Number(a.task_id) - Number(b.task_id);
      });
      const index = sorted.findIndex((t) => t.task_id === task.task_id);
      if (index === 0) return 'first';
      return 'second';
    }

    if (isSingleDay) {
      return 'first';
    }

    const totalSchedHours = (task.schedules || []).reduce(
      (sum, s) => sum + Number(s.allocated_hours || 0),
      0,
    );
    if (isStartDay && totalSchedHours > Number(sched.allocated_hours)) {
      return 'second';
    }
    if (!isStartDay && totalSchedHours > Number(sched.allocated_hours)) {
      return 'first';
    }

    return isStartDay ? 'second' : 'first';
  }

  return 'full';
}

function normalizeTimeToDay(d: Date): Date {
  const h = d.getHours();
  const m = d.getMinutes();

  if (h === 0 && m === 0) return new Date(d); // Already midnight, likely a full day or snapped date

  let decimalHours = h + m / 60;

  // Clamp to 10 - 18
  if (decimalHours < 10) decimalHours = 10;
  if (decimalHours > 18) decimalHours = 18;

  // Map 10-18 to 0-24
  const fraction = (decimalHours - 10) / 8; // 0.0 to 1.0
  const mappedHours = fraction * 24; // 0.0 to 24.0

  const mappedH = Math.floor(mappedHours);
  const mappedM = Math.round((mappedHours - mappedH) * 60);

  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), mappedH, mappedM, 0);
  return next;
}

function computeTaskGanttDates(
  t: Task,
  tStart: Date,
  tEnd: Date,
  segments: TaskWorkSegment[],
  targetDurationHours?: number,
): { start: Date; end: Date } {
  let effectiveStart = new Date(tStart.getTime());
  let effectiveEnd: Date;

  const plannedStartParsed = parseIsoToDate(t.actual_start || t.planned_start);
  const plannedEndParsed = parseIsoToDate(t.actual_end || t.planned_end);

  if (plannedStartParsed && isValidDate(plannedStartParsed)) {
    effectiveStart = plannedStartParsed;
  } else {
    if (effectiveStart.getHours() === 0 && effectiveStart.getMinutes() === 0) {
      effectiveStart.setHours(10, 0, 0, 0);
    }
  }

  if (
    plannedEndParsed &&
    isValidDate(plannedEndParsed) &&
    plannedEndParsed.getTime() > effectiveStart.getTime()
  ) {
    effectiveEnd = plannedEndParsed;
  } else if (targetDurationHours !== undefined && targetDurationHours > 0) {
    effectiveEnd = addWorkingHours(effectiveStart, targetDurationHours);
  } else if (segments.length > 0) {
    effectiveEnd = new Date(tEnd.getTime());
  } else {
    effectiveEnd = addWorkingHours(effectiveStart, Number(t.expected_effort) || 8);
  }

  const resolveStart = (d: Date | null) => {
    if (!d) return null;
    if (activeScale.value === 'hour') {
      return snapToGanttWorkTime(d);
    }
    return normalizeTimeToDay(d);
  };

  const resolveEnd = (d: Date | null) => {
    if (!d) return null;
    if (activeScale.value === 'hour') {
      if (d.getHours() === 0 && d.getMinutes() === 0) {
        const prevDay = addDays(d, -1);
        return new Date(prevDay.getFullYear(), prevDay.getMonth(), prevDay.getDate(), 18, 0, 0);
      }
      if (d.getHours() === 18 && d.getMinutes() === 0) {
        return new Date(d.getTime());
      }
      return snapToGanttWorkTime(d);
    }
    return normalizeTimeToDay(d);
  };

  let resolvedStart = resolveStart(effectiveStart) ?? effectiveStart;
  let resolvedEnd = resolveEnd(effectiveEnd) ?? effectiveEnd;

  if (!isValidDate(resolvedStart)) {
    resolvedStart = new Date(effectiveStart.getTime());
    if (isNaN(resolvedStart.getTime())) {
      resolvedStart = new Date();
      resolvedStart.setHours(0, 0, 0, 0);
    }
  }

  if (!isValidDate(resolvedEnd) || resolvedEnd.getTime() <= resolvedStart.getTime()) {
    resolvedEnd = new Date(resolvedStart.getTime() + 12 * 60 * 60 * 1000);
  }

  return { start: resolvedStart, end: resolvedEnd };
}

function formatDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatGanttDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculates continuous work segments from task_schedules, creating gaps on
 * non-working days, holidays, weekends, leave, or 0-allocation dates.
 */
function getTaskWorkSegments(task: Task): {
  segments: TaskWorkSegment[];
  earliestStart: Date;
  latestEnd: Date;
  totalHours: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validSchedules = (task.schedules || [])
    .filter((s) => Number(s.allocated_hours) > 0 && !!s.schedule_date)
    .sort((a, b) => {
      const dateA = String(a.schedule_date).split('T')[0]!;
      const dateB = String(b.schedule_date).split('T')[0]!;
      return dateA.localeCompare(dateB);
    });

  if (validSchedules.length > 0) {
    // Aggregate by date: for concurrent assignees on the same date,
    // the working duration on that date is max(assignee_allocations).
    // Summing max allocations across distinct working dates gives the true working duration.
    const dateMap = new Map<string, number>();
    for (const s of validSchedules) {
      const dStr = String(s.schedule_date).split('T')[0]!;
      const hrs = Number(s.allocated_hours) || 0;
      dateMap.set(dStr, Math.max(dateMap.get(dStr) || 0, hrs));
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const segments: TaskWorkSegment[] = [];
    let currentSegDates: string[] = [];

    for (let i = 0; i < sortedDates.length; i++) {
      const currDateStr = sortedDates[i]!;
      const currDate = parseDateLocal(currDateStr);
      if (!currDate) continue;

      if (currentSegDates.length === 0) {
        currentSegDates.push(currDateStr);
      } else {
        const lastDateStr = currentSegDates[currentSegDates.length - 1]!;
        const lastDate = parseDateLocal(lastDateStr);
        if (!lastDate) {
          currentSegDates = [currDateStr];
          continue;
        }
        const expectedNextDateStr = formatDateIso(addDays(lastDate, 1));

        const checkHalfDay = (dateStr: string) => {
          // In Resource View, availabilityMap tells us exactly what THIS resource is doing
          const avail = availabilityMap.value.get(dateStr);
          if (avail) {
            const type = String(avail.leave_type || '').toUpperCase();
            if (
              type.includes('FIRST') ||
              type.includes('1') ||
              type.includes('SECOND') ||
              type.includes('2')
            ) {
              return {
                isFirst: type.includes('FIRST') || type.includes('1'),
                isSecond: type.includes('SECOND') || type.includes('2'),
              };
            }
            return { isFirst: false, isSecond: false };
          }

          // In Global View, determine if the task as a whole has a gap
          if (props.globalLeaves && props.globalLeaves.length > 0) {
            const assignees = task.assigned_resource_ids || [];
            if (assignees.length === 0) return { isFirst: false, isSecond: false };

            let worksFirstHalf = false;
            let worksSecondHalf = false;

            for (const assignee of assignees) {
              const leave = props.globalLeaves.find(
                (l: LeaveResponseDTO) =>
                  l.user_id === assignee && String(l.leave_date).startsWith(dateStr),
              );
              if (!leave) {
                worksFirstHalf = true;
                worksSecondHalf = true;
              } else {
                const type = String(leave.leave_type || '').toUpperCase();
                if (type === 'FULL_DAY') {
                  // Works neither
                } else if (type.includes('FIRST') || type.includes('1')) {
                  // First half LEAVE -> Works SECOND half
                  worksSecondHalf = true;
                } else if (type.includes('SECOND') || type.includes('2')) {
                  // Second half LEAVE -> Works FIRST half
                  worksFirstHalf = true;
                } else {
                  worksFirstHalf = true;
                  worksSecondHalf = true;
                }
              }
            }

            if (worksSecondHalf && !worksFirstHalf) {
              return { isFirst: true, isSecond: false }; // First half gap
            }
            if (worksFirstHalf && !worksSecondHalf) {
              return { isFirst: false, isSecond: true }; // Second half gap
            }
          }

          return { isFirst: false, isSecond: false };
        };

        const currHalf = checkHalfDay(currDateStr);
        const lastHalf = checkHalfDay(lastDateStr);

        const currIsHalf = currHalf.isFirst || currHalf.isSecond;
        const lastIsHalf = lastHalf.isFirst || lastHalf.isSecond;

        if (currDateStr === expectedNextDateStr && !currIsHalf && !lastIsHalf) {
          currentSegDates.push(currDateStr);
        } else {
          // Gap detected (weekend, holiday, leave, non-working day, or half day break)
          const segStartStr = currentSegDates[0]!;
          const segEndStr = lastDateStr;
          const segStartDate = parseDateLocal(segStartStr);
          const rawSegEnd = parseDateLocal(segEndStr);
          if (segStartDate && rawSegEnd) {
            const segEndDate = addDays(rawSegEnd, 1);
            const segHours = currentSegDates.reduce((sum, d) => sum + (dateMap.get(d) || 0), 0);

            // The segment inherits the half-day properties of its first day
            const segHalfProps = checkHalfDay(segStartStr);

            segments.push({
              startDate: segStartDate,
              endDate: segEndDate,
              startStr: segStartStr,
              endStr: segEndStr,
              durationDays: Math.max(
                1,
                Math.round((segEndDate.getTime() - segStartDate.getTime()) / (24 * 60 * 60 * 1000)),
              ),
              allocatedHours: Math.round(segHours * 10) / 10,
              daysCount: currentSegDates.length,
              isFirstHalf: segHalfProps.isFirst,
              isSecondHalf: segHalfProps.isSecond,
            });
          }
          currentSegDates = [currDateStr];
        }
      }
    }

    if (currentSegDates.length > 0) {
      const segStartStr = currentSegDates[0]!;
      const segEndStr = currentSegDates[currentSegDates.length - 1]!;
      const segStartDate = parseDateLocal(segStartStr);
      const rawSegEnd = parseDateLocal(segEndStr);

      if (segStartDate && rawSegEnd) {
        const segEndDate = addDays(rawSegEnd, 1);
        const segHours = currentSegDates.reduce((sum, d) => sum + (dateMap.get(d) || 0), 0);

        const checkHalfDay = (dateStr: string) => {
          const avail = availabilityMap.value.get(dateStr);
          if (avail) {
            const type = String(avail.leave_type || '').toUpperCase();
            if (
              type.includes('FIRST') ||
              type.includes('1') ||
              type.includes('SECOND') ||
              type.includes('2')
            ) {
              return {
                isFirst: type.includes('FIRST') || type.includes('1'),
                isSecond: type.includes('SECOND') || type.includes('2'),
              };
            }
            return { isFirst: false, isSecond: false };
          }

          if (props.globalLeaves && props.globalLeaves.length > 0) {
            const assignees = task.assigned_resource_ids || [];
            if (assignees.length === 0) return { isFirst: false, isSecond: false };

            let worksFirstHalf = false;
            let worksSecondHalf = false;

            for (const assignee of assignees) {
              const leave = props.globalLeaves.find(
                (l: LeaveResponseDTO) =>
                  l.user_id === assignee && String(l.leave_date).startsWith(dateStr),
              );
              if (!leave) {
                worksFirstHalf = true;
                worksSecondHalf = true;
              } else {
                const type = String(leave.leave_type || '').toUpperCase();
                if (type === 'FULL_DAY') {
                  // Works neither
                } else if (type.includes('FIRST') || type.includes('1')) {
                  worksSecondHalf = true;
                } else if (type.includes('SECOND') || type.includes('2')) {
                  worksFirstHalf = true;
                } else {
                  worksFirstHalf = true;
                  worksSecondHalf = true;
                }
              }
            }

            if (worksSecondHalf && !worksFirstHalf) {
              return { isFirst: true, isSecond: false };
            }
            if (worksFirstHalf && !worksSecondHalf) {
              return { isFirst: false, isSecond: true };
            }
          }

          return { isFirst: false, isSecond: false };
        };
        const segHalfProps = checkHalfDay(segStartStr);

        segments.push({
          startDate: segStartDate,
          endDate: segEndDate,
          startStr: segStartStr,
          endStr: segEndStr,
          durationDays: Math.max(
            1,
            Math.round((segEndDate.getTime() - segStartDate.getTime()) / (24 * 60 * 60 * 1000)),
          ),
          allocatedHours: Math.round(segHours * 10) / 10,
          daysCount: currentSegDates.length,
          isFirstHalf: segHalfProps.isFirst,
          isSecondHalf: segHalfProps.isSecond,
        });
      }
    }

    if (segments.length > 0) {
      const earliestStart = segments[0]!.startDate;
      const latestEnd = segments[segments.length - 1]!.endDate;
      const totalHours = segments.reduce((sum, s) => sum + s.allocatedHours, 0);

      return {
        segments,
        earliestStart,
        latestEnd,
        totalHours: Math.round(totalHours * 10) / 10,
      };
    }
  }

  // Fallback: No schedule allocations yet (e.g. unassigned or pending recalculation)
  const rawStart = task.planned_start || task.actual_start || task.start_date;
  const rawEnd = task.planned_end || task.deadline || task.actual_end;
  const startDate = (rawStart ? parseIsoToDate(rawStart) : null) ?? today;
  startDate.setHours(0, 0, 0, 0);

  const rawEndDate = (rawEnd ? parseIsoToDate(rawEnd) : null) ?? addDays(startDate, 1);
  rawEndDate.setHours(0, 0, 0, 0);

  const endDate =
    rawEndDate.getTime() <= startDate.getTime() ? addDays(startDate, 1) : addDays(rawEndDate, 1);

  const durationDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
  );

  // If multiple assignees, fallback working duration is divided by assignee count
  const rawAssignees = (task as unknown as Record<string, unknown>).assigned_resource_ids;
  let numAssignees = 1;
  if (Array.isArray(rawAssignees)) {
    numAssignees = Math.max(1, rawAssignees.length);
  } else if (typeof rawAssignees === 'string' && rawAssignees.trim()) {
    numAssignees = Math.max(1, rawAssignees.split(',').filter((s) => s.trim().length > 0).length);
  }
  const totalEffort = Number(task.expected_effort) || 0;
  const fallbackHours = Number((totalEffort / numAssignees).toFixed(2));

  const singleSegment: TaskWorkSegment = {
    startDate,
    endDate,
    startStr: formatDateIso(startDate),
    endStr: formatDateIso(addDays(endDate, -1)),
    durationDays,
    allocatedHours: fallbackHours,
    daysCount: durationDays,
  };

  return {
    segments: [singleSegment],
    earliestStart: startDate,
    latestEnd: endDate,
    totalHours: fallbackHours,
  };
}

// ----------------------------------------------------
// DHTMLX Configuration & Column Definitions
// ----------------------------------------------------
function applyColumnsConfig() {
  const baseColumn = {
    name: 'text',
    label: 'TASK & PROJECT',
    tree: true,
    width: showExtraColumns.value ? 190 : 250,
    min_width: 180,
    resize: true,
    template: (task: DhtmlxGanttTaskItem) => {
      const text = escapeHtml(task.text || '');
      if (task.type === 'project') {
        const count = task.task_count || 0;
        return (
          `<div class="gantt-col-project" title="${text}">` +
          `<span class="project-icon-badge">📁</span>` +
          `<strong class="project-title ellipsis">${text}</strong>` +
          `<span class="task-count-pill">${count} ${count === 1 ? 'task' : 'tasks'}</span>` +
          `</div>`
        );
      }
      if (task.is_external) {
        return (
          `<div class="gantt-col-task is-external-task" title="External / Other Project Task (Details hidden)">` +
          `<span class="task-icon-lock">🔒</span>` +
          `<span class="task-title ellipsis text-grey-7" style="font-style: italic;">${text}</span>` +
          `</div>`
        );
      }
      if (task.is_supervised) {
        const supH = Number(task.supervisor_effort || 0);
        return (
          `<div class="gantt-col-task is-supervised-task" title="Supervised Deliverable (Review: ${supH}h / 20%)">` +
          `<span class="task-icon-supervisor">🛡️</span>` +
          `<span class="task-title ellipsis text-weight-bold" style="color: #b45309;">${text}</span>` +
          `<span class="task-count-pill" style="background: rgba(245, 158, 11, 0.2); color: #b45309; margin-left: auto;">🛡️ ${supH}h (20%)</span>` +
          `</div>`
        );
      }
      const baseH = Number(
        task.base_expected_effort ?? task.expected_effort ?? task.total_hours ?? 0,
      );
      let effortTag = '';
      const hasSupervisor = Boolean(task.supervisor_name || task.supervisor_id);
      const assigneesCount = Number(task.assignees_count || 1);
      const isResourceMode = Boolean(props.isResourceView);

      if (isResourceMode) {
        if (assigneesCount > 1) {
          const share = Number(task.expected_effort || (baseH / assigneesCount).toFixed(1));
          effortTag = `<span class="task-count-pill" style="background: rgba(59, 130, 246, 0.15); color: #2563eb; margin-left: auto;" title="Your Share: ${share}h (1/${assigneesCount} of ${baseH}h total)">${share}h (1/${assigneesCount})</span>`;
        } else if (baseH > 0) {
          effortTag = `<span class="task-count-pill" style="background: #f1f5f9; color: #475569; margin-left: auto;" title="Expected Effort: ${baseH}h">${baseH}h</span>`;
        }
      } else {
        // Project View
        if (hasSupervisor) {
          const supH = Number(task.supervisor_effort || (baseH * 0.2).toFixed(1));
          const totalReq = Number(task.total_expected_effort ?? (baseH + supH).toFixed(1));
          const splitLabel =
            assigneesCount > 1
              ? `${baseH}h dev [${assigneesCount} members] + ${supH}h sup`
              : `${baseH}h dev + ${supH}h sup`;
          effortTag = `<span class="task-count-pill" style="background: rgba(124, 58, 237, 0.15); color: #7c3aed; margin-left: auto;" title="Total Required: ${totalReq}h (${splitLabel})">${totalReq}h (${baseH}+${supH})</span>`;
        } else if (assigneesCount > 1) {
          const share = Number((baseH / assigneesCount).toFixed(1));
          effortTag = `<span class="task-count-pill" style="background: rgba(59, 130, 246, 0.15); color: #2563eb; margin-left: auto;" title="Total: ${baseH}h (${share}h each across ${assigneesCount} members)">${baseH}h (${share}h ea)</span>`;
        } else if (baseH > 0) {
          effortTag = `<span class="task-count-pill" style="background: #f1f5f9; color: #475569; margin-left: auto;" title="Expected Effort: ${baseH}h">${baseH}h</span>`;
        }
      }
      return (
        `<div class="gantt-col-task" title="${text}">` +
        `<span class="task-icon-dot"></span>` +
        `<span class="task-title ellipsis">${text}</span>` +
        effortTag +
        `</div>`
      );
    },
  };

  const extraColumns = [
    {
      name: 'status',
      label: 'STATUS',
      align: 'center',
      width: 90,
      min_width: 75,
      max_width: 105,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (task.is_external) return '<span class="text-grey-6 text-caption">🔒 Busy</span>';
        if (!task.status) return '<span class="text-muted">—</span>';
        const s = task.status.toUpperCase();
        let label = task.status.replace(/_/g, ' ');
        let sClass = 's-unassigned';

        if (s === 'COMPLETED') {
          label = 'Completed';
          sClass = 's-completed';
        } else if (s === 'IN_PROGRESS' || s === 'ACTIVE') {
          label = 'In Progress';
          sClass = 's-in-progress';
        } else if (s === 'SCHEDULED') {
          label = 'Scheduled';
          sClass = 's-scheduled';
        } else if (s === 'UNASSIGNED') {
          label = 'Unassigned';
          sClass = 's-unassigned';
        }

        const isProj = task.type === 'project';
        return `<span class="status-badge ${isProj ? 'is-project-status' : ''} ${sClass}" title="Status: ${label}"><span class="status-dot"></span><span class="badge-text">${label}</span></span>`;
      },
    },
    {
      name: 'priority',
      label: 'PRIORITY',
      align: 'center',
      width: 75,
      min_width: 65,
      max_width: 85,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (task.is_external) return '<span class="text-grey-5">—</span>';
        if (!task.priority) return '<span class="text-muted">—</span>';
        const p = task.priority.toLowerCase();
        const pLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase();
        return `<span class="priority-badge p-${p}" title="Priority: ${pLabel}">${pLabel}</span>`;
      },
    },
    {
      name: 'effort',
      label: 'EFFORT',
      align: 'center',
      width: 110,
      min_width: 90,
      max_width: 140,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (task.is_external) return '<span class="text-grey-5">—</span>';
        if (task.type === 'project') {
          return '<span class="text-muted">—</span>';
        }
        if (task.is_supervised) {
          const supH = Number(task.supervisor_effort || 0);
          return `<span class="effort-badge sup-effort-badge" title="Supervisor Oversight: ${supH}h (20%)">🛡️ ${supH}h (20%)</span>`;
        }
        const baseH = Number(
          task.base_expected_effort ?? task.expected_effort ?? task.total_hours ?? 0,
        );
        const hasSupervisor = Boolean(task.supervisor_name || task.supervisor_id);
        const assigneesCount = Number(task.assignees_count || 1);
        const isResourceMode = Boolean(props.isResourceView);

        if (isResourceMode) {
          if (assigneesCount > 1) {
            const share = Number(task.expected_effort || (baseH / assigneesCount).toFixed(1));
            return `<span class="effort-badge" style="background: rgba(59, 130, 246, 0.12); color: #2563eb;" title="Your Assigned Share: ${share}h (Total task effort: ${baseH}h across ${assigneesCount} resources)"><b>${share}h</b> <span class="text-caption text-grey-6">(1/${assigneesCount})</span></span>`;
          }
          return `<span class="effort-badge" title="Expected Effort: ${baseH}h">${baseH}h</span>`;
        }

        // Project View
        if (hasSupervisor) {
          const supH = Number(task.supervisor_effort || (baseH * 0.2).toFixed(1));
          const totalReq = Number(task.total_expected_effort ?? (baseH + supH).toFixed(1));
          const splitTitle =
            assigneesCount > 1
              ? `Total Required: ${totalReq}h (${baseH}h dev divided among ${assigneesCount} assignees + ${supH}h supervisor)`
              : `Total Required: ${totalReq}h (${baseH}h assignee + ${supH}h supervisor)`;
          return `<span class="effort-badge combined-effort-badge" title="${splitTitle}"><b>${totalReq}h</b> <span class="sup-split">(${baseH}+${supH})</span></span>`;
        }
        if (assigneesCount > 1) {
          const share = Number((baseH / assigneesCount).toFixed(1));
          return `<span class="effort-badge" title="Total: ${baseH}h (${share}h each across ${assigneesCount} assignees)"><b>${baseH}h</b> <span class="text-caption text-grey-6">(${share}h ea)</span></span>`;
        }
        return `<span class="effort-badge" title="Expected Effort: ${baseH}h">${baseH}h</span>`;
      },
    },
    {
      name: 'duration',
      label: 'DURATION',
      align: 'center',
      width: 65,
      min_width: 50,
      max_width: 80,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        const isProj = task.type === 'project';
        if (isProj) {
          const dur = Math.max(1, Math.round(Number(task.duration) || 1));
          return `<span class="duration-badge project-dur-badge" title="Project Duration: ${dur} days">${dur}d</span>`;
        }
        const hours =
          task.duration_hours !== undefined
            ? task.duration_hours
            : (Number(task.duration) || 1) * 8;
        if (hours < 8) {
          const formattedH = Number(hours.toFixed(1));
          return `<span class="duration-badge" title="Duration: ${formattedH} working hours (${(hours / 8).toFixed(2)}d)">${formattedH}h</span>`;
        }
        const days = Number((hours / 8).toFixed(1));
        const daysDisplay = days === Math.round(days) ? `${Math.round(days)}d` : `${days}d`;
        return `<span class="duration-badge" title="Duration: ${daysDisplay} (${hours} working hours)">${daysDisplay}</span>`;
      },
    },
  ];

  const isMobile = window.innerWidth < 600;
  const isTablet = window.innerWidth < 900;

  if (showExtraColumns.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gantt.config as any).columns = [baseColumn, ...extraColumns];
    gantt.config.grid_width = isMobile ? 180 : isTablet ? 320 : 540;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gantt.config as any).columns = [baseColumn];
    gantt.config.grid_width = isMobile ? 150 : isTablet ? 200 : 250;
  }
}

function configureGanttEngine() {
  gantt.plugins({
    marker: true,
    tooltip: true,
  });

  gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';

  // Enable work time logic
  gantt.config.work_time = true;

  // Define custom "work_hour" time unit to skip non-working hours (10:00 - 18:00) natively in Free edition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.date as any).work_hour_start = function (date: Date) {
    const next = new Date(date.valueOf());
    const h = next.getHours();
    if (h < 10) {
      next.setHours(10, 0, 0, 0);
    } else if (h >= 18) {
      next.setDate(next.getDate() + 1);
      next.setHours(10, 0, 0, 0);
    } else {
      next.setMinutes(0, 0, 0);
    }
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.date as any).add_work_hour = function (date: Date, inc: number) {
    const next = new Date(date.valueOf());
    for (let i = 0; i < inc; i++) {
      next.setHours(next.getHours() + 1);
      if (next.getHours() >= 18) {
        next.setDate(next.getDate() + 1);
        next.setHours(10, 0, 0, 0);
        // Skip weekends
        while (next.getDay() === 0 || next.getDay() === 6) {
          next.setDate(next.getDate() + 1);
        }
      }
    }
    return next;
  };

  // Layout Dimensions
  gantt.config.row_height = 44;
  gantt.config.bar_height = 28;
  gantt.config.grid_resize = true;
  gantt.config.fit_tasks = false;
  gantt.config.smart_rendering = true;
  gantt.config.preserve_scroll = true;

  // Interactivity (Display-Only for Task Schedule / Progress)
  gantt.config.drag_move = false;
  gantt.config.drag_resize = false;
  gantt.config.drag_progress = false;
  gantt.config.drag_links = false;
  gantt.config.details_on_dblclick = false;
  gantt.config.details_on_click = false;
  gantt.config.details_on_create = false;
  gantt.config.show_quick_info = false;
  gantt.config.select_task = false;
  gantt.config.open_tree_initially = true;

  // Apply column configuration
  applyColumnsConfig();

  // Custom Task Bar CSS Classes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).task_class = (_start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    if (task.type === 'project') {
      return 'dhtmlx-bar-project';
    }
    if (task.is_external) {
      return 'dhtmlx-bar-task dhtmlx-bar-external';
    }
    const classes = ['dhtmlx-bar-task'];
    if (task.is_supervised) {
      classes.push('dhtmlx-bar-supervised');
    }
    if (task.priority) {
      classes.push(`bar-p-${task.priority.toLowerCase()}`);
    }
    if (task.status) {
      classes.push(`bar-s-${task.status.toLowerCase().replace('_', '-')}`);
    }
    return classes.join(' ');
  };

  // Custom Task Text Template inside Bar (Projects use project summary bar; tasks render discrete segmented pills)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).task_text = (start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    const pct = Math.round((task.progress || 0) * 100);
    const text = escapeHtml(task.text || '');

    if (task.type === 'project') {
      const count = task.task_count || 0;
      return (
        `<div class="gantt-bar-content-wrapper is-project">` +
        `<span class="gantt-bar-pct-badge project-pct">${pct}%</span>` +
        `<span class="gantt-bar-title is-project-title ellipsis">📁 ${text} · ${count} ${count === 1 ? 'task' : 'tasks'}</span>` +
        `</div>`
      );
    }

    if (task.is_external) {
      return (
        `<div class="gantt-segments-container">` +
        `<div class="gantt-segment-pill bar-external-pill" style="left: 0; width: 100%;">` +
        `<span class="segment-title ellipsis">🔒 ${text}</span>` +
        `</div>` +
        `</div>`
      );
    }

    if (task.is_supervised) {
      const supEffort = task.supervisor_effort || 0;
      return (
        `<div class="gantt-segments-container">` +
        `<div class="gantt-segment-pill bar-supervised-pill" style="left: 0; width: 100%;">` +
        `<div class="segment-progress-fill supervisor-progress-fill" style="width: ${pct}%;"></div>` +
        `<span class="segment-pct-badge supervisor-pct-badge">${pct}%</span>` +
        `<span class="segment-title ellipsis">🛡️ Review: ${text} (${supEffort}h / 20%)</span>` +
        `</div>` +
        `</div>`
      );
    }

    const segments = task.segments || [];
    const baseEffort = Number(
      task.base_expected_effort ?? task.expected_effort ?? task.total_hours ?? 0,
    );
    const supEffort = Number(task.supervisor_effort || (baseEffort * 0.2).toFixed(1));
    const combinedEffort = Number(
      task.total_expected_effort ?? (baseEffort + supEffort).toFixed(1),
    );
    const hasSupervisor = Boolean(task.supervisor_name || task.supervisor_id);
    const supervisorLabel =
      task.supervisor_name ||
      (task.supervisor_id ? `Supervisor #${task.supervisor_id}` : 'Supervisor');
    const assigneesCount = Number(task.assignees_count || 1);
    const isResourceMode = Boolean(props.isResourceView);

    let effortText = '';
    if (isResourceMode) {
      if (task.is_supervised) {
        effortText = ` · 🛡️ ${supEffort}h (20% review)`;
      } else if (assigneesCount > 1) {
        const share = Number(
          task.effort_per_assignee ||
            task.expected_effort ||
            (baseEffort / assigneesCount).toFixed(1),
        );
        effortText = ` · ${share}h (1/${assigneesCount} of ${baseEffort}h)`;
      } else if (baseEffort > 0) {
        effortText = ` · ${baseEffort}h`;
      }
    } else {
      if (hasSupervisor) {
        effortText = ` · ${combinedEffort}h [${baseEffort}h + ${supEffort}h 🛡️ ${escapeHtml(supervisorLabel)}]`;
      } else if (assigneesCount > 1) {
        const share = Number(task.effort_per_assignee || (baseEffort / assigneesCount).toFixed(1));
        effortText = ` · ${baseEffort}h (${share}h ea)`;
      } else if (baseEffort > 0) {
        effortText = ` · ${baseEffort}h`;
      }
    }

    if (segments.length === 0) {
      const pClass = `bar-p-${(task.priority || 'medium').toLowerCase()}`;
      const sClass = `bar-s-${(task.status || 'scheduled').toLowerCase().replace('_', '-')}`;
      const assignee = task.assignee_name ? ` (${escapeHtml(task.assignee_name)})` : '';
      return (
        `<div class="gantt-segments-container">` +
        `<div class="gantt-segment-pill ${pClass} ${sClass}" style="left: 0; width: 100%;">` +
        `<div class="segment-progress-fill" style="width: ${pct}%;"></div>` +
        `<span class="segment-pct-badge">${pct}%</span>` +
        `<span class="segment-title ellipsis">${text}${assignee}${effortText}</span>` +
        `</div>` +
        `</div>`
      );
    }

    const taskStartD = parseIsoToDate(task.start_date) || start;
    const taskEndD = parseIsoToDate(task.end_date) || _end;
    const taskStartX = gantt.posFromDate(taskStartD);
    const taskEndX = gantt.posFromDate(taskEndD);
    const taskTotalWidth = Math.max(1, taskEndX - taskStartX);

    const pClass = `bar-p-${(task.priority || 'medium').toLowerCase()}`;
    const sClass = `bar-s-${(task.status || 'scheduled').toLowerCase().replace('_', '-')}`;

    const segHtmlList = segments.map((seg, idx) => {
      let actualSegStart: Date;
      let actualSegEnd: Date;

      if (activeScale.value === 'hour') {
        let segStartH = 10;
        let segStartM = 0;
        let segEndH = 18;
        let segEndM = 0;

        if (seg.isFirstHalf) {
          segStartH = 14;
        } else if (seg.isSecondHalf) {
          segEndH = 14;
        }

        if (idx === 0) {
          const pStart = parseIsoToDate(task.actual_start || task.planned_start) || taskStartD;
          if (
            pStart &&
            formatDateIso(pStart) === seg.startStr &&
            pStart.getHours() >= 10 &&
            pStart.getHours() < 18
          ) {
            segStartH = Math.max(segStartH, pStart.getHours());
            segStartM = pStart.getMinutes();
          }
        }
        if (idx === segments.length - 1) {
          const pEnd = parseIsoToDate(task.actual_end || task.planned_end) || taskEndD;
          if (
            pEnd &&
            (formatDateIso(pEnd) === seg.endStr ||
              formatDateIso(pEnd) === formatDateIso(seg.endDate)) &&
            pEnd.getHours() > 10 &&
            pEnd.getHours() <= 18
          ) {
            segEndH = Math.min(segEndH, pEnd.getHours());
            segEndM = pEnd.getMinutes();
          }
        }
        actualSegStart = new Date(
          seg.startDate.getFullYear(),
          seg.startDate.getMonth(),
          seg.startDate.getDate(),
          segStartH,
          segStartM,
          0,
        );
        actualSegEnd = new Date(
          addDays(seg.endDate, -1).getFullYear(),
          addDays(seg.endDate, -1).getMonth(),
          addDays(seg.endDate, -1).getDate(),
          segEndH,
          segEndM,
          0,
        );
      } else {
        const isFirstSeg = idx === 0;
        const isLastSeg = idx === segments.length - 1;

        actualSegStart = isFirstSeg ? taskStartD : seg.startDate;
        actualSegEnd = isLastSeg ? taskEndD : seg.endDate;

        if (seg.isFirstHalf) {
          // Leave is first half -> Work is second half -> visually right aligned 50%
          actualSegStart = new Date(
            seg.startDate.getFullYear(),
            seg.startDate.getMonth(),
            seg.startDate.getDate(),
            12,
            0,
            0,
          );
          actualSegEnd = new Date(
            seg.startDate.getFullYear(),
            seg.startDate.getMonth(),
            seg.startDate.getDate() + 1,
            0,
            0,
            0,
          );
        } else if (seg.isSecondHalf) {
          // Leave is second half -> Work is first half -> visually left aligned 50%
          actualSegStart = new Date(
            seg.startDate.getFullYear(),
            seg.startDate.getMonth(),
            seg.startDate.getDate(),
            0,
            0,
            0,
          );
          actualSegEnd = new Date(
            seg.startDate.getFullYear(),
            seg.startDate.getMonth(),
            seg.startDate.getDate(),
            12,
            0,
            0,
          );
        }
      }

      const segStartX = gantt.posFromDate(actualSegStart);
      const segEndX = gantt.posFromDate(actualSegEnd);
      const rawSegWidth = Math.max(12, segEndX - segStartX);
      const segLeft = Math.max(0, segStartX - taskStartX);
      const segWidth = Math.min(rawSegWidth, Math.max(12, taskTotalWidth - segLeft));

      const isMulti = segments.length > 1;
      const targetEffort = isResourceMode ? task.expected_effort || baseEffort : combinedEffort;
      const segLabel = isMulti
        ? `${text} [Part ${idx + 1}/${segments.length}: ${seg.allocatedHours}h / ${targetEffort}h req]`
        : `${text}${task.assignee_name ? ` (${escapeHtml(task.assignee_name)})` : ''}${effortText}`;

      let breakdownStr = '';
      const originalTask = props.tasks.find((t) => t.task_id === task.id);
      const schedules = originalTask?.schedules || [];
      if (schedules.length > 0) {
        const segResourceMap = new Map<string, number>();
        const segStartStr = formatDateIso(seg.startDate);
        const segEndStr = formatDateIso(addDays(seg.endDate, -1));

        schedules.forEach((s: TaskScheduleItem) => {
          if (!s.schedule_date || !s.allocated_hours || Number(s.allocated_hours) === 0) return;
          const dStr =
            (typeof s.schedule_date === 'string'
              ? s.schedule_date.split('T')[0]
              : s.schedule_date) || '';
          const sDate = parseIsoToDate(dStr);
          if (sDate) {
            const compareDateStr = formatDateIso(sDate);
            if (compareDateStr >= segStartStr && compareDateStr <= segEndStr) {
              const rName = s.resource_name || 'Resource';
              segResourceMap.set(
                rName,
                (segResourceMap.get(rName) || 0) + Number(s.allocated_hours),
              );
            }
          }
        });
        if (segResourceMap.size > 0) {
          const bd = Array.from(segResourceMap.entries())
            .map(([r, h]) => `${r}: ${h}h`)
            .join(' | ');
          breakdownStr = `\nBreakdown: ${bd}`;
        }
      }

      return (
        `<div class="gantt-segment-pill ${pClass} ${sClass}" style="left: ${segLeft}px; width: ${segWidth}px;" title="Work Segment ${idx + 1}/${segments.length}: ${seg.allocatedHours}h (${formatDate(seg.startDate)} – ${formatDate(addDays(seg.endDate, -1))})${breakdownStr}">` +
        `<div class="segment-progress-fill" style="width: ${pct}%;"></div>` +
        `<span class="segment-pct-badge">${pct}%</span>` +
        `<span class="segment-title ellipsis">${segLabel}</span>` +
        `</div>`
      );
    });

    return `<div class="gantt-segments-container">${segHtmlList.join('')}</div>`;
  };

  // Custom Grid Row Class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).grid_row_class = (
    _start: Date,
    _end: Date,
    task: DhtmlxGanttTaskItem,
  ) => {
    if (task.type === 'project') {
      return 'dhtmlx-grid-row-project';
    }
    if (task.is_external) {
      return 'dhtmlx-grid-row-task is-external-row';
    }
    if (task.is_supervised) {
      return 'dhtmlx-grid-row-task is-supervised-row';
    }
    return 'dhtmlx-grid-row-task';
  };

  // Tooltip Template with Segments Breakdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).tooltip_text = (start: Date, end: Date, task: DhtmlxGanttTaskItem) => {
    const rawStart = parseIsoToDate(task.actual_start || task.planned_start) || start;
    const rawEnd = parseIsoToDate(task.actual_end || task.planned_end) || end;

    const text = escapeHtml(task.text || '');
    const projName = escapeHtml(task.project_name || 'TaskFlow Project');
    const formatTime = (d: Date) => {
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    };

    const isExactTime =
      rawStart.getHours() !== 0 ||
      rawStart.getMinutes() !== 0 ||
      rawEnd.getHours() !== 0 ||
      rawEnd.getMinutes() !== 0;

    const displayEnd = isExactTime
      ? new Date(rawEnd.getTime())
      : new Date(rawEnd.getTime() - 1000 * 60 * 60 * 24);

    const startStr = formatDate(rawStart);
    const endStr = formatDate(displayEnd);

    let dateRange: string;
    if (isExactTime) {
      if (startStr === endStr) {
        dateRange = `${startStr} (${formatTime(rawStart)} - ${formatTime(rawEnd)})`;
      } else {
        dateRange = `${startStr}, ${formatTime(rawStart)} – ${endStr}, ${formatTime(rawEnd)}`;
      }
    } else {
      dateRange = startStr === endStr ? startStr : `${startStr} – ${endStr}`;
    }
    const rawDurDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const durationDays = Number(Math.max(0.1, rawDurDays).toFixed(2));
    const pct = Math.round((Number(task.progress) || 0) * 100);

    if (task.type === 'project') {
      return (
        `<div class="gantt-tooltip-card">` +
        `<div class="tooltip-header"><div class="tooltip-title">📁 ${text}</div><div class="tooltip-project-tag">Project Summary</div></div>` +
        `<div class="tooltip-body">` +
        `<div class="tooltip-row"><span class="tooltip-k">Timeline:</span><span class="tooltip-v">${dateRange} (${durationDays}d)</span></div>` +
        `<div class="tooltip-row"><span class="tooltip-k">Child Tasks:</span><span class="tooltip-v">${task.task_count || 0} tasks</span></div>` +
        `<div class="tooltip-row"><span class="tooltip-k">Calculated Progress:</span><div class="tooltip-progress-box"><div class="tooltip-bar"><div class="fill" style="width: ${pct}%"></div></div><span>${pct}%</span></div></div>` +
        `</div>` +
        `</div>`
      );
    }

    if (task.is_external) {
      const totalHoursText = task.total_hours ? `${task.total_hours} hrs scheduled` : '—';
      return (
        `<div class="gantt-tooltip-card">` +
        `<div class="tooltip-header"><div class="tooltip-title">🔒 ${text}</div><div class="tooltip-project-tag">${projName}</div></div>` +
        `<div class="tooltip-body">` +
        `<div class="tooltip-row"><span class="text-caption text-amber-9">🔒 Managed by another Project Manager. Details hidden.</span></div>` +
        `<div class="tooltip-row"><span class="tooltip-k">Timeline:</span><span class="tooltip-v">${dateRange} (${durationDays}d)</span></div>` +
        `<div class="tooltip-row"><span class="tooltip-k">Allocated Capacity:</span><span class="tooltip-v text-grey-8">${totalHoursText}</span></div>` +
        `</div>` +
        `</div>`
      );
    }

    const assignee = escapeHtml(task.assignee_name || 'Unassigned');
    const hasSupervisor = Boolean(task.supervisor_name || task.supervisor_id);
    const supName = task.supervisor_name
      ? escapeHtml(task.supervisor_name)
      : task.supervisor_id
        ? `Supervisor #${task.supervisor_id}`
        : null;
    const baseEffort = Number(
      task.base_expected_effort ?? task.expected_effort ?? task.total_hours ?? 0,
    );
    const supEffort = Number(task.supervisor_effort || (baseEffort * 0.2).toFixed(1));
    const combinedEffort = Number(
      task.total_expected_effort ?? (baseEffort + supEffort).toFixed(1),
    );
    const assigneesCount = Number(task.assignees_count || 1);
    const statusText = task.status ? task.status.replace(/_/g, ' ') : '—';
    const priorityText = task.priority || '—';
    const totalHoursText = baseEffort
      ? `${baseEffort} hrs`
      : task.total_hours
        ? `${task.total_hours} hrs`
        : '—';

    const parseOrFallback = (str?: string | null) => {
      if (!str) return '—';
      const d = parseIsoToDate(str);
      return d ? formatDate(d) : '—';
    };
    const pStartStr = parseOrFallback(task.planned_start);
    const pEndStr = parseOrFallback(task.planned_end);

    let segmentsHtml = '';
    const originalTask = props.tasks.find((t) => t.task_id === task.id);
    const schedules = originalTask?.schedules || [];

    if (schedules.length > 0) {
      const resourceMap = new Map<string, { date: string; hours: number }[]>();

      schedules.forEach((s: TaskScheduleItem) => {
        if (!s.schedule_date || !s.allocated_hours || Number(s.allocated_hours) === 0) return;
        const rName = s.resource_name || 'Resource';
        if (!resourceMap.has(rName)) resourceMap.set(rName, []);
        const dStr =
          (typeof s.schedule_date === 'string' ? s.schedule_date.split('T')[0] : s.schedule_date) ||
          '';
        const d = parseIsoToDate(dStr);
        resourceMap.get(rName)!.push({
          date: d ? formatDate(d) : dStr,
          hours: Number(s.allocated_hours),
        });
      });

      if (resourceMap.size > 0) {
        let schedulesList = '';
        resourceMap.forEach((days, rName) => {
          const daysText = days.map((day) => `${day.date} (${day.hours}h)`).join(', ');
          schedulesList += `<div class="tooltip-seg-item"><strong>${escapeHtml(rName)}:</strong> ${daysText}</div>`;
        });
        segmentsHtml = `<div class="tooltip-row column items-start"><span class="tooltip-k q-mb-xs">Resource Schedules:</span><div class="tooltip-segments-list">${schedulesList}</div></div>`;
      }
    } else if (task.segments && task.segments.length > 1) {
      const segsList = task.segments
        .map((s: TaskWorkSegment) => {
          const sEnd = new Date(s.endDate.getTime() - 1000 * 60 * 60 * 24);
          return `<div class="tooltip-seg-item">${formatDate(s.startDate)} – ${formatDate(sEnd)} (${s.allocatedHours}h)</div>`;
        })
        .join('');
      segmentsHtml = `<div class="tooltip-row column items-start"><span class="tooltip-k q-mb-xs">Work Segments (${task.segments.length}):</span><div class="tooltip-segments-list">${segsList}</div></div>`;
    }

    const assigneeDetail = task.is_supervised
      ? 'Supervisor Oversight (Review)'
      : assigneesCount > 1
        ? `${assignee} (${baseEffort}h total · ${task.effort_per_assignee || (baseEffort / assigneesCount).toFixed(1)}h each)`
        : `${assignee} (${baseEffort}h)`;

    return (
      `<div class="gantt-tooltip-card">` +
      `<div class="tooltip-header"><div class="tooltip-title">${task.is_supervised ? '🛡️ ' : ''}${text}</div><div class="tooltip-project-tag">${projName}</div></div>` +
      `<div class="tooltip-body">` +
      `<div class="tooltip-row"><span class="tooltip-k">Status:</span><span class="tooltip-v">${statusText}</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">Priority:</span><span class="tooltip-v">${priorityText}</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">${task.is_supervised ? 'Role' : 'Assignee'}:</span><span class="tooltip-v">${assigneeDetail}</span></div>` +
      (hasSupervisor && supName
        ? `<div class="tooltip-row"><span class="tooltip-k">Supervisor (20%):</span><span class="tooltip-v text-amber-9 font-weight-bold">🛡️ ${supName} (${supEffort}h)</span></div>`
        : '') +
      (hasSupervisor
        ? `<div class="tooltip-row"><span class="tooltip-k">Combined Effort:</span><span class="tooltip-v text-purple-7 font-weight-bold">${combinedEffort} hrs (${baseEffort}h dev + ${supEffort}h sup)</span></div>`
        : `<div class="tooltip-row"><span class="tooltip-k">Scheduled Effort:</span><span class="tooltip-v text-purple-7 font-weight-bold">${totalHoursText}</span></div>`) +
      `<div class="tooltip-row"><span class="tooltip-k">Planned Timeline:</span><span class="tooltip-v text-grey-8">${pStartStr} – ${pEndStr}</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">Scheduled Span:</span><span class="tooltip-v">${dateRange} (${task.duration_hours !== undefined && task.duration_hours < 8 ? `${Number(task.duration_hours.toFixed(1))}h / ${durationDays}d` : `${durationDays}d`})</span></div>` +
      segmentsHtml +
      `<div class="tooltip-row"><span class="tooltip-k">Progress:</span><div class="tooltip-progress-box"><div class="tooltip-bar"><div class="fill" style="width: ${pct}%"></div></div><span>${pct}%</span></div></div>` +
      `</div>` +
      `</div>`
    );
  };

  // Timeline cell styling for holidays (PM and Resource) and leaves / NWDs (when availability provided or Resource view)
  // Only apply cell highlighting in daily and hourly scales so weekly/monthly views remain clean
  gantt.templates.timeline_cell_class = function (_item: unknown, date: Date) {
    if (activeScale.value !== 'day' && activeScale.value !== 'hour') {
      return '';
    }
    const dateStr = formatDateIso(date);
    if (holidayDateSet.value.has(dateStr)) {
      return 'gantt-col-holiday';
    }
    if (props.isResourceView || (props.availability && props.availability.length > 0)) {
      const avail = availabilityMap.value.get(dateStr);
      if (avail) {
        const isHalfDay =
          avail.leave_type === 'FIRST_HALF' ||
          avail.leave_type === 'SECOND_HALF' ||
          avail.status === 'PARTIAL_LEAVE' ||
          (avail.leave_hours !== undefined &&
            avail.leave_hours !== null &&
            Number(avail.leave_hours) > 0 &&
            Number(avail.leave_hours) < (avail.daily_working_hours || 8));

        if (isHalfDay) {
          const isSecondHalf =
            avail.leave_type === 'SECOND_HALF' ||
            String(avail.leave_type).toUpperCase().includes('SECOND') ||
            String(avail.leave_type).toUpperCase().includes('2');
          if (activeScale.value === 'hour') {
            const h = date.getHours();
            if (isSecondHalf) {
              return h >= 14 && h < 18 ? 'gantt-col-leave' : '';
            } else {
              return h >= 10 && h < 14 ? 'gantt-col-leave' : '';
            }
          }
          if (activeScale.value === 'day') {
            return isSecondHalf ? 'gantt-col-leave-second-half' : 'gantt-col-leave-first-half';
          }
          return '';
        }
        if (
          avail.status === 'ON_LEAVE' ||
          (avail.leave_hours && avail.leave_hours >= (avail.daily_working_hours || 8))
        ) {
          return 'gantt-col-leave';
        }
        if (avail.status === 'NON_WORKING_DAY') {
          return 'gantt-col-nwd';
        }
      } else if (date.getDay() === 0 || date.getDay() === 6) {
        return 'gantt-col-nwd';
      }
    }
    return '';
  };

  gantt.templates.scale_cell_class = function (date: Date) {
    if (activeScale.value !== 'day' && activeScale.value !== 'hour') {
      return '';
    }
    const dateStr = formatDateIso(date);
    if (holidayDateSet.value.has(dateStr)) {
      return 'gantt-scale-holiday';
    }
    if (props.isResourceView || (props.availability && props.availability.length > 0)) {
      const avail = availabilityMap.value.get(dateStr);
      if (avail) {
        const isHalfDay =
          avail.leave_type === 'FIRST_HALF' ||
          avail.leave_type === 'SECOND_HALF' ||
          avail.status === 'PARTIAL_LEAVE' ||
          (avail.leave_hours !== undefined &&
            avail.leave_hours !== null &&
            Number(avail.leave_hours) > 0 &&
            Number(avail.leave_hours) < (avail.daily_working_hours || 8));

        if (isHalfDay) {
          const isSecondHalf =
            avail.leave_type === 'SECOND_HALF' ||
            String(avail.leave_type).toUpperCase().includes('SECOND') ||
            String(avail.leave_type).toUpperCase().includes('2');
          if (activeScale.value === 'hour') {
            const h = date.getHours();
            if (isSecondHalf) {
              return h >= 14 && h < 18 ? 'gantt-scale-leave' : '';
            } else {
              return h >= 10 && h < 14 ? 'gantt-scale-leave' : '';
            }
          }
          if (activeScale.value === 'day') {
            return isSecondHalf ? 'gantt-scale-leave-second-half' : 'gantt-scale-leave-first-half';
          }
          return '';
        }
        if (
          avail.status === 'ON_LEAVE' ||
          (avail.leave_hours && avail.leave_hours >= (avail.daily_working_hours || 8))
        ) {
          return 'gantt-scale-leave';
        }
        if (avail.status === 'NON_WORKING_DAY') {
          return 'gantt-scale-nwd';
        }
      } else if (date.getDay() === 0 || date.getDay() === 6) {
        return 'gantt-scale-nwd';
      }
    }
    return '';
  };
}

function formatHours(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0';
  const num = Number(val);
  return parseFloat(num.toFixed(2)).toString();
}

function parseDateStringToMidnight(dateStr: string): Date | null {
  const clean = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
  }
  return null;
}

function clearCustomMarkers() {
  if (customMarkerIds.value && customMarkerIds.value.length > 0) {
    const markerExt = gantt as unknown as GanttMarkerExtension;
    customMarkerIds.value.forEach((id) => {
      try {
        if (typeof markerExt.deleteMarker === 'function') {
          markerExt.deleteMarker(id);
        }
      } catch {
        // ignore
      }
    });
    customMarkerIds.value = [];
  }
}

function updateCustomMarkers() {
  if (!gantt || !gantt.$container) return;
  clearCustomMarkers();
  customMarkerIds.value = [];

  const markerExt = gantt as unknown as GanttMarkerExtension;

  // Guard: Marker extension is only available if supported and loaded by DHTMLX Gantt
  if (typeof markerExt.addMarker !== 'function') {
    return;
  }

  // Only render vertical line markers in 'day' and 'hour' scale modes (NOT weekly or monthly)!
  if (activeScale.value !== 'day' && activeScale.value !== 'hour') {
    try {
      markerExt.renderMarkers?.();
    } catch {
      // ignore
    }
    return;
  }

  // Today marker (visible ONLY when in day/hour scales)
  try {
    const todayMarkerId = gantt.addMarker({
      start_date: new Date(),
      css: 'dhtmlx-today-marker',
      text: 'TODAY',
      title: 'Current Date',
    });
    if (todayMarkerId) customMarkerIds.value.push(todayMarkerId);
  } catch {
    // ignore
  }

  // 1. Holiday Markers (Visible on BOTH PM and Resource sides with Orange dashed vertical line in Day view)
  if (props.holidays && props.holidays.length > 0) {
    const seenHolidays = new Set<string>();
    props.holidays.forEach((h) => {
      if (!h || !h.holiday_date) return;
      const dStr = String(h.holiday_date).split('T')[0]!;
      if (seenHolidays.has(dStr)) return;
      seenHolidays.add(dStr);

      const d = parseDateStringToMidnight(dStr);
      if (d) {
        if (activeScale.value === 'hour') {
          d.setHours(10, 0, 0, 0);
        }
        try {
          const mId = gantt.addMarker({
            start_date: d,
            css: 'dhtmlx-holiday-marker',
            text: h.description ? `🎉 ${h.description.toUpperCase()}` : '🎉 HOLIDAY',
            title: `Company Holiday: ${h.description || 'Holiday'} (${dStr})`,
          });
          if (mId) customMarkerIds.value.push(mId);
        } catch (e) {
          console.warn('Failed to add holiday marker:', e);
        }
      }
    });
  }

  // 2. Resource Leaves Markers (Shown when resource availability is present)
  if (
    (props.isResourceView || (props.availability && props.availability.length > 0)) &&
    props.availability &&
    props.availability.length > 0
  ) {
    props.availability.forEach((avail) => {
      if (!avail || !avail.date) return;
      const dStr = String(avail.date).split('T')[0]!;
      if (holidayDateSet.value.has(dStr)) return;

      const d = parseDateStringToMidnight(dStr);
      if (!d) return;

      const isHalfDay =
        avail.leave_type === 'FIRST_HALF' ||
        avail.leave_type === 'SECOND_HALF' ||
        avail.status === 'PARTIAL_LEAVE' ||
        (avail.leave_hours !== undefined &&
          avail.leave_hours !== null &&
          Number(avail.leave_hours) > 0 &&
          Number(avail.leave_hours) < (avail.daily_working_hours || 8));

      if (isHalfDay) {
        if (activeScale.value !== 'hour' && activeScale.value !== 'day') return;

        const isSecondHalf =
          avail.leave_type === 'SECOND_HALF' ||
          String(avail.leave_type).toUpperCase().includes('SECOND') ||
          String(avail.leave_type).toUpperCase().includes('2');
        if (activeScale.value === 'hour') {
          if (isSecondHalf) {
            d.setHours(14, 0, 0, 0);
          } else {
            d.setHours(10, 0, 0, 0);
          }
        } else {
          // Day scale: position at 12:00 for second half, 00:00 for first half
          if (isSecondHalf) {
            d.setHours(12, 0, 0, 0);
          } else {
            d.setHours(0, 0, 0, 0);
          }
        }
        const halfLabel = isSecondHalf ? '2ND HALF' : '1ST HALF';
        try {
          const mId = gantt.addMarker({
            start_date: d,
            css: 'dhtmlx-leave-marker',
            text: `🏖️ ${halfLabel} LEAVE (${formatHours(avail.leave_hours)}h)`,
            title: `${halfLabel} Leave: ${avail.leave_hours}h on ${dStr}`,
          });
          if (mId) customMarkerIds.value.push(mId);
        } catch (e) {
          console.warn('Failed to add partial leave marker:', e);
        }
      } else if (
        avail.status === 'ON_LEAVE' ||
        (avail.leave_hours && avail.leave_hours >= (avail.daily_working_hours || 8))
      ) {
        if (activeScale.value === 'hour') {
          d.setHours(10, 0, 0, 0);
        }
        try {
          const mId = gantt.addMarker({
            start_date: d,
            css: 'dhtmlx-leave-marker',
            text: '🏖️ ON LEAVE',
            title: `Approved Full-Day Leave (${dStr})`,
          });
          if (mId) customMarkerIds.value.push(mId);
        } catch (e) {
          console.warn('Failed to add leave marker:', e);
        }
      }
    });
  }
}

// ----------------------------------------------------
// Scale Configuration (Day, Week, Month)
// ----------------------------------------------------
function applyScaleMode(scale: 'hour' | 'day' | 'week' | 'month') {
  let timelineWidth = 800; // fallback
  if (ganttContainer.value) {
    const totalWidth = ganttContainer.value.clientWidth;
    const gridWidth = gantt.config.grid_width || (showExtraColumns.value ? 540 : 250);
    timelineWidth = Math.max(300, totalWidth - gridWidth);
  }

  if (scale === 'hour') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 30;
    gantt.config.scales = [
      { unit: 'day', step: 1, format: '%D, %d %M' },
      { unit: 'work_hour', step: 1, format: '%H' },
    ];
  } else if (scale === 'day') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = Math.max(46, Math.floor((timelineWidth - 20) / 7)); // -20 for scrollbar buffer
    gantt.config.scales = [
      {
        unit: 'month',
        step: 1,
        format: (date: Date) =>
          date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase(),
      },
      { unit: 'day', step: 1, format: '%D, %d' },
    ];
  } else if (scale === 'month') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 80;
    gantt.config.scales = [
      { unit: 'year', step: 1, format: '%Y' },
      {
        unit: 'month',
        step: 1,
        format: (date: Date) => date.toLocaleDateString(undefined, { month: 'long' }).toUpperCase(),
      },
    ];
  } else {
    // Week Mode (Default: JULY 2026 / WEEK #30)
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 54;
    gantt.config.scales = [
      {
        unit: 'month',
        step: 1,
        format: (date: Date) =>
          date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase(),
      },
      {
        unit: 'week',
        step: 1,
        format: (date: Date) => `WEEK #${getWeekNumber(date)}`,
      },
    ];
  }
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// ----------------------------------------------------
// Framing & Date Bounds Computation
// ----------------------------------------------------
function applyScaleAwareFraming(visibleTasks: Task[]) {
  if (!visibleTasks.length) {
    const now = new Date();
    gantt.config.start_date = new Date(now.getFullYear(), now.getMonth(), 1);
    gantt.config.end_date = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    return;
  }

  let minTime = Infinity;
  let maxTime = -Infinity;

  visibleTasks.forEach((t) => {
    const { earliestStart, latestEnd } = getTaskWorkSegments(t);
    const startMs = earliestStart.getTime();
    const endMs = latestEnd.getTime();
    if (!isNaN(startMs) && startMs < minTime) minTime = startMs;
    if (!isNaN(endMs) && endMs > maxTime) maxTime = endMs;
  });

  if (minTime === Infinity || maxTime === -Infinity) {
    const now = new Date();
    minTime = now.getTime();
    maxTime = now.getTime() + 14 * 24 * 60 * 60 * 1000;
  }

  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);
  const scale = activeScale.value;

  if (scale === 'hour' || scale === 'day') {
    const start = new Date(minDate);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    end.setDate(end.getDate() + 2);
    end.setHours(0, 0, 0, 0);

    gantt.config.start_date = start;
    gantt.config.end_date = end;
  } else if (scale === 'week') {
    const start = new Date(minDate);
    const startDay = start.getDay();
    const startDiff = start.getDate() - startDay + (startDay === 0 ? -6 : 1);
    start.setDate(startDiff - 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    const endDay = end.getDay();
    const endDiff = end.getDate() + (endDay === 0 ? 0 : 7 - endDay);
    end.setDate(endDiff + 7);
    end.setHours(0, 0, 0, 0);

    gantt.config.start_date = start;
    gantt.config.end_date = end;
  } else if (scale === 'month') {
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 1);
    gantt.config.start_date = start;
    gantt.config.end_date = end;
  }
}

// ----------------------------------------------------
// Data Transformation (Project Hierarchy & Finish-to-Start Links)
// ----------------------------------------------------
function buildGanttDataset() {
  const query = (internalSearchQuery.value || '').trim().toLowerCase();

  const filteredTasks = validGanttTasks.value.filter((t) => {
    if (query) {
      const matchTitle = t.title.toLowerCase().includes(query);
      const pName = projectMap.value.get(t.project_id)?.name.toLowerCase() || '';
      if (!matchTitle && !pName.includes(query)) return false;
    }
    return true;
  });

  visibleCount.value = filteredTasks.length;
  hasTasks.value = filteredTasks.length > 0;

  applyScaleAwareFraming(filteredTasks);

  const data: Array<Record<string, unknown>> = [];
  const links: Array<Record<string, unknown>> = [];

  const resolveStartDate = (d: Date | null) => {
    if (!d) return null;
    if (activeScale.value === 'hour') {
      return snapToGanttWorkTime(d);
    }
    return getMacroDate(d, true);
  };

  const resolveEndDate = (d: Date | null) => {
    if (!d) return null;
    if (activeScale.value === 'hour') {
      if (d.getHours() === 0 && d.getMinutes() === 0) {
        const prevDay = addDays(d, -1);
        return new Date(prevDay.getFullYear(), prevDay.getMonth(), prevDay.getDate(), 18, 0, 0);
      }
      return snapToGanttWorkTime(d);
    }
    return getMacroDate(d, false);
  };

  function parseResourceIds(val: unknown): number[] {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((x) => Number(x)).filter((n) => !isNaN(n) && n > 0);
    }
    if (typeof val === 'number') {
      return val > 0 ? [val] : [];
    }
    if (typeof val === 'string') {
      return val
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }
    return [];
  }

  function resolveAssigneeName(t: Task): string | undefined {
    const rawNames = (t as unknown as Record<string, unknown>).assigned_resource_names;
    if (typeof rawNames === 'string' && rawNames.trim().length > 0) {
      return rawNames.trim();
    }
    if (Array.isArray(t.assigned_resource_names) && t.assigned_resource_names.length > 0) {
      return t.assigned_resource_names.join(', ');
    }
    if (Array.isArray(t.assigned_resources) && t.assigned_resources.length > 0) {
      return t.assigned_resources
        .map((r) => r.name)
        .filter(Boolean)
        .join(', ');
    }
    const ids = parseResourceIds(t.assigned_resource_ids);
    if (ids.length > 0) {
      const names = ids.map((id) => resourceMap.value.get(id)?.name || `User #${id}`);
      return names.join(', ');
    }
    return undefined;
  }

  function resolveSupervisorName(t: Task): string | null {
    if (t.supervisor_name) return t.supervisor_name;
    if (t.supervisor_id) {
      const r = resourceMap.value.get(Number(t.supervisor_id));
      if (r?.name) return r.name;
      return `Resource #${t.supervisor_id}`;
    }
    return null;
  }

  if (isHierarchical.value) {
    // Group tasks by project
    const tasksByProjectId = new Map<number, Task[]>();
    filteredTasks.forEach((t) => {
      const pId = t.project_id || 0;
      if (!tasksByProjectId.has(pId)) {
        tasksByProjectId.set(pId, []);
      }
      tasksByProjectId.get(pId)!.push(t);
    });

    tasksByProjectId.forEach((projectTasks, pId) => {
      const p =
        projectMap.value.get(pId) ||
        ({
          project_id: pId,
          name: projectTasks[0]?.project_name || `Project #${pId}`,
          status: 'ACTIVE',
          priority: 'MEDIUM',
          progress: 0,
        } as Project);

      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;
      let totalWeightedProgress = 0;
      let totalDuration = 0;

      const childTaskDataItems: Array<Record<string, unknown>> = [];

      projectTasks.forEach((t) => {
        const {
          segments,
          earliestStart: tStart,
          latestEnd: tEnd,
          totalHours,
        } = getTaskWorkSegments(t);
        const dur = Math.max(
          1,
          Math.round((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)),
        );
        const prog = Number(t.progress) || 0;

        if (!earliestStart || tStart < earliestStart) earliestStart = tStart;
        if (!latestEnd || tEnd > latestEnd) latestEnd = tEnd;

        totalWeightedProgress += prog * dur;
        totalDuration += dur;

        const myId = authStore.user?.user_id ? Number(authStore.user.user_id) : null;
        const supId = t.supervisor_id ? Number(t.supervisor_id) : null;
        const supName = resolveSupervisorName(t);
        const assignedIds = parseResourceIds(t.assigned_resource_ids);
        const isSupervisedByMe = Boolean(myId && supId === myId && !assignedIds.includes(myId));
        const resolvedAssigneeName = resolveAssigneeName(t);
        const baseExpectedEffort = Number(t.expected_effort || totalHours || 0);
        const supervisorEffort = supId ? Number((baseExpectedEffort * 0.2).toFixed(1)) : 0;
        const totalReq = supId
          ? Number((baseExpectedEffort + supervisorEffort).toFixed(1))
          : baseExpectedEffort;
        const assigneesCount = Math.max(1, assignedIds.length || 1);
        const effortPerAssignee = Number((baseExpectedEffort / assigneesCount).toFixed(2));

        const displayExpectedEffort = props.isResourceView
          ? isSupervisedByMe
            ? supervisorEffort
            : effortPerAssignee
          : totalReq;

        const targetDurationHours = props.isResourceView
          ? displayExpectedEffort
          : supId
            ? Number((effortPerAssignee + supervisorEffort).toFixed(2))
            : effortPerAssignee;

        const { start: resolvedChildStart, end: resolvedChildEnd } = computeTaskGanttDates(
          t,
          tStart,
          tEnd,
          segments,
          targetDurationHours,
        );

        if (!earliestStart || resolvedChildStart < earliestStart)
          earliestStart = resolvedChildStart;
        if (!latestEnd || resolvedChildEnd > latestEnd) latestEnd = resolvedChildEnd;

        childTaskDataItems.push({
          id: t.task_id,
          text: t.title,
          start_date: formatGanttDate(resolvedChildStart),
          end_date: formatGanttDate(resolvedChildEnd),
          duration: Number((targetDurationHours / 8).toFixed(2)),
          duration_hours: targetDurationHours,
          progress: (Number(t.progress) || 0) / 100,
          parent: `proj_${p.project_id}`,
          priority: t.priority,
          status: t.status,
          project_name: p.name,
          assignee_name: resolvedAssigneeName,
          supervisor_id: supId,
          supervisor_name: supName,
          is_supervised: isSupervisedByMe,
          expected_effort: displayExpectedEffort,
          total_expected_effort: totalReq,
          base_expected_effort: baseExpectedEffort,
          assignees_count: assigneesCount,
          effort_per_assignee: effortPerAssignee,
          actual_effort: Number(t.actual_effort || 0),
          supervisor_effort: supervisorEffort,
          type: 'task',
          segments,
          total_hours: totalHours,
          is_segmented: segments.length > 1,
          is_external: Boolean(t.is_external),
          planned_start: t.planned_start,
          planned_end: t.planned_end,
          actual_start: t.actual_start,
          actual_end: t.actual_end,
        });
      });

      const startObj = earliestStart || new Date();
      const endObj = latestEnd || addDays(startObj, 1);

      let pStart = resolveStartDate(startObj) ?? startObj;
      let pEnd = resolveEndDate(endObj) ?? endObj;
      if (!isValidDate(pStart)) pStart = new Date();
      if (!isValidDate(pEnd) || pEnd.getTime() <= pStart.getTime()) {
        pEnd = new Date(pStart.getTime() + 24 * 60 * 60 * 1000);
      }

      const calculatedProgress =
        totalDuration > 0
          ? totalWeightedProgress / totalDuration / 100
          : projectTasks.length > 0
            ? projectTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) /
              (projectTasks.length * 100)
            : 0;

      const projNodeId = `proj_${p.project_id}`;
      const isProjectOpen =
        projectOpenStates.value[projNodeId] !== undefined
          ? projectOpenStates.value[projNodeId]
          : true;

      // Add Project Summary Row
      data.push({
        id: projNodeId,
        text: p.name,
        start_date: formatGanttDate(pStart),
        end_date: formatGanttDate(pEnd),
        progress: Math.min(1, Math.max(0, calculatedProgress)),
        type: 'project',
        open: isProjectOpen,
        $open: isProjectOpen,
        project_id: p.project_id,
        task_count: projectTasks.length,
        status: p.status,
        priority: p.priority,
      });

      // Add Child Tasks
      childTaskDataItems.forEach((item) => data.push(item));
    });
  } else {
    // Flat task list
    filteredTasks.forEach((t) => {
      const {
        segments,
        earliestStart: tStart,
        latestEnd: tEnd,
        totalHours,
      } = getTaskWorkSegments(t);

      const p = projectMap.value.get(t.project_id);

      const myId = authStore.user?.user_id ? Number(authStore.user.user_id) : null;
      const supId = t.supervisor_id ? Number(t.supervisor_id) : null;
      const supName = resolveSupervisorName(t);
      const assignedIds = parseResourceIds(t.assigned_resource_ids);
      const isSupervisedByMe = Boolean(
        t.is_supervised || (myId && supId === myId && !assignedIds.includes(myId)),
      );
      const resolvedAssigneeName = resolveAssigneeName(t);
      const baseExpectedEffort = Number(t.expected_effort || totalHours || 0);
      const supervisorEffort = supId ? Number((baseExpectedEffort * 0.2).toFixed(1)) : 0;
      const assigneesCount = Math.max(1, assignedIds.length || 1);
      const effortPerAssignee = Number((baseExpectedEffort / assigneesCount).toFixed(2));
      const totalReq = supId
        ? Number((baseExpectedEffort + supervisorEffort).toFixed(1))
        : baseExpectedEffort;

      const displayExpectedEffort = props.isResourceView
        ? isSupervisedByMe
          ? supervisorEffort
          : effortPerAssignee
        : totalReq;

      const targetDurationHours = props.isResourceView
        ? displayExpectedEffort
        : supId
          ? Number((effortPerAssignee + supervisorEffort).toFixed(2))
          : effortPerAssignee;

      const { start: resolvedFlatStart, end: resolvedFlatEnd } = computeTaskGanttDates(
        t,
        tStart,
        tEnd,
        segments,
        targetDurationHours,
      );

      data.push({
        id: t.task_id,
        text: t.title,
        start_date: formatGanttDate(resolvedFlatStart),
        end_date: formatGanttDate(resolvedFlatEnd),
        duration: Number((targetDurationHours / 8).toFixed(2)),
        duration_hours: targetDurationHours,
        progress: (Number(t.progress) || 0) / 100,
        priority: t.priority,
        status: t.status,
        project_name: p?.name || '—',
        assignee_name: resolvedAssigneeName,
        supervisor_id: supId,
        supervisor_name: supName,
        is_supervised: isSupervisedByMe,
        expected_effort: displayExpectedEffort,
        total_expected_effort: totalReq,
        base_expected_effort: baseExpectedEffort,
        assignees_count: assigneesCount,
        effort_per_assignee: effortPerAssignee,
        actual_effort: Number(t.actual_effort || 0),
        supervisor_effort: supervisorEffort,
        type: 'task',
        segments,
        total_hours: totalHours,
        is_segmented: segments.length > 1,
        is_external: Boolean(t.is_external),
        planned_start: t.planned_start,
        planned_end: t.planned_end,
        actual_start: t.actual_start,
        actual_end: t.actual_end,
        schedules: t.schedules,
        assigned_resources: t.assigned_resources,
      });
    });
  }

  // Predecessor Dependency Links (connecting task to task)
  if (showDependencies.value) {
    let linkCounter = 1;
    filteredTasks.forEach((t) => {
      if (t.predecessor_task_ids && t.predecessor_task_ids.length > 0) {
        t.predecessor_task_ids.forEach((predId) => {
          if (filteredTasks.some((other) => other.task_id === predId)) {
            links.push({
              id: linkCounter++,
              source: predId,
              target: t.task_id,
              type: '0', // Finish-to-Start
            });
          }
        });
      }
    });
  }

  return { data, links };
}

function updateDateRangeHeader() {
  const state = gantt.getState();
  if (!state.min_date || !state.max_date) {
    displayDateRange.value = '';
    return;
  }

  const minD = new Date(state.min_date);
  const maxD = new Date(state.max_date);

  let displayEnd = maxD;
  if (maxD.getHours() === 0 && maxD.getMinutes() === 0 && maxD.getSeconds() === 0) {
    displayEnd = new Date(maxD.getTime() - 1000 * 60 * 60 * 24);
  }

  const text = `${formatDate(minD)} – ${formatDate(displayEnd)}`;
  displayDateRange.value = text;
  emit('date-range-changed', text);
}

// ----------------------------------------------------
// UI Action Handlers
// ----------------------------------------------------
function refreshGantt() {
  if (!ganttContainer.value) return;

  const scrollState = typeof gantt.getScrollState === 'function' ? gantt.getScrollState() : null;

  applyColumnsConfig();
  applyScaleMode(activeScale.value);
  const dataset = buildGanttDataset();

  gantt.clearAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gantt.parse(dataset as any);
  updateCustomMarkers();
  gantt.render();

  if (scrollState && (scrollState.x > 0 || scrollState.y > 0)) {
    try {
      gantt.scrollTo(scrollState.x, scrollState.y);
    } catch {
      // ignore
    }
  } else {
    scrollToToday();
  }

  updateDateRangeHeader();
}

function toggleExtraColumns() {
  showExtraColumns.value = !showExtraColumns.value;
  applyColumnsConfig();
  gantt.render();
}

function setScale(scale: 'hour' | 'day' | 'week' | 'month') {
  activeScale.value = scale;
  refreshGantt();
}

function toggleHierarchy() {
  isHierarchical.value = !isHierarchical.value;
  refreshGantt();
}

function expandAll() {
  gantt.eachTask((task) => {
    task.$open = true;
    task.open = true;
    if (String(task.id).startsWith('proj_')) {
      projectOpenStates.value[String(task.id)] = true;
    }
  });
  gantt.render();
}

function collapseAll() {
  gantt.eachTask((task) => {
    task.$open = false;
    task.open = false;
    if (String(task.id).startsWith('proj_')) {
      projectOpenStates.value[String(task.id)] = false;
    }
  });
  gantt.render();
}

function scrollToToday() {
  try {
    gantt.showDate(new Date());
    updateDateRangeHeader();
  } catch {
    // Ignore
  }
}

function toggleDependencies() {
  showDependencies.value = !showDependencies.value;
  refreshGantt();
}

// ----------------------------------------------------
// Lifecycle Hooks & Event Listeners
// ----------------------------------------------------
let onTaskClickId: string | null = null;
let onBeforeDragId: string | null = null;
let onBeforeLinkId: string | null = null;
let onDblClickId: string | null = null;
let onLightboxId: string | null = null;
let onTaskOpenedId: string | null = null;
let onTaskClosedId: string | null = null;

onMounted(() => {
  if (!ganttContainer.value) return;

  configureGanttEngine();
  gantt.init(ganttContainer.value);

  onBeforeDragId = gantt.attachEvent('onBeforeTaskDrag', () => false);
  onBeforeLinkId = gantt.attachEvent('onBeforeLinkAdd', () => false);
  onDblClickId = gantt.attachEvent('onTaskDblClick', () => false);
  onLightboxId = gantt.attachEvent('onBeforeLightbox', () => false);

  onTaskOpenedId = gantt.attachEvent('onTaskOpened', (id: string | number) => {
    projectOpenStates.value[String(id)] = true;
    return true;
  });

  onTaskClosedId = gantt.attachEvent('onTaskClosed', (id: string | number) => {
    projectOpenStates.value[String(id)] = false;
    return true;
  });

  onTaskClickId = gantt.attachEvent('onTaskClick', (id: string | number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gantt as any).ext?.tooltips?.tooltip?.hide?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gantt as any).hideTooltip?.();
    } catch {
      // Ignore
    }

    // Toggle project branch open/close on project row or chevron click
    if (String(id).startsWith('proj_')) {
      if (gantt.isTaskExists(id)) {
        const taskObj = gantt.getTask(id);
        const nextOpen = !taskObj.$open;
        taskObj.$open = nextOpen;
        taskObj.open = nextOpen;
        projectOpenStates.value[String(id)] = nextOpen;
        if (nextOpen) {
          gantt.open(id);
        } else {
          gantt.close(id);
        }
      }
      return false;
    }

    if (typeof id === 'number' || (!String(id).startsWith('proj_') && !isNaN(Number(id)))) {
      const numericId = Number(id);
      const found = props.tasks.find((t) => t.task_id === numericId);
      if (found) {
        emit('task-click', found);
      }
    }
    return false;
  });

  refreshGantt();
});

onBeforeUnmount(() => {
  if (onTaskClickId) gantt.detachEvent(onTaskClickId);
  if (onBeforeDragId) gantt.detachEvent(onBeforeDragId);
  if (onBeforeLinkId) gantt.detachEvent(onBeforeLinkId);
  if (onDblClickId) gantt.detachEvent(onDblClickId);
  if (onLightboxId) gantt.detachEvent(onLightboxId);
  if (onTaskOpenedId) gantt.detachEvent(onTaskOpenedId);
  if (onTaskClosedId) gantt.detachEvent(onTaskClosedId);
  clearCustomMarkers();
  gantt.clearAll();
});

watch(
  [
    () => props.tasks,
    () => props.projects,
    () => props.holidays,
    () => props.availability,
    () => props.isResourceView,
    internalSearchQuery,
    () => props.groupByProject,
  ],
  () => {
    refreshGantt();
  },
  { deep: true },
);

watch(isDark, () => {
  if (ganttContainer.value) {
    gantt.render();
  }
});

defineExpose({
  refreshGantt,
  scrollToToday,
  setScale,
  expandAll,
  collapseAll,
});
</script>

<style lang="scss">
/* Pixel-Perfect DHTMLX Gantt Roadmap Component Styles */
.dhtmlx-roadmap-card {
  background: var(--wo-bg-card, #ffffff);
  border-radius: 14px;
  border: 1px solid var(--wo-border, #e2e8f0);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  font-family: var(--font-primary, 'Plus Jakarta Sans', 'Inter', sans-serif);

  /* 1. Header Row */
  .gantt-header-row {
    background: #ffffff;
    min-height: 58px;

    /* Mobile: let the header wrap gracefully */
    @media (max-width: 600px) {
      padding: 10px 12px;
      min-height: unset;
      gap: 8px;

      .header-left-block {
        width: 100%;
      }

      .header-right-controls {
        width: 100%;
        gap: 4px;

        .gantt-search-input {
          flex: 1;
          min-width: 0;
          width: auto !important;
        }
      }
    }

    .gantt-brand-icon {
      display: inline-flex;
      align-items: flex-end;
      gap: 3px;
      height: 22px;
      padding-bottom: 2px;

      .bar {
        width: 4.5px;
        border-radius: 3px;
        background: #7c3aed;

        &.bar-1 {
          height: 14px;
          background: #8b5cf6;
        }
        &.bar-2 {
          height: 20px;
          background: #7c3aed;
        }
        &.bar-3 {
          height: 11px;
          background: #a78bfa;
        }
      }
    }

    .gantt-title-text {
      font-size: 16.5px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .gantt-date-range-sub {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }

    /* Controls */
    .gantt-search-input {
      width: 165px;

      .q-field__control {
        height: 32px;
        min-height: 32px;
        border-radius: 20px;
        background: #f8fafc;
        padding: 0 10px;
      }
      .q-field__native {
        font-size: 12px;
        color: #334155;
      }
    }

    /* Segmented Scale Toggle */
    .scale-toggle-group {
      background: #f1f5f9;
      padding: 3px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;

      .scale-btn {
        border: none;
        background: transparent;
        font-size: 11.5px;
        font-weight: 600;
        color: #64748b;
        padding: 3px 10px;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.15s ease;

        &.active {
          background: #7c3aed;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);
        }

        &:hover:not(.active) {
          color: #1e293b;
        }
      }
    }

    /* Pill Buttons (Hierarchy, Today & Links) */
    .ctrl-pill-btn {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      &.is-active-pill {
        border-color: #c4b5fd;
        background: #f5f3ff;
        color: #6d28d9;
      }

      &.links-active {
        border-color: #c4b5fd;
        background: #f5f3ff;
        color: #6d28d9;
      }
    }

    .ctrl-icon-pill-btn {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 4px 6px;
      border-radius: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    }
  }

  /* 2. Subheader Legend Row */
  .gantt-legend-row {
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    min-height: 34px;

    .legend-label {
      color: #64748b;
      font-weight: 600;
      font-size: 11px;
    }

    .legend-item {
      font-size: 11px;
      color: #475569;
      font-weight: 500;

      .legend-line-sample {
        display: inline-block;
        width: 14px;
        height: 0;
        vertical-align: middle;

        &.sample-today {
          border-top: 2px solid #7c3aed;
        }
        &.sample-holiday {
          border-top: 2px dashed #d97706;
        }
        &.sample-leave {
          border-top: 2px dashed #0891b2;
        }
      }

      .legend-box-sample {
        display: inline-block;
        width: 12px;
        height: 10px;
        border-radius: 2px;
        border: 1px solid #cbd5e1;
        vertical-align: middle;

        &.sample-nwd {
          background: rgba(148, 163, 184, 0.25);
        }
      }

      .p-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;

        &.dot-low {
          background: #64748b;
        }
        &.dot-medium {
          background: #2563eb;
        }
        &.dot-high {
          background: #ea580c;
        }
        &.dot-critical {
          background: #dc2626;
        }
        &.dot-completed {
          background: #10b981;
        }
      }
    }
  }

  /* 3. Gantt Canvas Viewport */
  .gantt-canvas-wrapper {
    position: relative;
    width: 100%;
    min-height: 480px;
    height: 600px;
    background: #ffffff;
    overflow-x: auto;

    @media (max-width: 600px) {
      min-height: 320px;
      height: 420px;
    }

    .gantt-chart-viewport {
      width: 100%;
      height: 100%;
    }

    .gantt-no-data-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      z-index: 10;
    }
  }

  /* 4. Footer Row */
  .gantt-footer-row {
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    min-height: 38px;
  }

  /* ----------------------------------------------------
     DHTMLX Global Overrides & Tree Chevrons
     ---------------------------------------------------- */
  .gantt_container {
    font-family: inherit;
    border: none;
    background: transparent;
  }

  /* Scales & Header Rows */
  .gantt_grid_scale,
  .gantt_task_scale {
    background: #ffffff;
    color: #334155;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
  }

  .gantt_grid_head_cell {
    color: #1e293b;
    font-weight: 800;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-right: 1px solid #e2e8f0;
    padding: 0 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;

    &.gantt_grid_head_text {
      justify-content: flex-start;
      padding-left: 10px;
    }
  }

  .gantt_scale_cell {
    color: #475569;
    font-weight: 700;
    font-size: 10.5px;
    border-right: 1px solid #f1f5f9;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Tree Expander Chevrons */
  .gantt_tree_icon {
    cursor: pointer;

    &:before {
      display: none !important;
      content: '' !important;
    }

    &.gantt_open,
    &.gantt_close {
      background-image: none !important;
      background: none !important;
      position: relative;
      cursor: pointer;
      width: 20px !important;
      height: 20px !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      user-select: none;
      transition:
        transform 0.15s ease,
        color 0.15s ease;

      &:before {
        display: none !important;
        content: '' !important;
      }

      &:hover::after {
        color: #6d28d9;
        transform: translate(-50%, -50%) scale(1.2);
      }
    }

    &.gantt_open {
      &::after {
        content: '▾';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 13px;
        font-weight: 800;
        color: #7c3aed;
        transition:
          transform 0.15s ease,
          color 0.15s ease;
      }
    }

    &.gantt_close {
      &::after {
        content: '▸';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 13px;
        font-weight: 800;
        color: #7c3aed;
        transition:
          transform 0.15s ease,
          color 0.15s ease;
      }
    }

    &.gantt_file,
    &.gantt_folder_open,
    &.gantt_folder_closed {
      background-image: none !important;
      display: none !important;
      width: 0 !important;
    }
  }

  /* Grid Rows & Cells */
  .gantt_row,
  .gantt_task_row {
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s ease;

    &:hover {
      background: #f8fafc !important;
    }

    &.gantt_selected {
      background: rgba(124, 58, 237, 0.06) !important;
    }
  }

  /* Distinct Project Row in Grid */
  .dhtmlx-grid-row-project {
    background: #f8fafc !important;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0 !important;
    cursor: pointer;

    .gantt_cell {
      color: #0f172a;
    }
  }

  .dhtmlx-grid-row-task {
    background: #ffffff;
  }

  .gantt_cell {
    color: #1e293b;
    font-size: 12px;
    border-right: 1px solid #f1f5f9;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &.gantt_cell_tree {
      justify-content: flex-start;
      padding-left: 6px;
    }
  }

  .gantt_task_cell {
    border-right: 1px solid #f8fafc;
  }

  /* Column Contents */
  .gantt-col-project {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    overflow: hidden;

    .project-icon-badge {
      font-size: 13px;
      flex-shrink: 0;
    }

    .project-title {
      font-size: 12.5px;
      color: #0f172a;
      font-weight: 700;
    }

    .task-count-pill {
      font-size: 10px;
      padding: 1px 6px;
      background: #f3e8ff;
      color: #7c3aed;
      border-radius: 10px;
      font-weight: 700;
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .gantt-col-task {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    overflow: hidden;

    .task-icon-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8b5cf6;
      flex-shrink: 0;
    }

    .task-title {
      font-size: 12px;
      color: #334155;
      font-weight: 500;
      min-width: 0;
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-count-pill {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 700;
      margin-left: auto;
      flex-shrink: 0;
      white-space: nowrap;
    }
  }

  /* Badges in Left Table */
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 600;
    max-width: 100%;
    line-height: 1.2;
    text-align: center;
    white-space: normal;
    word-break: break-word;

    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .badge-text {
      line-height: 1.1;
      display: inline-block;
    }

    &.s-completed {
      background: #ecfdf5;
      color: #059669;
      .status-dot {
        background: #10b981;
      }
    }
    &.s-in-progress {
      background: #eff6ff;
      color: #1d4ed8;
      .status-dot {
        background: #2563eb;
      }
    }
    &.s-scheduled {
      background: #f5f3ff;
      color: #6d28d9;
      .status-dot {
        background: #7c3aed;
      }
    }
    &.s-unassigned {
      background: #f1f5f9;
      color: #475569;
      .status-dot {
        background: #94a3b8;
      }
    }
  }

  .priority-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 700;
    max-width: 100%;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.p-critical {
      background: #fef2f2;
      color: #dc2626;
    }
    &.p-high {
      background: #fff7ed;
      color: #ea580c;
    }
    &.p-medium {
      background: #eff6ff;
      color: #2563eb;
    }
    &.p-low {
      background: #f1f5f9;
      color: #475569;
    }
  }

  .duration-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 600;
    background: #f0f9ff;
    color: #0284c7;
    white-space: nowrap;
    text-align: center;

    &.project-dur-badge {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
    }
  }

  .effort-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 600;
    background: #f5f3ff;
    color: #6d28d9;
    white-space: nowrap;
    text-align: center;

    &.combined-effort-badge {
      background: #faf5ff;
      color: #7c3aed;
      border: 1px solid #e9d5ff;

      .sup-split {
        font-size: 9.5px;
        color: #b45309;
        font-weight: 700;
      }
    }

    &.sup-effort-badge {
      background: #fef3c7;
      color: #b45309;
      font-weight: 700;
    }

    &.project-effort-badge {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
    }
  }

  /* Completely disable/hide drag and resize handles on task bars */
  .gantt_task_drag,
  .gantt_task_progress_drag,
  .gantt_link_control,
  .gantt_link_point {
    display: none !important;
    pointer-events: none !important;
  }

  /* ----------------------------------------------------
     Project Summary Bar & Task Bar Styling
     ---------------------------------------------------- */
  /* Project Summary Bar */
  .dhtmlx-bar-project {
    background: linear-gradient(90deg, #1e1b4b 0%, #312e81 100%) !important;
    border: 1.5px solid #4338ca !important;
    border-radius: 8px !important;
    box-shadow: 0 3px 12px rgba(30, 27, 75, 0.35) !important;
    cursor: pointer;

    .gantt_task_progress {
      background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%) !important;
      opacity: 0.9;
      border-radius: 6px 0 0 6px;
    }

    .gantt-bar-content-wrapper.is-project {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 8px 0 4px;
      gap: 6px;
      color: #ffffff;

      .project-pct {
        background: rgba(124, 58, 237, 0.6);
        border: 1px solid rgba(196, 181, 253, 0.5);
      }

      .is-project-title {
        font-size: 11.5px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 0.01em;
      }
    }
  }

  /* Task Bar Container & Content Overrides */
  .dhtmlx-bar-task {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
    cursor: pointer;

    .gantt_task_progress {
      display: none !important;
    }

    .gantt_task_content {
      overflow: visible !important;
      position: static !important;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
    }
  }

  /* Custom Segments Container & Pills (renders gaps accurately on non-working days) */
  .gantt-segments-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 28px;
    pointer-events: auto;
  }

  .gantt-segment-pill {
    position: absolute;
    top: 0;
    height: 28px;
    border-radius: 7px;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 0 6px;
    gap: 4px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    box-sizing: border-box;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;

    &:hover {
      transform: translateY(-1px);
      z-index: 5;
    }

    .segment-progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(0, 0, 0, 0.18);
      pointer-events: none;
      border-radius: 7px 0 0 7px;
    }

    .segment-title {
      position: relative;
      z-index: 2;
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .segment-pct-badge {
      position: relative;
      z-index: 2;
      background: rgba(0, 0, 0, 0.45);
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1.2;
    }

    .segment-hours-badge {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1.2;
      margin-left: auto;
    }

    /* 1. Crimson Red (Critical Priority) */
    &.bar-p-critical {
      background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%) !important;
      border: 1px solid #b91c1c !important;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35) !important;
    }

    /* 2. Vibrant Orange (High Priority) */
    &.bar-p-high {
      background: linear-gradient(90deg, #ea580c 0%, #f97316 100%) !important;
      border: 1px solid #c2410c !important;
      box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35) !important;
    }

    /* 3. Royal Blue (Medium Priority) */
    &.bar-p-medium {
      background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%) !important;
      border: 1px solid #1d4ed8 !important;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35) !important;
    }

    /* 4. Slate Grey (Low Priority) */
    &.bar-p-low {
      background: linear-gradient(90deg, #64748b 0%, #94a3b8 100%) !important;
      border: 1px solid #475569 !important;
      box-shadow: 0 2px 8px rgba(100, 116, 139, 0.35) !important;
    }

    /* 5. Emerald Green (Completed Status) */
    &.bar-s-completed {
      background: linear-gradient(90deg, #059669 0%, #10b981 100%) !important;
      border: 1px solid #047857 !important;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35) !important;
    }
  }

  /* Dependency Link Lines */
  .gantt_line_wrapper div {
    background-color: #6366f1 !important;
    height: 2px !important;
  }

  .gantt_link_arrow {
    border-left-color: #6366f1 !important;
  }

  .gantt_link_point {
    background: #6366f1 !important;
    border: 2px solid #ffffff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  /* Today Marker */
  .dhtmlx-today-marker {
    background: #7c3aed !important;
    width: 2px !important;
    z-index: 5;

    .gantt_marker_content {
      background: #7c3aed;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(124, 58, 237, 0.4);
      white-space: nowrap;
      text-transform: uppercase;
      top: 2px;
    }
  }

  /* Holiday Vertical Line Marker (Amber Gold) - Distinct from Orange High Priority */
  .dhtmlx-holiday-marker {
    background: transparent !important;
    width: 0px !important;
    border-left: 2px dashed #d97706 !important;
    z-index: 6;

    .gantt_marker_content {
      background: #d97706;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(217, 119, 6, 0.45);
      white-space: nowrap;
      top: 2px;
    }
  }

  /* Leave Vertical Line Marker (Teal / Cyan) - Distinct from Purple Today Marker */
  .dhtmlx-leave-marker {
    background: transparent !important;
    width: 0px !important;
    border-left: 2px dashed #0891b2 !important;
    z-index: 6;

    .gantt_marker_content {
      background: #0891b2;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(8, 145, 178, 0.45);
      white-space: nowrap;
      top: 2px;
    }
  }

  /* Non-Working Day Marker */
  .dhtmlx-nwd-marker {
    background: #64748b !important;
    width: 1px !important;
    border-left: 1px dotted #94a3b8 !important;
    z-index: 4;

    .gantt_marker_content {
      background: #64748b;
      color: #ffffff;
      font-size: 8px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      white-space: nowrap;
      top: 2px;
    }
  }

  /* Column cell highlighting */
  .gantt-col-holiday {
    background-color: rgba(245, 158, 11, 0.09) !important;
    border-left: 1px dashed rgba(217, 119, 6, 0.35) !important;
    border-right: 1px dashed rgba(217, 119, 6, 0.35) !important;
  }
  .gantt-col-leave {
    background-color: rgba(6, 182, 212, 0.09) !important;
    border-left: 1px dashed rgba(8, 145, 178, 0.35) !important;
    border-right: 1px dashed rgba(8, 145, 178, 0.35) !important;
  }
  .gantt-col-leave-first-half {
    background: linear-gradient(to right, rgba(6, 182, 212, 0.11) 50%, transparent 50%) !important;
    border-left: 1px dashed rgba(8, 145, 178, 0.35) !important;
  }
  .gantt-col-leave-second-half {
    background: linear-gradient(to right, transparent 50%, rgba(6, 182, 212, 0.11) 50%) !important;
    border-right: 1px dashed rgba(8, 145, 178, 0.35) !important;
  }
  .gantt-col-nwd {
    background-color: rgba(148, 163, 184, 0.08) !important;
  }

  .gantt-scale-holiday {
    background-color: rgba(245, 158, 11, 0.15) !important;
    color: #b45309 !important;
    font-weight: 700 !important;
  }
  .gantt-scale-leave {
    background-color: rgba(6, 182, 212, 0.15) !important;
    color: #0e7490 !important;
    font-weight: 700 !important;
  }
  .gantt-scale-leave-first-half {
    background: linear-gradient(to right, rgba(6, 182, 212, 0.15) 50%, transparent 50%) !important;
    color: #0e7490 !important;
    font-weight: 700 !important;
  }
  .gantt-scale-leave-second-half {
    background: linear-gradient(to right, transparent 50%, rgba(6, 182, 212, 0.15) 50%) !important;
    color: #0e7490 !important;
    font-weight: 700 !important;
  }
  .gantt-scale-nwd {
    background-color: rgba(148, 163, 184, 0.12) !important;
    color: #64748b !important;
  }
}

/* Tooltip Popup */
.gantt_tooltip {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;

  .gantt-tooltip-card {
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    padding: 12px 14px;
    min-width: 240px;
    max-width: 340px;
    font-family: var(--font-primary, sans-serif);

    .tooltip-header {
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 8px;

      .tooltip-title {
        font-weight: 700;
        color: #1e293b;
        font-size: 13px;
        line-height: 1.3;
      }
      .tooltip-project-tag {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
    }

    .tooltip-body {
      display: flex;
      flex-direction: column;
      gap: 5px;

      .tooltip-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        font-size: 11.5px;
        gap: 8px;

        .tooltip-k {
          color: #64748b;
          font-weight: 500;
          flex-shrink: 0;
        }
        .tooltip-v {
          color: #1e293b;
          font-weight: 600;
          text-align: right;
          white-space: normal;
          word-break: break-word;
        }

        .tooltip-progress-box {
          display: flex;
          align-items: center;
          gap: 6px;

          .tooltip-bar {
            width: 50px;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;

            .fill {
              height: 100%;
              background: #8b5cf6;
              border-radius: 3px;
            }
          }
        }
      }

      .tooltip-segments-list {
        font-size: 10.5px;
        color: #475569;
        background: #f8fafc;
        border-radius: 6px;
        padding: 4px 8px;
        width: 100%;
        border: 1px solid #e2e8f0;

        .tooltip-seg-item {
          padding: 1px 0;
          white-space: normal;
          word-break: break-word;
        }
      }
    }
  }
}

/* ----------------------------------------------------
   Dark Mode Overrides for DHTMLX Gantt
   ---------------------------------------------------- */
body.body--dark {
  .dhtmlx-roadmap-card {
    border-color: var(--wo-border, #1e2433);
    background: var(--wo-bg-card, #181d28);

    .gantt-header-row {
      background: var(--wo-bg-card, #181d28);
      .gantt-title-text {
        color: #ffffff;
      }
      .gantt-date-range-sub {
        color: #94a3b8;
      }
      .gantt-search-input {
        .q-field__control {
          background: #111827;
        }
        .q-field__native {
          color: #f1f5f9;
        }
      }
      .scale-toggle-group {
        background: #111827;
        border-color: #1e293b;
        .scale-btn {
          color: #94a3b8;
          &:hover:not(.active) {
            color: #ffffff;
          }
        }
      }
      .ctrl-pill-btn {
        border-color: #1e293b;
        background: #1e293b;
        color: #cbd5e1;
        &:hover {
          background: #334155;
          border-color: #475569;
        }
        &.is-active-pill,
        &.links-active {
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.2);
          color: #a78bfa;
        }
      }
      .ctrl-icon-pill-btn {
        border-color: #1e293b;
        background: #1e293b;
        color: #cbd5e1;
        &:hover {
          background: #334155;
          border-color: #475569;
        }
      }
    }

    .gantt-legend-row {
      background: var(--wo-bg-card, #181d28);
      border-top-color: #1e2433;
      .legend-label,
      .legend-item {
        color: #94a3b8;
      }
      .legend-box-sample {
        border-color: #475569;
        &.sample-nwd {
          background: rgba(148, 163, 184, 0.2);
        }
      }
    }

    .header-divider {
      background: #1e2433;
    }

    .gantt-canvas-wrapper {
      background: #181d28;

      .gantt-no-data-overlay {
        background: rgba(24, 29, 40, 0.95);
        .text-dark {
          color: #ffffff !important;
        }
      }
    }

    .gantt-footer-row {
      background: var(--wo-bg-card, #181d28);
      border-top-color: #1e2433;
    }

    /* Gantt chart elements */
    .gantt_container,
    .gantt_data_area,
    .gantt_task_bg,
    .gantt_grid {
      background: transparent !important;
      background-color: transparent !important;
    }

    .gantt_grid_scale,
    .gantt_task_scale {
      background: #1e2433;
      color: #cbd5e1;
      border-bottom-color: #1e293b;
    }

    .gantt_grid_head_cell {
      color: #f1f5f9;
      border-right-color: #1e293b;
    }

    .gantt_scale_cell {
      color: #94a3b8;
      border-right-color: #1e293b;
    }

    .gantt_row,
    .gantt_task_row {
      background: #181d28;
      border-bottom-color: #1e2433;

      &:hover {
        background: #1e2433 !important;
      }

      &.gantt_selected {
        background: rgba(124, 58, 237, 0.15) !important;
      }
    }

    .dhtmlx-grid-row-project {
      background: #1e2433 !important;
      border-bottom-color: #1e293b !important;
      .gantt_cell {
        color: #ffffff;
      }
    }

    .gantt_cell {
      color: #cbd5e1;
      border-right-color: #1e2433;
    }

    .gantt_task_cell {
      border-right-color: #1e2433;
    }

    .gantt-col-project {
      .project-title {
        color: #ffffff;
      }
      .task-count-pill {
        background: #2e1065;
        color: #c084fc;
      }
    }

    .gantt-col-task {
      .task-title {
        color: #cbd5e1;
      }
      .task-count-pill {
        white-space: nowrap;
      }
    }

    .gantt_resizer {
      background-color: #1e2433 !important;
    }

    .status-badge {
      &.s-completed {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
      &.s-in-progress {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.s-scheduled {
        background: rgba(139, 92, 246, 0.15);
        color: #a78bfa;
      }
      &.s-unassigned {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
      }
    }

    .priority-badge {
      &.p-critical {
        background: rgba(239, 68, 68, 0.18);
        color: #f87171;
      }
      &.p-high {
        background: rgba(249, 115, 22, 0.18);
        color: #fb923c;
      }
      &.p-medium {
        background: rgba(37, 99, 235, 0.18);
        color: #60a5fa;
      }
      &.p-low {
        background: rgba(148, 163, 184, 0.18);
        color: #94a3b8;
      }
    }

    .status-badge {
      &.s-completed {
        background: rgba(16, 185, 129, 0.18);
        color: #34d399;
      }
      &.s-in-progress {
        background: rgba(37, 99, 235, 0.18);
        color: #60a5fa;
      }
      &.s-scheduled {
        background: rgba(124, 58, 237, 0.18);
        color: #c084fc;
      }
      &.s-unassigned {
        background: rgba(148, 163, 184, 0.18);
        color: #94a3b8;
      }
    }

    .duration-badge {
      background: rgba(37, 99, 235, 0.18);
      color: #60a5fa;

      &.project-dur-badge {
        background: rgba(148, 163, 184, 0.15);
        color: #cbd5e1;
      }
    }

    .effort-badge {
      background: rgba(124, 58, 237, 0.18);
      color: #c084fc;

      &.combined-effort-badge {
        background: rgba(124, 58, 237, 0.22);
        color: #d8b4fe;
        border: 1px solid rgba(168, 85, 247, 0.35);

        .sup-split {
          color: #fbbf24;
        }
      }

      &.sup-effort-badge {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }

      &.project-effort-badge {
        background: rgba(148, 163, 184, 0.15);
        color: #cbd5e1;
      }
    }

    /* Today marker boundary/accent */
    .gantt_link_point {
      border-color: #181d28 !important;
    }

    .gantt-col-holiday {
      background-color: rgba(245, 158, 11, 0.15) !important;
      border-left: 1px dashed rgba(245, 158, 11, 0.45) !important;
      border-right: 1px dashed rgba(245, 158, 11, 0.45) !important;
    }
    .gantt-col-leave {
      background-color: rgba(6, 182, 212, 0.15) !important;
      border-left: 1px dashed rgba(6, 182, 212, 0.45) !important;
      border-right: 1px dashed rgba(6, 182, 212, 0.45) !important;
    }
    .gantt-col-leave-first-half {
      background: linear-gradient(
        to right,
        rgba(6, 182, 212, 0.18) 50%,
        transparent 50%
      ) !important;
      border-left: 1px dashed rgba(6, 182, 212, 0.45) !important;
    }
    .gantt-col-leave-second-half {
      background: linear-gradient(
        to right,
        transparent 50%,
        rgba(6, 182, 212, 0.18) 50%
      ) !important;
      border-right: 1px dashed rgba(6, 182, 212, 0.45) !important;
    }
    .gantt-col-nwd {
      background-color: rgba(148, 163, 184, 0.1) !important;
    }

    .gantt-scale-holiday {
      background-color: rgba(245, 158, 11, 0.25) !important;
      color: #fcd34d !important;
    }
    .gantt-scale-leave {
      background-color: rgba(6, 182, 212, 0.25) !important;
      color: #67e8f9 !important;
    }
    .gantt-scale-leave-first-half {
      background: linear-gradient(
        to right,
        rgba(6, 182, 212, 0.25) 50%,
        transparent 50%
      ) !important;
      color: #67e8f9 !important;
    }
    .gantt-scale-leave-second-half {
      background: linear-gradient(
        to right,
        transparent 50%,
        rgba(6, 182, 212, 0.25) 50%
      ) !important;
      color: #67e8f9 !important;
    }
    .gantt-scale-nwd {
      background-color: rgba(148, 163, 184, 0.15) !important;
      color: #94a3b8 !important;
    }
  }
}

/* Tooltip Popup in Dark Mode */
body.body--dark {
  .gantt_tooltip {
    .gantt-tooltip-card {
      background: #1e2433;
      border-color: #334155;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

      .tooltip-header {
        border-bottom-color: #334155;
        .tooltip-title {
          color: #ffffff;
        }
        .tooltip-project-tag {
          color: #94a3b8;
        }
      }

      .tooltip-body {
        .tooltip-row {
          .tooltip-k {
            color: #94a3b8;
          }
          .tooltip-v {
            color: #ffffff;
          }
          .tooltip-progress-box {
            .tooltip-bar {
              background: #334155;
            }
          }
        }

        .tooltip-segments-list {
          color: #cbd5e1;
          background: #111827;
          border-color: #334155;
        }
      }
    }
  }
}

/* External / Masked Tasks Styling */
.dhtmlx-bar-external {
  background: repeating-linear-gradient(
    45deg,
    #f8fafc,
    #f8fafc 8px,
    #f1f5f9 8px,
    #f1f5f9 16px
  ) !important;
  border: 1px dashed #94a3b8 !important;
  opacity: 0.88;

  .gantt_task_progress {
    display: none !important;
  }
}

.bar-external-pill {
  background: #f1f5f9 !important;
  border: 1px dashed #94a3b8 !important;
  color: #64748b !important;
  font-style: italic;

  .segment-progress-fill {
    display: none !important;
  }
}

.is-external-row {
  background: rgba(241, 245, 249, 0.4) !important;
}

.is-external-task {
  opacity: 0.85;
}

.task-icon-lock {
  font-size: 11px;
  margin-right: 4px;
}

/* Supervised / Review Deliverables (Option A) */
.dhtmlx-bar-supervised {
  background: repeating-linear-gradient(
    45deg,
    rgba(245, 158, 11, 0.14),
    rgba(245, 158, 11, 0.14) 10px,
    rgba(217, 119, 6, 0.24) 10px,
    rgba(217, 119, 6, 0.24) 20px
  ) !important;
  border: 1.5px dashed #f59e0b !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.18) !important;
}

.bar-supervised-pill {
  background: linear-gradient(
    135deg,
    rgba(254, 243, 199, 0.95),
    rgba(253, 230, 138, 0.95)
  ) !important;
  border: 1.5px dashed #d97706 !important;
  color: #92400e !important;
  font-weight: 600;

  .supervisor-progress-fill {
    background: linear-gradient(90deg, #f59e0b, #d97706) !important;
  }

  .supervisor-pct-badge {
    background: #d97706 !important;
    color: #ffffff !important;
    font-weight: 700;
  }
}

.is-supervised-row {
  background: rgba(245, 158, 11, 0.06) !important;
}

.is-supervised-task {
  font-weight: 600;
}

.task-icon-supervisor {
  font-size: 12px;
  margin-right: 4px;
}

body.body--dark {
  .dhtmlx-bar-supervised {
    background: repeating-linear-gradient(
      45deg,
      rgba(245, 158, 11, 0.18),
      rgba(245, 158, 11, 0.18) 10px,
      rgba(217, 119, 6, 0.32) 10px,
      rgba(217, 119, 6, 0.32) 20px
    ) !important;
    border: 1.5px dashed #fbbf24 !important;
  }

  .bar-supervised-pill {
    background: linear-gradient(135deg, rgba(120, 53, 15, 0.8), rgba(180, 83, 9, 0.8)) !important;
    border: 1.5px dashed #f59e0b !important;
    color: #fde68a !important;

    .supervisor-progress-fill {
      background: linear-gradient(90deg, #d97706, #f59e0b) !important;
    }

    .supervisor-pct-badge {
      background: #f59e0b !important;
      color: #1e1b2e !important;
      font-weight: 700;
    }
  }

  .is-supervised-row {
    background: rgba(245, 158, 11, 0.12) !important;
  }
}
</style>
