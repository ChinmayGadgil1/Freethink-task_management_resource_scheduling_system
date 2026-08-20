<template>
  <section id="for-teams" class="cta-banner-section">
    <div class="container">
      <div class="cta-banner-card">
        <div class="row items-center q-col-gutter-xl">
          <!-- Left Illustration -->
          <div class="col-12 col-md-5 illustration-col flex flex-center">
            <div class="vector-illustration-box">
              <svg
                width="340"
                height="240"
                viewBox="0 0 340 240"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="team-illustration-svg"
              >
                <!-- Ground shadow / base -->
                <ellipse cx="170" cy="225" rx="140" ry="10" fill="#E9D5FF" opacity="0.6" />

                <!-- Cube stack (Tasks/Projects) -->
                <!-- Base bottom cube 1 -->
                <rect x="120" y="170" width="46" height="46" rx="6" fill="#8B6FD8" />
                <path
                  d="M130 193L138 201L156 183"
                  stroke="white"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Base bottom cube 2 -->
                <rect x="170" y="170" width="46" height="46" rx="6" fill="#C4B5FD" />
                <rect x="178" y="186" width="30" height="4" rx="2" fill="white" />
                <rect x="178" y="196" width="20" height="4" rx="2" fill="white" opacity="0.8" />

                <!-- Middle row cube 1 -->
                <rect x="120" y="120" width="46" height="46" rx="6" fill="#DDD6FE" />
                <circle cx="143" cy="143" r="10" fill="#8B6FD8" opacity="0.4" />
                <circle cx="143" cy="143" r="5" fill="#8B6FD8" />

                <!-- Middle row cube 2 -->
                <rect x="170" y="120" width="46" height="46" rx="6" fill="#8B6FD8" />
                <path d="M182 143H204" stroke="white" stroke-width="3" stroke-linecap="round" />
                <path d="M193 132V154" stroke="white" stroke-width="3" stroke-linecap="round" />

                <!-- Top cube -->
                <rect x="145" y="70" width="46" height="46" rx="6" fill="#6D28D9" />
                <polygon
                  points="168,83 172,92 182,93 174,100 177,109 168,104 159,109 162,100 154,93 164,92"
                  fill="#FBBF24"
                />

                <!-- Person Left (Collaborator 1) -->
                <g class="character-left">
                  <!-- Head & Hair -->
                  <circle cx="85" cy="100" r="14" fill="#1E293B" />
                  <circle cx="88" cy="103" r="11" fill="#FED7AA" />
                  <path
                    d="M75 98C75 90 82 85 92 85C98 85 102 88 102 95C98 96 94 98 90 101L85 101"
                    fill="#1E293B"
                  />
                  <!-- Body / Shirt -->
                  <path
                    d="M70 145C70 125 78 118 90 118C102 118 110 125 110 145H70Z"
                    fill="#14B8A6"
                  />
                  <!-- Arm reaching toward cubes -->
                  <path
                    d="M102 126L124 140"
                    stroke="#FED7AA"
                    stroke-width="7"
                    stroke-linecap="round"
                  />
                  <!-- Pants -->
                  <path d="M72 145L62 205H84L88 160L94 205H112L108 145H72Z" fill="#3B82F6" />
                  <!-- Shoes -->
                  <rect x="56" y="202" width="28" height="8" rx="4" fill="#0F172A" />
                  <rect x="94" y="202" width="24" height="8" rx="4" fill="#0F172A" />
                </g>

                <!-- Person Right (Collaborator 2) -->
                <g class="character-right">
                  <!-- Head & Hair -->
                  <circle cx="250" cy="115" r="13" fill="#1E293B" />
                  <circle cx="247" cy="118" r="10" fill="#FED7AA" />
                  <path
                    d="M238 112C238 104 245 100 255 100C261 100 265 104 265 110C262 112 258 113 255 115Z"
                    fill="#1E293B"
                  />
                  <!-- Body / Shirt (Orange) -->
                  <path
                    d="M232 155C232 135 240 130 250 130C260 130 268 135 268 155H232Z"
                    fill="#F97316"
                  />
                  <!-- Arm holding top cube -->
                  <path
                    d="M240 138L218 148"
                    stroke="#FED7AA"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                  <!-- Skirt / Pants -->
                  <path d="M234 155L228 205H248L252 165L258 205H274L266 155H234Z" fill="#1E3A8A" />
                  <!-- Shoes -->
                  <rect x="222" y="202" width="26" height="8" rx="4" fill="#0F172A" />
                  <rect x="256" y="202" width="22" height="8" rx="4" fill="#0F172A" />
                </g>

                <!-- Floating spark / plus elements -->
                <circle cx="215" cy="50" r="3" fill="#8B6FD8" />
                <circle cx="100" cy="65" r="2.5" fill="#3B82F6" />
                <path
                  d="M280 80H290M285 75V85"
                  stroke="#F59E0B"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
          </div>

          <!-- Right Content -->
          <div class="col-12 col-md-7 content-col">
            <h2 class="cta-title">Built for teams. Designed for productivity.</h2>
            <p class="cta-subtitle">
              Whether you're a startup or an enterprise, TaskFlow adapts to your workflow and grows
              with your team.
            </p>

            <div class="cta-actions-row row items-center q-gutter-md q-pt-sm">
              <q-btn
                unelevated
                no-caps
                label="Start Your Free Trial"
                class="cta-trial-btn"
                @click="goToSignup"
              />

              <div class="badges-row row items-center q-gutter-x-md">
                <div class="trust-badge">
                  <q-icon name="check" size="14px" color="positive" class="q-mr-xs" />
                  <span>No credit card required</span>
                </div>
                <div class="trust-badge">
                  <q-icon name="check" size="14px" color="positive" class="q-mr-xs" />
                  <span>14-day free trial</span>
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
.cta-banner-section {
  padding: 40px 0 88px 0;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.cta-banner-card {
  background: linear-gradient(135deg, #f8f6ff 0%, #f0ecfa 100%);
  border: 1px solid #e9ddfd;
  border-radius: 24px;
  padding: 48px 48px;
  box-shadow: 0 10px 30px rgba(139, 111, 216, 0.08);
}

.vector-illustration-box {
  width: 100%;
  max-width: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-illustration-svg {
  width: 100%;
  height: auto;
}

.content-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cta-title {
  font-size: 32px;
  line-height: 1.25;
  font-weight: 800;
  color: #181d28;
  letter-spacing: -0.025em;
  margin: 0;
}

.cta-subtitle {
  font-size: 16.5px;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
  max-width: 540px;
}

.cta-trial-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 28px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(139, 111, 216, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(139, 111, 216, 0.4);
  }
}

.trust-badge {
  display: flex;
  align-items: center;
  font-size: 13.5px;
  font-weight: 500;
  color: #475467;
}

@media (max-width: 768px) {
  .cta-banner-card {
    padding: 32px 24px;
  }
  .cta-title {
    font-size: 26px;
  }
  .badges-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
