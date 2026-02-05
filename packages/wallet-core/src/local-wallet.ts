import {
  Account,
  ChainFamily,
  InitWalletOptions,
  Result,
  SignedTransaction,
  TransactionReceipt,
  TxRequest,
  WalletState,
  WalletType,
  ok,
  err,
  ErrorCode,
  isEvmChain,
  isSolanaChain,
  EvmTxRequest,
  SolanaTxRequest,
} from '@wallet-suite/types';
import { IStorage } from '@wallet-suite/storage';
import { StoredKeyring, MnemonicWordCount } from '@wallet-suite/keyring';
import {
  signEvmTransaction,
  sendSignedTransaction as sendEvmSignedTx,
  waitForTransaction as waitEvmTx,
  buildTransaction as buildEvmTx,
} from '@wallet-suite/chains-evm';
import {
  buildTransferTransaction,
  signSolanaTransaction,
  sendSignedTransaction as sendSolanaSignedTx,
  waitForTransaction as waitSolanaTx,
} from '@wallet-suite/chains-solana';
import { signEvmPersonalMessage } from '@wallet-suite/keyring';
import { createLogger } from '@wallet-suite/utils';
import { BaseWallet } from './wallet';

const logger = createLogger('local-wallet');

const WALLET_STORAGE_KEY = 'wallet';
const METADATA_STORAGE_KEY = 'wallet:metadata';

/**
 * Local wallet with encrypted keyring storage
 */
export class LocalWallet extends BaseWallet {
  private password: string | null = null;

  constructor(storage: IStorage) {
    super(storage, WalletType.LOCAL);
  }

  async initialize(options: InitWalletOptions): Promise<Result<void>> {
    if (this.state !== WalletState.UNINITIALIZED) {
      return err(ErrorCode.INVALID_INPUT, 'Wallet already initialized');
    }

    try {
      if (options.mnemonic) {
        // Restore from mnemonic
        const result = this.keyring.restore(options.mnemonic);
        if (!result.ok) return result;
      } else {
        // Generate new mnemonic
        const wordCount = (options.wordCount ?? 24) as MnemonicWordCount;
        this.keyring.initialize(wordCount);
      }

      // Create default accounts
      this.keyring.createAccount(ChainFamily.EVM);
      this.keyring.createAccount(ChainFamily.SOLANA);

      // Update metadata
      if (options.name) {
        this.metadata.name = options.name;
      }

      // Store password for saving
      this.password = options.password;

      // Save encrypted wallet
      await this.saveWalletState();

      this.state = WalletState.UNLOCKED;
      logger.info('Wallet initialized');

      return ok(undefined);
    } catch (error) {
      return err(
        ErrorCode.UNKNOWN,
        error instanceof Error ? error.message : 'Failed to initialize wallet',
        error instanceof Error ? error : undefined
      );
    }
  }

  async unlock(password: string): Promise<Result<void>> {
    if (this.state === WalletState.UNINITIALIZED) {
      // Try to load from storage
      const stored = await this.storage.get<StoredKeyring>(WALLET_STORAGE_KEY);
      if (!stored) {
        return err(ErrorCode.WALLET_NOT_INITIALIZED, 'No wallet found');
      }

      const result = this.keyring.import(stored, password);
      if (!result.ok) return result;

      // Load metadata
      const metadata = await this.storage.get<typeof this.metadata>(METADATA_STORAGE_KEY);
      if (metadata) {
        this.metadata = metadata;
      }
    } else if (this.state === WalletState.LOCKED) {
      // Re-import from storage with new password
      const stored = await this.storage.get<StoredKeyring>(WALLET_STORAGE_KEY);
      if (!stored) {
        return err(ErrorCode.WALLET_NOT_INITIALIZED, 'No wallet found');
      }

      const result = this.keyring.import(stored, password);
      if (!result.ok) return result;
    }

    this.password = password;
    this.state = WalletState.UNLOCKED;
    this.updateActivity();
    logger.info('Wallet unlocked');

    return ok(undefined);
  }

  async lock(): Promise<void> {
    this.password = null;
    await super.lock();
  }

  async signTransaction(request: TxRequest): Promise<Result<SignedTransaction>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }

    const privateKeyResult = this.keyring.getPrivateKey(request.from);
    if (!privateKeyResult.ok) return privateKeyResult;

    if (isEvmChain(request.chainId)) {
      const evmRequest = request as EvmTxRequest;
      const client = this.getEvmClient(request.chainId);

      // Build complete transaction
      const built = await buildEvmTx(client, evmRequest);
      if (!built.ok) return built;

      return signEvmTransaction(built.value, privateKeyResult.value);
    } else if (isSolanaChain(request.chainId)) {
      const solanaRequest = request as SolanaTxRequest;
      const client = this.getSolanaClient(request.chainId);

      const built = await buildTransferTransaction(client, solanaRequest);
      if (!built.ok) return built;

      // Get keypair from keyring
      const account = this.keyring.getAccount(request.from);
      if (!account || account.chainFamily !== ChainFamily.SOLANA) {
        return err(ErrorCode.ACCOUNT_NOT_FOUND, 'Solana account not found');
      }

      // Decode the secret seed and create keypair
      const { decodeBase58 } = await import('@wallet-suite/keyring');
      const { Keypair } = await import('@solana/web3.js');

      const secretSeed = decodeBase58((account as { secretSeed: string }).secretSeed);
      const keypair = Keypair.fromSeed(secretSeed);

      return signSolanaTransaction(built.value, keypair);
    }

    return err(ErrorCode.INVALID_INPUT, `Unsupported chain: ${request.chainId}`);
  }

  async signMessage(address: string, message: string): Promise<Result<string>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }

    const account = this.keyring.getAccount(address);
    if (!account) {
      return err(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found');
    }

    const privateKeyResult = this.keyring.getPrivateKey(address);
    if (!privateKeyResult.ok) return privateKeyResult;

    if (account.chainFamily === ChainFamily.EVM) {
      const privateKeyBytes = Buffer.from(privateKeyResult.value, 'hex');
      const signature = signEvmPersonalMessage(message, privateKeyBytes);
      return ok(signature);
    } else if (account.chainFamily === ChainFamily.SOLANA) {
      const { signSolanaMessage, decodeBase58 } = await import('@wallet-suite/keyring');
      const messageBytes = new TextEncoder().encode(message);
      const seed = decodeBase58((account as { secretSeed: string }).secretSeed);
      const signature = signSolanaMessage(messageBytes, seed);
      return ok(signature);
    }

    return err(ErrorCode.INVALID_INPUT, 'Unsupported chain family');
  }

  async sendTransaction(request: TxRequest): Promise<Result<TransactionReceipt>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }

    const account = this.keyring.getAccount(request.from);
    if (!account) {
      return err(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found');
    }

    const privateKeyResult = this.keyring.getPrivateKey(request.from);
    if (!privateKeyResult.ok) return privateKeyResult;

    if (isEvmChain(request.chainId)) {
      const client = this.getEvmClient(request.chainId);
      const evmRequest = request as EvmTxRequest;

      // Build transaction
      const built = await buildEvmTx(client, evmRequest);
      if (!built.ok) return built;

      // Sign
      const signed = await signEvmTransaction(built.value, privateKeyResult.value);
      if (!signed.ok) return signed;

      // Send
      const sendResult = await sendEvmSignedTx(client, signed.value);
      if (!sendResult.ok) return sendResult;

      // Wait for confirmation
      return waitEvmTx(client, sendResult.value);
    } else if (isSolanaChain(request.chainId)) {
      const client = this.getSolanaClient(request.chainId);
      const { decodeBase58 } = await import('@wallet-suite/keyring');
      const { Keypair } = await import('@solana/web3.js');
      const { sendTransfer } = await import('@wallet-suite/chains-solana');

      const seed = decodeBase58((account as { secretSeed: string }).secretSeed);
      const keypair = Keypair.fromSeed(seed);

      return sendTransfer(
        client,
        request.to,
        request.value,
        keypair,
        (request as SolanaTxRequest).priorityFee
      );
    }

    return err(ErrorCode.INVALID_INPUT, `Unsupported chain: ${request.chainId}`);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<Result<void>> {
    // Verify current password
    const stored = await this.storage.get<StoredKeyring>(WALLET_STORAGE_KEY);
    if (!stored) {
      return err(ErrorCode.WALLET_NOT_INITIALIZED, 'No wallet found');
    }

    // Try to unlock with current password
    const tempKeyring = new (await import('@wallet-suite/keyring')).Keyring();
    const result = tempKeyring.import(stored, currentPassword);
    if (!result.ok) {
      return err(ErrorCode.UNAUTHORIZED, 'Invalid current password');
    }

    // Update password and save
    this.password = newPassword;
    await this.saveWalletState();

    logger.info('Password changed');
    return ok(undefined);
  }

  protected async saveWalletState(): Promise<void> {
    if (!this.password) {
      throw new Error('Cannot save wallet without password');
    }

    const exported = this.keyring.export(this.password);
    if (!exported.ok) {
      throw exported.error;
    }

    await this.storage.set(WALLET_STORAGE_KEY, exported.value);
    await this.storage.set(METADATA_STORAGE_KEY, this.metadata);
  }

  /**
   * Check if a wallet exists in storage
   */
  static async exists(storage: IStorage): Promise<boolean> {
    const wallet = await storage.get(WALLET_STORAGE_KEY);
    return wallet !== null;
  }
}

/**
 * Create a new local wallet
 */
export function createLocalWallet(storage: IStorage): LocalWallet {
  return new LocalWallet(storage);
}
