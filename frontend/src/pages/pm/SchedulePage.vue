<template>
  <q-page class="pm-page schedule-page">
    <!-- PAGE HEADER -->
    <div class="page-header-row">
      <div>
        <div class="page-title">PM Schedule & Timeline</div>
        <div class="page-subtitle">
          Visualize project delivery milestones, timelines, and task scheduling across all projects
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          icon="add_task"
          label="Add Task"
          class="action-btn-primary"
          @click="goToTasks"
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
            <q-icon name="event_note" size="24px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Scheduled Tasks</div>
            <div class="stat-value">{{ tasks.length }}</div>
            <div class="stat-note stat-purple-text">Across all projects</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="48px" class="stat-icon stat-blue-bg">
            <q-icon name="sync" size="24px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">In Progress</div>
            <div class="stat-value">{{ inProgressCount }}</div>
            <div class="stat-note stat-blue">Actively moving</div>
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
            <div class="stat-note stat-green">Milestones reached</div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="stat-card">
        <q-card-section class="stat-section">
          <q-avatar size="48px" class="stat-icon stat-red-bg">
            <q-icon name="warning" size="24px" />
          </q-avatar>
          <div class="stat-copy">
            <div class="stat-label">Overdue Tasks</div>
            <div class="stat-value">{{ overdueCount }}</div>
            <div class="stat-note stat-red">Requires attention</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- FILTER & SEARCH BAR -->
    <q-card flat bordered class="filter-card q-mb-md">
      <div class="filter-section">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          clearable
          placeholder="Search task or project..."
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
          label="Project"
        />

        <q-select
          v-model="statusFilter"
          outlined
          dense
          emit-value
          map-options
          :options="statusFilterOptions"
          label="Status"
        />

        <q-select
          v-model="priorityFilter"
          outlined
          dense
          emit-value
          map-options
          :options="priorityFilterOptions"
          label="Priority"
        />
      </div>
    </q-card>

    <!-- GANTT CHART COMPONENT -->
    <div class="q-mb-lg">
      <GanttChart
        :tasks="filteredGanttTasks"
        title="Project Schedule & Timeline"
        subtitle="Visual roadmap of tasks and deadlines across projects"
        empty-title="No matching schedule items"
        empty-subtitle="Adjust your filters or add tasks with scheduling dates to view them on the Gantt timeline."
      />
    </div>

    <!-- SCHEDULE DETAIL TABLE -->
    <q-card flat bordered class="table-card">
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">Schedule Breakdown</div>
          <div class="text-caption text-grey-6">Detailed timeline information for all filtered tasks</div>
        </div>

        <q-chip dense square class="project-badge text-weight-bold">
          {{ filteredTasks.length }} Tasks
        </q-chip>
      </q-card-section>

      <q-table
        flat
        :rows="filteredTasks"
        :columns="tableColumns"
        row-key="task_id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        class="schedule-table"
      >
        <template #body-cell-title="props">
          <q-td :props="props">
            <div class="task-title-cell">
              <div class="task-cell-title ellipsis" :title="props.row.title">
                {{ props.row.title }}
              </div>
              <div v-if="props.row.description" class="task-cell-desc ellipsis" :title="props.row.description">
                {{ props.row.description }}
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-project="props">
          <q-td :props="props">
            <q-chip dense square class="project-badge">
              <q-icon name="folder" size="12px" class="q-mr-xs" />
              {{ getProjectName(props.row.project_id) }}
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

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              square
              :class="['status-chip', getTaskStatusClass(props.row.status)]"
            >
              {{ formatStatus(props.row.status) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-dates="props">
          <q-td :props="props" class="date-cell">
            <div class="row items-center no-wrap">
              <span>{{ formatDate(props.row.start_date) }}</span>
              <span class="q-mx-xs text-grey-5">→</span>
              <span>{{ formatDate(props.row.deadline) }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-progress="props">
          <q-td :props="props">
            <div class="progress-cell-wrapper">
              <div class="row justify-between progress-label-row">
                <span class="text-weight-bold">{{ Number(props.row.progress) || 0 }}%</span>
                <span v-if="isTaskOverdue(props.row)" class="text-negative text-weight-medium">Overdue</span>
              </div>
              <q-linear-progress
                rounded
                size="6px"
                :value="(Number(props.row.progress) || 0) / 100"
                :color="isTaskOverdue(props.row) ? 'negative' : (props.row.status === 'COMPLETED' ? 'positive' : 'primary')"
                track-color="grey-3"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import GanttChart, { type GanttTask } from '@/components/gantt/GanttChart.vue';
import {
  getProjectsApi,
  getTasksApi,
  type Project,
  type Task,
} from '@/services/api';

const router = useRouter();

const loading = ref(true);
const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);

const searchQuery = ref('');
const projectFilter = ref<number | 'ALL'>('ALL');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');

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

const tableColumns: QTableColumn<Task>[] = [
  {
    name: 'title',
    label: 'Task Title',
    field: (t) => t.title,
    align: 'left',
  },
  { name: 'project', label: 'Project', field: (t) => t.project_id, align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'dates', label: 'Start & Deadline', field: () => '', align: 'left' },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
];

async function loadData() {
  loading.value = true;
  try {
    const [tList, pList] = await Promise.all([
      getTasksApi(),
      getProjectsApi(),
    ]);
    tasks.value = tList;
    projects.value = pList;
  } catch (error) {
    console.error('Failed to fetch schedule data:', error);
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

const completedCount = computed(
  () => tasks.value.filter((t) => t.status === 'COMPLETED').length,
);

const overdueCount = computed(
  () => tasks.value.filter((t) => isTaskOverdue(t)).length,
);

function isTaskOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED') return false;
  if (!task.deadline) return false;
  const deadlineDate = new Date(task.deadline).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    const q = searchQuery.value.trim().toLowerCase();
    const pName = getProjectName(t.project_id).toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      pName.includes(q) ||
      (t.description && t.description.toLowerCase().includes(q));

    const matchesProject = projectFilter.value === 'ALL' || t.project_id === projectFilter.value;
    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'ALL' || t.priority === priorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

function normalizePriority(p: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (p === 'CRITICAL') return 'Critical';
  if (p === 'HIGH') return 'High';
  if (p === 'LOW') return 'Low';
  return 'Medium';
}

const filteredGanttTasks = computed<GanttTask[]>(() => {
  const today = new Date().toISOString().slice(0, 10);

  return filteredTasks.value.map((task) => {
    const start = task.start_date ? (task.start_date.split('T')[0] ?? today) : today;
    const end = task.deadline ? (task.deadline.split('T')[0] ?? start) : start;

    return {
      id: task.task_id,
      name: task.title,
      project: getProjectName(task.project_id),
      start,
      end,
      progress: Math.min(100, Math.max(0, Number(task.progress) || 0)),
      status: task.status,
      priority: normalizePriority(task.priority),
      overdue: isTaskOverdue(task),
    };
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

function goToTasks() {
  void router.push('/pm/tasks');
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

.schedule-table :deep(th) {
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

.schedule-table :deep(td) {
  height: 52px;
  padding: 8px 14px;
  color: var(--wo-text-main, #334155);
  font-size: 12.5px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.schedule-table :deep(tbody tr:hover) {
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

.status-chip,
.priority-chip {
  min-height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
}

.progress-cell-wrapper {
  min-width: 130px;
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
</style>
