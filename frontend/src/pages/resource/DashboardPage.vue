<template>
  <q-page class="pm-page resource-dashboard-page">
    <div class="q-mx-auto" style="max-width: 1380px">
      <!-- 1. HEADER / GREETING SECTION -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div class="row items-center gap-xs q-mb-xs">
            <span class="role-context-badge bg-purple-soft text-purple text-weight-bold">
              ✦ Resource Workspace
            </span>
          </div>
          <div class="page-title">
            Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}!
          </div>
          <div class="page-subtitle">
            Here's a real-time overview of your workload, progress, and scheduled tasks.
          </div>
        </div>

        <q-btn
          outline
          no-caps
          icon="refresh"
          label="Refresh"
          class="action-btn-outline"
          :loading="loading"
          @click="loadDashboardData"
        />
      </div>

      <!-- SKELETON LOADING -->
      <div v-if="loading" class="row q-col-gutter-md q-mt-xs">
        <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
          <q-skeleton type="rect" height="110px" class="rounded-borders" />
        </div>
        <div class="col-12 q-mt-md">
          <q-skeleton type="rect" height="220px" class="rounded-borders" />
        </div>
      </div>

      <!-- ERROR BANNER -->
      <q-banner v-else-if="error" class="bg-negative text-white rounded-borders q-mb-md">
        {{ error }}
        <template #action>
          <q-btn flat no-caps label="Retry" @click="loadDashboardData" />
        </template>
      </q-banner>

      <!-- MAIN DASHBOARD BODY -->
      <div v-else class="dashboard-body-container">
        <!-- 2. HERO ROW: TODAY'S FOCUS + PRODUCTIVITY OVERVIEW -->
        <div class="row q-col-gutter-lg">
          <!-- Today's Focus Card -->
          <div class="col-12 col-md-7">
            <q-card
              flat
              bordered
              class="focus-hero-card dashboard-card q-pa-lg column justify-between"
              style="min-height: 220px; border-radius: 14px"
            >
              <div>
                <q-chip
                  dense
                  square
                  color="white"
                  text-color="purple-9"
                  class="text-caption text-weight-bolder q-mb-sm"
                >
                  ✦ TODAY'S FOCUS
                </q-chip>
                <div class="text-h5 text-weight-bold text-white">Plan. Prioritize. Achieve.</div>
                <div class="text-body2 text-white-8 q-mt-xs" style="max-width: 480px">
                  Stay on top of active deliverables, monitor your deadlines, and log progress seamlessly.
                </div>
              </div>

              <div class="row items-center justify-between q-mt-md wrap gap-sm">
                <div class="row items-center gap-xs gt-xs">
                  <span class="text-caption text-weight-bold text-white-8">Quick links:</span>
                  <q-chip
                    clickable
                    dense
                    square
                    color="rgba(255,255,255,0.18)"
                    text-color="white"
                    icon="assignment"
                    class="text-caption text-weight-bold"
                    @click="goToTaskDetails()"
                  >
                    Tasks
                  </q-chip>
                  <q-chip
                    clickable
                    dense
                    square
                    color="rgba(255,255,255,0.18)"
                    text-color="white"
                    icon="trending_up"
                    class="text-caption text-weight-bold"
                    @click="goToProgress()"
                  >
                    Progress
                  </q-chip>
                </div>

                <q-btn
                  unelevated
                  no-caps
                  color="white"
                  text-color="primary"
                  label="View Task Specs"
                  icon-right="arrow_forward"
                  class="text-weight-bold"
                  style="border-radius: 8px"
                  @click="goToTaskDetails()"
                />
              </div>
            </q-card>
          </div>

          <!-- Productivity & Overview Card -->
          <div class="col-12 col-md-5">
            <q-card
              flat
              bordered
              class="dashboard-card q-pa-lg column justify-between full-height"
              style="border-radius: 14px"
            >
              <div>
                <div class="text-subtitle1 text-weight-bold text-main">
                  Productivity & Overview
                </div>
                <div class="text-caption text-muted">
                  Workload & effort tracking
                </div>
              </div>

              <div class="row items-center gap-md q-mt-sm">
                <div class="productivity-ring-container">
                  <svg viewBox="0 0 86 86" class="productivity-svg">
                    <circle cx="43" cy="43" r="36" fill="none" stroke="var(--wo-border, #eef0f4)" stroke-width="7" />
                    <circle
                      cx="43"
                      cy="43"
                      r="36"
                      fill="none"
                      stroke="var(--wo-primary, #8b6fd8)"
                      stroke-width="7"
                      :stroke-dasharray="226.19"
                      :stroke-dashoffset="226.19 * (1 - (workload.consumedPct / 100))"
                      stroke-linecap="round"
                      style="transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 0.5s ease"
                    />
                  </svg>
                  <div class="productivity-ring-center">
                    <div class="text-subtitle1 text-weight-bolder text-primary" style="line-height: 1">
                      {{ workload.consumedPct }}%
                    </div>
                    <div class="ring-sub-label">CONSUMED</div>
                  </div>
                </div>

                <div class="column gap-xs">
                  <div class="row items-center gap-xs">
                    <q-badge rounded style="background: #8b6fd8; width: 8px; height: 8px" />
                    <span class="text-body2 text-main">
                      <strong>{{ workload.activeTasks }}</strong> Active Tasks
                    </span>
                  </div>
                  <div class="row items-center gap-xs">
                    <q-badge rounded style="background: #3b82f6; width: 8px; height: 8px" />
                    <span class="text-body2 text-main">
                      <strong>{{ workload.actualEffort }}h</strong> Actual Logged
                    </span>
                  </div>
                  <div class="row items-center gap-xs">
                    <q-badge rounded style="background: #10b981; width: 8px; height: 8px" />
                    <span class="text-body2 text-main">
                      <strong>{{ workload.remainingEffort }}h</strong> Remaining
                    </span>
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- 3. FOUR PASTEL STAT CARDS -->
        <div class="row q-col-gutter-md">
          <div v-for="stat in pastelStatCards" :key="stat.title" class="col-12 col-sm-6 col-md-3">
            <StatCard
              :title="stat.title"
              :value="stat.value"
              :subtitle="stat.subtitle"
              :badge="stat.badge"
              :icon="stat.icon"
              :color="stat.color"
              :negative="stat.negative"
            />
          </div>
        </div>

        <!-- 4. WORKLOAD + TASK STATUS ROW -->
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

        <!-- 5. PROJECTS BREAKDOWN & ATTENTION / SELF-ASSIGNED -->
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <ProjectsBreakdownCard :projects="projectSummary" />
          </div>

          <div class="col-12 col-md-6 column gap-md">
            <!-- NEEDS ATTENTION -->
            <q-card flat bordered class="dashboard-card" style="border-radius: 14px">
              <q-card-section class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-subtitle1 text-weight-bold text-main">
                    Needs Attention
                  </div>
                  <div class="text-caption text-muted">
                    Tasks requiring urgent review or action
                  </div>
                </div>
                <q-badge v-if="attentionTasks.length" color="negative" outline :label="`${attentionTasks.length} items`" />
              </q-card-section>

              <q-separator />

              <div v-if="!attentionTasks.length" class="q-pa-lg text-center text-muted">
                <q-icon name="check_circle" size="34px" color="positive" />
                <div class="text-body2 q-mt-sm text-main">You're on track — no tasks need immediate attention.</div>
              </div>

              <q-list v-else separator>
                <q-item v-for="t in attentionTasks" :key="t.task_id" clickable @click="goToTaskDetails(t.task_id)">
                  <q-item-section avatar>
                    <q-avatar
                      size="34px"
                      :color="attentionMeta(t).color === 'negative' ? 'red-1' : 'orange-1'"
                      :text-color="attentionMeta(t).color === 'negative' ? 'negative' : 'deep-orange'"
                      :icon="attentionMeta(t).icon"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-main">{{ t.title }}</q-item-label>
                    <q-item-label caption class="text-muted">{{ t.project_name || `Project #${t.project_id}` }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-chip
                      dense
                      square
                      :color="attentionMeta(t).color === 'negative' ? 'red-1' : 'orange-1'"
                      :text-color="attentionMeta(t).color === 'negative' ? 'negative' : 'deep-orange'"
                      class="text-caption text-weight-bold"
                    >
                      {{ attentionMeta(t).label }}
                    </q-chip>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>

            <!-- SELF ASSIGNED TASKS -->
            <q-card flat bordered class="dashboard-card" style="border-radius: 14px">
              <q-card-section class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-subtitle1 text-weight-bold text-main">
                    Self-Assigned Tasks
                  </div>
                  <div class="text-caption text-muted">
                    Tasks created by you
                  </div>
                </div>
                <q-chip dense square color="purple-1" text-color="primary" class="text-caption text-weight-bold">
                  {{ selfAssignedTasks.length }} tasks
                </q-chip>
              </q-card-section>

              <q-separator />

              <div v-if="selfAssignedTasks.length === 0" class="q-pa-lg text-center text-muted">
                <q-avatar size="44px" color="grey-2" text-color="grey-7" icon="assignment_ind" />
                <div class="text-body2 q-mt-sm text-main">No self-assigned tasks yet.</div>
                <div class="text-caption q-mt-xs">Tasks you create yourself will appear here.</div>
              </div>

              <q-list v-else separator>
                <q-item v-for="taskItem in selfAssignedTasks" :key="taskItem.task_id">
                  <q-item-section avatar>
                    <q-avatar size="34px" color="purple-1" text-color="primary" icon="assignment_ind" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-main">{{ taskItem.title }}</q-item-label>
                    <q-item-label caption class="text-muted">{{ taskItem.project_name || `Project #${taskItem.project_id}` }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="column items-end gap-xs">
                      <q-chip
                        dense
                        square
                        :color="statusColor(taskItem.status)"
                        :text-color="statusTextColor(taskItem.status)"
                        class="text-caption text-weight-bold"
                      >
                        {{ taskItem.status.replace('_', ' ') }}
                      </q-chip>
                      <div class="text-caption text-weight-bold text-main">
                        {{ Number(taskItem.progress) || 0 }}%
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>

        <!-- 6. SCHEDULE & GANTT ROADMAP SECTION -->
        <div>
          <q-card flat bordered class="dashboard-card schedule-roadmap-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between wrap q-gutter-y-sm q-mb-sm">
                <div>
                  <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                    Schedule & Gantt Roadmap
                  </div>
                  <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                    Interactive timeline of your assigned work across projects, dates, and milestones.
                  </div>
                </div>

                <q-btn-toggle
                  v-model="scheduleViewMode"
                  toggle-color="primary"
                  toggle-text-color="white"
                  :color="$q.dark.isActive ? 'grey-9' : 'white'"
                  :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
                  dense
                  rounded
                  unelevated
                  :options="[
                    { label: 'Week', value: 'week', icon: 'view_week' },
                    { label: 'Day', value: 'day', icon: 'view_day' },
                    { label: 'Month', value: 'month', icon: 'calendar_month' },
                    { label: 'Gantt', value: 'gantt', icon: 'timeline' },
                    { label: 'List', value: 'table', icon: 'table_rows' },
                  ]"
                />
              </div>

              <!-- Toolbar Controls -->
              <div class="row items-center justify-between wrap q-gutter-y-sm q-py-sm">
                <div class="row items-center q-gutter-xs">
                  <q-btn flat round dense icon="chevron_left" size="sm" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" @click="navigateDate(-1)" />
                  <q-btn flat round dense icon="chevron_right" size="sm" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" @click="navigateDate(1)" />
                  <q-btn outline dense no-caps label="Today" :color="$q.dark.isActive ? 'grey-4' : 'grey-8'" class="q-px-sm" @click="goToToday" />
                  <div class="text-subtitle2 text-weight-bold q-ml-xs" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                    {{ formattedDateRangeHeader }}
                  </div>
                </div>

                <div class="row items-center q-gutter-xs wrap">
                  <q-input v-model="ganttSearchQuery" outlined dense clearable placeholder="Search..." style="width: 140px">
                    <template #prepend><q-icon name="search" size="16px" /></template>
                  </q-input>
                  <q-select v-model="ganttProjectFilter" outlined dense emit-value map-options :options="ganttProjectFilterOptions" label="Project" style="width: 125px" />
                  <q-select v-model="ganttStatusFilter" outlined dense emit-value map-options :options="ganttStatusFilterOptions" label="Status" style="width: 125px" />
                  <q-select v-model="ganttPriorityFilter" outlined dense emit-value map-options :options="ganttPriorityFilterOptions" label="Priority" style="width: 125px" />
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-none">
              <!-- A. WEEK / DAY TIME-GRID VIEW -->
              <div v-if="scheduleViewMode === 'week' || scheduleViewMode === 'day'" class="calendar-scroll-wrapper">
                <div
                  class="calendar-table-grid"
                  :style="{ gridTemplateColumns: `64px repeat(${displayedDays.length}, minmax(${scheduleViewMode === 'day' ? '280px' : displayedDays.length <= 7 ? '110px' : '60px'}, 1fr))` }"
                >
                  <div class="cal-cell flex flex-center" :style="{ background: $q.dark.isActive ? '#181d28' : '#fafbfc', height: '48px' }">
                    <span class="text-caption text-weight-bold text-grey-5">TIME</span>
                  </div>

                  <div
                    v-for="day in displayedDays"
                    :key="day.toISOString()"
                    class="cal-cell row items-center justify-center q-gutter-xs q-pa-xs"
                    :style="{ background: isSameDay(day, todayDate) ? ($q.dark.isActive ? '#25203a' : 'rgba(139,111,216,0.08)') : ($q.dark.isActive ? '#181d28' : '#fafbfc'), height: '48px' }"
                  >
                    <span class="text-caption text-weight-bold" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">{{ formatWeekdayName(day) }}</span>
                    <q-badge :color="isSameDay(day, todayDate) ? 'primary' : ($q.dark.isActive ? 'grey-9' : 'grey-3')" :text-color="isSameDay(day, todayDate) ? 'white' : ($q.dark.isActive ? 'grey-3' : 'dark')" class="text-weight-bold">
                      {{ day.getDate() }}
                    </q-badge>
                  </div>

                  <template v-for="hour in TIME_HOURS" :key="hour">
                    <div class="cal-cell flex flex-center" :style="{ background: $q.dark.isActive ? '#181d28' : '#fafbfc', height: '54px' }">
                      <span class="text-caption text-grey-5">{{ hour }}</span>
                    </div>
                    <div
                      v-for="day in displayedDays"
                      :key="`${day.toISOString()}-${hour}`"
                      class="cal-cell"
                      :style="{ background: isSameDay(day, todayDate) ? ($q.dark.isActive ? 'rgba(139,111,216,0.06)' : 'rgba(139,111,216,0.02)') : 'transparent', height: '54px' }"
                    />
                  </template>

                  <!-- Rendered Task Blocks -->
                  <div
                    v-for="item in positionedCalendarTasks"
                    :key="item.task.task_id"
                    class="calendar-task-block cursor-pointer"
                    :style="item.style"
                    @click="goToTaskDetails(item.task.task_id)"
                  >
                    <div class="row items-center justify-between no-wrap text-caption text-weight-bold">
                      <span style="font-size: 9.5px; opacity: 0.9;">{{ item.timeRange }}</span>
                      <q-badge rounded :color="item.task.priority === 'CRITICAL' ? 'negative' : item.task.priority === 'HIGH' ? 'warning' : 'primary'" style="width:6px;height:6px;" />
                    </div>
                    <div class="text-subtitle2 text-weight-bold ellipsis" :title="item.task.title">{{ item.task.title }}</div>
                    <div class="text-caption ellipsis" style="font-size: 10px; opacity: 0.85;">{{ item.task.project_name }}</div>
                  </div>
                </div>
              </div>

              <!-- B. MONTH MATRIX VIEW -->
              <div v-else-if="scheduleViewMode === 'month'" class="calendar-scroll-wrapper">
                <div class="month-grid-container">
                  <div class="row text-center border-bottom" :style="{ background: $q.dark.isActive ? '#181d28' : '#fafbfc' }">
                    <div v-for="wDay in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="wDay" class="col q-pa-xs text-caption text-weight-bold text-grey-5">
                      {{ wDay }}
                    </div>
                  </div>

                  <div class="month-days-matrix">
                    <div
                      v-for="mDay in monthMatrixDays"
                      :key="mDay.date.toISOString()"
                      class="month-day-cell column justify-between"
                      :style="{ background: isSameDay(mDay.date, todayDate) ? ($q.dark.isActive ? 'rgba(139,111,216,0.1)' : 'rgba(139,111,216,0.04)') : !mDay.isCurrentMonth ? ($q.dark.isActive ? 'rgba(0,0,0,0.2)' : '#fafbfc') : 'transparent' }"
                    >
                      <div class="row items-center justify-between">
                        <q-badge :color="isSameDay(mDay.date, todayDate) ? 'primary' : 'transparent'" :text-color="isSameDay(mDay.date, todayDate) ? 'white' : ($q.dark.isActive ? 'grey-4' : 'dark')" class="text-caption text-weight-bold">
                          {{ mDay.date.getDate() }}
                        </q-badge>
                      </div>

                      <div class="column q-gutter-xs overflow-auto" style="max-height: 65px;">
                        <div
                          v-for="t in getTasksOnDate(mDay.date)"
                          :key="t.task_id"
                          class="cursor-pointer ellipsis text-caption q-pa-xs rounded-borders"
                          :style="getMonthTaskPillStyle(t)"
                          @click.stop="goToTaskDetails(t.task_id)"
                        >
                          {{ t.title }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- C. GANTT ROADMAP VIEW -->
              <div v-else-if="scheduleViewMode === 'gantt'" class="calendar-scroll-wrapper">
                <GanttChart
                  :tasks="filteredGanttTasks"
                  mode="resource"
                  empty-title="No matching schedule items"
                  empty-subtitle="Adjust your filters to view tasks on the Gantt timeline."
                  :show-assignees="false"
                  :max-window-days="60"
                  :embedded="true"
                  :hide-header="true"
                  @task-click="handleGanttTaskClick"
                />
              </div>

              <!-- D. LIST TABLE VIEW -->
              <div v-else-if="scheduleViewMode === 'table'" class="calendar-scroll-wrapper">
                <q-table
                  flat
                  :dark="$q.dark.isActive"
                  :rows="filteredTasksList"
                  :columns="scheduleTableColumns"
                  row-key="task_id"
                  :pagination="{ rowsPerPage: 10 }"
                >
                  <template #body-cell-title="props">
                    <q-td :props="props">
                      <div class="cursor-pointer" @click="goToTaskDetails(props.row.task_id)">
                        <div class="text-weight-bold ellipsis" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ props.row.title }}</div>
                        <div v-if="props.row.description" class="text-caption ellipsis" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">{{ props.row.description }}</div>
                      </div>
                    </q-td>
                  </template>

                  <template #body-cell-project="props">
                    <q-td :props="props">
                      <q-chip dense square :color="$q.dark.isActive ? 'purple-10' : 'deep-purple-1'" :text-color="$q.dark.isActive ? 'purple-2' : 'primary'" class="text-caption text-weight-bold">
                        <q-icon name="folder" size="12px" class="q-mr-xs" />
                        {{ props.row.project_name || `Project #${props.row.project_id}` }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-priority="props">
                    <q-td :props="props">
                      <q-chip dense square :color="priorityColor(props.row.priority)" :text-color="priorityTextColor(props.row.priority)" class="text-caption text-weight-bold">
                        {{ props.row.priority }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-status="props">
                    <q-td :props="props">
                      <q-chip dense square :color="statusColor(props.row.status)" :text-color="statusTextColor(props.row.status)" class="text-caption text-weight-bold">
                        {{ formatStatus(props.row.status) }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template #body-cell-dates="props">
                    <q-td :props="props">
                      <div class="row items-center no-wrap text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
                        <span>{{ formatDate(props.row.start_date) }}</span>
                        <span class="q-mx-xs">→</span>
                        <span>{{ formatDate(props.row.deadline) }}</span>
                      </div>
                    </q-td>
                  </template>

                  <template #body-cell-progress="props">
                    <q-td :props="props">
                      <div class="q-gutter-xs">
                        <div class="row justify-between text-caption">
                          <span class="text-weight-bold">{{ Number(props.row.progress) || 0 }}%</span>
                          <span v-if="isOverdue(props.row)" class="text-negative text-weight-bold">Overdue</span>
                        </div>
                        <q-linear-progress
                          rounded
                          size="6px"
                          :value="(Number(props.row.progress) || 0) / 100"
                          :color="isOverdue(props.row) ? 'negative' : props.row.status === 'COMPLETED' ? 'positive' : 'primary'"
                          :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                        />
                      </div>
                    </q-td>
                  </template>
                </q-table>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import WorkloadCard from '@/components/resource/WorkloadCard.vue';
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue';
import ProjectsBreakdownCard from '@/components/resource/ProjectsBreakdownCard.vue';
import GanttChart, { type GanttTask } from '@/components/gantt/GanttChart.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate, formatStatus } from '@/utils/formatters';
import { isOverdue, mapTaskToGanttTask } from '@/utils/taskHelpers';
import {
  getTasksApi,
  getResourceWorkloadApi,
  type Task,
  type ResourceWorkload,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');
const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);

const currentUserId = computed(() => authStore.user?.user_id ?? null);
const userFirstName = computed(() => authStore.user?.name?.split(' ')[0] ?? '');

function isSelfAssigned(item: Task | null | undefined): boolean {
  if (!item || !authStore.user?.user_id) return false;
  return Number(item.created_by) === Number(authStore.user.user_id);
}

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
  { bg: '#E0F2FE', border: '#BAE0FD', text: '#0369A1', badge: '#0284c7' },
  { bg: '#ECFDF5', border: '#B3ECC9', text: '#047857', badge: '#059669' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', badge: '#ea580c' },
  { bg: '#FCE7F3', border: '#FBCFE8', text: '#BE185D', badge: '#db2777' },
  { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', badge: '#d97706' },
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
    background: $q.dark.isActive ? 'rgba(139, 111, 216, 0.18)' : theme.bg,
    color: $q.dark.isActive ? '#b89bf8' : theme.text,
    borderLeft: `3px solid ${theme.badge}`,
  };
}

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

    const matchesProject = ganttProjectFilter.value === 'ALL' || pName === ganttProjectFilter.value;
    const matchesStatus = ganttStatusFilter.value === 'ALL' || task.status === ganttStatusFilter.value;
    const matchesPriority = ganttPriorityFilter.value === 'ALL' || task.priority === ganttPriorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

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
          background: $q.dark.isActive ? '#1e1b2e' : theme.bg,
          borderColor: $q.dark.isActive ? '#2e2845' : theme.border,
          color: $q.dark.isActive ? '#b89bf8' : theme.text,
          borderLeft: `4px solid ${theme.badge}`,
        },
      });
    });
  });

  return results;
});

const filteredGanttTasks = computed<GanttTask[]>(() => {
  return filteredTasksList.value.map((task) =>
    mapTaskToGanttTask(task, {
      assignedNames: isSelfAssigned(task) ? ['Self-assigned'] : undefined,
    }),
  );
});

const scheduleTableColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  { name: 'project', label: 'Project', field: (t) => t.project_name || t.project_id, align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'dates', label: 'Start & Deadline', field: () => '', align: 'left' },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
];

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
    color: 'sky',
    negative: false,
  },
  {
    title: 'In Progress',
    value: activeTasksCount.value,
    subtitle: 'Active work',
    badge: 'Ongoing',
    icon: 'sync',
    color: 'amber',
    negative: false,
  },
  {
    title: 'Completed',
    value: completedTasksCount.value,
    subtitle: 'Done',
    badge: 'Delivered',
    icon: 'check_circle',
    color: 'mint',
    negative: false,
  },
  {
    title: 'Delayed',
    value: delayedTasksCount.value,
    subtitle: 'Need attention',
    badge: 'Urgent',
    icon: 'warning',
    color: 'rose',
    negative: delayedTasksCount.value > 0,
  },
]);

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
    };
  }
  return {
    icon: 'priority_high',
    color: 'deep-orange',
    label: 'Critical',
  };
}

const selfAssignedTasks = computed(() => {
  if (!currentUserId.value) return [];
  return tasks.value.filter((t) => t.created_by === currentUserId.value);
});

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

function priorityColor(priority: Task['priority']): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-10';
      case 'MEDIUM':
        return 'purple-10';
      case 'HIGH':
        return 'orange-10';
      case 'CRITICAL':
        return 'red-10';
      default:
        return 'grey-9';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-1';
    case 'MEDIUM':
      return 'deep-purple-1';
    case 'HIGH':
      return 'orange-1';
    case 'CRITICAL':
      return 'red-1';
    default:
      return 'grey-2';
  }
}

function priorityTextColor(priority: Task['priority']): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-2';
      case 'MEDIUM':
        return 'purple-2';
      case 'HIGH':
        return 'orange-2';
      case 'CRITICAL':
        return 'red-2';
      default:
        return 'grey-2';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-8';
    case 'MEDIUM':
      return 'primary';
    case 'HIGH':
      return 'orange-8';
    case 'CRITICAL':
      return 'red-8';
    default:
      return 'grey-8';
  }
}

function statusColor(status: Task['status']): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-10';
      case 'IN_PROGRESS':
        return 'blue-10';
      case 'COMPLETED':
        return 'green-10';
      default:
        return 'grey-9';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'deep-purple-1';
    case 'IN_PROGRESS':
      return 'blue-1';
    case 'COMPLETED':
      return 'green-1';
    default:
      return 'grey-2';
  }
}

function statusTextColor(status: Task['status']): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-2';
      case 'IN_PROGRESS':
        return 'blue-2';
      case 'COMPLETED':
        return 'green-2';
      default:
        return 'grey-3';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'primary';
    case 'IN_PROGRESS':
      return 'blue-8';
    case 'COMPLETED':
      return 'green-8';
    default:
      return 'grey-8';
  }
}

function goToTaskDetails(id?: number) {
  if (id) {
    void router.push(`/app/resource-dashboard/task-details/${id}`);
  } else {
    void router.push('/app/resource-dashboard/task-details');
  }
}

function handleGanttTaskClick(ganttTask: GanttTask) {
  goToTaskDetails(ganttTask.id);
}

function goToProgress() {
  void router.push('/app/resource-dashboard/progress');
}
</script>

<style scoped lang="scss">
.focus-hero-card {
  background-image: url('/projects/todays_focus_hero.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
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

.productivity-ring-container {
  position: relative;
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 86px;
}

.productivity-svg {
  width: 100%;
  height: 100%;
}

.productivity-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.ring-sub-label {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--wo-text-muted, #94a3b8);
  line-height: 1;
  margin-top: 2px;
}

.resource-dashboard-page {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.dashboard-body-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;

  > div {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
}

.schedule-roadmap-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 14px;
  overflow: hidden;
  box-sizing: border-box;

  :deep(.q-card__section) {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
}

.calendar-scroll-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    height: 9px;
  }

  &::-webkit-scrollbar-track {
    background: var(--wo-bg-page, #f1f5f9);
    border-radius: 9999px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--wo-primary, #8b6fd8);
    border-radius: 9999px;
    border: 2px solid var(--wo-bg-page, #f1f5f9);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--wo-primary-dark, #7c3aed);
  }
}

.calendar-table-grid {
  display: grid;
  position: relative;
  width: 100%;
  min-width: 100%;
  box-sizing: border-box;
}

.cal-cell {
  border-right: 1px solid var(--wo-border-subtle, #eef0f4);
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f4);
}

.calendar-task-block {
  position: absolute;
  left: 3px;
  right: 3px;
  z-index: 5;
  border-radius: 9px;
  border: 1px solid transparent;
  padding: 6px 8px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05);
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
  min-height: 460px;
}

.month-day-cell {
  min-height: 90px;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid var(--wo-border-subtle, #f0f2f5);
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
  padding: 6px;
}

body.body--dark {
  .cal-cell,
  .month-day-cell {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
}
</style>
