import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabels = false }) => {
  const { theme, isDark, setTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Light mode"
        aria-label="Switch to Light mode"
        aria-pressed={theme === 'light'}
      >
        <Sun className="w-3.5 h-3.5" />
        {showLabels && <span>Light</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
          theme === 'dark'
            ? 'bg-white dark:bg-slate-700 text-teal-400 shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Dark mode"
        aria-label="Switch to Dark mode"
        aria-pressed={theme === 'dark'}
      >
        <Moon className="w-3.5 h-3.5" />
        {showLabels && <span>Dark</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title={`System mode (${isDark ? 'Dark' : 'Light'})`}
        aria-label="Switch to System mode"
        aria-pressed={theme === 'system'}
      >
        <Monitor className="w-3.5 h-3.5" />
        {showLabels && <span>System</span>}
      </button>
    </div>
  );
};
