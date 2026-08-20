<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- Brand -->
        <div class="brand cursor-pointer" @click="goToHome">
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

        <!-- PM Navigation -->
        <nav class="main-nav">
          <router-link to="/pm/dashboard" class="nav-link" active-class="nav-link-active">
            Home
          </router-link>

          <router-link to="/pm/projects" class="nav-link" active-class="nav-link-active">
            Projects
          </router-link>

          <router-link to="/pm/tasks" class="nav-link" active-class="nav-link-active">
            Tasks
          </router-link>

          <router-link to="/pm/resources" class="nav-link" active-class="nav-link-active">
            Resources
          </router-link>

          <router-link to="/pm/schedule" class="nav-link" active-class="nav-link-active">
            Schedule
          </router-link>

          <router-link to="/pm/progress" class="nav-link" active-class="nav-link-active">
            Progress
          </router-link>

          <router-link to="/pm/reports" class="nav-link" active-class="nav-link-active">
            Reports
          </router-link>
        </nav>

        <!-- Header Actions -->
        <div class="header-actions">
          <div class="search-container">
            <q-input
              ref="searchRef"
              v-model="searchQuery"
              dense
              outlined
              placeholder="Search anything..."
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
              style="max-height: 400px; min-width: 320px; border-radius: 10px"
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
                      <q-item-label class="text-weight-medium text-caption">{{
                        p.name
                      }}</q-item-label>
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
                      <q-item-label class="text-weight-medium text-caption">{{
                        t.title
                      }}</q-item-label>
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
                      <q-item-label class="text-weight-medium text-caption">{{
                        r.name
                      }}</q-item-label>
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
                      <q-item-label class="text-weight-medium text-caption">{{
                        l.title
                      }}</q-item-label>
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

          <q-btn flat round dense icon="notifications_none" color="grey-7" class="header-icon-btn">
            <q-badge floating color="primary" rounded class="notification-badge"> 3 </q-badge>
            <q-menu anchor="bottom end" self="top end">
              <q-list style="min-width: 260px">
                <q-item-label header class="text-weight-bold">Notifications</q-item-label>
                <q-item clickable v-close-popup @click="goToRoute('/pm/projects')">
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="check_circle" color="positive" size="18px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-caption text-weight-medium"
                      >Website Redesign UI Phase</q-item-label
                    >
                    <q-item-label caption>Milestone completed on track</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToRoute('/pm/projects')">
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="assignment_ind" color="primary" size="18px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-caption text-weight-medium"
                      >New Task Assigned</q-item-label
                    >
                    <q-item-label caption
                      >Payment integration assigned to Team Resource</q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToRoute('/pm/projects')">
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="warning" color="warning" size="18px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-caption text-weight-medium"
                      >Sprint Review Approaching</q-item-label
                    >
                    <q-item-label caption>Due in 3 days</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <!-- Real authenticated user -->
          <div v-if="user" class="profile">
            <q-avatar size="34px" class="profile-avatar">
              <span class="profile-initial">
                {{ user.name.charAt(0).toUpperCase() }}
              </span>
            </q-avatar>

            <div class="profile-info">
              <div class="profile-name">
                {{ user.name }}
              </div>

              <div class="profile-role">
                {{ user.role === 'PROJECT_MANAGER' ? 'Project Manager' : 'Resource' }}
              </div>
            </div>

            <q-icon name="keyboard_arrow_down" size="18px" color="grey-6" />

            <q-menu>
              <q-list style="min-width: 180px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ user.name }}
                    </q-item-label>

                    <q-item-label caption>
                      {{ user.email }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>

                  <q-item-section> Logout </q-item-section>
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

const searchQuery = ref('');
const searchRef = ref<{ focus: () => void } | null>(null);

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const resources = ref<{ name: string; role: string; route: string }[]>([]);

const quickLinks = [
  { title: 'PM Dashboard', icon: 'dashboard', route: '/pm/dashboard' },
  { title: 'Projects Overview', icon: 'folder', route: '/pm/projects' },
  { title: 'My Work & Tasks', icon: 'task_alt', route: '/pm/tasks' },
  { title: 'Resource Workload', icon: 'groups', route: '/pm/resources' },
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
  void router.push('/pm/dashboard');
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
  min-width: 170px;
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
  color: var(--wo-text-main, #1d2433);
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

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-search {
  width: 230px;
}

.header-search :deep(.q-field__control) {
  min-height: 34px;
  height: 34px;
  border-color: var(--wo-border, #e4e7ec);
  border-radius: 9px;
  padding: 0 8px 0 10px;
  background: var(--wo-bg-input, #f9fafb);
  transition: all 0.2s ease;
}

.header-search :deep(.q-field__control:hover) {
  border-color: var(--wo-border, #d0d5dd);
  background: var(--wo-bg-card, #ffffff);
}

.header-search :deep(.q-field__native) {
  font-size: 12px;
  color: var(--wo-text-main, #344054);
}

.header-search :deep(.q-field__native::placeholder) {
  color: var(--wo-text-subtle, #98a2b3);
}

.header-search :deep(.q-field__prepend),
.header-search :deep(.q-field__append) {
  height: 34px;
}

.search-shortcut {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--wo-border, #e4e7ec);
  border-radius: 6px;
  color: var(--wo-text-subtle, #98a2b3);
  background: var(--wo-bg-tag, #ffffff);
  font-size: 10px;
  font-weight: 600;
}

.header-icon-btn {
  width: 34px;
  height: 34px;
}

.notification-badge {
  background: var(--wo-primary, #8b6fd8) !important;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
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
  overflow: hidden;
}

.profile-info {
  min-width: 95px;
}

.profile-name {
  font-size: 12px;
  line-height: 1.25;
  font-weight: 600;
  color: var(--wo-text-main, #1d2433);
}

.profile-role {
  margin-top: 1px;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 10px;
}

@media (max-width: 1200px) {
  .app-toolbar {
    padding: 0 20px;
    gap: 16px;
  }

  .nav-link {
    padding: 0 10px;
    font-size: 12px;
  }

  .header-search {
    width: 180px;
  }
}

@media (max-width: 950px) {
  .main-nav {
    display: none;
  }

  .profile-info {
    display: none;
  }
}
</style>
