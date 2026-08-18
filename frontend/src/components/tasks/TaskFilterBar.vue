<template>
  <q-card
    flat
    bordered
    class="dashboard-card q-mb-md"
  >
    <q-card-section>

      <!-- Status filters -->
      <div class="chip-row">
        <q-chip
          v-for="opt in statusOptions"
          :key="opt.value ?? 'all'"
          clickable
          square
          :color="status === opt.value ? 'primary' : 'grey-3'"
          :text-color="status === opt.value ? 'white' : 'grey-8'"
          :label="opt.label"
          @click="updateStatus(opt.value)"
        />
      </div>

      <!-- Search + dropdown filters -->
      <div class="row items-center q-col-gutter-md q-mt-sm">

        <!-- Search -->
        <div class="col-12 col-md-4">
          <q-input
            :model-value="search"
            outlined
            dense
            clearable
            label="Search tasks"
            placeholder="Task or project"
            @update:model-value="updateSearch"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Project -->
        <div class="col-6 col-md-3">
          <q-select
            :model-value="project"
            outlined
            dense
            clearable
            label="Project"
            :options="projectOptions"
            @update:model-value="updateProject"
          />
        </div>

        <!-- Priority -->
        <div class="col-6 col-md-3">
          <q-select
            :model-value="priority"
            outlined
            dense
            clearable
            label="Priority"
            :options="priorityOptions"
            @update:model-value="updatePriority"
          />
        </div>

        <!-- Clear -->
        <div class="col-12 col-md-2 text-right">
          <q-btn
            flat
            no-caps
            color="grey-7"
            icon="refresh"
            label="Clear"
            @click="emit('clear')"
          />
        </div>

      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { TaskPriority } from '@/components/tasks/task-types'

export type StatusFilter =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'DELAYED'
  | null

defineProps<{
  search: string
  status: StatusFilter
  project: string | null
  projectOptions: string[]
  priority: string | null
  priorityOptions: string[]
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:status', value: StatusFilter): void
  (e: 'update:project', value: string | null): void
  (e: 'update:priority', value: TaskPriority | null): void
  (e: 'clear'): void
}>()

const statusOptions: {
  label: string
  value: StatusFilter
}[] = [
  {
    label: 'All',
    value: null
  },
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
  },
  {
    label: 'Delayed',
    value: 'DELAYED'
  }
]

function updateSearch(value: string | number | null) {
  emit(
    'update:search',
    value == null ? '' : String(value)
  )
}

function updateStatus(value: StatusFilter) {
  emit('update:status', value)
}

function updateProject(value: string | null) {
  emit('update:project', value)
}

function updatePriority(value: TaskPriority | null) {
  emit('update:priority', value)
}

</script>

<style scoped lang="scss">
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
