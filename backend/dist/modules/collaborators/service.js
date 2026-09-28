"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvitation = createInvitation;
exports.getProjectCollaborators = getProjectCollaborators;
exports.removeCollaborator = removeCollaborator;
exports.leavePool = leavePool;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../../lib/prisma");
const env_1 = require("../../config/env");
const mailer_1 = require("../../lib/mailer");
const errorHandler_1 = require("../../middleware/errorHandler");
const client_1 = require("@prisma/client");
const token_1 = require("../../utils/token");
async function persistMemberSplit(poolId, memberOrTokenId, percentage) {
    const existingConfig = await prisma_1.prisma.splitConfiguration.findFirst({
        where: { poolId },
    });
    let currentShares = [];
    if (existingConfig && Array.isArray(existingConfig.configuration)) {
        currentShares = existingConfig.configuration.filter((s) => s && s.memberId !== memberOrTokenId);
    }
    currentShares.push({ memberId: memberOrTokenId, percentage });
    if (existingConfig) {
        await prisma_1.prisma.splitConfiguration.update({
            where: { id: existingConfig.id },
            data: {
                type: 'CUSTOM',
                configuration: currentShares,
            },
        });
    }
    else {
        await prisma_1.prisma.splitConfiguration.create({
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
async function createInvitation(inviterId, dto) {
    const poolId = dto.projectId || dto.poolId;
    if (!poolId)
        throw new errorHandler_1.AppError(400, 'Pool ID is required', 'BAD_REQUEST');
    // Verify pool exists and actor has access
    const pool = await prisma_1.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool)
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
    if (pool.ownerId !== inviterId)
        throw new errorHandler_1.AppError(403, 'Only the pool owner can invite collaborators', 'FORBIDDEN');
    const inviter = await prisma_1.prisma.user.findUnique({
        where: { id: inviterId },
        select: { fullName: true, email: true },
    });
    const inviterName = inviter?.fullName || inviter?.email || 'A Pool Owner';
    const normalizedEmail = dto.invitedEmail?.trim().toLowerCase();
    // If email is provided, check if user already exists on the platform
    if (normalizedEmail) {
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            // Check if user is already a member
            const existingMember = await prisma_1.prisma.poolMember.findUnique({
                where: {
                    poolId_userId: {
                        poolId,
                        userId: existingUser.id,
                    },
                },
            });
            if (existingMember) {
                throw new errorHandler_1.AppError(409, 'User is already a member of this Pool', 'ALREADY_A_MEMBER');
            }
            // Add them as a PoolMember directly
            const member = await prisma_1.prisma.poolMember.create({
                data: {
                    poolId,
                    userId: existingUser.id,
                    role: dto.role === 'OWNER' ? client_1.PoolRole.OWNER : client_1.PoolRole.MEMBER,
                },
            });
            // Send in-app notification to the existing user
            await prisma_1.prisma.notification.create({
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
            await prisma_1.prisma.auditLog.create({
                data: {
                    entityType: 'POOL_MEMBER',
                    entityId: member.id,
                    action: 'MEMBER_ADDED',
                    actorId: inviterId,
                    metadata: { poolId, userId: existingUser.id, email: normalizedEmail },
                },
            });
            // Send email notification to existing user
            const poolUrl = `${env_1.env.FRONTEND_URL}/dashboard/pools/${pool.id}`;
            try {
                await (0, mailer_1.sendEmail)({
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
            }
            catch (err) {
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
        const existingInvite = await prisma_1.prisma.poolInvitation.findFirst({
            where: {
                poolId,
                email: normalizedEmail,
                status: client_1.InvitationStatus.PENDING,
            },
        });
        if (existingInvite) {
            throw new errorHandler_1.AppError(409, 'An invitation for this email is already pending', 'INVITATION_ALREADY_PENDING');
        }
    }
    // Generate a 3-character letter invite code (e.g. "abc", "xyz")
    let inviteCode = (0, token_1.generateCharToken)(3);
    let existingToken = await prisma_1.prisma.poolInvitation.findUnique({ where: { token: inviteCode } });
    let attempts = 0;
    while (existingToken && attempts < 15) {
        inviteCode = (0, token_1.generateCharToken)(3);
        existingToken = await prisma_1.prisma.poolInvitation.findUnique({ where: { token: inviteCode } });
        attempts++;
    }
    const token = existingToken ? `${inviteCode}-${crypto_1.default.randomBytes(2).toString('hex')}` : inviteCode;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = await prisma_1.prisma.poolInvitation.create({
        data: {
            poolId,
            inviterId,
            type: normalizedEmail ? client_1.InvitationType.EMAIL : client_1.InvitationType.CODE,
            email: normalizedEmail || null,
            code: inviteCode,
            token,
            status: client_1.InvitationStatus.PENDING,
            expiresAt,
        },
    });
    // Persist split percentage if provided
    if (dto.splitPercentage && dto.splitPercentage > 0) {
        await persistMemberSplit(poolId, invitation.token, dto.splitPercentage);
    }
    await prisma_1.prisma.auditLog.create({
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
        const joinUrl = `${env_1.env.FRONTEND_URL}/join/${invitation.token}`;
        try {
            await (0, mailer_1.sendEmail)({
                to: normalizedEmail,
                subject: `You've been invited to join "${pool.name}" on SplitPay`,
                text: `Hello,\n\n${inviterName} has invited you to collaborate on the pool "${pool.name}" on SplitPay.\n\nClick the link below to accept the invitation and join:\n${joinUrl}\n\nInvite Code: ${invitation.code || inviteCode}\n\nThis invitation link will expire in 7 days.`,
                html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">You're Invited!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">
              <strong>${inviterName}</strong> has invited you to collaborate on <strong>"${pool.name}"</strong> on SplitPay.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Invite Code</p>
              <p style="margin: 0; font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: 3px; color: #0f172a;">${(invitation.code || inviteCode).toUpperCase()}</p>
            </div>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${joinUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.4;">Or copy and paste this link into your browser:</p>
            <p style="color: #2563eb; font-size: 13px; word-break: break-all;"><a href="${joinUrl}" style="color: #2563eb;">${joinUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">This invitation link will expire in 7 days.</p>
          </div>
        `,
            });
        }
        catch (err) {
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
async function getProjectCollaborators(poolId, actorId) {
    const [pool, membership] = await Promise.all([
        prisma_1.prisma.pool.findUnique({
            where: { id: poolId },
            select: { ownerId: true },
        }),
        prisma_1.prisma.poolMember.findUnique({
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
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
    }
    if (pool.ownerId !== actorId && !membership) {
        throw new errorHandler_1.AppError(403, 'You do not have access to this Pool collaborators', 'FORBIDDEN');
    }
    const [invitations, members, splitConfig] = await Promise.all([
        prisma_1.prisma.poolInvitation.findMany({
            where: { poolId, status: { in: [client_1.InvitationStatus.PENDING, client_1.InvitationStatus.ACCEPTED] } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.poolMember.findMany({
            where: { poolId },
            include: { user: { select: { id: true, email: true, fullName: true } } },
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.splitConfiguration.findFirst({
            where: { poolId },
            orderBy: { updatedAt: 'desc' },
        }),
    ]);
    const shareMap = new Map();
    if (splitConfig && Array.isArray(splitConfig.configuration)) {
        for (const item of splitConfig.configuration) {
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
        status: inv.status === client_1.InvitationStatus.PENDING ? 'INVITED' : 'CONFIRMED',
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
    const pendingOnly = invitationCollabs.filter((inv) => !inv.invitedEmail || !confirmedEmails.has(inv.invitedEmail.toLowerCase()));
    return [...memberCollabs, ...pendingOnly];
}
/**
 * Revoke a pending invitation or remove a pool member by their collaborator id.
 * Accepts either an invitation token (for pending invites) or a PoolMember id.
 */
async function removeCollaborator(id, actorId) {
    // Try treating id as an invitation id, token, or code first
    const invitation = await prisma_1.prisma.poolInvitation.findFirst({
        where: {
            OR: [
                { id },
                { token: id },
                { code: id },
            ],
        },
    });
    if (invitation) {
        const pool = await prisma_1.prisma.pool.findUnique({ where: { id: invitation.poolId } });
        if (pool?.ownerId !== actorId)
            throw new errorHandler_1.AppError(403, 'Only the pool owner can revoke invitations', 'FORBIDDEN');
        await prisma_1.prisma.poolInvitation.update({
            where: { id: invitation.id },
            data: { status: client_1.InvitationStatus.REVOKED },
        });
        return;
    }
    // Otherwise treat id as a PoolMember id
    const member = await prisma_1.prisma.poolMember.findUnique({ where: { id } });
    if (!member)
        throw new errorHandler_1.AppError(404, 'Collaborator not found', 'NOT_FOUND');
    const pool = await prisma_1.prisma.pool.findUnique({ where: { id: member.poolId } });
    if (pool?.ownerId !== actorId && member.userId !== actorId) {
        throw new errorHandler_1.AppError(403, 'Only the pool owner can remove members', 'FORBIDDEN');
    }
    if (member.role === client_1.PoolRole.OWNER) {
        const ownerCount = await prisma_1.prisma.poolMember.count({ where: { poolId: member.poolId, role: client_1.PoolRole.OWNER } });
        if (ownerCount <= 1)
            throw new errorHandler_1.AppError(400, 'Cannot remove the last owner of the pool', 'LAST_OWNER_REMOVAL_FORBIDDEN');
    }
    await prisma_1.prisma.poolMember.delete({ where: { id } });
    await prisma_1.prisma.auditLog.create({
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
async function leavePool(poolId, actorId) {
    const pool = await prisma_1.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool)
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
    if (pool.ownerId === actorId) {
        throw new errorHandler_1.AppError(400, 'Pool owner cannot leave the pool.', 'OWNER_CANNOT_LEAVE');
    }
    const member = await prisma_1.prisma.poolMember.findUnique({
        where: { poolId_userId: { poolId, userId: actorId } },
    });
    if (!member) {
        throw new errorHandler_1.AppError(404, 'You are not a member of this Pool', 'NOT_MEMBER');
    }
    await prisma_1.prisma.poolMember.delete({ where: { id: member.id } });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'POOL_MEMBER',
            entityId: member.id,
            action: 'MEMBER_LEFT',
            actorId,
            metadata: { poolId, userId: actorId },
        },
    });
}
//# sourceMappingURL=service.js.map