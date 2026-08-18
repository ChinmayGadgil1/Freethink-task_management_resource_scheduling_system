<template>
  <div class="task-item" :class="{ 'is-overdue': overdue }">

    <div class="task-main">
      <div class="row items-center q-gutter-xs">
        <span
          class="priority-pill"
          :class="`priority-${task.priority.toLowerCase()}`"
        >
          {{ task.priority }}
        </span>

        <span
          class="status-pill"
          :class="`status-${task.status.toLowerCase()}`"
        >
          {{ formatStatus(task.status) }}
        </span>

        <span v-if="overdue" class="status-pill status-overdue">
          Overdue
        </span>
      </div>

      <div
        class="task-name q-mt-xs cursor-pointer"
        @click="goToSpecs"
      >
        {{ task.name }}
      </div>

      <div class="task-project">
        {{ task.project }}
      </div>
    </div>

    <div class="task-progress">
      <div class="row items-center no-wrap">
        <q-linear-progress
          :value="task.progress / 100"
          size="7px"
          rounded
          class="col"
          color="primary"
          track-color="grey-3"
        />

        <span class="text-caption text-weight-medium q-ml-sm">
          {{ task.progress }}%
        </span>
      </div>

      <div class="text-caption text-grey-6 q-mt-xs">
        {{ task.hoursWorked }}h logged of
        {{ task.estimatedHours }}h estimated
      </div>
    </div>

    <div class="task-deadline">
      <div class="text-caption text-grey-6">
        Deadline
      </div>

      <div
        class="text-weight-medium"
        :class="{ 'text-negative': overdue }"
      >
        {{ formatDate(task.deadline) }}
      </div>
    </div>

    <div class="task-actions q-gutter-x-xs">
      <q-btn
        outline
        no-caps
        dense
        color="primary"
        label="Specs"
        icon="article"
        @click="goToSpecs"
      />

      <q-btn
        unelevated
        no-caps
        dense
        color="primary"
        label="Update"
        @click="emit('update', task)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ResourceTask } from '@/components/tasks/task-types'
import { computed } from 'vue'

const router = useRouter()

const props = defineProps<{
  task: ResourceTask
}>()

const emit = defineEmits<{
  (e: 'update', task: ResourceTask): void
}>()

function goToSpecs() {
  void router.push(
    `/app/resource-dashboard/task-details/${props.task.id}`
  )
}

const overdue = computed(() => {
  if (props.task.status === 'COMPLETED' || !props.task.deadline) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deadline = new Date(props.task.deadline)
  deadline.setHours(0, 0, 0, 0)

  return deadline < today
})

function formatStatus(status: ResourceTask['status']) {
  const labels: Record<ResourceTask['status'], string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
  }

  return labels[status]
}

function formatDate(date: string | null) {
  if (!date) return 'No deadline'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped lang="scss">
.task-item {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.2fr) 120px auto;
  align-items: center;
  gap: 20px;
  padding: 16px;
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
  transition: background-color 0.15s ease;
}

.task-item:hover {
  background: var(--wo-bg-page, #fafafb);
}

.task-item.is-overdue {
  border-left: 3px solid #e15263;
}

.task-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--wo-text-main, #1d2433);
}

.task-project {
  margin-top: 2px;
  font-size: 11px;
  color: var(--wo-text-subtle, #98a2b3);
}

.task-deadline {
  text-align: right;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

.priority-pill,
.status-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.priority-low {
  background: #eaf7f0;
  color: #27ae60;
}

.priority-medium {
  background: #fff4e8;
  color: #e89532;
}

.priority-high {
  background: #fff0eb;
  color: #e56b45;
}

.priority-critical {
  background: #fdeef0;
  color: #e15263;
}

.status-pending {
  background: #f0f2f5;
  color: #667085;
}

.status-in_progress {
  background: #eaf1fd;
  color: #2e90fa;
}

.status-completed {
  background: #eaf7f0;
  color: #27ae60;
}

.status-on_hold {
  background: #fff4e8;
  color: #e89532;
}

.status-overdue {
  background: #fdeef0;
  color: #e15263;
}

@media (max-width: 900px) {
  .task-item {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .task-deadline {
    text-align: left;
  }

  .task-actions {
    justify-content: flex-start;
  }
}
</style>
