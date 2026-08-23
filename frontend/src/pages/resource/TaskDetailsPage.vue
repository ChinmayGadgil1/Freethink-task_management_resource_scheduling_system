<template>
  <q-page class="pm-page resource-task-specs-page">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="45px" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error_outline" size="50px" color="negative" />
      <div class="text-body1 text-grey-7 q-mt-md">{{ error }}</div>

      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        label="Try Again"
        class="q-mt-md"
        @click="loadTasks"
      />
    </div>

    <!-- ALL TASKS -->
    <div v-else-if="!hasTaskId">
      <!-- 1. PAGE HEADER -->
      <div class="page-header-row task-specs-header q-mb-lg">
        <div>
          <div class="page-title">Task Specs</div>
          <div class="page-subtitle">Track, organize, and manage all your assigned task specifications.</div>
        </div>

        <div class="row items-center q-gutter-sm">
          <!-- View Mode Switcher -->
          <q-btn-toggle
            v-model="viewMode"
            toggle-color="primary"
            toggle-text-color="white"
            color="white"
            text-color="grey-8"
            dense
            rounded
            unelevated
            class="view-toggle-btn shadow-subtle q-mr-xs"
            :options="[
              { label: 'Board', value: 'board', icon: 'view_kanban' },
              { label: 'List', value: 'table', icon: 'view_list' },
            ]"
          />

          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Create Task"
            class="action-btn-primary"
            @click="openCreateDialog"
          />

          <q-btn
            outline
            no-caps
            color="grey-8"
            icon="refresh"
            label="Refresh"
            class="action-btn-outline"
            :loading="loading"
            @click="loadTasks"
          />
        </div>
      </div>

      <!-- 2. STAT SUMMARY CARDS -->
      <div class="stats-grid q-mb-md">
        <q-card flat bordered class="stat-card">
          <q-card-section class="stat-section">
            <q-avatar size="46px" class="stat-icon stat-purple">
              <q-icon name="task_alt" size="22px" />
            </q-avatar>
            <div class="stat-copy">
              <div class="stat-label">Total Tasks</div>
              <div class="stat-value">{{ tasks.length }}</div>
              <div class="stat-note stat-purple-text">All assigned tasks</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="stat-card">
          <q-card-section class="stat-section">
            <q-avatar size="46px" class="stat-icon stat-blue-bg">
              <q-icon name="autorenew" size="22px" />
            </q-avatar>
            <div class="stat-copy">
              <div class="stat-label">In Progress</div>
              <div class="stat-value">{{ tasks.filter((t) => t.status === 'IN_PROGRESS').length }}</div>
              <div class="stat-note stat-blue">Active work</div>
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
              <div class="stat-value">{{ tasks.filter((t) => t.status === 'COMPLETED').length }}</div>
              <div class="stat-note stat-green">Done</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="stat-card">
          <q-card-section class="stat-section">
            <q-avatar size="46px" class="stat-icon stat-red-bg">
              <q-icon name="warning_amber" size="22px" />
            </q-avatar>
            <div class="stat-copy">
              <div class="stat-label">Delayed</div>
              <div class="stat-value">{{ tasks.filter(isOverdue).length }}</div>
              <div class="stat-note stat-red">Need attention</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 3. FILTER TOOLBAR -->
      <q-card flat bordered class="filter-card q-mb-md">
        <q-card-section class="filter-section">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            clearable
            placeholder="Search tasks or projects..."
            class="filter-search"
          >
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>

          <q-select
            v-model="projectFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="projectOptions"
            label="Filter Project"
            class="filter-select"
          />

          <q-select
            v-model="statusFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="statusOptions"
            label="Filter Status"
            class="filter-select"
          />

          <q-select
            v-model="priorityFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="priorityOptions"
            label="Filter Priority"
            class="filter-select"
          />
        </q-card-section>
      </q-card>

      <!-- 4. KANBAN BOARD VIEW -->
      <div v-if="viewMode === 'board'" class="kanban-board-container">
        <div class="kanban-columns-grid">
          <div
            v-for="col in KANBAN_COLUMNS"
            :key="col.id"
            class="kanban-column"
            :style="{ '--col-tint': col.headerBg, '--col-border': col.borderColor }"
          >
            <!-- Column Header -->
            <div class="kanban-col-header row items-center justify-between no-wrap">
              <div class="row items-center gap-xs no-wrap">
                <span class="col-status-dot" :style="{ background: col.dotColor }" />
                <span class="col-title">{{ col.title }}</span>
                <span
                  class="col-count-pill"
                  :style="{ background: col.badgeBg, color: col.badgeColor }"
                >
                  {{ tasksByStatus[col.id]?.length || 0 }}
                </span>
              </div>
            </div>

            <!-- Column Tasks Cards List -->
            <div class="kanban-cards-wrapper">
              <div
                v-for="item in tasksByStatus[col.id]"
                :key="item.task_id"
                class="kanban-task-card cursor-pointer"
                @click="openTask(item.task_id)"
              >
                <!-- Card Top Row: Project, Priority & Self-Assigned Badges -->
                <div class="task-card-header row items-center justify-between no-wrap q-mb-xs">
                  <div class="row items-center gap-xs no-wrap ellipsis">
                    <span class="task-project-pill ellipsis" :title="item.project_name || `Project #${item.project_id}`">
                      <q-icon name="folder" size="12px" class="q-mr-xs" />
                      {{ item.project_name || `Project #${item.project_id}` }}
                    </span>

                    <span :class="['task-priority-pill', `priority-${item.priority.toLowerCase()}`]">
                      {{ item.priority }}
                    </span>

                    <q-chip
                      v-if="isSelfAssigned(item)"
                      dense
                      square
                      class="self-assigned-chip"
                    >
                      <q-icon name="person" size="11px" class="q-mr-xs" />
                      Self-assigned
                    </q-chip>
                  </div>
                </div>

                <!-- Task Title -->
                <div class="task-card-title ellipsis-2-lines" :title="item.title">
                  {{ item.title }}
                </div>

                <!-- Task Description -->
                <div v-if="item.description" class="task-card-desc ellipsis-2-lines q-mb-xs">
                  {{ item.description }}
                </div>

                <!-- Progress & Effort Bar -->
                <div class="task-progress-section q-mt-sm">
                  <div class="row items-center justify-between no-wrap text-caption q-mb-xs">
                    <span class="progress-pct font-bold">{{ Number(item.progress) || 0 }}%</span>
                    <span class="progress-effort text-grey-6">{{ item.expected_effort || 0 }}h effort</span>
                  </div>
                  <q-linear-progress
                    rounded
                    size="5px"
                    :value="(Number(item.progress) || 0) / 100"
                    :color="col.id === 'COMPLETED' ? 'positive' : 'primary'"
                    track-color="grey-3"
                    class="kanban-progress-bar"
                  />
                </div>

                <div class="card-divider q-my-sm" />

                <!-- Card Bottom Row: Deadline & Action Buttons -->
                <div class="task-card-footer row items-center justify-between no-wrap">
                  <div
                    :class="['task-deadline-tag row items-center gap-xs', { 'deadline-overdue': isTaskOverdue(item) }]"
                  >
                    <q-icon name="event" size="13px" />
                    <span>{{ item.deadline ? formatDate(item.deadline) : 'TBD' }}</span>
                  </div>

                  <div class="row items-center q-gutter-xs">
                    <q-btn
                      outline
                      no-caps
                      dense
                      color="primary"
                      size="sm"
                      label="Specs"
                      icon="article"
                      class="table-action-btn"
                      @click.stop="openTask(item.task_id)"
                    />

                    <q-btn
                      unelevated
                      no-caps
                      dense
                      color="primary"
                      size="sm"
                      label="Edit"
                      icon="edit"
                      class="table-action-btn"
                      @click.stop="openUpdateTaskDialog(item)"
                    />
                  </div>
                </div>
              </div>

              <!-- Empty State for Column -->
              <div v-if="!tasksByStatus[col.id]?.length" class="kanban-col-empty column items-center justify-center">
                <q-icon :name="col.icon" size="26px" color="grey-4" class="q-mb-xs" />
                <div class="empty-col-text">No {{ col.title.toLowerCase() }} tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. TABLE / LIST VIEW -->
      <q-card v-else flat bordered class="table-card">
        <q-table
          v-if="filteredTasks.length"
          flat
          :rows="filteredTasks"
          :columns="taskColumns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 10 }"
          class="tasks-table"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-task="props">
            <q-td :props="props" class="task-title-cell">
              <div class="row items-center gap-xs no-wrap">
                <div class="task-cell-title ellipsis">{{ props.row.title }}</div>
                <q-chip
                  v-if="isSelfAssigned(props.row)"
                  dense
                  square
                  class="self-assigned-chip"
                >
                  <q-icon name="person" size="11px" class="q-mr-xs" />
                  Self-assigned
                </q-chip>
              </div>
              <div class="task-cell-desc ellipsis">
                {{ props.row.project_name || `Project #${props.row.project_id}` }}
              </div>
            </q-td>
          </template>

          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                class="priority-chip"
                :class="`priority-${props.row.priority.toLowerCase()}`"
              >
                {{ props.row.priority }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                class="status-chip"
                :class="`status-${props.row.status.toLowerCase()}`"
              >
                {{ statusLabel(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td :props="props" class="date-cell">
              <div class="deadline-cell" :class="{ overdue: isTaskOverdue(props.row) }">
                {{ props.row.deadline ? formatDate(props.row.deadline) : 'TBD' }}
              </div>
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="progress-cell-wrapper">
                <div class="row items-center justify-between progress-label-row">
                  <span class="text-caption text-weight-medium">Progress</span>
                  <span class="text-caption text-grey-6">{{ Number(props.row.progress) }}%</span>
                </div>

                <q-linear-progress
                  :value="Number(props.row.progress) / 100"
                  rounded
                  size="6px"
                  color="primary"
                  track-color="grey-3"
                />
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" auto-width>
              <div class="row items-center q-gutter-xs no-wrap">
                <q-btn
                  outline
                  no-caps
                  dense
                  color="primary"
                  label="Specs"
                  icon="article"
                  class="table-action-btn"
                  @click.stop="openTask(props.row.task_id)"
                />

                <q-btn
                  unelevated
                  no-caps
                  dense
                  color="primary"
                  label="Edit"
                  icon="edit"
                  class="table-action-btn"
                  @click.stop="openUpdateTaskDialog(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>

        <div v-else-if="tasks.length" class="q-pa-xl text-center text-grey-6 task-empty-state">
          <q-avatar size="56px" color="blue-1" text-color="primary" icon="manage_search" />
          <div class="text-body1 text-weight-medium q-mt-md">
            No tasks match the current filters.
          </div>
          <div class="text-caption q-mt-xs">
            Clear the filters to bring back your full task list.
          </div>
        </div>

        <div v-else class="q-pa-xl text-center text-grey-6 task-empty-state">
          <q-avatar size="56px" color="grey-2" text-color="grey-6" icon="task_alt" />
          <div class="text-body1 text-weight-medium q-mt-md">No tasks assigned to you.</div>
          <div class="text-caption q-mt-xs">Your task specs will appear here once assigned.</div>
        </div>
      </q-card>
    </div>

    <!-- SINGLE TASK SPEC DETAIL VIEW -->
    <div v-else-if="task">
      <!-- Header -->
      <q-card flat bordered class="task-hero q-mb-lg">
        <q-card-section class="task-hero-section">
          <div class="row items-start justify-between q-col-gutter-lg">
            <div class="col-12 col-md-8">
              <q-btn
                flat
                no-caps
                icon="arrow_back"
                label="Back to Task Specs"
                color="grey-7"
                class="q-mb-sm task-back-btn"
                @click="router.push('/app/resource-dashboard/task-details')"
              />

              <div class="row items-center q-gutter-sm q-mb-sm">
                <q-chip dense square class="task-id-chip">#{{ task.task_id }}</q-chip>
                <q-chip
                  dense
                  square
                  :class="['status-chip', `status-${task.status.toLowerCase()}`]"
                >
                  {{ statusLabel(task.status) }}
                </q-chip>
                <q-chip
                  dense
                  square
                  class="priority-chip"
                  :class="`priority-${task.priority.toLowerCase()}`"
                >
                  {{ task.priority }}
                </q-chip>

                <q-chip
                  v-if="isSelfAssigned(task)"
                  dense
                  square
                  class="self-assigned-chip"
                >
                  <q-icon name="person" size="12px" class="q-mr-xs" />
                  Self-assigned
                </q-chip>
              </div>

              <div class="task-hero-title">
                {{ task.title }}
              </div>

              <div class="task-hero-subtitle q-mt-xs">
                {{ task.project_name || `Project #${task.project_id}` }}
              </div>

              <div class="task-hero-description q-mt-md">
                {{ task.description || 'No description provided.' }}
              </div>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="task-hero-metric">
                <q-card-section class="q-pa-md">
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="text-caption text-grey-6">Current Progress</div>
                    <div class="text-h5 text-weight-bold text-primary">
                      {{ Number(task.progress) }}%
                    </div>
                  </div>

                  <q-linear-progress
                    :value="Number(task.progress) / 100"
                    rounded
                    size="10px"
                    color="primary"
                    track-color="grey-3"
                    class="q-mt-sm"
                  />

                  <div class="row q-col-gutter-sm q-mt-md">
                    <div class="col-6">
                      <div class="metric-chip">
                        <div class="metric-label">Start</div>
                        <div class="metric-value">{{ formatDate(task.start_date) }}</div>
                      </div>
                    </div>

                    <div class="col-6">
                      <div class="metric-chip">
                        <div class="metric-label">Deadline</div>
                        <div class="metric-value">{{ formatDate(task.deadline) }}</div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <div class="row justify-end q-gutter-sm q-mt-md">
                <q-btn
                  outline
                  no-caps
                  color="primary"
                  icon="edit"
                  label="Edit Task"
                  class="task-update-btn"
                  @click="openUpdateTaskDialog(task)"
                />
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  icon="edit_note"
                  label="Add Daily Update"
                  class="task-update-btn"
                  @click="updateDialog = true"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md">
        <!-- Main -->
        <div class="col-12 col-md-8">
          <!-- Details -->
          <q-card flat bordered class="detail-card q-mb-md">
            <q-card-section class="detail-card-header row items-center justify-between">
              <div>
                <div class="text-subtitle1 text-weight-bold">Task Details</div>
                <div class="text-caption text-grey-6">Scope, dates and key task metadata.</div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="detail-card-body">
              <div class="detail-copy">
                {{ task.description || 'No description provided.' }}
              </div>

              <div class="detail-meta-grid q-mt-lg">
                <div class="detail-meta-item">
                  <div class="detail-meta-label">Status</div>
                  <q-badge :color="statusColor(task.status)" :label="statusLabel(task.status)" />
                </div>

                <div class="detail-meta-item">
                  <div class="detail-meta-label">Priority</div>
                  <q-badge :color="priorityColor(task.priority)" :label="task.priority" />
                </div>

                <div v-if="isSelfAssigned(task)" class="detail-meta-item">
                  <div class="detail-meta-label">Assignment</div>
                  <q-chip dense square class="self-assigned-chip">
                    <q-icon name="person" size="11px" class="q-mr-xs" />
                    Self-assigned
                  </q-chip>
                </div>

                <div class="detail-meta-item">
                  <div class="detail-meta-label">Start Date</div>
                  <div class="detail-meta-value">{{ formatDate(task.start_date) }}</div>
                </div>

                <div class="detail-meta-item">
                  <div class="detail-meta-label">Deadline</div>
                  <div class="detail-meta-value">{{ formatDate(task.deadline) }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Progress -->
          <q-card flat bordered class="detail-card q-mb-md">
            <q-card-section class="detail-card-header">
              <div class="row justify-between items-center">
                <div class="text-subtitle1 text-weight-bold">Progress</div>
                <div class="text-h6 text-primary text-weight-bold">
                  {{ Number(task.progress) }}%
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="detail-card-body">
              <q-linear-progress
                :value="Number(task.progress) / 100"
                rounded
                size="10px"
                color="primary"
                class="q-mt-md"
              />

              <div class="row q-col-gutter-md q-mt-md">
                <div class="col-12 col-sm-4">
                  <div class="mini-metric">
                    <div class="mini-metric-label">Estimated Effort</div>
                    <div class="mini-metric-value">{{ task.expected_effort }} hrs</div>
                  </div>
                </div>

                <div class="col-12 col-sm-4">
                  <div class="mini-metric">
                    <div class="mini-metric-label">Actual Effort</div>
                    <div class="mini-metric-value">{{ task.actual_effort }} hrs</div>
                  </div>
                </div>

                <div class="col-12 col-sm-4">
                  <div class="mini-metric">
                    <div class="mini-metric-label">Remaining</div>
                    <div class="mini-metric-value">{{ remainingHours }} hrs</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Daily updates -->
          <q-card flat bordered class="detail-card">
            <q-card-section class="detail-card-header row items-center justify-between">
              <div>
                <div class="text-subtitle1 text-weight-bold">Daily Updates</div>
                <div class="text-caption text-grey-6">
                  Track task-specific notes, blockers and progress logs.
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="detail-card-body">
              <div v-if="historyLoading" class="column items-center q-pa-xl">
                <q-spinner color="primary" size="32px" />
                <div class="text-caption text-grey-6 q-mt-sm">Loading updates...</div>
              </div>

              <q-banner v-else-if="historyError" class="bg-negative text-white" rounded>
                {{ historyError }}
                <template #action>
                  <q-btn flat no-caps label="Retry" @click="loadHistory(task.task_id)" />
                </template>
              </q-banner>

              <q-card v-else-if="workLogs.length === 0" flat bordered class="empty-state-card">
                <q-card-section class="column items-center q-pa-xl">
                  <q-avatar size="52px" color="grey-3" text-color="grey-6" icon="history" />
                  <div class="text-body2 text-grey-6 q-mt-md">
                    No daily updates recorded for this task yet.
                  </div>
                </q-card-section>
              </q-card>

              <q-list v-else bordered separator class="updates-list">
                <q-item v-for="log in workLogs" :key="log.log_id" class="update-row q-py-md">
                  <q-item-section avatar top>
                    <q-avatar class="update-avatar" icon="trending_up" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ formatHistoryDate(log.log_date) }}
                    </q-item-label>

                    <q-item-label caption class="q-mt-xs">
                      {{ Number(log.hours_logged) }}h worked · {{ Number(log.progress_logged) }}%
                      progress
                    </q-item-label>

                    <q-item-label class="q-mt-sm update-notes">
                      {{ log.notes }}
                    </q-item-label>

                    <q-item-label v-if="log.blockers" caption class="text-negative q-mt-xs">
                      <q-icon name="warning_amber" size="15px" class="q-mr-xs" />
                      {{ log.blockers }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side top>
                    <q-badge :color="statusColor(log.status)" :label="statusLabel(log.status)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- Sidebar -->
        <div class="col-12 col-md-4">
          <!-- Effort -->
          <q-card flat bordered class="detail-card q-mb-md">
            <q-card-section class="detail-card-header">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Effort</div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Estimated</span>
                <strong>{{ task.expected_effort }} hrs</strong>
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Actual</span>
                <strong>{{ task.actual_effort }} hrs</strong>
              </div>

              <q-separator class="q-my-md" />

              <div class="row justify-between">
                <span class="text-grey-6">Remaining</span>
                <strong>{{ remainingHours }} hrs</strong>
              </div>
            </q-card-section>
          </q-card>

          <!-- Information -->
          <q-card flat bordered class="detail-card">
            <q-card-section class="detail-card-header">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Task Information</div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Task ID</span>
                <strong>#{{ task.task_id }}</strong>
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Project ID</span>
                <strong>#{{ task.project_id }}</strong>
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Created</span>
                <strong>{{ formatDate(task.created_at) }}</strong>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Task ID exists but task doesn't -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="search_off" size="50px" color="grey-5" />
      <div class="text-h6 q-mt-md">Task not found</div>

      <q-btn
        flat
        no-caps
        color="primary"
        label="Back to Task Specs"
        class="q-mt-md"
        @click="router.push('/app/resource-dashboard/task-details')"
      />
    </div>

    <DailyProgressDialog v-model="updateDialog" :task="task" @save="saveDailyUpdate" />

    <UpdateTaskDialog
      v-model="updateTaskDialog"
      :task="selectedTaskForUpdate"
      @save="saveTaskSpecUpdate"
    />

    <!-- CREATE TASK DIALOG -->
    <q-dialog v-model="createDialog" persistent>
      <q-card style="width: 520px; max-width: 92vw">
        <q-card-section class="q-pb-md">
          <div class="row items-center no-wrap">
            <q-avatar size="42px" color="primary" text-color="white" icon="add_task" />

            <div class="q-ml-md">
              <div class="text-h6 text-weight-bold">Create Task</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Add a task directly from the task specs page.
              </div>
            </div>

            <q-space />

            <q-btn flat round dense icon="close" color="grey-7" @click="createDialog = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-lg">
          <div class="q-gutter-md">
            <q-select
              v-model="createForm.project_id"
              :options="projectOptionsForCreate"
              option-label="name"
              option-value="project_id"
              emit-value
              map-options
              label="Project *"
              outlined
              dense
              options-dense
              :loading="loadingCreateProjects"
            >
              <template #prepend>
                <q-icon name="folder" color="grey-7" />
              </template>
            </q-select>

            <q-input v-model="createForm.title" label="Task Title *" outlined dense>
              <template #prepend>
                <q-icon name="task" color="grey-7" />
              </template>
            </q-input>

            <q-input
              v-model="createForm.description"
              label="Description"
              type="textarea"
              outlined
              dense
              rows="3"
              autogrow
            >
              <template #prepend>
                <q-icon name="description" color="grey-7" />
              </template>
            </q-input>

            <q-select
              v-model="createForm.priority"
              :options="priorityOptions"
              label="Priority"
              outlined
              dense
              options-dense
              class="q-mb-sm"
            >
              <template #prepend>
                <q-icon name="flag" color="grey-7" />
              </template>
            </q-select>

            <div class="row q-col-gutter-md date-row">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="createForm.start_date"
                  label="Start Date"
                  type="date"
                  outlined
                  dense
                >
                  <template #prepend>
                    <q-icon name="event" color="grey-7" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input v-model="createForm.deadline" label="Deadline" type="date" outlined dense>
                  <template #prepend>
                    <q-icon name="event_available" color="grey-7" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-input
              v-model.number="createForm.expected_effort"
              label="Expected Effort (hours) *"
              type="number"
              min="0"
              step="0.5"
              outlined
              dense
            >
              <template #prepend>
                <q-icon name="schedule" color="grey-7" />
              </template>
            </q-input>

            <q-banner v-if="!canCreateTask" dense rounded class="bg-blue-1 text-primary">
              <template #avatar>
                <q-icon name="info" />
              </template>
              Project, task title and expected effort are required.
            </q-banner>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancel" color="grey-7" @click="createDialog = false" />

          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="add_task"
            label="Create Task"
            :loading="creatingTask"
            :disable="!canCreateTask"
            @click="createTask"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createWorkLogApi,
  createTaskApi,
  getProjectsApi,
  getTasksApi,
  getWorkLogsApi,
  updateTaskApi,
  type CreateWorkLogPayload,
  type Project,
  type Task,
  type WorkLog,
} from '@/services/api';

import { Notify } from 'quasar';
import { useAuthStore } from '@/stores/auth';

import type { ResourceTask } from '@/components/tasks/task-types';
import DailyProgressDialog from '@/components/tasks/DailyProgressDialog.vue';
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue';

const authStore = useAuthStore();
const viewMode = ref<'board' | 'table'>('board');

function isSelfAssigned(item: Task | null | undefined): boolean {
  if (!item || !authStore.user?.user_id) return false;
  return Number(item.created_by) === Number(authStore.user.user_id);
}

const KANBAN_COLUMNS = [
  {
    id: 'SCHEDULED',
    title: 'Scheduled',
    headerBg: '#fbf9ff',
    borderColor: '#ede9fe',
    dotColor: '#8b6fd8',
    badgeBg: 'rgba(139, 111, 216, 0.15)',
    badgeColor: '#8b6fd8',
    icon: 'schedule',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    headerBg: '#f0f7ff',
    borderColor: '#dbeafe',
    dotColor: '#2e90fa',
    badgeBg: 'rgba(46, 144, 250, 0.15)',
    badgeColor: '#2e90fa',
    icon: 'autorenew',
  },
  {
    id: 'COMPLETED',
    title: 'Completed',
    headerBg: '#f0fdf4',
    borderColor: '#dcfce7',
    dotColor: '#13ae76',
    badgeBg: 'rgba(19, 174, 118, 0.15)',
    badgeColor: '#13ae76',
    icon: 'check_circle',
  },
];

const taskColumns = [
  {
    name: 'task',
    label: 'Task',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Priority',
    field: 'priority',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: 'deadline',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'progress',
    label: 'Progress',
    field: 'progress',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right' as const,
  },
];

const route = useRoute();
const router = useRouter();

const tasks = ref<Task[]>([]);
const loading = ref(false);
const error = ref('');
const createDialog = ref(false);
const creatingTask = ref(false);
const loadingCreateProjects = ref(false);
const updateDialog = ref(false);
const updateTaskDialog = ref(false);
const workLogs = ref<WorkLog[]>([]);
const historyLoading = ref(false);
const historyError = ref('');
const selectedTaskForUpdate = ref<ResourceTask | null>(null);

const searchQuery = ref('');
const projectFilter = ref<string | null>(null);
const statusFilter = ref<Task['status'] | null>(null);
const priorityFilter = ref<Task['priority'] | null>(null);

const statusOptions: Array<{ label: string; value: Task['status'] | null }> = [
  { label: 'All Statuses', value: null },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const priorityOptions: Array<{ label: string; value: Task['priority'] | null }> = [
  { label: 'All Priorities', value: null },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const createProjects = ref<Project[]>([]);

interface CreateTaskForm {
  project_id: number | null;
  title: string;
  description: string;
  priority: Task['priority'];
  start_date: string;
  deadline: string;
  expected_effort: number;
}

const createForm = ref<CreateTaskForm>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
  expected_effort: 0,
});

const projectOptionsForCreate = computed(() => createProjects.value);

const hasTaskId = computed(() => Boolean(route.params.id));

const taskId = computed(() => Number(route.params.id));

const task = computed<Task | null>(() => {
  if (!hasTaskId.value) return null;

  return tasks.value.find((item) => item.task_id === taskId.value) ?? null;
});

const projectOptions = computed(() => {
  const uniqueProjects = new Set(
    tasks.value.map((item) => item.project_name || `Project #${item.project_id}`),
  );

  return [...uniqueProjects].sort();
});

const filteredTasks = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();

  return tasks.value.filter((item) => {
    const projectName = item.project_name || `Project #${item.project_id}`;

    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);

    const matchesProject = !projectFilter.value || projectName === projectFilter.value;

    const matchesStatus = !statusFilter.value || item.status === statusFilter.value;

    const matchesPriority = !priorityFilter.value || item.priority === priorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

const tasksByStatus = computed(() => {
  const map: Record<string, Task[]> = {
    SCHEDULED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  };

  filteredTasks.value.forEach((item) => {
    const s = item.status && (item.status in map) ? item.status : 'SCHEDULED';
    const arr = map[s];
    if (arr) {
      arr.push(item);
    }
  });

  return map;
});

function isOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || !task.deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(task.deadline) < today;
}

function isTaskOverdue(task: Task) {
  return isOverdue(task);
}

const canCreateTask = computed(() => {
  return (
    createForm.value.project_id !== null &&
    createForm.value.title.trim().length > 0 &&
    Number(createForm.value.expected_effort) > 0
  );
});

function resetCreateForm() {
  createForm.value = {
    project_id: null,
    title: '',
    description: '',
    priority: 'MEDIUM',
    start_date: '',
    deadline: '',
    expected_effort: 0,
  };
}

async function openCreateDialog() {
  createDialog.value = true;

  if (createProjects.value.length === 0) {
    await loadCreateProjects();
  }
}

async function loadCreateProjects() {
  loadingCreateProjects.value = true;

  try {
    createProjects.value = await getProjectsApi();
  } catch (err) {
    console.error('Failed to load resource projects:', err);

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to load projects.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    loadingCreateProjects.value = false;
  }
}

async function createTask() {
  if (!canCreateTask.value) {
    return;
  }

  const projectId = createForm.value.project_id;

  if (projectId === null) {
    return;
  }

  creatingTask.value = true;

  try {
    await createTaskApi({
      project_id: projectId,
      title: createForm.value.title.trim(),
      description: createForm.value.description.trim(),
      priority: createForm.value.priority,
      start_date: createForm.value.start_date || null,
      deadline: createForm.value.deadline || null,
      expected_effort: Number(createForm.value.expected_effort),
    });

    createDialog.value = false;
    resetCreateForm();

    await loadTasks();

    Notify.create({
      type: 'positive',
      message: 'Task created successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error('Failed to create task:', err);

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to create task.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    creatingTask.value = false;
  }
}

const remainingHours = computed(() => {
  if (!task.value) return 0;

  return Math.max(Number(task.value.expected_effort) - Number(task.value.actual_effort), 0).toFixed(
    1,
  );
});

watch(taskId, (id) => {
  if (!id) {
    workLogs.value = [];
    historyError.value = '';

    return;
  }

  if (task.value) {
    void loadHistory(id);
  }
});

async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    tasks.value = await getTasksApi();

    if (task.value) {
      await loadHistory(task.value.task_id);
    } else if (hasTaskId.value) {
      workLogs.value = [];
      historyError.value = '';
    }
  } catch (err) {
    console.error(err);

    error.value = err instanceof Error ? err.message : 'Failed to load tasks.';
  } finally {
    loading.value = false;
  }
}

function openTask(id: number) {
  void router.push(`/app/resource-dashboard/task-details/${id}`);
}

function mapToResourceTask(item: Task): ResourceTask {
  return {
    id: item.task_id,
    name: item.title,
    project: item.project_name || `Project #${item.project_id}`,
    priority: item.priority,
    status: item.status,
    progress: Number(item.progress) || 0,
    deadline: item.deadline,
    startDate: item.start_date,
    hoursWorked: Number(item.actual_effort) || 0,
    estimatedHours: Number(item.expected_effort) || 0,
    workUpdate: '',
    description: item.description || '',
  };
}

function openUpdateTaskDialog(item: Task) {
  selectedTaskForUpdate.value = mapToResourceTask(item);
  updateTaskDialog.value = true;
}

async function saveTaskSpecUpdate(payload: {
  id: number;
  status: ResourceTask['status'];
  progress: number;
  hoursWorked: number;
  workUpdate: string;
  description: string;
}) {
  const existing = tasks.value.find((item) => item.task_id === payload.id);

  if (!existing && (!task.value || task.value.task_id !== payload.id)) {
    return;
  }

  try {
    const updated = await updateTaskApi(payload.id, {
      status: payload.status,
      progress: payload.progress,
      actual_effort: payload.hoursWorked,
      description: payload.description,
    });

    const index = tasks.value.findIndex((item) => item.task_id === updated.task_id);

    if (index !== -1) {
      const prev = tasks.value[index];
      const projName = updated.project_name || prev?.project_name;
      tasks.value[index] = {
        ...prev,
        ...updated,
        ...(projName ? { project_name: projName } : {}),
      };
    }

    updateTaskDialog.value = false;

    Notify.create({
      type: 'positive',
      message: 'Task updated successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error('Failed to update task:', err);

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to update task.',
      icon: 'error',
      position: 'top-right',
    });
  }
}

async function loadHistory(currentTaskId: number) {
  historyLoading.value = true;
  historyError.value = '';

  try {
    workLogs.value = await getWorkLogsApi(currentTaskId);
  } catch (err) {
    console.error('Failed to load task history:', err);

    historyError.value = err instanceof Error ? err.message : 'Failed to load task history.';
  } finally {
    historyLoading.value = false;
  }
}

async function saveDailyUpdate(payload: CreateWorkLogPayload) {
  if (!task.value) return;

  const currentTaskId = task.value.task_id;

  try {
    await createWorkLogApi(currentTaskId, payload);

    await loadTasks();

    await loadHistory(currentTaskId);

    updateDialog.value = false;
  } catch (err) {
    console.error(err);

    error.value = err instanceof Error ? err.message : 'Failed to submit daily progress.';
  }
}

function formatHistoryDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: Task['status']) {
  return {
    UNASSIGNED: 'Unassigned',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  }[status] || status;
}

function statusColor(status: Task['status']) {
  return {
    UNASSIGNED: 'grey-7',
    SCHEDULED: 'purple-7',
    IN_PROGRESS: 'blue-7',
    COMPLETED: 'positive',
  }[status] || 'grey-7';
}

function priorityColor(priority: Task['priority']) {
  return {
    LOW: 'positive',
    MEDIUM: 'orange',
    HIGH: 'deep-orange',
    CRITICAL: 'negative',
  }[priority];
}

onMounted(() => {
  void loadTasks();
});
</script>

<style scoped lang="scss">
.resource-task-specs-page {
  color: var(--wo-text-main);
  padding: 20px 28px 36px;
  background: var(--wo-bg-page, #f8f9fa);
  min-height: 100vh;
}

.task-specs-header {
  align-items: flex-end;
}

.view-toggle-btn {
  border: 1px solid var(--wo-border, #e2e8f0);
  background: var(--wo-bg-card, #ffffff);

  :deep(.q-btn) {
    font-size: 11.5px;
    font-weight: 600;
    padding: 4px 12px;
  }
}

.self-assigned-chip {
  background: rgba(139, 111, 216, 0.15) !important;
  color: var(--wo-primary, #8b6fd8) !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  border-radius: 6px !important;
}

/* Filter Card */
.filter-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
}

.filter-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 10px 14px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.filter-section :deep(.q-field__control) {
  min-height: 38px;
  border-radius: 8px;
}

.filter-section :deep(.q-field__label),
.filter-section :deep(.q-field__native),
.filter-section :deep(.q-field__input) {
  font-size: 12px;
}

/* Kanban Board Layout */
.kanban-board-container {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-columns-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(300px, 1fr));
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 290px);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.kanban-column {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--col-border, var(--wo-border, #e5e7ec));
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s ease;
}

.kanban-col-header {
  padding: 12px 14px;
  background: var(--col-tint, #f8fafc);
  border-bottom: 1px solid var(--col-border, var(--wo-border, #e5e7ec));
}

.col-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.col-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
  letter-spacing: -0.01em;
}

.col-count-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  margin-left: 4px;
}

.kanban-cards-wrapper {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 440px;
  max-height: calc(100vh - 330px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 4px;
  }
}

.kanban-task-card {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e6e9f0);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 24, 40, 0.08);
    border-color: rgba(139, 111, 216, 0.35);
  }
}

.task-project-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-primary, #8b6fd8);
  background: rgba(139, 111, 216, 0.12);
  padding: 2px 7px;
  border-radius: 6px;
  max-width: 160px;
}

.task-priority-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  &.priority-low {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #dbeafe;
  }

  &.priority-medium {
    background: #f5f3ff;
    color: #6d28d9;
    border: 1px solid #ede9fe;
  }

  &.priority-high {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #ffedd5;
  }

  &.priority-critical {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fee2e2;
  }
}

.task-card-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--wo-text-main, #1e293b);
  line-height: 1.35;
  margin-bottom: 4px;
}

.task-card-desc {
  font-size: 12px;
  color: var(--wo-text-muted, #64748b);
  line-height: 1.4;
}

.kanban-progress-bar {
  border-radius: 4px;
}

.progress-pct {
  font-size: 11.5px;
  color: var(--wo-text-main, #1e293b);
}

.progress-effort {
  font-size: 11px;
}

.card-divider {
  height: 1px;
  background: var(--wo-border-subtle, #f1f3f7);
}

.task-deadline-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
  background: var(--wo-bg-tag, #f1f5f9);
  padding: 2px 7px;
  border-radius: 6px;

  &.deadline-overdue {
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fee2e2;
  }
}

.kanban-col-empty {
  min-height: 200px;
  border: 1.5px dashed var(--wo-border, #e2e8f0);
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.5);
  margin-top: 8px;
}

.empty-col-text {
  font-size: 12px;
  color: var(--wo-text-muted, #94a3b8);
  font-weight: 500;
}

/* Table Card & View */
.table-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  overflow: hidden;
}

.tasks-table :deep(th) {
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

.tasks-table :deep(td) {
  height: 52px;
  padding: 8px 14px;
  color: var(--wo-text-main, #334155);
  font-size: 12.5px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.tasks-table :deep(tbody tr:hover) {
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

.progress-cell-wrapper {
  min-width: 140px;
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

.deadline-cell.overdue {
  color: #ef4444;
  font-weight: 700;
}

.table-action-btn {
  border-radius: 8px;
  font-weight: 600;
}

/* Priority & Status Chips */
.priority-chip,
.status-chip {
  min-height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
}

.priority-low {
  background: #eaf7f0;
  color: #27ae60;
}

.priority-medium {
  background: #fff4e8;
  color: #e89532;
}

.priority-high {
  background: #fff0eb;
  color: #e56b45;
}

.priority-critical {
  background: #fdeef0;
  color: #e15263;
}

.status-unassigned {
  background: #f0f2f5;
  color: #667085;
}

.status-scheduled {
  background: #f3eefc;
  color: #8b6fd8;
}

.status-in_progress {
  background: #eaf1fd;
  color: #2e90fa;
}

.status-completed {
  background: #eaf7f0;
  color: #27ae60;
}

/* Detail Card & Hero */
.task-hero {
  border: 1px solid rgba(139, 111, 216, 0.14);
  background:
    radial-gradient(circle at top right, rgba(139, 111, 216, 0.1), transparent 35%),
    linear-gradient(180deg, #ffffff 0%, #fbfaff 100%);
  border-radius: 16px;
  box-shadow: var(--wo-card-shadow);
  overflow: hidden;
}

.task-hero-section {
  padding: 24px;
}

.task-back-btn {
  margin-left: -10px;
}

.task-hero-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--wo-text-main);
}

.task-hero-subtitle {
  color: var(--wo-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.task-hero-description {
  color: var(--wo-text-main);
  font-size: 14px;
  line-height: 1.7;
  max-width: 64ch;
}

.task-hero-metric {
  border-color: var(--wo-border);
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(6px);
  border-radius: 14px;
}

.detail-card {
  border-radius: 16px;
  background: var(--wo-bg-card);
  box-shadow: var(--wo-card-shadow);
  border: 1px solid var(--wo-border, #e5e7ec);
}

.detail-card-header,
.detail-card-body {
  padding: 18px;
}

.detail-copy {
  color: var(--wo-text-main);
  font-size: 14px;
  line-height: 1.7;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-meta-item {
  padding: 12px;
  border-radius: 12px;
  background: #f8f9fc;
  border: 1px solid var(--wo-border-subtle);
}

.detail-meta-label,
.metric-label,
.mini-metric-label {
  color: var(--wo-text-subtle);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-meta-value,
.metric-value,
.mini-metric-value {
  margin-top: 4px;
  color: var(--wo-text-main);
  font-size: 12px;
  font-weight: 700;
}

.metric-chip,
.mini-metric {
  height: 100%;
  border-radius: 12px;
  background: #f8f9fc;
  border: 1px solid var(--wo-border-subtle);
  padding: 10px 12px;
}

.updates-list {
  border-radius: 14px;
  overflow: hidden;
}

.update-row {
  transition: background-color 0.15s ease;
}

.update-row:hover {
  background: var(--wo-bg-card-hover);
}

.update-avatar {
  background: rgba(139, 111, 216, 0.12);
  color: var(--wo-primary);
}

.update-notes {
  color: var(--wo-text-main);
  white-space: pre-wrap;
}

.empty-state-card {
  background: #fafbff;
  border-color: var(--wo-border-subtle);
}

.task-empty-state {
  background: linear-gradient(180deg, rgba(139, 111, 216, 0.03), rgba(139, 111, 216, 0));
}

.task-update-btn {
  border-radius: 10px;
  font-weight: 700;
}

.task-id-chip {
  background: var(--wo-primary-light);
  color: var(--wo-primary-dark);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
</style>
