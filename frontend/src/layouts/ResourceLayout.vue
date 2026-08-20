<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- Brand -->
        <div class="brand" @click="router.push('/app/resource-dashboard')">
          <div class="brand-mark">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="6" fill="#8B6FD8" />
              <ellipse
                cx="12"
                cy="12"
                rx="10"
                ry="4"
                transform="rotate(-30 12 12)"
                stroke="#8B6FD8"
                stroke-width="2"
                stroke-dasharray="2 1"
              />
            </svg>
          </div>
          <div class="brand-name">TaskFlow</div>
          <span class="brand-spark">✦</span>
        </div>

        <!-- Resource navigation -->
        <nav class="main-nav">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.disabled ? '' : link.to"
            class="nav-link"
            :class="{
              'nav-link-disabled': link.disabled,
              'nav-link-active': isLinkActive(link.to),
            }"
            exact-active-class=""
            active-class=""
          >
            {{ link.label }}
            <span v-if="link.disabled" class="soon-tag">Soon</span>
          </router-link>
        </nav>

        <!-- Header actions -->
        <div class="header-actions">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search your tasks..."
            class="header-search"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
          </q-input>

          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
            :color="$q.dark.isActive ? 'amber-5' : 'grey-7'"
            class="header-icon-btn"
            @click="toggleDarkMode"
            :aria-label="$q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <q-tooltip>{{
              $q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'
            }}</q-tooltip>
          </q-btn>

          <div v-if="user" class="profile">
            <q-avatar size="34px" class="profile-avatar">
              <span class="profile-initial">{{ userInitial }}</span>
            </q-avatar>
            <div class="profile-info">
              <div class="profile-name">{{ user.name }}</div>
              <div class="profile-role">Resource</div>
            </div>
            <q-icon name="keyboard_arrow_down" size="18px" color="grey-6" />

            <q-menu>
              <q-list style="min-width: 180px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ user.name }}</q-item-label>
                    <q-item-label caption>{{ user.email }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section>Sign out</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const searchQuery = ref('');

function isLinkActive(linkTo: string): boolean {
  if (!linkTo) return false;
  if (linkTo === '/app/resource-dashboard') {
    return route.path === '/app/resource-dashboard' || route.path === '/app/resource-dashboard/';
  }
  return route.path.startsWith(linkTo);
}

function toggleDarkMode() {
  themeStore.toggleDarkMode();
}

onMounted(() => {
  themeStore.initTheme();
});

const user = computed(() => authStore.user);

const userInitial = computed(() => (user.value?.name || 'R').charAt(0).toUpperCase());

// Only Dashboard and My Tasks are wired up for now — Progress and
// Calendar are shown so the nav reads correctly, but stay disabled
// until those pages exist.
const navLinks = [
  { label: 'Dashboard', to: '/app/resource-dashboard', disabled: false },
  { label: 'Task Specs', to: '/app/resource-dashboard/task-details', disabled: false },
  { label: 'Progress', to: '/app/resource-dashboard/progress', disabled: false },
];

function logout() {
  authStore.clearAuth();
  localStorage.removeItem('user');
  sessionStorage.removeItem('flashMessage');
  void router.push('/');
}
</script>

<style scoped lang="scss">
.app-header {
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #1d2433);
  border-bottom: 1px solid var(--wo-border, #eaecef);
  box-shadow: var(--wo-header-shadow, 0 1px 2px rgba(16, 24, 40, 0.03));
}

.app-toolbar {
  min-height: 60px;
  height: 60px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
  flex-shrink: 0;
  cursor: pointer;
}

.brand-mark {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wo-primary-light, #f4f0fd);
  border-radius: 9px;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand-spark {
  color: var(--wo-primary, #8b6fd8);
  font-size: 12px;
  margin-left: -4px;
}

.main-nav {
  display: flex;
  align-items: center;
  height: 60px;
  gap: 2px;
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 60px;
  padding: 0 16px;
  color: var(--wo-text-muted, #475467);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.nav-link:hover {
  color: var(--wo-text-main, #1d2433);
}

.nav-link-active {
  color: var(--wo-text-main, #1d2433);
  font-weight: 600;
}

.nav-link-active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 2.5px;
  border-radius: 2px 2px 0 0;
  background: var(--wo-primary, #8b6fd8);
}

.nav-link-disabled {
  color: var(--wo-text-subtle, #98a2b3);
  pointer-events: none;
}

.soon-tag {
  padding: 1px 6px;
  border-radius: 20px;
  background: var(--wo-border-subtle, #f0f2f5);
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-search {
  width: 220px;
}
.header-search :deep(.q-field__control) {
  min-height: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--wo-bg-input, #f9fafb);
  border-color: var(--wo-border, #e4e7ec);
}

.header-search :deep(.q-field__control:hover) {
  background: var(--wo-bg-card, #ffffff);
  border-color: var(--wo-border, #d0d5dd);
}

.header-search :deep(.q-field__native) {
  color: var(--wo-text-main, #344054);
}

.header-icon-btn {
  width: 34px;
  height: 34px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 8px;
  cursor: pointer;
}

.profile-avatar {
  border: 2px solid var(--wo-border, #f2f4f7);
  background: var(--wo-primary-light, #f4f0fd);
  color: var(--wo-primary, #8b6fd8);
}

.profile-info {
  min-width: 90px;
}
.profile-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
}
.profile-role {
  margin-top: 1px;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 10px;
}

@media (max-width: 1150px) {
  .app-toolbar {
    padding: 0 20px;
    gap: 16px;
  }
  .nav-link {
    padding: 0 10px;
    font-size: 12px;
  }
  .header-search {
    width: 170px;
  }
}

@media (max-width: 900px) {
  .main-nav {
    display: none;
  }
  .profile-info {
    display: none;
  }
}
</style>
