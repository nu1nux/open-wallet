import { hmac } from '@noble/hashes/hmac.js';
import { ripemd160 as ripemd160Noble } from '@noble/hashes/legacy.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { sha256 as sha256Noble, sha512 as sha512Noble } from '@noble/hashes/sha2.js';

/**
 * Compute SHA-256 hash
 */
export function sha256(data: Uint8Array): Uint8Array {
  return sha256Noble(data);
}

/**
 * Compute SHA-256 hash of a string
 */
export function sha256String(data: string): Uint8Array {
  return sha256(new TextEncoder().encode(data));
}

/**
 * Compute SHA-256 hash and return as hex string
 */
export function sha256Hex(data: Uint8Array): string {
  return Buffer.from(sha256(data)).toString('hex');
}

/**
 * Compute SHA-512 hash
 */
export function sha512(data: Uint8Array): Uint8Array {
  return sha512Noble(data);
}

/**
 * Compute SHA-512 hash of a string
 */
export function sha512String(data: string): Uint8Array {
  return sha512(new TextEncoder().encode(data));
}

/**
 * Compute Keccak-256 hash (used by Ethereum)
 */
export function keccak256(data: Uint8Array): Uint8Array {
  return keccak_256(data);
}

/**
 * Compute Keccak-256 hash of a string
 */
export function keccak256String(data: string): Uint8Array {
  return keccak256(new TextEncoder().encode(data));
}

/**
 * Compute Keccak-256 hash and return as hex string with 0x prefix
 */
export function keccak256Hex(data: Uint8Array): string {
  return '0x' + Buffer.from(keccak256(data)).toString('hex');
}

/**
 * Compute RIPEMD-160 hash
 */
export function ripemd160(data: Uint8Array): Uint8Array {
  return ripemd160Noble(data);
}

/**
 * Compute double SHA-256 hash (used in Bitcoin)
 */
export function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/**
 * Compute hash160 (SHA-256 then RIPEMD-160, used in Bitcoin)
 */
export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * Compute HMAC-SHA256
 */
export function hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  return hmac(sha256Noble, key, data);
}

/**
 * Compute HMAC-SHA512
 */
export function hmacSha512(key: Uint8Array, data: Uint8Array): Uint8Array {
  return hmac(sha512Noble, key, data);
}

/**
 * Checksum an Ethereum address using EIP-55
 */
export function checksumEvmAddress(address: string): string {
  // Remove 0x prefix and lowercase
  const addr = address.toLowerCase().replace('0x', '');
  const hash = Buffer.from(keccak256(new TextEncoder().encode(addr))).toString('hex');

  let checksummed = '0x';
  for (let i = 0; i < addr.length; i++) {
    // If the corresponding hex digit in the hash is >= 8, uppercase
    if (parseInt(hash[i], 16) >= 8) {
      checksummed += addr[i].toUpperCase();
    } else {
      checksummed += addr[i];
    }
  }

  return checksummed;
}

/**
 * Validate an EIP-55 checksummed address
 */
export function isValidChecksumAddress(address: string): boolean {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return false;
  }

  // If all lowercase or all uppercase, consider it valid (non-checksummed)
  if (address === address.toLowerCase() || address === address.toUpperCase().replace('0X', '0x')) {
    return true;
  }

  // Otherwise, verify the checksum
  return address === checksumEvmAddress(address);
}
