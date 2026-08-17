<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">My Tasks</div>
      <div class="text-body2 text-grey-6 q-mt-xs">View and manage the tasks assigned to you.</div>
    </div>

    <div class="stat-strip q-mb-md">
      <StatCard
        v-for="stat in statCards" :key="stat.title"
        :title="stat.title" :value="stat.value" :icon="stat.icon" :color="stat.color"
      />
    </div>

    <TaskFilterBar
      :search="search" :status="statusFilter" :project="projectFilter" :priority="priorityFilter"
      :project-options="projectOptions" :priority-options="priorityOptions"
      @update:search="v => (search = v)"
      @update:status="v => (statusFilter = v)"
      @update:project="v => (projectFilter = v)"
      @update:priority="v => (priorityFilter = v)"
      @clear="clearFilters"
    />

    <q-card flat bordered class="dashboard-card">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1 text-weight-bold">Assigned Tasks</div>
        <q-badge color="primary" :label="`${filteredTasks.length} tasks`" />
      </q-card-section>
      <q-separator />

      <div v-if="filteredTasks.length === 0" class="empty-block">
        <q-icon name="task_alt" size="40px" color="grey-5" />
        <div class="text-body1 text-grey-6 q-mt-md">No tasks match these filters.</div>
      </div>

      <TaskListItem
        v-for="task in filteredTasks" :key="task.id"
        :task="task" @update="openUpdateDialog"
      />
    </q-card>

    <UpdateTaskDialog v-model="updateDialog" :task="selectedTask" @save="saveTaskUpdate" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import StatCard from '@/components/dashboard/StatCard.vue'
import TaskFilterBar, { type StatusFilter } from '@/components/tasks/TaskFilterBar.vue'
import TaskListItem from '@/components/tasks/TaskListItem.vue'
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue'
import type {
  ResourceTask,
  TaskPriority
} from '@/components/tasks/task-types'


// =========================================================
// Static task data — replace with the Resource tasks API
// response once the backend is ready.
// =========================================================

const tasks = ref<ResourceTask[]>([
  { id: 1, name: 'API Integration', project: 'Resource Management System', priority: 'High', status: 'IN_PROGRESS', progress: 60, deadline: '2026-08-20', hoursWorked: 4, estimatedHours: 8, workUpdate: 'Authentication API integration is in progress.' },
  { id: 2, name: 'Dashboard UI', project: 'Task Management System', priority: 'Medium', status: 'IN_PROGRESS', progress: 40, deadline: '2026-08-22', hoursWorked: 3, estimatedHours: 6, workUpdate: 'Dashboard layout is being implemented.' },
  { id: 3, name: 'Database Integration', project: 'Resource Management System', priority: 'High', status: 'PARTIALLY_COMPLETED', progress: 45, deadline: '2026-08-14', hoursWorked: 5, estimatedHours: 10, workUpdate: 'Database connection is partially completed.' },
  { id: 4, name: 'Login Validation', project: 'Resource Management System', priority: 'Low', status: 'COMPLETED', progress: 100, deadline: '2026-08-10', hoursWorked: 5, estimatedHours: 5, workUpdate: 'Login validation completed.' },
  { id: 5, name: 'Task Filtering', project: 'Task Management System', priority: 'Medium', status: 'TODO', progress: 0, deadline: '2026-08-24', hoursWorked: 0, estimatedHours: 4, workUpdate: '' },
  { id: 6, name: 'Unit Testing', project: 'Resource Management System', priority: 'Medium', status: 'COMPLETED', progress: 100, deadline: '2026-08-12', hoursWorked: 6, estimatedHours: 6, workUpdate: 'Unit tests completed.' },
  { id: 7, name: 'Progress API', project: 'Task Management System', priority: 'Critical', status: 'PARTIALLY_COMPLETED', progress: 45, deadline: '2026-08-19', hoursWorked: 3, estimatedHours: 7, workUpdate: 'Progress functionality is partially completed.' },
  { id: 8, name: 'Documentation', project: 'Resource Management System', priority: 'Low', status: 'TODO', progress: 0, deadline: '2026-08-27', hoursWorked: 0, estimatedHours: 3, workUpdate: '' },
])

function isOverdue(task: ResourceTask) {
  if (task.status === 'COMPLETED') return false
  return new Date(task.deadline) < new Date(new Date().toDateString())
}

// =========================================================
// SUMMARY STRIP
// =========================================================

const statCards = computed(() => [
  { title: 'Total Tasks', value: tasks.value.length, icon: 'task_alt', color: '#8B6FD8' },
  { title: 'In Progress', value: tasks.value.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PARTIALLY_COMPLETED').length, icon: 'autorenew', color: '#2E90FA' },
  { title: 'Completed', value: tasks.value.filter(t => t.status === 'COMPLETED').length, icon: 'check_circle_outline', color: '#27AE60' },
  { title: 'Delayed', value: tasks.value.filter(isOverdue).length, icon: 'warning_amber', color: '#E15263' },
])

// =========================================================
// FILTERS
// =========================================================

const search = ref('')
const statusFilter = ref<StatusFilter>(null)
const projectFilter = ref<string | null>(null)
const priorityFilter = ref<TaskPriority | null>(null)

const projectOptions = computed(() => [
  ...new Set(tasks.value.map(task => task.project))
])

const priorityOptions: TaskPriority[] = [
  'Low',
  'Medium',
  'High',
  'Critical'
]

function updatePriority(value: TaskPriority | null) {
  priorityFilter.value = value
}

function clearFilters() {
  search.value = ''
  statusFilter.value = null
  projectFilter.value = null
  priorityFilter.value = null
}

const filteredTasks = computed(() =>
  tasks.value.filter(task => {
    const q = search.value.toLowerCase().trim()
    const matchesSearch = !q || task.name.toLowerCase().includes(q) || task.project.toLowerCase().includes(q)
    const matchesStatus =
      !statusFilter.value || (statusFilter.value === 'DELAYED' ? isOverdue(task) : task.status === statusFilter.value)
    const matchesProject = !projectFilter.value || task.project === projectFilter.value
    const matchesPriority = !priorityFilter.value || task.priority === priorityFilter.value
    return matchesSearch && matchesStatus && matchesProject && matchesPriority
  }),
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

function saveTaskUpdate(payload: { id: number; status: ResourceTask['status']; progress: number; hoursWorked: number; workUpdate: string }) {
  const task = tasks.value.find(t => t.id === payload.id)
  if (!task) return

  task.status = payload.status
  task.progress = payload.progress
  task.hoursWorked = payload.hoursWorked
  if (payload.workUpdate) task.workUpdate = payload.workUpdate

  /*
   * Later:
   * await updateTaskApi(task.id, {
   *   status: task.status,
   *   progress: task.progress,
   *   hoursWorked: task.hoursWorked,
   *   workUpdate: payload.workUpdate,
   * })
   */
}
</script>

<style scoped lang="scss">
.workspace-page { background: var(--wo-bg-page, #f8f9fa); }

.stat-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.empty-block { padding: 48px 16px; text-align: center; }
</style>
