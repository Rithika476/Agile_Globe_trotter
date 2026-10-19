import mongoose from 'mongoose';
import { Trip, ITrip } from '../models/Trip';
import { Destination } from '../models/Destination';
import { ItineraryDay } from '../models/ItineraryDay';
import { Activity } from '../models/Activity';
import { TripShare } from '../models/TripShare';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

export const listUserTrips = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const trips = await Trip.aggregate([
    { $match: { owner: userObjectId } },
    { $sort: { startDate: 1 } },
    {
      $lookup: {
        from: 'destinations',
        localField: '_id',
        foreignField: 'trip',
        as: 'destinations',
      },
    },
    {
      $lookup: {
        from: 'activities',
        localField: '_id',
        foreignField: 'trip',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        startDate: 1,
        endDate: 1,
        estimatedBudget: 1,
        createdAt: 1,
        updatedAt: 1,
        destinationCount: { $size: '$destinations' },
        totalEstimatedCost: {
          $round: [{ $sum: '$activities.estimatedCost' }, 2],
        },
      },
    },
  ]);

  return trips;
};

export const createTrip = async (
  userId: string,
  data: { title: string; startDate: Date; endDate: Date; estimatedBudget?: number }
) => {
  const trip = await Trip.create({
    owner: new mongoose.Types.ObjectId(userId),
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate,
    estimatedBudget: data.estimatedBudget || 0,
  });

  return trip;
};

export const getTripById = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({
    _id: tripId,
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!trip) {
    // Return 404 for trips belonging to others or non-existent
    throw createError('Trip not found', 404);
  }

  // Fetch destinations sorted by order
  const destinations = await Destination.find({ trip: trip._id }).sort({ order: 1 });

  // Fetch itinerary days sorted by date with their activities
  const days = await ItineraryDay.find({ trip: trip._id })
    .sort({ date: 1 })
    .populate('destination', 'city country');

  // Fetch activities for each day sorted by startTime
  const activities = await Activity.find({ trip: trip._id }).sort({ startTime: 1, createdAt: 1 });

  // Group activities by itineraryDay
  const daysWithActivities = days.map((day) => {
    const dayActivities = activities.filter(
      (act) => act.itineraryDay.toString() === day._id.toString()
    );
    return {
      ...day.toObject(),
      activities: dayActivities,
    };
  });

  return {
    ...trip.toObject(),
    destinations,
    itineraryDays: daysWithActivities,
  };
};

export const updateTrip = async (
  tripId: string,
  userId: string,
  data: { title?: string; startDate?: Date; endDate?: Date; estimatedBudget?: number }
) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({
    _id: tripId,
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const newStartDate = data.startDate || trip.startDate;
  const newEndDate = data.endDate || trip.endDate;

  if (newEndDate < newStartDate) {
    throw createError('End date must be on or after start date', 400);
  }

  // Architectural Decision: When trip dates shrink, verify existing destinations stay valid
  if (data.startDate || data.endDate) {
    const outOfBounds = await Destination.find({
      trip: trip._id,
      $or: [
        { arrivalDate: { $lt: newStartDate } },
        { departureDate: { $gt: newEndDate } },
      ],
    });

    if (outOfBounds.length > 0) {
      const cities = outOfBounds.map((d) => d.city).join(', ');
      throw createError(
        `Cannot change trip dates: Destination(s) [${cities}] fall outside the new window (${newStartDate.toISOString().split('T')[0]} to ${newEndDate.toISOString().split('T')[0]}). Please update or remove destination dates first.`,
        400
      );
    }
  }

  if (data.title !== undefined) trip.title = data.title;
  if (data.startDate !== undefined) trip.startDate = data.startDate;
  if (data.endDate !== undefined) trip.endDate = data.endDate;
  if (data.estimatedBudget !== undefined) trip.estimatedBudget = data.estimatedBudget;

  await trip.save();
  return trip;
};

/**
 * Service function to delete a Trip and cascade-delete all child records:
 * Destinations, ItineraryDays, Activities, and TripShares.
 */
export const deleteTripCascade = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({
    _id: tripId,
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!trip) {
    throw createError('Trip not found', 404);
  }

  // Execute ordered cascade deletions
  await Activity.deleteMany({ trip: trip._id });
  await ItineraryDay.deleteMany({ trip: trip._id });
  await Destination.deleteMany({ trip: trip._id });
  await TripShare.deleteMany({ trip: trip._id });
  await Trip.findByIdAndDelete(trip._id);

  return {
    success: true,
    message: 'Trip and all associated itinerary items deleted successfully',
    tripId,
  };
};
