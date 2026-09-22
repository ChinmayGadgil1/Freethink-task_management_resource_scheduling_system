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
            style="min-width: 200px"
            :dark="$q.dark.isActive"
          />

          <q-select
            v-model="selectedResourceId"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="resourceOptions"
            label="Filter by Resource"
            style="min-width: 200px"
            :dark="$q.dark.isActive"
          />

          <q-input
            v-model="startDateFilter"
            outlined
            dense
            mask="####-##-##"
            label="Completed From"
            style="min-width: 150px"
            :dark="$q.dark.isActive"
            clearable
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer text-primary">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="startDateFilter" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input
            v-model="endDateFilter"
            outlined
            dense
            mask="####-##-##"
            label="Completed To"
            style="min-width: 150px"
            :dark="$q.dark.isActive"
            clearable
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer text-primary">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="endDateFilter" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-btn
            v-if="hasActiveFilters"
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
            Showing {{ filteredRows.length }} completed tasks
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
            <q-tooltip>Export filtered completed tasks to CSV</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- KPI Metric Cards using reusable StatCard component -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed Tasks"
            :value="reportData.summary.completedTasksCount"
            :subtitle="`Out of ${reportData.summary.totalTasksCount} total tasks`"
            icon="task_alt"
            color="green"
            note-class="note-green"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completion Rate"
            :value="`${reportData.summary.completionRate}%`"
            subtitle="Portfolio execution velocity"
            icon="speed"
            color="purple"
            note-class="note-purple"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Avg Turnaround"
            :value="`${reportData.summary.avgTurnaroundDays}d`"
            subtitle="Start to completion interval"
            icon="timelapse"
            color="blue"
            note-class="note-blue"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="On-Time Delivery"
            :value="reportData.summary.onTimeCount"
            :subtitle="`${reportData.summary.lateCount} Delivered late`"
            icon="verified"
            :color="reportData.summary.lateCount > 0 ? 'orange' : 'green'"
            :note-class="reportData.summary.lateCount > 0 ? 'note-orange' : 'note-green'"
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
          row-key="taskId"
          :pagination="initialPagination"
          :dark="$q.dark.isActive"
          no-data-label="No completed tasks matching criteria"
        >
          <!-- Task Title -->
          <template #body-cell-title="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.title }}</div>
              <div class="text-caption text-grey-5">
                {{ props.row.projectName }} (#{{ props.row.taskId }})
              </div>
            </q-td>
          </template>

          <!-- Assigned Resources -->
          <template #body-cell-assignedResources="props">
            <q-td :props="props">
              <div class="text-caption">{{ props.row.assignedResources }}</div>
            </q-td>
          </template>

          <!-- Status -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge color="positive" outline>
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>

          <!-- Completion Date & Deadline -->
          <template #body-cell-completionDate="props">
            <q-td :props="props" align="center">
              <div class="text-weight-medium">{{ props.row.completionDate }}</div>
              <div class="text-caption text-grey-5">Due: {{ props.row.deadline }}</div>
            </q-td>
          </template>

          <!-- Turnaround -->
          <template #body-cell-turnaroundDays="props">
            <q-td :props="props" align="center">
              {{ props.row.turnaroundDays !== null ? `${props.row.turnaroundDays}d` : '—' }}
            </q-td>
          </template>

          <!-- Effort Variance -->
          <template #body-cell-effortVariance="props">
            <q-td :props="props">
              <div>
                <span
                  v-if="props.row.actualEffort === 0"
                  class="text-caption text-grey-6 text-weight-medium"
                >
                  0h logged
                </span>
                <span
                  v-else-if="props.row.effortVariance > 0"
                  class="text-negative text-weight-bold"
                >
                  +{{ props.row.effortVariance }}h Overrun
                </span>
                <span
                  v-else-if="props.row.effortVariance < 0"
                  class="text-positive text-weight-medium"
                >
                  {{ Math.abs(props.row.effortVariance) }}h saved
                </span>
                <span v-else class="text-positive text-weight-medium"> On target </span>
              </div>
              <div class="text-caption text-grey-5">
                <template v-if="props.row.actualEffort === 0">
                  {{ props.row.expectedEffort }}h planned
                </template>
                <template v-else>
                  {{ props.row.actualEffort }}h / {{ props.row.expectedEffort }}h
                </template>
              </div>
            </q-td>
          </template>

          <!-- On Time / Late -->
          <template #body-cell-onTimeStatus="props">
            <q-td :props="props">
              <q-badge
                rounded
                :color="
                  props.row.onTimeStatus === 'On Time'
                    ? 'positive'
                    : props.row.onTimeStatus === 'Late'
                      ? 'negative'
                      : 'grey-6'
                "
                class="q-px-sm q-py-xs text-weight-bold cursor-pointer"
              >
                {{ props.row.onTimeStatus }}
                <q-tooltip v-if="props.row.onTimeStatus === 'Late'" class="bg-dark text-body2">
                  Late by {{ props.row.daysLate }} days (Target: {{ props.row.deadline }})
                </q-tooltip>
                <q-tooltip
                  v-else-if="props.row.onTimeStatus === 'On Time'"
                  class="bg-dark text-body2"
                >
                  Completed on or before deadline (Target: {{ props.row.deadline }})
                </q-tooltip>
                <q-tooltip v-else class="bg-dark text-body2">
                  No target deadline specified
                </q-tooltip>
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Print-only Report Document -->
    <PrintReportLayout
      title="Task Completion Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 25%">Task Title</th>
            <th style="width: 15%">Project</th>
            <th style="width: 15%">Assigned Resource(s)</th>
            <th style="width: 10%; text-align: center">Completion Date</th>
            <th style="width: 10%; text-align: right">Effort (Act/Exp)</th>
            <th style="width: 10%; text-align: center">Delivery</th>
            <th style="width: 8%; text-align: center">Turnaround</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.taskId">
            <td>
              <strong>{{ r.title }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.taskId }}</div>
            </td>
            <td>{{ r.projectName }}</td>
            <td>{{ r.assignedResources }}</td>
            <td style="text-align: center">
              <div>{{ r.completionDate }}</div>
              <div style="font-size: 9px; color: #6b7280">Due: {{ r.deadline }}</div>
            </td>
            <td style="text-align: right">
              <div>
                {{
                  r.actualEffort === 0
                    ? `${r.expectedEffort}h planned`
                    : `${r.actualEffort}h / ${r.expectedEffort}h`
                }}
              </div>
              <div
                :style="{
                  color:
                    r.actualEffort === 0 ? '#6b7280' : r.effortVariance > 0 ? '#dc2626' : '#059669',
                  fontSize: '10px',
                  fontWeight: 600,
                }"
              >
                {{
                  r.actualEffort === 0
                    ? '0h logged'
                    : r.effortVariance > 0
                      ? `+${r.effortVariance}h Overrun`
                      : r.effortVariance < 0
                        ? `${Math.abs(r.effortVariance)}h saved`
                        : 'On target'
                }}
              </div>
            </td>
            <td style="text-align: center">
              <span
                class="print-badge"
                :class="
                  r.onTimeStatus === 'On Time'
                    ? 'badge-positive'
                    : r.onTimeStatus === 'Late'
                      ? 'badge-negative'
                      : ''
                "
              >
                {{ r.onTimeStatus }}
              </span>
            </td>
            <td style="text-align: center">
              {{ r.turnaroundDays !== null ? `${r.turnaroundDays}d` : '—' }}
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" style="text-align: center; padding: 16px; color: #6b7280">
              No completed task records found matching the selected filter criteria.
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
import type { Project, Task, ResourceUser } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from '@/components/reports/PrintReportLayout.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import {
  computeTaskCompletionReport,
  type TaskCompletionReportRow,
} from '@/components/reports/reportCalculations';
import { exportToCsv } from '@/utils/csvExport';

const $q = useQuasar();

const props = defineProps<{
  tasks: Task[];
  projects: Project[];
  resources: ResourceUser[];
}>();

const selectedProjectId = ref<number | 'ALL'>('ALL');
const selectedResourceId = ref<number | 'ALL'>('ALL');
const startDateFilter = ref<string>('');
const endDateFilter = ref<string>('');

const initialPagination = {
  sortBy: 'completionDate',
  descending: true,
  page: 1,
  rowsPerPage: 10,
};

const reportData = computed(() => computeTaskCompletionReport(props.tasks, props.projects));

const projectOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...props.projects.map((p) => ({ label: p.name, value: p.project_id })),
]);

const resourceOptions = computed(() => [
  { label: 'All Resources', value: 'ALL' },
  ...props.resources.map((r) => ({ label: r.name, value: r.user_id })),
]);

const hasActiveFilters = computed(() => {
  return (
    selectedProjectId.value !== 'ALL' ||
    selectedResourceId.value !== 'ALL' ||
    Boolean(startDateFilter.value) ||
    Boolean(endDateFilter.value)
  );
});

const filteredRows = computed<TaskCompletionReportRow[]>(() => {
  return reportData.value.rows.filter((row) => {
    if (selectedProjectId.value !== 'ALL' && row.projectId !== selectedProjectId.value) {
      return false;
    }
    if (selectedResourceId.value !== 'ALL') {
      const origTask = props.tasks.find((t) => t.task_id === row.taskId);
      const isAssigned =
        origTask?.assigned_resource_ids?.includes(selectedResourceId.value) ||
        origTask?.assigned_resources?.some((ar) => ar.user_id === selectedResourceId.value);
      if (!isAssigned) return false;
    }
    if (startDateFilter.value && row.completionDate !== '—') {
      if (row.completionDate < startDateFilter.value) return false;
    }
    if (endDateFilter.value && row.completionDate !== '—') {
      if (row.completionDate > endDateFilter.value) return false;
    }
    return true;
  });
});

function resetFilters() {
  selectedProjectId.value = 'ALL';
  selectedResourceId.value = 'ALL';
  startDateFilter.value = '';
  endDateFilter.value = '';
}

function exportCsv() {
  const today = new Date().toISOString().split('T')[0];
  const headers = [
    'Task ID',
    'Task Title',
    'Project ID',
    'Project Name',
    'Assigned Resources',
    'Status',
    'Completion Date',
    'Deadline',
    'Days Late',
    'Expected Effort (h)',
    'Actual Effort (h)',
    'Effort Variance (h)',
    'Punctuality',
    'Turnaround (Days)',
  ];

  const rows = filteredRows.value.map((r) => [
    r.taskId,
    r.title,
    r.projectId,
    r.projectName,
    r.assignedResources,
    r.status,
    r.completionDate,
    r.deadline,
    r.daysLate,
    r.expectedEffort,
    r.actualEffort,
    r.effortVariance,
    r.onTimeStatus,
    r.turnaroundDays !== null ? r.turnaroundDays : '',
  ]);

  exportToCsv({
    filename: `task_completion_report_${today}.csv`,
    headers,
    rows,
  });

  $q.notify({
    type: 'positive',
    message: `Exported ${filteredRows.value.length} completed task records to CSV`,
    icon: 'file_download_done',
  });
}

const selectedProjectName = computed(() => {
  if (selectedProjectId.value === 'ALL') return 'All Projects';
  const found = props.projects.find((p) => p.project_id === selectedProjectId.value);
  return found ? found.name : `Project #${selectedProjectId.value}`;
});

const selectedResourceName = computed(() => {
  if (selectedResourceId.value === 'ALL') return 'All Resources';
  const found = props.resources.find((r) => r.user_id === selectedResourceId.value);
  return found ? found.name : `Resource #${selectedResourceId.value}`;
});

const selectedDateRangeLabel = computed(() => {
  if (startDateFilter.value && endDateFilter.value) {
    return `${startDateFilter.value} to ${endDateFilter.value}`;
  }
  if (startDateFilter.value) return `From ${startDateFilter.value}`;
  if (endDateFilter.value) return `Until ${endDateFilter.value}`;
  return 'All Dates';
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project Scope', value: selectedProjectName.value },
  { label: 'Assigned Resource', value: selectedResourceName.value },
  { label: 'Date Range', value: selectedDateRangeLabel.value },
  {
    label: 'Completed Tasks Shown',
    value: `${filteredRows.value.length} of ${reportData.value.rows.length}`,
  },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Completed Tasks',
    value: reportData.value.summary.completedTasksCount,
    color: 'positive',
    helper: `Out of ${reportData.value.summary.totalTasksCount} total tasks`,
  },
  {
    label: 'Completion Rate',
    value: `${reportData.value.summary.completionRate}%`,
    color: 'info',
    helper: 'Portfolio execution velocity',
  },
  {
    label: 'Avg Turnaround',
    value: `${reportData.value.summary.avgTurnaroundDays}d`,
    color: 'primary',
    helper: 'Start to completion interval',
  },
  {
    label: 'On-Time Deliveries',
    value: reportData.value.summary.onTimeCount,
    color: 'positive',
    helper: `${reportData.value.summary.lateCount} Late Deliveries`,
  },
]);

const printNotes = [
  'Task completion reporting is based on persisted completion timestamps (actual_end).',
  'Turnaround time is computed as calendar days elapsed between task initiation and final completion.',
  'On-Time status designates tasks whose actual_end did not exceed the planned deadline.',
];

const columns: QTableProps['columns'] = [
  { name: 'title', label: 'Task / Project', field: 'title', align: 'left', sortable: true },
  {
    name: 'assignedResources',
    label: 'Assigned Team',
    field: 'assignedResources',
    align: 'left',
    sortable: true,
  },
  {
    name: 'completionDate',
    label: 'Completion Date',
    field: 'completionDate',
    align: 'center',
    sortable: true,
  },
  {
    name: 'turnaroundDays',
    label: 'Turnaround',
    field: 'turnaroundDays',
    align: 'center',
    sortable: true,
  },
  {
    name: 'effortVariance',
    label: 'Actual / Planned Effort',
    field: 'actualEffort',
    align: 'right',
    sortable: true,
  },
  {
    name: 'onTimeStatus',
    label: 'Punctuality',
    field: 'onTimeStatus',
    align: 'center',
    sortable: true,
    style: 'min-width: 120px',
    headerStyle: 'min-width: 120px',
  },
];
</script>
