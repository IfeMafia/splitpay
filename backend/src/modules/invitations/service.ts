import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { InvitationStatus, PoolRole } from '@prisma/client';

function extractToken(rawToken: string): string {
  let cleaned = rawToken.trim().replace(/\/+$/, '');
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').filter(Boolean);
    cleaned = parts[parts.length - 1] || cleaned;
  }
  return cleaned;
}

/**
 * Public endpoint — fetch invitation details by token or code.
 */
export async function getInvitation(rawToken: string) {
  const token = extractToken(rawToken);
  const invitation = await prisma.poolInvitation.findFirst({
    where: {
      OR: [
        { code: { equals: token, mode: 'insensitive' } },
        { token: { equals: token, mode: 'insensitive' } },
        { id: token },
      ],
    },
    include: {
      pool: {
        include: {
          owner: {
            select: { fullName: true, email: true },
          },
        },
      },
    },
  });

  if (!invitation || invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(404, 'Invitation not found or already accepted', 'NOT_FOUND');
  }

  if (invitation.expiresAt < new Date()) {
    throw new AppError(410, 'This invitation has expired', 'INVITATION_EXPIRED');
  }

  return {
    id: invitation.token || invitation.code,
    projectId: invitation.poolId,
    projectName: invitation.pool.name,
    invitedEmail: invitation.email,
    role: 'Collaborator',
    splitPercentage: 0,
    inviterName: invitation.pool.owner.fullName,
    inviterEmail: invitation.pool.owner.email,
    createdAt: invitation.createdAt,
  };
}

/**
 * Authenticated endpoint — accept an invitation and join the pool.
 */
export async function acceptInvitation(rawToken: string, userId: string) {
  const token = extractToken(rawToken);
  const invitation = await prisma.poolInvitation.findFirst({
    where: {
      OR: [
        { code: { equals: token, mode: 'insensitive' } },
        { token: { equals: token, mode: 'insensitive' } },
        { id: token },
      ],
    },
    include: {
      pool: true,
    },
  });

  if (!invitation || invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(404, 'Invitation not found or already accepted', 'NOT_FOUND');
  }

  if (invitation.expiresAt < new Date()) {
    throw new AppError(410, 'This invitation has expired', 'INVITATION_EXPIRED');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

  // If this was an email-targeted invitation, enforce case-insensitive email match
  if (invitation.email && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new AppError(403, 'You can only accept invitations sent to your email address', 'FORBIDDEN');
  }

  // Check if user is already a member of this pool
  const existingMember = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: invitation.poolId, userId } },
  });
  if (existingMember) {
    throw new AppError(409, 'You are already a member of this pool', 'ALREADY_A_MEMBER');
  }

  // Transaction: mark invitation accepted + add pool member
  const member = await prisma.$transaction(async (tx) => {
    await tx.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    const newMember = await tx.poolMember.create({
      data: {
        poolId: invitation.poolId,
        userId,
        role: PoolRole.MEMBER,
      },
    });

    const splitConfig = await tx.splitConfiguration.findFirst({
      where: { poolId: invitation.poolId },
      orderBy: { updatedAt: 'desc' },
    });

    if (splitConfig && Array.isArray(splitConfig.configuration)) {
      let replaced = false;
      const remapped = (splitConfig.configuration as any[]).map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        if (entry.memberId === invitation.token || entry.memberId === invitation.id) {
          replaced = true;
          return { ...entry, memberId: newMember.id };
        }
        return entry;
      });

      if (replaced) {
        const aggregated = new Map<string, number>();
        for (const entry of remapped) {
          if (!entry || typeof entry !== 'object' || !entry.memberId || entry.percentage === undefined) continue;
          const memberId = String(entry.memberId);
          const percentage = Number(entry.percentage);
          aggregated.set(memberId, (aggregated.get(memberId) ?? 0) + percentage);
        }

        await tx.splitConfiguration.update({
          where: { id: splitConfig.id },
          data: {
            configuration: Array.from(aggregated.entries()).map(([memberId, percentage]) => ({
              memberId,
              percentage: Math.round(percentage * 100) / 100,
            })),
          },
        });
      }
    }

    // Notify the member
    await tx.notification.create({
      data: {
        userId,
        title: 'Joined Pool',
        message: `You have joined the workspace "${invitation.pool.name}".`,
        type: 'POOL_JOINED',
        data: { poolId: invitation.poolId },
      },
    });

    // Notify the pool owner
    if (invitation.pool.ownerId !== userId) {
      await tx.notification.create({
        data: {
          userId: invitation.pool.ownerId,
          title: 'Collaborator Joined',
          message: `${user.fullName || user.email} has accepted the invitation and joined "${invitation.pool.name}".`,
          type: 'COLLABORATOR_JOINED',
          data: { poolId: invitation.poolId, collaboratorUserId: userId },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        entityType: 'POOL_INVITATION',
        entityId: invitation.id,
        action: 'INVITATION_ACCEPTED',
        actorId: userId,
        metadata: { poolId: invitation.poolId, token },
      },
    });

    return newMember;
  });

  return member;
}
