import { Response, NextFunction } from 'express';
import * as poolService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createPool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pool = await poolService.createPool(req.user!.id, req.body);
    res.status(201).json({
      data: pool,
      message: 'Pool created successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPools(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pools = await poolService.getUserPools(req.user!.id);
    res.status(200).json({ data: pools });
  } catch (err) {
    next(err);
  }
}

export async function getPool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pool = await poolService.getPoolById(req.params.poolId as string);
    res.status(200).json({ data: pool });
  } catch (err) {
    next(err);
  }
}

export async function updatePool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pool = await poolService.updatePool(req.params.poolId as string, req.user!.id, req.body);
    res.status(200).json({
      data: pool,
      message: 'Pool updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await poolService.deletePool(req.params.poolId as string, req.user!.id);
    res.status(200).json({
      message: 'Pool archived successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await poolService.getPoolMembers(req.params.poolId as string);
    res.status(200).json({ data: members });
  } catch (err) {
    next(err);
  }
}

export async function addMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await poolService.addPoolMember(req.params.poolId as string, req.user!.id, req.body);
    res.status(201).json({
      data: member,
      message: 'Member added successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await poolService.removePoolMember(req.params.poolId as string, req.params.memberId as string, req.user!.id);
    res.status(200).json({
      message: 'Member removed successfully',
    });
  } catch (err) {
    next(err);
  }
}
