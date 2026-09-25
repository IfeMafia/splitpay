import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { initializePaystackTransaction } from '../../lib/paystack';
import { PaymentLinkResponse, CreatePaymentLinkDto, InitializePaymentDto } from './types';
import { PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { generateShortToken, generateDigitCode, generateCharToken } from '../../utils/token';

/**
 * Maps a PaymentLink (+ optional latest Transaction) to the unified response shape
 * the frontend and Tobi's docs expect.
 */
function mapPaymentLink(
  link: {
    id: string;
    poolId: string;
    token: string;
    title: string;
    amount: any;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    transactions?: Array<{
      id: string;
      status: PaymentStatus;
      providerReference: string | null;
      amount: any;
      payerEmail: string | null;
      paidAt: Date | null;
    }>;
  }
): PaymentLinkResponse {
  // Pick the most relevant transaction (SUCCESSFUL first, then latest)
  const txns = link.transactions ?? [];
  const successTxn = txns.find(t => t.status === PaymentStatus.SUCCESSFUL);
  const latestTxn = txns[0];
  const activeTxn = successTxn ?? latestTxn ?? null;

  const isPaid = activeTxn?.status === PaymentStatus.SUCCESSFUL;

  return {
    id: link.id,
    poolId: link.poolId,
    projectId: link.poolId,           // alias for frontend
    token: link.token,
    paymentLinkToken: link.token,     // alias for frontend
    title: link.title,
    amount: Number(link.amount),
    expectedAmount: Number(link.amount),
    currency: link.currency,
    provider: 'paystack',
    isActive: link.isActive,
    status: isPaid ? 'SUCCESSFUL' : 'PENDING',
    transactionStatus: activeTxn?.status ?? null,
    providerReference: activeTxn?.providerReference ?? null,
    actualAmount: activeTxn && isPaid ? Number(activeTxn.amount) : null,
    paidAt: activeTxn?.paidAt ?? null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

/**
 * Create a shareable PaymentLink for a pool.
 * Body: { projectId, expectedAmount, currency, provider }  (frontend shape)
 */
export async function createPaymentLink(dto: {
  projectId: string;
  expectedAmount: number;
  currency: string;
  provider?: string;
}): Promise<{ payment: PaymentLinkResponse; checkoutUrl: string }> {
  const pool = await prisma.pool.findUnique({ where: { id: dto.projectId } });
  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');

  let tokenCode = generateCharToken(3);
  let existingToken = await prisma.paymentLink.findUnique({ where: { token: tokenCode } });
  let attempts = 0;
  while (existingToken && attempts < 15) {
    tokenCode = generateCharToken(3);
    existingToken = await prisma.paymentLink.findUnique({ where: { token: tokenCode } });
    attempts++;
  }
  const token = existingToken ? `${tokenCode}-${crypto.randomBytes(2).toString('hex')}` : tokenCode;

  const link = await prisma.paymentLink.create({
    data: {
      poolId: dto.projectId,
      token,
      title: `Payment for ${pool.name}`,
      amount: dto.expectedAmount,
      currency: dto.currency.toUpperCase(),
    },
  });

  const payment = mapPaymentLink({ ...link, transactions: [] });
  const checkoutUrl = `/pay/${token}`;

  return { payment, checkoutUrl };
}

/**
 * Fetch public payment link details by token.
 * Used by the public checkout page.
 */
export async function getPaymentByToken(token: string): Promise<PaymentLinkResponse> {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
  if (!link) throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  if (!link.isActive) throw new AppError(410, 'This payment link is no longer active', 'LINK_INACTIVE');
  return mapPaymentLink(link);
}

/**
 * Initialize a Paystack checkout for a payment link.
 * Creates a pending Transaction and returns the Paystack authorization URL.
 */
export async function initializePaymentTransactionByToken(
  token: string,
  dto: InitializePaymentDto
): Promise<{ authorizationUrl: string; reference: string; payment: PaymentLinkResponse }> {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      pool: true,
      transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!link) throw new AppError(404, 'Payment link not found', 'NOT_FOUND');
  if (!link.isActive) throw new AppError(410, 'This payment link is no longer active', 'LINK_INACTIVE');

  // Prevent double-payment
  const existingSuccess = link.transactions.find(t => t.status === PaymentStatus.SUCCESSFUL);
  if (existingSuccess) {
    throw new AppError(400, 'This payment link has already been paid', 'ALREADY_PAID');
  }

  const reference = `sp_${link.id.slice(0, 8)}_${Date.now()}`;

  // Initialize with Paystack (real API or mock in dev)
  const paystackInit = await initializePaystackTransaction({
    email: dto.email || 'client@splitpay.com',
    amountInNaira: Number(link.amount),
    reference,
    callbackUrl: dto.callbackUrl,
    metadata: {
      paymentLinkId: link.id,
      poolId: link.poolId,
      token,
    },
  });

  // Create a pending Transaction record
  await prisma.transaction.create({
    data: {
      poolId: link.poolId,
      paymentLinkId: link.id,
      amount: link.amount,
      currency: link.currency,
      provider: 'paystack',
      providerReference: paystackInit.reference,
      status: PaymentStatus.PENDING,
      payerEmail: dto.email,
    },
  });

  const payment = mapPaymentLink(link);

  return {
    authorizationUrl: paystackInit.authorizationUrl,
    reference: paystackInit.reference,
    payment,
  };
}

/**
 * Get all payment links for a pool, including transaction status.
 */
export async function getProjectPayments(poolId: string): Promise<PaymentLinkResponse[]> {
  const links = await prisma.paymentLink.findMany({
    where: { poolId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return links.map(mapPaymentLink);
}

export { calculateFinancialChain, type FinancialChainBreakdown } from './ledger.service';
