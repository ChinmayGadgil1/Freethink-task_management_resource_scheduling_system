<template>
  <q-page class="flex flex-center">
    <div class="column items-center text-center q-pa-md" style="max-width: 600px; width: 100%">
      <img
        alt="Quasar logo"
        src="~@/assets/quasar-logo-vertical.svg"
        style="width: 140px; height: 140px"
      />
      <q-spinner color="primary" size="2em" class="q-mt-md" />
      <div class="text-body1 text-grey-7 q-mt-sm">Redirecting to your dashboard...</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.user) {
    if (authStore.user.role === 'PROJECT_MANAGER') {
      void router.replace('/app/pm-dashboard');
      return;
    } else if (authStore.user.role === 'RESOURCE') {
      void router.replace('/app/resource-dashboard');
      return;
    }
  }
  void router.replace('/');
});
</script>
