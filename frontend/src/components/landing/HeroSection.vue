<template>
  <section class="hero-section">
    <!-- Ambient Blur Glows -->
    <div class="glow-orb glow-purple-top" />
    <div class="glow-orb glow-purple-right" />

    <div class="container hero-container">
      <div class="row q-col-gutter-xl items-center">
        <!-- Left Column: Copy & Actions -->
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
            TaskFlow helps teams plan projects, assign work, track progress and hit every deadline
            with clarity.
          </p>

          <div class="hero-actions row items-center q-pt-sm">
            <q-btn
              unelevated
              no-caps
              label="Get Started"
              class="primary-cta-btn"
              @click="goToSignup"
            />
          </div>
        </div>

        <!-- Right Column: Visual Mockup matching Reference Design -->
        <div class="col-12 col-md-6 hero-mockup-col">
          <div class="mockup-frame-wrapper">
            <div class="mockup-window">
              <!-- Window Chrome Header -->
              <div class="window-header">
                <div class="window-dots">
                  <span class="dot dot-close" />
                  <span class="dot dot-min" />
                  <span class="dot dot-max" />
                </div>
                <div class="window-search-bar" />
              </div>

              <!-- Window Body: Sleek Mini TaskFlow Dashboard -->
              <div class="window-body">
                <!-- Mini Sidebar -->
                <div class="mini-sidebar">
                  <div class="mini-icon active-icon">
                    <q-icon name="dashboard" size="14px" />
                  </div>
                  <div class="mini-icon">
                    <q-icon name="folder" size="14px" />
                  </div>
                  <div class="mini-icon">
                    <q-icon name="task_alt" size="14px" />
                  </div>
                  <div class="mini-icon">
                    <q-icon name="groups" size="14px" />
                  </div>
                  <div class="mini-icon">
                    <q-icon name="bar_chart" size="14px" />
                  </div>
                  <div class="mini-icon">
                    <q-icon name="settings" size="14px" />
                  </div>
                </div>

                <!-- Mini Main Content -->
                <div class="mini-content">
                  <div class="mini-top-bar">
                    <div class="mini-title">Project Dashboard</div>
                    <div class="mini-badge">Live</div>
                  </div>

                  <!-- 4 Stat Metric Cards -->
                  <div class="mini-stats-grid">
                    <div class="mini-stat-card">
                      <div class="stat-meta">
                        <span class="stat-icon-box purple-box">
                          <q-icon name="folder" size="11px" />
                        </span>
                        <span class="stat-title">Total Projects</span>
                      </div>
                      <div class="stat-number">12</div>
                    </div>

                    <div class="mini-stat-card">
                      <div class="stat-meta">
                        <span class="stat-icon-box blue-box">
                          <q-icon name="autorenew" size="11px" />
                        </span>
                        <span class="stat-title">In Progress</span>
                      </div>
                      <div class="stat-number">8</div>
                    </div>

                    <div class="mini-stat-card">
                      <div class="stat-meta">
                        <span class="stat-icon-box green-box">
                          <q-icon name="check_circle" size="11px" />
                        </span>
                        <span class="stat-title">Completed</span>
                      </div>
                      <div class="stat-number">4</div>
                    </div>

                    <div class="mini-stat-card">
                      <div class="stat-meta">
                        <span class="stat-icon-box pink-box">
                          <q-icon name="schedule" size="11px" />
                        </span>
                        <span class="stat-title">Overdue</span>
                      </div>
                      <div class="stat-number">2</div>
                    </div>
                  </div>

                  <!-- Project Timeline Gantt Card -->
                  <div class="mini-gantt-card">
                    <div class="gantt-header">
                      <span class="gantt-title">Project Timeline</span>
                      <div class="gantt-days-row">
                        <span class="month-name">May</span>
                        <span
                          v-for="day in [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                          :key="day"
                          class="gantt-day-num"
                          :class="{ 'day-active': day === 15 }"
                        >
                          {{ day }}
                        </span>
                      </div>
                    </div>

                    <!-- Gantt Rows -->
                    <div class="gantt-rows-container">
                      <!-- Vertical current-day marker line -->
                      <div class="today-marker-line" />

                      <div class="gantt-row">
                        <span class="row-label">Research & Planning</span>
                        <div class="row-track">
                          <div class="gantt-bar bar-purple" style="left: 0%; width: 36%">
                            <span class="bar-tag">Done</span>
                          </div>
                        </div>
                      </div>

                      <div class="gantt-row">
                        <span class="row-label">Design System</span>
                        <div class="row-track">
                          <div class="gantt-bar bar-blue" style="left: 20%; width: 44%">
                            <span class="bar-user-circle user-sarah">S</span>
                          </div>
                        </div>
                      </div>

                      <div class="gantt-row">
                        <span class="row-label">Development</span>
                        <div class="row-track">
                          <div class="gantt-bar bar-green" style="left: 30%; width: 50%">
                            <span class="bar-user-circle user-alex">A</span>
                          </div>
                        </div>
                      </div>

                      <div class="gantt-row">
                        <span class="row-label">Testing</span>
                        <div class="row-track">
                          <div class="gantt-bar bar-orange" style="left: 50%; width: 38%">
                            <span class="bar-user-circle user-elena">E</span>
                          </div>
                        </div>
                      </div>

                      <div class="gantt-row">
                        <span class="row-label">Deployment</span>
                        <div class="row-track">
                          <div class="gantt-bar bar-pink" style="left: 70%; width: 28%">
                            <span class="bar-tag">May 20</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
  padding: 64px 0 88px 0;
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
  filter: blur(80px);
  opacity: 0.6;
}

.glow-purple-top {
  top: -40px;
  left: 20%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(224, 214, 255, 0.7) 0%, rgba(243, 238, 255, 0) 70%);
}

.glow-purple-right {
  top: 10%;
  right: -5%;
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(216, 198, 255, 0.65) 0%, rgba(240, 235, 255, 0) 70%);
}

.hero-copy-col {
  position: relative;
  z-index: 2;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  font-size: 52px;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: #181d28;
  margin: 0 0 20px 0;

  .accent-word {
    color: #8b6fd8;
  }
}

.hero-subtitle {
  font-size: 17.5px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 28px 0;
  max-width: 500px;
}

.primary-cta-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 28px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(139, 111, 216, 0.35);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 111, 216, 0.45);
  }
}

/* Right Column Mockup Styling */
.hero-mockup-col {
  position: relative;
  z-index: 2;
}

.mockup-frame-wrapper {
  perspective: 1000px;
}

.mockup-window {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 20px 48px -10px rgba(139, 111, 216, 0.18),
    0 8px 24px -4px rgba(16, 24, 40, 0.08);
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 26px 56px -8px rgba(139, 111, 216, 0.22),
      0 12px 28px -4px rgba(16, 24, 40, 0.1);
  }
}

.window-header {
  height: 36px;
  background: #f8fafc;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 12px;
}

.window-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.dot-close {
  background: #f87171;
}
.dot-min {
  background: #fbbf24;
}
.dot-max {
  background: #34d399;
}

.window-search-bar {
  flex: 1;
  max-width: 180px;
  height: 18px;
  background: #e2e8f0;
  border-radius: 6px;
  opacity: 0.6;
}

.window-body {
  display: flex;
  min-height: 380px;
  background: #fbfbfd;
}

.mini-sidebar {
  width: 44px;
  border-right: 1px solid #f0f2f5;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 14px;
}

.mini-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;

  &.active-icon {
    background: #f4f0fd;
    color: #8b6fd8;
  }
}

.mini-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mini-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.mini-badge {
  font-size: 10px;
  font-weight: 600;
  color: #059669;
  background: #d1fae5;
  padding: 2px 7px;
  border-radius: 6px;
}

.mini-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mini-stat-card {
  background: #ffffff;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.purple-box {
  background: #f4f0fd;
  color: #8b6fd8;
}
.blue-box {
  background: #eff6ff;
  color: #3b82f6;
}
.green-box {
  background: #ecfdf5;
  color: #10b981;
}
.pink-box {
  background: #fdf2f8;
  color: #ec4899;
}

.stat-title {
  font-size: 9px;
  color: #64748b;
  white-space: nowrap;
  font-weight: 500;
}

.stat-number {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

/* Mini Gantt Card */
.mini-gantt-card {
  background: #ffffff;
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gantt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}

.gantt-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
}

.gantt-days-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .month-name {
    font-size: 9.5px;
    font-weight: 700;
    color: #64748b;
    margin-right: 4px;
  }
}

.gantt-day-num {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
  width: 14px;
  text-align: center;

  &.day-active {
    color: #ef4444;
    font-weight: 700;
  }
}

.gantt-rows-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-top: 4px;
}

.today-marker-line {
  position: absolute;
  left: 64%;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1.5px dashed #f87171;
  pointer-events: none;
  z-index: 3;
}

.gantt-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-label {
  width: 100px;
  font-size: 9.5px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-track {
  flex: 1;
  height: 18px;
  background: #f8fafc;
  border-radius: 6px;
  position: relative;
}

.gantt-bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 3px;
}

.bar-purple {
  background: #8b6fd8;
}
.bar-blue {
  background: #60a5fa;
}
.bar-green {
  background: #4ade80;
}
.bar-orange {
  background: #fb923c;
}
.bar-pink {
  background: #f472b6;
}

.bar-tag {
  font-size: 8px;
  font-weight: 600;
  color: #ffffff;
  padding: 0 4px;
}

.bar-user-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  font-size: 7px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-sarah {
  color: #2563eb;
}
.user-alex {
  color: #16a34a;
}
.user-elena {
  color: #ea580c;
}

@media (max-width: 950px) {
  .hero-title {
    font-size: 38px;
  }
  .hero-subtitle {
    font-size: 16px;
  }
}
</style>
