import { create } from 'zustand';
import type { Business } from '@/types';

const DEFAULT_PRIMARY = '#16a34a';

interface ThemeState {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  loadFromBusiness: (business: Business) => void;
  resetToDefault: () => void;
}

function applyColor(color: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--ring', color);
    document.documentElement.style.setProperty('--sidebar-primary', color);
    document.documentElement.style.setProperty('--sidebar-ring', color);
  }
}

export const useThemeStore = create<ThemeState>()((set) => ({
  primaryColor: DEFAULT_PRIMARY,

  setPrimaryColor: (color) => {
    applyColor(color);
    set({ primaryColor: color });
  },

  loadFromBusiness: (business) => {
    const color = business.themeColor ?? DEFAULT_PRIMARY;
    applyColor(color);
    set({ primaryColor: color });
  },

  resetToDefault: () => {
    applyColor(DEFAULT_PRIMARY);
    set({ primaryColor: DEFAULT_PRIMARY });
  },
}));
