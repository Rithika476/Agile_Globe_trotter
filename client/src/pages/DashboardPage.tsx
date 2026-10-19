import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { TripSummary } from '../types';
import { formatCurrency, formatDate, calculateDuration } from '../utils/format';
import {
  Plus,
  Compass,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { TripModal } from '../components/trips/TripModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<TripSummary | null>(null);

  // Delete Confirmation State
  const [tripToDelete, setTripToDelete] = useState<TripSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.trips.list();
      setTrips(res.trips);
    } catch (err: any) {
      setError(err.message || 'Failed to load trips.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleTripCreatedOrUpdated = () => {
    fetchTrips();
    showToast(
      tripToEdit ? 'Trip updated successfully!' : 'Trip created successfully!',
      'success'
    );
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    try {
      await api.trips.delete(tripToDelete._id);
      setTrips((prev) => prev.filter((t) => t._id !== tripToDelete._id));
      showToast('Trip and all associated items deleted.', 'info');
      setTripToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete trip.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats computation
  const now = new Date();
  const upcomingTrips = trips.filter((t) => new Date(t.startDate) >= now);
  const totalPlannedBudget = trips.reduce((acc, t) => acc + (t.estimatedBudget || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Banner & Greetings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your destinations, schedules, and budgets across all your journeys.
          </p>
        </div>
        <Button
          onClick={() => {
            setTripToEdit(null);
            setIsTripModalOpen(true);
          }}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-teal-600/20"
        >
          New Trip
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Trips
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{trips.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Upcoming Trips
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{upcomingTrips.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Planned Budget
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(totalPlannedBudget)}
            </p>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && <Alert type="error" message={error} />}

      {/* Trip List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Trips</h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Spinner size="lg" className="text-teal-600 dark:text-teal-400" />
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Compass className="w-10 h-10" />}
            title="No trips created yet"
            description="Start planning your first adventure by adding destinations, dates, and an estimated budget."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setTripToEdit(null);
                  setIsTripModalOpen(true);
                }}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Your First Trip
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const duration = calculateDuration(trip.startDate, trip.endDate);
              const isOverBudget = trip.totalEstimatedCost > trip.estimatedBudget && trip.estimatedBudget > 0;

              return (
                <Card
                  key={trip._id}
                  className="flex flex-col justify-between overflow-hidden group hover:border-teal-200 dark:hover:border-teal-800"
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition line-clamp-1">
                        {trip.title}
                      </h3>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setTripToEdit(trip);
                            setIsTripModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Trip Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setTripToDelete(trip);
                          }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dates & Duration */}
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>
                          {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{duration} {duration === 1 ? 'day' : 'days'} total</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{trip.destinationCount} {trip.destinationCount === 1 ? 'destination' : 'destinations'}</span>
                      </div>
                    </div>

                    {/* Budget Summary Line */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Estimated Cost:</span>
                      <div className="text-right">
                        <span className={`font-bold ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {formatCurrency(trip.totalEstimatedCost)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] block">
                          of {formatCurrency(trip.estimatedBudget)} budget
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      Open Itinerary
                    </span>
                    <Link
                      to={`/trips/${trip._id}`}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setTripToEdit(null);
        }}
        onSuccess={handleTripCreatedOrUpdated}
        tripToEdit={tripToEdit}
      />

      <ConfirmDialog
        isOpen={!!tripToDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${tripToDelete?.title}"? This will permanently remove all destinations, itinerary days, activities, and share links.`}
        confirmText="Yes, Delete Trip"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteTrip}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
};
