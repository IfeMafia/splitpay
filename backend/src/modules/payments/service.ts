import { prisma } from '../../lib/prisma';
import { CreatePaymentLinkDto, PaymentResponse } from './types';
import { AppError } from '../../middleware/errorHandler';
import crypto from 'crypto';

/**
 * TODO: Integrate payment gateway API (Stripe Checkout Session / Paystack Transaction Init).
 * TODO: Freeze current project collaborator split percentages by writing to `SplitSnapshot` table.
 */
export async function createPaymentLink(dto: CreatePaymentLinkDto): Promise<{ payment: PaymentResponse; checkoutUrl: string }> {
  const token = crypto.randomBytes(16).toString('hex');

  const payment = await prisma.payment.create({
    data: {
      projectId: dto.projectId,
      paymentLinkToken: token,
      expectedAmount: dto.expectedAmount,
      currency: dto.currency,
      provider: dto.provider,
    },
  });

  // TODO: Call payment provider SDK to get checkout URL
  const checkoutUrl = `https://checkout.provider.com/pay/${token}`;

  return { payment, checkoutUrl };
}

export async function getPaymentByToken(token: string): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({ where: { paymentLinkToken: token } });
  if (!payment) throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  return payment;
}

export async function getProjectPayments(projectId: string): Promise<PaymentResponse[]> {
  return prisma.payment.findMany({ where: { projectId } });
}
