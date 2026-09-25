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
        if (reference) {
          await prisma.withdrawal.updateMany({
            where: { providerReference: reference },
            data: { status: WithdrawalStatus.SUCCESSFUL },
          });
        }
      } else if (dto.eventType === 'transfer.failed' || dto.eventType === 'transfer.reversed') {
        const reference = dto.rawPayload?.data?.reference;
        if (reference) {
          await prisma.withdrawal.updateMany({
            where: { providerReference: reference },
            data: {
              status: dto.eventType === 'transfer.reversed' ? WithdrawalStatus.REVERSED : WithdrawalStatus.FAILED,
              failureReason: dto.rawPayload?.data?.reason || 'Transfer failed',
            },
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
