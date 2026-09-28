"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPool = createPool;
exports.getUserPools = getUserPools;
exports.getPoolById = getPoolById;
exports.updatePool = updatePool;
exports.deletePool = deletePool;
exports.getPoolMembers = getPoolMembers;
exports.addPoolMember = addPoolMember;
exports.removePoolMember = removePoolMember;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const client_1 = require("@prisma/client");
async function createPool(userId, dto) {
    const pool = await prisma_1.prisma.$transaction(async (tx) => {
        const newPool = await tx.pool.create({
            data: {
                name: dto.name,
                description: dto.description,
                currency: dto.currency.toUpperCase(),
                ownerId: userId,
                status: client_1.PoolStatus.ACTIVE,
            },
        });
        // Automatically make creator an OWNER member
        await tx.poolMember.create({
            data: {
                poolId: newPool.id,
                userId,
                role: client_1.PoolRole.OWNER,
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
async function getUserPools(userId) {
    const pools = await prisma_1.prisma.pool.findMany({
        where: {
            status: client_1.PoolStatus.ACTIVE,
            members: {
                some: { userId },
            },
        },
        include: {
            _count: {
                select: { members: true },
            },
            members: {
                where: { userId },
                select: { role: true },
            },
            transactions: {
                where: { status: PaymentStatus.SUCCESSFUL },
                select: { amount: true },
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
        userRole: p.ownerId === userId ? 'OWNER' : (p.members[0]?.role || 'MEMBER'),
        totalAmount: p.transactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
    }));
}
async function getPoolById(poolId) {
    const pool = await prisma_1.prisma.pool.findUnique({
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
            transactions: {
                where: { status: PaymentStatus.SUCCESSFUL },
                select: { amount: true },
            },
        },
    });
    if (!pool) {
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
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
        totalAmount: pool.transactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
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
async function updatePool(poolId, userId, dto) {
    const pool = await prisma_1.prisma.pool.update({
        where: { id: poolId },
        data: {
            name: dto.name,
            description: dto.description,
            currency: dto.currency ? dto.currency.toUpperCase() : undefined,
        },
    });
    await prisma_1.prisma.auditLog.create({
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
async function deletePool(poolId, userId) {
    await prisma_1.prisma.pool.update({
        where: { id: poolId },
        data: { status: client_1.PoolStatus.ARCHIVED },
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'POOL',
            entityId: poolId,
            action: 'POOL_ARCHIVED',
            actorId: userId,
        },
    });
}
async function getPoolMembers(poolId) {
    const members = await prisma_1.prisma.poolMember.findMany({
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
async function addPoolMember(poolId, actorId, dto) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
        throw new errorHandler_1.AppError(404, 'User not found. Use the invitation link or email feature to invite them.', 'USER_NOT_FOUND');
    }
    const existingMember = await prisma_1.prisma.poolMember.findUnique({
        where: {
            poolId_userId: {
                poolId,
                userId: user.id,
            },
        },
    });
    if (existingMember) {
        throw new errorHandler_1.AppError(409, 'User is already a member of this Pool', 'ALREADY_A_MEMBER');
    }
    const member = await prisma_1.prisma.poolMember.create({
        data: {
            poolId,
            userId: user.id,
            role: dto.role,
        },
        include: { user: true },
    });
    await prisma_1.prisma.notification.create({
        data: {
            userId: user.id,
            title: 'Added to Pool',
            message: `You were added to a Pool.`,
            type: 'POOL_MEMBER_ADDED',
            data: { poolId, memberId: member.id },
        },
    });
    await prisma_1.prisma.auditLog.create({
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
async function removePoolMember(poolId, memberId, actorId) {
    const member = await prisma_1.prisma.poolMember.findUnique({
        where: { id: memberId },
    });
    if (!member || member.poolId !== poolId) {
        throw new errorHandler_1.AppError(404, 'Pool member not found', 'NOT_FOUND');
    }
    // If member is an OWNER, verify there is at least one other OWNER remaining
    if (member.role === client_1.PoolRole.OWNER) {
        const ownerCount = await prisma_1.prisma.poolMember.count({
            where: { poolId, role: client_1.PoolRole.OWNER },
        });
        if (ownerCount <= 1) {
            throw new errorHandler_1.AppError(400, 'Cannot remove the last owner of the Pool', 'LAST_OWNER_REMOVAL_FORBIDDEN');
        }
    }
    await prisma_1.prisma.poolMember.delete({
        where: { id: memberId },
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'POOL_MEMBER',
            entityId: memberId,
            action: 'MEMBER_REMOVED',
            actorId,
            metadata: { poolId, removedUserId: member.userId },
        },
    });
}
//# sourceMappingURL=service.js.map