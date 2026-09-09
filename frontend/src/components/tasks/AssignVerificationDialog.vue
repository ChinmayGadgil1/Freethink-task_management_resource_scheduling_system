<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)">
    <q-card class="dialog-card" :dark="$q.dark.isActive" style="width: 520px; max-width: 95vw">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center gap-xs">
          <q-avatar size="32px" color="primary" text-color="white" icon="verified"> </q-avatar>
          <div>
            <div
              class="text-subtitle1 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              Assign for Verification
            </div>
            <div v-if="task" class="text-caption text-grey-6 ellipsis" style="max-width: 380px">
              {{ task.title }} · {{ task.project_name || `Project #${task.project_id}` }}
            </div>
          </div>
        </div>
        <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
      </q-card-section>

      <q-separator class="q-my-sm" />

      <q-card-section class="column q-gutter-y-md q-pt-sm">
        <q-banner
          dense
          rounded
          :class="$q.dark.isActive ? 'bg-grey-9 text-grey-3' : 'bg-purple-1 text-primary'"
        >
          <template #avatar>
            <q-icon name="fact_check" color="primary" />
          </template>
          Assign an independent peer resource to review and verify deliverables for this completed task.
          Original task assignees cannot verify their own work.
        </q-banner>

        <!-- Select Verifier -->
        <div>
          <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">Assigned Verifier *</div>
          <q-select
            v-model="form.verifier_id"
            outlined
            dense
            emit-value
            map-options
            option-value="value"
            option-label="label"
            :options="memberOptions"
            placeholder="Select an independent resource to verify deliverables"
            :loading="loadingMembers"
            no-options-label="No eligible peer resources available"
            :rules="[(val) => !!val || 'Please select a resource for verification']"
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-avatar size="24px" color="primary" text-color="white">
                    {{ opt.label?.charAt(0).toUpperCase() }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                  <q-item-label v-if="opt.email" caption>{{ opt.email }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <div
            v-if="!loadingMembers && memberOptions.length === 0"
            class="text-caption text-negative q-mt-xs"
          >
            No other peer resources are available for verification (original task assignees cannot verify their own work).
          </div>
        </div>

        <!-- Estimated Effort -->
        <div>
          <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
            Estimated Review Time (Hours) *
          </div>
          <q-input
            v-model.number="form.expected_effort"
            outlined
            dense
            type="number"
            min="0.5"
            step="0.5"
            placeholder="e.g. 2.0"
            :rules="[(val) => Number(val) > 0 || 'Effort must be positive']"
          />
        </div>

        <!-- Verification Notes / Criteria -->
        <div>
          <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
            Verification Instructions / Acceptance Criteria (Optional)
          </div>
          <q-input
            v-model="form.notes"
            outlined
            type="textarea"
            rows="3"
            placeholder="e.g. Please check test coverage, API responses, and PR documentation..."
          />
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
          unelevated
          no-caps
          color="primary"
          icon="verified"
          label="Assign Verifier"
          class="action-btn-primary"
          :loading="submitting"
          :disable="!form.verifier_id || Number(form.expected_effort) <= 0"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  assignTaskVerificationApi,
  getResourcesApi,
  type Task,
  type TaskVerificationInfo,
  type ResourceUser,
} from '@/services/api';

const props = defineProps<{
  modelValue: boolean;
  task: Task | null;
  projectMembers?: Array<{ user_id: number; name: string; email?: string; role?: string }>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'saved', payload: { taskId: number; verificationTask?: Task | TaskVerificationInfo }): void;
}>();

const $q = useQuasar();

const form = reactive<{
  verifier_id: number | null;
  expected_effort: number;
  notes: string;
}>({
  verifier_id: null,
  expected_effort: 2.0,
  notes: '',
});

const submitting = ref(false);
const loadingMembers = ref(false);
const fetchedResources = ref<
  Array<{ user_id: number; name: string; email?: string; role?: string }>
>([]);

async function loadResources() {
  if (props.projectMembers && props.projectMembers.length > 0) {
    return;
  }
  loadingMembers.value = true;
  try {
    const all = await getResourcesApi();
    fetchedResources.value = (all || []).map((r: ResourceUser) => ({
      user_id: Number(r.user_id),
      name: r.name,
      email: r.email,
      role: r.role,
    }));
  } catch (err: unknown) {
    console.error('Failed to load resources for verification dropdown:', err);
  } finally {
    loadingMembers.value = false;
  }
}

const originalAssigneeIds = computed<number[]>(() => {
  if (!props.task) return [];
  const ids = new Set<number>();
  if (props.task.assigned_resource_ids && Array.isArray(props.task.assigned_resource_ids)) {
    props.task.assigned_resource_ids.forEach((id) => ids.add(Number(id)));
  }
  if (props.task.assigned_resources && Array.isArray(props.task.assigned_resources)) {
    props.task.assigned_resources.forEach((r) => ids.add(Number(r.user_id)));
  }
  if ((props.task as unknown as { assigned_to?: number }).assigned_to) {
    ids.add(Number((props.task as unknown as { assigned_to?: number }).assigned_to));
  }
  return Array.from(ids);
});

const memberOptions = computed(() => {
  const list =
    props.projectMembers && props.projectMembers.length > 0
      ? props.projectMembers
      : fetchedResources.value;

  return list
    .filter((m) => !m.role || m.role.toUpperCase() === 'RESOURCE')
    .filter((m) => !originalAssigneeIds.value.includes(Number(m.user_id)))
    .map((m) => ({
      label: m.name,
      value: Number(m.user_id),
      email: m.email,
    }));
});

watch(
  () => [props.modelValue, props.task] as const,
  ([isOpen]) => {
    if (isOpen) {
      form.verifier_id = null;
      form.expected_effort = 2.0;
      form.notes = '';
      void loadResources();
    }
  },
  { immediate: true },
);

async function submit() {
  if (!props.task || !form.verifier_id) return;
  submitting.value = true;
  try {
    const res = await assignTaskVerificationApi(props.task.task_id, {
      verifier_id: form.verifier_id,
      notes: form.notes,
      expected_effort: form.expected_effort,
    });

    $q.notify({
      type: 'positive',
      message: 'Verification task assigned successfully!',
      icon: 'verified',
    });

    emit('saved', {
      taskId: props.task.task_id,
      verificationTask: res.verification_task,
    });
    emit('update:modelValue', false);
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to assign verification task',
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.gap-xs {
  gap: 8px;
}
</style>
