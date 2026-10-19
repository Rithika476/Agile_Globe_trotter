import React, { useState } from 'react';
import { Destination } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, calculateDuration } from '../../utils/format';
import { MapPin, Calendar, ArrowUp, ArrowDown, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { DestinationModal } from '../destinations/DestinationModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface DestinationsTabProps {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  destinations: Destination[];
  onRefresh: () => void;
}

export const DestinationsTab: React.FC<DestinationsTabProps> = ({
  tripId,
  tripStartDate,
  tripEndDate,
  destinations,
  onRefresh,
}) => {
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destinationToEdit, setDestinationToEdit] = useState<Destination | null>(null);

  const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= destinations.length) return;

    const newDestinations = [...destinations];
    const [moved] = newDestinations.splice(index, 1);
    newDestinations.splice(targetIndex, 0, moved);

    const reorderedIds = newDestinations.map((d) => d._id);

    setIsReordering(true);
    try {
      await api.destinations.reorder(tripId, reorderedIds);
      onRefresh();
      showToast('Destinations reordered successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder destinations.', 'error');
    } finally {
      setIsReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!destinationToDelete) return;
    setIsDeleting(true);
    try {
      await api.destinations.delete(tripId, destinationToDelete._id);
      showToast('Destination and related itinerary days removed.', 'info');
      setDestinationToDelete(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete destination.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Trip Destinations</h3>
          <p className="text-xs text-slate-500">
            Define your travel stops. Itinerary days are generated automatically for each date range.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setDestinationToEdit(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Destination
        </Button>
      </div>

      {destinations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="No destinations yet"
          description="Add your first city stop to automatically generate itinerary calendar days."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDestinationToEdit(null);
                setIsModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add First Destination
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {destinations.map((dest, idx) => {
            const daysCount = calculateDuration(dest.arrivalDate, dest.departureDate);

            return (
              <Card
                key={dest._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{dest.city}</span>
                      <span className="text-xs font-medium text-slate-400">({dest.country})</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {formatDate(dest.arrivalDate)} — {formatDate(dest.departureDate)}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {daysCount} {daysCount === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Reorder & Edit/Delete */}
                <div className="flex items-center justify-end space-x-1.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                  {/* Reorder Buttons */}
                  <div className="flex items-center space-x-1 mr-2 border-r border-slate-200 pr-2">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0 || isReordering}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === destinations.length - 1 || isReordering}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setDestinationToEdit(dest);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Destination"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDestinationToDelete(dest)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Destination"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DestinationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDestinationToEdit(null);
        }}
        tripId={tripId}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onSuccess={() => {
          onRefresh();
          showToast(
            destinationToEdit ? 'Destination updated!' : 'Destination added successfully!',
            'success'
          );
        }}
        destinationToEdit={destinationToEdit}
      />

      <ConfirmDialog
        isOpen={!!destinationToDelete}
        title="Delete Destination"
        message={`Are you sure you want to delete ${destinationToDelete?.city}? All itinerary days and scheduled activities for this destination will be deleted.`}
        confirmText="Yes, Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDestinationToDelete(null)}
      />
    </div>
  );
};
