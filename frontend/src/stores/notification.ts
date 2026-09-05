import { defineStore } from 'pinia';
import {
  getNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
  type NotificationItem,
} from '@/services/api';

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  pollingTimer: ReturnType<typeof setInterval> | null;
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    pollingTimer: null,
  }),

  getters: {
    unreadNotifications: (state): NotificationItem[] =>
      state.notifications.filter((n) => !n.is_read),
    hasUnread: (state): boolean => state.unreadCount > 0,
  },

  actions: {
    async fetchNotifications(silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        const res = await getNotificationsApi();
        this.notifications = res.notifications;
        this.unreadCount = res.unreadCount;
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
      } finally {
        if (!silent) {
          this.loading = false;
        }
      }
    },

    async markAsRead(id: number) {
      // Optimistic update
      const item = this.notifications.find((n) => n.notification_id === id);
      if (item && !item.is_read) {
        item.is_read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      try {
        await markNotificationAsReadApi(id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        // Revert by re-fetching
        void this.fetchNotifications(true);
      }
    },

    async markAllAsRead() {
      // Optimistic update
      this.notifications.forEach((n) => (n.is_read = true));
      this.unreadCount = 0;
      try {
        await markAllNotificationsAsReadApi();
      } catch (err) {
        console.error('Failed to mark all notifications as read:', err);
        void this.fetchNotifications(true);
      }
    },

    async deleteNotification(id: number) {
      // Optimistic update
      const index = this.notifications.findIndex((n) => n.notification_id === id);
      if (index !== -1) {
        const wasUnread = !this.notifications[index]?.is_read;
        this.notifications.splice(index, 1);
        if (wasUnread) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      }
      try {
        await deleteNotificationApi(id);
      } catch (err) {
        console.error('Failed to delete notification:', err);
        void this.fetchNotifications(true);
      }
    },

    startPolling(intervalMs = 30000) {
      this.stopPolling();
      void this.fetchNotifications(true);
      this.pollingTimer = setInterval(() => {
        void this.fetchNotifications(true);
      }, intervalMs);
    },

    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    },
  },
});
