<template>
  <q-page class="pm-page tasks-page">
    <!-- 1. PAGE HEADER -->
    <div class="page-header-row">
      <div class="header-left">
        <div class="page-title">Tasks</div>
        <div class="page-subtitle">Track, organize, and manage work across all your active projects</div>
      </div>
      <div class="header-actions row items-center q-gutter-sm">
        <!-- View Mode Switcher: Board / Table -->
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
          icon="add"
          label="New Task"
          class="action-btn-primary"
          @click="showCreateDialog = true"
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
      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-purple">
            <q-icon name="task_alt" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Total Tasks</div>
            <div class="stat-value">{{ tasks.length }}</div>
            <div class="stat-note stat-purple-text">All managed tasks</div>
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
            <div class="stat-value">{{ inProgressCount }}</div>
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
            <div class="stat-value">{{ completedCount }}</div>
            <div class="stat-note stat-green">Done</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="46px" class="stat-icon stat-purple">
            <q-icon name="schedule" size="22px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Scheduled / Queued</div>
            <div class="stat-value">{{ scheduledCount }}</div>
            <div class="stat-note stat-purple-text">Ready to start</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 3. FILTER BAR -->
    <q-card flat bordered class="filter-card q-mb-md">
      <q-card-section class="filter-section">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          clearable
          placeholder="Search by title or description..."
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
          emit-value
          map-options
          :options="projectFilterOptions"
          label="Filter Project"
          class="filter-select"
        />

        <q-select
          v-model="statusFilter"
          outlined
          dense
          emit-value
          map-options
          :options="statusFilterOptions"
          label="Filter Status"
          class="filter-select"
        />

        <q-select
          v-model="priorityFilter"
          outlined
          dense
          emit-value
          map-options
          :options="priorityFilterOptions"
          label="Filter Priority"
          class="filter-select"
        />
      </q-card-section>
    </q-card>

    <!-- LOADING STATE -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="44px" />
    </div>

    <!-- 4. KANBAN TASK BOARD VIEW -->
    <div v-else-if="viewMode === 'board'" class="kanban-board-container">
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

            <q-btn
              flat
              round
              dense
              icon="add"
              size="sm"
              class="col-add-btn"
              title="Add task in this column"
              @click="quickCreateInColumn(col.id)"
            >
              <q-tooltip>Add {{ col.title }} Task</q-tooltip>
            </q-btn>
          </div>

          <!-- Column Tasks Cards List -->
          <div class="kanban-cards-wrapper">
            <div
              v-for="task in tasksByStatus[col.id]"
              :key="task.task_id"
              class="kanban-task-card cursor-pointer"
              @click="openTaskDetails(task)"
            >
              <!-- Card Top Row: Badges & 3-Dot Actions -->
              <div class="task-card-header row items-center justify-between no-wrap q-mb-xs">
                <div class="row items-center gap-xs no-wrap ellipsis">
                  <!-- Project Badge -->
                  <span class="task-project-pill ellipsis" :title="getProjectName(task.project_id)">
                    <q-icon name="folder" size="12px" class="q-mr-xs" />
                    {{ getProjectName(task.project_id) }}
                  </span>

                  <!-- Priority Badge -->
                  <span :class="['task-priority-pill', `priority-${task.priority.toLowerCase()}`]">
                    {{ task.priority }}
                  </span>
                </div>

                <!-- 3-Dot Action Menu -->
                <q-btn
                  flat
                  round
                  dense
                  icon="more_vert"
                  size="sm"
                  color="grey-7"
                  class="task-more-btn"
                  @click.stop
                >
                  <q-menu auto-close anchor="bottom right" self="top right" class="task-action-menu">
                    <q-list dense style="min-width: 170px">
                      <q-item clickable @click="openEditModal(task)">
                        <q-item-section avatar>
                          <q-icon name="edit" size="16px" color="grey-8" />
                        </q-item-section>
                        <q-item-section>Edit Details</q-item-section>
                      </q-item>

                      <q-item clickable @click="openAssignTaskMemberDialog(task.task_id)">
                        <q-item-section avatar>
                          <q-icon name="person_add" size="16px" color="primary" />
                        </q-item-section>
                        <q-item-section>Assign Member</q-item-section>
                      </q-item>

                      <q-item clickable @click="openDependencyDialog(task)">
                        <q-item-section avatar>
                          <q-icon name="account_tree" size="16px" color="teal" />
                        </q-item-section>
                        <q-item-section>Add Dependency</q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item clickable class="text-negative" @click="confirmDeleteTask(task)">
                        <q-item-section avatar>
                          <q-icon name="delete" size="16px" color="negative" />
                        </q-item-section>
                        <q-item-section>Delete Task</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <!-- Task Title -->
              <div class="task-card-title ellipsis-2-lines" :title="task.title">
                {{ task.title }}
              </div>

              <!-- Task Description (if any) -->
              <div v-if="task.description" class="task-card-desc ellipsis-2-lines">
                {{ task.description }}
              </div>

              <!-- Progress & Effort Bar -->
              <div class="task-progress-section q-mt-sm">
                <div class="row items-center justify-between no-wrap text-caption q-mb-xs">
                  <span class="progress-pct font-bold">{{ Number(task.progress) || 0 }}%</span>
                  <span class="progress-effort text-grey-6">{{ task.expected_effort || 8 }}h effort</span>
                </div>
                <q-linear-progress
                  rounded
                  size="5px"
                  :value="(Number(task.progress) || 0) / 100"
                  :color="col.id === 'COMPLETED' ? 'positive' : 'primary'"
                  track-color="grey-3"
                  class="kanban-progress-bar"
                />
              </div>

              <div class="card-divider q-my-sm" />

              <!-- Card Bottom Row: Assigned Resources & Deadline -->
              <div class="task-card-footer row items-center justify-between no-wrap">
                <!-- Assigned Resources -->
                <div class="task-resources-wrap row items-center gap-xs">
                  <template v-if="task.assigned_resource_ids && task.assigned_resource_ids.length > 0">
                    <div class="avatar-stack row items-center">
                      <q-avatar
                        v-for="rId in task.assigned_resource_ids.slice(0, 3)"
                        :key="rId"
                        size="22px"
                        class="stack-avatar cursor-pointer"
                        @click.stop="confirmUnassignResource(task, rId)"
                      >
                        <span>{{ getResourceName(rId).charAt(0).toUpperCase() }}</span>
                        <q-tooltip>{{ getResourceName(rId) }} (Click to unassign)</q-tooltip>
                      </q-avatar>

                      <q-avatar
                        v-if="task.assigned_resource_ids.length > 3"
                        size="22px"
                        class="stack-avatar stack-more"
                      >
                        <span>+{{ task.assigned_resource_ids.length - 3 }}</span>
                        <q-tooltip>
                          {{ task.assigned_resource_ids.length - 3 }} more assigned
                        </q-tooltip>
                      </q-avatar>
                    </div>
                  </template>
                  <span
                    v-else
                    class="unassigned-btn cursor-pointer"
                    @click.stop="openAssignTaskMemberDialog(task.task_id)"
                  >
                    <q-icon name="person_add" size="13px" class="q-mr-xs" />
                    Assign
                  </span>
                </div>

                <!-- Deadline Badge -->
                <div
                  :class="['task-deadline-tag row items-center gap-xs', { 'deadline-overdue': isTaskOverdue(task) }]"
                  :title="task.deadline ? `Due on ${formatDate(task.deadline)}` : 'No deadline set'"
                >
                  <q-icon name="event" size="13px" />
                  <span>{{ task.deadline ? formatDate(task.deadline) : 'TBD' }}</span>
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

    <!-- 5. TABLE / LIST VIEW (Fallback & Detail View) -->
    <q-card v-else flat bordered class="table-card">
      <q-table
        flat
        :rows="filteredTasks"
        :columns="tableColumns"
        row-key="task_id"
        no-data-label="No tasks found matching criteria"
        :pagination="{ rowsPerPage: 10 }"
        class="tasks-table"
        @row-click="(_evt, row) => openTaskDetails(row)"
      >
        <template #body-cell-title="props">
          <q-td :props="props" class="task-title-cell">
            <div class="task-cell-title ellipsis">{{ props.row.title }}</div>
            <div v-if="props.row.description" class="task-cell-desc ellipsis">
              {{ props.row.description }}
            </div>
          </q-td>
        </template>

        <template #body-cell-project="props">
          <q-td :props="props">
            <q-chip dense square class="project-badge">
              <q-icon name="folder" size="13px" class="q-mr-xs" />
              {{ getProjectName(props.row.project_id) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-resources="props">
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
                removable
                class="resource-chip"
                @click.stop
                @remove="confirmUnassignResource(props.row, rId)"
              >
                <q-avatar size="16px" class="avatar-purple q-mr-xs">
                  {{ getResourceName(rId).charAt(0).toUpperCase() }}
                </q-avatar>
                {{ getResourceName(rId) }}
                <q-tooltip>Click X to unassign this resource</q-tooltip>
              </q-chip>
            </div>
            <span v-else class="text-caption text-grey-5">Unassigned</span>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip dense square :class="['status-chip', getTaskStatusClass(props.row.status)]">
              {{ formatStatus(props.row.status) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-priority="props">
          <q-td :props="props">
            <q-chip dense square :class="['priority-chip', getPriorityClass(props.row.priority)]">
              {{ props.row.priority }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-progress="props">
          <q-td :props="props">
            <div class="progress-cell-wrapper">
              <div class="row justify-between text-caption progress-label-row">
                <span class="text-weight-bold">{{ props.row.progress || 0 }}%</span>
                <span class="text-grey-6">{{ props.row.expected_effort || 0 }}h</span>
              </div>
              <q-linear-progress
                rounded
                size="5px"
                :value="(Number(props.row.progress) || 0) / 100"
                color="primary"
                track-color="grey-3"
                class="task-progress-bar"
              />
            </div>
          </q-td>
        </template>

        <template #body-cell-deadline="props">
          <q-td :props="props" class="date-cell">
            {{ props.row.deadline ? formatDate(props.row.deadline) : 'TBD' }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" auto-width @click.stop>
            <div class="row items-center justify-center q-gutter-xs no-wrap">
              <q-btn
                flat
                round
                dense
                icon="person_add"
                color="deep-purple-5"
                @click="openAssignTaskMemberDialog(props.row.task_id)"
              >
                <q-tooltip>Assign Member to Task</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="account_tree"
                color="primary"
                @click="openDependencyDialog(props.row)"
              >
                <q-tooltip>Add Task Dependency</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" color="grey-7" @click="openEditModal(props.row)">
                <q-tooltip>Edit Task Details</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDeleteTask(props.row)"
              >
                <q-tooltip>Delete Task</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- TASK DETAILS POPUP DIALOG -->
    <q-dialog v-model="showTaskDetailsDialog">
      <q-card v-if="selectedTaskDetails" class="details-popup-card" style="min-width: 480px; max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center gap-xs">
            <q-chip dense square :class="['priority-chip', getPriorityClass(selectedTaskDetails.priority)]">
              {{ selectedTaskDetails.priority }}
            </q-chip>
            <q-chip dense square :class="['status-chip', getTaskStatusClass(selectedTaskDetails.status)]">
              {{ formatStatus(selectedTaskDetails.status) }}
            </q-chip>
            <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 11px">
              #{{ selectedTaskDetails.task_id }}
            </q-chip>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="popup-title text-h6 text-weight-bold text-dark">
            {{ selectedTaskDetails.title }}
          </div>
          <div class="popup-project-row row items-center gap-xs q-mt-xs">
            <q-icon name="folder" size="14px" color="primary" />
            <span class="text-weight-bold text-primary">
              {{ getProjectName(selectedTaskDetails.project_id) }}
            </span>
          </div>

          <div class="popup-description q-mt-sm text-body2 text-grey-8">
            {{ selectedTaskDetails.description || 'No description provided.' }}
          </div>

          <q-separator class="q-my-md" />

          <!-- Details Grid -->
          <div class="popup-details-grid">
            <div class="detail-item">
              <div class="detail-label">Start Date</div>
              <div class="detail-val">{{ formatDate(selectedTaskDetails.start_date) }}</div>
            </div>

            <div class="detail-item">
              <div class="detail-label">Deadline</div>
              <div
                class="detail-val"
                :class="{ 'text-negative font-bold': isTaskOverdue(selectedTaskDetails) }"
              >
                {{ formatDate(selectedTaskDetails.deadline) }}
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-label">Expected Effort</div>
              <div class="detail-val">{{ selectedTaskDetails.expected_effort || 8 }} Hours</div>
            </div>

            <div class="detail-item">
              <div class="detail-label">Actual Effort</div>
              <div class="detail-val">{{ selectedTaskDetails.actual_effort || 0 }} Hours</div>
            </div>
          </div>

          <!-- Progress Section -->
          <div class="q-mt-md">
            <div class="row items-center justify-between text-caption q-mb-xs">
              <span class="detail-label">Progress</span>
              <span class="text-weight-bold text-primary">{{ Number(selectedTaskDetails.progress) || 0 }}%</span>
            </div>
            <q-linear-progress
              rounded
              size="7px"
              :value="(Number(selectedTaskDetails.progress) || 0) / 100"
              :color="selectedTaskDetails.status === 'COMPLETED' ? 'positive' : 'primary'"
              track-color="grey-3"
            />
          </div>

          <!-- Assignees List in Popup -->
          <div class="popup-assignees-block q-mt-md">
            <div class="row items-center justify-between q-mb-xs">
              <div class="detail-label">Assigned Team Members</div>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                icon="person_add"
                label="Assign Member"
                @click="openAssignFromDetails"
              />
            </div>
            <div
              v-if="selectedTaskDetails.assigned_resource_ids && selectedTaskDetails.assigned_resource_ids.length > 0"
              class="row q-gutter-xs wrap"
            >
              <q-chip
                v-for="rId in selectedTaskDetails.assigned_resource_ids"
                :key="rId"
                dense
                square
                removable
                class="resource-chip"
                @remove="unassignFromDetails(rId)"
              >
                <q-avatar size="18px" class="avatar-purple q-mr-xs">
                  {{ getResourceName(rId).charAt(0).toUpperCase() }}
                </q-avatar>
                {{ getResourceName(rId) }}
                <q-tooltip>Click X to unassign {{ getResourceName(rId) }}</q-tooltip>
              </q-chip>
            </div>
            <span v-else class="text-caption text-grey-5">No members currently assigned</span>
          </div>

          <!-- Dependencies in Popup -->
          <div class="popup-dependencies-block q-mt-md">
            <div class="row items-center justify-between q-mb-xs">
              <div class="detail-label">Dependencies (Predecessors)</div>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                color="teal"
                icon="account_tree"
                label="Add Dependency"
                @click="openDependencyFromDetails"
              />
            </div>
            <div
              v-if="selectedTaskDetails.predecessor_task_ids && selectedTaskDetails.predecessor_task_ids.length > 0"
              class="row q-gutter-xs wrap"
            >
              <q-chip
                v-for="pId in selectedTaskDetails.predecessor_task_ids"
                :key="pId"
                dense
                square
                color="teal-1"
                text-color="teal-9"
                style="font-size: 11px"
              >
                <q-icon name="account_tree" size="13px" class="q-mr-xs" color="teal" />
                {{ getTaskTitle(pId) }} (#{{ pId }})
              </q-chip>
            </div>
            <span v-else class="text-caption text-grey-5">No predecessor dependencies</span>
          </div>
        </q-card-section>

        <q-separator class="q-mt-md" />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Close" color="grey-7" v-close-popup class="text-weight-medium" />
          <q-btn
            unelevated
            no-caps
            icon="edit"
            label="Edit Task"
            color="primary"
            class="action-btn-primary"
            @click="openEditFromDetails"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 6. ASSIGN MEMBER TO TASK DIALOG (POST /api/tasks/:id/assign) -->
    <q-dialog v-model="showAssignTaskMemberDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1 text-weight-bold text-dark">Assign Member to Task</div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignTaskMember">
          <q-card-section class="q-gutter-md q-pt-md">
            <q-select
              v-model="assignTaskMemberForm.task_id"
              outlined
              dense
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
              :display-value="
                assignTaskMemberForm.user_ids.length
                  ? `${assignTaskMemberForm.user_ids.length} selected`
                  : ''
              "
              label="Select Member(s)"
              :options="resourceMemberSelectOptions"
              emit-value
              map-options
              :rules="[(val) => (val && val.length > 0) || 'At least one member is required']"
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" :disable="opt.alreadyAssigned">
                  <q-item-section side>
                    <q-checkbox
                      :model-value="selected || opt.alreadyAssigned"
                      :disable="opt.alreadyAssigned"
                      color="primary"
                      @update:model-value="toggleOption(opt)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label :class="{ 'text-grey-6': opt.alreadyAssigned }">
                      {{ opt.label }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section v-if="opt.alreadyAssigned" side>
                    <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 10px">
                      <q-icon name="check" size="13px" class="q-mr-xs" color="positive" />
                      Already Assigned
                    </q-chip>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
              label="Assign to Task"
              class="action-btn-primary"
              :loading="submittingTaskMember"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 7. ADD TASK DEPENDENCY DIALOG -->
    <q-dialog v-model="showDependencyDialog">
      <q-card class="dialog-card" style="max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">Add Task Dependency</div>
            <div class="text-caption text-grey-7">
              The selected task will depend on the predecessor.
            </div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAddDependency">
          <q-card-section class="q-gutter-md q-pt-md">
            <q-select
              v-model="selectedDependencyTaskId"
              outlined
              dense
              label="Task"
              :options="taskSelectOptions"
              emit-value
              map-options
              :rules="[(value) => !!value || 'Task is required']"
            />

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
              :options="dependencyPredecessorOptions"
              emit-value
              map-options
              :rules="[
                (val) => (val && val.length > 0) || 'At least one predecessor task is required',
              ]"
              :disable="!selectedDependencyTaskId"
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
              label="Add Dependency"
              class="action-btn-primary"
              :loading="submittingDependency"
              :disable="!selectedDependencyTaskId || !selectedPredecessorTaskIds?.length"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 8. CREATE TASK DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="dialog-card" style="min-width: 520px; max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1 text-weight-bold text-dark">Create New Task</div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleCreateTask">
          <q-card-section class="q-gutter-md q-pt-md">
            <q-select
              v-model="createForm.project_id"
              outlined
              dense
              label="Project"
              :options="projectSelectOptions"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Project is required']"
            />

            <q-input
              v-model="createForm.title"
              outlined
              dense
              label="Task Title"
              :rules="[(val) => !!val.trim() || 'Title is required']"
            />

            <q-input
              v-model="createForm.description"
              outlined
              dense
              type="textarea"
              label="Description"
              autogrow
            />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="createForm.priority"
                  outlined
                  dense
                  label="Priority"
                  :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="createForm.expected_effort"
                  outlined
                  dense
                  type="number"
                  label="Effort (Hours)"
                  :rules="[(val) => Number(val) > 0 || 'Effort must be positive']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="createForm.start_date"
                  outlined
                  dense
                  type="date"
                  label="Start Date"
                  stack-label
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="createForm.deadline"
                  outlined
                  dense
                  type="date"
                  label="Deadline"
                  stack-label
                />
              </div>
            </div>

            <!-- Assign Members Field -->
            <q-select
              v-model="createForm.assigned_resource_ids"
              outlined
              dense
              multiple
              clearable
              :display-value="
                createForm.assigned_resource_ids.length
                  ? `${createForm.assigned_resource_ids.length} member(s) selected`
                  : ''
              "
              label="Assign Member(s) (Optional)"
              :options="createMemberOptions"
              emit-value
              map-options
              :disable="!createForm.project_id"
              :hint="
                !createForm.project_id
                  ? 'Select a project first to assign members'
                  : createForm.assigned_resource_ids.length
                    ? 'Task will be created as SCHEDULED'
                    : 'No members selected — task will be created as UNASSIGNED'
              "
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps">
                  <q-item-section side>
                    <q-checkbox :model-value="selected" color="primary" @update:model-value="toggleOption(opt)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Dependencies Field -->
            <q-select
              v-model="createForm.predecessor_task_ids"
              outlined
              dense
              multiple
              clearable
              :display-value="
                createForm.predecessor_task_ids.length
                  ? `${createForm.predecessor_task_ids.length} dependency/dependencies selected`
                  : ''
              "
              label="Predecessor Dependencies (Optional)"
              :options="createPredecessorOptions"
              emit-value
              map-options
              :disable="!createForm.project_id"
              :hint="
                !createForm.project_id
                  ? 'Select a project first to choose dependencies'
                  : 'Select tasks that must be completed before this task'
              "
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps">
                  <q-item-section side>
                    <q-checkbox :model-value="selected" color="primary" @update:model-value="toggleOption(opt)" />
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="account_tree" color="primary" size="18px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
              label="Create Task"
              class="action-btn-primary"
              :loading="submitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 9. EDIT TASK DIALOG -->
    <q-dialog v-model="showEditDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1 text-weight-bold text-dark">
            Update Task #{{ editingTaskId }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleUpdateTask">
          <q-card-section class="q-gutter-md q-pt-md">
            <q-input
              v-model="editForm.title"
              outlined
              dense
              label="Task Title"
              :rules="[(val) => !!val.trim() || 'Title is required']"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="editForm.status"
                  outlined
                  dense
                  label="Status"
                  :options="['UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']"
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
              <div class="col-6">
                <q-input
                  v-model.number="editForm.progress"
                  outlined
                  dense
                  type="number"
                  label="Progress (%)"
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
              <div class="col-6">
                <q-input
                  v-model="editForm.start_date"
                  outlined
                  dense
                  type="date"
                  label="Start Date"
                />
              </div>
              <div class="col-6">
                <q-input v-model="editForm.deadline" outlined dense type="date" label="Deadline" />
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

    <!-- 10. DELETE TASK CONFIRMATION DIALOG -->
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
          Are you sure you want to delete task
          <strong>"{{ taskToDelete?.title }}"</strong>? All associated dependencies and work logs
          will be removed.
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

    <!-- 11. UNASSIGN TASK RESOURCE DIALOG -->
    <q-dialog v-model="showUnassignDialog">
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
          Are you sure you want to remove <strong>{{ unassignTarget.resourceName }}</strong> from
          task <strong>"{{ unassignTarget.taskTitle }}"</strong>?
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
            :loading="unassigning"
            @click="handleExecuteUnassign"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import {
  assignTaskResourceApi,
  addTaskDependencyApi,
  createTaskApi,
  deleteTaskApi,
  getProjectsApi,
  getResourcesApi,
  getTasksApi,
  unassignTaskResourceApi,
  updateTaskApi,
  type Project,
  type ResourceUser,
  type Task,
} from '@/services/api';

const $q = useQuasar();

const loading = ref(true);
const viewMode = ref<'board' | 'table'>('board');
const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);
const resources = ref<ResourceUser[]>([]);
const taskProjectMembers = ref<ResourceUser[]>([]);

const searchQuery = ref('');
const projectFilter = ref<number | 'ALL'>('ALL');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingTaskId = ref<number | null>(null);
const submitting = ref(false);

const showDeleteTaskDialog = ref(false);
const deletingTask = ref(false);
const taskToDelete = ref<Task | null>(null);

// ----------------------------------------------------
// KANBAN COLUMN DEFINITION
// ----------------------------------------------------
interface KanbanColumn {
  id: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  title: string;
  dotColor: string;
  headerBg: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
  icon: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'UNASSIGNED',
    title: 'Unassigned',
    dotColor: '#64748b',
    headerBg: 'rgba(100, 116, 139, 0.08)',
    borderColor: 'rgba(100, 116, 139, 0.22)',
    badgeBg: '#f1f5f9',
    badgeColor: '#475569',
    icon: 'person_off',
  },
  {
    id: 'SCHEDULED',
    title: 'Scheduled',
    dotColor: '#8b6fd8',
    headerBg: 'rgba(139, 111, 216, 0.08)',
    borderColor: 'rgba(139, 111, 216, 0.22)',
    badgeBg: '#f0ecfa',
    badgeColor: '#6d4ec4',
    icon: 'calendar_month',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    dotColor: '#0284c7',
    headerBg: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.22)',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    icon: 'autorenew',
  },
  {
    id: 'COMPLETED',
    title: 'Completed',
    dotColor: '#059669',
    headerBg: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.22)',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    icon: 'check_circle',
  },
];

function quickCreateInColumn(status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
  createForm.status = status;
  showCreateDialog.value = true;
}

function isTaskOverdue(task: Task): boolean {
  if (!task.deadline || task.status === 'COMPLETED') return false;
  return new Date(task.deadline).getTime() < new Date().setHours(0, 0, 0, 0);
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
    await loadData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete task',
    });
  } finally {
    deletingTask.value = false;
  }
}

const showTaskDetailsDialog = ref(false);
const selectedTaskDetails = ref<Task | null>(null);

function openTaskDetails(task: Task) {
  selectedTaskDetails.value = task;
  showTaskDetailsDialog.value = true;
}

function openEditFromDetails() {
  showTaskDetailsDialog.value = false;
  if (selectedTaskDetails.value) {
    openEditModal(selectedTaskDetails.value);
  }
}

function openAssignFromDetails() {
  showTaskDetailsDialog.value = false;
  if (selectedTaskDetails.value) {
    openAssignTaskMemberDialog(selectedTaskDetails.value.task_id);
  }
}

function openDependencyFromDetails() {
  showTaskDetailsDialog.value = false;
  if (selectedTaskDetails.value) {
    openDependencyDialog(selectedTaskDetails.value);
  }
}

function unassignFromDetails(rId: number) {
  if (selectedTaskDetails.value) {
    confirmUnassignResource(selectedTaskDetails.value, rId);
  }
}

function getTaskTitle(taskId: number): string {
  const t = tasks.value.find((item) => item.task_id === taskId);
  return t ? t.title : `Task #${taskId}`;
}

const showUnassignDialog = ref(false);
const unassigning = ref(false);
const unassignTarget = reactive({
  taskId: 0,
  taskTitle: '',
  resourceId: 0,
  resourceName: '',
});

function confirmUnassignResource(task: Task, rId: number) {
  unassignTarget.taskId = task.task_id;
  unassignTarget.taskTitle = task.title;
  unassignTarget.resourceId = rId;
  unassignTarget.resourceName = getResourceName(rId);
  showUnassignDialog.value = true;
}

async function handleExecuteUnassign() {
  if (!unassignTarget.taskId || !unassignTarget.resourceId) return;

  unassigning.value = true;
  try {
    await unassignTaskResourceApi(unassignTarget.taskId, unassignTarget.resourceId);
    $q.notify({
      type: 'positive',
      message: `Unassigned ${unassignTarget.resourceName} successfully`,
    });
    showUnassignDialog.value = false;
    await loadData();

    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === unassignTarget.taskId) {
      const updated = tasks.value.find((t) => t.task_id === unassignTarget.taskId);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unassign resource',
    });
  } finally {
    unassigning.value = false;
  }
}

const showAssignTaskMemberDialog = ref(false);
const submittingTaskMember = ref(false);

const showDependencyDialog = ref(false);
const selectedDependencyTaskId = ref<number | null>(null);
const selectedPredecessorTaskIds = ref<number[]>([]);
const submittingDependency = ref(false);

const assignTaskMemberForm = reactive({
  task_id: null as number | null,
  user_ids: [] as number[],
});

watch(
  () => assignTaskMemberForm.task_id,
  async (newTaskId) => {
    if (newTaskId) {
      const t = tasks.value.find((item) => item.task_id === newTaskId);
      if (t?.project_id) {
        taskProjectMembers.value = await getResourcesApi(t.project_id).catch(() => []);
        return;
      }
    }
    taskProjectMembers.value = [];
  },
  { immediate: true },
);

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

const resourceMemberSelectOptions = computed(() => {
  const source =
    assignTaskMemberForm.task_id && taskProjectMembers.value.length > 0
      ? taskProjectMembers.value
      : resources.value;
  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];

  return source.map((r) => {
    const isAssigned = alreadyAssignedIds.includes(r.user_id);
    return {
      label: r.name,
      value: r.user_id,
      alreadyAssigned: isAssigned,
      disable: isAssigned,
    };
  });
});

const createProjectMembers = ref<ResourceUser[]>([]);

const createForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  expected_effort: number;
  start_date: string;
  deadline: string;
  assigned_resource_ids: number[];
  predecessor_task_ids: number[];
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'UNASSIGNED',
  expected_effort: 8,
  start_date: '',
  deadline: '',
  assigned_resource_ids: [],
  predecessor_task_ids: [],
});

watch(
  () => createForm.project_id,
  async (newProjectId) => {
    createForm.assigned_resource_ids = [];
    createForm.predecessor_task_ids = [];
    if (newProjectId) {
      const members = await getResourcesApi(newProjectId).catch(() => []);
      createProjectMembers.value = members;
    } else {
      createProjectMembers.value = [];
    }
  },
  { immediate: true },
);

const createMemberOptions = computed(() => {
  const source =
    createProjectMembers.value.length > 0 ? createProjectMembers.value : resources.value;
  return source.map((r) => ({
    label: r.name,
    value: r.user_id,
  }));
});

const createPredecessorOptions = computed(() => {
  if (!createForm.project_id) return [];
  return tasks.value
    .filter((t) => t.project_id === createForm.project_id)
    .map((t) => ({
      label: `${t.title} (#${t.task_id})`,
      value: t.task_id,
    }));
});

const editForm = reactive<{
  title: string;
  status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress: number;
  expected_effort: number;
  start_date: string;
  deadline: string;
}>({
  title: '',
  status: 'UNASSIGNED',
  priority: 'MEDIUM',
  progress: 0,
  expected_effort: 8,
  start_date: '',
  deadline: '',
});

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

const projectFilterOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...projects.value.map((p) => ({ label: p.name, value: p.project_id })),
]);

const projectSelectOptions = computed(() =>
  projects.value.map((p) => ({ label: p.name, value: p.project_id })),
);

const taskSelectOptions = computed(() =>
  tasks.value.map((t) => ({ label: `${t.title} (#${t.task_id})`, value: t.task_id })),
);

const existingTaskDependencies = reactive<Record<number, number[]>>({});

const dependencyPredecessorOptions = computed(() => {
  const selectedTask = tasks.value.find(
    (task) => Number(task.task_id) === Number(selectedDependencyTaskId.value),
  );
  const currentTaskDeps = selectedDependencyTaskId.value
    ? [
        ...(existingTaskDependencies[selectedDependencyTaskId.value] || []),
        ...(selectedTask?.predecessor_task_ids || []).map(Number),
      ]
    : [];

  const existingSet = new Set(currentTaskDeps);

  return tasks.value
    .filter(
      (task) =>
        Number(task.task_id) !== Number(selectedDependencyTaskId.value) &&
        Number(task.project_id) === Number(selectedTask?.project_id),
    )
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

const tableColumns: QTableColumn<Task>[] = [
  {
    name: 'title',
    label: 'Task Title',
    field: (t) => t.title,
    align: 'left',
  },
  { name: 'project', label: 'Project', field: (t) => t.project_id, align: 'left' },
  { name: 'resources', label: 'Assigned Resources', field: () => '', align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
  {
    name: 'deadline',
    label: 'Deadline',
    field: (t) => (t.deadline ? t.deadline.split('T')[0] : 'TBD'),
    align: 'left',
  },
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

async function loadData() {
  loading.value = true;
  try {
    const [tList, pList, rList] = await Promise.all([
      getTasksApi(),
      getProjectsApi(),
      getResourcesApi(),
    ]);
    tasks.value = tList;
    projects.value = pList;
    resources.value = rList;
    if (pList.length > 0 && pList[0] && !createForm.project_id) {
      createForm.project_id = pList[0].project_id;
    }
  } catch (error) {
    console.error('Failed to fetch tasks/projects/resources from backend:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});

const inProgressCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);

const completedCount = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);

const scheduledCount = computed(
  () => tasks.value.filter((t) => t.status === 'SCHEDULED' || t.status === 'UNASSIGNED').length,
);

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q));

    const matchesProject = projectFilter.value === 'ALL' || t.project_id === projectFilter.value;

    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;

    const matchesPriority = priorityFilter.value === 'ALL' || t.priority === priorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

const tasksByStatus = computed(() => {
  const map: Record<'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED', Task[]> = {
    UNASSIGNED: [],
    SCHEDULED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  };

  for (const task of filteredTasks.value) {
    if (task.status in map) {
      map[task.status].push(task);
    } else {
      map.UNASSIGNED.push(task);
    }
  }

  return map;
});

function getProjectName(projectId: number): string {
  const p = projects.value.find((proj) => proj.project_id === projectId);
  return p ? p.name : `Project #${projectId}`;
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function getTaskStatusClass(status: string): string {
  if (status === 'COMPLETED') return 'chip-soft-green';
  if (status === 'IN_PROGRESS') return 'chip-soft-blue';
  if (status === 'SCHEDULED') return 'chip-soft-purple';
  return 'chip-soft-grey';
}

function getPriorityClass(priority: string): string {
  if (priority === 'CRITICAL') return 'chip-soft-red';
  if (priority === 'HIGH') return 'chip-soft-orange';
  if (priority === 'MEDIUM') return 'chip-soft-blue';
  return 'chip-soft-purple';
}
function openAssignTaskMemberDialog(taskId: number | null) {
  assignTaskMemberForm.task_id = taskId || (tasks.value[0]?.task_id ?? null);
  assignTaskMemberForm.user_ids = [];
  showAssignTaskMemberDialog.value = true;
}

async function handleAssignTaskMember() {
  if (!assignTaskMemberForm.task_id || !assignTaskMemberForm.user_ids?.length) return;

  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];
  const toAssignIds = assignTaskMemberForm.user_ids.filter(
    (id) => !alreadyAssignedIds.includes(id),
  );

  if (toAssignIds.length === 0) {
    $q.notify({
      type: 'info',
      message: 'Selected member(s) are already assigned to this task',
    });
    showAssignTaskMemberDialog.value = false;
    assignTaskMemberForm.user_ids = [];
    return;
  }

  submittingTaskMember.value = true;
  try {
    for (const userId of toAssignIds) {
      await assignTaskResourceApi(assignTaskMemberForm.task_id, userId);
    }
    $q.notify({
      type: 'positive',
      message: `${toAssignIds.length} member(s) assigned to task successfully`,
    });
    showAssignTaskMemberDialog.value = false;
    assignTaskMemberForm.user_ids = [];
    await loadData();
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === assignTaskMemberForm.task_id) {
      const updated = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign members to task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submittingTaskMember.value = false;
  }
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

  submittingDependency.value = true;
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
    await loadData();
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === taskId) {
      const updated = tasks.value.find((t) => t.task_id === taskId);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to add task dependency',
    });
  } finally {
    submittingDependency.value = false;
  }
}

async function handleCreateTask() {
  if (!createForm.project_id || !createForm.title.trim()) return;

  submitting.value = true;
  try {
    const newTask = await createTaskApi({
      project_id: createForm.project_id,
      title: createForm.title.trim(),
      description: createForm.description.trim() || null,
      priority: createForm.priority,
      expected_effort: Number(createForm.expected_effort) || 8,
      start_date: createForm.start_date || null,
      deadline: createForm.deadline || null,
      assigned_resource_ids: createForm.assigned_resource_ids,
    });

    const newTaskId = newTask?.task_id;
    let depErrors = 0;

    if (newTaskId && createForm.predecessor_task_ids.length > 0) {
      for (const predId of createForm.predecessor_task_ids) {
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
        message: `Task created, but ${depErrors} dependency/dependencies could not be linked`,
      });
    } else {
      $q.notify({
        type: 'positive',
        message: 'Task created successfully',
      });
    }

    showCreateDialog.value = false;
    createForm.title = '';
    createForm.description = '';
    createForm.assigned_resource_ids = [];
    createForm.predecessor_task_ids = [];
    await loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create task';
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
  editForm.status = task.status;
  editForm.priority = task.priority;
  editForm.progress = Number(task.progress) || 0;
  editForm.expected_effort = Number(task.expected_effort) || 8;
  editForm.start_date = task.start_date?.split('T')[0] ?? '';
  editForm.deadline = task.deadline?.split('T')[0] ?? '';
  showEditDialog.value = true;
}

async function handleUpdateTask() {
  if (!editingTaskId.value || !editForm.title.trim()) return;

  submitting.value = true;
  try {
    await updateTaskApi(editingTaskId.value, {
      title: editForm.title.trim(),
      status: editForm.status,
      priority: editForm.priority,
      progress: Number(editForm.progress) || 0,
      expected_effort: Number(editForm.expected_effort) || 8,
      start_date: editForm.start_date || null,
      deadline: editForm.deadline || null,
    });

    $q.notify({
      type: 'positive',
      message: 'Task updated successfully',
    });

    showEditDialog.value = false;
    await loadData();
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
.tasks-page {
  padding: 20px 28px 36px;
  background: var(--wo-bg-page, #f8f9fa);
  min-height: 100vh;
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

/* ===================================================
   Filter Toolbar
   =================================================== */
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

/* ===================================================
   Kanban Board Layout
   =================================================== */
.kanban-board-container {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-columns-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(280px, 1fr));
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 300px);
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

.col-add-btn {
  color: var(--wo-text-muted, #64748b);
  transition: color 0.15s ease;

  &:hover {
    color: var(--wo-primary, #8b6fd8);
    background: rgba(139, 111, 216, 0.12);
  }
}

.kanban-cards-wrapper {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 480px;
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

/* ===================================================
   Kanban Task Card
   =================================================== */
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
  max-width: 130px;
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

.task-more-btn {
  margin: -6px -4px -6px 0;
  opacity: 0.7;

  &:hover {
    opacity: 1;
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

.avatar-stack {
  display: flex;
  align-items: center;

  .stack-avatar {
    margin-left: -5px;
    border: 1.5px solid var(--wo-bg-card, #ffffff);
    background: #8b6fd8;
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;

    &:first-child {
      margin-left: 0;
    }
  }

  .stack-more {
    background: #e2e8f0;
    color: #475569;
  }
}

.unassigned-btn {
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
  background: var(--wo-bg-tag, #f1f5f9);
  padding: 2px 7px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;

  &:hover {
    color: var(--wo-primary, #8b6fd8);
    background: rgba(139, 111, 216, 0.12);
  }
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

/* ===================================================
   Table / List Mode Styles
   =================================================== */
.table-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
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
  min-width: 120px;
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

.tasks-table :deep(tbody tr) {
  cursor: pointer;
}

.dialog-card {
  min-width: 440px;
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
}

.details-popup-card {
  min-width: 440px;
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

  .detail-item {
    padding: 6px 0;
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
</style>
