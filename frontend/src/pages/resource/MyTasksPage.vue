<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">My Tasks</div>
      <div class="text-body2 text-grey-6 q-mt-xs">
        View and manage the tasks assigned to you.
      </div>
    </div>

    <div class="stat-strip q-mb-md">
      <StatCard
        v-for="stat in statCards"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
      />
    </div>

    <TaskFilterBar
      :search="search"
      :status="statusFilter"
      :project="projectFilter"
      :priority="priorityFilter"
      :project-options="projectOptions"
      :priority-options="priorityOptions"
      @update:search="v => (search = v)"
      @update:status="v => (statusFilter = v)"
      @update:project="v => (projectFilter = v)"
      @update:priority="v => (priorityFilter = v)"
      @clear="clearFilters"
    />

    <q-card flat bordered class="dashboard-card">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1 text-weight-bold">Assigned Tasks</div>

        <q-badge
          color="primary"
          :label="`${filteredTasks.length} tasks`"
        />
      </q-card-section>

      <q-separator />

      <!-- Loading -->
      <div v-if="loading" class="q-pa-xl text-center">
        <q-spinner
          color="primary"
          size="40px"
        />
        <div class="text-body2 text-grey-6 q-mt-md">
          Loading your tasks...
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="q-pa-xl text-center">
        <q-icon
          name="error_outline"
          size="40px"
          color="negative"
        />

        <div class="text-body1 text-grey-7 q-mt-md">
          {{ error }}
        </div>

        <q-btn
          flat
          no-caps
          color="primary"
          label="Try Again"
          icon="refresh"
          class="q-mt-md"
          @click="loadTasks"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredTasks.length === 0"
        class="empty-block"
      >
        <q-icon
          name="task_alt"
          size="40px"
          color="grey-5"
        />

        <div class="text-body1 text-grey-6 q-mt-md">
          No tasks match these filters.
        </div>
      </div>

      <!-- Tasks -->
      <template v-else>
        <TaskListItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @update="openUpdateDialog"
        />
      </template>
    </q-card>

    <UpdateTaskDialog
      v-model="updateDialog"
      :task="selectedTask"
      @save="saveTaskUpdate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatCard from '@/components/dashboard/StatCard.vue'
import TaskFilterBar, {
  type StatusFilter
} from '@/components/tasks/TaskFilterBar.vue'
import TaskListItem from '@/components/tasks/TaskListItem.vue'
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue'

import type {
  ResourceTask,
  TaskPriority
} from '@/components/tasks/task-types'

import {
  getTasksApi,
  updateTaskApi,
  type Task
} from '@/services/api'


// =========================================================
// TASK DATA
// =========================================================

const tasks = ref<ResourceTask[]>([])

const loading = ref(false)
const error = ref('')


// Convert backend Task → frontend ResourceTask
function mapTask(task: Task): ResourceTask {
  return {
    id: task.task_id,
    name: task.title,
    project: task.project_name ?? `Project #${task.project_id}`,
    priority: task.priority,
    status: task.status,
    progress: Number(task.progress) || 0,
    deadline: task.deadline,
    startDate: task.start_date,
    hoursWorked: Number(task.actual_effort) || 0,
    estimatedHours: Number(task.expected_effort) || 0,
    workUpdate: ''
  }
}


// =========================================================
// LOAD TASKS
// =========================================================

async function loadTasks() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTasksApi()

    tasks.value = response.map(mapTask)
  } catch (err) {
    console.error('Failed to load resource tasks:', err)

    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to load your tasks.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadTasks()
})


// =========================================================
// DATE / STATUS HELPERS
// =========================================================

function isOverdue(task: ResourceTask) {
  if (task.status === 'COMPLETED' || !task.deadline) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deadline = new Date(task.deadline)
  deadline.setHours(0, 0, 0, 0)

  return deadline < today
}


// =========================================================
// SUMMARY
// =========================================================

const statCards = computed(() => [
  {
    title: 'Total Tasks',
    value: tasks.value.length,
    icon: 'task_alt',
    color: '#8B6FD8'
  },

  {
    title: 'In Progress',
    value: tasks.value.filter(
      task => task.status === 'IN_PROGRESS'
    ).length,
    icon: 'autorenew',
    color: '#2E90FA'
  },

  {
    title: 'Completed',
    value: tasks.value.filter(
      task => task.status === 'COMPLETED'
    ).length,
    icon: 'check_circle_outline',
    color: '#27AE60'
  },

  {
    title: 'Delayed',
    value: tasks.value.filter(isOverdue).length,
    icon: 'warning_amber',
    color: '#E15263'
  }
])


// =========================================================
// FILTERS
// =========================================================

const search = ref('')
const statusFilter = ref<StatusFilter>(null)
const projectFilter = ref<string | null>(null)
const priorityFilter = ref<TaskPriority | null>(null)

const projectOptions = computed(() => [
  ...new Set(
    tasks.value.map(task => task.project)
  )
])

const priorityOptions: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]


function clearFilters() {
  search.value = ''
  statusFilter.value = null
  projectFilter.value = null
  priorityFilter.value = null
}


// =========================================================
// FILTERED TASKS
// =========================================================

const filteredTasks = computed(() =>
  tasks.value.filter(task => {
    const q = search.value.toLowerCase().trim()

    const matchesSearch =
      !q ||
      task.name.toLowerCase().includes(q) ||
      task.project.toLowerCase().includes(q)

    const matchesStatus =
      !statusFilter.value ||
      (
        statusFilter.value === 'DELAYED'
          ? isOverdue(task)
          : task.status === statusFilter.value
      )

    const matchesProject =
      !projectFilter.value ||
      task.project === projectFilter.value

    const matchesPriority =
      !priorityFilter.value ||
      task.priority === priorityFilter.value

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProject &&
      matchesPriority
    )
  })
)


// =========================================================
// UPDATE TASK
// =========================================================

const updateDialog = ref(false)
const selectedTask = ref<ResourceTask | null>(null)

function openUpdateDialog(task: ResourceTask) {
  selectedTask.value = task
  updateDialog.value = true
}


async function saveTaskUpdate(payload: {
  id: number
  status: ResourceTask['status']
  progress: number
  hoursWorked: number
  workUpdate: string
}) {
  const task = tasks.value.find(
    item => item.id === payload.id
  )

  if (!task) {
    return
  }

  try {
    await updateTaskApi(task.id, {
      status: payload.status,
      progress: payload.progress,
      actual_effort: payload.hoursWorked
    })

    // Update the local task immediately
    task.status = payload.status
    task.progress = payload.progress
    task.hoursWorked = payload.hoursWorked

    if (payload.workUpdate) {
      task.workUpdate = payload.workUpdate
    }

    updateDialog.value = false

  } catch (err) {
    console.error('Failed to update task:', err)

    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to update task.'
  }
}
</script>

<style scoped lang="scss">
.workspace-page {
  background: var(--wo-bg-page, #f8f9fa);
}

.stat-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.empty-block {
  padding: 48px 16px;
  text-align: center;
}
</style>
