<template>
  <q-page class="q-pa-lg bg-grey-1">

    <!-- Loading -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="45px" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error_outline" size="50px" color="negative" />
      <div class="text-body1 text-grey-7 q-mt-md">{{ error }}</div>

      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        label="Try Again"
        class="q-mt-md"
        @click="loadTasks"
      />
    </div>

    <!-- ALL TASKS -->
    <div v-else-if="!hasTaskId">

      <div class="q-mb-lg">
        <div class="text-h5 text-weight-bold">Task Specs</div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          View details of all your assigned tasks.
        </div>
      </div>

      <q-card flat bordered>
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">
            Assigned Tasks
          </div>

          <q-badge
            color="primary"
            :label="`${tasks.length} tasks`"
          />
        </q-card-section>

        <q-separator />

        <q-list v-if="tasks.length">
          <q-item
            v-for="item in tasks"
            :key="item.task_id"
            clickable
            @click="openTask(item.task_id)"
            class="q-py-md"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{ item.task_id }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ item.title }}
              </q-item-label>

              <q-item-label caption>
                {{ item.project_name || `Project #${item.project_id}` }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <q-badge
                  :color="priorityColor(item.priority)"
                  :label="item.priority"
                />

                <q-badge
                  :color="statusColor(item.status)"
                  :label="statusLabel(item.status)"
                />

                <q-icon name="chevron_right" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="q-pa-xl text-center text-grey-6">
          No tasks assigned to you.
        </div>
      </q-card>

    </div>

    <!-- SINGLE TASK -->
    <div v-else-if="task">

      <!-- Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <q-btn
            flat
            no-caps
            icon="arrow_back"
            label="Back to Task Specs"
            color="grey-7"
            class="q-mb-sm"
            @click="router.push('/app/resource-dashboard/task-details')"
          />

          <div class="text-h5 text-weight-bold">
            {{ task.title }}
          </div>

          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ task.project_name || `Project #${task.project_id}` }}
          </div>
        </div>

        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="edit"
          label="Update Task"
          @click="updateDialog = true"
        />
      </div>

      <div class="row q-col-gutter-md">

        <!-- Main -->
        <div class="col-12 col-md-8">

          <!-- Details -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">
                Task Details
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="text-body1 text-grey-8">
                {{ task.description || 'No description provided.' }}
              </div>

              <div class="row q-col-gutter-md q-mt-lg">

                <div class="col-6 col-md-3">
                  <div class="text-caption text-grey-6 q-mb-xs">
                    Status
                  </div>

                  <q-badge
                    :color="statusColor(task.status)"
                    :label="statusLabel(task.status)"
                  />
                </div>

                <div class="col-6 col-md-3">
                  <div class="text-caption text-grey-6 q-mb-xs">
                    Priority
                  </div>

                  <q-badge
                    :color="priorityColor(task.priority)"
                    :label="task.priority"
                  />
                </div>

                <div class="col-6 col-md-3">
                  <div class="text-caption text-grey-6 q-mb-xs">
                    Start Date
                  </div>

                  <div class="text-weight-medium">
                    {{ formatDate(task.start_date) }}
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="text-caption text-grey-6 q-mb-xs">
                    Deadline
                  </div>

                  <div class="text-weight-medium">
                    {{ formatDate(task.deadline) }}
                  </div>
                </div>

              </div>
            </q-card-section>
          </q-card>

          <!-- Progress -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>

              <div class="row justify-between items-center">
                <div class="text-subtitle1 text-weight-bold">
                  Progress
                </div>

                <div class="text-h6 text-primary text-weight-bold">
                  {{ Number(task.progress) }}%
                </div>
              </div>

              <q-linear-progress
                :value="Number(task.progress) / 100"
                rounded
                size="10px"
                color="primary"
                class="q-mt-md"
              />

            </q-card-section>
          </q-card>

          <!-- Work update -->
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold q-mb-md">
                Work Update
              </div>

              <div
                v-if="workUpdate"
                class="bg-grey-2 q-pa-md rounded-borders"
              >
                {{ workUpdate }}
              </div>

              <div v-else class="text-grey-6">
                No work update recorded yet.
              </div>
            </q-card-section>
          </q-card>

        </div>

        <!-- Sidebar -->
        <div class="col-12 col-md-4">

          <!-- Effort -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>

              <div class="text-subtitle1 text-weight-bold q-mb-md">
                Effort
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Estimated</span>
                <strong>{{ task.expected_effort }} hrs</strong>
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Actual</span>
                <strong>{{ task.actual_effort }} hrs</strong>
              </div>

              <q-separator class="q-my-md" />

              <div class="row justify-between">
                <span class="text-grey-6">Remaining</span>
                <strong>{{ remainingHours }} hrs</strong>
              </div>

            </q-card-section>
          </q-card>

          <!-- Information -->
          <q-card flat bordered>
            <q-card-section>

              <div class="text-subtitle1 text-weight-bold q-mb-md">
                Task Information
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Task ID</span>
                <strong>#{{ task.task_id }}</strong>
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Project ID</span>
                <strong>#{{ task.project_id }}</strong>
              </div>

              <div class="row justify-between q-py-sm">
                <span class="text-grey-6">Created</span>
                <strong>{{ formatDate(task.created_at) }}</strong>
              </div>

            </q-card-section>
          </q-card>

        </div>
      </div>
    </div>

    <!-- Task ID exists but task doesn't -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="search_off" size="50px" color="grey-5" />

      <div class="text-h6 q-mt-md">
        Task not found
      </div>

      <q-btn
        flat
        no-caps
        color="primary"
        label="Back to Task Specs"
        class="q-mt-md"
        @click="router.push('/app/resource-dashboard/task-details')"
      />
    </div>

    <!-- Update -->
    <UpdateTaskDialog
      v-model="updateDialog"
      :task="resourceTask"
      @save="saveTaskUpdate"
    />

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getTasksApi,
  updateTaskApi,
  type Task
} from '@/services/api'

import type {
  ResourceTask
} from '@/components/tasks/task-types'

import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue'

const route = useRoute()
const router = useRouter()

const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref('')
const updateDialog = ref(false)
const workUpdate = ref('')

const hasTaskId = computed(() => Boolean(route.params.id))

const taskId = computed(() =>
  Number(route.params.id)
)

const task = computed<Task | null>(() => {
  if (!hasTaskId.value) return null

  return tasks.value.find(
    item => item.task_id === taskId.value
  ) ?? null
})

const resourceTask = computed<ResourceTask | null>(() => {
  if (!task.value) return null

  return {
    id: task.value.task_id,
    name: task.value.title,
    project: task.value.project_name || `Project #${task.value.project_id}`,
    priority: task.value.priority,
    status: task.value.status,
    progress: Number(task.value.progress) || 0,
    deadline: task.value.deadline,
    startDate: task.value.start_date,
    hoursWorked: Number(task.value.actual_effort) || 0,
    estimatedHours: Number(task.value.expected_effort) || 0,
    workUpdate: workUpdate.value
  }
})

const remainingHours = computed(() => {
  if (!task.value) return 0

  return Math.max(
    Number(task.value.expected_effort) -
    Number(task.value.actual_effort),
    0
  ).toFixed(1)
})

async function loadTasks() {
  loading.value = true
  error.value = ''

  try {
    tasks.value = await getTasksApi()
  } catch (err) {
    console.error(err)

    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to load tasks.'
  } finally {
    loading.value = false
  }
}

function openTask(id: number) {
  router.push(`/app/resource-dashboard/task-details/${id}`)
}

async function saveTaskUpdate(payload: {
  id: number
  status: ResourceTask['status']
  progress: number
  hoursWorked: number
  workUpdate: string
}) {
  if (!task.value) return

  try {
    const updated = await updateTaskApi(
      task.value.task_id,
      {
        status: payload.status,
        progress: payload.progress,
        actual_effort: payload.hoursWorked
      }
    )

    const index = tasks.value.findIndex(
      item => item.task_id === updated.task_id
    )

    if (index !== -1) {
      tasks.value[index] = updated
    }

    if (payload.workUpdate) {
      workUpdate.value = payload.workUpdate
    }

    updateDialog.value = false
  } catch (err) {
    console.error(err)

    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to update task.'
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )
}

function statusLabel(status: Task['status']) {
  return {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold'
  }[status]
}

function statusColor(status: Task['status']) {
  return {
    PENDING: 'grey-7',
    IN_PROGRESS: 'blue-7',
    COMPLETED: 'positive',
    ON_HOLD: 'orange-7'
  }[status]
}

function priorityColor(priority: Task['priority']) {
  return {
    LOW: 'positive',
    MEDIUM: 'orange',
    HIGH: 'deep-orange',
    CRITICAL: 'negative'
  }[priority]
}

onMounted(() => {
  void loadTasks()
})
</script>
