import { isHex, stripHexPrefix } from './hex';

/**
 * Validate an Ethereum address
 */
export function isValidEvmAddress(address: string): boolean {
  if (!address.startsWith('0x')) {
    return false;
  }

  const hex = stripHexPrefix(address);
  if (hex.length !== 40) {
    return false;
  }

  return isHex(address);
}

/**
 * Validate a Solana address (base58 encoded, 32-44 characters)
 */
export function isValidSolanaAddress(address: string): boolean {
  // Base58 alphabet (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Checksum an Ethereum address (EIP-55)
 */
export function checksumAddress(address: string): string {
  if (!isValidEvmAddress(address)) {
    throw new Error('Invalid EVM address');
  }

  const hex = stripHexPrefix(address).toLowerCase();

  // We need keccak256 for checksumming, but to avoid importing
  // crypto here, we'll just return lowercase for now
  // The actual checksumming will be done in the crypto package
  return `0x${hex}`;
}

/**
 * Validate a mnemonic phrase word count
 */
export function isValidMnemonicLength(wordCount: number): boolean {
  return [12, 15, 18, 21, 24].includes(wordCount);
}

/**
 * Validate a basic mnemonic format (word count and spacing)
 */
export function isValidMnemonicFormat(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  return isValidMnemonicLength(words.length);
}

/**
 * Validate a hex private key
 */
export function isValidPrivateKey(key: string): boolean {
  const hex = stripHexPrefix(key);
  return hex.length === 64 && isHex(key);
}

/**
 * Validate a derivation path format
 */
export function isValidDerivationPath(path: string): boolean {
  // BIP-32/44 path format: m/purpose'/coin_type'/account'/change/address_index
  const pathRegex = /^m(\/\d+'?)+$/;
  return pathRegex.test(path);
}

/**
 * Sanitize user input string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate a positive amount
 */
export function isValidAmount(amount: bigint): boolean {
  return amount > 0n;
}

/**
 * Validate a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate an RPC URL
 */
export function isValidRpcUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  const parsed = new URL(url);
  return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
}
