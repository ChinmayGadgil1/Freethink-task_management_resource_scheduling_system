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
      <div class="page-header-row task-specs-header q-mb-lg">
        <div>
          <div class="page-title">Task Specs</div>
          <div class="page-subtitle">View details of all your assigned tasks.</div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Create Task"
            class="task-create-btn"
            @click="openCreateDialog"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-lg items-stretch">
        <div v-for="stat in statCards" :key="stat.title" class="col-12 col-sm-6 col-md-3">
          <StatCard
            :title="stat.title"
            :value="stat.value"
            :subtitle="stat.subtitle"
            :icon="stat.icon"
            :color="stat.color"
            class="full-height"
          />
        </div>
      </div>

      <q-card flat bordered class="task-shell-card">
        <q-card-section class="q-py-md row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold">Assigned Tasks</div>
            <div class="text-caption text-grey-6">Click any row to open full task details.</div>
          </div>

          <q-chip
            v-if="hasActiveFilters"
            dense
            color="blue-1"
            text-color="primary"
            icon="filter_alt"
          >
            Filters active
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-card-section class="task-filters-section">
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-md-4">
              <q-input
                v-model="searchQuery"
                outlined
                dense
                clearable
                placeholder="Search tasks or projects"
                label="Search"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select
                v-model="projectFilter"
                :options="projectOptions"
                outlined
                dense
                clearable
                label="Project"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                outlined
                dense
                clearable
                label="Status"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <q-select
                v-model="priorityFilter"
                :options="priorityOptions"
                outlined
                dense
                clearable
                label="Priority"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2 text-right">
              <q-btn
                flat
                no-caps
                color="grey-7"
                icon="refresh"
                label="Clear"
                class="task-filter-clear"
                @click="clearFilters"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-table
          v-if="filteredTasks.length"
          flat
          :rows="filteredTasks"
          :columns="taskColumns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 8 }"
          class="task-specs-table"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-task="props">
            <q-td :props="props">
              <div class="task-main-cell">
                <div class="task-main-title">{{ props.row.title }}</div>
                <div class="task-main-subtitle">
                  {{ props.row.project_name || `Project #${props.row.project_id}` }}
                </div>
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
              <div class="progress-cell">
                <div class="row items-center justify-between q-mb-xs">
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
                  label="Update"
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

    <!-- SINGLE TASK -->
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

import StatCard from '@/components/dashboard/StatCard.vue';
import type { ResourceTask } from '@/components/tasks/task-types';
import DailyProgressDialog from '@/components/tasks/DailyProgressDialog.vue';
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue';

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
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
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

const statCards = computed(() => [
  {
    title: 'Total Tasks',
    value: tasks.value.length,
    subtitle: 'All assigned tasks',
    icon: 'task_alt',
    color: '#8B6FD8',
  },
  {
    title: 'In Progress',
    value: tasks.value.filter((item) => item.status === 'IN_PROGRESS').length,
    subtitle: 'Active work',
    icon: 'autorenew',
    color: '#2E90FA',
  },
  {
    title: 'Completed',
    value: tasks.value.filter((item) => item.status === 'COMPLETED').length,
    subtitle: 'Done',
    icon: 'check_circle_outline',
    color: '#27AE60',
  },
  {
    title: 'Delayed',
    value: tasks.value.filter(isOverdue).length,
    subtitle: 'Need attention',
    icon: 'warning_amber',
    color: '#E15263',
  },
]);

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== '' ||
    projectFilter.value !== null ||
    statusFilter.value !== null ||
    priorityFilter.value !== null,
);

function clearFilters() {
  searchQuery.value = '';
  projectFilter.value = null;
  statusFilter.value = null;
  priorityFilter.value = null;
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
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
  }[status];
}

function statusColor(status: Task['status']) {
  return {
    PENDING: 'grey-7',
    IN_PROGRESS: 'blue-7',
    COMPLETED: 'positive',
    ON_HOLD: 'orange-7',
  }[status];
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
}

.task-specs-header {
  align-items: flex-end;
}

.task-count-badge {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-weight: 700;
}

.task-shell-card,
.detail-card,
.task-hero,
.task-hero-metric {
  border-radius: 16px;
  background: var(--wo-bg-card);
  box-shadow: var(--wo-card-shadow);
}

.task-shell-card {
  overflow: hidden;
}

.task-filters-section {
  background: linear-gradient(180deg, rgba(139, 111, 216, 0.03), rgba(139, 111, 216, 0));
}

.task-specs-table {
  border-top: 0;
}

.task-specs-table :deep(.q-table__middle) {
  overflow: hidden;
}

.task-specs-table :deep(thead tr th) {
  background: #f7f8fb;
  color: var(--wo-text-muted);
  font-size: 12px;
  font-weight: 700;
  border-bottom: 1px solid var(--wo-border-subtle);
}

.task-specs-table :deep(tbody tr) {
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.task-specs-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover);
}

.task-specs-table :deep(td) {
  padding-top: 16px;
  padding-bottom: 16px;
}

.task-main-cell {
  min-width: 0;
}

.task-main-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--wo-text-main);
}

.task-main-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: var(--wo-text-subtle);
}

.task-filter-clear {
  min-height: 40px;
}

.table-action-btn {
  border-radius: 8px;
  font-weight: 600;
}

.progress-cell {
  min-width: 180px;
}

.task-id-chip,
.priority-chip,
.status-chip {
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.task-id-chip {
  background: var(--wo-primary-light);
  color: var(--wo-primary-dark);
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

.status-pending {
  background: #f0f2f5;
  color: #667085;
}

.status-in_progress {
  background: #eaf1fd;
  color: #2e90fa;
}

.status-completed {
  background: #eaf7f0;
  color: #27ae60;
}

.status-on_hold {
  background: #fff4e8;
  color: #e89532;
}

.task-hero {
  border: 1px solid rgba(139, 111, 216, 0.14);
  background:
    radial-gradient(circle at top right, rgba(139, 111, 216, 0.1), transparent 35%),
    linear-gradient(180deg, #ffffff 0%, #fbfaff 100%);
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
}

.metric-chip,
.mini-metric {
  height: 100%;
  border-radius: 12px;
  background: #f8f9fc;
  border: 1px solid var(--wo-border-subtle);
  padding: 10px 12px;
}

.metric-label,
.mini-metric-label,
.detail-meta-label {
  color: var(--wo-text-subtle);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value,
.mini-metric-value,
.detail-meta-value {
  margin-top: 4px;
  color: var(--wo-text-main);
  font-size: 12px;
  font-weight: 700;
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

.task-update-btn,
.task-update-btn-outline {
  border-radius: 10px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .task-hero-title {
    font-size: 24px;
  }
}

@media (max-width: 600px) {
  .task-specs-header {
    align-items: flex-start;
    gap: 12px;
  }

  .detail-meta-grid {
    grid-template-columns: 1fr;
  }

  .progress-cell {
    min-width: 140px;
  }
}
</style>
