<template>
  <q-layout view="lHh lpR lFf" class="main-layout-root">
    <!-- LEFT SIDEBAR WITH DUAL RAIL & EXPAND/SHRINK TOGGLE -->
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
              title="Quick New Item"
              @click="goToRoute('/pm/projects')"
            >
              <q-icon name="add" size="18px" />
            </button>

            <div class="rail-divider" />

            <!-- Core App Icons (Projects, Tasks, Resources, Schedule) -->
            <router-link
              to="/pm/projects"
              class="rail-icon-item"
              active-class="rail-item-active"
              title="Projects"
            >
              <div class="rail-icon-box bg-purple-soft">
                <q-icon name="folder" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Projects</q-tooltip>
            </router-link>

            <router-link
              to="/pm/tasks"
              class="rail-icon-item"
              active-class="rail-item-active"
              title="Tasks"
            >
              <div class="rail-icon-box bg-teal-soft">
                <q-icon name="task_alt" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Tasks</q-tooltip>
            </router-link>

            <router-link
              to="/pm/resources"
              class="rail-icon-item"
              active-class="rail-item-active"
              title="Resources"
            >
              <div class="rail-icon-box bg-orange-soft">
                <q-icon name="groups" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Resources</q-tooltip>
            </router-link>

            <router-link
              to="/pm/schedule"
              class="rail-icon-item"
              active-class="rail-item-active"
              title="Schedule"
            >
              <div class="rail-icon-box bg-blue-soft">
                <q-icon name="event" size="18px" />
              </div>
              <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Schedule</q-tooltip>
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

            <q-avatar size="32px" class="rail-avatar cursor-pointer" @click="handleLogout">
              <span>{{ user ? user.name.charAt(0).toUpperCase() : 'P' }}</span>
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
              <div class="row items-center gap-xs cursor-pointer" @click="goToHome">
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
                <!-- 1. Projects -->
                <router-link
                  to="/pm/projects"
                  class="menu-nav-link"
                  active-class="menu-nav-link-active"
                >
                  <q-icon name="folder" size="17px" class="q-mr-sm text-purple" />
                  <span class="nav-text font-bold">Projects</span>
                  <span class="active-indicator-bar" />
                </router-link>

                <!-- 2. Tasks -->
                <router-link
                  to="/pm/tasks"
                  class="menu-nav-link"
                  active-class="menu-nav-link-active"
                >
                  <q-icon name="task_alt" size="17px" class="q-mr-sm text-teal" />
                  <span class="nav-text">Tasks</span>
                  <q-badge color="grey-3" text-color="dark" class="count-pill">
                    {{ tasks.length || '12' }}
                  </q-badge>
                </router-link>

                <!-- 3. Resources -->
                <router-link
                  to="/pm/resources"
                  class="menu-nav-link"
                  active-class="menu-nav-link-active"
                >
                  <q-icon name="groups" size="17px" class="q-mr-sm text-orange" />
                  <span class="nav-text">Resources</span>
                </router-link>

                <!-- 4. Schedule -->
                <router-link
                  to="/pm/schedule"
                  class="menu-nav-link"
                  active-class="menu-nav-link-active"
                >
                  <q-icon name="event" size="17px" class="q-mr-sm text-blue" />
                  <span class="nav-text">Schedule</span>
                </router-link>
              </nav>
            </div>

            <!-- Resources / Workspaces Section -->
            <div class="menu-category-block q-mt-md">
              <div class="row items-center justify-between no-wrap">
                <span class="category-header-label">WORKSPACES</span>
                <q-btn flat round dense icon="add" size="xs" color="grey-6" title="Add Workspace" />
              </div>

              <nav class="category-nav-list q-mt-xs">
                <div class="menu-sub-link cursor-pointer" @click="goToRoute('/pm/projects')">
                  <q-icon name="folder_open" size="15px" class="text-teal q-mr-sm" />
                  <span>Sprint Deliverables</span>
                </div>
                <div class="menu-sub-link cursor-pointer" @click="goToRoute('/pm/projects')">
                  <q-icon name="folder_open" size="15px" class="text-purple q-mr-sm" />
                  <span>Design Systems</span>
                </div>
                <div class="menu-sub-link cursor-pointer" @click="goToRoute('/pm/projects')">
                  <q-icon name="folder_open" size="15px" class="text-orange q-mr-sm" />
                  <span>Brand Guidelines</span>
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

                <div class="system-item row items-center gap-xs cursor-pointer" @click="goToRoute('/pm/projects')">
                  <q-icon name="settings" size="16px" color="grey-7" />
                  <span>Settings</span>
                </div>

                <div class="system-item row items-center gap-xs cursor-pointer" @click="goToRoute('/pm/projects')">
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
                  <span>{{ user.name.charAt(0).toUpperCase() }}</span>
                </q-avatar>
                <div class="user-text-wrap">
                  <div class="user-name-line" :title="user.name">{{ user.name }}</div>
                  <div class="user-email-line">{{ user.email || 'pm@taskflow.com' }}</div>
                </div>
              </div>

              <q-btn flat round dense icon="unfold_more" size="sm" color="grey-6">
                <q-menu auto-close>
                  <q-list style="min-width: 170px">
                    <q-item clickable @click="handleLogout">
                      <q-item-section avatar>
                        <q-icon name="logout" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative font-bold">Logout</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- TOP HEADER -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- Left: Mobile / Sidebar Expand Toggle -->
        <div class="toolbar-left-area row items-center gap-sm">
          <q-btn
            flat
            round
            dense
            :icon="isMini ? 'menu_open' : 'menu'"
            color="grey-8"
            aria-label="Toggle Sidebar"
            @click="toggleMini"
          >
            <q-tooltip>{{ isMini ? 'Expand Sidebar' : 'Collapse Sidebar' }}</q-tooltip>
          </q-btn>
        </div>

        <!-- Center / Global Search -->
        <div class="search-container">
          <q-input
            ref="searchRef"
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search Task, Meeting, Projects..."
            class="header-search"
            @focus="loadSearchData"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>

            <template #append>
              <q-icon
                v-if="searchQuery"
                name="close"
                size="14px"
                class="cursor-pointer"
                @click="searchQuery = ''"
              />
              <span v-else class="search-shortcut">⌘K</span>
            </template>
          </q-input>

          <!-- Search Results Dropdown -->
          <q-menu
            v-if="searchQuery.trim().length > 0"
            :model-value="true"
            fit
            no-focus
            no-parent-event
            anchor="bottom start"
            self="top start"
            :offset="[0, 6]"
            style="max-height: 400px; min-width: 320px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12)"
          >
            <q-list dense separator>
              <!-- Projects -->
              <template v-if="filteredResults.projects.length > 0">
                <q-item-label header class="text-weight-bold text-caption text-primary q-py-xs">
                  PROJECTS
                </q-item-label>
                <q-item
                  v-for="p in filteredResults.projects"
                  :key="`proj-${p.project_id}`"
                  clickable
                  v-close-popup
                  @click="goToRoute(`/pm/projects/${p.project_id}`)"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="folder" color="primary" size="16px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-caption">{{ p.name }}</q-item-label>
                    <q-item-label caption>{{ p.status }} • {{ p.progress || 0 }}%</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <!-- Tasks -->
              <template v-if="filteredResults.tasks.length > 0">
                <q-item-label header class="text-weight-bold text-caption text-teal q-py-xs">
                  TASKS
                </q-item-label>
                <q-item
                  v-for="t in filteredResults.tasks"
                  :key="`task-${t.task_id}`"
                  clickable
                  v-close-popup
                  @click="goToRoute(`/pm/projects/${t.project_id}`)"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="task_alt" color="teal" size="16px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-caption">{{ t.title }}</q-item-label>
                    <q-item-label caption>{{ t.status }} • {{ t.priority }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <!-- Resources -->
              <template v-if="filteredResults.resources.length > 0">
                <q-item-label header class="text-weight-bold text-caption text-orange q-py-xs">
                  TEAM & RESOURCES
                </q-item-label>
                <q-item
                  v-for="r in filteredResults.resources"
                  :key="r.name"
                  clickable
                  v-close-popup
                  @click="goToRoute(r.route)"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="person" color="orange" size="16px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-caption">{{ r.name }}</q-item-label>
                    <q-item-label caption>{{ r.role }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <!-- Quick Navigation -->
              <template v-if="filteredResults.links.length > 0">
                <q-item-label header class="text-weight-bold text-caption text-grey-7 q-py-xs">
                  QUICK NAVIGATION
                </q-item-label>
                <q-item
                  v-for="l in filteredResults.links"
                  :key="l.title"
                  clickable
                  v-close-popup
                  @click="goToRoute(l.route)"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon :name="l.icon" color="grey-7" size="16px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-caption">{{ l.title }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <!-- No matches -->
              <div
                v-if="filteredResults.total === 0"
                class="text-caption text-grey-6 text-center q-pa-md"
              >
                No matches found for "{{ searchQuery }}"
              </div>
            </q-list>
          </q-menu>
        </div>

        <!-- Right Header Actions -->
        <div class="header-actions row items-center q-gutter-sm">
          <!-- Dark/Light Mode -->
          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
            :color="$q.dark.isActive ? 'amber-5' : 'grey-7'"
            class="header-icon-btn"
            :aria-label="$q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleDarkMode"
          >
            <q-tooltip>{{
              $q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'
            }}</q-tooltip>
          </q-btn>

          <!-- Notifications -->
          <q-btn flat round dense icon="notifications_none" color="grey-7" class="header-icon-btn">
            <q-badge color="primary" floating rounded />
            <q-tooltip>Notifications</q-tooltip>
          </q-btn>

          <!-- User Profile Dropdown -->
          <div v-if="user" class="profile cursor-pointer">
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

            <q-menu>
              <q-list style="min-width: 190px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ user.name }}</q-item-label>
                    <q-item-label caption>{{ user.email }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="goToRoute('/pm/projects')">
                  <q-item-section avatar>
                    <q-icon name="folder" color="primary" />
                  </q-item-section>
                  <q-item-section>Projects Overview</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative font-weight-bold">Logout</q-item-section>
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  type Project,
  type Task,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const leftDrawerOpen = ref(true);
const isMini = ref(false);
const searchQuery = ref('');
const searchRef = ref<{ focus: () => void } | null>(null);

function toggleMini() {
  isMini.value = !isMini.value;
}

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const resources = ref<{ name: string; role: string; route: string }[]>([]);

const quickLinks = [
  { title: 'Projects Overview', icon: 'folder', route: '/pm/projects' },
  { title: 'My Work & Tasks', icon: 'task_alt', route: '/pm/tasks' },
  { title: 'Resource Workload', icon: 'groups', route: '/pm/resources' },
  { title: 'Project Schedule', icon: 'event', route: '/pm/schedule' },
];

async function loadSearchData() {
  try {
    if (projects.value.length === 0) {
      projects.value = await getProjectsApi();
    }
    if (tasks.value.length === 0) {
      tasks.value = await getTasksApi();
    }
    if (resources.value.length === 0) {
      const dbResources = await getResourcesApi();
      resources.value = dbResources.map((r) => ({
        name: r.name,
        role: r.role || 'Team Resource',
        route: `/pm/resources/${r.user_id}`,
      }));
    }
  } catch {
    // Keep local fallback state if offline
  }
}

const filteredResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    return { projects: [], tasks: [], resources: [], links: [], total: 0 };
  }

  const matchedProjects = projects.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)),
  );

  const matchedTasks = tasks.value.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)),
  );

  const matchedResources = resources.value.filter(
    (r) => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q),
  );

  const matchedLinks = quickLinks.filter((l) => l.title.toLowerCase().includes(q));

  const total =
    matchedProjects.length + matchedTasks.length + matchedResources.length + matchedLinks.length;

  return {
    projects: matchedProjects.slice(0, 4),
    tasks: matchedTasks.slice(0, 4),
    resources: matchedResources.slice(0, 4),
    links: matchedLinks.slice(0, 4),
    total,
  };
});

function goToRoute(path: string) {
  searchQuery.value = '';
  void router.push(path);
}

function goToHome() {
  void router.push('/pm/projects');
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchRef.value?.focus();
  }
}

const user = computed(() => authStore.user);

function toggleDarkMode() {
  themeStore.toggleDarkMode();
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  themeStore.initTheme();
  void loadSearchData();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleLogout() {
  authStore.clearAuth();
  localStorage.removeItem('user');
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
  &.bg-orange-soft {
    background: #fff7ed;
    color: #f59e0b;
  }
  &.bg-blue-soft {
    background: #eff6ff;
    color: #3b82f6;
  }
  &.bg-indigo-soft {
    background: #f8fafc;
    color: #64748b;
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

.count-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 9999px;
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
  color: #121620;
  line-height: 1.2;
}

.profile-role {
  font-size: 10px;
  color: #64748b;
}

.app-page-container {
  min-height: 100vh;
}
</style>
