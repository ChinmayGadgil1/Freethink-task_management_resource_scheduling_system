import { defineStore, acceptHMRUpdate } from 'pinia';

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'PROJECT_MANAGER' | 'RESOURCE';
  token?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    userRole: (state): string | null => state.user?.role ?? null,
    currentUser: (state): User | null => state.user,
    currentToken: (state): string | null => state.token,
  },

  actions: {
    setAuth(token: string, user: User) {
      this.token = token;
      this.user = user;
    },

    setUser(user: User) {
      this.user = user;
    },

    clearAuth() {
      this.token = null;
      this.user = null;
    },
  },

  persist: {
    storage: sessionStorage,
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
