import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreatePaymentLinkDto, UpdatePaymentLinkDto, InitializePaymentDto } from './validators';
import { PaymentLinkResponse } from '../../contracts';
import { PaymentStatus } from '@prisma/client';
import { generateShortToken, generateDigitCode, generateCharToken } from '../../utils/token';

async function generateLinkToken(): Promise<string> {
  let code = generateCharToken(3);
  let existing = await prisma.paymentLink.findUnique({ where: { token: code } });
  let attempts = 0;
  while (existing && attempts < 15) {
    code = generateCharToken(3);
    existing = await prisma.paymentLink.findUnique({ where: { token: code } });
    attempts++;
  }
  return existing ? `${code}-${crypto.randomBytes(2).toString('hex')}` : code;
}

export async function createPaymentLink(
  poolId: string,
  userId: string,
  dto: CreatePaymentLinkDto,
): Promise<PaymentLinkResponse> {
  const token = await generateLinkToken();

  const link = await prisma.paymentLink.create({
    data: {
      poolId,
      token,
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'PAYMENT_LINK',
      entityId: link.id,
      action: 'PAYMENT_LINK_CREATED',
      actorId: userId,
      metadata: { poolId, title: link.title, amount: Number(link.amount) },
    },
  });

  return {
    id: link.id,
    poolId: link.poolId,
    token: link.token,
    title: link.title,
    description: link.description,
    amount: Number(link.amount),
    currency: link.currency,
    isActive: link.isActive,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export async function getPoolPaymentLinks(poolId: string): Promise<PaymentLinkResponse[]> {
  const links = await prisma.paymentLink.findMany({
    where: { poolId },
    orderBy: { createdAt: 'desc' },
  });

  return links.map((l) => ({
    id: l.id,
    poolId: l.poolId,
    token: l.token,
    title: l.title,
    description: l.description,
    amount: Number(l.amount),
    currency: l.currency,
    isActive: l.isActive,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }));
}

export async function updatePaymentLink(
  poolId: string,
  linkId: string,
  userId: string,
  dto: UpdatePaymentLinkDto,
): Promise<PaymentLinkResponse> {
  const existing = await prisma.paymentLink.findUnique({
    where: { id: linkId },
  });

  if (!existing || existing.poolId !== poolId) {
    throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  }

  const updated = await prisma.paymentLink.update({
    where: { id: linkId },
    data: {
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      isActive: dto.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'PAYMENT_LINK',
      entityId: linkId,
      action: 'PAYMENT_LINK_UPDATED',
      actorId: userId,
      metadata: dto,
    },
  });

  return {
    id: updated.id,
    poolId: updated.poolId,
    token: updated.token,
    title: updated.title,
    description: updated.description,
    amount: Number(updated.amount),
    currency: updated.currency,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function deletePaymentLink(poolId: string, linkId: string, userId: string): Promise<void> {
  const existing = await prisma.paymentLink.findUnique({
    where: { id: linkId },
  });

  if (!existing || existing.poolId !== poolId) {
    throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  }

  await prisma.paymentLink.update({
    where: { id: linkId },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'PAYMENT_LINK',
      entityId: linkId,
      action: 'PAYMENT_LINK_DEACTIVATED',
      actorId: userId,
    },
  });
}

export async function getPaymentLinkByToken(token: string) {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      pool: {
        select: {
          id: true,
          name: true,
          description: true,
          currency: true,
        },
      },
    },
  });

  if (!link) {
    throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  }

  if (!link.isActive) {
    throw new AppError(410, 'This payment link has been deactivated', 'PAYMENT_LINK_INACTIVE');
  }

  return {
    id: link.id,
    token: link.token,
    title: link.title,
    description: link.description,
    amount: Number(link.amount),
    currency: link.currency,
    pool: link.pool,
  };
}

export async function initializePayment(token: string, dto: InitializePaymentDto) {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: { pool: true },
  });

  if (!link || !link.isActive) {
    throw new AppError(400, 'Payment link is not valid or has been deactivated', 'PAYMENT_LINK_INACTIVE');
  }

  const reference = `SPLIT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Create internal pending transaction
  const transaction = await prisma.$transaction(async (tx) => {
    const newTx = await tx.transaction.create({
      data: {
        poolId: link.poolId,
        paymentLinkId: link.id,
        amount: link.amount,
        currency: link.currency,
        provider: 'paystack',
        providerReference: reference,
        status: PaymentStatus.PENDING,
        payerEmail: dto.payerEmail.toLowerCase(),
        payerName: dto.payerName,
      },
    });

    await tx.transactionEvent.create({
      data: {
        transactionId: newTx.id,
        eventType: 'PAYMENT_INITIALIZED',
        data: {
          payerEmail: dto.payerEmail,
          payerName: dto.payerName,
          reference,
        },
      },
    });

    return newTx;
  });

  return {
    transactionId: transaction.id,
    reference,
    amount: Number(link.amount),
    // Amount in minor units (e.g. kobo/cents) for Paystack
    amountMinor: Math.round(Number(link.amount) * 100),
    currency: link.currency,
    payerEmail: dto.payerEmail,
    payerName: dto.payerName,
    poolName: link.pool.name,
  };
}
