// src/store/themeStore.ts

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  actions: {
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
  };
}

const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,

  actions: {
    setThemeMode: (mode: ThemeMode) => {
      const isDark = mode === 'dark' ||
        (mode === 'system' && false); // TODO: Check system preference
      set({ mode, isDark });
    },

    toggleTheme: () => {
      const currentMode = get().mode;
      const newMode = currentMode === 'light' ? 'dark' : 'light';
      const isDark = newMode === 'dark';
      set({ mode: newMode, isDark });
    },
  },
}));

export default useThemeStore;