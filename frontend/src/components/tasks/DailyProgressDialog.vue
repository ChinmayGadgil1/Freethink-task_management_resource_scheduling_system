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
            <q-input
              v-model="form.log_date"
              label="Date *"
              outlined
              dense
              mask="####-##-##"
              :dark="$q.dark.isActive"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer text-primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.log_date" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.hours_logged"
              type="number"
              min="0"
              max="16"
              step="0.1"
              label="Hours Worked * (max 16h)"
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

          <!-- Effort Budget Status & Overrun Warning -->
          <div v-if="expectedEffort > 0" class="col-12">
            <div
              class="effort-info-box q-pa-sm rounded-borders"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'"
            >
              <div class="row items-center justify-between text-caption">
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-grey-6">Budget:</span>
                  <span class="text-weight-bold">{{ expectedEffort }}h</span>
                  <span class="text-grey-5">·</span>
                  <span class="text-grey-6">Logged:</span>
                  <span class="text-weight-bold">{{ currentActualEffort }}h</span>
                  <span class="text-grey-5">·</span>
                  <span class="text-grey-6">Total After:</span>
                  <span
                    class="text-weight-bold"
                    :class="isOverrun ? 'text-warning' : 'text-primary'"
                  >
                    {{ totalEffortAfterLog }}h
                  </span>
                </div>
                <div
                  v-if="suggestedProgress !== null && suggestedProgress !== form.progress_logged"
                >
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="xs"
                    color="primary"
                    icon="auto_awesome"
                    :label="`Suggest ${suggestedProgress}%`"
                    @click="form.progress_logged = suggestedProgress"
                  >
                    <q-tooltip
                      >Set progress to {{ suggestedProgress }}% based on cumulative
                      effort</q-tooltip
                    >
                  </q-btn>
                </div>
              </div>

              <!-- Overrun banner -->
              <div
                v-if="isOverrun"
                class="row items-center q-mt-xs q-pa-xs rounded-borders text-caption text-weight-medium"
                :class="$q.dark.isActive ? 'bg-amber-10 text-amber-1' : 'bg-amber-1 text-amber-10'"
                style="border: 1px solid rgba(245, 158, 11, 0.3)"
              >
                <q-icon name="warning" size="16px" class="q-mr-xs text-warning" />
                <span>
                  Effort Overrun: Total effort ({{ totalEffortAfterLog }}h) exceeds budget ({{
                    expectedEffort
                  }}h) by {{ overrunHours }}h while progress is {{ form.progress_logged }}%.
                </span>
              </div>
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

          <!--
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
          -->
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
  resourceProgress?: number | null;
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

const expectedEffort = computed(() => {
  if (!props.task) return 0;
  const val = Number(props.task.expected_effort);
  return isNaN(val) ? 0 : val;
});

const currentActualEffort = computed(() => {
  if (!props.task) return 0;
  const val = Number(props.task.actual_effort);
  return isNaN(val) ? 0 : val;
});

const totalEffortAfterLog = computed(() => {
  const h = Number(form.hours_logged) || 0;
  return Number((currentActualEffort.value + h).toFixed(2));
});

const isOverrun = computed(() => {
  return (
    expectedEffort.value > 0 &&
    totalEffortAfterLog.value > expectedEffort.value &&
    Number(form.progress_logged) < 100
  );
});

const overrunHours = computed(() => {
  if (!isOverrun.value) return '0';
  return Number((totalEffortAfterLog.value - expectedEffort.value).toFixed(2)).toString();
});

const suggestedProgress = computed(() => {
  if (expectedEffort.value <= 0) return null;
  const ratio = Math.round((totalEffortAfterLog.value / expectedEffort.value) * 100);
  return Math.min(100, Math.max(0, ratio));
});

const hoursError = computed(() => {
  const h = Number(form.hours_logged);
  if (isNaN(h) || h <= 0) {
    return 'Hours must be greater than 0';
  }
  if (h > 16) {
    return 'A single work log cannot exceed 16 hours';
  }
  return null;
});

const canSubmit = computed(() => {
  return (
    props.task !== null &&
    !hoursError.value &&
    form.log_date !== '' &&
    Number(form.hours_logged) > 0 &&
    Number(form.hours_logged) <= 16 &&
    Number(form.progress_logged) >= 0 &&
    Number(form.progress_logged) <= 100 &&
    form.notes.trim().length > 0
  );
});

function resetForm(task: Task | null) {
  form.hours_logged = 1.0;
  if (props.resourceProgress !== undefined && props.resourceProgress !== null) {
    form.progress_logged = Number(props.resourceProgress);
  } else {
    form.progress_logged = task ? Number(task.progress) || 0 : 0;
  }
  form.status = getStatusFromProgress(form.progress_logged);
  form.notes = '';
  form.blockers = '';
  form.log_date = createToday();
}

watch(
  () => [props.task, props.modelValue, props.resourceProgress] as const,
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

<style scoped>
.effort-info-box {
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
