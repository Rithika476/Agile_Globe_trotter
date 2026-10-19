import mongoose from 'mongoose';
import { Trip } from '../models/Trip';
import { Destination } from '../models/Destination';
import { ItineraryDay } from '../models/ItineraryDay';
import { Activity } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

// Helper: Normalize Date to midnight UTC for consistent day comparison
export const normalizeDate = (d: Date | string): Date => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Auto-generate itinerary days for a date range
export const syncItineraryDaysForDestination = async (
  tripId: mongoose.Types.ObjectId,
  destinationId: mongoose.Types.ObjectId,
  arrivalDate: Date,
  departureDate: Date
) => {
  const cur = normalizeDate(arrivalDate);
  const end = normalizeDate(departureDate);

  while (cur <= end) {
    const dateCopy = new Date(cur);
    // Respect unique (trip, date) compound index: do not duplicate
    const existingDay = await ItineraryDay.findOne({
      trip: tripId,
      date: dateCopy,
    });

    if (!existingDay) {
      await ItineraryDay.create({
        trip: tripId,
        destination: destinationId,
        date: dateCopy,
      });
    }

    cur.setUTCDate(cur.getUTCDate() + 1);
  }
};

export const getTripDestinations = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  return Destination.find({ trip: trip._id }).sort({ order: 1 });
};

export const createDestination = async (
  tripId: string,
  userId: string,
  data: { city: string; country: string; arrivalDate: Date; departureDate: Date }
) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const arrival = normalizeDate(data.arrivalDate);
  const departure = normalizeDate(data.departureDate);

  if (departure < arrival) {
    throw createError('Departure date must be on or after arrival date', 400);
  }

  const tripStart = normalizeDate(trip.startDate);
  const tripEnd = normalizeDate(trip.endDate);

  if (arrival < tripStart || departure > tripEnd) {
    throw createError(
      `Destination dates must fall within trip dates (${tripStart.toISOString().split('T')[0]} to ${tripEnd.toISOString().split('T')[0]})`,
      400
    );
  }

  // Calculate next order sequence
  const lastDestination = await Destination.findOne({ trip: trip._id }).sort({ order: -1 });
  const nextOrder = lastDestination ? lastDestination.order + 1 : 0;

  const destination = await Destination.create({
    trip: trip._id,
    city: data.city,
    country: data.country,
    arrivalDate: arrival,
    departureDate: departure,
    order: nextOrder,
  });

  // Automatically generate ItineraryDay records for arrival..departure
  await syncItineraryDaysForDestination(trip._id, destination._id as mongoose.Types.ObjectId, arrival, departure);

  return destination;
};

export const updateDestination = async (
  tripId: string,
  destinationId: string,
  userId: string,
  data: { city?: string; country?: string; arrivalDate?: Date; departureDate?: Date }
) => {
  if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(destinationId)) {
    throw createError('Destination not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const destination = await Destination.findOne({ _id: destinationId, trip: trip._id });
  if (!destination) {
    throw createError('Destination not found', 404);
  }

  const arrival = data.arrivalDate ? normalizeDate(data.arrivalDate) : destination.arrivalDate;
  const departure = data.departureDate ? normalizeDate(data.departureDate) : destination.departureDate;

  if (departure < arrival) {
    throw createError('Departure date must be on or after arrival date', 400);
  }

  const tripStart = normalizeDate(trip.startDate);
  const tripEnd = normalizeDate(trip.endDate);

  if (arrival < tripStart || departure > tripEnd) {
    throw createError(
      `Destination dates must fall within trip dates (${tripStart.toISOString().split('T')[0]} to ${tripEnd.toISOString().split('T')[0]})`,
      400
    );
  }

  if (data.city !== undefined) destination.city = data.city;
  if (data.country !== undefined) destination.country = data.country;
  destination.arrivalDate = arrival;
  destination.departureDate = departure;

  await destination.save();

  // Sync new days if dates were modified
  if (data.arrivalDate || data.departureDate) {
    await syncItineraryDaysForDestination(trip._id, destination._id as mongoose.Types.ObjectId, arrival, departure);
  }

  return destination;
};

export const deleteDestination = async (tripId: string, destinationId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(destinationId)) {
    throw createError('Destination not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const destination = await Destination.findOne({ _id: destinationId, trip: trip._id });
  if (!destination) {
    throw createError('Destination not found', 404);
  }

  // Delete days linked to this destination and their activities
  const days = await ItineraryDay.find({ trip: trip._id, destination: destination._id });
  const dayIds = days.map((d) => d._id);

  if (dayIds.length > 0) {
    await Activity.deleteMany({ trip: trip._id, itineraryDay: { $in: dayIds } });
    await ItineraryDay.deleteMany({ _id: { $in: dayIds } });
  }

  await Destination.findByIdAndDelete(destination._id);

  // Re-sequence remaining destinations contiguous (0..n-1) avoiding index collisions
  const remaining = await Destination.find({ trip: trip._id }).sort({ order: 1 });
  for (let i = 0; i < remaining.length; i++) {
    await Destination.findByIdAndUpdate(remaining[i]._id, { order: -(i + 1) });
  }
  for (let i = 0; i < remaining.length; i++) {
    await Destination.findByIdAndUpdate(remaining[i]._id, { order: i });
  }

  return { success: true, message: 'Destination and its itinerary days removed.' };
};

export const reorderDestinations = async (
  tripId: string,
  userId: string,
  destinationIds: string[]
) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const existingDestinations = await Destination.find({ trip: trip._id });
  if (existingDestinations.length !== destinationIds.length) {
    throw createError('Provided destination IDs count does not match trip destination count', 400);
  }

  const existingIds = new Set(existingDestinations.map((d) => d._id.toString()));
  for (const id of destinationIds) {
    if (!existingIds.has(id)) {
      throw createError(`Destination ${id} does not belong to this trip`, 400);
    }
  }

  // Two-step safe reorder to avoid duplicate key errors on unique (trip, order) index:
  // Step 1: Assign negative temporary order values
  for (let i = 0; i < destinationIds.length; i++) {
    await Destination.findByIdAndUpdate(destinationIds[i], { order: -(i + 1) });
  }

  // Step 2: Assign final non-negative contiguous order values
  for (let i = 0; i < destinationIds.length; i++) {
    await Destination.findByIdAndUpdate(destinationIds[i], { order: i });
  }

  return Destination.find({ trip: trip._id }).sort({ order: 1 });
};
