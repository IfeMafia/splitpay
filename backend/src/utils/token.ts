import crypto from 'crypto';

/**
 * Generates a short, readable token formatted as 3 blocks of letters separated by hyphens
 * Example: "abc-def-ghi", "wxy-zab-cde"
 */
export function generateShortToken(chunkLength: number = 3, numChunks: number = 3): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const chunks: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    let chunk = '';
    for (let j = 0; j < chunkLength; j++) {
      const randomIndex = crypto.randomInt(0, letters.length);
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
export function generateCharToken(length: number = 3): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, letters.length);
    code += letters[randomIndex];
  }
  return code;
}

/**
 * Generates a short numeric code consisting of digits only.
 * Default: 3 digits (e.g. "482", "719")
 */
export function generateDigitCode(length: number = 3): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

