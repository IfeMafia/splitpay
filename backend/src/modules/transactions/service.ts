import { prisma } from '../../lib/prisma';
import { TransactionResponse } from '../../contracts';

export async function getPoolTransactions(poolId: string): Promise<TransactionResponse[]> {
  const transactions = await prisma.transaction.findMany({
    where: { poolId },
    orderBy: { createdAt: 'desc' },
  });

  return transactions.map((t) => ({
    id: t.id,
    poolId: t.poolId,
    paymentLinkId: t.paymentLinkId,
    amount: Number(t.amount),
    currency: t.currency,
    provider: t.provider,
    providerReference: t.providerReference,
    status: t.status,
    payerEmail: t.payerEmail,
    payerName: t.payerName,
    paidAt: t.paidAt,
    createdAt: t.createdAt,
  }));
}
