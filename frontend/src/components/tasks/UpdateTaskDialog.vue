<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="updateDialog"
  >
    <q-card
      style="width: 520px; max-width: 95vw"
      class="dashboard-card"
    >

      <!-- Header -->
      <q-card-section class="row items-center justify-between">

        <div>

          <div class="text-subtitle1 text-weight-bold">
            Update Task
          </div>

          <div
            v-if="task"
            class="text-caption text-grey-6 q-mt-xs"
          >
            {{ task.name }} · {{ task.project }}
          </div>

        </div>

        <q-btn
          v-close-popup
          flat
          round
          dense
          icon="close"
          color="grey-7"
        />

      </q-card-section>

      <q-separator />


      <!-- Form -->
      <q-card-section v-if="task">

        <!-- Status -->
        <div class="field-label">
          Status
        </div>

        <div class="status-choice">

          <q-btn
            v-for="opt in statusOptions"
            :key="opt.value"
            no-caps
            unelevated
            :color="
              form.status === opt.value
                ? 'primary'
                : 'grey-2'
            "
            :text-color="
              form.status === opt.value
                ? 'white'
                : 'grey-8'
            "
            :label="opt.label"
            class="status-choice-btn"
            @click="form.status = opt.value"
          />

        </div>


        <!-- Progress -->
        <div class="field-label q-mt-lg">

          Progress

          <span class="text-weight-bold text-primary">
            {{ form.progress }}%
          </span>

        </div>

        <q-slider
          v-model="form.progress"
          :min="0"
          :max="100"
          :step="5"
          color="primary"
          label
        />


        <!-- Hours -->
        <div class="field-label q-mt-md">
          Hours worked today
        </div>

        <q-input
          v-model.number="form.hoursWorked"
          outlined
          dense
          type="number"
          min="0"
          step="0.5"
        />


        <!-- Work update -->
        <div class="field-label q-mt-md">
          Work update
        </div>

        <q-input
          v-model="form.workUpdate"
          outlined
          type="textarea"
          autogrow
          rows="3"
          placeholder="What did you work on today?"
        />

      </q-card-section>


      <q-separator />


      <!-- Actions -->
      <q-card-actions
        align="right"
        class="q-pa-md"
      >

        <q-btn
          v-close-popup
          flat
          no-caps
          label="Cancel"
          color="grey-7"
        />

        <q-btn
          unelevated
          no-caps
          label="Save Update"
          color="primary"
          @click="save"
        />

      </q-card-actions>

    </q-card>
  </q-dialog>
</template>


<script setup lang="ts">
import { reactive, watch } from 'vue'
import type {
  ResourceTask,
  TaskStatus
} from '@/components/tasks/task-types'


const props = defineProps<{
  modelValue: boolean
  task: ResourceTask | null
}>()


const emit = defineEmits<{
  (
    e: 'update:modelValue',
    value: boolean
  ): void

  (
    e: 'save',
    payload: {
      id: number
      status: TaskStatus
      progress: number
      hoursWorked: number
      workUpdate: string
    }
  ): void
}>()


const statusOptions: {
  label: string
  value: TaskStatus
}[] = [
  {
    label: 'To Do',
    value: 'TODO'
  },
  {
    label: 'In Progress',
    value: 'IN_PROGRESS'
  },
  {
    label: 'Partially Completed',
    value: 'PARTIALLY_COMPLETED'
  },
  {
    label: 'Completed',
    value: 'COMPLETED'
  }
]


const form = reactive<{
  status: TaskStatus
  progress: number
  hoursWorked: number
  workUpdate: string
}>({
  status: 'TODO',
  progress: 0,
  hoursWorked: 0,
  workUpdate: ''
})


watch(
  () => props.task,

  task => {

    if (!task) {
      return
    }

    form.status = task.status
    form.progress = task.progress

    /*
     * Keep the existing total hours as the current
     * static value for now.
     *
     * Backend can later provide today's hours separately.
     */
    form.hoursWorked = task.hoursWorked

    form.workUpdate = ''

  },

  {
    immediate: true
  }
)


function updateDialog(value: boolean) {
  emit('update:modelValue', value)
}


function save() {

  if (!props.task) {
    return
  }

  emit('save', {
    id: props.task.id,

    status: form.status,

    progress: Math.min(
      Math.max(form.progress, 0),
      100
    ),

    hoursWorked: Math.max(
      form.hoursWorked,
      0
    ),

    workUpdate:
      form.workUpdate.trim()
  })

  emit(
    'update:modelValue',
    false
  )
}
</script>


<style scoped lang="scss">

.field-label {
  margin-bottom: 8px;

  color:
    var(--wo-text-muted, #667085);

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
