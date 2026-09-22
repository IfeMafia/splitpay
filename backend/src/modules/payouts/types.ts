import { PayoutStatus } from '@prisma/client';

export interface PayoutTransactionResponse {
  id: string;
  paymentId: string;
  collaboratorId: string;
  amount: any;
  currency: string;
  status: PayoutStatus;
  providerReference: string | null;
  failureReason: string | null;
  attemptedAt: Date | null;
  completedAt: Date | null;
}
