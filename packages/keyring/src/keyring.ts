import { Account, ChainFamily, Result, ok, err, ErrorCode } from '@open-wallet/types';
import {
  encryptJson,
  decryptJson,
  deriveKey,
  KdfParams,
  KdfAlgorithm,
  Pbkdf2Params,
  DEFAULT_PBKDF2_PARAMS,
  generateSalt,
  EncryptedData,
} from '@open-wallet/crypto';
import { HDWallet } from './hd-wallet';
import { createEvmAccountFromHDKey, EvmAccountWithKey } from './evm-account';
import { createSolanaAccountFromHDKey, SolanaAccountWithKey } from './solana-account';
import { validateMnemonic, generateMnemonic, MnemonicWordCount } from './mnemonic';

/**
 * Account with its private key
 */
export type AccountWithKey = EvmAccountWithKey | SolanaAccountWithKey;

/**
 * Serialized keyring data (stored encrypted)
 */
interface KeyringData {
  mnemonic: string;
  evmAccounts: EvmAccountWithKey[];
  solanaAccounts: SolanaAccountWithKey[];
  nextEvmIndex: number;
  nextSolanaIndex: number;
}

/**
 * Stored keyring format (encrypted)
 */
export interface StoredKeyring {
  version: number;
  kdf: Record<string, unknown>;
  encrypted: EncryptedData;
}

/**
 * Keyring manages the mnemonic and derived accounts
 */
export class Keyring {
  private mnemonic: string | null = null;
  private evmAccounts: Map<string, EvmAccountWithKey> = new Map();
  private solanaAccounts: Map<string, SolanaAccountWithKey> = new Map();
  private nextEvmIndex = 0;
  private nextSolanaIndex = 0;
  private hdWallet: HDWallet | null = null;

  /**
   * Check if the keyring is unlocked
   */
  isUnlocked(): boolean {
    return this.mnemonic !== null;
  }

  /**
   * Initialize a new keyring with a generated mnemonic
   */
  initialize(wordCount: MnemonicWordCount = 24): string {
    const mnemonic = generateMnemonic(wordCount);
    this.unlock(mnemonic);
    return mnemonic;
  }

  /**
   * Initialize keyring with an existing mnemonic
   */
  restore(mnemonic: string): Result<void> {
    if (!validateMnemonic(mnemonic)) {
      return err(ErrorCode.INVALID_MNEMONIC, 'Invalid mnemonic phrase');
    }
    this.unlock(mnemonic);
    return ok(undefined);
  }

  /**
   * Unlock the keyring with a mnemonic
   */
  private unlock(mnemonic: string): void {
    this.mnemonic = mnemonic;
    this.hdWallet = HDWallet.fromMnemonic(mnemonic);
  }

  /**
   * Lock the keyring and clear sensitive data
   */
  lock(): void {
    this.mnemonic = null;
    this.hdWallet?.destroy();
    this.hdWallet = null;
    // Clear private keys from account objects
    for (const account of this.evmAccounts.values()) {
      account.privateKey = '';
    }
    for (const account of this.solanaAccounts.values()) {
      account.privateKey = '';
      account.secretSeed = '';
    }
  }

  /**
   * Get the mnemonic (requires unlocked keyring)
   */
  getMnemonic(): Result<string> {
    if (!this.mnemonic) {
      return err(ErrorCode.WALLET_LOCKED, 'Keyring is locked');
    }
    return ok(this.mnemonic);
  }

  /**
   * Create a new account for the specified chain family
   */
  createAccount(chainFamily: ChainFamily, name?: string): Result<AccountWithKey> {
    if (!this.hdWallet) {
      return err(ErrorCode.WALLET_LOCKED, 'Keyring is locked');
    }

    switch (chainFamily) {
      case ChainFamily.EVM: {
        const hdKey = this.hdWallet.deriveEvmKey(this.nextEvmIndex);
        const account = createEvmAccountFromHDKey(hdKey, this.nextEvmIndex, name);
        this.evmAccounts.set(account.address.toLowerCase(), account);
        this.nextEvmIndex++;
        return ok(account);
      }
      case ChainFamily.SOLANA: {
        const hdKey = this.hdWallet.deriveSolanaKey(this.nextSolanaIndex);
        const account = createSolanaAccountFromHDKey(hdKey, this.nextSolanaIndex, name);
        this.solanaAccounts.set(account.address, account);
        this.nextSolanaIndex++;
        return ok(account);
      }
      default:
        return err(ErrorCode.INVALID_INPUT, `Unsupported chain family: ${chainFamily}`);
    }
  }

  /**
   * Get all accounts
   */
  getAccounts(): Account[] {
    return [
      ...Array.from(this.evmAccounts.values()),
      ...Array.from(this.solanaAccounts.values()),
    ];
  }

  /**
   * Get accounts for a specific chain family
   */
  getAccountsByChainFamily(chainFamily: ChainFamily): Account[] {
    switch (chainFamily) {
      case ChainFamily.EVM:
        return Array.from(this.evmAccounts.values());
      case ChainFamily.SOLANA:
        return Array.from(this.solanaAccounts.values());
      default:
        return [];
    }
  }

  /**
   * Get account by address
   */
  getAccount(address: string): AccountWithKey | null {
    // Try EVM (case-insensitive)
    const evmAccount = this.evmAccounts.get(address.toLowerCase());
    if (evmAccount) return evmAccount;

    // Try Solana (case-sensitive)
    const solanaAccount = this.solanaAccounts.get(address);
    if (solanaAccount) return solanaAccount;

    return null;
  }

  /**
   * Get the private key for an account
   */
  getPrivateKey(address: string): Result<string> {
    const account = this.getAccount(address);
    if (!account) {
      return err(ErrorCode.ACCOUNT_NOT_FOUND, `Account not found: ${address}`);
    }
    if (!account.privateKey) {
      return err(ErrorCode.WALLET_LOCKED, 'Keyring is locked');
    }
    return ok(account.privateKey);
  }

  /**
   * Export the keyring as encrypted data
   */
  export(password: string): Result<StoredKeyring> {
    if (!this.mnemonic) {
      return err(ErrorCode.WALLET_LOCKED, 'Keyring is locked');
    }

    const data: KeyringData = {
      mnemonic: this.mnemonic,
      evmAccounts: Array.from(this.evmAccounts.values()),
      solanaAccounts: Array.from(this.solanaAccounts.values()),
      nextEvmIndex: this.nextEvmIndex,
      nextSolanaIndex: this.nextSolanaIndex,
    };

    const salt = generateSalt();
    const kdfParams: KdfParams = {
      ...DEFAULT_PBKDF2_PARAMS,
      salt,
    };
    const key = deriveKey(password, kdfParams);
    const encrypted = encryptJson(data, key);

    return ok({
      version: 1,
      kdf: {
        algorithm: kdfParams.algorithm,
        iterations: kdfParams.iterations,
        salt: Buffer.from(salt).toString('base64'),
        keyLength: kdfParams.keyLength,
      },
      encrypted,
    });
  }

  /**
   * Import keyring from encrypted data
   */
  import(stored: StoredKeyring, password: string): Result<void> {
    try {
      const algorithm = stored.kdf.algorithm as KdfAlgorithm;
      if (algorithm !== KdfAlgorithm.PBKDF2) {
        return err(ErrorCode.INVALID_INPUT, `Unsupported KDF algorithm: ${algorithm}`);
      }

      const kdfParams: Pbkdf2Params = {
        algorithm: KdfAlgorithm.PBKDF2,
        iterations: stored.kdf.iterations as number,
        salt: new Uint8Array(Buffer.from(stored.kdf.salt as string, 'base64')),
        keyLength: stored.kdf.keyLength as number,
      };

      const key = deriveKey(password, kdfParams);
      const data = decryptJson<KeyringData>(stored.encrypted, key);

      this.mnemonic = data.mnemonic;
      this.hdWallet = HDWallet.fromMnemonic(data.mnemonic);
      this.nextEvmIndex = data.nextEvmIndex;
      this.nextSolanaIndex = data.nextSolanaIndex;

      // Restore accounts
      this.evmAccounts.clear();
      for (const account of data.evmAccounts) {
        this.evmAccounts.set(account.address.toLowerCase(), account);
      }

      this.solanaAccounts.clear();
      for (const account of data.solanaAccounts) {
        this.solanaAccounts.set(account.address, account);
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ErrorCode.DECRYPTION_FAILED,
        'Failed to decrypt keyring. Wrong password?',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear all data
   */
  destroy(): void {
    this.lock();
    this.evmAccounts.clear();
    this.solanaAccounts.clear();
    this.nextEvmIndex = 0;
    this.nextSolanaIndex = 0;
  }
}

/**
 * Create a new keyring instance
 */
export function createKeyring(): Keyring {
  return new Keyring();
}
