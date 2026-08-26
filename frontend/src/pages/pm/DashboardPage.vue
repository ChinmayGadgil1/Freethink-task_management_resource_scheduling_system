<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <div class="q-mx-auto column q-gutter-y-lg" style="max-width: 1400px">
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
        <div id="overview-strip" class="row no-wrap q-gutter-md overflow-auto q-pb-xs">
          <div style="min-width: 220px">
            <StatCard
              title="Total Projects"
              :value="totalProjects"
              subtitle="↑ 20% vs last week"
              icon="folder"
              color="#8B6FD8"
              icon-bg="#F4F0FD"
              @click="goToProjects"
            />
          </div>
          <div style="min-width: 220px">
            <StatCard
              title="Active Tasks"
              :value="activeTasks"
              subtitle="↑ 12% vs last week"
              icon="task_alt"
              color="#1ABC9C"
              icon-bg="#E6F7F5"
              @click="goToProjects"
            />
          </div>
          <div style="min-width: 220px">
            <StatCard
              title="Resources"
              :value="resources.length"
              subtitle="↑ 8% vs last week"
              icon="groups"
              color="#F5841F"
              icon-bg="#FFF4EB"
              @click="goToResources"
            />
          </div>
          <div style="min-width: 220px">
            <StatCard
              title="Tasks Completed"
              :value="completedTasks"
              subtitle="↑ 18% vs last week"
              icon="check_circle"
              color="#27AE60"
              icon-bg="#EAF7F0"
              @click="goToProjects"
            />
          </div>
          <div style="min-width: 220px">
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
        <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
          <q-card-section class="q-pa-md overflow-auto">
            <div
              v-if="positionedTimelineRows.length"
              class="timeline-header-row"
              :style="{ minWidth: `${140 + timelineDays.length * 54}px` }"
            >
              <q-badge color="primary" class="text-caption text-weight-bold q-pa-xs">
                {{ timelineMonthLabel }}
              </q-badge>
              <div
                class="timeline-dates-grid"
                :style="{
                  gridTemplateColumns: `repeat(${timelineDays.length}, minmax(54px, 1fr))`,
                }"
              >
                <div
                  v-for="day in timelineDays"
                  :key="day.key"
                  class="column items-center justify-center text-caption"
                  :class="{
                    'text-primary text-weight-bold': day.isToday,
                    'text-grey-6': !day.isToday,
                  }"
                >
                  <span class="text-weight-bold">{{ day.label }}</span>
                  <span style="font-size: 9px">{{ day.weekday }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="positionedTimelineRows.length"
              id="timeline-body"
              class="timeline-body q-mt-sm"
            >
              <div
                v-for="row in positionedTimelineRows"
                :key="row.id"
                class="timeline-project-row q-py-xs"
                :style="{ minWidth: `${140 + timelineDays.length * 54}px` }"
              >
                <div class="project-label">
                  <span
                    class="timeline-task-label text-weight-bold"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >{{ row.title }}</span
                  >
                  <span
                    class="timeline-project-name text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                    >{{ row.projectName }}</span
                  >
                </div>

                <div class="project-track" style="height: 36px; position: relative">
                  <div
                    class="timeline-grid-lines"
                    :style="{
                      gridTemplateColumns: `repeat(${timelineDays.length}, minmax(54px, 1fr))`,
                    }"
                  >
                    <div
                      v-for="day in timelineDays"
                      :key="`${row.id}-${day.key}`"
                      class="grid-line"
                    />
                  </div>

                  <div
                    class="timeline-bar dynamic-timeline-bar"
                    :class="`status-${row.status.toLowerCase()}`"
                    :style="{ left: `${row.left}%`, width: `${row.width}%` }"
                  >
                    <div class="timeline-progress" :style="{ width: `${row.progress}%` }" />
                    <span class="timeline-bar-content text-caption text-weight-bold">
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

            <div v-else class="column items-center q-pa-xl text-grey-6">
              <q-icon name="event_note" size="36px" color="grey-5" />
              <span class="text-caption q-mt-sm"
                >No tasks or project dates are available for the timeline yet.</span
              >
            </div>
          </q-card-section>
        </q-card>
      </DashboardSection>

      <!-- FLOATING QUICK ACTIONS TOOLBAR -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-pa-md">
        <div class="row items-center justify-between wrap q-gutter-y-sm">
          <div class="row items-center q-gutter-xs">
            <q-icon name="bolt" color="primary" size="20px" />
            <span
              class="text-subtitle2 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >Quick Actions</span
            >
          </div>

          <div class="row items-center q-gutter-sm wrap">
            <q-btn
              unelevated
              no-caps
              dense
              :color="$q.dark.isActive ? 'purple-10' : 'deep-purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              icon="add"
              label="New Project"
              class="q-px-sm text-weight-bold"
              @click="openNewProjectDialog"
            />
            <q-btn
              unelevated
              no-caps
              dense
              :color="$q.dark.isActive ? 'teal-10' : 'teal-1'"
              :text-color="$q.dark.isActive ? 'teal-2' : 'teal-8'"
              icon="add"
              label="Add Task"
              class="q-px-sm text-weight-bold"
              @click="openAddTaskDialog"
            />
            <q-btn
              unelevated
              no-caps
              dense
              :color="$q.dark.isActive ? 'orange-10' : 'orange-1'"
              :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'"
              icon="add"
              label="Allocate Resource"
              class="q-px-sm text-weight-bold"
              @click="openAllocateResourceDialog"
            />
            <q-btn
              unelevated
              no-caps
              dense
              :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
              :text-color="$q.dark.isActive ? 'blue-2' : 'blue-8'"
              icon="edit_note"
              label="Log Progress"
              class="q-px-sm text-weight-bold"
              @click="openLogProgressDialog"
            />
            <q-btn
              unelevated
              no-caps
              dense
              :color="$q.dark.isActive ? 'amber-10' : 'amber-1'"
              :text-color="$q.dark.isActive ? 'amber-2' : 'amber-9'"
              icon="description"
              label="Generate Report"
              class="q-px-sm text-weight-bold"
              @click="openGenerateReportDialog"
            />
          </div>
        </div>
      </q-card>

      <!-- DIALOG 1: CREATE PROJECT -->
      <q-dialog v-model="showNewProjectModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 460px; max-width: 90vw; border-radius: 12px"
        >
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
                :dark="$q.dark.isActive"
                :rules="[(val) => (val && val.length > 0) || 'Project name is required']"
              />
              <q-input
                v-model="newProjectForm.description"
                label="Description"
                type="textarea"
                outlined
                dense
                :dark="$q.dark.isActive"
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
                    :dark="$q.dark.isActive"
                  />
                </div>
                <div class="col-6">
                  <q-select
                    v-model="newProjectForm.status"
                    :options="['ACTIVE', 'DRAFT', 'PUBLISHED', 'ON_HOLD', 'COMPLETED']"
                    label="Status"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
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
                    :dark="$q.dark.isActive"
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
                    :dark="$q.dark.isActive"
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
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 480px; max-width: 90vw; border-radius: 12px"
        >
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
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Project is required']"
              />
              <q-select
                v-model="newTaskForm.assigned_resource_ids"
                :options="resourceOptions"
                label="Assign Member(s)"
                outlined
                dense
                multiple
                clearable
                :dark="$q.dark.isActive"
                :display-value="
                  newTaskForm.assigned_resource_ids.length
                    ? `${newTaskForm.assigned_resource_ids.length} selected`
                    : ''
                "
                emit-value
                map-options
              >
                <template #option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section side>
                      <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-input
                v-model="newTaskForm.title"
                label="Task Title *"
                outlined
                dense
                :dark="$q.dark.isActive"
                :rules="[(val) => (val && val.length > 0) || 'Task title is required']"
              />
              <q-input
                v-model="newTaskForm.description"
                label="Description"
                type="textarea"
                outlined
                dense
                :dark="$q.dark.isActive"
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
                    :dark="$q.dark.isActive"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="newTaskForm.expected_effort"
                    label="Effort (Hours)"
                    type="number"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
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
                    :dark="$q.dark.isActive"
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
                    :dark="$q.dark.isActive"
                  />
                </div>
              </div>

              <div class="row justify-end q-mt-md q-gutter-sm">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  unelevated
                  color="primary"
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
      <q-dialog v-model="showAllocateResourceModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 440px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Allocate Resource</div>
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
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Project is required']"
              />
              <q-select
                v-model="allocateForm.user_id"
                :options="resourceOptions"
                label="Select Resource Member *"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Resource member is required']"
              />
              <q-select
                v-model="allocateForm.task_id"
                :options="allocateTaskOptions"
                label="Assign Specific Task (Optional)"
                outlined
                dense
                emit-value
                map-options
                clearable
                :dark="$q.dark.isActive"
              />

              <div class="row justify-end q-mt-md q-gutter-sm">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  unelevated
                  color="primary"
                  label="Allocate Member"
                  type="submit"
                  :loading="allocatingResource"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- DIALOG 4: LOG PROGRESS -->
      <q-dialog v-model="showLogProgressModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 460px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Log Progress & Effort</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="handleLogProgressSubmit" class="q-gutter-md">
              <q-select
                v-model="logProgressForm.task_id"
                :options="allTaskOptions"
                label="Select Task *"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Task is required']"
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model.number="logProgressForm.hours_logged"
                    label="Hours Logged *"
                    type="number"
                    step="0.5"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                    :rules="[(val) => (val !== null && val >= 0) || 'Valid hours required']"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="logProgressForm.progress_logged"
                    label="Task Progress (%) *"
                    type="number"
                    min="0"
                    max="100"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) => (val !== null && val >= 0 && val <= 100) || '0-100% required',
                    ]"
                  />
                </div>
              </div>
              <q-input
                v-model="logProgressForm.notes"
                label="Work Notes / Details"
                type="textarea"
                outlined
                dense
                rows="2"
                :dark="$q.dark.isActive"
              />

              <div class="row justify-end q-mt-md q-gutter-sm">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  unelevated
                  color="primary"
                  label="Submit Progress"
                  type="submit"
                  :loading="loggingProgress"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- DIALOG 5: GENERATE REPORT -->
      <q-dialog v-model="showGenerateReportModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 440px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Generate Project Report</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <div class="text-body2" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
              Generate a real-time status & workload summary report.
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <div class="report-stat-box">
                  <div class="text-h6 text-weight-bold text-primary">{{ projects.length }}</div>
                  <div class="text-caption text-grey-6">Projects</div>
                </div>
              </div>
              <div class="col-4">
                <div class="report-stat-box">
                  <div class="text-h6 text-weight-bold text-positive">{{ completedTasks }}</div>
                  <div class="text-caption text-grey-6">Done Tasks</div>
                </div>
              </div>
              <div class="col-4">
                <div class="report-stat-box">
                  <div class="text-h6 text-weight-bold text-negative">{{ overdueTasks }}</div>
                  <div class="text-caption text-grey-6">Overdue</div>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-lg q-gutter-sm">
              <q-btn flat label="Close" v-close-popup />
              <q-btn
                unelevated
                color="primary"
                icon="download"
                label="Download Summary"
                @click="downloadReport"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  createProjectApi,
  createTaskApi,
  assignProjectMemberApi,
  createWorkLogApi,
  type Project,
  type Task,
  type ResourceUser,
  type CreateProjectPayload,
  type TaskStatus,
  type TaskPriority,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const resources = ref<ResourceUser[]>([]);

const showNewProjectModal = ref(false);
const projectSubmitting = ref(false);

const showAddTaskModal = ref(false);
const taskSubmitting = ref(false);

const showAllocateResourceModal = ref(false);
const allocatingResource = ref(false);

const showLogProgressModal = ref(false);
const loggingProgress = ref(false);

const showGenerateReportModal = ref(false);

const newProjectForm = reactive<CreateProjectPayload>({
  name: '',
  description: '',
  status: 'ACTIVE',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
  project_manager_id: authStore.user?.user_id ?? 1,
});

const newTaskForm = reactive({
  project_id: null as number | null,
  assigned_resource_ids: [] as number[],
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'UNASSIGNED',
  start_date: '',
  deadline: '',
  expected_effort: 8,
});

const allocateForm = reactive({
  project_id: null as number | null,
  user_id: null as number | null,
  task_id: null as number | null,
});

const logProgressForm = reactive({
  task_id: null as number | null,
  hours_logged: 2,
  progress_logged: 50,
  notes: '',
});

onMounted(() => {
  void loadDashboardData();
});

async function loadDashboardData() {
  try {
    const [p, t, r] = await Promise.all([getProjectsApi(), getTasksApi(), getResourcesApi()]);
    projects.value = p;
    tasks.value = t;
    resources.value = r;
  } catch (error) {
    console.error('Failed to load PM dashboard:', error);
  }
}

const totalProjects = computed(() => projects.value.length);
const activeTasks = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED').length,
);

const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);

const overdueTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.value.filter((t) => {
    if (t.status === 'COMPLETED' || !t.deadline) return false;
    return new Date(t.deadline) < today;
  }).length;
});

const projectOptions = computed(() =>
  projects.value.map((p) => ({ label: p.name, value: p.project_id })),
);

const resourceOptions = computed(() =>
  resources.value.map((r: ResourceUser) => ({ label: r.name, value: r.user_id })),
);

const allocateTaskOptions = computed(() => {
  if (!allocateForm.project_id) return [];
  return tasks.value
    .filter((t) => Number(t.project_id) === Number(allocateForm.project_id))
    .map((t) => ({ label: t.title, value: t.task_id }));
});

const allTaskOptions = computed(() =>
  tasks.value.map((t) => ({
    label: `${t.title} (${t.project_name || `Project #${t.project_id}`})`,
    value: t.task_id,
  })),
);

function scrollStrip(containerId: string, delta: number) {
  const el = document.getElementById(containerId);
  if (el) {
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }
}

function goToProjects() {
  void router.push('/pm/projects');
}
function goToResources() {
  void router.push('/pm/resources');
}
function goToMyTasks() {
  void router.push('/pm/tasks');
}
function scrollToTimeline() {
  const el = document.getElementById('timeline-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function openNewProjectDialog() {
  newProjectForm.name = '';
  newProjectForm.description = '';
  newProjectForm.status = 'ACTIVE';
  newProjectForm.priority = 'MEDIUM';
  newProjectForm.start_date = '';
  newProjectForm.deadline = '';
  showNewProjectModal.value = true;
}

async function handleCreateProject() {
  if (!newProjectForm.name.trim()) return;
  projectSubmitting.value = true;
  try {
    await createProjectApi(newProjectForm);
    $q.notify({ type: 'positive', message: 'Project created successfully' });
    showNewProjectModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to create project',
    });
  } finally {
    projectSubmitting.value = false;
  }
}

function openAddTaskDialog() {
  newTaskForm.project_id = projects.value[0]?.project_id ?? null;
  newTaskForm.assigned_resource_ids = [];
  newTaskForm.title = '';
  newTaskForm.description = '';
  newTaskForm.priority = 'MEDIUM';
  newTaskForm.status = 'UNASSIGNED';
  newTaskForm.start_date = '';
  newTaskForm.deadline = '';
  newTaskForm.expected_effort = 8;
  showAddTaskModal.value = true;
}

async function handleCreateTask() {
  if (!newTaskForm.project_id || !newTaskForm.title.trim()) return;
  taskSubmitting.value = true;
  try {
    await createTaskApi({
      project_id: newTaskForm.project_id,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description || null,
      priority: newTaskForm.priority as TaskPriority,
      status: newTaskForm.status as TaskStatus,
      start_date: newTaskForm.start_date || null,
      deadline: newTaskForm.deadline || null,
      expected_effort: Number(newTaskForm.expected_effort) || 8,
      assigned_resource_ids: newTaskForm.assigned_resource_ids,
    });
    $q.notify({ type: 'positive', message: 'Task created successfully' });
    showAddTaskModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to create task',
    });
  } finally {
    taskSubmitting.value = false;
  }
}

function openAllocateResourceDialog() {
  allocateForm.project_id = projects.value[0]?.project_id ?? null;
  allocateForm.user_id = resources.value[0]?.user_id ?? null;
  allocateForm.task_id = null;
  showAllocateResourceModal.value = true;
}

async function handleAllocateResource() {
  if (!allocateForm.project_id || !allocateForm.user_id) return;
  allocatingResource.value = true;
  try {
    await assignProjectMemberApi(allocateForm.project_id, allocateForm.user_id);
    $q.notify({ type: 'positive', message: 'Resource allocated to project' });
    showAllocateResourceModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to allocate resource',
    });
  } finally {
    allocatingResource.value = false;
  }
}

function openLogProgressDialog() {
  logProgressForm.task_id = tasks.value[0]?.task_id ?? null;
  logProgressForm.hours_logged = 2;
  logProgressForm.progress_logged = 50;
  logProgressForm.notes = '';
  showLogProgressModal.value = true;
}

async function handleLogProgressSubmit() {
  if (!logProgressForm.task_id) return;
  loggingProgress.value = true;
  try {
    await createWorkLogApi(logProgressForm.task_id, {
      hours_logged: logProgressForm.hours_logged,
      progress_logged: logProgressForm.progress_logged,
      status: 'IN_PROGRESS',
      notes: logProgressForm.notes,
      log_date: new Date().toISOString().slice(0, 10),
    });
    $q.notify({ type: 'positive', message: 'Progress logged successfully' });
    showLogProgressModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to log progress',
    });
  } finally {
    loggingProgress.value = false;
  }
}

function openGenerateReportDialog() {
  showGenerateReportModal.value = true;
}

function downloadReport() {
  $q.notify({ type: 'positive', message: 'Dashboard summary report downloaded' });
  showGenerateReportModal.value = false;
}

const timelineDays = computed(() => {
  const result: { key: string; label: number; weekday: string; isToday: boolean }[] = [];
  const start = new Date();
  start.setDate(start.getDate() - 3);

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < 17; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const key = cur.toISOString().slice(0, 10);
    const label = cur.getDate();
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(cur);

    result.push({
      key,
      label,
      weekday,
      isToday: key === todayStr,
    });
  }
  return result;
});

const timelineMonthLabel = computed(() => {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date());
});

const positionedTimelineRows = computed(() => {
  const days = timelineDays.value;
  if (!days.length) return [];

  const firstDayMs = new Date(days[0]!.key).getTime();
  const lastDayMs = new Date(days[days.length - 1]!.key).getTime();
  const totalRangeMs = Math.max(1, lastDayMs - firstDayMs);

  return tasks.value.slice(0, 10).map((t) => {
    const startStr = t.start_date ? t.start_date.slice(0, 10) : days[0]!.key;
    const endStr = t.deadline ? t.deadline.slice(0, 10) : days[days.length - 1]!.key;

    const startMs = new Date(startStr).getTime();
    const endMs = new Date(endStr).getTime();

    const left = Math.max(0, Math.min(100, ((startMs - firstDayMs) / totalRangeMs) * 100));
    const right = Math.max(0, Math.min(100, ((endMs - firstDayMs) / totalRangeMs) * 100));
    const width = Math.max(6, right - left);

    return {
      id: t.task_id,
      title: t.title,
      projectName: t.project_name || `Project #${t.project_id}`,
      status: t.status,
      statusLabel: t.status.replace('_', ' '),
      progress: Number(t.progress) || 0,
      left,
      width,
      startLabel: startStr,
      endLabel: endStr,
    };
  });
});
</script>

<style scoped lang="scss">
.timeline-header-row,
.timeline-project-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: center;
}

.timeline-dates-grid,
.timeline-grid-lines {
  display: grid;
  gap: 2px;
}

.grid-line {
  border-right: 1px dashed var(--wo-border-subtle, #eef0f4);
}

.timeline-bar {
  position: absolute;
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 12px;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.12);
}

.dynamic-timeline-bar {
  overflow: hidden;
  color: #ffffff;

  &.status-unassigned,
  &.status-scheduled {
    background: #8b6fd8;
  }
  &.status-in_progress {
    background: #2e90fa;
  }
  &.status-completed {
    background: #27ae60;
  }
}

.timeline-progress {
  position: absolute;
  inset: 0 auto 0 0;
  background: rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

.report-stat-box {
  padding: 12px;
  background: rgba(200, 200, 200, 0.08);
  border: 1px solid var(--wo-border-subtle, #eaecf0);
  border-radius: 8px;
  text-align: center;
}

body.body--dark {
  .grid-line {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  .report-stat-box {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
}
</style>
