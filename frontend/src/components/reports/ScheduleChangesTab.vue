<template>
  <div>
    <!-- Interactive Screen View -->
    <div class="screen-only q-gutter-y-md">
      <!-- Transparent Audit Limitation Notice Banner -->
      <q-banner
        rounded
        :class="$q.dark.isActive ? 'bg-amber-10 text-white' : 'bg-amber-1 text-dark border-amber'"
      >
        <template #avatar>
          <q-icon
            name="history_toggle_off"
            :color="$q.dark.isActive ? 'amber-2' : 'amber-9'"
            size="32px"
          />
        </template>
        <div
          class="text-subtitle1 text-weight-bold"
          :class="$q.dark.isActive ? 'text-white' : 'text-amber-10'"
        >
          Historical Schedule Change Tracking Not Available
        </div>
        <div class="text-body2 q-mt-xs">
          The system currently maintains the latest planned start, planned end, and target deadlines
          calculated by the scheduling engine, but does not persist previous schedule versions or
          audit histories (such as previous start/end dates, modification timestamps, or editor
          credentials).
        </div>
        <div class="text-caption q-mt-xs" :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'">
          Schedule version delta tracking will become available once automated schedule audit
          logging is introduced into the backend. Below is the
          <strong>Current Schedule Baseline Snapshot</strong> reflecting all active and completed
          task schedules.
        </div>
      </q-banner>

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
            v-model="selectedScheduleHealth"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="scheduleHealthOptions"
            label="Schedule Status"
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
          Showing {{ filteredRows.length }} task schedule baselines
        </div>
      </div>

      <!-- Summary KPI Cards using reusable StatCard component -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Baselines"
            :value="filteredTotalCount"
            :subtitle="
              hasActiveFilters
                ? `Across ${filteredRows.length} filtered task(s) (${allRows.length} total)`
                : 'Tasks with schedule baselines'
            "
            icon="fact_check"
            color="purple"
            note-class="note-purple"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="On Schedule"
            :value="filteredOnScheduleCount"
            subtitle="Milestones meeting CPM targets"
            icon="check_circle"
            color="green"
            note-class="note-green"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="At Risk / Slipping"
            :value="filteredSlippingCount"
            subtitle="Critical path or deadline risk"
            icon="warning_amber"
            color="red"
            note-class="note-red"
            :negative="filteredSlippingCount > 0"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed Baselines"
            :value="filteredCompletedCount"
            subtitle="Successfully executed tasks"
            icon="task_alt"
            color="blue"
            note-class="note-blue"
            :clickable="false"
          />
        </div>
      </div>

      <!-- Current Schedule Baseline Table -->
      <q-card flat bordered :dark="$q.dark.isActive">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-subtitle1 text-weight-bold">Current Schedule Baseline Snapshot</div>
            <div class="text-caption text-grey-6">
              Live schedule parameters currently computed by the scheduling engine
            </div>
          </div>
          <q-badge color="primary" outline label="Live Baseline" />
        </q-card-section>

        <q-table
          flat
          :rows="filteredRows"
          :columns="columns"
          row-key="taskId"
          :pagination="initialPagination"
          :dark="$q.dark.isActive"
          no-data-label="No schedule baseline data available"
          class="q-mt-sm"
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

          <!-- Current Planned Start -->
          <template #body-cell-plannedStart="props">
            <q-td :props="props" align="center">
              <span>{{ props.row.plannedStart }}</span>
            </q-td>
          </template>

          <!-- Current Planned End -->
          <template #body-cell-plannedEnd="props">
            <q-td :props="props" align="center">
              <span>{{ props.row.plannedEnd }}</span>
            </q-td>
          </template>

          <!-- Target Deadline -->
          <template #body-cell-deadline="props">
            <q-td :props="props" align="center">
              <span>{{ props.row.deadline }}</span>
            </q-td>
          </template>

          <!-- Status -->
          <template #body-cell-status="props">
            <q-td :props="props" align="center">
              <q-badge
                :color="
                  props.row.status === 'COMPLETED'
                    ? 'positive'
                    : props.row.status === 'IN_PROGRESS'
                      ? 'primary'
                      : props.row.status === 'SCHEDULED'
                        ? 'indigo-7'
                        : 'grey-7'
                "
                outline
                class="text-weight-bold q-px-sm"
              >
                {{ formatStatus(props.row.status) }}
              </q-badge>
            </q-td>
          </template>

          <!-- Schedule Health -->
          <template #body-cell-scheduleHealth="props">
            <q-td :props="props" align="center">
              <q-badge
                :color="
                  props.row.scheduleHealth === 'Completed'
                    ? 'positive'
                    : props.row.scheduleHealth === 'Deadline Slipping'
                      ? 'negative'
                      : props.row.scheduleHealth === 'Schedule At Risk'
                        ? 'warning'
                        : 'info'
                "
                class="text-weight-bold q-px-sm q-py-xs cursor-pointer"
                :label="props.row.scheduleHealth"
              >
                <q-tooltip class="bg-dark text-body2">
                  {{ props.row.healthReason || props.row.scheduleHealth }}
                </q-tooltip>
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Professional Print Document -->
    <PrintReportLayout
      title="Schedule Changes & Baseline Report"
      subtitle="Current Schedule Baseline Snapshot & Audit Transparency Notice"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 25%">Task Title</th>
            <th style="width: 15%">Project</th>
            <th style="width: 12%; text-align: center">Planned Start</th>
            <th style="width: 12%; text-align: center">Planned End</th>
            <th style="width: 12%; text-align: center">Target Deadline</th>
            <th style="width: 10%; text-align: center">Status</th>
            <th style="width: 14%; text-align: center">Schedule Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRows" :key="r.taskId">
            <td>
              <strong>{{ r.title }}</strong>
              <div style="font-size: 9px; color: #6b7280">ID: #{{ r.taskId }}</div>
            </td>
            <td>{{ r.projectName }}</td>
            <td style="text-align: center">{{ r.plannedStart }}</td>
            <td style="text-align: center">{{ r.plannedEnd }}</td>
            <td style="text-align: center">{{ r.deadline }}</td>
            <td style="text-align: center">{{ formatStatus(r.status) }}</td>
            <td style="text-align: center">
              <span
                class="print-badge"
                :class="
                  r.scheduleHealth === 'Completed'
                    ? 'badge-positive'
                    : r.scheduleHealth === 'Deadline Slipping'
                      ? 'badge-negative'
                      : r.scheduleHealth === 'Schedule At Risk'
                        ? 'badge-warning'
                        : 'badge-info'
                "
              >
                {{ r.scheduleHealth }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" style="text-align: center; padding: 16px; color: #6b7280">
              No tasks match the selected schedule baseline criteria.
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
import { computeScheduleSnapshotReport, type ScheduleSnapshotRow } from './reportCalculations';

const props = defineProps<{
  tasks: Task[];
  projects: Project[];
  resources: ResourceUser[];
}>();

// Filter states
const selectedProjectId = ref<number | null>(null);
const selectedResourceId = ref<number | null>(null);
const selectedScheduleHealth = ref<string>('ALL');

const scheduleHealthOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'On Schedule', value: 'On Schedule' },
  { label: 'Deadline Slipping', value: 'Deadline Slipping' },
  { label: 'Schedule At Risk', value: 'Schedule At Risk' },
  { label: 'Completed', value: 'Completed' },
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
    selectedScheduleHealth.value !== 'ALL'
  );
});

function resetFilters() {
  selectedProjectId.value = null;
  selectedResourceId.value = null;
  selectedScheduleHealth.value = 'ALL';
}

function formatStatus(status?: string | null): string {
  if (!status) return '';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const allRows = computed(() => {
  return computeScheduleSnapshotReport(props.tasks, props.projects);
});

const filteredRows = computed(() => {
  let list = allRows.value;

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

  if (selectedScheduleHealth.value !== 'ALL') {
    list = list.filter((r) => r.scheduleHealth === selectedScheduleHealth.value);
  }

  return list;
});

// Reactive KPI metric counts
const filteredTotalCount = computed(() => filteredRows.value.length);
const filteredOnScheduleCount = computed(
  () => filteredRows.value.filter((r) => r.scheduleHealth === 'On Schedule').length,
);
const filteredSlippingCount = computed(
  () =>
    filteredRows.value.filter(
      (r) => r.scheduleHealth === 'Deadline Slipping' || r.scheduleHealth === 'Schedule At Risk',
    ).length,
);
const filteredCompletedCount = computed(
  () => filteredRows.value.filter((r) => r.scheduleHealth === 'Completed').length,
);

const selectedProjectName = computed(() => {
  if (selectedProjectId.value === null) return 'All Projects';
  const p = props.projects.find((pr) => pr.project_id === Number(selectedProjectId.value));
  return p ? p.name : 'Unknown Project';
});

const selectedResourceName = computed(() => {
  if (selectedResourceId.value === null) return 'All Resources';
  const r = props.resources.find((res) => res.user_id === Number(selectedResourceId.value));
  return r ? r.name : 'Unknown Resource';
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project', value: selectedProjectName.value },
  { label: 'Resource', value: selectedResourceName.value },
  {
    label: 'Schedule Health',
    value: selectedScheduleHealth.value === 'ALL' ? 'All Statuses' : selectedScheduleHealth.value,
  },
  { label: 'Audit Baseline Mode', value: 'Live Scheduling Engine Snapshot' },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => {
  const total = filteredTotalCount.value;
  const slipping = filteredSlippingCount.value;
  const completed = filteredCompletedCount.value;
  const onTrack = filteredOnScheduleCount.value;
  return [
    { label: 'Total Baselines', value: total },
    { label: 'On Schedule', value: onTrack, color: '#059669' },
    { label: 'Slipping / At Risk', value: slipping, color: slipping > 0 ? '#dc2626' : undefined },
    { label: 'Completed Baselines', value: completed, color: '#2563eb' },
  ];
});

const printNotes = [
  'Historical schedule change tracking is not currently available because previous schedule versions are not persisted.',
  'The database stores latest calculated schedule attributes (planned start, planned end, deadline) generated by the CPM engine.',
  'Automated version delta auditing will be supported in future backend updates once schema versioning is deployed.',
];

const initialPagination = {
  sortBy: 'taskId',
  descending: false,
  page: 1,
  rowsPerPage: 15,
};

const columns: QTableColumn<ScheduleSnapshotRow>[] = [
  {
    name: 'title',
    required: true,
    label: 'Task',
    align: 'left',
    field: 'title',
    sortable: true,
  },
  {
    name: 'plannedStart',
    label: 'Current Planned Start',
    align: 'center',
    field: 'plannedStart',
    sortable: true,
  },
  {
    name: 'plannedEnd',
    label: 'Current Planned End',
    align: 'center',
    field: 'plannedEnd',
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
    name: 'status',
    label: 'Status',
    align: 'center',
    field: 'status',
    sortable: true,
  },
  {
    name: 'scheduleHealth',
    label: 'Current Schedule Status',
    align: 'center',
    field: 'scheduleHealth',
    sortable: true,
  },
];
</script>

<style scoped>
.gap-sm {
  gap: 8px;
}
.border-amber {
  border: 1px solid #ffe082;
}
</style>
