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

        <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
          Showing {{ filteredRows.length }} of {{ reportData.rows.length }} projects
        </div>
      </div>

      <!-- KPI Metric Cards -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">ACTIVE PROJECTS</div>
              <div class="text-h4 text-weight-bold text-primary q-mt-xs">
                {{ reportData.summary.activeProjects }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">
                Out of {{ reportData.summary.totalProjects }} total
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">AVERAGE PROGRESS</div>
              <div class="text-h4 text-weight-bold text-info q-mt-xs">
                {{ reportData.summary.averageProgress }}%
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Across all projects</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">ON TRACK</div>
              <div class="text-h4 text-weight-bold text-positive q-mt-xs">
                {{ reportData.summary.onTrackCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Meeting scheduled milestones</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">SLIPPING / AT RISK</div>
              <div class="text-h4 text-weight-bold text-negative q-mt-xs">
                {{ reportData.summary.slippingCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Requires PM attention</div>
            </q-card-section>
          </q-card>
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
              <q-badge :color="getStatusColor(props.row.status)" outline>
                {{ props.row.status }}
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
                <span class="text-grey-5"
                  >{{ props.row.completedTasks }}/{{ props.row.totalTasks }} Tasks</span
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
                class="q-px-sm q-py-xs"
              >
                {{ props.row.health }}
              </q-badge>
            </q-td>
          </template>

          <!-- Effort Variance -->
          <template #body-cell-effortVariance="props">
            <q-td :props="props">
              <span
                :class="
                  props.row.effortVariance > 0 ? 'text-negative text-weight-bold' : 'text-grey-7'
                "
              >
                {{
                  props.row.effortVariance > 0
                    ? `+${props.row.effortVariance}h`
                    : `${props.row.effortVariance}h`
                }}
              </span>
              <div class="text-caption text-grey-5">
                {{ props.row.actualEffort }}h / {{ props.row.expectedEffort }}h
              </div>
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
            <th style="width: 25%">Project Name</th>
            <th style="width: 12%">Status</th>
            <th style="width: 10%">Priority</th>
            <th style="width: 11%; text-align: center">Start Date</th>
            <th style="width: 11%; text-align: center">Deadline</th>
            <th style="width: 15%">Progress</th>
            <th style="width: 8%; text-align: center">Tasks</th>
            <th style="width: 8%; text-align: right">Effort (Var)</th>
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
                {{ r.status }}
              </span>
            </td>
            <td>{{ r.priority }}</td>
            <td style="text-align: center">{{ r.startDate }}</td>
            <td style="text-align: center">{{ r.deadline }}</td>
            <td>
              <div>
                <strong>{{ r.progress }}%</strong> ({{ r.completedTasks }}/{{ r.totalTasks }} done)
              </div>
              <div class="print-progress-bar">
                <div class="print-progress-fill" :style="{ width: `${r.progress}%` }"></div>
              </div>
            </td>
            <td style="text-align: center">{{ r.completedTasks }}/{{ r.totalTasks }}</td>
            <td style="text-align: right">
              <div>{{ r.actualEffort }}h / {{ r.expectedEffort }}h</div>
              <div
                :style="{
                  color: r.effortVariance > 0 ? '#dc2626' : '#059669',
                  fontSize: '10px',
                  fontWeight: 700,
                }"
              >
                {{ r.effortVariance > 0 ? `+${r.effortVariance}h` : `${r.effortVariance}h` }}
              </div>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="8" style="text-align: center; padding: 16px; color: #6b7280">
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
import type { QTableProps } from 'quasar';
import type { Project, Task } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from '@/components/reports/PrintReportLayout.vue';
import {
  computeProjectProgressReport,
  type ProjectProgressReportRow,
} from '@/components/reports/reportCalculations';

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
  {
    name: 'effortVariance',
    label: 'Effort Variance',
    field: 'effortVariance',
    align: 'right',
    sortable: true,
  },
  { name: 'health', label: 'Health', field: 'health', align: 'center', sortable: true },
];
</script>

<style scoped>
.kpi-card {
  border-radius: 8px;
  transition: transform 0.15s ease-in-out;
}
.kpi-card:hover {
  transform: translateY(-2px);
}
</style>
