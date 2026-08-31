import { defineStore, acceptHMRUpdate } from 'pinia';
import { startTaskSessionApi, stopTaskSessionApi, getActiveTaskSessionApi } from '@/services/api';
import type { TaskSession, StopSessionPayload } from '@/services/api';

export interface SessionState {
  activeSession: TaskSession | null;
  loading: boolean;
  initialized: boolean;
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    activeSession: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    hasActiveSession: (state): boolean => !!state.activeSession,
    activeTaskId: (state): number | null =>
      state.activeSession ? Number(state.activeSession.task_id) : null,
    isTaskSessionActive:
      (state) =>
      (taskId: number): boolean => {
        return !!state.activeSession && Number(state.activeSession.task_id) === Number(taskId);
      },
  },

  actions: {
    async fetchActiveSession(): Promise<TaskSession | null> {
      this.loading = true;
      try {
        const res = await getActiveTaskSessionApi();
        this.activeSession = res.session;
        this.initialized = true;
        return this.activeSession;
      } catch {
        this.initialized = true;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async startSession(taskId: number): Promise<TaskSession> {
      this.loading = true;
      try {
        const res = await startTaskSessionApi(taskId);
        this.activeSession = res.session;
        return res.session;
      } finally {
        this.loading = false;
      }
    },

    async stopSession(payload: StopSessionPayload) {
      if (!this.activeSession) {
        throw new Error('No active session to stop');
      }
      const taskId = Number(this.activeSession.task_id);
      this.loading = true;
      try {
        const res = await stopTaskSessionApi(taskId, payload);
        this.activeSession = null;
        return res;
      } finally {
        this.loading = false;
      }
    },

    clearSession() {
      this.activeSession = null;
    },
  },

  persist: {
    storage: localStorage,
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot));
}
