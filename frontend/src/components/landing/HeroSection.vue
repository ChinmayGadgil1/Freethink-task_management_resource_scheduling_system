<template>
  <section class="hero-section">
    <!-- Ambient Blur Glows -->
    <div class="glow-orb glow-purple-left" />
    <div class="glow-orb glow-purple-right" />

    <div class="container hero-container">
      <div class="row q-col-gutter-lg items-center">
        <!-- Left Column: Editorial Copy & Action -->
        <div class="col-12 col-lg-5 hero-copy-col">
          <div class="eyebrow-pill q-mb-sm">
            <span class="sparkle">✦</span>
            <span>Smart Project Management</span>
          </div>

          <h1 class="hero-title">
            Plan. Track.<br />
            Deliver. <span class="accent-word">Together.</span>
          </h1>

          <p class="hero-subtitle">
            TaskFlow empowers teams to plan projects, assign work, manage resource capacity, track
            live progress, and hit every milestone with complete clarity.
          </p>

          <div class="hero-actions-row row items-center q-gutter-sm q-mb-md">
            <q-btn
              unelevated
              no-caps
              label="Get Started"
              icon-right="arrow_forward"
              class="primary-cta-btn"
              @click="goToSignup"
            />
            <q-btn
              flat
              no-caps
              label="Explore Features"
              class="secondary-cta-btn"
              @click="scrollToFeatures"
            />
          </div>

          <!-- Value Prop Badges -->
          <div class="hero-indicators-row row wrap items-center q-gutter-x-md q-gutter-y-xs">
            <div class="indicator-item">
              <span class="indicator-icon">✦</span>
              <span>Smart Scheduling</span>
            </div>
            <div class="indicator-item">
              <span class="indicator-icon">✦</span>
              <span>Resource Allocation</span>
            </div>
            <div class="indicator-item">
              <span class="indicator-icon">✦</span>
              <span>Real-Time Insights</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Real TaskFlow Workspace & Gantt Preview -->
        <div class="col-12 col-lg-7 hero-mockup-col">
          <div class="mockup-frame-wrapper">
            <div class="mockup-device-card">
              <!-- Top Device Bar -->
              <div class="device-header row items-center justify-between">
                <div class="header-left row items-center gap-xs">
                  <div class="brand-avatar-mini flex flex-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="6" fill="#8B6FD8" />
                      <path
                        d="M7 12.5L10.5 16L17 8.5"
                        stroke="white"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="device-user-title">TaskFlow Workspace</div>
                    <div class="device-user-sub">Schedule & Timeline View</div>
                  </div>
                </div>

                <div class="header-right row items-center q-gutter-xs">
                  <q-badge color="positive" class="live-status-pill">
                    <span class="status-live-dot" />
                    <span>Active Workspace</span>
                  </q-badge>
                </div>
              </div>

              <!-- Top Row: Real StatCard Metrics -->
              <div class="row q-col-gutter-xs hero-stats-row">
                <div class="col-4">
                  <LandingStatCard
                    title="Active Tasks"
                    value="14"
                    subtitle="4 due this week"
                    icon="task_alt"
                    color="primary"
                  />
                </div>
                <div class="col-4">
                  <LandingStatCard
                    title="Overall Progress"
                    value="76%"
                    subtitle="On track"
                    icon="insights"
                    color="positive"
                    :progress="76"
                  />
                </div>
                <div class="col-4">
                  <LandingStatCard
                    title="Team Capacity"
                    value="88%"
                    subtitle="Balanced workload"
                    icon="groups"
                    color="warning"
                  />
                </div>
              </div>

              <!-- Landing Gantt Preview Showcase -->
              <div class="hero-gantt-wrapper">
                <LandingGanttPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import LandingGanttPreview from '@/components/landing/previews/LandingGanttPreview.vue';
import LandingStatCard from '@/components/landing/previews/LandingStatCard.vue';

const router = useRouter();

function goToSignup() {
  void router.push('/signup');
}

function scrollToFeatures() {
  const el = document.getElementById('features');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<style scoped lang="scss">
.hero-section {
  position: relative;
  padding: 40px 0 48px 0;
  overflow: hidden;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Ambient glow blobs */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  opacity: 0.5;
}

.glow-purple-left {
  top: -60px;
  left: 5%;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(224, 214, 255, 0.7) 0%, rgba(243, 238, 255, 0) 70%);
}

.glow-purple-right {
  top: 5%;
  right: -5%;
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(216, 198, 255, 0.6) 0%, rgba(240, 235, 255, 0) 70%);
}

.hero-copy-col {
  position: relative;
  z-index: 2;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: #f4f0fd;
  border: 1px solid #e9ddfd;
  border-radius: 9999px;
  color: #8b6fd8;
  font-size: 12.5px;
  font-weight: 600;

  .sparkle {
    font-size: 11px;
  }
}

.hero-title {
  font-size: 46px;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: #121620;
  margin: 0 0 14px 0;

  .accent-word {
    color: #8b6fd8;
  }
}

.hero-subtitle {
  font-size: 16px;
  line-height: 1.55;
  color: #64748b;
  margin: 0 0 20px 0;
  max-width: 460px;
}

.primary-cta-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  box-shadow: 0 3px 14px rgba(139, 111, 216, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(139, 111, 216, 0.4);
  }
}

.secondary-cta-btn {
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    color: #1e293b;
    border-color: #cbd5e1;
  }
}

.indicator-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;

  .indicator-icon {
    color: #8b6fd8;
    font-size: 10px;
  }
}

/* Right Mockup Showcase Styling */
.hero-mockup-col {
  position: relative;
  z-index: 2;
}

.mockup-frame-wrapper {
  perspective: 1000px;
}

.mockup-device-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow:
    0 16px 48px -10px rgba(139, 111, 216, 0.16),
    0 4px 16px -2px rgba(16, 24, 40, 0.05);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    box-shadow:
      0 22px 56px -8px rgba(139, 111, 216, 0.22),
      0 6px 20px -2px rgba(16, 24, 40, 0.08);
  }
}

.device-header {
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.device-user-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.device-user-sub {
  font-size: 10.5px;
  color: #64748b;
  font-weight: 500;
}

.live-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffffff;
  animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.hero-stats-row {
  margin-bottom: 0;

  :deep(.stat-card-widget) {
    min-height: 76px;
    border-radius: 10px;
  }

  :deep(.stat-card-inner) {
    padding: 8px 10px;
  }

  :deep(.stat-value) {
    font-size: 18px;
  }

  :deep(.stat-title) {
    font-size: 10px;
  }

  :deep(.stat-meta) {
    font-size: 9.5px;
    margin-top: 2px;
  }

  :deep(.stat-icon-wrapper) {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
  }
}

.hero-gantt-wrapper {
  overflow: hidden;
  border-radius: 10px;

  :deep(.gantt-card) {
    border: 1px solid #edf2f7;
    border-radius: 10px;
    box-shadow: none;
  }

  :deep(.q-card__section) {
    padding: 8px 12px;
  }

  :deep(.gantt-scroll) {
    padding: 2px 0 4px;
  }

  :deep(.gantt-grid) {
    grid-auto-rows: minmax(48px, auto);
  }

  :deep(.label-col) {
    padding: 4px 10px;
  }

  :deep(.header-cell) {
    height: 36px;
  }

  :deep(.task-name) {
    font-size: 11px;
  }

  :deep(.task-project) {
    font-size: 9.5px;
  }

  :deep(.gantt-bar) {
    height: 22px;
  }
}

@media (max-width: 950px) {
  .hero-title {
    font-size: 36px;
  }
  .hero-subtitle {
    font-size: 15px;
  }
  .hero-section {
    padding: 32px 0 40px 0;
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 28px;
  }
  .hero-stats-row {
    display: none;
  }
}

body.body--dark {
  .hero-section {
    background: #0b0f19;
  }

  .glow-purple-left {
    background: radial-gradient(circle, rgba(139, 111, 216, 0.22) 0%, rgba(11, 15, 25, 0) 70%);
    opacity: 0.8;
  }

  .glow-purple-right {
    background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(11, 15, 25, 0) 70%);
    opacity: 0.8;
  }

  .eyebrow-pill {
    background: rgba(139, 111, 216, 0.12);
    border-color: rgba(139, 111, 216, 0.28);
    color: #a78bfa;
  }

  .hero-title {
    color: #f8fafc;

    .accent-word {
      color: #a78bfa;
    }
  }

  .hero-subtitle {
    color: #94a3b8;
  }

  .secondary-cta-btn {
    color: #cbd5e1;
    border-color: #283042;

    &:hover {
      background: #181d28;
      color: #ffffff;
      border-color: #3b455b;
    }
  }

  .indicator-item {
    color: #94a3b8;

    .indicator-icon {
      color: #a78bfa;
    }
  }

  .mockup-device-card {
    background: #131722;
    border-color: #283042;
    box-shadow:
      0 16px 48px -10px rgba(0, 0, 0, 0.65),
      0 4px 16px -2px rgba(0, 0, 0, 0.4);

    &:hover {
      box-shadow:
        0 22px 56px -8px rgba(0, 0, 0, 0.75),
        0 6px 20px -2px rgba(0, 0, 0, 0.5);
    }
  }

  .device-header {
    border-bottom-color: #1e2433;
  }

  .device-user-title {
    color: #f3f4f6;
  }

  .device-user-sub {
    color: #94a3b8;
  }
}
</style>
