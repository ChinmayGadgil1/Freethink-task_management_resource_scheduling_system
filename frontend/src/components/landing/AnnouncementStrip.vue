<template>
  <section class="announcement-strip-wrapper" aria-label="Announcement marquee">
    <div class="marquee-track">
      <div class="marquee-content">
        <span v-for="(item, idx) in marqueeItems" :key="'m1-' + idx" class="marquee-item">
          <span class="sparkle-diamond">✦</span>
          <span class="item-text">{{ item }}</span>
        </span>
      </div>
      <!-- Duplicate content for seamless infinite CSS marquee loop -->
      <div class="marquee-content" aria-hidden="true">
        <span v-for="(item, idx) in marqueeItems" :key="'m2-' + idx" class="marquee-item">
          <span class="sparkle-diamond">✦</span>
          <span class="item-text">{{ item }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const marqueeItems = [
  'SMART PROJECT MANAGEMENT',
  'RESOURCE SCHEDULING',
  'REAL-TIME PROGRESS TRACKING',
  'TEAM COLLABORATION',
  'WORKLOAD BALANCING',
  'VISUAL TIMELINES & GANTT',
  'AUTOMATED WORKFLOWS',
];
</script>

<style scoped lang="scss">
.announcement-strip-wrapper {
  width: 100%;
  background: #121620;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 0;
  overflow: hidden;
  position: relative;
  user-select: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 60px;
    z-index: 2;
    pointer-events: none;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, #121620, rgba(18, 22, 32, 0));
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, #121620, rgba(18, 22, 32, 0));
  }
}

.marquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: marqueeScroll 28s linear infinite;

  &:hover {
    animation-play-state: paused;
  }
}

.marquee-content {
  display: flex;
  align-items: center;
  gap: 36px;
  padding-right: 36px;
}

.marquee-item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.sparkle-diamond {
  color: #8b6fd8;
  font-size: 14px;
  line-height: 1;
  text-shadow: 0 0 8px rgba(139, 111, 216, 0.6);
}

.item-text {
  color: #f1f5f9;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-family: inherit;
  transition: color 0.2s ease;

  &:hover {
    color: #8b6fd8;
  }
}

@keyframes marqueeScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .announcement-strip-wrapper {
    padding: 11px 0;
  }
  .item-text {
    font-size: 12px;
    letter-spacing: 0.09em;
  }
  .marquee-content {
    gap: 24px;
    padding-right: 24px;
  }
}
</style>
