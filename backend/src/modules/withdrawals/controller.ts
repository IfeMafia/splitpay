import { Response, NextFunction } from 'express';
import * as withdrawalService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function requestWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const withdrawal = await withdrawalService.requestWithdrawal(
      req.params.poolId as string,
      req.user!.id,
      req.body,
    );
    res.status(201).json({
      data: withdrawal,
      message: 'Withdrawal requested successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getWithdrawals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const withdrawals = await withdrawalService.getPoolWithdrawals(
      req.params.poolId as string,
      req.user!.id,
      req.poolMember!.role,
    );
    res.status(200).json({ data: withdrawals });
  } catch (err) {
    next(err);
  }
}

export async function getWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const withdrawal = await withdrawalService.getWithdrawalById(
      req.params.poolId as string,
      req.params.withdrawalId as string,
      req.user!.id,
      req.poolMember!.role,
    );
    res.status(200).json({ data: withdrawal });
  } catch (err) {
    next(err);
  }
}
