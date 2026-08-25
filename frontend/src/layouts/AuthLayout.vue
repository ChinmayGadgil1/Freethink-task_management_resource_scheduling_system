<template>
  <q-layout view="hHh lpR fFf" class="auth-layout-root">
    <q-page-container>
      <q-page class="auth-page-wrapper flex flex-center relative-position overflow-hidden">
        <!-- Light Mode Background (Image + Lavender Base) -->
        <div class="auth-bg-light absolute-full">
          <q-img
            :src="backgroundImage"
            fit="cover"
            position="center"
            class="absolute-full"
            style="opacity: 0.65"
          />
        </div>

        <!-- Dark Mode Background (Deep Navy + Subtle Purple Gradient + Ambient Dark Orbs & Decorative Shapes) -->
        <div class="auth-bg-dark absolute-full">
          <!-- Ambient Radial Glows -->
          <div class="ambient-dark-glow glow-top-purple" />
          <div class="ambient-dark-glow glow-bottom-indigo" />
          <div class="ambient-dark-glow glow-center-violet" />

          <!-- Decorative Geometric Grid -->
          <div class="dark-decor-grid absolute-full" />

          <!-- Subtle Decorative Floating Shapes / Icons (Adapted to low-opacity navy/purple) -->
          <div class="decor-shape shape-1">✦</div>
          <div class="decor-shape shape-2">✦</div>
          <div class="decor-shape shape-3">✦</div>
          <div class="decor-shape shape-4">
            <q-icon name="task_alt" size="32px" />
          </div>
          <div class="decor-shape shape-5">
            <q-icon name="insights" size="32px" />
          </div>
          <div class="decor-shape shape-6">
            <q-icon name="timeline" size="36px" />
          </div>
          <div class="decor-shape shape-7">
            <q-icon name="pie_chart" size="30px" />
          </div>
        </div>

        <!-- Centered Container for Auth Pages -->
        <div class="auth-content-container relative-position flex flex-center full-width q-pa-md" style="z-index: 5">
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import backgroundImage from '@/assets/image.png';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initTheme();
});
</script>

<style scoped lang="scss">
.auth-layout-root {
  min-height: 100vh;
  background-color: #f4f0fd;
  transition: background-color 0.3s ease;
}

.auth-page-wrapper {
  min-height: 100vh;
}

.auth-bg-light {
  display: block;
  background: #f4f0fd;
}

.auth-bg-dark {
  display: none;
  background: linear-gradient(135deg, #090d16 0%, #0f1423 45%, #171128 100%);
  overflow: hidden;
}

/* Ambient Glows */
.ambient-dark-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
}

.glow-top-purple {
  top: -100px;
  right: -50px;
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(139, 111, 216, 0.18) 0%, rgba(139, 111, 216, 0) 70%);
}

.glow-bottom-indigo {
  bottom: -100px;
  left: -80px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0) 70%);
}

.glow-center-violet {
  top: 40%;
  left: 30%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0) 70%);
}

/* Dark Decorative Grid */
.dark-decor-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

/* Floating Shapes */
.decor-shape {
  position: absolute;
  color: #8b6fd8;
  opacity: 0.14;
  pointer-events: none;
  user-select: none;
  transition: all 0.3s ease;

  &.shape-1 {
    top: 12%;
    left: 8%;
    font-size: 26px;
  }
  &.shape-2 {
    top: 18%;
    right: 12%;
    font-size: 32px;
  }
  &.shape-3 {
    bottom: 14%;
    left: 14%;
    font-size: 28px;
  }
  &.shape-4 {
    top: 28%;
    left: 15%;
  }
  &.shape-5 {
    bottom: 22%;
    right: 14%;
  }
  &.shape-6 {
    top: 20%;
    left: 80%;
  }
  &.shape-7 {
    bottom: 16%;
    right: 25%;
  }
}

/* When dark mode is active on body */
body.body--dark {
  .auth-layout-root {
    background-color: #0b0f19;
  }

  .auth-bg-light {
    display: none;
  }

  .auth-bg-dark {
    display: block;
  }
}
</style>
