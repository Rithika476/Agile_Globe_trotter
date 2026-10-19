import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as destinationService from '../services/destination.service';

export const getDestinations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const destinations = await destinationService.getTripDestinations(
      req.params.tripId,
      req.user!.id
    );
    res.status(200).json({
      status: 'success',
      data: { destinations },
    });
  } catch (error) {
    next(error);
  }
};

export const createDestination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const destination = await destinationService.createDestination(
      req.params.tripId,
      req.user!.id,
      req.body
    );
    res.status(201).json({
      status: 'success',
      data: { destination },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDestination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const destination = await destinationService.updateDestination(
      req.params.tripId,
      req.params.id,
      req.user!.id,
      req.body
    );
    res.status(200).json({
      status: 'success',
      data: { destination },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDestination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await destinationService.deleteDestination(
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

export const reorderDestinations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const destinations = await destinationService.reorderDestinations(
      req.params.tripId,
      req.user!.id,
      req.body.destinationIds
    );
    res.status(200).json({
      status: 'success',
      data: { destinations },
    });
  } catch (error) {
    next(error);
  }
};
