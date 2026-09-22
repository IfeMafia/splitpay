export interface CreatePayoutAccountDto {
  provider: string;
  providerAccountRef: string;
  country: string;
  currency: string;
  isDefault?: boolean;
}

export interface PayoutAccountResponse {
  id: string;
  userId: string;
  provider: string;
  providerAccountRef: string;
  country: string;
  currency: string;
  isDefault: boolean;
  verified: boolean;
  createdAt: Date;
}
