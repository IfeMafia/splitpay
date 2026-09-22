import { ProjectStatus } from '@prisma/client';

export interface CreateProjectDto {
  name: string;
  description?: string;
  totalAmount: number;
  currency: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  totalAmount?: number;
  status?: ProjectStatus;
}

export interface ProjectResponse {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  totalAmount: any;
  currency: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}
