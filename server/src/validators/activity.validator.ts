import { z } from 'zod';

const activityCategories = [
  'transport',
  'accommodation',
  'food',
  'sightseeing',
  'activities',
  'shopping',
  'other',
] as const;

export const createActivitySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().optional(),
    location: z.string().trim().optional(),
    startTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    category: z.enum(activityCategories).default('other'),
    estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional().default(0),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').optional(),
    description: z.string().trim().optional(),
    location: z.string().trim().optional(),
    startTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    category: z.enum(activityCategories).optional(),
    estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );
