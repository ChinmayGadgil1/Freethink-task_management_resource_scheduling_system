<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Update Task</div>

          <div v-if="task" class="text-caption text-grey-6">
            {{ task.name }} · {{ task.project }}
          </div>
        </div>

        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="task">
        <div class="field-label">Status</div>

        <div class="status-choice">
          <q-btn
            v-for="option in statusOptions"
            :key="option.value"
            no-caps
            unelevated
            :color="form.status === option.value ? 'primary' : 'grey-2'"
            :text-color="form.status === option.value ? 'white' : 'grey-8'"
            :label="option.label"
            class="status-choice-btn"
            @click="form.status = option.value"
          />
        </div>

        <div class="field-label q-mt-lg">
          Progress
          <span class="text-primary text-weight-bold"> {{ form.progress }}% </span>
        </div>

        <q-slider v-model="form.progress" :min="0" :max="100" :step="5" color="primary" label />

        <div class="field-label q-mt-md">Total Hours Worked</div>

        <q-input
          v-model.number="form.hoursWorked"
          outlined
          dense
          type="number"
          min="0"
          step="0.5"
        />

        <div class="field-label q-mt-md">Work Update</div>

        <q-input
          v-model="form.workUpdate"
          outlined
          type="textarea"
          autogrow
          rows="3"
          placeholder="What did you work on?"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />

        <q-btn unelevated no-caps label="Save Update" color="primary" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { ResourceTask, TaskStatus } from '@/components/tasks/task-types';

const props = defineProps<{
  modelValue: boolean;
  task: ResourceTask | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'save',
    payload: {
      id: number;
      status: TaskStatus;
      progress: number;
      hoursWorked: number;
      workUpdate: string;
    },
  ): void;
}>();

const statusOptions: {
  label: string;
  value: TaskStatus;
}[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

const form = reactive<{
  status: TaskStatus;
  progress: number;
  hoursWorked: number;
  workUpdate: string;
}>({
  status: 'PENDING',
  progress: 0,
  hoursWorked: 0,
  workUpdate: '',
});

watch(
  () => props.task,
  (task) => {
    if (!task) return;

    form.status = task.status;
    form.progress = task.progress;
    form.hoursWorked = task.hoursWorked;
    form.workUpdate = '';
  },
  { immediate: true },
);

function save() {
  if (!props.task) return;

  emit('save', {
    id: props.task.id,
    status: form.status,
    progress: Math.min(Math.max(Number(form.progress), 0), 100),
    hoursWorked: Math.max(Number(form.hoursWorked), 0),
    workUpdate: form.workUpdate.trim(),
  });

  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.field-label {
  margin-bottom: 8px;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.status-choice {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-choice-btn {
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
}
</style>
