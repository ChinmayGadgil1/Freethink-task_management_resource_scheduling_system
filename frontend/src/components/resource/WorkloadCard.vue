<template>
  <q-card flat bordered class="dashboard-card full-height">
    <q-card-section>
      <div class="row items-baseline justify-between">
        <div class="text-h3 text-weight-bold">{{ allocatedHours }}h</div>
        <q-badge color="primary" label="Allocated Effort" class="load-badge" />
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">expected effort across your active tasks</div>

      <div class="row justify-between q-mt-md q-mb-xs">
        <span class="text-caption text-grey-7">Effort consumed</span>
        <span class="text-caption text-weight-medium">{{ consumedPct }}%</span>
      </div>
      <q-linear-progress :value="consumedPct / 100" size="10px" rounded color="primary" track-color="grey-3" />

      <div class="stat-grid q-mt-lg">
        <div class="stat-cell">
          <div class="stat-label">Active tasks</div>
          <div class="stat-value">{{ assignedTasks }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Actual effort</div>
          <div class="stat-value">{{ actualHours }}h</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Remaining effort</div>
          <div class="stat-value">{{ remainingHours }}h</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  allocatedHours: number;
  actualHours: number;
  remainingHours: number;
  assignedTasks: number;
}>();

const consumedPct = computed(() =>
  props.allocatedHours ? Math.min(100, Math.round((props.actualHours / props.allocatedHours) * 100)) : 0,
);
</script>

<style scoped lang="scss">
.load-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.stat-cell {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--wo-bg-page, #f8f9fa);
}
.stat-label {
  color: var(--wo-text-muted, #667085);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stat-value {
  margin-top: 4px;
  color: var(--wo-text-main, #1d2433);
  font-size: 18px;
  font-weight: 700;
}
</style>
