<template>
  <q-layout view="hHh lpR fFf" class="bg-deep-purple-1">
    <q-page-container>
      <q-page class="flex flex-center bg-deep-purple-1 relative-position overflow-hidden">
        <!-- Background Image -->
        <q-img
          :src="backgroundImage"
          fit="cover"
          position="center"
          class="absolute-full"
          style="opacity: 0.5"
        />

        <!-- Centered Container for Auth Pages -->
        <div class="relative-position z-top flex flex-center full-width q-pa-md">
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import backgroundImage from '@/assets/image.png';
</script>
