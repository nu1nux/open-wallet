import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { scrypt } from '@noble/hashes/scrypt';
import { sha256 } from '@noble/hashes/sha256';

/**
 * KDF algorithm types
 */
export enum KdfAlgorithm {
  PBKDF2 = 'pbkdf2',
  SCRYPT = 'scrypt',
}

/**
 * PBKDF2 parameters
 */
export interface Pbkdf2Params {
  algorithm: KdfAlgorithm.PBKDF2;
  iterations: number;
  salt: Uint8Array;
  keyLength: number;
}

/**
 * Scrypt parameters
 */
export interface ScryptParams {
  algorithm: KdfAlgorithm.SCRYPT;
  N: number; // CPU/memory cost parameter (power of 2)
  r: number; // Block size
  p: number; // Parallelization parameter
  salt: Uint8Array;
  keyLength: number;
}

/**
 * Union type for KDF parameters
 */
export type KdfParams = Pbkdf2Params | ScryptParams;

/**
 * Default PBKDF2 parameters (OWASP recommended)
 */
export const DEFAULT_PBKDF2_PARAMS: Omit<Pbkdf2Params, 'salt'> = {
  algorithm: KdfAlgorithm.PBKDF2,
  iterations: 600000, // OWASP 2023 recommendation for SHA-256
  keyLength: 32, // 256 bits
};

/**
 * Default Scrypt parameters (secure but slower)
 */
export const DEFAULT_SCRYPT_PARAMS: Omit<ScryptParams, 'salt'> = {
  algorithm: KdfAlgorithm.SCRYPT,
  N: 2 ** 17, // 131072 - ~1 second on modern hardware
  r: 8,
  p: 1,
  keyLength: 32, // 256 bits
};

/**
 * Derive a key from a password using PBKDF2
 */
export function deriveKeyPbkdf2(
  password: string,
  salt: Uint8Array,
  iterations = DEFAULT_PBKDF2_PARAMS.iterations,
  keyLength = DEFAULT_PBKDF2_PARAMS.keyLength
): Uint8Array {
  const passwordBytes = new TextEncoder().encode(password);
  return pbkdf2(sha256, passwordBytes, salt, { c: iterations, dkLen: keyLength });
}

/**
 * Derive a key from a password using Scrypt
 */
export function deriveKeyScrypt(
  password: string,
  salt: Uint8Array,
  params: Partial<Omit<ScryptParams, 'algorithm' | 'salt'>> = {}
): Uint8Array {
  const passwordBytes = new TextEncoder().encode(password);
  const { N, r, p, keyLength } = { ...DEFAULT_SCRYPT_PARAMS, ...params };
  return scrypt(passwordBytes, salt, { N, r, p, dkLen: keyLength });
}

/**
 * Derive a key using the specified algorithm
 */
export function deriveKey(password: string, params: KdfParams): Uint8Array {
  switch (params.algorithm) {
    case KdfAlgorithm.PBKDF2:
      return deriveKeyPbkdf2(password, params.salt, params.iterations, params.keyLength);
    case KdfAlgorithm.SCRYPT:
      return deriveKeyScrypt(password, params.salt, {
        N: params.N,
        r: params.r,
        p: params.p,
        keyLength: params.keyLength,
      });
    default:
      throw new Error(`Unknown KDF algorithm`);
  }
}

/**
 * Serialize KDF parameters to JSON-safe format
 */
export function serializeKdfParams(params: KdfParams): Record<string, unknown> {
  return {
    ...params,
    salt: Buffer.from(params.salt).toString('base64'),
  };
}

/**
 * Deserialize KDF parameters from JSON
 */
export function deserializeKdfParams(data: Record<string, unknown>): KdfParams {
  const salt = Buffer.from(data.salt as string, 'base64');

  if (data.algorithm === KdfAlgorithm.PBKDF2) {
    return {
      algorithm: KdfAlgorithm.PBKDF2,
      iterations: data.iterations as number,
      salt: new Uint8Array(salt),
      keyLength: data.keyLength as number,
    };
  } else if (data.algorithm === KdfAlgorithm.SCRYPT) {
    return {
      algorithm: KdfAlgorithm.SCRYPT,
      N: data.N as number,
      r: data.r as number,
      p: data.p as number,
      salt: new Uint8Array(salt),
      keyLength: data.keyLength as number,
    };
  }

  throw new Error('Unknown KDF algorithm');
}
