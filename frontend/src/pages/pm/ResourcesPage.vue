<template>
  <q-page class="q-pa-lg">
    <!-- PAGE HEADER -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">PM Task & Resource Management</div>
        <div class="text-subtitle2 text-grey-7">
          List tasks assigned by PM and assign team resources to projects
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          color="deep-purple"
          icon="person_add"
          label="Assign Resource to Project"
          no-caps
          unelevated
          @click="showProjectMemberDialog = true"
        />
        <q-btn
          outline
          color="grey-8"
          icon="refresh"
          label="Refresh"
          no-caps
          unelevated
          :loading="loading"
          @click="loadData"
        />
      </div>
    </div>

    <!-- STAT SUMMARY CARDS -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Assigned Resources</div>
              <div class="text-h5 text-weight-bold q-my-xs">
                {{ resourceMap.length }}
              </div>
              <div class="text-caption text-positive">Active in backend</div>
            </div>
            <q-avatar color="deep-purple-1" text-color="primary" icon="groups" size="44px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Tasks Assigned by PM</div>
              <div class="text-h5 text-weight-bold q-my-xs">{{ taskList.length }}</div>
              <div class="text-caption text-teal">Across projects</div>
            </div>
            <q-avatar color="teal-1" text-color="teal" icon="task_alt" size="44px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Total Effort Allocated</div>
              <div class="text-h5 text-weight-bold q-my-xs">
                {{ totalEffortHours }}h
              </div>
              <div class="text-caption text-primary">Expected effort hours</div>
            </div>
            <q-avatar color="blue-1" text-color="blue" icon="schedule" size="44px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="dashboard-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-medium text-grey-7">Managed Projects</div>
              <div class="text-h5 text-weight-bold q-my-xs">
                {{ projectList.length }}
              </div>
              <div class="text-caption text-amber-9">Projects</div>
            </div>
            <q-avatar color="amber-1" text-color="amber-9" icon="folder_open" size="44px" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- MAIN TABS: RESOURCE ALLOCATION VS TASKS ASSIGNED BY PM -->
    <q-card flat bordered class="dashboard-card q-mb-lg">
      <q-tabs
        v-model="mainTab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="bg-grey-2 text-grey-7"
      >
        <q-tab name="resources" icon="groups" label="Resource Directory & Allocation" />
        <q-tab name="tasks" icon="task_alt" label="Tasks Assigned by PM" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="mainTab" animated>
        <!-- TAB 1: RESOURCES -->
        <q-tab-panel name="resources" class="q-pa-md">
          <!-- SEARCH & FILTER BAR -->
          <div class="row items-center q-col-gutter-sm q-mb-md">
            <div class="col-12 col-md-5">
              <q-input
                v-model="searchQuery"
                outlined
                dense
                clearable
                placeholder="Search resources..."
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-select
                v-model="statusFilter"
                outlined
                dense
                emit-value
                map-options
                :options="statusOptions"
                label="Workload Status"
              />
            </div>

            <div class="col-12 col-md-3 row justify-end items-center">
              <q-btn-toggle
                v-model="viewMode"
                flat
                toggle-color="primary"
                color="grey-7"
                :options="[
                  { icon: 'grid_view', value: 'grid' },
                  { icon: 'format_list_bulleted', value: 'table' },
                ]"
              />
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
            <q-card flat bordered class="dashboard-card q-pa-lg">
              <q-icon name="person_off" size="48px" color="grey-5" />
              <div class="text-h6 text-grey-8 q-mt-sm">No Resource Allocations Found</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Assign a resource to a project or assign tasks to populate resource allocation
                metrics.
              </div>
              <q-btn
                color="primary"
                icon="person_add"
                label="Assign Resource to Project"
                no-caps
                unelevated
                class="q-mt-md"
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
              <q-card flat bordered class="dashboard-card full-height column justify-between">
                <q-card-section class="q-pa-md">
                  <!-- CARD TOP: AVATAR, NAME, CHIP -->
                  <div class="row items-center justify-between no-wrap q-mb-md">
                    <div class="row items-center no-wrap">
                      <q-avatar color="primary" text-color="white" size="44px" class="q-mr-sm">
                        {{ getInitials(res.name) }}
                      </q-avatar>
                      <div>
                        <div
                          class="text-subtitle1 text-weight-bold ellipsis"
                          style="max-width: 140px"
                        >
                          {{ res.name }}
                        </div>
                        <div class="text-caption text-grey-6">Team Resource</div>
                      </div>
                    </div>

                    <q-chip
                      dense
                      square
                      outline
                      :color="getStatusColor(res.status)"
                      class="text-caption text-weight-bold"
                    >
                      {{ res.status }}
                    </q-chip>
                  </div>

                  <!-- WORKLOAD METRICS BOX -->
                  <div class="bg-grey-2 q-pa-sm rounded-borders q-mb-sm">
                    <div class="row justify-between text-caption q-mb-xs">
                      <span class="text-grey-7 text-weight-medium">Workload Effort</span>
                      <span class="text-weight-bold">{{ res.totalEffort }}h</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="6px"
                      :value="Math.min(100, res.utilization) / 100"
                      :color="getUtilizationColor(res.utilization)"
                      track-color="grey-4"
                    />
                  </div>

                  <!-- STAT COUNTS -->
                  <div class="row justify-between text-caption text-grey-7 q-pt-xs">
                    <div class="row items-center">
                      <q-icon name="task_alt" size="16px" color="teal" class="q-mr-xs" />
                      <span class="text-weight-medium">{{ res.tasks.length }} Tasks</span>
                    </div>
                    <div class="row items-center">
                      <q-icon name="folder" size="16px" color="primary" class="q-mr-xs" />
                      <span class="text-weight-medium">{{ res.projectsCount }} Projects</span>
                    </div>
                  </div>

                  <!-- PROJECTS WORKING ON -->
                  <div class="q-mt-sm">
                    <div class="text-caption text-grey-7 text-weight-medium q-mb-xs">Projects Working On:</div>
                    <div v-if="res.projectNames && res.projectNames.length > 0" class="row q-gutter-xs wrap">
                      <q-chip
                        v-for="pName in res.projectNames"
                        :key="pName"
                        dense
                        square
                        size="11px"
                        color="deep-purple-1"
                        text-color="primary"
                        icon="folder"
                      >
                        {{ pName }}
                      </q-chip>
                    </div>
                    <div v-else class="text-caption text-grey-5 italic">No active project assignments</div>
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
                      color="grey-8"
                      label="View Profile"
                      class="full-width"
                      @click="goToDetails(res.resource_id)"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      unelevated
                      dense
                      no-caps
                      color="primary"
                      icon="add_task"
                      label="Assign Task"
                      class="full-width"
                      @click="openAssignModal(res.resource_id)"
                    />
                  </div>
                </q-card-actions>
              </q-card>
            </div>
          </div>

          <!-- TABLE VIEW -->
          <q-card v-else flat bordered class="dashboard-card">
            <q-table
              flat
              :rows="filteredResources"
              :columns="tableColumns"
              row-key="resource_id"
              :pagination="{ rowsPerPage: 10 }"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div
                    class="row items-center cursor-pointer"
                    @click="goToDetails(props.row.resource_id)"
                  >
                    <q-avatar color="primary" text-color="white" size="32px" class="q-mr-sm">
                      {{ getInitials(props.row.name) }}
                    </q-avatar>
                    <div>
                      <div class="text-weight-bold">{{ props.row.name }}</div>
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
                      size="11px"
                      color="deep-purple-1"
                      text-color="primary"
                      icon="folder"
                    >
                      {{ pName }}
                    </q-chip>
                  </div>
                  <span v-else class="text-caption text-grey-5">Unassigned</span>
                </q-td>
              </template>

              <template #body-cell-utilization="props">
                <q-td :props="props">
                  <div style="min-width: 130px">
                    <div class="row justify-between text-caption">
                      <span class="text-weight-bold">{{ props.row.utilization }}%</span>
                      <span class="text-grey-6">({{ props.row.totalEffort }}h)</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="6px"
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
                    :color="getStatusColor(props.row.status)"
                    text-color="white"
                    class="text-caption text-weight-bold"
                  >
                    {{ props.row.status }}
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
            <div class="text-h6 text-weight-bold">
              Tasks Assigned across Managed Projects
            </div>
            <q-chip dense color="deep-purple-1" text-color="primary" class="text-weight-bold">
              {{ taskList.length }} Total Tasks
            </q-chip>
          </div>

          <q-table
            flat
            bordered
            :rows="taskList"
            :columns="pmTaskColumns"
            row-key="task_id"
            no-data-label="No tasks currently assigned by PM"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="getTaskStatusColor(props.row.status)"
                  text-color="white"
                  class="text-caption text-weight-bold"
                >
                  {{ props.row.status }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-priority="props">
              <q-td :props="props">
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

            <template #body-cell-resources="props">
              <q-td :props="props">
                <div
                  v-if="
                    props.row.assigned_resource_ids && props.row.assigned_resource_ids.length > 0
                  "
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
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ASSIGN RESOURCE TO PROJECT DIALOG (POST /api/projects/:id/members) -->
    <q-dialog v-model="showProjectMemberDialog">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Assign Resource to Project</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignProjectMember">
          <q-card-section class="q-gutter-md">
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
              v-model="projectMemberForm.user_id"
              outlined
              dense
              label="Select Resource Member"
              :options="resourceMemberSelectOptions"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Resource Member is required']"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Assign to Project"
              :loading="submittingMember"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ASSIGN TASK DIALOG (POST /api/tasks) -->
    <q-dialog v-model="showAssignDialog">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            Assign Task to {{ getResourceName(selectedResourceId || 0) }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignTask">
          <q-card-section class="q-gutter-md">
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

            <q-input
              v-model="assignForm.title"
              outlined
              dense
              label="Task Title"
              :rules="[(val) => !!val.trim() || 'Title is required']"
            />

            <q-input
              v-model="assignForm.description"
              outlined
              dense
              type="textarea"
              label="Description"
              autogrow
            />

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

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Assign Task"
              :loading="submitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import {
  assignProjectMemberApi,
  createTaskApi,
  getProjectsApi,
  getResourcesApi,
  getTasksApi,
  type Project,
  type ResourceUser,
  type Task,
} from '@/services/api';

const $q = useQuasar();
const router = useRouter();

const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('ALL');
const mainTab = ref<'resources' | 'tasks'>('resources');
const viewMode = ref<'grid' | 'table'>('grid');

const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);

const showAssignDialog = ref(false);
const selectedResourceId = ref<number | null>(null);
const submitting = ref(false);

const showProjectMemberDialog = ref(false);
const submittingMember = ref(false);

const projectMemberForm = reactive({
  project_id: null as number | null,
  user_id: null as number | null,
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
  { name: 'effort', label: 'Allocated Hours', field: (r) => r.totalEffort, align: 'center' },
  { name: 'utilization', label: 'Utilization', field: (r) => r.utilization, align: 'left' },
  { name: 'status', label: 'Status', field: (r) => r.status, align: 'center' },
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

const pmTaskColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  { name: 'project', label: 'Project Name', field: (t) => getProjectName(t.project_id), align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'resources', label: 'Assigned Resources', field: () => '', align: 'left' },
  {
    name: 'effort',
    label: 'Effort (Hrs)',
    field: (t) => Number(t.expected_effort) || 0,
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
    const [projects, tasks, resources] = await Promise.all([
      getProjectsApi(),
      getTasksApi(),
      getResourcesApi(),
    ]);
    projectList.value = projects;
    taskList.value = tasks;
    resourceList.value = resources;
    if (projects.length > 0) {
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

const resourceMemberSelectOptions = computed(() =>
  resourceList.value.map((r) => ({
    label: r.name,
    value: r.user_id,
  })),
);

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

  // Compute stats for each resource
  const result: ResourceAggregate[] = [];
  for (const item of map.values()) {
    const projectIds = new Set(item.tasks.map((t) => t.project_id));
    item.projectsCount = projectIds.size;
    item.projectNames = Array.from(projectIds)
      .map((pid) => projectMap.get(pid))
      .filter((n): n is string => !!n);

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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getUtilizationColor(util: number): string {
  if (util > 100) return 'negative';
  if (util >= 75) return 'warning';
  return 'positive';
}

function getStatusColor(status: string): string {
  if (status === 'OVERALLOCATED') return 'negative';
  if (status === 'HIGH_LOAD') return 'warning';
  return 'positive';
}

function getTaskStatusColor(status: string): string {
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
  if (!projectMemberForm.project_id || !projectMemberForm.user_id) return;

  submittingMember.value = true;
  try {
    await assignProjectMemberApi(projectMemberForm.project_id, projectMemberForm.user_id);
    $q.notify({
      type: 'positive',
      message: `${getResourceName(projectMemberForm.user_id)} assigned to project successfully`,
    });
    showProjectMemberDialog.value = false;
    projectMemberForm.user_id = null;
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign resource to project';
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
      status: 'PENDING',
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
