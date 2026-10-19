import mongoose from 'mongoose';
import { Trip } from '../models/Trip';
import { ItineraryDay } from '../models/ItineraryDay';
import { Activity } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

export const getTripItineraryDays = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const days = await ItineraryDay.find({ trip: trip._id })
    .sort({ date: 1 })
    .populate('destination', 'city country arrivalDate departureDate order');

  const activities = await Activity.find({ trip: trip._id }).sort({ startTime: 1, createdAt: 1 });

  return days.map((day) => {
    const dayActivities = activities.filter(
      (a) => a.itineraryDay.toString() === day._id.toString()
    );
    return {
      ...day.toObject(),
      activities: dayActivities,
    };
  });
};
