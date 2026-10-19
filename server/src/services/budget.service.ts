import mongoose from 'mongoose';
import { Trip } from '../models/Trip';
import { Activity } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

const round2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const getTripBudgetLive = async (tripId: string, userId?: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError('Trip not found', 404);
  }

  const query: Record<string, unknown> = { _id: new mongoose.Types.ObjectId(tripId) };
  if (userId) {
    query.owner = new mongoose.Types.ObjectId(userId);
  }

  const trip = await Trip.findOne(query);
  if (!trip) {
    throw createError('Trip not found', 404);
  }

  const tripObjectId = trip._id as mongoose.Types.ObjectId;

  // Aggregate costs by category
  const categoryAgg = await Activity.aggregate([
    { $match: { trip: tripObjectId } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$estimatedCost' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Aggregate costs by itinerary day date
  const dayAgg = await Activity.aggregate([
    { $match: { trip: tripObjectId } },
    {
      $lookup: {
        from: 'itinerarydays',
        localField: 'itineraryDay',
        foreignField: '_id',
        as: 'day',
      },
    },
    { $unwind: '$day' },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$day.date' } },
        total: { $sum: '$estimatedCost' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let totalEstimated = 0;
  for (const c of categoryAgg) {
    totalEstimated += c.total;
  }
  totalEstimated = round2(totalEstimated);

  const estimatedBudget = round2(trip.estimatedBudget || 0);
  const remaining = round2(estimatedBudget - totalEstimated);
  const overBudget = totalEstimated > estimatedBudget;
  const overBy = overBudget ? round2(totalEstimated - estimatedBudget) : 0;

  const byCategory = categoryAgg.map((c) => ({
    category: c._id,
    total: round2(c.total),
    percent: totalEstimated > 0 ? round2((c.total / totalEstimated) * 100) : 0,
  }));

  const byDay = dayAgg.map((d) => ({
    date: d._id,
    total: round2(d.total),
  }));

  return {
    estimatedBudget,
    totalEstimated,
    remaining,
    overBudget,
    overBy,
    byCategory,
    byDay,
  };
};
