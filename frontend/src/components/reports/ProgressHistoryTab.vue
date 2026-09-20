<template>
  <div>
    <!-- Interactive Screen View -->
    <div class="screen-only q-gutter-y-md">
      <!-- Informational Banner -->
      <q-banner
        rounded
        :class="$q.dark.isActive ? 'bg-indigo-10 text-white' : 'bg-blue-1 text-dark border-blue'"
      >
        <template #avatar>
          <q-icon name="info" :color="$q.dark.isActive ? 'blue-2' : 'primary'" size="32px" />
        </template>
        <div
          class="text-subtitle1 text-weight-bold"
          :class="$q.dark.isActive ? 'text-white' : 'text-primary'"
        >
          Progress Submission History
        </div>
        <div
          class="text-body2 q-mt-xs"
          :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
        >
          This report shows timestamped progress submissions recorded through work logs submitted by
          assigned resources. Direct PM progress edits are not historically tracked.
        </div>
      </q-banner>

      <!-- Local Filter Bar -->
      <div class="row items-center justify-between wrap gap-sm q-py-sm">
        <div class="row items-center gap-sm">
          <q-select
            v-model="selectedProjectName"
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
            v-model="selectedAuthor"
            outlined
            dense
            options-dense
            emit-value
            map-options
            :options="authorOptions"
            label="Filter by Author / Resource"
            style="min-width: 220px"
            :dark="$q.dark.isActive"
          />

          <q-input
            v-model="startDateFilter"
            outlined
            dense
            type="date"
            label="Submitted From"
            style="min-width: 150px"
            :dark="$q.dark.isActive"
          />

          <q-input
            v-model="endDateFilter"
            outlined
            dense
            type="date"
            label="Submitted To"
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
          Showing {{ filteredLogs.length }} progress submission(s)
        </div>
      </div>

      <!-- Data Table -->
      <q-card flat bordered :dark="$q.dark.isActive">
        <q-table
          flat
          :rows="filteredLogs"
          :columns="columns"
          row-key="log_id"
          :pagination="initialPagination"
          :dark="$q.dark.isActive"
          no-data-label="No progress submissions found matching the criteria"
        >
          <!-- Date -->
          <template #body-cell-log_date="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ formatDate(props.row.log_date || props.row.created_at) }}
              </div>
              <div class="text-caption text-grey-5">{{ formatTime(props.row.created_at) }}</div>
            </q-td>
          </template>

          <!-- Author -->
          <template #body-cell-author_name="props">
            <q-td :props="props">
              <div class="row items-center gap-xs">
                <q-avatar size="24px" color="primary" text-color="white">
                  {{ props.row.author_name ? props.row.author_name.charAt(0).toUpperCase() : 'U' }}
                </q-avatar>
                <span class="text-weight-medium q-ml-xs">
                  {{ props.row.author_name || `User #${props.row.user_id}` }}
                </span>
              </div>
            </q-td>
          </template>

          <!-- Task & Project -->
          <template #body-cell-task_title="props">
            <q-td :props="props">
              <div class="text-weight-bold">
                {{ props.row.task_title || `Task #${props.row.task_id}` }}
              </div>
              <div class="text-caption text-grey-5">{{ props.row.project_name || '—' }}</div>
            </q-td>
          </template>

          <!-- Progress Logged -->
          <template #body-cell-progress_logged="props">
            <q-td :props="props">
              <div class="row items-center gap-xs">
                <q-linear-progress
                  :value="(props.row.progress_logged || 0) / 100"
                  color="primary"
                  rounded
                  style="width: 60px; height: 6px"
                />
                <span class="text-weight-bold q-ml-xs">{{ props.row.progress_logged }}%</span>
              </div>
            </q-td>
          </template>

          <!-- Hours Logged -->
          <template #body-cell-hours_logged="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.hours_logged }} hrs</span>
            </q-td>
          </template>

          <!-- Notes -->
          <template #body-cell-notes="props">
            <q-td :props="props" style="max-width: 250px">
              <div class="ellipsis-2-lines text-caption">
                {{ props.row.notes || '—' }}
              </div>
            </q-td>
          </template>

          <!-- Blockers -->
          <template #body-cell-blockers="props">
            <q-td :props="props" style="max-width: 200px">
              <q-badge
                v-if="props.row.blockers && props.row.blockers.trim()"
                color="negative"
                outline
                class="ellipsis"
              >
                {{ props.row.blockers }}
              </q-badge>
              <span v-else class="text-caption text-grey-5">None</span>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Standalone Professional Print Document -->
    <PrintReportLayout
      title="Progress Submission History Report"
      subtitle="Chronological Log of Resource Progress Updates & Timesheet Submissions"
      :filters="printFilters"
      :summary-metrics="printMetrics"
      :notes="printNotes"
    >
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: 12%; text-align: center">Date / Time</th>
            <th style="width: 15%">Contributor</th>
            <th style="width: 22%">Task & Project</th>
            <th style="width: 10%; text-align: center">Progress</th>
            <th style="width: 10%; text-align: right">Hours</th>
            <th style="width: 21%">Submission Notes</th>
            <th style="width: 10%; text-align: center">Blockers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in filteredLogs" :key="l.log_id">
            <td style="text-align: center">
              <div>{{ formatDate(l.log_date || l.created_at) }}</div>
              <div style="font-size: 9px; color: #6b7280">{{ formatTime(l.created_at) }}</div>
            </td>
            <td>
              <strong>{{ l.author_name || `User #${l.user_id}` }}</strong>
            </td>
            <td>
              <strong>{{ l.task_title || `Task #${l.task_id}` }}</strong>
              <div style="font-size: 9px; color: #6b7280">{{ l.project_name || '—' }}</div>
            </td>
            <td style="text-align: center">
              <span class="text-weight-bold">{{ l.progress_logged }}%</span>
            </td>
            <td style="text-align: right">{{ l.hours_logged }} hrs</td>
            <td style="font-size: 10px; color: #374151">{{ l.notes || '—' }}</td>
            <td style="text-align: center">
              <span v-if="l.blockers && l.blockers.trim()" class="print-badge badge-negative">
                {{ l.blockers }}
              </span>
              <span v-else style="color: #9ca3af">—</span>
            </td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="7" style="text-align: center; padding: 16px; color: #6b7280">
              No progress submissions found matching the selected criteria.
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
import type { ProgressFeedLog, Project, ResourceUser } from '@/services/api';
import PrintReportLayout, {
  type ReportFilterMeta,
  type SummaryMetricMeta,
} from './PrintReportLayout.vue';

const props = defineProps<{
  feedLogs: ProgressFeedLog[];
  projects: Project[];
  resources: ResourceUser[];
}>();

const selectedProjectName = ref<string | null>(null);
const selectedAuthor = ref<string | null>(null);
const startDateFilter = ref<string>('');
const endDateFilter = ref<string>('');

const projectOptions = computed(() => [
  { label: 'All Projects', value: null },
  ...props.projects.map((p) => ({ label: p.name, value: p.name })),
]);

const authorOptions = computed(() => {
  const authorsSet = new Set<string>();
  props.feedLogs.forEach((l) => {
    if (l.author_name) authorsSet.add(l.author_name);
  });
  props.resources.forEach((r) => {
    if (r.name) authorsSet.add(r.name);
  });

  return [
    { label: 'All Authors', value: null },
    ...Array.from(authorsSet)
      .sort()
      .map((name) => ({ label: name, value: name })),
  ];
});

const hasActiveFilters = computed(() => {
  return (
    selectedProjectName.value !== null ||
    selectedAuthor.value !== null ||
    startDateFilter.value !== '' ||
    endDateFilter.value !== ''
  );
});

function resetFilters() {
  selectedProjectName.value = null;
  selectedAuthor.value = null;
  startDateFilter.value = '';
  endDateFilter.value = '';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return dateStr.split('T')[0]!;
  } catch {
    return dateStr;
  }
}

function formatTime(dateTimeStr?: string): string {
  if (!dateTimeStr || !dateTimeStr.includes('T')) return '';
  try {
    const timePart = dateTimeStr.split('T')[1];
    return timePart ? timePart.substring(0, 5) : '';
  } catch {
    return '';
  }
}

const filteredLogs = computed(() => {
  let list = props.feedLogs;

  if (selectedProjectName.value !== null) {
    list = list.filter((l) => l.project_name === selectedProjectName.value);
  }

  if (selectedAuthor.value !== null) {
    list = list.filter((l) => l.author_name === selectedAuthor.value);
  }

  if (startDateFilter.value) {
    const startMs = new Date(startDateFilter.value).getTime();
    list = list.filter((l) => {
      const dateStr = l.log_date || l.created_at;
      if (!dateStr) return false;
      return new Date(dateStr.split('T')[0]!).getTime() >= startMs;
    });
  }

  if (endDateFilter.value) {
    const endMs = new Date(endDateFilter.value).getTime();
    list = list.filter((l) => {
      const dateStr = l.log_date || l.created_at;
      if (!dateStr) return false;
      return new Date(dateStr.split('T')[0]!).getTime() <= endMs;
    });
  }

  return list;
});

const printFilters = computed<ReportFilterMeta[]>(() => [
  { label: 'Project', value: selectedProjectName.value || 'All Projects' },
  { label: 'Resource / Author', value: selectedAuthor.value || 'All Authors' },
  {
    label: 'Date Range',
    value:
      startDateFilter.value || endDateFilter.value
        ? `${startDateFilter.value || 'Earliest'} to ${endDateFilter.value || 'Present'}`
        : 'All Recorded Dates',
  },
  { label: 'Data Source', value: 'Verified Resource Work Log Submissions' },
]);

const printMetrics = computed<SummaryMetricMeta[]>(() => {
  const totalSubmissions = filteredLogs.value.length;
  const totalHours = filteredLogs.value.reduce((acc, l) => acc + Number(l.hours_logged || 0), 0);
  const activeContributors = new Set(filteredLogs.value.map((l) => l.author_name).filter(Boolean))
    .size;
  const reportedBlockers = filteredLogs.value.filter((l) => l.blockers && l.blockers.trim()).length;

  return [
    { label: 'Total Submissions', value: totalSubmissions },
    { label: 'Total Hours Logged', value: `${totalHours.toFixed(1)} hrs`, color: '#2563eb' },
    { label: 'Active Contributors', value: activeContributors, color: '#059669' },
    {
      label: 'Reported Blockers',
      value: reportedBlockers,
      color: reportedBlockers > 0 ? '#dc2626' : undefined,
    },
  ];
});

const printNotes = [
  'This report documents timestamped progress updates recorded directly via resource work log submissions.',
  'Manual project manager progress overrides and direct CPM schedule changes are not historically tracked.',
  'All recorded hours represent actual logged labor hours entered by assigned team members.',
];

const initialPagination = {
  sortBy: 'log_id',
  descending: true,
  page: 1,
  rowsPerPage: 15,
};

const columns: QTableColumn<ProgressFeedLog>[] = [
  {
    name: 'log_date',
    required: true,
    label: 'Date',
    align: 'left',
    field: (row) => row.log_date || row.created_at,
    sortable: true,
  },
  {
    name: 'author_name',
    label: 'Author',
    align: 'left',
    field: (row) => row.author_name || `User #${row.user_id}`,
    sortable: true,
  },
  {
    name: 'task_title',
    label: 'Task & Project',
    align: 'left',
    field: (row) => row.task_title || '',
    sortable: true,
  },
  {
    name: 'progress_logged',
    label: 'Progress %',
    align: 'left',
    field: 'progress_logged',
    sortable: true,
  },
  {
    name: 'hours_logged',
    label: 'Hours Logged',
    align: 'right',
    field: 'hours_logged',
    sortable: true,
  },
  {
    name: 'notes',
    label: 'Notes',
    align: 'left',
    field: 'notes',
  },
  {
    name: 'blockers',
    label: 'Blockers',
    align: 'left',
    field: 'blockers',
  },
];
</script>

<style scoped>
.gap-sm {
  gap: 8px;
}
.gap-xs {
  gap: 4px;
}
.border-blue {
  border: 1px solid #bbdefb;
}
</style>
