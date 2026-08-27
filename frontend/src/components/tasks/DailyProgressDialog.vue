<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <q-card style="width: 560px; max-width: 95vw">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Add Daily Update</div>

          <div v-if="task" class="text-caption text-grey-6">
            {{ task.title }} · {{ task.project_name || `Project #${task.project_id}` }}
          </div>
        </div>

        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="task">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="form.log_date" type="date" label="Date *" outlined dense />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.hours_logged"
              type="number"
              min="0"
              step="0.5"
              label="Total Hours Worked *"
              outlined
              dense
            />
          </div>

          <div class="col-12">
            <div class="field-label">
              Progress
              <span class="text-primary text-weight-bold"> {{ form.progress_logged }}% </span>
            </div>
            <q-slider
              v-model="form.progress_logged"
              :min="0"
              :max="100"
              :step="5"
              color="primary"
              label
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.notes"
              type="textarea"
              label="Work Update / Notes *"
              outlined
              dense
              rows="3"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.blockers"
              type="textarea"
              label="Blockers (optional)"
              outlined
              dense
              rows="2"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />

        <q-btn
          unelevated
          no-caps
          label="Submit Update"
          color="primary"
          :disable="!canSubmit"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import type { CreateWorkLogPayload, Task } from '@/services/api';

const props = defineProps<{
  modelValue: boolean;
  task: Task | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: CreateWorkLogPayload): void;
}>();

function createToday() {
  return new Date().toISOString().split('T')[0] ?? '';
}

const form = reactive<CreateWorkLogPayload>({
  hours_logged: 0,
  progress_logged: 0,
  status: 'IN_PROGRESS',
  notes: '',
  blockers: '',
  log_date: createToday(),
});

const canSubmit = computed(() => {
  return (
    props.task !== null &&
    form.log_date !== '' &&
    Number(form.hours_logged) > 0 &&
    Number(form.progress_logged) >= 0 &&
    Number(form.progress_logged) <= 100 &&
    form.notes.trim().length > 0
  );
});

function resetForm(task: Task | null) {
  form.hours_logged = 0;
  form.progress_logged = task ? Number(task.progress) || 0 : 0;
  form.status = task?.status ?? 'IN_PROGRESS';
  form.notes = '';
  form.blockers = '';
  form.log_date = createToday();
}

watch(
  () => [props.task, props.modelValue] as const,
  ([task, modelValue]) => {
    if (!modelValue) {
      return;
    }

    resetForm(task);
  },
  { immediate: true },
);

function save() {
  if (!props.task || !canSubmit.value) {
    return;
  }

  const computedStatus =
    Number(form.progress_logged) === 100
      ? 'COMPLETED'
      : props.task.status === 'COMPLETED'
        ? 'IN_PROGRESS'
        : props.task.status || 'IN_PROGRESS';

  emit('save', {
    hours_logged: Number(form.hours_logged),
    progress_logged: Math.min(Math.max(Number(form.progress_logged), 0), 100),
    status: computedStatus,
    notes: form.notes.trim(),
    blockers: (form.blockers ?? '').trim() || null,
    log_date: form.log_date,
  });

  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.field-label {
  margin-bottom: 4px;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}
</style>
