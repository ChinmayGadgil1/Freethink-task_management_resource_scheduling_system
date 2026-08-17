<template>
  <q-layout view="hHh lpR fFf" class="auth-layout">
    <q-page-container>
      <q-page class="auth-page flex flex-center">
        <!-- Responsive Background Image -->
        <q-img
          :src="backgroundImage"
          fit="cover"
          position="center"
          class="auth-bg-img absolute-full"
        />

        <!-- Centered Card Container for Auth Pages -->
        <div class="auth-content flex flex-center full-width q-pa-md">
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import backgroundImage from '@/assets/image.png'
</script>

<style scoped>
.auth-layout {
  background-color: #ece6df;
}

.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  overflow: hidden;
  background-color: #ece6df;
}

.auth-bg-img {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.auth-content {
  position: relative;
  z-index: 2;
}

/* Mobile responsive adjustments */
@media (max-width: 599px) {
  .auth-page {
    padding: 16px 8px;
  }
}
</style>
