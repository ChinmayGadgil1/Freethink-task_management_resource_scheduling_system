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
          <q-chip
            v-if="task.task_type === 'VERIFICATION' || task.priority === 'NONE'"
            dense
            square
            color="purple-1"
            text-color="purple-9"
            icon="verified"
            style="font-size: 11px; font-weight: 600"
          >
            Verification
          </q-chip>
          <q-chip v-else dense square :class="['priority-chip', getPriorityClass(task.priority)]">
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

        <!-- Deliverable link for Verification Tasks -->
        <div
          v-if="
            task.task_type === 'VERIFICATION' && (task.verified_task_title || task.verified_task_id)
          "
          class="q-banner bg-purple-1 text-purple-10 rounded-borders q-mt-sm row items-center gap-xs q-pa-sm"
        >
          <q-icon name="fact_check" color="purple-8" size="20px" class="q-mr-xs" />
          <div class="column">
            <span class="text-caption text-weight-bold">Verifying completed deliverable:</span>
            <span class="text-body2 text-weight-medium">
              #{{ task.verified_task_id }} {{ task.verified_task_title }}
            </span>
          </div>
        </div>

        <div
          class="popup-description q-mt-sm text-body2"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-8'"
        >
          {{ task.description || 'No description provided.' }}
        </div>

        <q-separator class="q-my-md" />

        <!-- Verification Section for Completed Standard Tasks -->
        <div
          v-if="task.status === 'COMPLETED' && task.task_type !== 'VERIFICATION'"
          class="popup-verification-block q-mb-md"
        >
          <div class="row items-center justify-between q-mb-xs">
            <div class="detail-label">Peer Verification Review</div>
            <q-btn
              v-if="!task.verification_task"
              unelevated
              dense
              no-caps
              size="sm"
              color="purple-8"
              icon="verified"
              label="Assign for Verification"
              class="q-px-sm"
              @click="emit('assignVerification', task)"
            />
          </div>

          <q-card
            v-if="task.verification_task"
            flat
            bordered
            :dark="$q.dark.isActive"
            class="q-pa-sm rounded-borders bg-purple-1 text-purple-10"
          >
            <div class="row items-center justify-between no-wrap">
              <div class="row items-center gap-xs">
                <q-icon name="verified" size="20px" color="purple-8" />
                <div>
                  <div class="text-weight-bold text-caption">
                    Verifier: {{ task.verification_task.verifier_name }}
                  </div>
                  <div class="text-caption text-grey-7" style="font-size: 11px">
                    Progress: {{ Number(task.verification_task.progress) || 0 }}% · Status:
                    {{ formatStatus(task.verification_task.status) }}
                  </div>
                </div>
              </div>
              <div class="row items-center gap-xs">
                <q-chip
                  dense
                  square
                  size="xs"
                  :color="task.verification_task.status === 'COMPLETED' ? 'green-1' : 'purple-2'"
                  :text-color="
                    task.verification_task.status === 'COMPLETED' ? 'green-9' : 'purple-9'
                  "
                  class="text-weight-bold"
                >
                  {{
                    task.verification_task.status === 'COMPLETED'
                      ? 'VERIFIED & APPROVED'
                      : 'UNDER REVIEW'
                  }}
                </q-chip>
                <q-btn
                  flat
                  dense
                  round
                  size="xs"
                  color="purple-8"
                  icon="person_add"
                  title="Assign another verifier"
                  @click="emit('assignVerification', task)"
                />
              </div>
            </div>
            <q-linear-progress
              rounded
              size="4px"
              :value="(Number(task.verification_task.progress) || 0) / 100"
              :color="task.verification_task.status === 'COMPLETED' ? 'positive' : 'purple-8'"
              track-color="purple-2"
              class="q-mt-xs"
            />
          </q-card>
          <div v-else class="text-caption text-grey-5 q-py-xs">
            No verification assigned yet. Assign a team member to review and verify this completed
            deliverable.
          </div>
        </div>

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

        <!-- Supervisor in Popup -->
        <div class="popup-supervisor-block q-mt-md">
          <div class="detail-label q-mb-xs">Task Supervisor / Reviewer</div>
          <div v-if="task.supervisor_name || task.supervisor_id" class="row items-center gap-xs">
            <q-chip
              dense
              square
              color="amber-1"
              text-color="amber-10"
              icon="verified_user"
              class="text-weight-bold"
            >
              {{ task.supervisor_name || `Resource #${task.supervisor_id}` }}
            </q-chip>
            <span v-if="task.supervisor_email" class="text-caption text-grey-6"
              >({{ task.supervisor_email }})</span
            >
          </div>
          <span v-else class="text-caption text-grey-5">No supervisor designated</span>
        </div>

        <!-- Dependencies in Popup -->
        <div v-if="showDependencies" class="popup-dependencies-block q-mt-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="detail-label">Upstream Dependencies (Predecessors)</div>
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
            v-if="task.predecessors && task.predecessors.length > 0"
            class="column q-gutter-y-xs q-mt-xs"
          >
            <q-card
              v-for="pred in task.predecessors"
              :key="pred.task_id"
              flat
              bordered
              :dark="$q.dark.isActive"
              class="q-pa-xs rounded-borders"
            >
              <div class="row items-center justify-between no-wrap">
                <div class="row items-center gap-xs ellipsis">
                  <q-icon name="account_tree" size="14px" color="teal" />
                  <span class="text-weight-bold text-caption ellipsis" :title="pred.title">{{
                    pred.title
                  }}</span>
                  <q-chip
                    dense
                    square
                    size="xs"
                    :color="pred.status === 'COMPLETED' ? 'green-1' : 'blue-1'"
                    :text-color="pred.status === 'COMPLETED' ? 'green-9' : 'blue-9'"
                  >
                    {{ formatStatus(pred.status) }}
                  </q-chip>
                </div>
                <div class="row items-center gap-xs">
                  <span class="text-caption text-weight-bold text-primary"
                    >{{ Number(pred.progress) || 0 }}%</span
                  >
                  <q-btn
                    v-if="allowRemoveDependency"
                    flat
                    round
                    dense
                    size="xs"
                    icon="close"
                    color="grey-6"
                    title="Remove dependency"
                    @click="handleRemoveDependencyClick(pred.task_id)"
                  />
                </div>
              </div>
              <q-linear-progress
                rounded
                size="4px"
                :value="(Number(pred.progress) || 0) / 100"
                :color="pred.status === 'COMPLETED' ? 'positive' : 'primary'"
                class="q-mt-xs"
              />
              <div
                v-if="pred.assigned_resource_names && pred.assigned_resource_names.length > 0"
                class="text-caption text-grey-6 q-mt-xs"
                style="font-size: 10.5px"
              >
                Assigned: {{ pred.assigned_resource_names.join(', ') }}
              </div>
            </q-card>
          </div>
          <div
            v-else-if="task.predecessor_task_ids && task.predecessor_task_ids.length > 0"
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
  (e: 'assignVerification', task: Task): void;
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
  if (props.resourceNamesMap?.[resourceId]) {
    return props.resourceNamesMap[resourceId];
  }
  if (props.task?.assigned_resource_ids && props.task?.assigned_resource_names) {
    const idx = props.task.assigned_resource_ids.findIndex(
      (id) => Number(id) === Number(resourceId),
    );
    if (idx !== -1 && props.task.assigned_resource_names[idx]) {
      return props.task.assigned_resource_names[idx];
    }
  }
  const sched = props.task?.schedules?.find((s) => Number(s.user_id) === Number(resourceId));
  if (sched?.resource_name) {
    return sched.resource_name;
  }
  return `Resource #${resourceId}`;
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
