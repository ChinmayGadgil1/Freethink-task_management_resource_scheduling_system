<template>
  <div class="task-center">
    <div v-for="column in columns" :key="column.title" class="task-column column">
      <div class="column-header row items-center justify-between" :class="column.className">
        <span class="column-title row items-center gap-xs">
          <q-icon :name="column.icon" size="14px" />
          {{ column.title }}
        </span>
        <span class="column-count-badge">{{ column.count }}</span>
      </div>

      <div class="column-tasks">
        <TaskRow
          v-for="task in column.tasks"
          :key="task.title"
          :title="task.title"
          :project="task.project"
          :date="task.date"
          :avatar="task.avatar"
          :initials="task.initials"
          :project-id="task.projectId"
          :task-id="task.taskId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TaskRow from './TaskRow.vue';
import type { Task, Project } from '@/services/api';

const props = defineProps<{
  tasks?: Task[];
  projects?: Project[];
}>();

interface SummaryTask {
  title: string;
  project: string;
  date: string;
  avatar?: string;
  initials?: string;
  projectId?: number;
  taskId?: number;
}

const columns = computed(() => {
  const rawTasks = props.tasks || [];

  const projectMap = new Map<number, string>();
  if (props.projects) {
    props.projects.forEach((p) => projectMap.set(p.project_id, p.name));
  }

  const mapTask = (t: Task): SummaryTask => ({
    title: t.title,
    project: projectMap.get(t.project_id) || `Project #${t.project_id}`,
    date: t.deadline ? t.deadline.slice(5) : 'No due date',
    initials: t.title.charAt(0).toUpperCase(),
    projectId: t.project_id,
    taskId: t.task_id,
  });

  const highPriority = rawTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL');
  const inProgress = rawTasks.filter((t) => t.status === 'IN_PROGRESS');
  const dueTasks = rawTasks.filter((t) => t.status !== 'COMPLETED');
  const completed = rawTasks.filter((t) => t.status === 'COMPLETED');

  return [
    {
      title: 'High Priority',
      icon: 'flag',
      count: highPriority.length,
      className: 'priority',
      tasks: highPriority.slice(0, 3).map(mapTask),
    },
    {
      title: 'In Progress',
      icon: 'radio_button_checked',
      count: inProgress.length,
      className: 'progress',
      tasks: inProgress.slice(0, 3).map(mapTask),
    },
    {
      title: 'Due This Week',
      icon: 'schedule',
      count: dueTasks.length,
      className: 'due',
      tasks: dueTasks.slice(0, 3).map(mapTask),
    },
    {
      title: 'Completed',
      icon: 'check_circle',
      count: completed.length,
      className: 'completed',
      tasks: completed.slice(0, 3).map(mapTask),
    },
  ];
});
</script>
<style scoped lang="scss">
.task-center {
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  border: 1px solid var(--wo-border);
  border-radius: 10px;
  background: var(--wo-bg-card);
  overflow: hidden;
}

.task-column {
  min-width: 0;
  padding: 0 10px 8px;
  border-right: 1px solid var(--wo-border-subtle);
}

.task-column:last-child {
  border-right: none;
}

.column-header {
  min-height: 38px;
  margin: 0 -10px;
  padding: 0 12px;
  background: var(--wo-bg-card-hover);
  border-bottom: 1px solid var(--wo-border-subtle);
  font-size: 11px;
  font-weight: 600;
}

.column-title {
  color: var(--wo-text-main);
}

.column-count-badge {
  color: var(--wo-text-muted);
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--wo-bg-tag);
}

.column-header.priority .column-title {
  color: #f04438;
}

.column-header.progress .column-title {
  color: #2e90fa;
}

.column-header.due .column-title {
  color: #f79009;
}

.column-header.completed .column-title {
  color: #12b76a;
}

.column-tasks {
  padding-top: 4px;
}

@media (max-width: 1050px) {
  .task-center {
    overflow-x: auto;
  }

  .task-column {
    min-width: 220px;
  }
}
</style>
