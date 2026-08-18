<template>
  <div class="task-center">
    <div v-for="column in columns" :key="column.title" class="task-column">
      <div class="column-header" :class="column.className">
        <span class="column-title">
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

const avatarRohit =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
const avatarSneha =
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80';
const avatarArjun =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';
const avatarPriya =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80';

interface SummaryTask {
  title: string;
  project: string;
  date: string;
  avatar?: string;
  initials?: string;
  projectId?: number;
  taskId?: number;
}

const defaultColumns = [
  {
    title: 'High Priority',
    icon: 'flag',
    count: 3,
    className: 'priority',
    tasks: [
      {
        title: 'Design System Implementation',
        project: 'Website Redesign',
        date: 'May 23',
        avatar: avatarRohit,
        initials: 'R',
        projectId: 1,
        taskId: 101
      },
      {
        title: 'User Authentication Module',
        project: 'Mobile App Development',
        date: 'May 25',
        avatar: avatarSneha,
        initials: 'S',
        projectId: 2,
        taskId: 102
      },
      {
        title: 'API Security Audit',
        project: 'Internal Tools',
        date: 'May 26',
        avatar: avatarPriya,
        initials: 'P',
        projectId: 3,
        taskId: 103
      },
    ],
  },
  {
    title: 'In Progress',
    icon: 'radio_button_checked',
    count: 2,
    className: 'progress',
    tasks: [
      {
        title: 'Dashboard UI Design',
        project: 'Website Redesign',
        date: 'May 27',
        avatar: avatarArjun,
        initials: 'A',
        projectId: 1,
        taskId: 104
      },
      {
        title: 'Payment Gateway Integration',
        project: 'Mobile App Development',
        date: 'May 28',
        avatar: avatarRohit,
        initials: 'R',
        projectId: 2,
        taskId: 105
      },
    ],
  },
  {
    title: 'Due This Week',
    icon: 'schedule',
    count: 2,
    className: 'due',
    tasks: [
      {
        title: 'Performance Optimization',
        project: 'Internal Tools',
        date: 'May 30',
        avatar: avatarArjun,
        initials: 'A',
        projectId: 3,
        taskId: 106
      },
      {
        title: 'Content Strategy Review',
        project: 'Marketing Campaign',
        date: 'May 30',
        avatar: avatarSneha,
        initials: 'S',
        projectId: 4,
        taskId: 107
      },
    ],
  },
  {
    title: 'Completed',
    icon: 'check_circle',
    count: 4,
    className: 'completed',
    tasks: [
      {
        title: 'Project Kick-off',
        project: 'Website Redesign',
        date: 'May 18',
        avatar: avatarRohit,
        initials: 'R',
        projectId: 1,
        taskId: 108
      },
      {
        title: 'Requirements Gathering',
        project: 'Mobile App Development',
        date: 'May 19',
        avatar: avatarSneha,
        initials: 'S',
        projectId: 2,
        taskId: 109
      },
    ],
  },
];

const columns = computed(() => {
  if (!props.tasks || props.tasks.length === 0) {
    return defaultColumns;
  }

  const projectMap = new Map<number, string>();
  if (props.projects) {
    props.projects.forEach(p => projectMap.set(p.project_id, p.name));
  }

  const mapTask = (t: Task): SummaryTask => ({
    title: t.title,
    project: projectMap.get(t.project_id) || `Project #${t.project_id}`,
    date: t.deadline ? t.deadline.slice(5) : 'No due date',
    avatar: avatarRohit,
    initials: t.title.charAt(0).toUpperCase(),
    projectId: t.project_id,
    taskId: t.task_id
  });

  const highPriority = props.tasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL');
  const inProgress = props.tasks.filter(t => t.status === 'IN_PROGRESS');
  const dueTasks = props.tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completed = props.tasks.filter(t => t.status === 'COMPLETED');

  return [
    {
      title: 'High Priority',
      icon: 'flag',
      count: highPriority.length,
      className: 'priority',
      tasks: highPriority.slice(0, 3).map(mapTask)
    },
    {
      title: 'In Progress',
      icon: 'radio_button_checked',
      count: inProgress.length,
      className: 'progress',
      tasks: inProgress.slice(0, 3).map(mapTask)
    },
    {
      title: 'Due This Week',
      icon: 'schedule',
      count: dueTasks.length,
      className: 'due',
      tasks: dueTasks.slice(0, 3).map(mapTask)
    },
    {
      title: 'Completed',
      icon: 'check_circle',
      count: completed.length,
      className: 'completed',
      tasks: completed.slice(0, 3).map(mapTask)
    }
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
  display: flex;
  flex-direction: column;
}

.task-column:last-child {
  border-right: none;
}

.column-header {
  min-height: 38px;
  margin: 0 -10px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--wo-bg-card-hover);
  border-bottom: 1px solid var(--wo-border-subtle);
  font-size: 11px;
  font-weight: 600;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 6px;
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
