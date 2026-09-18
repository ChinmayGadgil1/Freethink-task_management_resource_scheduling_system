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
              min="0.5"
              step="0.5"
              label="Hours Worked * (0.5h steps)"
              outlined
              dense
              :error="!!hoursError"
              :error-message="hoursError || undefined"
            />
            <div class="row items-center gap-xs q-mt-xs">
              <span class="text-caption text-grey-6">Quick:</span>
              <q-btn
                v-for="preset in [0.5, 1, 1.5, 2, 4, 8]"
                :key="preset"
                dense
                outline
                size="xs"
                no-caps
                :label="`${preset}h`"
                :color="form.hours_logged === preset ? 'primary' : 'grey-7'"
                @click="form.hours_logged = preset"
              />
            </div>
          </div>

          <div class="col-12">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold text-grey-7">
                Progress
                <span class="text-primary text-weight-bold"> {{ form.progress_logged }}% </span>
              </div>
              <div class="row items-center q-gutter-xs">
                <span class="text-caption text-grey-6 text-weight-medium">Status:</span>
                <q-chip
                  dense
                  square
                  :class="['status-chip', getTaskStatusClass(computedStatus)]"
                  class="text-weight-bold"
                  style="font-size: 11px; height: 22px"
                >
                  {{ formatStatusLabel(computedStatus) }}
                </q-chip>
              </div>
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
import { getStatusFromProgress, getTaskStatusClass, formatStatusLabel } from '@/utils/taskHelpers';

const props = defineProps<{
  modelValue: boolean;
  task: Task | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: CreateWorkLogPayload): void;
}>();

function createToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const form = reactive<CreateWorkLogPayload>({
  hours_logged: 0,
  progress_logged: 0,
  status: 'SCHEDULED',
  notes: '',
  blockers: '',
  log_date: createToday(),
});

const computedStatus = computed(() => {
  return getStatusFromProgress(form.progress_logged);
});

const hoursError = computed(() => {
  const h = Number(form.hours_logged);
  if (isNaN(h) || h <= 0) {
    return 'Hours must be greater than 0';
  }
  if (Math.round(h * 10) % 5 !== 0) {
    return 'Hours must be in 0.5-hr increments (e.g. 0.5, 1, 1.5, 2)';
  }
  return null;
});

const canSubmit = computed(() => {
  return (
    props.task !== null &&
    !hoursError.value &&
    form.log_date !== '' &&
    Number(form.hours_logged) > 0 &&
    Number(form.progress_logged) >= 0 &&
    Number(form.progress_logged) <= 100 &&
    form.notes.trim().length > 0
  );
});

function resetForm(task: Task | null) {
  form.hours_logged = 1.0;
  form.progress_logged = task ? Number(task.progress) || 0 : 0;
  form.status = getStatusFromProgress(form.progress_logged);
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

  const finalStatus = computedStatus.value;

  emit('save', {
    hours_logged: Number(form.hours_logged),
    progress_logged: Math.min(Math.max(Number(form.progress_logged), 0), 100),
    status: finalStatus,
    notes: form.notes.trim(),
    blockers: (form.blockers ?? '').trim() || null,
    log_date: form.log_date,
  });

  emit('update:modelValue', false);
}
</script>
