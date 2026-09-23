import { Router } from 'express';
import * as paymentLinkController from './controller';
import { authenticate, requirePoolMember, requirePoolOwner } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createPaymentLinkSchema, updatePaymentLinkSchema, initializePaymentSchema } from './validators';

export const poolPaymentLinkRouter = Router({ mergeParams: true });

poolPaymentLinkRouter.get(
  '/',
  authenticate,
  requirePoolMember,
  paymentLinkController.getPaymentLinks,
);

poolPaymentLinkRouter.post(
  '/',
  authenticate,
  requirePoolOwner,
  validateBody(createPaymentLinkSchema),
  paymentLinkController.createPaymentLink,
);

poolPaymentLinkRouter.patch(
  '/:linkId',
  authenticate,
  requirePoolOwner,
  validateBody(updatePaymentLinkSchema),
  paymentLinkController.updatePaymentLink,
);

poolPaymentLinkRouter.delete(
  '/:linkId',
  authenticate,
  requirePoolOwner,
  paymentLinkController.deletePaymentLink,
);

export const publicPayRouter = Router();

publicPayRouter.get(
  '/:token',
  paymentLinkController.getCheckoutData,
);

publicPayRouter.post(
  '/:token/initialize',
  validateBody(initializePaymentSchema),
  paymentLinkController.initializePayment,
);
