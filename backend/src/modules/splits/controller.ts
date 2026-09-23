import { Response, NextFunction } from 'express';
import * as splitService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getSplitConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await splitService.getSplitConfig(req.params.poolId as string);
    res.status(200).json({ data: config });
  } catch (err) {
    next(err);
  }
}

export async function configureSplit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await splitService.configureSplit(req.params.poolId as string, req.user!.id, req.body);
    res.status(200).json({
      data: config,
      message: 'Split configuration updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllocations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const allocations = await splitService.getPoolAllocations(req.params.poolId as string);
    res.status(200).json({ data: allocations });
  } catch (err) {
    next(err);
  }
}

export async function getBalance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const balance = await splitService.getPoolBalance(req.params.poolId as string);
    res.status(200).json({ data: balance });
  } catch (err) {
    next(err);
  }
}
