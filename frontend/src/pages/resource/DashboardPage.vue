<template>
  <q-page class="q-pa-lg workspace-page">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">Welcome back{{ userFirstName ? `, ${userFirstName}` : '' }}</div>
      <div class="text-body2 text-grey-6 q-mt-xs">Here's an overview of your work today.</div>
    </div>

    <!-- 01 — OVERVIEW -->
    <WorkspaceSection
      number="01" label="Overview" title="Your work at a glance"
      description="A quick snapshot of everything on your plate right now."
    >
      <div class="stat-strip">
        <StatCard
          v-for="stat in statCards" :key="stat.title"
          :title="stat.title" :value="stat.value" :subtitle="stat.subtitle"
          :icon="stat.icon" :color="stat.color"
        />
      </div>
    </WorkspaceSection>

    <!-- 02 — WORKLOAD -->
    <WorkspaceSection
      number="02" label="Capacity" title="My workload"
      description="How much of your daily capacity is currently booked, and how your open tasks are distributed by status."
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <WorkloadCard
            :utilization="workload.utilization" :allocated-hours="workload.allocatedHours"
            :daily-capacity="workload.dailyCapacity" :remaining="workload.remaining"
            :assigned-tasks="workload.assignedTasks"
          />
        </div>
        <div class="col-12 col-md-6">
          <TaskStatusCard :items="taskStatus" />
        </div>
      </div>
    </WorkspaceSection>

    <!-- 03 — UPCOMING -->
    <WorkspaceSection
      number="03" label="Deadlines" title="Upcoming tasks"
      description="Tasks approaching their deadlines, ordered by how soon they're due."
      action-label="View all tasks" @action="goToTasks"
    >
      <UpcomingTasksCard :tasks="upcomingTasks" @view-all="goToTasks" />
    </WorkspaceSection>

    <!-- 04 — PROJECTS -->
    <WorkspaceSection
      number="04" label="Projects" title="Tasks across projects"
      description="Your assigned work grouped by the project it belongs to."
    >
      <ProjectsBreakdownCard :projects="projectSummary" />
    </WorkspaceSection>

    <!-- 05 — GANTT -->
    <WorkspaceSection
      number="05" label="Timeline" title="My Gantt"
      description="Your own assigned tasks plotted against their start and deadline dates."
    >
      <ResourceGanttChart :tasks="ganttTasks" />
    </WorkspaceSection>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import StatCard from '@/components/dashboard/StatCard.vue'
import WorkspaceSection from '@/components/resource/WorkspaceSection.vue'
import WorkloadCard from '@/components/resource/WorkloadCard.vue'
import TaskStatusCard from '@/components/resource/TaskStatusCard.vue'
import UpcomingTasksCard from '@/components/resource/UpcomingTasksCard.vue'
import ProjectsBreakdownCard from '@/components/resource/ProjectsBreakdownCard.vue'
import ResourceGanttChart from '@/components/resource/ResourceGanttChart.vue'

const router = useRouter()

// =========================================================
// Static mock data — replace with the Resource dashboard
// API response once the backend endpoints are ready.
// =========================================================

const storedUser = localStorage.getItem('user')
const userFirstName = computed(() => {
  if (!storedUser) return ''
  try {
    const parsed = JSON.parse(storedUser) as { name?: string }
    return parsed.name?.split(' ')[0] ?? ''
  } catch {
    return ''
  }
})

const stats = { myTasks: 8, inProgress: 3, completed: 3, delayed: 1, upcoming: 3 }

const statCards = [
  {
    title: 'My Tasks',
    value: stats.myTasks,
    subtitle: 'Assigned to you',
    icon: 'task_alt',
    color: '#8B6FD8',
  },

  {
    title: 'In Progress',
    value: stats.inProgress,
    subtitle: 'Currently working',
    icon: 'autorenew',
    color: '#2E90FA',
  },

  {
    title: 'Completed',
    value: stats.completed,
    subtitle: 'Tasks completed',
    icon: 'check_circle_outline',
    color: '#27AE60',
  },

  {
    title: 'Delayed',
    value: stats.delayed,
    subtitle: 'Needs attention',
    icon: 'warning_amber',
    color: '#E15263',
  },

  {
    title: 'Upcoming',
    value: stats.upcoming,
    subtitle: 'Approaching deadline',
    icon: 'schedule',
    color: '#E89532',
  },
]

const workload = {
  assignedTasks: 8,
  allocatedHours: 32,
  dailyCapacity: 8,
  utilization: 80,
  remaining: 6.5,
}

const taskStatus = [
  { label: 'Completed', value: 3, color: '#27AE60' },
  { label: 'In Progress', value: 3, color: '#2E90FA' },
  { label: 'Partially Completed', value: 1, color: '#E89532' },
  { label: 'To Do', value: 1, color: '#98A2B3' },
]

const upcomingTasks = [
  { id: 1, name: 'API Integration', project: 'Resource Management System', priority: 'High' as const, progress: 60, due: 'Due Today' },
  { id: 2, name: 'Dashboard UI', project: 'Task Management System', priority: 'Medium' as const, progress: 40, due: 'Aug 20' },
  { id: 3, name: 'Testing', project: 'Resource Management System', priority: 'Low' as const, progress: 20, due: 'Aug 23' },
]

const projectSummary = [
  { project: 'Resource Management System', tasks: 5, status: 'On Track' as const, progress: 55, deadline: '25 Aug 2026' },
  { project: 'Task Management System', tasks: 3, status: 'At Risk' as const, progress: 40, deadline: '30 Aug 2026' },
]

// Gantt needs a start + end per task — deadline alone isn't enough
// to draw a bar, so a start date is estimated until the backend
// sends real ones.
const ganttTasks = [
  { id: 1, name: 'API Integration', project: 'Resource Mgmt System', start: '2026-08-16', end: '2026-08-20', progress: 60, priority: 'High' as const },
  { id: 2, name: 'Dashboard UI', project: 'Task Mgmt System', start: '2026-08-17', end: '2026-08-22', progress: 40, priority: 'Medium' as const },
  { id: 3, name: 'Testing', project: 'Resource Mgmt System', start: '2026-08-19', end: '2026-08-23', progress: 20, priority: 'Low' as const },
  { id: 4, name: 'Documentation', project: 'Resource Mgmt System', start: '2026-08-21', end: '2026-08-27', progress: 0, priority: 'Low' as const },
]

function goToTasks() {
  router.push('/app/resource-dashboard/tasks')
}
</script>

<style scoped lang="scss">
.workspace-page { background: var(--wo-bg-page, #f8f9fa); }

.stat-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
