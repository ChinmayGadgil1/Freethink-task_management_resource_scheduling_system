<template>
  <section id="features" class="features-section">
    <div class="container">
      <!-- Section Header -->
      <div class="section-header text-center">
        <div class="eyebrow-text">POWERFUL FEATURES</div>
        <h2 class="section-title">
          Everything you need to<br class="gt-xs" />
          manage projects efficiently
        </h2>
      </div>

      <!-- Feature Cards Grid (3x2) -->
      <div class="row q-col-gutter-lg features-grid">
        <div v-for="feature in featuresList" :key="feature.title" class="col-12 col-sm-6 col-md-4">
          <FeatureCard
            :icon="feature.icon"
            :icon-bg="feature.iconBg"
            :icon-color="feature.iconColor"
            :title="feature.title"
            :description="feature.description"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import FeatureCard from './FeatureCard.vue';

const featuresList = [
  {
    icon: 'event_note',
    iconBg: '#F4F0FD',
    iconColor: '#8B6FD8',
    title: 'Project Planning',
    description: 'Create projects, set milestones and break work into manageable tasks.',
  },
  {
    icon: 'check_circle',
    iconBg: '#E6F7F5',
    iconColor: '#1ABC9C',
    title: 'Task Management',
    description: 'Assign tasks, set priorities and keep everyone aligned and accountable.',
  },
  {
    icon: 'groups',
    iconBg: '#FFF4EB',
    iconColor: '#F5841F',
    title: 'Resource Scheduling',
    description: 'Allocate the right people at the right time to balance workloads.',
  },
  {
    icon: 'insights',
    iconBg: '#EBF4FF',
    iconColor: '#2E90FA',
    title: 'Progress Tracking',
    description: 'Track real-time progress and stay updated with visual insights.',
  },
  {
    icon: 'pie_chart',
    iconBg: '#FDEEF0',
    iconColor: '#E15263',
    title: 'Reports & Analytics',
    description: 'Get detailed reports and analytics to make smarter decisions.',
  },
  {
    icon: 'notifications_active',
    iconBg: '#F4F0FD',
    iconColor: '#8B6FD8',
    title: 'Smart Notifications',
    description: 'Never miss important updates and deadlines with smart alerts.',
  },
];
</script>

<style scoped lang="scss">
.features-section {
  padding: 80px 0 96px 0;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  margin-bottom: 56px;
}

.eyebrow-text {
  color: #8b6fd8;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.section-title {
  font-size: 36px;
  line-height: 1.25;
  font-weight: 800;
  color: #181d28;
  letter-spacing: -0.03em;
  margin: 0;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 28px;
  }
}
</style>
