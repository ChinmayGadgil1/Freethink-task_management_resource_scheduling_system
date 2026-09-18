<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <q-card style="width: 560px; max-width: 95vw" :dark="$q.dark.isActive">
      <!-- HEADER -->
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <div class="text-subtitle1 text-weight-bold row items-center gap-xs">
            <q-icon name="history_edu" color="primary" size="22px" />
            <span>Add Work Log</span>
          </div>
          <div v-if="task" class="text-caption text-grey-6 q-mt-xs">
            {{ task.title }} · {{ task.project_name || `Project #${task.project_id}` }}
          </div>
        </div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-separator />

      <!-- BODY -->
      <q-card-section v-if="task" class="q-gutter-y-md">
        <!-- Date & Scheduled context -->
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.log_date"
              type="date"
              label="Work Date *"
              outlined
              dense
              :dark="$q.dark.isActive"
            />
          </div>
          <div class="col-12 col-sm-6">
            <div
              class="scheduled-info-box q-pa-sm rounded-borders"
              :class="$q.dark.isActive ? 'bg-grey-9 text-grey-3' : 'bg-grey-2 text-grey-8'"
            >
              <div class="text-caption text-weight-medium">Scheduled Today:</div>
              <div class="text-subtitle2 text-weight-bold text-primary">
                {{ formatHours((task as any).scheduled_hours) }} hrs
              </div>
            </div>
          </div>
        </div>

        <!-- Hours Worked (0.5-hour precision enforced) -->
        <div>
          <div class="row items-center justify-between q-mb-xs">
            <div
              class="text-caption text-weight-bold"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
            >
              Hours Worked * (0.5 hr steps)
            </div>
            <span v-if="hoursValidationError" class="text-caption text-negative text-weight-medium">
              {{ hoursValidationError }}
            </span>
          </div>
          <q-input
            v-model.number="form.hours_logged"
            type="number"
            min="0.5"
            step="0.5"
            placeholder="e.g. 1.0, 1.5, 2.0"
            outlined
            dense
            :dark="$q.dark.isActive"
            :error="!!hoursValidationError"
            :error-message="hoursValidationError || undefined"
          >
            <template #prepend>
              <q-icon name="schedule" size="18px" />
            </template>
          </q-input>

          <!-- Quick Hour Presets -->
          <div class="row items-center gap-xs q-mt-xs">
            <span class="text-caption text-grey-6 q-mr-xs">Quick set:</span>
            <q-btn
              v-for="preset in [0.5, 1, 1.5, 2, 4, 6, 8]"
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

        <!-- Progress Percentage & Status Tag -->
        <div>
          <div class="row items-center justify-between q-mb-xs">
            <div
              class="text-caption text-weight-bold"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
            >
              Task Progress:
              <span class="text-primary text-weight-bold">{{ form.progress_logged }}%</span>
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

        <!-- Description of Work (Notes) -->
        <div>
          <q-input
            v-model="form.notes"
            type="textarea"
            label="Description of Work *"
            placeholder="Describe what was accomplished, milestones completed, or items tested..."
            outlined
            dense
            rows="3"
            :dark="$q.dark.isActive"
            :rules="[(val) => (val && val.trim().length > 0) || 'Work description is required']"
          />
        </div>

        <!-- Blockers (Optional) -->
        <div>
          <q-input
            v-model="form.blockers"
            type="textarea"
            label="Blockers or Impediments (optional)"
            placeholder="Any blockers, dependencies pending, or technical hurdles..."
            outlined
            dense
            rows="2"
            :dark="$q.dark.isActive"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
        <q-btn
          unelevated
          no-caps
          icon="check"
          label="Save Work Log"
          color="primary"
          :loading="saving"
          :disable="!canSubmit || saving"
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

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    task: Task | null;
    defaultDate?: string;
    saving?: boolean;
  }>(),
  {
    defaultDate: '',
    saving: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: CreateWorkLogPayload): void;
}>();

function createToday() {
  return new Date().toISOString().split('T')[0] ?? '';
}

const form = reactive<CreateWorkLogPayload>({
  hours_logged: 1.0,
  progress_logged: 0,
  status: 'SCHEDULED',
  notes: '',
  blockers: '',
  log_date: createToday(),
});

const computedStatus = computed(() => {
  return getStatusFromProgress(form.progress_logged);
});

const hoursValidationError = computed(() => {
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
    !hoursValidationError.value &&
    form.log_date !== '' &&
    Number(form.hours_logged) > 0 &&
    Number(form.progress_logged) >= 0 &&
    Number(form.progress_logged) <= 100 &&
    form.notes.trim().length > 0
  );
});

function formatHours(val: unknown): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0';
  return parseFloat(Number(val).toFixed(2)).toString();
}

function resetForm(task: Task | null) {
  const scheduledHours = (task)
    ?.scheduled_hours;
  form.hours_logged = scheduledHours && Number(scheduledHours) > 0 ? Number(scheduledHours) : 1.0;
  // Ensure default is aligned to 0.5
  if (Math.round(form.hours_logged * 10) % 5 !== 0) {
    form.hours_logged = Math.round(form.hours_logged * 2) / 2 || 0.5;
  }

  form.progress_logged = task ? Number(task.progress) || 0 : 0;
  form.status = getStatusFromProgress(form.progress_logged);
  form.notes = '';
  form.blockers = '';
  form.log_date = props.defaultDate || createToday();
}

watch(
  () => [props.task, props.modelValue, props.defaultDate] as const,
  ([task, modelValue, defaultDate]) => {
    if (!modelValue) return;
    resetForm(task);
    if (defaultDate) {
      form.log_date = defaultDate;
    }
  },
  { immediate: true },
);

function save() {
  if (!props.task || !canSubmit.value) return;

  emit('save', {
    hours_logged: Number(form.hours_logged),
    progress_logged: Math.min(Math.max(Number(form.progress_logged), 0), 100),
    status: computedStatus.value,
    notes: form.notes.trim(),
    blockers: (form.blockers ?? '').trim() || null,
    log_date: form.log_date,
  });
}
</script>

<style scoped>
.scheduled-info-box {
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
