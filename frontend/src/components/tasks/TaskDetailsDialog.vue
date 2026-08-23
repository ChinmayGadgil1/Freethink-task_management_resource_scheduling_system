<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card v-if="task" class="details-popup-card" style="min-width: 480px; max-width: 95vw">
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
        </div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="popup-title text-h6 text-weight-bold text-dark">
          {{ task.title }}
        </div>
        <div class="popup-project-row row items-center gap-xs q-mt-xs">
          <q-icon name="folder" size="14px" color="primary" />
          <span class="text-weight-bold text-primary">
            {{ resolvedProjectName }}
          </span>
        </div>

        <div class="popup-description q-mt-sm text-body2 text-grey-8">
          {{ task.description || 'No description provided.' }}
        </div>

        <q-separator class="q-my-md" />

        <!-- Details Grid -->
        <div class="popup-details-grid">
          <div class="detail-item">
            <div class="detail-label">Start Date</div>
            <div class="detail-val">{{ formatDate(task.start_date) }}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Deadline</div>
            <div
              class="detail-val"
              :class="{ 'text-negative font-bold': isTaskOverdue(task) }"
            >
              {{ formatDate(task.deadline) }}
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Expected Effort</div>
            <div class="detail-val">{{ task.expected_effort || 8 }} Hours</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Actual Effort</div>
            <div class="detail-val">{{ task.actual_effort || 0 }} Hours</div>
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
              <q-tooltip v-if="allowUnassign">Click X to unassign {{ resolveResourceName(rId) }}</q-tooltip>
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
              color="teal-1"
              text-color="teal-9"
              style="font-size: 11px"
            >
              <q-icon name="account_tree" size="13px" class="q-mr-xs" color="teal" />
              {{ resolvePredecessorTitle(pId) }} (#{{ pId }})
            </q-chip>
          </div>
          <span v-else class="text-caption text-grey-5">No predecessor dependencies</span>
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
import { computed } from 'vue';
import type { Task } from '@/services/api';
import { formatDate, formatStatus, getInitials } from '@/utils/formatters';
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
  showDependencies: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', task: Task): void;
  (e: 'unassignMember', payload: { taskId: number; resourceId: number; resourceName: string }): void;
  (e: 'assignMember', taskId: number): void;
  (e: 'addDependency', taskId: number): void;
}>();

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
</script>

<style scoped lang="scss">
.details-popup-card {
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
}

.popup-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--wo-bg-subtle, #f9fafb);
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
