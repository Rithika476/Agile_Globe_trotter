import mongoose from 'mongoose';
import { Trip } from '../models/Trip';
import { ItineraryDay } from '../models/ItineraryDay';
import { Activity, ActivityCategory } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

const isSameCalendarDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
};

export const createActivity = async (
  tripId: string,
  dayId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    category?: ActivityCategory;
    estimatedCost?: number;
  }
) => {
  if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(dayId)) {
    throw createError('Resource not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const day = await ItineraryDay.findOne({ _id: dayId, trip: trip._id });
  if (!day) {
    throw createError('Itinerary day not found', 404);
  }

  // Time validations
  if (data.startTime) {
    if (!isSameCalendarDay(data.startTime, day.date)) {
      throw createError(
        `Activity start time must fall on the itinerary day's date (${day.date.toISOString().split('T')[0]})`,
        400
      );
    }
  }

  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    throw createError('End time must be after start time', 400);
  }

  const activity = await Activity.create({
    trip: trip._id,
    itineraryDay: day._id,
    title: data.title,
    description: data.description,
    location: data.location,
    startTime: data.startTime,
    endTime: data.endTime,
    category: data.category || 'other',
    estimatedCost: data.estimatedCost || 0,
  });

  return activity;
};

export const updateActivity = async (
  tripId: string,
  activityId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    category?: ActivityCategory;
    estimatedCost?: number;
  }
) => {
  if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(activityId)) {
    throw createError('Resource not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const activity = await Activity.findOne({ _id: activityId, trip: trip._id });
  if (!activity) {
    throw createError('Activity not found', 404);
  }

  const day = await ItineraryDay.findById(activity.itineraryDay);
  if (!day) {
    throw createError('Associated itinerary day not found', 404);
  }

  const newStart = data.startTime !== undefined ? data.startTime : activity.startTime;
  const newEnd = data.endTime !== undefined ? data.endTime : activity.endTime;

  if (newStart && !isSameCalendarDay(newStart, day.date)) {
    throw createError(
      `Activity start time must fall on the itinerary day's date (${day.date.toISOString().split('T')[0]})`,
      400
    );
  }

  if (newStart && newEnd && newEnd <= newStart) {
    throw createError('End time must be after start time', 400);
  }

  if (data.title !== undefined) activity.title = data.title;
  if (data.description !== undefined) activity.description = data.description;
  if (data.location !== undefined) activity.location = data.location;
  if (data.startTime !== undefined) activity.startTime = data.startTime;
  if (data.endTime !== undefined) activity.endTime = data.endTime;
  if (data.category !== undefined) activity.category = data.category;
  if (data.estimatedCost !== undefined) activity.estimatedCost = data.estimatedCost;

  await activity.save();
  return activity;
};

export const deleteActivity = async (tripId: string, activityId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(activityId)) {
    throw createError('Resource not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const activity = await Activity.findOneAndDelete({ _id: activityId, trip: trip._id });
  if (!activity) {
    throw createError('Activity not found', 404);
  }

  return { success: true, message: 'Activity deleted successfully' };
};
