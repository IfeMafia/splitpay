import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { UpdateProfileDto } from './validators';
import { UserProfile } from '../../contracts';

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }

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

export async function updateUserProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: dto.fullName,
      phone: dto.phone,
      defaultCurrency: dto.defaultCurrency,
      country: dto.country,
    },
  });

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
