import { Request, Response, NextFunction } from 'express';
import * as paymentLinkService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createPaymentLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const link = await paymentLinkService.createPaymentLink(req.params.poolId as string, req.user!.id, req.body);
    res.status(201).json({
      data: link,
      message: 'Payment link created successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentLinks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const links = await paymentLinkService.getPoolPaymentLinks(req.params.poolId as string);
    res.status(200).json({ data: links });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const link = await paymentLinkService.updatePaymentLink(
      req.params.poolId as string,
      req.params.linkId as string,
      req.user!.id,
      req.body,
    );
    res.status(200).json({
      data: link,
      message: 'Payment link updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePaymentLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await paymentLinkService.deletePaymentLink(req.params.poolId as string, req.params.linkId as string, req.user!.id);
    res.status(200).json({
      message: 'Payment link deactivated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getCheckoutData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await paymentLinkService.getPaymentLinkByToken(req.params.token as string);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function initializePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await paymentLinkService.initializePayment(req.params.token as string, req.body);
    res.status(200).json({
      data,
      message: 'Payment initialized successfully',
    });
  } catch (err) {
    next(err);
  }
}
