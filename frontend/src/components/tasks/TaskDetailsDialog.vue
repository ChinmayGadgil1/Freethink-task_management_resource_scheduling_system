<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)">
    <q-card
      v-if="task"
      class="dialog-card"
      :dark="$q.dark.isActive"
      style="min-width: 480px; max-width: 95vw"
    >
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center gap-xs">
          <q-chip dense square :class="['priority-chip', getPriorityClass(task.priority)]">
            {{ task.priority }}
          </q-chip>
          <q-chip dense square :class="['status-chip', getTaskStatusClass(task.status)]">
            {{ formatStatus(task.status) }}
          </q-chip>
          <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 11px">
            #{{ task.task_id }}
          </q-chip>
          <q-chip
            v-if="task.is_deadline_at_risk"
            dense
            square
            color="red-1"
            text-color="red-9"
            icon="warning"
            style="font-size: 11px; font-weight: 600"
          >
            Deadline Risk
          </q-chip>
          <q-chip
            v-if="task.is_schedule_at_risk"
            dense
            square
            color="amber-1"
            text-color="amber-9"
            icon="schedule"
            style="font-size: 11px; font-weight: 600"
          >
            Schedule Risk
          </q-chip>
        </div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div
          class="popup-title text-h6 text-weight-bold"
          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
        >
          {{ task.title }}
        </div>
        <div class="popup-project-row row items-center gap-xs q-mt-xs">
          <q-icon name="folder" size="14px" color="primary" />
          <span class="text-weight-bold text-primary">
            {{ resolvedProjectName }}
          </span>
        </div>

        <div
          class="popup-description q-mt-sm text-body2"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-8'"
        >
          {{ task.description || 'No description provided.' }}
        </div>

        <q-separator class="q-my-md" />

        <!-- Details Grid -->
        <div class="popup-details-grid">
          <div class="detail-item">
            <div class="detail-label">Deadline</div>
            <div class="detail-val" :class="{ 'text-negative font-bold': isTaskOverdue(task) }">
              {{ formatDate(task.deadline) }}
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Expected Effort</div>
            <div class="detail-val">{{ formatNumber(task.expected_effort || 8) }} Hours</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Actual Effort</div>
            <div class="detail-val">{{ formatNumber(task.actual_effort || 0) }} Hours</div>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="q-mt-md">
          <div class="row items-center justify-between text-caption q-mb-xs">
            <span class="detail-label">Progress</span>
            <span class="text-weight-bold text-primary">{{ Number(task.progress) || 0 }}%</span>
          </div>
          <q-linear-progress
            rounded
            size="7px"
            :value="(Number(task.progress) || 0) / 100"
            :color="task.status === 'COMPLETED' ? 'positive' : 'primary'"
            track-color="grey-3"
          />
        </div>

        <!-- Assignees List in Popup -->
        <div class="popup-assignees-block q-mt-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="detail-label">Assigned Team Members</div>
            <q-btn
              v-if="allowAssignMember"
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              icon="person_add"
              label="Assign Member"
              @click="emit('assignMember', task.task_id)"
            />
          </div>
          <div
            v-if="task.assigned_resource_ids && task.assigned_resource_ids.length > 0"
            class="row q-gutter-xs wrap"
          >
            <q-chip
              v-for="rId in task.assigned_resource_ids"
              :key="rId"
              dense
              square
              :removable="allowUnassign"
              class="resource-chip"
              @remove="handleUnassignClick(rId)"
            >
              <q-avatar size="18px" class="avatar-purple q-mr-xs">
                {{ getResourceInitial(rId) }}
              </q-avatar>
              {{ resolveResourceName(rId) }}
              <q-tooltip v-if="allowUnassign"
                >Click X to unassign {{ resolveResourceName(rId) }}</q-tooltip
              >
            </q-chip>
          </div>
          <span v-else class="text-caption text-grey-5">No members currently assigned</span>
        </div>

        <!-- Dependencies in Popup -->
        <div v-if="showDependencies" class="popup-dependencies-block q-mt-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="detail-label">Dependencies (Predecessors)</div>
            <q-btn
              v-if="allowAddDependency"
              flat
              dense
              no-caps
              size="sm"
              color="teal"
              icon="account_tree"
              label="Add Dependency"
              @click="emit('addDependency', task.task_id)"
            />
          </div>
          <div
            v-if="task.predecessor_task_ids && task.predecessor_task_ids.length > 0"
            class="row q-gutter-xs wrap"
          >
            <q-chip
              v-for="pId in task.predecessor_task_ids"
              :key="pId"
              dense
              square
              :removable="allowRemoveDependency"
              color="teal-1"
              text-color="teal-9"
              style="font-size: 11px"
              @remove="handleRemoveDependencyClick(pId)"
            >
              <q-icon name="account_tree" size="13px" class="q-mr-xs" color="teal" />
              {{ resolvePredecessorTitle(pId) }} (#{{ pId }})
              <q-tooltip v-if="allowRemoveDependency">Click X to remove this dependency</q-tooltip>
            </q-chip>
          </div>
          <span v-else class="text-caption text-grey-5">No predecessor dependencies</span>
        </div>

        <!-- Work Logs / Daily Updates History in Popup -->
        <div class="popup-worklogs-block q-mt-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="detail-label">Work Log & Progress History</div>
            <span v-if="workLogs.length > 0" class="text-caption text-grey-6 text-weight-medium">
              {{ workLogs.length }} update{{ workLogs.length === 1 ? '' : 's' }}
            </span>
          </div>

          <div v-if="loadingLogs" class="row items-center justify-center q-pa-md">
            <q-spinner color="primary" size="20px" />
            <span class="text-caption text-grey-6 q-ml-sm">Loading work history...</span>
          </div>

          <div v-else-if="workLogs.length === 0" class="text-caption text-grey-5 q-py-xs">
            No work logs recorded for this task yet.
          </div>

          <q-list
            v-else
            bordered
            separator
            class="rounded-borders q-mt-xs"
            style="max-height: 220px; overflow-y: auto"
          >
            <q-item v-for="log in workLogs" :key="log.log_id" dense class="q-py-sm">
              <q-item-section avatar top style="min-width: 32px">
                <q-avatar size="24px" class="avatar-purple">
                  {{
                    getInitials(log.author_name || resolveResourceName(log.user_id), 'U')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <div class="row items-center justify-between no-wrap">
                  <!-- Author name with (You) badge if created by current logged-in resource -->
                  <div class="row items-center q-gutter-xs">
                    <span class="text-weight-bold text-caption text-dark ellipsis">
                      {{ log.author_name || resolveResourceName(log.user_id) }}
                    </span>
                    <q-badge
                      v-if="currentUserId && Number(log.user_id) === currentUserId"
                      color="primary"
                      label="You"
                      class="text-weight-bold"
                      style="font-size: 9px; padding: 1px 4px"
                    />
                  </div>
                  <div class="text-caption text-grey-6 text-weight-medium">
                    {{ formatDate(log.log_date) }}
                  </div>
                </div>

                <div class="row items-center gap-xs q-mt-xs text-caption text-grey-7">
                  <span class="text-weight-medium">{{ formatHours(log.hours_logged) }} worked</span>
                  <span>·</span>
                  <span class="text-weight-medium text-primary"
                    >{{ Number(log.progress_logged) }}% progress</span
                  >
                  <q-chip
                    v-if="log.status"
                    dense
                    square
                    :class="['status-chip q-ml-xs', getTaskStatusClass(log.status)]"
                    style="font-size: 10px; height: 16px"
                  >
                    {{ formatStatus(log.status) }}
                  </q-chip>
                </div>

                <div
                  v-if="log.notes"
                  class="text-caption text-grey-8 q-mt-xs"
                  style="white-space: pre-wrap; word-break: break-word"
                >
                  {{ log.notes }}
                </div>

                <div
                  v-if="log.blockers"
                  class="row items-center text-caption text-negative q-mt-xs text-weight-medium"
                >
                  <q-icon name="warning_amber" size="13px" class="q-mr-xs" />
                  <span>Blocker: {{ log.blockers }}</span>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-separator class="q-mt-md" />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps label="Close" color="grey-7" v-close-popup class="text-weight-medium" />
        <q-btn
          unelevated
          no-caps
          icon="edit"
          label="Edit Task"
          color="primary"
          class="action-btn-primary"
          @click="emit('edit', task)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth'; // Auth store to identify current user
import { getWorkLogsApi, type Task, type WorkLog } from '@/services/api';
import {
  formatDate,
  formatStatus,
  formatHours,
  formatNumber,
  getInitials,
} from '@/utils/formatters';
import { isTaskOverdue, getTaskStatusClass, getPriorityClass } from '@/utils/taskHelpers';

export interface TaskDetailsDialogProps {
  modelValue?: boolean;
  task: Task | null;
  projectName?: string | undefined;
  resourceNamesMap?: Record<number, string> | undefined;
  predecessorTitlesMap?: Record<number, string> | undefined;
  allowUnassign?: boolean;
  allowAssignMember?: boolean;
  allowAddDependency?: boolean;
  allowRemoveDependency?: boolean;
  showDependencies?: boolean;
}

const props = withDefaults(defineProps<TaskDetailsDialogProps>(), {
  modelValue: false,
  projectName: '',
  resourceNamesMap: () => ({}),
  predecessorTitlesMap: () => ({}),
  allowUnassign: true,
  allowAssignMember: true,
  allowAddDependency: true,
  allowRemoveDependency: true,
  showDependencies: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', task: Task): void;
  (
    e: 'unassignMember',
    payload: { taskId: number; resourceId: number; resourceName: string },
  ): void;
  (e: 'assignMember', taskId: number): void;
  (e: 'addDependency', taskId: number): void;
  (
    e: 'removeDependency',
    payload: { taskId: number; predecessorId: number; predecessorTitle: string },
  ): void;
}>();

const authStore = useAuthStore();
// Extract current logged-in user id to highlight their own updates with strong typing
const currentUserId = computed<number | null>(() => {
  const u = (authStore.user || authStore.currentUser) as {
    user_id?: number | string;
    id?: number | string;
  } | null;
  return u?.user_id ? Number(u.user_id) : u?.id ? Number(u.id) : null;
});

const workLogs = ref<WorkLog[]>([]);
const loadingLogs = ref(false);

async function fetchTaskWorkLogs(taskId: number) {
  loadingLogs.value = true;
  try {
    const logs = await getWorkLogsApi(taskId);
    workLogs.value = logs || [];
  } catch (err) {
    console.error('Failed to load task work logs:', err);
    workLogs.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

watch(
  () => [props.modelValue, props.task?.task_id],
  ([isOpen, taskId]) => {
    if (isOpen && taskId) {
      void fetchTaskWorkLogs(Number(taskId));
    } else {
      workLogs.value = [];
    }
  },
  { immediate: true },
);

const resolvedProjectName = computed(() => {
  if (props.projectName) return props.projectName;
  if (props.task?.project_name) return props.task.project_name;
  if (props.task?.project_id) return `Project #${props.task.project_id}`;
  return 'Unassigned Project';
});

function resolveResourceName(resourceId: number): string {
  return props.resourceNamesMap?.[resourceId] || `Resource #${resourceId}`;
}

function getResourceInitial(resourceId: number): string {
  const name = resolveResourceName(resourceId);
  return getInitials(name, 'R').charAt(0).toUpperCase();
}

function resolvePredecessorTitle(taskId: number): string {
  return props.predecessorTitlesMap?.[taskId] || `Task #${taskId}`;
}

function handleUnassignClick(resourceId: number) {
  if (!props.task) return;
  emit('unassignMember', {
    taskId: props.task.task_id,
    resourceId,
    resourceName: resolveResourceName(resourceId),
  });
}

function handleRemoveDependencyClick(predecessorId: number) {
  if (!props.task) return;
  emit('removeDependency', {
    taskId: props.task.task_id,
    predecessorId,
    predecessorTitle: resolvePredecessorTitle(predecessorId),
  });
}
</script>

<style scoped lang="scss">
.popup-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--wo-bg-subtle, #f9fafb);
  border: 1px solid var(--wo-border-subtle, transparent);
}

.detail-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-text-muted, #667085);
  margin-bottom: 2px;
}

.detail-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--wo-text-main, #1d2433);
}

.avatar-purple {
  background: rgba(139, 111, 216, 0.2);
  color: #8b6fd8;
  font-size: 10px;
  font-weight: 700;
}

.resource-chip {
  background: var(--wo-bg-subtle, #f2f4f7);
  color: var(--wo-text-main, #344054);
  font-size: 11px;
}

.priority-chip,
.status-chip {
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}
</style>
