<template>
  <div class="task-row cursor-pointer" @click="handleRowClick">
    <q-avatar size="26px" class="task-avatar">
      <img v-if="avatar" :src="avatar" :alt="title" />
      <span v-else>{{ initials }}</span>
    </q-avatar>

    <div class="task-info">
      <div class="task-title" :title="title">{{ title }}</div>
      <div class="task-project">{{ project }}</div>
    </div>

    <div class="task-date">{{ date }}</div>
    <q-icon name="more_vert" size="16px" class="task-menu" @click.stop>
      <q-menu anchor="bottom end" self="top end">
        <q-list dense style="min-width: 140px">
          <q-item clickable v-close-popup @click="handleRowClick">
            <q-item-section avatar style="min-width: 24px">
              <q-icon name="visibility" size="14px" color="primary" />
            </q-item-section>
            <q-item-section>View Details</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="goToProjects">
            <q-item-section avatar style="min-width: 24px">
              <q-icon name="folder_open" size="14px" color="grey-7" />
            </q-item-section>
            <q-item-section>All Projects</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-icon>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps<{
  title: string;
  project: string;
  date: string;
  avatar?: string | undefined;
  initials?: string | undefined;
  projectId?: number | undefined;
  taskId?: number | undefined;
}>();

const router = useRouter();

function handleRowClick() {
  if (props.projectId) {
    void router.push(`/pm/projects/${props.projectId}`);
  } else {
    void router.push('/pm/projects');
  }
}

function goToProjects() {
  void router.push('/pm/projects');
}
</script>

<style scoped lang="scss">
.task-row {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-top: 1px solid #f2f4f7;
  transition: background-color 0.15s ease;
}

.task-row:first-child {
  border-top: none;
}

.task-row:hover {
  background-color: #fafafb;
  border-radius: 6px;
}

.task-avatar {
  flex: 0 0 26px;
  border: 1px solid #eaecf0;
  overflow: hidden;
  background: #f4f0fd;
  color: #8b6fd8;
  font-size: 9px;
  font-weight: 700;
}

.task-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.task-info {
  min-width: 0;
  flex: 1;
}

.task-title {
  overflow: hidden;
  color: #1d2433;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.task-project {
  margin-top: 1px;
  overflow: hidden;
  color: #98a2b3;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.task-date {
  color: #667085;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  padding: 2px 4px;
}

.task-menu {
  color: #98a2b3;
  flex: 0 0 auto;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
}

.task-menu:hover {
  color: #1d2433;
  background: #eaecf0;
}
</style>
