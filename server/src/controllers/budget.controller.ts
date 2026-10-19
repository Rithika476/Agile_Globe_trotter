import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as budgetService from '../services/budget.service';

export const getBudget = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const budget = await budgetService.getTripBudgetLive(
      req.params.tripId,
      req.user!.id
    );
    res.status(200).json({
      status: 'success',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};
