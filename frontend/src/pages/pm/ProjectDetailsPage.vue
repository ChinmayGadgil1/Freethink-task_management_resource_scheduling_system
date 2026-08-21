<template>
  <q-page class="project-details-page">
    <!-- BREADCRUMBS & TOP NAV -->
    <div class="breadcrumbs-container q-mb-md">
      <q-breadcrumbs active-color="primary" class="project-breadcrumbs">
        <template #separator>
          <q-icon size="14px" name="chevron_right" color="grey-5" />
        </template>
        <q-breadcrumbs-el label="Home" icon="home" to="/pm/dashboard" />
        <q-breadcrumbs-el label="Projects" icon="folder" to="/pm/projects" />
        <q-breadcrumbs-el
          :label="project.name || 'Project Details'"
          icon="folder_open"
          class="breadcrumb-current"
        />
      </q-breadcrumbs>
    </div>

    <!-- 01 HERO / PROJECT HEADER CARD -->
    <q-card flat bordered class="hero-card q-mb-lg">
      <q-card-section class="hero-content">
        <div class="hero-main">
          <!-- Top metadata row -->
          <div class="hero-badges-row">
            <q-chip
              dense
              square
              :class="['status-badge', `status-${project.status.toLowerCase()}`]"
            >
              {{ formatStatus(project.status) }}
            </q-chip>

            <q-chip dense square :class="['health-badge', `health-${projectHealth.toLowerCase()}`]">
              <q-icon
                :name="
                  projectHealth === 'ON_TRACK'
                    ? 'check_circle'
                    : projectHealth === 'AT_RISK'
                      ? 'warning'
                      : 'schedule'
                "
                size="13px"
                class="q-mr-xs"
              />
              {{ healthLabel }}
            </q-chip>

            <q-chip
              dense
              square
              :class="[
                'priority-badge',
                `priority-${(project.priority || 'MEDIUM').toLowerCase()}`,
              ]"
            >
              {{ project.priority || 'Medium' }} Priority
            </q-chip>

            <span class="project-id-tag">ID: #{{ project.project_id }}</span>
          </div>

          <!-- Project Title & Description -->
          <h1 class="hero-title">{{ project.name }}</h1>
          <p class="hero-description">
            {{
              project.description ||
              'Comprehensive project plan tracking milestones, resource allocations, and task deliverables across engineering and product teams.'
            }}
          </p>

          <!-- Quick Info Strip -->
          <div class="hero-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Project Manager</span>
              <div class="meta-value owner-val">
                <q-avatar size="22px" class="meta-avatar">
                  {{ currentPmName.charAt(0).toUpperCase() }}
                </q-avatar>
                <span>{{ currentPmName }}</span>
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">Timeline</span>
              <div class="meta-value">
                <q-icon name="calendar_today" size="14px" class="q-mr-xs text-grey-6" />
                <span
                  >{{ formatDate(project.start_date) }} — {{ formatDate(project.deadline) }}</span
                >
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">Days Remaining</span>
              <div class="meta-value" :class="{ 'text-negative font-bold': daysRemaining < 0 }">
                <q-icon
                  name="timelapse"
                  size="14px"
                  class="q-mr-xs"
                  :color="daysRemaining < 0 ? 'negative' : 'primary'"
                />
                <span>{{ daysRemainingText }}</span>
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">Team Members</span>
              <div class="team-avatars-group">
                <q-avatar
                  v-for="(member, idx) in teamMembers.slice(0, 4)"
                  :key="member.id"
                  size="26px"
                  :class="['team-stack-avatar', `avatar-color-${idx % 4}`]"
                >
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <span v-else>{{ member.name.charAt(0) }}</span>
                  <q-tooltip>{{ member.name }} ({{ member.role }})</q-tooltip>
                </q-avatar>
                <q-avatar
                  v-if="teamMembers.length > 4"
                  size="26px"
                  class="team-stack-avatar team-stack-extra"
                >
                  +{{ teamMembers.length - 4 }}
                </q-avatar>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Progress Gauge & Actions -->
        <div class="hero-sidebar">
          <div class="hero-progress-box">
            <div class="progress-box-header">
              <span class="progress-label">Overall Completion</span>
              <span class="progress-percent-val">{{ overallProgress }}%</span>
            </div>
            <q-linear-progress
              rounded
              size="10px"
              :value="overallProgress / 100"
              color="primary"
              track-color="purple-1"
              class="hero-progress-bar"
            />
            <div class="progress-sub-details">
              <span>{{ completedTasksCount }} of {{ totalTasksCount }} tasks done</span>
              <span>{{ totalEffortLogged }}h / {{ totalEffortExpected }}h effort</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="hero-actions">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="add_task"
              label="Add Task"
              class="hero-btn primary-btn"
              @click="showCreateTaskDialog = true"
            />
            <q-btn
              outline
              no-caps
              icon="edit"
              label="Edit Project"
              class="hero-btn edit-btn"
              @click="openEditDialog"
            />
            <q-btn flat round dense icon="more_vert" color="grey-7" class="hero-menu-btn">
              <q-menu auto-close>
                <q-list style="min-width: 170px">
                  <q-item clickable @click="refreshData">
                    <q-item-section avatar>
                      <q-icon name="refresh" size="18px" />
                    </q-item-section>
                    <q-item-section>Refresh Data</q-item-section>
                  </q-item>
                  <q-item clickable @click="exportProjectSummary">
                    <q-item-section avatar>
                      <q-icon name="download" size="18px" />
                    </q-item-section>
                    <q-item-section>Export Report</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="markProjectComplete">
                    <q-item-section avatar>
                      <q-icon name="task_alt" size="18px" color="positive" />
                    </q-item-section>
                    <q-item-section class="text-positive">Mark Complete</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable class="text-negative" @click="confirmDeleteProject">
                    <q-item-section avatar>
                      <q-icon name="delete" size="18px" color="negative" />
                    </q-item-section>
                    <q-item-section>Delete Project</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 02 KPI METRIC CARDS -->
    <div class="kpi-grid q-mb-lg">
      <q-card flat bordered class="kpi-card">
        <q-card-section class="kpi-section">
          <q-avatar size="46px" class="kpi-icon icon-purple">
            <q-icon name="donut_large" size="22px" />
          </q-avatar>
          <div class="kpi-content">
            <span class="kpi-label">Overall Progress</span>
            <div class="kpi-value">{{ overallProgress }}%</div>
            <span class="kpi-note note-green">
              <q-icon name="trending_up" size="12px" />
              {{ completedTasksCount }} completed
            </span>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="kpi-card">
        <q-card-section class="kpi-section">
          <q-avatar size="46px" class="kpi-icon icon-teal">
            <q-icon name="task_alt" size="22px" />
          </q-avatar>
          <div class="kpi-content">
            <span class="kpi-label">Total Tasks</span>
            <div class="kpi-value">{{ totalTasksCount }}</div>
            <span class="kpi-note note-teal"> {{ inProgressTasksCount }} in progress </span>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="kpi-card">
        <q-card-section class="kpi-section">
          <q-avatar size="46px" class="kpi-icon icon-green">
            <q-icon name="check_circle" size="22px" />
          </q-avatar>
          <div class="kpi-content">
            <span class="kpi-label">Completed Tasks</span>
            <div class="kpi-value">{{ completedTasksCount }}</div>
            <span class="kpi-note note-green"> {{ taskCompletionRate }}% done </span>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="kpi-card">
        <q-card-section class="kpi-section">
          <q-avatar size="46px" class="kpi-icon icon-red">
            <q-icon name="schedule" size="22px" />
          </q-avatar>
          <div class="kpi-content">
            <span class="kpi-label">Overdue Tasks</span>
            <div class="kpi-value" :class="{ 'text-negative': overdueTasksCount > 0 }">
              {{ overdueTasksCount }}
            </div>
            <span :class="['kpi-note', overdueTasksCount > 0 ? 'note-red' : 'note-green']">
              {{ overdueTasksCount > 0 ? 'Requires attention' : 'All on schedule' }}
            </span>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="kpi-card">
        <q-card-section class="kpi-section">
          <q-avatar size="46px" class="kpi-icon icon-orange">
            <q-icon name="groups" size="22px" />
          </q-avatar>
          <div class="kpi-content">
            <span class="kpi-label">Team Members</span>
            <div class="kpi-value">{{ teamMembers.length }}</div>
            <span class="kpi-note note-orange"> {{ activeAssigneesCount }} actively assigned </span>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="kpi-card">
        <q-card-section class="kpi-section">
          <q-avatar size="46px" class="kpi-icon icon-blue">
            <q-icon name="event_available" size="22px" />
          </q-avatar>
          <div class="kpi-content">
            <span class="kpi-label">Days Remaining</span>
            <div class="kpi-value" :class="{ 'text-negative': daysRemaining < 0 }">
              {{
                daysRemaining > 0
                  ? daysRemaining
                  : daysRemaining === 0
                    ? 'Due today'
                    : Math.abs(daysRemaining) + 'd ago'
              }}
            </div>
            <span class="kpi-note note-blue"> Due {{ formatDate(project.deadline) }} </span>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 03 & 04 TWO-COLUMN SECTION: PROGRESS & MILESTONES -->
    <div class="details-split-layout q-mb-lg">
      <!-- LEFT: PROGRESS & HEALTH DEEP-DIVE -->
      <q-card flat bordered class="detail-card progress-deep-card">
        <q-card-section class="card-header-bar">
          <div class="header-title-group">
            <q-icon name="insights" size="20px" class="text-primary q-mr-xs" />
            <h2 class="card-header-title">Progress & Effort Breakdown</h2>
          </div>
          <q-chip dense square class="status-chip-subtle">
            {{ formatStatus(project.status) }}
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <!-- Status distribution pills -->
          <div class="status-distribution-grid q-mb-md">
            <div class="dist-stat">
              <div class="dist-header">
                <span class="dist-dot dot-pending" />
                <span class="dist-name">Pending</span>
              </div>
              <span class="dist-count">{{ pendingTasksCount }}</span>
            </div>

            <div class="dist-stat">
              <div class="dist-header">
                <span class="dist-dot dot-progress" />
                <span class="dist-name">In Progress</span>
              </div>
              <span class="dist-count">{{ inProgressTasksCount }}</span>
            </div>

            <div class="dist-stat">
              <div class="dist-header">
                <span class="dist-dot dot-completed" />
                <span class="dist-name">Completed</span>
              </div>
              <span class="dist-count">{{ completedTasksCount }}</span>
            </div>

            <div class="dist-stat">
              <div class="dist-header">
                <span class="dist-dot dot-hold" />
                <span class="dist-name">On Hold</span>
              </div>
              <span class="dist-count">{{ onHoldTasksCount }}</span>
            </div>
          </div>

          <!-- Multi-segmented Progress Track -->
          <div class="multi-progress-wrapper q-mb-md">
            <div class="multi-progress-bar">
              <div
                class="seg seg-completed"
                :style="{
                  width: `${totalTasksCount ? (completedTasksCount / totalTasksCount) * 100 : 0}%`,
                }"
                :title="`Completed: ${completedTasksCount}`"
              />
              <div
                class="seg seg-progress"
                :style="{
                  width: `${totalTasksCount ? (inProgressTasksCount / totalTasksCount) * 100 : 0}%`,
                }"
                :title="`In Progress: ${inProgressTasksCount}`"
              />
              <div
                class="seg seg-hold"
                :style="{
                  width: `${totalTasksCount ? (onHoldTasksCount / totalTasksCount) * 100 : 0}%`,
                }"
                :title="`On Hold: ${onHoldTasksCount}`"
              />
              <div
                class="seg seg-pending"
                :style="{
                  width: `${totalTasksCount ? (pendingTasksCount / totalTasksCount) * 100 : 0}%`,
                }"
                :title="`Pending: ${pendingTasksCount}`"
              />
            </div>
          </div>

          <!-- Effort vs Expected metrics -->
          <div class="effort-box">
            <div class="effort-row">
              <div class="effort-info">
                <span class="effort-label">Logged Effort</span>
                <strong class="effort-val">{{ totalEffortLogged }} Hours</strong>
              </div>
              <div class="effort-info text-right">
                <span class="effort-label">Expected Effort</span>
                <strong class="effort-val">{{ totalEffortExpected }} Hours</strong>
              </div>
            </div>
            <q-linear-progress
              rounded
              size="6px"
              :value="
                totalEffortExpected ? Math.min(1, totalEffortLogged / totalEffortExpected) : 0
              "
              color="primary"
              track-color="purple-1"
              class="q-mt-sm"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- RIGHT: MILESTONES -->
      <q-card flat bordered class="detail-card milestones-card">
        <q-card-section class="card-header-bar">
          <div class="header-title-group">
            <q-icon name="flag" size="20px" class="text-primary q-mr-xs" />
            <h2 class="card-header-title">Project Milestones</h2>
          </div>
          <span class="text-caption text-grey-6"
            >{{ completedMilestonesCount }}/{{ milestones.length }} Completed</span
          >
        </q-card-section>

        <q-separator />

        <q-card-section class="milestones-list q-pa-none">
          <div
            v-for="(milestone, mIdx) in milestones"
            :key="milestone.id"
            class="milestone-item"
            :class="{ 'milestone-done': milestone.progress === 100 }"
          >
            <div class="milestone-indicator">
              <q-avatar
                size="26px"
                :class="[
                  'milestone-avatar',
                  milestone.progress === 100
                    ? 'avatar-completed'
                    : milestone.progress > 0
                      ? 'avatar-in-progress'
                      : 'avatar-upcoming',
                ]"
              >
                <q-icon
                  :name="
                    milestone.progress === 100
                      ? 'check'
                      : milestone.progress > 0
                        ? 'sync'
                        : 'hourglass_empty'
                  "
                  size="14px"
                />
              </q-avatar>
              <div v-if="mIdx < milestones.length - 1" class="milestone-line" />
            </div>

            <div class="milestone-body">
              <div class="milestone-top">
                <span class="milestone-name">{{ milestone.name }}</span>
                <q-chip
                  dense
                  square
                  :class="[
                    'milestone-chip',
                    `m-chip-${milestone.status.toLowerCase().replace('_', '-')}`,
                  ]"
                >
                  {{ milestone.status.replace('_', ' ') }}
                </q-chip>
              </div>

              <div class="milestone-progress-row q-mt-xs">
                <q-linear-progress
                  rounded
                  size="5px"
                  :value="milestone.progress / 100"
                  color="primary"
                  track-color="purple-1"
                  class="milestone-progress"
                />
                <span class="milestone-pct">{{ milestone.progress }}%</span>
              </div>

              <div class="milestone-meta q-mt-xs">
                <span class="meta-date">
                  <q-icon name="event" size="12px" class="q-mr-xs text-grey-6" />
                  Due {{ milestone.dueDate }}
                </span>
                <span class="meta-tasks">
                  {{ milestone.completedTasks }}/{{ milestone.totalTasks }} tasks
                </span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 05 TASK BREAKDOWN TABLE -->
    <q-card flat bordered class="detail-card task-breakdown-card q-mb-lg">
      <q-card-section class="task-table-toolbar">
        <div class="table-title-area">
          <div class="header-title-group">
            <q-icon name="format_list_bulleted" size="20px" class="text-primary q-mr-xs" />
            <h2 class="card-header-title">Task Breakdown</h2>
            <q-badge
              color="primary"
              rounded
              :label="`${filteredTasks.length} tasks`"
              class="q-ml-sm"
            />
          </div>
          <span class="text-caption text-grey-6"
            >Manage deliverables, statuses, assignees, and deadlines</span
          >
        </div>

        <div class="table-actions-group">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="New Task"
            class="add-task-btn"
            @click="showCreateTaskDialog = true"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- FILTER BAR -->
      <q-card-section class="task-filter-bar">
        <q-input
          v-model="taskSearch"
          outlined
          dense
          clearable
          placeholder="Search tasks by title..."
          class="task-search-input"
        >
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>

        <q-select
          v-model="statusFilter"
          outlined
          dense
          emit-value
          map-options
          :options="taskStatusOptions"
          label="Status"
          class="task-filter-select"
        />

        <q-select
          v-model="priorityFilter"
          outlined
          dense
          emit-value
          map-options
          :options="taskPriorityOptions"
          label="Priority"
          class="task-filter-select"
        />

        <q-select
          v-model="assigneeFilter"
          outlined
          dense
          emit-value
          map-options
          :options="assigneeOptions"
          label="Assignee"
          class="task-filter-select"
        />

        <q-btn
          flat
          dense
          no-caps
          icon="refresh"
          label="Reset"
          color="grey-7"
          class="reset-btn"
          @click="resetTaskFilters"
        />
      </q-card-section>

      <!-- TASKS TABLE -->
      <q-table
        flat
        :rows="filteredTasks"
        :columns="taskColumns"
        row-key="task_id"
        :loading="tasksLoading"
        :pagination="taskPagination"
        :rows-per-page-options="[5, 10, 20]"
        class="tasks-table"
        table-header-class="tasks-table-header"
        no-data-label="No tasks found for this project"
      >
        <template #loading>
          <q-inner-loading showing color="primary" />
        </template>

        <!-- Task Title Column -->
        <template #body-cell-title="props">
          <q-td :props="props">
            <div class="task-title-cell">
              <q-icon
                :name="getPriorityIcon(props.row.priority)"
                size="16px"
                :class="['priority-icon', `icon-${props.row.priority.toLowerCase()}`]"
              />
              <div class="task-name-desc">
                <span class="task-title-text">{{ props.row.title }}</span>
                <span
                  v-if="props.row.description"
                  class="task-desc-text"
                  :title="props.row.description"
                >
                  {{ props.row.description }}
                </span>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Status Column -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              square
              :class="['task-status-chip', `t-status-${props.row.status.toLowerCase()}`]"
            >
              {{ formatStatus(props.row.status) }}
            </q-chip>
          </q-td>
        </template>

        <!-- Priority Column -->
        <template #body-cell-priority="props">
          <q-td :props="props">
            <q-chip
              dense
              square
              :class="['task-priority-chip', `t-priority-${props.row.priority.toLowerCase()}`]"
            >
              {{ props.row.priority }}
            </q-chip>
          </q-td>
        </template>

        <!-- Assignee Column -->
        <template #body-cell-assignee="props">
          <q-td :props="props">
            <div v-if="getAssigneeMembers(props.row).length" class="row items-center q-gutter-xs">
              <q-chip
                v-for="member in getAssigneeMembers(props.row)"
                :key="member.id"
                dense
                square
                removable
                color="purple-1"
                text-color="deep-purple-9"
                class="q-ma-none q-mr-xs"
                @remove="confirmUnassignTaskResource(props.row, member.id, member.name)"
              >
                <q-avatar size="18px" color="primary" text-color="white">
                  {{ member.name.charAt(0).toUpperCase() }}
                </q-avatar>
                <span class="q-ml-xs text-weight-medium" style="font-size: 11px">{{
                  member.name
                }}</span>
                <q-tooltip>Click X to unassign {{ member.name }}</q-tooltip>
              </q-chip>
            </div>
            <div v-else class="assignee-cell">
              <q-avatar size="24px" class="assignee-avatar">
                {{ getAssigneeName(props.row).charAt(0) }}
              </q-avatar>
              <span class="assignee-name">{{ getAssigneeName(props.row) }}</span>
            </div>
          </q-td>
        </template>

        <!-- Progress Column -->
        <template #body-cell-progress="props">
          <q-td :props="props">
            <div class="task-progress-cell">
              <q-linear-progress
                rounded
                size="6px"
                :value="getTaskProgressNumber(props.row.progress) / 100"
                color="primary"
                track-color="purple-1"
                class="task-linear-progress"
              />
              <span class="task-progress-pct"
                >{{ getTaskProgressNumber(props.row.progress) }}%</span
              >
            </div>
          </q-td>
        </template>

        <!-- Deadline Column -->
        <template #body-cell-deadline="props">
          <q-td :props="props">
            <div class="deadline-cell" :class="{ 'text-negative': isTaskOverdue(props.row) }">
              <q-icon
                :name="isTaskOverdue(props.row) ? 'warning' : 'event'"
                size="14px"
                class="q-mr-xs"
              />
              <span>{{ formatDate(props.row.deadline) }}</span>
            </div>
          </q-td>
        </template>

        <!-- Effort Column -->
        <template #body-cell-effort="props">
          <q-td :props="props">
            <span class="effort-text">
              {{ Number(props.row.actual_effort) || 0 }}h /
              {{ Number(props.row.expected_effort) || 0 }}h
            </span>
          </q-td>
        </template>

        <!-- Actions Column -->
        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="more_horiz" color="grey-6">
              <q-menu auto-close>
                <q-list style="min-width: 140px">
                  <q-item clickable @click="openQuickUpdate(props.row)">
                    <q-item-section avatar>
                      <q-icon name="edit_note" size="18px" color="primary" />
                    </q-item-section>
                    <q-item-section>Update Progress</q-item-section>
                  </q-item>
                  <q-item clickable @click="openDependencyDialog(props.row)">
                    <q-item-section avatar>
                      <q-icon name="account_tree" size="18px" color="primary" />
                    </q-item-section>
                    <q-item-section>Add Dependency</q-item-section>
                  </q-item>
                  <q-item clickable @click="toggleTaskComplete(props.row)">
                    <q-item-section avatar>
                      <q-icon
                        :name="props.row.status === 'COMPLETED' ? 'replay' : 'check_circle'"
                        size="18px"
                        :color="props.row.status === 'COMPLETED' ? 'orange' : 'positive'"
                      />
                    </q-item-section>
                    <q-item-section>
                      {{ props.row.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Complete' }}
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable class="text-negative" @click="confirmDeleteTask(props.row)">
                    <q-item-section avatar>
                      <q-icon name="delete" size="18px" color="negative" />
                    </q-item-section>
                    <q-item-section>Delete Task</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 06 & 07 TWO-COLUMN SECTION: TEAM & RECENT ACTIVITY -->
    <div class="details-split-layout">
      <!-- TEAM / RESOURCES SECTION -->
      <q-card flat bordered class="detail-card team-card">
        <q-card-section class="card-header-bar">
          <div class="header-title-group">
            <q-icon name="badge" size="20px" class="text-primary q-mr-xs" />
            <h2 class="card-header-title">Assigned Team & Workload</h2>
          </div>
          <q-badge color="primary" rounded :label="`${teamMembers.length} Members`" />
          <q-btn
            outline
            dense
            no-caps
            icon="person_add"
            label="Add Resource"
            color="primary"
            class="q-ml-sm"
            @click="openAddMemberDialog"
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <q-list separator class="team-list">
            <q-item v-for="member in teamMembers" :key="member.id" class="team-member-item">
              <q-item-section avatar>
                <q-avatar size="36px" class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <span v-else>{{ member.name.charAt(0) }}</span>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="member-name">{{ member.name }}</q-item-label>
                <q-item-label caption class="member-role">{{ member.role }}</q-item-label>
              </q-item-section>

              <q-item-section side class="member-side">
                <div class="member-tasks-pill">
                  <q-icon name="task_alt" size="13px" class="q-mr-xs text-primary" />
                  <span>{{ member.assignedTasks }} Tasks</span>
                </div>
                <div class="member-workload-bar">
                  <q-linear-progress
                    rounded
                    size="4px"
                    :value="member.capacity / 100"
                    :color="member.capacity > 80 ? 'orange' : 'primary'"
                    track-color="purple-1"
                  />
                  <span class="member-cap-text">{{ member.capacity }}% capacity</span>
                </div>
                <q-btn
                  flat
                  round
                  dense
                  icon="person_remove"
                  color="grey-6"
                  size="sm"
                  class="q-ml-xs"
                  @click="confirmRemoveProjectMember(member)"
                >
                  <q-tooltip>Remove member from project</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- RECENT ACTIVITY SECTION -->
      <q-card flat bordered class="detail-card activity-card">
        <q-card-section class="card-header-bar">
          <div class="header-title-group">
            <q-icon name="history" size="20px" class="text-primary q-mr-xs" />
            <h2 class="card-header-title">Recent Activity</h2>
          </div>
          <span class="text-caption text-grey-6">Live Project Stream</span>
        </q-card-section>

        <q-separator />

        <q-card-section class="activity-timeline-section q-pa-md">
          <div class="activity-timeline">
            <div v-for="act in activityLogs" :key="act.id" class="activity-item">
              <div class="activity-icon-col">
                <q-avatar size="28px" :class="['act-avatar', `act-${act.type}`]">
                  <q-icon :name="act.icon" size="14px" />
                </q-avatar>
                <div class="act-line" />
              </div>

              <div class="activity-content-col">
                <div class="act-header">
                  <span class="act-user">{{ act.user }}</span>
                  <span class="act-time">{{ act.time }}</span>
                </div>
                <div class="act-message">{{ act.message }}</div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- DIALOG: CREATE TASK -->
    <q-dialog v-model="showCreateTaskDialog">
      <q-card class="modal-dialog">
        <q-card-section class="modal-header">
          <div>
            <div class="modal-eyebrow">NEW TASK</div>
            <div class="modal-title">Create Task for {{ project.name }}</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleCreateTask">
          <q-card-section class="modal-form">
            <q-input
              v-model="newTaskForm.title"
              outlined
              dense
              label="Task Title *"
              placeholder="e.g. Design responsive navbar component"
              :rules="[(val) => !!val.trim() || 'Task title is required']"
            />

            <q-input
              v-model="newTaskForm.description"
              outlined
              dense
              type="textarea"
              label="Description"
              placeholder="Task details and acceptance criteria..."
              autogrow
            />

            <div class="modal-form-row">
              <q-select
                v-model="newTaskForm.priority"
                outlined
                dense
                label="Priority"
                :options="taskPriorityFormOptions"
                emit-value
                map-options
                class="form-col"
              />
              <q-select
                v-model="newTaskForm.status"
                outlined
                dense
                label="Initial Status"
                :options="taskStatusFormOptions"
                emit-value
                map-options
                class="form-col"
              />
            </div>

            <div class="modal-form-row">
              <q-input
                v-model="newTaskForm.start_date"
                outlined
                dense
                type="date"
                label="Start Date"
                stack-label
                class="form-col"
              />
              <q-input
                v-model="newTaskForm.deadline"
                outlined
                dense
                type="date"
                label="Deadline"
                stack-label
                class="form-col"
              />
            </div>

            <div class="modal-form-row">
              <q-input
                v-model.number="newTaskForm.expected_effort"
                outlined
                dense
                type="number"
                min="0.5"
                step="0.5"
                label="Expected Effort (Hours) *"
                class="form-col"
                :rules="[(val) => Number(val) > 0 || 'Effort must be greater than 0']"
              />
              <q-select
                v-model="newTaskForm.assigned_resources"
                outlined
                dense
                multiple
                clearable
                :display-value="
                  newTaskForm.assigned_resources.length
                    ? `${newTaskForm.assigned_resources.length} selected`
                    : ''
                "
                label="Assign Member(s)"
                :options="createTaskAssigneeOptions"
                emit-value
                map-options
                class="form-col"
              >
                <template #option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section side>
                      <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="modal-actions">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn
              type="submit"
              no-caps
              unelevated
              label="Create Task"
              color="primary"
              :loading="taskCreating"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DIALOG: ADD TASK DEPENDENCY -->
    <q-dialog v-model="showDependencyDialog">
      <q-card class="modal-dialog" style="width: 480px; max-width: 95vw">
        <q-card-section class="modal-header">
          <div>
            <div class="modal-eyebrow">TASK DEPENDENCY</div>
            <div class="modal-title">Add Task Dependency</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAddDependency">
          <q-card-section class="modal-form">
            <q-input :model-value="dependencyTaskLabel" outlined dense readonly label="Task" />

            <q-select
              v-model="selectedPredecessorTaskIds"
              outlined
              dense
              multiple
              clearable
              :display-value="
                selectedPredecessorTaskIds.length
                  ? `${selectedPredecessorTaskIds.length} selected`
                  : ''
              "
              label="Depends On Predecessor(s)"
              hint="The selected task will wait for these predecessor(s)."
              :options="dependencyPredecessorOptions"
              emit-value
              map-options
              :rules="[
                (val) => (val && val.length > 0) || 'At least one predecessor task is required',
              ]"
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" :disable="opt.alreadyDependent">
                  <q-item-section side>
                    <q-checkbox
                      :model-value="selected || opt.alreadyDependent"
                      :disable="opt.alreadyDependent"
                      color="primary"
                      @update:model-value="!opt.alreadyDependent && toggleOption(opt)"
                    />
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="account_tree" color="primary" size="18px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      :class="{
                        'text-grey-6': opt.alreadyDependent,
                        'text-weight-medium': !opt.alreadyDependent,
                      }"
                    >
                      {{ opt.label }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section v-if="opt.alreadyDependent" side>
                    <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 10px">
                      <q-icon name="check" size="13px" class="q-mr-xs" color="positive" />
                      Already Dependent
                    </q-chip>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </q-card-section>

          <q-card-actions align="right" class="modal-actions">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn
              type="submit"
              no-caps
              unelevated
              label="Add Dependency"
              color="primary"
              :loading="dependencySubmitting"
              :disable="!selectedDependencyTaskId || !selectedPredecessorTaskIds?.length"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DIALOG: EDIT PROJECT -->
    <q-dialog v-model="showEditProjectDialog">
      <q-card class="modal-dialog">
        <q-card-section class="modal-header">
          <div>
            <div class="modal-eyebrow">EDIT PROJECT</div>
            <div class="modal-title">Update Project Information</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleSaveProject">
          <q-card-section class="modal-form">
            <q-input
              v-model="editProjectForm.name"
              outlined
              dense
              label="Project Name *"
              :rules="[(val) => !!val.trim() || 'Project name is required']"
            />

            <q-input
              v-model="editProjectForm.description"
              outlined
              dense
              type="textarea"
              label="Description"
              autogrow
            />

            <div class="modal-form-row">
              <q-select
                v-model="editProjectForm.status"
                outlined
                dense
                label="Status"
                :options="projectStatusOptions"
                emit-value
                map-options
                class="form-col"
              />
              <q-select
                v-model="editProjectForm.priority"
                outlined
                dense
                label="Priority"
                :options="projectPriorityOptions"
                emit-value
                map-options
                class="form-col"
              />
            </div>

            <div class="modal-form-row">
              <q-input
                v-model="editProjectForm.start_date"
                outlined
                dense
                type="date"
                label="Start Date"
                stack-label
                class="form-col"
              />
              <q-input
                v-model="editProjectForm.deadline"
                outlined
                dense
                type="date"
                label="Deadline"
                stack-label
                class="form-col"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="modal-actions">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn type="submit" no-caps unelevated label="Save Changes" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DIALOG: QUICK UPDATE TASK -->
    <q-dialog v-model="showQuickUpdateDialog">
      <q-card style="width: 460px; max-width: 95vw" class="modal-dialog">
        <q-card-section class="modal-header">
          <div>
            <div class="modal-eyebrow">TASK PROGRESS</div>
            <div class="modal-title">{{ selectedTaskForUpdate?.title }}</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-card-section v-if="selectedTaskForUpdate" class="modal-form">
          <div class="q-mb-md">
            <span class="text-caption text-weight-bold text-grey-7">Status</span>
            <div class="row q-gutter-xs q-mt-xs">
              <q-btn
                v-for="st in taskStatusFormOptions"
                :key="st.value"
                dense
                no-caps
                unelevated
                :color="selectedTaskForUpdate.status === st.value ? 'primary' : 'grey-3'"
                :text-color="selectedTaskForUpdate.status === st.value ? 'white' : 'grey-8'"
                :label="st.label"
                class="q-px-sm"
                @click="selectedTaskForUpdate.status = st.value"
              />
            </div>
          </div>

          <div class="q-mb-md">
            <div class="row justify-between items-center">
              <span class="text-caption text-weight-bold text-grey-7">Progress</span>
              <span class="text-caption text-weight-bold text-primary"
                >{{ selectedTaskForUpdateProgress }}%</span
              >
            </div>
            <q-slider
              v-model="selectedTaskForUpdateProgress"
              :min="0"
              :max="100"
              :step="5"
              color="primary"
              label
            />
          </div>

          <div>
            <span class="text-caption text-weight-bold text-grey-7">Logged Effort (Hours)</span>
            <q-input
              v-model.number="selectedTaskForUpdate.actual_effort"
              outlined
              dense
              type="number"
              min="0"
              step="0.5"
              class="q-mt-xs"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="modal-actions">
          <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
          <q-btn no-caps unelevated label="Save Update" color="primary" @click="saveQuickUpdate" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG: ADD RESOURCE TO PROJECT -->
    <q-dialog v-model="showAddMemberDialog">
      <q-card style="width: 480px; max-width: 95vw" class="modal-dialog">
        <q-card-section class="modal-header">
          <div>
            <div class="modal-eyebrow">PROJECT TEAM</div>
            <div class="modal-title">Add Resource to Project</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-card-section class="modal-form">
          <q-select
            v-model="selectedMembersToAdd"
            outlined
            dense
            multiple
            clearable
            emit-value
            map-options
            :display-value="
              selectedMembersToAdd.length
                ? `${selectedMembersToAdd.length} selected`
                : ''
            "
            label="Resource Member(s)"
            :options="availableResourcesToAdd"
            :disable="addingMember"
            hint="Check members to assign. Already existing members cannot be added."
          >
            <template #option="{ itemProps, opt, selected, toggleOption }">
              <q-item v-bind="itemProps" :disable="opt.alreadyMember">
                <q-item-section side>
                  <q-checkbox
                    :model-value="selected || opt.alreadyMember"
                    :disable="opt.alreadyMember"
                    color="primary"
                    @update:model-value="!opt.alreadyMember && toggleOption(opt)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    :class="{
                      'text-grey-6': opt.alreadyMember,
                      'text-weight-medium': !opt.alreadyMember,
                    }"
                  >
                    {{ opt.label }}
                  </q-item-label>
                </q-item-section>
                <q-item-section v-if="opt.alreadyMember" side>
                  <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 10px">
                    <q-icon name="check" size="13px" class="q-mr-xs" color="positive" />
                    Already Member
                  </q-chip>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="modal-actions">
          <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
          <q-btn
            no-caps
            unelevated
            color="primary"
            label="Add to Project"
            :loading="addingMember"
            :disable="!selectedMembersToAdd.length"
            @click="handleAddProjectMember"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DELETE PROJECT CONFIRMATION DIALOG -->
    <q-dialog v-model="showDeleteProjectDialog">
      <q-card class="dialog-card" style="min-width: 380px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar
            icon="delete_forever"
            color="negative"
            text-color="white"
            size="36px"
            class="q-mr-sm"
          />
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">Delete Project</div>
            <div class="text-caption text-grey-6">This action cannot be undone</div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-sm text-body2 text-grey-8">
          Are you sure you want to delete project <strong>"{{ project.name }}"</strong>? All
          associated tasks, dependencies, and team assignments will be permanently removed.
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
            unelevated
            no-caps
            color="negative"
            label="Delete Project"
            class="action-btn-primary"
            :loading="deletingProject"
            @click="handleExecuteDeleteProject"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DELETE TASK CONFIRMATION DIALOG -->
    <q-dialog v-model="showDeleteTaskDialog">
      <q-card class="dialog-card" style="min-width: 380px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar
            icon="delete_forever"
            color="negative"
            text-color="white"
            size="36px"
            class="q-mr-sm"
          />
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">Delete Task</div>
            <div class="text-caption text-grey-6">This action cannot be undone</div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-sm text-body2 text-grey-8">
          Are you sure you want to delete task <strong>"{{ taskToDelete?.title }}"</strong>? All
          associated dependencies and work logs will be removed.
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
            unelevated
            no-caps
            color="negative"
            label="Delete Task"
            class="action-btn-primary"
            :loading="deletingTask"
            @click="handleExecuteDeleteTask"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- UNASSIGN TASK RESOURCE DIALOG -->
    <q-dialog v-model="showUnassignTaskDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar
            icon="person_remove"
            color="negative"
            text-color="white"
            size="36px"
            class="q-mr-sm"
          />
          <div class="text-subtitle1 text-weight-bold text-dark">Unassign Resource from Task</div>
        </q-card-section>

        <q-card-section class="q-pt-sm text-body2 text-grey-8">
          Are you sure you want to remove
          <strong>{{ unassignTaskTarget.resourceName }}</strong> from task
          <strong>"{{ unassignTaskTarget.taskTitle }}"</strong>?
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
            unelevated
            no-caps
            color="negative"
            label="Unassign"
            class="action-btn-primary"
            :loading="unassigningTask"
            @click="handleExecuteUnassignTask"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- REMOVE PROJECT MEMBER DIALOG -->
    <q-dialog v-model="showRemoveMemberDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar
            icon="person_remove"
            color="negative"
            text-color="white"
            size="36px"
            class="q-mr-sm"
          />
          <div class="text-subtitle1 text-weight-bold text-dark">Remove Member from Project</div>
        </q-card-section>

        <q-card-section class="q-pt-sm text-body2 text-grey-8">
          Are you sure you want to remove <strong>{{ memberToRemove?.name }}</strong> from this
          project?
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
            unelevated
            no-caps
            color="negative"
            label="Remove Member"
            class="action-btn-primary"
            :loading="removingMember"
            @click="handleExecuteRemoveMember"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import {
  createTaskApi,
  deleteProjectApi,
  deleteTaskApi,
  getGlobalProgressFeedApi,
  getProjectByIdApi,
  getResourcesApi,
  getTasksApi,
  removeProjectMemberApi,
  unassignTaskResourceApi,
  updateProjectApi,
  updateTaskApi,
  assignProjectMemberApi,
  addTaskDependencyApi,
  type CreateTaskPayload,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type ResourceUser,
  type Task,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const projectIdParam = computed(() => {
  const param = route.params.id;
  return typeof param === 'string' ? parseInt(param, 10) : Number(param) || 1;
});

// ==========================================
// STATE
// ==========================================
const loading = ref(false);
const tasksLoading = ref(false);
const taskCreating = ref(false);
const showCreateTaskDialog = ref(false);
const showEditProjectDialog = ref(false);
const showQuickUpdateDialog = ref(false);
const selectedTaskForUpdate = ref<Task | null>(null);
const selectedTaskForUpdateProgress = ref(0);

const allSystemResources = ref<ResourceUser[]>([]);
const projectMembersResources = ref<ResourceUser[]>([]);
const showAddMemberDialog = ref(false);
const selectedMembersToAdd = ref<number[]>([]);
const addingMember = ref(false);

const showDeleteProjectDialog = ref(false);
const deletingProject = ref(false);

const showDeleteTaskDialog = ref(false);
const deletingTask = ref(false);
const taskToDelete = ref<Task | null>(null);

const showUnassignTaskDialog = ref(false);
const unassigningTask = ref(false);
const unassignTaskTarget = reactive({
  taskId: 0,
  taskTitle: '',
  resourceId: 0,
  resourceName: '',
});

const showRemoveMemberDialog = ref(false);
const removingMember = ref(false);
const memberToRemove = ref<TeamMember | null>(null);

const showDependencyDialog = ref(false);
const selectedDependencyTaskId = ref<number | null>(null);
const selectedPredecessorTaskIds = ref<number[]>([]);
const dependencySubmitting = ref(false);

const availableResourcesToAdd = computed(() => {
  const existingIds = new Set(
    [
      ...projectMembersResources.value.map((m) => Number(m.user_id)),
      ...teamMembers.value.map((tm) => Number(tm.id)),
    ].filter((id) => !isNaN(id) && id > 0),
  );
  return allSystemResources.value.map((r) => {
    const rId = Number(r.user_id);
    const isMember = existingIds.has(rId);
    return {
      label: `${r.name} (${r.role || 'RESOURCE'})`,
      value: rId,
      alreadyMember: isMember,
      disable: isMember,
    };
  });
});

const createTaskAssigneeOptions = computed(() =>
  projectMembersResources.value.map((resource) => ({
    label: `${resource.name} (${resource.role})`,
    value: resource.user_id,
  })),
);

const dependencyTaskLabel = computed(() => {
  const task = tasks.value.find((item) => item.task_id === selectedDependencyTaskId.value);
  return task ? `${task.title} (#${task.task_id})` : '';
});

const existingTaskDependencies = reactive<Record<number, number[]>>({});

const dependencyPredecessorOptions = computed(() => {
  const selectedTask = tasks.value.find((t) => Number(t.task_id) === Number(selectedDependencyTaskId.value));
  const currentTaskDeps = selectedDependencyTaskId.value
    ? [
        ...(existingTaskDependencies[selectedDependencyTaskId.value] || []),
        ...(selectedTask?.predecessor_task_ids || []).map(Number),
      ]
    : [];

  const existingSet = new Set(currentTaskDeps);

  return tasks.value
    .filter((task) => Number(task.task_id) !== Number(selectedDependencyTaskId.value))
    .map((task) => {
      const tId = Number(task.task_id);
      const isDep = existingSet.has(tId);
      return {
        label: `${task.title} (#${task.task_id})`,
        value: tId,
        alreadyDependent: isDep,
        disable: isDep,
      };
    });
});

const currentPmName = computed(() => {
  return authStore.user?.name || 'Project Manager';
});

// Default Project Data
const project = reactive<Project>({
  project_id: projectIdParam.value,
  project_manager_id: 0,
  name: '',
  description: null,
  status: 'DRAFT',
  priority: 'MEDIUM',
  start_date: null,
  deadline: null,
  progress: 0,
});

// Tasks
const tasks = ref<Task[]>([]);

// Team Members (High-fidelity structure)
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  assignedTasks: number;
  capacity: number;
}

const teamMembers = ref<TeamMember[]>([]);

// Milestones
interface Milestone {
  id: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  dueDate: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

const milestones = ref<Milestone[]>([]);

// Activity Feed
interface ActivityLog {
  id: number;
  user: string;
  message: string;
  time: string;
  type: 'complete' | 'update' | 'create' | 'comment';
  icon: string;
}

const activityLogs = ref<ActivityLog[]>([]);

// Forms
const newTaskForm = reactive<{
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  start_date: string;
  deadline: string;
  expected_effort: number;
  assigned_resources: number[];
}>({
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  start_date: new Date().toISOString().split('T')[0] ?? '',
  deadline: '',
  expected_effort: 6,
  assigned_resources: [],
});

const editProjectForm = reactive<{
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  deadline: string;
}>({
  name: '',
  description: '',
  status: 'ACTIVE',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
});

// Task Filters
const taskSearch = ref('');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');
const assigneeFilter = ref('ALL');

const taskPagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: '',
  descending: false,
});

// Options
const taskStatusOptions = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

const taskPriorityOptions = [
  { label: 'All Priorities', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const assigneeOptions = computed(() => [
  { label: 'All Assignees', value: 'ALL' },
  ...teamMembers.value.map((m) => ({ label: m.name, value: String(m.id) })),
]);

const taskPriorityFormOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const taskStatusFormOptions: {
  label: string;
  value: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
}[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

const projectStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const projectPriorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

// Table Columns
const taskColumns: QTableColumn<Task>[] = [
  {
    name: 'title',
    label: 'Task Details',
    field: (row) => row.title,
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: (row) => row.status,
    align: 'left',
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Priority',
    field: (row) => row.priority,
    align: 'left',
    sortable: true,
  },
  {
    name: 'assignee',
    label: 'Assignee',
    field: (row) => getAssigneeName(row),
    align: 'left',
  },
  {
    name: 'progress',
    label: 'Progress',
    field: (row) => getTaskProgressNumber(row.progress),
    align: 'left',
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: (row) => row.deadline ?? '',
    align: 'left',
    sortable: true,
  },
  {
    name: 'effort',
    label: 'Effort (Actual/Plan)',
    field: (row) => Number(row.expected_effort) || 0,
    align: 'left',
  },
  {
    name: 'actions',
    label: '',
    field: () => '',
    align: 'right',
  },
];

// ==========================================
// COMPUTED VALUES
// ==========================================
const projectHealth = computed(() => {
  if (project.status === 'COMPLETED') return 'ON_TRACK';

  if (project.deadline) {
    const deadline = new Date(project.deadline);
    const today = new Date();
    if (deadline < today) return 'DELAYED';
  }

  const prog = Number(project.progress) || 0;
  if (prog < 30) return 'AT_RISK';

  return 'ON_TRACK';
});

const healthLabel = computed(() => {
  if (projectHealth.value === 'AT_RISK') return 'At Risk';
  if (projectHealth.value === 'DELAYED') return 'Delayed';
  return 'On Track';
});

const daysRemaining = computed(() => {
  if (!project.deadline) return 0;
  const deadline = new Date(project.deadline);
  const today = new Date();
  const diffTime = deadline.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const daysRemainingText = computed(() => {
  if (!project.deadline) return 'No deadline';
  if (project.status === 'COMPLETED') return 'Completed';
  if (daysRemaining.value > 0) return `${daysRemaining.value} days left`;
  if (daysRemaining.value === 0) return 'Due today';
  return `Overdue by ${Math.abs(daysRemaining.value)} days`;
});

const totalTasksCount = computed(() => tasks.value.length);

const completedTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'COMPLETED').length,
);

const inProgressTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);

const pendingTasksCount = computed(() => tasks.value.filter((t) => t.status === 'PENDING').length);

const onHoldTasksCount = computed(() => tasks.value.filter((t) => t.status === 'ON_HOLD').length);

const overdueTasksCount = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.value.filter((t) => {
    if (t.status === 'COMPLETED' || !t.deadline) return false;
    return new Date(t.deadline) < today;
  }).length;
});

const taskCompletionRate = computed(() => {
  if (!totalTasksCount.value) return 0;
  return Math.round((completedTasksCount.value / totalTasksCount.value) * 100);
});

const overallProgress = computed(() => {
  if (!tasks.value.length) return Number(project.progress) || 0;
  const total = tasks.value.reduce((sum, t) => sum + getTaskProgressNumber(t.progress), 0);
  return Math.round(total / tasks.value.length);
});

const totalEffortExpected = computed(() =>
  tasks.value.reduce((sum, t) => sum + (Number(t.expected_effort) || 0), 0),
);

const totalEffortLogged = computed(() =>
  tasks.value.reduce((sum, t) => sum + (Number(t.actual_effort) || 0), 0),
);

const completedMilestonesCount = computed(
  () => milestones.value.filter((m) => m.progress === 100).length,
);

const activeAssigneesCount = computed(
  () => teamMembers.value.filter((m) => m.assignedTasks > 0).length,
);

const filteredTasks = computed(() => {
  const q = taskSearch.value.trim().toLowerCase();

  return tasks.value.filter((task) => {
    const matchesSearch =
      !q ||
      task.title.toLowerCase().includes(q) ||
      (task.description ?? '').toLowerCase().includes(q);

    const matchesStatus = statusFilter.value === 'ALL' || task.status === statusFilter.value;

    const matchesPriority =
      priorityFilter.value === 'ALL' || task.priority === priorityFilter.value;

    const matchesAssignee =
      assigneeFilter.value === 'ALL' ||
      (task.assigned_resource_ids &&
        task.assigned_resource_ids.includes(Number(assigneeFilter.value)));

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });
});

// ==========================================
// HELPERS
// ==========================================
function formatDate(date: string | null | undefined) {
  if (!date) return 'No date set';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatStatus(status: string | undefined) {
  if (!status) return 'Active';
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTaskProgressNumber(progress: number | string | undefined): number {
  return Math.min(100, Math.max(0, Number(progress) || 0));
}

function isTaskOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || !task.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.deadline) < today;
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'priority_high';
    case 'MEDIUM':
      return 'remove';
    case 'LOW':
      return 'arrow_downward';
    default:
      return 'radio_button_unchecked';
  }
}

function getAssigneeMembers(task: Task): { id: number; name: string }[] {
  if (task.assigned_resource_ids && task.assigned_resource_ids.length > 0) {
    return task.assigned_resource_ids
      .map((id) => {
        const m = teamMembers.value.find((tm) => tm.id === id);
        return m ? { id: m.id, name: m.name } : null;
      })
      .filter((m): m is { id: number; name: string } => m !== null);
  }
  return [];
}

function getAssigneeName(task: Task): string {
  if (task.assigned_resource_ids && task.assigned_resource_ids.length > 0) {
    const names = task.assigned_resource_ids
      .map((id) => teamMembers.value.find((m) => m.id === id)?.name)
      .filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  return currentPmName.value;
}

function resetTaskFilters() {
  taskSearch.value = '';
  statusFilter.value = 'ALL';
  priorityFilter.value = 'ALL';
  assigneeFilter.value = 'ALL';
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadProjectDetails() {
  loading.value = true;

  try {
    const found = await getProjectByIdApi(projectIdParam.value);

    if (found) {
      Object.assign(project, found);
    }
  } catch (error) {
    console.error('Failed to load project details:', error);

    $q.notify({
      type: 'negative',
      message: 'Failed to load project details',
    });
  } finally {
    loading.value = false;
  }
}

async function loadProjectTasks() {
  tasksLoading.value = true;
  try {
    const fetchedTasks = await getTasksApi(projectIdParam.value);
    tasks.value = fetchedTasks ?? [];
    updateDerivedMilestones();
  } catch (error) {
    console.error('Failed to load tasks from API:', error);
    tasks.value = [];
    updateDerivedMilestones();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load project tasks',
    });
  } finally {
    tasksLoading.value = false;
  }
}

function updateDerivedMilestones() {
  milestones.value = tasks.value
    .filter((task) => task.start_date || task.deadline)
    .map((task) => {
      const progress = getTaskProgressNumber(task.progress);
      const status: Milestone['status'] =
        task.status === 'COMPLETED'
          ? 'COMPLETED'
          : task.status === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : 'UPCOMING';

      return {
        id: task.task_id,
        name: task.title,
        status,
        dueDate: formatDate(task.deadline),
        progress,
        completedTasks: task.status === 'COMPLETED' ? 1 : 0,
        totalTasks: 1,
      };
    });
}

function formatRelativeTime(date: string | undefined): string {
  if (!date) return 'Recently';
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`;
}

async function updateActivityLogs() {
  try {
    const feedLogs = await getGlobalProgressFeedApi(50).catch(() => []);
    const projectTaskIds = new Set(tasks.value.map((t) => t.task_id));
    const projectLogs = feedLogs.filter(
      (log) =>
        (log.task_id && projectTaskIds.has(log.task_id)) ||
        (log.project_name &&
          project.name &&
          log.project_name.toLowerCase() === project.name.toLowerCase()),
    );

    if (projectLogs.length > 0) {
      activityLogs.value = projectLogs.slice(0, 10).map((log) => {
        const isCompleted = log.status === 'COMPLETED';
        let detail = `Logged ${log.hours_logged}h (${log.progress_logged}% progress) on "${log.task_title || 'Task'}": ${log.notes}`;
        if (log.blockers) {
          detail += ` [Blocker: ${log.blockers}]`;
        }
        return {
          id: log.log_id,
          user: log.author_name || currentPmName.value,
          message: detail,
          time: formatRelativeTime(log.created_at || log.log_date),
          type: isCompleted ? 'complete' : 'update',
          icon: isCompleted ? 'check_circle' : 'edit_note',
        };
      });
      return;
    }
  } catch (error) {
    console.warn('Failed to load global progress feed:', error);
  }

  const records = tasks.value
    .map((task) => ({
      task,
      timestamp: task.updated_at ?? task.created_at ?? task.deadline ?? undefined,
    }))
    .filter((entry) => entry.timestamp)
    .sort((a, b) => {
      const aTime = new Date(a.timestamp ?? 0).getTime();
      const bTime = new Date(b.timestamp ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  const logs: ActivityLog[] = records.map(({ task, timestamp }) => {
    const assignee = getAssigneeName(task);
    const isCompleted = task.status === 'COMPLETED';
    const isCreated = task.created_at && task.updated_at && task.created_at === task.updated_at;

    return {
      id: task.task_id,
      user: assignee || currentPmName.value,
      message: isCompleted
        ? `Completed task "${task.title}"`
        : isCreated
          ? `Created task "${task.title}"`
          : `Updated task "${task.title}" to ${formatStatus(task.status)}`,
      time: formatRelativeTime(timestamp),
      type: isCompleted ? 'complete' : isCreated ? 'create' : 'update',
      icon: isCompleted ? 'check_circle' : isCreated ? 'add_task' : 'sync',
    };
  });

  if (!logs.length && project.name) {
    logs.push({
      id: project.project_id,
      user: currentPmName.value,
      message: `Project "${project.name}" is ready for task management`,
      time: 'Current',
      type: 'update',
      icon: 'folder_open',
    });
  }

  activityLogs.value = logs;
}

function confirmDeleteProject() {
  showDeleteProjectDialog.value = true;
}

async function handleExecuteDeleteProject() {
  deletingProject.value = true;
  try {
    await deleteProjectApi(projectIdParam.value);
    $q.notify({
      type: 'positive',
      message: `Project "${project.name}" deleted successfully`,
    });
    showDeleteProjectDialog.value = false;
    void router.push('/pm/projects');
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete project',
    });
  } finally {
    deletingProject.value = false;
  }
}

function confirmDeleteTask(task: Task) {
  taskToDelete.value = task;
  showDeleteTaskDialog.value = true;
}

async function handleExecuteDeleteTask() {
  if (!taskToDelete.value) return;

  deletingTask.value = true;
  try {
    await deleteTaskApi(taskToDelete.value.task_id);
    $q.notify({
      type: 'positive',
      message: `Task "${taskToDelete.value.title}" deleted successfully`,
    });
    showDeleteTaskDialog.value = false;
    taskToDelete.value = null;
    await refreshData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete task',
    });
  } finally {
    deletingTask.value = false;
  }
}

function confirmUnassignTaskResource(task: Task, rId: number, rName: string) {
  unassignTaskTarget.taskId = task.task_id;
  unassignTaskTarget.taskTitle = task.title;
  unassignTaskTarget.resourceId = rId;
  unassignTaskTarget.resourceName = rName;
  showUnassignTaskDialog.value = true;
}

async function handleExecuteUnassignTask() {
  if (!unassignTaskTarget.taskId || !unassignTaskTarget.resourceId) return;

  unassigningTask.value = true;
  try {
    await unassignTaskResourceApi(unassignTaskTarget.taskId, unassignTaskTarget.resourceId);
    $q.notify({
      type: 'positive',
      message: `Unassigned ${unassignTaskTarget.resourceName} successfully`,
    });
    showUnassignTaskDialog.value = false;
    await refreshData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unassign resource',
    });
  } finally {
    unassigningTask.value = false;
  }
}

function confirmRemoveProjectMember(member: TeamMember) {
  memberToRemove.value = member;
  showRemoveMemberDialog.value = true;
}

async function handleExecuteRemoveMember() {
  if (!memberToRemove.value) return;

  removingMember.value = true;
  try {
    await removeProjectMemberApi(projectIdParam.value, memberToRemove.value.id);
    $q.notify({
      type: 'positive',
      message: `Removed ${memberToRemove.value.name} from project successfully`,
    });
    showRemoveMemberDialog.value = false;
    memberToRemove.value = null;
    await refreshData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to remove member from project',
    });
  } finally {
    removingMember.value = false;
  }
}

async function loadProjectTeamMembers() {
  try {
    const [fetchedProjectMembers, fetchedAllResources] = await Promise.all([
      getResourcesApi(projectIdParam.value).catch(() => []),
      getResourcesApi().catch(() => []),
    ]);
    projectMembersResources.value = fetchedProjectMembers;
    allSystemResources.value = fetchedAllResources;

    teamMembers.value = fetchedProjectMembers.map((resource) => {
      const assigned = tasks.value.filter((task) =>
        task.assigned_resource_ids?.includes(resource.user_id),
      );
      const effort = assigned.reduce((sum, task) => sum + (Number(task.expected_effort) || 0), 0);
      const capacity = Math.min(100, Math.round((effort / 40) * 100));

      return {
        id: resource.user_id,
        name: resource.name,
        role: resource.role || 'Team Resource',
        assignedTasks: assigned.length,
        capacity,
      };
    });
  } catch (error) {
    console.warn('Failed to load team resources from API:', error);
  } finally {
    void updateActivityLogs();
  }
}

async function openAddMemberDialog() {
  try {
    const [fetchedProjectMembers, fetchedAllResources] = await Promise.all([
      getResourcesApi(projectIdParam.value).catch(() => []),
      getResourcesApi().catch(() => []),
    ]);
    projectMembersResources.value = fetchedProjectMembers;
    allSystemResources.value = fetchedAllResources;
    selectedMembersToAdd.value = [];
    showAddMemberDialog.value = true;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load resources',
    });
  }
}

async function handleAddProjectMember() {
  if (!selectedMembersToAdd.value.length) return;

  addingMember.value = true;
  const resourceIds = selectedMembersToAdd.value;
  try {
    for (const rId of resourceIds) {
      await assignProjectMemberApi(project.project_id, rId);
    }

    $q.notify({
      type: 'positive',
      message: `${resourceIds.length} member(s) added to the project`,
    });
    showAddMemberDialog.value = false;
    selectedMembersToAdd.value = [];
    await refreshData();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to assign resource(s) to project',
    });
  } finally {
    addingMember.value = false;
  }
}

async function refreshData() {
  await Promise.all([loadProjectDetails(), loadProjectTasks(), loadProjectTeamMembers()]);
  await updateActivityLogs();
  $q.notify({
    type: 'positive',
    message: 'Project details refreshed',
    timeout: 1500,
  });
}

function openDependencyDialog(task: Task) {
  selectedDependencyTaskId.value = task.task_id;
  const predIds = (task.predecessor_task_ids || []).map(Number);
  existingTaskDependencies[task.task_id] = predIds;
  selectedPredecessorTaskIds.value = [];
  showDependencyDialog.value = true;
}

async function handleAddDependency() {
  if (!selectedDependencyTaskId.value || !selectedPredecessorTaskIds.value?.length) return;

  const taskId = selectedDependencyTaskId.value;
  const currentDeps = existingTaskDependencies[taskId] || [];
  const toAdd = selectedPredecessorTaskIds.value.filter((id) => !currentDeps.includes(id));

  if (toAdd.length === 0) {
    $q.notify({
      type: 'info',
      message: 'Selected predecessor(s) are already dependencies of this task',
    });
    showDependencyDialog.value = false;
    selectedPredecessorTaskIds.value = [];
    return;
  }

  dependencySubmitting.value = true;
  try {
    for (const predId of toAdd) {
      await addTaskDependencyApi(taskId, predId);
    }

    if (!existingTaskDependencies[taskId]) {
      existingTaskDependencies[taskId] = [];
    }
    existingTaskDependencies[taskId].push(...toAdd);

    const successor = tasks.value.find((task) => Number(task.task_id) === Number(taskId));
    if (successor) {
      if (!successor.predecessor_task_ids) {
        successor.predecessor_task_ids = [];
      }
      successor.predecessor_task_ids.push(...toAdd);
    }

    $q.notify({
      type: 'positive',
      message: `Added ${toAdd.length} dependency/dependencies to "${successor?.title ?? 'Task'}"`,
    });

    showDependencyDialog.value = false;
    selectedDependencyTaskId.value = null;
    selectedPredecessorTaskIds.value = [];
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to add task dependency',
    });
  } finally {
    dependencySubmitting.value = false;
  }
}

async function handleCreateTask() {
  taskCreating.value = true;
  try {
    const payload: CreateTaskPayload = {
      project_id: project.project_id,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim() || null,
      priority: newTaskForm.priority,
      status: newTaskForm.status,
      start_date: newTaskForm.start_date || null,
      deadline: newTaskForm.deadline || null,
      expected_effort: Number(newTaskForm.expected_effort) || 4,
      assigned_resource_ids: newTaskForm.assigned_resources || [],
    };

    const created = await createTaskApi(payload);
    if (created) {
      tasks.value.unshift(created);
      await loadProjectTeamMembers();
      updateDerivedMilestones();
      void updateActivityLogs();
    }

    // Add activity log
    activityLogs.value.unshift({
      id: Date.now(),
      user: currentPmName.value,
      message: `Created new task "${payload.title}"`,
      time: 'Just now',
      type: 'create',
      icon: 'add_task',
    });

    $q.notify({
      type: 'positive',
      message: 'Task created successfully',
    });

    showCreateTaskDialog.value = false;
    newTaskForm.title = '';
    newTaskForm.description = '';
    newTaskForm.assigned_resources = [];
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create task',
    });
  } finally {
    taskCreating.value = false;
  }
}

function openEditDialog() {
  editProjectForm.name = project.name;
  editProjectForm.description = project.description || '';
  editProjectForm.status = (project.status as ProjectStatus) || 'ACTIVE';
  editProjectForm.priority = (project.priority as ProjectPriority) || 'MEDIUM';
  editProjectForm.start_date = project.start_date || '';
  editProjectForm.deadline = project.deadline || '';
  showEditProjectDialog.value = true;
}

async function handleSaveProject() {
  try {
    const updatedProject = await updateProjectApi(project.project_id, {
      name: editProjectForm.name.trim(),
      description: editProjectForm.description.trim() || null,
      status: editProjectForm.status,
      priority: editProjectForm.priority,
      start_date: editProjectForm.start_date || null,
      deadline: editProjectForm.deadline || null,
    });

    Object.assign(project, updatedProject);

    activityLogs.value.unshift({
      id: Date.now(),
      user: currentPmName.value,
      message: `Updated project metadata and status to ${formatStatus(project.status)}`,
      time: 'Just now',
      type: 'update',
      icon: 'edit',
    });

    $q.notify({
      type: 'positive',
      message: 'Project details updated successfully',
    });

    showEditProjectDialog.value = false;
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
}
function openQuickUpdate(task: Task) {
  selectedTaskForUpdate.value = task;
  selectedTaskForUpdateProgress.value = getTaskProgressNumber(task.progress);
  showQuickUpdateDialog.value = true;
}

async function saveQuickUpdate() {
  if (!selectedTaskForUpdate.value) return;
  const nextStatus =
    selectedTaskForUpdateProgress.value === 100 ? 'COMPLETED' : selectedTaskForUpdate.value.status;

  try {
    const updated = await updateTaskApi(selectedTaskForUpdate.value.task_id, {
      status: nextStatus,
      progress: selectedTaskForUpdateProgress.value,
      actual_effort: Number(selectedTaskForUpdate.value.actual_effort) || 0,
    });

    Object.assign(selectedTaskForUpdate.value, updated);
    updateDerivedMilestones();
    void updateActivityLogs();

    $q.notify({
      type: 'positive',
      message: 'Task updated successfully',
    });
    showQuickUpdateDialog.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
}

async function toggleTaskComplete(task: Task) {
  const nextStatus = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
  const nextProgress =
    nextStatus === 'COMPLETED' ? 100 : Math.min(99, getTaskProgressNumber(task.progress));

  try {
    const updated = await updateTaskApi(task.task_id, {
      status: nextStatus,
      progress: nextProgress,
    });

    Object.assign(task, updated);

    // Re-fetch from backend so any auto-scheduled/dependent task
    // changes are immediately reflected in the PM dashboard.
    await loadProjectTasks();

    void updateActivityLogs();
    $q.notify({
      type: 'positive',
      message: `Task ${nextStatus === 'COMPLETED' ? 'marked as completed' : 'reopened'}`,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
}

async function markProjectComplete() {
  try {
    const updatedProject = await updateProjectApi(project.project_id, {
      name: project.name,
      description: project.description,
      status: 'COMPLETED',
      priority: (project.priority as ProjectPriority) || 'MEDIUM',
      start_date: project.start_date,
      deadline: project.deadline,
    });
    Object.assign(project, updatedProject);

    await Promise.all(
      tasks.value
        .filter((task) => task.status !== 'COMPLETED')
        .map((task) =>
          updateTaskApi(task.task_id, {
            status: 'COMPLETED',
            progress: 100,
          }).then((updated) => Object.assign(task, updated)),
        ),
    );

    updateDerivedMilestones();
    void updateActivityLogs();
    $q.notify({
      type: 'positive',
      message: 'Project and all deliverables marked as completed',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to complete project',
    });
  }
}

function exportProjectSummary() {
  $q.notify({
    type: 'info',
    message: 'Exporting project report as PDF/CSV summary...',
    timeout: 2000,
  });
}

onMounted(() => {
  void (async () => {
    await Promise.all([loadProjectDetails(), loadProjectTasks(), loadProjectTeamMembers()]);
    await updateActivityLogs();
  })();
});
</script>

<style scoped lang="scss">
.project-details-page {
  width: 100%;
  max-width: 1540px;
  margin: 0 auto;
  padding: 20px 28px 60px;
  background: var(--wo-bg-page, #f8f9fb);
  color: var(--wo-text-main, #172033);
}

/* BREADCRUMBS */
.project-breadcrumbs {
  font-size: 12px;
  font-weight: 500;
  color: var(--wo-text-muted, #63708a);
}

.breadcrumb-current {
  color: var(--wo-text-main, #172033);
  font-weight: 600;
}

/* HERO CARD */
.hero-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  border-color: var(--wo-border, #e5e7ec);
  box-shadow: var(--wo-card-shadow, 0 1px 3px rgba(16, 24, 40, 0.02));
}

.hero-content {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 28px;
  padding: 24px 28px;
}

.hero-main {
  min-width: 0;
}

.hero-badges-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.status-badge,
.health-badge,
.priority-badge {
  min-height: 24px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.status-active,
.status-published {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
}

.status-completed {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.status-on_hold,
.status-draft {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
}

.health-on_track {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.health-at_risk {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
}

.health-delayed {
  background: rgba(225, 82, 99, 0.15);
  color: #e15263;
}

.priority-critical {
  background: rgba(225, 82, 99, 0.15);
  color: #e15263;
}

.priority-high {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
}

.priority-medium {
  background: rgba(46, 144, 250, 0.15);
  color: #2e90fa;
}

.priority-low {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.project-id-tag {
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 11px;
  font-weight: 600;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--wo-text-main, #172033);
}

.hero-description {
  margin: 0 0 20px;
  color: var(--wo-text-muted, #63708a);
  font-size: 13px;
  line-height: 1.55;
  max-width: 900px;
}

.hero-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  display: flex;
  align-items: center;
  color: var(--wo-text-main, #172033);
  font-size: 12px;
  font-weight: 600;
}

.meta-avatar {
  background: var(--wo-primary-light, #f4f0fd);
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
  font-size: 11px;
  margin-right: 6px;
}

.team-avatars-group {
  display: flex;
  align-items: center;
}

.team-stack-avatar {
  border: 2px solid var(--wo-bg-card, #ffffff);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
}

.team-stack-avatar + .team-stack-avatar {
  margin-left: -7px;
}

.avatar-color-0 {
  background: #eaf1fd;
  color: #2e90fa;
  font-weight: 700;
  font-size: 10px;
}
.avatar-color-1 {
  background: #f4f0fd;
  color: #8b6fd8;
  font-weight: 700;
  font-size: 10px;
}
.avatar-color-2 {
  background: #e6f7f5;
  color: #1abc9c;
  font-weight: 700;
  font-size: 10px;
}
.avatar-color-3 {
  background: #fff4eb;
  color: #f5841f;
  font-weight: 700;
  font-size: 10px;
}

.team-stack-extra {
  background: var(--wo-border-subtle, #f0f2f5);
  color: var(--wo-text-muted, #63708a);
  font-size: 9px;
  font-weight: 700;
}

/* HERO SIDEBAR */
.hero-sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--wo-bg-tag, #fafbfe);
  border: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.hero-progress-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-label {
  color: var(--wo-text-muted, #63708a);
  font-size: 12px;
  font-weight: 600;
}

.progress-percent-val {
  color: var(--wo-primary, #8b6fd8);
  font-size: 22px;
  font-weight: 800;
}

.hero-progress-bar {
  border-radius: 6px;
}

.progress-sub-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 10px;
  font-weight: 500;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-btn {
  height: 38px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.primary-btn {
  flex: 1;
}

.edit-btn {
  border-color: var(--wo-border, #e5e7ec);
  color: var(--wo-text-main, #172033);
}

/* KPI GRID */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border-color: var(--wo-border, #e5e7ec);
  box-shadow: var(--wo-card-shadow, 0 1px 3px rgba(16, 24, 40, 0.02));
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
}

.kpi-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 14px;
}

.kpi-icon {
  flex: 0 0 46px;
  border-radius: 12px;
}

.icon-purple {
  background: rgba(139, 111, 216, 0.15);
  color: #8b6fd8;
}
.icon-teal {
  background: rgba(26, 188, 156, 0.15);
  color: #1abc9c;
}
.icon-green {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}
.icon-red {
  background: rgba(225, 82, 99, 0.15);
  color: #e15263;
}
.icon-orange {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
}
.icon-blue {
  background: rgba(46, 144, 250, 0.15);
  color: #2e90fa;
}

.kpi-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.kpi-label {
  color: var(--wo-text-muted, #63708a);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.kpi-value {
  margin-top: 2px;
  color: var(--wo-text-main, #172033);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
}

.kpi-note {
  margin-top: 4px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.note-green {
  color: #27ae60;
}
.note-teal {
  color: #1abc9c;
}
.note-red {
  color: #e15263;
}
.note-orange {
  color: #f5841f;
}
.note-blue {
  color: #2e90fa;
}

/* SPLIT LAYOUTS */
.details-split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.2fr);
  gap: 16px;
}

.detail-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  border-color: var(--wo-border, #e5e7ec);
  box-shadow: var(--wo-card-shadow, 0 1px 3px rgba(16, 24, 40, 0.02));
  overflow: hidden;
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
}

.header-title-group {
  display: flex;
  align-items: center;
}

.card-header-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--wo-text-main, #172033);
}

.status-chip-subtle {
  background: var(--wo-primary-light, #f4f0fd);
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
  font-size: 10px;
}

/* PROGRESS DEEP CARD */
.status-distribution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.dist-stat {
  padding: 10px;
  border-radius: 8px;
  background: var(--wo-bg-tag, #fafbfe);
  border: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.dist-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dist-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-completed {
  background: #27ae60;
}
.dot-progress {
  background: #2e90fa;
}
.dot-hold {
  background: #f5841f;
}
.dot-pending {
  background: #98a2b3;
}

.dist-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--wo-text-muted, #63708a);
}

.dist-count {
  display: block;
  margin-top: 4px;
  font-size: 18px;
  font-weight: 800;
  color: var(--wo-text-main, #172033);
}

.multi-progress-wrapper {
  width: 100%;
}

.multi-progress-bar {
  height: 10px;
  display: flex;
  border-radius: 999px;
  overflow: hidden;
  background: var(--wo-border-subtle, #f0f2f5);
}

.seg {
  height: 100%;
  transition: width 0.4s ease;
}

.seg-completed {
  background: #27ae60;
}
.seg-progress {
  background: #2e90fa;
}
.seg-hold {
  background: #f5841f;
}
.seg-pending {
  background: #d0d5dd;
}

.effort-box {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--wo-bg-tag, #fafbfe);
  border: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.effort-row {
  display: flex;
  justify-content: space-between;
}

.effort-info {
  display: flex;
  flex-direction: column;
}

.effort-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--wo-text-muted, #63708a);
}

.effort-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
}

/* MILESTONES */
.milestones-list {
  padding: 14px 18px;
}

.milestone-item {
  display: flex;
  gap: 14px;
  position: relative;
  padding-bottom: 16px;
}

.milestone-item:last-child {
  padding-bottom: 0;
}

.milestone-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.milestone-avatar {
  border: 2px solid var(--wo-bg-card, #ffffff);
}

.avatar-completed {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}
.avatar-in-progress {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
}
.avatar-upcoming {
  background: var(--wo-border-subtle, #f0f2f5);
  color: #98a2b3;
}

.milestone-line {
  width: 2px;
  flex: 1;
  background: var(--wo-border-subtle, #f0f2f5);
  margin-top: 4px;
}

.milestone-body {
  flex: 1;
  min-width: 0;
}

.milestone-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.milestone-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
}

.milestone-chip {
  font-size: 9px;
  font-weight: 700;
  border-radius: 4px;
}

.m-chip-completed {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}
.m-chip-in-progress {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
}
.m-chip-upcoming {
  background: var(--wo-border-subtle, #f0f2f5);
  color: #98a2b3;
}

.milestone-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.milestone-progress {
  flex: 1;
}

.milestone-pct {
  font-size: 10px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
}

.milestone-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--wo-text-muted, #63708a);
}

/* TASK TABLE & TOOLBAR */
.task-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.table-title-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.add-task-btn {
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  padding: 0 16px;
  height: 36px;
}

.task-filter-bar {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1fr auto;
  gap: 10px;
  padding: 12px 18px;
  align-items: center;
  background: var(--wo-bg-tag, #fafbfe);
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.task-filter-bar :deep(.q-field__control) {
  min-height: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--wo-bg-card, #ffffff);
}

.task-filter-bar :deep(.q-field__label),
.task-filter-bar :deep(.q-field__native),
.task-filter-bar :deep(.q-field__input) {
  font-size: 11px;
}

.reset-btn {
  font-size: 11px;
}

.tasks-table :deep(th) {
  height: 42px;
  padding: 0 14px;
  background: var(--wo-bg-page, #fbfbfc);
  color: var(--wo-text-muted, #647087);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--wo-border, #e9ebef);
}

.tasks-table :deep(td) {
  height: 52px;
  padding: 0 14px;
  color: var(--wo-text-main, #3f4a60);
  font-size: 11px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.tasks-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover, #faf9ff);
}

.task-title-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 320px;
}

.priority-icon {
  margin-top: 2px;
}

.icon-critical {
  color: #e15263;
}
.icon-high {
  color: #f5841f;
}
.icon-medium {
  color: #2e90fa;
}
.icon-low {
  color: #27ae60;
}

.task-name-desc {
  display: flex;
  flex-direction: column;
}

.task-title-text {
  font-weight: 700;
  color: var(--wo-text-main, #172033);
  font-size: 12px;
}

.task-desc-text {
  font-size: 10px;
  color: var(--wo-text-subtle, #98a2b3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.task-status-chip,
.task-priority-chip {
  min-height: 22px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
}

.t-status-completed {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}
.t-status-in_progress {
  background: rgba(46, 144, 250, 0.15);
  color: #2e90fa;
}
.t-status-pending {
  background: rgba(152, 162, 179, 0.15);
  color: #667085;
}
.t-status-on_hold {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
}

.t-priority-critical {
  background: rgba(225, 82, 99, 0.15);
  color: #e15263;
}
.t-priority-high {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
}
.t-priority-medium {
  background: rgba(46, 144, 250, 0.15);
  color: #2e90fa;
}
.t-priority-low {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.assignee-avatar {
  background: var(--wo-primary-light, #f4f0fd);
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
  font-size: 10px;
}

.assignee-name {
  font-weight: 600;
  font-size: 11px;
}

.task-progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.task-linear-progress {
  width: 60px;
}

.task-progress-pct {
  font-size: 10px;
  font-weight: 700;
}

.deadline-cell {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}

.effort-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-text-muted, #63708a);
}

/* TEAM LIST */
.team-member-item {
  padding: 12px 18px;
}

.member-avatar {
  background: var(--wo-primary-light, #f4f0fd);
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
  font-size: 13px;
}

.member-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
}

.member-role {
  font-size: 10px;
  color: var(--wo-text-subtle, #98a2b3);
}

.member-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.member-tasks-pill {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
}

.member-workload-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 110px;
}

.member-cap-text {
  font-size: 9px;
  font-weight: 600;
  color: var(--wo-text-muted, #63708a);
  white-space: nowrap;
}

/* RECENT ACTIVITY */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.activity-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.activity-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.act-avatar {
  border-radius: 50%;
}

.act-complete {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}
.act-update {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
}
.act-create {
  background: rgba(46, 144, 250, 0.15);
  color: #2e90fa;
}

.act-line {
  width: 1.5px;
  flex: 1;
  background: var(--wo-border-subtle, #f0f2f5);
  margin-top: 4px;
}

.activity-item:last-child .act-line {
  display: none;
}

.activity-content-col {
  flex: 1;
}

.act-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.act-user {
  font-size: 11px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
}

.act-time {
  font-size: 10px;
  color: var(--wo-text-subtle, #98a2b3);
}

.act-message {
  margin-top: 2px;
  font-size: 11px;
  color: var(--wo-text-muted, #63708a);
  line-height: 1.4;
}

/* MODALS */
.modal-dialog {
  width: 580px;
  max-width: 95vw;
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #172033);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 10px;
}

.modal-eyebrow {
  font-size: 10px;
  font-weight: 700;
  color: var(--wo-primary, #8b6fd8);
  letter-spacing: 0.08em;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--wo-text-main, #172033);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 24px 16px;
}

.modal-form-row {
  display: flex;
  gap: 12px;
}

.form-col {
  flex: 1;
}

.modal-actions {
  padding: 12px 24px 20px;
}

/* RESPONSIVE BREAKPOINTS */
@media (max-width: 1250px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 950px) {
  .details-split-layout {
    grid-template-columns: 1fr;
  }

  .task-filter-bar {
    grid-template-columns: 1fr 1fr;
  }

  .task-search-input {
    grid-column: span 2;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .project-details-page {
    padding: 14px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .hero-meta-grid {
    grid-template-columns: 1fr;
  }

  .task-filter-bar {
    grid-template-columns: 1fr;
  }

  .task-search-input {
    grid-column: auto;
  }

  .modal-form-row {
    flex-direction: column;
  }
}
</style>
