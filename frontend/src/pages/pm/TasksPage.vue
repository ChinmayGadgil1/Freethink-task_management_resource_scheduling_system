<template>
  <q-page class="q-pa-md">
    <!-- PAGE HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">PM Task Management</div>
        <div class="text-caption text-grey-7">
          Overview of all tasks across projects managed by you
        </div>
      </div>
      <div class="row items-center q-gutter-xs">
        <q-btn
          color="deep-purple"
          icon="person_add"
          label="Assign Member to Task"
          no-caps
          dense
          unelevated
          class="q-px-sm"
          @click="openAssignTaskMemberDialog(null)"
        />
        <q-btn
          color="primary"
          icon="add"
          label="New Task"
          no-caps
          dense
          unelevated
          class="q-px-sm"
          @click="showCreateDialog = true"
        />
        <q-btn
          outline
          color="grey-8"
          icon="refresh"
          label="Refresh"
          no-caps
          dense
          class="q-px-sm"
          :loading="loading"
          @click="loadData"
        />
      </div>
    </div>

    <!-- STAT SUMMARY CARDS -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="q-pa-sm q-px-md row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Total Tasks</div>
              <div class="text-h6 text-weight-bold q-my-none">{{ tasks.length }}</div>
              <div class="text-caption text-primary">All managed tasks</div>
            </div>
            <q-avatar color="deep-purple-1" text-color="primary" icon="task_alt" size="36px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="q-pa-sm q-px-md row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">In Progress</div>
              <div class="text-h6 text-weight-bold q-my-none">
                {{ inProgressCount }}
              </div>
              <div class="text-caption text-info">Active work</div>
            </div>
            <q-avatar color="blue-1" text-color="blue" icon="autorenew" size="36px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="q-pa-sm q-px-md row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Completed</div>
              <div class="text-h6 text-weight-bold q-my-none">{{ completedCount }}</div>
              <div class="text-caption text-positive">Done</div>
            </div>
            <q-avatar
              color="green-1"
              text-color="positive"
              icon="check_circle_outline"
              size="36px"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="q-pa-sm q-px-md row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Pending / On Hold</div>
              <div class="text-h6 text-weight-bold q-my-none">{{ pendingCount }}</div>
              <div class="text-caption text-warning">Awaiting start</div>
            </div>
            <q-avatar color="amber-1" text-color="amber-9" icon="pending_actions" size="36px" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- FILTER BAR -->
    <q-card flat bordered class="dashboard-card q-mb-md">
      <q-card-section class="q-pa-md row items-center q-col-gutter-sm">
        <div class="col-12 col-md-4">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            clearable
            placeholder="Search by title or description..."
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-4 col-md-3">
          <q-select
            v-model="projectFilter"
            outlined
            dense
            emit-value
            map-options
            :options="projectFilterOptions"
            label="Filter Project"
          />
        </div>

        <div class="col-12 col-sm-4 col-md-3">
          <q-select
            v-model="statusFilter"
            outlined
            dense
            emit-value
            map-options
            :options="statusFilterOptions"
            label="Filter Status"
          />
        </div>

        <div class="col-12 col-sm-4 col-md-2">
          <q-select
            v-model="priorityFilter"
            outlined
            dense
            emit-value
            map-options
            :options="priorityFilterOptions"
            label="Filter Priority"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- LOADING / TABLE -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <q-card v-else flat bordered class="dashboard-card">
      <q-table
        flat
        :rows="filteredTasks"
        :columns="tableColumns"
        row-key="task_id"
        no-data-label="No tasks found matching criteria"
        :pagination="{ rowsPerPage: 6 }"
      >
        <template #body-cell-title="props">
          <q-td
            :props="props"
            style="max-width: 300px; overflow: hidden; padding-top: 14px; padding-bottom: 14px"
          >
            <div class="text-weight-bold ellipsis">{{ props.row.title }}</div>
            <div v-if="props.row.description" class="text-caption text-grey-6 ellipsis">
              {{ props.row.description }}
            </div>
          </q-td>
        </template>

        <template #body-cell-project="props">
          <q-td :props="props" style="padding-top: 14px; padding-bottom: 14px">
            <q-badge color="deep-purple-1" text-color="primary" class="q-pa-xs">
              {{ getProjectName(props.row.project_id) }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-resources="props">
          <q-td :props="props" style="padding-top: 14px; padding-bottom: 14px">
            <div
              v-if="props.row.assigned_resource_ids && props.row.assigned_resource_ids.length > 0"
            >
              <q-chip
                v-for="rId in props.row.assigned_resource_ids"
                :key="rId"
                dense
                color="primary"
                text-color="white"
                class="text-caption q-mr-xs"
              >
                {{ getResourceName(rId) }}
              </q-chip>
            </div>
            <span v-else class="text-caption text-grey-5">Unassigned</span>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props" style="padding-top: 14px; padding-bottom: 14px">
            <q-chip
              dense
              square
              :color="getStatusColor(props.row.status)"
              text-color="white"
              class="text-caption text-weight-bold"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-priority="props">
          <q-td :props="props" style="padding-top: 14px; padding-bottom: 14px">
            <q-chip
              dense
              square
              outline
              :color="getPriorityColor(props.row.priority)"
              class="text-caption text-weight-bold"
            >
              {{ props.row.priority }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-progress="props">
          <q-td :props="props" style="padding-top: 14px; padding-bottom: 14px">
            <div style="min-width: 110px">
              <div class="row justify-between text-caption">
                <span>{{ props.row.progress || 0 }}%</span>
                <span class="text-grey-6">{{ props.row.expected_effort || 0 }}h</span>
              </div>
              <q-linear-progress
                rounded
                size="5px"
                :value="(Number(props.row.progress) || 0) / 100"
                color="primary"
                track-color="grey-3"
              />
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td
            :props="props"
            auto-width
            style="white-space: nowrap; padding-top: 14px; padding-bottom: 14px"
          >
            <div class="row items-center justify-center q-gutter-xs no-wrap">
              <q-btn
                flat
                round
                dense
                icon="person_add"
                color="deep-purple"
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
              <q-btn flat round dense icon="edit" color="primary" @click="openEditModal(props.row)">
                <q-tooltip>Edit Task Details</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- ASSIGN MEMBER TO TASK DIALOG (POST /api/tasks/:id/assign) -->
    <q-dialog v-model="showAssignTaskMemberDialog">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Assign Member to Task</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignTaskMember">
          <q-card-section class="q-gutter-md">
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

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Assign to Task"
              :loading="submittingTaskMember"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ADD TASK DEPENDENCY DIALOG -->
    <q-dialog v-model="showDependencyDialog">
      <q-card style="min-width: 440px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">Add Task Dependency</div>
            <div class="text-caption text-grey-7">
              The selected task will depend on the predecessor.
            </div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleAddDependency">
          <q-card-section class="q-gutter-md">
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

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Add Dependency"
              :loading="submittingDependency"
              :disable="!selectedDependencyTaskId || !selectedPredecessorTaskId"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- CREATE TASK DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 440px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Create New Task</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleCreateTask">
          <q-card-section class="q-gutter-md">
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

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Create Task"
              :loading="submitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- EDIT TASK DIALOG -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 440px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Update Task #{{ editingTaskId }}</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleUpdateTask">
          <q-card-section class="q-gutter-md">
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
                <q-input
                  v-model="editForm.deadline"
                  outlined
                  dense
                  type="date"
                  label="Deadline"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Save Changes"
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
    style: 'max-width: 300px; overflow: hidden;',
  },
  { name: 'project', label: 'Project', field: (t) => t.project_id, align: 'center' },
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

function getStatusColor(status: string): string {
  if (status === 'COMPLETED') return 'positive';
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'ON_HOLD') return 'warning';
  return 'grey-7';
}

function getPriorityColor(priority: string): string {
  if (priority === 'CRITICAL') return 'negative';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'MEDIUM') return 'primary';
  return 'grey';
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
    await addTaskDependencyApi(
      selectedDependencyTaskId.value,
      selectedPredecessorTaskId.value,
    );

    const successor = tasks.value.find((task) => task.task_id === selectedDependencyTaskId.value);
    const predecessor = tasks.value.find((task) => task.task_id === selectedPredecessorTaskId.value);

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
