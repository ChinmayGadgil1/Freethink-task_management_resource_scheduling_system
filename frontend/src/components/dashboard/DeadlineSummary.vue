<template>
  <q-card class="dashboard-card">
    <q-card-section>
      <div class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Deadlines</div>
          <div class="text-caption text-grey-6">Upcoming project deliveries</div>
        </div>

        <q-icon name="event" color="warning" size="28px" />
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="deadline-number">
        {{ days }}
      </div>

      <div class="text-caption text-grey-6">days until next major deadline</div>

      <q-separator class="q-my-md" />

      <div class="row items-center justify-between">
        <div>
          <div class="text-body2 text-weight-medium">
            {{ project }}
          </div>

          <div class="text-caption text-grey-6">Due {{ dueDate }}</div>
        </div>

        <q-badge color="warning" text-color="dark"> Upcoming </q-badge>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    days?: number;
    project?: string;
    dueDate?: string;
  }>(),
  {
    days: 8,
    project: 'Website Revamp',
    dueDate: '25 Aug 2026',
  },
);
</script>

<style scoped>
.dashboard-card {
  border-radius: 18px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
}

.deadline-number {
  font-size: 38px;
  font-weight: 700;
}
</style>
