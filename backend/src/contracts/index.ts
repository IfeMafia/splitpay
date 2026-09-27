export type PoolRole = 'OWNER' | 'MEMBER';
export type PoolStatus = 'ACTIVE' | 'ARCHIVED';
export type InvitationType = 'CODE' | 'EMAIL';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
export type SplitType = 'EQUAL' | 'CUSTOM';
export type AllocationStatus = 'ALLOCATED' | 'WITHDRAWN';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED';

// User & Auth
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  defaultCurrency: string;
  country?: string | null;
  createdAt: Date | string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

// Pool
export interface PoolResponse {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  currency: string;
  status: PoolStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  memberCount?: number;
  members?: PoolMemberResponse[];
  userRole?: PoolRole | string;
  totalAmount?: number;
}

export interface PoolMemberResponse {
  id: string;
  poolId: string;
  userId: string;
  role: PoolRole;
  createdAt: Date | string;
  user?: UserProfile;
}

// Invitation
export interface InvitationResponse {
  id: string;
  poolId: string;
  inviterId: string;
  type: InvitationType;
  code?: string | null;
  email?: string | null;
  token: string;
  status: InvitationStatus;
  expiresAt: Date | string;
  createdAt: Date | string;
  pool?: {
    id: string;
    name: string;
    currency: string;
  };
}

// Payment Link
export interface PaymentLinkResponse {
  id: string;
  poolId: string;
  token: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Transaction
export interface TransactionResponse {
  id: string;
  poolId: string;
  paymentLinkId?: string | null;
  amount: number;
  currency: string;
  provider: string;
  providerReference?: string | null;
  status: PaymentStatus;
  payerEmail?: string | null;
  payerName?: string | null;
  paidAt?: Date | string | null;
  createdAt: Date | string;
}

// Split
export interface SplitMemberShare {
  memberId: string;
  percentage: number; // e.g. 50.00
}

export interface SplitConfigResponse {
  id: string;
  poolId: string;
  type: SplitType;
  configuration: SplitMemberShare[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SplitAllocationResponse {
  id: string;
  snapshotId: string;
  poolMemberId: string;
  percentage: number;
  amount: number;
  currency: string;
  status: AllocationStatus;
  createdAt: Date | string;
  member?: {
    id: string;
    role: PoolRole;
    user: UserProfile;
  };
}

export interface PoolBalanceResponse {
  poolId: string;
  currency: string;
  totalGrossReceived: number;
  totalProviderFees: number;
  totalPlatformFees: number;
  totalTax: number;
  totalDistributable: number;
  totalAllocated: number;
  totalWithdrawn: number;
  totalPendingWithdrawals: number;
  totalAvailable: number;
  // Compatibility aliases
  totalReceived: number;
  distributableAmount: number;
  withdrawnAmount: number;
  availableBalance: number;
  memberBalances: {
    poolMemberId: string;
    userId: string;
    fullName: string;
    allocatedAmount: number;
    withdrawnAmount: number;
    pendingWithdrawalAmount: number;
    availableBalance: number;
  }[];
}

// Notification
export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: Date | string;
}

// Withdrawal
export interface WithdrawalResponse {
  id: string;
  poolId: string;
  poolMemberId: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  providerReference?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  failureReason?: string | null;
  createdAt: Date | string;
}
