import { z } from 'zod';

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)),
    estimatedBudget: z.number().min(0, 'Estimated budget cannot be negative').optional().default(0),
  })
  .refine(
    (data) => {
      return data.endDate >= data.startDate;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const updateTripSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').optional(),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    estimatedBudget: z.number().min(0, 'Estimated budget cannot be negative').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );
