import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, MapPin, Calendar, PieChart, Share2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Globe Trotter
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>Personalized Travel Planning Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl">
          Plan Your Dream Journeys with <span className="text-teal-600">Clarity</span>, Not Chaos.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Structure multi-destination vacations, organize daily activities hour-by-hour, monitor your live budget in real time, and share read-only itineraries with friends in one click.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link to={user ? '/dashboard' : '/register'}>
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-teal-600/20">
              <span>{user ? 'Open Your Dashboard' : 'Start Planning Your Trip'}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          {!user && (
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In to Existing Account
              </Button>
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Destination Ordering</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Add multiple cities with arrival & departure dates. Reorder routes with one click while staying inside trip dates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Auto-Generated Itineraries</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Every day on your trip is automatically laid out. Schedule activities with categories, locations, and time slots.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Live Budget Analytics</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Watch expenses calculate live with Recharts breakdown charts. Instant alerts prevent over-budget surprises.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Private & Public Sharing</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Generate read-only share links for family and friends. Revoke access instantly anytime with zero exposed private data.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} Globe Trotter. Personalized Travel Planning Application.</p>
      </footer>
    </div>
  );
};
