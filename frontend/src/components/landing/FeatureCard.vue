<template>
  <div class="feature-card">
    <div class="feature-icon-wrapper" :style="{ background: iconBg, color: iconColor }">
      <q-icon :name="icon" size="24px" />
    </div>

    <div class="feature-body">
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}>();
</script>

<style scoped lang="scss">
.feature-card {
  background: #ffffff;
  border: 1px solid #edf0f5;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    border-color: #d8b4fe;
    box-shadow: 0 12px 28px -4px rgba(139, 111, 216, 0.12);
  }
}

.feature-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.feature-card:hover .feature-icon-wrapper {
  transform: scale(1.05);
}

.feature-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-title {
  font-size: 18px;
  font-weight: 700;
  color: #181d28;
  letter-spacing: -0.02em;
  margin: 0;
}

.feature-description {
  font-size: 14.5px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}
</style>
