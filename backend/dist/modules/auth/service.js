"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = verifyGoogleToken;
exports.formatUserProfile = formatUserProfile;
exports.generateToken = generateToken;
exports.register = register;
exports.login = login;
exports.getCurrentUser = getCurrentUser;
exports.googleAuth = googleAuth;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../../lib/prisma");
const env_1 = require("../../config/env");
const mailer_1 = require("../../lib/mailer");
const errorHandler_1 = require("../../middleware/errorHandler");
const client_1 = require("@prisma/client");
async function verifyGoogleToken(credential) {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    let response;
    try {
        response = await fetch(url);
    }
    catch (error) {
        throw new errorHandler_1.AppError(503, 'Failed to connect to Google authentication service', 'GOOGLE_SERVICE_UNAVAILABLE');
    }
    if (!response.ok) {
        throw new errorHandler_1.AppError(401, 'Invalid or expired Google credential', 'INVALID_GOOGLE_TOKEN');
    }
    const payload = (await response.json());
    const isVerified = payload.email_verified === 'true' || payload.email_verified === true;
    if (!isVerified || !payload.email) {
        throw new errorHandler_1.AppError(401, 'Google email address is not verified', 'UNVERIFIED_GOOGLE_EMAIL');
    }
    if (env_1.env.GOOGLE_CLIENT_ID &&
        env_1.env.GOOGLE_CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com' &&
        payload.aud !== env_1.env.GOOGLE_CLIENT_ID &&
        payload.azp !== env_1.env.GOOGLE_CLIENT_ID) {
        throw new errorHandler_1.AppError(401, 'Google Client ID verification failed', 'UNAUTHORIZED_GOOGLE_CLIENT');
    }
    return payload;
}
function formatUserProfile(user) {
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        defaultCurrency: user.defaultCurrency,
        country: user.country,
        createdAt: user.createdAt,
    };
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
}
async function register(dto) {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
        throw new errorHandler_1.AppError(409, 'An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash(dto.password, salt);
    // Use interactive transaction to guarantee user creation + invitation acceptance atomic integrity
    const user = await prisma_1.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                fullName: dto.fullName,
                phone: dto.phone,
                defaultCurrency: dto.defaultCurrency,
                country: dto.country,
            },
        });
        // Check if an invitation token was provided during registration
        if (dto.invitationToken) {
            const invitation = await tx.poolInvitation.findUnique({
                where: { token: dto.invitationToken },
            });
            if (invitation && invitation.status === client_1.InvitationStatus.PENDING && invitation.expiresAt > new Date()) {
                // Automatically add the new user as a pool member
                await tx.poolMember.create({
                    data: {
                        poolId: invitation.poolId,
                        userId: newUser.id,
                        role: client_1.PoolRole.MEMBER,
                    },
                });
                // Mark invitation accepted
                await tx.poolInvitation.update({
                    where: { id: invitation.id },
                    data: { status: client_1.InvitationStatus.ACCEPTED },
                });
                // Trigger welcome notification
                await tx.notification.create({
                    data: {
                        userId: newUser.id,
                        title: 'Welcome to Splitpay Pool!',
                        message: 'You have joined a pool via your invitation link.',
                        type: 'POOL_JOINED',
                        data: { poolId: invitation.poolId },
                    },
                });
            }
        }
        return newUser;
    });
    const token = generateToken({ id: user.id, email: user.email });
    return {
        user: formatUserProfile(user),
        token,
    };
}
async function login(dto) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
        throw new errorHandler_1.AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    const isMatch = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
    if (!isMatch) {
        throw new errorHandler_1.AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    const token = generateToken({ id: user.id, email: user.email });
    return {
        user: formatUserProfile(user),
        token,
    };
}
async function getCurrentUser(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new errorHandler_1.AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return formatUserProfile(user);
}
async function googleAuth(dto) {
    const googleUser = await verifyGoogleToken(dto.credential);
    const normalizedEmail = googleUser.email.toLowerCase();
    let user = await prisma_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user) {
        user = await prisma_1.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    fullName: googleUser.name || normalizedEmail.split('@')[0],
                    defaultCurrency: 'NGN',
                    country: 'NG',
                },
            });
            if (dto.invitationToken) {
                const invitation = await tx.poolInvitation.findUnique({
                    where: { token: dto.invitationToken },
                });
                if (invitation && invitation.status === client_1.InvitationStatus.PENDING && invitation.expiresAt > new Date()) {
                    await tx.poolMember.create({
                        data: {
                            poolId: invitation.poolId,
                            userId: newUser.id,
                            role: client_1.PoolRole.MEMBER,
                        },
                    });
                    await tx.poolInvitation.update({
                        where: { id: invitation.id },
                        data: { status: client_1.InvitationStatus.ACCEPTED },
                    });
                    await tx.notification.create({
                        data: {
                            userId: newUser.id,
                            title: 'Welcome to Splitpay Pool!',
                            message: 'You have joined a pool via your invitation link.',
                            type: 'POOL_JOINED',
                            data: { poolId: invitation.poolId },
                        },
                    });
                }
            }
            return newUser;
        });
    }
    else if (dto.invitationToken) {
        const invitation = await prisma_1.prisma.poolInvitation.findUnique({
            where: { token: dto.invitationToken },
        });
        if (invitation && invitation.status === client_1.InvitationStatus.PENDING && invitation.expiresAt > new Date()) {
            const existingMember = await prisma_1.prisma.poolMember.findUnique({
                where: {
                    poolId_userId: {
                        poolId: invitation.poolId,
                        userId: user.id,
                    },
                },
            });
            if (!existingMember) {
                await prisma_1.prisma.poolMember.create({
                    data: {
                        poolId: invitation.poolId,
                        userId: user.id,
                        role: client_1.PoolRole.MEMBER,
                    },
                });
                await prisma_1.prisma.poolInvitation.update({
                    where: { id: invitation.id },
                    data: { status: client_1.InvitationStatus.ACCEPTED },
                });
            }
        }
    }
    const token = generateToken({ id: user.id, email: user.email });
    return {
        user: formatUserProfile(user),
        token,
    };
}
async function forgotPassword(dto) {
    const email = dto.email.trim().toLowerCase();
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        // Return friendly success message to prevent account enumeration
        return { message: "If an account with that email exists, password reset instructions have been generated." };
    }
    const db = prisma_1.prisma;
    // Delete any existing reset tokens for this email
    await db.passwordResetToken.deleteMany({
        where: { email },
    });
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration
    await db.passwordResetToken.create({
        data: {
            email,
            token: resetToken,
            expiresAt,
        },
    });
    const resetUrl = `${env_1.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    try {
        await (0, mailer_1.sendEmail)({
            to: email,
            subject: 'Reset your SplitPay Password',
            text: `You requested a password reset for your SplitPay account.\n\nPlease click the link below or copy it into your browser to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">You requested a password reset for your <strong>SplitPay</strong> account.</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.4;">Or copy and paste this link into your browser:</p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
        });
    }
    catch (err) {
        console.error('[Mailer Error] Failed to send password reset email:', err);
    }
    return {
        message: "Password reset link sent to your email.",
        token: resetToken,
    };
}
async function resetPassword(dto) {
    const db = prisma_1.prisma;
    const resetTokenRecord = await db.passwordResetToken.findUnique({
        where: { token: dto.token },
    });
    if (!resetTokenRecord || resetTokenRecord.expiresAt < new Date()) {
        throw new errorHandler_1.AppError(400, "Invalid or expired password reset link", "INVALID_RESET_TOKEN");
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash(dto.newPassword, salt);
    await prisma_1.prisma.user.update({
        where: { email: resetTokenRecord.email },
        data: { passwordHash },
    });
    // Delete used token
    await db.passwordResetToken.delete({
        where: { id: resetTokenRecord.id },
    });
    return { message: "Password reset successfully. You can now log in with your new password." };
}
//# sourceMappingURL=service.js.map