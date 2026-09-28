import { PaymentStatus } from '@prisma/client';

export interface CreatePaymentLinkDto {
  poolId: string;      // frontend sends projectId, mapped in controller
  title?: string;
  amount: number;
  currency: string;
}

export interface InitializePaymentDto {
  email: string;
  callbackUrl?: string;
}

/** Shape returned by all payment endpoints to the frontend */
export interface PaymentLinkResponse {
  id: string;
  poolId: string;
  /** alias: projectId */
  projectId: string;
  token: string;
  /** alias: paymentLinkToken */
  paymentLinkToken: string;
  title: string;
  amount: number | string;
  /** alias: expectedAmount */
  expectedAmount: number | string;
  currency: string;
  provider: string;
  isActive: boolean;
  status: string;
  /** The most recent transaction status, if one exists */
  transactionStatus: string | null;
  providerReference: string | null;
  actualAmount: number | string | null;
  paidAt: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
  poolName?: string;
  description?: string | null;
  merchantName?: string;
}
