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

          <q-select
            v-model="selectedDelayType"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="delayTypeOptions"
            label="Delay / Risk Category"
            style="min-width: 220px"
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
          Showing {{ filteredRows.length }} delayed / at-risk tasks
        </div>
      </div>

      <!-- Alert / Summary Banner -->
      <q-banner
        rounded
        class="text-white"
        :class="reportData.totalDelayed > 0 ? 'bg-negative' : 'bg-positive'"
      >
        <template #avatar>
          <q-icon :name="reportData.totalDelayed > 0 ? 'warning' : 'check_circle'" />
        </template>
        <div class="text-weight-bold text-subtitle2">
          {{
            reportData.totalDelayed > 0
              ? `${reportData.totalDelayed} Active Task(s) Requiring PM Attention`
              : 'All Active Tasks Are Currently On Schedule!'
          }}
        </div>
        <div class="text-caption">
          {{ reportData.totalOverdue }} task(s) past target deadline &bull;
          {{ reportData.totalOverrun }} task(s) exceeding effort estimates.
        </div>
      </q-banner>

      <!-- Data Table -->
      <q-card flat bordered :dark="$q.dark.isActive">
        <q-table
          flat
          :rows="filteredRows"
          :columns="columns"
          row-key="taskId"
          :pagination="initialPagination"
          :dark="$q.dark.isActive"
          no-data-label="No delayed tasks matching criteria"
        >
          <!-- Title & Project -->
          <template #body-cell-title="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.title }}</div>
              <div class="text-caption text-grey-5">
                {{ props.row.projectName }} (#{{ props.row.taskId }})
              </div>
            </q-td>
          </template>

          <!-- Assignees -->
          <template #body-cell-assignees="props">
            <q-td :props="props">
              <div class="row items-center gap-xs">
                <q-icon name="person" size="14px" color="grey-6" />
                <span>{{ props.row.assignees }}</span>
              </div>
            </q-td>
          </template>

          <!-- Delay / Overdue -->
          <template #body-cell-daysOverdue="props">
            <q-td :props="props" align="right">
              <span
                class="text-weight-bold"
                :class="props.row.daysOverdue > 0 ? 'text-negative' : 'text-warning'"
              >
                {{ props.row.daysOverdue > 0 ? `+${props.row.daysOverdue} d` : 'At Risk' }}
              </span>
            </q-td>
          </template>

          <!-- Effort Overrun -->
          <template #body-cell-effortOverrun="props">
            <q-td :props="props" align="right">
              <div>{{ props.row.actualEffort }}h / {{ props.row.expectedEffort }}h</div>
              <div
                v-if="props.row.effortOverrun > 0"
                class="text-caption text-negative text-weight-bold"
              >
                +{{ props.row.effortOverrun }}h overrun
              </div>
              <div v-else class="text-caption text-grey-6">Within budget</div>
            </q-td>
          </template>

          <!-- Delay Types / Tags -->
          <template #body-cell-delayTypes="props">
            <q-td :props="props">
              <div class="row items-center gap-xs">
                <q-chip
                  v-for="dType in props.row.delayTypes"
                  :key="dType"
                  dense
                  outline
                  size="xs"
                  :color="
                    dType.includes('Overdue')
                      ? 'negative'
                      : dType.includes('Effort')
                        ? 'deep-orange'
                        : 'warning'
                  "
                >
                  {{ dType }}
                </q-chip>
              </div>
            </q-td>
          </template>

          <!-- Risks -->
          <template #body-cell-risks="props">
            <q-td :props="props" align="center">
              <div class="row items-center justify-center gap-xs">
                <q-badge
                  v-if="props.row.isDeadlineAtRisk"
                  color="negative"
                  label="Deadline"
                  class="q-px-xs"
                />
                <q-badge
                  v-if="props.row.isScheduleAtRisk"
                  color="warning"
                  label="Schedule"
                  class="q-px-xs"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Print-only Report Document -->
    <PrintReportLayout
      title="Delayed &amp; At-Risk Tasks Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 25%">Task Title</th>
            <th style="width: 14%">Project</th>
            <th style="width: 15%">Assignees</th>
            <th style="width: 10%; text-align: center">Deadline</th>
            <th style="width: 10%; text-align: center">Planned End</th>
            <th style="width: 8%; text-align: right">Overdue</th>
            <th style="width: 10%; text-align: right">Effort (Act/Exp)</th>
            <th style="width: 8%; text-align: center">Risk Factors</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.taskId">
            <td>
              <strong>{{ r.title }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.taskId }}</div>
            </td>
            <td>{{ r.projectName }}</td>
            <td>{{ r.assignees }}</td>
            <td style="text-align: center">{{ r.deadline }}</td>
            <td style="text-align: center">{{ r.plannedEnd }}</td>
            <td style="text-align: right">
              <span style="font-weight: 700; color: #dc2626">
                {{ r.daysOverdue > 0 ? `+${r.daysOverdue} d` : 'At Risk' }}
              </span>
            </td>
            <td style="text-align: right">
              <div>{{ r.actualEffort }}h / {{ r.expectedEffort }}h</div>
              <div
                v-if="r.effortOverrun > 0"
                style="font-size: 10px; font-weight: 700; color: #dc2626"
              >
                +{{ r.effortOverrun }}h
              </div>
            </td>
            <td style="text-align: center">
              <span
                v-for="dType in r.delayTypes"
                :key="dType"
                class="print-badge"
                :class="dType.includes('Overdue') ? 'badge-negative' : 'badge-warning'"
                style="margin: 1px 2px"
              >
                {{ dType }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td
              colspan="8"
              style="text-align: center; padding: 16px; color: #059669; font-weight: 600"
            >
              ✓ All tasks are currently on schedule. No delayed or at-risk tasks found.
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
  computeDelayedTasksReport,
  type DelayedTaskReportRow,
} from '@/components/reports/reportCalculations';

const props = defineProps<{
  tasks: Task[];
  projects: Project[];
  resources: ResourceUser[];
}>();

const selectedProjectId = ref<number | 'ALL'>('ALL');
const selectedResourceId = ref<number | 'ALL'>('ALL');
const selectedDelayType = ref<string>('ALL');

const initialPagination = {
  sortBy: 'daysOverdue',
  descending: true,
  page: 1,
  rowsPerPage: 10,
};

const reportData = computed(() => computeDelayedTasksReport(props.tasks, props.projects));

const projectOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...props.projects.map((p) => ({ label: p.name, value: p.project_id })),
]);

const resourceOptions = computed(() => [
  { label: 'All Resources', value: 'ALL' },
  ...props.resources.map((r) => ({ label: r.name, value: r.user_id })),
]);

const delayTypeOptions = [
  { label: 'All Delay / Risk Categories', value: 'ALL' },
  { label: 'Overdue Deadline', value: 'Overdue Deadline' },
  { label: 'Deadline Slippage', value: 'Deadline Slippage' },
  { label: 'Schedule Bottleneck', value: 'Schedule Bottleneck' },
  { label: 'Effort Overrun', value: 'Effort Overrun' },
];

const hasActiveFilters = computed(() => {
  return (
    selectedProjectId.value !== 'ALL' ||
    selectedResourceId.value !== 'ALL' ||
    selectedDelayType.value !== 'ALL'
  );
});

const filteredRows = computed<DelayedTaskReportRow[]>(() => {
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
    if (selectedDelayType.value !== 'ALL') {
      if (!row.delayTypes.includes(selectedDelayType.value)) return false;
    }
    return true;
  });
});

function resetFilters() {
  selectedProjectId.value = 'ALL';
  selectedResourceId.value = 'ALL';
  selectedDelayType.value = 'ALL';
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

const selectedDelayTypeLabel = computed(() => {
  const found = delayTypeOptions.find((d) => d.value === selectedDelayType.value);
  return found ? found.label : selectedDelayType.value;
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project Scope', value: selectedProjectName.value },
  { label: 'Assigned Resource', value: selectedResourceName.value },
  { label: 'Risk Category', value: selectedDelayTypeLabel.value },
  { label: 'Matching Tasks', value: `${filteredRows.value.length} tasks` },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Total Delayed Tasks',
    value: reportData.value.totalDelayed,
    color: 'negative',
    helper: 'Immediate attention required',
  },
  {
    label: 'Past Deadline',
    value: reportData.value.totalOverdue,
    color: 'negative',
    helper: 'Target deadline breached',
  },
  {
    label: 'Effort Overrun',
    value: reportData.value.totalOverrun,
    color: 'warning',
    helper: 'Hours exceeding estimate',
  },
  {
    label: 'Critical Risk Tasks',
    value: reportData.value.rows.filter((r) => r.isDeadlineAtRisk || r.isScheduleAtRisk).length,
    color: 'warning',
    helper: 'Schedule bottleneck impact',
  },
]);

const printNotes = [
  'Unified delay classification: Status is not COMPLETED and (deadline < current date, scheduling risk flag is set, or actual effort > expected effort).',
  'Days Overdue / Delay represents calendar days past deadline or projected slippage beyond milestone.',
  'Effort overrun represents excess hours logged beyond initial planned effort.',
];

const columns: QTableProps['columns'] = [
  { name: 'title', label: 'Task / Project', field: 'title', align: 'left', sortable: true },
  { name: 'assignees', label: 'Assigned Team', field: 'assignees', align: 'left', sortable: true },
  { name: 'delayTypes', label: 'Delay Factors', field: 'delayTypes', align: 'left' },
  {
    name: 'deadline',
    label: 'Target Deadline',
    field: 'deadline',
    align: 'center',
    sortable: true,
  },
  {
    name: 'plannedEnd',
    label: 'CPM Planned End',
    field: 'plannedEnd',
    align: 'center',
    sortable: true,
  },
  {
    name: 'daysOverdue',
    label: 'Delay Magnitude',
    field: 'daysOverdue',
    align: 'center',
    sortable: true,
  },
  {
    name: 'effortOverrun',
    label: 'Actual / Planned Effort',
    field: 'actualEffort',
    align: 'right',
    sortable: true,
  },
  { name: 'risks', label: 'Risks', field: 'isDeadlineAtRisk', align: 'center' },
];
</script>
