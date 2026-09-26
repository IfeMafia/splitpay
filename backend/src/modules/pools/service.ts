import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreatePoolDto, UpdatePoolDto, AddMemberDto } from './validators';
import { PoolResponse, PoolMemberResponse } from '../../contracts';
import { PoolRole, PoolStatus, InvitationType, InvitationStatus } from '@prisma/client';
import { generateCharToken } from '../../utils/token';

export async function createPool(userId: string, dto: CreatePoolDto): Promise<PoolResponse> {
  const pool = await prisma.$transaction(async (tx) => {
    const newPool = await tx.pool.create({
      data: {
        name: dto.name,
        description: dto.description,
        currency: dto.currency.toUpperCase(),
        ownerId: userId,
        status: PoolStatus.ACTIVE,
      },
    });

    // Automatically make creator an OWNER member
    await tx.poolMember.create({
      data: {
        poolId: newPool.id,
        userId,
        role: PoolRole.OWNER,
      },
    });

    // Auto-generate a 3-character invite code for the new pool
    const inviteCode = generateCharToken(3);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await tx.poolInvitation.create({
      data: {
        poolId: newPool.id,
        inviterId: userId,
        type: InvitationType.CODE,
        code: inviteCode,
        token: inviteCode,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
    });

    // Record audit event
    await tx.auditLog.create({
      data: {
        entityType: 'POOL',
        entityId: newPool.id,
        action: 'POOL_CREATED',
        actorId: userId,
        metadata: { name: newPool.name },
      },
    });

    return newPool;
  });

  return {
    id: pool.id,
    ownerId: pool.ownerId,
    name: pool.name,
    description: pool.description,
    currency: pool.currency,
    status: pool.status,
    createdAt: pool.createdAt,
    updatedAt: pool.updatedAt,
    memberCount: 1,
  };
}

export async function getUserPools(userId: string): Promise<PoolResponse[]> {
  const pools = await prisma.pool.findMany({
    where: {
      status: PoolStatus.ACTIVE,
      members: {
        some: { userId },
      },
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return pools.map((p) => ({
    id: p.id,
    ownerId: p.ownerId,
    name: p.name,
    description: p.description,
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    memberCount: p._count.members,
  }));
}

export async function getPoolById(poolId: string): Promise<PoolResponse> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!pool) {
    throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  }

  return {
    id: pool.id,
    ownerId: pool.ownerId,
    name: pool.name,
    description: pool.description,
    currency: pool.currency,
    status: pool.status,
    createdAt: pool.createdAt,
    updatedAt: pool.updatedAt,
    memberCount: pool._count.members,
    members: pool.members.map((m) => ({
      id: m.id,
      poolId: m.poolId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: {
        id: m.user.id,
        email: m.user.email,
        fullName: m.user.fullName,
        defaultCurrency: m.user.defaultCurrency,
        createdAt: m.user.createdAt,
      },
    })),
  };
}

export async function updatePool(poolId: string, userId: string, dto: UpdatePoolDto): Promise<PoolResponse> {
  const pool = await prisma.pool.update({
    where: { id: poolId },
    data: {
      name: dto.name,
      description: dto.description,
      currency: dto.currency ? dto.currency.toUpperCase() : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL',
      entityId: pool.id,
      action: 'POOL_UPDATED',
      actorId: userId,
      metadata: dto,
    },
  });

  return {
    id: pool.id,
    ownerId: pool.ownerId,
    name: pool.name,
    description: pool.description,
    currency: pool.currency,
    status: pool.status,
    createdAt: pool.createdAt,
    updatedAt: pool.updatedAt,
  };
}

export async function deletePool(poolId: string, userId: string): Promise<void> {
  await prisma.pool.update({
    where: { id: poolId },
    data: { status: PoolStatus.ARCHIVED },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL',
      entityId: poolId,
      action: 'POOL_ARCHIVED',
      actorId: userId,
    },
  });
}

export async function getPoolMembers(poolId: string): Promise<PoolMemberResponse[]> {
  const members = await prisma.poolMember.findMany({
    where: { poolId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  return members.map((m) => ({
    id: m.id,
    poolId: m.poolId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    user: {
      id: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName,
      defaultCurrency: m.user.defaultCurrency,
      createdAt: m.user.createdAt,
    },
  }));
}

export async function addPoolMember(poolId: string, actorId: string, dto: AddMemberDto): Promise<PoolMemberResponse> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(404, 'User not found. Use the invitation link or email feature to invite them.', 'USER_NOT_FOUND');
  }

  const existingMember = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new AppError(409, 'User is already a member of this Pool', 'ALREADY_A_MEMBER');
  }

  const member = await prisma.poolMember.create({
    data: {
      poolId,
      userId: user.id,
      role: dto.role as PoolRole,
    },
    include: { user: true },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Added to Pool',
      message: `You were added to a Pool.`,
      type: 'POOL_MEMBER_ADDED',
      data: { poolId, memberId: member.id },
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL_MEMBER',
      entityId: member.id,
      action: 'MEMBER_ADDED',
      actorId,
      metadata: { poolId, userId: user.id, role: member.role },
    },
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

export async function removePoolMember(poolId: string, memberId: string, actorId: string): Promise<void> {
  const member = await prisma.poolMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.poolId !== poolId) {
    throw new AppError(404, 'Pool member not found', 'NOT_FOUND');
  }

  // If member is an OWNER, verify there is at least one other OWNER remaining
  if (member.role === PoolRole.OWNER) {
    const ownerCount = await prisma.poolMember.count({
      where: { poolId, role: PoolRole.OWNER },
    });

    if (ownerCount <= 1) {
      throw new AppError(400, 'Cannot remove the last owner of the Pool', 'LAST_OWNER_REMOVAL_FORBIDDEN');
    }
  }

  await prisma.poolMember.delete({
    where: { id: memberId },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'POOL_MEMBER',
      entityId: memberId,
      action: 'MEMBER_REMOVED',
      actorId,
      metadata: { poolId, removedUserId: member.userId },
    },
  });
}
