import { Response, NextFunction } from 'express';
import * as payoutService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function triggerPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payouts = await payoutService.triggerPayoutsForPayment(req.body.paymentId);
    res.status(200).json({ data: payouts });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payouts = await payoutService.getPayoutsForPayment(req.params.paymentId as string);
    res.status(200).json({ data: payouts });
  } catch (err) {
    next(err);
  }
}

export async function requestWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const withdrawal = await payoutService.requestWithdrawal(req.body);
    res.status(201).json({ data: withdrawal });
  } catch (err) {
    next(err);
  }
}

export async function retryPayout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payout = await payoutService.retryPayoutTransaction(req.params.id as string);
    res.status(200).json({ data: payout });
  } catch (err) {
    next(err);
  }
}

