<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="reports-page q-pa-md q-pa-md-lg"
  >
    <div class="reports-page-wrapper">
      <!-- 1. PAGE HEADER -->
      <div class="row items-center justify-between q-mb-md wrap q-col-gutter-sm screen-only">
        <div>
          <h1
            class="text-h5 text-weight-bold q-ma-none"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Project & Resource Reports
          </h1>
          <p
            class="text-caption q-mt-xs q-mb-none"
            :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
          >
            Audited operational, progress, workload, and schedule variance reports
          </p>
        </div>

        <!-- Header Actions: Refresh & Print -->
        <div class="row items-center q-gutter-sm">
          <q-btn
            outline
            dense
            rounded
            color="primary"
            icon="print"
            label="Print / Save as PDF"
            no-caps
            class="q-px-sm"
            @click="handlePrintReport"
          />

          <q-btn
            outline
            dense
            rounded
            color="primary"
            icon="refresh"
            label="Refresh"
            no-caps
            class="q-px-sm"
            :loading="loading"
            @click="loadAllReportsData"
          />
        </div>
      </div>

      <!-- 2. LOADING SKELETON -->
      <div v-if="loading && isInitialLoad" class="q-my-lg screen-only">
        <div class="row q-col-gutter-md q-mb-md">
          <div v-for="i in 4" :key="`sk-kpi-${i}`" class="col-12 col-sm-6 col-md-3">
            <q-skeleton type="rect" height="96px" class="rounded-borders" />
          </div>
        </div>
        <q-skeleton type="rect" height="420px" class="rounded-borders" />
      </div>

      <!-- 3. ERROR BANNER -->
      <q-banner
        v-else-if="errorMessage"
        class="bg-negative text-white q-mb-lg rounded-borders screen-only"
      >
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ errorMessage }}
        <template #action>
          <q-btn flat color="white" label="Retry" @click="loadAllReportsData" />
        </template>
      </q-banner>

      <!-- 4. MAIN REPORTS CONTAINER -->
      <div v-else class="reports-content">
        <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-md">
          <!-- Responsive QTabs Navigation for the 8 Reports -->
          <q-tabs
            v-model="activeTab"
            dense
            active-color="primary"
            indicator-color="primary"
            align="left"
            narrow-indicator
            mobile-arrows
            outside-arrows
            class="reports-nav-tabs screen-only"
            :dark="$q.dark.isActive"
          >
            <q-tab name="project-progress" icon="analytics" label="Project Progress" no-caps />
            <q-tab name="task-completion" icon="task_alt" label="Task Completion" no-caps />
            <q-tab name="delayed-tasks" icon="warning_amber" label="Delayed Tasks" no-caps />
            <q-tab
              name="resource-workload"
              icon="people"
              label="Resource Workload & Utilization"
              no-caps
            />
            <q-tab name="deadline-variance" icon="timelapse" label="Deadline Variance" no-caps />
            <q-tab
              name="schedule-changes"
              icon="history_toggle_off"
              label="Schedule Changes"
              no-caps
            />
            <q-tab name="progress-history" icon="history" label="Progress History" no-caps />
          </q-tabs>

          <q-separator :dark="$q.dark.isActive" class="screen-only" />

          <!-- Panels for Modular Child Reports -->
          <q-tab-panels
            v-model="activeTab"
            animated
            swipeable
            class="bg-transparent"
            :dark="$q.dark.isActive"
          >
            <!-- 1. Project Progress Tab -->
            <q-tab-panel name="project-progress" class="q-pa-md">
              <ProjectProgressTab :projects="projectList" :tasks="taskList" />
            </q-tab-panel>

            <!-- 2. Task Completion Tab -->
            <q-tab-panel name="task-completion" class="q-pa-md">
              <TaskCompletionTab
                :tasks="taskList"
                :projects="projectList"
                :resources="resourceList"
              />
            </q-tab-panel>

            <!-- 3. Delayed Tasks Tab -->
            <q-tab-panel name="delayed-tasks" class="q-pa-md">
              <DelayedTasksTab
                :tasks="taskList"
                :projects="projectList"
                :resources="resourceList"
              />
            </q-tab-panel>

            <!-- 4. Resource Workload & Utilization Tab -->
            <q-tab-panel name="resource-workload" class="q-pa-md">
              <ResourceWorkloadTab
                :resources="resourceList"
                :workloads-map="workloadsMap"
                :tasks="taskList"
                :projects="projectList"
              />
            </q-tab-panel>

            <!-- 6. Deadline Variance Tab -->
            <q-tab-panel name="deadline-variance" class="q-pa-md">
              <DeadlineVarianceTab
                :tasks="taskList"
                :projects="projectList"
                :resources="resourceList"
              />
            </q-tab-panel>

            <!-- 7. Schedule Changes Tab -->
            <q-tab-panel name="schedule-changes" class="q-pa-md">
              <ScheduleChangesTab
                :tasks="taskList"
                :projects="projectList"
                :resources="resourceList"
              />
            </q-tab-panel>

            <!-- 8. Progress History Tab -->
            <q-tab-panel name="progress-history" class="q-pa-md">
              <ProgressHistoryTab
                :feed-logs="feedLogs"
                :projects="projectList"
                :resources="resourceList"
              />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  getResourceWorkloadApi,
  getGlobalProgressFeedApi,
  type Project,
  type Task,
  type ResourceUser,
  type ResourceWorkload,
  type ProgressFeedLog,
} from '@/services/api';

// Child Report Tab Components
import ProjectProgressTab from '@/components/reports/ProjectProgressTab.vue';
import TaskCompletionTab from '@/components/reports/TaskCompletionTab.vue';
import DelayedTasksTab from '@/components/reports/DelayedTasksTab.vue';
import ResourceWorkloadTab from '@/components/reports/ResourceWorkloadTab.vue';
import DeadlineVarianceTab from '@/components/reports/DeadlineVarianceTab.vue';
import ScheduleChangesTab from '@/components/reports/ScheduleChangesTab.vue';
import ProgressHistoryTab from '@/components/reports/ProgressHistoryTab.vue';

// Active Tab State
const activeTab = ref<string>('project-progress');

// Loading and Error States
const loading = ref<boolean>(false);
const isInitialLoad = ref<boolean>(true);
const errorMessage = ref<string | null>(null);

// Shared Primary Entities
const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);
const workloadsMap = ref<Record<number, ResourceWorkload | null>>({});
const feedLogs = ref<ProgressFeedLog[]>([]);

/**
 * Loads shared reporting datasets once efficiently:
 * - Projects
 * - Tasks
 * - Resources
 * - Resource Workloads (parallel mapped per resource)
 * - Progress Feed Logs (work log history)
 */
async function loadAllReportsData() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const [projects, tasks, resources, logs] = await Promise.all([
      getProjectsApi(),
      getTasksApi(),
      getResourcesApi(),
      getGlobalProgressFeedApi(100).catch(() => []),
    ]);

    projectList.value = projects;
    taskList.value = tasks;
    resourceList.value = resources;
    feedLogs.value = logs;

    // Fetch workloads in parallel
    const wMap: Record<number, ResourceWorkload | null> = {};
    await Promise.all(
      resources.map(async (r) => {
        const wRes = await getResourceWorkloadApi(r.user_id).catch(() => null);
        wMap[r.user_id] = wRes;
      }),
    );
    workloadsMap.value = wMap;
  } catch (err) {
    console.error('Failed to load reports data:', err);
    errorMessage.value =
      err instanceof Error ? err.message : 'Unable to connect to reporting services.';
  } finally {
    loading.value = false;
    isInitialLoad.value = false;
  }
}

function handlePrintReport() {
  window.print();
}

onMounted(() => {
  void loadAllReportsData();
});
</script>

<style scoped>
.reports-page-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.reports-nav-tabs :deep(.q-tab) {
  min-height: 48px;
  font-weight: 500;
}
</style>
