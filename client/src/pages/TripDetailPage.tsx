import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { TripDetail } from '../types';
import { useToast } from '../context/ToastContext';
import { formatDate, calculateDuration, formatCurrency } from '../utils/format';
import { AppLayout } from '../layouts/AppLayout';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Share2,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { TripModal } from '../components/trips/TripModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DestinationsTab } from '../components/trips/DestinationsTab';
import { ItineraryTab } from '../components/trips/ItineraryTab';
import { BudgetTab } from '../components/trips/BudgetTab';
import { TimelineTab } from '../components/trips/TimelineTab';
import { ShareTab } from '../components/trips/ShareTab';

type TabKey = 'destinations' | 'itinerary' | 'budget' | 'timeline' | 'share';

export const TripDetailPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state synced with URL query or default to 'destinations'
  const activeTab = (searchParams.get('tab') as TabKey) || 'destinations';

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      setError(null);
      const res = await api.trips.get(tripId);
      setTrip(res.trip);
    } catch (err: any) {
      setError(err.message || 'Failed to load trip details.');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleDeleteTrip = async () => {
    if (!trip) return;
    setIsDeleting(true);
    try {
      await api.trips.delete(trip._id);
      showToast('Trip deleted successfully.', 'info');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete trip.', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Spinner size="lg" className="text-teal-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading trip itinerary...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !trip) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Alert
            type="error"
            message={
              error || 'This trip could not be found or you do not have permission to view it.'
            }
          />
          <div className="mt-6 flex items-center justify-center space-x-4">
            <Link to="/dashboard">
              <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Dashboard
              </Button>
            </Link>
            <Button variant="primary" onClick={fetchTrip}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const duration = calculateDuration(trip.startDate, trip.endDate);

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    {
      key: 'destinations',
      label: 'Destinations',
      icon: MapPin,
      count: trip.destinations.length,
    },
    {
      key: 'itinerary',
      label: 'Itinerary Days',
      icon: Calendar,
      count: trip.itineraryDays.length,
    },
    {
      key: 'budget',
      label: 'Budget & Expenses',
      icon: DollarSign,
    },
    {
      key: 'timeline',
      label: 'Visual Timeline',
      icon: Clock,
    },
    {
      key: 'share',
      label: 'Share Itinerary',
      icon: Share2,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            to="/dashboard"
            className="flex items-center space-x-1 hover:text-teal-600 dark:hover:text-teal-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Trips</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs">{trip.title}</span>
        </div>

        {/* Trip Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {trip.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                  <span className="text-xs text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded ml-1">
                    {duration} {duration === 1 ? 'day' : 'days'}
                  </span>
                </span>

                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Target Budget:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {formatCurrency(trip.estimatedBudget || 0)}
                  </strong>
                </span>

                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {trip.destinations.length}{' '}
                  {trip.destinations.length === 1 ? 'destination' : 'destinations'}
                </span>
              </div>
            </div>

            {/* Actions: Edit & Delete */}
            <div className="flex items-center space-x-3 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit2 className="w-4 h-4" />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Trip
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl px-2 pt-2 flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="pt-2">
          {activeTab === 'destinations' && (
            <DestinationsTab
              tripId={trip._id}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
              destinations={trip.destinations}
              onRefresh={fetchTrip}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryTab
              tripId={trip._id}
              days={trip.itineraryDays}
              onRefresh={fetchTrip}
              onGoToDestinations={() => setActiveTab('destinations')}
            />
          )}

          {activeTab === 'budget' && <BudgetTab tripId={trip._id} />}

          {activeTab === 'timeline' && (
            <TimelineTab
              days={trip.itineraryDays}
              onGoToDestinations={() => setActiveTab('destinations')}
            />
          )}

          {activeTab === 'share' && <ShareTab tripId={trip._id} />}
        </div>

        {/* Modals */}
        <TripModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchTrip();
            showToast('Trip details updated successfully!', 'success');
          }}
          tripToEdit={trip}
        />

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Trip"
          message={`Are you sure you want to delete "${trip.title}"? This will permanently remove all destinations, itinerary days, activities, and budget data associated with this trip.`}
          confirmText="Yes, Delete Trip"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteTrip}
          onCancel={() => setIsDeleteDialogOpen(false)}
        />
      </div>
    </AppLayout>
  );
};
