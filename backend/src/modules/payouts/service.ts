import { prisma } from '../../lib/prisma';
import { PayoutTransactionResponse } from './types';
import { AppError } from '../../middleware/errorHandler';

/**
 * TODO: Read split ratio from `SplitSnapshot` associated with `paymentId`.
 * TODO: Calculate individual payout amounts for each confirmed collaborator.
 * TODO: Dispatch transfer calls to payment gateway API (Stripe Transfer / Paystack Transfer).
 * TODO: Record individual `PayoutTransaction` entries in PENDING status.
 */
export async function triggerPayoutsForPayment(paymentId: string): Promise<PayoutTransactionResponse[]> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');

  // TODO: implement full payout calculations and gateway transfer dispatching logic
  return [];
}

export async function getPayoutsForPayment(paymentId: string): Promise<PayoutTransactionResponse[]> {
  return prisma.payoutTransaction.findMany({ where: { paymentId } });
}

export async function getPayoutsForCollaborator(collaboratorId: string): Promise<PayoutTransactionResponse[]> {
  return prisma.payoutTransaction.findMany({ where: { collaboratorId } });
}

/**
 * TODO: Retry failed payout transfer with payment provider.
 */
export async function retryPayoutTransaction(payoutId: string): Promise<PayoutTransactionResponse> {
  const payout = await prisma.payoutTransaction.findUnique({ where: { id: payoutId } });
  if (!payout) throw new AppError(404, 'Payout transaction not found', 'NOT_FOUND');
  return payout;
}
