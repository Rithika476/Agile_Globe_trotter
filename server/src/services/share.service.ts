import crypto from 'crypto';
import mongoose from 'mongoose';
import { Trip } from '../models/Trip';
import { TripShare } from '../models/TripShare';
import { Destination } from '../models/Destination';
import { ItineraryDay } from '../models/ItineraryDay';
import { Activity } from '../models/Activity';
import { getTripBudgetLive } from './budget.service';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

export const createOrRenewShare = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  // Generate 32-byte secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  // Remove or replace previous shares for this trip
  await TripShare.deleteMany({ trip: trip._id });

  const share = await TripShare.create({
    trip: trip._id,
    tokenHash,
    permissions: 'read',
    isActive: true,
  });

  return {
    shareToken: rawToken,
    shareUrl: `/shared/${rawToken}`,
    permissions: share.permissions,
    createdAt: share.createdAt,
  };
};

export const getShareStatus = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const share = await TripShare.findOne({ trip: trip._id, isActive: true });
  if (!share) {
    return { isActive: false };
  }

  return {
    isActive: true,
    permissions: share.permissions,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt || null,
  };
};

export const revokeShare = async (tripId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const trip = await Trip.findOne({ _id: tripId, owner: new mongoose.Types.ObjectId(userId) });
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  await TripShare.updateMany(
    { trip: trip._id, isActive: true },
    { isActive: false, revokedAt: new Date() }
  );

  return { success: true, message: 'Share link has been revoked.' };
};

export const getPublicSharedItinerary = async (rawToken: string) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw createError('Invalid or missing share token', 404);
  }

  const tokenHash = hashToken(rawToken);

  const share = await TripShare.findOne({ tokenHash, isActive: true });
  if (!share) {
    throw createError('Shared itinerary not found or link has expired', 404);
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError('Shared itinerary not found or link has expired', 404);
  }

  const trip = await Trip.findById(share.trip).select(
    'title startDate endDate estimatedBudget createdAt'
  );
  if (!trip) {
    throw createError('Shared itinerary not found', 404);
  }

  const destinations = await Destination.find({ trip: trip._id })
    .sort({ order: 1 })
    .select('city country arrivalDate departureDate order');

  const days = await ItineraryDay.find({ trip: trip._id })
    .sort({ date: 1 })
    .populate('destination', 'city country');

  const activities = await Activity.find({ trip: trip._id })
    .sort({ startTime: 1, createdAt: 1 })
    .select('title description location startTime endTime category estimatedCost itineraryDay');

  const daysWithActivities = days.map((day) => {
    const dayActivities = activities.filter(
      (act) => act.itineraryDay.toString() === day._id.toString()
    );
    return {
      _id: day._id,
      date: day.date,
      destination: day.destination,
      activities: dayActivities,
    };
  });

  const budgetSummary = await getTripBudgetLive(trip._id.toString());

  // Strictly sanitized read-only public view with no user or sensitive metadata
  return {
    title: trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    destinations,
    itineraryDays: daysWithActivities,
    budgetSummary,
  };
};
