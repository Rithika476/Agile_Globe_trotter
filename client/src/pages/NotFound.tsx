import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center relative transition-colors duration-200">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
        <span className="text-5xl" role="img" aria-label="lost compass">🧭</span>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">404</h1>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Page Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Looks like you've wandered off the map! The page you are looking for doesn't exist.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
