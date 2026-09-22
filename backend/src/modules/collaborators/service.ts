import { prisma } from '../../lib/prisma';
import { AddCollaboratorDto, UpdateCollaboratorDto, CollaboratorResponse } from './types';
import { AppError } from '../../middleware/errorHandler';

/**
 * TODO: Send invitation email to `invitedEmail` if provided.
 * TODO: Validate total sum of split percentages for the project <= 100%.
 */
export async function addCollaborator(dto: AddCollaboratorDto): Promise<CollaboratorResponse> {
  const collaborator = await prisma.collaborator.create({
    data: {
      projectId: dto.projectId,
      invitedEmail: dto.invitedEmail,
      userId: dto.userId,
      role: dto.role,
      splitPercentage: dto.splitPercentage,
    },
  });
  return collaborator;
}

export async function getProjectCollaborators(projectId: string): Promise<CollaboratorResponse[]> {
  return prisma.collaborator.findMany({ where: { projectId } });
}

/**
 * TODO: Recalculate and validate split percentages on update.
 */
export async function updateCollaborator(id: string, dto: UpdateCollaboratorDto): Promise<CollaboratorResponse> {
  const collaborator = await prisma.collaborator.update({
    where: { id },
    data: dto,
  });
  return collaborator;
}

/**
 * TODO: Soft-delete by setting status = REMOVED or hard delete if no payouts linked.
 */
export async function removeCollaborator(id: string): Promise<void> {
  await prisma.collaborator.delete({ where: { id } });
}
