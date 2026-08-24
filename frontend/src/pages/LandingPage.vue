<template>
  <div class="landing-page-root">
    <!-- Top Sticky Navbar -->
    <LandingNavbar />

    <!-- Main Content -->
    <main>
      <!-- Hero Section with UI Mockup -->
      <HeroSection />

      <!-- Horizontal Announcement / Promotional Strip -->
      <AnnouncementStrip />

      <!-- Alternating Product Showcase Sections -->
      <ProductShowcaseSection />

      <!-- Role-based Clarity & Testimonial Section -->
      <RoleTestimonialSection />
    </main>

    <!-- Large Dark CTA & Footer -->
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useThemeStore } from '@/stores/theme';
import LandingNavbar from '@/components/landing/LandingNavbar.vue';
import HeroSection from '@/components/landing/HeroSection.vue';
import AnnouncementStrip from '@/components/landing/AnnouncementStrip.vue';
import ProductShowcaseSection from '@/components/landing/ProductShowcaseSection.vue';
import RoleTestimonialSection from '@/components/landing/RoleTestimonialSection.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initTheme();
});
</script>

<style scoped lang="scss">
.landing-page-root {
  min-height: 100vh;
  background-color: var(--wo-bg-page, #ffffff);
  color: var(--wo-text-main, #121620);
  font-family:
    'Manrope',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  overflow-x: hidden;
  transition: background-color 0.25s ease, color 0.25s ease;
}

body.body--dark {
  .landing-page-root {
    background-color: #0b0f19;
    color: #f3f4f6;
  }
}
</style>
