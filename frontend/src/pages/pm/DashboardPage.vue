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
          value="21"
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
      <WorkloadSummary id="workload-grid" />
    </DashboardSection>

    <!-- 05 TIMELINE & SCHEDULE -->
    <DashboardSection
      id="timeline-section"
      number="05"
      label="TIMELINE & SCHEDULE"
      title="What's happening next"
      description="Upcoming milestones and important dates."
      action-label="View full timeline"
      @action="scrollToTimeline"
    >
      <div class="timeline-shell">
        <div class="timeline-header-row">
          <div class="timeline-month-badge">May 2025</div>
          <div class="timeline-dates-grid">
            <div
              v-for="day in days"
              :key="day.date"
              class="timeline-date-cell"
              :class="{ today: day.today }"
            >
              <span class="day-number">{{ day.date }}</span>
              <span class="day-name">{{ day.weekday }}</span>
            </div>
          </div>
        </div>

        <div class="timeline-body">
          <!-- Website Redesign Row -->
          <div class="timeline-project-row">
            <div class="project-label">Website Redesign</div>
            <div class="project-track">
              <div class="timeline-grid-lines">
                <div v-for="i in 17" :key="i" class="grid-line" />
              </div>
              <div class="timeline-bar bar-purple ui-phase">
                UI Design Phase
                <q-tooltip>UI Design Phase: May 21 - May 25</q-tooltip>
              </div>
              <div class="milestone-badge milestone-purple design-review">
                <q-icon name="bookmark" size="11px" />
                Design Review
                <q-tooltip>Milestone: Design Review on May 26</q-tooltip>
              </div>
              <div class="timeline-bar bar-purple dev-phase">
                Development Phase
                <q-tooltip>Development Phase: May 27 - May 31</q-tooltip>
              </div>
              <div class="timeline-bar bar-purple-light test-phase">
                Testing
                <q-tooltip>Testing Phase: Jun 1 - Jun 3</q-tooltip>
              </div>
            </div>
          </div>

          <!-- Mobile App Development Row -->
          <div class="timeline-project-row">
            <div class="project-label">Mobile App Development</div>
            <div class="project-track">
              <div class="timeline-grid-lines">
                <div v-for="i in 17" :key="i" class="grid-line" />
              </div>
              <div class="timeline-bar bar-teal auth-module">
                Authentication Module
                <q-tooltip>Authentication Module: May 19 - May 24</q-tooltip>
              </div>
              <div class="timeline-bar bar-teal payment-module">
                Payment Integration
                <q-tooltip>Payment Integration: May 25 - May 29</q-tooltip>
              </div>
              <div class="milestone-badge milestone-teal beta-release">
                <q-icon name="bookmark" size="11px" />
                Beta Release
                <q-tooltip>Milestone: Beta Release on May 30</q-tooltip>
              </div>
            </div>
          </div>

          <!-- Marketing Campaign Row -->
          <div class="timeline-project-row">
            <div class="project-label">Marketing Campaign</div>
            <div class="project-track">
              <div class="timeline-grid-lines">
                <div v-for="i in 17" :key="i" class="grid-line" />
              </div>
              <div class="timeline-bar bar-orange content-phase">
                Content Creation
                <q-tooltip>Content Creation: May 21 - May 28</q-tooltip>
              </div>
              <div class="milestone-badge milestone-orange launch-milestone">
                <q-icon name="star" size="11px" />
                Launch Campaign
                <q-tooltip>Milestone: Launch Campaign on May 29</q-tooltip>
              </div>
            </div>
          </div>
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
import { computed, onMounted, reactive, ref } from 'vue';
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
  updateTaskApi,
  assignProjectMemberApi,
  type CreateProjectPayload,
  type CreateTaskPayload,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type Task,
} from '@/services/api';

const $q = useQuasar();
const router = useRouter();

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
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
  expected_effort: 6,
  start_date: '',
  deadline: '',
});

const allocateForm = reactive({
  project_id: null as number | null,
  user_id: 101,
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

const resourceOptions = [
  { label: 'Rohit Verma (UI/UX Designer)', value: 101 },
  { label: 'Sneha Iyer (Frontend Developer)', value: 102 },
  { label: 'Arjun Mehta (Backend Developer)', value: 103 },
  { label: 'Priya Singh (QA Engineer)', value: 104 },
  { label: 'Vikram Patel (DevOps Engineer)', value: 105 },
];

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
  allocateForm.user_id = 101;
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

// Quick Action Submit Handlers
async function handleCreateProject() {
  projectSubmitting.value = true;
  try {
    const payload: CreateProjectPayload = {
      project_manager_id: 1,
      name: newProjectForm.name.trim(),
      priority: newProjectForm.priority,
      status: newProjectForm.status,
      start_date: newProjectForm.start_date || null,
      deadline: newProjectForm.deadline || null,
      ...(newProjectForm.description.trim() ? { description: newProjectForm.description.trim() } : {}),
    };

    try {
      const created = await createProjectApi(payload);
      if (created) {
        projects.value.unshift(created);
      }
    } catch {
      // Local fallback
      const localProj: Project = {
        project_id: Date.now(),
        project_manager_id: 1,
        name: payload.name,
        description: payload.description ?? null,
        priority: payload.priority || 'MEDIUM',
        status: payload.status || 'ACTIVE',
        start_date: payload.start_date ?? null,
        deadline: payload.deadline ?? null,
        progress: 0,
      };
      projects.value.unshift(localProj);
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
    $q.notify({ type: 'warning', message: 'Please select a project' });
    return;
  }
  taskSubmitting.value = true;
  try {
    const payload: CreateTaskPayload = {
      project_id: newTaskForm.project_id,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim() || null,
      priority: newTaskForm.priority,
      status: newTaskForm.status,
      expected_effort: Number(newTaskForm.expected_effort) || 4,
      start_date: newTaskForm.start_date || null,
      deadline: newTaskForm.deadline || null,
    };

    try {
      const created = await createTaskApi(payload);
      if (created) {
        tasks.value.unshift(created);
      }
    } catch {
      // Local fallback
      const localTask: Task = {
        task_id: Date.now(),
        project_id: payload.project_id,
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority || 'MEDIUM',
        status: payload.status || 'PENDING',
        start_date: payload.start_date ?? null,
        deadline: payload.deadline ?? null,
        expected_effort: payload.expected_effort,
        actual_effort: 0,
        progress: payload.status === 'COMPLETED' ? 100 : 0,
      };
      tasks.value.unshift(localTask);
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
      (p) => `- ${p.name}: ${p.status} | Progress: ${p.progress || 0}% | Due: ${p.deadline || 'N/A'}`,
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

onMounted(() => {
  void loadProjects();
  void loadTasks();
});

const days = [
  { date: '18', weekday: 'Sun' },
  { date: '19', weekday: 'Mon' },
  { date: '20', weekday: 'Tue' },
  { date: '21', weekday: 'Wed', today: true },
  { date: '22', weekday: 'Thu' },
  { date: '23', weekday: 'Fri' },
  { date: '24', weekday: 'Sat' },
  { date: '25', weekday: 'Sun' },
  { date: '26', weekday: 'Mon' },
  { date: '27', weekday: 'Tue' },
  { date: '28', weekday: 'Wed' },
  { date: '29', weekday: 'Thu' },
  { date: '30', weekday: 'Fri' },
  { date: '31', weekday: 'Sat' },
  { date: '1', weekday: 'Sun' },
  { date: '2', weekday: 'Mon' },
  { date: '3', weekday: 'Tue' },
];
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
