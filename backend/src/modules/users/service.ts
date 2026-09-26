import { prisma } from '../../lib/prisma';
import { UserProfile } from '../../contracts';
import { UpdateProfileDto } from './validators';
import { AppError } from '../../middleware/errorHandler';

function toUserProfile(user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  defaultCurrency: string;
  country: string | null;
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

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }
  return toUserProfile(user);
}

export async function updateUserProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.defaultCurrency !== undefined ? { defaultCurrency: dto.defaultCurrency } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
    },
  });
  return toUserProfile(user);
}

export async function getUserById(id: string): Promise<UserProfile> {
  return getUserProfile(id);
}

export async function updateUser(id: string, dto: UpdateProfileDto): Promise<UserProfile> {
  return updateUserProfile(id, dto);
}

