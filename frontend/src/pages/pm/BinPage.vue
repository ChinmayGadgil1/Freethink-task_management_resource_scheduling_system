<template>
  <q-page
    class="q-pa-lg bin-page"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
  >
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bolder row items-center gap-sm">
          <q-icon name="delete_outline" color="primary" size="32px" />
          <span>Recycle Bin</span>
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          Manage soft-deleted projects and tasks. Items here are hidden from active workspace and
          schedules, and can be restored anytime.
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="row items-center q-gutter-sm">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="refresh"
          label="Refresh"
          :loading="loading"
          @click="fetchBin"
        />
        <q-btn
          v-if="hasItems"
          unelevated
          no-caps
          color="negative"
          icon="delete_forever"
          label="Empty Bin"
          :loading="emptying"
          @click="confirmEmptyBin"
        />
      </div>
    </div>

    <!-- Active Safety Alert Banner -->
    <q-banner
      dense
      rounded
      class="q-mb-md"
      :class="$q.dark.isActive ? 'bg-grey-9 text-grey-3' : 'bg-blue-1 text-primary'"
    >
      <template #avatar>
        <q-icon name="shield" color="primary" />
      </template>
      <div class="text-caption">
        <strong>Active Work Protection:</strong> Restoring an item recalculates scheduling timelines
        automatically. Tasks and projects that were in progress cannot be accidentally lost.
      </div>
    </q-banner>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!hasItems"
      class="column flex-center q-pa-xl text-center rounded-borders"
      :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white shadow-1'"
      style="min-height: 380px"
    >
      <q-icon name="auto_delete" size="80px" color="grey-5" />
      <div class="text-h6 text-weight-bold q-mt-md">Your Recycle Bin is empty</div>
      <div class="text-body2 text-grey-6 q-mt-xs" style="max-width: 420px">
        No projects or tasks have been moved to the bin. When you delete active items, they will
        appear here for safe recovery.
      </div>
    </div>

    <!-- Bin Content Tabs -->
    <div v-else>
      <q-card
        flat
        bordered
        class="rounded-borders"
        :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
      >
        <q-tabs
          v-model="activeTab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
          class="text-grey-7 border-bottom"
        >
          <q-tab name="projects" icon="folder" no-caps>
            <div class="row items-center gap-xs">
              <span>Binned Projects</span>
              <q-badge color="purple" rounded :label="binnedProjects.length" />
            </div>
          </q-tab>
          <q-tab name="tasks" icon="task_alt" no-caps>
            <div class="row items-center gap-xs">
              <span>Binned Tasks</span>
              <q-badge color="teal" rounded :label="binnedTasks.length" />
            </div>
          </q-tab>
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated class="bg-transparent">
          <!-- PROJECTS TAB -->
          <q-tab-panel name="projects" class="q-pa-none">
            <div v-if="binnedProjects.length === 0" class="text-center q-pa-xl text-grey-6">
              <q-icon name="folder_open" size="48px" color="grey-4" />
              <div class="q-mt-sm">No projects currently in Recycle Bin</div>
            </div>

            <q-table
              v-else
              flat
              :rows="binnedProjects"
              :columns="projectColumns"
              row-key="project_id"
              :pagination="{ rowsPerPage: 10 }"
              class="bin-table bg-transparent"
            >
              <!-- Name & Description Slot -->
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div class="text-weight-bold text-subtitle2">{{ props.row.name }}</div>
                  <div class="text-caption text-grey-6 ellipsis" style="max-width: 320px">
                    {{ props.row.description || 'No description provided' }}
                  </div>
                </q-td>
              </template>

              <!-- Priority Badge Slot -->
              <template #body-cell-priority="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    size="sm"
                    :color="getPriorityColor(props.row.priority)"
                    text-color="white"
                    class="text-weight-bold"
                  >
                    {{ props.row.priority }}
                  </q-chip>
                </q-td>
              </template>

              <!-- Status Badge Slot -->
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge outline :color="getStatusColor(props.row.status)">
                    {{ props.row.status }}
                  </q-badge>
                </q-td>
              </template>

              <!-- Deleted At Slot -->
              <template #body-cell-deleted_at="props">
                <q-td :props="props" class="text-grey-6">
                  {{ formatDate(props.row.deleted_at) }}
                </q-td>
              </template>

              <!-- Actions Slot -->
              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn
                    dense
                    flat
                    no-caps
                    color="primary"
                    icon="restore"
                    label="Restore"
                    class="q-mr-sm"
                    :loading="restoringId === `proj_${props.row.project_id}`"
                    @click="handleRestoreProject(props.row)"
                  >
                    <q-tooltip>Restore project and reschedule tasks</q-tooltip>
                  </q-btn>
                  <q-btn
                    dense
                    flat
                    round
                    color="negative"
                    icon="delete_forever"
                    :loading="deletingId === `proj_${props.row.project_id}`"
                    @click="confirmPermanentDeleteProject(props.row)"
                  >
                    <q-tooltip>Permanently delete from database</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- TASKS TAB -->
          <q-tab-panel name="tasks" class="q-pa-none">
            <div v-if="binnedTasks.length === 0" class="text-center q-pa-xl text-grey-6">
              <q-icon name="check_circle_outline" size="48px" color="grey-4" />
              <div class="q-mt-sm">No tasks currently in Recycle Bin</div>
            </div>

            <q-table
              v-else
              flat
              :rows="binnedTasks"
              :columns="taskColumns"
              row-key="task_id"
              :pagination="{ rowsPerPage: 10 }"
              class="bin-table bg-transparent"
            >
              <!-- Title & Project Slot -->
              <template #body-cell-title="props">
                <q-td :props="props">
                  <div class="text-weight-bold text-subtitle2">{{ props.row.title }}</div>
                  <div class="text-caption text-purple text-weight-medium">
                    📂 {{ props.row.project_name }}
                    <span
                      v-if="props.row.project_deleted_at"
                      class="text-negative text-caption q-ml-xs"
                      >(Project also in bin)</span
                    >
                  </div>
                </q-td>
              </template>

              <!-- Priority Slot -->
              <template #body-cell-priority="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    size="sm"
                    :color="getPriorityColor(props.row.priority)"
                    text-color="white"
                    class="text-weight-bold"
                  >
                    {{ props.row.priority }}
                  </q-chip>
                </q-td>
              </template>

              <!-- Effort Slot -->
              <template #body-cell-expected_effort="props">
                <q-td :props="props">
                  <span>{{ props.row.expected_effort }} hrs</span>
                </q-td>
              </template>

              <!-- Assignees Slot -->
              <template #body-cell-assigned_resource_names="props">
                <q-td :props="props">
                  <span v-if="props.row.assigned_resource_names" class="text-body2">
                    {{ props.row.assigned_resource_names }}
                  </span>
                  <span v-else class="text-grey-5 italic">Unassigned</span>
                </q-td>
              </template>

              <!-- Deleted At Slot -->
              <template #body-cell-deleted_at="props">
                <q-td :props="props" class="text-grey-6">
                  {{ formatDate(props.row.deleted_at) }}
                </q-td>
              </template>

              <!-- Actions Slot -->
              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn
                    dense
                    flat
                    no-caps
                    color="primary"
                    icon="restore"
                    label="Restore"
                    class="q-mr-sm"
                    :loading="restoringId === `task_${props.row.task_id}`"
                    @click="handleRestoreTask(props.row)"
                  >
                    <q-tooltip>Restore task and update Gantt schedule</q-tooltip>
                  </q-btn>
                  <q-btn
                    dense
                    flat
                    round
                    color="negative"
                    icon="delete_forever"
                    :loading="deletingId === `task_${props.row.task_id}`"
                    @click="confirmPermanentDeleteTask(props.row)"
                  >
                    <q-tooltip>Permanently delete from database</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDialog.open" persistent>
      <q-card style="width: 100%; max-width: 440px" class="rounded-borders">
        <q-card-section class="row items-center gap-md">
          <q-avatar
            :icon="confirmDialog.icon || 'warning'"
            :color="confirmDialog.color || 'negative'"
            text-color="white"
          />
          <div>
            <div class="text-h6 text-weight-bold">{{ confirmDialog.title }}</div>
            <div class="text-body2 text-grey-7 q-mt-xs">{{ confirmDialog.message }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            no-caps
            :label="confirmDialog.actionLabel"
            :color="confirmDialog.color || 'negative'"
            :loading="confirmDialog.loading"
            @click="confirmDialog.onConfirm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  getBinContentsApi,
  restoreProjectApi,
  restoreTaskApi,
  permanentDeleteProjectApi,
  permanentDeleteTaskApi,
  emptyBinApi,
  type BinnedProject,
  type BinnedTask,
} from '@/services/api';

const $q = useQuasar();

const loading = ref(false);
const emptying = ref(false);
const restoringId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const activeTab = ref<'projects' | 'tasks'>('projects');

const binnedProjects = ref<BinnedProject[]>([]);
const binnedTasks = ref<BinnedTask[]>([]);

const hasItems = computed(() => binnedProjects.value.length > 0 || binnedTasks.value.length > 0);

const confirmDialog = ref<{
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  color?: string;
  icon?: string;
  loading: boolean;
  onConfirm: () => void;
}>({
  open: false,
  title: '',
  message: '',
  actionLabel: 'Delete Forever',
  color: 'negative',
  icon: 'warning',
  loading: false,
  onConfirm: () => {},
});

const projectColumns: QTableColumn[] = [
  { name: 'name', label: 'Project Name', field: 'name', align: 'left', sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'center', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'deleted_at', label: 'Binned On', field: 'deleted_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

const taskColumns: QTableColumn[] = [
  { name: 'title', label: 'Task & Project', field: 'title', align: 'left', sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'center', sortable: true },
  {
    name: 'expected_effort',
    label: 'Effort',
    field: 'expected_effort',
    align: 'center',
    sortable: true,
  },
  {
    name: 'assigned_resource_names',
    label: 'Assignees',
    field: 'assigned_resource_names',
    align: 'left',
  },
  { name: 'deleted_at', label: 'Binned On', field: 'deleted_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

async function fetchBin() {
  loading.value = true;
  try {
    const res = await getBinContentsApi();
    binnedProjects.value = res.projects || [];
    binnedTasks.value = res.tasks || [];
    if (binnedProjects.value.length === 0 && binnedTasks.value.length > 0) {
      activeTab.value = 'tasks';
    }
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to load Recycle Bin',
      position: 'top-right',
    });
  } finally {
    loading.value = false;
  }
}

async function handleRestoreProject(proj: BinnedProject) {
  restoringId.value = `proj_${proj.project_id}`;
  try {
    await restoreProjectApi(proj.project_id);
    $q.notify({
      type: 'positive',
      message: `Project "${proj.name}" restored successfully and schedules updated!`,
      position: 'top-right',
      icon: 'check_circle',
    });
    await fetchBin();
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to restore project',
      position: 'top-right',
    });
  } finally {
    restoringId.value = null;
  }
}

async function executeRestoreTask(task: BinnedTask) {
  restoringId.value = `task_${task.task_id}`;
  try {
    const res = (await restoreTaskApi(task.task_id)) as unknown as { projectId?: number };
    const restoredProjectId = res?.projectId || task.project_id;

    // Optimistically update local collections
    binnedTasks.value = binnedTasks.value.filter((t) => t.task_id !== task.task_id);
    if (task.project_deleted_at && restoredProjectId) {
      binnedProjects.value = binnedProjects.value.filter(
        (p) => Number(p.project_id) !== Number(restoredProjectId),
      );
    }

    $q.notify({
      type: 'positive',
      message: task.project_deleted_at
        ? `Task "${task.title}" and its parent project "${task.project_name}" restored successfully!`
        : `Task "${task.title}" restored successfully and Gantt chart updated!`,
      position: 'top-right',
      icon: 'check_circle',
    });
    confirmDialog.value.open = false;
    await fetchBin();
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to restore task',
      position: 'top-right',
    });
  } finally {
    restoringId.value = null;
    confirmDialog.value.loading = false;
  }
}

async function handleRestoreTask(task: BinnedTask) {
  if (task.project_deleted_at) {
    confirmDialog.value = {
      open: true,
      title: 'Restore Parent Project?',
      message: `The parent project "${task.project_name}" is currently in the Recycle Bin. Restoring this task will also restore the entire project and make it active. Do you wish to continue?`,
      actionLabel: 'Restore Task & Project',
      color: 'primary',
      icon: 'restore_from_trash',
      loading: false,
      onConfirm: () => {
        confirmDialog.value.loading = true;
        void executeRestoreTask(task);
      },
    };
    return;
  }
  await executeRestoreTask(task);
}

function confirmPermanentDeleteProject(proj: BinnedProject) {
  confirmDialog.value = {
    open: true,
    title: 'Permanently Delete Project?',
    message: `Are you sure you want to permanently erase "${proj.name}" and all its tasks? This action cannot be undone.`,
    actionLabel: 'Delete Forever',
    loading: false,
    onConfirm: () => {
      void (async () => {
        confirmDialog.value.loading = true;
        try {
          await permanentDeleteProjectApi(proj.project_id);
          $q.notify({
            type: 'positive',
            message: `Project "${proj.name}" permanently deleted`,
            position: 'top-right',
          });
          confirmDialog.value.open = false;
          await fetchBin();
        } catch (err: unknown) {
          $q.notify({
            type: 'negative',
            message: err instanceof Error ? err.message : 'Failed to delete project',
            position: 'top-right',
          });
        } finally {
          confirmDialog.value.loading = false;
        }
      })();
    },
  };
}

function confirmPermanentDeleteTask(task: BinnedTask) {
  confirmDialog.value = {
    open: true,
    title: 'Permanently Delete Task?',
    message: `Are you sure you want to permanently erase "${task.title}"? All assignments, dependencies, work logs, and schedule history will be purged. This action cannot be undone.`,
    actionLabel: 'Delete Forever',
    loading: false,
    onConfirm: () => {
      void (async () => {
        confirmDialog.value.loading = true;
        try {
          await permanentDeleteTaskApi(task.task_id);
          $q.notify({
            type: 'positive',
            message: `Task "${task.title}" permanently deleted`,
            position: 'top-right',
          });
          confirmDialog.value.open = false;
          await fetchBin();
        } catch (err: unknown) {
          $q.notify({
            type: 'negative',
            message: err instanceof Error ? err.message : 'Failed to delete task',
            position: 'top-right',
          });
        } finally {
          confirmDialog.value.loading = false;
        }
      })();
    },
  };
}

function confirmEmptyBin() {
  confirmDialog.value = {
    open: true,
    title: 'Empty Recycle Bin?',
    message:
      'This will permanently wipe all binned projects and tasks from the database. This action is irreversible.',
    actionLabel: 'Empty Everything',
    loading: false,
    onConfirm: () => {
      void (async () => {
        confirmDialog.value.loading = true;
        try {
          const res = await emptyBinApi();
          $q.notify({
            type: 'positive',
            message: res.message || 'Recycle Bin emptied successfully',
            position: 'top-right',
          });
          confirmDialog.value.open = false;
          await fetchBin();
        } catch (err: unknown) {
          $q.notify({
            type: 'negative',
            message: err instanceof Error ? err.message : 'Failed to empty bin',
            position: 'top-right',
          });
        } finally {
          confirmDialog.value.loading = false;
        }
      })();
    },
  };
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return 'red-9';
    case 'HIGH':
      return 'deep-orange';
    case 'MEDIUM':
      return 'amber-9';
    case 'LOW':
      return 'teal';
    default:
      return 'grey';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'positive';
    case 'IN_PROGRESS':
      return 'primary';
    case 'SCHEDULED':
      return 'info';
    case 'ON_HOLD':
      return 'warning';
    default:
      return 'grey';
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dateStr;
  }
}

onMounted(() => {
  void fetchBin();
});
</script>

<style scoped>
.bin-page {
  min-height: 100vh;
}
.bin-table {
  border-radius: 8px;
}
.border-bottom {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}
</style>
