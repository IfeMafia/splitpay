import crypto from 'crypto';
import { env } from '../config/env';

export interface InitializePaystackParams {
  email: string;
  amountInNaira: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface InitializePaystackResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaystackData {
  status: string; // 'success', 'failed', 'abandoned'
  reference: string;
  amountInNaira: number;
  gatewayResponse: string;
  paidAt?: string;
  channel?: string;
  currency: string;
  feesInNaira: number;
  customerEmail: string;
  metadata?: Record<string, any>;
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Initialize a Paystack transaction via Paystack REST API.
 */
export async function initializePaystackTransaction(
  params: InitializePaystackParams
): Promise<InitializePaystackResponse> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  // In test/dev mode without real Paystack key, return a mock response
  if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
    return {
      authorizationUrl: `https://checkout.paystack.com/mock-pay-${params.reference}`,
      accessCode: `mock_access_code_${params.reference}`,
      reference: params.reference,
    };
  }

  // Paystack expects amount in minor units (kobo -> 1 Naira = 100 kobo)
  const amountInKobo = Math.round(params.amountInNaira * 100);

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: amountInKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const body = (await response.json()) as any;

  if (!response.ok || !body.status) {
    throw new Error(`Paystack initialization failed: ${body.message || 'Unknown error'}`);
  }

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference: body.data.reference,
  };
}

/**
 * Verify a Paystack transaction by reference via Paystack REST API.
 */
export async function verifyPaystackTransaction(reference: string): Promise<VerifyPaystackData> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  // In test/dev mode without real Paystack key, mock successful verification
  if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
    return {
      status: 'success',
      reference,
      amountInNaira: 1000,
      gatewayResponse: 'Successful (Mock)',
      paidAt: new Date().toISOString(),
      currency: 'NGN',
      feesInNaira: 15, // Mock 1.5% fee
      customerEmail: 'client@example.com',
    };
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const body = (await response.json()) as any;

  if (!response.ok || !body.status) {
    throw new Error(`Paystack transaction verification failed: ${body.message || 'Unknown error'}`);
  }

  const data = body.data;
  return {
    status: data.status, // e.g. 'success'
    reference: data.reference,
    amountInNaira: (data.amount || 0) / 100, // convert kobo to Naira
    gatewayResponse: data.gateway_response,
    paidAt: data.paid_at,
    channel: data.channel,
    currency: data.currency || 'NGN',
    feesInNaira: (data.fees || 0) / 100,
    customerEmail: data.customer?.email || '',
    metadata: data.metadata,
  };
}

/**
 * Verifies Paystack webhook signature header (x-paystack-signature).
 */
export async function verifyPaystackWebhookSignature(
  rawPayload: string | Buffer,
  signatureHeader: string
): Promise<boolean> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
    // Skip strict check in test environment if key is placeholder
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const payloadString = typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8');
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(payloadString)
    .digest('hex');

  return hash === signatureHeader;
}

export interface CreateTransferRecipientParams {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}

export interface InitiateTransferParams {
  recipientCode: string;
  amountInNaira: number;
  reason?: string;
  reference: string;
}

export interface TransferResult {
  status: string; // 'success', 'pending', 'failed'
  transferCode: string;
  reference: string;
  amountInNaira: number;
}

/**
 * Creates a Paystack Transfer Recipient.
 */
export async function createPaystackTransferRecipient(
  params: CreateTransferRecipientParams
): Promise<string> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
    return `RCP_mock_${Date.now()}`;
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency || 'NGN',
    }),
  });

  const body = (await response.json()) as any;
  if (!response.ok || !body.status) {
    throw new Error(`Paystack transfer recipient creation failed: ${body.message || 'Unknown error'}`);
  }

  return body.data.recipient_code;
}

/**
 * Initiates a transfer / payout to a recipient via Paystack REST API.
 */
export async function initiatePaystackTransfer(
  params: InitiateTransferParams
): Promise<TransferResult> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
    return {
      status: 'success',
      transferCode: `TRF_mock_${params.reference}`,
      reference: params.reference,
      amountInNaira: params.amountInNaira,
    };
  }

  const amountInKobo = Math.round(params.amountInNaira * 100);

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: amountInKobo,
      recipient: params.recipientCode,
      reason: params.reason || 'SplitPay collaborator payout',
      reference: params.reference,
    }),
  });

  const body = (await response.json()) as any;
  if (!response.ok || !body.status) {
    throw new Error(`Paystack transfer initiation failed: ${body.message || 'Unknown error'}`);
  }

  return {
    status: body.data.status,
    transferCode: body.data.transfer_code,
    reference: body.data.reference,
    amountInNaira: (body.data.amount || 0) / 100,
  };
}

