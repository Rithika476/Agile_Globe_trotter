import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as tripController from '../controllers/trip.controller';
import * as destinationController from '../controllers/destination.controller';
import * as itineraryController from '../controllers/itinerary.controller';
import * as activityController from '../controllers/activity.controller';
import * as budgetController from '../controllers/budget.controller';
import * as shareController from '../controllers/share.controller';

import { createTripSchema, updateTripSchema } from '../validators/trip.validator';
import {
  createDestinationSchema,
  updateDestinationSchema,
  reorderDestinationsSchema,
} from '../validators/destination.validator';
import {
  createActivitySchema,
  updateActivitySchema,
} from '../validators/activity.validator';

const router = Router();

// Protect all trip-related routes with authentication
router.use(authenticate);

// -----------------------------------------------------------------------------
// Trip CRUD Routes
// -----------------------------------------------------------------------------
router.get('/', tripController.listTrips);
router.post('/', validateBody(createTripSchema), tripController.createTrip);
router.get('/:tripId', tripController.getTrip);
router.put('/:tripId', validateBody(updateTripSchema), tripController.updateTrip);
router.delete('/:tripId', tripController.deleteTrip);

// -----------------------------------------------------------------------------
// Destination Sub-routes
// -----------------------------------------------------------------------------
router.get('/:tripId/destinations', destinationController.getDestinations);
router.post(
  '/:tripId/destinations',
  validateBody(createDestinationSchema),
  destinationController.createDestination
);
// NOTE: Reorder must precede /:id to prevent route shadowing
router.put(
  '/:tripId/destinations/reorder',
  validateBody(reorderDestinationsSchema),
  destinationController.reorderDestinations
);
router.put(
  '/:tripId/destinations/:id',
  validateBody(updateDestinationSchema),
  destinationController.updateDestination
);
router.delete('/:tripId/destinations/:id', destinationController.deleteDestination);

// -----------------------------------------------------------------------------
// Itinerary Days Sub-routes
// -----------------------------------------------------------------------------
router.get('/:tripId/days', itineraryController.getDays);

// -----------------------------------------------------------------------------
// Activities Sub-routes
// -----------------------------------------------------------------------------
router.post(
  '/:tripId/days/:dayId/activities',
  validateBody(createActivitySchema),
  activityController.createActivity
);
router.put(
  '/:tripId/activities/:id',
  validateBody(updateActivitySchema),
  activityController.updateActivity
);
router.delete('/:tripId/activities/:id', activityController.deleteActivity);

// -----------------------------------------------------------------------------
// Budget Sub-route
// -----------------------------------------------------------------------------
router.get('/:tripId/budget', budgetController.getBudget);

// -----------------------------------------------------------------------------
// Sharing Sub-routes (Owner management)
// -----------------------------------------------------------------------------
router.post('/:tripId/share', shareController.createShare);
router.get('/:tripId/share', shareController.getShare);
router.delete('/:tripId/share', shareController.revokeShare);

export default router;
