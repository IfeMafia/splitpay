import { prisma } from '../../lib/prisma';
import { WebhookPayloadDto } from './types';
import { verifyPaystackWebhookSignature } from '../../lib/paystack';
import { confirmPaymentTransaction } from '../payments/ledger.service';
import { AppError } from '../../middleware/errorHandler';

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

  // 2. Idempotency Check: Prevent processing duplicate events
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { providerEventId: dto.providerEventId },
  });

  if (existingEvent && existingEvent.processed) {
    return { processed: true, message: 'Event already processed (Idempotent)' };
  }

  // Save/Upsert Webhook Event
  const eventRecord = await prisma.webhookEvent.upsert({
    where: { providerEventId: dto.providerEventId },
    create: {
      provider: dto.provider,
      eventType: dto.eventType,
      providerEventId: dto.providerEventId,
      rawPayload: dto.rawPayload as any,
      processed: false,
    },
    update: {
      rawPayload: dto.rawPayload as any,
    },
  });

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
        await prisma.payoutTransaction.updateMany({
          where: { providerReference: reference },
          data: { status: 'SUCCESSFUL', completedAt: new Date() },
        });
      }
    } else if (dto.eventType === 'transfer.failed' || dto.eventType === 'transfer.reversed') {
      const reference = dto.rawPayload?.data?.reference;
      if (reference) {
        await prisma.payoutTransaction.updateMany({
          where: { providerReference: reference },
          data: { status: 'FAILED', failureReason: dto.rawPayload?.data?.reason || 'Transfer failed' },
        });
      }
    }
  }

  // Mark event as processed
  await prisma.webhookEvent.update({
    where: { id: eventRecord.id },
    data: { processed: true },
  });


  return { processed: true, message: 'Webhook processed successfully' };
}
