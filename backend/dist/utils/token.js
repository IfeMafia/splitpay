"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShortToken = generateShortToken;
exports.generateCharToken = generateCharToken;
exports.generateDigitCode = generateDigitCode;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a short, readable token formatted as 3 blocks of letters separated by hyphens
 * Example: "abc-def-ghi", "wxy-zab-cde"
 */
function generateShortToken(chunkLength = 3, numChunks = 3) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const chunks = [];
    for (let i = 0; i < numChunks; i++) {
        let chunk = '';
        for (let j = 0; j < chunkLength; j++) {
            const randomIndex = crypto_1.default.randomInt(0, letters.length);
            chunk += letters[randomIndex];
        }
        chunks.push(chunk);
    }
    return chunks.join('-');
}
/**
 * Generates a short code consisting of characters/letters only.
 * Default: 3 characters (e.g. "abc", "xyz", "kfa")
 */
function generateCharToken(length = 3) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto_1.default.randomInt(0, letters.length);
        code += letters[randomIndex];
    }
    return code;
}
/**
 * Generates a short numeric code consisting of digits only.
 * Default: 3 digits (e.g. "482", "719")
 */
function generateDigitCode(length = 3) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += crypto_1.default.randomInt(0, 10).toString();
    }
    return code;
}
//# sourceMappingURL=token.js.map