<template>
  <q-page class="q-pa-lg">
    <!-- LOADING STATE -->
    <div v-if="loading" class="row justify-center items-center q-pa-xl" style="min-height: 300px">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- BREADCRUMBS & TOP BAR -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center text-subtitle1">
          <q-btn
            flat
            dense
            no-caps
            icon="arrow_back"
            label="Resources"
            color="primary"
            class="q-mr-xs"
            @click="goToResources"
          />
          <span class="text-grey-5 q-mx-xs">/</span>
          <span class="text-weight-bold">{{ resourceName }}</span>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            color="primary"
            icon="add_task"
            label="Assign Task"
            no-caps
            unelevated
            @click="showAssignDialog = true"
          />
          <q-btn outline color="grey-8" icon="refresh" label="Refresh" no-caps @click="loadData" />
        </div>
      </div>

      <!-- HERO PROFILE CARD -->
      <q-card flat bordered class="dashboard-card q-mb-lg">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar color="primary" text-color="white" size="64px" class="q-mr-md">
              {{ getInitials(resourceName) }}
            </q-avatar>

            <div>
              <div class="row items-center q-gutter-xs">
                <span class="text-h5 text-weight-bold">{{ resourceName }}</span>
                <q-chip
                  dense
                  square
                  :color="
                    utilization > 100 ? 'negative' : utilization >= 75 ? 'warning' : 'positive'
                  "
                  text-color="white"
                  class="text-caption text-weight-bold"
                >
                  {{
                    utilization > 100
                      ? 'Overallocated'
                      : utilization >= 75
                        ? 'High Load'
                        : 'Available'
                  }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                Registered Team Resource Member in Backend Database
              </div>
            </div>
          </div>

          <div class="row q-gutter-lg text-center">
            <div>
              <div class="text-caption text-grey-6">Workload Utilization</div>
              <div class="text-h6 text-weight-bold text-primary">{{ utilization }}%</div>
              <div class="text-caption text-grey-7">{{ totalEffort }}h / 40h</div>
            </div>

            <div>
              <div class="text-caption text-grey-6">Assigned Tasks</div>
              <div class="text-h6 text-weight-bold text-teal">{{ resourceTasks.length }}</div>
              <div class="text-caption text-grey-7">{{ completedTasksCount }} completed</div>
            </div>

            <div>
              <div class="text-caption text-grey-6">Active Projects</div>
              <div class="text-h6 text-weight-bold text-amber-9">{{ resourceProjects.length }}</div>
              <div class="text-caption text-grey-7">Memberships</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- TABS & PANEL CONTENT -->
      <q-card flat bordered class="dashboard-card">
        <q-tabs
          v-model="activeTab"
          dense
          no-caps
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="bg-grey-2 text-grey-7"
        >
          <q-tab name="tasks" icon="task_alt" label="Assigned Tasks" />
          <q-tab name="projects" icon="folder_open" label="Projects" />
          <q-tab name="workload" icon="speed" label="Capacity & Workload" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- TAB 1: ASSIGNED TASKS -->
          <q-tab-panel name="tasks" class="q-pa-md">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-weight-bold">Tasks Assigned to {{ resourceName }}</div>
              <q-chip dense color="deep-purple-1" text-color="primary">
                {{ resourceTasks.length }} Total Tasks
              </q-chip>
            </div>

            <q-table
              flat
              bordered
              :rows="resourceTasks"
              :columns="taskColumns"
              row-key="task_id"
              no-data-label="No tasks currently assigned to this resource"
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

              <template #body-cell-progress="props">
                <q-td :props="props">
                  <div style="min-width: 100px">
                    <div class="row justify-between text-caption">
                      <span>{{ props.row.progress || 0 }}%</span>
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
            </q-table>
          </q-tab-panel>

          <!-- TAB 2: PROJECTS -->
          <q-tab-panel name="projects" class="q-pa-md">
            <div class="text-h6 text-weight-bold q-mb-md">Project Memberships</div>

            <div v-if="resourceProjects.length === 0" class="text-grey-6 text-center q-pa-lg">
              Not currently assigned to any projects.
            </div>

            <div v-else class="row q-col-gutter-md">
              <div v-for="proj in resourceProjects" :key="proj.project_id" class="col-12 col-sm-6">
                <q-card
                  flat
                  bordered
                  class="bg-grey-2 cursor-pointer"
                  @click="goToProject(proj.project_id)"
                >
                  <q-card-section>
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-subtitle1 text-weight-bold">{{ proj.name }}</div>
                      <q-chip dense color="primary" text-color="white">{{ proj.status }}</q-chip>
                    </div>
                    <div class="text-caption text-grey-7 q-mb-sm">
                      {{ proj.description || 'No description' }}
                    </div>
                    <div class="row justify-between text-caption text-grey-8">
                      <span
                        >Progress: <strong>{{ proj.progress }}%</strong></span
                      >
                      <span>Deadline: {{ proj.deadline || 'TBD' }}</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="6px"
                      :value="(Number(proj.progress) || 0) / 100"
                      color="primary"
                      track-color="grey-3"
                      class="q-mt-xs"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- TAB 3: WORKLOAD -->
          <q-tab-panel name="workload" class="q-pa-md">
            <div class="text-h6 text-weight-bold q-mb-md">Weekly Capacity Breakdown</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-card flat bordered class="bg-grey-2">
                  <q-card-section class="q-gutter-sm">
                    <div class="row justify-between text-subtitle2">
                      <span class="text-grey-7">Standard Weekly Capacity</span>
                      <strong>40 Hours</strong>
                    </div>
                    <div class="row justify-between text-subtitle2">
                      <span class="text-grey-7">Allocated Task Effort</span>
                      <strong class="text-primary">{{ totalEffort }} Hours</strong>
                    </div>
                    <div class="row justify-between text-subtitle2">
                      <span class="text-grey-7">Remaining Capacity</span>
                      <strong :class="40 - totalEffort < 0 ? 'text-negative' : 'text-positive'">
                        {{ Math.max(0, 40 - totalEffort) }} Hours
                      </strong>
                    </div>
                    <q-separator />
                    <div>
                      <div class="text-caption text-grey-7 q-mb-xs">Capacity Utilization Gauge</div>
                      <q-linear-progress
                        rounded
                        size="10px"
                        :value="Math.min(100, utilization) / 100"
                        :color="
                          utilization > 100
                            ? 'negative'
                            : utilization >= 75
                              ? 'warning'
                              : 'positive'
                        "
                        track-color="grey-3"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered class="bg-grey-2">
                  <q-card-section class="q-gutter-xs">
                    <div class="text-subtitle2 text-weight-bold">Task Distribution Summary</div>
                    <div class="text-caption text-grey-7">
                      Completed: {{ completedTasksCount }} / {{ resourceTasks.length }} tasks
                    </div>
                    <div class="text-caption text-grey-7">
                      Pending / In Progress: {{ resourceTasks.length - completedTasksCount }} tasks
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>

      <!-- ASSIGN TASK DIALOG -->
      <q-dialog v-model="showAssignDialog">
        <q-card style="min-width: 420px">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-weight-bold">Assign Task to {{ resourceName }}</div>
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
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { getInitials } from '@/utils/formatters';
import {
  createTaskApi,
  getProjectsApi,
  getResourceByIdApi,
  getResourceProjectsApi,
  getResourceWorkloadApi,
  getTasksApi,
  type Project,
  type ResourceUser,
  type Task,
  type ResourceWorkload,
} from '@/services/api';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const resourceId = computed(() => Number(route.params.id) || 1);
const loading = ref(true);
const activeTab = ref('tasks');
const resourceInfo = ref<ResourceUser | null>(null);

const resourceName = computed(() => resourceInfo.value?.name || 'Team Resource');

const allTasks = ref<Task[]>([]);
const allProjects = ref<Project[]>([]);
const directMemberProjects = ref<Project[]>([]);
const backendWorkload = ref<ResourceWorkload | null>(null);

const showAssignDialog = ref(false);
const submitting = ref(false);

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

const taskColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  { name: 'project', label: 'Project ID', field: (t) => t.project_id, align: 'center' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  {
    name: 'effort',
    label: 'Effort (Hrs)',
    field: (t) => Number(t.expected_effort) || 0,
    align: 'center',
  },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
  { name: 'deadline', label: 'Deadline', field: (t) => t.deadline || 'TBD', align: 'left' },
];

async function loadData() {
  loading.value = true;
  try {
    const [tasks, projects, workload, resUser, memberProjs] = await Promise.all([
      getTasksApi(),
      getProjectsApi(),
      getResourceWorkloadApi(resourceId.value).catch(() => null),
      getResourceByIdApi(resourceId.value).catch(() => null),
      getResourceProjectsApi(resourceId.value).catch(() => []),
    ]);
    allTasks.value = tasks;
    allProjects.value = projects;
    directMemberProjects.value = memberProjs;
    if (workload) {
      backendWorkload.value = workload;
    }
    if (resUser) {
      resourceInfo.value = resUser;
    }
    if (projects.length > 0) {
      assignForm.project_id = projects[0]!.project_id;
    }
  } catch (error) {
    console.error('Failed to load resource details from backend:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});

const resourceTasks = computed(() => {
  const id = resourceId.value;
  return allTasks.value.filter(
    (t) => t.assigned_resource_ids && t.assigned_resource_ids.includes(id),
  );
});

const resourceProjects = computed(() => {
  const taskProjectIds = resourceTasks.value.map((t) => t.project_id);
  const memberProjectIds = directMemberProjects.value.map((p) => p.project_id);
  const allIds = new Set([...taskProjectIds, ...memberProjectIds]);
  return allProjects.value.filter((p) => allIds.has(p.project_id));
});

const completedTasksCount = computed(
  () => resourceTasks.value.filter((t) => t.status === 'COMPLETED').length,
);

const totalEffort = computed(() => {
  if (backendWorkload.value?.total_expected_effort !== undefined) {
    return Number(backendWorkload.value.total_expected_effort) || 0;
  }
  return resourceTasks.value.reduce((acc, t) => acc + (Number(t.expected_effort) || 0), 0);
});

const utilization = computed(() => {
  return Math.min(150, Math.round((totalEffort.value / 40) * 100));
});

const projectOptions = computed(() =>
  allProjects.value.map((p) => ({
    label: p.name,
    value: p.project_id,
  })),
);

function getTaskStatusColor(status: string): string {
  if (status === 'COMPLETED') return 'positive';
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'SCHEDULED') return 'purple-7';
  return 'grey-7';
}

function getPriorityColor(priority: string): string {
  if (priority === 'CRITICAL') return 'negative';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'MEDIUM') return 'primary';
  return 'grey';
}

function goToResources() {
  void router.push('/pm/resources');
}

function goToProject(id: number) {
  void router.push(`/pm/projects/${id}`);
}

async function handleAssignTask() {
  if (!assignForm.project_id || !assignForm.title.trim()) {
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
      assigned_resource_ids: [resourceId.value],
    });

    $q.notify({
      type: 'positive',
      message: 'Task assigned to resource successfully',
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
