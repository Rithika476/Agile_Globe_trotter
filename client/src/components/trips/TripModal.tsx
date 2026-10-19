import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { api } from '../../services/api';
import { TripDetail, TripSummary } from '../../types';
import { formatDateInput } from '../../utils/format';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trip: TripDetail | TripSummary) => void;
  tripToEdit?: TripSummary | TripDetail | null;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tripToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tripToEdit) {
      setTitle(tripToEdit.title);
      setStartDate(formatDateInput(tripToEdit.startDate));
      setEndDate(formatDateInput(tripToEdit.endDate));
      setEstimatedBudget(String(tripToEdit.estimatedBudget || 0));
    } else {
      setTitle('');
      setStartDate('');
      setEndDate('');
      setEstimatedBudget('0');
    }
    setError(null);
  }, [tripToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Trip title is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Both start and end dates are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date.');
      return;
    }

    const budgetNum = parseFloat(estimatedBudget) || 0;
    if (budgetNum < 0) {
      setError('Budget cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tripToEdit) {
        const res = await api.trips.update(tripToEdit._id, {
          title: title.trim(),
          startDate,
          endDate,
          estimatedBudget: budgetNum,
        });
        onSuccess(res.trip);
      } else {
        const res = await api.trips.create({
          title: title.trim(),
          startDate,
          endDate,
          estimatedBudget: budgetNum,
        });
        onSuccess(res.trip);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tripToEdit ? 'Edit Trip' : 'Create New Trip'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <Input
          label="Trip Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Summer Vacation in Italy"
          required
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Estimated Budget (₹)"
          type="number"
          min="0"
          step="any"
          value={estimatedBudget}
          onChange={(e) => setEstimatedBudget(e.target.value)}
          placeholder="0"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {tripToEdit ? 'Save Changes' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
