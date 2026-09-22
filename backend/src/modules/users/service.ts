import { prisma } from '../../lib/prisma';
import { CreateUserDto, UpdateUserDto, UserResponse } from './types';
import { AppError } from '../../middleware/errorHandler';

/**
 * TODO: Hash password with bcrypt before storing.
 * TODO: Check for duplicate email before insert (handle P2002 Prisma error).
 * TODO: Return a sanitized UserResponse (strip passwordHash).
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
 * TODO: Verify password against stored hash.
 * TODO: Generate and return a signed JWT (id, email, exp).
 */
export async function loginUser(
  _email: string,
  _password: string,
): Promise<{ token: string; user: UserResponse }> {
  throw new AppError(501, 'loginUser not implemented', 'NOT_IMPLEMENTED');
}

/**
 * TODO: Fetch user by ID, throw 404 if not found.
 */
export async function getUserById(id: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return toUserResponse(user);
}

/**
 * TODO: Apply partial updates to a user record.
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
