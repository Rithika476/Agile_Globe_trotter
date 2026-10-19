import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface HealthData {
  status: string;
  service: string;
  timestamp: string;
}

export const Home: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthData = await response.json();
      setHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <main className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <header className="text-center space-y-2">
          {/* Tailwind class demonstration */}
          <div className="inline-flex items-center justify-center p-3 bg-sky-100 text-sky-700 rounded-full mb-2">
            <span className="text-2xl" role="img" aria-label="globe">🌍</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Globe Trotter
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Personalized Travel Planning Platform
          </p>
        </header>

        {/* Server Connection Status Card */}
        <section className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Backend Health Status
            </span>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium underline disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-slate-600 text-sm py-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Checking server health...</span>
            </div>
          )}

          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm">
              <p className="font-semibold">Server Offline or Unreachable</p>
              <p className="text-xs text-rose-600 mt-1">{error}</p>
            </div>
          )}

          {!loading && health && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-emerald-700 uppercase text-xs tracking-wide">
                  {health.status}
                </span>
                <span className="text-xs text-slate-400">({health.service})</span>
              </div>
              <p className="text-xs text-slate-500">
                Timestamp: <span className="font-mono">{new Date(health.timestamp).toLocaleTimeString()}</span>
              </p>
            </div>
          )}
        </section>

        {/* Navigation & Verification Links */}
        <footer className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Route: <code className="bg-slate-100 px-1 py-0.5 rounded">/</code> (Home)</span>
          <Link
            to="/some-unknown-route"
            className="text-sky-600 hover:text-sky-800 font-medium"
          >
            Test 404 Route &rarr;
          </Link>
        </footer>
      </main>
    </div>
  );
};
