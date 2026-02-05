import { randomBytes as nobleRandomBytes } from '@noble/hashes/utils';

/**
 * Generate cryptographically secure random bytes
 *
 * Uses the Web Crypto API (crypto.getRandomValues) under the hood,
 * which is available in browsers, Node.js 16+, and other modern runtimes.
 *
 * @param length - Number of bytes to generate
 * @returns Uint8Array of random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return nobleRandomBytes(length);
}

/**
 * Generate a random hex string
 *
 * @param byteLength - Number of bytes (hex string will be 2x this length)
 * @returns Hex string without 0x prefix
 */
export function randomHex(byteLength: number): string {
  return Buffer.from(randomBytes(byteLength)).toString('hex');
}

/**
 * Generate a random hex string with 0x prefix
 *
 * @param byteLength - Number of bytes
 * @returns Hex string with 0x prefix
 */
export function randomHexPrefixed(byteLength: number): string {
  return '0x' + randomHex(byteLength);
}

/**
 * Generate a random 32-byte salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return randomBytes(32);
}

/**
 * Generate a random UUID v4
 */
export function randomUuid(): string {
  const bytes = randomBytes(16);

  // Set version to 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant to RFC4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Buffer.from(bytes).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Generate a random integer in a range [min, max)
 * Uses rejection sampling for uniform distribution
 */
export function randomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error('min must be less than max');
  }

  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;

  let value: number;
  do {
    const bytes = randomBytes(bytesNeeded);
    value = bytes.reduce((acc, byte, i) => acc + byte * 256 ** i, 0);
  } while (value > maxValid);

  return min + (value % range);
}

/**
 * Shuffle an array using Fisher-Yates algorithm with secure randomness
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select a random element from an array
 */
export function randomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Array is empty');
  }
  return array[randomInt(0, array.length)];
}
