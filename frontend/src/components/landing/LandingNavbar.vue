<template>
  <header class="landing-navbar-wrapper">
    <div class="landing-navbar container">
      <!-- Brand Logo -->
      <div class="brand" @click="goToRoot">
        <div class="brand-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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

      <!-- Desktop Navigation Links -->
      <nav class="nav-links gt-sm">
        <a href="#features" class="nav-link" @click.prevent="scrollTo('features')">Features</a>
        <a href="#how-it-works" class="nav-link" @click.prevent="scrollTo('how-it-works')"
          >How It Works</a
        >
        <a href="#for-teams" class="nav-link" @click.prevent="scrollTo('for-teams')">For Teams</a>
      </nav>

      <!-- Auth Actions -->
      <div class="nav-actions gt-sm">
        <!-- Theme Toggle -->
        <q-btn
          flat
          round
          dense
          :icon="themeStore.isDark ? 'light_mode' : 'dark_mode'"
          :color="themeStore.isDark ? 'amber-5' : 'grey-8'"
          aria-label="Toggle dark mode"
          class="theme-toggle-btn"
          @click="themeStore.toggleDarkMode"
        >
          <q-tooltip>{{ themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}</q-tooltip>
        </q-btn>

        <q-btn flat no-caps label="Log in" class="login-btn" @click="goToLogin" />
        <q-btn
          unelevated
          no-caps
          label="Get Started"
          icon-right="arrow_forward"
          class="signup-btn"
          @click="goToSignup"
        />
      </div>

      <!-- Mobile Menu Toggle Button -->
      <div class="lt-md row items-center q-gutter-xs">
        <q-btn
          flat
          round
          dense
          :icon="themeStore.isDark ? 'light_mode' : 'dark_mode'"
          :color="themeStore.isDark ? 'amber-5' : 'grey-8'"
          aria-label="Toggle dark mode"
          @click="themeStore.toggleDarkMode"
        />
        <q-btn
          flat
          round
          dense
          icon="menu"
          :color="themeStore.isDark ? 'white' : 'dark'"
          aria-label="Toggle menu"
          @click="mobileDrawerOpen = !mobileDrawerOpen"
        />
      </div>
    </div>

    <!-- Mobile Drawer / Dropdown -->
    <q-dialog v-model="mobileDrawerOpen" position="top" class="mobile-nav-dialog">
      <q-card class="mobile-nav-card q-pa-md">
        <div class="row items-center justify-between q-pb-sm">
          <div class="brand" @click="goToRoot">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
            <span class="brand-name">TaskFlow</span>
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </div>

        <q-separator class="q-my-sm" />

        <div class="column q-gutter-y-sm q-py-sm">
          <q-btn
            flat
            align="left"
            no-caps
            label="Features"
            class="mobile-nav-link"
            @click="scrollToAndClose('features')"
          />
          <q-btn
            flat
            align="left"
            no-caps
            label="How It Works"
            class="mobile-nav-link"
            @click="scrollToAndClose('how-it-works')"
          />
          <q-btn
            flat
            align="left"
            no-caps
            label="For Teams"
            class="mobile-nav-link"
            @click="scrollToAndClose('for-teams')"
          />
        </div>

        <q-separator class="q-my-sm" />

        <div class="column q-gutter-y-sm q-pt-sm">
          <q-btn
            outline
            no-caps
            label="Log in"
            color="primary"
            class="full-width"
            @click="goToLogin"
          />
          <q-btn
            unelevated
            no-caps
            label="Get Started"
            icon-right="arrow_forward"
            color="primary"
            class="full-width signup-btn"
            @click="goToSignup"
          />
        </div>
      </q-card>
    </q-dialog>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useThemeStore } from '@/stores/theme';

const router = useRouter();
const themeStore = useThemeStore();
const mobileDrawerOpen = ref(false);

function goToRoot() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToLogin() {
  void router.push('/login');
}

function goToSignup() {
  void router.push('/signup');
}

function scrollTo(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToAndClose(sectionId: string) {
  mobileDrawerOpen.value = false;
  setTimeout(() => scrollTo(sectionId), 200);
}
</script>

<style scoped lang="scss">
.landing-navbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(230, 232, 237, 0.8);
  transition: all 0.2s ease;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.landing-navbar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 21px;
  font-weight: 800;
  color: #121620;
  letter-spacing: -0.025em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  color: #4b5563;
  font-size: 14.5px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s ease;
  cursor: pointer;

  &:hover {
    color: #8b6fd8;
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.login-btn {
  color: #1f2937;
  font-size: 14.5px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 10px;
  transition: all 0.15s ease;

  &:hover {
    background: #f3f4f6;
    color: #8b6fd8;
  }
}

.signup-btn {
  background: #8b6fd8;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 600;
  padding: 9px 22px;
  border-radius: 9999px;
  box-shadow: 0 3px 12px rgba(139, 111, 216, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc;
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(139, 111, 216, 0.4);
  }
}

.mobile-nav-card {
  width: 100%;
  max-width: 500px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

.mobile-nav-link {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  padding: 10px 12px;
  border-radius: 8px;
}

body.body--dark {
  .landing-navbar-wrapper {
    background: rgba(11, 15, 25, 0.88);
    border-bottom: 1px solid rgba(40, 48, 66, 0.8);
  }

  .brand-name {
    color: #f3f4f6;
  }

  .nav-link {
    color: #94a3b8;

    &:hover {
      color: #a78bfa;
    }
  }

  .login-btn {
    color: #f3f4f6;

    &:hover {
      background: #181d28;
      color: #a78bfa;
    }
  }

  .mobile-nav-card {
    background: #181d28;
    color: #f3f4f6;
    border: 1px solid #283042;
  }

  .mobile-nav-link {
    color: #94a3b8;

    &:hover {
      color: #f3f4f6;
      background: #202636;
    }
  }
}
</style>
