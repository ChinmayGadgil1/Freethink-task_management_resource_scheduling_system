<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <div class="q-mx-auto" style="max-width: 1380px">
      <!-- 1. PAGE HEADER -->
      <div class="row items-end justify-between q-mb-lg q-col-gutter-md">
        <div>
          <div
            class="text-h5 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Schedule & Roadmap
          </div>
          <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Plan, monitor deadlines, and track your scheduled tasks across projects
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <!-- View Toggle Buttons: Week, Day, Month, Gantt, Table -->
          <q-btn-toggle
            v-model="scheduleViewMode"
            toggle-color="primary"
            toggle-text-color="white"
            :color="$q.dark.isActive ? 'grey-9' : 'white'"
            :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
            dense
            unelevated
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
            :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            icon="refresh"
            label="Refresh"
            :loading="loading"
            @click="loadData"
          />
        </div>
      </div>

      <!-- 2. STAT SUMMARY CARDS -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Assigned Tasks"
            :value="tasks.length"
            subtitle="Across all projects"
            icon="event_note"
            color="purple"
            note-class="note-purple"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="In Progress"
            :value="inProgressCount"
            subtitle="Actively moving"
            icon="sync"
            color="blue"
            note-class="note-blue"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed"
            :value="completedCount"
            subtitle="Milestones reached"
            icon="check_circle"
            color="green"
            note-class="note-green"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Overdue / Urgent"
            :value="overdueCount"
            subtitle="Requires attention"
            icon="warning"
            color="red"
            note-class="note-red"
            :negative="overdueCount > 0"
          />
        </div>
      </div>

      <!-- 3. CALENDAR TOOLBAR & FILTERS -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-mb-md">
        <q-card-section class="row items-center justify-between q-pa-sm wrap q-col-gutter-sm">
          <!-- Date Navigation Controls -->
          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              round
              dense
              icon="chevron_left"
              size="sm"
              title="Previous"
              @click="navigateDate(-1)"
            />
            <q-btn
              flat
              round
              dense
              icon="chevron_right"
              size="sm"
              title="Next"
              @click="navigateDate(1)"
            />
            <q-btn
              outline
              dense
              no-caps
              label="Today"
              class="q-px-sm"
              :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
              @click="goToToday"
            />
            <div class="q-ml-sm text-subtitle2 text-weight-bold">
              {{ formattedDateRangeHeader }}
            </div>
          </div>

          <!-- Filter Controls -->
          <div class="row items-center q-gutter-xs wrap">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              clearable
              placeholder="Search tasks..."
              style="width: 160px"
            >
              <template #prepend>
                <q-icon name="search" size="16px" />
              </template>
            </q-input>

            <q-select
              v-model="projectFilter"
              outlined
              dense
              clearable
              emit-value
              map-options
              :options="projectFilterOptions"
              label="Project"
              style="width: 140px"
            />

            <q-select
              v-model="statusFilter"
              outlined
              dense
              clearable
              emit-value
              map-options
              :options="statusFilterOptions"
              label="Status"
              style="width: 130px"
            />

            <q-select
              v-model="priorityFilter"
              outlined
              dense
              clearable
              emit-value
              map-options
              :options="priorityFilterOptions"
              label="Priority"
              style="width: 130px"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- 4. LOADING STATE -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="44px" />
      </div>

      <!-- 5. MAIN SCHEDULE VIEWS -->
      <div v-else>
        <!-- A. WEEK / DAY TIME-GRID VIEW -->
        <q-card
          v-if="scheduleViewMode === 'week' || scheduleViewMode === 'day'"
          flat
          bordered
          :dark="$q.dark.isActive"
          class="rounded-borders overflow-hidden q-mb-lg"
        >
          <div class="calendar-scroll-wrapper">
            <div
              class="calendar-table-grid"
              :style="{
                gridTemplateColumns: `64px repeat(${displayedDays.length}, minmax(${scheduleViewMode === 'day' ? '320px' : '130px'}, 1fr))`,
              }"
            >
              <!-- Top Left Time Corner Header -->
              <div
                class="cal-cell flex flex-center"
                :style="{ background: $q.dark.isActive ? '#181d28' : '#fafbfc', height: '56px' }"
              >
                <span class="text-caption text-weight-bold text-grey-5">Time</span>
              </div>

              <!-- Date Column Headers -->
              <div
                v-for="day in displayedDays"
                :key="day.toISOString()"
                class="cal-cell column items-center justify-center q-pa-xs"
                :style="{
                  background: isSameDay(day, todayDate)
                    ? $q.dark.isActive
                      ? '#25203a'
                      : 'rgba(139,111,216,0.08)'
                    : $q.dark.isActive
                      ? '#181d28'
                      : '#fafbfc',
                  height: '56px',
                }"
              >
                <div class="row items-center gap-xs">
                  <span
                    class="text-caption text-weight-bold"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                  >
                    {{ formatWeekdayName(day) }}
                  </span>
                  <q-badge
                    :color="
                      isSameDay(day, todayDate) ? 'primary' : $q.dark.isActive ? 'grey-9' : 'grey-3'
                    "
                    :text-color="
                      isSameDay(day, todayDate) ? 'white' : $q.dark.isActive ? 'grey-3' : 'dark'
                    "
                    class="text-weight-bold"
                  >
                    {{ day.getDate() }}
                  </q-badge>
                </div>

                <!-- Availability Status Chip -->
                <q-chip
                  v-if="getDayAvailability(day)"
                  dense
                  square
                  size="xs"
                  :color="getAvailBadgeColor(getDayAvailability(day)!.status)"
                  text-color="white"
                  class="q-mt-xs text-weight-bold"
                  :icon="getAvailIcon(getDayAvailability(day)!.status)"
                >
                  {{ getAvailShortLabel(getDayAvailability(day)!) }}
                  <q-tooltip>
                    {{ getAvailTooltip(getDayAvailability(day)!) }}
                  </q-tooltip>
                </q-chip>
              </div>

              <!-- Time Hour Rows & Grid Cells -->
              <template v-for="hour in TIME_HOURS" :key="hour">
                <div
                  class="cal-cell flex flex-center"
                  :style="{ background: $q.dark.isActive ? '#181d28' : '#fafbfc', height: '54px' }"
                >
                  <span class="text-caption text-grey-5">{{ hour }}</span>
                </div>
                <div
                  v-for="day in displayedDays"
                  :key="`${day.toISOString()}-${hour}`"
                  class="cal-cell"
                  :style="{
                    background: isSameDay(day, todayDate)
                      ? $q.dark.isActive
                        ? 'rgba(139,111,216,0.06)'
                        : 'rgba(139,111,216,0.02)'
                      : 'transparent',
                    height: '54px',
                  }"
                />
              </template>

              <!-- Rendered Task Blocks -->
              <div
                v-for="item in positionedCalendarTasks"
                :key="item.task.task_id"
                class="calendar-task-block cursor-pointer"
                :style="item.style"
                @click="goToTask(item.task.task_id)"
              >
                <div class="row items-center justify-between no-wrap text-caption text-weight-bold">
                  <span style="font-size: 9.5px; opacity: 0.9">{{ item.timeRange }}</span>
                  <q-badge
                    rounded
                    :color="
                      item.task.priority === 'CRITICAL'
                        ? 'negative'
                        : item.task.priority === 'HIGH'
                          ? 'warning'
                          : 'primary'
                    "
                    style="width: 6px; height: 6px"
                  />
                </div>
                <div class="text-subtitle2 text-weight-bold ellipsis" :title="item.task.title">
                  {{ item.task.title }}
                </div>
                <div class="text-caption ellipsis" style="font-size: 10px; opacity: 0.85">
                  {{ item.task.project_name }}
                </div>
              </div>
            </div>
          </div>
        </q-card>

        <!-- B. MONTH MATRIX VIEW -->
        <q-card
          v-else-if="scheduleViewMode === 'month'"
          flat
          bordered
          :dark="$q.dark.isActive"
          class="rounded-borders overflow-hidden q-mb-lg"
        >
          <div class="calendar-scroll-wrapper">
            <div class="month-grid-container">
              <div
                class="row text-center"
                :style="{
                  background: $q.dark.isActive ? '#181d28' : '#fafbfc',
                  borderBottom: $q.dark.isActive
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid #eef0f4',
                }"
              >
                <div
                  v-for="wDay in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                  :key="wDay"
                  class="col q-pa-xs text-caption text-weight-bold text-grey-5"
                >
                  {{ wDay }}
                </div>
              </div>

              <div class="month-days-matrix">
                <div
                  v-for="mDay in monthMatrixDays"
                  :key="mDay.date.toISOString()"
                  class="month-day-cell column justify-between"
                  :style="{
                    background: isSameDay(mDay.date, todayDate)
                      ? $q.dark.isActive
                        ? 'rgba(139,111,216,0.1)'
                        : 'rgba(139,111,216,0.04)'
                      : !mDay.isCurrentMonth
                        ? $q.dark.isActive
                          ? 'rgba(0,0,0,0.2)'
                          : '#fafbfc'
                        : 'transparent',
                    borderColor: $q.dark.isActive ? 'rgba(255,255,255,0.08)' : '#f0f2f5',
                  }"
                >
                  <div class="row items-center justify-between">
                    <q-badge
                      :color="isSameDay(mDay.date, todayDate) ? 'primary' : 'transparent'"
                      :text-color="
                        isSameDay(mDay.date, todayDate)
                          ? 'white'
                          : $q.dark.isActive
                            ? 'grey-4'
                            : 'dark'
                      "
                      class="text-caption text-weight-bold"
                    >
                      {{ mDay.date.getDate() }}
                    </q-badge>

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

                  <div class="column q-gutter-xs overflow-auto" style="max-height: 70px">
                    <div
                      v-for="t in getTasksOnDate(mDay.date)"
                      :key="t.task_id"
                      class="cursor-pointer ellipsis text-caption q-pa-xs rounded-borders"
                      :style="getMonthTaskPillStyle(t)"
                      @click.stop="goToTask(t.task_id)"
                    >
                      {{ t.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card>

        <!-- C. GANTT ROADMAP VIEW (DHTMLX GANTT) -->
        <div v-else-if="scheduleViewMode === 'gantt'" class="q-mb-lg">
          <DhtmlxGanttTimeline
            :tasks="filteredTasks"
            :projects="projects"
            title="My Schedule & Roadmap"
            @task-click="(task) => goToTask(task.task_id)"
          />
        </div>

        <!-- D. LIST TABLE VIEW -->
        <q-card
          v-else-if="scheduleViewMode === 'table'"
          flat
          bordered
          :dark="$q.dark.isActive"
          class="rounded-borders overflow-hidden q-mb-lg"
        >
          <q-table
            flat
            :dark="$q.dark.isActive"
            :rows="filteredTasks"
            :columns="tableColumns"
            row-key="task_id"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-title="props">
              <q-td :props="props">
                <div class="cursor-pointer" @click="goToTask(props.row.task_id)">
                  <div
                    class="text-weight-bold ellipsis"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    {{ props.row.title }}
                  </div>
                  <div
                    v-if="props.row.description"
                    class="text-caption ellipsis"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    {{ props.row.description }}
                  </div>
                  <div
                    v-if="props.row.is_deadline_at_risk || props.row.is_schedule_at_risk"
                    class="row items-center q-gutter-xs q-mt-xs"
                  >
                    <q-chip
                      v-if="props.row.is_deadline_at_risk"
                      dense
                      square
                      size="sm"
                      :color="$q.dark.isActive ? 'red-10' : 'red-1'"
                      :text-color="$q.dark.isActive ? 'red-2' : 'negative'"
                      icon="warning"
                      label="Deadline Risk"
                      class="text-weight-bold"
                    />
                    <q-chip
                      v-if="props.row.is_schedule_at_risk"
                      dense
                      square
                      size="sm"
                      :color="$q.dark.isActive ? 'orange-10' : 'orange-1'"
                      :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'"
                      icon="schedule"
                      label="Schedule Risk"
                      class="text-weight-bold"
                    />
                  </div>
                </div>
              </q-td>
            </template>

            <template #body-cell-project="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="folder"
                  :label="props.row.project_name || `Project #${props.row.project_id}`"
                  class="text-weight-bold"
                />
              </q-td>
            </template>

            <template #body-cell-priority="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  size="sm"
                  :color="priorityColor(props.row.priority)"
                  :text-color="priorityTextColor(props.row.priority)"
                  :label="props.row.priority"
                  class="text-weight-bold"
                />
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  size="sm"
                  :color="statusColor(props.row.status)"
                  :text-color="statusTextColor(props.row.status)"
                  :label="props.row.status.replace('_', ' ')"
                  class="text-weight-bold"
                />
              </q-td>
            </template>

            <template #body-cell-progress="props">
              <q-td :props="props">
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-linear-progress
                    :value="(Number(props.row.progress) || 0) / 100"
                    size="6px"
                    rounded
                    color="primary"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                    style="width: 70px"
                  />
                  <span class="text-caption text-weight-bold">
                    {{ Number(props.row.progress) || 0 }}%
                  </span>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { getTasksApi, getProjectsApi, getResourceAvailabilityApi } from '@/services/api';
import type { Task, Project, DailyAvailabilityDTO, AvailabilityStatus } from '@/services/api';
import { isOverdue } from '@/utils/taskHelpers';
import DhtmlxGanttTimeline from '@/components/gantt/DhtmlxGanttTimeline.vue';
import StatCard from '@/components/dashboard/StatCard.vue';

const $q = useQuasar();
const router = useRouter();

const loading = ref(true);
const scheduleViewMode = ref<'week' | 'day' | 'month' | 'gantt' | 'table'>('week');
const currentAnchorDate = ref<Date>(new Date());
const todayDate = new Date();

const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);

const searchQuery = ref('');
const projectFilter = ref<string | null>(null);
const statusFilter = ref<string | null>(null);
const priorityFilter = ref<string | null>(null);

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

const displayedDays = computed(() => {
  const days: Date[] = [];
  const anchor = new Date(currentAnchorDate.value);

  if (scheduleViewMode.value === 'day') {
    days.push(new Date(anchor));
  } else {
    // Week view: Monday to Sunday
    const dayOfWeek = anchor.getDay(); // 0 is Sun, 1 is Mon
    const diff = anchor.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(anchor.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
  }
  return days;
});

const formattedDateRangeHeader = computed(() => {
  if (scheduleViewMode.value === 'day') {
    return currentAnchorDate.value.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  if (scheduleViewMode.value === 'month') {
    return currentAnchorDate.value.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  }
  if (!displayedDays.value.length) return '';
  const first = displayedDays.value[0]!;
  const last = displayedDays.value[displayedDays.value.length - 1]!;
  return `${first.getDate()} ${first.toLocaleDateString('en-GB', { month: 'short' })} – ${last.getDate()} ${last.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
});

const monthMatrixDays = computed(() => {
  const anchor = new Date(currentAnchorDate.value);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  const firstDayWeek = firstOfMonth.getDay(); // 0 Sun, 1 Mon
  const prevDaysCount = firstDayWeek === 0 ? 6 : firstDayWeek - 1;
  for (let i = prevDaysCount; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  for (let i = 1; i <= lastOfMonth.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remainder = 42 - days.length;
  for (let i = 1; i <= remainder; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
});

const positionedCalendarTasks = computed(() => {
  const result: { task: Task; timeRange: string; style: Record<string, string> }[] = [];
  const days = displayedDays.value;
  if (!days.length) return result;

  const startHour = 8;
  const endHour = 18;
  const totalHours = endHour - startHour;

  filteredTasks.value.forEach((task, idx) => {
    const startDate = task.planned_start || task.actual_start || task.start_date;
    const endDate = task.planned_end || task.deadline || task.actual_end;
    if (!startDate) return;

    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : new Date(s.getTime() + 2 * 3600 * 1000);

    const dayIndex = days.findIndex((d) => isSameDay(d, s));
    if (dayIndex === -1) return;

    const taskStartHour = s.getHours() + s.getMinutes() / 60;
    const taskEndHour = e.getHours() + e.getMinutes() / 60;

    const clampedStart = Math.max(startHour, Math.min(endHour, taskStartHour));
    const clampedEnd = Math.max(clampedStart + 0.5, Math.min(endHour, taskEndHour));

    const topPct = ((clampedStart - startHour) / totalHours) * 100;
    const heightPct = ((clampedEnd - clampedStart) / totalHours) * 100;

    const colWidth = 100 / days.length;
    const leftPct = (dayIndex / days.length) * 100;

    const colors = [
      'linear-gradient(135deg, rgba(139,111,216,0.15), rgba(139,111,216,0.25))',
      'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.25))',
      'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.25))',
      'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.25))',
    ];
    const borderColors = ['#8b6fd8', '#3b82f6', '#10b981', '#f59e0b'];
    const chosenColor = colors[idx % colors.length]!;
    const chosenBorder = borderColors[idx % borderColors.length]!;

    result.push({
      task,
      timeRange: `${s.getHours()}:${String(s.getMinutes()).padStart(2, '0')} - ${e.getHours()}:${String(e.getMinutes()).padStart(2, '0')}`,
      style: {
        top: `calc(${topPct}% + 56px)`,
        height: `calc(${heightPct}% - 6px)`,
        left: `calc(${leftPct}% + 66px)`,
        width: `calc(${colWidth}% - 8px)`,
        background: chosenColor,
        borderLeft: `4px solid ${chosenBorder}`,
      },
    });
  });

  return result;
});

const tableColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: 'title', align: 'left', sortable: true },
  { name: 'project', label: 'Project', field: 'project_name', align: 'left', sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'center', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'progress', label: 'Progress', field: 'progress', align: 'left', sortable: true },
  {
    name: 'deadline',
    label: 'Due Date',
    field: (row: Task) => row.deadline || row.actual_end || '—',
    align: 'right',
    sortable: true,
  },
];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatWeekdayName(day: Date): string {
  return day.toLocaleDateString('en-GB', { weekday: 'short' });
}

function navigateDate(direction: number) {
  const newDate = new Date(currentAnchorDate.value);
  if (scheduleViewMode.value === 'day') {
    newDate.setDate(newDate.getDate() + direction);
  } else if (scheduleViewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() + direction);
  } else {
    newDate.setDate(newDate.getDate() + direction * 7);
  }
  currentAnchorDate.value = newDate;
}

function goToToday() {
  currentAnchorDate.value = new Date();
}

function getTasksOnDate(date: Date): Task[] {
  return filteredTasks.value.filter((t) => {
    const s = t.planned_start || t.actual_start || t.start_date;
    if (!s) return false;
    return isSameDay(new Date(s), date);
  });
}

function getMonthTaskPillStyle(task: Task) {
  const bg =
    task.priority === 'CRITICAL'
      ? 'rgba(239,68,68,0.15)'
      : task.priority === 'HIGH'
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(139,111,216,0.15)';
  const color =
    task.priority === 'CRITICAL' ? '#ef4444' : task.priority === 'HIGH' ? '#f59e0b' : '#8b6fd8';
  return { background: bg, color, fontWeight: '600' };
}

function priorityColor(priority: string) {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'CRITICAL':
        return 'red-10';
      case 'HIGH':
        return 'orange-10';
      case 'MEDIUM':
        return 'purple-10';
      default:
        return 'blue-10';
    }
  }
  switch (priority) {
    case 'CRITICAL':
      return 'red-1';
    case 'HIGH':
      return 'orange-1';
    case 'MEDIUM':
      return 'purple-1';
    default:
      return 'blue-1';
  }
}

function priorityTextColor(priority: string) {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'CRITICAL':
        return 'red-2';
      case 'HIGH':
        return 'orange-2';
      case 'MEDIUM':
        return 'purple-2';
      default:
        return 'blue-2';
    }
  }
  switch (priority) {
    case 'CRITICAL':
      return 'negative';
    case 'HIGH':
      return 'deep-orange';
    case 'MEDIUM':
      return 'primary';
    default:
      return 'blue-8';
  }
}

function statusColor(status: string) {
  if ($q.dark.isActive) {
    switch (status) {
      case 'COMPLETED':
        return 'green-10';
      case 'IN_PROGRESS':
        return 'blue-10';
      case 'SCHEDULED':
        return 'purple-10';
      default:
        return 'grey-9';
    }
  }
  switch (status) {
    case 'COMPLETED':
      return 'green-1';
    case 'IN_PROGRESS':
      return 'blue-1';
    case 'SCHEDULED':
      return 'purple-1';
    default:
      return 'grey-3';
  }
}

function statusTextColor(status: string) {
  if ($q.dark.isActive) {
    switch (status) {
      case 'COMPLETED':
        return 'green-2';
      case 'IN_PROGRESS':
        return 'blue-2';
      case 'SCHEDULED':
        return 'purple-2';
      default:
        return 'grey-4';
    }
  }
  switch (status) {
    case 'COMPLETED':
      return 'positive';
    case 'IN_PROGRESS':
      return 'blue-8';
    case 'SCHEDULED':
      return 'primary';
    default:
      return 'grey-8';
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
      return `${day.available_hours}h Free`;
    case 'PARTIALLY_AVAILABLE':
      return `${day.available_hours}h Free`;
    case 'FULLY_BOOKED':
      return 'Booked';
    case 'ON_LEAVE':
      return 'On Leave';
    case 'PARTIAL_LEAVE':
      return `Leave (${day.leave_hours}h)`;
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
      return `Available: ${day.available_hours}h capacity free`;
    case 'PARTIALLY_AVAILABLE':
      return `Partially available: ${day.available_hours}h free (${day.allocated_hours}h allocated)`;
    case 'FULLY_BOOKED':
      return `Fully booked: ${day.allocated_hours}h allocated of ${day.daily_working_hours}h`;
    case 'ON_LEAVE':
      return `On Leave: ${day.leave_hours}h full-day leave`;
    case 'PARTIAL_LEAVE':
      return `Partial leave: ${day.leave_hours}h leave (${day.available_hours}h available)`;
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
    // Gantt or Table view: fetch current month +/- 30 days
    const anchor = currentAnchorDate.value;
    startDateStr = formatLocalDate(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    endDateStr = formatLocalDate(new Date(anchor.getFullYear(), anchor.getMonth() + 2, 0));
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
    const [tasksRes, projectsRes] = await Promise.all([
      getTasksApi(),
      getProjectsApi(),
      fetchAvailabilityForVisibleRange(),
    ]);
    tasks.value = tasksRes || [];
    projects.value = projectsRes || [];
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
.calendar-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
}

.calendar-table-grid {
  display: grid;
  position: relative;
  width: 100%;
}

.cal-cell {
  border-right: 1px solid var(--wo-border-subtle, #eef0f4);
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f4);
}

.calendar-task-block {
  position: absolute;
  z-index: 5;
  border-radius: 8px;
  padding: 6px 8px;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.08);
  overflow: hidden;
}

.month-grid-container {
  width: 100%;
  min-width: 650px;
}

.month-days-matrix {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
  min-height: 480px;
}

.month-day-cell {
  min-height: 90px;
  border-right: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
  padding: 6px;
}

body.body--dark {
  .cal-cell,
  .month-day-cell {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
}
</style>
