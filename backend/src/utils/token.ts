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
