import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as activityService from '../services/activity.service';

export const createActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activity = await activityService.createActivity(
      req.params.tripId,
      req.params.dayId,
      req.user!.id,
      req.body
    );
    res.status(201).json({
      status: 'success',
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activity = await activityService.updateActivity(
      req.params.tripId,
      req.params.id,
      req.user!.id,
      req.body
    );
    res.status(200).json({
      status: 'success',
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await activityService.deleteActivity(
      req.params.tripId,
      req.params.id,
      req.user!.id
    );
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
