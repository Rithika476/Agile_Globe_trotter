import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as tripService from '../services/trip.service';

export const listTrips = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trips = await tripService.listUserTrips(req.user!.id);
    res.status(200).json({
      status: 'success',
      data: { trips },
    });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await tripService.createTrip(req.user!.id, req.body);
    res.status(201).json({
      status: 'success',
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await tripService.getTripById(req.params.tripId, req.user!.id);
    res.status(200).json({
      status: 'success',
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await tripService.updateTrip(req.params.tripId, req.user!.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await tripService.deleteTripCascade(req.params.tripId, req.user!.id);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
