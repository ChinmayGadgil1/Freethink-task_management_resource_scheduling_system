<template>
  <q-page class="q-pa-lg workspace-page">
    <!-- ========================================================= -->
    <!-- PAGE HEADER -->
    <!-- ========================================================= -->

    <div class="q-mb-lg">
      <div class="row items-center justify-between q-gutter-md">
        <div>
          <div class="row items-center q-gutter-sm">
            <q-avatar
              size="42px"
              color="primary"
              text-color="white"
              icon="task_alt"
            />

            <div>
              <div class="text-h5 text-weight-bold">
                My Tasks
              </div>

              <div class="text-body2 text-grey-6 q-mt-xs">
                View and manage the tasks assigned to you.
              </div>
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <!-- Refresh -->
          <q-btn
            outline
            no-caps
            icon="refresh"
            label="Refresh"
            color="primary"
            :loading="loading"
            @click="loadTasks"
          />

          <!-- Create -->
          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="add"
            label="Create Task"
            @click="openCreateDialog"
          />
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- SUMMARY CARDS -->
    <!-- ========================================================= -->

    <div class="row q-col-gutter-md q-mb-lg items-stretch">
      <div
        v-for="stat in statCards"
        :key="stat.title"
        class="col-12 col-sm-6 col-md-3"
      >
        <StatCard
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          class="full-height"
        />
      </div>
    </div>

    <!-- TASKS WORKSPACE -->
    <q-card flat bordered class="dashboard-card q-mt-md">
      <!-- ASSIGNED TASKS HEADER -->
      <q-card-section class="q-py-md">
        <div class="row items-center justify-between q-gutter-md">
          <div>
            <div class="row items-center q-gutter-sm">
              <q-avatar
                size="36px"
                color="primary"
                text-color="white"
                icon="assignment"
              />

              <div>
                <div class="text-subtitle1 text-weight-bold">
                  Assigned Tasks
                </div>

                <div class="text-caption text-grey-6">
                  View and manage the tasks assigned to you.
                </div>
              </div>
            </div>
          </div>

          <q-badge
            color="primary"
            :label="`${filteredTasks.length} tasks`"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- FILTERS -->
      <q-card-section class="q-py-md">
        <TaskFilterBar
          :search="search"
          :status="statusFilter"
          :project="projectFilter"
          :priority="priorityFilter"
          :project-options="projectOptions"
          :priority-options="priorityOptions"
          @update:search="(v) => (search = v)"
          @update:status="(v) => (statusFilter = v)"
          @update:project="(v) => (projectFilter = v)"
          @update:priority="(v) => (priorityFilter = v)"
          @clear="clearFilters"
        />
      </q-card-section>

      <q-separator />

      <!-- TASK TOOLBAR -->
      <q-card-section class="q-py-md">
        <div class="row items-center q-col-gutter-md">

          <!-- Sort -->
          <div class="col-12 col-sm-6 col-md-4">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              label="Sort tasks by"
              outlined
              dense
              emit-value
              map-options
              options-dense
            >
              <template #prepend>
                <q-icon
                  name="sort"
                  color="grey-7"
                />
              </template>
            </q-select>
          </div>

          <!-- Rows per page -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="rowsPerPage"
              :options="[5, 10, 20, 30]"
              label="Tasks per page"
              outlined
              dense
              options-dense
            >
              <template #prepend>
                <q-icon
                  name="view_list"
                  color="grey-7"
                />
              </template>
            </q-select>
          </div>

          <!-- Active filters -->
          <div
            v-if="hasActiveFilters"
            class="col-auto"
          >
            <q-chip
              dense
              color="blue-1"
              text-color="primary"
              icon="filter_alt"
            >
              Filters active
            </q-chip>
          </div>

        </div>
      </q-card-section>

      <q-separator />

      <!-- LOADING -->
      <div
        v-if="loading"
        class="q-pa-xl text-center"
      >
        <q-spinner
          color="primary"
          size="40px"
        />

        <div class="text-body2 text-grey-6 q-mt-md">
          Loading your tasks...
        </div>
      </div>

      <!-- ERROR -->
      <div
        v-else-if="error"
        class="q-pa-xl text-center"
      >
        <q-avatar
          size="56px"
          color="red-1"
          text-color="negative"
          icon="error_outline"
        />

        <div class="text-body1 text-grey-7 q-mt-md">
          {{ error }}
        </div>

        <q-btn
          outline
          no-caps
          color="primary"
          label="Try Again"
          icon="refresh"
          class="q-mt-md"
          @click="loadTasks"
        />
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="filteredTasks.length === 0"
        class="q-pa-xl text-center"
      >
        <q-avatar
          size="56px"
          color="grey-2"
          text-color="grey-6"
          icon="task_alt"
        />

        <div class="text-body1 text-weight-medium text-grey-7 q-mt-md">
          No tasks found
        </div>

        <div class="text-caption text-grey-6 q-mt-xs">
          No tasks match your current search and filters.
        </div>

        <q-btn
          v-if="hasActiveFilters"
          flat
          no-caps
          color="primary"
          label="Clear Filters"
          icon="filter_alt_off"
          class="q-mt-md"
          @click="clearFilters"
        />
      </div>

      <!-- TASK LIST -->
      <template v-else>

        <div class="q-py-sm">

          <div
            v-for="task in paginatedTasks"
            :key="task.id"
            class="q-px-md q-py-xs"
          >
            <TaskListItem
              :task="task"
              @update="openUpdateDialog"
            />
          </div>

        </div>

        <q-separator />

        <!-- PAGINATION -->
        <q-card-section class="q-py-md">
          <div class="row items-center justify-between q-gutter-md">

            <div class="text-caption text-grey-6">
              Showing
              {{
                Math.min(
                  (currentPage - 1) * rowsPerPage + 1,
                  filteredTasks.length
                )
              }}
              -
              {{
                Math.min(
                  currentPage * rowsPerPage,
                  filteredTasks.length
                )
              }}
              of {{ filteredTasks.length }} tasks
            </div>

            <q-pagination
              v-model="currentPage"
              :max="totalPages"
              :max-pages="6"
              boundary-numbers
              direction-links
              color="primary"
              active-color="primary"
            />

          </div>
        </q-card-section>

      </template>

    </q-card>

    <!-- UPDATE TASK DIALOG -->
    <UpdateTaskDialog
      v-model="updateDialog"
      :task="selectedTask"
      @save="saveTaskUpdate"
    />

    <!-- CREATE TASK DIALOG -->
    <q-dialog
      v-model="createDialog"
      persistent
    >
      <q-card
        style="width: 520px; max-width: 92vw"
      >
        <!-- Dialog Header -->
        <q-card-section class="q-pb-md">
          <div class="row items-center no-wrap">
            <q-avatar
              size="42px"
              color="primary"
              text-color="white"
              icon="add_task"
            />

            <div class="q-ml-md">
              <div class="text-h6 text-weight-bold">
                Create Task
              </div>

              <div class="text-caption text-grey-6 q-mt-xs">
                This task will be assigned to you automatically.
              </div>
            </div>

            <q-space />

            <q-btn
              flat
              round
              dense
              icon="close"
              color="grey-7"
              @click="createDialog = false"
            />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Dialog Form -->
        <q-card-section class="q-pa-lg">
          <div class="q-gutter-md">
            <!-- Project -->
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
                <q-icon
                  name="folder"
                  color="grey-7"
                />
              </template>
            </q-select>

            <!-- Title -->
            <q-input
              v-model="createForm.title"
              label="Task Title *"
              outlined
              dense
            >
              <template #prepend>
                <q-icon
                  name="task"
                  color="grey-7"
                />
              </template>
            </q-input>

            <!-- Description -->
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
                <q-icon
                  name="description"
                  color="grey-7"
                />
              </template>
            </q-input>

            <!-- Priority -->
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
                <q-icon
                  name="flag"
                  color="grey-7"
                />
              </template>
            </q-select>

            <!-- Dates -->
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
                    <q-icon
                      name="event"
                      color="grey-7"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="createForm.deadline"
                  label="Deadline"
                  type="date"
                  outlined
                  dense
                >
                  <template #prepend>
                    <q-icon
                      name="event_available"
                      color="grey-7"
                    />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Expected Effort -->
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
                <q-icon
                  name="schedule"
                  color="grey-7"
                />
              </template>
            </q-input>

            <!-- Validation hint -->
            <q-banner
              v-if="!canCreateTask"
              dense
              rounded
              class="bg-blue-1 text-primary"
            >
              <template #avatar>
                <q-icon name="info" />
              </template>

              Project, task title and expected effort are required.
            </q-banner>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Dialog Actions -->
        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            flat
            no-caps
            label="Cancel"
            color="grey-7"
            @click="createDialog = false"
          />

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
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue';

import { Notify } from 'quasar';

import StatCard from '@/components/dashboard/StatCard.vue';

import TaskFilterBar, {
  type StatusFilter,
} from '@/components/tasks/TaskFilterBar.vue';

import TaskListItem from '@/components/tasks/TaskListItem.vue';

import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue';

import type {
  ResourceTask,
  TaskPriority,
} from '@/components/tasks/task-types';

import {
  createTaskApi,
  getProjectsApi,
  getTasksApi,
  updateTaskApi,
  type Project,
  type Task,
} from '@/services/api';

//task data
const tasks = ref<ResourceTask[]>([]);

const loading = ref(false);
const error = ref('');

//MAP BACKEND TASK → FRONTEND TASK

function mapTask(task: Task): ResourceTask {
  return {
    id: task.task_id,
    name: task.title,
    project:
      task.project_name ??
      `Project #${task.project_id}`,
    priority: task.priority,
    status: task.status,
    progress: Number(task.progress) || 0,
    deadline: task.deadline,
    startDate: task.start_date,
    hoursWorked:
      Number(task.actual_effort) || 0,
    estimatedHours:
      Number(task.expected_effort) || 0,
    workUpdate: '',
  };
}

//LOAD TASKS
async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    const response = await getTasksApi();

    tasks.value = response.map(mapTask);

    // Keep pagination valid after refresh
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(
        1,
        totalPages.value,
      );
    }
  } catch (err) {
    console.error(
      'Failed to load resource tasks:',
      err,
    );

    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to load your tasks.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadTasks();
});

//DATE / STATUS HELPERS

function isOverdue(task: ResourceTask) {
  if (
    task.status === 'COMPLETED' ||
    !task.deadline
  ) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const deadline = new Date(task.deadline);

  deadline.setHours(0, 0, 0, 0);

  return deadline < today;
}

//SUMMARY

const statCards = computed(() => [
  {
    title: 'Total Tasks',
    value: tasks.value.length,
    icon: 'task_alt',
    color: '#8B6FD8',
  },

  {
    title: 'In Progress',
    value: tasks.value.filter(
      (task) =>
        task.status === 'IN_PROGRESS',
    ).length,
    icon: 'autorenew',
    color: '#2E90FA',
  },

  {
    title: 'Completed',
    value: tasks.value.filter(
      (task) =>
        task.status === 'COMPLETED',
    ).length,
    icon: 'check_circle_outline',
    color: '#27AE60',
  },

  {
    title: 'Delayed',
    value: tasks.value.filter(
      isOverdue,
    ).length,
    icon: 'warning_amber',
    color: '#E15263',
  },
]);

//FILTERS
const search = ref('');

const statusFilter =
  ref<StatusFilter>(null);

const projectFilter =
  ref<string | null>(null);

const priorityFilter =
  ref<TaskPriority | null>(null);

const projectOptions = computed(() =>
  [
    ...new Set(
      tasks.value.map(
        (task) => task.project,
      ),
    ),
  ].sort(),
);

const priorityOptions: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

function clearFilters() {
  search.value = '';
  statusFilter.value = null;
  projectFilter.value = null;
  priorityFilter.value = null;

  currentPage.value = 1;
}

//FILTERED TASKS
const filteredTasks = computed(() =>
  tasks.value.filter((task) => {
    const q = search.value
      .toLowerCase()
      .trim();

    const matchesSearch =
      !q ||
      task.name
        .toLowerCase()
        .includes(q) ||
      task.project
        .toLowerCase()
        .includes(q);

    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === 'DELAYED'
        ? isOverdue(task)
        : task.status ===
          statusFilter.value);

    const matchesProject =
      !projectFilter.value ||
      task.project ===
        projectFilter.value;

    const matchesPriority =
      !priorityFilter.value ||
      task.priority ===
        priorityFilter.value;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProject &&
      matchesPriority
    );
  }),
);

//SORTING
type SortOption =
  | 'TITLE_ASC'
  | 'TITLE_DESC'
  | 'PRIORITY'
  | 'STATUS'
  | 'DEADLINE'
  | 'PROGRESS'
  | 'HOURS';

const sortBy = ref<SortOption>(
  'DEADLINE',
);

const sortOptions = [
  {
    label: 'Deadline',
    value: 'DEADLINE',
  },
  {
    label: 'Task Name (A-Z)',
    value: 'TITLE_ASC',
  },
  {
    label: 'Task Name (Z-A)',
    value: 'TITLE_DESC',
  },
  {
    label: 'Priority',
    value: 'PRIORITY',
  },
  {
    label: 'Status',
    value: 'STATUS',
  },
  {
    label: 'Progress',
    value: 'PROGRESS',
  },
  {
    label: 'Hours Worked',
    value: 'HOURS',
  },
];

const priorityOrder: Record<
  TaskPriority,
  number
> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

const statusOrder: Record<
  ResourceTask['status'],
  number
> = {
  IN_PROGRESS: 1,
  PENDING: 2,
  ON_HOLD: 3,
  COMPLETED: 4,
};

const sortedTasks = computed(() => {
  const result = [
    ...filteredTasks.value,
  ];

  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'TITLE_ASC':
        return a.name.localeCompare(
          b.name,
        );

      case 'TITLE_DESC':
        return b.name.localeCompare(
          a.name,
        );

      case 'PRIORITY':
        return (
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
        );

      case 'STATUS':
        return (
          statusOrder[a.status] -
          statusOrder[b.status]
        );

      case 'PROGRESS':
        return (
          b.progress - a.progress
        );

      case 'HOURS':
        return (
          b.hoursWorked -
          a.hoursWorked
        );

      case 'DEADLINE': {
        // Tasks without deadlines go last
        if (
          !a.deadline &&
          !b.deadline
        ) {
          return 0;
        }

        if (!a.deadline) {
          return 1;
        }

        if (!b.deadline) {
          return -1;
        }

        return (
          new Date(
            a.deadline,
          ).getTime() -
          new Date(
            b.deadline,
          ).getTime()
        );
      }

      default:
        return 0;
    }
  });

  return result;
});

// PAGINATION

const currentPage = ref(1);

const rowsPerPage = ref(10);

const totalPages = computed(() =>
  Math.max(
    1,
    Math.ceil(
      sortedTasks.value.length /
        rowsPerPage.value,
    ),
  ),
);

const paginatedTasks = computed(() => {
  const start =
    (currentPage.value - 1) *
    rowsPerPage.value;

  const end =
    start + rowsPerPage.value;

  return sortedTasks.value.slice(
    start,
    end,
  );
});

//ACTIVE FILTERS

const hasActiveFilters = computed(
  () =>
    search.value.trim() !== '' ||
    statusFilter.value !== null ||
    projectFilter.value !== null ||
    priorityFilter.value !== null,
);

// RESET PAGE WHEN FILTER / SORT CHANGES

watch(
  [
    search,
    statusFilter,
    projectFilter,
    priorityFilter,
    sortBy,
    rowsPerPage,
  ],
  () => {
    currentPage.value = 1;
  },
);


//   CREATE TASK

const createDialog = ref(false);
const creatingTask = ref(false);
const loadingCreateProjects = ref(false);

const createProjects =
  ref<Project[]>([]);

const createForm = ref({
  project_id:
    null as number | null,

  title: '',

  description: '',

  priority:
    'MEDIUM' as TaskPriority,

  start_date: '',

  deadline: '',

  expected_effort: 0,
});

const projectOptionsForCreate =
  computed(
    () => createProjects.value,
  );

//CREATE VALIDATION

const canCreateTask = computed(() => {
  return (
    createForm.value.project_id !==
      null &&
    createForm.value.title
      .trim()
      .length > 0 &&
    Number(
      createForm.value
        .expected_effort,
    ) > 0
  );
});

//RESET CREATE FORM

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

//   OPEN CREATE DIALOG
async function openCreateDialog() {
  createDialog.value = true;

  if (
    createProjects.value.length ===
    0
  ) {
    await loadCreateProjects();
  }
}

  //LOAD PROJECTS FOR CREATE

async function loadCreateProjects() {
  loadingCreateProjects.value = true;

  try {
    createProjects.value = await getProjectsApi();
  } catch (err) {
    console.error(
      'Failed to load resource projects:',
      err,
    );

    Notify.create({
      type: 'negative',
      message:
        err instanceof Error
          ? err.message
          : 'Failed to load projects.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    loadingCreateProjects.value = false;
  }
}

//CREATE TASK

async function createTask() {
  if (!canCreateTask.value) {
    return;
  }

  const projectId =
    createForm.value.project_id;

  if (projectId === null) {
    return;
  }

  creatingTask.value = true;

  try {
    await createTaskApi({
      project_id: projectId,

      title:
        createForm.value.title.trim(),

      description:
        createForm.value.description.trim(),

      priority:
        createForm.value.priority,

      start_date:
        createForm.value.start_date ||
        null,

      deadline:
        createForm.value.deadline ||
        null,

      expected_effort:
        Number(
          createForm.value.expected_effort,
        ),
    });

    createDialog.value = false;

    resetCreateForm();

    await loadTasks();

    Notify.create({
      type: 'positive',
      message:
        'Task created successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error(
      'Failed to create task:',
      err,
    );

    Notify.create({
      type: 'negative',
      message:
        err instanceof Error
          ? err.message
          : 'Failed to create task.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    creatingTask.value = false;
  }
}

//UPDATE TASK

const updateDialog = ref(false);

const selectedTask =
  ref<ResourceTask | null>(null);

function openUpdateDialog(
  task: ResourceTask,
) {
  selectedTask.value = task;

  updateDialog.value = true;
}

async function saveTaskUpdate(payload: {
  id: number;
  status: ResourceTask['status'];
  progress: number;
  hoursWorked: number;
  workUpdate: string;
}) {
  const task = tasks.value.find(
    (item) =>
      item.id === payload.id,
  );

  if (!task) {
    return;
  }

  try {
    await updateTaskApi(task.id, {
      status: payload.status,
      progress: payload.progress,
      actual_effort:
        payload.hoursWorked,
    });

    // Update local task immediately
    task.status = payload.status;

    task.progress =
      payload.progress;

    task.hoursWorked =
      payload.hoursWorked;

    // Keep workUpdate behaviour unchanged
    if (payload.workUpdate) {
      task.workUpdate =
        payload.workUpdate;
    }

    updateDialog.value = false;

    Notify.create({
      type: 'positive',
      message:
        'Task updated successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error(
      'Failed to update task:',
      err,
    );

    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to update task.';

    Notify.create({
      type: 'negative',
      message: error.value,
      icon: 'error',
      position: 'top-right',
    });
  }
}
</script>

<style scoped lang="scss">
.workspace-page { background: var( --wo-bg-page, #f8f9fa ); }
.dashboard-card { overflow: hidden; }
.empty-block { padding: 48px 16px; text-align: center; }
.date-row { width: 100%; margin-left: 0; margin-right: 0;}
</style>
