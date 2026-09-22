export interface WebhookPayloadDto {
  provider: string;
  eventType: string;
  providerEventId: string;
  rawPayload: Record<string, any>;
}

export interface WebhookEventResponse {
  id: string;
  provider: string;
  eventType: string;
  providerEventId: string;
  processed: boolean;
  receivedAt: Date;
}
