import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { sendEmail } from '../../lib/mailer';
import { formatInvitationEmail } from '../../lib/emailTemplates';
import { AppError } from '../../middleware/errorHandler';
import { InvitationStatus, InvitationType, PoolRole } from '@prisma/client';
import { generateShortToken, generateDigitCode, generateCharToken } from '../../utils/token';

export interface CreateInvitationDto {
  projectId?: string;
  poolId?: string;
  invitedEmail?: string;
  role: string;
  splitPercentage: number;
}

async function persistMemberSplit(poolId: string, memberOrTokenId: string, percentage: number): Promise<void> {
  const [existingConfig, pool] = await Promise.all([
    prisma.splitConfiguration.findFirst({ where: { poolId }, orderBy: { updatedAt: 'desc' } }),
    prisma.pool.findUnique({
      where: { id: poolId },
      include: { members: { where: { role: PoolRole.OWNER } } },
    }),
  ]);

  const ownerMember = pool?.members[0];

  let currentShares: { memberId: string; percentage: number }[] = [];
  if (existingConfig && Array.isArray(existingConfig.configuration)) {
    currentShares = (existingConfig.configuration as any[]).filter(
      (s: any) => s && s.memberId && s.memberId !== memberOrTokenId,
    );
  }

  // Guard: compute how much the owner currently has available to give away
  // (= 100% minus every non-owner share that already exists, excluding the entry being updated)
  if (ownerMember && ownerMember.id !== memberOrTokenId) {
    const existingNonOwnerSum = currentShares
      .filter((s) => s.memberId !== ownerMember.id && s.memberId !== ownerMember.userId)
      .reduce((sum, s) => sum + Number(s.percentage), 0);

    const ownerAvailable = Math.round((100 - existingNonOwnerSum) * 100) / 100;

    if (percentage > ownerAvailable) {
      throw new AppError(
        400,
        `Cannot allocate ${percentage}% — the owner only has ${ownerAvailable.toFixed(2)}% left to distribute. Reduce this collaborator's share or remove another one first.`,
        'SPLIT_EXCEEDS_OWNER_AVAILABLE',
      );
    }
  }

  // Add or update the target member/invitation share
  currentShares.push({ memberId: memberOrTokenId, percentage });

  // Deduct the allocated percentage from the owner — owner always gets the exact remainder
  if (ownerMember && ownerMember.id !== memberOrTokenId) {
    const ownerIndex = currentShares.findIndex((s) => s.memberId === ownerMember.id || s.memberId === ownerMember.userId);
    const nonOwnerSum = currentShares
      .filter((s) => s.memberId !== ownerMember.id && s.memberId !== ownerMember.userId)
      .reduce((sum, s) => sum + Number(s.percentage), 0);

    // This is always >= 0 because of the guard above
    const remainingForOwner = Math.round((100 - nonOwnerSum) * 100) / 100;

    if (ownerIndex >= 0) {
      currentShares[ownerIndex].percentage = remainingForOwner;
    } else {
      currentShares.unshift({ memberId: ownerMember.id, percentage: remainingForOwner });
    }
  }

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

  const inviter = await prisma.user.findUnique({
    where: { id: inviterId },
    select: { fullName: true, email: true },
  });
  const inviterName = inviter?.fullName || inviter?.email || 'A Pool Owner';

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

      // Send email notification to existing user
      const poolUrl = `${env.FRONTEND_URL}/dashboard/pools/${pool.id}`;
      try {
        await sendEmail({
          to: existingUser.email,
          subject: `You've been added to "${pool.name}" on SplitPay`,
          text: `Hello ${existingUser.fullName || ''},\n\n${inviterName} has added you as a collaborator to the pool "${pool.name}" on SplitPay.\n\nView pool: ${poolUrl}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">You've Been Added to a Pool</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello ${existingUser.fullName || ''},</p>
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                <strong>${inviterName}</strong> has added you as a collaborator to the pool <strong>"${pool.name}"</strong> on SplitPay.
              </p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${poolUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">View Pool</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.4;">Or copy and paste this link into your browser:</p>
              <p style="color: #2563eb; font-size: 13px; word-break: break-all;"><a href="${poolUrl}" style="color: #2563eb;">${poolUrl}</a></p>
            </div>
          `,
        });
      } catch (err) {
        console.error('[Mailer Error] Failed to send addition email to existing user:', err);
      }

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

  // Generate a 3-character letter invite code (e.g. "abc", "xyz")
  let inviteCode = generateCharToken(3);
  let existingToken = await prisma.poolInvitation.findUnique({ where: { token: inviteCode } });
  let attempts = 0;
  while (existingToken && attempts < 15) {
    inviteCode = generateCharToken(3);
    existingToken = await prisma.poolInvitation.findUnique({ where: { token: inviteCode } });
    attempts++;
  }
  const token = existingToken ? `${inviteCode}-${crypto.randomBytes(2).toString('hex')}` : inviteCode;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.poolInvitation.create({
    data: {
      poolId,
      inviterId,
      type: normalizedEmail ? InvitationType.EMAIL : InvitationType.CODE,
      email: normalizedEmail || null,
      code: inviteCode,
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
      metadata: { poolId, email: normalizedEmail, token, code: inviteCode, splitPercentage: dto.splitPercentage },
    },
  });

  // Send invitation email if email was specified
  if (normalizedEmail) {
    const joinUrl = `${env.FRONTEND_URL}/join/${invitation.token}`;
    try {
      const emailContent = formatInvitationEmail({
        inviterName,
        poolName: pool.name,
        role: dto.role,
        splitPercentage: dto.splitPercentage,
        inviteCode: invitation.code || inviteCode,
        joinUrl,
      });

      await sendEmail({
        to: normalizedEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    } catch (err) {
      console.error('[Mailer Error] Failed to send invitation email:', err);
    }
  }

  return {
    id: invitation.token,
    code: invitation.code || inviteCode,
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
      where: {
        poolId,
        type: InvitationType.EMAIL,
        email: { not: null },
        status: { in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] },
      },
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

  const totalParticipants = members.length + invitations.filter(i => i.status === InvitationStatus.PENDING).length;
  const defaultEqualShare = totalParticipants > 0 ? Math.round((100 / totalParticipants) * 100) / 100 : 0;

  const shareMap = new Map<string, number>();
  if (splitConfig && Array.isArray(splitConfig.configuration)) {
    for (const item of splitConfig.configuration as any[]) {
      if (item && item.memberId && item.percentage !== undefined) {
        shareMap.set(String(item.memberId), Number(item.percentage));
      }
    }
  }

  // Map invitations to collaborator shape (only email invitations)
  const invitationCollabs = invitations.map((inv) => {
    let pct = shareMap.get(inv.token) ?? shareMap.get(inv.id) ?? (inv.code ? shareMap.get(inv.code) : undefined);
    if (pct === undefined) {
      pct = splitConfig?.type === 'CUSTOM' ? 0 : defaultEqualShare;
    }
    return {
      id: inv.token,
      projectId: inv.poolId,
      userId: null,
      invitedEmail: inv.email,
      role: 'Collaborator',
      splitPercentage: pct,
      status: inv.status === InvitationStatus.PENDING ? 'INVITED' : 'CONFIRMED',
      createdAt: inv.createdAt,
    };
  });

  // Map confirmed members
  const memberCollabs = members.map((m) => {
    const matchingInvs = invitations.filter(
      (inv) => inv.email && m.user.email && inv.email.toLowerCase() === m.user.email.toLowerCase(),
    );

    let pct = shareMap.get(m.id) ?? shareMap.get(m.userId);
    if (pct === undefined) {
      for (const inv of matchingInvs) {
        const invPct = shareMap.get(inv.token) ?? shareMap.get(inv.id) ?? (inv.code ? shareMap.get(inv.code) : undefined);
        if (invPct !== undefined) {
          pct = invPct;
          break;
        }
      }
    }
    if (pct === undefined) {
      pct = splitConfig?.type === 'CUSTOM' ? (members.length === 1 ? 100 : 0) : defaultEqualShare;
    }

    return {
      id: m.id,
      projectId: m.poolId,
      userId: m.userId,
      invitedEmail: m.user.email,
      role: m.role,
      splitPercentage: pct,
      status: 'CONFIRMED',
      createdAt: m.createdAt,
    };
  });

  // Merge: confirmed members take precedence over their invitations
  const confirmedEmails = new Set(memberCollabs.map((m) => m.invitedEmail?.toLowerCase()).filter(Boolean));
  const pendingOnly = invitationCollabs.filter(
    (inv) => inv.invitedEmail && !confirmedEmails.has(inv.invitedEmail.toLowerCase()),
  );

  return [...memberCollabs, ...pendingOnly];
}

/**
 * Get active invite code for a pool.
 */
export async function getProjectInviteCode(poolId: string, actorId: string) {
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

  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  if (pool.ownerId !== actorId && !membership) {
    throw new AppError(403, 'You do not have access to this Pool', 'FORBIDDEN');
  }

  const codeInvite = await prisma.poolInvitation.findFirst({
    where: {
      poolId,
      type: InvitationType.CODE,
      status: InvitationStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!codeInvite) return null;

  const splitConfig = await prisma.splitConfiguration.findFirst({
    where: { poolId },
    orderBy: { updatedAt: 'desc' },
  });

  let splitPercentage = 0;
  if (splitConfig && Array.isArray(splitConfig.configuration)) {
    const entry = (splitConfig.configuration as any[]).find(
      (s: any) => s && (s.memberId === codeInvite.token || s.memberId === codeInvite.code || s.memberId === codeInvite.id),
    );
    if (entry && entry.percentage !== undefined) {
      splitPercentage = Number(entry.percentage);
    }
  }

  return {
    code: codeInvite.code || codeInvite.token,
    expiresAt: codeInvite.expiresAt,
    splitPercentage,
  };
}

async function cleanupSplitConfigOnRemoval(poolId: string, removedIdentifiers: string[]) {
  const [splitConfig, pool] = await Promise.all([
    prisma.splitConfiguration.findFirst({ where: { poolId }, orderBy: { updatedAt: 'desc' } }),
    prisma.pool.findUnique({
      where: { id: poolId },
      include: { members: { where: { role: PoolRole.OWNER } } },
    }),
  ]);

  if (!splitConfig || !Array.isArray(splitConfig.configuration)) return;

  const removeSet = new Set(removedIdentifiers.filter(Boolean));
  const ownerMember = pool?.members[0];
  const currentShares = (splitConfig.configuration as any[]).filter(
    (s: any) => s && s.memberId && !removeSet.has(String(s.memberId)),
  );

  if (ownerMember) {
    const ownerIndex = currentShares.findIndex((s) => s.memberId === ownerMember.id || s.memberId === ownerMember.userId);
    const nonOwnerSum = currentShares
      .filter((s) => s.memberId !== ownerMember.id && s.memberId !== ownerMember.userId)
      .reduce((sum, s) => sum + Number(s.percentage), 0);

    const remainingForOwner = Math.max(0, Math.round((100 - nonOwnerSum) * 100) / 100);

    if (ownerIndex >= 0) {
      currentShares[ownerIndex].percentage = remainingForOwner;
    } else {
      currentShares.unshift({ memberId: ownerMember.id, percentage: remainingForOwner });
    }
  }

  await prisma.splitConfiguration.update({
    where: { id: splitConfig.id },
    data: {
      configuration: currentShares,
    },
  });
}

/**
 * Revoke a pending invitation or remove a pool member by their collaborator id.
 * Accepts either an invitation token (for pending invites) or a PoolMember id.
 */
export async function removeCollaborator(id: string, actorId: string) {
  // Try treating id as an invitation id, token, or code first
  const invitation = await prisma.poolInvitation.findFirst({
    where: {
      OR: [
        { id },
        { token: id },
        { code: id },
      ],
    },
  });

  if (invitation) {
    const pool = await prisma.pool.findUnique({ where: { id: invitation.poolId } });
    if (pool?.ownerId !== actorId) throw new AppError(403, 'Only the pool owner can revoke invitations', 'FORBIDDEN');

    await prisma.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REVOKED },
    });

    await cleanupSplitConfigOnRemoval(invitation.poolId, [
      invitation.id,
      invitation.token,
      invitation.code || '',
      invitation.email || '',
    ]);

    return;
  }

  // Otherwise treat id as a PoolMember id
  const member = await prisma.poolMember.findUnique({ where: { id }, include: { user: true } });
  if (!member) throw new AppError(404, 'Collaborator not found', 'NOT_FOUND');

  const pool = await prisma.pool.findUnique({ where: { id: member.poolId } });
  if (pool?.ownerId !== actorId && member.userId !== actorId) {
    throw new AppError(403, 'Only the pool owner can remove members', 'FORBIDDEN');
  }

  if (member.role === PoolRole.OWNER) {
    const ownerCount = await prisma.poolMember.count({ where: { poolId: member.poolId, role: PoolRole.OWNER } });
    if (ownerCount <= 1) throw new AppError(400, 'Cannot remove the last owner of the pool', 'LAST_OWNER_REMOVAL_FORBIDDEN');
  }

  await prisma.poolMember.delete({ where: { id: member.id } });

  await cleanupSplitConfigOnRemoval(member.poolId, [
    member.id,
    member.userId,
    member.user?.email || '',
  ]);

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

/**
 * Allow a collaborator to leave a pool.
 */
export async function leavePool(poolId: string, actorId: string) {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  if (pool.ownerId === actorId) {
    throw new AppError(400, 'Pool owner cannot leave the pool.', 'OWNER_CANNOT_LEAVE');
  }

  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: actorId } },
    include: { user: true },
  });

  if (!member) {
    throw new AppError(404, 'You are not a member of this Pool', 'NOT_MEMBER');
  }

  await prisma.poolMember.delete({ where: { id: member.id } });

  await cleanupSplitConfigOnRemoval(poolId, [
    member.id,
    member.userId,
    member.user?.email || '',
  ]);

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL_MEMBER',
      entityId: member.id,
      action: 'MEMBER_LEFT',
      actorId,
      metadata: { poolId, userId: actorId },
    },
  });
}
