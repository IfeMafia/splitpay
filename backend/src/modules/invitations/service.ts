import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { sendEmail } from '../../lib/mailer';
import { CreateEmailInviteDto, CreateCodeInviteDto } from './validators';
import { InvitationResponse, PoolMemberResponse } from '../../contracts';
import { InvitationStatus, InvitationType, PoolRole } from '@prisma/client';

function generateRandomCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSecureToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function createCodeInvitation(
  poolId: string,
  inviterId: string,
  dto: CreateCodeInviteDto,
): Promise<InvitationResponse> {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');

  const code = generateRandomCode(6);
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000);

  const invitation = await prisma.poolInvitation.create({
    data: {
      poolId,
      inviterId,
      type: InvitationType.CODE,
      code,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    },
    include: {
      pool: {
        select: { id: true, name: true, currency: true },
      },
    },
  });

  return {
    id: invitation.id,
    poolId: invitation.poolId,
    inviterId: invitation.inviterId,
    type: invitation.type,
    code: invitation.code,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    pool: invitation.pool,
  };
}

export async function createEmailInvitation(
  poolId: string,
  inviterId: string,
  dto: CreateEmailInviteDto,
): Promise<InvitationResponse> {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');

  const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000);

  const invitation = await prisma.poolInvitation.create({
    data: {
      poolId,
      inviterId,
      type: InvitationType.EMAIL,
      email: dto.email.toLowerCase(),
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    },
    include: {
      pool: {
        select: { id: true, name: true, currency: true },
      },
    },
  });

  const inviteLink = `${env.FRONTEND_URL}/invitations/${token}`;

  await sendEmail({
    to: dto.email,
    subject: `You're invited to join "${pool.name}" on Splitpay`,
    html: `
      <h2>You've been invited to Splitpay!</h2>
      <p><strong>${inviter?.fullName || 'A collaborator'}</strong> has invited you to join the pool <strong>${pool.name}</strong>.</p>
      <p><a href="${inviteLink}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Accept Invitation</a></p>
      <p>Or visit: <a href="${inviteLink}">${inviteLink}</a></p>
      <p><small>This link expires in ${dto.expiresInDays} days.</small></p>
    `,
    text: `You have been invited to join "${pool.name}" on Splitpay by ${inviter?.fullName || 'a collaborator'}. Accept your invite here: ${inviteLink}`,
  });

  return {
    id: invitation.id,
    poolId: invitation.poolId,
    inviterId: invitation.inviterId,
    type: invitation.type,
    email: invitation.email,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    pool: invitation.pool,
  };
}

export async function getPoolInvitations(poolId: string): Promise<InvitationResponse[]> {
  const invitations = await prisma.poolInvitation.findMany({
    where: { poolId },
    orderBy: { createdAt: 'desc' },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    poolId: inv.poolId,
    inviterId: inv.inviterId,
    type: inv.type,
    code: inv.code,
    email: inv.email,
    token: inv.token,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  }));
}

export async function revokeInvitation(poolId: string, invitationId: string): Promise<void> {
  const invitation = await prisma.poolInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.poolId !== poolId) {
    throw new AppError(404, 'Invitation not found', 'NOT_FOUND');
  }

  await prisma.poolInvitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.REVOKED },
  });
}

export async function getInvitationByToken(tokenOrCode: string): Promise<InvitationResponse> {
  const invitation = await prisma.poolInvitation.findFirst({
    where: {
      OR: [
        { token: tokenOrCode },
        { code: tokenOrCode.toUpperCase() },
      ],
    },
    include: {
      pool: {
        select: { id: true, name: true, currency: true },
      },
    },
  });

  if (!invitation) {
    throw new AppError(404, 'Invitation not found', 'NOT_FOUND');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(400, `Invitation is ${invitation.status.toLowerCase()}`, 'INVITATION_INACTIVE');
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new AppError(410, 'Invitation has expired', 'INVITATION_EXPIRED');
  }

  return {
    id: invitation.id,
    poolId: invitation.poolId,
    inviterId: invitation.inviterId,
    type: invitation.type,
    code: invitation.code,
    email: invitation.email,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    pool: invitation.pool,
  };
}

export async function acceptInvitation(tokenOrCode: string, userId: string): Promise<PoolMemberResponse> {
  const invitation = await prisma.poolInvitation.findFirst({
    where: {
      OR: [
        { token: tokenOrCode },
        { code: tokenOrCode.toUpperCase() },
      ],
    },
  });

  if (!invitation) {
    throw new AppError(404, 'Invitation not found', 'NOT_FOUND');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(400, `Invitation has already been ${invitation.status.toLowerCase()}`, 'INVITATION_INACTIVE');
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new AppError(410, 'Invitation has expired', 'INVITATION_EXPIRED');
  }

  // Check if user is already a member
  const existingMember = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId: invitation.poolId,
        userId,
      },
    },
  });

  if (existingMember) {
    // Already in pool, mark accepted and return member
    await prisma.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });
    const member = await prisma.poolMember.findUnique({
      where: { id: existingMember.id },
      include: { user: true },
    });
    return {
      id: member!.id,
      poolId: member!.poolId,
      userId: member!.userId,
      role: member!.role,
      createdAt: member!.createdAt,
      user: {
        id: member!.user.id,
        email: member!.user.email,
        fullName: member!.user.fullName,
        defaultCurrency: member!.user.defaultCurrency,
        createdAt: member!.user.createdAt,
      },
    };
  }

  const member = await prisma.$transaction(async (tx) => {
    const newMember = await tx.poolMember.create({
      data: {
        poolId: invitation.poolId,
        userId,
        role: PoolRole.MEMBER,
      },
      include: { user: true },
    });

    await tx.poolInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Joined Pool',
        message: 'You have successfully joined the pool.',
        type: 'POOL_JOINED',
        data: { poolId: invitation.poolId },
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: 'POOL_INVITATION',
        entityId: invitation.id,
        action: 'INVITATION_ACCEPTED',
        actorId: userId,
        metadata: { poolId: invitation.poolId, memberId: newMember.id },
      },
    });

    return newMember;
  });

  return {
    id: member.id,
    poolId: member.poolId,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    user: {
      id: member.user.id,
      email: member.user.email,
      fullName: member.user.fullName,
      defaultCurrency: member.user.defaultCurrency,
      createdAt: member.user.createdAt,
    },
  };
}
