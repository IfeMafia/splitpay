import { Request, Response, NextFunction } from 'express';
import * as webhookService from './service';

export async function handleProviderWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const provider = req.params.provider as string;
    const eventType = req.body.event || req.body.type || 'unknown';
    const providerEventId = req.body.id || `evt_${Date.now()}`;

    await webhookService.processWebhookEvent({
      provider,
      eventType,
      providerEventId,
      rawPayload: req.body,
    });

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}
