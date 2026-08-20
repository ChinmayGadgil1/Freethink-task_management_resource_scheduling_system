<template>
  <div class="landing-page-root">
    <!-- Top Sticky Navbar -->
    <LandingNavbar />

    <!-- Main Content -->
    <main>
      <!-- Hero Section with UI Mockup -->
      <HeroSection />

      <!-- Features Section (3x2 grid) -->
      <FeaturesSection />

      <!-- Mid-Page CTA Banner ("Built for teams. Designed for productivity.") -->
      <LandingCTA />

      <!-- How It Works Section -->
      <HowItWorksSection />
    </main>

    <!-- Footer -->
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import LandingNavbar from '@/components/landing/LandingNavbar.vue';
import HeroSection from '@/components/landing/HeroSection.vue';
import FeaturesSection from '@/components/landing/FeaturesSection.vue';
import LandingCTA from '@/components/landing/LandingCTA.vue';
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
</script>

<style scoped lang="scss">
.landing-page-root {
  min-height: 100vh;
  background-color: #ffffff;
  color: #181d28;
  font-family:
    'Plus Jakarta Sans',
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  overflow-x: hidden;
}
</style>
