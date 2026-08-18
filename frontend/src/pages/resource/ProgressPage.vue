<template>
  <q-page class="q-pa-lg bg-grey-1">

    <!-- Header -->
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">
        Progress
      </div>

      <div class="text-body2 text-grey-6 q-mt-xs">
        Track your task progress, effort and deadlines across projects.
      </div>
    </div>

    <!-- Summary -->
    <div class="row q-col-gutter-md q-mb-lg">

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-6">Overall Progress</div>
            <div class="text-h4 text-weight-bold text-primary">
              {{ overallProgress }}%
            </div>

            <q-linear-progress
              :value="overallProgress / 100"
              color="primary"
              rounded
              size="8px"
              class="q-mt-sm"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-6">Hours Worked</div>
            <div class="text-h4 text-weight-bold">
              {{ hoursWorked }}h
            </div>
            <div class="text-caption text-grey-6">
              of {{ expectedHours }}h estimated
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-6">Completed</div>
            <div class="text-h4 text-weight-bold text-positive">
              {{ completedTasks }}
            </div>
            <div class="text-caption text-grey-6">
              of {{ tasks.length }} tasks
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-6">Remaining Effort</div>
            <div class="text-h4 text-weight-bold">
              {{ remainingHours }}h
            </div>
            <div
              class="text-caption"
              :class="delayedTasks ? 'text-negative' : 'text-positive'"
            >
              {{ delayedTasks }} delayed
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Status + Effort -->
    <div class="row q-col-gutter-md q-mb-lg">

      <!-- Status -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="full-height">

          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">
              Task Status
            </div>
            <div class="text-caption text-grey-6">
              Current distribution of your assigned tasks.
            </div>
          </q-card-section>

          <q-separator />

          <q-list separator>

            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Completed</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge color="positive">
                  {{ completedTasks }}
                </q-badge>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="autorenew" color="blue" />
              </q-item-section>

              <q-item-section>
                <q-item-label>In Progress</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge color="blue">
                  {{ inProgressTasks }}
                </q-badge>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="schedule" color="grey-7" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Pending</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge color="grey-7">
                  {{ pendingTasks }}
                </q-badge>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="pause_circle" color="orange" />
              </q-item-section>

              <q-item-section>
                <q-item-label>On Hold</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge color="orange">
                  {{ onHoldTasks }}
                </q-badge>
              </q-item-section>
            </q-item>

          </q-list>

        </q-card>
      </div>

      <!-- Effort -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="full-height">

          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">
              Effort Overview
            </div>

            <div class="text-caption text-grey-6">
              Actual effort compared with estimated effort.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>

            <div class="row q-col-gutter-md">

              <div class="col-6">
                <q-card flat class="bg-grey-2">
                  <q-card-section>
                    <div class="text-caption text-grey-6">
                      Estimated
                    </div>
                    <div class="text-h5 text-weight-bold">
                      {{ expectedHours }}h
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6">
                <q-card flat class="bg-grey-2">
                  <q-card-section>
                    <div class="text-caption text-grey-6">
                      Actual
                    </div>
                    <div class="text-h5 text-weight-bold">
                      {{ hoursWorked }}h
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12">
                <div class="row justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">
                    Effort consumed
                  </span>

                  <span class="text-caption text-weight-medium">
                    {{ effortPercentage }}%
                  </span>
                </div>

                <q-linear-progress
                  :value="effortPercentage / 100"
                  color="primary"
                  rounded
                  size="10px"
                />
              </div>

            </div>

          </q-card-section>

        </q-card>
      </div>

    </div>

    <!-- Task Progress -->
    <q-card flat bordered>

      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">
            Task Progress
          </div>

          <div class="text-caption text-grey-6">
            Progress of each assigned task.
          </div>
        </div>

        <q-badge color="primary">
          {{ tasks.length }} tasks
        </q-badge>
      </q-card-section>

      <q-separator />

      <q-list separator>

        <q-item
          v-for="task in tasks"
          :key="task.task_id"
          clickable
          @click="openTask(task.task_id)"
        >

          <q-item-section>

            <q-item-label class="text-weight-medium">
              {{ task.title }}
            </q-item-label>

            <q-item-label caption>
              {{ task.project_name || `Project #${task.project_id}` }}
            </q-item-label>

          </q-item-section>

          <q-item-section side class="gt-xs">
            <q-badge
              :color="priorityColor(task.priority)"
              :label="task.priority"
            />
          </q-item-section>

          <q-item-section class="col-4 gt-sm">

            <div class="row items-center no-wrap">
              <q-linear-progress
                :value="Number(task.progress || 0) / 100"
                color="primary"
                rounded
                class="col"
              />

              <span class="text-caption text-weight-medium q-ml-sm">
                {{ Number(task.progress || 0) }}%
              </span>
            </div>

          </q-item-section>

          <q-item-section side>
            <q-badge
              :color="statusColor(task.status)"
              :label="statusLabel(task.status)"
            />
          </q-item-section>

          <q-item-section side>
            <q-btn
              flat
              round
              dense
              icon="chevron_right"
              color="grey-7"
            />
          </q-item-section>

        </q-item>

        <q-item v-if="!tasks.length">
          <q-item-section class="text-center text-grey-6 q-pa-lg">
            No tasks assigned to you.
          </q-item-section>
        </q-item>

      </q-list>

    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  getTasksApi,
  type Task
} from '@/services/api'

const router = useRouter()
const tasks = ref<Task[]>([])

const today = new Date()
today.setHours(0, 0, 0, 0)

const completedTasks = computed(() =>
  tasks.value.filter(t => t.status === 'COMPLETED').length
)

const inProgressTasks = computed(() =>
  tasks.value.filter(t => t.status === 'IN_PROGRESS').length
)

const pendingTasks = computed(() =>
  tasks.value.filter(t => t.status === 'PENDING').length
)

const onHoldTasks = computed(() =>
  tasks.value.filter(t => t.status === 'ON_HOLD').length
)

const delayedTasks = computed(() =>
  tasks.value.filter(t =>
    t.status !== 'COMPLETED' &&
    t.deadline &&
    new Date(t.deadline) < today
  ).length
)

const overallProgress = computed(() => {
  if (!tasks.value.length) return 0

  return Math.round(
    tasks.value.reduce(
      (sum, task) => sum + Number(task.progress || 0),
      0
    ) / tasks.value.length
  )
})

const expectedHours = computed(() =>
  tasks.value.reduce(
    (sum, task) => sum + Number(task.expected_effort || 0),
    0
  )
)

const hoursWorked = computed(() =>
  tasks.value.reduce(
    (sum, task) => sum + Number(task.actual_effort || 0),
    0
  )
)

const remainingHours = computed(() =>
  Math.max(expectedHours.value - hoursWorked.value, 0)
)

const effortPercentage = computed(() => {
  if (!expectedHours.value) return 0

  return Math.min(
    Math.round(
      (hoursWorked.value / expectedHours.value) * 100
    ),
    100
  )
})

function statusLabel(status: Task['status']) {
  const labels: Record<Task['status'], string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold'
  }

  return labels[status]
}

function statusColor(status: Task['status']) {
  const colors: Record<Task['status'], string> = {
    PENDING: 'grey-7',
    IN_PROGRESS: 'blue-7',
    COMPLETED: 'positive',
    ON_HOLD: 'orange-7'
  }

  return colors[status]
}

function priorityColor(priority: Task['priority']) {
  const colors: Record<Task['priority'], string> = {
    LOW: 'positive',
    MEDIUM: 'orange',
    HIGH: 'deep-orange',
    CRITICAL: 'negative'
  }

  return colors[priority]
}

function openTask(id: number) {
  void router.push(`/app/resource-dashboard/tasks/${id}`)
}

async function loadTasks() {
  try {
    tasks.value = await getTasksApi()
  } catch (error) {
    console.error('Failed to load progress:', error)
    tasks.value = []
  }
}

onMounted(() => {
  void loadTasks()
})
</script>
