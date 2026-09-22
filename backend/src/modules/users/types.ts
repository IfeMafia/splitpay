import { KycStatus } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  defaultCurrency: string;
  country: string;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  defaultCurrency?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  kycStatus: KycStatus;
  defaultCurrency: string;
  country: string;
  createdAt: Date;
}
