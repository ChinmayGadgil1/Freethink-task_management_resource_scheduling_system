<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg work-logs-page">
    <div class="q-mx-auto column q-gutter-y-lg" style="max-width: 1400px">
      <!-- 1. PAGE HEADER & DATE NAVIGATION -->
      <div class="row items-center justify-between wrap gap-md">
        <div>
          <div class="page-title text-h5 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
            Daily Work Logs
          </div>
          <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Record and review your daily task effort and progress at the end of the working day.
          </div>
        </div>

        <!-- Date Selector & Navigation Controls -->
        <div class="row items-center gap-xs">
          <q-btn
            round
            flat
            dense
            icon="chevron_left"
            class="date-nav-btn"
            title="Previous Day"
            @click="changeDate(-1)"
          />

          <q-btn
            outline
            no-caps
            class="current-date-btn q-px-md text-weight-bold"
            :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-white text-dark'"
          >
            <q-icon name="event" size="18px" class="q-mr-xs text-primary" />
            <span>{{ formattedDateDisplay }}</span>
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="selectedDate"
                mask="YYYY-MM-DD"
                @update:model-value="loadDailyAllocations"
              />
            </q-popup-proxy>
          </q-btn>

          <q-btn
            round
            flat
            dense
            icon="chevron_right"
            class="date-nav-btn"
            title="Next Day"
            @click="changeDate(1)"
          />

          <q-btn
            dense
            outline
            no-caps
            label="Today"
            color="primary"
            class="q-px-sm q-ml-xs text-weight-medium"
            @click="goToToday"
          />

          <q-btn
            flat
            round
            dense
            icon="refresh"
            class="q-ml-sm"
            :loading="loading"
            @click="loadDailyAllocations"
          >
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- 2. SUMMARY STRIP FOR SELECTED DAY -->
      <div class="row q-col-gutter-md">
        <!-- Card 1: Total Allocated Today -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="summary-card" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'">
            <div class="row items-center justify-between">
              <span class="text-caption text-weight-bold text-grey-6">Scheduled Hours</span>
              <div class="summary-icon-wrap bg-purple-soft text-primary">
                <q-icon name="event_upcoming" size="20px" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs text-primary">
              {{ formatHours(totalScheduledHours) }}h
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">Planned work capacity</div>
          </q-card>
        </div>

        <!-- Card 2: Total Logged Today -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="summary-card" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'">
            <div class="row items-center justify-between">
              <span class="text-caption text-weight-bold text-grey-6">Logged Today</span>
              <div class="summary-icon-wrap bg-blue-soft text-info">
                <q-icon name="history_edu" size="20px" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs text-info">
              {{ formatHours(totalLoggedHours) }}h
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">
              {{ totalScheduledHours > 0 ? `${Math.round((totalLoggedHours / totalScheduledHours) * 100)}% of scheduled effort` : 'Recorded work effort' }}
            </div>
          </q-card>
        </div>

        <!-- Card 3: Tasks Allocated -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="summary-card" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'">
            <div class="row items-center justify-between">
              <span class="text-caption text-weight-bold text-grey-6">Tasks Assigned</span>
              <div class="summary-icon-wrap bg-green-soft text-positive">
                <q-icon name="assignment" size="20px" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs text-positive">
              {{ allocations.length }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">Active deliverables for today</div>
          </q-card>
        </div>

        <!-- Card 4: Tasks Completed Today -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="summary-card" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'">
            <div class="row items-center justify-between">
              <span class="text-caption text-weight-bold text-grey-6">Work Log Count</span>
              <div class="summary-icon-wrap bg-amber-soft text-warning">
                <q-icon name="fact_check" size="20px" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs text-warning">
              {{ totalLogsCount }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">Entries submitted for this day</div>
          </q-card>
        </div>
      </div>

      <!-- 3. LOADING STATE -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="44px" />
      </div>

      <!-- 4. ERROR BANNER -->
      <q-banner v-else-if="error" class="bg-negative text-white rounded-borders q-mb-md">
        {{ error }}
        <template #action>
          <q-btn flat no-caps label="Retry" @click="loadDailyAllocations" />
        </template>
      </q-banner>

      <!-- 5. ALLOCATED TASKS LIST FOR SELECTED DAY -->
      <template v-else>
        <!-- Empty State -->
        <q-card
          v-if="allocations.length === 0"
          flat
          bordered
          class="empty-state-card text-center q-pa-xl"
          :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
        >
          <q-avatar size="64px" color="grey-2" text-color="grey-6" icon="event_available" class="q-mb-md" />
          <div class="text-h6 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
            No Task Allocations For This Day
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs" style="max-width: 480px; margin: 0 auto;">
            There are no tasks scheduled or assigned to you on <b>{{ formattedDateDisplay }}</b>. Use the arrow buttons above to check adjacent days or your schedule.
          </div>
          <div class="row justify-center q-mt-md gap-sm">
            <q-btn
              outline
              no-caps
              icon="calendar_month"
              label="View Full Schedule"
              color="primary"
              @click="router.push('/app/resource-dashboard/schedule')"
            />
            <q-btn
              unelevated
              no-caps
              label="Go to Today"
              color="primary"
              @click="goToToday"
            />
          </div>
        </q-card>

        <!-- Tasks Container -->
        <div v-else class="column q-gutter-y-md">
          <q-card
            v-for="item in allocations"
            :key="item.task_id"
            flat
            bordered
            class="task-allocation-card overflow-hidden"
            :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
          >
            <div class="q-pa-md">
              <div class="row items-start justify-between wrap gap-md">
                <!-- Task Info -->
                <div class="col-12 col-md-7">
                  <div class="row items-center gap-xs q-mb-xs">
                    <q-chip
                      dense
                      square
                      size="sm"
                      :class="`prio-badge-${item.priority.toLowerCase()}`"
                      class="text-weight-bold"
                    >
                      {{ item.priority }}
                    </q-chip>
                    <q-chip
                      dense
                      square
                      size="sm"
                      :class="['status-chip', getTaskStatusClass(item.status)]"
                      class="text-weight-bold"
                    >
                      {{ formatStatusLabel(item.status) }}
                    </q-chip>
                    <span class="text-caption text-grey-6">
                      {{ item.project_name || `Project #${item.project_id}` }}
                    </span>
                  </div>

                  <div
                    class="task-title text-subtitle1 text-weight-bold cursor-pointer"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    @click="router.push(`/app/resource-dashboard/task-details/${item.task_id}`)"
                  >
                    {{ item.title }}
                  </div>

                  <div v-if="item.description" class="task-desc text-caption text-grey-6 q-mt-xs ellipsis-2-lines">
                    {{ item.description }}
                  </div>

                  <!-- Metrics bar -->
                  <div class="row items-center gap-md q-mt-sm text-caption text-grey-7">
                    <div class="row items-center gap-xs">
                      <q-icon name="schedule" size="15px" color="primary" />
                      <span><b>Scheduled:</b> {{ formatHours(item.scheduled_hours) }}h</span>
                    </div>
                    <div class="row items-center gap-xs">
                      <q-icon name="timer" size="15px" color="info" />
                      <span><b>Logged Today:</b> {{ formatHours(item.hours_logged_today) }}h</span>
                    </div>
                    <div class="row items-center gap-xs">
                      <q-icon name="donut_large" size="15px" color="positive" />
                      <span><b>Total Progress:</b> {{ Number(item.progress) || 0 }}%</span>
                    </div>
                    <div v-if="item.deadline" class="row items-center gap-xs">
                      <q-icon name="event" size="15px" color="negative" />
                      <span><b>Deadline:</b> {{ formatDate(item.deadline) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Progress Bar & Actions -->
                <div class="col-12 col-md-4 column items-end justify-between q-gutter-y-sm">
                  <!-- Progress Visual -->
                  <div class="full-width">
                    <div class="row items-center justify-between text-caption q-mb-xs">
                      <span class="text-weight-bold text-grey-7">Progress</span>
                      <span class="text-weight-bold text-primary">{{ Number(item.progress) || 0 }}%</span>
                    </div>
                    <q-linear-progress
                      :value="(Number(item.progress) || 0) / 100"
                      color="primary"
                      rounded
                      size="8px"
                    />
                  </div>

                  <!-- Action Buttons -->
                  <div class="row items-center gap-xs q-mt-sm">
                    <q-btn
                      outline
                      no-caps
                      dense
                      size="sm"
                      icon="visibility"
                      label="Details"
                      color="grey-7"
                      class="q-px-sm"
                      @click="router.push(`/app/resource-dashboard/task-details/${item.task_id}`)"
                    />
                    <q-btn
                      unelevated
                      no-caps
                      icon="add_task"
                      label="Add Work Log"
                      color="primary"
                      class="text-weight-bold q-px-md"
                      @click="openWorkLogDialog(item)"
                    />
                  </div>
                </div>
              </div>

              <!-- Existing Work Logs Submitted on this Date -->
              <div v-if="item.logs_today && item.logs_today.length > 0" class="q-mt-md q-pt-sm border-top-subtle">
                <div class="text-caption text-weight-bold text-grey-6 q-mb-xs row items-center gap-xs">
                  <q-icon name="history" size="14px" />
                  <span>Work Recorded Today ({{ item.logs_today.length }})</span>
                </div>
                <div class="column q-gutter-y-xs">
                  <div
                    v-for="log in item.logs_today"
                    :key="log.log_id"
                    class="existing-log-row row items-center justify-between q-pa-xs rounded-borders text-caption"
                    :class="$q.dark.isActive ? 'bg-grey-10 text-grey-3' : 'bg-grey-1 text-grey-9'"
                  >
                    <div class="row items-center gap-sm">
                      <q-badge color="primary" text-color="white" :label="`${formatHours(log.hours_logged)}h`" />
                      <span class="text-weight-medium">{{ log.notes }}</span>
                      <span v-if="log.blockers" class="text-negative text-caption">
                        (Blocker: {{ log.blockers }})
                      </span>
                    </div>
                    <div class="text-caption text-grey-5">
                      Progress: {{ log.progress_logged }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </template>
    </div>

    <!-- ADD WORK LOG MODAL -->
    <WorkLogDialog
      v-model="showWorkLogDialog"
      :task="selectedTask"
      :default-date="selectedDate"
      :saving="savingLog"
      @save="handleSaveWorkLog"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  getDailyAllocationsApi,
  createWorkLogApi,
  type DailyAllocationTask,
  type CreateWorkLogPayload,
} from '@/services/api';
import { getTaskStatusClass, formatStatusLabel } from '@/utils/taskHelpers';
import WorkLogDialog from '@/components/tasks/WorkLogDialog.vue';

const $q = useQuasar();
const router = useRouter();

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const selectedDate = ref<string>(formatLocalDate(new Date()));
const allocations = ref<DailyAllocationTask[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

const showWorkLogDialog = ref<boolean>(false);
const selectedTask = ref<DailyAllocationTask | null>(null);
const savingLog = ref<boolean>(false);

const formattedDateDisplay = computed(() => {
  if (!selectedDate.value) return '';
  const [yearStr, monthStr, dayStr] = selectedDate.value.split('-');
  if (!yearStr || !monthStr || !dayStr) return selectedDate.value;
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
});

const totalScheduledHours = computed(() => {
  return allocations.value.reduce((sum, item) => sum + Number(item.scheduled_hours || 0), 0);
});

const totalLoggedHours = computed(() => {
  return allocations.value.reduce((sum, item) => sum + Number(item.hours_logged_today || 0), 0);
});

const totalLogsCount = computed(() => {
  return allocations.value.reduce((sum, item) => sum + (item.logs_today ? item.logs_today.length : 0), 0);
});

function formatHours(val: any): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0';
  return parseFloat(Number(val).toFixed(2)).toString();
}

function changeDate(deltaDays: number) {
  const [yearStr, monthStr, dayStr] = selectedDate.value.split('-');
  const d = new Date(parseInt(yearStr!, 10), parseInt(monthStr!, 10) - 1, parseInt(dayStr!, 10));
  d.setDate(d.getDate() + deltaDays);
  selectedDate.value = formatLocalDate(d);
  void loadDailyAllocations();
}

function goToToday() {
  selectedDate.value = formatLocalDate(new Date());
  void loadDailyAllocations();
}

async function loadDailyAllocations() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getDailyAllocationsApi(selectedDate.value);
    allocations.value = res.allocations || [];
  } catch (err: any) {
    console.error('Failed to load daily allocations:', err);
    error.value = err.message || 'Failed to load daily work allocations';
  } finally {
    loading.value = false;
  }
}

function openWorkLogDialog(task: DailyAllocationTask) {
  selectedTask.value = task;
  showWorkLogDialog.value = true;
}

async function handleSaveWorkLog(payload: CreateWorkLogPayload) {
  if (!selectedTask.value) return;

  savingLog.value = true;
  try {
    await createWorkLogApi(selectedTask.value.task_id, payload);
    $q.notify({
      type: 'positive',
      message: 'Work log recorded successfully!',
      position: 'top',
    });
    showWorkLogDialog.value = false;
    // Reload daily allocations to update logged effort & progress
    await loadDailyAllocations();
  } catch (err: any) {
    console.error('Error saving work log:', err);
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to record work log',
      position: 'top',
    });
  } finally {
    savingLog.value = false;
  }
}

onMounted(() => {
  void loadDailyAllocations();
});
</script>

<style scoped>
.work-logs-page {
  min-height: 100vh;
}

.date-nav-btn {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.summary-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.summary-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-purple-soft {
  background: rgba(124, 58, 237, 0.12);
}

.bg-blue-soft {
  background: rgba(14, 165, 233, 0.12);
}

.bg-green-soft {
  background: rgba(16, 185, 129, 0.12);
}

.bg-amber-soft {
  background: rgba(245, 158, 11, 0.12);
}

.task-allocation-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
}

.task-allocation-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.border-top-subtle {
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.prio-badge-critical {
  background: #fee2e2;
  color: #b91c1c;
}
.prio-badge-high {
  background: #ffedd5;
  color: #c2410c;
}
.prio-badge-medium {
  background: #fef3c7;
  color: #b45309;
}
.prio-badge-low {
  background: #f1f5f9;
  color: #475569;
}
</style>
