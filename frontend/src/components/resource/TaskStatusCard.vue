<template>
  <q-card flat bordered class="task-status-card full-height">
    <q-card-section class="q-pa-lg">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="card-section-title">Task Overview</div>
          <div class="card-section-subtitle text-caption text-grey-6 q-mt-xs">
            Status distribution of your assigned tasks
          </div>
        </div>
        <q-badge
          color="grey-3"
          text-color="dark"
          :label="`${totalTasks} Total`"
          class="total-badge"
        />
      </div>

      <!-- Segmented bar: one glance at the full distribution -->
      <div class="segmented-bar-wrap">
        <div class="segmented-bar">
          <div
            v-for="item in items"
            :key="item.label"
            class="segment"
            :style="{
              width: `${totalTasks ? (item.value / totalTasks) * 100 : 0}%`,
              background: item.color,
            }"
          />
        </div>
      </div>

      <!-- Status Legend List -->
      <div class="status-list column gap-sm q-mt-md">
        <div v-for="item in items" :key="item.label" class="status-row row items-center justify-between">
          <div class="row items-center no-wrap">
            <span class="status-dot" :style="{ background: item.color }" />
            <span class="status-item-label">{{ item.label }}</span>
          </div>
          <div class="row items-center no-wrap gap-xs">
            <span class="status-item-val text-right">{{ item.value }}</span>
            <span class="status-item-pct">
              ({{ totalTasks ? Math.round((item.value / totalTasks) * 100) : 0 }}%)
            </span>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface TaskStatusItem {
  label: string;
  value: number;
  color: string;
}

const props = defineProps<{ items: TaskStatusItem[] }>();
const totalTasks = computed(() => props.items.reduce((sum, item) => sum + item.value, 0));
</script>

<style scoped lang="scss">
.task-status-card {
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

.total-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  background: var(--wo-bg-tag, #f1f5f9) !important;
  color: var(--wo-text-main, #1e293b) !important;
}

.segmented-bar-wrap {
  margin: 12px 0 16px;
}

.segmented-bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--wo-border-subtle, #f0f2f5);
}

.segment {
  height: 100%;
  transition: width 0.3s ease;

  &:not(:last-child) {
    border-right: 2px solid var(--wo-bg-card, #fff);
  }
}

.status-row {
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--wo-bg-page, #f8fafc);
  }
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
}

.status-item-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--wo-text-main, #1e293b);
}

.status-item-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
  min-width: 18px;
}

.status-item-pct {
  font-size: 11.5px;
  color: var(--wo-text-muted, #64748b);
}
</style>
