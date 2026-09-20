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

      <!-- KPI Metric Cards using reusable StatCard component -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Delayed / At-Risk"
            :value="filteredDelayedCount"
            :subtitle="
              hasActiveFilters
                ? `Out of ${reportData.totalDelayed} total portfolio delayed`
                : 'Active tasks requiring PM attention'
            "
            icon="warning"
            color="red"
            note-class="note-red"
            :negative="filteredDelayedCount > 0"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Past Deadline"
            :value="filteredOverdueCount"
            :subtitle="
              hasActiveFilters
                ? `${filteredOverdueCount} of ${reportData.totalOverdue} overdue in portfolio`
                : 'Breached target deadline'
            "
            icon="event_busy"
            color="red"
            note-class="note-red"
            :negative="filteredOverdueCount > 0"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Effort Overrun"
            :value="filteredOverrunCount"
            :subtitle="
              hasActiveFilters
                ? `${filteredOverrunCount} of ${reportData.totalOverrun} over-budget tasks`
                : 'Exceeding planned effort'
            "
            icon="hourglass_bottom"
            color="orange"
            note-class="note-orange"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Schedule Bottlenecks"
            :value="filteredBottlenecksCount"
            :subtitle="
              hasActiveFilters
                ? 'Filtered critical path & slippage risks'
                : 'CPM dependency & milestone risks'
            "
            icon="account_tree"
            color="purple"
            note-class="note-purple"
            :clickable="false"
          />
        </div>
      </div>

      <!-- Dynamic Filter-Aware Alert Banner -->
      <q-banner
        rounded
        class="text-white q-mt-sm"
        :class="filteredDelayedCount > 0 ? 'bg-negative' : 'bg-positive'"
      >
        <template #avatar>
          <q-icon :name="filteredDelayedCount > 0 ? 'warning' : 'check_circle'" />
        </template>
        <div class="text-weight-bold text-subtitle2">
          {{
            filteredDelayedCount > 0
              ? `${filteredDelayedCount} Active Task(s) Requiring PM Attention ${hasActiveFilters ? '(Filtered Scope)' : ''}`
              : 'All Tasks in Selected Scope Are Currently On Schedule!'
          }}
        </div>
        <div class="text-caption">
          {{ filteredOverdueCount }} task(s) past target deadline &bull;
          {{ filteredOverrunCount }} task(s) exceeding effort estimates &bull;
          {{ filteredBottlenecksCount }} schedule/dependency risk(s).
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
              <div class="row items-center no-wrap gap-xs">
                <q-icon name="person" size="15px" color="grey-6" class="flex-shrink-0" />
                <span class="text-body2" style="line-height: 1.3">{{ props.row.assignees }}</span>
              </div>
            </q-td>
          </template>

          <!-- Delay Types / Tags -->
          <template #body-cell-delayTypes="props">
            <q-td :props="props">
              <div class="row items-center wrap gap-xs">
                <q-badge
                  v-for="dType in props.row.delayTypes"
                  :key="dType"
                  rounded
                  :color="
                    dType === 'Overdue Deadline'
                      ? 'negative'
                      : dType === 'Effort Overrun'
                        ? 'deep-orange'
                        : dType === 'Deadline Slippage'
                          ? 'amber-9'
                          : 'purple-8'
                  "
                  class="q-px-sm q-py-xs text-weight-bold"
                >
                  {{ dType }}
                </q-badge>
              </div>
            </q-td>
          </template>

          <!-- Delay / Overdue -->
          <template #body-cell-daysOverdue="props">
            <q-td :props="props" align="center">
              <span
                class="text-weight-bold cursor-pointer"
                :class="props.row.daysOverdue > 0 ? 'text-negative' : 'text-warning'"
              >
                {{ props.row.daysOverdue > 0 ? `+${props.row.daysOverdue}d` : 'At Risk' }}
              </span>
              <q-tooltip class="bg-dark text-body2">
                <template v-if="props.row.daysOverdue > 0 && props.row.deadline !== '—'">
                  Overdue by {{ props.row.daysOverdue }} days past target deadline ({{ props.row.deadline }})
                </template>
                <template v-else-if="props.row.daysOverdue > 0">
                  Projected milestone delay: +{{ props.row.daysOverdue }} days
                </template>
                <template v-else>
                  Task is on critical path or schedule is at risk
                </template>
              </q-tooltip>
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
            <th style="width: 15%">Delay Factors</th>
            <th style="width: 10%; text-align: center">Target Deadline</th>
            <th style="width: 10%; text-align: center">CPM Planned End</th>
            <th style="width: 11%; text-align: right">Delay / Effort</th>
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
            <td>
              <span
                v-for="dType in r.delayTypes"
                :key="dType"
                class="print-badge"
                :class="
                  dType === 'Overdue Deadline'
                    ? 'badge-negative'
                    : dType === 'Effort Overrun'
                      ? 'badge-warning'
                      : 'badge-info'
                "
                style="margin: 1px 2px"
              >
                {{ dType }}
              </span>
            </td>
            <td style="text-align: center">{{ r.deadline }}</td>
            <td style="text-align: center">{{ r.plannedEnd }}</td>
            <td style="text-align: right">
              <div style="font-weight: 700; color: #dc2626">
                {{ r.daysOverdue > 0 ? `+${r.daysOverdue}d` : 'At Risk' }}
              </div>
              <div style="font-size: 10px; color: #6b7280">
                {{ r.actualEffort }}h / {{ r.expectedEffort }}h
                <span v-if="r.effortOverrun > 0" style="color: #dc2626; font-weight: 700">
                  (+{{ r.effortOverrun }}h)
                </span>
              </div>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td
              colspan="7"
              style="text-align: center; padding: 16px; color: #059669; font-weight: 600"
            >
              ✓ All tasks in the selected scope are currently on schedule. No delayed or at-risk tasks found.
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
import StatCard from '@/components/dashboard/StatCard.vue';
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

const filteredRows = computed<DelayedTaskReportRow[]>(() => {
  return reportData.value.rows.filter((row) => {
    if (
      selectedProjectId.value !== 'ALL' &&
      Number(row.projectId) !== Number(selectedProjectId.value)
    ) {
      return false;
    }
    if (selectedResourceId.value !== 'ALL') {
      const origTask = props.tasks.find((t) => t.task_id === row.taskId);
      const selId = Number(selectedResourceId.value);
      const isAssigned =
        origTask?.assigned_resource_ids?.some((id) => Number(id) === selId) ||
        origTask?.assigned_resources?.some((ar) => Number(ar.user_id) === selId) ||
        row.assignees.toLowerCase().includes(selectedResourceName.value.toLowerCase());
      if (!isAssigned) return false;
    }
    if (selectedDelayType.value !== 'ALL') {
      if (!row.delayTypes.includes(selectedDelayType.value)) return false;
    }
    return true;
  });
});

const filteredDelayedCount = computed(() => filteredRows.value.length);
const filteredOverdueCount = computed(
  () => filteredRows.value.filter((r) => r.delayTypes.includes('Overdue Deadline')).length,
);
const filteredOverrunCount = computed(
  () => filteredRows.value.filter((r) => r.delayTypes.includes('Effort Overrun')).length,
);
const filteredBottlenecksCount = computed(
  () =>
    filteredRows.value.filter(
      (r) =>
        r.delayTypes.includes('Schedule Bottleneck') ||
        r.delayTypes.includes('Deadline Slippage') ||
        r.isDeadlineAtRisk ||
        r.isScheduleAtRisk,
    ).length,
);

function resetFilters() {
  selectedProjectId.value = 'ALL';
  selectedResourceId.value = 'ALL';
  selectedDelayType.value = 'ALL';
}

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project Scope', value: selectedProjectName.value },
  { label: 'Assigned Resource', value: selectedResourceName.value },
  { label: 'Risk Category', value: selectedDelayTypeLabel.value },
  { label: 'Matching Tasks', value: `${filteredRows.value.length} tasks` },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Delayed Tasks',
    value: filteredDelayedCount.value,
    color: 'negative',
    helper: `${reportData.value.totalDelayed} total across portfolio`,
  },
  {
    label: 'Past Deadline',
    value: filteredOverdueCount.value,
    color: 'negative',
    helper: 'Target deadline breached',
  },
  {
    label: 'Effort Overrun',
    value: filteredOverrunCount.value,
    color: 'warning',
    helper: 'Hours exceeding estimate',
  },
  {
    label: 'Schedule Bottlenecks',
    value: filteredBottlenecksCount.value,
    color: 'primary',
    helper: 'Critical path & slippage risk',
  },
]);

const printNotes = [
  'Unified delay classification: Status is not COMPLETED and (deadline < current date, scheduling risk flag is set, or actual effort > expected effort).',
  'Days Overdue / Delay represents calendar days past deadline or projected slippage beyond milestone.',
  'Effort overrun represents excess hours logged beyond initial planned effort.',
];

const columns: QTableProps['columns'] = [
  {
    name: 'title',
    label: 'Task / Project',
    field: 'title',
    align: 'left',
    sortable: true,
    style: 'min-width: 220px',
  },
  {
    name: 'assignees',
    label: 'Assigned Team',
    field: 'assignees',
    align: 'left',
    sortable: true,
    style: 'min-width: 175px',
  },
  {
    name: 'delayTypes',
    label: 'Delay Factors',
    field: 'delayTypes',
    align: 'left',
    style: 'min-width: 160px',
  },
  {
    name: 'deadline',
    label: 'Target Deadline',
    field: 'deadline',
    align: 'center',
    sortable: true,
    style: 'min-width: 110px',
  },
  {
    name: 'plannedEnd',
    label: 'CPM Planned End',
    field: 'plannedEnd',
    align: 'center',
    sortable: true,
    style: 'min-width: 120px',
  },
  {
    name: 'daysOverdue',
    label: 'Delay Magnitude',
    field: 'daysOverdue',
    align: 'center',
    sortable: true,
    style: 'min-width: 110px',
  },
  {
    name: 'effortOverrun',
    label: 'Actual / Planned Effort',
    field: 'actualEffort',
    align: 'right',
    sortable: true,
    style: 'min-width: 140px',
  },
];
</script>
