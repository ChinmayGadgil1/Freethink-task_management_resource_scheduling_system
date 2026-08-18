<template>
  <section class="dashboard-section">
    <!-- Left Section Info Card -->
    <div class="section-intro">
      <div class="section-number">{{ number }}</div>
      <div class="section-label">{{ label }}</div>

      <h2 class="section-title">{{ title }}</h2>
      <p class="section-description">{{ description }}</p>

      <a v-if="actionLabel" href="javascript:void(0)" class="section-action">
        <span>{{ actionLabel }}</span>
        <q-icon name="arrow_forward" size="14px" />
      </a>
    </div>

    <!-- Right Content Card with Navigation Arrows -->
    <div class="section-content-wrapper">
      <button
        v-if="showArrows"
        class="carousel-arrow prev"
        aria-label="Previous"
        @click="$emit('prev')"
      >
        <q-icon name="chevron_left" size="18px" />
      </button>

      <div class="section-content">
        <slot />
      </div>

      <button
        v-if="showArrows"
        class="carousel-arrow next"
        aria-label="Next"
        @click="$emit('next')"
      >
        <q-icon name="chevron_right" size="18px" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    number: string;
    label: string;
    title: string;
    description: string;
    actionLabel?: string;
    showArrows?: boolean;
  }>(),
  {
    showArrows: true,
  },
);

defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
}>();
</script>

<style scoped lang="scss">
.dashboard-section {
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
  box-shadow: var(--wo-card-shadow, 0 1px 3px rgba(16, 24, 40, 0.02));
}

.section-number {
  color: var(--wo-primary, #8b6fd8);
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.section-label {
  margin-top: 8px;
  color: var(--wo-text-muted, #667085);
  font-size: 10px;
  line-height: 1.2;
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

.section-content-wrapper {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

.section-content {
  flex: 1;
  min-width: 0;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 12px;
  padding: 16px 18px;
  overflow: hidden;
  box-shadow: var(--wo-card-shadow, 0 1px 3px rgba(16, 24, 40, 0.02));
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 50%;
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-muted, #667085);
  cursor: pointer;
  box-shadow: var(--wo-card-shadow, 0 2px 4px rgba(16, 24, 40, 0.06));
  transition: all 0.15s ease;
  padding: 0;
}

.carousel-arrow:hover {
  color: var(--wo-text-main, #1d2433);
  border-color: var(--wo-primary, #d0d5dd);
  background: var(--wo-bg-card-hover, #f9fafb);
}

.carousel-arrow.prev {
  left: -12px;
}

.carousel-arrow.next {
  right: -12px;
}

@media (max-width: 960px) {
  .dashboard-section {
    grid-template-columns: 1fr;
  }
}
</style>
