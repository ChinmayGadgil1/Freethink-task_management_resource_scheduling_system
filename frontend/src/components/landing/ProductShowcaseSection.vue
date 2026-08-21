<template>
  <div class="product-showcase-container">
    <!-- Showcase 1: Text Left | Product Visual Right -->
    <section id="features" class="showcase-section showcase-one">
      <div class="container">
        <div class="row q-col-gutter-xl items-center">
          <!-- Text Column (Left) -->
          <div class="col-12 col-md-6 showcase-text-col">
            <div class="eyebrow-badge q-mb-md">
              <span>ABOUT TASKFLOW</span>
            </div>

            <h2 class="showcase-title">
              Solution for Efficient<br />
              Task Management.
            </h2>

            <p class="showcase-description">
              We empower teams to achieve their full potential by providing a seamless, intuitive
              platform for organizing, prioritizing, and scheduling work with precision.
            </p>

            <div class="section-divider-line" />

            <!-- Compact Highlights Grid -->
            <div class="highlights-grid row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="highlight-item">
                  <div class="highlight-icon-box orange-box">
                    <q-icon name="calendar_today" size="20px" />
                  </div>
                  <h3 class="highlight-title">Smart Scheduling</h3>
                  <p class="highlight-desc">
                    Plan sprint timelines, balance workloads, and ensure every milestone stays on
                    track.
                  </p>
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <div class="highlight-item">
                  <div class="highlight-icon-box purple-box">
                    <q-icon name="hub" size="20px" />
                  </div>
                  <h3 class="highlight-title">Real-Time Collaboration</h3>
                  <p class="highlight-desc">
                    Keep project managers and team members synchronized with instant status feeds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Visual Column (Right) -->
          <div class="col-12 col-md-6 showcase-visual-col">
            <div class="visual-card-frame dark-card-backdrop">
              <!-- Mockup App Window -->
              <div class="mockup-device-body">
                <!-- Top Mini App Header -->
                <div class="app-header-row">
                  <div class="back-btn-pill">
                    <q-icon name="chevron_left" size="18px" />
                  </div>
                  <div class="app-header-title">Delivery App Sprint v2.4</div>
                  <div class="header-status-dot" />
                </div>

                <!-- Floating Sprint Info Tag -->
                <div class="floating-sprint-tag">
                  <span class="pulse-dot" />
                  <span>Sprint Deadline: May 20</span>
                </div>

                <!-- Progress Metric Container -->
                <div class="metric-visual-container">
                  <div class="metric-header">
                    <span class="metric-label">Task Progress</span>
                    <span class="metric-val-tag">+28% Velocity</span>
                  </div>

                  <!-- Vertical/Horizontal Comparison Bars -->
                  <div class="progress-bars-display">
                    <div class="bar-col">
                      <div class="bar-fill-track">
                        <div class="bar-fill purple-fill" style="height: 65%">
                          <span class="bar-badge">+12%</span>
                        </div>
                      </div>
                      <span class="bar-date">10</span>
                    </div>

                    <div class="bar-col">
                      <div class="bar-fill-track">
                        <div class="bar-fill purple-fill" style="height: 82%">
                          <span class="bar-badge">+24%</span>
                        </div>
                      </div>
                      <span class="bar-date">12</span>
                    </div>

                    <div class="bar-col active-col">
                      <div class="bar-fill-track">
                        <div class="bar-fill highlight-fill" style="height: 94%">
                          <span class="bar-badge-active">94%</span>
                        </div>
                      </div>
                      <span class="bar-date active-date">14</span>
                    </div>

                    <div class="bar-col">
                      <div class="bar-fill-track">
                        <div class="bar-fill teal-fill" style="height: 70%">
                          <span class="bar-badge">+18%</span>
                        </div>
                      </div>
                      <span class="bar-date">16</span>
                    </div>

                    <div class="bar-col">
                      <div class="bar-fill-track">
                        <div class="bar-fill teal-fill" style="height: 88%">
                          <span class="bar-badge">+26%</span>
                        </div>
                      </div>
                      <span class="bar-date">18</span>
                    </div>
                  </div>
                </div>

                <!-- Timeline Preview Mini Card -->
                <div class="timeline-preview-card">
                  <div class="timeline-title-row">
                    <span class="timeline-label">Active Task Timeline</span>
                    <span class="timeline-status-tag">On Track</span>
                  </div>
                  <div class="timeline-progress-rail">
                    <div class="timeline-segment seg-1" style="width: 45%" />
                    <div class="timeline-segment seg-2" style="width: 35%" />
                    <div class="timeline-segment seg-3" style="width: 20%" />
                  </div>
                  <div class="timeline-meta-row">
                    <span class="meta-sub">Design System & API Integration</span>
                    <span class="meta-due">3 days left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Showcase 2: Product Visual Left | Text Right (ALTERNATING LAYOUT) -->
    <section id="how-it-works" class="showcase-section showcase-two">
      <div class="container">
        <div class="row q-col-gutter-xl items-center">
          <!-- Product Visual Column (Left) -->
          <div class="col-12 col-md-6 showcase-visual-col order-md-first">
            <div class="visual-card-frame dark-card-backdrop">
              <!-- Calendar / Schedule Grid Mockup -->
              <div class="mockup-device-body calendar-body">
                <!-- Month Header -->
                <div class="calendar-header-row">
                  <div class="calendar-month-title">
                    <q-icon name="event" size="18px" class="q-mr-xs text-primary" />
                    <span>Sprint Calendar</span>
                  </div>
                  <div class="month-selector-pill">
                    <span>May 2026</span>
                    <q-icon name="expand_more" size="16px" />
                  </div>
                </div>

                <!-- Calendar Weekdays -->
                <div class="calendar-weekdays-row">
                  <span v-for="d in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="d">{{ d }}</span>
                </div>

                <!-- Calendar Days Grid -->
                <div class="calendar-grid">
                  <div
                    v-for="day in calendarDays"
                    :key="day.num"
                    class="calendar-cell"
                    :class="{
                      'cell-active': day.active,
                      'cell-highlight': day.highlight,
                      'cell-faded': day.faded,
                    }"
                  >
                    <span class="day-number">{{ day.num }}</span>
                    <span v-if="day.hasTask" class="cell-task-indicator" />
                  </div>
                </div>

                <!-- Embedded Active Task Card -->
                <div class="calendar-task-card">
                  <div class="task-card-top">
                    <div class="task-info-left">
                      <div class="task-chip">Sprint Task</div>
                      <div class="task-main-title">Frontend Component System</div>
                    </div>
                    <div class="task-avatars-row">
                      <span class="avatar-dot av-1">S</span>
                      <span class="avatar-dot av-2">A</span>
                      <span class="avatar-dot av-3">+2</span>
                    </div>
                  </div>
                  <div class="task-progress-bottom">
                    <div class="progress-bar-track">
                      <div class="progress-fill-bar" style="width: 78%" />
                    </div>
                    <span class="progress-percent">78%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Text Column (Right) -->
          <div class="col-12 col-md-6 showcase-text-col">
            <div class="eyebrow-badge q-mb-md">
              <span>BUILT FOR PRODUCTIVITY</span>
            </div>

            <h2 class="showcase-title">
              Turn Scattered Work<br />
              into a Clear Workflow.
            </h2>

            <p class="showcase-description">
              Effortlessly organize your backlog, prioritize key deliverables, and boost team
              productivity with transparent scheduling and workload balancing.
            </p>

            <div class="section-divider-line" />

            <!-- Compact Highlights Grid -->
            <div class="highlights-grid row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="highlight-item">
                  <div class="highlight-icon-box orange-box">
                    <q-icon name="schedule" size="20px" />
                  </div>
                  <h3 class="highlight-title">Time Management</h3>
                  <p class="highlight-desc">
                    Allocate dedicated project hours, prevent burnout, and forecast team bandwidth
                    reliably.
                  </p>
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <div class="highlight-item">
                  <div class="highlight-icon-box teal-box">
                    <q-icon name="tune" size="20px" />
                  </div>
                  <h3 class="highlight-title">Priority Management</h3>
                  <p class="highlight-desc">
                    Quickly identify blockers and high-impact tasks to keep your critical path
                    moving.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const calendarDays = [
  { num: 28, faded: true, hasTask: false },
  { num: 29, faded: true, hasTask: false },
  { num: 30, faded: true, hasTask: false },
  { num: 1, faded: false, hasTask: false },
  { num: 2, faded: false, hasTask: true, active: true },
  { num: 3, faded: false, hasTask: true },
  { num: 4, faded: false, hasTask: false },
  { num: 5, faded: false, hasTask: false },
  { num: 6, faded: false, hasTask: true },
  { num: 7, faded: false, hasTask: true },
  { num: 8, faded: false, hasTask: false },
  { num: 9, faded: false, hasTask: false },
  { num: 10, faded: false, hasTask: true },
  { num: 11, faded: false, hasTask: false },
  { num: 12, faded: false, hasTask: true },
  { num: 13, faded: false, hasTask: true },
  { num: 14, faded: false, hasTask: true, highlight: true },
  { num: 15, faded: false, hasTask: true, active: true },
  { num: 16, faded: false, hasTask: false },
  { num: 17, faded: false, hasTask: false },
  { num: 18, faded: false, hasTask: true },
  { num: 19, faded: false, hasTask: true },
  { num: 20, faded: false, hasTask: true, active: true },
  { num: 21, faded: false, hasTask: false },
  { num: 22, faded: false, hasTask: false },
  { num: 23, faded: false, hasTask: true },
  { num: 24, faded: false, hasTask: true },
  { num: 25, faded: false, hasTask: false },
  { num: 26, faded: false, hasTask: false },
  { num: 27, faded: false, hasTask: true },
  { num: 28, faded: false, hasTask: false },
  { num: 29, faded: false, hasTask: false },
  { num: 30, faded: false, hasTask: true },
  { num: 31, faded: false, hasTask: false },
  { num: 1, faded: true, hasTask: false },
];
</script>

<style scoped lang="scss">
.product-showcase-container {
  background: #ffffff;
}

.showcase-section {
  padding: 100px 0;
  position: relative;

  &.showcase-two {
    background: #fafafc;
    border-top: 1px solid #f1f3f7;
    border-bottom: 1px solid #f1f3f7;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.eyebrow-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.showcase-title {
  font-size: 42px;
  line-height: 1.18;
  font-weight: 800;
  color: #121620;
  letter-spacing: -0.03em;
  margin: 0 0 20px 0;
}

.showcase-description {
  font-size: 16px;
  line-height: 1.65;
  color: #64748b;
  margin: 0 0 28px 0;
  max-width: 520px;
}

.section-divider-line {
  width: 100%;
  height: 1px;
  background: #edf0f5;
  margin-bottom: 28px;
}

.highlights-grid {
  margin-top: 8px;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.highlight-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;

  &.orange-box {
    background: #fff7ed;
    color: #ea580c;
  }

  &.purple-box {
    background: #f5f3ff;
    color: #8b6fd8;
  }

  &.teal-box {
    background: #ecfdf5;
    color: #059669;
  }
}

.highlight-title {
  font-size: 16px;
  font-weight: 700;
  color: #181d28;
  margin: 0;
  letter-spacing: -0.01em;
}

.highlight-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}

/* Visual Mockup Card Styles */
.visual-card-frame {
  border-radius: 28px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &.dark-card-backdrop {
    background: #141721;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 24px 60px -12px rgba(18, 22, 32, 0.25),
      0 8px 24px -4px rgba(139, 111, 216, 0.12);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 30px 70px -10px rgba(18, 22, 32, 0.3),
      0 12px 30px -4px rgba(139, 111, 216, 0.18);
  }
}

.mockup-device-body {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.app-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn-pill {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.app-header-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b;
}

.header-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.floating-sprint-tag {
  align-self: flex-start;
  background: #181d28;
  color: #f1f5f9;
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f43f5e;
    animation: pulse 1.8s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

.metric-visual-container {
  background: #fbfbfd;
  border: 1px solid #edf0f5;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.metric-val-tag {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 6px;
}

.progress-bars-display {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 140px;
  padding-top: 10px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.bar-fill-track {
  flex: 1;
  width: 32px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  padding: 2px;
}

.bar-fill {
  width: 100%;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  transition: height 0.4s ease;

  &.purple-fill {
    background: #8b6fd8;
  }

  &.teal-fill {
    background: #14b8a6;
  }

  &.highlight-fill {
    background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  }
}

.bar-badge {
  font-size: 8.5px;
  font-weight: 700;
  color: #ffffff;
}

.bar-badge-active {
  font-size: 9px;
  font-weight: 800;
  color: #ffffff;
}

.bar-date {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;

  &.active-date {
    color: #10b981;
    font-weight: 700;
  }
}

.timeline-preview-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timeline-label {
  font-size: 11px;
  font-weight: 700;
  color: #334155;
}

.timeline-status-tag {
  font-size: 9.5px;
  font-weight: 700;
  color: #8b6fd8;
  background: #f5f3ff;
  padding: 2px 7px;
  border-radius: 6px;
}

.timeline-progress-rail {
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.timeline-segment {
  height: 100%;

  &.seg-1 {
    background: #8b6fd8;
  }
  &.seg-2 {
    background: #3b82f6;
  }
  &.seg-3 {
    background: #10b981;
  }
}

.timeline-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
}

/* Calendar Body Mockup Styles */
.calendar-body {
  gap: 14px;
}

.calendar-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar-month-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.month-selector-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.calendar-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  background: #f8fafc;
  transition: all 0.15s ease;

  &.cell-faded {
    color: #cbd5e1;
    background: transparent;
  }

  &.cell-active {
    background: #8b6fd8;
    color: #ffffff;
    font-weight: 700;
  }

  &.cell-highlight {
    background: #10b981;
    color: #ffffff;
    font-weight: 700;
  }
}

.cell-task-indicator {
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8b6fd8;

  .cell-active &,
  .cell-highlight & {
    background: #ffffff;
  }
}

.calendar-task-card {
  background: #f8fafc;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-chip {
  font-size: 9px;
  font-weight: 700;
  color: #8b6fd8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.task-main-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
}

.task-avatars-row {
  display: flex;
  align-items: center;
}

.avatar-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #ffffff;
  margin-left: -5px;
  border: 2px solid #ffffff;

  &.av-1 {
    background: #8b6fd8;
    margin-left: 0;
  }
  &.av-2 {
    background: #3b82f6;
  }
  &.av-3 {
    background: #64748b;
    font-size: 8px;
  }
}

.task-progress-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-track {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill-bar {
  height: 100%;
  background: #8b6fd8;
  border-radius: 9999px;
}

.progress-percent {
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
}

@media (max-width: 950px) {
  .showcase-title {
    font-size: 32px;
  }
  .showcase-section {
    padding: 60px 0;
  }
}

@media (max-width: 768px) {
  .showcase-title {
    font-size: 28px;
  }
  .visual-card-frame {
    padding: 18px;
  }
  .order-md-first {
    order: 0;
  }
}
</style>
