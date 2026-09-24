import { prisma } from '../../lib/prisma';
import { CreatePaymentLinkDto, InitializePaymentDto, PaymentResponse } from './types';
import { AppError } from '../../middleware/errorHandler';
import { initializePaystackTransaction } from '../../lib/paystack';
import crypto from 'crypto';

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

  const checkoutUrl = `/pay/${token}`;

  return { payment, checkoutUrl };
}

export async function initializePaymentTransactionByToken(
  token: string,
  dto: InitializePaymentDto
): Promise<{ authorizationUrl: string; reference: string; payment: PaymentResponse }> {
  const payment = await prisma.payment.findUnique({
    where: { paymentLinkToken: token },
    include: { project: true },
  });

  if (!payment) {
    throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  }

  if (payment.status === 'SUCCESSFUL') {
    throw new AppError(400, 'Payment has already been completed', 'ALREADY_PAID');
  }

  const reference = `sp_${payment.id.slice(0, 8)}_${Date.now()}`;
  const clientEmail = dto.email || payment.project.clientEmail || 'client@splitpay.com';

  const paystackInit = await initializePaystackTransaction({
    email: clientEmail,
    amountInNaira: Number(payment.expectedAmount),
    reference,
    callbackUrl: dto.callbackUrl,
    metadata: {
      paymentId: payment.id,
      projectId: payment.projectId,
      token,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerReference: reference },
  });

  return {
    authorizationUrl: paystackInit.authorizationUrl,
    reference: paystackInit.reference,
    payment,
  };
}

export async function getPaymentByToken(token: string): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({ where: { paymentLinkToken: token } });
  if (!payment) throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  return payment;
}

import { calculateFinancialChain, FinancialChainBreakdown } from './ledger.service';

export async function getProjectPayments(projectId: string): Promise<PaymentResponse[]> {
  return prisma.payment.findMany({ where: { projectId } });
}

export function calculateFeePreview(params: {
  amount: number;
  platformFeePercent?: number;
  providerFee?: number;
  collaborators?: Array<{ id: string; userId: string | null; role: string; splitPercentage: number }>;
}): FinancialChainBreakdown {
  const defaultProviderFee = params.providerFee || params.amount * 0.015;
  return calculateFinancialChain(
    params.amount,
    params.platformFeePercent || 0,
    defaultProviderFee,
    params.collaborators || []
  );
}

