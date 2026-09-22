<template>
  <div>
    <!-- Screen-only interactive UI -->
    <div class="screen-only q-gutter-y-md">
      <!-- Local Filter Bar -->
      <div class="row items-center justify-between wrap gap-sm q-py-sm">
        <div class="row items-center gap-sm">
          <q-select
            v-model="selectedProjectId"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="projectOptions"
            label="Filter by Project"
            style="min-width: 220px"
            :dark="$q.dark.isActive"
          />

          <q-select
            v-model="selectedStatus"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="statusOptions"
            label="Project Status"
            style="min-width: 180px"
            :dark="$q.dark.isActive"
          />

          <q-btn
            v-if="selectedProjectId !== 'ALL' || selectedStatus !== 'ALL'"
            flat
            dense
            no-caps
            color="primary"
            icon="restart_alt"
            label="Reset Filters"
            @click="resetFilters"
          />
        </div>

        <div class="row items-center gap-sm">
          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
            Showing {{ filteredRows.length }} of {{ reportData.rows.length }} projects
          </div>
          <q-btn
            outline
            dense
            rounded
            color="primary"
            icon="download"
            label="Export CSV"
            no-caps
            class="q-px-sm"
            :disable="filteredRows.length === 0"
            @click="exportCsv"
          >
            <q-tooltip>Export filtered projects to CSV</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- KPI Metric Cards using reusable StatCard component -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Active Projects"
            :value="reportData.summary.activeProjects"
            :subtitle="`Out of ${reportData.summary.totalProjects} total projects`"
            icon="folder"
            color="purple"
            note-class="note-purple"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Average Progress"
            :value="`${reportData.summary.averageProgress}%`"
            subtitle="Across all workspace projects"
            icon="trending_up"
            color="blue"
            note-class="note-blue"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="On Track"
            :value="reportData.summary.onTrackCount"
            subtitle="Meeting scheduled milestones"
            icon="check_circle"
            color="green"
            note-class="note-green"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Slipping / At Risk"
            :value="reportData.summary.slippingCount"
            subtitle="Requires PM attention"
            icon="warning_amber"
            color="red"
            note-class="note-red"
            :negative="reportData.summary.slippingCount > 0"
            :clickable="false"
          />
        </div>
      </div>

      <!-- Data Table -->
      <q-card flat bordered :dark="$q.dark.isActive">
        <q-table
          flat
          :rows="filteredRows"
          :columns="columns"
          row-key="projectId"
          :pagination="initialPagination"
          :dark="$q.dark.isActive"
          no-data-label="No projects found matching the criteria"
        >
          <!-- Status -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.row.status)" outline class="text-weight-medium">
                {{ formatProjectStatus(props.row.status) }}
              </q-badge>
            </q-td>
          </template>

          <!-- Priority -->
          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-chip
                outline
                size="sm"
                :color="getPriorityColor(props.row.priority)"
                class="text-weight-medium"
              >
                {{ props.row.priority }}
              </q-chip>
            </q-td>
          </template>

          <!-- Progress -->
          <template #body-cell-progress="props">
            <q-td :props="props" style="min-width: 140px">
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-weight-bold">{{ props.row.progress }}%</span>
                <span class="text-grey-6"
                  >{{ props.row.completedTasks }} of {{ props.row.totalTasks }} Done</span
                >
              </div>
              <q-linear-progress
                rounded
                size="8px"
                :value="props.row.progress / 100"
                :color="props.row.progress === 100 ? 'positive' : 'primary'"
              />
            </q-td>
          </template>

          <!-- Health -->
          <template #body-cell-health="props">
            <q-td :props="props">
              <q-badge
                rounded
                :color="
                  props.row.health === 'On Track'
                    ? 'positive'
                    : props.row.health === 'At Risk'
                      ? 'warning'
                      : 'negative'
                "
                class="q-px-sm q-py-xs text-weight-medium"
              >
                {{ props.row.health }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Print-only Report Document -->
    <PrintReportLayout
      title="Project Progress Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 26%">Project Name</th>
            <th style="width: 14%">Status</th>
            <th style="width: 10%">Priority</th>
            <th style="width: 12%; text-align: center">Start Date</th>
            <th style="width: 12%; text-align: center">Deadline</th>
            <th style="width: 16%">Progress</th>
            <th style="width: 10%; text-align: center">Tasks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.projectId">
            <td>
              <strong>{{ r.name }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.projectId }}</div>
            </td>
            <td>
              <span
                class="print-badge"
                :class="
                  r.status === 'COMPLETED'
                    ? 'badge-positive'
                    : r.status === 'IN_PROGRESS'
                      ? 'badge-info'
                      : 'badge-warning'
                "
              >
                {{ formatProjectStatus(r.status) }}
              </span>
            </td>
            <td>{{ r.priority }}</td>
            <td style="text-align: center">{{ r.startDate }}</td>
            <td style="text-align: center">{{ r.deadline }}</td>
            <td>
              <div>
                <strong>{{ r.progress }}%</strong> ({{ r.completedTasks }} of
                {{ r.totalTasks }} done)
              </div>
              <div class="print-progress-bar">
                <div class="print-progress-fill" :style="{ width: `${r.progress}%` }"></div>
              </div>
            </td>
            <td style="text-align: center">{{ r.completedTasks }}/{{ r.totalTasks }}</td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" style="text-align: center; padding: 16px; color: #6b7280">
              No project records match the selected filter criteria.
            </td>
          </tr>
        </tbody>
      </table>
    </PrintReportLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import type { Project, Task } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from '@/components/reports/PrintReportLayout.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import {
  computeProjectProgressReport,
  type ProjectProgressReportRow,
} from '@/components/reports/reportCalculations';
import { exportToCsv } from '@/utils/csvExport';

const $q = useQuasar();

function formatProjectStatus(status?: string | null): string {
  if (!status) return '';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const props = defineProps<{
  projects: Project[];
  tasks: Task[];
}>();

const selectedProjectId = ref<number | 'ALL'>('ALL');
const selectedStatus = ref<string>('ALL');

const initialPagination = {
  sortBy: 'progress',
  descending: true,
  page: 1,
  rowsPerPage: 10,
};

const reportData = computed(() => computeProjectProgressReport(props.projects, props.tasks));

const projectOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...props.projects.map((p) => ({ label: p.name, value: p.project_id })),
]);

const statusOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Not Started', value: 'NOT_STARTED' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const filteredRows = computed<ProjectProgressReportRow[]>(() => {
  return reportData.value.rows.filter((row) => {
    if (selectedProjectId.value !== 'ALL' && row.projectId !== selectedProjectId.value) {
      return false;
    }
    if (selectedStatus.value !== 'ALL' && row.status !== selectedStatus.value) {
      return false;
    }
    return true;
  });
});

function resetFilters() {
  selectedProjectId.value = 'ALL';
  selectedStatus.value = 'ALL';
}

function exportCsv() {
  const today = new Date().toISOString().split('T')[0];
  const headers = [
    'Project ID',
    'Project Name',
    'Status',
    'Priority',
    'Start Date',
    'Deadline',
    'Progress (%)',
    'Total Tasks',
    'Completed Tasks',
    'In Progress Tasks',
    'Scheduled Tasks',
    'Unassigned Tasks',
    'Expected Effort (h)',
    'Actual Effort (h)',
    'Effort Variance (h)',
    'Schedule Health',
  ];

  const rows = filteredRows.value.map((r) => [
    r.projectId,
    r.name,
    formatProjectStatus(r.status),
    r.priority,
    r.startDate,
    r.deadline,
    r.progress,
    r.totalTasks,
    r.completedTasks,
    r.inProgressTasks,
    r.scheduledTasks,
    r.unassignedTasks,
    r.expectedEffort,
    r.actualEffort,
    r.effortVariance,
    r.health,
  ]);

  exportToCsv({
    filename: `project_progress_report_${today}.csv`,
    headers,
    rows,
  });

  $q.notify({
    type: 'positive',
    message: `Exported ${filteredRows.value.length} project records to CSV`,
    icon: 'file_download_done',
  });
}

const selectedProjectName = computed(() => {
  if (selectedProjectId.value === 'ALL') return 'All Projects';
  const found = props.projects.find((p) => p.project_id === selectedProjectId.value);
  return found ? found.name : `Project #${selectedProjectId.value}`;
});

const selectedStatusLabel = computed(() => {
  const found = statusOptions.find((s) => s.value === selectedStatus.value);
  return found ? found.label : selectedStatus.value;
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project Scope', value: selectedProjectName.value },
  { label: 'Status Filter', value: selectedStatusLabel.value },
  {
    label: 'Evaluated Projects',
    value: `${filteredRows.value.length} of ${reportData.value.rows.length}`,
  },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Active Projects',
    value: reportData.value.summary.activeProjects,
    color: 'primary',
    helper: `Out of ${reportData.value.summary.totalProjects} total`,
  },
  {
    label: 'Average Progress',
    value: `${reportData.value.summary.averageProgress}%`,
    color: 'info',
    helper: 'Across active portfolio',
  },
  {
    label: 'On Track',
    value: reportData.value.summary.onTrackCount,
    color: 'positive',
    helper: 'Progress aligned with timeline',
  },
  {
    label: 'Slipping / At Risk',
    value: reportData.value.summary.slippingCount,
    color: 'negative',
    helper: 'Requires PM attention',
  },
]);

const printNotes = [
  'Project progress percentages reflect weighted completion of underlying scheduled tasks.',
  'Effort variance = Actual Logged Effort - Expected Initial Effort. Positive variance indicates effort overrun.',
  'Data reflects current live project and task state in the scheduling database.',
];

function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'positive';
    case 'IN_PROGRESS':
      return 'primary';
    case 'NOT_STARTED':
      return 'grey-7';
    case 'ON_HOLD':
      return 'warning';
    case 'CANCELLED':
    case 'ARCHIVED':
      return 'negative';
    default:
      return 'grey-6';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'negative';
    case 'HIGH':
      return 'deep-orange';
    case 'MEDIUM':
      return 'primary';
    case 'LOW':
      return 'teal';
    default:
      return 'grey-6';
  }
}

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Project', field: 'name', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'left', sortable: true },
  { name: 'progress', label: 'Progress & Tasks', field: 'progress', align: 'left', sortable: true },
  { name: 'startDate', label: 'Start Date', field: 'startDate', align: 'center', sortable: true },
  { name: 'deadline', label: 'Deadline', field: 'deadline', align: 'center', sortable: true },
  { name: 'health', label: 'Health', field: 'health', align: 'center', sortable: true },
];
</script>
