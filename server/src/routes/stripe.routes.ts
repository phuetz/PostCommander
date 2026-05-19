import { Router } from 'express';
import { createCheckoutSchema } from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCheckout,
  createPortal,
  getSubscriptionStatus,
  cancelUserSubscription,
  resumeUserSubscription,
  getInvoices,
  getPlansHandler,
} from '../controllers/stripe.controller.js';
import { emptyBodySchema, stripeCancelSchema } from '../schemas/routes.js';

const router = Router();

// Public endpoints
router.get('/plans', getPlansHandler);
router.use(authMiddleware);

// Checkout & Portal
router.post('/create-checkout', validate(createCheckoutSchema), createCheckout);
router.post('/create-portal', validate(emptyBodySchema), createPortal);

// Subscription management
router.get('/subscription', getSubscriptionStatus);
router.post('/cancel', validate(stripeCancelSchema), cancelUserSubscription);
router.post('/resume', validate(emptyBodySchema), resumeUserSubscription);


// Invoices
router.get('/invoices', getInvoices);

// NOTE: The webhook route is registered in app.ts with express.raw() middleware,
// NOT here, because it needs the raw body for signature verification.

export default router;
