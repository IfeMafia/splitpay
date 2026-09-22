import { Response, NextFunction } from 'express';
import * as payoutAccountService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await payoutAccountService.createPayoutAccount(req.user!.id, req.body);
    res.status(201).json({ data: account });
  } catch (err) {
    next(err);
  }
}

export async function getAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const accounts = await payoutAccountService.getUserPayoutAccounts(req.user!.id);
    res.status(200).json({ data: accounts });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await payoutAccountService.deletePayoutAccount(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
