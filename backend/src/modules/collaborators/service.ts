import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { InvitationStatus, InvitationType, PoolRole } from '@prisma/client';

export interface CreateInvitationDto {
  projectId?: string;
  poolId?: string;
  invitedEmail?: string;
  role: string;
  splitPercentage: number;
}

async function persistMemberSplit(poolId: string, memberOrTokenId: string, percentage: number): Promise<void> {
  const existingConfig = await prisma.splitConfiguration.findFirst({
    where: { poolId },
  });

  let currentShares: { memberId: string; percentage: number }[] = [];
  if (existingConfig && Array.isArray(existingConfig.configuration)) {
    currentShares = (existingConfig.configuration as any[]).filter(
      (s: any) => s && s.memberId !== memberOrTokenId,
    );
  }

  currentShares.push({ memberId: memberOrTokenId, percentage });

  if (existingConfig) {
    await prisma.splitConfiguration.update({
      where: { id: existingConfig.id },
      data: {
        type: 'CUSTOM',
        configuration: currentShares,
      },
    });
  } else {
    await prisma.splitConfiguration.create({
      data: {
        poolId,
        type: 'CUSTOM',
        configuration: currentShares,
      },
    });
  }
}

/**
 * Create an email invitation or directly add a collaborator to a pool.
 * If user exists, they are added as a PoolMember directly.
 * Otherwise, a PoolInvitation record is created.
 */
export async function createInvitation(inviterId: string, dto: CreateInvitationDto) {
  const poolId = dto.projectId || dto.poolId;
  if (!poolId) throw new AppError(400, 'Pool ID is required', 'BAD_REQUEST');

  // Verify pool exists and actor has access
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  if (pool.ownerId !== inviterId) throw new AppError(403, 'Only the pool owner can invite collaborators', 'FORBIDDEN');

  const normalizedEmail = dto.invitedEmail?.trim().toLowerCase();

  // If email is provided, check if user already exists on the platform
  if (normalizedEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Check if user is already a member
      const existingMember = await prisma.poolMember.findUnique({
        where: {
          poolId_userId: {
            poolId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        throw new AppError(409, 'User is already a member of this Pool', 'ALREADY_A_MEMBER');
      }

      // Add them as a PoolMember directly
      const member = await prisma.poolMember.create({
        data: {
          poolId,
          userId: existingUser.id,
          role: dto.role === 'OWNER' ? PoolRole.OWNER : PoolRole.MEMBER,
        },
      });

      // Send in-app notification to the existing user
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          title: `Added to Pool: ${pool.name}`,
          message: `You were added as a collaborator to "${pool.name}".`,
          type: 'POOL_MEMBER_ADDED',
          data: { poolId, role: member.role },
        },
      });

      // Persist their split percentage if provided
      if (dto.splitPercentage && dto.splitPercentage > 0) {
        await persistMemberSplit(poolId, member.id, dto.splitPercentage);
      }

      await prisma.auditLog.create({
        data: {
          entityType: 'POOL_MEMBER',
          entityId: member.id,
          action: 'MEMBER_ADDED',
          actorId: inviterId,
          metadata: { poolId, userId: existingUser.id, email: normalizedEmail },
        },
      });

      return {
        id: member.id,
        projectId: pool.id,
        userId: existingUser.id,
        invitedEmail: existingUser.email,
        role: member.role,
        splitPercentage: dto.splitPercentage || 0,
        status: 'CONFIRMED',
        createdAt: member.createdAt,
      };
    }

    // Check if there's already a pending invitation for this email on this pool
    const existingInvite = await prisma.poolInvitation.findFirst({
      where: {
        poolId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });
    if (existingInvite) {
      throw new AppError(409, 'An invitation for this email is already pending', 'INVITATION_ALREADY_PENDING');
    }
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.poolInvitation.create({
    data: {
      poolId,
      inviterId,
      type: normalizedEmail ? InvitationType.EMAIL : InvitationType.CODE,
      email: normalizedEmail || null,
      token,
      status: InvitationStatus.PENDING,
      expiresAt,
    },
  });

  // Persist split percentage if provided
  if (dto.splitPercentage && dto.splitPercentage > 0) {
    await persistMemberSplit(poolId, invitation.token, dto.splitPercentage);
  }

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL_INVITATION',
      entityId: invitation.id,
      action: 'INVITATION_CREATED',
      actorId: inviterId,
      metadata: { poolId, email: normalizedEmail, token, splitPercentage: dto.splitPercentage },
    },
  });

  return {
    id: invitation.token,
    projectId: invitation.poolId,
    userId: null,
    invitedEmail: invitation.email,
    role: dto.role,
    splitPercentage: dto.splitPercentage,
    status: 'INVITED',
    createdAt: invitation.createdAt,
  };
}

/**
 * List all collaborators (pending invitations + confirmed members) for a pool.
 */
export async function getProjectCollaborators(poolId: string, actorId: string) {
  const [pool, membership] = await Promise.all([
    prisma.pool.findUnique({
      where: { id: poolId },
      select: { ownerId: true },
    }),
    prisma.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId,
          userId: actorId,
        },
      },
      select: { id: true },
    }),
  ]);

  if (!pool) {
    throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  }

  if (pool.ownerId !== actorId && !membership) {
    throw new AppError(403, 'You do not have access to this Pool collaborators', 'FORBIDDEN');
  }

  const [invitations, members, splitConfig] = await Promise.all([
    prisma.poolInvitation.findMany({
      where: { poolId, status: { in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.poolMember.findMany({
      where: { poolId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.splitConfiguration.findFirst({
      where: { poolId },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const shareMap = new Map<string, number>();
  if (splitConfig && Array.isArray(splitConfig.configuration)) {
    for (const item of splitConfig.configuration as any[]) {
      if (item && item.memberId && item.percentage !== undefined) {
        shareMap.set(String(item.memberId), Number(item.percentage));
      }
    }
  }

  // Map invitations to collaborator shape
  const invitationCollabs = invitations.map((inv) => ({
    id: inv.token,
    projectId: inv.poolId,
    userId: null,
    invitedEmail: inv.email,
    role: 'Collaborator',
    splitPercentage: shareMap.get(inv.token) ?? shareMap.get(inv.id) ?? 0,
    status: inv.status === InvitationStatus.PENDING ? 'INVITED' : 'CONFIRMED',
    createdAt: inv.createdAt,
  }));

  // Map confirmed members
  const memberCollabs = members.map((m) => ({
    id: m.id,
    projectId: m.poolId,
    userId: m.userId,
    invitedEmail: m.user.email,
    role: m.role,
    splitPercentage: shareMap.get(m.id) ?? shareMap.get(m.userId) ?? 0,
    status: 'CONFIRMED',
    createdAt: m.createdAt,
  }));

  // Merge: confirmed members take precedence over their invitations
  const confirmedEmails = new Set(memberCollabs.map((m) => m.invitedEmail?.toLowerCase()));
  const pendingOnly = invitationCollabs.filter(
    (inv) => !inv.invitedEmail || !confirmedEmails.has(inv.invitedEmail.toLowerCase()),
  );

  return [...memberCollabs, ...pendingOnly];
}

/**
 * Revoke a pending invitation or remove a pool member by their collaborator id.
 * Accepts either an invitation token (for pending invites) or a PoolMember id.
 */
export async function removeCollaborator(id: string, actorId: string) {
  // Try treating id as an invitation token first
  const invitation = await prisma.poolInvitation.findUnique({ where: { token: id } });
  if (invitation) {
    const pool = await prisma.pool.findUnique({ where: { id: invitation.poolId } });
    if (pool?.ownerId !== actorId) throw new AppError(403, 'Only the pool owner can revoke invitations', 'FORBIDDEN');

    await prisma.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REVOKED },
    });
    return;
  }

  // Otherwise treat id as a PoolMember id
  const member = await prisma.poolMember.findUnique({ where: { id } });
  if (!member) throw new AppError(404, 'Collaborator not found', 'NOT_FOUND');

  const pool = await prisma.pool.findUnique({ where: { id: member.poolId } });
  if (pool?.ownerId !== actorId) throw new AppError(403, 'Only the pool owner can remove members', 'FORBIDDEN');

  if (member.role === PoolRole.OWNER) {
    const ownerCount = await prisma.poolMember.count({ where: { poolId: member.poolId, role: PoolRole.OWNER } });
    if (ownerCount <= 1) throw new AppError(400, 'Cannot remove the last owner of the pool', 'LAST_OWNER_REMOVAL_FORBIDDEN');
  }

  await prisma.poolMember.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL_MEMBER',
      entityId: id,
      action: 'MEMBER_REMOVED',
      actorId,
      metadata: { poolId: member.poolId },
    },
  });
}
