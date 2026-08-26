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
            TaskFlow brings transparent coordination across project managers and team members under
            one unified, real-time platform.
          </p>
        </div>
      </div>

      <!-- 3-Card Grid for PM, Team Resources, and CTA -->
      <div class="role-cards-grid row q-col-gutter-md q-pt-md">
        <!-- Card 1: Project Managers -->
        <div class="col-12 col-sm-6 col-md-4">
          <div class="role-card column">
            <div class="role-card-media flex flex-center media-pm">
              <div class="media-badge row items-center">
                <q-icon name="assignment" size="14px" class="q-mr-xs" />
                <span>Planning & Control</span>
              </div>
              <div class="role-avatar-illustration">
                <div class="avatar-circle flex flex-center av-pm">
                  <q-icon name="person" size="30px" />
                </div>
              </div>
            </div>
            <div class="role-card-content column col gap-xs">
              <h3 class="role-name">Project Managers</h3>
              <span class="role-title-tag">Project & Milestone Leads</span>
              <p class="role-quote">
                "Keep projects organized from initial planning to delivery with full timeline and
                Gantt schedule visibility."
              </p>
            </div>
          </div>
        </div>

        <!-- Card 2: Team Members -->
        <div class="col-12 col-sm-6 col-md-4">
          <div class="role-card column">
            <div class="role-card-media flex flex-center media-member">
              <div class="media-badge row items-center">
                <q-icon name="check_circle" size="14px" class="q-mr-xs" />
                <span>Daily Execution</span>
              </div>
              <div class="role-avatar-illustration">
                <div class="avatar-circle flex flex-center av-member">
                  <q-icon name="person_outline" size="30px" />
                </div>
              </div>
            </div>
            <div class="role-card-content column col gap-xs">
              <h3 class="role-name">Team Members</h3>
              <span class="role-title-tag">Assigned Work & Progress</span>
              <p class="role-quote">
                "Know what to work on and when. Clear task assignments, priorities, effort tracking,
                and instant status updates."
              </p>
            </div>
          </div>
        </div>

        <!-- Card 3: Dark CTA Action Card -->
        <div class="col-12 col-sm-6 col-md-4">
          <div class="role-card dark-cta-card column" @click="goToSignup">
            <div class="dark-cta-inner column justify-between gap-md">
              <div class="dark-cta-top">
                <h3 class="dark-cta-title">
                  Explore TaskFlow<br />
                  and simplify<br />
                  your workflow.
                </h3>
                <p class="dark-cta-desc">Join now and experience clarity across every milestone.</p>
              </div>

              <div class="dark-cta-arrow-row row justify-end">
                <div class="arrow-circle flex flex-center">
                  <q-icon name="arrow_outward" size="22px" />
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
  padding: 48px 0 56px 0;
  background: #ffffff;
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

.section-heading {
  font-size: 32px;
  line-height: 1.2;
  font-weight: 800;
  color: #121620;
  letter-spacing: -0.03em;
  margin: 0;
}

.section-subtext {
  font-size: 14.5px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}

.role-card {
  background: #ffffff;
  border: 1px solid #edf0f5;
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);

  &:hover {
    transform: translateY(-3px);
    border-color: #d8b4fe;
    box-shadow: 0 12px 28px -4px rgba(139, 111, 216, 0.14);
  }
}

.role-card-media {
  height: 110px;
  position: relative;
  padding: 12px;

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
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 9.5px;
  font-weight: 700;
  color: #334155;
}

.avatar-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.07);

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
  padding: 14px 16px 18px 16px;
}

.role-name {
  font-size: 15.5px;
  font-weight: 700;
  color: #121620;
  letter-spacing: -0.01em;
  margin: 0;
}

.role-title-tag {
  font-size: 11px;
  font-weight: 600;
  color: #8b6fd8;
  margin-bottom: 4px;
}

.role-quote {
  font-size: 12.5px;
  line-height: 1.5;
  color: #64748b;
  margin: 0;
}

/* Dark Featured CTA Card */
.dark-cta-card {
  background: #121620;
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(18, 22, 32, 0.18);

  &:hover {
    border-color: #8b6fd8;
    box-shadow: 0 14px 32px -4px rgba(139, 111, 216, 0.3);

    .arrow-circle {
      background: #8b6fd8;
      color: #ffffff;
      transform: translate(2px, -2px);
    }
  }
}

.dark-cta-inner {
  padding: 20px 18px;
  height: 100%;
}

.dark-cta-title {
  font-size: 19px;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.dark-cta-desc {
  font-size: 12.5px;
  line-height: 1.45;
  color: #94a3b8;
  margin: 0;
}

.arrow-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1c2230;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #63c7c1;
  transition: all 0.25s ease;
}

@media (max-width: 950px) {
  .section-heading {
    font-size: 26px;
  }
  .role-testimonial-section {
    padding: 36px 0;
  }
}

body.body--dark {
  .role-testimonial-section {
    background: #0b0f19;
  }

  .section-heading {
    color: #f8fafc;
  }

  .section-subtext {
    color: #94a3b8;
  }

  .eyebrow-badge {
    background: rgba(139, 111, 216, 0.12);
    border-color: rgba(139, 111, 216, 0.28);
    color: #a78bfa;
  }

  .role-card {
    background: #131722;
    border-color: #283042;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);

    &:hover {
      border-color: #8b6fd8;
      box-shadow: 0 12px 28px -4px rgba(139, 111, 216, 0.25);
    }
  }

  .role-card-media {
    &.media-pm {
      background: linear-gradient(
        135deg,
        rgba(139, 111, 216, 0.22) 0%,
        rgba(139, 111, 216, 0.06) 100%
      );
    }
    &.media-member {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.22) 0%,
        rgba(59, 130, 246, 0.06) 100%
      );
    }
    &.media-resource {
      background: linear-gradient(
        135deg,
        rgba(16, 185, 129, 0.22) 0%,
        rgba(16, 185, 129, 0.06) 100%
      );
    }
  }

  .media-badge {
    background: rgba(19, 23, 34, 0.9);
    color: #f1f5f9;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .role-name {
    color: #f8fafc;
  }

  .role-title-tag {
    color: #a78bfa;
  }

  .role-quote {
    color: #94a3b8;
  }

  .dark-cta-card {
    background: #161b28;
    border-color: #283042;
  }
}
</style>
