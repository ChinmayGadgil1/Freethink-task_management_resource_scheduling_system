<template>
  <div class="landing-gantt-card">
    <!-- Header -->
    <div class="gantt-header row items-center justify-between no-wrap q-pa-md">
      <div>
        <div class="gantt-title">Milestone Timeline</div>
        <div class="gantt-subtitle">Live schedule and dependency tracking</div>
      </div>

      <!-- Priority Legend -->
      <div class="gantt-legend row items-center q-gutter-x-sm">
        <div class="legend-item row items-center no-wrap gap-xs">
          <span class="legend-dot dot-critical" />
          <span class="legend-label">Critical</span>
        </div>
        <div class="legend-item row items-center no-wrap gap-xs">
          <span class="legend-dot dot-high" />
          <span class="legend-label">High</span>
        </div>
        <div class="legend-item row items-center no-wrap gap-xs">
          <span class="legend-dot dot-medium" />
          <span class="legend-label">Medium</span>
        </div>
        <div class="legend-item row items-center no-wrap gap-xs">
          <span class="legend-dot dot-low" />
          <span class="legend-label">Low</span>
        </div>
      </div>
    </div>

    <div class="gantt-divider" />

    <!-- Gantt Scroll Container -->
    <div class="gantt-scroll-container">
      <div class="gantt-grid">
        <!-- Header Row -->
        <div class="gantt-cell header-cell label-col">
          <span>TASK / PROJECT</span>
        </div>

        <div
          v-for="(day, idx) in timelineDays"
          :key="`header-${idx}`"
          class="gantt-cell header-cell day-col"
          :class="{ 'is-today': day.isToday, 'is-weekend': day.isWeekend }"
        >
          <span class="day-name">{{ day.weekday }}</span>
          <span class="day-num" :class="{ 'text-today': day.isToday }">{{ day.dayNum }}</span>
        </div>

        <!-- Task Rows -->
        <template v-for="(task, rowIdx) in previewTasks" :key="task.id">
          <!-- Left Label Cell -->
          <div class="gantt-cell label-cell" :style="{ gridRow: `${rowIdx + 2}` }">
            <div class="task-info-block">
              <div class="task-name ellipsis" :title="task.name">{{ task.name }}</div>
              <div class="task-meta-row row items-center gap-xs">
                <span class="project-pill">{{ task.project }}</span>
                <span class="effort-pill"
                  >{{ formatHours(task.actualEffort) }} /
                  {{ formatHours(task.expectedEffort) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Day Grid Background Cells -->
          <div
            v-for="(day, dIdx) in timelineDays"
            :key="`grid-${task.id}-${dIdx}`"
            class="gantt-cell day-cell"
            :class="{ 'is-today': day.isToday, 'is-weekend': day.isWeekend }"
            :style="{
              gridRow: `${rowIdx + 2}`,
              gridColumn: `${dIdx + 2}`,
            }"
          />

          <!-- Gantt Task Bar -->
          <div
            class="gantt-task-bar"
            :class="`bar-${task.priority.toLowerCase()}`"
            :style="{
              gridRow: `${rowIdx + 2}`,
              gridColumn: `${task.startCol} / ${task.endCol}`,
            }"
          >
            <!-- Progress Fill -->
            <div class="bar-progress-fill" :style="{ width: `${task.progress}%` }" />

            <!-- Bar Content -->
            <div class="bar-content row items-center justify-between no-wrap">
              <div class="row items-center gap-xs no-wrap ellipsis">
                <span class="bar-progress-text">{{ task.progress }}%</span>
                <span class="bar-task-title ellipsis">{{ task.name }}</span>
              </div>

              <div class="bar-assignees row items-center no-wrap">
                <span
                  v-for="(assignee, aIdx) in task.assignees"
                  :key="aIdx"
                  class="assignee-avatar-pill flex flex-center"
                  :title="assignee"
                >
                  {{ assignee.charAt(0) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatHours } from '@/utils/formatters';

interface TimelineDay {
  weekday: string;
  dayNum: number;
  isToday: boolean;
  isWeekend: boolean;
}

interface PreviewGanttTask {
  id: number;
  name: string;
  project: string;
  priority: 'Critical' | 'High' | 'Medium';
  progress: number;
  expectedEffort: number;
  actualEffort: number;
  startCol: number;
  endCol: number;
  assignees: string[];
}

const timelineDays: TimelineDay[] = [
  { weekday: 'Mon', dayNum: 18, isToday: false, isWeekend: false },
  { weekday: 'Tue', dayNum: 19, isToday: false, isWeekend: false },
  { weekday: 'Wed', dayNum: 20, isToday: true, isWeekend: false },
  { weekday: 'Thu', dayNum: 21, isToday: false, isWeekend: false },
  { weekday: 'Fri', dayNum: 22, isToday: false, isWeekend: false },
  { weekday: 'Sat', dayNum: 23, isToday: false, isWeekend: true },
  { weekday: 'Sun', dayNum: 24, isToday: false, isWeekend: true },
  { weekday: 'Mon', dayNum: 25, isToday: false, isWeekend: false },
  { weekday: 'Tue', dayNum: 26, isToday: false, isWeekend: false },
  { weekday: 'Wed', dayNum: 27, isToday: false, isWeekend: false },
  { weekday: 'Thu', dayNum: 28, isToday: false, isWeekend: false },
  { weekday: 'Fri', dayNum: 29, isToday: false, isWeekend: false },
];

const previewTasks: PreviewGanttTask[] = [
  {
    id: 101,
    name: 'Backend Architecture & API Setup',
    project: 'Enterprise Platform',
    priority: 'High',
    progress: 100,
    expectedEffort: 32,
    actualEffort: 30,
    startCol: 2,
    endCol: 6,
    assignees: ['Alex R.'],
  },
  {
    id: 102,
    name: 'Resource Scheduling & Gantt Flow',
    project: 'TaskFlow Core',
    priority: 'Critical',
    progress: 65,
    expectedEffort: 40,
    actualEffort: 26,
    startCol: 4,
    endCol: 10,
    assignees: ['Sarah K.', 'David M.'],
  },
  {
    id: 103,
    name: 'Workload Balancing & Analytics',
    project: 'Resource Management',
    priority: 'Medium',
    progress: 25,
    expectedEffort: 24,
    actualEffort: 6,
    startCol: 7,
    endCol: 13,
    assignees: ['Elena P.'],
  },
];
</script>

<style scoped lang="scss">
.landing-gantt-card {
  background: #ffffff;
  border: 1px solid #eaecef;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
  overflow: hidden;
}

.gantt-header {
  background: #ffffff;
}

.gantt-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.gantt-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.gantt-divider {
  height: 1px;
  background: #f1f3f7;
}

.gantt-legend {
  font-size: 11.5px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.dot-critical {
    background: #ef4444;
  }
  &.dot-high {
    background: #f97316;
  }
  &.dot-medium {
    background: #2563eb;
  }
  &.dot-low {
    background: #64748b;
  }
}

.legend-label {
  color: #64748b;
  font-weight: 600;
}

.gantt-scroll-container {
  overflow-x: auto;
  background: #ffffff;
}

.gantt-grid {
  display: grid;
  grid-template-columns: 210px repeat(12, minmax(46px, 1fr));
  min-width: 760px;
  position: relative;
}

.gantt-cell {
  border-bottom: 1px solid #f1f3f7;
  border-right: 1px solid #f8fafc;
  padding: 8px;
  min-height: 52px;
  display: flex;
  align-items: center;

  &.header-cell {
    background: #f8fafc;
    min-height: 44px;
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    border-bottom: 1px solid #eaecef;
  }

  &.day-col {
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 4px 2px;

    .day-name {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
    }
    .day-num {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }
    .text-today {
      color: #8b6fd8;
      font-weight: 800;
    }
  }

  &.is-today {
    background: rgba(139, 111, 216, 0.04);
  }

  &.is-weekend {
    background: #fafbfc;
  }
}

.label-cell {
  background: #ffffff;
  border-right: 1px solid #eaecef;
  z-index: 2;
}

.task-info-block {
  width: 100%;
}

.task-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.task-meta-row {
  margin-top: 4px;
}

.project-pill {
  font-size: 10px;
  font-weight: 600;
  color: #6b21a8;
  background: #f3e8ff;
  padding: 1px 6px;
  border-radius: 4px;
}

.effort-pill {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
}

.gantt-task-bar {
  align-self: center;
  height: 28px;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  margin: 0 4px;
  z-index: 1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  &.bar-critical {
    background: rgba(239, 68, 68, 0.18);
    border: 1px solid #ef4444;

    .bar-progress-fill {
      background: #ef4444;
    }
  }

  &.bar-high {
    background: rgba(249, 115, 22, 0.18);
    border: 1px solid #f97316;

    .bar-progress-fill {
      background: #f97316;
    }
  }

  &.bar-medium {
    background: rgba(37, 99, 235, 0.18);
    border: 1px solid #2563eb;

    .bar-progress-fill {
      background: #2563eb;
    }
  }

  &.bar-low {
    background: rgba(100, 116, 139, 0.18);
    border: 1px solid #64748b;

    .bar-progress-fill {
      background: #64748b;
    }
  }
}

.bar-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  opacity: 0.85;
  border-radius: 4px 0 0 4px;
}

.bar-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 0 8px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.bar-progress-text {
  background: rgba(0, 0, 0, 0.25);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
}

.bar-task-title {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.assignee-avatar-pill {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  color: #1e293b;
  font-size: 9.5px;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-left: -4px;

  &:first-child {
    margin-left: 0;
  }
}

body.body--dark {
  .landing-gantt-card {
    background: #181d28;
    border-color: #283042;
  }

  .gantt-header {
    background: #181d28;
  }

  .gantt-title {
    color: #f3f4f6;
  }

  .gantt-subtitle {
    color: #94a3b8;
  }

  .gantt-divider {
    background: #283042;
  }

  .gantt-scroll-container {
    background: #181d28;
  }

  .gantt-cell {
    border-bottom-color: #283042;
    border-right-color: #202636;

    &.header-cell {
      background: #131722;
      color: #94a3b8;
      border-bottom-color: #283042;
    }

    &.day-col {
      .day-name {
        color: #64748b;
      }
      .day-num {
        color: #cbd5e1;
      }
      .text-today {
        color: #a78bfa;
      }
    }

    &.is-today {
      background: rgba(139, 111, 216, 0.1);
    }

    &.is-weekend {
      background: #151923;
    }
  }

  .label-cell {
    background: #181d28;
    border-right-color: #283042;
  }

  .task-name {
    color: #f3f4f6;
  }

  .project-pill {
    background: rgba(139, 111, 216, 0.2);
    color: #c4b5fd;
  }

  .effort-pill {
    background: #202636;
    color: #94a3b8;
  }

  .legend-label {
    color: #94a3b8;
  }
}
</style>
