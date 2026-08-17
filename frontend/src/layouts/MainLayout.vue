<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- Brand -->
        <div class="brand">
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
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search anything..."
            class="header-search"
            bg-color="white"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>

            <template #append>
              <span class="search-shortcut">⌘K</span>
            </template>
          </q-input>

          <q-btn flat round dense icon="light_mode" color="grey-7" class="header-icon-btn" />

          <q-btn flat round dense icon="notifications_none" color="grey-7" class="header-icon-btn">
            <q-badge floating color="primary" rounded class="notification-badge"> 6 </q-badge>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();

const searchQuery = ref('');

interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
}

const user = ref<User | null>(null);

onMounted(() => {
  const storedUser = localStorage.getItem('user');

  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (error) {
      console.error('Failed to parse stored user:', error);
    }
  }
});

function handleLogout() {
  localStorage.removeItem('user');

  $q.notify({
    type: 'info',
    message: 'You have been logged out',
  });

  void router.push('/');
}
</script>

<style scoped lang="scss">
.app-header {
  background: #ffffff;
  color: #1d2433;
  border-bottom: 1px solid #eaecef;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
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
  background: #f4f0fd;
  border-radius: 9px;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #1d2433;
}

.brand-spark {
  color: #8b6fd8;
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
  color: #475467;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.nav-link:hover {
  color: #1d2433;
}

.nav-link-active {
  color: #1d2433;
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
  background: #8b6fd8;
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
  border-color: #e4e7ec;
  border-radius: 9px;
  padding: 0 8px 0 10px;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.header-search :deep(.q-field__control:hover) {
  border-color: #d0d5dd;
  background: #ffffff;
}

.header-search :deep(.q-field__native) {
  font-size: 12px;
  color: #344054;
}

.header-search :deep(.q-field__native::placeholder) {
  color: #98a2b3;
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
  border: 1px solid #e4e7ec;
  border-radius: 6px;
  color: #98a2b3;
  background: #ffffff;
  font-size: 10px;
  font-weight: 600;
}

.header-icon-btn {
  width: 34px;
  height: 34px;
}

.notification-badge {
  background: #8b6fd8 !important;
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
  border: 2px solid #f2f4f7;
  overflow: hidden;
}

.profile-info {
  min-width: 95px;
}

.profile-name {
  font-size: 12px;
  line-height: 1.25;
  font-weight: 600;
  color: #1d2433;
}

.profile-role {
  margin-top: 1px;
  color: #98a2b3;
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
