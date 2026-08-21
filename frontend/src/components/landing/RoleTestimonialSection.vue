<template>
  <section id="for-teams" class="role-testimonial-section">
    <div class="container">
      <!-- Section Header -->
      <div class="section-header-row row items-end justify-between q-col-gutter-lg">
        <div class="col-12 col-md-7">
          <div class="eyebrow-badge q-mb-sm">
            <span>FOR EVERY ROLE</span>
          </div>
          <h2 class="section-heading">
            Designed for teams that want<br class="gt-xs" />
            clarity in every project.
          </h2>
        </div>
        <div class="col-12 col-md-5">
          <p class="section-subtext">
            TaskFlow brings transparent coordination across project managers, team members, and
            resource coordinators under one unified, real-time platform.
          </p>
        </div>
      </div>

      <!-- 4-Card Grid -->
      <div class="role-cards-grid row q-col-gutter-lg q-pt-xl">
        <!-- Card 1: Project Managers -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="role-card">
            <div class="role-card-media media-pm">
              <div class="media-badge">
                <q-icon name="assignment" size="14px" class="q-mr-xs" />
                <span>Planning & Control</span>
              </div>
              <div class="role-avatar-illustration">
                <div class="avatar-circle av-pm">
                  <q-icon name="person" size="32px" />
                </div>
              </div>
            </div>
            <div class="role-card-content">
              <h3 class="role-name">Project Managers</h3>
              <span class="role-title-tag">Sprint & Milestone Leads</span>
              <p class="role-quote">
                "Keep projects organized from initial planning to delivery with full timeline and
                dependency visibility."
              </p>
            </div>
          </div>
        </div>

        <!-- Card 2: Team Members -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="role-card">
            <div class="role-card-media media-member">
              <div class="media-badge">
                <q-icon name="check_circle" size="14px" class="q-mr-xs" />
                <span>Daily Execution</span>
              </div>
              <div class="role-avatar-illustration">
                <div class="avatar-circle av-member">
                  <q-icon name="person_outline" size="32px" />
                </div>
              </div>
            </div>
            <div class="role-card-content">
              <h3 class="role-name">Team Members</h3>
              <span class="role-title-tag">Designers & Engineers</span>
              <p class="role-quote">
                "Know what to work on and when. Clear task assignments, priorities, and instant
                status updates."
              </p>
            </div>
          </div>
        </div>

        <!-- Card 3: Resource Managers -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="role-card">
            <div class="role-card-media media-resource">
              <div class="media-badge">
                <q-icon name="groups" size="14px" class="q-mr-xs" />
                <span>Capacity Planning</span>
              </div>
              <div class="role-avatar-illustration">
                <div class="avatar-circle av-resource">
                  <q-icon name="bar_chart" size="32px" />
                </div>
              </div>
            </div>
            <div class="role-card-content">
              <h3 class="role-name">Resource Managers</h3>
              <span class="role-title-tag">Operations & Allocation</span>
              <p class="role-quote">
                "See team workload and allocation clearly across all active projects. Prevent
                bottlenecks and burnout."
              </p>
            </div>
          </div>
        </div>

        <!-- Card 4: Dark CTA Action Card -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="role-card dark-cta-card" @click="goToSignup">
            <div class="dark-cta-inner">
              <div class="dark-cta-top">
                <h3 class="dark-cta-title">
                  Explore TaskFlow<br />
                  and simplify<br />
                  your workflow.
                </h3>
                <p class="dark-cta-desc">Join now and experience clarity in every sprint.</p>
              </div>

              <div class="dark-cta-arrow-row">
                <div class="arrow-circle">
                  <q-icon name="arrow_outward" size="24px" />
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
.role-testimonial-section {
  padding: 100px 0 110px 0;
  background: #ffffff;
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

.section-heading {
  font-size: 38px;
  line-height: 1.2;
  font-weight: 800;
  color: #121620;
  letter-spacing: -0.03em;
  margin: 0;
}

.section-subtext {
  font-size: 15.5px;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
}

.role-card {
  background: #ffffff;
  border: 1px solid #edf0f5;
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);

  &:hover {
    transform: translateY(-5px);
    border-color: #d8b4fe;
    box-shadow: 0 16px 32px -6px rgba(139, 111, 216, 0.14);
  }
}

.role-card-media {
  height: 140px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  &.media-pm {
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  }
  &.media-member {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }
  &.media-resource {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  }
}

.media-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);

  &.av-pm {
    background: #8b6fd8;
    color: #ffffff;
  }
  &.av-member {
    background: #3b82f6;
    color: #ffffff;
  }
  &.av-resource {
    background: #10b981;
    color: #ffffff;
  }
}

.role-card-content {
  padding: 20px 20px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.role-name {
  font-size: 17px;
  font-weight: 700;
  color: #121620;
  letter-spacing: -0.01em;
  margin: 0;
}

.role-title-tag {
  font-size: 11.5px;
  font-weight: 600;
  color: #8b6fd8;
  margin-bottom: 6px;
}

.role-quote {
  font-size: 13.5px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}

/* Dark Featured CTA Card */
.dark-cta-card {
  background: #121620;
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(18, 22, 32, 0.2);

  &:hover {
    border-color: #8b6fd8;
    box-shadow: 0 18px 40px -6px rgba(139, 111, 216, 0.35);

    .arrow-circle {
      background: #8b6fd8;
      color: #ffffff;
      transform: translate(3px, -3px);
    }
  }
}

.dark-cta-inner {
  padding: 28px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
}

.dark-cta-title {
  font-size: 22px;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 12px 0;
}

.dark-cta-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: #94a3b8;
  margin: 0;
}

.dark-cta-arrow-row {
  display: flex;
  justify-content: flex-end;
}

.arrow-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #1c2230;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #63c7c1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

@media (max-width: 950px) {
  .section-heading {
    font-size: 30px;
  }
  .role-testimonial-section {
    padding: 64px 0;
  }
}
</style>
