import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { api } from '../../services/api';
import { Destination } from '../../types';
import { formatDateInput, formatDate } from '../../utils/format';

interface DestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  onSuccess: () => void;
  destinationToEdit?: Destination | null;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripStartDate,
  tripEndDate,
  onSuccess,
  destinationToEdit,
}) => {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (destinationToEdit) {
      setCity(destinationToEdit.city);
      setCountry(destinationToEdit.country);
      setArrivalDate(formatDateInput(destinationToEdit.arrivalDate));
      setDepartureDate(formatDateInput(destinationToEdit.departureDate));
    } else {
      setCity('');
      setCountry('');
      setArrivalDate(formatDateInput(tripStartDate));
      setDepartureDate(formatDateInput(tripEndDate));
    }
    setError(null);
  }, [destinationToEdit, isOpen, tripStartDate, tripEndDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!city.trim() || !country.trim()) {
      setError('City and Country are required.');
      return;
    }
    if (!arrivalDate || !departureDate) {
      setError('Both arrival and departure dates are required.');
      return;
    }
    if (new Date(departureDate) < new Date(arrivalDate)) {
      setError('Departure date must be on or after arrival date.');
      return;
    }

    const tStart = new Date(tripStartDate);
    const tEnd = new Date(tripEndDate);
    const arr = new Date(arrivalDate);
    const dep = new Date(departureDate);

    if (arr < tStart || dep > tEnd) {
      setError(
        `Destination dates must fall within the trip dates (${formatDate(tripStartDate)} to ${formatDate(tripEndDate)}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (destinationToEdit) {
        await api.destinations.update(tripId, destinationToEdit._id, {
          city: city.trim(),
          country: country.trim(),
          arrivalDate,
          departureDate,
        });
      } else {
        await api.destinations.create(tripId, {
          city: city.trim(),
          country: country.trim(),
          arrivalDate,
          departureDate,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save destination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={destinationToEdit ? 'Edit Destination' : 'Add Destination'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Florence"
            required
            disabled={isSubmitting}
          />
          <Input
            label="Country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Italy"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Arrival Date"
            type="date"
            min={formatDateInput(tripStartDate)}
            max={formatDateInput(tripEndDate)}
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Departure Date"
            type="date"
            min={formatDateInput(tripStartDate)}
            max={formatDateInput(tripEndDate)}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Trip window: {formatDate(tripStartDate)} — {formatDate(tripEndDate)}
        </p>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {destinationToEdit ? 'Save Changes' : 'Add Destination'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
