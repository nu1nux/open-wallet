import { ed25519 } from '@noble/curves/ed25519';
import { HDKey } from '@scure/bip32';
import { Account, ChainFamily, getDerivationPath } from '@wallet-suite/types';
import { HDWallet } from './hd-wallet';
import { randomUuid } from '@wallet-suite/crypto';

// Base58 alphabet used by Solana
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Solana account with private key access
 */
export interface SolanaAccountWithKey extends Account {
  /** Private key (64 bytes - 32 bytes seed + 32 bytes public key, base58) */
  privateKey: string;
  /** Secret seed (32 bytes, base58) */
  secretSeed: string;
}

/**
 * Encode bytes to Base58
 */
export function encodeBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  // Convert to BigInt for division
  let value = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  const chars: string[] = [];

  while (value > 0n) {
    const remainder = Number(value % 58n);
    chars.unshift(BASE58_ALPHABET[remainder]);
    value = value / 58n;
  }

  // Handle leading zeros
  for (const byte of bytes) {
    if (byte === 0) {
      chars.unshift(BASE58_ALPHABET[0]);
    } else {
      break;
    }
  }

  return chars.join('');
}

/**
 * Decode Base58 to bytes
 */
export function decodeBase58(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);

  let value = 0n;
  for (const char of str) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
    value = value * 58n + BigInt(index);
  }

  // Convert BigInt to bytes
  let hex = value.toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  const bytes = new Uint8Array(Buffer.from(hex, 'hex'));

  // Handle leading zeros
  let leadingZeros = 0;
  for (const char of str) {
    if (char === BASE58_ALPHABET[0]) {
      leadingZeros++;
    } else {
      break;
    }
  }

  if (leadingZeros > 0) {
    const result = new Uint8Array(leadingZeros + bytes.length);
    result.set(bytes, leadingZeros);
    return result;
  }

  return bytes;
}

/**
 * Derive Solana public key from private seed
 */
export function seedToSolanaPublicKey(seed: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(seed);
}

/**
 * Derive Solana address (public key in base58) from private seed
 */
export function seedToSolanaAddress(seed: Uint8Array): string {
  const publicKey = seedToSolanaPublicKey(seed);
  return encodeBase58(publicKey);
}

/**
 * Create a Solana account from HD key
 * Note: Solana uses the first 32 bytes of the derived key as the ed25519 seed
 */
export function createSolanaAccountFromHDKey(
  hdKey: HDKey,
  index: number,
  name?: string
): SolanaAccountWithKey {
  if (!hdKey.privateKey) {
    throw new Error('HD key does not contain private key');
  }

  // Use the private key bytes as the ed25519 seed
  const seed = hdKey.privateKey;
  const publicKey = seedToSolanaPublicKey(seed);
  const address = encodeBase58(publicKey);
  const derivationPath = getDerivationPath(ChainFamily.SOLANA, index);

  // Solana private key format: 64 bytes (32 seed + 32 public)
  const fullPrivateKey = new Uint8Array(64);
  fullPrivateKey.set(seed);
  fullPrivateKey.set(publicKey, 32);

  return {
    id: randomUuid(),
    name: name ?? `Solana Account ${index + 1}`,
    address,
    chainFamily: ChainFamily.SOLANA,
    derivationPath,
    index,
    publicKey: encodeBase58(publicKey),
    privateKey: encodeBase58(fullPrivateKey),
    secretSeed: encodeBase58(seed),
    createdAt: Date.now(),
  };
}

/**
 * Create a Solana account from mnemonic
 */
export function createSolanaAccountFromMnemonic(
  mnemonic: string,
  index: number,
  name?: string,
  passphrase = ''
): SolanaAccountWithKey {
  const wallet = HDWallet.fromMnemonic(mnemonic, passphrase);
  const hdKey = wallet.deriveSolanaKey(index);
  return createSolanaAccountFromHDKey(hdKey, index, name);
}

/**
 * Create a Solana account from secret seed (32 bytes)
 */
export function createSolanaAccountFromSeed(
  seed: Uint8Array | string,
  name?: string
): SolanaAccountWithKey {
  const seedBytes =
    typeof seed === 'string' ? decodeBase58(seed) : seed;

  if (seedBytes.length !== 32) {
    throw new Error('Solana seed must be 32 bytes');
  }

  const publicKey = seedToSolanaPublicKey(seedBytes);
  const address = encodeBase58(publicKey);

  const fullPrivateKey = new Uint8Array(64);
  fullPrivateKey.set(seedBytes);
  fullPrivateKey.set(publicKey, 32);

  return {
    id: randomUuid(),
    name: name ?? 'Imported Solana Account',
    address,
    chainFamily: ChainFamily.SOLANA,
    derivationPath: '',
    index: -1,
    publicKey: encodeBase58(publicKey),
    privateKey: encodeBase58(fullPrivateKey),
    secretSeed: encodeBase58(seedBytes),
    createdAt: Date.now(),
  };
}

/**
 * Sign a message with a Solana private key
 * Returns the signature in base58 format
 */
export function signSolanaMessage(message: Uint8Array, seed: Uint8Array): string {
  const signature = ed25519.sign(message, seed);
  return encodeBase58(signature);
}

/**
 * Verify a Solana signature
 */
export function verifySolanaSignature(
  message: Uint8Array,
  signature: Uint8Array | string,
  publicKey: Uint8Array | string
): boolean {
  const sigBytes = typeof signature === 'string' ? decodeBase58(signature) : signature;
  const pubKeyBytes = typeof publicKey === 'string' ? decodeBase58(publicKey) : publicKey;

  return ed25519.verify(sigBytes, message, pubKeyBytes);
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = decodeBase58(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}
