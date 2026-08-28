<template>
  <q-card class="dashboard-card overflow-hidden">
    <q-card-section>
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Overdue Tasks</div>
          <div class="text-caption text-grey-6">Tasks that need immediate attention</div>
        </div>

        <q-icon name="warning" color="negative" size="28px" />
      </div>
    </q-card-section>

    <q-list separator>
      <q-item v-for="task in tasks" :key="task.title" class="q-py-md">
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ task.title }}
          </q-item-label>

          <q-item-label caption>
            {{ task.project }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge color="negative"> {{ task.days }} days late </q-badge>
        </q-item-section>
      </q-item>
    </q-list>

    <q-card-actions>
      <q-btn flat color="negative" label="View all overdue" no-caps />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
const tasks = [
  {
    title: 'Database integration',
    project: 'Task Management System',
    days: 2,
  },
  {
    title: 'Testing resource allocation',
    project: 'Internal Portal',
    days: 1,
  },
];
</script>
