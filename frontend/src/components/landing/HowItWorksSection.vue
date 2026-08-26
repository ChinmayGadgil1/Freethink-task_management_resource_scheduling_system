<template>
  <section id="how-it-works" class="how-it-works-section">
    <div class="container">
      <div class="section-header text-center">
        <div class="eyebrow-text">HOW IT WORKS</div>
        <h2 class="section-title">
          Simple steps.<br />
          Powerful results.
        </h2>
        <p class="section-subtitle">
          Get your entire team aligned and productive in less than 5 minutes.
        </p>
      </div>

      <!-- 3 Step Cards -->
      <div class="steps-grid row q-col-gutter-lg">
        <div v-for="step in steps" :key="step.number" class="col-12 col-md-4">
          <div class="step-card column gap-sm">
            <div class="step-badge">{{ step.number }}</div>
            <div class="step-icon-box flex flex-center" :style="{ background: step.iconBg, color: step.iconColor }">
              <q-icon :name="step.icon" size="26px" />
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-description">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- CTA Button below steps -->
      <div class="row justify-center q-pt-xl">
        <q-btn
          unelevated
          no-caps
          label="Get Started for Free"
          class="how-it-works-cta-btn"
          @click="goToSignup"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const steps = [
  {
    number: '01',
    icon: 'rocket_launch',
    iconBg: '#F4F0FD',
    iconColor: '#8B6FD8',
    title: 'Create your workspace',
    description: 'Sign up and set up your team or personal workspace in seconds.',
  },
  {
    number: '02',
    icon: 'format_list_bulleted_add',
    iconBg: '#EBF4FF',
    iconColor: '#3B82F6',
    title: 'Add your projects & tasks',
    description: 'Plan your projects, assign tasks, and set deadlines with ease.',
  },
  {
    number: '03',
    icon: 'celebration',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    title: 'Track, collaborate & deliver',
    description: 'Monitor progress, collaborate with your team, and achieve your goals.',
  },
];

function goToSignup() {
  void router.push('/signup');
}
</script>

<style scoped lang="scss">
.how-it-works-section {
  padding: 80px 0;
  background: #fbfbfd;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  margin-bottom: 54px;
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
  line-height: 1.2;
  font-weight: 800;
  color: #181d28;
  letter-spacing: -0.03em;
  margin: 0 0 14px 0;
}

.section-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.step-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #edf0f5;
  border-radius: 18px;
  padding: 36px 28px 30px 28px;
  height: 100%;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.03);

  &:hover {
    transform: translateY(-4px);
    border-color: #d8b4fe;
    box-shadow: 0 12px 28px rgba(139, 111, 216, 0.1);
  }
}

.step-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 28px;
  font-weight: 800;
  color: #e5e7eb;
  letter-spacing: -0.04em;
  font-family: inherit;
}

.step-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
}

.step-title {
  font-size: 19px;
  font-weight: 700;
  color: #181d28;
  letter-spacing: -0.02em;
  margin: 0;
}

.step-description {
  font-size: 14.5px;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
}

.how-it-works-cta-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 30px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(139, 111, 216, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(139, 111, 216, 0.4);
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 28px;
  }
}
</style>
