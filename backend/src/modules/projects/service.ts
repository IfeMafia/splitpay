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
