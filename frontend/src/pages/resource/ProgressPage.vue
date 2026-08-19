<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Progress</div>
        <div class="text-body2 text-grey-6 q-mt-xs">Analytics on your task progress, effort and deadlines.</div>
      </div>
      <q-btn flat no-caps dense icon="refresh" label="Refresh" color="grey-7" @click="loadTasks" />
    </div>

    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
        <q-skeleton
          type="rect"
          height="96px"
          animation="fade"
        />
      </div>
    </div>

    <q-banner v-else-if="error" class="bg-negative text-white q-mb-lg" rounded>
      {{ error }}
      <template #action>
        <q-btn flat no-caps label="Retry" @click="loadTasks" />
      </template>
    </q-banner>

    <template v-else>
      <!-- A. PROGRESS SUMMARY -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center q-gutter-x-xs text-grey-6">
                <q-icon name="insights" size="16px" /><span class="text-caption">Overall Progress</span>
              </div>
              <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ overallProgress }}%</div>
              <q-linear-progress :value="overallProgress / 100" color="primary" rounded size="8px" class="q-mt-sm" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center q-gutter-x-xs text-grey-6">
                <q-icon name="check_circle" size="16px" /><span class="text-caption">Completed</span>
              </div>
              <div class="text-h4 text-weight-bold text-positive q-mt-xs">{{ completedTasks }}</div>
              <div class="text-caption text-grey-6">of {{ tasks.length }} tasks</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center q-gutter-x-xs text-grey-6">
                <q-icon name="autorenew" size="16px" /><span class="text-caption">Active Tasks</span>
              </div>
              <div class="text-h4 text-weight-bold q-mt-xs">{{ activeTasks }}</div>
              <div class="text-caption text-grey-6">not yet completed</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center q-gutter-x-xs text-grey-6">
                <q-icon name="hourglass_empty" size="16px" /><span class="text-caption">Remaining Effort</span>
              </div>
              <div class="text-h4 text-weight-bold q-mt-xs">{{ remainingEffort }}h</div>
              <div class="text-caption" :class="delayedTasks ? 'text-negative' : 'text-positive'">
                {{ delayedTasks }} delayed
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- B. STATUS DISTRIBUTION + C. EFFORT ANALYSIS -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-5">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Status Distribution</div>
              <div class="text-caption text-grey-6">Current breakdown of your assigned tasks.</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="segmented-bar q-mb-md">
                <div
                  v-for="seg in statusDistribution"
                  :key="seg.label"
                  class="segment"
                  :style="{ width: `${(seg.value / (tasks.length || 1)) * 100}%`, background: seg.color }"
                />
              </div>
              <q-list separator>
                <q-item v-for="seg in statusDistribution" :key="seg.label" dense>
                  <q-item-section avatar style="min-width: 20px">
                    <span class="dot" :style="{ background: seg.color }" />
                  </q-item-section>
                  <q-item-section>{{ seg.label }}</q-item-section>
                  <q-item-section side>
                    <span class="text-weight-bold">{{ seg.value }}</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-7">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Effort Analysis</div>
              <div class="text-caption text-grey-6">Actual effort compared with expected effort.</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-4">
                  <q-card flat class="bg-grey-2 metric-card">
                    <q-card-section>
                      <div class="text-caption text-grey-6">Expected</div>
                      <div class="text-h5 text-weight-bold">{{ expectedEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-4">
                  <q-card flat class="bg-grey-2 metric-card">
                    <q-card-section>
                      <div class="text-caption text-grey-6">Actual</div>
                      <div class="text-h5 text-weight-bold">{{ actualEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-4">
                  <q-card flat class="bg-grey-2 metric-card">
                    <q-card-section>
                      <div class="text-caption text-grey-6">Remaining</div>
                      <div class="text-h5 text-weight-bold">{{ remainingEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-12">
                  <div class="row justify-between q-mb-xs">
                    <span class="text-caption text-grey-7">Effort consumed</span>
                    <span class="text-caption text-weight-medium">{{ effortPercentage }}%</span>
                  </div>
                  <q-linear-progress :value="effortPercentage / 100" color="primary" rounded size="10px" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- F. DEADLINE PERFORMANCE -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">Deadline Performance</div>
          <div class="text-caption text-grey-6">Derived from current task deadlines only.</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="d in deadlinePerformance" :key="d.label" class="col-6 col-sm-3">
              <div class="row items-center q-gutter-x-xs">
                <q-icon :name="d.icon" :color="d.color" size="18px" />
                <span class="text-caption text-grey-7">{{ d.label }}</span>
              </div>
              <div class="text-h6 text-weight-bold q-mt-xs">{{ d.value }}</div>
            </div>
          </div>
          <div class="text-caption text-grey-5 q-mt-md">
            "Completed on time" isn't shown — the backend doesn't record a task's actual completion date, only its current status.
          </div>
        </q-card-section>
      </q-card>

      <!-- D. PROJECT PROGRESS -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold">Project Progress</div>
            <div class="text-caption text-grey-6">Your tasks grouped by project.</div>
          </div>
          <q-badge color="primary" :label="`${projectProgress.length} projects`" />
        </q-card-section>
        <q-separator />
        <q-list v-if="projectProgress.length" separator>
          <q-item v-for="p in projectProgress" :key="p.project" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ p.project }}</q-item-label>
              <q-item-label caption>
                {{ p.completed }}/{{ p.tasks }} completed · {{ p.active }} active
              </q-item-label>
            </q-item-section>
            <q-item-section class="col-3 gt-sm">
              <div class="row items-center no-wrap">
                <q-linear-progress :value="p.progress / 100" color="primary" rounded class="col" />
                <span class="text-caption text-weight-medium q-ml-sm">{{ p.progress }}%</span>
              </div>
            </q-item-section>
            <q-item-section side class="gt-xs">
              <div class="text-caption text-grey-6">
                {{ p.expectedEffort }}h est · {{ p.actualEffort }}h logged
              </div>
              <div class="text-caption text-grey-6">{{ p.remainingEffort }}h remaining</div>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="empty-block">
          <q-icon name="folder_off" size="28px" color="grey-5" />
          <div class="text-caption text-grey-6 q-mt-sm">No projects to show yet.</div>
        </div>
      </q-card>

      <!-- I. WORK INSIGHTS -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">Work Insights</div>
          <div class="text-caption text-grey-6">Computed directly from your current tasks.</div>
        </q-card-section>
        <q-separator />
        <q-list v-if="insights.length" separator>
          <q-item v-for="(insight, i) in insights" :key="i" dense>
            <q-item-section avatar style="min-width: 28px">
              <q-icon name="fiber_manual_record" size="8px" color="primary" />
            </q-item-section>
            <q-item-section>{{ insight }}</q-item-section>
          </q-item>
        </q-list>
        <div v-else class="empty-block">
          <q-icon name="task_alt" size="28px" color="grey-5" />
          <div class="text-caption text-grey-6 q-mt-sm">Nothing to flag right now.</div>
        </div>
      </q-card>

      <!-- E. TASK PROGRESS ANALYSIS -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-bold">Task Progress</div>
            <div class="text-caption text-grey-6">Every assigned task, with effort and deadline detail.</div>
          </div>
          <q-badge color="primary" :label="`${tasks.length} tasks`" />
        </q-card-section>
        <q-separator />
        <q-table
          v-if="tasks.length"
          flat
          :rows="taskRows"
          :columns="columns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-badge :color="priorityColor(props.row.priority)" :label="props.row.priority" />
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)" :label="statusLabel(props.row.status)" />
            </q-td>
          </template>
          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-linear-progress :value="props.row.progress / 100" color="primary" rounded class="col" style="min-width: 60px" />
                <span class="text-caption q-ml-sm">{{ props.row.progress }}%</span>
              </div>
            </q-td>
          </template>
          <template #body-cell-deadline="props">
            <q-td :props="props" :class="{ 'text-negative text-weight-medium': props.row.overdue }">
              {{ props.row.deadlineLabel }}
            </q-td>
          </template>
        </q-table>
        <div v-else class="empty-block">
          <q-icon name="task_alt" size="32px" color="grey-5" />
          <div class="text-body2 text-grey-6 q-mt-sm">No tasks assigned to you.</div>
        </div>
      </q-card>

      <q-banner class="bg-grey-2 text-grey-8" rounded dense>
        <template #avatar><q-icon name="info" color="grey-7" /></template>
        Self-assigned tasks and progress history/work-log trends aren't shown because the current API doesn't return
        whether a task was self-created (no <code>created_by</code> / <code>is_self_assigned</code> field) or any
        dated progress-update history. Once the backend exposes those, this page can surface them without further
        redesign.
      </q-banner>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getTasksApi, getResourceWorkloadApi, type Task, type ResourceWorkload } from '@/services/api';

const router = useRouter();
const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);
const loading = ref(true);
const error = ref('');

function isOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || !task.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.deadline) < today;
}

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDate(date: string | null) {
  if (!date) return 'No deadline';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadTasks() {
  loading.value = true;
  error.value = '';
  try {
    const [fetchedTasks, fetchedWorkload] = await Promise.all([
      getTasksApi(),
      getResourceWorkloadApi().catch(() => null),
    ]);
    tasks.value = fetchedTasks;
    workloadData.value = fetchedWorkload;
  } catch (err) {
    console.error('Failed to load progress:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load your progress.';
  } finally {
    loading.value = false;
  }
}
onMounted(() => void loadTasks());

const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);
const activeTasks = computed(() => tasks.value.filter((t) => t.status !== 'COMPLETED').length);
const delayedTasks = computed(() => tasks.value.filter(isOverdue).length);

const overallProgress = computed(() => {
  if (!tasks.value.length) return 0;
  return Math.round(tasks.value.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / tasks.value.length);
});

// Effort totals come from the workload API (authoritative across all of the
// resource's tasks); fall back to summing the loaded task list if it failed.
const expectedEffort = computed(() => {
  if (workloadData.value) return Number(workloadData.value.total_expected_effort) || 0;
  return tasks.value.reduce((s, t) => s + (Number(t.expected_effort) || 0), 0);
});
const actualEffort = computed(() => {
  if (workloadData.value) return Number(workloadData.value.total_actual_effort) || 0;
  return tasks.value.reduce((s, t) => s + (Number(t.actual_effort) || 0), 0);
});
const remainingEffort = computed(() => Math.max(expectedEffort.value - actualEffort.value, 0));
const effortPercentage = computed(() =>
  expectedEffort.value ? Math.min(100, Math.round((actualEffort.value / expectedEffort.value) * 100)) : 0,
);

const statusDistribution = computed(() => [
  { label: 'Completed', value: tasks.value.filter((t) => t.status === 'COMPLETED').length, color: '#27AE60' },
  { label: 'In Progress', value: tasks.value.filter((t) => t.status === 'IN_PROGRESS').length, color: '#2E90FA' },
  { label: 'Pending', value: tasks.value.filter((t) => t.status === 'PENDING').length, color: '#98A2B3' },
  { label: 'On Hold', value: tasks.value.filter((t) => t.status === 'ON_HOLD').length, color: '#E89532' },
  { label: 'Overdue', value: delayedTasks.value, color: '#E15263' },
]);

const deadlinePerformance = computed(() => {
  const overdue = delayedTasks.value;
  const dueSoon = tasks.value.filter((t) => t.status !== 'COMPLETED' && t.deadline && !isOverdue(t) && daysUntil(t.deadline) <= 3).length;
  const upcoming = tasks.value.filter((t) => t.status !== 'COMPLETED' && t.deadline && !isOverdue(t) && daysUntil(t.deadline) > 3).length;
  const noDeadline = tasks.value.filter((t) => t.status !== 'COMPLETED' && !t.deadline).length;
  return [
    { label: 'Overdue', value: overdue, icon: 'error_outline', color: 'negative' },
    { label: 'Due Soon', value: dueSoon, icon: 'schedule', color: 'orange' },
    { label: 'Upcoming', value: upcoming, icon: 'event', color: 'primary' },
    { label: 'No Deadline', value: noDeadline, icon: 'help_outline', color: 'grey-6' },
  ];
});

const projectProgress = computed(() => {
  interface Acc { project: string; tasks: number; completed: number; active: number; progressSum: number; expectedEffort: number; actualEffort: number }
  const map = new Map<string, Acc>();
  for (const t of tasks.value) {
    const name = t.project_name || `Project #${t.project_id}`;
    if (!map.has(name)) map.set(name, { project: name, tasks: 0, completed: 0, active: 0, progressSum: 0, expectedEffort: 0, actualEffort: 0 });
    const item = map.get(name)!;
    item.tasks += 1;
    if (t.status === 'COMPLETED') item.completed += 1;
    else item.active += 1;
    item.progressSum += Number(t.progress) || 0;
    item.expectedEffort += Number(t.expected_effort) || 0;
    item.actualEffort += Number(t.actual_effort) || 0;
  }
  return Array.from(map.values()).map((p) => ({
    ...p,
    progress: Math.round(p.progressSum / (p.tasks || 1)),
    remainingEffort: Math.max(p.expectedEffort - p.actualEffort, 0),
  }));
});

const insights = computed(() => {
  const list: string[] = [];
  if (delayedTasks.value > 0) list.push(`${delayedTasks.value} task${delayedTasks.value > 1 ? 's are' : ' is'} overdue.`);
  if (remainingEffort.value > 0) list.push(`You have ${remainingEffort.value}h of remaining estimated effort.`);
  const inProgress = tasks.value.filter((t) => t.status === 'IN_PROGRESS').length;
  if (inProgress > 0) list.push(`${inProgress} task${inProgress > 1 ? 's are' : ' is'} currently in progress.`);
  const nearest = tasks.value
    .filter((t) => t.status !== 'COMPLETED' && t.deadline && !isOverdue(t) && daysUntil(t.deadline) <= 3)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
  if (nearest) list.push(`"${nearest.title}" is approaching its deadline.`);
  const overEffort = tasks.value.filter((t) => Number(t.actual_effort) > Number(t.expected_effort) && Number(t.expected_effort) > 0).length;
  if (overEffort > 0) list.push(`Actual effort has exceeded expected effort on ${overEffort} task${overEffort > 1 ? 's' : ''}.`);
  return list;
});

const columns = [
  { name: 'title', label: 'Task', field: 'title', align: 'left' as const, sortable: true },
  { name: 'project', label: 'Project', field: 'project', align: 'left' as const, sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'left' as const, sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const, sortable: true },
  { name: 'progress', label: 'Progress', field: 'progress', align: 'left' as const, sortable: true },
  { name: 'expected_effort', label: 'Expected', field: 'expected_effort', align: 'right' as const, sortable: true },
  { name: 'actual_effort', label: 'Actual', field: 'actual_effort', align: 'right' as const, sortable: true },
  { name: 'remaining_effort', label: 'Remaining', field: 'remaining_effort', align: 'right' as const, sortable: true },
  { name: 'deadline', label: 'Deadline', field: 'deadline', align: 'left' as const, sortable: true },
];

const taskRows = computed(() =>
  tasks.value.map((t) => ({
    task_id: t.task_id,
    title: t.title,
    project: t.project_name || `Project #${t.project_id}`,
    priority: t.priority,
    status: t.status,
    progress: Number(t.progress) || 0,
    expected_effort: `${Number(t.expected_effort) || 0}h`,
    actual_effort: `${Number(t.actual_effort) || 0}h`,
    remaining_effort: `${Math.max((Number(t.expected_effort) || 0) - (Number(t.actual_effort) || 0), 0)}h`,
    deadlineLabel: formatDate(t.deadline),
    overdue: isOverdue(t),
  })),
);

function openTask(id: number) {
  void router.push(`/app/resource-dashboard/task-details/${id}`);
}
function statusLabel(status: Task['status']) {
  return { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', ON_HOLD: 'On Hold' }[status];
}
function statusColor(status: Task['status']) {
  return { PENDING: 'grey-7', IN_PROGRESS: 'blue-7', COMPLETED: 'positive', ON_HOLD: 'orange-7' }[status];
}
function priorityColor(priority: Task['priority']) {
  return { LOW: 'positive', MEDIUM: 'orange', HIGH: 'deep-orange', CRITICAL: 'negative' }[priority];
}
</script>

<style scoped lang="scss">
.workspace-page {
  background: var(--wo-bg-page, #f8f9fa);
}
.empty-block {
  padding: 32px 16px;
  text-align: center;
}
.segmented-bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--wo-border-subtle, #f0f2f5);
}
.segment {
  height: 100%;
  &:not(:last-child) {
    border-right: 2px solid var(--wo-bg-card, #fff);
  }
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.metric-card {
  background: var(--wo-bg-page, #f8f9fa) !important;
}
</style>
