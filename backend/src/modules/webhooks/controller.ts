import { Request, Response, NextFunction } from 'express';
import * as webhookService from './service';

export async function handleProviderWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const provider = req.params.provider as string;
    const eventType = req.body.event || req.body.type || 'unknown';
    const providerEventId = req.body.id || `evt_${Date.now()}`;
    const signature = (req.headers['x-paystack-signature'] as string) || (req.headers['stripe-signature'] as string);

    const result = await webhookService.processWebhookEvent(
      {
        provider,
        eventType,
        providerEventId,
        rawPayload: req.body,
      },
      signature,
      JSON.stringify(req.body)
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
