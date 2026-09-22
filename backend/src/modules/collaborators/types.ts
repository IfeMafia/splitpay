import { CollaboratorStatus } from '@prisma/client';

export interface AddCollaboratorDto {
  projectId: string;
  invitedEmail?: string;
  userId?: string;
  role: string;
  splitPercentage: number;
}

export interface UpdateCollaboratorDto {
  role?: string;
  splitPercentage?: number;
  status?: CollaboratorStatus;
  payoutAccountId?: string;
}

export interface CollaboratorResponse {
  id: string;
  projectId: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  splitPercentage: any;
  status: CollaboratorStatus;
  payoutAccountId: string | null;
  createdAt: Date;
}
