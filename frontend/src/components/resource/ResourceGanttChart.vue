<template>
  <q-card flat bordered class="dashboard-card">
    <q-card-section class="row items-center justify-between">
      <div>
        <div class="text-subtitle1 text-weight-bold">My Gantt</div>
        <div class="text-caption text-grey-6">
          {{ formatDate(days[0]!) }} – {{ formatDate(days[days.length - 1]!) }}
        </div>
      </div>
      <div class="legend">
        <span v-for="p in priorities" :key="p" class="legend-item">
          <span class="legend-dot" :class="`priority-dot-${p.toLowerCase()}`" />{{ p }}
        </span>
      </div>
    </q-card-section>
    <q-separator />

    <div class="gantt-scroll">
      <div
        class="gantt-grid"
        :style="{ gridTemplateColumns: `180px repeat(${days.length}, minmax(56px, 1fr))` }"
      >
        <!-- Header row -->
        <div class="gantt-cell header-cell label-col">Task</div>
        <div
          v-for="(day, i) in days" :key="i"
          class="gantt-cell header-cell day-col"
          :class="{ 'is-today': isToday(day), 'is-weekend': isWeekend(day) }"
          :style="{ gridColumn: i + 2 }"
        >
          <div class="day-name">{{ formatWeekday(day) }}</div>
          <div class="day-num">{{ formatDay(day) }}</div>
        </div>

        <!-- Task rows -->
        <template v-for="(task, rowIdx) in tasks" :key="task.id">
          <div class="gantt-cell label-col task-label" :style="{ gridRow: rowIdx + 2 }">
            <div class="task-name ellipsis">{{ task.name }}</div>
            <div class="task-project ellipsis">{{ task.project }}</div>
          </div>

          <div
            v-for="(day, i) in days" :key="`${task.id}-${i}`"
            class="gantt-cell track-cell"
            :class="{ 'is-today': isToday(day), 'is-weekend': isWeekend(day) }"
            :style="{ gridColumn: i + 2, gridRow: rowIdx + 2 }"
          />

          <div
            class="gantt-bar"
            :class="`priority-bar-${task.priority.toLowerCase()}`"
            :style="barStyle(task, rowIdx)"
            :title="`${task.name} · ${task.progress}% complete`"
          >
            <div class="gantt-bar-fill" :style="{ width: `${task.progress}%` }" />
            <span class="gantt-bar-label">{{ task.progress }}%</span>
          </div>
        </template>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface GanttTask {
  id: number
  name: string
  project: string
  start: string // ISO date, e.g. '2026-08-18'
  end: string // ISO date, inclusive
  progress: number
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
}

const props = defineProps<{ tasks: GanttTask[] }>()

const priorities = ['Low', 'Medium', 'High', 'Critical']
const MAX_WINDOW_DAYS = 21

function stripTime(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Window spans from the earliest task start (or today, if earlier)
// to the latest task end, capped so the chart doesn't run away.
const days = computed<Date[]>(() => {
  const today = stripTime(new Date())
  const starts = props.tasks.map(t => stripTime(new Date(t.start)))
  const ends = props.tasks.map(t => stripTime(new Date(t.end)))

  let rangeStart = starts.length ? new Date(Math.min(today.getTime(), ...starts.map(d => d.getTime()))) : today
  let rangeEnd = ends.length ? new Date(Math.max(today.getTime(), ...ends.map(d => d.getTime()))) : new Date(today.getTime() + 6 * 86400000)

  const totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1
  if (totalDays > MAX_WINDOW_DAYS) {
    rangeEnd = new Date(rangeStart.getTime() + (MAX_WINDOW_DAYS - 1) * 86400000)
  }

  const list: Date[] = []
  const cursor = new Date(rangeStart)
  while (cursor <= rangeEnd) {
    list.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return list
})

function dayIndex(dateStr: string) {
  const target = stripTime(new Date(dateStr)).getTime()
  const start = days.value[0]?.getTime() ?? target
  return Math.round((target - start) / 86400000)
}

function barStyle(task: GanttTask, rowIdx: number) {
  const lastIdx = days.value.length - 1
  const startIdx = Math.min(Math.max(dayIndex(task.start), 0), lastIdx)
  const endIdx = Math.min(Math.max(dayIndex(task.end), startIdx), lastIdx)
  return {
    gridRow: rowIdx + 2,
    gridColumn: `${startIdx + 2} / span ${endIdx - startIdx + 1}`,
  }
}

function isToday(date: Date) {
  return stripTime(date).getTime() === stripTime(new Date()).getTime()
}

function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
}
function formatDay(date: Date) {
  return date.getDate()
}
function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
</script>

<style scoped lang="scss">
.legend { display: flex; gap: 14px; }
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--wo-text-muted, #667085);
}
.legend-dot { width: 7px; height: 7px; border-radius: 50%; }
.priority-dot-low { background: #27ae60; }
.priority-dot-medium { background: #e89532; }
.priority-dot-high { background: #e56b45; }
.priority-dot-critical { background: #e15263; }

.gantt-scroll { overflow-x: auto; padding: 4px 0 16px; }

.gantt-grid {
  display: grid;
  grid-auto-rows: 44px;
  position: relative;
  min-width: 100%;
  width: max-content;
}

.gantt-cell { display: flex; align-items: center; min-width: 0; }

.label-col {
  grid-column: 1;
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--wo-bg-card, #fff);
  padding: 0 16px;
  border-right: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.header-cell {
  grid-row: 1;
  height: 40px;
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
  background: var(--wo-bg-page, #f8f9fa);
}

.day-col { flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
.day-name { font-size: 9px; color: var(--wo-text-subtle, #98a2b3); text-transform: uppercase; }
.day-num { font-size: 12px; font-weight: 700; color: var(--wo-text-main, #1d2433); }

.track-cell {
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
  border-left: 1px solid var(--wo-border-subtle, #f0f2f5);
}
.track-cell.is-weekend { background: var(--wo-bg-page, #f8f9fa); }
.header-cell.is-weekend { background: #f2f2f5; }
.track-cell.is-today,
.header-cell.is-today { background: var(--wo-primary-light, #f4f0fd); }

.task-name { font-size: 12px; font-weight: 600; color: var(--wo-text-main, #1d2433); }
.task-project { margin-top: 2px; font-size: 10px; color: var(--wo-text-subtle, #98a2b3); }

.gantt-bar {
  position: relative;
  align-self: center;
  height: 24px;
  margin: 0 3px;
  border-radius: 6px;
  background: var(--wo-border-subtle, #f0f2f5);
  overflow: hidden;
  display: flex;
  align-items: center;
  z-index: 1;
}

.gantt-bar-fill { position: absolute; inset: 0; border-radius: 6px; opacity: 0.9; }
.gantt-bar-label {
  position: relative;
  margin-left: auto;
  padding-right: 8px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

.priority-bar-low .gantt-bar-fill { background: #27ae60; }
.priority-bar-medium .gantt-bar-fill { background: #e89532; }
.priority-bar-high .gantt-bar-fill { background: #e56b45; }
.priority-bar-critical .gantt-bar-fill { background: #e15263; }
</style>
