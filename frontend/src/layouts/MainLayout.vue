<template>
  <q-layout view="lHh LpR lFf" class="main-layout-root">
    <!-- REUSABLE DUAL-RAIL SIDEBAR -->
    <AppSidebar
      v-model="leftDrawerOpen"
      v-model:is-mini="isMini"
      home-route="/pm/projects"
      help-route="/pm/help"
      quick-action-route="/pm/projects"
      quick-action-title="Quick New Item"
      :nav-items="pmNavItems"
    />

    <!-- TOP HEADER -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- Left: Mobile / Sidebar Expand Toggle & Workspace Tag -->
        <div class="row items-center gap-sm">
          <q-btn
            flat
            dense
            round
            :icon="isMini ? 'menu_open' : 'menu'"
            aria-label="Toggle Sidebar"
            class="drawer-toggle-btn lt-md"
            @click="toggleMini"
          >
            <q-tooltip>{{ isMini ? 'Expand Sidebar' : 'Collapse Sidebar' }}</q-tooltip>
          </q-btn>
          <div class="header-workspace-tag gt-xs">
            <span class="tag-spark">✦</span>
            <span>Project Management</span>
          </div>
        </div>

        <!-- Center / Global Search -->
        <div class="search-container">
          <div
            class="header-search-trigger row items-center justify-between"
            @click="paletteOpen = true"
          >
            <div class="row items-center no-wrap ellipsis text-grey-6">
              <q-icon name="search" size="18px" class="q-mr-sm" />
              <span class="search-placeholder ellipsis"
                >Search projects, tasks, team, actions...</span
              >
            </div>
            <div class="row items-center gap-xs">
              <span class="search-shortcut">Ctrl + K</span>
            </div>
          </div>
        </div>

        <!-- Right Header Actions -->
        <div class="header-actions row items-center q-gutter-sm">
          <!-- Notification Bell Icon Button -->
          <NotificationMenu />

          <!-- Dark/Light Mode -->
          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            :color="$q.dark.isActive ? 'amber-5' : 'grey-7'"
            class="header-icon-btn"
            :aria-label="$q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleDarkMode"
          >
            <q-tooltip>{{
              $q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'
            }}</q-tooltip>
          </q-btn>

          <!-- User Profile Dropdown -->
          <div v-if="user" class="profile row items-center gap-xs cursor-pointer">
            <q-avatar size="34px" class="profile-avatar">
              <span class="profile-initial">
                {{ user.name.charAt(0).toUpperCase() }}
              </span>
            </q-avatar>

            <div class="profile-info gt-xs">
              <div class="profile-name">
                {{ user.name }}
              </div>
              <div class="profile-role">
                {{ user.role === 'PROJECT_MANAGER' ? 'Project Manager' : 'Resource' }}
              </div>
            </div>

            <q-icon name="keyboard_arrow_down" size="18px" color="grey-6" class="gt-xs" />

            <q-menu
              transition-show="jump-down"
              transition-hide="jump-up"
              class="profile-dropdown-menu"
            >
              <q-list style="min-width: 250px">
                <!-- User Info Header Section -->
                <q-item class="q-py-md q-px-md row items-center no-wrap">
                  <q-item-section avatar style="min-width: 46px">
                    <q-avatar size="38px" class="profile-dropdown-avatar">
                      <span class="profile-initial">
                        {{ user.name.charAt(0).toUpperCase() }}
                      </span>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section class="q-pl-xs">
                    <q-item-label
                      class="text-weight-bold text-dark text-subtitle2 ellipsis"
                      style="font-size: 13.5px; line-height: 1.25"
                    >
                      {{ user.name }}
                    </q-item-label>
                    <q-item-label
                      caption
                      class="text-grey-6 ellipsis"
                      style="font-size: 11px; margin-top: 1px"
                      :title="user.email"
                    >
                      {{ user.email }}
                    </q-item-label>
                    <div class="row items-center q-mt-xs">
                      <span
                        class="role-badge"
                        :class="user.role === 'PROJECT_MANAGER' ? 'pm-badge' : 'res-badge'"
                      >
                        {{ user.role === 'PROJECT_MANAGER' ? 'PM' : 'Resource' }}
                      </span>
                    </div>
                  </q-item-section>
                </q-item>

                <q-separator />

                <!-- Action Items -->
                <q-item
                  clickable
                  v-close-popup
                  @click="goToRoute('/pm/profile')"
                  class="q-py-sm q-px-md"
                >
                  <q-item-section avatar style="min-width: 32px">
                    <q-icon name="person" color="primary" size="18px" />
                  </q-item-section>
                  <q-item-section style="font-size: 12.5px">My Profile</q-item-section>
                </q-item>

                <q-item
                  clickable
                  v-close-popup
                  @click="handleLogout"
                  class="logout-item q-py-sm q-px-md"
                >
                  <q-item-section avatar style="min-width: 32px">
                    <q-icon name="logout" color="negative" size="18px" />
                  </q-item-section>
                  <q-item-section class="text-negative text-weight-bold" style="font-size: 12.5px"
                    >Logout</q-item-section
                  >
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Page Content Container -->
    <q-page-container class="app-page-container">
      <router-view />
    </q-page-container>

    <!-- Global Command Palette (Ctrl+K) -->
    <GlobalCommandPalette v-model="paletteOpen" />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import AppSidebar, { type SidebarNavItem } from '@/components/layout/AppSidebar.vue';
import GlobalCommandPalette from '@/components/common/GlobalCommandPalette.vue';
import NotificationMenu from '@/components/common/NotificationMenu.vue';
import { useAuthStore } from '@/stores/auth';
import { useSessionStore } from '@/stores/session';
import { useThemeStore } from '@/stores/theme';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const sessionStore = useSessionStore();
const themeStore = useThemeStore();

const leftDrawerOpen = ref(true);
const isMini = ref(false);
const paletteOpen = ref(false);

function toggleMini() {
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  } else {
    isMini.value = !isMini.value;
  }
}

const pmNavItems = computed<SidebarNavItem[]>(() => [
  {
    title: 'Projects',
    to: '/pm/projects',
    icon: 'folder',
    colorClass: 'text-purple',
    bgClass: 'bg-purple-soft',
  },
  {
    title: 'Tasks',
    to: '/pm/tasks',
    icon: 'task_alt',
    colorClass: 'text-teal',
    bgClass: 'bg-teal-soft',
  },
  {
    title: 'Resources',
    to: '/pm/resources',
    icon: 'groups',
    colorClass: 'text-orange',
    bgClass: 'bg-orange-soft',
  },
  {
    title: 'Schedule',
    to: '/pm/schedule',
    icon: 'event',
    colorClass: 'text-blue',
    bgClass: 'bg-blue-soft',
  },
  {
    title: 'Analytics',
    to: '/pm/analytics',
    icon: 'insights',
    colorClass: 'text-purple',
    bgClass: 'bg-purple-soft',
  },
  {
    title: 'Calendar',
    to: '/pm/calendar',
    icon: 'calendar_month',
    colorClass: 'text-amber-9',
    bgClass: 'bg-amber-1',
  },
  {
    title: 'Leaves',
    to: '/pm/leaves',
    icon: 'event_busy',
    colorClass: 'text-red-7',
    bgClass: 'bg-red-1',
  },
]);

function goToRoute(path: string) {
  void router.push(path);
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen.value = !paletteOpen.value;
  }
}

const user = computed(() => authStore.user);

function toggleDarkMode() {
  themeStore.toggleDarkMode();
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  themeStore.initTheme();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleLogout() {
  if (authStore.user?.role === 'RESOURCE' && sessionStore.hasActiveSession) {
    $q.dialog({
      title: 'Active Work Session',
      message: `You have an active work session (Task #${sessionStore.activeTaskId}). Please end your current session before logging out.`,
      ok: {
        label: 'Go to Task',
        color: 'primary',
        noCaps: true,
      },
      cancel: {
        label: 'Cancel',
        flat: true,
        noCaps: true,
      },
      persistent: true,
    }).onOk(() => {
      if (sessionStore.activeTaskId) {
        void router.push(
          `/app/resource-dashboard/task-details?taskId=${sessionStore.activeTaskId}`,
        );
      }
    });
    return;
  }

  authStore.clearAuth();
  sessionStore.clearSession();
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('flashMessage');

  $q.notify({
    type: 'info',
    message: 'You have been logged out',
  });

  void router.push('/');
}
</script>

<style scoped lang="scss">
.main-layout-root {
  background: var(--wo-bg-page, #f7f7fa);
  overflow-x: hidden;
  max-width: 100vw;
}

/* Top App Header */
.app-header {
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #121620);
  border-bottom: 1px solid var(--wo-border, #edf0f5);
  box-shadow: var(--wo-header-shadow, 0 1px 3px rgba(16, 24, 40, 0.02));
}

body.body--dark .app-header {
  background: #121620;
  color: #f1f5f9;
  border-color: rgba(255, 255, 255, 0.08);
}

.app-toolbar {
  min-height: 64px;
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-workspace-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--wo-bg-tag, #f1f5f9);
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--wo-primary, #8b6fd8);

  .tag-spark {
    font-size: 11px;
  }
}

.search-container {
  flex: 1;
  max-width: 440px;
  margin: 0 20px;
}

.header-search {
  width: 100%;
}

.header-search-trigger {
  min-height: 38px;
  height: 38px;
  border: 1px solid var(--wo-border, #edf0f5);
  border-radius: 12px;
  padding: 0 12px;
  background: var(--wo-bg-input, #f8fafc);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--wo-primary, #8b6fd8);
    background: var(--wo-bg-card, #ffffff);
    box-shadow: 0 2px 8px rgba(139, 111, 216, 0.08);
  }
}

body.body--dark .header-search-trigger {
  background: #181f2c;
  border-color: rgba(255, 255, 255, 0.08);

  &:hover {
    border-color: var(--wo-primary, #8b6fd8);
    background: #1e2738;
  }
}

.search-placeholder {
  font-size: 12.5px;
  color: var(--wo-text-muted, #94a3b8);
}

.search-shortcut {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 6px;
  color: var(--wo-text-muted, #94a3b8);
  background: var(--wo-bg-tag, #ffffff);
  font-size: 10px;
  font-weight: 700;
}

body.body--dark .search-shortcut {
  background: #232d3f;
  border-color: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
}

.profile {
  padding: 4px 8px;
  border-radius: 12px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--wo-bg-card-hover, #f8fafc);
  }
}

.profile-avatar {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
  font-size: 13px;
  border: 2px solid var(--wo-bg-card, #ffffff);

  :deep(.q-avatar__content),
  .profile-initial {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    width: 100%;
    height: 100%;
  }
}

.profile-info {
  min-width: 80px;
}

.profile-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
  line-height: 1.2;
}

.profile-role {
  font-size: 10px;
  color: var(--wo-text-muted, #64748b);
}

.app-page-container {
  min-height: 100vh;
  overflow-x: hidden;
  max-width: 100%;
}

/* Profile Dropdown Custom Styling */
.profile-dropdown-menu {
  border-radius: 12px !important;
  border: 1px solid var(--wo-border, #e5e7ec) !important;
  box-shadow:
    0 10px 25px -5px rgba(16, 24, 40, 0.08),
    0 8px 10px -6px rgba(16, 24, 40, 0.05) !important;
  overflow: hidden;
}

.profile-dropdown-avatar {
  background: rgba(139, 111, 216, 0.12) !important;
  color: var(--wo-primary, #8b6fd8) !important;
  font-weight: 700;
  font-size: 14px;
  border: 1.5px solid rgba(139, 111, 216, 0.25);
}

.role-badge {
  font-size: 8.5px;
  font-weight: 800;
  padding: 2.5px 7px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  line-height: 1;

  &.pm-badge {
    background: rgba(139, 111, 216, 0.12);
    color: #8b6fd8;
  }

  &.res-badge {
    background: rgba(19, 174, 118, 0.12);
    color: #13ae76;
  }
}

.logout-item {
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.06) !important;
  }
}
</style>
