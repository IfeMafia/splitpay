import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { RegisterDto, LoginDto } from './validators';
import { AuthResponse, UserProfile } from '../../contracts';
import { InvitationStatus, PoolRole } from '@prisma/client';

export function formatUserProfile(user: {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  defaultCurrency: string;
  country?: string | null;
  createdAt: Date;
}): UserProfile {
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

export function generateToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(409, 'An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(dto.password, salt);

  // Use interactive transaction to guarantee user creation + invitation acceptance atomic integrity
  const user = await prisma.$transaction(async (tx) => {
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

      if (invitation && invitation.status === InvitationStatus.PENDING && invitation.expiresAt > new Date()) {
        // Automatically add the new user as a pool member
        await tx.poolMember.create({
          data: {
            poolId: invitation.poolId,
            userId: newUser.id,
            role: PoolRole.MEMBER,
          },
        });

        // Mark invitation accepted
        await tx.poolInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
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

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = generateToken({ id: user.id, email: user.email });

  return {
    user: formatUserProfile(user),
    token,
  };
}

export async function getCurrentUser(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }

  return formatUserProfile(user);
}
