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

/**
 * Resyncs ItineraryDays with the trip's current destinations:
 * 1. Loads all destinations sorted by order (0..N-1).
 * 2. Maps every calendar date covered by a destination to its destination.
 *    NOTE: If two destinations share a boundary date (transit day), assigning
 *    in increasing order of destination ensures the later destination (higher order,
 *    i.e., the city arrived in on that day) is assigned to that date.
 * 3. Deletes existing days that are no longer covered by any destination ONLY if
 *    they contain no activities. If activities exist, rejects with a 400 error.
 * 4. Ensures all activities stay attached to their day; no activities are deleted silently.
 * 5. Uses ordered operations compatible with a standalone MongoDB (no transactions)
 *    and respects the unique (trip, date) compound index.
 */
export const resyncDays = async (tripId: string | mongoose.Types.ObjectId): Promise<void> => {
  const tripObjectId = typeof tripId === 'string' ? new mongoose.Types.ObjectId(tripId) : tripId;

  // 1. Load the trip's destinations sorted by order
  const destinations = await Destination.find({ trip: tripObjectId }).sort({ order: 1 });

  // 2. Build map of expected dates (YYYY-MM-DD -> destination ObjectId)
  const expectedDayDestinations = new Map<string, mongoose.Types.ObjectId>();

  for (const dest of destinations) {
    const cur = normalizeDate(dest.arrivalDate);
    const end = normalizeDate(dest.departureDate);

    while (cur <= end) {
      const dateKey = cur.toISOString().split('T')[0];
      // If two destinations share a boundary date, assign it to the later destination
      // (the city arrived in), as destinations are iterated in ascending order (0..N-1).
      expectedDayDestinations.set(dateKey, dest._id as mongoose.Types.ObjectId);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // 3. Load existing days for this trip
  const existingDays = await ItineraryDay.find({ trip: tripObjectId });
  const existingDaysByDateKey = new Map<string, typeof existingDays[0]>();

  // Check existing days: delete uncovered days if empty, reject if activities exist
  for (const day of existingDays) {
    const dateKey = normalizeDate(day.date).toISOString().split('T')[0];
    existingDaysByDateKey.set(dateKey, day);

    if (!expectedDayDestinations.has(dateKey)) {
      const activityCount = await Activity.countDocuments({
        trip: tripObjectId,
        itineraryDay: day._id,
      });

      if (activityCount > 0) {
        throw createError(
          `Cannot remove destination or shrink dates because activities exist on date ${dateKey}. Please move or delete these activities first.`,
          400
        );
      }

      // No activities exist: safely delete uncovered day
      await ItineraryDay.findByIdAndDelete(day._id);
      existingDaysByDateKey.delete(dateKey);
    }
  }

  // 4. Ensure each covered date has exactly one ItineraryDay pointing to the correct destination
  for (const [dateKey, targetDestId] of expectedDayDestinations.entries()) {
    const existingDay = existingDaysByDateKey.get(dateKey);

    if (existingDay) {
      // Day already exists: reassign destination if different
      if (existingDay.destination.toString() !== targetDestId.toString()) {
        await ItineraryDay.findByIdAndUpdate(existingDay._id, {
          destination: targetDestId,
        });
      }
    } else {
      // Day does not exist: create it respecting the unique (trip, date) index
      const dateObj = new Date(`${dateKey}T00:00:00.000Z`);
      const newDay = await ItineraryDay.create({
        trip: tripObjectId,
        destination: targetDestId,
        date: dateObj,
      });
      existingDaysByDateKey.set(dateKey, newDay);
    }
  }
};

// Backward-compatibility alias
export const syncItineraryDaysForDestination = async (
  tripId: mongoose.Types.ObjectId,
  _destinationId: mongoose.Types.ObjectId,
  _arrivalDate: Date,
  _departureDate: Date
) => {
  await resyncDays(tripId);
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

  // Resync days after create
  await resyncDays(trip._id);

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

  // Pre-validate that shrinking dates will not orphan any day that has activities
  if (data.arrivalDate || data.departureDate) {
    const otherDestinations = await Destination.find({
      trip: trip._id,
      _id: { $ne: destination._id },
    });

    const proposedCoveredDates = new Set<string>();
    for (const dest of otherDestinations) {
      const cur = normalizeDate(dest.arrivalDate);
      const end = normalizeDate(dest.departureDate);
      while (cur <= end) {
        proposedCoveredDates.add(cur.toISOString().split('T')[0]);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    const curProp = new Date(arrival);
    while (curProp <= departure) {
      proposedCoveredDates.add(curProp.toISOString().split('T')[0]);
      curProp.setUTCDate(curProp.getUTCDate() + 1);
    }

    const existingDays = await ItineraryDay.find({ trip: trip._id });
    for (const day of existingDays) {
      const dateKey = normalizeDate(day.date).toISOString().split('T')[0];
      if (!proposedCoveredDates.has(dateKey)) {
        const actCount = await Activity.countDocuments({
          trip: trip._id,
          itineraryDay: day._id,
        });
        if (actCount > 0) {
          throw createError(
            `Cannot modify destination dates because activities exist on date ${dateKey} which would no longer be covered by any destination. Please delete or move those activities first.`,
            400
          );
        }
      }
    }
  }

  if (data.city !== undefined) destination.city = data.city;
  if (data.country !== undefined) destination.country = data.country;
  destination.arrivalDate = arrival;
  destination.departureDate = departure;

  await destination.save();

  // Resync days after update
  await resyncDays(trip._id);

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

  // Pre-validate: Check if deleting this destination will orphan any day with activities
  const otherDestinations = await Destination.find({
    trip: trip._id,
    _id: { $ne: destination._id },
  });

  const remainingCoveredDates = new Set<string>();
  for (const dest of otherDestinations) {
    const cur = normalizeDate(dest.arrivalDate);
    const end = normalizeDate(dest.departureDate);
    while (cur <= end) {
      remainingCoveredDates.add(cur.toISOString().split('T')[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  const existingDays = await ItineraryDay.find({ trip: trip._id });
  for (const day of existingDays) {
    const dateKey = normalizeDate(day.date).toISOString().split('T')[0];
    if (!remainingCoveredDates.has(dateKey)) {
      const actCount = await Activity.countDocuments({
        trip: trip._id,
        itineraryDay: day._id,
      });
      if (actCount > 0) {
        throw createError(
          `Cannot delete destination "${destination.city}" because activities exist on date ${dateKey} which would no longer be covered by any destination. Please delete or move those activities first.`,
          400
        );
      }
    }
  }

  // Delete destination
  await Destination.findByIdAndDelete(destination._id);

  // Re-sequence remaining destinations contiguous (0..n-1) avoiding index collisions
  const remaining = await Destination.find({ trip: trip._id }).sort({ order: 1 });
  for (let i = 0; i < remaining.length; i++) {
    await Destination.findByIdAndUpdate(remaining[i]._id, { order: -(i + 1) });
  }
  for (let i = 0; i < remaining.length; i++) {
    await Destination.findByIdAndUpdate(remaining[i]._id, { order: i });
  }

  // Resync days after delete (removes empty uncovered days, reassigns boundary days if order shifted)
  await resyncDays(trip._id);

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

  // Resync days after reorder (reassigns shared boundary dates to the new later destination)
  await resyncDays(trip._id);

  return Destination.find({ trip: trip._id }).sort({ order: 1 });
};
