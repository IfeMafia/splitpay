import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { PayoutTransactionResponse } from './types';
import { initiatePaystackTransfer, createPaystackTransferRecipient } from '../../lib/paystack';


export async function requestWithdrawal(params: {
  collaboratorId: string;
  amount: number;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
}): Promise<PayoutTransactionResponse> {
  const collaborator = await prisma.collaborator.findUnique({
    where: { id: params.collaboratorId },
    include: { project: { include: { projectAccount: true } }, payoutAccount: true },
  });

  if (!collaborator) {
    throw new AppError(404, 'Collaborator not found', 'NOT_FOUND');
  }

  const projectAccount = collaborator.project.projectAccount;
  if (!projectAccount || Number(projectAccount.currentBalance) < params.amount) {
    throw new AppError(400, 'Insufficient project balance for withdrawal', 'INSUFFICIENT_FUNDS');
  }

  // Calculate collaborator available balance from previous payouts
  const previousPayouts = await prisma.payoutTransaction.findMany({
    where: { collaboratorId: params.collaboratorId },
  });

  const totalAllocated = previousPayouts.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalWithdrawn = previousPayouts
    .filter((p) => p.status === 'SUCCESSFUL' || p.status === 'PROCESSING')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const availableForMember = totalAllocated - totalWithdrawn;
  if (params.amount > availableForMember && availableForMember > 0) {
    throw new AppError(400, `Requested amount exceeds available balance (${availableForMember})`, 'INSUFFICIENT_FUNDS');
  }

  // Find associated payment or last confirmed payment for reference
  const lastPayment = await prisma.payment.findFirst({
    where: { projectId: collaborator.projectId, status: 'SUCCESSFUL' },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastPayment) {
    throw new AppError(400, 'No confirmed payment found to withdraw against', 'NO_CONFIRMED_PAYMENT');
  }

  const reference = `wth_${collaborator.id.slice(0, 8)}_${Date.now()}`;

  // 1. Create recipient code
  let recipientCode = 'RCP_default';
  const payoutAcc = collaborator.payoutAccount;
  if (payoutAcc) {
    recipientCode = await createPaystackTransferRecipient({
      name: payoutAcc.accountName || 'Collaborator',
      accountNumber: payoutAcc.providerAccount,
      bankCode: '057', // standard bank code
    });
  } else if (params.accountNumber && params.bankCode) {
    recipientCode = await createPaystackTransferRecipient({
      name: params.accountName || 'Collaborator',
      accountNumber: params.accountNumber,
      bankCode: params.bankCode,
    });
  }

  // 2. Atomic Reservation & Record Creation
  const payoutRecord = await prisma.$transaction(async (tx) => {
    return tx.payoutTransaction.create({
      data: {
        paymentId: lastPayment.id,
        collaboratorId: collaborator.id,
        amount: params.amount,
        currency: collaborator.project.currency,
        status: 'PROCESSING',
        providerReference: reference,
        attemptedAt: new Date(),
      },
    });
  });

  // 3. Initiate Transfer via Paystack API
  try {
    const transferRes = await initiatePaystackTransfer({
      recipientCode,
      amountInNaira: params.amount,
      reference,
      reason: `Withdrawal for ${collaborator.role}`,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payoutTransaction.update({
        where: { id: payoutRecord.id },
        data: {
          status: transferRes.status === 'failed' ? 'FAILED' : 'SUCCESSFUL',
          completedAt: transferRes.status === 'failed' ? null : new Date(),
          failureReason: transferRes.status === 'failed' ? 'Transfer declined' : null,
        },
      });

      if (transferRes.status !== 'failed') {
        await tx.projectAccount.update({
          where: { projectId: collaborator.projectId },
          data: {
            currentBalance: { decrement: params.amount },
            totalDisbursed: { increment: params.amount },
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: 'LEDGER_ENTRY',
            entityId: p.id,
            action: 'WITHDRAWAL_SUCCESS',
            metadata: { reference, amount: params.amount, collaboratorId: collaborator.id },
          },
        });
      }

      return p;
    });

    return updated;
  } catch (err: any) {
    await prisma.payoutTransaction.update({
      where: { id: payoutRecord.id },
      data: { status: 'FAILED', failureReason: err.message || 'Transfer failed' },
    });
    throw new AppError(500, `Withdrawal transfer failed: ${err.message}`, 'TRANSFER_FAILED');
  }
}

export async function triggerPayoutsForPayment(paymentId: string): Promise<PayoutTransactionResponse[]> {
  return getPayoutsForPayment(paymentId);
}

export async function getPayoutsForPayment(paymentId: string): Promise<PayoutTransactionResponse[]> {
  return prisma.payoutTransaction.findMany({ where: { paymentId } });
}


export async function getPayoutsForCollaborator(collaboratorId: string): Promise<PayoutTransactionResponse[]> {
  return prisma.payoutTransaction.findMany({ where: { collaboratorId } });
}

export async function retryPayoutTransaction(payoutId: string): Promise<PayoutTransactionResponse> {
  const payout = await prisma.payoutTransaction.findUnique({
    where: { id: payoutId },
    include: { collaborator: true },
  });

  if (!payout) throw new AppError(404, 'Payout transaction not found', 'NOT_FOUND');
  if (payout.status === 'SUCCESSFUL') {
    throw new AppError(400, 'Payout transaction is already successful', 'ALREADY_SUCCESSFUL');
  }

  return requestWithdrawal({
    collaboratorId: payout.collaboratorId,
    amount: Number(payout.amount),
  });
}

