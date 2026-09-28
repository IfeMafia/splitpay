"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
function toUserProfile(user) {
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
async function getUserProfile(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new errorHandler_1.AppError(404, 'User not found', 'NOT_FOUND');
    }
    return toUserProfile(user);
}
async function updateUserProfile(userId, dto) {
    const user = await prisma_1.prisma.user.update({
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
async function getUserById(id) {
    return getUserProfile(id);
}
async function updateUser(id, dto) {
    return updateUserProfile(id, dto);
}
//# sourceMappingURL=service.js.map