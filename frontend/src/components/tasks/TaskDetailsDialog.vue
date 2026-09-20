<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)">
    <q-card
      v-if="task"
      class="dialog-card"
      :dark="$q.dark.isActive"
      style="width: 720px; max-width: 95vw"
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
              {{ task.verified_task_title }}
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
          <div class="detail-label q-mb-xs">Peer Verification Review</div>

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
            <div
              v-if="task.supervisor_id || task.supervisor_name"
              class="text-caption text-amber-9 text-weight-medium q-mt-xs"
            >
              + {{ (Number(task.expected_effort || 8) * 0.2).toFixed(1) }}h supervisor (Total:
              {{ (Number(task.expected_effort || 8) * 1.2).toFixed(1) }}h)
            </div>
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
            v-if="assignedResourceIds.length > 0"
            class="column q-gutter-y-xs"
          >
            <div
              v-for="rId in assignedResourceIds"
              :key="rId"
              class="assignee-progress-card rounded-borders q-pa-sm"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'"
              style="border: 1px solid rgba(0, 0, 0, 0.08)"
            >
              <!-- Member Header: Avatar, Name on left; Progress % and Unassign cross on right -->
              <div class="row items-center justify-between no-wrap q-mb-xs">
                <div class="row items-center q-gutter-xs no-wrap ellipsis">
                  <q-avatar size="20px" class="avatar-purple">
                    {{ getResourceInitial(rId) }}
                  </q-avatar>
                  <span
                    class="text-caption text-weight-bold ellipsis"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    {{ resolveResourceName(rId) }}
                  </span>
                </div>

                <div class="row items-center q-gutter-x-xs no-wrap">
                  <span
                    v-if="getAssigneeProgress(rId)"
                    class="text-caption text-weight-bolder"
                    :class="
                      getAssigneeProgress(rId)!.progress_logged === 100
                        ? 'text-positive'
                        : 'text-primary'
                    "
                  >
                    {{ getAssigneeProgress(rId)!.progress_logged }}%
                  </span>
                  <span
                    v-else
                    class="text-caption text-grey-5 text-weight-medium"
                    style="font-size: 11px"
                  >
                    Not logged yet
                  </span>

                  <q-btn
                    v-if="allowUnassign"
                    flat
                    round
                    dense
                    size="xs"
                    icon="close"
                    color="grey-6"
                    class="unassign-member-btn q-ml-xs"
                    @click="handleUnassignClick(rId)"
                  >
                    <q-tooltip>Unassign {{ resolveResourceName(rId) }}</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Mini Progress Bar -->
              <q-linear-progress
                :value="(getAssigneeProgress(rId)?.progress_logged ?? 0) / 100"
                rounded
                size="5px"
                :color="
                  getAssigneeProgress(rId)?.progress_logged === 100
                    ? 'positive'
                    : 'primary'
                "
                :track-color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
              />

              <!-- Last Updated & Hours Logged Metadata -->
              <div
                v-if="getAssigneeProgress(rId)"
                class="row items-center q-mt-xs q-gutter-x-xs text-caption text-grey-6"
                style="font-size: 10.5px"
              >
                <span>
                  Last updated:
                  {{
                    formatDate(
                      getAssigneeProgress(rId)!.log_date ||
                        getAssigneeProgress(rId)!.created_at,
                    )
                  }}
                </span>
                <span>·</span>
                <span>{{ formatHours(getAssigneeProgress(rId)!.hours_logged) }} logged</span>
              </div>
            </div>
          </div>
          <span v-else class="text-caption text-grey-5">No members currently assigned</span>
        </div>

        <!-- Supervisor in Popup -->
        <div v-if="!isVerificationTask(task)" class="popup-supervisor-block q-mt-md">
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
              {{
                task.supervisor_name ||
                (task.supervisor_id ? resolveResourceName(task.supervisor_id) : '') ||
                `Resource #${task.supervisor_id}`
              }}
            </q-chip>
            <q-badge outline color="amber-9" class="text-weight-bold">
              20% Effort ({{ (Number(task.expected_effort || 0) * 0.2).toFixed(1) }}h)
            </q-badge>
            <span v-if="task.supervisor_email" class="text-caption text-grey-6"
              >({{ task.supervisor_email }})</span
            >
          </div>
          <span v-else class="text-caption text-grey-5">No supervisor designated</span>
        </div>

        <!-- Dependencies & Impact Flow in Popup -->
        <div v-if="showDependencies" class="popup-dependencies-block q-mt-md">
          <div class="row items-center justify-between q-mb-xs">
            <div class="detail-label">Task Dependencies & Impact Flow</div>
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

          <!-- Dependency Direction Filter Tabs -->
          <div class="row items-center q-mb-xs">
            <q-tabs
              v-model="activeDependencyTab"
              dense
              no-caps
              active-color="primary"
              indicator-color="primary"
              align="left"
              class="text-grey-7"
              style="font-size: 11.5px"
            >
              <q-tab name="all">
                <div class="row items-center gap-xs">
                  <span>All</span>
                  <q-badge
                    :color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
                    :text-color="$q.dark.isActive ? 'grey-2' : 'grey-9'"
                    class="text-weight-bold"
                    style="font-size: 10px"
                  >
                    {{ totalDependencyCount }}
                  </q-badge>
                </div>
              </q-tab>
              <q-tab name="upstream">
                <div class="row items-center gap-xs">
                  <span>Upstream (Prerequisites)</span>
                  <q-badge
                    color="teal-1"
                    text-color="teal-9"
                    class="text-weight-bold"
                    style="font-size: 10px"
                  >
                    {{ upstreamCount }}
                  </q-badge>
                </div>
              </q-tab>
              <q-tab name="downstream">
                <div class="row items-center gap-xs">
                  <span>Downstream (Dependents)</span>
                  <q-badge
                    color="purple-1"
                    text-color="purple-9"
                    class="text-weight-bold"
                    style="font-size: 10px"
                  >
                    {{ downstreamCount }}
                  </q-badge>
                </div>
              </q-tab>
            </q-tabs>
          </div>

          <!-- Dependencies List -->
          <div v-if="filteredDependencies.length > 0" class="column q-gutter-y-xs q-mt-xs">
            <q-card
              v-for="dep in filteredDependencies"
              :key="`${dep.direction}-${dep.task_id}`"
              flat
              bordered
              :dark="$q.dark.isActive"
              class="q-pa-xs rounded-borders"
              :style="
                dep.direction === 'UPSTREAM'
                  ? 'border-left: 3px solid #00897b;'
                  : 'border-left: 3px solid #7c4dff;'
              "
            >
              <div class="row items-center justify-between no-wrap">
                <div class="row items-center gap-xs ellipsis">
                  <q-chip
                    dense
                    square
                    size="xs"
                    :color="dep.direction === 'UPSTREAM' ? 'teal-1' : 'purple-1'"
                    :text-color="dep.direction === 'UPSTREAM' ? 'teal-9' : 'purple-9'"
                    class="text-weight-bold"
                    style="font-size: 10px"
                  >
                    {{ dep.direction === 'UPSTREAM' ? 'Blocked By' : 'Blocks' }}
                  </q-chip>
                  <span
                    class="text-weight-bold text-caption ellipsis"
                    :title="dep.title"
                    style="font-size: 11.5px"
                  >
                    {{ dep.title }}
                  </span>
                  <q-chip
                    v-if="dep.status"
                    dense
                    square
                    size="xs"
                    :class="['status-chip', getTaskStatusClass(dep.status)]"
                    style="font-size: 10px"
                  >
                    {{ formatStatus(dep.status) }}
                  </q-chip>
                </div>
                <div class="row items-center gap-xs">
                  <span class="text-caption text-weight-bold text-primary" style="font-size: 11px">
                    {{ Number(dep.progress) || 0 }}%
                  </span>
                  <q-btn
                    v-if="dep.direction === 'UPSTREAM' && allowRemoveDependency"
                    flat
                    round
                    dense
                    size="xs"
                    icon="close"
                    color="grey-6"
                    title="Remove dependency"
                    @click="handleRemoveDependencyClick(dep.task_id)"
                  />
                </div>
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs"
                style="font-size: 10.5px; line-height: 1.2"
              >
                {{ dep.relationshipNote }}
              </div>
              <q-linear-progress
                rounded
                size="4px"
                :value="(Number(dep.progress) || 0) / 100"
                :color="
                  dep.status === 'COMPLETED'
                    ? 'positive'
                    : dep.direction === 'UPSTREAM'
                      ? 'teal'
                      : 'primary'
                "
                class="q-mt-xs"
              />
              <div
                v-if="dep.assigned_resource_names && dep.assigned_resource_names.length > 0"
                class="text-caption text-grey-6 q-mt-xs"
                style="font-size: 10.5px"
              >
                Assigned: {{ dep.assigned_resource_names.join(', ') }}
              </div>
            </q-card>
          </div>
          <div v-else class="text-caption text-grey-5 q-py-xs">
            {{
              activeDependencyTab === 'upstream'
                ? 'This task is not blocked by any prerequisites.'
                : activeDependencyTab === 'downstream'
                  ? 'This task does not block any downstream deliverables.'
                  : 'No dependencies linked to this deliverable.'
            }}
          </div>
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

                <!--
                <div
                  v-if="log.blockers"
                  class="row items-center text-caption text-negative q-mt-xs text-weight-medium"
                >
                  <q-icon name="warning_amber" size="13px" class="q-mr-xs" />
                  <span>Blocker: {{ log.blockers }}</span>
                </div>
                -->
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-separator class="q-mt-md" />

      <q-card-actions align="right" class="q-pa-md q-gutter-sm">
        <q-btn flat no-caps label="Close" color="grey-7" v-close-popup class="text-weight-medium" />
        <q-btn
          v-if="
            task.status === 'COMPLETED' &&
            task.task_type !== 'VERIFICATION' &&
            !task.verification_task
          "
          unelevated
          no-caps
          icon="verified"
          label="Assign Verifier"
          color="primary"
          text-color="white"
          class="rounded-borders action-btn-primary"
          @click="emit('assignVerification', task)"
        />
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
import {
  getWorkLogsApi,
  type Task,
  type WorkLog,
  type AssigneeProgress,
} from '@/services/api';
import {
  formatDate,
  formatStatus,
  formatHours,
  formatNumber,
  getInitials,
} from '@/utils/formatters';
import {
  isTaskOverdue,
  getTaskStatusClass,
  getPriorityClass,
  isVerificationTask,
} from '@/utils/taskHelpers';

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
const assigneeProgress = ref<AssigneeProgress[]>([]);
const loadingLogs = ref(false);

async function fetchTaskWorkLogs(taskId: number) {
  loadingLogs.value = true;
  try {
    const res = await getWorkLogsApi(taskId);
    workLogs.value = res.logs || [];
    assigneeProgress.value = res.assignee_progress || [];
  } catch (err) {
    console.error('Failed to load task work logs:', err);
    workLogs.value = [];
    assigneeProgress.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

watch(
  () => [props.modelValue, props.task?.task_id],
  ([isOpen, taskId]) => {
    if (isOpen && taskId) {
      if (props.task?.assignee_progress) {
        assigneeProgress.value = props.task.assignee_progress;
      }
      void fetchTaskWorkLogs(Number(taskId));
    } else {
      workLogs.value = [];
      assigneeProgress.value = [];
    }
  },
  { immediate: true },
);

const assignedResourceIds = computed<number[]>(() => {
  if (!props.task) return [];
  if (props.task.assigned_resource_ids && props.task.assigned_resource_ids.length > 0) {
    return props.task.assigned_resource_ids.map((id) => Number(id));
  }
  if (props.task.assigned_resources && props.task.assigned_resources.length > 0) {
    return props.task.assigned_resources.map((r) => Number(r.user_id));
  }
  return [];
});

function getAssigneeProgress(resourceId: number): AssigneeProgress | undefined {
  const byId = assigneeProgress.value.find(
    (ap) => Number(ap.user_id) === Number(resourceId),
  );
  if (byId) return byId;

  const resName = resolveResourceName(resourceId).toLowerCase().trim();
  return assigneeProgress.value.find(
    (ap) => ap.author_name && ap.author_name.toLowerCase().trim() === resName,
  );
}

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
  const ap = assigneeProgress.value.find((a) => Number(a.user_id) === Number(resourceId));
  if (ap?.author_name) {
    return ap.author_name;
  }
  if (props.task?.assigned_resources) {
    const r = props.task.assigned_resources.find(
      (res) => Number(res.user_id) === Number(resourceId),
    );
    if (r?.name) return r.name;
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

const activeDependencyTab = ref<'all' | 'upstream' | 'downstream'>('all');

interface DialogDependencyItem {
  task_id: number;
  project_id?: number | undefined;
  project_name?: string | undefined;
  title: string;
  status: string;
  priority?: string | undefined;
  deadline?: string | null | undefined;
  planned_start?: string | null | undefined;
  planned_end?: string | null | undefined;
  progress?: number | string | undefined;
  expected_effort?: number | string | undefined;
  actual_effort?: number | string | undefined;
  is_schedule_at_risk?: boolean | undefined;
  is_deadline_at_risk?: boolean | undefined;
  assigned_resource_names?: string[] | undefined;
  direction: 'UPSTREAM' | 'DOWNSTREAM';
  relationshipNote: string;
}

function parseDialogDependencyIds(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((x) => Number(x)).filter((n) => !isNaN(n) && n > 0);
  }
  if (typeof val === 'number') {
    return val > 0 ? [val] : [];
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }
  return [];
}

const upstreamDependencies = computed<DialogDependencyItem[]>(() => {
  if (!props.task) return [];
  if (Array.isArray(props.task.predecessors) && props.task.predecessors.length > 0) {
    return props.task.predecessors.map((p) => ({
      task_id: Number(p.task_id),
      project_id: p.project_id ? Number(p.project_id) : undefined,
      project_name: p.project_name || undefined,
      title: p.title || resolvePredecessorTitle(Number(p.task_id)),
      status: p.status || 'UNASSIGNED',
      priority: p.priority || 'MEDIUM',
      deadline: p.deadline || null,
      planned_start: p.planned_start || null,
      planned_end: p.planned_end || null,
      progress: p.progress ?? 0,
      expected_effort: p.expected_effort ?? 0,
      actual_effort: p.actual_effort ?? 0,
      is_schedule_at_risk: Boolean(p.is_schedule_at_risk),
      is_deadline_at_risk: Boolean(p.is_deadline_at_risk),
      assigned_resource_names: p.assigned_resource_names || [],
      direction: 'UPSTREAM' as const,
      relationshipNote: 'Prerequisite deliverable that must finish before this task can proceed.',
    }));
  }
  const predIds = parseDialogDependencyIds(props.task.predecessor_task_ids);
  if (predIds.length > 0) {
    return predIds.map((id) => ({
      task_id: Number(id),
      title: resolvePredecessorTitle(Number(id)),
      status: 'UNASSIGNED',
      progress: 0,
      direction: 'UPSTREAM' as const,
      relationshipNote: 'Prerequisite deliverable required before this task can proceed.',
    }));
  }
  return [];
});

const downstreamDependencies = computed<DialogDependencyItem[]>(() => {
  if (!props.task) return [];
  if (Array.isArray(props.task.successors) && props.task.successors.length > 0) {
    return props.task.successors.map((s) => ({
      task_id: Number(s.task_id),
      project_id: s.project_id ? Number(s.project_id) : undefined,
      project_name: s.project_name || undefined,
      title: s.title || resolvePredecessorTitle(Number(s.task_id)),
      status: s.status || 'UNASSIGNED',
      priority: s.priority || 'MEDIUM',
      deadline: s.deadline || null,
      planned_start: s.planned_start || null,
      planned_end: s.planned_end || null,
      progress: s.progress ?? 0,
      expected_effort: s.expected_effort ?? 0,
      actual_effort: s.actual_effort ?? 0,
      is_schedule_at_risk: Boolean(s.is_schedule_at_risk),
      is_deadline_at_risk: Boolean(s.is_deadline_at_risk),
      assigned_resource_names: s.assigned_resource_names || [],
      direction: 'DOWNSTREAM' as const,
      relationshipNote: 'Dependent deliverable waiting for this task to be completed.',
    }));
  }
  const succIds = parseDialogDependencyIds(props.task.successor_task_ids);
  if (succIds.length > 0) {
    return succIds.map((id) => ({
      task_id: Number(id),
      title: resolvePredecessorTitle(Number(id)),
      status: 'UNASSIGNED',
      progress: 0,
      direction: 'DOWNSTREAM' as const,
      relationshipNote: 'Dependent deliverable waiting for this task to complete.',
    }));
  }
  return [];
});

const totalDependencyCount = computed(
  () => upstreamDependencies.value.length + downstreamDependencies.value.length,
);
const upstreamCount = computed(() => upstreamDependencies.value.length);
const downstreamCount = computed(() => downstreamDependencies.value.length);

const filteredDependencies = computed<DialogDependencyItem[]>(() => {
  if (activeDependencyTab.value === 'upstream') {
    return upstreamDependencies.value;
  }
  if (activeDependencyTab.value === 'downstream') {
    return downstreamDependencies.value;
  }
  return [...upstreamDependencies.value, ...downstreamDependencies.value];
});

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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
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

.assignee-progress-card {
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.assignee-progress-card:hover {
  border-color: rgba(139, 111, 216, 0.35) !important;
}

.unassign-member-btn:hover {
  color: var(--q-negative) !important;
  background: rgba(239, 68, 68, 0.1);
}
</style>
