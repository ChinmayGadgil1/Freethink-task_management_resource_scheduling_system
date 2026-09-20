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
            v-model="selectedCategory"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="categoryOptions"
            label="Utilization Band"
            style="min-width: 200px"
            :dark="$q.dark.isActive"
          />

          <q-btn
            v-if="selectedResourceId !== 'ALL' || selectedCategory !== 'ALL'"
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

      <!-- Summary KPI Cards -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">AVG TEAM UTILIZATION</div>
              <div class="text-h4 text-weight-bold text-primary q-mt-xs">
                {{ reportData.averageUtilization }}%
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Portfolio resource load</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">OPTIMAL (50% – 85%)</div>
              <div class="text-h4 text-weight-bold text-positive q-mt-xs">
                {{ reportData.optimalCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Healthy sustainable productivity</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">OVERLOADED (>85%)</div>
              <div
                class="text-h4 text-weight-bold q-mt-xs"
                :class="reportData.overloadedCount > 0 ? 'text-negative' : 'text-positive'"
              >
                {{ reportData.overloadedCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">At risk of burnout / bottleneck</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card" :dark="$q.dark.isActive" flat bordered>
            <q-card-section class="q-pa-md">
              <div class="text-caption text-weight-medium text-grey-6">UNDERUTILIZED (&lt;50%)</div>
              <div class="text-h4 text-weight-bold text-grey-7 q-mt-xs">
                {{ reportData.underutilizedCount }}
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Available for upcoming dispatch</div>
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

          <!-- Utilization Progress & % -->
          <template #body-cell-utilizationPercent="props">
            <q-td :props="props" style="min-width: 140px">
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-weight-bold">{{ props.row.utilizationPercent }}%</span>
                <span class="text-grey-5"
                  >{{ props.row.scheduledHours }}h / {{ props.row.weeklyCapacity }}h</span
                >
              </div>
              <q-linear-progress
                rounded
                size="8px"
                :value="props.row.utilizationPercent / 100"
                :color="
                  props.row.category === 'Overloaded'
                    ? 'negative'
                    : props.row.category === 'Underutilized'
                      ? 'grey-6'
                      : 'positive'
                "
              />
            </q-td>
          </template>

          <!-- Category -->
          <template #body-cell-category="props">
            <q-td :props="props" align="center">
              <q-badge
                rounded
                :color="
                  props.row.category === 'Overloaded'
                    ? 'negative'
                    : props.row.category === 'Underutilized'
                      ? 'grey-7'
                      : 'positive'
                "
                class="q-px-sm q-py-xs text-weight-bold"
              >
                {{ props.row.category }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Print-only Report Document -->
    <PrintReportLayout
      title="Resource Utilization Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 25%">Team Member</th>
            <th style="width: 15%">Role</th>
            <th style="width: 12%; text-align: right">Weekly Capacity</th>
            <th style="width: 12%; text-align: right">Scheduled Hours</th>
            <th style="width: 12%; text-align: right">Logged Hours</th>
            <th style="width: 12%; text-align: center">Utilization %</th>
            <th style="width: 12%; text-align: center">Band Category</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.resourceId">
            <td>
              <strong>{{ r.name }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.resourceId }}</div>
            </td>
            <td>{{ r.role }}</td>
            <td style="text-align: right">{{ r.weeklyCapacity }} hrs</td>
            <td style="text-align: right">{{ r.scheduledHours }} hrs</td>
            <td style="text-align: right">{{ r.loggedHours }} hrs</td>
            <td style="text-align: center">
              <strong>{{ r.utilizationPercent }}%</strong>
              <div class="print-progress-bar">
                <div
                  class="print-progress-fill"
                  :style="{ width: `${Math.min(100, r.utilizationPercent)}%` }"
                ></div>
              </div>
            </td>
            <td style="text-align: center">
              <span
                class="print-badge"
                :class="
                  r.category === 'Overloaded'
                    ? 'badge-negative'
                    : r.category === 'Underutilized'
                      ? ''
                      : 'badge-positive'
                "
              >
                {{ r.category }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" style="text-align: center; padding: 16px; color: #6b7280">
              No resource utilization records found matching the selected filter criteria.
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
import type { ResourceUser, ResourceWorkload, Task } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from '@/components/reports/PrintReportLayout.vue';
import {
  computeResourceUtilizationReport,
  type ResourceUtilizationReportRow,
} from '@/components/reports/reportCalculations';

const props = defineProps<{
  resources: ResourceUser[];
  tasks: Task[];
  workloadsMap: Record<number, ResourceWorkload | null>;
}>();

const selectedResourceId = ref<number | 'ALL'>('ALL');
const selectedCategory = ref<string>('ALL');

const initialPagination = {
  sortBy: 'utilizationPercent',
  descending: true,
  page: 1,
  rowsPerPage: 10,
};

const reportData = computed(() =>
  computeResourceUtilizationReport(props.resources, props.tasks, props.workloadsMap),
);

const resourceOptions = computed(() => [
  { label: 'All Resources', value: 'ALL' },
  ...props.resources.map((r) => ({ label: r.name, value: r.user_id })),
]);

const categoryOptions = [
  { label: 'All Utilization Bands', value: 'ALL' },
  { label: 'Optimal (50% – 85%)', value: 'Optimal' },
  { label: 'Overloaded (> 85%)', value: 'Overloaded' },
  { label: 'Underutilized (< 50%)', value: 'Underutilized' },
];

const filteredRows = computed<ResourceUtilizationReportRow[]>(() => {
  return reportData.value.rows.filter((row) => {
    if (selectedResourceId.value !== 'ALL' && row.resourceId !== selectedResourceId.value) {
      return false;
    }
    if (selectedCategory.value !== 'ALL' && row.category !== selectedCategory.value) {
      return false;
    }
    return true;
  });
});

function resetFilters() {
  selectedResourceId.value = 'ALL';
  selectedCategory.value = 'ALL';
}

const selectedResourceName = computed(() => {
  if (selectedResourceId.value === 'ALL') return 'All Resources';
  const found = props.resources.find((r) => r.user_id === selectedResourceId.value);
  return found ? found.name : `Resource #${selectedResourceId.value}`;
});

const selectedCategoryLabel = computed(() => {
  const found = categoryOptions.find((c) => c.value === selectedCategory.value);
  return found ? found.label : selectedCategory.value;
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Resource Target', value: selectedResourceName.value },
  { label: 'Utilization Band', value: selectedCategoryLabel.value },
  {
    label: 'Team Evaluated',
    value: `${filteredRows.value.length} of ${reportData.value.rows.length} members`,
  },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  {
    label: 'Avg Team Utilization',
    value: `${reportData.value.averageUtilization}%`,
    color: 'primary',
    helper: 'Across active resource pool',
  },
  {
    label: 'Optimal Load (50-85%)',
    value: reportData.value.optimalCount,
    color: 'positive',
    helper: 'Healthy sustainable productivity',
  },
  {
    label: 'Overloaded (>85%)',
    value: reportData.value.overloadedCount,
    color: 'negative',
    helper: 'Burnout & bottleneck risk',
  },
  {
    label: 'Underutilized (<50%)',
    value: reportData.value.underutilizedCount,
    color: 'warning',
    helper: 'Surplus capacity available',
  },
]);

const printNotes = [
  'Resource utilization metrics are synchronized with the Analytics calculation model (Optimal: 50%–85%, Overloaded: >85%, Underutilized: <50%).',
  'Logged Hours represents accumulated actual effort registered through work logs.',
  'Scheduled Hours represents committed allocations for active assigned tasks.',
];

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Team Member', field: 'name', align: 'left', sortable: true },
  {
    name: 'utilizationPercent',
    label: 'Utilization & Commitment',
    field: 'utilizationPercent',
    align: 'left',
    sortable: true,
  },
  {
    name: 'loggedHours',
    label: 'Actual Effort Logged',
    field: 'loggedHours',
    align: 'right',
    sortable: true,
  },
  {
    name: 'weeklyCapacity',
    label: 'Weekly Capacity',
    field: 'weeklyCapacity',
    align: 'right',
    sortable: true,
  },
  { name: 'category', label: 'Band', field: 'category', align: 'center', sortable: true },
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
