import React, { useState } from 'react';
import { ItineraryDay, Activity } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTime, formatCurrency } from '../../utils/format';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ActivityModal } from '../activities/ActivityModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ItineraryTabProps {
  tripId: string;
  days: ItineraryDay[];
  onRefresh: () => void;
  onGoToDestinations: () => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  tripId,
  days,
  onRefresh,
  onGoToDestinations,
}) => {
  const { showToast } = useToast();

  const [selectedDayForActivity, setSelectedDayForActivity] = useState<ItineraryDay | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      await api.activities.delete(tripId, activityToDelete._id);
      showToast('Activity removed from itinerary.', 'info');
      setActivityToDelete(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete activity.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (days.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-10 h-10" />}
        title="No itinerary days yet"
        description="Add one or more destinations to automatically generate day-by-day itinerary schedules."
        action={
          <Button variant="primary" size="sm" onClick={onGoToDestinations}>
            Add Destinations First
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Day-by-Day Schedule</h3>
          <p className="text-xs text-slate-500">
            Schedule activities, tours, dining, and transit for each day of your journey.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {days.map((day, dayIndex) => {
          const destObj = day.destination as any;
          const destCity = destObj?.city || 'Unassigned';
          const destCountry = destObj?.country ? ` (${destObj.country})` : '';

          // Day total cost calculation
          const dayTotalCost = day.activities?.reduce((acc, a) => acc + (a.estimatedCost || 0), 0) || 0;

          return (
            <Card key={day._id} className="overflow-hidden border border-slate-200">
              {/* Day Header Bar */}
              <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                    Day {dayIndex + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{formatDate(day.date)}</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span className="text-teal-700 font-semibold">{destCity}{destCountry}</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Day Total:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(dayTotalCost)}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDayForActivity(day);
                      setActivityToEdit(null);
                      setIsActivityModalOpen(true);
                    }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Activity
                  </Button>
                </div>
              </div>

              {/* Activities on this day */}
              <div className="p-5">
                {!day.activities || day.activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No activities planned for this day yet. Click "Add Activity" to plan your morning, afternoon, or evening.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {day.activities.map((act) => {
                      const hasTimes = act.startTime || act.endTime;
                      return (
                        <div
                          key={act._id}
                          className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
                        >
                          <div className="flex items-start space-x-3">
                            <Badge variant={act.category} className="mt-0.5 uppercase tracking-wider text-[10px]">
                              {act.category}
                            </Badge>

                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-slate-900">
                                {act.title}
                              </h5>

                              {act.description && (
                                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                                  {act.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                                {hasTimes && (
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                                    {act.startTime ? formatTime(act.startTime) : ''}
                                    {act.startTime && act.endTime ? ' — ' : ''}
                                    {act.endTime ? formatTime(act.endTime) : ''}
                                  </span>
                                )}

                                {act.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {act.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Cost and Actions */}
                          <div className="flex items-center justify-between sm:justify-end space-x-4 self-end sm:self-center shrink-0">
                            <span className="text-sm font-bold text-slate-800">
                              {formatCurrency(act.estimatedCost)}
                            </span>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedDayForActivity(day);
                                  setActivityToEdit(act);
                                  setIsActivityModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Activity"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActivityToDelete(act)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activity Modal */}
      {selectedDayForActivity && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false);
            setSelectedDayForActivity(null);
            setActivityToEdit(null);
          }}
          tripId={tripId}
          dayId={selectedDayForActivity._id}
          dayDate={selectedDayForActivity.date}
          onSuccess={() => {
            onRefresh();
            showToast(
              activityToEdit ? 'Activity updated!' : 'Activity added to itinerary!',
              'success'
            );
          }}
          activityToEdit={activityToEdit}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!activityToDelete}
        title="Delete Activity"
        message={`Are you sure you want to remove "${activityToDelete?.title}" from this day?`}
        confirmText="Yes, Remove"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteActivity}
        onCancel={() => setActivityToDelete(null)}
      />
    </div>
  );
};
