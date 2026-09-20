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
            type="date"
            label="Completed From"
            style="min-width: 150px"
            :dark="$q.dark.isActive"
          />

          <q-input
            v-model="endDateFilter"
            outlined
            dense
            type="date"
            label="Completed To"
            style="min-width: 150px"
            :dark="$q.dark.isActive"
          />

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

        <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
          Showing {{ filteredRows.length }} completed tasks
        </div>
      </div>

      <!-- KPI Metric Cards -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">COMPLETED TASKS</div>
              <div class="text-h4 text-weight-bold text-positive q-mt-xs">
                {{ reportData.summary.completedTasksCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">
                Out of {{ reportData.summary.totalTasksCount }} total tasks
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">COMPLETION RATE</div>
              <div class="text-h4 text-weight-bold text-teal q-mt-xs">
                {{ reportData.summary.completionRate }}%
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Portfolio execution velocity</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">AVG TURNAROUND</div>
              <div class="text-h4 text-weight-bold text-primary q-mt-xs">
                {{ reportData.summary.avgTurnaroundDays }}
                <span class="text-subtitle2 text-weight-regular">days</span>
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Start to completion interval</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">ON-TIME DELIVERY</div>
              <div class="text-h4 text-weight-bold text-positive q-mt-xs">
                {{ reportData.summary.onTimeCount }}
                <span class="text-subtitle2 text-negative text-weight-regular">
                  ({{ reportData.summary.lateCount }} Late)
                </span>
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Delivered before or on deadline</div>
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
                class="q-px-sm q-py-xs text-weight-bold"
              >
                {{ props.row.onTimeStatus }}
              </q-badge>
            </q-td>
          </template>

          <!-- Turnaround -->
          <template #body-cell-turnaroundDays="props">
            <q-td :props="props" align="center">
              {{ props.row.turnaroundDays !== null ? `${props.row.turnaroundDays} d` : '—' }}
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
            <td style="text-align: center">{{ r.completionDate }}</td>
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
              {{ r.turnaroundDays !== null ? `${r.turnaroundDays} d` : '—' }}
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
import type { QTableProps } from 'quasar';
import type { Project, Task, ResourceUser } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from '@/components/reports/PrintReportLayout.vue';
import {
  computeTaskCompletionReport,
  type TaskCompletionReportRow,
} from '@/components/reports/reportCalculations';

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
  },
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
