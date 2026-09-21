<template>
  <q-page class="pm-page schedule-page">
    <!-- 1. PAGE HEADER -->
    <div class="page-header-row">
      <div class="header-left">
        <div class="page-title">Schedule</div>
        <div class="page-subtitle">
          Plan and track your team's work across projects and milestones
        </div>
      </div>

      <div class="header-actions row items-center q-gutter-sm">
        <!-- View Toggle Buttons: Card, Gantt, List -->
        <q-btn-toggle
          v-model="mainViewMode"
          toggle-color="primary"
          toggle-text-color="white"
          :color="$q.dark.isActive ? 'grey-9' : 'white'"
          :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
          dense
          unelevated
          class="view-toggle-btn shadow-subtle q-mr-xs"
          :options="[
            { label: 'Card', value: 'card', icon: 'grid_view' },
            { label: 'Gantt', value: 'gantt', icon: 'timeline' },
            { label: 'List', value: 'table', icon: 'table_rows' },
          ]"
        />

        <q-btn
          unelevated
          no-caps
          icon="add_task"
          label="New Task"
          class="action-btn-primary"
          @click="openCreateTaskDialog"
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
      <q-card flat bordered class="stat-card cursor-pointer" @click="filterAllTasks">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-purple">
            <q-icon name="event_note" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Scheduled Tasks</div>
            <div class="stat-value">{{ tasks.length }}</div>
            <div class="stat-note stat-purple-text">Across all projects</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card cursor-pointer" @click="filterInProgressTasks">
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

      <q-card flat bordered class="stat-card cursor-pointer" @click="filterCompletedTasks">
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

      <q-card flat bordered class="stat-card cursor-pointer" @click="filterOverdueTasks">
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
        <!-- Date Navigation Controls & Card Subview Selector -->
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
          <div class="current-range-label q-mx-sm">
            {{ formattedDateRangeHeader }}
          </div>

          <!-- Card Subview Selector (Visible under Card view): Week | Day | Month -->
          <div
            v-if="mainViewMode === 'card'"
            class="scale-toggle-group row items-center no-wrap q-ml-xs"
            :class="{ 'is-dark': $q.dark.isActive }"
          >
            <button
              type="button"
              class="scale-btn"
              :class="{ active: cardSubMode === 'week' }"
              @click="cardSubMode = 'week'"
            >
              Week
            </button>
            <button
              type="button"
              class="scale-btn"
              :class="{ active: cardSubMode === 'day' }"
              @click="cardSubMode = 'day'"
            >
              Day
            </button>
            <button
              type="button"
              class="scale-btn"
              :class="{ active: cardSubMode === 'month' }"
              @click="cardSubMode = 'month'"
            >
              Month
            </button>
          </div>
        </div>

        <!-- Filter Selects -->
        <div class="filter-controls-row row items-center gap-xs">
          <q-input
            v-model="searchQuery"
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
            v-model="assigneeFilter"
            outlined
            dense
            emit-value
            map-options
            :options="assigneeFilterOptions"
            label="Assignee"
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
            :class="{
              'is-today-col': isSameDay(day, todayDate),
              'is-weekend-col': isDayNonWorking(day),
              'is-non-working-col': isDayNonWorking(day),
            }"
          >
            <!-- Date Column Header -->
            <div class="date-col-header">
              <div class="col-weekday-name">{{ formatWeekdayName(day) }}</div>
              <div class="col-day-badge" :class="{ 'today-day-badge': isSameDay(day, todayDate) }">
                {{ day.getDate() }}
              </div>
              <div v-if="isSameDay(day, todayDate)" class="today-tag-pill">TODAY</div>
            </div>

            <!-- Tasks Container for this Day -->
            <div class="day-tasks-list q-pa-sm q-gutter-y-sm">
              <template v-if="getTasksOnDate(day).length > 0">
                <div
                  v-for="task in getTasksOnDate(day)"
                  :key="task.task_id"
                  class="calendar-day-task-card cursor-pointer"
                  :style="getTaskCardStyle(task)"
                  @click="openTaskDetailsDialog(task)"
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

                  <!-- Bottom Row: Avatars & Progress -->
                  <div class="block-bottom-row row items-center justify-between no-wrap q-mt-xs">
                    <!-- Assignee Avatars -->
                    <div class="row items-center avatar-mini-stack">
                      <template
                        v-if="task.assigned_resource_ids && task.assigned_resource_ids.length > 0"
                      >
                        <q-avatar
                          v-for="rId in task.assigned_resource_ids.slice(0, 2)"
                          :key="rId"
                          size="18px"
                          class="mini-avatar"
                        >
                          <span>{{ getResourceName(rId).charAt(0).toUpperCase() }}</span>
                          <q-tooltip>{{ getResourceName(rId) }}</q-tooltip>
                        </q-avatar>
                        <q-avatar
                          v-if="task.assigned_resource_ids.length > 2"
                          size="18px"
                          class="mini-avatar mini-more"
                        >
                          <span>+{{ task.assigned_resource_ids.length - 2 }}</span>
                        </q-avatar>
                      </template>
                      <span v-else class="unassigned-text">Unassigned</span>
                    </div>

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
              <span class="m-day-number">{{ mDay.date.getDate() }}</span>
              <span v-if="isSameDay(mDay.date, todayDate)" class="today-badge-micro">TODAY</span>
            </div>

            <!-- Tasks on this month day -->
            <div class="month-day-tasks-list">
              <div
                v-for="task in getTasksOnDate(mDay.date)"
                :key="task.task_id"
                class="month-task-pill cursor-pointer ellipsis"
                :style="getMonthTaskPillStyle(task)"
                :title="`${task.title} (${getProjectName(task.project_id)})`"
                @click.stop="openTaskDetailsDialog(task)"
              >
                <span class="pill-dot" />
                <span class="pill-text">{{ task.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- 6. GANTT ROADMAP VIEW (POWERED BY DHTMLX GANTT) -->
    <div v-else-if="scheduleViewMode === 'gantt'" class="q-mb-lg">
      <DhtmlxGanttTimeline
        :tasks="filteredTasks"
        :projects="projects"
        :resources="resources"
        :holidays="holidays"
        :availability="pmAvailabilityList"
        :global-leaves="globalLeavesList"
        :is-resource-view="assigneeFilter !== 'ALL' || pmAvailabilityList.length > 0"
        title="Gantt Timeline Roadmap"
        @task-click="openTaskDetailsDialog"
      />
    </div>

    <!-- 7. DETAILED BREAKDOWN TABLE (List View) -->
    <q-card
      v-else-if="scheduleViewMode === 'table'"
      flat
      bordered
      :dark="$q.dark.isActive"
      class="table-card"
    >
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <div
            class="text-subtitle1 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Schedule Breakdown
          </div>
          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Detailed timeline records for all {{ filteredTasks.length }} tasks
          </div>
        </div>

        <q-chip dense square class="project-badge text-weight-bold">
          {{ filteredTasks.length }} Tasks
        </q-chip>
      </q-card-section>

      <q-table
        flat
        :dark="$q.dark.isActive"
        :rows="filteredTasks"
        :columns="tableColumns"
        row-key="task_id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        class="schedule-table"
      >
        <template #body-cell-title="props">
          <q-td :props="props">
            <div class="task-title-cell cursor-pointer" @click="openTaskDetailsDialog(props.row)">
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

        <template #body-cell-assignees="props">
          <q-td :props="props">
            <div
              v-if="props.row.assigned_resource_ids && props.row.assigned_resource_ids.length > 0"
              class="row q-gutter-xs wrap"
            >
              <q-chip
                v-for="rId in props.row.assigned_resource_ids"
                :key="rId"
                dense
                square
                class="resource-chip"
              >
                <q-avatar size="16px" class="avatar-purple q-mr-xs">
                  {{ getResourceName(rId).charAt(0).toUpperCase() }}
                </q-avatar>
                {{ getResourceName(rId) }}
              </q-chip>
            </div>
            <span v-else class="text-caption text-grey-5">Unassigned</span>
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
              <div class="row justify-between progress-label-row">
                <span class="text-weight-bold">{{ Number(props.row.progress) || 0 }}%</span>
                <span v-if="isTaskOverdue(props.row)" class="text-negative text-weight-medium"
                  >Overdue</span
                >
              </div>
              <q-linear-progress
                rounded
                size="6px"
                :value="(Number(props.row.progress) || 0) / 100"
                :color="
                  isTaskOverdue(props.row)
                    ? 'negative'
                    : props.row.status === 'COMPLETED'
                      ? 'positive'
                      : 'primary'
                "
                track-color="grey-3"
              />
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <div class="row items-center justify-center q-gutter-xs no-wrap">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                color="primary"
                @click="openTaskDetailsDialog(props.row)"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" color="grey-7" @click="openEditModal(props.row)">
                <q-tooltip>Edit Task</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
    <!-- 8. TASK DETAILS POPUP DIALOG -->
    <TaskDetailsDialog
      v-model="showTaskDetailsDialog"
      :task="selectedTaskDetails"
      :project-name="selectedTaskDetails ? getProjectName(selectedTaskDetails.project_id) : ''"
      :resource-names-map="resourceNamesMap"
      :allow-unassign="false"
      :allow-assign-member="true"
      :allow-add-dependency="false"
      :show-dependencies="true"
      @edit="openEditFromDetails"
      @assign-member="openAssignTaskMemberDialog"
      @assign-verification="openAssignVerificationFromDetails"
    />

    <!-- ASSIGN VERIFICATION DIALOG -->
    <AssignVerificationDialog
      v-model="showAssignVerificationDialog"
      :task="verificationTargetTask"
      :project-members="resources"
      @saved="loadData"
    />

    <!-- ASSIGN MEMBER DIALOG -->
    <q-dialog v-model="showAssignTaskMemberDialog">
      <q-card :dark="$q.dark.isActive" style="width: 100%; max-width: 460px" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">Assign Member / Supervisor to Task</div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignTaskMember">
          <q-card-section class="column q-gutter-md">
            <q-select
              v-model="assignTaskMemberForm.task_id"
              outlined
              dense
              :dark="$q.dark.isActive"
              label="Select Task"
              :options="taskSelectOptions"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Task is required']"
            />

            <q-select
              v-model="assignTaskMemberForm.user_ids"
              outlined
              dense
              multiple
              clearable
              :dark="$q.dark.isActive"
              :display-value="
                assignTaskMemberForm.user_ids.length
                  ? `${assignTaskMemberForm.user_ids.length} selected`
                  : ''
              "
              label="Assign Member(s)"
              :options="resourceMemberSelectOptions"
              emit-value
              map-options
              hint="Assign resources who will execute this deliverable"
            />

            <q-select
              v-model="assignTaskMemberForm.supervisor_id"
              outlined
              dense
              clearable
              :dark="$q.dark.isActive"
              label="Supervisor / Reviewer (Optional)"
              :options="assignSupervisorSelectOptions"
              emit-value
              map-options
              hint="Designate an experienced resource to oversee deliverables (+20% effort overhead)"
            >
              <template #prepend>
                <q-icon name="verified_user" color="amber-9" />
              </template>
            </q-select>

            <!-- Deadline (Required when at least one member is assigned) -->
            <q-input
              v-if="assignTaskMemberForm.user_ids && assignTaskMemberForm.user_ids.length > 0"
              v-model="assignTaskMemberForm.deadline"
              outlined
              dense
              mask="####-##-##"
              label="Deliverable Target Deadline *"
              stack-label
              hint="Set target deliverable deadline for assigned members"
              :dark="$q.dark.isActive"
              :rules="[
                (val) => !!val || 'Deadline is required when assigning members',
                (val) => {
                  if (!val || !currentAssignTaskProject?.start_date) return true;
                  const pStart = String(currentAssignTaskProject.start_date).split('T')[0] || '';
                  return (
                    !pStart ||
                    val >= pStart ||
                    `Deadline cannot be earlier than project start date (${pStart})`
                  );
                },
                (val) => {
                  if (!val || !currentAssignTaskProject?.deadline) return true;
                  const pDeadline = String(currentAssignTaskProject.deadline).split('T')[0] || '';
                  return (
                    !pDeadline ||
                    val <= pDeadline ||
                    `Deadline cannot be later than project deadline (${pDeadline})`
                  );
                },
              ]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer text-primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="assignTaskMemberForm.deadline"
                      mask="YYYY-MM-DD"
                      :dark="$q.dark.isActive"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Save Assignments"
              :loading="submittingTaskMember"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 9. CREATE TASK MODAL -->
    <CreateTaskDialog
      v-model="showCreateDialog"
      dialog-title="Schedule New Task"
      :initial-project-id="projectFilter !== 'ALL' ? Number(projectFilter) : undefined"
      :projects="projectSelectOptions"
      :member-options="createMemberOptions"
      :supervisor-options="createMemberOptions"
      :predecessor-options="createPredecessorOptions"
      :show-assignees="true"
      :show-dependencies="true"
      :loading="submitting"
      @submit="handleCreateTask"
      @project-change="handleCreateProjectChange"
    />

    <!-- 10. EDIT TASK MODAL -->
    <q-dialog v-model="showEditDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div
            class="text-subtitle1 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Update Task: {{ editingTaskTitle }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleUpdateTask">
          <q-card-section class="q-gutter-y-md q-pt-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="editForm.title"
                  outlined
                  dense
                  label="Task Title"
                  :rules="[(val) => !!val?.trim() || 'Title is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="editForm.description"
                  outlined
                  dense
                  type="textarea"
                  rows="3"
                  label="Description"
                  hint="Optional details about this task"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="editForm.status"
                  outlined
                  dense
                  label="Status"
                  :options="['UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']"
                  @update:model-value="onEditStatusChange"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="editForm.priority"
                  outlined
                  dense
                  label="Priority"
                  :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="editForm.supervisor_id"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  label="Supervisor / Reviewer"
                  :options="editSupervisorOptions"
                  :dark="$q.dark.isActive"
                  hint="Designate an experienced resource to supervise and review deliverables (20% effort overhead)"
                >
                  <template #prepend>
                    <q-icon name="verified_user" color="amber-9" />
                  </template>
                </q-select>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model.number="editForm.progress"
                  outlined
                  dense
                  type="number"
                  min="0"
                  max="100"
                  label="Progress (%)"
                  @update:model-value="onEditProgressChange"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="editForm.expected_effort"
                  outlined
                  dense
                  type="number"
                  label="Effort (Hours)"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="editForm.deadline"
                  outlined
                  dense
                  mask="####-##-##"
                  label="Deadline"
                  stack-label
                  :dark="$q.dark.isActive"
                  :rules="[
                    (val) => {
                      if (!val || !editingTaskProject?.start_date) return true;
                      const pStart = String(editingTaskProject.start_date).split('T')[0] || '';
                      return (
                        !pStart ||
                        val >= pStart ||
                        `Deadline cannot be earlier than project start date (${pStart})`
                      );
                    },
                    (val) => {
                      if (!val || !editingTaskProject?.deadline) return true;
                      const pDeadline = String(editingTaskProject.deadline).split('T')[0] || '';
                      return (
                        !pDeadline ||
                        val <= pDeadline ||
                        `Deadline cannot be later than project deadline (${pDeadline})`
                      );
                    },
                  ]"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer text-primary">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="editForm.deadline"
                          mask="YYYY-MM-DD"
                          :dark="$q.dark.isActive"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn
              v-close-popup
              flat
              no-caps
              label="Cancel"
              color="grey-7"
              class="text-weight-medium"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Save Changes"
              class="action-btn-primary"
              :loading="submitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import DhtmlxGanttTimeline from '@/components/gantt/DhtmlxGanttTimeline.vue';
import TaskDetailsDialog from '@/components/tasks/TaskDetailsDialog.vue';
import AssignVerificationDialog from '@/components/tasks/AssignVerificationDialog.vue';
import CreateTaskDialog, { type CreateTaskFormData } from '@/components/tasks/CreateTaskDialog.vue';
import { formatDate, formatStatus } from '@/utils/formatters';
import {
  isTaskOverdue,
  getTaskStatusClass,
  getPriorityClass,
  getStatusFromProgress,
  isVerificationTask,
} from '@/utils/taskHelpers';
import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  getHolidaysApi,
  createTaskApi,
  addTaskDependencyApi,
  updateTaskApi,
  assignTaskResourceApi,
  getProjectScheduleDataApi,
  getResourceScheduleDataApi,
  getResourceAvailabilityApi,
  getResourceWorkScheduleApi,
  getApprovedLeavesApi,
} from '@/services/api';
import type {
  Project,
  Task,
  TaskPriority,
  ResourceUser,
  HolidayItem,
  DailyAvailabilityDTO,
  ResourceScheduleConfig,
  DayOfWeek,
  LeaveResponseDTO,
} from '@/services/api';

const $q = useQuasar();

const loading = ref(true);
const holidays = ref<HolidayItem[]>([]);
const pmAvailabilityList = ref<DailyAvailabilityDTO[]>([]);
const globalLeavesList = ref<LeaveResponseDTO[]>([]);
type MainViewMode = 'card' | 'gantt' | 'table';
type CardSubMode = 'week' | 'day' | 'month';
type ScheduleViewMode = 'week' | 'day' | 'month' | 'gantt' | 'table';

const STORAGE_KEY_MAIN_VIEW = 'taskflow_pm_schedule_main_view';
const STORAGE_KEY_CARD_SUB_VIEW = 'taskflow_pm_schedule_card_sub_view';
const STORAGE_KEY_VIEW_MODE = 'taskflow_pm_schedule_view_mode';

const legacyStoredMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
const storedMainMode = (localStorage.getItem(STORAGE_KEY_MAIN_VIEW) ||
  (legacyStoredMode === 'gantt' || legacyStoredMode === 'table'
    ? legacyStoredMode
    : 'card')) as MainViewMode;
const storedCardSubMode = (localStorage.getItem(STORAGE_KEY_CARD_SUB_VIEW) ||
  (legacyStoredMode === 'day' || legacyStoredMode === 'month' || legacyStoredMode === 'week'
    ? legacyStoredMode
    : 'week')) as CardSubMode;

const mainViewMode = ref<MainViewMode>(
  ['card', 'gantt', 'table'].includes(storedMainMode) ? storedMainMode : 'card',
);
const cardSubMode = ref<CardSubMode>(
  ['week', 'day', 'month'].includes(storedCardSubMode) ? storedCardSubMode : 'week',
);

const scheduleViewMode = computed<'week' | 'day' | 'month' | 'gantt' | 'table'>({
  get: () => (mainViewMode.value === 'card' ? cardSubMode.value : mainViewMode.value),
  set: (val: ScheduleViewMode) => {
    if (val === 'gantt' || val === 'table') {
      mainViewMode.value = val;
    } else {
      mainViewMode.value = 'card';
      cardSubMode.value = val;
    }
  },
});

watch(mainViewMode, (newMode) => {
  if (newMode) {
    localStorage.setItem(STORAGE_KEY_MAIN_VIEW, newMode);
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, newMode === 'card' ? cardSubMode.value : newMode);
  }
});

watch(cardSubMode, (newSubMode) => {
  if (newSubMode) {
    localStorage.setItem(STORAGE_KEY_CARD_SUB_VIEW, newSubMode);
    if (mainViewMode.value === 'card') {
      localStorage.setItem(STORAGE_KEY_VIEW_MODE, newSubMode);
    }
  }
});
const currentAnchorDate = ref<Date>(new Date());
const todayDate = new Date();

const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);
const resources = ref<ResourceUser[]>([]);

const searchQuery = ref('');
const projectFilter = ref<number | 'ALL'>('ALL');
const assigneeFilter = ref<number | 'ALL'>('ALL');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');
const overdueOnly = ref(false);

function resetFilters() {
  searchQuery.value = '';
  projectFilter.value = 'ALL';
  assigneeFilter.value = 'ALL';
  statusFilter.value = 'ALL';
  priorityFilter.value = 'ALL';
  overdueOnly.value = false;
}

function filterAllTasks() {
  resetFilters();
}

function filterInProgressTasks() {
  resetFilters();
  statusFilter.value = 'IN_PROGRESS';
}

function filterCompletedTasks() {
  resetFilters();
  statusFilter.value = 'COMPLETED';
}

function filterOverdueTasks() {
  resetFilters();
  overdueOnly.value = true;
}

const showTaskDetailsDialog = ref(false);
const selectedTaskDetails = ref<Task | null>(null);
const showAssignVerificationDialog = ref(false);
const verificationTargetTask = ref<Task | null>(null);

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingTaskId = ref<number | null>(null);
const editingTaskTitle = computed(() => {
  if (!editingTaskId.value) return '';
  const t = tasks.value.find((task) => Number(task.task_id) === Number(editingTaskId.value));
  return t ? t.title : `Task #${editingTaskId.value}`;
});
const submitting = ref(false);

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

const selectedResourceSchedule = ref<ResourceScheduleConfig | null>(null);

const DAY_INDEX_TO_WEEKDAY: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

function parseNonWorkingDays(val: unknown): DayOfWeek[] {
  if (val === null || val === undefined) {
    return ['SATURDAY', 'SUNDAY'];
  }
  if (Array.isArray(val)) {
    return val.map((d) => String(d).toUpperCase().trim() as DayOfWeek);
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((d) => String(d).toUpperCase().trim() as DayOfWeek);
      }
    } catch {
      if (val.includes(',')) {
        return val.split(',').map((d) => d.toUpperCase().trim() as DayOfWeek);
      }
      if (val.trim()) {
        return [val.toUpperCase().trim() as DayOfWeek];
      }
    }
  }
  return ['SATURDAY', 'SUNDAY'];
}

const selectedResourceNonWorkingDays = computed<DayOfWeek[]>(() => {
  if (assigneeFilter.value === 'ALL' || assigneeFilter.value === -1) {
    return [];
  }

  const selectedId = Number(assigneeFilter.value);

  // 1. If we have fetched detailed schedule config for this resource
  if (
    selectedResourceSchedule.value &&
    selectedResourceSchedule.value.user_id === selectedId &&
    Array.isArray(selectedResourceSchedule.value.non_working_days)
  ) {
    return selectedResourceSchedule.value.non_working_days.map(
      (d) => String(d).toUpperCase().trim() as DayOfWeek,
    );
  }

  // 2. Check resource in resources.value
  const res = resources.value.find((r) => r.user_id === selectedId);
  if (res && res.non_working_days !== undefined && res.non_working_days !== null) {
    return parseNonWorkingDays(res.non_working_days);
  }

  return ['SATURDAY', 'SUNDAY'];
});

function isDayNonWorking(d: Date): boolean {
  if (assigneeFilter.value === 'ALL' || assigneeFilter.value === -1) {
    return false;
  }

  const dayName = DAY_INDEX_TO_WEEKDAY[d.getDay()];
  if (!dayName) return false;

  return selectedResourceNonWorkingDays.value.includes(dayName);
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
    // Week or others: shift by 7 days
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

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTasksOnDate(date: Date): Task[] {
  const targetDateStr = formatLocalDate(date);
  return filteredTasks.value.filter((t) => {
    if (t.schedules && t.schedules.length > 0) {
      return t.schedules.some(
        (s) =>
          String(s.schedule_date).slice(0, 10) === targetDateStr && Number(s.allocated_hours) > 0,
      );
    }
    if (isDayNonWorking(date)) {
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

// ----------------------------------------------------
// Filter Options & Data Loading
// ----------------------------------------------------
const statusFilterOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Unassigned', value: 'UNASSIGNED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const priorityFilterOptions = [
  { label: 'All Priorities', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const projectFilterOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: string | number }> = [
    { label: 'All Projects', value: 'ALL' },
  ];
  for (const p of projects.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: p.name, value: id });
    }
  }
  return opts;
});

const projectSelectOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{
    label: string;
    value: number;
    start_date?: string | null;
    deadline?: string | null;
  }> = [];
  for (const p of projects.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({
        label: p.name,
        value: id,
        start_date: p.start_date,
        deadline: p.deadline,
      });
    }
  }
  return opts;
});

const editingTaskProject = computed(() => {
  if (!editingTaskId.value) return null;
  const t = tasks.value.find((item) => Number(item.task_id) === Number(editingTaskId.value));
  if (!t) return null;
  return projects.value.find((p) => Number(p.project_id) === Number(t.project_id)) || null;
});

const assigneeFilterOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: string | number }> = [
    { label: 'All Assignees', value: 'ALL' },
  ];
  for (const r of resources.value) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: r.name, value: id });
    }
  }
  return opts;
});

const resourceNamesMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const r of resources.value) {
    map[r.user_id] = r.name;
  }
  return map;
});

function getResourceName(id: number): string {
  return resourceNamesMap.value[id] || `Resource #${id}`;
}

const tableColumns: QTableColumn<Task>[] = [
  {
    name: 'title',
    label: 'Task Title',
    field: (t) => t.title,
    align: 'left',
  },
  { name: 'project', label: 'Project', field: (t) => t.project_id, align: 'left' },
  { name: 'assignees', label: 'Assigned Members', field: () => '', align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'dates', label: 'Start & Deadline', field: () => '', align: 'left' },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

async function loadData() {
  loading.value = true;
  try {
    const [tList, pList, rList, hList, lRes] = await Promise.all([
      projectFilter.value !== 'ALL'
        ? getProjectScheduleDataApi(Number(projectFilter.value))
            .then((res) => res.tasks)
            .catch(() => getTasksApi(Number(projectFilter.value)))
        : getTasksApi(),
      getProjectsApi(),
      getResourcesApi(),
      getHolidaysApi().catch(() => []),
      getApprovedLeavesApi().catch(() => []),
    ]);
    tasks.value = (tList || []).filter((t: Task) => !isVerificationTask(t));
    projects.value = pList;
    resources.value = rList;
    holidays.value = hList;
    if (lRes && Array.isArray(lRes)) {
      globalLeavesList.value = lRes;
    }
    if (pList.length > 0 && pList[0]) {
      createForm.project_id = pList[0].project_id;
    }
  } catch (error) {
    console.error('Failed to fetch schedule data:', error);
  } finally {
    loading.value = false;
  }
}

watch([projectFilter, assigneeFilter], async ([newProj, newAssignee]) => {
  if (newAssignee !== 'ALL' && newAssignee !== -1) {
    const selectedId = Number(newAssignee);
    const localRes = resources.value.find((r) => r.user_id === selectedId);
    if (localRes && localRes.non_working_days !== undefined && localRes.non_working_days !== null) {
      selectedResourceSchedule.value = {
        user_id: selectedId,
        non_working_days: parseNonWorkingDays(localRes.non_working_days),
        working_days: [],
        daily_working_hours: localRes.daily_working_hours || 8,
        is_custom: Boolean(localRes.schedule_configured),
      };
    } else {
      selectedResourceSchedule.value = null;
    }

    try {
      const [resSchedule, availRes, scheduleConfig] = await Promise.all([
        getResourceScheduleDataApi(selectedId).catch(() => null),
        getResourceAvailabilityApi(selectedId).catch(() => null),
        getResourceWorkScheduleApi(selectedId).catch(() => null),
      ]);
      if (resSchedule && resSchedule.tasks) {
        tasks.value = (resSchedule.tasks || []).filter((t) => !isVerificationTask(t));
      }
      if (availRes && availRes.days) {
        pmAvailabilityList.value = availRes.days;
      } else {
        pmAvailabilityList.value = [];
      }
      if (scheduleConfig && Array.isArray(scheduleConfig.non_working_days)) {
        selectedResourceSchedule.value = scheduleConfig;
        if (localRes) {
          localRes.non_working_days = scheduleConfig.non_working_days;
        }
      }
      return;
    } catch {
      pmAvailabilityList.value = [];
    }
  } else {
    pmAvailabilityList.value = [];
    selectedResourceSchedule.value = null;
  }

  if (newProj !== 'ALL') {
    try {
      const scheduleRes = await getProjectScheduleDataApi(Number(newProj));
      if (scheduleRes && scheduleRes.tasks) {
        tasks.value = (scheduleRes.tasks || []).filter((t) => !isVerificationTask(t));
      }
    } catch {
      const fallbackTasks = await getTasksApi(Number(newProj)).catch(() => tasks.value);
      tasks.value = (fallbackTasks || []).filter((t) => !isVerificationTask(t));
    }
  } else {
    const allT = await getTasksApi().catch(() => tasks.value);
    tasks.value = (allT || []).filter((t) => !isVerificationTask(t));
  }
});

function onHolidaysUpdated() {
  void loadData();
}

onMounted(() => {
  void loadData();
  window.addEventListener('holidays-updated', onHolidaysUpdated);
});

onUnmounted(() => {
  window.removeEventListener('holidays-updated', onHolidaysUpdated);
});

const inProgressCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);

const completedCount = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);

const overdueCount = computed(() => tasks.value.filter((t) => isTaskOverdue(t)).length);

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    const q = (searchQuery.value || '').trim().toLowerCase();
    const pName = getProjectName(t.project_id).toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      pName.includes(q) ||
      (t.description && t.description.toLowerCase().includes(q));

    const matchesProject = projectFilter.value === 'ALL' || t.project_id === projectFilter.value;
    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'ALL' || t.priority === priorityFilter.value;

    const matchesAssignee =
      assigneeFilter.value === 'ALL' ||
      (t.assigned_resource_ids && t.assigned_resource_ids.includes(Number(assigneeFilter.value)));

    const matchesOverdue = !overdueOnly.value || isTaskOverdue(t);

    return (
      matchesSearch &&
      matchesProject &&
      matchesStatus &&
      matchesPriority &&
      matchesAssignee &&
      matchesOverdue
    );
  });
});

function getProjectName(projectId: number): string {
  const p = projects.value.find((proj) => proj.project_id === projectId);
  return p ? p.name : `Project #${projectId}`;
}

// ----------------------------------------------------
// Details Modal, Create & Edit Handlers
// ----------------------------------------------------
function openTaskDetailsDialog(task: Task) {
  if (task.is_external) {
    $q.notify({
      type: 'info',
      icon: 'lock',
      message:
        'This task belongs to another project not managed by you. Detailed information is private.',
    });
    return;
  }
  selectedTaskDetails.value = task;
  showTaskDetailsDialog.value = true;
}

function openEditFromDetails() {
  if (selectedTaskDetails.value) {
    const t = selectedTaskDetails.value;
    showTaskDetailsDialog.value = false;
    openEditModal(t);
  }
}

function openAssignVerification(task: Task) {
  verificationTargetTask.value = task;
  showAssignVerificationDialog.value = true;
}

function openAssignVerificationFromDetails(task: Task) {
  showTaskDetailsDialog.value = false;
  openAssignVerification(task);
}

const createProjectMembers = ref<ResourceUser[]>([]);

const createMemberOptions = computed(() => {
  const source = resources.value;
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];
  for (const r of source) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({
        label: r.name,
        value: id,
      });
    }
  }
  return opts;
});

const createPredecessorOptions = computed(() => {
  const activePid =
    createForm.project_id ||
    (projectFilter.value !== 'ALL' ? Number(projectFilter.value) : null) ||
    (projects.value.length > 0 ? (projects.value[0]?.project_id ?? null) : null);
  if (!activePid) return [];
  return tasks.value
    .filter((t) => t.project_id === activePid)
    .map((t) => ({
      label: `${t.title} (#${t.task_id})`,
      value: t.task_id,
    }));
});

async function handleCreateProjectChange(newProjectId: number | null) {
  createForm.project_id = newProjectId;
  if (newProjectId) {
    const members = await getResourcesApi(newProjectId).catch(() => []);
    createProjectMembers.value = members;
  } else {
    createProjectMembers.value = [];
  }
}

const createForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | undefined;
  expected_effort: number;
  deadline: string;
  assigned_resource_ids?: number[];
  supervisor_id?: number | null | undefined;
  predecessor_task_ids?: number[];
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: undefined,
  expected_effort: 8,
  deadline: '',
  assigned_resource_ids: [],
  supervisor_id: null,
  predecessor_task_ids: [],
});

const taskSelectOptions = computed(() => {
  return tasks.value.map((t) => ({
    label: `${t.title} (#${t.task_id})`,
    value: t.task_id,
  }));
});

const showAssignTaskMemberDialog = ref(false);
const submittingTaskMember = ref(false);

const assignTaskMemberForm = reactive({
  task_id: null as number | null,
  user_ids: [] as number[],
  supervisor_id: null as number | null,
  deadline: '',
});

const currentAssignTaskProject = computed(() => {
  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  if (!currentTask) return null;
  return (
    projects.value.find((p) => Number(p.project_id) === Number(currentTask.project_id)) || null
  );
});

const resourceMemberSelectOptions = computed(() => {
  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];
  const chosenSupId = assignTaskMemberForm.supervisor_id;

  const seen = new Set<number>();
  const opts: Array<{
    label: string;
    value: number;
    alreadyAssigned: boolean;
    disable: boolean;
  }> = [];

  for (const r of resources.value) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      const isAssigned = alreadyAssignedIds.includes(id);
      const isChosenSupervisor = chosenSupId ? Number(id) === Number(chosenSupId) : false;
      opts.push({
        label: r.name + (isChosenSupervisor ? ' (Designated Supervisor)' : ''),
        value: id,
        alreadyAssigned: isAssigned,
        disable: isAssigned || isChosenSupervisor,
      });
    }
  }

  return opts;
});

const assignSupervisorSelectOptions = computed(() => {
  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];
  const selectedUserIds = assignTaskMemberForm.user_ids || [];

  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];

  for (const r of resources.value) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      if (!alreadyAssignedIds.includes(id) && !selectedUserIds.includes(id)) {
        opts.push({
          label: r.name,
          value: id,
        });
      }
    }
  }

  return opts;
});

function openAssignTaskMemberDialog(taskId: number | null) {
  const selectedId = taskId || (tasks.value[0]?.task_id ?? null);
  assignTaskMemberForm.task_id = selectedId;
  assignTaskMemberForm.user_ids = [];
  const currentTask = tasks.value.find((t) => t.task_id === selectedId);
  assignTaskMemberForm.supervisor_id = currentTask?.supervisor_id
    ? Number(currentTask.supervisor_id)
    : null;
  assignTaskMemberForm.deadline = currentTask?.deadline
    ? (currentTask.deadline.split('T')[0] ?? '')
    : '';
  showAssignTaskMemberDialog.value = true;
}

async function handleAssignTaskMember() {
  if (!assignTaskMemberForm.task_id) return;
  const currentTaskId = assignTaskMemberForm.task_id;
  const currentTask = tasks.value.find((t) => t.task_id === currentTaskId);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];
  const toAssignIds = (assignTaskMemberForm.user_ids || []).filter(
    (id) => !alreadyAssignedIds.includes(id),
  );

  const origSupId = currentTask?.supervisor_id ? Number(currentTask.supervisor_id) : null;
  const newSupId = assignTaskMemberForm.supervisor_id
    ? Number(assignTaskMemberForm.supervisor_id)
    : null;
  const supervisorChanged = origSupId !== newSupId;

  const origDeadline = currentTask?.deadline ? (currentTask.deadline.split('T')[0] ?? '') : '';
  const newDeadline =
    assignTaskMemberForm.user_ids.length > 0 ? assignTaskMemberForm.deadline || '' : '';
  const deadlineChanged = origDeadline !== newDeadline;

  if (assignTaskMemberForm.user_ids.length > 0 && !assignTaskMemberForm.deadline) {
    $q.notify({
      type: 'warning',
      message: 'Deadline is required when assigning team members',
    });
    return;
  }

  if (toAssignIds.length === 0 && !supervisorChanged && !deadlineChanged) {
    $q.notify({
      type: 'info',
      message: 'No changes made to task assignment, supervisor, or deadline',
    });
    showAssignTaskMemberDialog.value = false;
    return;
  }

  submittingTaskMember.value = true;
  try {
    for (const userId of toAssignIds) {
      await assignTaskResourceApi(currentTaskId, userId);
    }

    if (supervisorChanged || deadlineChanged) {
      const updatePayload: Record<string, unknown> = {};
      if (supervisorChanged) updatePayload.supervisor_id = newSupId;
      if (deadlineChanged) updatePayload.deadline = newDeadline || null;
      await updateTaskApi(currentTaskId, updatePayload);
    }

    $q.notify({
      type: 'positive',
      message: 'Task assignments and deliverable details saved successfully',
    });
    showAssignTaskMemberDialog.value = false;
    assignTaskMemberForm.user_ids = [];
    assignTaskMemberForm.deadline = '';
    void loadData();
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === currentTaskId) {
      const updated = tasks.value.find((t) => t.task_id === currentTaskId);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update task assignments';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submittingTaskMember.value = false;
  }
}

const editSupervisorOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];

  const editingTask = tasks.value.find(
    (task) => Number(task.task_id) === Number(editingTaskId.value),
  );
  const assignedIds = editingTask?.assigned_resource_ids || [];

  for (const r of resources.value) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      if (!assignedIds.includes(id)) {
        opts.push({ label: r.name, value: id });
      }
    }
  }

  return opts;
});

const editForm = reactive<{
  title: string;
  description: string;
  status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  priority: TaskPriority;
  progress: number;
  expected_effort: number;
  deadline: string;
  supervisor_id: number | null;
}>({
  title: '',
  description: '',
  status: 'UNASSIGNED',
  priority: 'MEDIUM',
  progress: 0,
  expected_effort: 8,
  deadline: '',
  supervisor_id: null,
});

async function openCreateTaskDialog() {
  createForm.title = '';
  createForm.description = '';
  createForm.priority = 'MEDIUM';
  createForm.status = undefined;
  createForm.deadline = '';
  createForm.assigned_resource_ids = [];
  createForm.supervisor_id = null;
  createForm.predecessor_task_ids = [];
  const initialPid =
    projectFilter.value !== 'ALL'
      ? Number(projectFilter.value)
      : projects.value.length > 0
        ? (projects.value[0]?.project_id ?? null)
        : null;
  createForm.project_id = initialPid;
  await handleCreateProjectChange(initialPid);
  showCreateDialog.value = true;
}

async function handleCreateTask(formData?: CreateTaskFormData) {
  const data = formData || createForm;
  if (!data.project_id || !data.title.trim()) return;

  submitting.value = true;
  try {
    const newTask = await createTaskApi({
      project_id: data.project_id,
      title: data.title.trim(),
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      expected_effort: Number(data.expected_effort) || 8,
      deadline: data.deadline || null,
      assigned_resource_ids: data.assigned_resource_ids,
      supervisor_id: data.supervisor_id || undefined,
    });

    const newTaskId = newTask?.task_id;
    let depErrors = 0;

    if (newTaskId && data.predecessor_task_ids && data.predecessor_task_ids.length > 0) {
      for (const predId of data.predecessor_task_ids) {
        try {
          await addTaskDependencyApi(newTaskId, predId);
        } catch {
          depErrors++;
        }
      }
    }

    if (depErrors > 0) {
      $q.notify({
        type: 'warning',
        message: `Task scheduled, but ${depErrors} dependency/dependencies could not be linked`,
      });
    } else {
      $q.notify({
        type: 'positive',
        message: 'Task scheduled successfully',
      });
    }

    showCreateDialog.value = false;
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to schedule task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submitting.value = false;
  }
}

function openEditModal(task: Task) {
  editingTaskId.value = task.task_id;
  editForm.title = task.title;
  editForm.description = task.description ?? '';
  editForm.status = task.status;
  editForm.priority = task.priority;
  editForm.progress = Number(task.progress) || 0;
  editForm.expected_effort = Number(task.expected_effort) || 8;
  editForm.deadline = task.deadline?.split('T')[0] ?? '';
  editForm.supervisor_id = task.supervisor_id ? Number(task.supervisor_id) : null;
  showEditDialog.value = true;
}

function onEditProgressChange(val: number | string | null) {
  const num = Math.min(100, Math.max(0, Number(val) || 0));
  editForm.status = getStatusFromProgress(num);
}

function onEditStatusChange(newStatus: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
  if (newStatus === 'COMPLETED') {
    editForm.progress = 100;
  } else if (newStatus === 'SCHEDULED' || newStatus === 'UNASSIGNED') {
    editForm.progress = 0;
  } else if (newStatus === 'IN_PROGRESS') {
    if (editForm.progress <= 0 || editForm.progress >= 100) {
      editForm.progress = 10;
    }
  }
}

async function handleUpdateTask() {
  if (!editingTaskId.value || !editForm.title.trim()) return;

  submitting.value = true;
  try {
    await updateTaskApi(editingTaskId.value, {
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      status: editForm.status,
      priority: editForm.priority,
      progress: Number(editForm.progress) || 0,
      expected_effort: Number(editForm.expected_effort) || 8,
      deadline: editForm.deadline || null,
      supervisor_id: editForm.supervisor_id ?? null,
    });

    $q.notify({
      type: 'positive',
      message: 'Task schedule updated successfully',
    });

    showEditDialog.value = false;
    void loadData();
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === editingTaskId.value) {
      const updated = tasks.value.find((t) => t.task_id === editingTaskId.value);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.schedule-page {
  padding: 20px 28px 36px;
  background: var(--wo-bg-page, #f8f9fa);
  min-height: 100vh;

  @media (max-width: 600px) {
    padding: 12px 12px 24px;
  }
}

.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    .header-actions {
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
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

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 8px;
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
    font-size: 14.5px;
    font-weight: 700;
    color: var(--wo-text-main, #1e293b);
  }

  /* Segmented Scale Toggle under Card view */
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
        background: var(--wo-primary, #7c3aed);
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);
      }

      &:hover:not(.active) {
        color: #1e293b;
      }
    }

    &.is-dark {
      background: #1e1e2d;
      border-color: #2d2d3f;

      .scale-btn {
        color: #94a3b8;

        &.active {
          background: var(--wo-primary, #7c3aed);
          color: #ffffff;
        }

        &:hover:not(.active) {
          color: #f1f5f9;
        }
      }
    }
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

  &.is-weekend-col,
  &.is-non-working-col {
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
    top: 4px;
    right: 6px;
    font-size: 9px;
    font-weight: 800;
    color: var(--wo-primary, #8b6fd8);
    background: rgba(139, 111, 216, 0.12);
    padding: 1px 4px;
    border-radius: 4px;
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
      background: #2563eb;
    }
    &.prio-dot-low {
      background: #64748b;
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

  .avatar-mini-stack {
    .mini-avatar {
      margin-left: -4px;
      border: 1px solid #ffffff;
      background: #8b6fd8;
      color: #ffffff;
      font-size: 9px;
      font-weight: 700;
      &:first-child {
        margin-left: 0;
      }
    }
    .mini-more {
      background: #cbd5e1;
      color: #334155;
    }
    .unassigned-text {
      font-size: 10px;
      opacity: 0.65;
    }
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

/* ===================================================
   Task Details Popup & Dialogs
   =================================================== */
.details-popup-card {
  width: 100%;
  max-width: 480px;
  min-width: 0;
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);

  .popup-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--wo-text-main, #1e293b);
  }

  .popup-description {
    font-size: 12.5px;
    color: var(--wo-text-muted, #64748b);
    line-height: 1.4;
  }

  .popup-details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .detail-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--wo-text-muted, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .detail-val {
    font-size: 13px;
    font-weight: 600;
    color: var(--wo-text-main, #1e293b);
    margin-top: 2px;
  }
}

.resources-schedule-table :deep(th) {
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

.resource-chip {
  background: var(--wo-bg-page, #f1f3f7);
  color: var(--wo-text-main, #334155);
  font-size: 11px;
  font-weight: 500;
  border-radius: 6px;
}

.avatar-purple {
  background: rgba(139, 111, 216, 0.18);
  color: #8b6fd8;
  font-weight: 700;
}

.status-chip,
.priority-chip {
  min-height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
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

body.body--dark {
  .day-column-cell.is-weekend-col,
  .day-column-cell.is-non-working-col {
    background: rgba(255, 255, 255, 0.04);
  }
}
</style>
