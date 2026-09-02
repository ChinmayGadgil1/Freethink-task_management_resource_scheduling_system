<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)">
    <q-card class="dialog-card" :dark="$q.dark.isActive" style="min-width: 520px; max-width: 95vw">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div>
          <div v-if="fixedProjectName" class="modal-eyebrow">NEW TASK</div>
          <div
            class="text-subtitle1 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            {{ headerTitle }}
          </div>
        </div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-form @submit.prevent="handleSubmit">
        <q-card-section class="column q-gutter-y-md q-pt-md">
          <!-- Project Selection (if not in fixed project mode) -->
          <div v-if="!fixedProjectId" class="row q-col-gutter-sm">
            <div class="col-12">
              <q-select
                v-model="form.project_id"
                outlined
                dense
                label="Project *"
                :options="projects"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Project is required']"
                @update:model-value="(val) => emit('projectChange', val)"
              />
            </div>
          </div>

          <!-- Title -->
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <q-input
                v-model="form.title"
                outlined
                dense
                stack-label
                label="Task Title *"
                placeholder="e.g. Design responsive navbar component"
                :rules="[(val) => !!val?.trim() || 'Task title is required']"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <q-input
                v-model="form.description"
                outlined
                dense
                stack-label
                type="textarea"
                label="Description"
                placeholder="Task details and acceptance criteria..."
                autogrow
              />
            </div>
          </div>

          <!-- Priority and Status / Effort Row -->
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <div class="row q-col-gutter-sm">
                <div :class="showStatus ? 'col-6' : 'col-6'">
                  <q-select
                    v-model="form.priority"
                    outlined
                    dense
                    label="Priority"
                    :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                  />
                </div>

                <div v-if="showStatus" class="col-6">
                  <q-select
                    v-model="form.status"
                    outlined
                    dense
                    label="Initial Status"
                    :options="[
                      { label: 'Unassigned', value: 'UNASSIGNED' },
                      { label: 'Scheduled', value: 'SCHEDULED' },
                      { label: 'In Progress', value: 'IN_PROGRESS' },
                      { label: 'Completed', value: 'COMPLETED' },
                    ]"
                    emit-value
                    map-options
                  />
                </div>

                <div v-if="!showStatus" class="col-6">
                  <q-input
                    v-model.number="form.expected_effort"
                    outlined
                    dense
                    type="number"
                    min="0.5"
                    step="0.5"
                    label="Effort (Hours) *"
                    :rules="[(val) => Number(val) > 0 || 'Effort must be positive']"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Deadline -->
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <q-input
                v-model="form.deadline"
                outlined
                dense
                type="date"
                label="Deadline"
                stack-label
                :rules="[
                  (val) =>
                    !val ||
                    !activeProjectDates.startDate ||
                    val >= activeProjectDates.startDate ||
                    `Deadline cannot be earlier than project start date (${activeProjectDates.startDate})`,
                  (val) =>
                    !val ||
                    !activeProjectDates.deadline ||
                    val <= activeProjectDates.deadline ||
                    `Deadline cannot be later than project deadline (${activeProjectDates.deadline})`,
                ]"
              />
            </div>
          </div>

          <!-- Effort (if showStatus is enabled) -->
          <div v-if="showStatus" class="row q-col-gutter-sm">
            <div class="col-12">
              <q-input
                v-model.number="form.expected_effort"
                outlined
                dense
                type="number"
                min="0.5"
                step="0.5"
                label="Expected Effort (Hours) *"
                :rules="[(val) => Number(val) > 0 || 'Effort must be greater than 0']"
              />
            </div>
          </div>

          <!-- Assign Members Field -->
          <div v-if="showAssignees" class="row q-col-gutter-sm">
            <div class="col-12">
              <q-select
                v-model="form.assigned_resource_ids"
                outlined
                dense
                multiple
                clearable
                :display-value="
                  form.assigned_resource_ids.length
                    ? `${form.assigned_resource_ids.length} member(s) selected`
                    : ''
                "
                label="Assign Member(s) (Optional)"
                :options="memberOptions"
                emit-value
                map-options
                :disable="!activeProjectId"
                :hint="
                  !activeProjectId
                    ? 'Select a project first to assign members'
                    : form.assigned_resource_ids.length
                      ? 'Task will be created as SCHEDULED'
                      : 'No members selected — task will be created as UNASSIGNED'
                "
              >
                <template #option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section side>
                      <q-checkbox
                        :model-value="selected"
                        color="primary"
                        @update:model-value="toggleOption(opt)"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Dependencies Field -->
          <div v-if="showDependencies" class="row q-col-gutter-sm">
            <div class="col-12">
              <q-select
                v-model="form.predecessor_task_ids"
                outlined
                dense
                multiple
                clearable
                :display-value="
                  form.predecessor_task_ids.length
                    ? `${form.predecessor_task_ids.length} dependency/dependencies selected`
                    : ''
                "
                label="Predecessor Dependencies (Optional)"
                :options="predecessorOptions"
                emit-value
                map-options
                :disable="!activeProjectId"
                :hint="
                  !activeProjectId
                    ? 'Select a project first to choose dependencies'
                    : 'Select tasks that must be completed before this task'
                "
              >
                <template #option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section side>
                      <q-checkbox
                        :model-value="selected"
                        color="primary"
                        @update:model-value="toggleOption(opt)"
                      />
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="account_tree" color="primary" size="18px" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn
            v-close-popup
            flat
            no-caps
            label="Cancel"
            color="grey-7"
            class="text-weight-medium"
          />
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            :label="submitLabel"
            class="action-btn-primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

export interface CreateTaskFormData {
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  expected_effort: number;
  deadline: string;
  assigned_resource_ids: number[];
  predecessor_task_ids: number[];
}

export interface CreateTaskProjectOption {
  label: string;
  value: number;
  start_date?: string | null;
  deadline?: string | null;
}

export interface CreateTaskDialogProps {
  modelValue?: boolean;
  projects?: CreateTaskProjectOption[];
  fixedProjectId?: number | null;
  fixedProjectName?: string;
  projectStartDate?: string | null;
  projectDeadline?: string | null;
  dialogTitle?: string;
  submitLabel?: string;
  memberOptions?: Array<{ label: string; value: number; alreadyAssigned?: boolean }>;
  predecessorOptions?: Array<{ label: string; value: number; alreadyDependent?: boolean }>;
  showAssignees?: boolean;
  showDependencies?: boolean;
  showStatus?: boolean;
  loading?: boolean;
  initialProjectId?: number | null;
}

const props = withDefaults(defineProps<CreateTaskDialogProps>(), {
  modelValue: false,
  projects: () => [],
  fixedProjectId: null,
  fixedProjectName: '',
  projectStartDate: null,
  projectDeadline: null,
  dialogTitle: 'Create New Task',
  submitLabel: 'Create Task',
  memberOptions: () => [],
  predecessorOptions: () => [],
  showAssignees: true,
  showDependencies: true,
  showStatus: false,
  loading: false,
  initialProjectId: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'submit', form: CreateTaskFormData): void;
  (e: 'projectChange', projectId: number | null): void;
}>();

const headerTitle = computed(() => {
  if (props.fixedProjectName) return `Create Task for ${props.fixedProjectName}`;
  return props.dialogTitle;
});

const activeProjectId = computed(() => props.fixedProjectId || form.project_id);

const activeProjectDates = computed(() => {
  if (props.projectStartDate !== null || props.projectDeadline !== null) {
    return {
      startDate: props.projectStartDate || null,
      deadline: props.projectDeadline || null,
    };
  }
  const pid = activeProjectId.value;
  if (!pid) return { startDate: null, deadline: null };
  const proj = props.projects.find((p) => p.value === pid);
  return {
    startDate: proj?.start_date || null,
    deadline: proj?.deadline || null,
  };
});

const form = reactive<CreateTaskFormData>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'SCHEDULED',
  expected_effort: 8,
  deadline: '',
  assigned_resource_ids: [],
  predecessor_task_ids: [],
});

function resetForm() {
  const pid =
    props.fixedProjectId ??
    props.initialProjectId ??
    (props.projects.length > 0 ? (props.projects[0]?.value ?? null) : null);
  form.project_id = pid;
  form.title = '';
  form.description = '';
  form.priority = 'MEDIUM';
  form.status = 'SCHEDULED';
  form.expected_effort = 8;
  form.deadline = '';
  form.assigned_resource_ids = [];
  form.predecessor_task_ids = [];
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

function handleSubmit() {
  const sanitizedResourceIds = Array.isArray(form.assigned_resource_ids)
    ? form.assigned_resource_ids
        .filter((id): id is number => id != null && !isNaN(Number(id)))
        .map(Number)
    : [];

  const sanitizedPredecessorIds = Array.isArray(form.predecessor_task_ids)
    ? form.predecessor_task_ids
        .filter((id): id is number => id != null && !isNaN(Number(id)))
        .map(Number)
    : [];

  emit('submit', {
    ...form,
    project_id: props.fixedProjectId ?? form.project_id,
    title: form.title.trim(),
    description: form.description.trim(),
    assigned_resource_ids: sanitizedResourceIds,
    predecessor_task_ids: sanitizedPredecessorIds,
  });
}
</script>
