<template>
  <q-page class="pm-page resources-page">
    <!-- PAGE HEADER -->
    <div class="page-header-row">
      <div>
        <div class="page-title">PM Task & Resource Management</div>
        <div class="page-subtitle">
          List tasks assigned by PM and assign team resources to projects
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          icon="person_add"
          label="Assign Resource to Project"
          class="action-btn-primary"
          @click="showProjectMemberDialog = true"
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
      <StatCard
        title="Assigned Resources"
        :value="resourceMap.length"
        subtitle="Active in backend"
        icon="groups"
        color="purple"
        note-class="note-purple"
      />

      <StatCard
        title="Tasks Assigned by PM"
        :value="taskList.length"
        subtitle="Across projects"
        icon="task_alt"
        color="blue"
        note-class="note-blue"
      />

      <StatCard
        title="Total Effort Allocated"
        :value="formatHours(totalEffortHours)"
        subtitle="Expected effort hours"
        icon="schedule"
        color="green"
        note-class="note-green"
      />

      <StatCard
        title="Managed Projects"
        :value="projectList.length"
        subtitle="Active projects"
        icon="folder"
        color="orange"
        note-class="note-orange"
      />
    </div>

    <!-- MAIN TABS: RESOURCE ALLOCATION VS TASKS ASSIGNED BY PM -->
    <q-card flat bordered class="table-card q-mb-lg">
      <q-tabs
        v-model="mainTab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="resource-tabs"
      >
        <q-tab
          name="resources"
          icon="groups"
          label="Resource Directory & Allocation"
          class="resource-tab"
        />
        <q-tab name="tasks" icon="task_alt" label="Tasks Assigned by PM" class="resource-tab" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="mainTab" animated>
        <!-- TAB 1: RESOURCES -->
        <q-tab-panel name="resources" class="q-pa-md">
          <!-- SEARCH & FILTER BAR -->
          <div class="filter-card q-pa-sm q-mb-md">
            <div class="row items-center q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  clearable
                  placeholder="Search resources..."
                  class="filter-search"
                >
                  <template #prepend>
                    <q-icon name="search" size="18px" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="projectFilter"
                  outlined
                  dense
                  emit-value
                  map-options
                  :options="projectFilterOptions"
                  label="Filter by Project"
                  class="filter-select"
                  @update:model-value="loadData"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="statusFilter"
                  outlined
                  dense
                  emit-value
                  map-options
                  :options="statusOptions"
                  label="Workload Status"
                  class="filter-select"
                />
              </div>

              <div class="col-12 col-md-2 row justify-end items-center">
                <q-btn-toggle
                  v-model="viewMode"
                  unelevated
                  dense
                  toggle-color="primary"
                  toggle-text-color="white"
                  color="grey-2"
                  text-color="grey-8"
                  class="view-toggle-btn"
                  :options="[
                    { icon: 'grid_view', value: 'grid' },
                    { icon: 'format_list_bulleted', value: 'table' },
                  ]"
                />
              </div>
            </div>
          </div>

          <!-- LOADING / EMPTY STATES -->
          <div v-if="loading" class="row justify-center q-pa-xl">
            <q-spinner color="primary" size="40px" />
          </div>

          <div
            v-else-if="filteredResources.length === 0"
            class="row justify-center q-pa-xl text-center"
          >
            <q-card flat bordered class="empty-state-card q-pa-lg">
              <q-avatar size="58px" class="empty-avatar">
                <q-icon name="person_off" size="28px" />
              </q-avatar>
              <div class="text-subtitle1 text-weight-bold text-dark q-mt-sm">
                No Resource Allocations Found
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Assign a resource to a project or assign tasks to populate resource allocation
                metrics.
              </div>
              <q-btn
                unelevated
                no-caps
                icon="person_add"
                label="Assign Resource to Project"
                class="action-btn-primary q-mt-md"
                @click="showProjectMemberDialog = true"
              />
            </q-card>
          </div>

          <!-- GRID VIEW -->
          <div v-else-if="viewMode === 'grid'" class="row q-col-gutter-md">
            <div
              v-for="res in filteredResources"
              :key="res.resource_id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card flat bordered class="resource-grid-card full-height column justify-between cursor-pointer" @click="goToDetails(res.resource_id)">
                <q-card-section class="q-pa-md">
                  <!-- CARD TOP: AVATAR, NAME, CHIP -->
                  <div class="row items-center justify-between no-wrap q-mb-md">
                    <div class="row items-center no-wrap">
                      <q-avatar size="42px" class="resource-card-avatar avatar-purple q-mr-sm">
                        {{ getInitials(res.name) }}
                      </q-avatar>
                      <div>
                        <div class="resource-name ellipsis" style="max-width: 140px">
                          {{ res.name }}
                        </div>
                        <div class="resource-role">Team Resource</div>
                      </div>
                    </div>

                    <q-chip dense square :class="['status-chip', getWorkloadChipClass(res.status)]">
                      {{ formatWorkloadStatus(res.status) }}
                    </q-chip>
                  </div>

                  <!-- WORKLOAD METRICS BOX -->
                  <div class="workload-metric-box q-pa-sm q-mb-sm">
                    <div class="row justify-between text-caption q-mb-xs">
                      <span class="text-grey-7 text-weight-medium">Workload Effort</span>
                      <span class="text-weight-bold text-dark"
                        >{{ formatHours(res.totalEffort) }} ({{ res.utilization }}%)</span
                      >
                    </div>
                    <q-linear-progress
                      rounded
                      size="6px"
                      :value="Math.min(100, res.utilization) / 100"
                      :color="getUtilizationColor(res.utilization)"
                      track-color="grey-3"
                      class="workload-progress"
                    />
                  </div>

                  <!-- STAT COUNTS -->
                  <div class="row justify-between text-caption text-grey-7 q-pt-xs q-mb-sm">
                    <div class="row items-center">
                      <q-icon name="task_alt" size="15px" color="teal" class="q-mr-xs" />
                      <span class="text-weight-medium text-dark">{{ res.tasks.length }} Tasks</span>
                    </div>
                    <div class="row items-center">
                      <q-icon name="folder" size="15px" color="primary" class="q-mr-xs" />
                      <span class="text-weight-medium text-dark"
                        >{{ res.projectsCount }} Projects</span
                      >
                    </div>
                  </div>

                  <!-- PROJECTS WORKING ON -->
                  <div class="q-mt-xs">
                    <div class="text-caption text-grey-7 text-weight-medium q-mb-xs">
                      Projects Working On:
                    </div>
                    <div
                      v-if="res.projectNames && res.projectNames.length > 0"
                      class="row q-gutter-xs wrap"
                    >
                      <q-chip
                        v-for="pName in res.projectNames"
                        :key="pName"
                        dense
                        square
                        class="project-badge"
                      >
                        <q-icon name="folder" size="12px" class="q-mr-xs" />
                        {{ pName }}
                      </q-chip>
                    </div>
                    <div v-else class="text-caption text-grey-5 italic">
                      No active project assignments
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <!-- CARD ACTIONS -->
                <q-card-actions class="q-pa-sm row q-col-gutter-xs">
                  <div class="col-6">
                    <q-btn
                      outline
                      dense
                      no-caps
                      label="View Profile"
                      class="full-width action-btn-outline"
                      @click.stop="goToDetails(res.resource_id)"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      unelevated
                      dense
                      no-caps
                      icon="add_task"
                      label="Assign Task"
                      class="full-width action-btn-primary"
                      @click.stop="openAssignModal(res.resource_id)"
                    />
                  </div>
                </q-card-actions>
              </q-card>
            </div>
          </div>

          <!-- TABLE VIEW -->
          <q-card v-else flat bordered class="table-card">
            <q-table
              flat
              :rows="filteredResources"
              :columns="tableColumns"
              row-key="resource_id"
              :pagination="{ rowsPerPage: 10 }"
              class="resources-table"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div
                    class="row items-center cursor-pointer"
                    @click="goToDetails(props.row.resource_id)"
                  >
                    <q-avatar size="32px" class="avatar-purple q-mr-sm">
                      {{ getInitials(props.row.name) }}
                    </q-avatar>
                    <div>
                      <div class="text-weight-bold text-dark">{{ props.row.name }}</div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-projects="props">
                <q-td :props="props">
                  <div
                    v-if="props.row.projectNames && props.row.projectNames.length > 0"
                    class="row q-gutter-xs wrap"
                  >
                    <q-chip
                      v-for="pName in props.row.projectNames"
                      :key="pName"
                      dense
                      square
                      class="project-badge"
                    >
                      <q-icon name="folder" size="12px" class="q-mr-xs" />
                      {{ pName }}
                    </q-chip>
                  </div>
                  <span v-else class="text-caption text-grey-5">Unassigned</span>
                </q-td>
              </template>

              <template #body-cell-utilization="props">
                <q-td :props="props">
                  <div style="min-width: 130px">
                    <div class="row justify-between text-caption progress-label-row">
                      <span class="text-weight-bold">{{ props.row.utilization }}%</span>
                      <span class="text-grey-6">({{ formatHours(props.row.totalEffort) }})</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="5px"
                      :value="Math.min(100, props.row.utilization) / 100"
                      :color="getUtilizationColor(props.row.utilization)"
                      track-color="grey-3"
                    />
                  </div>
                </q-td>
              </template>

              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    square
                    :class="['status-chip', getWorkloadChipClass(props.row.status)]"
                  >
                    {{ formatWorkloadStatus(props.row.status) }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" auto-width>
                  <q-btn
                    flat
                    round
                    dense
                    icon="visibility"
                    color="primary"
                    @click="goToDetails(props.row.resource_id)"
                  >
                    <q-tooltip>View Profile Details</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card>
        </q-tab-panel>

        <!-- TAB 2: TASKS ASSIGNED BY PM -->
        <q-tab-panel name="tasks" class="q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1 text-weight-bold text-dark">
              Tasks Assigned across Managed Projects
            </div>
            <q-chip dense square class="project-badge text-weight-bold">
              {{ taskList.length }} Total Tasks
            </q-chip>
          </div>

          <q-table
            flat
            :rows="taskList"
            :columns="pmTaskColumns"
            row-key="task_id"
            no-data-label="No tasks currently assigned by PM"
            :pagination="{ rowsPerPage: 10 }"
            class="resources-table"
          >
            <template #body-cell-project="props">
              <q-td :props="props">
                <q-chip dense square class="project-badge">
                  <q-icon name="folder" size="12px" class="q-mr-xs" />
                  {{ getProjectName(props.row.project_id) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip dense square :class="['status-chip', getTaskStatusClass(props.row.status)]">
                  {{ formatTaskStatus(props.row.status) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-priority="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :class="['priority-chip', getPriorityClass(props.row.priority)]"
                >
                  {{ props.row.priority }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-resources="props">
              <q-td :props="props">
                <div
                  v-if="
                    props.row.assigned_resource_ids && props.row.assigned_resource_ids.length > 0
                  "
                  class="row q-gutter-xs wrap"
                >
                  <q-chip
                    v-for="rId in props.row.assigned_resource_ids"
                    :key="rId"
                    dense
                    square
                    removable
                    class="resource-chip"
                    @remove="confirmUnassignTaskResource(props.row, rId)"
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

            <template #body-cell-deadline="props">
              <q-td :props="props" class="date-cell">
                {{ formatDate(props.row.deadline) }}
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ASSIGN RESOURCE TO PROJECT DIALOG (POST /api/projects/:id/members) -->
    <q-dialog v-model="showProjectMemberDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1 text-weight-bold text-dark">Assign Resource to Project</div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignProjectMember">
          <q-card-section class="q-gutter-md q-pt-md">
            <q-select
              v-model="projectMemberForm.project_id"
              outlined
              dense
              label="Select Project"
              :options="projectOptions"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Project is required']"
            />

            <q-select
              v-model="projectMemberForm.user_ids"
              outlined
              dense
              multiple
              clearable
              emit-value
              map-options
              :display-value="
                projectMemberForm.user_ids.length
                  ? `${projectMemberForm.user_ids.length} selected`
                  : ''
              "
              label="Select Resource Member(s)"
              :options="resourceMemberSelectOptions"
              :rules="[
                (val) => (val && val.length > 0) || 'At least one Resource Member is required',
              ]"
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" :disable="opt.alreadyMember">
                  <q-item-section side>
                    <q-checkbox
                      :model-value="selected || opt.alreadyMember"
                      :disable="opt.alreadyMember"
                      color="primary"
                      @update:model-value="toggleOption(opt)"
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
              label="Assign to Project"
              class="action-btn-primary"
              :loading="submittingMember"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ASSIGN TASK DIALOG (POST /api/tasks) -->
    <q-dialog v-model="showAssignDialog">
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1 text-weight-bold text-dark">
            Assign Task to {{ getResourceName(selectedResourceId || 0) }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignTask">
          <q-card-section class="q-gutter-y-md q-pt-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="assignForm.project_id"
                  outlined
                  dense
                  label="Select Project"
                  :options="projectOptions"
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Project is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="assignForm.title"
                  outlined
                  dense
                  label="Task Title"
                  :rules="[(val) => !!val.trim() || 'Title is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="assignForm.description"
                  outlined
                  dense
                  type="textarea"
                  label="Description"
                  autogrow
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="assignForm.priority"
                  outlined
                  dense
                  label="Priority"
                  :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="assignForm.expected_effort"
                  outlined
                  dense
                  type="number"
                  label="Effort (Hours)"
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
              label="Assign Task"
              class="action-btn-primary"
              :loading="submitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- CONFIRM UNASSIGN TASK RESOURCE DIALOG -->
    <ConfirmActionDialog
      v-model="showUnassignTaskDialog"
      title="Unassign Resource from Task"
      subtitle=""
      icon="person_remove"
      confirm-label="Unassign"
      :loading="unassigningTask"
      @confirm="handleExecuteUnassignTask"
    >
      Are you sure you want to remove
      <strong>{{ unassignTaskTarget.resourceName }}</strong> from the task
      <strong>"{{ unassignTaskTarget.taskTitle }}"</strong>?
    </ConfirmActionDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog.vue';
import { formatDate, formatStatus as formatTaskStatus, formatHours, formatNumber, getInitials } from '@/utils/formatters';
import { getTaskStatusClass, getPriorityClass } from '@/utils/taskHelpers';
import {
  assignProjectMemberApi,
  createTaskApi,
  getProjectsApi,
  getResourcesApi,
  getResourceProjectsApi,
  getTasksApi,
  unassignTaskResourceApi,
  type Project,
  type ResourceUser,
  type Task,
} from '@/services/api';

const $q = useQuasar();
const router = useRouter();

const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('ALL');
const projectFilter = ref<number | 'ALL'>('ALL');
const mainTab = ref<'resources' | 'tasks'>('resources');
const viewMode = ref<'grid' | 'table'>('grid');

const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);
const resourceProjectsMap = ref<Record<number, Project[]>>({});

const showAssignDialog = ref(false);
const selectedResourceId = ref<number | null>(null);
const submitting = ref(false);

const showProjectMemberDialog = ref(false);
const submittingMember = ref(false);

const showUnassignTaskDialog = ref(false);
const unassigningTask = ref(false);
const unassignTaskTarget = reactive({
  taskId: 0,
  taskTitle: '',
  resourceId: 0,
  resourceName: '',
});

function confirmUnassignTaskResource(task: Task, rId: number) {
  unassignTaskTarget.taskId = task.task_id;
  unassignTaskTarget.taskTitle = task.title;
  unassignTaskTarget.resourceId = rId;
  unassignTaskTarget.resourceName = getResourceName(rId);
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
    await loadData();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unassign resource',
    });
  } finally {
    unassigningTask.value = false;
  }
}

const projectMemberForm = reactive({
  project_id: null as number | null,
  user_ids: [] as number[],
});

const assignForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_effort: number;
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  expected_effort: 8,
});

const statusOptions = [
  { label: 'All Workloads', value: 'ALL' },
  { label: 'Available (<75%)', value: 'AVAILABLE' },
  { label: 'High Load (75-100%)', value: 'HIGH_LOAD' },
  { label: 'Overallocated (>100%)', value: 'OVERALLOCATED' },
];

const projectFilterOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...projectList.value.map((p) => ({
    label: p.name,
    value: p.project_id,
  })),
]);

interface ResourceAggregate {
  resource_id: number;
  name: string;
  tasks: Task[];
  projectsCount: number;
  projectNames: string[];
  totalEffort: number;
  utilization: number;
  status: 'AVAILABLE' | 'HIGH_LOAD' | 'OVERALLOCATED';
}

const tableColumns: QTableColumn<ResourceAggregate>[] = [
  { name: 'name', label: 'Resource Member', field: (r) => r.name, align: 'left' },
  { name: 'tasks', label: 'Assigned Tasks', field: (r) => r.tasks.length, align: 'center' },
  { name: 'projects', label: 'Projects Working On', field: (r) => r.projectsCount, align: 'left' },
  { name: 'effort', label: 'Allocated Hours', field: (r) => formatNumber(r.totalEffort), align: 'center' },
  { name: 'utilization', label: 'Utilization', field: (r) => r.utilization, align: 'left' },
  { name: 'status', label: 'Status', field: (r) => r.status, align: 'center' },
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

const pmTaskColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  {
    name: 'project',
    label: 'Project Name',
    field: (t) => getProjectName(t.project_id),
    align: 'left',
  },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'resources', label: 'Assigned Resources', field: () => '', align: 'left' },
  {
    name: 'effort',
    label: 'Effort (Hrs)',
    field: (t) => formatNumber(t.expected_effort || 0),
    align: 'center',
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: (t) => (t.deadline ? t.deadline.split('T')[0] : 'TBD'),
    align: 'left',
  },
];

function getProjectName(id: number): string {
  const p = projectList.value.find((item) => item.project_id === id);
  return p ? p.name : `Project #${id}`;
}

async function loadData() {
  loading.value = true;
  try {
    const selectedProjectId =
      projectFilter.value === 'ALL' ? undefined : Number(projectFilter.value);
    const [projects, tasks, resources] = await Promise.all([
      getProjectsApi(),
      getTasksApi(selectedProjectId),
      getResourcesApi(selectedProjectId),
    ]);
    projectList.value = projects;
    taskList.value = tasks;
    resourceList.value = resources;

    const resourceProjectsList = await Promise.all(
      resources.map((r) => getResourceProjectsApi(r.user_id).catch(() => [])),
    );
    const pMap: Record<number, Project[]> = {};
    resources.forEach((r, idx) => {
      pMap[r.user_id] = resourceProjectsList[idx] || [];
    });
    resourceProjectsMap.value = pMap;

    if (projects.length > 0 && !projectMemberForm.project_id) {
      projectMemberForm.project_id = projects[0]!.project_id;
    }
  } catch (error) {
    console.error('Failed to load backend data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});

const resourceNamesMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const r of resourceList.value) {
    map[r.user_id] = r.name;
  }
  return map;
});

function getResourceName(id: number): string {
  return resourceNamesMap.value[id] || 'Team Resource';
}

const projectMemberFormExistingMembers = ref<ResourceUser[]>([]);

watch(
  () => projectMemberForm.project_id,
  async (newProjectId) => {
    if (newProjectId) {
      projectMemberFormExistingMembers.value = await getResourcesApi(newProjectId).catch(() => []);
    } else {
      projectMemberFormExistingMembers.value = [];
    }
  },
  { immediate: true },
);

watch(
  () => showProjectMemberDialog.value,
  async (isOpen) => {
    if (isOpen) {
      if (!projectMemberForm.project_id && projectList.value.length > 0) {
        projectMemberForm.project_id = projectList.value[0]!.project_id;
      }
      if (projectMemberForm.project_id) {
        projectMemberFormExistingMembers.value = await getResourcesApi(
          projectMemberForm.project_id,
        ).catch(() => []);
      }
      projectMemberForm.user_ids = [];
    }
  },
);

const resourceMemberSelectOptions = computed(() => {
  const existingIds = new Set(
    projectMemberFormExistingMembers.value
      .map((m) => Number(m.user_id))
      .filter((id) => !isNaN(id) && id > 0),
  );
  return resourceList.value.map((r) => {
    const rId = Number(r.user_id);
    const isMember = existingIds.has(rId);
    return {
      label: r.name,
      value: rId,
      alreadyMember: isMember,
      disable: isMember,
    };
  });
});

const resourceMap = computed(() => {
  const map = new Map<number, ResourceAggregate>();

  for (const r of resourceList.value) {
    map.set(r.user_id, {
      resource_id: r.user_id,
      name: r.name,
      tasks: [],
      projectsCount: 0,
      projectNames: [],
      totalEffort: 0,
      utilization: 0,
      status: 'AVAILABLE',
    });
  }

  for (const t of taskList.value) {
    const rIds = t.assigned_resource_ids || [];
    const effort = Number(t.expected_effort) || 0;

    for (const rid of rIds) {
      if (!map.has(rid)) {
        map.set(rid, {
          resource_id: rid,
          name: getResourceName(rid),
          tasks: [],
          projectsCount: 0,
          projectNames: [],
          totalEffort: 0,
          utilization: 0,
          status: 'AVAILABLE',
        });
      }

      const item = map.get(rid)!;
      item.tasks.push(t);
      item.totalEffort += effort;
    }
  }

  const projectMap = new Map<number, string>();
  for (const p of projectList.value) {
    projectMap.set(p.project_id, p.name);
  }

  // Compute stats for each resource combining task assignments and direct project memberships
  const result: ResourceAggregate[] = [];
  for (const item of map.values()) {
    const taskProjectIds = item.tasks.map((t) => t.project_id);
    const memberProjects = resourceProjectsMap.value[item.resource_id] || [];
    const memberProjectIds = memberProjects.map((p) => p.project_id);

    const allProjectIds = new Set([...taskProjectIds, ...memberProjectIds]);
    item.projectsCount = allProjectIds.size;

    const names = new Set<string>();
    for (const pid of allProjectIds) {
      const name = projectMap.get(pid);
      if (name) {
        names.add(name);
      }
    }
    for (const mp of memberProjects) {
      if (mp.name) {
        names.add(mp.name);
      }
    }
    item.projectNames = Array.from(names);

    // Standard 40h capacity
    item.utilization = Math.min(150, Math.round((item.totalEffort / 40) * 100));

    if (item.utilization > 100) item.status = 'OVERALLOCATED';
    else if (item.utilization >= 75) item.status = 'HIGH_LOAD';
    else item.status = 'AVAILABLE';

    result.push(item);
  }

  return result;
});

const totalEffortHours = computed(() =>
  resourceMap.value.reduce((acc, r) => acc + r.totalEffort, 0),
);

const filteredResources = computed(() => {
  return resourceMap.value.filter((r) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q || r.name.toLowerCase().includes(q) || String(r.resource_id).includes(q);

    const matchesStatus = statusFilter.value === 'ALL' || r.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

const projectOptions = computed(() =>
  projectList.value.map((p) => ({
    label: p.name,
    value: p.project_id,
  })),
);

function getUtilizationColor(util: number): string {
  if (util > 100) return 'negative';
  if (util >= 75) return 'warning';
  return 'positive';
}

function formatWorkloadStatus(status: string): string {
  if (status === 'OVERALLOCATED') return 'Overallocated';
  if (status === 'HIGH_LOAD') return 'High Load';
  return 'Available';
}

function getWorkloadChipClass(status: string): string {
  if (status === 'OVERALLOCATED') return 'chip-soft-red';
  if (status === 'HIGH_LOAD') return 'chip-soft-orange';
  return 'chip-soft-green';
}

function goToDetails(id: number) {
  void router.push(`/pm/resources/${id}`);
}

function openAssignModal(resourceId: number) {
  selectedResourceId.value = resourceId;
  assignForm.project_id = projectList.value[0]?.project_id ?? null;
  assignForm.title = '';
  assignForm.description = '';
  assignForm.priority = 'MEDIUM';
  assignForm.expected_effort = 8;
  showAssignDialog.value = true;
}

async function handleAssignProjectMember() {
  if (!projectMemberForm.project_id || !projectMemberForm.user_ids.length) return;

  submittingMember.value = true;
  try {
    for (const uId of projectMemberForm.user_ids) {
      await assignProjectMemberApi(projectMemberForm.project_id, uId);
    }
    $q.notify({
      type: 'positive',
      message: `${projectMemberForm.user_ids.length} resource(s) assigned to project successfully`,
    });
    showProjectMemberDialog.value = false;
    projectMemberForm.user_ids = [];
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign resource(s) to project';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submittingMember.value = false;
  }
}

async function handleAssignTask() {
  if (!selectedResourceId.value || !assignForm.project_id || !assignForm.title.trim()) {
    return;
  }

  submitting.value = true;
  try {
    await createTaskApi({
      project_id: assignForm.project_id,
      title: assignForm.title.trim(),
      description: assignForm.description || null,
      priority: assignForm.priority,
      status: 'SCHEDULED',
      expected_effort: Number(assignForm.expected_effort) || 8,
      assigned_resource_ids: [selectedResourceId.value],
    });

    $q.notify({
      type: 'positive',
      message: 'Task assigned successfully',
    });

    showAssignDialog.value = false;
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign task';
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
.resource-tabs {
  background: var(--wo-bg-page, #fafbfc);
  border-bottom: 1px solid var(--wo-border, #e9ebef);
}

.resource-tab {
  font-size: 13px;
  font-weight: 600;
  min-height: 46px;
}

.filter-search :deep(.q-field__control),
.filter-select :deep(.q-field__control) {
  min-height: 38px;
  border-radius: 8px;
}

.filter-search :deep(.q-field__label),
.filter-search :deep(.q-field__native),
.filter-search :deep(.q-field__input),
.filter-select :deep(.q-field__label),
.filter-select :deep(.q-field__native) {
  font-size: 12px;
}

.view-toggle-btn {
  border-radius: 8px;
  border: 1px solid var(--wo-border, #e5e7ec);
  overflow: hidden;
}

.resource-grid-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(124, 94, 212, 0.12);
    border-color: var(--q-primary);
  }
}

.resource-card-avatar {
  border-radius: 10px;
}

.resource-name {
  color: var(--wo-text-main, #172033);
  font-size: 14px;
  font-weight: 700;
}

.resource-role {
  color: var(--wo-text-muted, #64748b);
  font-size: 11.5px;
}

.workload-metric-box {
  background: var(--wo-bg-page, #f8f9fc);
  border: 1px solid var(--wo-border-subtle, #edf0f5);
  border-radius: 8px;
}

.workload-progress {
  height: 6px;
  border-radius: 3px;
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

.status-chip,
.priority-chip {
  min-height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
}

.resources-table :deep(th) {
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

.resources-table :deep(td) {
  height: 52px;
  padding: 8px 14px;
  color: var(--wo-text-main, #334155);
  font-size: 12.5px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.resources-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover, #faf9ff);
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

.empty-state-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
}

.empty-avatar {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
}

.dialog-card {
  min-width: 440px;
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
}
</style>
