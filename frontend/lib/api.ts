import {
  AuthResponse,
  UserProfile,
  PoolResponse,
  PoolMemberResponse,
  InvitationResponse,
  PaymentLinkResponse,
  TransactionResponse,
  SplitConfigResponse,
  SplitAllocationResponse,
  PoolBalanceResponse,
  NotificationResponse,
  WithdrawalResponse,
} from './contracts';

import { getSynchronousCache } from '../app/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('sp_token') || localStorage.getItem('splitpay_token');
    }
  }

  getCached<T>(path: string): T | null {
    return getSynchronousCache<T>(path);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sp_token') || localStorage.getItem('splitpay_token');
      if (stored) {
        this.token = stored;
        return stored;
      }
    }
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('sp_token', token);
        localStorage.setItem('splitpay_token', token);
      } else {
        localStorage.removeItem('sp_token');
        localStorage.removeItem('splitpay_token');
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMsg = json.error?.message || 'An error occurred';
      throw new Error(errorMsg);
    }

    return json.data !== undefined ? json.data : json;
  }

  // Auth & Profile
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    invitationToken?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async googleAuth(credential: string, invitationToken?: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, invitationToken }),
    });
    this.setToken(res.token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  async updateMe(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Pools
  async getPools(): Promise<PoolResponse[]> {
    return this.request<PoolResponse[]>('/pools');
  }

  async createPool(data: { name: string; description?: string; currency?: string }): Promise<PoolResponse> {
    return this.request<PoolResponse>('/pools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPool(poolId: string): Promise<PoolResponse> {
    return this.request<PoolResponse>(`/pools/${poolId}`);
  }

  async updatePool(poolId: string, data: { name?: string; description?: string }): Promise<PoolResponse> {
    return this.request<PoolResponse>(`/pools/${poolId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async archivePool(poolId: string): Promise<void> {
    await this.request(`/pools/${poolId}`, { method: 'DELETE' });
  }

  // Pool Members
  async getMembers(poolId: string): Promise<PoolMemberResponse[]> {
    return this.request<PoolMemberResponse[]>(`/pools/${poolId}/members`);
  }

  async addMember(poolId: string, email: string, role = 'MEMBER'): Promise<PoolMemberResponse> {
    return this.request<PoolMemberResponse>(`/pools/${poolId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async removeMember(poolId: string, memberId: string): Promise<void> {
    await this.request(`/pools/${poolId}/members/${memberId}`, { method: 'DELETE' });
  }

  // Invitations
  async createCodeInvite(poolId: string, expiresInDays = 7): Promise<InvitationResponse> {
    return this.request<InvitationResponse>(`/pools/${poolId}/invitations/code`, {
      method: 'POST',
      body: JSON.stringify({ expiresInDays }),
    });
  }

  async createEmailInvite(poolId: string, email: string, expiresInDays = 7): Promise<InvitationResponse> {
    return this.request<InvitationResponse>(`/pools/${poolId}/invitations/email`, {
      method: 'POST',
      body: JSON.stringify({ email, expiresInDays }),
    });
  }

  async getPoolInvitations(poolId: string): Promise<InvitationResponse[]> {
    return this.request<InvitationResponse[]>(`/pools/${poolId}/invitations`);
  }

  async revokeInvitation(poolId: string, invitationId: string): Promise<void> {
    await this.request(`/pools/${poolId}/invitations/${invitationId}`, { method: 'DELETE' });
  }

  async getInvitationPreview(token: string): Promise<InvitationResponse> {
    return this.request<InvitationResponse>(`/invitations/${token}`);
  }

  async acceptInvitation(token: string): Promise<PoolMemberResponse> {
    return this.request<PoolMemberResponse>(`/invitations/${token}/accept`, { method: 'POST' });
  }

  // Payment Links
  async getPaymentLinks(poolId: string): Promise<PaymentLinkResponse[]> {
    return this.request<PaymentLinkResponse[]>(`/pools/${poolId}/payment-links`);
  }

  async createPaymentLink(poolId: string, data: { title: string; description?: string; amount: number; currency?: string }): Promise<PaymentLinkResponse> {
    return this.request<PaymentLinkResponse>(`/pools/${poolId}/payment-links`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentLink(poolId: string, linkId: string, data: { title?: string; amount?: number; isActive?: boolean }): Promise<PaymentLinkResponse> {
    return this.request<PaymentLinkResponse>(`/pools/${poolId}/payment-links/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivatePaymentLink(poolId: string, linkId: string): Promise<void> {
    await this.request(`/pools/${poolId}/payment-links/${linkId}`, { method: 'DELETE' });
  }

  // Public Checkout
  async getCheckoutData(token: string): Promise<{
    id: string;
    token: string;
    title: string;
    description?: string;
    amount: number;
    currency: string;
    pool: { id: string; name: string; description?: string; currency: string };
  }> {
    return this.request(`/pay/${token}`);
  }

  async initializePayment(token: string, data: { payerEmail: string; payerName: string }) {
    return this.request(`/pay/${token}/initialize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Splits & Balances
  async getSplitConfig(poolId: string): Promise<SplitConfigResponse> {
    return this.request<SplitConfigResponse>(`/pools/${poolId}/split`);
  }

  async configureSplit(
    poolId: string,
    data: { type: 'EQUAL' | 'CUSTOM'; shares?: { memberId: string; percentage: number }[] },
  ): Promise<SplitConfigResponse> {
    return this.request<SplitConfigResponse>(`/pools/${poolId}/split`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllocations(poolId: string): Promise<SplitAllocationResponse[]> {
    return this.request<SplitAllocationResponse[]>(`/pools/${poolId}/allocations`);
  }

  async getPoolBalance(poolId: string): Promise<PoolBalanceResponse> {
    return this.request<PoolBalanceResponse>(`/pools/${poolId}/balance`);
  }

  // Transactions
  async getTransactions(poolId: string): Promise<TransactionResponse[]> {
    return this.request<TransactionResponse[]>(`/pools/${poolId}/transactions`);
  }

  // Withdrawals
  async getWithdrawals(poolId: string): Promise<WithdrawalResponse[]> {
    return this.request<WithdrawalResponse[]>(`/pools/${poolId}/withdrawals`);
  }

  async requestWithdrawal(
    poolId: string,
    data: { amount: number; bankCode: string; accountNumber: string; accountName: string },
  ): Promise<WithdrawalResponse> {
    return this.request<WithdrawalResponse>(`/pools/${poolId}/withdrawals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationResponse[]> {
    return this.request<NotificationResponse[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'PATCH' });
  }
}

export const api = new ApiClient();
