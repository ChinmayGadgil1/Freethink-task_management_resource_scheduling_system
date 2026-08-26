<template>
  <div class="product-showcase-container">
    <!-- Showcase 1: Text Left | Real Project Breakdown Right -->
    <section id="features" class="showcase-section showcase-one">
      <div class="container">
        <div class="row q-col-gutter-lg items-start">
          <!-- Text Column (Left) -->
          <div class="col-12 col-lg-5 showcase-text-col">
            <div class="eyebrow-badge q-mb-sm">
              <span>PROJECT & TASK MANAGEMENT</span>
            </div>

            <h2 class="showcase-title">
              Centralized Projects &<br />
              Deliverable Control.
            </h2>

            <p class="showcase-description">
              Organize backlogs, prioritize tasks, set clear milestones, and monitor delivery health
              with real-time progress and status indicators.
            </p>

            <div class="section-divider-line" />

            <!-- Highlights List -->
            <div class="highlights-stack column q-gutter-y-sm">
              <div class="highlight-item row items-start no-wrap q-gutter-x-sm">
                <div class="highlight-icon-box flex flex-center no-shrink orange-box">
                  <q-icon name="flag" size="18px" />
                </div>
                <div class="highlight-text-wrap">
                  <h3 class="highlight-title">Milestone Health Tracking</h3>
                  <p class="highlight-desc">
                    Live delivery status indicators (<span class="text-positive text-weight-bold"
                      >On Track</span
                    >, <span class="text-warning text-weight-bold">At Risk</span>,
                    <span class="text-negative text-weight-bold">Delayed</span>) with automatic
                    deadline countdowns.
                  </p>
                </div>
              </div>

              <div class="highlight-item row items-start no-wrap q-gutter-x-sm">
                <div class="highlight-icon-box flex flex-center no-shrink purple-box">
                  <q-icon name="task_alt" size="18px" />
                </div>
                <div class="highlight-text-wrap">
                  <h3 class="highlight-title">Granular Progress Tracking</h3>
                  <p class="highlight-desc">
                    Monitor completion percentages across individual tasks, assignees, and project
                    phases with linear progress indicators.
                  </p>
                </div>
              </div>

              <div class="highlight-item row items-start no-wrap q-gutter-x-sm">
                <div class="highlight-icon-box flex flex-center no-shrink teal-box">
                  <q-icon name="view_kanban" size="18px" />
                </div>
                <div class="highlight-text-wrap">
                  <h3 class="highlight-title">Multi-Project Aggregation</h3>
                  <p class="highlight-desc">
                    Group and view all active project initiatives in one unified interface for
                    complete operational clarity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Visual Column (Right): Real ProjectsBreakdownCard & StatCards -->
          <div class="col-12 col-lg-7 showcase-visual-col">
            <div class="visual-card-frame">
              <div class="row q-col-gutter-xs q-mb-sm">
                <div class="col-6">
                  <LandingStatCard
                    title="Active Projects"
                    value="4"
                    subtitle="3 on track · 1 at risk"
                    icon="folder"
                    color="primary"
                  />
                </div>
                <div class="col-6">
                  <LandingStatCard
                    title="Completion Rate"
                    value="82%"
                    subtitle="↑ 14% vs last milestone"
                    icon="trending_up"
                    color="positive"
                    :progress="82"
                  />
                </div>
              </div>

              <div class="component-wrapper">
                <LandingProjectsPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Showcase 2: Real Workload & Task Status Left | Text Right (ALTERNATING LAYOUT) -->
    <section id="how-it-works" class="showcase-section showcase-two">
      <div class="container">
        <div class="row q-col-gutter-lg items-start">
          <!-- Product Visual Column (Left): Real WorkloadCard & TaskStatusCard -->
          <div class="col-12 col-lg-7 showcase-visual-col order-lg-first">
            <div class="visual-card-frame">
              <LandingWorkloadPreview />
            </div>
          </div>

          <!-- Text Column (Right) -->
          <div class="col-12 col-lg-5 showcase-text-col">
            <div class="eyebrow-badge q-mb-sm">
              <span>RESOURCE SCHEDULING & CAPACITY</span>
            </div>

            <h2 class="showcase-title">
              Balance Workloads &<br />
              Prevent Team Burnout.
            </h2>

            <p class="showcase-description">
              Get transparent visibility into team capacity with 40-hour standard bandwidth
              baselines. Rebalance workloads to prevent over-allocation and burnout.
            </p>

            <div class="section-divider-line" />

            <!-- Highlights List -->
            <div class="highlights-stack column q-gutter-y-sm">
              <div class="highlight-item row items-start no-wrap q-gutter-x-sm">
                <div class="highlight-icon-box flex flex-center no-shrink blue-box">
                  <q-icon name="pie_chart" size="18px" />
                </div>
                <div class="highlight-text-wrap">
                  <h3 class="highlight-title">40h Standard Bandwidth</h3>
                  <p class="highlight-desc">
                    Track allocated effort vs standard 40h weekly capacity. Detect overallocated
                    resources before delivery bottlenecks emerge.
                  </p>
                </div>
              </div>

              <div class="highlight-item row items-start no-wrap q-gutter-x-sm">
                <div class="highlight-icon-box flex flex-center no-shrink green-box">
                  <q-icon name="donut_large" size="18px" />
                </div>
                <div class="highlight-text-wrap">
                  <h3 class="highlight-title">Effort Consumption Metrics</h3>
                  <p class="highlight-desc">
                    Live comparison of actual logged hours vs planned effort hours with color-coded
                    utilization indicators.
                  </p>
                </div>
              </div>

              <div class="highlight-item row items-start no-wrap q-gutter-x-sm">
                <div class="highlight-icon-box flex flex-center no-shrink orange-box">
                  <q-icon name="assignment_turned_in" size="18px" />
                </div>
                <div class="highlight-text-wrap">
                  <h3 class="highlight-title">Segmented Status Distribution</h3>
                  <p class="highlight-desc">
                    At-a-glance distribution bar showing proportion of work In Progress, Scheduled,
                    and Completed.
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
import LandingProjectsPreview from '@/components/landing/previews/LandingProjectsPreview.vue';
import LandingWorkloadPreview from '@/components/landing/previews/LandingWorkloadPreview.vue';
import LandingStatCard from '@/components/landing/previews/LandingStatCard.vue';
</script>

<style scoped lang="scss">
.product-showcase-container {
  background: #ffffff;
}

.showcase-section {
  padding: 48px 0 52px 0;
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
  padding: 0 20px;
}

.eyebrow-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.showcase-title {
  font-size: 34px;
  line-height: 1.18;
  font-weight: 800;
  color: #121620;
  letter-spacing: -0.03em;
  margin: 0 0 12px 0;
}

.showcase-description {
  font-size: 15px;
  line-height: 1.55;
  color: #64748b;
  margin: 0 0 16px 0;
}

.section-divider-line {
  width: 100%;
  height: 1px;
  background: #edf0f5;
  margin-bottom: 16px;
}

.highlights-stack {
  margin-top: 4px;
}

.highlight-item {
  display: flex;
}

.highlight-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;

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

  &.blue-box {
    background: #eff6ff;
    color: #3b82f6;
  }
}

.highlight-text-wrap {
  min-width: 0;
  flex: 1;
}

.highlight-title {
  font-size: 14px;
  font-weight: 700;
  color: #181d28;
  margin: 0 0 2px 0;
  letter-spacing: -0.01em;
}

.highlight-desc {
  font-size: 12.5px;
  line-height: 1.45;
  color: #64748b;
  margin: 0;
}

/* Component Showcase Card Wrapper */
.visual-card-frame {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 14px;
  box-shadow:
    0 14px 40px -8px rgba(16, 24, 40, 0.06),
    0 3px 10px rgba(139, 111, 216, 0.03);
  transition: all 0.25s ease;

  &:hover {
    box-shadow:
      0 18px 48px -6px rgba(16, 24, 40, 0.09),
      0 4px 14px rgba(139, 111, 216, 0.06);
  }

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

.component-wrapper {
  :deep(.projects-breakdown-card) {
    box-shadow: none;
    border: 1px solid #edf2f7;
    border-radius: 12px;
  }

  :deep(.q-card__section) {
    padding: 10px 14px;
  }

  :deep(.project-row) {
    padding: 10px 14px;
  }
}

@media (max-width: 950px) {
  .showcase-title {
    font-size: 28px;
  }
  .showcase-section {
    padding: 36px 0;
  }
}

@media (max-width: 768px) {
  .showcase-title {
    font-size: 24px;
  }
  .visual-card-frame {
    padding: 10px;
  }
}

body.body--dark {
  .product-showcase-container {
    background: #0b0f19;
  }

  .showcase-section.showcase-two {
    background: #0d121f;
    border-color: #1e2433;
  }

  .eyebrow-badge {
    background: rgba(139, 111, 216, 0.12);
    border-color: rgba(139, 111, 216, 0.28);
    color: #a78bfa;
  }

  .showcase-title {
    color: #f8fafc;
  }

  .showcase-description {
    color: #94a3b8;
  }

  .section-divider-line {
    background: #1e2433;
  }

  .highlight-title {
    color: #f3f4f6;
  }

  .highlight-desc {
    color: #94a3b8;
  }

  .highlight-icon-box {
    &.orange-box {
      background: rgba(234, 88, 12, 0.16);
      color: #fb923c;
    }

    &.purple-box {
      background: rgba(139, 111, 216, 0.16);
      color: #a78bfa;
    }

    &.teal-box {
      background: rgba(5, 150, 105, 0.16);
      color: #34d399;
    }

    &.blue-box {
      background: rgba(59, 130, 246, 0.16);
      color: #60a5fa;
    }
  }

  .visual-card-frame {
    background: #131722;
    border-color: #283042;
    box-shadow:
      0 14px 40px -8px rgba(0, 0, 0, 0.55),
      0 3px 10px rgba(0, 0, 0, 0.35);

    &:hover {
      box-shadow:
        0 18px 48px -6px rgba(0, 0, 0, 0.7),
        0 4px 14px rgba(0, 0, 0, 0.45);
    }
  }
}
</style>
