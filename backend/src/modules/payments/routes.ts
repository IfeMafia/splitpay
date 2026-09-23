import { Router } from "express";
import * as paymentController from "./controller";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

const createPaymentSchema = z.object({
  projectId: z.string().uuid(),
  expectedAmount: z.number().positive(),
  currency: z.string().length(3),
  provider: z.string().min(1),
});

// Public checkout and verification routes
router.post("/calculate", paymentController.calculateFeePreview);
router.get("/link/:token", paymentController.getPaymentByToken);
router.post("/pay/:token/initialize", paymentController.initializePaystackPayment);

router.post("/initialize/:token", paymentController.initializePaystackPayment);
router.get("/verify/:reference", paymentController.verifyPaymentTransaction);

// Protected routes
router.use(authenticate);
router.post(
  "/link",
  validateBody(createPaymentSchema),
  paymentController.createPaymentLink,
);
router.get("/project/:projectId", paymentController.getProjectPayments);

export default router;
