import { z } from 'zod';
import { objectIdSchema } from './common.validator';

export const createDestinationSchema = z
  .object({
    city: z.string().trim().min(1, 'City is required'),
    country: z.string().trim().min(1, 'Country is required'),
    arrivalDate: z.string().or(z.date()).transform((val) => new Date(val)),
    departureDate: z.string().or(z.date()).transform((val) => new Date(val)),
  })
  .refine(
    (data) => {
      return data.departureDate >= data.arrivalDate;
    },
    {
      message: 'Departure date must be on or after arrival date',
      path: ['departureDate'],
    }
  );

export const updateDestinationSchema = z
  .object({
    city: z.string().trim().min(1, 'City cannot be empty').optional(),
    country: z.string().trim().min(1, 'Country cannot be empty').optional(),
    arrivalDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    departureDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  })
  .refine(
    (data) => {
      if (data.arrivalDate && data.departureDate) {
        return data.departureDate >= data.arrivalDate;
      }
      return true;
    },
    {
      message: 'Departure date must be on or after arrival date',
      path: ['departureDate'],
    }
  );

export const reorderDestinationsSchema = z.object({
  destinationIds: z.array(objectIdSchema).min(1, 'Must provide at least one destination ID'),
});
