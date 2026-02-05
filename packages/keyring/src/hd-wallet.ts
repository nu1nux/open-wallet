import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from './mnemonic';

/**
 * HD wallet for key derivation
 */
export class HDWallet {
  private readonly masterKey: HDKey;

  private constructor(masterKey: HDKey) {
    this.masterKey = masterKey;
  }

  /**
   * Create HD wallet from mnemonic
   */
  static fromMnemonic(mnemonic: string, passphrase = ''): HDWallet {
    const seed = mnemonicToSeed(mnemonic, passphrase);
    return HDWallet.fromSeed(seed);
  }

  /**
   * Create HD wallet from seed
   */
  static fromSeed(seed: Uint8Array): HDWallet {
    const masterKey = HDKey.fromMasterSeed(seed);
    return new HDWallet(masterKey);
  }

  /**
   * Derive a key at the given path
   *
   * @param path - BIP-32 derivation path (e.g., "m/44'/60'/0'/0/0")
   * @returns Derived HDKey
   */
  derivePath(path: string): HDKey {
    return this.masterKey.derive(path);
  }

  /**
   * Derive a child key at the given index
   *
   * @param index - Child index
   * @param hardened - Whether to use hardened derivation
   * @returns Derived HDKey
   */
  deriveChild(index: number, hardened = false): HDKey {
    const actualIndex = hardened ? index + 0x80000000 : index;
    return this.masterKey.deriveChild(actualIndex);
  }

  /**
   * Get the master public key (extended public key)
   */
  get publicExtendedKey(): string {
    return this.masterKey.publicExtendedKey;
  }

  /**
   * Get the master private key (extended private key)
   * WARNING: Handle with extreme care, this is sensitive data
   */
  get privateExtendedKey(): string {
    return this.masterKey.privateExtendedKey;
  }

  /**
   * Derive an EVM account at the given index
   * Uses path: m/44'/60'/0'/0/{index}
   */
  deriveEvmKey(index: number): HDKey {
    return this.derivePath(`m/44'/60'/0'/0/${index}`);
  }

  /**
   * Derive a Solana account at the given index
   * Uses path: m/44'/501'/{index}'/0'
   */
  deriveSolanaKey(index: number): HDKey {
    return this.derivePath(`m/44'/501'/${index}'/0'`);
  }

  /**
   * Clear sensitive data from memory
   * Note: JavaScript doesn't guarantee memory clearing, but this is best effort
   */
  destroy(): void {
    // HDKey doesn't expose a way to clear its internal data
    // In a real implementation, you'd want to use secure memory handling
  }
}

/**
 * Derive a key from mnemonic at the given path
 */
export function deriveKeyFromMnemonic(
  mnemonic: string,
  path: string,
  passphrase = ''
): HDKey {
  const wallet = HDWallet.fromMnemonic(mnemonic, passphrase);
  return wallet.derivePath(path);
}

/**
 * Parse a derivation path into components
 */
export interface DerivationPathComponent {
  index: number;
  hardened: boolean;
}

export function parseDerivationPath(path: string): DerivationPathComponent[] {
  if (!path.startsWith('m/')) {
    throw new Error('Derivation path must start with "m/"');
  }

  const parts = path.slice(2).split('/');
  return parts.map((part) => {
    const hardened = part.endsWith("'");
    const indexStr = hardened ? part.slice(0, -1) : part;
    const index = parseInt(indexStr, 10);

    if (Number.isNaN(index) || index < 0) {
      throw new Error(`Invalid path component: ${part}`);
    }

    return { index, hardened };
  });
}

/**
 * Build a derivation path from components
 */
export function buildDerivationPath(components: DerivationPathComponent[]): string {
  const parts = components.map((c) => `${c.index}${c.hardened ? "'" : ''}`);
  return 'm/' + parts.join('/');
}
