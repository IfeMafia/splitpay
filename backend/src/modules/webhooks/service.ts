import { prisma } from '../../lib/prisma';
import { verifyPaystackWebhookSignature } from '../../lib/paystack';
import { confirmPaymentTransaction } from '../payments/ledger.service';
import { AppError } from '../../middleware/errorHandler';
import { Prisma, WithdrawalStatus } from '@prisma/client';

export interface WebhookPayloadDto {
  provider: string;
  eventType: string;
  providerEventId: string;
  rawPayload: any;
}

export async function processWebhookEvent(
  dto: WebhookPayloadDto,
  signatureHeader?: string,
  rawBody?: string | Buffer
): Promise<{ processed: boolean; message: string }> {
  // 1. Signature Verification for Paystack
  if (dto.provider === 'paystack') {
    if (rawBody && signatureHeader) {
      const isValid = await verifyPaystackWebhookSignature(rawBody, signatureHeader);
      if (!isValid) {
        throw new AppError(401, 'Invalid Paystack webhook signature', 'UNAUTHORIZED');
      }
    }
  }

  // 2. Idempotency Guard: reserve event processing row (unique in DB for WEBHOOK + event id)
  let webhookAuditLog: { id: string };
  try {
    webhookAuditLog = await prisma.auditLog.create({
      data: {
        entityType: 'WEBHOOK',
        entityId: dto.providerEventId,
        action: 'WEBHOOK_PROCESSING',
        metadata: {
          provider: dto.provider,
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { processed: true, message: 'Event already processed (Idempotent)' };
    }
    throw error;
  }

  try {
    // 3. Event Dispatcher
    if (dto.provider === 'paystack') {
      if (dto.eventType === 'charge.success') {
        const reference = dto.rawPayload?.data?.reference;
        if (reference) {
          await confirmPaymentTransaction(reference);
        }
      } else if (dto.eventType === 'transfer.success') {
        const reference = dto.rawPayload?.data?.reference;
        const transferCode = dto.rawPayload?.data?.transfer_code;
        const withdrawalId = reference?.startsWith('wdr_') ? reference.replace('wdr_', '') : null;

        const withdrawal = await prisma.withdrawal.findFirst({
          where: {
            OR: [
              ...(withdrawalId ? [{ id: withdrawalId }] : []),
              ...(reference ? [{ providerReference: reference }] : []),
              ...(transferCode ? [{ providerReference: transferCode }] : []),
            ],
          },
          include: { poolMember: true },
        });

        if (withdrawal) {
          await prisma.$transaction(async (tx) => {
            await tx.withdrawal.update({
              where: { id: withdrawal.id },
              data: { status: WithdrawalStatus.SUCCESSFUL },
            });

            await tx.withdrawalEvent.create({
              data: {
                withdrawalId: withdrawal.id,
                eventType: 'WITHDRAWAL_SUCCESS',
                data: { reference, transferCode, rawData: dto.rawPayload?.data },
              },
            });

            await tx.notification.create({
              data: {
                userId: withdrawal.poolMember.userId,
                title: 'Withdrawal Successful',
                message: `Your withdrawal of ${withdrawal.currency} ${withdrawal.amount} has been successfully processed.`,
                type: 'WITHDRAWAL_SUCCESS',
                data: { withdrawalId: withdrawal.id, poolId: withdrawal.poolId },
              },
            });

            await tx.auditLog.create({
              data: {
                entityType: 'WITHDRAWAL',
                entityId: withdrawal.id,
                action: 'WITHDRAWAL_SUCCESS',
                metadata: { reference, transferCode },
              },
            });
          });
        }
      } else if (dto.eventType === 'transfer.failed' || dto.eventType === 'transfer.reversed') {
        const reference = dto.rawPayload?.data?.reference;
        const transferCode = dto.rawPayload?.data?.transfer_code;
        const failureReason = dto.rawPayload?.data?.reason || 'Transfer failed';
        const withdrawalId = reference?.startsWith('wdr_') ? reference.replace('wdr_', '') : null;

        const withdrawal = await prisma.withdrawal.findFirst({
          where: {
            OR: [
              ...(withdrawalId ? [{ id: withdrawalId }] : []),
              ...(reference ? [{ providerReference: reference }] : []),
              ...(transferCode ? [{ providerReference: transferCode }] : []),
            ],
          },
          include: { poolMember: true },
        });

        if (withdrawal) {
          const newStatus = dto.eventType === 'transfer.reversed' ? WithdrawalStatus.REVERSED : WithdrawalStatus.FAILED;

          await prisma.$transaction(async (tx) => {
            await tx.withdrawal.update({
              where: { id: withdrawal.id },
              data: {
                status: newStatus,
                failureReason,
              },
            });

            await tx.withdrawalEvent.create({
              data: {
                withdrawalId: withdrawal.id,
                eventType: dto.eventType === 'transfer.reversed' ? 'WITHDRAWAL_REVERSED' : 'WITHDRAWAL_FAILED',
                data: { reason: failureReason, reference, transferCode },
              },
            });

            await tx.notification.create({
              data: {
                userId: withdrawal.poolMember.userId,
                title: dto.eventType === 'transfer.reversed' ? 'Withdrawal Reversed' : 'Withdrawal Failed',
                message: `Your withdrawal of ${withdrawal.currency} ${withdrawal.amount} failed. Reason: ${failureReason}`,
                type: 'WITHDRAWAL_FAILED',
                data: { withdrawalId: withdrawal.id, poolId: withdrawal.poolId, reason: failureReason },
              },
            });

            await tx.auditLog.create({
              data: {
                entityType: 'WITHDRAWAL',
                entityId: withdrawal.id,
                action: dto.eventType === 'transfer.reversed' ? 'WITHDRAWAL_REVERSED' : 'WITHDRAWAL_FAILED',
                metadata: { reason: failureReason, reference, transferCode },
              },
            });
          });
        }
      }
    }

    // 4. Finalize audit log
    await prisma.auditLog.update({
      where: { id: webhookAuditLog.id },
      data: {
        action: dto.eventType,
        metadata: {
          provider: dto.provider,
          rawPayload: dto.rawPayload as any,
        },
      },
    });
  } catch (error) {
    await prisma.auditLog.deleteMany({
      where: { id: webhookAuditLog.id, entityType: 'WEBHOOK', action: 'WEBHOOK_PROCESSING' },
    });
    throw error;
  }

  return { processed: true, message: 'Webhook processed successfully' };
}
