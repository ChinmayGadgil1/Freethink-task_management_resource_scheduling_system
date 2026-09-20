<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)">
    <q-card
      class="dialog-card rounded-borders"
      :dark="$q.dark.isActive"
      style="width: 520px; max-width: 95vw"
    >
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

          <!-- Priority and Effort Row -->
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.priority"
                outlined
                dense
                label="Priority"
                :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
              />
            </div>

            <div class="col-12 col-sm-6">
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
  supervisor_id?: number | null | undefined;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | undefined;
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
  fixedProjectId?: number | null | undefined;
  fixedProjectName?: string;
  projectStartDate?: string | null | undefined;
  projectDeadline?: string | null | undefined;
  dialogTitle?: string;
  submitLabel?: string;
  memberOptions?: Array<{ label: string; value: number; alreadyAssigned?: boolean }>;
  supervisorOptions?: Array<{ label: string; value: number }>;
  predecessorOptions?: Array<{ label: string; value: number; alreadyDependent?: boolean }>;
  showAssignees?: boolean;
  showSupervisor?: boolean;
  showDependencies?: boolean;
  loading?: boolean;
  initialProjectId?: number | null | undefined;
  initialStatus?: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | null | undefined;
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
  supervisorOptions: () => [],
  predecessorOptions: () => [],
  showAssignees: true,
  showSupervisor: true,
  showDependencies: true,
  loading: false,
  initialProjectId: null,
  initialStatus: null,
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

const form = reactive<CreateTaskFormData>({
  project_id: null,
  title: '',
  description: '',
  supervisor_id: null,
  priority: 'MEDIUM',
  status: undefined,
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
  form.supervisor_id = null;
  form.priority = 'MEDIUM';
  form.status = props.initialStatus || undefined;
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

watch(
  () => form.assigned_resource_ids,
  (newVal) => {
    if (!newVal || newVal.length === 0) {
      form.deadline = '';
    }
  },
  { deep: true },
);

function handleSubmit() {
  emit('submit', {
    ...form,
    project_id: props.fixedProjectId ?? form.project_id,
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    status: props.initialStatus || 'UNASSIGNED',
    expected_effort: Number(form.expected_effort) || 8,
    deadline: '',
    supervisor_id: null,
    assigned_resource_ids: [],
    predecessor_task_ids: [],
  });
}
</script>
