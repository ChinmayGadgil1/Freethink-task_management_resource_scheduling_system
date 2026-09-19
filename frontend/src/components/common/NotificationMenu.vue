<template>
  <div class="notification-menu-wrapper">
    <!-- Notification Bell Icon Button -->
    <q-btn
      flat
      round
      dense
      icon="notifications"
      :color="
        $q.dark.isActive
          ? notificationStore.hasUnread
            ? 'purple-2'
            : 'grey-4'
          : notificationStore.hasUnread
            ? 'primary'
            : 'grey-7'
      "
      class="header-icon-btn notification-trigger-btn"
      aria-label="Notifications"
    >
      <!-- Unread Count Badge -->
      <q-badge
        v-if="notificationStore.unreadCount > 0"
        floating
        rounded
        color="negative"
        class="notification-badge"
      >
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </q-badge>

      <q-tooltip
        >{{ notificationStore.unreadCount }} unread notification{{
          notificationStore.unreadCount === 1 ? '' : 's'
        }}</q-tooltip
      >

      <!-- Dropdown Menu -->
      <q-menu
        v-model="menuOpen"
        anchor="bottom right"
        self="top right"
        :offset="[0, 10]"
        :dark="$q.dark.isActive"
        class="notification-dropdown shadow-10 column no-wrap"
        style="
          width: 490px;
          max-width: calc(100vw - 20px);
          max-height: calc(100vh - 90px);
          border-radius: 16px;
          overflow: hidden;
        "
      >
        <!-- Header -->
        <div
          class="q-pa-md row items-center justify-between border-bottom-subtle col-auto"
          style="flex-shrink: 0"
        >
          <div class="row items-center gap-xs">
            <span class="text-subtitle1 text-weight-bold">Notifications</span>
            <q-badge
              v-if="notificationStore.unreadCount > 0"
              color="negative"
              rounded
              class="q-ml-xs text-weight-bold"
            >
              {{ notificationStore.unreadCount }} new
            </q-badge>
          </div>

          <q-btn
            v-if="notificationStore.unreadCount > 0"
            flat
            dense
            no-caps
            size="sm"
            color="primary"
            label="Mark all read"
            icon="done_all"
            class="text-weight-medium"
            @click="markAllAsRead"
          />
        </div>

        <!-- Filter Tabs for Early Completions & Delays -->
        <div class="border-bottom-subtle col-auto" style="flex-shrink: 0">
          <q-tabs
            v-model="filterTab"
            dense
            no-caps
            class="text-grey-6 notification-tabs"
            active-color="primary"
            indicator-color="primary"
            align="left"
          >
            <q-tab name="all" label="All" />
            <q-tab name="tasks">
              <div class="row items-center no-wrap q-gutter-x-xs">
                <span>Tasks</span>
                <q-badge v-if="taskCount > 0" color="purple-8" rounded size="xs">
                  {{ taskCount }}
                </q-badge>
              </div>
            </q-tab>
            <q-tab name="alerts">
              <div class="row items-center no-wrap q-gutter-x-xs">
                <span>Alerts</span>
                <q-badge v-if="alertCount > 0" color="red-8" rounded size="xs">
                  {{ alertCount }}
                </q-badge>
              </div>
            </q-tab>
            <q-tab name="delays">
              <div class="row items-center no-wrap q-gutter-x-xs">
                <span>Delays</span>
                <q-badge v-if="delayCount > 0" color="orange-9" rounded size="xs">
                  {{ delayCount }}
                </q-badge>
              </div>
            </q-tab>
            <q-tab name="early">
              <div class="row items-center no-wrap q-gutter-x-xs">
                <span>Early Done</span>
                <q-badge v-if="earlyCount > 0" color="positive" rounded size="xs">
                  {{ earlyCount }}
                </q-badge>
              </div>
            </q-tab>
            <q-tab name="leaves">
              <div class="row items-center no-wrap q-gutter-x-xs">
                <span>Leaves</span>
                <q-badge v-if="leaveCount > 0" color="primary" rounded size="xs">
                  {{ leaveCount }}
                </q-badge>
              </div>
            </q-tab>
            <q-tab name="unread" label="Unread" />
          </q-tabs>
        </div>

        <!-- Notifications List -->
        <div
          class="notification-scroll-container col"
          :class="$q.dark.isActive ? 'dark-scroll' : 'light-scroll'"
        >
          <q-list v-if="filteredNotifications.length > 0" separator class="q-pa-none">
            <q-item
              v-for="item in filteredNotifications"
              :key="item.notification_id"
              clickable
              v-ripple
              :class="{
                'unread-item': !item.is_read,
                'bg-subtle-hover': true,
              }"
              class="q-py-md q-px-md notification-item"
              @click="handleNotificationClick(item)"
            >
              <!-- Icon Avatar -->
              <q-item-section avatar top style="min-width: 36px" class="q-pr-xs">
                <q-avatar
                  size="36px"
                  :color="getTypeMeta(item.type).bgColor"
                  :text-color="getTypeMeta(item.type).textColor"
                  :icon="getTypeMeta(item.type).icon"
                  class="notification-avatar"
                />
              </q-item-section>

              <!-- Content -->
              <q-item-section top>
                <!-- Top Row: Badge & Timestamp -->
                <div class="row items-center justify-between no-wrap q-mb-xs">
                  <q-badge
                    dense
                    rounded
                    :color="getBadgeColor(item.type, $q.dark.isActive)"
                    :text-color="getBadgeTextColor(item.type, $q.dark.isActive)"
                    class="text-weight-bolder"
                    style="font-size: 9px; padding: 2px 7px; letter-spacing: 0.03em"
                  >
                    {{ getBadgeLabel(item.type) }}
                  </q-badge>

                  <div class="row items-center no-wrap q-gutter-x-xs">
                    <span class="text-caption text-grey-5 no-wrap" style="font-size: 11px">
                      {{ formatTimeAgo(item.created_at) }}
                    </span>
                    <div v-if="!item.is_read" class="unread-dot" title="Unread" />
                  </div>
                </div>

                <!-- Full Title (No truncation) -->
                <div
                  class="notification-title text-body2 q-mb-xs"
                  :class="
                    !item.is_read ? 'text-weight-bold text-main' : 'text-weight-medium text-grey-7'
                  "
                >
                  {{ item.title }}
                </div>

                <!-- Full Message (No line-clamp) -->
                <div class="text-caption notification-message">
                  {{ formatNotificationMessage(item.message) }}
                </div>
              </q-item-section>

              <!-- Quick Action buttons on right -->
              <q-item-section
                side
                top
                class="column items-end justify-center q-pl-xs"
                style="min-width: 28px"
              >
                <div class="column items-center q-gutter-y-xs item-actions">
                  <q-btn
                    v-if="!item.is_read"
                    flat
                    round
                    dense
                    size="xs"
                    icon="done"
                    color="primary"
                    class="action-btn"
                    title="Mark as read"
                    @click.stop="notificationStore.markAsRead(item.notification_id)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    icon="close"
                    color="grey-6"
                    class="action-btn"
                    title="Dismiss"
                    @click.stop="notificationStore.deleteNotification(item.notification_id)"
                  />
                </div>
              </q-item-section>
            </q-item>

            <!-- Bottom spacing so the last notification has comfortable breathing room above the footer -->
            <div style="height: 12px" />
          </q-list>

          <!-- Empty State -->
          <div
            v-else
            class="column items-center justify-center text-center q-pa-xl text-grey-5"
            style="min-height: 240px"
          >
            <q-icon
              :name="filterTab === 'delays' ? 'check_circle' : 'notifications_none'"
              size="48px"
              :color="filterTab === 'delays' ? 'positive' : 'grey-5'"
              class="q-mb-sm"
            />
            <div class="text-subtitle2 text-weight-bold text-grey-7">
              {{
                filterTab === 'delays'
                  ? 'No Delay Risks Detected'
                  : filterTab === 'early'
                    ? 'No Early Completions'
                    : filterTab === 'leaves'
                      ? 'No Leave Notifications'
                      : 'All Clear!'
              }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">
              {{
                filterTab === 'delays'
                  ? 'All ongoing tasks are currently on track.'
                  : filterTab === 'early'
                    ? 'No early completions logged yet.'
                    : filterTab === 'leaves'
                      ? 'No leave requests or leave status updates.'
                      : 'No task warnings or leave alerts at this time.'
              }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="q-py-xs q-px-md row items-center justify-between border-top-subtle text-caption text-grey-5 bg-subtle-footer col-auto"
          style="flex-shrink: 0"
        >
          <span
            >{{ filteredNotifications.length }} notification{{
              filteredNotifications.length === 1 ? '' : 's'
            }}</span
          >
          <span v-if="notificationStore.unreadCount > 0"
            >{{ notificationStore.unreadCount }} unread</span
          >
          <span v-else class="text-positive">All caught up</span>
        </div>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notification';
import type { NotificationItem } from '@/services/api';

const router = useRouter();
const notificationStore = useNotificationStore();

const menuOpen = ref(false);
const filterTab = ref<'all' | 'tasks' | 'alerts' | 'delays' | 'early' | 'leaves' | 'unread'>('all');

onMounted(() => {
  notificationStore.startPolling();
});

onUnmounted(() => {
  notificationStore.stopPolling();
});

const taskCount = computed(() => {
  return notificationStore.notifications.filter(
    (n) =>
      (n.type === 'TASK_VERIFICATION' || n.type === 'TASK_CREATED' || n.type === 'TASK_ASSIGNED') &&
      !n.is_read,
  ).length;
});

const alertCount = computed(() => {
  return notificationStore.notifications.filter((n) => n.type === 'EFFORT_ALERT' && !n.is_read)
    .length;
});

const delayCount = computed(() => {
  return notificationStore.notifications.filter((n) => n.type === 'POSSIBLE_DELAY' && !n.is_read)
    .length;
});

const earlyCount = computed(() => {
  return notificationStore.notifications.filter((n) => n.type === 'EARLY_COMPLETION' && !n.is_read)
    .length;
});

const leaveCount = computed(() => {
  return notificationStore.notifications.filter((n) => n.type.startsWith('LEAVE_') && !n.is_read)
    .length;
});

const filteredNotifications = computed(() => {
  if (filterTab.value === 'tasks') {
    return notificationStore.notifications.filter(
      (n) =>
        n.type === 'TASK_VERIFICATION' || n.type === 'TASK_CREATED' || n.type === 'TASK_ASSIGNED',
    );
  }
  if (filterTab.value === 'alerts') {
    return notificationStore.notifications.filter((n) => n.type === 'EFFORT_ALERT');
  }
  if (filterTab.value === 'delays') {
    return notificationStore.notifications.filter((n) => n.type === 'POSSIBLE_DELAY');
  }
  if (filterTab.value === 'early') {
    return notificationStore.notifications.filter((n) => n.type === 'EARLY_COMPLETION');
  }
  if (filterTab.value === 'leaves') {
    return notificationStore.notifications.filter((n) => n.type.startsWith('LEAVE_'));
  }
  if (filterTab.value === 'unread') {
    return notificationStore.unreadNotifications;
  }
  return notificationStore.notifications;
});

function markAllAsRead() {
  void notificationStore.markAllAsRead();
}

function handleNotificationClick(item: NotificationItem) {
  if (!item.is_read) {
    void notificationStore.markAsRead(item.notification_id);
  }
  if (item.link) {
    menuOpen.value = false;
    void router.push(item.link);
  }
}

function formatNotificationMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace('Please review and respond.', 'Please review.')
    .replace(' and reviewed', '');
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface TypeMeta {
  icon: string;
  bgColor: string;
  textColor: string;
}

function getTypeMeta(type: string): TypeMeta {
  if (type === 'TASK_VERIFICATION') {
    return {
      icon: 'verified',
      bgColor: 'purple-1',
      textColor: 'purple-8',
    };
  }
  if (type === 'TASK_CREATED') {
    return {
      icon: 'playlist_add_check',
      bgColor: 'purple-1',
      textColor: 'purple-8',
    };
  }
  if (type === 'TASK_ASSIGNED') {
    return {
      icon: 'assignment_ind',
      bgColor: 'blue-1',
      textColor: 'blue-8',
    };
  }
  if (type === 'EARLY_COMPLETION') {
    return {
      icon: 'check_circle',
      bgColor: 'green-1',
      textColor: 'green-8',
    };
  }
  if (type === 'LEAVE_APPROVED') {
    return {
      icon: 'event_available',
      bgColor: 'green-1',
      textColor: 'green-8',
    };
  }
  if (type === 'LEAVE_REJECTED') {
    return {
      icon: 'event_busy',
      bgColor: 'red-1',
      textColor: 'red-8',
    };
  }
  if (type === 'LEAVE_REQUESTED') {
    return {
      icon: 'event_note',
      bgColor: 'blue-1',
      textColor: 'blue-8',
    };
  }
  if (type === 'EFFORT_ALERT') {
    return {
      icon: 'error_outline',
      bgColor: 'red-1',
      textColor: 'red-9',
    };
  }
  // POSSIBLE_DELAY
  return {
    icon: 'warning',
    bgColor: 'orange-1',
    textColor: 'orange-9',
  };
}

function getBadgeLabel(type: string): string {
  switch (type) {
    case 'TASK_VERIFICATION':
      return 'VERIFICATION REQUEST';
    case 'TASK_CREATED':
      return 'SELF ASSIGNED';
    case 'TASK_ASSIGNED':
      return 'TASK ASSIGNED';
    case 'EARLY_COMPLETION':
      return 'EARLY COMPLETION';
    case 'EFFORT_ALERT':
      return 'ALERT';
    case 'POSSIBLE_DELAY':
      return 'POSSIBLE DELAY';
    case 'LEAVE_REQUESTED':
      return 'LEAVE REQUEST';
    case 'LEAVE_APPROVED':
      return 'LEAVE APPROVED';
    case 'LEAVE_REJECTED':
      return 'LEAVE REJECTED';
    default:
      return type.replace(/_/g, ' ');
  }
}

function getBadgeColor(type: string, isDark: boolean): string {
  switch (type) {
    case 'TASK_VERIFICATION':
    case 'TASK_CREATED':
      return isDark ? 'purple-10' : 'purple-1';
    case 'TASK_ASSIGNED':
      return isDark ? 'blue-10' : 'blue-1';
    case 'EARLY_COMPLETION':
    case 'LEAVE_APPROVED':
      return isDark ? 'green-10' : 'green-1';
    case 'EFFORT_ALERT':
    case 'LEAVE_REJECTED':
      return isDark ? 'red-10' : 'red-1';
    case 'LEAVE_REQUESTED':
      return isDark ? 'blue-10' : 'blue-1';
    case 'POSSIBLE_DELAY':
    default:
      return isDark ? 'orange-10' : 'orange-1';
  }
}

function getBadgeTextColor(type: string, isDark: boolean): string {
  switch (type) {
    case 'TASK_VERIFICATION':
    case 'TASK_CREATED':
      return isDark ? 'purple-2' : 'purple-9';
    case 'TASK_ASSIGNED':
      return isDark ? 'blue-3' : 'blue-9';
    case 'EARLY_COMPLETION':
    case 'LEAVE_APPROVED':
      return isDark ? 'green-3' : 'green-9';
    case 'EFFORT_ALERT':
    case 'LEAVE_REJECTED':
      return isDark ? 'red-3' : 'red-9';
    case 'LEAVE_REQUESTED':
      return isDark ? 'blue-3' : 'blue-9';
    case 'POSSIBLE_DELAY':
    default:
      return isDark ? 'orange-3' : 'orange-10';
  }
}
</script>

<style scoped lang="scss">
.notification-menu-wrapper {
  display: inline-flex;
  align-items: center;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
}

.notification-badge {
  font-size: 10px;
  padding: 2px 5px;
  font-weight: 700;
  top: 2px;
  right: 2px;
}

.border-bottom-subtle {
  border-bottom: 1px solid var(--wo-border, #edf0f5);
}

body.body--dark .border-bottom-subtle {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.notification-dropdown {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
}

body.body--dark .notification-dropdown {
  background: #181f2c;
  border-color: rgba(255, 255, 255, 0.1);
}

.notification-item {
  transition: background 0.15s ease;
  position: relative;

  &:hover {
    background: rgba(139, 111, 216, 0.05);

    .item-actions {
      opacity: 1;
    }
  }

  &.unread-item {
    background: rgba(139, 111, 216, 0.04);
  }
}

body.body--dark .notification-item.unread-item {
  background: rgba(139, 111, 216, 0.1);
}

.notification-title {
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.notification-message {
  white-space: normal;
  word-break: break-word;
  line-height: 1.45;
  color: #64748b;
}

body.body--dark .notification-message {
  color: #94a3b8;
}

.border-top-subtle {
  border-top: 1px solid var(--wo-border, #edf0f5);
}

body.body--dark .border-top-subtle {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.bg-subtle-footer {
  background: rgba(0, 0, 0, 0.02);
}

body.body--dark .bg-subtle-footer {
  background: rgba(255, 255, 255, 0.02);
}

.notification-tabs {
  :deep(.q-tab) {
    padding: 0 8px;
    min-height: 38px;
    font-size: 12px;
  }
}

.notification-scroll-container {
  max-height: min(420px, calc(100vh - 230px));
  min-height: 140px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 111, 216, 0.4) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 111, 216, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(139, 111, 216, 0.6);
    }
  }
}

body.body--dark .notification-scroll-container {
  scrollbar-color: rgba(168, 85, 247, 0.4) transparent;

  &::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.3);

    &:hover {
      background: rgba(168, 85, 247, 0.6);
    }
  }
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--wo-primary, #8b6fd8);
  flex-shrink: 0;
}

.item-actions {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.action-btn {
  padding: 2px;
}
</style>
