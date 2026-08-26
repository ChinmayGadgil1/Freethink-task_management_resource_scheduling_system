<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)">
    <q-card class="dialog-card" style="min-width: 520px; max-width: 95vw">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div>
          <div v-if="fixedProjectName" class="modal-eyebrow">NEW TASK</div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ headerTitle }}
          </div>
        </div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-form @submit.prevent="handleSubmit">
        <q-card-section class="column q-gutter-md q-pt-md">
          <!-- Project Selection (if not in fixed project mode) -->
          <q-select
            v-if="!fixedProjectId"
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

          <!-- Title -->
          <q-input
            v-model="form.title"
            outlined
            dense
            label="Task Title *"
            placeholder="e.g. Design responsive navbar component"
            :rules="[(val) => !!val?.trim() || 'Task title is required']"
          />

          <!-- Description -->
          <q-input
            v-model="form.description"
            outlined
            dense
            type="textarea"
            label="Description"
            placeholder="Task details and acceptance criteria..."
            autogrow
          />

          <!-- Priority and Status / Effort Row -->
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

          <!-- Deadline -->
          <q-input
            v-model="form.deadline"
            outlined
            dense
            type="date"
            label="Deadline"
            stack-label
          />

          <!-- Effort (if showStatus is enabled) -->
          <q-input
            v-if="showStatus"
            v-model.number="form.expected_effort"
            outlined
            dense
            type="number"
            min="0.5"
            step="0.5"
            label="Expected Effort (Hours) *"
            :rules="[(val) => Number(val) > 0 || 'Effort must be greater than 0']"
          />

          <!-- Assign Members Field -->
          <q-select
            v-if="showAssignees"
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

          <!-- Dependencies Field -->
          <q-select
            v-if="showDependencies"
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

export interface CreateTaskDialogProps {
  modelValue?: boolean;
  projects?: Array<{ label: string; value: number }>;
  fixedProjectId?: number | null;
  fixedProjectName?: string;
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
  emit('submit', {
    ...form,
    project_id: props.fixedProjectId ?? form.project_id,
    title: form.title.trim(),
    description: form.description.trim(),
  });
}
</script>

<style scoped lang="scss">
.dialog-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
}

.modal-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--wo-text-muted, #667085);
  margin-bottom: 2px;
}
</style>
