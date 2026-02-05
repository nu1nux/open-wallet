/**
 * Check if a string is a valid hex string (with or without 0x prefix)
 */
export function isHex(value: string): boolean {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  return hex.length > 0 && /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Convert bytes to hex string with 0x prefix
 */
export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Add 0x prefix to hex string if not present
 */
export function addHexPrefix(hex: string): string {
  return hex.startsWith('0x') ? hex : `0x${hex}`;
}

/**
 * Remove 0x prefix from hex string if present
 */
export function stripHexPrefix(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

/**
 * Pad hex string to specified byte length
 */
export function padHex(hex: string, byteLength: number): string {
  const cleanHex = stripHexPrefix(hex);
  const targetLength = byteLength * 2;

  if (cleanHex.length > targetLength) {
    throw new Error(`Hex string too long: ${cleanHex.length / 2} bytes > ${byteLength} bytes`);
  }

  return addHexPrefix(cleanHex.padStart(targetLength, '0'));
}

/**
 * Convert a bigint to hex string with 0x prefix
 */
export function bigintToHex(value: bigint): string {
  if (value < 0n) {
    throw new Error('Cannot convert negative bigint to hex');
  }
  return addHexPrefix(value.toString(16));
}

/**
 * Convert hex string to bigint
 */
export function hexToBigint(hex: string): bigint {
  return BigInt(addHexPrefix(hex));
}

/**
 * Convert number to hex string with 0x prefix
 */
export function numberToHex(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Value must be a non-negative integer');
  }
  return addHexPrefix(value.toString(16));
}

/**
 * Convert hex string to number
 */
export function hexToNumber(hex: string): number {
  const value = parseInt(stripHexPrefix(hex), 16);
  if (Number.isNaN(value)) {
    throw new Error('Invalid hex string');
  }
  return value;
}

/**
 * Concatenate multiple hex strings
 */
export function concatHex(...hexStrings: string[]): string {
  return addHexPrefix(hexStrings.map(stripHexPrefix).join(''));
}

/**
 * Compare two hex strings for equality (case-insensitive)
 */
export function hexEquals(a: string, b: string): boolean {
  return stripHexPrefix(a).toLowerCase() === stripHexPrefix(b).toLowerCase();
}

/**
 * Get the byte length of a hex string
 */
export function hexByteLength(hex: string): number {
  return stripHexPrefix(hex).length / 2;
}

/**
 * Slice a hex string (byte-based indices)
 */
export function sliceHex(hex: string, start: number, end?: number): string {
  const cleanHex = stripHexPrefix(hex);
  const startIndex = start * 2;
  const endIndex = end !== undefined ? end * 2 : undefined;
  return addHexPrefix(cleanHex.slice(startIndex, endIndex));
}
