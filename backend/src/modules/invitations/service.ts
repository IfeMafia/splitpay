import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export async function getInvitation(token: string) {
  const invitation = await prisma.collaborator.findUnique({
    where: { id: token },
    include: {
      project: {
        include: {
          owner: {
            select: { fullName: true, email: true },
          }
        }
      }
    }
  });

  if (!invitation || invitation.status !== 'INVITED') {
    throw new AppError(404, 'Invitation not found or already accepted', 'NOT_FOUND');
  }

  return {
    id: invitation.id,
    projectId: invitation.projectId,
    projectName: invitation.project.name,
    invitedEmail: invitation.invitedEmail,
    role: invitation.role,
    splitPercentage: Number(invitation.splitPercentage),
    inviterName: invitation.project.owner.fullName,
    inviterEmail: invitation.project.owner.email,
    createdAt: invitation.createdAt,
  };
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.collaborator.findUnique({
    where: { id: token }
  });

  if (!invitation || invitation.status !== 'INVITED') {
    throw new AppError(404, 'Invitation not found or already accepted', 'NOT_FOUND');
  }

  // Ensure the accepting user matches the invited email, if strict checking is needed
  // (In a real app, you might verify the logged in user's email matches the invited email)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

  if (invitation.invitedEmail && user.email !== invitation.invitedEmail) {
    throw new AppError(403, 'You can only accept invitations sent to your email address', 'FORBIDDEN');
  }

  const updatedCollaborator = await prisma.collaborator.update({
    where: { id: token },
    data: {
      status: 'CONFIRMED',
      userId: userId,
    }
  });

  return updatedCollaborator;
}
