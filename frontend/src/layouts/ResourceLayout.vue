<template>
  <q-layout view="lHh lpR lFf" class="main-layout-root">
    <!-- LEFT SIDEBAR WITH DUAL RAIL & EXPAND/SHRINK TOGGLE (IDENTICAL TO PM SIDE) -->
    <q-drawer
      v-model="leftDrawerOpen"
      :mini="isMini"
      :width="290"
      :mini-width="72"
      show-if-above
      side="left"
      bordered
      class="app-sidebar-drawer"
    >
      <div class="sidebar-dual-container row no-wrap full-height">
        <!-- 1. SLIM LEFT ICON RAIL (Always Visible) -->
        <div class="slim-icon-rail column items-center justify-between">
          <!-- Top Section: Expand/Shrink & Quick Icons -->
          <div class="column items-center gap-sm full-width q-pt-sm">
            <!-- Toggle / Menu Button -->
            <button
              class="rail-icon-btn menu-toggle-btn"
              :title="isMini ? 'Expand Sidebar (»)' : 'Shrink Sidebar («)'"
              @click="toggleMini"
            >
              <q-icon :name="isMini ? 'keyboard_double_arrow_right' : 'more_horiz'" size="18px" />
            </button>

            <!-- Quick Add Button (+) -->
            <button
              class="rail-quick-add-btn"
              title="Quick Action"
              @click="goToRoute('/app/resource-dashboard/task-details')"
            >
              <q-icon name="add" size="18px" />
            </button>

            <div class="rail-divider" />

            <!-- Core App Icons (Dashboard, Task Specs, Progress) -->
            <router-link
              to="/app/resource-dashboard"
              class="rail-icon-item"
              :class="{ 'rail-item-active': isLinkActive('/app/resource-dashboard') }"
              title="Dashboard"
            >
              <div class="rail-icon-box bg-purple-soft">
                <q-icon name="space_dashboard" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Dashboard</q-tooltip>
            </router-link>

            <router-link
              to="/app/resource-dashboard/task-details"
              class="rail-icon-item"
              :class="{ 'rail-item-active': isLinkActive('/app/resource-dashboard/task-details') }"
              title="Task Specs"
            >
              <div class="rail-icon-box bg-teal-soft">
                <q-icon name="assignment" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Task Specs</q-tooltip>
            </router-link>

            <router-link
              to="/app/resource-dashboard/progress"
              class="rail-icon-item"
              :class="{ 'rail-item-active': isLinkActive('/app/resource-dashboard/progress') }"
              title="Progress"
            >
              <div class="rail-icon-box bg-green-soft">
                <q-icon name="insights" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Progress</q-tooltip>
            </router-link>
          </div>

          <!-- Bottom Slim Section: Mode & User Initial -->
          <div class="column items-center gap-sm q-pb-md">
            <button
              class="rail-icon-btn"
              :title="$q.dark.isActive ? 'Light Mode' : 'Dark Mode'"
              @click="toggleDarkMode"
            >
              <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" size="16px" />
            </button>

            <q-avatar size="32px" class="rail-avatar cursor-pointer" @click="logout">
              <span>{{ userInitial }}</span>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">
                {{ user?.name }} (Click to Logout)
              </q-tooltip>
            </q-avatar>
          </div>
        </div>

        <!-- 2. EXPANDABLE MAIN SIDEBAR MENU (Hidden in Mini Mode) -->
        <div v-show="!isMini" class="expandable-sidebar-body column justify-between col">
          <!-- Upper Panel: Brand, Navigation Lists -->
          <div class="scroll-content q-pa-sm">
            <!-- Brand Header + Shrink Button -->
            <div class="sidebar-brand-row row items-center justify-between no-wrap q-py-xs q-px-xs">
              <div class="row items-center gap-xs cursor-pointer" @click="goToRoute('/app/resource-dashboard')">
                <div class="brand-badge-icon">
                  <span class="brand-sparkle">✦</span>
                </div>
                <div class="brand-title-wrap">
                  <span class="brand-title-text">TaskFlow</span>
                </div>
              </div>

              <!-- Shrink Button («) -->
              <button
                class="sidebar-shrink-btn"
                title="Collapse Sidebar"
                @click="isMini = true"
              >
                <q-icon name="keyboard_double_arrow_left" size="16px" />
              </button>
            </div>

            <q-separator class="q-my-sm" />

            <!-- Main Menu Section -->
            <div class="menu-category-block q-mt-xs">
              <div class="category-header-label">MAIN MENU</div>

              <nav class="category-nav-list">
                <!-- 1. Dashboard -->
                <router-link
                  to="/app/resource-dashboard"
                  class="menu-nav-link"
                  :class="{ 'menu-nav-link-active': isLinkActive('/app/resource-dashboard') }"
                >
                  <q-icon name="space_dashboard" size="17px" class="q-mr-sm text-purple" />
                  <span class="nav-text font-bold">Dashboard</span>
                  <span v-if="isLinkActive('/app/resource-dashboard')" class="active-indicator-bar" />
                </router-link>

                <!-- 2. Task Specs -->
                <router-link
                  to="/app/resource-dashboard/task-details"
                  class="menu-nav-link"
                  :class="{ 'menu-nav-link-active': isLinkActive('/app/resource-dashboard/task-details') }"
                >
                  <q-icon name="assignment" size="17px" class="q-mr-sm text-teal" />
                  <span class="nav-text">Task Specs</span>
                  <span v-if="isLinkActive('/app/resource-dashboard/task-details')" class="active-indicator-bar" />
                </router-link>

                <!-- 3. Progress -->
                <router-link
                  to="/app/resource-dashboard/progress"
                  class="menu-nav-link"
                  :class="{ 'menu-nav-link-active': isLinkActive('/app/resource-dashboard/progress') }"
                >
                  <q-icon name="insights" size="17px" class="q-mr-sm text-green" />
                  <span class="nav-text">Progress</span>
                  <span v-if="isLinkActive('/app/resource-dashboard/progress')" class="active-indicator-bar" />
                </router-link>
              </nav>
            </div>

            <!-- Workspaces Section -->
            <div class="menu-category-block q-mt-md">
              <div class="row items-center justify-between no-wrap">
                <span class="category-header-label">WORKSPACES</span>
                <q-btn flat round dense icon="add" size="xs" color="grey-6" title="Add Workspace" />
              </div>

              <nav class="category-nav-list q-mt-xs">
                <div class="menu-sub-link cursor-pointer" @click="goToRoute('/app/resource-dashboard')">
                  <q-icon name="folder_open" size="15px" class="text-teal q-mr-sm" />
                  <span>Sprint Deliverables</span>
                </div>
                <div class="menu-sub-link cursor-pointer" @click="goToRoute('/app/resource-dashboard/task-details')">
                  <q-icon name="folder_open" size="15px" class="text-purple q-mr-sm" />
                  <span>Assigned Specs</span>
                </div>
                <div class="menu-sub-link cursor-pointer" @click="goToRoute('/app/resource-dashboard/progress')">
                  <q-icon name="folder_open" size="15px" class="text-orange q-mr-sm" />
                  <span>Work Logs</span>
                </div>
              </nav>
            </div>

            <!-- System Settings -->
            <div class="menu-category-block q-mt-md">
              <div class="category-header-label">SYSTEM</div>

              <div class="system-menu-list">
                <div class="system-item row items-center justify-between cursor-pointer" @click="toggleDarkMode">
                  <div class="row items-center gap-xs">
                    <q-icon name="dark_mode" size="16px" color="grey-7" />
                    <span>Dark Mode</span>
                  </div>
                  <q-toggle
                    :model-value="$q.dark.isActive"
                    dense
                    color="primary"
                    size="xs"
                    @update:model-value="toggleDarkMode"
                  />
                </div>

                <div class="system-item row items-center gap-xs cursor-pointer" @click="goToRoute('/app/resource-dashboard')">
                  <q-icon name="settings" size="16px" color="grey-7" />
                  <span>Settings</span>
                </div>

                <div class="system-item row items-center gap-xs cursor-pointer" @click="goToRoute('/app/resource-dashboard')">
                  <q-icon name="help_outline" size="16px" color="grey-7" />
                  <span>Help & Support</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lower Panel: User Profile Card & Switcher -->
          <div class="sidebar-user-footer q-pa-sm">
            <q-separator class="q-mb-sm" />
            <div v-if="user" class="user-profile-pill row items-center justify-between no-wrap">
              <div class="row items-center gap-xs no-wrap">
                <q-avatar size="32px" class="footer-avatar">
                  <span>{{ userInitial }}</span>
                </q-avatar>
                <div class="user-text-wrap">
                  <div class="user-name-line" :title="user.name">{{ user.name }}</div>
                  <div class="user-email-line">{{ user.email }}</div>
                </div>
              </div>
              <q-btn
                flat
                round
                dense
                icon="logout"
                size="sm"
                color="grey-6"
                class="user-logout-btn"
                title="Logout"
                @click="logout"
              />
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- TOP HEADER -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <div class="row items-center gap-sm">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            class="drawer-toggle-btn lt-md"
            @click="toggleDrawer"
          />
          <div class="header-workspace-tag gt-xs">
            <span class="tag-spark">✦</span>
            <span>Resource Workspace</span>
          </div>
        </div>

        <!-- Search Input -->
        <div class="search-container">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search tasks, deliverables, projects..."
            class="header-search"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
            <template #append>
              <span class="search-shortcut">⌘K</span>
            </template>
          </q-input>
        </div>

        <!-- Header Actions -->
        <div class="header-right-actions row items-center gap-sm">
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
              <span>{{ userInitial }}</span>
            </q-avatar>
            <div class="profile-info gt-xs">
              <div class="profile-name">{{ user.name }}</div>
              <div class="profile-role">Resource</div>
            </div>
            <q-icon name="keyboard_arrow_down" size="18px" color="grey-6" />

            <q-menu>
              <q-list style="min-width: 190px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ user.name }}</q-item-label>
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

    <!-- PAGE CONTAINER -->
    <q-page-container class="resource-page-container">
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
const leftDrawerOpen = ref(true);
const isMini = ref(false);

function toggleMini() {
  isMini.value = !isMini.value;
}

function toggleDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function isLinkActive(linkTo: string): boolean {
  if (!linkTo) return false;
  if (linkTo === '/app/resource-dashboard') {
    return route.path === '/app/resource-dashboard' || route.path === '/app/resource-dashboard/';
  }
  return route.path.startsWith(linkTo);
}

function goToRoute(path: string) {
  void router.push(path);
}

function toggleDarkMode() {
  themeStore.toggleDarkMode();
}

onMounted(() => {
  themeStore.initTheme();
});

const user = computed(() => authStore.user);
const userInitial = computed(() => (user.value?.name || 'R').charAt(0).toUpperCase());

function logout() {
  authStore.clearAuth();
  localStorage.removeItem('user');
  sessionStorage.removeItem('flashMessage');
  void router.push('/');
}
</script>

<style scoped lang="scss">
.main-layout-root {
  background: var(--wo-bg-page, #f7f7fa);
}

/* Sidebar Drawer */
.app-sidebar-drawer {
  background: #ffffff;
  border-right: 1px solid var(--wo-border, #edf0f5);
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

body.body--dark .app-sidebar-drawer {
  background: #121620;
  border-color: rgba(255, 255, 255, 0.08);
}

.sidebar-dual-container {
  width: 100%;
}

/* 1. Slim Left Icon Rail */
.slim-icon-rail {
  width: 68px;
  min-width: 68px;
  background: #fbfbfc;
  border-right: 1px solid #f1f3f7;
  padding: 12px 0;
  flex-shrink: 0;
}

body.body--dark .slim-icon-rail {
  background: #0f131a;
  border-color: rgba(255, 255, 255, 0.06);
}

.rail-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #121620;
    transform: translateY(-1px);
  }
}

.rail-quick-add-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #121620;
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(18, 22, 32, 0.25);
  transition: all 0.18s ease;

  &:hover {
    background: #8b6fd8;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(139, 111, 216, 0.35);
  }
}

.rail-divider {
  width: 24px;
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.rail-icon-item {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.18s ease;

  &:hover {
    background: #ffffff;
    transform: scale(1.05);
  }
}

.rail-item-active {
  .rail-icon-box {
    box-shadow: 0 3px 10px rgba(139, 111, 216, 0.25);
    border: 1.5px solid #8b6fd8;
  }
}

.rail-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;

  &.bg-purple-soft {
    background: #f5f3ff;
    color: #8b6fd8;
  }
  &.bg-teal-soft {
    background: #ecfdf5;
    color: #10b981;
  }
  &.bg-green-soft {
    background: #ecfdf5;
    color: #059669;
  }
  &.bg-orange-soft {
    background: #fff7ed;
    color: #f59e0b;
  }
  &.bg-blue-soft {
    background: #eff6ff;
    color: #3b82f6;
  }
}

.rail-avatar {
  background: rgba(139, 111, 216, 0.18);
  color: #8b6fd8;
  font-weight: 800;
  font-size: 13px;
  border: 2px solid #ffffff;
}

/* 2. Expandable Sidebar Body */
.expandable-sidebar-body {
  background: #ffffff;
  min-width: 215px;
  overflow-y: auto;
}

body.body--dark .expandable-sidebar-body {
  background: #121620;
}

.sidebar-brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-badge-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #8b6fd8;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.brand-title-text {
  font-size: 16px;
  font-weight: 800;
  color: #121620;
  letter-spacing: -0.02em;
}

body.body--dark .brand-title-text {
  color: #f1f5f9;
}

.sidebar-shrink-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--wo-bg-tag, #f1f5f9);
  border: 1px solid var(--wo-border, #e2e8f0);
  color: var(--wo-text-muted, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-primary, #8b6fd8);
    color: #ffffff;
  }
}

.category-header-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--wo-text-muted, #94a3b8);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 6px;
}

.category-nav-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.menu-nav-link {
  display: flex;
  align-items: center;
  position: relative;
  padding: 8px 10px;
  border-radius: 10px;
  color: var(--wo-text-muted, #475569);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-bg-card-hover, #f8fafc);
    color: var(--wo-text-main, #121620);
  }
}

.menu-nav-link-active {
  background: var(--wo-primary-light, #f5f3ff) !important;
  color: var(--wo-primary, #8b6fd8) !important;
  font-weight: 700 !important;

  .active-indicator-bar {
    position: absolute;
    right: 8px;
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background: var(--wo-primary, #8b6fd8);
  }
}

.nav-text {
  flex: 1;
}

.menu-sub-link {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--wo-text-muted, #64748b);
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-bg-card-hover, #f8fafc);
    color: var(--wo-text-main, #121620);
  }
}

.system-menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.system-item {
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--wo-text-muted, #475569);
  transition: background 0.15s ease;

  &:hover {
    background: var(--wo-bg-card-hover, #f8fafc);
    color: var(--wo-text-main, #121620);
  }
}

.user-profile-pill {
  background: var(--wo-bg-card, #f8fafc);
  border: 1px solid var(--wo-border, #edf0f5);
  border-radius: 12px;
  padding: 6px 8px;
}

body.body--dark .user-profile-pill {
  background: #181d28;
  border-color: rgba(255, 255, 255, 0.08);
}

.footer-avatar {
  background: rgba(139, 111, 216, 0.15);
  color: var(--wo-primary, #8b6fd8);
  font-weight: 800;
  font-size: 12px;
}

.user-text-wrap {
  min-width: 0;
  max-width: 110px;
}

.user-name-line {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

body.body--dark .user-name-line {
  color: #f1f5f9;
}

.user-email-line {
  font-size: 9.5px;
  color: var(--wo-text-muted, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.header-search :deep(.q-field__control) {
  min-height: 38px;
  height: 38px;
  border-color: var(--wo-border, #edf0f5);
  border-radius: 12px;
  padding: 0 10px 0 12px;
  background: var(--wo-bg-input, #f8fafc);
  transition: all 0.2s ease;
}

.header-search :deep(.q-field__control:hover) {
  border-color: var(--wo-primary, #cbd5e1);
  background: var(--wo-bg-card, #ffffff);
}

.header-search :deep(.q-field__native) {
  font-size: 12.5px;
  color: var(--wo-text-main, #1e293b);
}

.header-search :deep(.q-field__native::placeholder) {
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

.header-icon-btn {
  width: 36px;
  height: 36px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
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

body.body--dark .profile-name {
  color: #f1f5f9;
}

.profile-role {
  font-size: 10px;
  color: var(--wo-text-muted, #94a3b8);
}

.resource-page-container {
  min-height: 100vh;
}
</style>

