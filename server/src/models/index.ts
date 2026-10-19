/**
 * ==============================================================================
 * Globe Trotter - Mongoose Models Registry
 *
 * CASCADE-DELETE RULE (ARCHITECTURAL SPECIFICATION):
 * Deleting a Trip MUST cascade-delete all child documents referencing that trip:
 *   - Destinations (Destination.deleteMany({ trip: tripId }))
 *   - ItineraryDays (ItineraryDay.deleteMany({ trip: tripId }))
 *   - Activities (Activity.deleteMany({ trip: tripId }))
 *   - TripShares (TripShare.deleteMany({ trip: tripId }))
 *
 * NOTE: This cascade deletion logic will be implemented in the trip delete
 * service in Phase 5 (trip CRUD). It is deliberately NOT executed automatically
 * in Mongoose middleware hooks here to keep deletions explicit, testable,
 * and controllable within transactional service boundaries.
 * ==============================================================================
 */

export * from './User';
export * from './Trip';
export * from './Destination';
export * from './ItineraryDay';
export * from './Activity';
export * from './TripShare';
