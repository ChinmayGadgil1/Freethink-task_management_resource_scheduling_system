<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Edit Task</div>

          <div v-if="task" class="text-caption text-grey-6">
            {{ task.name }} · {{ task.project }}
          </div>
        </div>

        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="task">
        <div v-if="!isSelf" class="q-mb-md">
          <q-banner dense rounded class="bg-amber-1 text-amber-10">
            <template #avatar>
              <q-icon name="lock" color="amber-9" />
            </template>
            Only self-assigned tasks can be edited. This task was assigned by a project manager.
          </q-banner>
        </div>

        <div class="field-label">Expected Hours (hrs) *</div>

        <q-input
          v-model.number="form.estimatedHours"
          outlined
          dense
          type="number"
          min="0"
          step="0.5"
          :disable="!isSelf"
          placeholder="e.g. 8"
        />

        <div class="field-label q-mt-md">Task Description</div>

        <q-input
          v-model="form.description"
          outlined
          type="textarea"
          autogrow
          rows="3"
          :disable="!isSelf"
          placeholder="Add or edit task description..."
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />

        <q-btn
          unelevated
          no-caps
          label="Save Changes"
          color="primary"
          :disable="!isSelf || Number(form.estimatedHours) <= 0"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { ResourceTask } from '@/components/tasks/task-types';

const props = defineProps<{
  modelValue: boolean;
  task: ResourceTask | null;
  isSelfAssigned?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'save',
    payload: {
      id: number;
      expected_effort: number;
      description: string;
    },
  ): void;
}>();

const authStore = useAuthStore();

type UserLike = { user_id?: number | string; id?: number | string; userId?: number | string };
type TaskLike = {
  created_by?: number | string;
  createdBy?: number | string;
  created_by_id?: number | string;
  isSelfAssigned?: boolean;
};

const isSelf = computed(() => {
  if (props.isSelfAssigned !== undefined) {
    return props.isSelfAssigned;
  }
  if (props.task?.isSelfAssigned !== undefined) {
    return props.task.isSelfAssigned;
  }
  const u = (authStore.user || authStore.currentUser) as UserLike | null;
  let currentUserId = u ? Number(u.user_id ?? u.id ?? u.userId) : null;
  if (!currentUserId) {
    try {
      const rawAuth = sessionStorage.getItem('auth');
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth) as { user?: UserLike };
        currentUserId = Number(
          parsed?.user?.user_id ?? parsed?.user?.id ?? parsed?.user?.userId,
        );
      }
    } catch {
      // ignore
    }
  }

  const t = props.task as TaskLike | null;
  const taskCreatedBy = t ? Number(t.created_by ?? t.createdBy ?? t.created_by_id) : null;

  if (currentUserId && taskCreatedBy && currentUserId === taskCreatedBy) {
    return true;
  }

  return false;
});

const form = reactive<{
  estimatedHours: number;
  description: string;
}>({
  estimatedHours: 0,
  description: '',
});

watch(
  () => [props.task, props.modelValue] as const,
  ([task, modelValue]) => {
    if (!modelValue || !task) return;

    form.estimatedHours = Number(task.estimatedHours) || 0;
    form.description = task.description || '';
  },
  { immediate: true },
);

function save() {
  if (!props.task || !isSelf.value) return;

  emit('save', {
    id: props.task.id,
    expected_effort: Math.max(Number(form.estimatedHours), 0),
    description: form.description.trim(),
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
</style>
