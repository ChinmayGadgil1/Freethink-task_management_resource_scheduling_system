<template>
  <q-page class="projects-page">
    <!-- TOP / FILTER + STATS -->
    <div class="projects-layout">
      <q-card flat bordered class="section-card section-intro">
        <q-card-section class="section-intro-section">
          <div class="section-number">01</div>
          <div class="section-eyebrow">FILTER & SEARCH</div>
          <div class="section-title">Find any project in seconds</div>
          <div class="section-description">
            Use filters, search or quick views to narrow down projects.
          </div>
          <q-icon name="manage_search" size="34px" class="section-icon" />
        </q-card-section>
      </q-card>

      <div class="main-column">
        <div class="stats-grid">
          <q-card flat bordered class="stat-card">
            <q-card-section class="stat-section">
              <q-avatar size="50px" class="stat-icon stat-purple">
                <q-icon name="folder" size="24px" />
              </q-avatar>
              <div class="stat-copy">
                <div class="stat-label">Total Projects</div>
                <div class="stat-value">{{ totalProjects }}</div>
                <div class="stat-note stat-green">↑ 2 new this month</div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="stat-card">
            <q-card-section class="stat-section">
              <q-avatar size="50px" class="stat-icon stat-green-bg">
                <q-icon name="check_circle" size="24px" />
              </q-avatar>
              <div class="stat-copy">
                <div class="stat-label">On Track</div>
                <div class="stat-value">{{ onTrackProjects }}</div>
                <div class="stat-note stat-green">
                  {{ totalProjects ? Math.round((onTrackProjects / totalProjects) * 100) : 0 }}% of
                  total
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="stat-card">
            <q-card-section class="stat-section">
              <q-avatar size="50px" class="stat-icon stat-orange-bg">
                <q-icon name="warning_amber" size="24px" />
              </q-avatar>
              <div class="stat-copy">
                <div class="stat-label">At Risk</div>
                <div class="stat-value">{{ atRiskProjects }}</div>
                <div class="stat-note stat-orange">
                  {{ totalProjects ? Math.round((atRiskProjects / totalProjects) * 100) : 0 }}% of
                  total
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="stat-card">
            <q-card-section class="stat-section">
              <q-avatar size="50px" class="stat-icon stat-red-bg">
                <q-icon name="schedule" size="24px" />
              </q-avatar>
              <div class="stat-copy">
                <div class="stat-label">Delayed</div>
                <div class="stat-value">{{ delayedProjects }}</div>
                <div class="stat-note stat-red">
                  {{ totalProjects ? Math.round((delayedProjects / totalProjects) * 100) : 0 }}% of
                  total
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="stat-card completion-card">
            <q-card-section class="completion-section">
              <div class="stat-copy">
                <div class="stat-label">Completion Avg. <span class="info-dot">i</span></div>
                <div class="stat-value">{{ completionAverage }}%</div>
                <div class="stat-note stat-green">↑ 8% vs last month</div>
              </div>
              <div class="mini-chart" aria-hidden="true">
                <svg viewBox="0 0 150 55" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="completionFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="rgba(124, 92, 220, .22)" />
                      <stop offset="100%" stop-color="rgba(124, 92, 220, 0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 40 L20 29 L42 38 L65 22 L88 31 L110 18 L132 25 L150 7 L150 55 L0 55 Z"
                    fill="url(#completionFill)"
                  />
                  <polyline
                    points="0,40 20,29 42,38 65,22 88,31 110,18 132,25 150,7"
                    fill="none"
                    stroke="#8062df"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <q-card flat bordered class="filter-card">
          <q-card-section class="filter-section">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              clearable
              placeholder="Search projects..."
              class="filter-search"
            >
              <template #prepend>
                <q-icon name="search" size="18px" />
              </template>
            </q-input>

            <q-select
              v-model="statusFilter"
              outlined
              dense
              emit-value
              map-options
              :options="statusFilterOptions"
              label="Status"
              class="filter-select"
            />

            <q-select
              v-model="healthFilter"
              outlined
              dense
              emit-value
              map-options
              :options="healthFilterOptions"
              label="Health"
              class="filter-select"
            />

            <q-select
              outlined
              dense
              label="Owner"
              :options="['All Owners']"
              model-value="All Owners"
              class="filter-select"
            />

            <q-input v-model="startDateFilter" outlined dense label="Start Date" type="date" />

            <q-input v-model="endDateFilter" outlined dense label="End Date" type="date" />

            <q-btn
              outline
              no-caps
              icon="filter_list"
              label="More Filters"
              class="more-filter-btn"
            />

            <q-btn flat round icon="tune" class="tune-btn" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- PROJECT OVERVIEW -->
    <div class="projects-layout section-spacing">
      <q-card flat bordered class="section-card overview-intro">
        <q-card-section class="section-intro-section">
          <div class="section-number">02</div>
          <div class="section-eyebrow">PROJECT OVERVIEW</div>
          <div class="section-title">All projects at your fingertips</div>
          <div class="section-description">
            Overview of progress, health, deadlines and key updates.
          </div>
          <q-icon name="folder_open" size="34px" class="section-icon purple-icon" />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="overview-panel">
        <q-card-section class="overview-scroll-section">
          <div v-if="loading" class="state-container">
            <q-spinner size="32px" color="deep-purple-5" />
            <span>Loading projects...</span>
          </div>

          <div v-else-if="filteredProjects.length === 0" class="state-container empty-overview">
            <q-avatar size="58px" class="empty-avatar">
              <q-icon name="folder_open" size="30px" />
            </q-avatar>
            <div class="empty-title">No projects found</div>
            <div class="empty-copy">Try changing your search or filters.</div>
          </div>

          <q-scroll-area v-else class="project-scroll-area">
            <div class="project-card-row">
              <q-card
                v-for="(project, index) in filteredProjects.slice(0, 5)"
                :key="project.project_id"
                flat
                bordered
                class="overview-project-card cursor-pointer"
                @click="goToProject(project.project_id)"
              >
                <q-img
                  :src="getProjectImage(index)"
                  :alt="project.name"
                  ratio="2.35"
                  class="project-image"
                />

                <q-card-section class="overview-card-body">
                  <div class="project-title-row">
                    <div class="project-name" :title="project.name">{{ project.name }}</div>
                    <q-chip
                      dense
                      square
                      :class="['health-chip', `health-${getProjectHealth(project).toLowerCase()}`]"
                    >
                      {{ getHealthLabel(project) }}
                    </q-chip>
                  </div>

                  <div class="progress-row">
                    <q-linear-progress
                      rounded
                      size="5px"
                      :value="Math.min(100, Math.max(0, Number(project.progress) || 0)) / 100"
                      color="primary"
                      track-color="grey-3"
                      class="overview-progress"
                    />
                    <span class="progress-value">{{ Number(project.progress) || 0 }}%</span>
                  </div>

                  <div class="date-row">
                    <span>{{ formatDate(project.start_date) }}</span>
                    <span>—</span>
                    <span>{{ formatDate(project.deadline) }}</span>
                  </div>

                  <div class="team-row">
                    <q-avatar size="26px" class="team-avatar avatar-purple">
                      {{ project.name.charAt(0).toUpperCase() }}
                    </q-avatar>
                    <q-avatar size="26px" class="team-avatar avatar-dark">P</q-avatar>
                    <span class="team-count">+1</span>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>
        </q-card-section>
      </q-card>
    </div>

    <!-- PROJECT INSIGHTS -->
    <div class="projects-layout section-spacing">
      <q-card flat bordered class="section-card insights-intro">
        <q-card-section class="section-intro-section">
          <div class="section-number">03</div>
          <div class="section-eyebrow">PROJECT INSIGHTS</div>
          <div class="section-title">Track what matters most</div>
          <div class="section-description">Real-time insights help you take the right action.</div>
          <q-icon name="trending_up" size="34px" class="section-icon green-icon" />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="table-card">
        <q-card-section class="table-toolbar">
          <div class="toolbar-title">Project Insights</div>
          <div class="toolbar-actions">
            <q-select
              v-model="groupBy"
              dense
              outlined
              options-dense
              :options="['None', 'Status', 'Health']"
              label="Group by"
              class="toolbar-select"
            />
            <q-select
              v-model="tableView"
              dense
              outlined
              options-dense
              :options="['Table']"
              label="View"
              class="toolbar-select view-select"
            />
            <q-btn flat round icon="view_column" color="grey-7" />
          </div>
        </q-card-section>

        <q-separator />

        <q-table
          v-model:selected="selectedProjects"
          flat
          :rows="filteredProjects"
          :columns="projectColumns"
          row-key="project_id"
          selection="multiple"
          :loading="loading"
          :pagination="pagination"
          :rows-per-page-options="[8, 16, 24]"
          class="projects-table"
          table-header-class="projects-table-header"
          no-data-label="No projects found"
        >
          <template #loading>
            <q-inner-loading showing color="deep-purple-5" />
          </template>

          <template #body-cell-project="props">
            <q-td :props="props">
              <div class="project-cell cursor-pointer" @click="goToProject(props.row.project_id)">
                <q-avatar size="30px" class="project-icon">
                  <q-icon name="folder" size="17px" />
                </q-avatar>
                <span class="project-cell-name">{{ props.row.name }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-owner="props">
            <q-td :props="props">
              <div class="owner-cell">
                <q-avatar size="27px" class="owner-avatar">
                  {{ currentPmName.charAt(0).toUpperCase() }}
                </q-avatar>
                <span>{{ currentPmName }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip dense square class="status-chip">
                {{ formatStatus(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-health="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :class="['health-chip', `health-${getProjectHealth(props.row).toLowerCase()}`]"
              >
                {{ getHealthLabel(props.row) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="table-progress-cell">
                <q-linear-progress
                  rounded
                  size="5px"
                  :value="Math.min(100, Math.max(0, Number(props.row.progress) || 0)) / 100"
                  color="primary"
                  track-color="grey-3"
                  class="table-progress"
                />
                <span>{{ Number(props.row.progress) || 0 }}%</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-start_date="props">
            <q-td :props="props">
              {{ formatDate(props.row.start_date) }}
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td :props="props">
              {{ formatDate(props.row.deadline) }}
            </q-td>
          </template>

          <template #body-cell-team="props">
            <q-td :props="props">
              <div class="team-stack">
                <q-avatar size="24px" class="stack-avatar avatar-purple">
                  {{ props.row.name.charAt(0).toUpperCase() }}
                </q-avatar>
                <q-avatar size="24px" class="stack-avatar avatar-dark">P</q-avatar>
                <span>+1</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-tasks="props">
            <q-td :props="props" class="muted-cell">—</q-td>
          </template>

          <template #body-cell-overdue="props">
            <q-td :props="props">
              <span
                :class="getProjectHealth(props.row) === 'DELAYED' ? 'overdue-value' : 'zero-value'"
              >
                {{ getProjectHealth(props.row) === 'DELAYED' ? 1 : 0 }}
              </span>
            </q-td>
          </template>

          <template #body-cell-last_update="props">
            <q-td :props="props" class="muted-cell">Recently</q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn flat round dense icon="more_horiz" color="grey-6">
                <q-menu auto-close>
                  <q-list style="min-width: 140px">
                    <q-item clickable @click="goToProject(props.row.project_id)">
                      <q-item-section avatar>
                        <q-icon name="visibility" size="18px" color="primary" />
                      </q-item-section>
                      <q-item-section>View Details</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-td>
          </template>

          <template #bottom>
            <div class="table-bottom">
              <span> Showing {{ filteredProjects.length }} of {{ projects.length }} projects </span>
              <div class="bottom-spacer"></div>
              <span class="rows-label">Rows per page</span>
              <q-select
                v-model="pagination.rowsPerPage"
                dense
                borderless
                options-dense
                :options="[8, 16, 24]"
                class="rows-select"
              />
              <q-pagination
                v-model="pagination.page"
                :max="Math.max(1, Math.ceil(filteredProjects.length / pagination.rowsPerPage))"
                direction-links
                flat
                active-color="primary"
                color="grey-7"
                size="sm"
              />
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- PERFORMANCE -->
    <div class="projects-layout section-spacing">
      <q-card flat bordered class="section-card performance-intro">
        <q-card-section class="section-intro-section">
          <div class="section-number">04</div>
          <div class="section-eyebrow">PERFORMANCE VIEW</div>
          <div class="section-title">Compare & prioritize</div>
          <div class="section-description">Sort, compare and prioritize projects effortlessly.</div>
          <q-icon name="format_list_numbered" size="34px" class="section-icon orange-icon" />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="performance-panel">
        <q-card-section class="performance-grid">
          <div class="performance-stat">
            <span>Highest Progress</span>
            <strong>{{ Math.max(...projects.map((p) => Number(p.progress) || 0), 0) }}%</strong>
          </div>
          <q-separator vertical />
          <div class="performance-stat">
            <span>Average Progress</span>
            <strong>{{ completionAverage }}%</strong>
          </div>
          <q-separator vertical />
          <div class="performance-stat">
            <span>Projects Needing Attention</span>
            <strong>{{ atRiskProjects + delayedProjects }}</strong>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="projects-layout section-spacing">
      <q-card flat bordered class="section-card quick-intro">
        <q-card-section class="section-intro-section">
          <div class="section-number">05</div>
          <div class="section-eyebrow">QUICK ACTIONS</div>
          <div class="section-title">Manage projects efficiently</div>
          <div class="section-description">
            Create, import or update projects in just a few clicks.
          </div>
          <q-icon name="bolt" size="34px" class="section-icon purple-icon" />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="quick-actions-card">
        <q-card-section class="quick-actions">
          <q-btn
            unelevated
            no-caps
            icon="add"
            label="New Project"
            color="primary"
            class="quick-btn primary-action"
            @click="showCreateDialog = true"
          />
          <q-btn outline no-caps icon="cloud_upload" label="Import Project" class="quick-btn" />
          <q-btn outline no-caps icon="auto_awesome" label="Project Template" class="quick-btn" />
          <q-btn outline no-caps icon="edit_note" label="Bulk Update" class="quick-btn" />
          <q-btn outline no-caps icon="description" label="Export Report" class="quick-btn" />
        </q-card-section>
      </q-card>
    </div>

    <!-- EXISTING CREATE PROJECT LOGIC/DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="create-project-dialog">
        <q-card-section class="dialog-header">
          <div>
            <div class="dialog-eyebrow">NEW PROJECT</div>
            <div class="dialog-title">Create a project</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleCreateProject">
          <q-card-section class="dialog-form">
            <q-input
              v-model="form.name"
              outlined
              label="Project name"
              :rules="[(val) => !!val.trim() || 'Project name is required']"
            />
            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              label="Description"
              autogrow
            />

            <div class="form-row">
              <q-select
                v-model="form.status"
                outlined
                label="Status"
                :options="statusOptions"
                emit-value
                map-options
                class="form-field"
              />
              <q-select
                v-model="form.priority"
                outlined
                label="Priority"
                :options="priorityOptions"
                emit-value
                map-options
                class="form-field"
              />
            </div>

            <div class="form-row">
              <q-input
                v-model="form.start_date"
                outlined
                type="date"
                label="Start date"
                stack-label
                class="form-field"
              />
              <q-input
                v-model="form.deadline"
                outlined
                type="date"
                label="Deadline"
                stack-label
                class="form-field"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn
              type="submit"
              no-caps
              unelevated
              label="Create Project"
              color="primary"
              :loading="creating"
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
  createProjectApi,
  getProjectsApi,
  type CreateProjectPayload,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

function goToProject(projectId: number) {
  void router.push(`/pm/projects/${projectId}`);
}

const projects = ref<Project[]>([]);
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const startDateFilter = ref('');
const endDateFilter = ref('');

interface ProjectForm {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  deadline: string;
}

const form = reactive<ProjectForm>({
  name: '',
  description: '',
  status: 'DRAFT',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
});

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const searchQuery = ref('');
const statusFilter = ref('ALL');
const healthFilter = ref('ALL');
const groupBy = ref('None');
const tableView = ref('Table');

const selectedProjects = ref<Project[]>([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 8,
  sortBy: '',
  descending: false,
});

const statusFilterOptions = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const healthFilterOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'On Track', value: 'ON_TRACK' },
  { label: 'At Risk', value: 'AT_RISK' },
  { label: 'Delayed', value: 'DELAYED' },
];

const currentPmName = computed(() => {
  return authStore.user?.name || 'Project Manager';
});

const projectColumns: QTableColumn<Project>[] = [
  {
    name: 'project',
    label: 'Project',
    field: (row) => row.name,
    align: 'left',
  },
  {
    name: 'owner',
    label: 'Owner',
    field: () => currentPmName.value,
    align: 'left',
  },
  {
    name: 'status',
    label: 'Status',
    field: (row) => row.status,
    align: 'left',
  },
  {
    name: 'health',
    label: 'Health',
    field: (row) => getProjectHealth(row),
    align: 'left',
  },
  {
    name: 'progress',
    label: 'Progress',
    field: (row) => Number(row.progress) || 0,
    align: 'left',
  },
  {
    name: 'start_date',
    label: 'Start Date',
    field: (row) => row.start_date,
    align: 'left',
  },
  {
    name: 'deadline',
    label: 'End Date',
    field: (row) => row.deadline,
    align: 'left',
  },
  {
    name: 'team',
    label: 'Team',
    field: () => '',
    align: 'left',
  },
  {
    name: 'tasks',
    label: 'Tasks',
    field: () => '',
    align: 'left',
  },
  {
    name: 'overdue',
    label: 'Overdue',
    field: (row) => (getProjectHealth(row) === 'DELAYED' ? 1 : 0),
    align: 'left',
  },
  {
    name: 'last_update',
    label: 'Last Update',
    field: () => 'Recently',
    align: 'left',
  },
  {
    name: 'actions',
    label: '',
    field: () => '',
    align: 'right',
  },
];

const projectImages = [
  '/projects/website.jpg',
  '/projects/mobile.jpg',
  '/projects/marketing.jpg',
  '/projects/tools.jpg',
  '/projects/portal.jpg',
];

function getProjectImage(index: number) {
  return projectImages[index % projectImages.length];
}

function getProjectHealth(project: Project) {
  if (project.status === 'COMPLETED') return 'ON_TRACK';

  if (project.deadline) {
    const deadline = new Date(project.deadline);
    const today = new Date();

    if (deadline < today) {
      return 'DELAYED';
    }
  }

  const progress = Number(project.progress) || 0;

  if (progress < 30) return 'AT_RISK';

  return 'ON_TRACK';
}

function getHealthLabel(project: Project) {
  const health = getProjectHealth(project);

  if (health === 'AT_RISK') return 'At Risk';
  if (health === 'DELAYED') return 'Delayed';

  return 'On Track';
}

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return projects.value.filter((project) => {
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query);

    const matchesStatus = statusFilter.value === 'ALL' || project.status === statusFilter.value;

    const health = getProjectHealth(project);

    const matchesHealth = healthFilter.value === 'ALL' || health === healthFilter.value;

    return matchesSearch && matchesStatus && matchesHealth;
  });
});

const totalProjects = computed(() => projects.value.length);

const onTrackProjects = computed(
  () => projects.value.filter((project) => getProjectHealth(project) === 'ON_TRACK').length,
);

const atRiskProjects = computed(
  () => projects.value.filter((project) => getProjectHealth(project) === 'AT_RISK').length,
);

const delayedProjects = computed(
  () => projects.value.filter((project) => getProjectHealth(project) === 'DELAYED').length,
);

const completionAverage = computed(() => {
  if (!projects.value.length) return 0;

  const total = projects.value.reduce((sum, project) => sum + Number(project.progress || 0), 0);

  return Math.round(total / projects.value.length);
});

async function loadProjects() {
  loading.value = true;

  try {
    projects.value = await getProjectsApi();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load projects',
    });
  } finally {
    loading.value = false;
  }
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

  creating.value = true;

  try {
    const payload: CreateProjectPayload = {
      project_manager_id: userId,
      name: form.name.trim(),
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    await createProjectApi(payload);

    $q.notify({
      type: 'positive',
      message: 'Project created successfully',
    });

    showCreateDialog.value = false;
    resetForm();
    await loadProjects();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create project',
    });
  } finally {
    creating.value = false;
  }
}

function resetForm() {
  form.name = '';
  form.description = '';
  form.status = 'DRAFT';
  form.priority = 'MEDIUM';
  form.start_date = '';
  form.deadline = '';
}

function formatDate(date: string | null) {
  if (!date) return 'No deadline';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

onMounted(() => {
  void loadProjects();
});
</script>

<style scoped>
.projects-page {
  min-height: 100%;
  padding: 18px 28px 30px;
  background: var(--wo-bg-page, #f8f9fb);
  color: var(--wo-text-main, #172033);
}

.projects-layout {
  display: grid;
  grid-template-columns: 205px minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

.main-column {
  min-width: 0;
}

.section-spacing {
  margin-top: 18px;
}

.section-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #fff);
  border-color: var(--wo-border, #e7e9ef);
}

.section-intro-section {
  position: relative;
  min-height: 100%;
  padding: 15px 15px 16px;
}

.section-number {
  margin-bottom: 7px;
  color: var(--wo-primary, #7c5ed4);
  font-size: 19px;
  font-weight: 700;
  line-height: 1;
}

.section-eyebrow {
  margin-bottom: 12px;
  color: var(--wo-text-muted, #63708a);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.section-title {
  max-width: 175px;
  color: var(--wo-text-main, #172033);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.18;
}

.section-description {
  margin-top: 11px;
  color: var(--wo-text-muted, #758097);
  font-size: 11px;
  line-height: 1.55;
}

.section-icon {
  position: absolute;
  right: 14px;
  bottom: 16px;
  color: var(--wo-primary, #8062df);
}

.purple-icon {
  color: var(--wo-primary, #8062df);
}

.green-icon {
  color: #21a66b;
}

.orange-icon {
  color: #ee8a1c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  min-width: 0;
  border-radius: 12px;
  background: var(--wo-bg-card, #fff);
  border-color: var(--wo-border, #e5e7ec);
}

.stat-section {
  min-height: 92px;
  padding: 17px 15px;
  display: flex;
  align-items: center;
  gap: 13px;
}

.stat-icon {
  flex: 0 0 auto;
  border-radius: 14px;
}

.stat-purple {
  background: rgba(124, 94, 212, 0.15);
  color: #7c5ed4;
}

.stat-green-bg {
  background: rgba(19, 174, 118, 0.15);
  color: #13ae76;
}

.stat-orange-bg {
  background: rgba(242, 138, 23, 0.15);
  color: #f28a17;
}

.stat-red-bg {
  background: rgba(237, 91, 103, 0.15);
  color: #ed5b67;
}

.stat-copy {
  min-width: 0;
}

.stat-label {
  color: var(--wo-text-muted, #536079);
  font-size: 11px;
  white-space: nowrap;
}

.stat-value {
  margin-top: 3px;
  color: var(--wo-text-main, #172033);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.05;
}

.stat-note {
  margin-top: 7px;
  font-size: 9px;
  white-space: nowrap;
}

.stat-green {
  color: #11a66d;
}

.stat-orange {
  color: #ee8112;
}

.stat-red {
  color: #ee5b61;
}

.completion-section {
  min-height: 92px;
  padding: 17px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.info-dot {
  display: inline-flex;
  width: 12px;
  height: 12px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--wo-text-subtle, #98a1b3);
  color: var(--wo-text-subtle, #98a1b3);
  border-radius: 50%;
  font-size: 8px;
}

.mini-chart {
  width: 95px;
  height: 48px;
  align-self: flex-end;
}

.mini-chart svg {
  width: 100%;
  height: 100%;
}

.filter-card {
  margin-top: 12px;
  border-radius: 10px;
  border-color: var(--wo-border, #e5e7ec);
  background: var(--wo-bg-card, #fff);
}

.filter-section {
  display: grid;
  grid-template-columns: 1.55fr 1fr 1fr 1.05fr 1fr 1fr auto 40px;
  gap: 8px;
  padding: 9px;
  align-items: center;
}

.filter-section :deep(.q-field__control) {
  min-height: 38px;
  border-radius: 7px;
}

.filter-section :deep(.q-field__label),
.filter-section :deep(.q-field__native),
.filter-section :deep(.q-field__input) {
  font-size: 11px;
}

.filter-search :deep(.q-field__label) {
  color: var(--wo-text-subtle, #8b94a8);
}

.more-filter-btn {
  min-height: 38px;
  padding: 0 12px;
  border-color: var(--wo-border, #e0e3e9);
  border-radius: 8px;
  color: var(--wo-text-main, #3f4a60);
  font-size: 11px;
}

.tune-btn {
  color: var(--wo-text-muted, #69748b);
}

.overview-intro,
.insights-intro,
.performance-intro,
.quick-intro {
  min-height: 200px;
}

.overview-panel {
  min-width: 0;
  border-radius: 14px;
  border-color: var(--wo-border, #e7e9ef);
  background: var(--wo-bg-card, #fff);
  overflow: hidden;
}

.overview-scroll-section {
  min-width: 0;
  padding: 10px;
}

.project-scroll-area {
  width: 100%;
  height: 210px;
}

.project-card-row {
  display: flex;
  gap: 12px;
  width: max-content;
  padding: 0 1px 9px;
}

.overview-project-card {
  width: 235px;
  border-radius: 10px;
  border-color: var(--wo-border, #e5e7ec);
  overflow: hidden;
  background: var(--wo-bg-card, #fff);
}

.project-image {
  background: var(--wo-bg-page, #f1f2f6);
}

.overview-card-body {
  padding: 10px 12px 11px;
}

.project-title-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.project-name {
  min-width: 0;
  overflow: hidden;
  color: var(--wo-text-main, #1b2435);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.health-chip,
.status-chip {
  min-height: 22px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 600;
}

.health-on_track {
  background: rgba(18, 166, 108, 0.15);
  color: #12a66c;
}

.health-at_risk {
  background: rgba(239, 133, 24, 0.15);
  color: #ef8518;
}

.health-delayed {
  background: rgba(235, 89, 100, 0.15);
  color: #eb5964;
}

.status-chip {
  background: rgba(77, 121, 223, 0.15);
  color: #4d79df;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 12px;
}

.overview-progress {
  flex: 1;
}

.progress-value {
  min-width: 25px;
  color: var(--wo-text-main, #263044);
  font-size: 10px;
  font-weight: 600;
  text-align: right;
}

.date-row {
  display: flex;
  gap: 5px;
  margin-top: 10px;
  color: var(--wo-text-subtle, #737e92);
  font-size: 9px;
  white-space: nowrap;
}

.team-row {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.team-avatar {
  border: 2px solid var(--wo-bg-card, #fff);
}

.team-avatar + .team-avatar {
  margin-left: -7px;
}

.avatar-purple {
  background: rgba(114, 87, 200, 0.15);
  color: #7257c8;
}

.avatar-dark {
  background: var(--wo-border-subtle, #dce1e9);
  color: var(--wo-text-muted, #475166);
}

.team-count {
  margin-left: 5px;
  color: var(--wo-text-muted, #657086);
  font-size: 10px;
  font-weight: 600;
}

.state-container {
  min-height: 185px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--wo-text-muted, #748096);
  font-size: 12px;
}

.empty-overview {
  flex-direction: column;
  gap: 5px;
}

.empty-avatar {
  margin-bottom: 4px;
  background: rgba(128, 98, 223, 0.15);
  color: var(--wo-primary, #8062df);
}

.empty-title {
  color: var(--wo-text-main, #1d2638);
  font-weight: 700;
}

.empty-copy {
  color: var(--wo-text-muted, #7c879a);
  font-size: 11px;
}

.table-card {
  min-width: 0;
  border-radius: 14px;
  border-color: var(--wo-border, #e7e9ef);
  background: var(--wo-bg-card, #fff);
  overflow: hidden;
}

.table-toolbar {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}

.toolbar-title {
  color: var(--wo-text-main, #283247);
  font-size: 12px;
  font-weight: 700;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.toolbar-select {
  width: 125px;
}

.view-select {
  width: 108px;
}

.toolbar-select :deep(.q-field__control) {
  min-height: 34px;
  border-radius: 7px;
}

.toolbar-select :deep(.q-field__label),
.toolbar-select :deep(.q-field__native),
.toolbar-select :deep(.q-field__input) {
  font-size: 10px;
}

.projects-table :deep(.q-table__middle) {
  overflow-x: auto;
}

.projects-table :deep(table) {
  min-width: 1050px;
}

.projects-table :deep(th) {
  height: 38px;
  padding: 0 9px;
  background: var(--wo-bg-page, #fbfbfc);
  color: var(--wo-text-muted, #647087);
  font-size: 9px;
  font-weight: 600;
  border-bottom: 1px solid var(--wo-border, #e9ebef);
}

.projects-table :deep(td) {
  height: 48px;
  padding: 0 9px;
  color: var(--wo-text-main, #4f5a70);
  font-size: 9px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.projects-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover, #faf9ff);
}

.project-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.project-icon {
  flex: 0 0 auto;
  background: rgba(118, 91, 208, 0.15);
  color: var(--wo-primary, #765bd0);
}

.project-cell-name {
  max-width: 145px;
  overflow: hidden;
  color: var(--wo-text-main, #1c2536);
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 100px;
}

.owner-avatar {
  background: var(--wo-border-subtle, #e7eaf0);
  color: var(--wo-text-muted, #59647a);
}

.table-progress-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 95px;
}

.table-progress {
  width: 62px;
}

.table-progress-cell span {
  color: var(--wo-text-main, #273146);
  font-size: 9px;
  font-weight: 600;
}

.team-stack {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.stack-avatar {
  border: 2px solid var(--wo-bg-card, #fff);
}

.stack-avatar + .stack-avatar {
  margin-left: -6px;
}

.team-stack span {
  margin-left: 5px;
  color: var(--wo-text-muted, #69748a);
  font-size: 9px;
}

.muted-cell {
  color: var(--wo-text-subtle, #8790a1) !important;
}

.overdue-value {
  color: #e7545f;
  font-weight: 700;
}

.zero-value {
  color: #10a36c;
  font-weight: 600;
}

.table-bottom {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 5px 12px;
  color: var(--wo-text-muted, #6e788b);
  font-size: 9px;
}

.bottom-spacer {
  flex: 1;
}

.rows-label {
  margin-right: 3px;
}

.rows-select {
  width: 48px;
  margin-right: 10px;
}

.rows-select :deep(.q-field__native) {
  font-size: 9px;
}

.performance-panel {
  min-height: 200px;
  border-radius: 14px;
  border-color: var(--wo-border, #e7e9ef);
  background: var(--wo-bg-card, #fff);
}

.performance-grid {
  height: 100%;
  min-height: 200px;
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 28px;
  padding: 28px;
}

.performance-stat {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.performance-stat span {
  color: var(--wo-text-muted, #6e788c);
  font-size: 11px;
}

.performance-stat strong {
  color: var(--wo-text-main, #1b2537);
  font-size: 25px;
}

.quick-actions-card {
  min-height: 200px;
  border-radius: 14px;
  border-color: var(--wo-border, #e7e9ef);
  background: var(--wo-bg-card, #fff);
}

.quick-actions {
  min-height: 200px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  align-items: center;
  padding: 24px;
}

.quick-btn {
  min-height: 42px;
  border-color: var(--wo-border, #e1e3e9);
  border-radius: 9px;
  color: var(--wo-text-muted, #5b667a);
  font-size: 11px;
}

.primary-action {
  background: var(--wo-primary, #8062df) !important;
  color: #fff !important;
}

.create-project-dialog {
  width: 620px;
  max-width: 92vw;
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #172033);
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 26px 12px;
}

.dialog-eyebrow {
  margin-bottom: 5px;
  color: var(--wo-primary, #8062df);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.dialog-title {
  color: var(--wo-text-main, #172033);
  font-size: 22px;
  font-weight: 700;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 16px 26px;
}

.form-row {
  display: flex;
  gap: 14px;
}

.form-field {
  flex: 1;
}

.dialog-actions {
  padding: 12px 26px 24px;
}

@media (max-width: 1250px) {
  .projects-page {
    padding-left: 18px;
    padding-right: 18px;
  }

  .projects-layout {
    grid-template-columns: 185px minmax(0, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .completion-card {
    grid-column: span 3;
  }

  .filter-section {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .filter-search {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .projects-layout {
    grid-template-columns: 1fr;
  }

  .section-card {
    min-height: auto;
  }

  .section-intro-section {
    min-height: 150px;
  }

  .section-title {
    max-width: 70%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .completion-card {
    grid-column: span 2;
  }

  .filter-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-search {
    grid-column: span 2;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .projects-page {
    padding: 12px;
  }

  .stats-grid,
  .filter-section,
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .completion-card,
  .filter-search {
    grid-column: auto;
  }

  .performance-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .performance-grid :deep(.q-separator) {
    display: none;
  }

  .form-row {
    flex-direction: column;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}
</style>
