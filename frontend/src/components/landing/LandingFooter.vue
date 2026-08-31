<template>
  <footer class="landing-footer-dark">
    <!-- Ambient glow behind dark footer -->
    <div class="footer-ambient-glow" />

    <div class="container footer-container">
      <!-- Top Section: Large CTA & Link Columns -->
      <div class="footer-top-row row q-col-gutter-xl items-start justify-between">
        <!-- Left: Brand & Large CTA Heading -->
        <div class="col-12 col-md-5 brand-cta-col">
          <div class="brand row items-center gap-xs cursor-pointer" @click="scrollToTop">
            <div class="brand-icon flex flex-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="7" fill="#8B6FD8" />
                <path
                  d="M7 12.5L10.5 16L17 8.5"
                  stroke="white"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <span class="brand-name">TaskFlow</span>
          </div>

          <h2 class="footer-cta-title">
            Plan better.<br />
            Work smarter.<br />
            Deliver together.
          </h2>

          <p class="footer-cta-desc">
            Unlock the full potential of your team with TaskFlow's unified project management,
            resource scheduling, and progress tracking platform.
          </p>

          <div class="footer-action-btn-row q-pt-sm">
            <q-btn
              unelevated
              no-caps
              label="Get Started"
              icon-right="arrow_forward"
              class="footer-primary-btn"
              @click="goToSignup"
            />
          </div>
        </div>

        <!-- Right: Links Columns -->
        <div class="col-12 col-md-5 links-col">
          <div class="row q-col-gutter-lg justify-end">
            <!-- Product Column -->
            <div class="col-6 col-sm-6">
              <h4 class="column-title">Product</h4>
              <ul class="footer-link-list">
                <li><a href="#features" @click.prevent="scrollTo('features')">Features</a></li>
                <li>
                  <a href="#how-it-works" @click.prevent="scrollTo('how-it-works')">How It Works</a>
                </li>
                <li><a href="#for-teams" @click.prevent="scrollTo('for-teams')">For Teams</a></li>
              </ul>
            </div>

            <!-- Account Column -->
            <div class="col-6 col-sm-6">
              <h4 class="column-title">Account</h4>
              <ul class="footer-link-list">
                <li><a href="/login" @click.prevent="goToLogin">Log in</a></li>
                <li><a href="/signup" @click.prevent="goToSignup">Sign up</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-divider-line" />

      <!-- Bottom Bar: Brand, Copyright & Social Pills -->
      <div class="footer-bottom-bar row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-sm-auto text-center-lt-sm">
          <p class="copyright-text">© 2026 TaskFlow. All rights reserved.</p>
        </div>

        <!-- Social Pills Strip matching reference design -->
        <div class="col-12 col-sm-auto">
          <div class="social-pills-row row wrap items-center justify-center gap-xs">
            <a
              href="javascript:void(0)"
              class="social-pill-btn row inline items-center gap-xs"
              aria-label="Instagram"
            >
              <span class="pill-dot teal-dot" />
              <span>Instagram</span>
            </a>
            <a
              href="javascript:void(0)"
              class="social-pill-btn row inline items-center gap-xs"
              aria-label="Facebook"
            >
              <span class="pill-dot blue-dot" />
              <span>Facebook</span>
            </a>
            <a
              href="javascript:void(0)"
              class="social-pill-btn active-brand-pill row inline items-center gap-xs"
              aria-label="TaskFlow"
            >
              <span class="pill-dot purple-dot" />
              <span>TaskFlow</span>
            </a>
            <a
              href="javascript:void(0)"
              class="social-pill-btn row inline items-center gap-xs"
              aria-label="Twitter"
            >
              <span class="pill-dot amber-dot" />
              <span>Twitter</span>
            </a>
            <a
              href="javascript:void(0)"
              class="social-pill-btn row inline items-center gap-xs"
              aria-label="YouTube"
            >
              <span class="pill-dot pink-dot" />
              <span>YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToSignup() {
  void router.push('/signup');
}

function goToLogin() {
  void router.push('/login');
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollTo(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<style scoped lang="scss">
.landing-footer-dark {
  background: #0e121b;
  color: #f1f5f9;
  position: relative;
  overflow: hidden;
  padding: 56px 0 32px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-ambient-glow {
  position: absolute;
  top: -100px;
  right: 15%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 111, 216, 0.15) 0%, rgba(14, 18, 27, 0) 70%);
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.brand {
  margin-bottom: 20px;
  user-select: none;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.footer-cta-title {
  font-size: 32px;
  line-height: 1.18;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
  margin: 0 0 12px 0;
}

.footer-cta-desc {
  font-size: 14.5px;
  line-height: 1.55;
  color: #94a3b8;
  margin: 0 0 20px 0;
  max-width: 440px;
}

.footer-primary-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(139, 111, 216, 0.35);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 111, 216, 0.45);
  }
}

.column-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 14px 0;
}

.footer-link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li a {
    color: #94a3b8;
    font-size: 13.5px;
    text-decoration: none;
    transition: color 0.15s ease;

    &:hover {
      color: #8b6fd8;
    }
  }
}

.footer-divider-line {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 36px 0 20px 0;
}

.copyright-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.social-pill-btn {
  background: #181d28;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: #232a3b;
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: translateY(-1px);
  }

  &.active-brand-pill {
    background: rgba(139, 111, 216, 0.15);
    border-color: rgba(139, 111, 216, 0.35);
    color: #f1f5f9;
  }
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.teal-dot {
    background: #14b8a6;
  }
  &.blue-dot {
    background: #3b82f6;
  }
  &.purple-dot {
    background: #8b6fd8;
  }
  &.amber-dot {
    background: #f59e0b;
  }
  &.pink-dot {
    background: #ec4899;
  }
}

@media (max-width: 768px) {
  .landing-footer-dark {
    padding: 60px 0 32px 0;
  }
  .footer-cta-title {
    font-size: 28px;
  }
  .footer-divider-line {
    margin: 40px 0 24px 0;
  }
  .text-center-lt-sm {
    text-align: center;
  }
}
</style>
