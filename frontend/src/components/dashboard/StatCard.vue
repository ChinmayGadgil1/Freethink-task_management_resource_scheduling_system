<template>
  <q-card
    flat
    bordered
    class="stat-card-widget"
    :class="{
      'cursor-pointer': clickable,
      'has-badge-layout': !!badge,
      'is-negative-card': isNegative,
      'is-dense': dense,
    }"
    @click="clickable && $emit('click')"
  >
    <q-card-section class="stat-card-inner">
      <!-- Badge layout: Top row with Icon on left and Badge Pill on right -->
      <template v-if="badge">
        <div class="stat-card-top-row row items-center justify-between q-mb-sm">
          <div
            class="stat-icon-wrapper flex flex-center"
            :style="{ backgroundColor: resolvedBgColor, color: resolvedColor }"
          >
            <q-icon :name="icon" size="20px" />
          </div>
          <span
            class="stat-badge-pill"
            :style="{
              backgroundColor: resolvedBgColor,
              color: resolvedColor,
            }"
          >
            {{ badge }}
          </span>
        </div>

        <div class="stat-badge-bottom column">
          <div class="stat-value" :class="[{ 'text-negative': isNegative }, valueSizeClass]">{{ value }}</div>
          <div class="stat-title">{{ title }}</div>
          <div v-if="subtitle" class="stat-meta" :class="[noteClass, { negative: isNegative }]">
            {{ subtitle }}
          </div>
        </div>
      </template>

      <!-- Standard layout: Horizontal icon on left, content on right -->
      <template v-else>
        <div class="stat-standard-layout row items-center">
          <div
            class="stat-icon-wrapper flex flex-center"
            :style="{ backgroundColor: resolvedBgColor, color: resolvedColor }"
          >
            <q-icon :name="icon" :size="dense ? '18px' : '20px'" />
          </div>

          <div class="stat-content column col">
            <div class="stat-title" :title="title">{{ title }}</div>
            <div
              class="stat-value"
              :class="[{ 'text-negative': isNegative }, valueSizeClass]"
              :title="String(value)"
            >
              {{ value }}
            </div>
            <div
              v-if="subtitle"
              class="stat-meta"
              :class="[noteClass, { negative: isNegative }]"
              :title="subtitle"
            >
              {{ subtitle }}
            </div>
          </div>
        </div>
      </template>

      <!-- Optional Linear Progress Bar -->
      <div v-if="progress !== undefined" class="stat-progress-wrap q-mt-sm">
        <q-linear-progress
          rounded
          size="6px"
          :value="progress / 100"
          :color="progressColor || color || 'primary'"
          track-color="grey-3"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  iconBg?: string;
  badge?: string;
  badgeColor?: string;
  progress?: number;
  progressColor?: string;
  negative?: boolean;
  noteClass?: string;
  clickable?: boolean;
  dense?: boolean;
}

const props = withDefaults(defineProps<StatCardProps>(), {
  subtitle: '',
  icon: 'analytics',
  color: 'primary',
  iconBg: '',
  badge: '',
  badgeColor: '',
  progressColor: '',
  negative: false,
  noteClass: '',
  clickable: true,
  dense: false,
});

defineEmits<{
  (e: 'click'): void;
}>();

const valueSizeClass = computed(() => {
  const str = String(props.value ?? '');
  if (str.length > 7) return 'stat-value--xs';
  if (str.length > 4) return 'stat-value--sm';
  return '';
});

const resolvedColor = computed(() => {
  if (!props.color) return '#8b6fd8';
  const quasarColorMap: Record<string, string> = {
    primary: '#8b6fd8',
    secondary: '#26a69a',
    positive: '#12b76a',
    negative: '#f04438',
    warning: '#f79009',
    info: '#2e90fa',
    dark: '#1d2433',
    purple: '#8b6fd8',
    green: '#12b76a',
    orange: '#f79009',
    blue: '#2e90fa',
    red: '#f04438',
    teal: '#0e9384',
    sky: '#0284c7',
    amber: '#d97706',
    mint: '#059669',
    rose: '#e11d48',
  };
  return quasarColorMap[props.color] || props.color;
});

const resolvedBgColor = computed(() => {
  if (props.iconBg) return props.iconBg;
  const hex = resolvedColor.value;
  if (hex.startsWith('#')) {
    return `${hex}18`;
  }
  return 'rgba(139, 111, 216, 0.12)';
});

const isNegative = computed(() => props.negative || props.subtitle.includes('↓'));
</script>

<style scoped lang="scss">
.stat-card-widget {
  height: 100%;
  min-height: 84px;
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    border-color: var(--wo-primary, #8b6fd8);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
    transform: translateY(-1px);
  }
}

.stat-card-inner {
  padding: 12px 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Standard horizontal layout */
.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  min-width: 40px;
  flex: 0 0 40px;
  border-radius: 10px;
}

.stat-standard-layout {
  min-width: 0;
  overflow: hidden;
  gap: 10px;
}

.stat-content {
  min-width: 0;
  overflow: hidden;
}

.stat-title {
  color: var(--wo-text-muted, #667085);
  font-size: 11.5px;
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  margin-top: 2px;
  color: var(--wo-text-main, #1d2433);
  font-size: 22px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.stat-value--sm {
    font-size: 17px;
  }

  &.stat-value--xs {
    font-size: 13.5px;
    letter-spacing: -0.01em;
  }
}

.stat-meta {
  margin-top: 3px;
  color: var(--wo-text-muted, #667085);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.negative {
    color: #f04438 !important;
    font-weight: 600;
  }
}

/* Dense layout for compact grids (e.g., 6-card row) */
.is-dense {
  min-height: 78px;

  .stat-card-inner {
    padding: 10px 12px;
  }

  .stat-standard-layout {
    gap: 8px;
  }

  .stat-icon-wrapper {
    width: 36px;
    height: 36px;
    min-width: 36px;
    flex: 0 0 36px;
    border-radius: 8px;
  }

  .stat-title {
    font-size: 11px;
    line-height: 1.2;
    letter-spacing: -0.015em;
  }

  .stat-value {
    font-size: 19px;
    margin-top: 1px;
    line-height: 1.15;

    &.stat-value--sm {
      font-size: 15.5px;
    }

    &.stat-value--xs {
      font-size: 13px;
    }
  }

  .stat-meta {
    font-size: 10px;
    margin-top: 2px;
    line-height: 1.2;
  }
}

/* Badge layout (used in Resource Dashboard pastel cards) */
.has-badge-layout .stat-card-inner {
  justify-content: space-between;
}

.stat-badge-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-badge-bottom {
  .stat-value {
    font-size: 26px;
    margin-top: 0;
  }

  .stat-title {
    font-size: 12px;
    font-weight: 600;
    margin-top: 2px;
  }

  .stat-meta {
    margin-top: 3px;
  }
}

/* Note color helpers */
.note-green,
.stat-green {
  color: #12b76a !important;
  font-weight: 600;
}

.note-orange,
.stat-orange {
  color: #f79009 !important;
  font-weight: 600;
}

.note-red,
.stat-red {
  color: #f04438 !important;
  font-weight: 600;
}

.note-purple,
.stat-purple-text {
  color: #8b6fd8 !important;
  font-weight: 600;
}

.note-blue,
.stat-blue {
  color: #2e90fa !important;
  font-weight: 600;
}

.note-teal {
  color: #0e9384 !important;
  font-weight: 600;
}

/* Dark mode adjustments */
body.body--dark {
  .stat-card-widget {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border, #1e2433);

    &:hover {
      border-color: var(--wo-primary, #8b6fd8);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
  }

  .stat-title {
    color: var(--wo-text-muted, #94a3b8);
  }

  .stat-value {
    color: var(--wo-text-main, #f3f4f6);
  }

  .stat-meta {
    color: var(--wo-text-muted, #94a3b8);
  }
}
</style>
