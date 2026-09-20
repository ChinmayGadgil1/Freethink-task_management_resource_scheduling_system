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
            v-model="selectedCategory"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="categoryOptions"
            label="Variance Category"
            style="min-width: 180px"
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
          Showing {{ filteredRows.length }} tasks with deadline variance
        </div>
      </div>

      <!-- Summary KPI Cards using reusable StatCard component -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Evaluated"
            :value="filteredTotalCount"
            :subtitle="
              hasActiveFilters
                ? `Across ${filteredRows.length} filtered task(s) (${reportData.rows.length} total)`
                : 'Tasks with target deadlines'
            "
            icon="fact_check"
            color="purple"
            note-class="note-purple"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Ahead of Schedule"
            :value="filteredAheadCount"
            subtitle="Delivered / projected before deadline"
            icon="trending_up"
            color="green"
            note-class="note-green"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="On Time"
            :value="filteredOnTimeCount"
            subtitle="Aligned exactly on target deadline"
            icon="check_circle"
            color="blue"
            note-class="note-blue"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Delayed"
            :value="filteredDelayedCount"
            subtitle="Exceeds target deadline"
            icon="warning_amber"
            color="red"
            note-class="note-red"
            :negative="filteredDelayedCount > 0"
            :clickable="false"
          />
        </div>
      </div>

      <!-- Informational Note -->
      <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
        <q-icon name="info" size="16px" class="q-mr-xs text-primary" />
        <strong>Variance calculation:</strong> Completed tasks:
        <code>actual_end - deadline</code> &bull; Active tasks: <code>planned_end - deadline</code>.
        Negative values indicate completion/projection ahead of deadline; positive values indicate
        delay.
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
          no-data-label="No deadline variance data available"
        >
          <!-- Task & Project -->
          <template #body-cell-title="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.title }}</div>
              <div class="text-caption text-grey-5">
                {{ props.row.projectName }} (#{{ props.row.taskId }})
              </div>
            </q-td>
          </template>

          <!-- Status -->
          <template #body-cell-status="props">
            <q-td :props="props" align="center">
              <q-badge
                :color="props.row.status === 'COMPLETED' ? 'positive' : 'primary'"
                outline
                class="text-weight-medium"
              >
                {{ formatStatus(props.row.status) }}
              </q-badge>
            </q-td>
          </template>

          <!-- Target Deadline -->
          <template #body-cell-deadline="props">
            <q-td :props="props" align="center">
              {{ props.row.deadline }}
            </q-td>
          </template>

          <!-- Planned End -->
          <template #body-cell-plannedEnd="props">
            <q-td :props="props" align="center">
              {{ props.row.plannedEnd }}
            </q-td>
          </template>

          <!-- Actual End -->
          <template #body-cell-actualEnd="props">
            <q-td :props="props" align="center">
              {{ props.row.actualEnd }}
            </q-td>
          </template>

          <!-- Variance Days with clear indicator and tooltip -->
          <template #body-cell-varianceDays="props">
            <q-td :props="props" align="right">
              <span
                class="text-weight-bold cursor-pointer"
                :class="
                  props.row.varianceDays < 0
                    ? 'text-positive'
                    : props.row.varianceDays > 0
                      ? 'text-negative'
                      : 'text-info'
                "
              >
                {{
                  props.row.varianceDays > 0
                    ? `+${props.row.varianceDays}d`
                    : `${props.row.varianceDays}d`
                }}
              </span>
              <q-tooltip class="bg-dark text-body2">
                <template v-if="props.row.varianceDays < 0">
                  {{ Math.abs(props.row.varianceDays) }} days ahead of target deadline ({{
                    props.row.deadline
                  }})
                </template>
                <template v-else-if="props.row.varianceDays > 0">
                  Delayed by {{ props.row.varianceDays }} days past target deadline ({{
                    props.row.deadline
                  }})
                </template>
                <template v-else>
                  Delivered / projected exactly on target deadline ({{ props.row.deadline }})
                </template>
              </q-tooltip>
            </q-td>
          </template>

          <!-- Category Badge -->
          <template #body-cell-category="props">
            <q-td :props="props" align="center">
              <q-badge
                :color="
                  props.row.category === 'Ahead'
                    ? 'positive'
                    : props.row.category === 'Delayed'
                      ? 'negative'
                      : 'info'
                "
                class="text-weight-bold q-px-sm q-py-xs"
                :label="props.row.category"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Print-only Report Document -->
    <PrintReportLayout
      title="Deadline Variance Report"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 25%">Task Title</th>
            <th style="width: 15%">Project</th>
            <th style="width: 10%">Status</th>
            <th style="width: 12%; text-align: center">Target Deadline</th>
            <th style="width: 12%; text-align: center">Planned End</th>
            <th style="width: 12%; text-align: center">Actual End</th>
            <th style="width: 8%; text-align: right">Variance</th>
            <th style="width: 8%; text-align: center">Category</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.taskId">
            <td>
              <strong>{{ r.title }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.taskId }}</div>
            </td>
            <td>{{ r.projectName }}</td>
            <td>{{ r.status }}</td>
            <td style="text-align: center">{{ r.deadline }}</td>
            <td style="text-align: center">{{ r.plannedEnd }}</td>
            <td style="text-align: center">{{ r.actualEnd }}</td>
            <td style="text-align: right">
              <span
                :style="{
                  fontWeight: 700,
                  color:
                    r.varianceDays < 0 ? '#059669' : r.varianceDays > 0 ? '#dc2626' : '#2563eb',
                }"
              >
                {{ r.varianceDays > 0 ? `+${r.varianceDays}d` : `${r.varianceDays}d` }}
              </span>
            </td>
            <td style="text-align: center">
              <span
                class="print-badge"
                :class="
                  r.category === 'Ahead'
                    ? 'badge-positive'
                    : r.category === 'Delayed'
                      ? 'badge-negative'
                      : 'badge-info'
                "
              >
                {{ r.category }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="8" style="text-align: center; padding: 16px; color: #6b7280">
              No tasks match the selected deadline variance criteria.
            </td>
          </tr>
        </tbody>
      </table>
    </PrintReportLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QTableColumn } from 'quasar';
import type { Task, Project, ResourceUser } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from './PrintReportLayout.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import {
  computeDeadlineVarianceReport,
  type DeadlineVarianceReportRow,
} from './reportCalculations';

const props = defineProps<{
  tasks: Task[];
  projects: Project[];
  resources: ResourceUser[];
}>();

// Filter states
const selectedProjectId = ref<number | null>(null);
const selectedResourceId = ref<number | null>(null);
const selectedCategory = ref<string>('ALL');

const categoryOptions = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'Ahead', value: 'Ahead' },
  { label: 'On Time', value: 'On Time' },
  { label: 'Delayed', value: 'Delayed' },
];

const projectOptions = computed(() => [
  { label: 'All Projects', value: null },
  ...props.projects.map((p) => ({ label: p.name, value: p.project_id })),
]);

const resourceOptions = computed(() => [
  { label: 'All Resources', value: null },
  ...props.resources.map((r) => ({ label: r.name, value: r.user_id })),
]);

const hasActiveFilters = computed(() => {
  return (
    selectedProjectId.value !== null ||
    selectedResourceId.value !== null ||
    selectedCategory.value !== 'ALL'
  );
});

function resetFilters() {
  selectedProjectId.value = null;
  selectedResourceId.value = null;
  selectedCategory.value = 'ALL';
}

function formatStatus(status?: string | null): string {
  if (!status) return '';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const reportData = computed(() => {
  return computeDeadlineVarianceReport(props.tasks, props.projects);
});

const filteredRows = computed(() => {
  let list = reportData.value.rows;

  if (selectedProjectId.value !== null) {
    const pId = Number(selectedProjectId.value);
    list = list.filter((r) => Number(r.projectId) === pId);
  }

  if (selectedResourceId.value !== null) {
    const resId = Number(selectedResourceId.value);
    list = list.filter((r) => {
      const task = props.tasks.find((t) => t.task_id === r.taskId);
      if (!task) return false;
      return (
        task.assigned_resource_ids?.some((id) => Number(id) === resId) ||
        task.assigned_resources?.some((ar: { user_id: number }) => Number(ar.user_id) === resId) ||
        (task.assigned_resource_names &&
          selectedResourceName.value &&
          task.assigned_resource_names.includes(selectedResourceName.value))
      );
    });
  }

  if (selectedCategory.value !== 'ALL') {
    list = list.filter((r) => r.category === selectedCategory.value);
  }

  return list;
});

const filteredTotalCount = computed(() => filteredRows.value.length);
const filteredAheadCount = computed(
  () => filteredRows.value.filter((r) => r.category === 'Ahead').length,
);
const filteredOnTimeCount = computed(
  () => filteredRows.value.filter((r) => r.category === 'On Time').length,
);
const filteredDelayedCount = computed(
  () => filteredRows.value.filter((r) => r.category === 'Delayed').length,
);

const selectedProjectName = computed(() => {
  if (selectedProjectId.value === null) return 'All Projects';
  const p = props.projects.find((pr) => pr.project_id === selectedProjectId.value);
  return p ? p.name : 'Unknown Project';
});

const selectedResourceName = computed(() => {
  if (selectedResourceId.value === null) return 'All Resources';
  const r = props.resources.find((res) => res.user_id === selectedResourceId.value);
  return r ? r.name : 'Unknown Resource';
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project', value: selectedProjectName.value },
  { label: 'Resource', value: selectedResourceName.value },
  {
    label: 'Category',
    value: selectedCategory.value === 'ALL' ? 'All Categories' : selectedCategory.value,
  },
  {
    label: 'Calculation Basis',
    value: 'Completed: actual_end - deadline | Active: planned_end - deadline',
  },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => [
  { label: 'Ahead of Deadline', value: filteredAheadCount.value, color: '#059669' },
  { label: 'On Time', value: filteredOnTimeCount.value, color: '#2563eb' },
  { label: 'Delayed', value: filteredDelayedCount.value, color: '#dc2626' },
  { label: 'Total Assessed Tasks', value: filteredTotalCount.value },
]);

const printNotes = [
  'Variance calculation methodology: Completed tasks compare actual_end against target deadline. In-progress or pending tasks compare planned_end against target deadline.',
  'Negative variance values indicate completion or projection ahead of schedule (-d). Positive variance values indicate delayed completion or projected slippage (+d).',
  'Tasks without specified deadlines or planned dates are excluded from variance calculations.',
];

const initialPagination = {
  sortBy: 'varianceDays',
  descending: true,
  page: 1,
  rowsPerPage: 15,
};

const columns: QTableColumn<DeadlineVarianceReportRow>[] = [
  {
    name: 'title',
    required: true,
    label: 'Task',
    align: 'left',
    field: 'title',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center',
    field: 'status',
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Target Deadline',
    align: 'center',
    field: 'deadline',
    sortable: true,
  },
  {
    name: 'plannedEnd',
    label: 'Planned End',
    align: 'center',
    field: 'plannedEnd',
    sortable: true,
  },
  {
    name: 'actualEnd',
    label: 'Actual End',
    align: 'center',
    field: 'actualEnd',
    sortable: true,
  },
  {
    name: 'varianceDays',
    label: 'Variance (Days)',
    align: 'right',
    field: 'varianceDays',
    sortable: true,
  },
  {
    name: 'category',
    label: 'Category',
    align: 'center',
    field: 'category',
    sortable: true,
  },
];
</script>

<style scoped>
.gap-sm {
  gap: 8px;
}
</style>
