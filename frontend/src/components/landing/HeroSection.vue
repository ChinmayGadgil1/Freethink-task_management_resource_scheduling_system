<template>
  <section class="hero-section">
    <!-- Ambient Blur Glows -->
    <div class="glow-orb glow-purple-left" />
    <div class="glow-orb glow-purple-right" />

    <div class="container hero-container">
      <div class="row q-col-gutter-xl items-center">
        <!-- Left Column: Editorial Copy & Action -->
        <div class="col-12 col-md-6 hero-copy-col">
          <div class="eyebrow-pill q-mb-md">
            <span class="sparkle">✦</span>
            <span>Smart Project Management</span>
          </div>

          <h1 class="hero-title">
            Plan. Track.<br />
            Deliver. <span class="accent-word">Together.</span>
          </h1>

          <p class="hero-subtitle">
            TaskFlow empowers teams to plan projects, assign work, manage resources, track live
            progress, and hit every milestone with complete clarity.
          </p>

          <div class="hero-actions-row row items-center q-gutter-md q-pt-xs">
            <q-btn
              unelevated
              no-caps
              label="Get Started"
              icon-right="arrow_forward"
              class="primary-cta-btn"
              @click="goToSignup"
            />
          </div>

          <!-- Value Prop Badges (Honest & Authentic) -->
          <div class="hero-indicators-row row items-center q-pt-lg q-gutter-md">
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

        <!-- Right Column: Sleek Product Showcase Device Frame -->
        <div class="col-12 col-md-6 hero-mockup-col">
          <div class="mockup-frame-wrapper">
            <div class="mockup-device-card">
              <!-- Top Device Header -->
              <div class="device-header">
                <div class="header-left">
                  <div class="brand-avatar-mini">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                    <div class="device-user-title">Start Your Day & Be Productive ⚡</div>
                    <div class="device-user-sub">Active Workspace • Sprint 4</div>
                  </div>
                </div>

                <!-- Team Avatar Stack -->
                <div class="team-avatar-stack">
                  <span class="avatar-pill av-sarah">S</span>
                  <span class="avatar-pill av-alex">A</span>
                  <span class="avatar-pill av-elena">E</span>
                  <span class="avatar-pill av-plus">+4</span>
                </div>
              </div>

              <!-- Quick Search / Filter Bar -->
              <div class="device-search-bar">
                <q-icon name="search" size="16px" color="grey-6" />
                <span class="search-placeholder">Search tasks, milestones, team...</span>
                <span class="search-shortcut">⌘K</span>
              </div>

              <!-- Today's Primary Task Card -->
              <div class="device-task-card">
                <div class="task-card-header">
                  <div class="task-tag-badge">Today's Priority</div>
                  <span class="task-status-pill in-progress">In Progress</span>
                </div>

                <div class="task-title-text">Delivery App Kit & API Integration</div>
                <p class="task-desc-text">
                  Finalize sprint milestone dependencies and assign backend endpoints.
                </p>

                <div class="task-progress-section">
                  <div class="progress-meta-row">
                    <span class="progress-label">Sprint Progress</span>
                    <span class="progress-value">84%</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-active" style="width: 84%" />
                  </div>
                </div>
              </div>

              <!-- Floating Live Metric & Timeline Snippet -->
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <div class="mini-metric-box">
                    <div class="metric-icon-wrap velocity-icon">
                      <q-icon name="trending_up" size="16px" />
                    </div>
                    <div>
                      <div class="metric-val">+28%</div>
                      <div class="metric-sub">Team Velocity</div>
                    </div>
                  </div>
                </div>

                <div class="col-6">
                  <div class="mini-metric-box">
                    <div class="metric-icon-wrap schedule-icon">
                      <q-icon name="schedule" size="16px" />
                    </div>
                    <div>
                      <div class="metric-val">On Track</div>
                      <div class="metric-sub">May 20 Deadline</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mini Timeline Bar -->
              <div class="device-timeline-snippet">
                <div class="snippet-header">
                  <span class="snippet-title">Live Gantt Flow</span>
                  <span class="snippet-live-dot">● Active</span>
                </div>
                <div class="mini-timeline-track">
                  <div class="track-bar bar-1" style="width: 38%" title="Planning: 100%" />
                  <div class="track-bar bar-2" style="width: 44%" title="Development: 80%" />
                  <div class="track-bar bar-3" style="width: 18%" title="QA: In Review" />
                </div>
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

const router = useRouter();

function goToSignup() {
  void router.push('/signup');
}
</script>

<style scoped lang="scss">
.hero-section {
  position: relative;
  padding: 80px 0 96px 0;
  overflow: hidden;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Ambient glow blobs */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  opacity: 0.55;
}

.glow-purple-left {
  top: -60px;
  left: 10%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(224, 214, 255, 0.75) 0%, rgba(243, 238, 255, 0) 70%);
}

.glow-purple-right {
  top: 10%;
  right: -5%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(216, 198, 255, 0.65) 0%, rgba(240, 235, 255, 0) 70%);
}

.hero-copy-col {
  position: relative;
  z-index: 2;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #f4f0fd;
  border: 1px solid #e9ddfd;
  border-radius: 9999px;
  color: #8b6fd8;
  font-size: 13px;
  font-weight: 600;

  .sparkle {
    font-size: 12px;
  }
}

.hero-title {
  font-size: 56px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: #121620;
  margin: 0 0 22px 0;

  .accent-word {
    color: #8b6fd8;
  }
}

.hero-subtitle {
  font-size: 17.5px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 32px 0;
  max-width: 520px;
}

.primary-cta-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 15.5px;
  font-weight: 600;
  padding: 13px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(139, 111, 216, 0.35);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 111, 216, 0.45);
  }
}

.hero-indicators-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.indicator-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;

  .indicator-icon {
    color: #8b6fd8;
    font-size: 11px;
  }
}

/* Right Mockup Styling */
.hero-mockup-col {
  position: relative;
  z-index: 2;
}

.mockup-frame-wrapper {
  perspective: 1000px;
}

.mockup-device-card {
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow:
    0 24px 64px -12px rgba(139, 111, 216, 0.22),
    0 10px 28px -4px rgba(16, 24, 40, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 32px 72px -10px rgba(139, 111, 216, 0.28),
      0 14px 34px -4px rgba(16, 24, 40, 0.12);
  }
}

.device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-avatar-mini {
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-user-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.device-user-sub {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.team-avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-pill {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  margin-left: -6px;
  border: 2px solid #ffffff;

  &.av-sarah {
    background: #8b6fd8;
    margin-left: 0;
  }
  &.av-alex {
    background: #3b82f6;
  }
  &.av-elena {
    background: #10b981;
  }
  &.av-plus {
    background: #64748b;
    font-size: 9px;
  }
}

.device-search-bar {
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-placeholder {
  flex: 1;
  font-size: 12.5px;
  color: #94a3b8;
}

.search-shortcut {
  font-size: 10.5px;
  font-weight: 600;
  color: #94a3b8;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.device-task-card {
  background: #fbfbfd;
  border: 1px solid #edf0f5;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-tag-badge {
  font-size: 10.5px;
  font-weight: 700;
  color: #8b6fd8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.task-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;

  &.in-progress {
    background: #fdf4eb;
    color: #f5841f;
  }
}

.task-title-text {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.task-desc-text {
  font-size: 12.5px;
  line-height: 1.5;
  color: #64748b;
  margin: 0;
}

.task-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.progress-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.progress-value {
  font-size: 11px;
  font-weight: 700;
  color: #8b6fd8;
}

.progress-bar-bg {
  height: 6px;
  background: #edf0f5;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-active {
  height: 100%;
  background: linear-gradient(90deg, #8b6fd8 0%, #a78bfa 100%);
  border-radius: 9999px;
}

.mini-metric-box {
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.metric-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.velocity-icon {
    background: #ecfdf5;
    color: #10b981;
  }

  &.schedule-icon {
    background: #f5f3ff;
    color: #8b6fd8;
  }
}

.metric-val {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.metric-sub {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}

.device-timeline-snippet {
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.snippet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.snippet-title {
  font-size: 11px;
  font-weight: 700;
  color: #334155;
}

.snippet-live-dot {
  font-size: 9.5px;
  font-weight: 700;
  color: #10b981;
}

.mini-timeline-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.track-bar {
  height: 100%;

  &.bar-1 {
    background: #8b6fd8;
  }
  &.bar-2 {
    background: #3b82f6;
  }
  &.bar-3 {
    background: #f59e0b;
  }
}

@media (max-width: 950px) {
  .hero-title {
    font-size: 40px;
  }
  .hero-subtitle {
    font-size: 16px;
  }
  .hero-section {
    padding: 56px 0 64px 0;
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 32px;
  }
  .hero-indicators-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
