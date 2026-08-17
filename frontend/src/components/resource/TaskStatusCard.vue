<template>
  <q-card flat bordered class="dashboard-card full-height">
    <q-card-section>
      <!-- Segmented bar: one glance at the full distribution -->
      <div class="segmented-bar">
        <div
          v-for="item in items" :key="item.label"
          class="segment"
          :style="{ width: `${(item.value / total) * 100}%`, background: item.color }"
        />
      </div>

      <div class="status-list q-mt-md">
        <div v-for="item in items" :key="item.label" class="status-row">
          <div class="row items-center no-wrap">
            <span class="status-dot" :style="{ background: item.color }" />
            <span class="text-body2">{{ item.label }}</span>
          </div>
          <div class="row items-center no-wrap">
            <span class="text-weight-bold q-mr-xs">{{ item.value }}</span>
            <span class="text-caption text-grey-6">({{ Math.round((item.value / total) * 100) }}%)</span>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TaskStatusItem {
  label: string
  value: number
  color: string
}

const props = defineProps<{ items: TaskStatusItem[] }>()
const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0) || 1)
</script>

<style scoped lang="scss">
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

  &:not(:last-child) { border-right: 2px solid var(--wo-bg-card, #fff); }
}

.status-list { display: flex; flex-direction: column; gap: 10px; }

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
}
</style>
