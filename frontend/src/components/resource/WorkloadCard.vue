<template>
  <q-card flat bordered class="dashboard-card full-height">
    <q-card-section>
      <div class="row items-baseline justify-between">
        <div class="text-h3 text-weight-bold">{{ utilization }}%</div>
        <q-badge :color="loadColor" :label="loadLabel" class="load-badge" />
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">of daily capacity utilized</div>

      <q-linear-progress
        :value="utilization / 100"
        size="10px"
        rounded
        class="q-mt-md"
        :color="loadColor"
        track-color="grey-3"
      />

      <div class="stat-grid q-mt-lg">
        <div class="stat-cell">
          <div class="stat-label">Assigned tasks</div>
          <div class="stat-value">{{ assignedTasks }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Allocated hours</div>
          <div class="stat-value">{{ allocatedHours }}h</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Daily capacity</div>
          <div class="stat-value">{{ dailyCapacity }}h</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Remaining today</div>
          <div class="stat-value">{{ remaining }}h</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  utilization: number;
  allocatedHours: number;
  dailyCapacity: number;
  remaining: number;
  assignedTasks: number;
}>();

const loadColor = computed(() => {
  if (props.utilization >= 90) return 'negative';
  if (props.utilization >= 70) return 'warning';
  return 'positive';
});

const loadLabel = computed(() => {
  if (props.utilization >= 90) return 'Overloaded';
  if (props.utilization >= 70) return 'Busy';
  return 'On track';
});
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
