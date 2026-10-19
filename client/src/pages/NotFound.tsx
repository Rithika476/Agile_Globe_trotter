import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-4">
        <span className="text-5xl" role="img" aria-label="lost compass">🧭</span>
        <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
        <h2 className="text-lg font-semibold text-slate-700">Page Not Found</h2>
        <p className="text-sm text-slate-500">
          Looks like you've wandered off the map! The page you are looking for doesn't exist.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
