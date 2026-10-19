import { Router } from 'express';
import * as shareController from '../controllers/share.controller';

const router = Router();

// Public route to view a shared itinerary without requiring authentication
router.get('/:token', shareController.getPublicSharedItinerary);

export default router;
