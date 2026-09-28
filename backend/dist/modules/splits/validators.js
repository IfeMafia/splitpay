"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSplitSchema = void 0;
const zod_1 = require("zod");
exports.configureSplitSchema = zod_1.z.object({
    type: zod_1.z.enum(['EQUAL', 'CUSTOM']),
    shares: zod_1.z.array(zod_1.z.object({
        memberId: zod_1.z.string().uuid(),
        percentage: zod_1.z.number().min(0).max(100),
    })).optional(),
}).refine((data) => {
    if (data.type === 'CUSTOM') {
        if (!data.shares || data.shares.length === 0)
            return false;
        const sum = data.shares.reduce((acc, s) => acc + s.percentage, 0);
        return Math.abs(sum - 100) < 0.01;
    }
    return true;
}, {
    message: 'Custom split requires shares summing to exactly 100%',
    path: ['shares'],
});
//# sourceMappingURL=validators.js.map