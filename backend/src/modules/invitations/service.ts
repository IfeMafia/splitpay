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

async function resolveInvitationSplitPercentage(poolId: string, invitation: any): Promise<number> {
  const [splitConfig, poolMembers, pendingInvitations] = await Promise.all([
    prisma.splitConfiguration.findFirst({
      where: { poolId },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.poolMember.findMany({ where: { poolId } }),
    prisma.poolInvitation.findMany({
      where: { poolId, status: InvitationStatus.PENDING },
    }),
  ]);

  if (splitConfig && Array.isArray(splitConfig.configuration)) {
    const entry = (splitConfig.configuration as any[]).find((s: any) => {
      if (!s || !s.memberId) return false;
      const mId = String(s.memberId);
      return (
        mId === invitation.token ||
        mId === invitation.code ||
        mId === invitation.id ||
        (invitation.email && mId.toLowerCase() === invitation.email.toLowerCase())
      );
    });

    if (entry && entry.percentage !== undefined && Number(entry.percentage) > 0) {
      return Number(entry.percentage);
    }

    if (splitConfig.type === 'EQUAL') {
      const totalParticipants = Math.max(1, poolMembers.length + pendingInvitations.length);
      return Math.round((100 / totalParticipants) * 100) / 100;
    }
  }

  const totalCount = Math.max(1, poolMembers.length + 1);
  return Math.round((100 / totalCount) * 100) / 100;
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

  if (!invitation) {
    throw new AppError(404, 'Invitation not found. Please check your link or code.', 'NOT_FOUND');
  }

  const splitPercentage = await resolveInvitationSplitPercentage(invitation.poolId, invitation);

  if (invitation.status === InvitationStatus.ACCEPTED) {
    return {
      id: invitation.token || invitation.code,
      projectId: invitation.poolId,
      projectName: invitation.pool.name,
      invitedEmail: invitation.email,
      role: 'Collaborator',
      splitPercentage,
      inviterName: invitation.pool.owner.fullName,
      inviterEmail: invitation.pool.owner.email,
      createdAt: invitation.createdAt,
      isAlreadyAccepted: true,
    };
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
    splitPercentage,
    inviterName: invitation.pool.owner.fullName,
    inviterEmail: invitation.pool.owner.email,
    createdAt: invitation.createdAt,
    isAlreadyAccepted: false,
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

  if (!invitation) {
    throw new AppError(404, 'Invitation not found. Please check your link or code.', 'NOT_FOUND');
  }

  // Check if user is already a member of this pool (idempotency)
  const existingMember = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: invitation.poolId, userId } },
  });
  if (existingMember) {
    return {
      id: existingMember.id,
      poolId: existingMember.poolId,
      userId: existingMember.userId,
      role: existingMember.role,
      isAlreadyMember: true,
    };
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    return {
      poolId: invitation.poolId,
      isAlreadyMember: true,
    };
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

  // Transaction: mark invitation accepted + add pool member + persist agreed split
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
        const entryMemberId = String(entry.memberId);
        if (
          entryMemberId === invitation.token ||
          entryMemberId === invitation.code ||
          entryMemberId === invitation.id ||
          (invitation.email && entryMemberId.toLowerCase() === invitation.email.toLowerCase())
        ) {
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
            type: 'CUSTOM',
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
