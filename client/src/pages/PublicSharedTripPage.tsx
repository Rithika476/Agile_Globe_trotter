import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { PublicSharedTrip } from '../types';
import { formatDate, formatTime, formatCurrency, calculateDuration } from '../utils/format';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Share2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const PublicSharedTripPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [itinerary, setItinerary] = useState<PublicSharedTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedItinerary = async () => {
      if (!token) {
        setError('Missing share link token.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(false);
        const res = await api.share.getPublic(token);
        setItinerary(res.itinerary);
      } catch (err: any) {
        setError(
          err.message ||
            'This shared itinerary is no longer available, has expired, or the link is invalid.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedItinerary();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <Spinner size="lg" className="text-teal-600 dark:text-teal-400 mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading shared travel itinerary...</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative transition-colors duration-200">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Itinerary Not Found</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {error || 'This travel plan is no longer public, has been revoked, or the link has expired.'}
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button variant="primary" icon={<Compass className="w-4 h-4" />}>
                Go to Globe Trotter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(itinerary.startDate, itinerary.endDate);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 antialiased pb-16 transition-colors duration-200">
      {/* Top Public Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Globe Trotter
              </span>
              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider block">
                Public Itinerary
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link to="/register">
              <Button variant="primary" size="sm" icon={<Sparkles className="w-4 h-4" />}>
                Plan Your Own Trip
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100">
              <Share2 className="w-3.5 h-3.5" />
              <span>Read-Only Shared Trip</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{itinerary.title}</h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-teal-100 pt-2">
              <span className="flex items-center gap-1.5 font-medium bg-black/20 px-3 py-1 rounded-lg">
                <Calendar className="w-4 h-4 text-teal-300" />
                {formatDate(itinerary.startDate)} — {formatDate(itinerary.endDate)}
                <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                  {duration} {duration === 1 ? 'day' : 'days'}
                </span>
              </span>

              {itinerary.budgetSummary && (
                <span className="flex items-center gap-1.5 font-medium bg-black/20 px-3 py-1 rounded-lg">
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  Planned Cost:{' '}
                  <strong className="text-white">
                    {formatCurrency(itinerary.budgetSummary.totalEstimated)}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Destinations Overview */}
        {itinerary.destinations && itinerary.destinations.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Route & Stops</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {itinerary.destinations.map((dest, idx) => {
                const stopDays = calculateDuration(dest.arrivalDate, dest.departureDate);
                return (
                  <Card key={dest._id || idx} className="p-4 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {dest.city}, {dest.country}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatDate(dest.arrivalDate)} — {formatDate(dest.departureDate)}
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                        {stopDays} {stopDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Day-by-Day Schedule */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Daily Itinerary</span>
          </h2>

          {itinerary.itineraryDays.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
              No itinerary days have been scheduled yet for this trip.
            </Card>
          ) : (
            <div className="space-y-4">
              {itinerary.itineraryDays.map((day, dayIndex) => {
                const destTitle =
                  day.destination && typeof day.destination === 'object'
                    ? `${(day.destination as any).city}, ${(day.destination as any).country}`
                    : '';

                return (
                  <Card key={day._id || dayIndex} className="p-5 overflow-hidden">
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400">
                          Day {dayIndex + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{formatDate(day.date)}</h3>
                      </div>
                      {destTitle && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 self-start sm:self-auto">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          {destTitle}
                        </span>
                      )}
                    </div>

                    {/* Activities List */}
                    <div className="pt-4 space-y-3">
                      {day.activities.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                          No activities scheduled for this day yet.
                        </p>
                      ) : (
                        day.activities.map((act) => (
                          <div
                            key={act._id}
                            className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{act.title}</h4>
                                <Badge variant={act.category}>
                                  {act.category}
                                </Badge>
                              </div>
                              {act.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">{act.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                                {(act.startTime || act.endTime) && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                    {act.startTime ? formatTime(act.startTime) : ''}
                                    {act.endTime ? ` - ${formatTime(act.endTime)}` : ''}
                                  </span>
                                )}
                                {act.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                    {act.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            {act.estimatedCost > 0 && (
                              <div className="text-right sm:self-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 shadow-xs">
                                  {formatCurrency(act.estimatedCost)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Budget Breakdown Overview */}
        {itinerary.budgetSummary && itinerary.budgetSummary.byCategory.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Budget Overview</span>
            </h2>

            <Card className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Budget</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrency(itinerary.budgetSummary.estimatedBudget)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Planned Expenses</span>
                  <p className="text-lg font-bold text-teal-700 dark:text-teal-400 mt-1">
                    {formatCurrency(itinerary.budgetSummary.totalEstimated)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Balance Status</span>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      itinerary.budgetSummary.overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {itinerary.budgetSummary.overBudget
                      ? `Over by ${formatCurrency(itinerary.budgetSummary.overBy)}`
                      : `Within budget (${formatCurrency(itinerary.budgetSummary.remaining)} left)`}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Categories</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {itinerary.budgetSummary.byCategory.length} categories
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expense By Category
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {itinerary.budgetSummary.byCategory.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800"
                    >
                      <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">
                        {cat.category}
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(cat.total)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">
                          ({cat.percent}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};
