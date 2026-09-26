import { prisma } from '../../lib/prisma';
import { CreateProjectDto, UpdateProjectDto, ProjectResponse } from './types';
import { AppError } from '../../middleware/errorHandler';

export async function createProject(ownerId: string, dto: CreateProjectDto): Promise<ProjectResponse> {
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: dto.name,
      description: dto.description,
      totalAmount: dto.totalAmount,
      currency: dto.currency,
    },
  });
  return project;
}

export async function getUserProjects(ownerId: string): Promise<ProjectResponse[]> {
  return prisma.project.findMany({ where: { ownerId } });
}

export async function getProjectById(ownerId: string, projectId: string): Promise<ProjectResponse> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');
  return project;
}

/**
 * TODO: Validate that total split percentage across collaborators doesn't exceed 100% when activating project.
 * TODO: Prevent modifying totalAmount or status if payments are already associated.
 */
export async function updateProject(ownerId: string, projectId: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
  await getProjectById(ownerId, projectId);
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: dto,
  });
  return updated;
}

export async function getProjectBalanceSummary(projectId: string) {
  const account = await prisma.projectAccount.findUnique({
    where: { projectId },
  });

  const payouts = await prisma.payoutTransaction.findMany({
    where: { payment: { projectId } },
    include: { collaborator: true },
  });

  const memberBalances: Record<string, { role: string; allocated: number; withdrawn: number; available: number }> = {};

  for (const payout of payouts) {
    const cid = payout.collaboratorId;
    if (!memberBalances[cid]) {
      memberBalances[cid] = {
        role: payout.collaborator.role,
        allocated: 0,
        withdrawn: 0,
        available: 0,
      };
    }
    const amt = Number(payout.amount);
    memberBalances[cid].allocated += amt;
    if (payout.status === 'SUCCESSFUL') {
      memberBalances[cid].withdrawn += amt;
    }
    memberBalances[cid].available = memberBalances[cid].allocated - memberBalances[cid].withdrawn;
  }

  return {
    projectId,
    totalReceived: account ? Number(account.totalReceived) : 0,
    totalDisbursed: account ? Number(account.totalDisbursed) : 0,
    currentBalance: account ? Number(account.currentBalance) : 0,
    currency: account?.currency || 'USD',
    collaboratorBreakdown: memberBalances,
  };
}

export async function getProjectAllocations(projectId: string) {
  return prisma.splitSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

