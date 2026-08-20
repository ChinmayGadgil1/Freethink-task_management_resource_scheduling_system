import { defineStore, acceptHMRUpdate } from 'pinia';
import { Dark } from 'quasar';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false,
  }),

  actions: {
    initTheme() {
      Dark.set(this.isDark);
    },
    toggleDarkMode() {
      this.isDark = !this.isDark;
      Dark.set(this.isDark);
    },
    setDarkMode(value: boolean) {
      this.isDark = value;
      Dark.set(value);
    },
  },

  persist: {
    storage: localStorage,
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useThemeStore, import.meta.hot));
}
