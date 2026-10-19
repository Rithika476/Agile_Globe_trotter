import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema, updateMeSchema } from '../validators/auth.validator';

const router = Router();

// Rate limiter for authentication endpoints:
// Allows up to 50 requests per 15 minutes, skips throttling in test environment
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again later.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validateBody(updateMeSchema), authController.updateMe);

export default router;
