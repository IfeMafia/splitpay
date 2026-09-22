import { prisma } from '../../lib/prisma';
import { WebhookPayloadDto } from './types';

/**
 * TODO: Verify cryptographic signature of incoming webhook (Stripe signature / Paystack signature).
 * TODO: Perform idempotent processing using `providerEventId` to prevent duplicate handling.
 * TODO: Handle payment completion events (update Payment status to SUCCESSFUL, trigger payouts).
 * TODO: Handle transfer completion/failure events (update PayoutTransaction status).
 */
export async function processWebhookEvent(dto: WebhookPayloadDto): Promise<void> {
  // Save raw event for auditability
  const event = await prisma.webhookEvent.create({
    data: {
      provider: dto.provider,
      eventType: dto.eventType,
      providerEventId: dto.providerEventId,
      rawPayload: dto.rawPayload,
    },
  });

  // TODO: Dispatch domain handler based on event.eventType
  console.log(`[Webhook Received] ${event.provider}:${event.eventType}`);
}
