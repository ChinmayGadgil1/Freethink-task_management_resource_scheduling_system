<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card style="width: 480px; max-width: 95vw">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1 text-weight-bold">Update Progress</div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>
      <q-separator />

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="handleSubmit">
          <q-select
            v-model="form.taskId"
            :options="taskOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Task"
            :rules="[(v) => !!v || 'Select a task']"
          />

          <div>
            <div class="row justify-between q-mb-xs">
              <span class="text-caption text-grey-7">Progress</span>
              <span class="text-caption text-weight-medium text-primary">{{ form.progress }}%</span>
            </div>
            <q-slider v-model="form.progress" :min="0" :max="100" :step="5" color="primary" label />
          </div>

          <q-input
            v-model.number="form.hoursWorked"
            outlined
            dense
            type="number"
            min="0"
            step="0.5"
            label="Hours worked today"
          />

          <q-select
            v-model="form.status"
            :options="statusOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Status"
          />

          <q-input
            v-model="form.workDetails"
            outlined
            type="textarea"
            autogrow
            rows="3"
            label="Work details"
            placeholder="What did you work on?"
          />

          <q-input
            v-model="form.blocker"
            outlined
            type="textarea"
            autogrow
            rows="2"
            label="Blocker / Issue (optional)"
          />

          <q-banner v-if="errorMsg" class="bg-negative text-white" dense rounded>{{ errorMsg }}</q-banner>

          <div class="row justify-end q-gutter-sm">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn unelevated no-caps label="Save Update" color="primary" type="submit" :loading="saving" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { updateTaskApi, type Task } from '@/services/api';
//import { useProgressHistory } from '@/composables/useProgressHistory';

const props = defineProps<{ modelValue: boolean; tasks: Task[] }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', task: Task): void;
}>();

//const { addEntry } = useProgressHistory();

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
] as const;

const taskOptions = computed(() =>
  props.tasks.map((t) => ({
    label: `${t.title} · ${t.project_name || `Project #${t.project_id}`}`,
    value: t.task_id,
  })),
);

const form = reactive({
  taskId: null as number | null,
  progress: 0,
  hoursWorked: 0,
  status: 'IN_PROGRESS' as Task['status'],
  workDetails: '',
  blocker: '',
});

const saving = ref(false);
const errorMsg = ref('');

watch(
  () => form.taskId,
  (id) => {
    const task = props.tasks.find((t) => t.task_id === id);
    if (task) {
      form.progress = Number(task.progress) || 0;
      form.status = task.status;
    }
  },
);

async function handleSubmit() {
  if (!form.taskId) return;
  const task = props.tasks.find((t) => t.task_id === form.taskId);
  if (!task) return;

  saving.value = true;
  errorMsg.value = '';
  try {
    // Status, progress and actual_effort are real backend fields — persist
    // them through the existing task API.
    const updated = await updateTaskApi(task.task_id, {
      status: form.status,
      progress: form.progress,
      actual_effort: (Number(task.actual_effort) || 0) + (Number(form.hoursWorked) || 0),
    });

    // Work details / blockers have no backend field yet — keep them as a
    // local progress-history entry until that API exists.
    /*addEntry({
      taskId: task.task_id,
      taskTitle: task.title,
      projectName: task.project_name || `Project #${task.project_id}`,
      progress: form.progress,
      hoursWorked: form.hoursWorked,
      status: form.status,
      workDetails: form.workDetails.trim(),
      blocker: form.blocker.trim(),
    });*/

    emit('saved', updated);
    emit('update:modelValue', false);
    form.taskId = null;
    form.progress = 0;
    form.hoursWorked = 0;
    form.status = 'IN_PROGRESS';
    form.workDetails = '';
    form.blocker = '';
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to save update.';
  } finally {
    saving.value = false;
  }
}
</script>
