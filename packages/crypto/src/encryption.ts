import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from './random';

/**
 * Encryption algorithm
 */
export enum EncryptionAlgorithm {
  AES_256_GCM = 'aes-256-gcm',
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  algorithm: EncryptionAlgorithm;
  /** Initialization vector (base64) */
  iv: string;
  /** Ciphertext with auth tag (base64) */
  ciphertext: string;
}

/**
 * AES-GCM nonce size in bytes (96 bits recommended by NIST)
 */
const AES_GCM_NONCE_SIZE = 12;

/**
 * Encrypt data using AES-256-GCM
 *
 * @param data - Data to encrypt
 * @param key - 32-byte encryption key
 * @returns Encrypted data structure
 */
export function encrypt(data: Uint8Array, key: Uint8Array): EncryptedData {
  if (key.length !== 32) {
    throw new Error('AES-256 requires a 32-byte key');
  }

  const iv = randomBytes(AES_GCM_NONCE_SIZE);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(data);

  return {
    algorithm: EncryptionAlgorithm.AES_256_GCM,
    iv: Buffer.from(iv).toString('base64'),
    ciphertext: Buffer.from(ciphertext).toString('base64'),
  };
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encryptedData - Encrypted data structure
 * @param key - 32-byte encryption key
 * @returns Decrypted data
 */
export function decrypt(encryptedData: EncryptedData, key: Uint8Array): Uint8Array {
  if (encryptedData.algorithm !== EncryptionAlgorithm.AES_256_GCM) {
    throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
  }

  if (key.length !== 32) {
    throw new Error('AES-256 requires a 32-byte key');
  }

  const iv = new Uint8Array(Buffer.from(encryptedData.iv, 'base64'));
  const ciphertext = new Uint8Array(Buffer.from(encryptedData.ciphertext, 'base64'));

  const cipher = gcm(key, iv);
  return cipher.decrypt(ciphertext);
}

/**
 * Encrypt a string
 */
export function encryptString(plaintext: string, key: Uint8Array): EncryptedData {
  const data = new TextEncoder().encode(plaintext);
  return encrypt(data, key);
}

/**
 * Decrypt to a string
 */
export function decryptString(encryptedData: EncryptedData, key: Uint8Array): string {
  const data = decrypt(encryptedData, key);
  return new TextDecoder().decode(data);
}

/**
 * Encrypt JSON data
 */
export function encryptJson<T>(data: T, key: Uint8Array): EncryptedData {
  const json = JSON.stringify(data);
  return encryptString(json, key);
}

/**
 * Decrypt JSON data
 */
export function decryptJson<T>(encryptedData: EncryptedData, key: Uint8Array): T {
  const json = decryptString(encryptedData, key);
  return JSON.parse(json) as T;
}

/**
 * Securely clear a key from memory
 * Note: JavaScript doesn't guarantee memory clearing, but this is best effort
 */
export function clearKey(key: Uint8Array): void {
  key.fill(0);
}
