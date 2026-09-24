import { Request, Response, NextFunction } from "express";
import * as paymentService from "./service";
import { confirmPaymentTransaction } from "./ledger.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export async function createPaymentLink(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await paymentService.createPaymentLink(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function initializePaystackPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await paymentService.initializePaymentTransactionByToken(
      token,
      req.body,
    );
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function verifyPaymentTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reference = req.params.reference as string;
    const result = await confirmPaymentTransaction(reference);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentByToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payment = await paymentService.getPaymentByToken(
      req.params.token as string,
    );
    res.status(200).json({ data: payment });
  } catch (err) {
    next(err);
  }
}

export async function getProjectPayments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payments = await paymentService.getProjectPayments(
      req.params.projectId as string,
    );
    res.status(200).json({ data: payments });
  } catch (err) {
    next(err);
  }
}

export async function calculateFeePreview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { amount, platformFeePercent, providerFee, collaborators } = req.body;
    const breakdown = paymentService.calculateFeePreview({
      amount: Number(amount),
      platformFeePercent: Number(platformFeePercent || 0),
      providerFee: Number(providerFee || 0),
      collaborators: collaborators || [],
    });
    res.status(200).json({ data: breakdown });
  } catch (err) {
    next(err);
  }
}

