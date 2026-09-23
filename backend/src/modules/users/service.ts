import { prisma } from '../../lib/prisma';
import { CreateUserDto, UpdateUserDto, UserResponse } from './types';
import { AppError } from '../../middleware/errorHandler';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

/**
 * TODO: Hash password with bcrypt before storing.
 * TODO: Check for duplicate email before insert (handle P2002 Prisma error).
 */
export async function createUser(dto: CreateUserDto): Promise<UserResponse> {
  // TODO: const passwordHash = await bcrypt.hash(dto.password, 12);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      passwordHash: dto.password, // TODO: replace with hashed password
      fullName: dto.fullName,
      phone: dto.phone,
      defaultCurrency: dto.defaultCurrency,
      country: dto.country,
    },
  });
  return toUserResponse(user);
}

/**
 * NOTE: Passwords are stored plain until bcrypt hashing is added to createUser.
 * TODO: Replace direct comparison with: const valid = await bcrypt.compare(password, user.passwordHash);
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<{ token: string; user: UserResponse }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'Invalid email or password', 'UNAUTHORIZED');

  // TODO: replace with bcrypt.compare once hashing is wired
  const valid = password === user.passwordHash;
  if (!valid) throw new AppError(401, 'Invalid email or password', 'UNAUTHORIZED');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { token, user: toUserResponse(user) };
}

/**
 * Fetch user by ID, throw 404 if not found.
 */
export async function getUserById(id: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return toUserResponse(user);
}

/**
 * TODO: Prevent email changes here (separate verification flow).
 */
export async function updateUser(id: string, dto: UpdateUserDto): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id },
    data: dto,
  });
  return toUserResponse(user);
}

function toUserResponse(user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  kycStatus: string;
  defaultCurrency: string;
  country: string;
  createdAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    kycStatus: user.kycStatus as UserResponse['kycStatus'],
    defaultCurrency: user.defaultCurrency,
    country: user.country,
    createdAt: user.createdAt,
  };
}
