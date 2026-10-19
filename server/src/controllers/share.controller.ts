import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as shareService from '../services/share.service';

export const createShare = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await shareService.createOrRenewShare(
      req.params.tripId,
      req.user!.id
    );
    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getShare = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await shareService.getShareStatus(
      req.params.tripId,
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

export const revokeShare = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await shareService.revokeShare(
      req.params.tripId,
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

export const getPublicSharedItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const itinerary = await shareService.getPublicSharedItinerary(req.params.token);
    res.status(200).json({
      status: 'success',
      data: { itinerary },
    });
  } catch (error) {
    next(error);
  }
};
