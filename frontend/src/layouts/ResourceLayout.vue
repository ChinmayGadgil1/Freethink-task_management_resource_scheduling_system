<template>
  <q-layout view="lHh lpR lFf" class="main-layout-root">
    <!-- REUSABLE DUAL-RAIL SIDEBAR -->
    <AppSidebar
      v-model="leftDrawerOpen"
      v-model:is-mini="isMini"
      home-route="/app/resource-dashboard"
      help-route="/app/resource-dashboard/help"
      quick-action-route="/app/resource-dashboard/task-details"
      quick-action-title="Quick Action"
      :nav-items="resourceNavItems"
    />

    <!-- TOP HEADER -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <div class="row items-center gap-sm">
          <q-btn
            flat
            dense
            round
            :icon="isMini ? 'menu_open' : 'menu'"
            aria-label="Toggle Sidebar"
            class="drawer-toggle-btn"
            @click="toggleMini"
          >
            <q-tooltip>{{ isMini ? 'Expand Sidebar' : 'Collapse Sidebar' }}</q-tooltip>
          </q-btn>
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
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            :color="$q.dark.isActive ? 'amber-5' : 'grey-7'"
            class="header-icon-btn"
            @click="toggleDarkMode"
            :aria-label="$q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <q-tooltip>{{
              $q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'
            }}</q-tooltip>
          </q-btn>

          <div v-if="user" class="profile row items-center gap-xs cursor-pointer">
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
                <q-item clickable v-close-popup @click="openResetPasswordDialog">
                  <q-item-section avatar>
                    <q-icon name="lock_reset" color="primary" />
                  </q-item-section>
                  <q-item-section>Reset Password</q-item-section>
                </q-item>
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
    <!-- Reset Password Dialog -->
    <q-dialog v-model="resetPasswordDialog" persistent>
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Reset Password</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit.prevent="handleResetPasswordSubmit" class="q-gutter-md">
            <q-input
              v-model="resetForm.oldPassword"
              :type="showOldPassword ? 'text' : 'password'"
              label="Current Password"
              outlined
              dense
              lazy-rules
              :rules="[val => !!val || 'Current password is required']"
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  :label="showOldPassword ? 'Hide' : 'Show'"
                  @click="showOldPassword = !showOldPassword"
                />
              </template>
            </q-input>
            <q-input
              v-model="resetForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              label="New Password"
              outlined
              dense
              lazy-rules
              :rules="[
                val => !!val || 'New password is required',
                val => val.length >= 6 || 'New password must be at least 6 characters',
                val => /^[A-Z]/.test(val) || 'New password must start with a capital letter',
                val => /[0-9]/.test(val) || 'New password must contain at least one number',
                val => /[^A-Za-z0-9]/.test(val) || 'New password must contain at least one special character'
              ]"
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  :label="showNewPassword ? 'Hide' : 'Show'"
                  @click="showNewPassword = !showNewPassword"
                />
              </template>
            </q-input>
            <q-input
              v-model="resetForm.confirmNewPassword"
              :type="showConfirmNewPassword ? 'text' : 'password'"
              label="Confirm New Password"
              outlined
              dense
              lazy-rules
              :rules="[
                val => !!val || 'Please confirm your new password',
                val => val === resetForm.newPassword || 'New passwords do not match'
              ]"
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  :label="showConfirmNewPassword ? 'Hide' : 'Show'"
                  @click="showConfirmNewPassword = !showConfirmNewPassword"
                />
              </template>
            </q-input>

            <div class="row justify-end q-mt-md">
              <q-btn label="Cancel" flat v-close-popup class="q-mr-sm" />
              <q-btn label="Reset Password" color="primary" type="submit" :loading="resetLoading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import AppSidebar, { type SidebarNavItem } from '@/components/layout/AppSidebar.vue';
import { useAuthStore } from '@/stores/auth';
import { useSessionStore } from '@/stores/session';
import { useThemeStore } from '@/stores/theme';
import { resetPasswordApi } from '@/services/api';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const sessionStore = useSessionStore();
const themeStore = useThemeStore();
const searchQuery = ref('');
const leftDrawerOpen = ref(true);
const isMini = ref(false);

const resourceNavItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    to: '/app/resource-dashboard',
    icon: 'space_dashboard',
    colorClass: 'text-purple',
    bgClass: 'bg-purple-soft',
  },
  {
    title: 'Task Specs',
    to: '/app/resource-dashboard/task-details',
    icon: 'assignment',
    colorClass: 'text-teal',
    bgClass: 'bg-teal-soft',
  },
  {
    title: 'Schedule',
    to: '/app/resource-dashboard/schedule',
    icon: 'calendar_month',
    colorClass: 'text-blue',
    bgClass: 'bg-blue-soft',
  },
  {
    title: 'Progress',
    to: '/app/resource-dashboard/progress',
    icon: 'insights',
    colorClass: 'text-green',
    bgClass: 'bg-green-soft',
  },
  {
    title: 'Calendar',
    to: '/app/resource-dashboard/calendar',
    icon: 'event_available',
    colorClass: 'text-amber-9',
    bgClass: 'bg-amber-1',
  },
];

function toggleMini() {
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  } else {
    isMini.value = !isMini.value;
  }
}

function toggleDarkMode() {
  themeStore.toggleDarkMode();
}

onMounted(() => {
  themeStore.initTheme();
  if (authStore.user?.role === 'RESOURCE') {
    void sessionStore.fetchActiveSession();
  }
});

const resetPasswordDialog = ref(false);
const resetLoading = ref(false);
const resetForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmNewPassword = ref(false);

function openResetPasswordDialog() {
  resetForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };
  showOldPassword.value = false;
  showNewPassword.value = false;
  showConfirmNewPassword.value = false;
  resetPasswordDialog.value = true;
}

async function handleResetPasswordSubmit() {
  if (!authStore.user?.email) return;
  resetLoading.value = true;
  try {
    await resetPasswordApi({
      email: authStore.user.email,
      oldPassword: resetForm.value.oldPassword,
      newPassword: resetForm.value.newPassword,
    });
    $q.notify({
      type: 'positive',
      message: 'Password reset successfully',
    });
    resetPasswordDialog.value = false;
  } catch (error) {
    const err = error as Error;
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to reset password',
    });
  } finally {
    resetLoading.value = false;
  }
}

const user = computed(() => authStore.user);
const userInitial = computed(() => (user.value?.name || 'R').charAt(0).toUpperCase());

function logout() {
  if (sessionStore.hasActiveSession) {
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
        void router.push(`/app/resource-dashboard/task-details?taskId=${sessionStore.activeTaskId}`);
      }
    });
    return;
  }

  authStore.clearAuth();
  sessionStore.clearSession();
  localStorage.removeItem('user');
  sessionStorage.removeItem('flashMessage');
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
  span {
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
