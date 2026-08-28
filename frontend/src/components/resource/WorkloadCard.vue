<template>
  <q-card flat bordered class="workload-card full-height">
    <q-card-section class="q-pa-lg">
      <div class="row items-start justify-between">
        <div>
          <div class="card-section-title">Effort & Workload</div>
          <div class="card-section-subtitle text-caption text-grey-6 q-mt-xs">
            expected effort across your active tasks
          </div>
        </div>
        <q-badge color="primary" label="Allocated Effort" class="load-badge" />
      </div>

      <div class="effort-hero-display column q-mt-md">
        <div class="effort-big-number">
          {{ formatNumber(allocatedHours) }}<span class="unit-text">h</span>
        </div>
        <div class="effort-progress-block q-mt-xs">
          <div class="row justify-between q-mb-xs">
            <span class="text-caption text-weight-bold text-muted-subtle">Effort consumed</span>
            <span
              class="text-caption text-weight-bolder"
              :class="consumedPct > 100 ? 'text-negative' : 'text-primary'"
            >
              {{ consumedPct }}%
            </span>
          </div>
          <q-linear-progress
            :value="Math.min(1, consumedPct / 100)"
            size="8px"
            rounded
            :color="consumedPct > 100 ? 'negative' : 'primary'"
            track-color="grey-3"
            class="workload-progress-track"
          />
        </div>
      </div>

      <div class="stat-cells-grid q-mt-lg">
        <div class="stat-cell stat-purple">
          <div class="stat-label">Active tasks</div>
          <div class="stat-value ellipsis">{{ assignedTasks }}</div>
        </div>
        <div class="stat-cell stat-blue">
          <div class="stat-label">Actual effort</div>
          <div class="stat-value ellipsis">{{ formatHours(actualHours) }}</div>
        </div>
        <div class="stat-cell stat-mint">
          <div class="stat-label">Remaining effort</div>
          <div class="stat-value ellipsis">{{ formatHours(remainingHours) }}</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatHours, formatNumber } from '@/utils/formatters';

const props = defineProps<{
  allocatedHours: number;
  actualHours: number;
  remainingHours: number;
  assignedTasks: number;
}>();

const consumedPct = computed(() =>
  props.allocatedHours
    ? Math.min(100, Math.round((props.actualHours / props.allocatedHours) * 100))
    : 0,
);
</script>

<style scoped lang="scss">
.workload-card {
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  transition: all 0.2s ease;
}

.card-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
  letter-spacing: -0.01em;
}

.load-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  background: var(--wo-primary, #8b6fd8) !important;
}

.effort-big-number {
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--wo-text-main, #1e293b);

  .unit-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--wo-text-muted, #94a3b8);
    margin-left: 2px;
  }
}

.text-muted-subtle {
  color: var(--wo-text-muted, #64748b);
  font-size: 11.5px;
}

.workload-progress-track {
  border-radius: 6px;
}

.stat-cells-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-cell {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--wo-border-subtle, #f0f2f5);
  transition: transform 0.15s ease;

  &.stat-purple {
    background: rgba(139, 111, 216, 0.07);
    .stat-value {
      color: var(--wo-primary, #8b6fd8);
    }
  }

  &.stat-blue {
    background: rgba(59, 130, 246, 0.07);
    .stat-value {
      color: #3b82f6;
    }
  }

  &.stat-mint {
    background: rgba(16, 185, 129, 0.07);
    .stat-value {
      color: #10b981;
    }
  }
}

.stat-label {
  color: var(--wo-text-muted, #64748b);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
</style>
