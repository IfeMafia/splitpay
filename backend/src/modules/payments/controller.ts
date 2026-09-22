import { Request, Response, NextFunction } from 'express';
import * as paymentService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createPaymentLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentService.createPaymentLink(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await paymentService.getPaymentByToken(req.params.token as string);
    res.status(200).json({ data: payment });
  } catch (err) {
    next(err);
  }
}

export async function getProjectPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payments = await paymentService.getProjectPayments(req.params.projectId as string);
    res.status(200).json({ data: payments });
  } catch (err) {
    next(err);
  }
}
