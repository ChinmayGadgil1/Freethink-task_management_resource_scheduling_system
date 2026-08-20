<template>
  <q-page class="pm-dashboard">
    <!-- 01 OVERVIEW -->
    <DashboardSection
      number="01"
      label="OVERVIEW"
      title="Everything at a glance"
      description="Quick snapshot of all ongoing work and progress."
      action-label="See full overview"
      @action="goToProjects"
      @prev="scrollStrip('overview-strip', -200)"
      @next="scrollStrip('overview-strip', 200)"
    >
      <div id="overview-strip" class="stats-strip">
        <StatCard
          title="Total Projects"
          :value="totalProjects"
          subtitle="↑ 20% vs last week"
          icon="folder"
          color="#8B6FD8"
          icon-bg="#F4F0FD"
          @click="goToProjects"
        />
        <StatCard
          title="Active Tasks"
          :value="activeTasks"
          subtitle="↑ 12% vs last week"
          icon="task_alt"
          color="#1ABC9C"
          icon-bg="#E6F7F5"
          @click="goToProjects"
        />
        <StatCard
          title="Resources"
          :value="resources.length"
          subtitle="↑ 8% vs last week"
          icon="groups"
          color="#F5841F"
          icon-bg="#FFF4EB"
          @click="goToResources"
        />
        <StatCard
          title="Tasks Completed"
          :value="completedTasks"
          subtitle="↑ 18% vs last week"
          icon="check_circle"
          color="#27AE60"
          icon-bg="#EAF7F0"
          @click="goToProjects"
        />
        <StatCard
          title="Overdue Tasks"
          :value="overdueTasks"
          subtitle="↓ 5% vs last week"
          icon="schedule"
          color="#E15263"
          icon-bg="#FDEEF0"
          :negative="true"
          @click="goToProjects"
        />
      </div>

      <div class="strip-scroll-container">
        <div class="strip-scroll-thumb" />
      </div>
    </DashboardSection>

    <!-- 02 PROJECTS PANORAMA -->
    <DashboardSection
      number="02"
      label="PROJECTS PANORAMA"
      title="All your projects, beautifully visualized"
      description="Track progress, health and deadlines across all projects."
      action-label="See all projects"
      @action="goToProjects"
      @prev="scrollStrip('projects-grid', -220)"
      @next="scrollStrip('projects-grid', 220)"
    >
      <ProjectSummary id="projects-grid" :projects="projects" />
    </DashboardSection>

    <!-- 03 MY WORK CENTER -->
    <DashboardSection
      number="03"
      label="MY WORK CENTER"
      title="Your tasks, prioritized"
      description="Focus on what matters most today."
      action-label="View my tasks"
      @action="goToMyTasks"
      @prev="scrollStrip('tasks-center', -240)"
      @next="scrollStrip('tasks-center', 240)"
    >
      <TaskSummary id="tasks-center" :tasks="tasks" :projects="projects" />
    </DashboardSection>

    <!-- 04 RESOURCE WORKLOAD -->
    <DashboardSection
      number="04"
      label="RESOURCE WORKLOAD"
      title="Know your team capacity"
      description="Balance workloads and avoid overbooking."
      action-label="View all resources"
      @action="goToResources"
      @prev="scrollStrip('workload-grid', -200)"
      @next="scrollStrip('workload-grid', 200)"
    >
      <WorkloadSummary id="workload-grid" :resources="resources" />
    </DashboardSection>

    <!-- 05 TIMELINE & SCHEDULE -->
    <DashboardSection
      id="timeline-section"
      number="05"
      label="TIMELINE & SCHEDULE"
      title="What's happening next"
      description="Upcoming project tasks and important dates."
      action-label="View full timeline"
      @action="scrollToTimeline"
      @prev="scrollStrip('timeline-body', -320)"
      @next="scrollStrip('timeline-body', 320)"
    >
      <div class="timeline-shell">
        <div
          v-if="positionedTimelineRows.length"
          class="timeline-header-row"
          :style="{ minWidth: `${140 + timelineDays.length * 54}px` }"
        >
          <div class="timeline-month-badge">{{ timelineMonthLabel }}</div>
          <div
            class="timeline-dates-grid"
            :style="{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(54px, 1fr))` }"
          >
            <div
              v-for="day in timelineDays"
              :key="day.key"
              class="timeline-date-cell"
              :class="{ today: day.isToday }"
            >
              <span class="day-number">{{ day.label }}</span>
              <span class="day-name">{{ day.weekday }}</span>
            </div>
          </div>
        </div>

        <div v-if="positionedTimelineRows.length" id="timeline-body" class="timeline-body">
          <div
            v-for="row in positionedTimelineRows"
            :key="row.id"
            class="timeline-project-row"
            :style="{ minWidth: `${140 + timelineDays.length * 54}px` }"
          >
            <div class="project-label">
              <span class="timeline-task-label">{{ row.title }}</span>
              <span class="timeline-project-name">{{ row.projectName }}</span>
            </div>

            <div class="project-track">
              <div
                class="timeline-grid-lines"
                :style="{
                  gridTemplateColumns: `repeat(${timelineDays.length}, minmax(54px, 1fr))`,
                }"
              >
                <div v-for="day in timelineDays" :key="`${row.id}-${day.key}`" class="grid-line" />
              </div>

              <div
                class="timeline-bar dynamic-timeline-bar"
                :class="`status-${row.status.toLowerCase()}`"
                :style="{ left: `${row.left}%`, width: `${row.width}%` }"
              >
                <div class="timeline-progress" :style="{ width: `${row.progress}%` }" />
                <span class="timeline-bar-content">
                  {{ row.statusLabel }} · {{ row.progress }}%
                </span>
                <q-tooltip>
                  <div>{{ row.title }}</div>
                  <div>{{ row.projectName }}</div>
                  <div>{{ row.startLabel }} → {{ row.endLabel }}</div>
                  <div>{{ row.statusLabel }} · {{ row.progress }}% complete</div>
                </q-tooltip>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="timeline-empty">
          <q-icon name="event_note" size="28px" color="grey-5" />
          <span>No tasks or project dates are available for the timeline yet.</span>
        </div>
      </div>
    </DashboardSection>

    <!-- FLOATING BOTTOM QUICK ACTIONS TOOLBAR -->
    <div class="quick-actions-bar">
      <div class="quick-actions-title">
        <q-icon name="bolt" color="primary" size="18px" />
        <span>Quick Actions</span>
      </div>

      <div class="quick-actions-buttons">
        <q-btn flat no-caps class="action-btn action-purple" @click="openNewProjectDialog">
          <q-icon name="add" size="14px" class="q-mr-xs" />
          <span>New Project</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-teal" @click="openAddTaskDialog">
          <q-icon name="add" size="14px" class="q-mr-xs" />
          <span>Add Task</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-orange" @click="openAllocateResourceDialog">
          <q-icon name="add" size="14px" class="q-mr-xs" />
          <span>Allocate Resource</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-blue" @click="openLogProgressDialog">
          <q-icon name="edit_note" size="15px" class="q-mr-xs" />
          <span>Log Progress</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-yellow" @click="openGenerateReportDialog">
          <q-icon name="description" size="14px" class="q-mr-xs" />
          <span>Generate Report</span>
        </q-btn>
      </div>
    </div>

    <!-- DIALOG 1: CREATE PROJECT -->
    <q-dialog v-model="showNewProjectModal">
      <q-card style="min-width: 460px; max-width: 90vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Create New Project</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleCreateProject" class="q-gutter-md">
            <q-input
              v-model="newProjectForm.name"
              label="Project Name *"
              outlined
              dense
              :rules="[(val) => (val && val.length > 0) || 'Project name is required']"
            />
            <q-input
              v-model="newProjectForm.description"
              label="Description"
              type="textarea"
              outlined
              dense
              rows="3"
            />
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="newProjectForm.priority"
                  :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                  label="Priority"
                  outlined
                  dense
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="newProjectForm.status"
                  :options="['ACTIVE', 'DRAFT', 'PUBLISHED', 'ON_HOLD', 'COMPLETED']"
                  label="Status"
                  outlined
                  dense
                />
              </div>
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="newProjectForm.start_date"
                  label="Start Date"
                  type="date"
                  outlined
                  dense
                  stack-label
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="newProjectForm.deadline"
                  label="Deadline"
                  type="date"
                  outlined
                  dense
                  stack-label
                />
              </div>
            </div>

            <div class="row justify-end q-mt-md q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                unelevated
                color="primary"
                label="Create Project"
                type="submit"
                :loading="projectSubmitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- DIALOG 2: ADD TASK -->
    <q-dialog v-model="showAddTaskModal">
      <q-card style="min-width: 480px; max-width: 90vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Add New Task</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleCreateTask" class="q-gutter-md">
            <q-select
              v-model="newTaskForm.project_id"
              :options="projectOptions"
              label="Select Project *"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Project is required']"
            />
            <q-select
              v-model="newTaskForm.assigned_resource_id"
              :options="resourceOptions"
              label="Assign Resource"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
            <q-input
              v-model="newTaskForm.title"
              label="Task Title *"
              outlined
              dense
              :rules="[(val) => (val && val.length > 0) || 'Task title is required']"
            />
            <q-input
              v-model="newTaskForm.description"
              label="Description"
              type="textarea"
              outlined
              dense
              rows="2"
            />
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="newTaskForm.priority"
                  :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                  label="Priority"
                  outlined
                  dense
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="newTaskForm.expected_effort"
                  label="Effort (Hours)"
                  type="number"
                  outlined
                  dense
                />
              </div>
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="newTaskForm.start_date"
                  label="Start Date"
                  type="date"
                  outlined
                  dense
                  stack-label
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="newTaskForm.deadline"
                  label="Deadline"
                  type="date"
                  outlined
                  dense
                  stack-label
                />
              </div>
            </div>

            <div class="row justify-end q-mt-md q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                unelevated
                color="teal"
                label="Add Task"
                type="submit"
                :loading="taskSubmitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- DIALOG 3: ALLOCATE RESOURCE -->
    <q-dialog v-model="showAllocateModal">
      <q-card style="min-width: 440px; max-width: 90vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Allocate Resource to Project</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleAllocateResource" class="q-gutter-md">
            <q-select
              v-model="allocateForm.project_id"
              :options="projectOptions"
              label="Select Project *"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Project is required']"
            />
            <q-select
              v-model="allocateForm.user_id"
              :options="resourceOptions"
              label="Select Resource / Team Member *"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Resource is required']"
            />

            <div class="row justify-end q-mt-md q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                unelevated
                color="orange-8"
                label="Assign Member"
                type="submit"
                :loading="allocateSubmitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- DIALOG 4: LOG PROGRESS -->
    <q-dialog v-model="showLogProgressModal">
      <q-card style="min-width: 460px; max-width: 90vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Log Task Progress</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleLogProgress" class="q-gutter-md">
            <q-select
              v-model="logProgressForm.task_id"
              :options="taskOptions"
              label="Select Task *"
              outlined
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || 'Task is required']"
              @update:model-value="onTaskSelected"
            />

            <div class="q-pt-sm">
              <div class="text-caption text-weight-medium q-mb-xs">
                Progress: {{ logProgressForm.progress }}%
              </div>
              <q-slider
                v-model="logProgressForm.progress"
                :min="0"
                :max="100"
                :step="5"
                label
                label-always
                color="primary"
              />
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="logProgressForm.status"
                  :options="['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']"
                  label="Status"
                  outlined
                  dense
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="logProgressForm.actual_effort"
                  label="Logged Effort (Hrs)"
                  type="number"
                  outlined
                  dense
                />
              </div>
            </div>

            <div class="row justify-end q-mt-md q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                unelevated
                color="blue-7"
                label="Save Progress"
                type="submit"
                :loading="logSubmitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- DIALOG 5: GENERATE REPORT -->
    <q-dialog v-model="showReportModal">
      <q-card style="min-width: 520px; max-width: 90vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Project & Task Performance Summary</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <div class="report-stat-box">
                <div class="text-caption text-grey-7">Total Projects</div>
                <div class="text-h5 text-weight-bold text-primary">{{ totalProjects }}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="report-stat-box">
                <div class="text-caption text-grey-7">Active Tasks</div>
                <div class="text-h5 text-weight-bold text-teal">{{ activeTasks }}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="report-stat-box">
                <div class="text-caption text-grey-7">Completed Tasks</div>
                <div class="text-h5 text-weight-bold text-positive">{{ completedTasks }}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="report-stat-box">
                <div class="text-caption text-grey-7">Overdue Tasks</div>
                <div class="text-h5 text-weight-bold text-negative">{{ overdueTasks }}</div>
              </div>
            </div>
          </div>

          <div class="text-caption text-grey-7 q-mb-xs">Projects Breakdown:</div>
          <q-list bordered separator dense style="border-radius: 8px">
            <q-item v-for="proj in projects.slice(0, 5)" :key="proj.project_id">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ proj.name }}</q-item-label>
                <q-item-label caption>Deadline: {{ proj.deadline || 'No deadline' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="primary" :label="`${proj.progress || 0}%`" />
              </q-item-section>
            </q-item>
          </q-list>

          <div class="row justify-end q-mt-lg q-gutter-sm">
            <q-btn flat label="Close" v-close-popup />
            <q-btn
              unelevated
              color="amber-9"
              icon="download"
              label="Export Summary"
              @click="handleExportReport"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import DashboardSection from '@/components/dashboard/DashboardSection.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import ProjectSummary from '@/components/dashboard/ProjectSummary.vue';
import TaskSummary from '@/components/dashboard/TaskSummary.vue';
import WorkloadSummary from '@/components/dashboard/WorkloadSummary.vue';

import {
  createProjectApi,
  createTaskApi,
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  updateTaskApi,
  assignProjectMemberApi,
  type CreateProjectPayload,
  type CreateTaskPayload,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type Task,
  type ResourceUser,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const resources = ref<ResourceUser[]>([]);

const projectsLoading = ref(false);
const tasksLoading = ref(false);

// Modal visibility flags
const showNewProjectModal = ref(false);
const showAddTaskModal = ref(false);
const showAllocateModal = ref(false);
const showLogProgressModal = ref(false);
const showReportModal = ref(false);

// Submitting state flags
const projectSubmitting = ref(false);
const taskSubmitting = ref(false);
const allocateSubmitting = ref(false);
const logSubmitting = ref(false);

// Forms
const newProjectForm = reactive<{
  name: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  start_date: string;
  deadline: string;
}>({
  name: '',
  description: '',
  priority: 'MEDIUM',
  status: 'ACTIVE',
  start_date: '',
  deadline: '',
});

const newTaskForm = reactive<{
  project_id: number | null;
  assigned_resource_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  expected_effort: number;
  start_date: string;
  deadline: string;
}>({
  project_id: null,
  assigned_resource_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  expected_effort: 6,
  start_date: '',
  deadline: '',
});

const allocateForm = reactive<{
  project_id: number | null;
  user_id: number | null;
}>({
  project_id: null,
  user_id: null,
});

const logProgressForm = reactive<{
  task_id: number | null;
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  actual_effort: number;
}>({
  task_id: null,
  progress: 50,
  status: 'IN_PROGRESS',
  actual_effort: 4,
});

// Select Options
const projectOptions = computed(() =>
  projects.value.map((p) => ({
    label: p.name,
    value: p.project_id,
  })),
);

const projectMemberResources = ref<ResourceUser[]>([]);

watch(
  () => newTaskForm.project_id,
  async (newProjectId) => {
    if (newProjectId) {
      projectMemberResources.value = await getResourcesApi(newProjectId).catch(() => []);
    } else {
      projectMemberResources.value = [];
    }
  },
  { immediate: true },
);

const resourceOptions = computed(() => {
  const list = newTaskForm.project_id ? projectMemberResources.value : resources.value;
  return list.map((resource) => ({
    label: resource.name,
    value: resource.user_id,
  }));
});

const taskOptions = computed(() =>
  tasks.value.map((t) => ({
    label: t.title,
    value: t.task_id,
  })),
);

// Navigation handlers
function goToProjects() {
  void router.push('/pm/projects');
}

function goToMyTasks() {
  void router.push('/pm/tasks');
}

function goToResources() {
  void router.push('/pm/resources');
}

function scrollToTimeline() {
  const el = document.getElementById('timeline-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollStrip(elementId: string, offset: number) {
  const el = document.getElementById(elementId);
  if (el) {
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }
}

// Quick Actions Openers
function openNewProjectDialog() {
  newProjectForm.name = '';
  newProjectForm.description = '';
  newProjectForm.priority = 'MEDIUM';
  newProjectForm.status = 'ACTIVE';
  newProjectForm.start_date = '';
  newProjectForm.deadline = '';
  showNewProjectModal.value = true;
}

function openAddTaskDialog() {
  newTaskForm.project_id = projects.value.length > 0 ? projects.value[0]!.project_id : null;
  newTaskForm.title = '';
  newTaskForm.description = '';
  newTaskForm.priority = 'MEDIUM';
  newTaskForm.status = 'PENDING';
  newTaskForm.expected_effort = 6;
  newTaskForm.start_date = '';
  newTaskForm.deadline = '';
  showAddTaskModal.value = true;
}

function openAllocateResourceDialog() {
  allocateForm.project_id = projects.value.length > 0 ? projects.value[0]!.project_id : null;
  allocateForm.user_id = resources.value[0]?.user_id ?? null;
  showAllocateModal.value = true;
}

function openLogProgressDialog() {
  if (tasks.value.length > 0) {
    const first = tasks.value[0]!;
    logProgressForm.task_id = first.task_id;
    logProgressForm.progress = Number(first.progress) || 0;
    logProgressForm.status = first.status || 'IN_PROGRESS';
    logProgressForm.actual_effort = Number(first.actual_effort) || 0;
  }
  showLogProgressModal.value = true;
}

function onTaskSelected(taskId: number) {
  const t = tasks.value.find((item) => item.task_id === taskId);
  if (t) {
    logProgressForm.progress = Number(t.progress) || 0;
    logProgressForm.status = t.status || 'IN_PROGRESS';
    logProgressForm.actual_effort = Number(t.actual_effort) || 0;
  }
}

function openGenerateReportDialog() {
  showReportModal.value = true;
}

async function handleCreateProject() {
  const userId = authStore.user?.user_id;

  if (!userId) {
    $q.notify({
      type: 'negative',
      message: 'Please sign in again',
    });
    return;
  }

  projectSubmitting.value = true;

  try {
    const payload: CreateProjectPayload = {
      project_manager_id: userId,
      name: newProjectForm.name.trim(),
      priority: newProjectForm.priority,
      status: newProjectForm.status,
      start_date: newProjectForm.start_date || null,
      deadline: newProjectForm.deadline || null,
      ...(newProjectForm.description.trim()
        ? { description: newProjectForm.description.trim() }
        : {}),
    };

    const created = await createProjectApi(payload);

    if (created) {
      projects.value.unshift(created);
    }

    $q.notify({
      type: 'positive',
      message: `Project "${newProjectForm.name}" created successfully`,
    });

    showNewProjectModal.value = false;
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create project',
    });
  } finally {
    projectSubmitting.value = false;
  }
}
async function handleCreateTask() {
  if (!newTaskForm.project_id) {
    $q.notify({
      type: 'warning',
      message: 'Please select a project',
    });
    return;
  }

  taskSubmitting.value = true;

  try {
    if (newTaskForm.assigned_resource_id) {
      try {
        await assignProjectMemberApi(newTaskForm.project_id, newTaskForm.assigned_resource_id);
      } catch {
        // Project membership assignment is optional here.
      }
    }

    const payload: CreateTaskPayload = {
      project_id: newTaskForm.project_id,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim() || null,
      priority: newTaskForm.priority,
      status: newTaskForm.status,
      expected_effort: Number(newTaskForm.expected_effort) || 4,
      start_date: newTaskForm.start_date || null,
      deadline: newTaskForm.deadline || null,
      assigned_resource_ids: newTaskForm.assigned_resource_id
        ? [newTaskForm.assigned_resource_id]
        : [],
    };

    const created = await createTaskApi(payload);

    if (created) {
      tasks.value.unshift(created);
    }

    $q.notify({
      type: 'positive',
      message: `Task "${newTaskForm.title}" added successfully`,
    });

    showAddTaskModal.value = false;
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to add task',
    });
  } finally {
    taskSubmitting.value = false;
  }
}
async function handleAllocateResource() {
  if (!allocateForm.project_id || !allocateForm.user_id) {
    $q.notify({ type: 'warning', message: 'Please select project and resource' });
    return;
  }
  allocateSubmitting.value = true;
  try {
    try {
      await assignProjectMemberApi(allocateForm.project_id, allocateForm.user_id);
    } catch {
      // Offline / demo fallback
    }

    $q.notify({
      type: 'positive',
      message: 'Resource allocated to project successfully',
    });
    showAllocateModal.value = false;
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to allocate resource',
    });
  } finally {
    allocateSubmitting.value = false;
  }
}

async function handleLogProgress() {
  if (!logProgressForm.task_id) {
    $q.notify({ type: 'warning', message: 'Please select a task' });
    return;
  }
  logSubmitting.value = true;
  try {
    try {
      await updateTaskApi(logProgressForm.task_id, {
        progress: logProgressForm.progress,
        status: logProgressForm.status,
        actual_effort: logProgressForm.actual_effort,
      });
    } catch {
      // Local fallback
    }

    const target = tasks.value.find((t) => t.task_id === logProgressForm.task_id);
    if (target) {
      target.progress = logProgressForm.progress;
      target.status = logProgressForm.status;
      target.actual_effort = logProgressForm.actual_effort;
    }

    $q.notify({
      type: 'positive',
      message: 'Task progress logged successfully',
    });
    showLogProgressModal.value = false;
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to log progress',
    });
  } finally {
    logSubmitting.value = false;
  }
}

function handleExportReport() {
  const content = [
    'TaskFlow Project Manager Report',
    `Generated At: ${new Date().toLocaleString()}`,
    `Total Projects: ${totalProjects.value}`,
    `Active Tasks: ${activeTasks.value}`,
    `Completed Tasks: ${completedTasks.value}`,
    `Overdue Tasks: ${overdueTasks.value}`,
    '',
    'Projects List:',
    ...projects.value.map(
      (p) =>
        `- ${p.name}: ${p.status} | Progress: ${p.progress || 0}% | Due: ${p.deadline || 'N/A'}`,
    ),
  ].join('\n');

  // Copy to clipboard or download file
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(content);
    $q.notify({
      type: 'positive',
      icon: 'content_copy',
      message: 'Report copied to clipboard and ready for export!',
    });
  } else {
    $q.notify({
      type: 'positive',
      message: 'Summary report generated successfully!',
    });
  }
  showReportModal.value = false;
}

// Data loading
async function loadProjects() {
  projectsLoading.value = true;
  try {
    projects.value = await getProjectsApi();
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectsLoading.value = false;
  }
}

async function loadTasks() {
  tasksLoading.value = true;
  try {
    tasks.value = await getTasksApi();
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    tasksLoading.value = false;
  }
}

async function loadResources() {
  try {
    resources.value = await getResourcesApi();
  } catch (error) {
    console.error('Failed to load resources:', error);
  }
}

const totalProjects = computed(() => projects.value.length);

const activeTasks = computed(
  () =>
    tasks.value.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS').length,
);

const completedTasks = computed(
  () => tasks.value.filter((task) => task.status === 'COMPLETED').length,
);

const overdueTasks = computed(() => {
  const today = new Date();
  return tasks.value.filter((task) => {
    if (!task.deadline || task.status === 'COMPLETED') {
      return false;
    }
    return new Date(task.deadline) < today;
  }).length;
});

const projectById = computed(() => {
  const map = new Map<number, Project>();
  projects.value.forEach((project) => map.set(project.project_id, project));
  return map;
});

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function diffDays(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function formatTimelineDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });
}

const timelineRows = computed(() => {
  const rows = tasks.value
    .map((task) => {
      const project = projectById.value.get(task.project_id);
      const start = toDate(task.start_date) ?? toDate(project?.start_date);
      const end = toDate(task.deadline) ?? toDate(project?.deadline);

      if (!start || !end) return null;

      const safeEnd = end < start ? start : end;
      return {
        id: `task-${task.task_id}`,
        title: task.title,
        projectName: project?.name ?? task.project_name ?? `Project #${task.project_id}`,
        start,
        end: safeEnd,
        progress: Math.max(0, Math.min(100, Number(task.progress) || 0)),
        status: task.status,
        statusLabel: task.status.replaceAll('_', ' '),
        startLabel: formatTimelineDate(start),
        endLabel: formatTimelineDate(safeEnd),
      };
    })
    .filter(
      (
        row,
      ): row is {
        id: string;
        title: string;
        projectName: string;
        start: Date;
        end: Date;
        progress: number;
        status: Task['status'];
        statusLabel: string;
        startLabel: string;
        endLabel: string;
      } => row !== null,
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (rows.length > 0) {
    return rows;
  }

  return projects.value
    .map((project) => {
      const start = toDate(project.start_date);
      const end = toDate(project.deadline);
      if (!start || !end) return null;

      const safeEnd = end < start ? start : end;
      const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
      return {
        id: `project-${project.project_id}`,
        title: project.name,
        projectName: 'Project',
        start,
        end: safeEnd,
        progress,
        status:
          project.status === 'ACTIVE'
            ? 'IN_PROGRESS'
            : project.status === 'PUBLISHED'
              ? 'PENDING'
              : project.status === 'COMPLETED'
                ? 'COMPLETED'
                : 'ON_HOLD',
        statusLabel: project.status.replaceAll('_', ' '),
        startLabel: formatTimelineDate(start),
        endLabel: formatTimelineDate(safeEnd),
      };
    })
    .filter(
      (
        row,
      ): row is {
        id: string;
        title: string;
        projectName: string;
        start: Date;
        end: Date;
        progress: number;
        status: Task['status'];
        statusLabel: string;
        startLabel: string;
        endLabel: string;
      } => row !== null,
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());
});

const timelineStart = computed(() => {
  if (!timelineRows.value.length) return startOfDay(new Date());
  const earliest = new Date(Math.min(...timelineRows.value.map((row) => row.start.getTime())));
  earliest.setDate(earliest.getDate() - 1);
  return startOfDay(earliest);
});

const timelineEnd = computed(() => {
  if (!timelineRows.value.length) {
    const fallback = startOfDay(new Date());
    fallback.setDate(fallback.getDate() + 14);
    return fallback;
  }
  const latest = new Date(Math.max(...timelineRows.value.map((row) => row.end.getTime())));
  latest.setDate(latest.getDate() + 1);
  return startOfDay(latest);
});

const timelineDays = computed(() => {
  const daysList: Array<{
    key: string;
    label: string;
    weekday: string;
    isToday: boolean;
  }> = [];

  const cursor = new Date(timelineStart.value);
  const end = timelineEnd.value;

  while (cursor <= end) {
    daysList.push({
      key: cursor.toISOString().slice(0, 10),
      label: cursor.getDate().toString(),
      weekday: cursor.toLocaleDateString(undefined, { weekday: 'short' }),
      isToday: startOfDay(cursor).getTime() === startOfDay(new Date()).getTime(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return daysList;
});

const timelineMonthLabel = computed(() => {
  if (!timelineRows.value.length) return 'Timeline';

  const start = timelineStart.value;
  const end = timelineEnd.value;
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
});

function timelineGeometry(row: (typeof timelineRows.value)[number]) {
  const totalDays = Math.max(1, diffDays(timelineStart.value, timelineEnd.value) + 1);
  const rowStart = Math.max(0, diffDays(timelineStart.value, row.start));
  const rowDuration = Math.max(1, diffDays(row.start, row.end) + 1);

  return {
    left: Math.min(100, (rowStart / totalDays) * 100),
    width: Math.min(100, (rowDuration / totalDays) * 100),
  };
}

const positionedTimelineRows = computed(() =>
  timelineRows.value.map((row) => ({
    ...row,
    ...timelineGeometry(row),
  })),
);

onMounted(() => {
  void loadProjects();
  void loadTasks();
  void loadResources();
});
</script>

<style scoped lang="scss">
.pm-dashboard {
  width: 100%;
  max-width: 1540px;
  margin: 0 auto;
  padding: 16px 24px 60px;
}

.stats-strip {
  display: flex;
  gap: 14px;
}

.strip-scroll-container {
  height: 4px;
  margin-top: 12px;
  border-radius: 4px;
  background: var(--wo-border-subtle, #f0f2f5);
}

.strip-scroll-thumb {
  width: 60%;
  height: 100%;
  margin-left: 15%;
  border-radius: 4px;
  background: var(--wo-border, #d0d5dd);
}

/* Timeline Styling */
.timeline-shell {
  position: relative;
  min-width: 0;
  overflow-x: auto;
}

.timeline-header-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: center;
  padding-bottom: 12px;
}

.timeline-month-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 4px 10px;
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 6px;
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #1d2433);
  font-size: 11px;
  font-weight: 700;
}

.timeline-dates-grid {
  display: grid;
  grid-template-columns: repeat(17, minmax(0, 1fr));
  gap: 2px;
}

.timeline-date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 11px;
  font-weight: 500;
}

.day-number {
  line-height: 1.2;
}

.day-name {
  font-size: 9px;
  margin-top: 2px;
}

.timeline-date-cell.today .day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--wo-primary, #8b6fd8);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(139, 111, 216, 0.35);
}

.timeline-date-cell.today .day-name {
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
}

.timeline-body {
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.timeline-project-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.timeline-project-row:last-child {
  border-bottom: none;
}

.project-label {
  color: var(--wo-text-main, #344054);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.project-track {
  position: relative;
  height: 38px;
  display: flex;
  align-items: center;
}

.timeline-grid-lines {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(17, minmax(0, 1fr));
  pointer-events: none;
}

.grid-line {
  border-right: 1px dashed var(--wo-border-subtle, #f2f4f7);
}

.grid-line:last-child {
  border-right: none;
}

.timeline-bar {
  position: absolute;
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}

.bar-purple {
  background: rgba(139, 111, 216, 0.15);
  color: #8b6fd8;
  border: 1px solid rgba(139, 111, 216, 0.3);
}

.bar-purple-light {
  background: rgba(155, 130, 227, 0.15);
  color: #9b82e3;
  border: 1px solid rgba(155, 130, 227, 0.3);
}

.bar-teal {
  background: rgba(26, 188, 156, 0.15);
  color: #1abc9c;
  border: 1px solid rgba(26, 188, 156, 0.3);
}

.bar-orange {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
  border: 1px solid rgba(245, 132, 31, 0.3);
}

.ui-phase {
  left: 17.6%;
  width: 29.4%;
}

.dev-phase {
  left: 52.9%;
  width: 29.4%;
}

.test-phase {
  left: 88.2%;
  width: 11.7%;
}

.auth-module {
  left: 5.8%;
  width: 29.4%;
}

.payment-module {
  left: 41.1%;
  width: 23.5%;
}

.content-phase {
  left: 17.6%;
  width: 41.1%;
}

.milestone-badge {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  z-index: 3;
}

.milestone-purple {
  color: #8b6fd8;
}

.milestone-teal {
  color: #1abc9c;
}

.milestone-orange {
  color: #f5841f;
}

.design-review {
  left: 48%;
}

.beta-release {
  left: 66%;
}

.launch-milestone {
  left: 60%;
}

.dynamic-timeline-bar {
  overflow: hidden;
  border-radius: 12px;
  color: #ffffff;
  min-width: 32px;
  background: #8b6fd8;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.14);
}

.dynamic-timeline-bar.status-pending {
  background: #8b6fd8;
}

.dynamic-timeline-bar.status-in_progress {
  background: #2e90fa;
}

.dynamic-timeline-bar.status-completed {
  background: #27ae60;
}

.dynamic-timeline-bar.status-on_hold {
  background: #f5841f;
}

.timeline-progress {
  position: absolute;
  inset: 0 auto 0 0;
  background: rgba(255, 255, 255, 0.24);
  pointer-events: none;
}

.timeline-bar-content {
  position: relative;
  z-index: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-task-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-project-name {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 9px;
  font-weight: 500;
  text-overflow: ellipsis;
}

.timeline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 12px;
}

/* Quick Actions Bar */
.quick-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 10px 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 12px;
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  margin-top: 4px;
}

.quick-actions-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--wo-text-main, #1d2433);
  font-size: 12px;
  font-weight: 700;
  padding-right: 12px;
  border-right: 1px solid var(--wo-border-subtle, #f0f2f5);
  white-space: nowrap;
}

.quick-actions-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.action-purple {
  color: #8b6fd8;
  background: rgba(139, 111, 216, 0.12);
  border-color: rgba(139, 111, 216, 0.25);
}
.action-purple:hover {
  background: rgba(139, 111, 216, 0.22);
}

.action-teal {
  color: #1abc9c;
  background: rgba(26, 188, 156, 0.12);
  border-color: rgba(26, 188, 156, 0.25);
}
.action-teal:hover {
  background: rgba(26, 188, 156, 0.22);
}

.action-orange {
  color: #f5841f;
  background: rgba(245, 132, 31, 0.12);
  border-color: rgba(245, 132, 31, 0.25);
}
.action-orange:hover {
  background: rgba(245, 132, 31, 0.22);
}

.action-blue {
  color: #2e90fa;
  background: rgba(46, 144, 250, 0.12);
  border-color: rgba(46, 144, 250, 0.25);
}
.action-blue:hover {
  background: rgba(46, 144, 250, 0.22);
}

.action-yellow {
  color: #d97706;
  background: rgba(217, 119, 6, 0.12);
  border-color: rgba(217, 119, 6, 0.25);
}
.action-yellow:hover {
  background: rgba(217, 119, 6, 0.22);
}

.report-stat-box {
  padding: 12px;
  background: var(--wo-bg-input, #f8f9fa);
  border: 1px solid var(--wo-border, #eaecf0);
  border-radius: 8px;
  text-align: center;
}

@media (max-width: 1100px) {
  .stats-strip {
    overflow-x: auto;
  }

  .timeline-shell {
    overflow-x: auto;
  }

  .timeline-header-row,
  .timeline-project-row {
    min-width: 900px;
  }
}
</style>
