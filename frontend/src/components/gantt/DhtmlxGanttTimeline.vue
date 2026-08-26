<template>
  <q-card flat bordered class="dhtmlx-roadmap-card">
    <!-- 1. GANTT HEADER ROW -->
    <div class="gantt-header-row row items-center justify-between no-wrap q-px-md q-py-sm">
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
      <div class="header-right-controls row items-center q-gutter-x-xs no-wrap">
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

        <!-- Scale Toggle Group: Day | Week | Month -->
        <div class="scale-toggle-group row items-center no-wrap">
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

        <!-- Today Button -->
        <button type="button" class="ctrl-pill-btn today-btn row items-center no-wrap" @click="scrollToToday">
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
          <q-icon name="link" size="15px" class="q-mr-xs text-purple-7" />
          <span>{{ showDependencies ? 'Links On' : 'Links Off' }}</span>
        </button>
      </div>
    </div>

    <!-- 2. SUBHEADER LEGEND ROW -->
    <div class="gantt-legend-row row items-center justify-between q-px-md q-py-xs">
      <!-- Left: Priority Dots -->
      <div class="legend-priority-list row items-center q-gutter-x-md text-caption">
        <span class="legend-label">Priority:</span>
        <div class="legend-item row items-center no-wrap">
          <span class="p-dot dot-low q-mr-xs"></span>
          <span>Low</span>
        </div>
        <div class="legend-item row items-center no-wrap">
          <span class="p-dot dot-medium q-mr-xs"></span>
          <span>Medium</span>
        </div>
        <div class="legend-item row items-center no-wrap">
          <span class="p-dot dot-high q-mr-xs"></span>
          <span>High</span>
        </div>
        <div class="legend-item row items-center no-wrap">
          <span class="p-dot dot-critical q-mr-xs"></span>
          <span>Critical</span>
        </div>
      </div>

      <!-- Right: Predecessor Dependency Line Indicator -->
      <div class="legend-dependency-indicator row items-center no-wrap text-caption">
        <q-icon name="trending_flat" size="18px" class="q-mr-xs text-purple-7" />
        <span class="text-purple-8 text-weight-medium">Predecessor Dependency Line</span>
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
          Interactive timeline with project hierarchy &amp; dependencies
        </span>
      </div>

      <div class="footer-right row items-center no-wrap text-caption text-grey-6 q-gutter-x-sm">
        <span>Scale: <strong class="text-uppercase text-grey-8">{{ activeScale }}</strong></span>
        <span>Showing {{ visibleCount }} of {{ totalCount }} tasks</span>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import type { Task, Project, ResourceUser } from '@/services/api';
import { useThemeStore } from '@/stores/theme';

export interface GanttTimelineProps {
  tasks: Task[];
  projects?: Project[];
  resources?: ResourceUser[];
  title?: string;
  initialScale?: 'day' | 'week' | 'month';
  groupByProject?: boolean;
}

export interface DhtmlxGanttTaskItem {
  id: string | number;
  text: string;
  start_date: string | Date;
  end_date: string | Date;
  duration?: number;
  progress?: number;
  parent?: string | number;
  type?: 'project' | 'task' | 'milestone';
  open?: boolean;
  priority?: string;
  status?: string;
  project_name?: string;
  project_id?: number;
  assignee_name?: string;
  task_count?: number;
  $open?: boolean;
}

const props = withDefaults(defineProps<GanttTimelineProps>(), {
  projects: () => [],
  resources: () => [],
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
const isDark = computed(() => themeStore.isDark);

const ganttContainer = ref<HTMLElement | null>(null);
const internalSearchQuery = ref('');
const activeScale = ref<'day' | 'week' | 'month'>(props.initialScale);
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

const totalCount = computed(() => props.tasks.length);
const visibleCount = ref(0);

// ----------------------------------------------------
// DHTMLX Configuration & Column Definitions
// ----------------------------------------------------
function configureGanttEngine() {
  gantt.plugins({
    marker: true,
    tooltip: true,
  });

  gantt.config.date_format = '%Y-%m-%d %H:%i';
  gantt.config.xml_date = '%Y-%m-%d %H:%i';

  // Layout Dimensions
  gantt.config.row_height = 44;
  gantt.config.bar_height = 28;
  gantt.config.grid_resize = true;
  gantt.config.grid_width = 490; // 200 (task/project) + 115 (status) + 95 (priority) + 80 (duration) = 490px
  gantt.config.fit_tasks = false;
  gantt.config.smart_rendering = true;
  gantt.config.preserve_scroll = true;

  // Interactivity
  gantt.config.drag_move = true;
  gantt.config.drag_resize = true;
  gantt.config.drag_progress = true;
  gantt.config.drag_links = true;
  gantt.config.details_on_dblclick = false;
  gantt.config.open_tree_initially = true;

  // Grid Columns: TASK & PROJECT, STATUS, PRIORITY, DURATION
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.config as any).columns = [
    {
      name: 'text',
      label: 'TASK & PROJECT',
      tree: true,
      width: 200,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        const text = escapeHtml(task.text || '');
        if (task.type === 'project') {
          const count = task.task_count || 0;
          return `<div class="gantt-col-project" title="${text}">` +
            `<span class="project-icon-badge">📁</span>` +
            `<strong class="project-title ellipsis">${text}</strong>` +
            `<span class="task-count-pill">${count} ${count === 1 ? 'task' : 'tasks'}</span>` +
            `</div>`;
        }
        return `<div class="gantt-col-task" title="${text}">` +
          `<span class="task-icon-dot"></span>` +
          `<span class="task-title ellipsis">${text}</span>` +
          `</div>`;
      },
    },
    {
      name: 'status',
      label: 'STATUS',
      align: 'center',
      width: 115,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (!task.status) return '<span class="text-muted">—</span>';
        const s = task.status.toUpperCase();
        let label = task.status;
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

        if (task.type === 'project') {
          return `<span class="status-badge is-project-status ${sClass}"><span class="status-dot"></span>${label}</span>`;
        }
        return `<span class="status-badge ${sClass}"><span class="status-dot"></span>${label}</span>`;
      },
    },
    {
      name: 'priority',
      label: 'PRIORITY',
      align: 'center',
      width: 95,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (!task.priority) return '<span class="text-muted">—</span>';
        const p = task.priority.toLowerCase();
        const pLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase();
        return `<span class="priority-badge p-${p}">${pLabel}</span>`;
      },
    },
    {
      name: 'duration',
      label: 'DURATION',
      align: 'center',
      width: 80,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        const dur = Math.max(1, Math.round(Number(task.duration) || 1));
        if (task.type === 'project') {
          return `<span class="duration-badge project-dur-badge">${dur}d</span>`;
        }
        return `<span class="duration-badge">${dur}d</span>`;
      },
    },
  ];

  // Custom Task Bar CSS Classes (Color-coded by Priority with gradients for tasks, distinct slate-indigo bar for projects)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).task_class = (_start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    if (task.type === 'project') {
      return 'dhtmlx-bar-project';
    }
    const classes = ['dhtmlx-bar-task'];
    if (task.priority) {
      classes.push(`bar-p-${task.priority.toLowerCase()}`);
    }
    if (task.status) {
      classes.push(`bar-s-${task.status.toLowerCase().replace('_', '-')}`);
    }
    return classes.join(' ');
  };

  // Custom Task Text Template inside Bar (Left progress badge pill + task title + assignee)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).task_text = (_start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    const pct = Math.round((task.progress || 0) * 100);
    const text = escapeHtml(task.text || '');
    if (task.type === 'project') {
      const count = task.task_count || 0;
      return `<div class="gantt-bar-content-wrapper is-project">` +
        `<span class="gantt-bar-pct-badge project-pct">${pct}%</span>` +
        `<span class="gantt-bar-title is-project-title ellipsis">📁 ${text} · ${count} ${count === 1 ? 'task' : 'tasks'}</span>` +
        `</div>`;
    }
    const assignee = task.assignee_name ? ` (${escapeHtml(task.assignee_name)})` : '';
    return `<div class="gantt-bar-content-wrapper">` +
      `<span class="gantt-bar-pct-badge">${pct}%</span>` +
      `<span class="gantt-bar-title ellipsis">${text}${assignee}</span>` +
      `</div>`;
  };

  // Custom Grid Row Class (Visual distinction between Project and Task rows)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).grid_row_class = (_start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    if (task.type === 'project') {
      return 'dhtmlx-grid-row-project';
    }
    return 'dhtmlx-grid-row-task';
  };

  // Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).tooltip_text = (start: Date, end: Date, task: DhtmlxGanttTaskItem) => {
    const text = escapeHtml(task.text || '');
    const projName = escapeHtml(task.project_name || 'TaskFlow Project');
    const pct = Math.round((task.progress || 0) * 100);
    const dateRange = `${formatDate(start)} – ${formatDate(end)}`;
    const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    if (task.type === 'project') {
      return `<div class="gantt-tooltip-card">` +
        `<div class="tooltip-header"><div class="tooltip-title">📁 ${text}</div><div class="tooltip-project-tag">Project Summary</div></div>` +
        `<div class="tooltip-body">` +
        `<div class="tooltip-row"><span class="tooltip-k">Timeline:</span><span class="tooltip-v">${dateRange} (${durationDays}d)</span></div>` +
        `<div class="tooltip-row"><span class="tooltip-k">Child Tasks:</span><span class="tooltip-v">${task.task_count || 0} tasks</span></div>` +
        `<div class="tooltip-row"><span class="tooltip-k">Calculated Progress:</span><div class="tooltip-progress-box"><div class="tooltip-bar"><div class="fill" style="width: ${pct}%"></div></div><span>${pct}%</span></div></div>` +
        `</div>` +
        `</div>`;
    }

    const assignee = escapeHtml(task.assignee_name || 'Unassigned');
    const statusText = task.status ? task.status.replace('_', ' ') : '—';
    const priorityText = task.priority || '—';

    return `<div class="gantt-tooltip-card">` +
      `<div class="tooltip-header"><div class="tooltip-title">${text}</div><div class="tooltip-project-tag">${projName}</div></div>` +
      `<div class="tooltip-body">` +
      `<div class="tooltip-row"><span class="tooltip-k">Status:</span><span class="tooltip-v">${statusText}</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">Priority:</span><span class="tooltip-v">${priorityText}</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">Assignee:</span><span class="tooltip-v">${assignee}</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">Schedule:</span><span class="tooltip-v">${dateRange} (${durationDays}d)</span></div>` +
      `<div class="tooltip-row"><span class="tooltip-k">Progress:</span><div class="tooltip-progress-box"><div class="tooltip-bar"><div class="fill" style="width: ${pct}%"></div></div><span>${pct}%</span></div></div>` +
      `</div>` +
      `</div>`;
  };

  // Weekend styling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gantt.templates as any).timeline_cell_class = (_task: unknown, date: Date) => {
    if (date.getDay() === 0 || date.getDay() === 6) {
      return 'dhtmlx-weekend-cell';
    }
    return '';
  };

  // Add Today Marker
  try {
    gantt.addMarker({
      start_date: new Date(),
      css: 'dhtmlx-today-marker',
      text: 'TODAY',
      title: 'Current Date',
    });
  } catch {
    // Marker already registered
  }
}

// ----------------------------------------------------
// Scale Configuration (Week, Day, Month)
// ----------------------------------------------------
function applyScaleMode(scale: 'day' | 'week' | 'month') {
  if (scale === 'day') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 46;
    gantt.config.scales = [
      { unit: 'month', step: 1, format: (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase() },
      { unit: 'day', step: 1, format: '%D, %d' },
    ];
  } else if (scale === 'month') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 80;
    gantt.config.scales = [
      { unit: 'year', step: 1, format: '%Y' },
      { unit: 'month', step: 1, format: (date: Date) => date.toLocaleDateString(undefined, { month: 'long' }).toUpperCase() },
    ];
  } else {
    // Week Mode (Default, matching screenshot: JULY 2026 / WEEK #30)
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 54;
    gantt.config.scales = [
      {
        unit: 'month',
        step: 1,
        format: (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase(),
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
    if (t.start_date) {
      const d = parseIsoToDate(t.start_date).getTime();
      if (!isNaN(d)) {
        if (d < minTime) minTime = d;
        if (d > maxTime) maxTime = d;
      }
    }
    if (t.deadline) {
      const d = parseIsoToDate(t.deadline).getTime();
      if (!isNaN(d)) {
        if (d < minTime) minTime = d;
        if (d > maxTime) maxTime = d;
      }
    }
  });

  if (minTime === Infinity || maxTime === -Infinity) {
    const now = new Date();
    minTime = now.getTime();
    maxTime = now.getTime() + 14 * 24 * 60 * 60 * 1000;
  }

  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);

  const scale = activeScale.value;

  if (scale === 'day') {
    const start = new Date(minDate);
    start.setDate(start.getDate() - 2);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    end.setDate(end.getDate() + 3);
    end.setHours(0, 0, 0, 0);

    gantt.config.start_date = start;
    gantt.config.end_date = end;
  } else if (scale === 'week') {
    // Snap to Monday of minDate - 1 week, snap to Sunday of maxDate + 1 week
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
  const query = internalSearchQuery.value.trim().toLowerCase();

  const filteredTasks = props.tasks.filter((t) => {
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

    // Iterate through projects that have visible child tasks
    tasksByProjectId.forEach((projectTasks, pId) => {
      const p = projectMap.value.get(pId) || {
        project_id: pId,
        name: projectTasks[0]?.project_name || `Project #${pId}`,
        status: 'ACTIVE',
        priority: 'MEDIUM',
        progress: 0,
      } as Project;

      // 1. Calculate Project Timeline: min(child task starts) to max(child task ends)
      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;
      let totalWeightedProgress = 0;
      let totalDuration = 0;

      projectTasks.forEach((t) => {
        const tStart = t.start_date ? parseIsoToDate(t.start_date) : new Date();
        const tEnd = t.deadline
          ? parseIsoToDate(t.deadline)
          : new Date(tStart.getTime() + 3 * 24 * 60 * 60 * 1000);
        const dur = Math.max(1, Math.round((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)));
        const prog = Number(t.progress) || 0;

        if (!earliestStart || tStart < earliestStart) earliestStart = tStart;
        if (!latestEnd || tEnd > latestEnd) latestEnd = tEnd;

        totalWeightedProgress += prog * dur;
        totalDuration += dur;
      });

      const startObj = earliestStart || new Date();
      const endObj = latestEnd || new Date(startObj.getTime() + 7 * 24 * 60 * 60 * 1000);
      const projDurationDays = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)));

      // 2. Calculate Project Progress: Weighted by task duration = Σ(task progress × task duration) / Σ(task duration)
      const calculatedProgress =
        totalDuration > 0
          ? (totalWeightedProgress / totalDuration) / 100
          : projectTasks.length > 0
          ? projectTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / (projectTasks.length * 100)
          : 0;

      // 3. Add Project Summary Row
      data.push({
        id: `proj_${p.project_id}`,
        text: p.name,
        start_date: formatGanttDate(startObj),
        end_date: formatGanttDate(endObj),
        duration: projDurationDays,
        progress: Math.min(1, Math.max(0, calculatedProgress)),
        type: 'project',
        open: true,
        project_id: p.project_id,
        task_count: projectTasks.length,
        status: p.status,
        priority: p.priority,
      });

      // 4. Add Child Task Rows
      projectTasks.forEach((t) => {
        const tStart = t.start_date ? parseIsoToDate(t.start_date) : new Date();
        const tEnd = t.deadline
          ? parseIsoToDate(t.deadline)
          : new Date(tStart.getTime() + 3 * 24 * 60 * 60 * 1000);
        const durationDays = Math.max(1, Math.round((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)));

        const firstAssigneeId = t.assigned_resource_ids?.[0];
        const resourceObj = firstAssigneeId ? resourceMap.value.get(firstAssigneeId) : undefined;

        data.push({
          id: t.task_id,
          text: t.title,
          start_date: formatGanttDate(tStart),
          end_date: formatGanttDate(tEnd),
          duration: durationDays,
          progress: (Number(t.progress) || 0) / 100,
          parent: `proj_${p.project_id}`,
          priority: t.priority,
          status: t.status,
          project_name: p.name,
          assignee_name: resourceObj?.name,
          type: 'task',
        });
      });
    });
  } else {
    // Flat task list
    filteredTasks.forEach((t) => {
      const tStart = t.start_date ? parseIsoToDate(t.start_date) : new Date();
      const tEnd = t.deadline
        ? parseIsoToDate(t.deadline)
        : new Date(tStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      const durationDays = Math.max(1, Math.round((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)));

      const p = projectMap.value.get(t.project_id);
      const firstAssigneeId = t.assigned_resource_ids?.[0];
      const resourceObj = firstAssigneeId ? resourceMap.value.get(firstAssigneeId) : undefined;

      data.push({
        id: t.task_id,
        text: t.title,
        start_date: formatGanttDate(tStart),
        end_date: formatGanttDate(tEnd),
        duration: durationDays,
        progress: (Number(t.progress) || 0) / 100,
        priority: t.priority,
        status: t.status,
        project_name: p?.name || '—',
        assignee_name: resourceObj?.name,
        type: 'task',
      });
    });
  }

  // Predecessor Dependency Links (connecting task to task, not projects)
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

  applyScaleMode(activeScale.value);
  const dataset = buildGanttDataset();

  gantt.clearAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gantt.parse(dataset as any);
  gantt.render();

  updateDateRangeHeader();
}

function setScale(scale: 'day' | 'week' | 'month') {
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
  });
  gantt.render();
}

function collapseAll() {
  gantt.eachTask((task) => {
    task.$open = false;
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
// Helper Utilities
// ----------------------------------------------------
function parseIsoToDate(isoString: string): Date {
  const parsed = new Date(isoString);
  if (isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function formatGanttDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
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

// ----------------------------------------------------
// Lifecycle Hooks & Event Listeners
// ----------------------------------------------------
let onTaskClickId: string | null = null;
let onAfterUpdateId: string | null = null;
let onAfterLinkId: string | null = null;

onMounted(() => {
  if (!ganttContainer.value) return;

  configureGanttEngine();
  gantt.init(ganttContainer.value);

  onTaskClickId = gantt.attachEvent('onTaskClick', (id: string | number) => {
    if (typeof id === 'number' || (!String(id).startsWith('proj_') && !isNaN(Number(id)))) {
      const numericId = Number(id);
      const found = props.tasks.find((t) => t.task_id === numericId);
      if (found) {
        emit('task-click', found);
      }
    }
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAfterUpdateId = gantt.attachEvent('onAfterTaskUpdate', (id: string | number, item: any) => {
    if (typeof id === 'number' || !String(id).startsWith('proj_')) {
      const numericId = Number(id);
      const startObj = item.start_date instanceof Date ? item.start_date : new Date(item.start_date);
      const endObj = item.end_date instanceof Date ? item.end_date : new Date(item.end_date);
      emit('task-updated', {
        taskId: numericId,
        title: String(item.text || ''),
        startDate: formatGanttDate(startObj),
        endDate: formatGanttDate(endObj),
        progress: Math.round((Number(item.progress) || 0) * 100),
      });
    }
  });

  onAfterLinkId = gantt.attachEvent('onAfterLinkAdd', (_id: string | number, item: { source: number | string; target: number | string }) => {
    emit('link-added', {
      sourceTaskId: Number(item.source),
      targetTaskId: Number(item.target),
    });
  });

  refreshGantt();
});

onBeforeUnmount(() => {
  if (onTaskClickId) gantt.detachEvent(onTaskClickId);
  if (onAfterUpdateId) gantt.detachEvent(onAfterUpdateId);
  if (onAfterLinkId) gantt.detachEvent(onAfterLinkId);
  gantt.clearAll();
});

watch(
  [() => props.tasks, () => props.projects, internalSearchQuery, () => props.groupByProject],
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
      padding: 4px 8px;
      border-radius: 16px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }
    }
  }

  /* 2. Subheader Legend Row */
  .gantt-legend-row {
    background: #ffffff;
    border-top: 1px solid #f1f5f9;
    min-height: 36px;

    .legend-label {
      font-weight: 600;
      color: #475569;
      font-size: 11.5px;
    }

    .legend-item {
      font-size: 11.5px;
      color: #475569;
      font-weight: 500;

      .p-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;

        &.dot-low { background: #10b981; }
        &.dot-medium { background: #0284c7; }
        &.dot-high { background: #ea580c; }
        &.dot-critical { background: #ec4899; }
      }
    }

    .legend-dependency-indicator {
      font-size: 11.5px;
    }
  }

  .header-divider {
    background: #e2e8f0;
  }

  /* 3. Gantt Canvas Viewport */
  .gantt-canvas-wrapper {
    position: relative;
    width: 100%;
    height: 540px;
    background: #ffffff;

    .gantt-chart-viewport {
      width: 100%;
      height: 100%;
    }

    .gantt-no-data-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      z-index: 20;
    }
  }

  /* 4. Footer Row */
  .gantt-footer-row {
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
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
    letter-spacing: 0.05em;
    border-right: 1px solid #e2e8f0;
    padding: 0 10px;
    display: flex;
    align-items: center;
  }

  .gantt_scale_cell {
    color: #475569;
    font-weight: 700;
    font-size: 10.5px;
    border-right: 1px solid #f1f5f9;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Tree Expander Chevrons (Expandable / Collapsible Projects) */
  .gantt_tree_icon {
    &.gantt_open {
      background-image: none !important;
      position: relative;
      &::after {
        content: '▾';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 13px;
        font-weight: 800;
        color: #7c3aed;
      }
    }
    &.gantt_close {
      background-image: none !important;
      position: relative;
      &::after {
        content: '▸';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 13px;
        font-weight: 800;
        color: #7c3aed;
      }
    }
    &.gantt_file,
    &.gantt_folder_open,
    &.gantt_folder_closed {
      background-image: none !important;
      width: 4px !important;
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
    padding: 0 8px;
    display: flex;
    align-items: center;
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
    }
  }

  /* Badges in Left Table (Status, Priority, Duration) */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }

    &.s-completed {
      background: #ecfdf5;
      color: #059669;
      .status-dot { background: #10b981; }
    }
    &.s-in-progress {
      background: #eff6ff;
      color: #0284c7;
      .status-dot { background: #0284c7; }
    }
    &.s-scheduled {
      background: #f5f3ff;
      color: #7c3aed;
      .status-dot { background: #8b5cf6; }
    }
    &.s-unassigned {
      background: #f1f5f9;
      color: #64748b;
      .status-dot { background: #94a3b8; }
    }
  }

  .priority-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;

    &.p-critical {
      background: #fdf2f8;
      color: #db2777;
    }
    &.p-high {
      background: #fff7ed;
      color: #ea580c;
    }
    &.p-medium {
      background: #eff6ff;
      color: #0284c7;
    }
    &.p-low {
      background: #ecfdf5;
      color: #059669;
    }
  }

  .duration-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: #f0f9ff;
    color: #0284c7;

    &.project-dur-badge {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
    }
  }

  /* ----------------------------------------------------
     Project Summary Bar & Task Bar Styling
     Palette: Pink, Green, Blue, Orange
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

  /* Individual Task Bars */
  .dhtmlx-bar-task {
    border-radius: 8px !important;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      transform: translateY(-1px);
    }

    .gantt_task_progress {
      background: rgba(0, 0, 0, 0.16) !important;
      border-radius: 8px 0 0 8px;
    }

    /* Content inside bar */
    .gantt-bar-content-wrapper {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 8px 0 4px;
      gap: 6px;
      color: #ffffff;

      .gantt-bar-pct-badge {
        background: rgba(0, 0, 0, 0.45);
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 5px;
        flex-shrink: 0;
        line-height: 1.2;
      }

      .gantt-bar-title {
        font-size: 11px;
        font-weight: 600;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    /* 1. Pink (Critical Priority) */
    &.bar-p-critical {
      background: linear-gradient(90deg, #db2777 0%, #f43f5e 100%) !important;
      border: 1px solid #be185d !important;
      box-shadow: 0 3px 10px rgba(219, 39, 119, 0.35) !important;
    }

    /* 2. Orange (High Priority) */
    &.bar-p-high {
      background: linear-gradient(90deg, #ea580c 0%, #f97316 100%) !important;
      border: 1px solid #c2410c !important;
      box-shadow: 0 3px 10px rgba(234, 88, 12, 0.35) !important;
    }

    /* 3. Blue (Medium Priority) */
    &.bar-p-medium {
      background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%) !important;
      border: 1px solid #0284c7 !important;
      box-shadow: 0 3px 10px rgba(2, 132, 199, 0.35) !important;
    }

    /* 4. Green (Low Priority / Completed) */
    &.bar-p-low,
    &.bar-s-completed {
      background: linear-gradient(90deg, #059669 0%, #10b981 100%) !important;
      border: 1px solid #047857 !important;
      box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35) !important;
    }
  }

  /* Dependency Link Lines */
  .gantt_line_wrapper div {
    background-color: #8b5cf6 !important;
    height: 2px !important;
  }

  .gantt_link_arrow {
    border-left-color: #8b5cf6 !important;
  }

  .gantt_link_point {
    background: #8b5cf6 !important;
    border: 2px solid #ffffff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  /* Weekend Cell */
  .dhtmlx-weekend-cell {
    background-color: #fafbfc;
  }

  /* Today Marker */
  .dhtmlx-today-marker {
    background: #8b5cf6;
    width: 2px;
    z-index: 5;

    &::after {
      content: 'TODAY';
      position: absolute;
      top: 2px;
      left: -18px;
      background: #8b5cf6;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 1px 4px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
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
    min-width: 230px;
    max-width: 320px;
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
        align-items: center;
        justify-content: space-between;
        font-size: 11.5px;

        .tooltip-k {
          color: #64748b;
          font-weight: 500;
        }
        .tooltip-v {
          color: #1e293b;
          font-weight: 600;
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
        &.is-active-pill, &.links-active {
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
      .legend-label, .legend-item {
        color: #94a3b8;
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
    }

    .dhtmlx-weekend-cell {
      background-color: #121620;
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
        background: rgba(244, 63, 94, 0.15);
        color: #f43f5e;
      }
      &.p-high {
        background: rgba(249, 115, 22, 0.15);
        color: #f97316;
      }
      &.p-medium {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.p-low {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
    }

    .duration-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;

      &.project-dur-badge {
        background: rgba(148, 163, 184, 0.15);
        color: #cbd5e1;
      }
    }

    /* Today marker boundary/accent */
    .gantt_link_point {
      border-color: #181d28 !important;
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
      }
    }
  }
}
</style>
