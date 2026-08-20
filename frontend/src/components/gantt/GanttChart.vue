<template>
  <q-card flat bordered class="dashboard-card gantt-card">
    <!-- Header -->
    <q-card-section class="row items-center justify-between q-col-gutter-md">
      <div class="col">
        <div class="text-subtitle1 text-weight-bold text-dark">{{ title }}</div>

        <div v-if="tasks.length" class="text-caption text-grey-6 q-mt-xs">
          {{ formatDate(days[0]!) }}
          –
          {{ formatDate(days[days.length - 1]!) }}
        </div>

        <div v-else class="text-caption text-grey-6 q-mt-xs">
          {{ subtitle || 'Your schedule will appear here' }}
        </div>
      </div>

      <!-- Legend -->
      <div v-if="tasks.length" class="row items-center q-gutter-md legend-row">
        <div v-for="priority in priorities" :key="priority" class="row items-center no-wrap">
          <q-badge
            rounded
            :color="priorityColor(priority)"
            class="q-mr-xs"
            style="width: 8px; height: 8px; min-height: 8px; padding: 0"
          />

          <span class="text-caption text-grey-7">
            {{ priority }}
          </span>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Empty state -->
    <q-card-section v-if="!tasks.length" class="flex flex-center column q-py-xl empty-section">
      <q-avatar size="64px" class="avatar-purple q-mb-md">
        <q-icon name="timeline" size="30px" />
      </q-avatar>

      <div class="text-subtitle1 text-weight-medium text-dark">
        {{ emptyTitle || 'No scheduled tasks' }}
      </div>

      <div class="text-caption text-grey-6 text-center q-mt-xs" style="max-width: 380px">
        {{ emptySubtitle || 'Tasks will appear on the timeline once they have scheduling information.' }}
      </div>
    </q-card-section>

    <!-- Gantt Chart Grid -->
    <div v-else class="gantt-scroll">
      <div
        class="gantt-grid"
        :style="{
          gridTemplateColumns: `220px repeat(${days.length}, minmax(58px, 1fr))`,
        }"
      >
        <!-- Header -->
        <div class="gantt-cell header-cell label-col">
          <span class="text-caption text-weight-bold uppercase-label"> Task / Project </span>
        </div>

        <div
          v-for="(day, index) in days"
          :key="`header-${index}`"
          class="gantt-cell header-cell day-col"
          :class="{
            'is-today': isToday(day),
            'is-weekend': isWeekend(day),
          }"
          :style="{ gridColumn: index + 2 }"
        >
          <div class="day-name">
            {{ formatWeekday(day) }}
          </div>

          <div class="day-num" :class="{ 'text-primary': isToday(day) }">
            {{ formatDay(day) }}
          </div>
        </div>

        <!-- Rows -->
        <template v-for="(task, rowIdx) in tasks" :key="task.id">
          <!-- Task information label cell -->
          <div
            class="gantt-cell label-col task-label"
            :class="{
              'task-overdue-label': isTaskOverdue(task),
            }"
            :style="{ gridRow: rowIdx + 2 }"
          >
            <div class="task-info">
              <div class="task-name ellipsis" :title="task.name">
                {{ task.name }}
              </div>

              <div class="task-project ellipsis" :title="task.project">
                {{ task.project }}
              </div>

              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-badge
                  dense
                  outline
                  :color="statusColor(task.status)"
                  :label="statusLabel(task.status)"
                />

                <q-badge dense outline color="grey-7" :label="task.priority" />

                <q-badge v-if="isTaskOverdue(task)" dense color="negative" label="Overdue" />
              </div>
            </div>
          </div>

          <!-- Timeline background cells -->
          <div
            v-for="(day, dayIndexValue) in days"
            :key="`${task.id}-day-${dayIndexValue}`"
            class="gantt-cell track-cell"
            :class="{
              'is-today': isToday(day),
              'is-weekend': isWeekend(day),
            }"
            :style="{
              gridColumn: dayIndexValue + 2,
              gridRow: rowIdx + 2,
            }"
          />

          <!-- Task bar -->
          <div
            class="gantt-bar"
            :class="[
              `priority-bar-${task.priority.toLowerCase()}`,
              {
                'gantt-bar-overdue': isTaskOverdue(task),
                'gantt-bar-completed': task.status === 'COMPLETED',
              },
            ]"
            :style="barStyle(task, rowIdx)"
            :title="taskTooltip(task)"
          >
            <div
              class="gantt-bar-fill"
              :style="{
                width: `${clampedProgress(task.progress)}%`,
              }"
            />

            <div class="gantt-bar-content">
              <span class="gantt-bar-label"> {{ clampedProgress(task.progress) }}% </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Bottom footer information -->
    <q-separator v-if="tasks.length" />

    <q-card-section v-if="tasks.length" class="row items-center justify-between q-py-sm">
      <div class="row items-center q-gutter-md">
        <div class="row items-center no-wrap">
          <q-icon name="today" size="16px" color="primary" class="q-mr-xs" />
          <span class="text-caption text-grey-7"> Today </span>
        </div>

        <div class="row items-center no-wrap">
          <q-icon name="weekend" size="16px" color="grey-6" class="q-mr-xs" />
          <span class="text-caption text-grey-7"> Non-working weekend </span>
        </div>
      </div>

      <div class="text-caption text-grey-6">
        {{ tasks.length }}
        {{ tasks.length === 1 ? 'task' : 'tasks' }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface GanttTask {
  id: number;
  name: string;
  project: string;
  start: string;
  end: string;
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  overdue?: boolean;
}

const props = withDefaults(
  defineProps<{
    tasks: GanttTask[];
    title?: string;
    subtitle?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
  }>(),
  {
    title: 'Schedule Timeline',
    subtitle: '',
    emptyTitle: 'No scheduled tasks',
    emptySubtitle: 'Tasks will appear on the timeline once they have scheduling information.',
  },
);

const priorities: GanttTask['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

const MAX_WINDOW_DAYS = 21;
const DAY_MS = 86400000;

function stripTime(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/*
 * The chart starts from the earliest task start date,
 * but never starts after today.
 *
 * It ends at the latest task deadline,
 * but the visible range is capped at 21 days.
 */
const days = computed<Date[]>(() => {
  const today = stripTime(new Date());

  if (!props.tasks.length) {
    return [today];
  }

  const validStarts = props.tasks
    .map((task) => new Date(task.start))
    .filter((date) => !Number.isNaN(date.getTime()))
    .map(stripTime);

  const validEnds = props.tasks
    .map((task) => new Date(task.end))
    .filter((date) => !Number.isNaN(date.getTime()))
    .map(stripTime);

  const rangeStart = validStarts.length
    ? new Date(Math.min(today.getTime(), ...validStarts.map((date) => date.getTime())))
    : today;

  let rangeEnd = validEnds.length
    ? new Date(Math.max(today.getTime(), ...validEnds.map((date) => date.getTime())))
    : new Date(today.getTime() + 6 * DAY_MS);

  const totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / DAY_MS) + 1;

  if (totalDays > MAX_WINDOW_DAYS) {
    rangeEnd = new Date(rangeStart.getTime() + (MAX_WINDOW_DAYS - 1) * DAY_MS);
  }

  const result: Date[] = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    result.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
});

function dayIndex(dateString: string): number {
  const target = stripTime(new Date(dateString)).getTime();
  const firstDay = days.value[0]?.getTime() ?? target;
  return Math.round((target - firstDay) / DAY_MS);
}

function barStyle(task: GanttTask, rowIndex: number) {
  const lastIndex = days.value.length - 1;
  const rawStartIndex = dayIndex(task.start);
  const rawEndIndex = dayIndex(task.end);
  const startIndex = Math.min(Math.max(rawStartIndex, 0), lastIndex);
  const endIndex = Math.min(Math.max(rawEndIndex, startIndex), lastIndex);

  return {
    gridRow: rowIndex + 2,
    gridColumn: `${startIndex + 2} / span ${endIndex - startIndex + 1}`,
  };
}

function isToday(date: Date): boolean {
  return stripTime(date).getTime() === stripTime(new Date()).getTime();
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatWeekday(date: Date): string {
  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
    })
    .slice(0, 2);
}

function formatDay(date: Date): number {
  return date.getDate();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

function clampedProgress(progress: number): number {
  return Math.min(100, Math.max(0, Number(progress) || 0));
}

function isTaskOverdue(task: GanttTask): boolean {
  if (task.overdue !== undefined) {
    return task.overdue;
  }

  if (task.status === 'COMPLETED') {
    return false;
  }

  const end = new Date(task.end);

  if (Number.isNaN(end.getTime())) {
    return false;
  }

  return stripTime(end).getTime() < stripTime(new Date()).getTime();
}

function statusLabel(status: GanttTask['status']): string {
  const labels: Record<GanttTask['status'], string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
  };

  return labels[status];
}

function statusColor(status: GanttTask['status']): string {
  const colors: Record<GanttTask['status'], string> = {
    PENDING: 'grey-7',
    IN_PROGRESS: 'blue-7',
    COMPLETED: 'positive',
    ON_HOLD: 'orange-7',
  };

  return colors[status];
}

function priorityColor(priority: GanttTask['priority']): string {
  const colors: Record<GanttTask['priority'], string> = {
    Low: 'positive',
    Medium: 'warning',
    High: 'deep-orange',
    Critical: 'negative',
  };

  return colors[priority];
}

function taskTooltip(task: GanttTask): string {
  const status = statusLabel(task.status);
  const progress = clampedProgress(task.progress);

  return [
    task.name,
    `Project: ${task.project}`,
    `Start: ${formatDate(new Date(task.start))}`,
    `Deadline: ${formatDate(new Date(task.end))}`,
    `Status: ${status}`,
    `Priority: ${task.priority}`,
    `Progress: ${progress}%`,
    isTaskOverdue(task) ? 'OVERDUE' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
</script>

<style scoped lang="scss">
.gantt-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
}

.avatar-purple {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
}

.uppercase-label {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 11px;
  color: var(--wo-text-muted, #647087);
}

.gantt-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0 12px;
}

.gantt-grid {
  display: grid;
  grid-auto-rows: 64px;
  position: relative;
  width: max-content;
  min-width: 100%;
}

.gantt-cell {
  display: flex;
  align-items: center;
  min-width: 0;
}

.label-col {
  grid-column: 1;
  position: sticky;
  left: 0;
  z-index: 4;
  background: var(--wo-bg-card, #ffffff);
  padding: 0 14px;
  border-right: 1px solid var(--wo-border-subtle, #eaecf0);
}

.header-cell {
  grid-row: 1;
  height: 44px;
  border-bottom: 1px solid var(--wo-border-subtle, #eaecf0);
  background: var(--wo-bg-page, #f8f9fa);
}

.day-col {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1px;
}

.day-name {
  font-size: 9px;
  font-weight: 600;
  color: var(--wo-text-subtle, #98a2b3);
  text-transform: uppercase;
}

.day-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #1d2433);
}

.track-cell {
  border-left: 1px solid var(--wo-border-subtle, #eaecf0);
  border-bottom: 1px solid var(--wo-border-subtle, #eaecf0);
  background: var(--wo-bg-card, #ffffff);
}

.track-cell.is-weekend {
  background: var(--wo-bg-page, #f8f9fa);
}

.header-cell.is-weekend {
  background: var(--wo-bg-page, #f2f2f5);
}

.track-cell.is-today,
.header-cell.is-today {
  background: var(--wo-primary-light, #f4f0fd);
}

.task-label {
  align-items: center;
}

.task-info {
  width: 100%;
  min-width: 0;
}

.task-name {
  font-size: 12.5px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--wo-text-main, #1d2433);
}

.task-project {
  margin-top: 2px;
  font-size: 10.5px;
  line-height: 1.2;
  color: var(--wo-text-subtle, #98a2b3);
}

.task-overdue-label {
  background: var(--wo-bg-card, #ffffff);
  box-shadow: inset 3px 0 0 #e15263;
}

.gantt-bar {
  position: relative;
  align-self: center;
  height: 28px;
  margin: 0 4px;
  border-radius: 7px;
  overflow: hidden;
  display: flex;
  align-items: center;
  z-index: 2;
  background: var(--wo-border-subtle, #eaecf0);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
}

.gantt-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 7px;
  opacity: 0.92;
  transition: width 0.25s ease;
}

.gantt-bar-content {
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.gantt-bar-label {
  padding-right: 8px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.priority-bar-low .gantt-bar-fill {
  background: #27ae60;
}

.priority-bar-medium .gantt-bar-fill {
  background: #e89532;
}

.priority-bar-high .gantt-bar-fill {
  background: #e56b45;
}

.priority-bar-critical .gantt-bar-fill {
  background: #e15263;
}

.gantt-bar-overdue {
  box-shadow:
    0 0 0 2px rgba(225, 82, 99, 0.25),
    0 2px 5px rgba(225, 82, 99, 0.18);
}

.gantt-bar-completed {
  opacity: 0.82;
}

@media (max-width: 700px) {
  .gantt-grid {
    grid-auto-rows: 70px;
  }

  .label-col {
    padding: 0 10px;
  }
}

/* Dark mode adjustments */
body.body--dark {
  .label-col {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border-subtle, #1e2433);
  }

  .header-cell {
    background: var(--wo-bg-page, #0f1219);
    border-color: var(--wo-border-subtle, #1e2433);
  }

  .track-cell {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border-subtle, #1e2433);
  }

  .track-cell.is-weekend,
  .header-cell.is-weekend {
    background: var(--wo-bg-page, #0f1219);
  }

  .track-cell.is-today,
  .header-cell.is-today {
    background: var(--wo-primary-light, rgba(139, 111, 216, 0.18));
  }

  .task-name {
    color: var(--wo-text-main, #f3f4f6);
  }

  .day-num {
    color: var(--wo-text-main, #f3f4f6);
  }

  .gantt-bar {
    background: var(--wo-border-subtle, #1e2433);
  }
}
</style>
