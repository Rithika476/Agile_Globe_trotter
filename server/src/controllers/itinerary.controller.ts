import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as itineraryService from '../services/itinerary.service';

export const getDays = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = await itineraryService.getTripItineraryDays(
      req.params.tripId,
      req.user!.id
    );
    res.status(200).json({
      status: 'success',
      data: { days },
    });
  } catch (error) {
    next(error);
  }
};
