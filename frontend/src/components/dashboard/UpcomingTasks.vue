<template>
  <q-card class="dashboard-card">
    <q-card-section>
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Upcoming Tasks</div>
          <div class="text-caption text-grey-6">Tasks requiring attention</div>
        </div>

        <q-icon name="schedule" color="info" size="28px" />
      </div>
    </q-card-section>

    <q-list separator>
      <q-item v-for="task in tasks" :key="task.title" class="q-py-md">
        <q-item-section avatar>
          <q-avatar color="grey-2" text-color="primary">
            <q-icon name="assignment" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ task.title }}
          </q-item-label>

          <q-item-label caption>
            {{ task.project }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge color="info">
            {{ task.due }}
          </q-badge>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
const tasks = [
  {
    title: 'Finalize API integration',
    project: 'Task Management System',
    due: 'Tomorrow',
  },
  {
    title: 'Review dashboard design',
    project: 'Task Management System',
    due: 'Wed',
  },
  {
    title: 'Resource allocation',
    project: 'Mobile Application',
    due: 'Fri',
  },
];
</script>

<style scoped>
.dashboard-card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
}
</style>
