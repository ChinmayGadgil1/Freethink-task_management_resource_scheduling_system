<template>
  <div class="stat-card">
    <div class="stat-icon-wrapper" :style="{ backgroundColor: iconBgColor, color: iconColor }">
      <q-icon :name="icon" size="22px" />
    </div>

    <div class="stat-content">
      <div class="stat-title">{{ title }}</div>
      <div class="stat-value">{{ value }}</div>
      <div class="stat-meta" :class="{ negative: isNegative }">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
    iconBg?: string;
    negative?: boolean;
  }>(),
  {
    subtitle: '',
    iconBg: '',
    negative: false,
  },
);

const iconColor = computed(() => props.color);
const iconBgColor = computed(() => props.iconBg || `${props.color}15`);
const isNegative = computed(() => props.negative || props.subtitle.includes('↓'));
</script>

<style scoped lang="scss">
.stat-card {
  flex: 1 1 0;
  min-width: 170px;
  height: 96px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #eaecef;
  border-radius: 10px;
  background: #ffffff;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: #d0d5dd;
  box-shadow: 0 4px 8px rgba(16, 24, 40, 0.04);
}

.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.stat-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.stat-title {
  color: #667085;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 500;
  white-space: nowrap;
}

.stat-value {
  margin-top: 4px;
  color: #1d2433;
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.stat-meta {
  margin-top: 5px;
  color: #12b76a;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.stat-meta.negative {
  color: #f04438;
}
</style>
