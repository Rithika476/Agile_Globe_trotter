import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import { api } from '../../services/api';
import { Activity, ActivityCategory, ACTIVITY_CATEGORIES } from '../../types';
import { formatTimeInput, formatDate } from '../../utils/format';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  dayId: string;
  dayDate: string;
  onSuccess: () => void;
  activityToEdit?: Activity | null;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  tripId,
  dayId,
  dayDate,
  onSuccess,
  activityToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('sightseeing');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setCategory(activityToEdit.category || 'other');
      setLocation(activityToEdit.location || '');
      setDescription(activityToEdit.description || '');
      setStartTime(activityToEdit.startTime ? formatTimeInput(activityToEdit.startTime) : '');
      setEndTime(activityToEdit.endTime ? formatTimeInput(activityToEdit.endTime) : '');
      setEstimatedCost(String(activityToEdit.estimatedCost || 0));
    } else {
      setTitle('');
      setCategory('sightseeing');
      setLocation('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setEstimatedCost('0');
    }
    setError(null);
  }, [activityToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Activity title is required.');
      return;
    }

    if (startTime && endTime && endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }

    const costNum = parseFloat(estimatedCost) || 0;
    if (costNum < 0) {
      setError('Estimated cost cannot be negative.');
      return;
    }

    // Convert date + time to ISO strings
    const dateBase = dayDate.split('T')[0];
    const startIso = startTime
      ? new Date(`${dateBase}T${startTime}:00.000Z`).toISOString()
      : undefined;
    const endIso = endTime
      ? new Date(`${dateBase}T${endTime}:00.000Z`).toISOString()
      : undefined;

    setIsSubmitting(true);
    try {
      if (activityToEdit) {
        await api.activities.update(tripId, activityToEdit._id, {
          title: title.trim(),
          category,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          startTime: startIso,
          endTime: endIso,
          estimatedCost: costNum,
        });
      } else {
        await api.activities.create(tripId, dayId, {
          title: title.trim(),
          category,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          startTime: startIso,
          endTime: endIso,
          estimatedCost: costNum,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activityToEdit ? 'Edit Activity' : 'Add Activity to Itinerary'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg inline-block">
          Scheduled for: {formatDate(dayDate)}
        </div>

        <Input
          label="Activity Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Guided Vatican Museums Tour"
          required
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ActivityCategory)}
            options={ACTIVITY_CATEGORIES}
            disabled={isSubmitting}
          />
          <Input
            label="Estimated Cost (₹)"
            type="number"
            min="0"
            step="any"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Location (optional)"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Viale Vaticano, Rome"
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Time (optional)"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="End Time (optional)"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Textarea
          label="Description / Notes (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Meeting point, ticket details, reservation notes..."
          rows={3}
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {activityToEdit ? 'Save Changes' : 'Add Activity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
