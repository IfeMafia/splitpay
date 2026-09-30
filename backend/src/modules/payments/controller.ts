import { Request, Response, NextFunction } from 'express';
import * as paymentService from './service';
import { confirmPaymentTransaction } from './ledger.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createPaymentLink(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Frontend sends { projectId, expectedAmount, currency, provider }
    // Map to service signature
    const { projectId, expectedAmount, currency, provider } = req.body;
    const result = await paymentService.createPaymentLink(req.user!.id, {
      projectId,
      expectedAmount: Number(expectedAmount),
      currency,
      provider,
    });
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
    const result = await paymentService.initializePaymentTransactionByToken(token, req.body);
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
    const payment = await paymentService.getPaymentByToken(req.params.token as string);
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
    const poolId = req.params.projectId as string;
    const payments = await paymentService.getProjectPayments(poolId);
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
    const { calculateFinancialChain } = await import('./ledger.service');
    const breakdown = calculateFinancialChain(
      Number(amount),
      Number(platformFeePercent ?? 0),
      Number(providerFee ?? 0),
      collaborators ?? [],
    );
    res.status(200).json({ data: breakdown });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { getPlatformRevenueSummary } = await import('./ledger.service');
    const { poolId, startDate, endDate } = req.query as {
      poolId?: string;
      startDate?: string;
      endDate?: string;
    };
    const report = await getPlatformRevenueSummary({
      poolId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    res.status(200).json({ data: report });
  } catch (err) {
    next(err);
  }
}

