<template>
  <div class="landing-stat-card">
    <div class="stat-inner row items-center gap-sm">
      <div class="stat-icon-wrap flex flex-center no-shrink" :class="iconBgClass">
        <q-icon :name="icon" size="20px" :class="iconColorClass" />
      </div>

      <div class="stat-content col">
        <div class="stat-title ellipsis">{{ title }}</div>
        <div class="stat-value">{{ value }}</div>
        <div v-if="subtitle" class="stat-subtitle ellipsis" :class="subtitleColorClass">
          {{ subtitle }}
        </div>
      </div>
    </div>

    <!-- Optional Progress Bar -->
    <div v-if="progress !== undefined" class="stat-progress-wrap q-mt-xs">
      <div class="stat-progress-track">
        <div
          class="stat-progress-fill"
          :style="{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: progressFillColor,
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface LandingStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: 'primary' | 'positive' | 'warning' | 'negative' | 'info';
  progress?: number;
  progressColor?: string;
}

const props = withDefaults(defineProps<LandingStatCardProps>(), {
  subtitle: '',
  color: 'primary',
  progressColor: '',
});

const iconColorClass = computed(() => {
  switch (props.color) {
    case 'positive':
      return 'text-green';
    case 'warning':
      return 'text-orange';
    case 'negative':
      return 'text-red';
    case 'info':
      return 'text-blue';
    default:
      return 'text-purple';
  }
});

const iconBgClass = computed(() => {
  switch (props.color) {
    case 'positive':
      return 'bg-green-soft';
    case 'warning':
      return 'bg-orange-soft';
    case 'negative':
      return 'bg-red-soft';
    case 'info':
      return 'bg-blue-soft';
    default:
      return 'bg-purple-soft';
  }
});

const subtitleColorClass = computed(() => {
  if (props.color === 'positive') return 'sub-positive';
  if (props.color === 'warning') return 'sub-warning';
  if (props.color === 'negative') return 'sub-negative';
  return 'sub-default';
});

const progressFillColor = computed(() => {
  if (props.progressColor) return props.progressColor;
  if (props.color === 'positive') return '#12b76a';
  if (props.color === 'warning') return '#f79009';
  if (props.color === 'negative') return '#f04438';
  return '#8b6fd8';
});
</script>

<style scoped lang="scss">
.landing-stat-card {
  background: #ffffff;
  border: 1px solid #eaecef;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  height: 100%;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
  }
}

.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.stat-content {
  min-width: 0;
}

.stat-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.2;
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
  margin: 2px 0 1px 0;
}

.stat-subtitle {
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.2;

  &.sub-default {
    color: #64748b;
  }
  &.sub-positive {
    color: #12b76a;
  }
  &.sub-warning {
    color: #f79009;
  }
  &.sub-negative {
    color: #f04438;
  }
}

.stat-progress-wrap {
  margin-top: 8px;
}

.stat-progress-track {
  width: 100%;
  height: 5px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.stat-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* Scoped Soft Backgrounds */
.bg-purple-soft {
  background: rgba(139, 111, 216, 0.12);
}
.bg-green-soft {
  background: rgba(18, 183, 106, 0.12);
}
.bg-orange-soft {
  background: rgba(247, 144, 9, 0.12);
}
.bg-red-soft {
  background: rgba(240, 68, 56, 0.12);
}
.bg-blue-soft {
  background: rgba(46, 144, 250, 0.12);
}

.text-purple {
  color: #8b6fd8;
}
.text-green {
  color: #12b76a;
}
.text-orange {
  color: #f79009;
}
.text-red {
  color: #f04438;
}
.text-blue {
  color: #2e90fa;
}

body.body--dark {
  .landing-stat-card {
    background: #181d28;
    border-color: #283042;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);

    &:hover {
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    }
  }

  .stat-title {
    color: #94a3b8;
  }

  .stat-value {
    color: #f3f4f6;
  }

  .stat-progress-track {
    background: #283042;
  }

  .bg-purple-soft {
    background: rgba(139, 111, 216, 0.2);
  }
  .bg-green-soft {
    background: rgba(18, 183, 106, 0.2);
  }
  .bg-orange-soft {
    background: rgba(247, 144, 9, 0.2);
  }
  .bg-red-soft {
    background: rgba(240, 68, 56, 0.2);
  }
  .bg-blue-soft {
    background: rgba(46, 144, 250, 0.2);
  }
}
</style>
