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
            style="min-width: 200px"
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
            style="min-width: 200px"
            :dark="$q.dark.isActive"
          />

          <q-toggle
            v-model="overloadOnly"
            label="Overloaded (>85%) Only"
            color="negative"
            dense
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
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">TOTAL CAPACITY</div>
              <div class="text-h4 text-weight-bold text-primary q-mt-xs">
                {{ reportData.totalCapacity }}h
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Standard weekly team availability</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">SCHEDULED EFFORT</div>
              <div class="text-h4 text-weight-bold text-teal q-mt-xs">
                {{ reportData.totalScheduled }}h
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Committed to active tasks</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">AVAILABLE HEADROOM</div>
              <div class="text-h4 text-weight-bold text-positive q-mt-xs">
                {{ reportData.totalHeadroom }}h
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Unallocated resource headroom</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">OVERLOADED RESOURCES</div>
              <div
                class="text-h4 text-weight-bold q-mt-xs"
                :class="reportData.overloadedCount > 0 ? 'text-negative' : 'text-positive'"
              >
                {{ reportData.overloadedCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">>85% threshold breached</div>
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
            <q-td :props="props" style="min-width: 140px">
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
                  props.row.workloadPercent > 85
                    ? 'negative'
                    : props.row.workloadPercent < 50
                      ? 'grey-6'
                      : 'positive'
                "
              />
            </q-td>
          </template>

          <!-- Status -->
          <template #body-cell-status="props">
            <q-td :props="props" align="center">
              <q-badge
                rounded
                :color="
                  props.row.status === 'Overloaded'
                    ? 'negative'
                    : props.row.status === 'Underutilized'
                      ? 'grey-7'
                      : 'positive'
                "
                class="q-px-sm q-py-xs text-weight-bold"
              >
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Print-only Report Document -->
    <PrintReportLayout
      title="Resource Workload Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 25%">Team Member</th>
            <th style="width: 15%">Role</th>
            <th style="width: 12%; text-align: center">Active Tasks</th>
            <th style="width: 12%; text-align: right">Scheduled Effort</th>
            <th style="width: 12%; text-align: right">Weekly Capacity</th>
            <th style="width: 12%; text-align: right">Available Headroom</th>
            <th style="width: 12%; text-align: center">Status</th>
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
            <td style="text-align: right">{{ r.scheduledEffort }} hrs</td>
            <td style="text-align: right">{{ r.weeklyCapacity }} hrs</td>
            <td style="text-align: right">
              <span
                :style="{ color: r.availableHeadroom < 0 ? '#dc2626' : '#059669', fontWeight: 600 }"
              >
                {{ r.availableHeadroom }} hrs
              </span>
            </td>
            <td style="text-align: center">
              <span
                class="print-badge"
                :class="
                  r.status === 'Overloaded'
                    ? 'badge-negative'
                    : r.status === 'Underutilized'
                      ? ''
                      : 'badge-positive'
                "
              >
                {{ r.status }} ({{ r.workloadPercent }}%)
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" style="text-align: center; padding: 16px; color: #6b7280">
              No resource workload records match the selected filter criteria.
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
const overloadOnly = ref<boolean>(false);

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
    selectedResourceId.value !== 'ALL' || selectedProjectId.value !== 'ALL' || overloadOnly.value
  );
});

const filteredRows = computed<ResourceWorkloadReportRow[]>(() => {
  return reportData.value.rows.filter((row) => {
    if (selectedResourceId.value !== 'ALL' && row.resourceId !== selectedResourceId.value) {
      return false;
    }
    if (overloadOnly.value && row.status !== 'Overloaded') {
      return false;
    }
    return true;
  });
});

function resetFilters() {
  selectedResourceId.value = 'ALL';
  selectedProjectId.value = 'ALL';
  overloadOnly.value = false;
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

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Resource Target', value: selectedResourceName.value },
  { label: 'Project Scope', value: selectedProjectName.value },
  {
    label: 'Overload Filter',
    value: overloadOnly.value ? 'Overloaded (>85%) Only' : 'All Workload Bands',
  },
  { label: 'Active Team Count', value: `${filteredRows.value.length} members` },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Total Team Capacity',
    value: `${reportData.value.totalCapacity}h/wk`,
    color: 'primary',
    helper: `Across ${props.resources.length} team members`,
  },
  {
    label: 'Scheduled Effort',
    value: `${reportData.value.totalScheduled}h`,
    color: 'info',
    helper: 'Total assigned workload',
  },
  {
    label: 'Available Headroom',
    value: `${reportData.value.totalHeadroom}h`,
    color: 'positive',
    helper: 'Buffer for new task dispatch',
  },
  {
    label: 'Overloaded Members',
    value: reportData.value.overloadedCount,
    color: 'negative',
    helper: '>85% capacity threshold breached',
  },
]);

const printNotes = [
  'Team capacity threshold is established at 85%. Allocations exceeding 85% are classified as Overloaded.',
  'Available headroom reflects uncommitted weekly capacity hours (Weekly Capacity - Scheduled Effort).',
  'Underutilized resources maintain allocations below 50% of nominal weekly capacity.',
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
    label: 'Workload & Capacity',
    field: 'workloadPercent',
    align: 'left',
    sortable: true,
  },
  {
    name: 'availableHeadroom',
    label: 'Headroom (Buffer)',
    field: 'availableHeadroom',
    align: 'right',
    sortable: true,
  },
  { name: 'status', label: 'Load Status', field: 'status', align: 'center', sortable: true },
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
