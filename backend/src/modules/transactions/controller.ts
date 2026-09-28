import { Response, NextFunction } from 'express';
import * as transactionService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transactions = await transactionService.getPoolTransactions(req.params.poolId as string);
    res.status(200).json({ data: transactions });
  } catch (err) {
    next(err);
  }
}
