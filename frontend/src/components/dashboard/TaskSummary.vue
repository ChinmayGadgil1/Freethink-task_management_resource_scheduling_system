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
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TaskRow from './TaskRow.vue';

const avatarRohit =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
const avatarSneha =
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80';
const avatarArjun =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';
const avatarPriya =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80';

const columns = [
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
      },
      {
        title: 'User Authentication Module',
        project: 'Mobile App Development',
        date: 'May 25',
        avatar: avatarSneha,
        initials: 'S',
      },
      {
        title: 'API Security Audit',
        project: 'Internal Tools',
        date: 'May 26',
        avatar: avatarPriya,
        initials: 'P',
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
      },
      {
        title: 'Payment Gateway Integration',
        project: 'Mobile App Development',
        date: 'May 28',
        avatar: avatarRohit,
        initials: 'R',
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
      },
      {
        title: 'Content Strategy Review',
        project: 'Marketing Campaign',
        date: 'May 30',
        avatar: avatarSneha,
        initials: 'S',
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
      },
      {
        title: 'Requirements Gathering',
        project: 'Mobile App Development',
        date: 'May 19',
        avatar: avatarSneha,
        initials: 'S',
      },
    ],
  },
];
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
