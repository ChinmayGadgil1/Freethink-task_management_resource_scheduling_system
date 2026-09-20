<template>
  <div>
    <!-- Screen-only interactive UI -->
    <div class="screen-only q-gutter-y-md">
      <!-- Local Filter Bar -->
      <div class="row items-center justify-between wrap gap-sm q-py-sm">
        <div class="row items-center gap-sm">
          <q-select
            v-model="selectedResourceId"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="resourceOptions"
            label="Filter by Resource"
            style="min-width: 180px"
            :dark="$q.dark.isActive"
          />

          <q-select
            v-model="selectedProjectId"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="projectOptions"
            label="Scope by Project"
            style="min-width: 180px"
            :dark="$q.dark.isActive"
          />

          <q-select
            v-model="selectedBand"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="bandOptions"
            label="Utilization Band"
            style="min-width: 190px"
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
          Showing {{ filteredRows.length }} team members
        </div>
      </div>

      <!-- KPI Metric Cards -->
      <div class="row q-col-gutter-md">
        <!-- 1. Total Capacity -->
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Capacity"
            :value="`${filteredCapacity}h`"
            :subtitle="
              hasActiveFilters
                ? `Across ${filteredRows.length} member(s) (${reportData.totalCapacity}h total team)`
                : 'Standard weekly team availability'
            "
            icon="group"
            color="purple"
            note-class="note-purple"
            :clickable="false"
          />
        </div>

        <!-- 2. Scheduled Effort & Logged Hours -->
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Scheduled Effort"
            :value="`${filteredScheduled}h`"
            :subtitle="`${filteredLogged}h actual logged effort`"
            icon="schedule"
            color="blue"
            note-class="note-blue"
            :clickable="false"
          />
        </div>

        <!-- 3. Available Headroom -->
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Available Headroom"
            :value="`${filteredHeadroom}h`"
            subtitle="Unallocated capacity buffer"
            icon="free_cancellation"
            color="green"
            note-class="note-green"
            :clickable="false"
          />
        </div>

        <!-- 4. Avg Team Utilization & Band Breakdown -->
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Avg Team Utilization"
            :value="`${filteredAvgUtilization}%`"
            :subtitle="`${filteredOptimalCount} Optimal · ${filteredOverloadedCount} Overloaded · ${filteredUnderutilizedCount} Underutilized`"
            icon="speed"
            :color="filteredOverloadedCount > 0 ? 'red' : 'primary'"
            :note-class="filteredOverloadedCount > 0 ? 'note-red' : 'note-purple'"
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
          row-key="resourceId"
          :pagination="initialPagination"
          :dark="$q.dark.isActive"
          no-data-label="No resources matching criteria"
        >
          <!-- Resource Name & Role -->
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.name }}</div>
              <div class="text-caption text-grey-5">
                {{ props.row.role }} (#{{ props.row.resourceId }})
              </div>
            </q-td>
          </template>

          <!-- Workload Progress & % -->
          <template #body-cell-workloadPercent="props">
            <q-td :props="props" style="min-width: 150px">
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-weight-bold">{{ props.row.workloadPercent }}%</span>
                <span class="text-grey-5"
                  >{{ props.row.scheduledEffort }}h / {{ props.row.weeklyCapacity }}h</span
                >
              </div>
              <q-linear-progress
                rounded
                size="8px"
                :value="props.row.workloadPercent / 100"
                :color="
                  props.row.workloadPercent === 0
                    ? 'grey-4'
                    : props.row.workloadPercent > 85
                      ? 'negative'
                      : props.row.workloadPercent >= 50
                        ? 'positive'
                        : 'primary'
                "
              />
            </q-td>
          </template>

          <!-- Actual Effort Logged -->
          <template #body-cell-loggedHours="props">
            <q-td :props="props" align="right">
              <span class="text-weight-medium">{{ props.row.loggedHours }}h</span>
            </q-td>
          </template>

          <!-- Headroom Buffer -->
          <template #body-cell-availableHeadroom="props">
            <q-td :props="props" align="right">
              <span
                class="cursor-pointer"
                :class="
                  props.row.availableHeadroom < 0
                    ? 'text-negative text-weight-bold'
                    : 'text-positive text-weight-medium'
                "
              >
                {{ props.row.availableHeadroom }}h
              </span>
              <q-tooltip class="bg-dark text-body2">
                Available buffer: {{ props.row.availableHeadroom }}h ({{ props.row.weeklyCapacity }}h capacity − {{ props.row.scheduledEffort }}h scheduled)
              </q-tooltip>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Printable Report Component -->
    <PrintReportLayout
      ref="printReportRef"
      title="Resource Workload &amp; Utilization Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 22%">Team Member</th>
            <th style="width: 14%">Role</th>
            <th style="width: 10%; text-align: center">Active Tasks</th>
            <th style="width: 11%; text-align: right">Scheduled Effort</th>
            <th style="width: 11%; text-align: right">Actual Logged</th>
            <th style="width: 11%; text-align: right">Weekly Capacity</th>
            <th style="width: 10%; text-align: right">Headroom</th>
            <th style="width: 11%; text-align: center">Utilization</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.resourceId">
            <td>
              <strong>{{ r.name }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.resourceId }}</div>
            </td>
            <td>{{ r.role }}</td>
            <td style="text-align: center">{{ r.assignedTasksCount }}</td>
            <td style="text-align: right">{{ r.scheduledEffort }}h</td>
            <td style="text-align: right">{{ r.loggedHours }}h</td>
            <td style="text-align: right">{{ r.weeklyCapacity }}h</td>
            <td style="text-align: right">
              <span
                :style="{ color: r.availableHeadroom < 0 ? '#dc2626' : '#059669', fontWeight: 600 }"
              >
                {{ r.availableHeadroom }}h
              </span>
            </td>
            <td style="text-align: center; font-weight: 600">
              {{ r.workloadPercent }}%
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="8" style="text-align: center; padding: 16px; color: #6b7280">
              No resource records match the selected filter criteria.
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
import type { ResourceUser, ResourceWorkload, Task, Project } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from '@/components/reports/PrintReportLayout.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import {
  computeResourceWorkloadReport,
  type ResourceWorkloadReportRow,
} from '@/components/reports/reportCalculations';

const props = defineProps<{
  resources: ResourceUser[];
  workloadsMap: Record<number, ResourceWorkload | null>;
  tasks: Task[];
  projects: Project[];
}>();

const selectedResourceId = ref<number | 'ALL'>('ALL');
const selectedProjectId = ref<number | 'ALL'>('ALL');
const selectedBand = ref<string>('ALL');

const bandOptions = [
  { label: 'All Utilization Bands', value: 'ALL' },
  { label: 'Optimal (50% – 85%)', value: 'Optimal' },
  { label: 'Overloaded (>85%)', value: 'Overloaded' },
  { label: 'Underutilized (<50%)', value: 'Underutilized' },
];

const initialPagination = {
  sortBy: 'workloadPercent',
  descending: true,
  page: 1,
  rowsPerPage: 10,
};

const reportData = computed(() =>
  computeResourceWorkloadReport(
    props.resources,
    props.workloadsMap,
    props.tasks,
    selectedProjectId.value,
  ),
);

const resourceOptions = computed(() => [
  { label: 'All Resources', value: 'ALL' },
  ...props.resources.map((r) => ({ label: r.name, value: r.user_id })),
]);

const projectOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...props.projects.map((p) => ({ label: p.name, value: p.project_id })),
]);

const hasActiveFilters = computed(() => {
  return (
    selectedResourceId.value !== 'ALL' ||
    selectedProjectId.value !== 'ALL' ||
    selectedBand.value !== 'ALL'
  );
});

const filteredRows = computed<ResourceWorkloadReportRow[]>(() => {
  return reportData.value.rows.filter((row) => {
    if (
      selectedResourceId.value !== 'ALL' &&
      Number(row.resourceId) !== Number(selectedResourceId.value)
    ) {
      return false;
    }
    if (selectedProjectId.value !== 'ALL') {
      if (row.assignedTasksCount === 0 && row.scheduledEffort === 0 && row.loggedHours === 0) {
        return false;
      }
    }
    if (selectedBand.value !== 'ALL') {
      if (selectedBand.value === 'Optimal' && row.status !== 'Optimal' && row.status !== 'Normal') {
        return false;
      }
      if (selectedBand.value === 'Overloaded' && row.status !== 'Overloaded') {
        return false;
      }
      if (selectedBand.value === 'Underutilized' && row.status !== 'Underutilized') {
        return false;
      }
    }
    return true;
  });
});

const filteredCapacity = computed(() =>
  filteredRows.value.reduce((acc, r) => acc + r.weeklyCapacity, 0),
);
const filteredScheduled = computed(() =>
  Math.round(filteredRows.value.reduce((acc, r) => acc + r.scheduledEffort, 0) * 10) / 10,
);
const filteredLogged = computed(() =>
  Math.round(filteredRows.value.reduce((acc, r) => acc + r.loggedHours, 0) * 10) / 10,
);
const filteredHeadroom = computed(() =>
  Math.round(filteredRows.value.reduce((acc, r) => acc + r.availableHeadroom, 0) * 10) / 10,
);
const filteredOverloadedCount = computed(
  () => filteredRows.value.filter((r) => r.status === 'Overloaded').length,
);
const filteredOptimalCount = computed(
  () => filteredRows.value.filter((r) => r.status === 'Optimal' || r.status === 'Normal').length,
);
const filteredUnderutilizedCount = computed(
  () => filteredRows.value.filter((r) => r.status === 'Underutilized').length,
);
const filteredAvgUtilization = computed(() => {
  if (filteredRows.value.length === 0) return 0;
  const total = filteredRows.value.reduce((acc, r) => acc + r.workloadPercent, 0);
  return Math.round(total / filteredRows.value.length);
});

function resetFilters() {
  selectedResourceId.value = 'ALL';
  selectedProjectId.value = 'ALL';
  selectedBand.value = 'ALL';
}

const selectedResourceName = computed(() => {
  if (selectedResourceId.value === 'ALL') return 'All Resources';
  const found = props.resources.find((r) => r.user_id === selectedResourceId.value);
  return found ? found.name : `Resource #${selectedResourceId.value}`;
});

const selectedProjectName = computed(() => {
  if (selectedProjectId.value === 'ALL') return 'All Projects';
  const found = props.projects.find((p) => p.project_id === selectedProjectId.value);
  return found ? found.name : `Project #${selectedProjectId.value}`;
});

const selectedBandLabel = computed(() => {
  const match = bandOptions.find((b) => b.value === selectedBand.value);
  return match ? match.label : selectedBand.value;
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Resource Target', value: selectedResourceName.value },
  { label: 'Project Scope', value: selectedProjectName.value },
  { label: 'Utilization Band', value: selectedBandLabel.value },
  { label: 'Active Team Count', value: `${filteredRows.value.length} members` },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Total Team Capacity',
    value: `${filteredCapacity.value}h/wk`,
    color: 'primary',
    helper: `Across ${filteredRows.value.length} team members`,
  },
  {
    label: 'Scheduled Effort',
    value: `${filteredScheduled.value}h`,
    color: 'info',
    helper: 'Committed active task workload',
  },
  {
    label: 'Actual Effort Logged',
    value: `${filteredLogged.value}h`,
    color: 'teal',
    helper: 'Accumulated tracked time',
  },
  {
    label: 'Available Headroom',
    value: `${filteredHeadroom.value}h`,
    color: 'positive',
    helper: 'Buffer for new task dispatch',
  },
  {
    label: 'Avg Utilization',
    value: `${filteredAvgUtilization.value}%`,
    color: 'primary',
    helper: `${filteredOptimalCount.value} Optimal · ${filteredUnderutilizedCount.value} Underutilized`,
  },
  {
    label: 'Overloaded Members',
    value: filteredOverloadedCount.value,
    color: 'negative',
    helper: '>85% capacity threshold breached',
  },
]);

const printNotes = [
  'Team capacity threshold is established at 85%. Allocations exceeding 85% are classified as Overloaded.',
  'Available headroom reflects uncommitted weekly capacity hours (Weekly Capacity - Scheduled Effort).',
  'Underutilized resources maintain allocations below 50% of nominal weekly capacity (Optimal: 50%–85%).',
  'Actual logged effort aggregates recorded work across active project assignments.',
];

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Team Member', field: 'name', align: 'left', sortable: true },
  {
    name: 'assignedTasksCount',
    label: 'Active Tasks',
    field: 'assignedTasksCount',
    align: 'center',
    sortable: true,
  },
  {
    name: 'workloadPercent',
    label: 'Workload & Allocation',
    field: 'workloadPercent',
    align: 'left',
    sortable: true,
  },
  {
    name: 'loggedHours',
    label: 'Actual Effort',
    field: 'loggedHours',
    align: 'right',
    sortable: true,
  },
  {
    name: 'availableHeadroom',
    label: 'Headroom (Buffer)',
    field: 'availableHeadroom',
    align: 'right',
    sortable: true,
  },
];
</script>

