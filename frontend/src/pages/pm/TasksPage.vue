<template>
  <q-page class="pm-page tasks-page">
    <!-- PAGE HEADER -->
    <div class="page-header-row">
      <div>
        <div class="page-title">PM Task Management</div>
        <div class="page-subtitle">Overview of all tasks across projects managed by you</div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          icon="person_add"
          label="Assign Member to Task"
          class="action-btn-secondary"
          @click="openAssignTaskMemberDialog(null)"
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

    <!-- STAT SUMMARY CARDS -->
    <div class="stats-grid q-mb-md">
      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="48px" class="stat-icon stat-purple">
            <q-icon name="task_alt" size="24px" />
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
          <q-avatar size="48px" class="stat-icon stat-blue-bg">
            <q-icon name="autorenew" size="24px" />
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
          <q-avatar size="48px" class="stat-icon stat-green-bg">
            <q-icon name="check_circle" size="24px" />
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
          <q-avatar size="48px" class="stat-icon stat-orange-bg">
            <q-icon name="pending_actions" size="24px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Pending / On Hold</div>
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-note stat-orange">Awaiting start</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- FILTER BAR -->
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

    <!-- LOADING / TABLE -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <q-card v-else flat bordered class="table-card">
      <q-table
        flat
        :rows="filteredTasks"
        :columns="tableColumns"
        row-key="task_id"
        no-data-label="No tasks found matching criteria"
        :pagination="{ rowsPerPage: 8 }"
        class="tasks-table"
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
          <q-td :props="props" auto-width>
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
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- ASSIGN MEMBER TO TASK DIALOG (POST /api/tasks/:id/assign) -->
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
              v-model="assignTaskMemberForm.user_id"
              outlined
              dense
              label="Select Member"
              :options="resourceMemberSelectOptions"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Member is required']"
            />
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

    <!-- ADD TASK DEPENDENCY DIALOG -->
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
              v-model="selectedPredecessorTaskId"
              outlined
              dense
              label="Depends On"
              :options="dependencyPredecessorOptions"
              emit-value
              map-options
              :rules="[(value) => !!value || 'Predecessor task is required']"
              :disable="!selectedDependencyTaskId"
            />
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
              :disable="!selectedDependencyTaskId || !selectedPredecessorTaskId"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- CREATE TASK DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="dialog-card">
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

    <!-- EDIT TASK DIALOG -->
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
                  :options="['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']"
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
  getProjectsApi,
  getResourcesApi,
  getTasksApi,
  updateTaskApi,
  type Project,
  type ResourceUser,
  type Task,
} from '@/services/api';

const $q = useQuasar();

const loading = ref(true);
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

const showAssignTaskMemberDialog = ref(false);
const submittingTaskMember = ref(false);

const showDependencyDialog = ref(false);
const selectedDependencyTaskId = ref<number | null>(null);
const selectedPredecessorTaskId = ref<number | null>(null);
const submittingDependency = ref(false);

const assignTaskMemberForm = reactive({
  task_id: null as number | null,
  user_id: null as number | null,
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
  const source = assignTaskMemberForm.task_id ? taskProjectMembers.value : resources.value;
  return source.map((r) => ({
    label: r.name,
    value: r.user_id,
  }));
});

const createForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  expected_effort: number;
  start_date: string;
  deadline: string;
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  expected_effort: 8,
  start_date: '',
  deadline: '',
});
const editForm = reactive<{
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress: number;
  expected_effort: number;
  start_date: string;
  deadline: string;
}>({
  title: '',
  status: 'PENDING',
  priority: 'MEDIUM',
  progress: 0,
  expected_effort: 8,
  start_date: '',
  deadline: '',
});

const statusFilterOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
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

const dependencyPredecessorOptions = computed(() => {
  const selectedTask = tasks.value.find((task) => task.task_id === selectedDependencyTaskId.value);

  return tasks.value
    .filter(
      (task) =>
        task.task_id !== selectedDependencyTaskId.value &&
        task.project_id === selectedTask?.project_id,
    )
    .map((task) => ({
      label: `${task.title} (#${task.task_id})`,
      value: task.task_id,
    }));
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
    if (pList.length > 0) {
      createForm.project_id = pList[0]!.project_id;
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

const pendingCount = computed(
  () => tasks.value.filter((t) => t.status === 'PENDING' || t.status === 'ON_HOLD').length,
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
  if (status === 'ON_HOLD') return 'chip-soft-orange';
  return 'chip-soft-purple';
}

function getPriorityClass(priority: string): string {
  if (priority === 'CRITICAL') return 'chip-soft-red';
  if (priority === 'HIGH') return 'chip-soft-orange';
  if (priority === 'MEDIUM') return 'chip-soft-blue';
  return 'chip-soft-purple';
}

function openAssignTaskMemberDialog(taskId: number | null) {
  assignTaskMemberForm.task_id = taskId || (tasks.value[0]?.task_id ?? null);
  assignTaskMemberForm.user_id = null;
  showAssignTaskMemberDialog.value = true;
}

async function handleAssignTaskMember() {
  if (!assignTaskMemberForm.task_id || !assignTaskMemberForm.user_id) return;

  submittingTaskMember.value = true;
  try {
    await assignTaskResourceApi(assignTaskMemberForm.task_id, assignTaskMemberForm.user_id);
    $q.notify({
      type: 'positive',
      message: `Member #${assignTaskMemberForm.user_id} assigned to task successfully`,
    });
    showAssignTaskMemberDialog.value = false;
    assignTaskMemberForm.user_id = null;
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign member to task';
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
  selectedPredecessorTaskId.value = null;
  showDependencyDialog.value = true;
}

async function handleAddDependency() {
  if (!selectedDependencyTaskId.value || !selectedPredecessorTaskId.value) return;

  submittingDependency.value = true;
  try {
    await addTaskDependencyApi(selectedDependencyTaskId.value, selectedPredecessorTaskId.value);

    const successor = tasks.value.find((task) => task.task_id === selectedDependencyTaskId.value);
    const predecessor = tasks.value.find(
      (task) => task.task_id === selectedPredecessorTaskId.value,
    );

    $q.notify({
      type: 'positive',
      message: `${successor?.title ?? 'Task'} now depends on ${predecessor?.title ?? 'the selected task'}`,
    });

    showDependencyDialog.value = false;
    selectedDependencyTaskId.value = null;
    selectedPredecessorTaskId.value = null;
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
    await createTaskApi({
      project_id: createForm.project_id,
      title: createForm.title.trim(),
      description: createForm.description || null,
      priority: createForm.priority,
      status: 'PENDING',
      expected_effort: Number(createForm.expected_effort) || 8,
      start_date: createForm.start_date || null,
      deadline: createForm.deadline || null,
    });

    $q.notify({
      type: 'positive',
      message: 'Task created successfully',
    });

    showCreateDialog.value = false;
    createForm.title = '';
    createForm.description = '';
    void loadData();
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
    void loadData();
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
.filter-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 10px;
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

.dialog-card {
  min-width: 440px;
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
}
</style>
