<template>
  <q-layout view="lHh lpR lFf" class="main-layout-root">
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

            <q-menu>
              <q-list style="min-width: 190px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ user.name }}</q-item-label>
                    <q-item-label caption>{{ user.email }}</q-item-label>
                  </q-item-section>
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
import AppSidebar, { type SidebarNavItem } from '@/components/layout/AppSidebar.vue';
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
    count: tasks.value.length || '12',
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
]);

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
}
</style>
