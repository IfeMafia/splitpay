import { PaymentStatus } from '@prisma/client';

export interface CreatePaymentLinkDto {
  projectId: string;
  expectedAmount: number;
  currency: string;
  provider: string;
}

export interface PaymentResponse {
  id: string;
  projectId: string;
  paymentLinkToken: string;
  expectedAmount: any;
  actualAmount: any | null;
  currency: string;
  provider: string;
  providerReference: string | null;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
}
