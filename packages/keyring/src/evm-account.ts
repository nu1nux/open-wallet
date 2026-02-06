import { secp256k1 } from '@noble/curves/secp256k1.js';
import { HDKey } from '@scure/bip32';
import { keccak256, checksumEvmAddress } from '@open-wallet/crypto';
import { Account, ChainFamily, getDerivationPath } from '@open-wallet/types';
import { HDWallet } from './hd-wallet';
import { randomUuid } from '@open-wallet/crypto';

/**
 * EVM account with private key access
 */
export interface EvmAccountWithKey extends Account {
  /** Private key (32 bytes, hex without 0x) */
  privateKey: string;
}

/**
 * Derive EVM address from public key
 */
export function publicKeyToEvmAddress(publicKey: Uint8Array): string {
  // Remove the 0x04 prefix if present (uncompressed format)
  const pubKeyBytes = publicKey.length === 65 ? publicKey.slice(1) : publicKey;

  // Keccak256 hash of the public key
  const hash = keccak256(pubKeyBytes);

  // Take the last 20 bytes as the address
  const addressBytes = hash.slice(-20);
  const address = '0x' + Buffer.from(addressBytes).toString('hex');

  // Return checksummed address
  return checksumEvmAddress(address);
}

/**
 * Derive EVM address from private key
 */
export function privateKeyToEvmAddress(privateKey: Uint8Array): string {
  const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed
  return publicKeyToEvmAddress(publicKey);
}

/**
 * Create an EVM account from HD key
 */
export function createEvmAccountFromHDKey(
  hdKey: HDKey,
  index: number,
  name?: string
): EvmAccountWithKey {
  if (!hdKey.privateKey) {
    throw new Error('HD key does not contain private key');
  }

  const privateKey = hdKey.privateKey;
  const publicKey = secp256k1.getPublicKey(privateKey, false);
  const address = publicKeyToEvmAddress(publicKey);
  const derivationPath = getDerivationPath(ChainFamily.EVM, index);

  return {
    id: randomUuid(),
    name: name ?? `EVM Account ${index + 1}`,
    address,
    chainFamily: ChainFamily.EVM,
    derivationPath,
    index,
    publicKey: Buffer.from(publicKey).toString('hex'),
    privateKey: Buffer.from(privateKey).toString('hex'),
    createdAt: Date.now(),
  };
}

/**
 * Create an EVM account from mnemonic
 */
export function createEvmAccountFromMnemonic(
  mnemonic: string,
  index: number,
  name?: string,
  passphrase = ''
): EvmAccountWithKey {
  const wallet = HDWallet.fromMnemonic(mnemonic, passphrase);
  const hdKey = wallet.deriveEvmKey(index);
  return createEvmAccountFromHDKey(hdKey, index, name);
}

/**
 * Create an EVM account from private key
 */
export function createEvmAccountFromPrivateKey(
  privateKey: Uint8Array | string,
  name?: string
): EvmAccountWithKey {
  const privateKeyBytes =
    typeof privateKey === 'string'
      ? new Uint8Array(Buffer.from(privateKey.replace('0x', ''), 'hex'))
      : privateKey;

  if (privateKeyBytes.length !== 32) {
    throw new Error('Private key must be 32 bytes');
  }

  const publicKey = secp256k1.getPublicKey(privateKeyBytes, false);
  const address = publicKeyToEvmAddress(publicKey);

  return {
    id: randomUuid(),
    name: name ?? 'Imported Account',
    address,
    chainFamily: ChainFamily.EVM,
    derivationPath: '',
    index: -1,
    publicKey: Buffer.from(publicKey).toString('hex'),
    privateKey: Buffer.from(privateKeyBytes).toString('hex'),
    createdAt: Date.now(),
  };
}

/**
 * Sign a message with an EVM private key
 * Returns the signature in hex format (r + s + v)
 */
export function signEvmMessage(message: Uint8Array, privateKey: Uint8Array): string {
  const messageHash = keccak256(message);
  const signature = secp256k1.sign(messageHash, privateKey, {
    prehash: false,
    format: 'recovered',
  });
  const r = Buffer.from(signature.slice(0, 32)).toString('hex');
  const s = Buffer.from(signature.slice(32, 64)).toString('hex');
  const v = (signature[64] + 27).toString(16).padStart(2, '0');
  return '0x' + r + s + v;
}

/**
 * Sign an Ethereum personal message (EIP-191)
 */
export function signEvmPersonalMessage(message: string, privateKey: Uint8Array): string {
  const messageBytes = new TextEncoder().encode(message);
  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
  const prefixBytes = new TextEncoder().encode(prefix);
  const fullMessage = new Uint8Array(prefixBytes.length + messageBytes.length);
  fullMessage.set(prefixBytes);
  fullMessage.set(messageBytes, prefixBytes.length);
  return signEvmMessage(fullMessage, privateKey);
}

/**
 * Validate an EVM private key
 */
export function isValidEvmPrivateKey(privateKey: Uint8Array | string): boolean {
  try {
    const keyBytes =
      typeof privateKey === 'string'
        ? new Uint8Array(Buffer.from(privateKey.replace('0x', ''), 'hex'))
        : privateKey;

    if (keyBytes.length !== 32) {
      return false;
    }

    // Check if the key is valid for secp256k1
    secp256k1.getPublicKey(keyBytes);
    return true;
  } catch {
    return false;
  }
}
