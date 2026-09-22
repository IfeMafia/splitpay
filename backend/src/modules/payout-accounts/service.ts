import { prisma } from '../../lib/prisma';
import { CreatePayoutAccountDto, PayoutAccountResponse } from './types';
import { AppError } from '../../middleware/errorHandler';

/**
 * TODO: Verify provider account ref with payment gateway (Stripe/Paystack/Flutterwave).
 * TODO: Handle setting as default account (unset previous default).
 */
export async function createPayoutAccount(userId: string, dto: CreatePayoutAccountDto): Promise<PayoutAccountResponse> {
  const account = await prisma.payoutAccount.create({
    data: {
      userId,
      provider: dto.provider,
      providerAccountRef: dto.providerAccountRef,
      country: dto.country,
      currency: dto.currency,
      isDefault: dto.isDefault ?? false,
    },
  });
  return account;
}

export async function getUserPayoutAccounts(userId: string): Promise<PayoutAccountResponse[]> {
  return prisma.payoutAccount.findMany({ where: { userId } });
}

export async function deletePayoutAccount(userId: string, accountId: string): Promise<void> {
  const account = await prisma.payoutAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new AppError(404, 'Payout account not found', 'NOT_FOUND');
  await prisma.payoutAccount.delete({ where: { id: accountId } });
}
