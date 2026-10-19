import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'globetrotter_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // localStorage not accessible
  }
  return 'system';
}

function computeIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

function applyThemeToDOM(theme: Theme): boolean {
  const isDark = computeIsDark(theme);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
  return isDark;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isDark, setIsDark] = useState<boolean>(() => computeIsDark(theme));

  // Explicitly sync DOM on mount and ensure initial state matches
  useEffect(() => {
    const effectiveDark = applyThemeToDOM(theme);
    setIsDark(effectiveDark);
  }, []);

  // Listen to OS theme changes live
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const effectiveDark = applyThemeToDOM('system');
        setIsDark(effectiveDark);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    // 1. Explicitly ADD 'dark' for dark and REMOVE for light, or compute for system
    const effectiveDark = applyThemeToDOM(newTheme);

    // 2. Persist choice in localStorage under 'globetrotter_theme'
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }

    // 3. Update React states
    setThemeState(newTheme);
    setIsDark(effectiveDark);
  };

  const toggleTheme = () => {
    // Cycle: light -> dark -> system -> light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
