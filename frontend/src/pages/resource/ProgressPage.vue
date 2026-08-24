<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <!-- PAGE HEADER -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center q-gutter-sm">
        <q-avatar size="42px" color="primary" text-color="white" icon="analytics" />

        <div>
          <div class="text-h5 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Progress</div>
          <div class="text-body2" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Track your work, effort, deadlines and task progress.
          </div>
        </div>
      </div>

      <q-btn
        outline
        no-caps
        dense
        icon="refresh"
        label="Refresh"
        :color="$q.dark.isActive ? 'grey-4' : 'primary'"
        :loading="loading"
        @click="loadTasks"
      />
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
        <q-skeleton type="rect" height="140px" animation="fade" class="rounded-borders" />
      </div>
    </div>

    <!-- ERROR -->
    <q-banner v-else-if="error" class="bg-negative text-white q-mb-lg" rounded>
      {{ error }}
      <template #action>
        <q-btn flat no-caps label="Retry" @click="loadTasks" />
      </template>
    </q-banner>

    <template v-else>
      <!-- PROGRESS SUMMARY CARDS -->
      <div class="row q-col-gutter-md q-mb-lg items-stretch">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Overall Progress"
            :value="`${overallProgress}%`"
            icon="insights"
            color="primary"
            :progress="overallProgress"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed"
            :value="completedTasks"
            :subtitle="`${completedTasks} of ${tasks.length} tasks completed`"
            icon="check_circle"
            color="positive"
            note-class="stat-green"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Active Tasks"
            :value="activeTasks"
            subtitle="Tasks currently in progress"
            icon="autorenew"
            color="info"
            note-class="stat-blue"
            :clickable="false"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Remaining Effort"
            :value="`${actualHoursRemaining}h`"
            :subtitle="`${delayedTasks} delayed`"
            icon="hourglass_empty"
            color="warning"
            :note-class="delayedTasks ? 'note-red' : 'note-green'"
            :negative="delayedTasks > 0"
            :clickable="false"
          />
        </div>
      </div>

      <!-- STATUS DISTRIBUTION + EFFORT ANALYSIS -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Status Distribution -->
        <div class="col-12 col-md-5">
          <q-card flat bordered :dark="$q.dark.isActive" class="full-height rounded-borders">
            <q-card-section>
              <div class="row items-center">
                <q-avatar size="36px" :color="$q.dark.isActive ? 'purple-10' : 'blue-1'" :text-color="$q.dark.isActive ? 'purple-2' : 'primary'" icon="donut_large" />
                <div class="q-ml-sm">
                  <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Status Distribution</div>
                  <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                    Current breakdown of your assigned tasks.
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <!-- Segmented Bar using Quasar flex row -->
              <div class="row no-wrap rounded-borders overflow-hidden q-mb-md" style="height: 12px; background: rgba(200, 200, 200, 0.2);">
                <div
                  v-for="seg in statusDistribution"
                  :key="seg.label"
                  :style="{
                    width: `${(seg.value / (tasks.length || 1)) * 100}%`,
                    background: seg.color,
                  }"
                />
              </div>

              <q-list separator :dark="$q.dark.isActive">
                <q-item v-for="seg in statusDistribution" :key="seg.label" dense class="q-py-xs">
                  <q-item-section avatar style="min-width: 24px;">
                    <q-badge rounded :style="{ background: seg.color, width: '8px', height: '8px' }" />
                  </q-item-section>

                  <q-item-section :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
                    {{ seg.label }}
                  </q-item-section>

                  <q-item-section side>
                    <q-chip
                      dense
                      square
                      :color="seg.label === 'Overdue' ? ($q.dark.isActive ? 'red-10' : 'red-1') : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
                      :text-color="seg.label === 'Overdue' ? ($q.dark.isActive ? 'red-2' : 'negative') : ($q.dark.isActive ? 'grey-4' : 'grey-8')"
                      class="text-caption text-weight-bold"
                    >
                      {{ seg.value }}
                    </q-chip>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- Effort Analysis -->
        <div class="col-12 col-md-7">
          <q-card flat bordered :dark="$q.dark.isActive" class="full-height rounded-borders">
            <q-card-section>
              <div class="row items-center">
                <q-avatar size="36px" :color="$q.dark.isActive ? 'orange-10' : 'orange-1'" :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'" icon="timer" />
                <div class="q-ml-sm">
                  <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Effort Analysis</div>
                  <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                    Compare planned effort, actual hours and remaining work.
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="row q-col-gutter-md">
                <!-- Expected -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered :dark="$q.dark.isActive" class="full-height">
                    <q-card-section class="q-pa-md">
                      <q-icon name="schedule" color="primary" size="22px" />
                      <div class="text-caption q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">Expected</div>
                      <div class="text-h6 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ expectedEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Actual -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered :dark="$q.dark.isActive" class="full-height">
                    <q-card-section class="q-pa-md">
                      <q-icon name="timer" color="info" size="22px" />
                      <div class="text-caption q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">Actual</div>
                      <div class="text-h6 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ actualEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Progress Remaining -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered :dark="$q.dark.isActive" class="full-height">
                    <q-card-section class="q-pa-md">
                      <q-icon name="hourglass_bottom" color="warning" size="22px" />
                      <div class="text-caption q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">Remaining</div>
                      <div class="text-h6 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ progressBasedRemainingEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Actual Remaining -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered :dark="$q.dark.isActive" class="full-height">
                    <q-card-section class="q-pa-md">
                      <q-icon name="access_time" color="positive" size="22px" />
                      <div class="text-caption q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">Hours Left</div>
                      <div class="text-h6 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ actualHoursRemaining }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Work Progress -->
                <div class="col-12 q-mt-sm">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-weight-bold" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">Work Progress</span>
                    <q-chip dense square color="primary" text-color="white" class="text-caption text-weight-bold">{{ overallProgress }}%</q-chip>
                  </div>
                  <q-linear-progress
                    :value="overallProgress / 100"
                    color="primary"
                    rounded
                    size="8px"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  />
                </div>

                <!-- Effort -->
                <div class="col-12">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-weight-bold" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">Effort Consumed</span>
                    <q-chip
                      dense
                      square
                      :color="effortPercentage > 90 ? 'warning' : 'primary'"
                      text-color="white"
                      class="text-caption text-weight-bold"
                    >
                      {{ effortPercentage }}%
                    </q-chip>
                  </div>
                  <q-linear-progress
                    :value="effortPercentage / 100"
                    :color="effortPercentage > 90 ? 'warning' : 'primary'"
                    rounded
                    size="8px"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- DEADLINE PERFORMANCE -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="36px" :color="$q.dark.isActive ? 'orange-10' : 'orange-1'" :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'" icon="event" />
            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Deadline Performance</div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Overview of your upcoming and overdue deadlines.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="d in deadlinePerformance" :key="d.label" class="col-6 col-sm-3">
              <q-card flat bordered :dark="$q.dark.isActive" class="full-height">
                <q-card-section class="q-pa-md">
                  <div class="row items-center no-wrap">
                    <q-avatar size="34px" :color="d.color" text-color="white" :icon="d.icon" />
                    <div class="q-ml-sm">
                      <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">{{ d.label }}</div>
                      <div class="text-h6 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ d.value }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- PROJECT PROGRESS -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar size="36px" :color="$q.dark.isActive ? 'purple-10' : 'blue-1'" :text-color="$q.dark.isActive ? 'purple-2' : 'primary'" icon="folder" />
              <div class="q-ml-sm">
                <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Project Progress</div>
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">Your tasks grouped by project.</div>
              </div>
            </div>

            <q-chip dense square :color="$q.dark.isActive ? 'purple-10' : 'deep-purple-1'" :text-color="$q.dark.isActive ? 'purple-2' : 'primary'" class="text-caption text-weight-bold">
              {{ projectProgress.length }} projects
            </q-chip>
          </div>
        </q-card-section>

        <q-separator />

        <q-list v-if="projectProgress.length" separator :dark="$q.dark.isActive">
          <q-item v-for="p in projectProgress" :key="p.project" class="q-py-md">
            <q-item-section avatar>
              <q-avatar size="38px" :color="$q.dark.isActive ? 'purple-10' : 'blue-1'" :text-color="$q.dark.isActive ? 'purple-2' : 'primary'" icon="folder" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ p.project }}</q-item-label>
              <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                {{ p.completed }}/{{ p.tasks }} completed · {{ p.active }} active
              </q-item-label>

              <q-linear-progress
                :value="p.progress / 100"
                color="primary"
                rounded
                size="6px"
                class="q-mt-sm"
                :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
              />
            </q-item-section>

            <q-item-section side>
              <q-chip dense square color="primary" text-color="white" class="text-caption text-weight-bold">{{ p.progress }}%</q-chip>
              <div class="text-caption q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">{{ p.expectedEffort }}h est</div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">{{ p.actualEffort }}h logged</div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="column items-center q-pa-xl" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          <q-avatar size="48px" :color="$q.dark.isActive ? 'grey-9' : 'grey-3'" :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'" icon="folder_off" />
          <div class="text-caption q-mt-sm">No projects to show yet.</div>
        </div>
      </q-card>

      <!-- WORK INSIGHTS -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="36px" :color="$q.dark.isActive ? 'amber-10' : 'amber-1'" :text-color="$q.dark.isActive ? 'amber-2' : 'amber-9'" icon="lightbulb" />
            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Work Insights</div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Computed from your current tasks and progress.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-list v-if="insights.length" separator :dark="$q.dark.isActive">
          <q-item v-for="(insight, i) in insights" :key="i" class="q-py-md">
            <q-item-section avatar>
              <q-avatar size="32px" :color="$q.dark.isActive ? 'purple-10' : 'blue-1'" :text-color="$q.dark.isActive ? 'purple-2' : 'primary'" icon="lightbulb" />
            </q-item-section>

            <q-item-section :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
              {{ insight }}
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="column items-center q-pa-xl" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          <q-avatar size="48px" :color="$q.dark.isActive ? 'grey-9' : 'grey-3'" :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'" icon="task_alt" />
          <div class="text-caption q-mt-sm">Nothing to flag right now.</div>
        </div>
      </q-card>

      <!-- TASK PROGRESS TABLE -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-lg rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar size="36px" color="primary" text-color="white" icon="checklist" />
            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">Task Progress</div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Every assigned task with progress, effort and deadline details.
              </div>
            </div>
          </div>

          <q-chip dense square color="primary" text-color="white" class="text-caption text-weight-bold">
            {{ tasks.length }} tasks
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-table
          v-if="tasks.length"
          flat
          :dark="$q.dark.isActive"
          :rows="taskRows"
          :columns="columns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="priorityColor(props.row.priority)"
                :text-color="priorityTextColor(props.row.priority)"
                class="text-caption text-weight-bold"
              >
                {{ props.row.priority }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="statusColor(props.row.status)"
                :text-color="statusTextColor(props.row.status)"
                class="text-caption text-weight-bold"
              >
                {{ statusLabel(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-linear-progress
                  :value="props.row.progress / 100"
                  color="primary"
                  rounded
                  class="col"
                  style="min-width: 60px"
                  :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                />
                <span class="text-caption text-weight-bold q-ml-sm" :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
                  {{ props.row.progress }}%
                </span>
              </div>
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td
              :props="props"
              :class="{
                'text-negative text-weight-medium': props.row.overdue,
              }"
            >
              <q-chip
                v-if="props.row.overdue"
                dense
                square
                :color="$q.dark.isActive ? 'red-10' : 'red-1'"
                :text-color="$q.dark.isActive ? 'red-2' : 'negative'"
                icon="warning"
                class="text-caption text-weight-bold"
              >
                {{ props.row.deadlineLabel }}
              </q-chip>

              <span v-else>
                {{ props.row.deadlineLabel }}
              </span>
            </q-td>
          </template>
        </q-table>

        <div v-else class="column items-center q-pa-xl" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          <q-avatar size="48px" :color="$q.dark.isActive ? 'grey-9' : 'grey-3'" :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'" icon="task_alt" />
          <div class="text-body2 q-mt-sm">No tasks assigned to you.</div>
        </div>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate } from '@/utils/formatters';
import { isOverdue } from '@/utils/taskHelpers';

import {
  getTasksApi,
  getResourceWorkloadApi,
  type Task,
  type ResourceWorkload,
} from '@/services/api';

const $q = useQuasar();
const router = useRouter();

const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);

const loading = ref(true);
const error = ref('');

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

onMounted(() => {
  void loadTasks();
});

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);

  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);
const activeTasks = computed(() => tasks.value.filter((t) => t.status !== 'COMPLETED').length);
const delayedTasks = computed(() => tasks.value.filter(isOverdue).length);

const overallProgress = computed(() => {
  if (!tasks.value.length) return 0;

  return Math.round(
    tasks.value.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / tasks.value.length,
  );
});

const expectedEffort = computed(() => {
  if (workloadData.value) {
    return Number(workloadData.value.total_expected_effort) || 0;
  }

  return tasks.value.reduce((s, t) => s + (Number(t.expected_effort) || 0), 0);
});

const actualEffort = computed(() => {
  if (workloadData.value) {
    return Number(workloadData.value.total_actual_effort) || 0;
  }

  return tasks.value.reduce((s, t) => s + (Number(t.actual_effort) || 0), 0);
});

const progressBasedRemainingEffort = computed(() => {
  if (!expectedEffort.value) return 0;

  return Number(((expectedEffort.value * (100 - overallProgress.value)) / 100).toFixed(2));
});

const actualHoursRemaining = computed(() =>
  Math.max(Number((expectedEffort.value - actualEffort.value).toFixed(2)), 0),
);

const effortPercentage = computed(() =>
  expectedEffort.value
    ? Math.min(100, Math.round((actualEffort.value / expectedEffort.value) * 100))
    : 0,
);

const statusDistribution = computed(() => [
  {
    label: 'Completed',
    value: tasks.value.filter((t) => t.status === 'COMPLETED').length,
    color: '#27AE60',
  },
  {
    label: 'In Progress',
    value: tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
    color: '#2E90FA',
  },
  {
    label: 'Scheduled',
    value: tasks.value.filter((t) => t.status === 'SCHEDULED').length,
    color: '#8B6FD8',
  },
  {
    label: 'Unassigned',
    value: tasks.value.filter((t) => t.status === 'UNASSIGNED').length,
    color: '#98A2B3',
  },
  {
    label: 'Overdue',
    value: delayedTasks.value,
    color: '#E15263',
  },
]);

const deadlinePerformance = computed(() => {
  const noDeadline = tasks.value.filter((t) => !t.deadline).length;
  const overdue = tasks.value.filter(isOverdue).length;
  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;

  const dueSoon = tasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;

    const days = daysUntil(t.deadline);
    return days >= 0 && days <= 7;
  }).length;

  return [
    {
      label: 'Completed',
      value: completed,
      icon: 'check_circle',
      color: 'positive',
    },
    {
      label: 'Due within 7 days',
      value: dueSoon,
      icon: 'schedule',
      color: 'warning',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: 'warning',
      color: 'negative',
    },
    {
      label: 'No deadline',
      value: noDeadline,
      icon: 'event_busy',
      color: 'grey-6',
    },
  ];
});

const projectProgress = computed(() => {
  const groups = new Map<
    string,
    {
      project: string;
      tasks: number;
      completed: number;
      active: number;
      progressTotal: number;
      expectedEffort: number;
      actualEffort: number;
    }
  >();

  for (const task of tasks.value) {
    const project = task.project_name ?? `Project #${task.project_id}`;
    const existing = groups.get(project);

    if (existing) {
      existing.tasks += 1;
      existing.completed += task.status === 'COMPLETED' ? 1 : 0;
      existing.active += task.status !== 'COMPLETED' ? 1 : 0;
      existing.progressTotal += Number(task.progress) || 0;
      existing.expectedEffort += Number(task.expected_effort) || 0;
      existing.actualEffort += Number(task.actual_effort) || 0;
    } else {
      groups.set(project, {
        project,
        tasks: 1,
        completed: task.status === 'COMPLETED' ? 1 : 0,
        active: task.status !== 'COMPLETED' ? 1 : 0,
        progressTotal: Number(task.progress) || 0,
        expectedEffort: Number(task.expected_effort) || 0,
        actualEffort: Number(task.actual_effort) || 0,
      });
    }
  }

  return Array.from(groups.values()).map((p) => ({
    project: p.project,
    tasks: p.tasks,
    completed: p.completed,
    active: p.active,
    progress: p.tasks ? Math.round(p.progressTotal / p.tasks) : 0,
    expectedEffort: p.expectedEffort,
    actualEffort: p.actualEffort,
    remainingEffort: Math.max(p.expectedEffort - p.actualEffort, 0),
  }));
});

const insights = computed(() => {
  const result: string[] = [];

  if (delayedTasks.value > 0) {
    result.push(
      `${delayedTasks.value} task${delayedTasks.value > 1 ? 's are' : ' is'} currently overdue.`,
    );
  }

  if (actualEffort.value > expectedEffort.value) {
    result.push('Actual effort has exceeded the expected effort.');
  }

  const dueSoon = tasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) return false;

    const days = daysUntil(t.deadline);
    return days >= 0 && days <= 7;
  }).length;

  if (dueSoon > 0) {
    result.push(`${dueSoon} task${dueSoon > 1 ? 's are' : ' is'} due within the next 7 days.`);
  }

  if (completedTasks.value === tasks.value.length && tasks.value.length > 0) {
    result.push('All assigned tasks are completed.');
  }

  if (actualEffort.value > expectedEffort.value && expectedEffort.value > 0) {
    result.push(
      'Logged effort is higher than the planned effort. Review remaining work and task estimates.',
    );
  }

  return result;
});

const columns = [
  {
    name: 'title',
    label: 'Task',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'project',
    label: 'Project',
    field: 'project',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Priority',
    field: 'priority',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'progress',
    label: 'Progress',
    field: 'progress',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: 'deadlineLabel',
    align: 'left' as const,
    sortable: true,
  },
];

const taskRows = computed(() =>
  tasks.value.map((task) => ({
    ...task,
    project: task.project_name ?? `Project #${task.project_id}`,
    progress: Number(task.progress) || 0,
    deadlineLabel: formatDate(task.deadline),
    overdue: isOverdue(task),
  })),
);

function priorityColor(priority: Task['priority']): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-10';
      case 'MEDIUM':
        return 'purple-10';
      case 'HIGH':
        return 'orange-10';
      case 'CRITICAL':
        return 'red-10';
      default:
        return 'grey-9';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-1';
    case 'MEDIUM':
      return 'deep-purple-1';
    case 'HIGH':
      return 'orange-1';
    case 'CRITICAL':
      return 'red-1';
    default:
      return 'grey-2';
  }
}

function priorityTextColor(priority: Task['priority']): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-2';
      case 'MEDIUM':
        return 'purple-2';
      case 'HIGH':
        return 'orange-2';
      case 'CRITICAL':
        return 'red-2';
      default:
        return 'grey-2';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-8';
    case 'MEDIUM':
      return 'primary';
    case 'HIGH':
      return 'orange-8';
    case 'CRITICAL':
      return 'red-8';
    default:
      return 'grey-8';
  }
}

function statusColor(status: Task['status']): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-10';
      case 'IN_PROGRESS':
        return 'blue-10';
      case 'COMPLETED':
        return 'green-10';
      default:
        return 'grey-9';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'deep-purple-1';
    case 'IN_PROGRESS':
      return 'blue-1';
    case 'COMPLETED':
      return 'green-1';
    default:
      return 'grey-2';
  }
}

function statusTextColor(status: Task['status']): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-2';
      case 'IN_PROGRESS':
        return 'blue-2';
      case 'COMPLETED':
        return 'green-2';
      default:
        return 'grey-3';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'primary';
    case 'IN_PROGRESS':
      return 'blue-8';
    case 'COMPLETED':
      return 'green-8';
    default:
      return 'grey-8';
  }
}

function statusLabel(status: Task['status']) {
  return {
    UNASSIGNED: 'Unassigned',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  }[status] || status;
}

function openTask(taskId: number) {
  void router.push(`/app/resource-dashboard/task-details/${taskId}`);
}
</script>
