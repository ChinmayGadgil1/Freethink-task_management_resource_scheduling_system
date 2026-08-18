<template>
  <section class="workspace-section">
    <div class="section-intro">
      <div class="section-number">{{ number }}</div>
      <div class="section-label">{{ label }}</div>
      <h2 class="section-title">{{ title }}</h2>
      <p class="section-description">{{ description }}</p>
      <a
        v-if="actionLabel"
        href="javascript:void(0)"
        class="section-action"
        @click="$emit('action')"
      >
        <span>{{ actionLabel }}</span>
        <q-icon name="arrow_forward" size="14px" />
      </a>
    </div>

    <div class="section-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  number: string;
  label: string;
  title: string;
  description: string;
  actionLabel?: string;
}>();

defineEmits<{ (e: 'action'): void }>();
</script>

<style scoped lang="scss">
.workspace-section {
  display: grid;
  grid-template-columns: 204px minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 18px;
  align-items: stretch;
}

.section-intro {
  display: flex;
  flex-direction: column;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 12px;
  padding: 20px 18px 18px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.02);
}

.section-number {
  color: var(--wo-primary, #8b6fd8);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.section-label {
  margin-top: 8px;
  color: var(--wo-text-muted, #667085);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-title {
  margin: 14px 0 0;
  color: var(--wo-text-main, #1d2433);
  font-size: 17px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.section-description {
  margin: 8px 0 0;
  color: var(--wo-text-muted, #667085);
  font-size: 11px;
  line-height: 1.45;
  flex-grow: 1;
}

.section-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  color: var(--wo-primary, #8b6fd8);
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.2s ease;
}
.section-action:hover {
  gap: 7px;
  color: var(--wo-primary-dark, #7554cc);
}

.section-content {
  min-width: 0;
}

@media (max-width: 960px) {
  .workspace-section {
    grid-template-columns: 1fr;
  }
}
</style>
