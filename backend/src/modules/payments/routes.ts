import { Router } from "express";
import * as paymentController from "./controller";
import { handleProviderWebhook } from "../webhooks/controller";
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

// Public checkout, verification, webhook, and callback routes
router.post("/calculate", paymentController.calculateFeePreview);
router.get("/link/:token", paymentController.getPaymentByToken);
router.post("/pay/:token/initialize", paymentController.initializePaystackPayment);

router.post("/initialize/:token", paymentController.initializePaystackPayment);
router.get("/verify/:reference", paymentController.verifyPaymentTransaction);

router.post("/webhook", (req, res, next) => {
  (req.params as Record<string, string>).provider = "paystack";
  handleProviderWebhook(req, res, next);
});

router.get("/callback", (req, res) => {
  const reference = (req.query.trxref || req.query.reference) as string;
  if (reference) {
    res.redirect(`/api/payments/verify/${reference}`);
  } else {
    res.status(400).json({ error: "Missing reference parameter in callback URL" });
  }
});

// Protected routes
router.use(authenticate);
router.post(
  "/link",
  validateBody(createPaymentSchema),
  paymentController.createPaymentLink,
);
router.get("/project/:projectId", paymentController.getProjectPayments);

export default router;
