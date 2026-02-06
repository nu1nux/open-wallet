import {
  Account,
  ChainId,
  CreateAccountOptions,
  IWallet,
  InitWalletOptions,
  Result,
  SignedTransaction,
  TransactionReceipt,
  TxRequest,
  WalletMetadata,
  WalletState,
  WalletType,
  ok,
  err,
  ErrorCode,
  isEvmChain,
  isSolanaChain,
} from '@open-wallet/types';
import { IStorage } from '@open-wallet/storage';
import { Keyring } from '@open-wallet/keyring';
import { createEvmClient, EvmClient } from '@open-wallet/chains-evm';
import { createSolanaClient, SolanaClient } from '@open-wallet/chains-solana';
import { randomUuid } from '@open-wallet/crypto';
import { createLogger } from '@open-wallet/utils';

const logger = createLogger('wallet-core');

const WALLET_STORAGE_KEY = 'wallet';
const METADATA_STORAGE_KEY = 'wallet:metadata';

/**
 * Base wallet implementation
 */
export abstract class BaseWallet implements IWallet {
  protected state: WalletState = WalletState.UNINITIALIZED;
  protected metadata: WalletMetadata;
  protected keyring: Keyring;
  protected evmClients: Map<ChainId, EvmClient> = new Map();
  protected solanaClients: Map<ChainId, SolanaClient> = new Map();

  constructor(
    protected readonly storage: IStorage,
    protected readonly type: WalletType
  ) {
    this.metadata = {
      id: randomUuid(),
      name: 'My Wallet',
      type,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    this.keyring = new Keyring();
  }

  getMetadata(): WalletMetadata {
    return { ...this.metadata };
  }

  getState(): WalletState {
    return this.state;
  }

  isUnlocked(): boolean {
    return this.state === WalletState.UNLOCKED;
  }

  abstract initialize(options: InitWalletOptions): Promise<Result<void>>;
  abstract unlock(password: string): Promise<Result<void>>;

  async lock(): Promise<void> {
    this.keyring.lock();
    this.state = WalletState.LOCKED;
    logger.info('Wallet locked');
  }

  async getAccounts(): Promise<Result<Account[]>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }
    return ok(this.keyring.getAccounts());
  }

  async getAccount(address: string): Promise<Result<Account | null>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }
    return ok(this.keyring.getAccount(address));
  }

  async createAccount(options: CreateAccountOptions): Promise<Result<Account>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }

    const result = this.keyring.createAccount(options.chainFamily, options.name);
    if (!result.ok) return result;

    // Save wallet state
    await this.saveWalletState();

    logger.info(`Account created: ${result.value.address}`);
    return result;
  }

  abstract signTransaction(request: TxRequest): Promise<Result<SignedTransaction>>;
  abstract signMessage(address: string, message: string): Promise<Result<string>>;

  async getBalance(address: string, chainId: ChainId): Promise<Result<bigint>> {
    if (!this.isUnlocked()) {
      return err(ErrorCode.WALLET_LOCKED, 'Wallet is locked');
    }

    try {
      if (isEvmChain(chainId)) {
        const client = this.getEvmClient(chainId);
        const balance = await client.getBalance(address as `0x${string}`);
        return ok(balance);
      } else if (isSolanaChain(chainId)) {
        const client = this.getSolanaClient(chainId);
        const balance = await client.getBalance(address);
        return ok(balance);
      } else {
        return err(ErrorCode.INVALID_INPUT, `Unsupported chain: ${chainId}`);
      }
    } catch (error) {
      return err(
        ErrorCode.RPC_ERROR,
        error instanceof Error ? error.message : 'Failed to get balance',
        error instanceof Error ? error : undefined
      );
    }
  }

  abstract sendTransaction(request: TxRequest): Promise<Result<TransactionReceipt>>;

  async exportMnemonic(password: string): Promise<Result<string>> {
    // Verify password by trying to unlock
    const unlockResult = await this.unlock(password);
    if (!unlockResult.ok) {
      return err(ErrorCode.UNAUTHORIZED, 'Invalid password');
    }

    return this.keyring.getMnemonic();
  }

  abstract changePassword(currentPassword: string, newPassword: string): Promise<Result<void>>;

  async destroy(): Promise<void> {
    this.keyring.destroy();
    await this.storage.delete(WALLET_STORAGE_KEY);
    await this.storage.delete(METADATA_STORAGE_KEY);
    this.state = WalletState.UNINITIALIZED;
    logger.info('Wallet destroyed');
  }

  protected getEvmClient(chainId: ChainId): EvmClient {
    let client = this.evmClients.get(chainId);
    if (!client) {
      client = createEvmClient({ chainId });
      this.evmClients.set(chainId, client);
    }
    return client;
  }

  protected getSolanaClient(chainId: ChainId): SolanaClient {
    let client = this.solanaClients.get(chainId);
    if (!client) {
      client = createSolanaClient({ chainId });
      this.solanaClients.set(chainId, client);
    }
    return client;
  }

  protected async saveWalletState(): Promise<void> {
    // To be implemented by subclasses
  }

  protected updateActivity(): void {
    this.metadata.lastActiveAt = Date.now();
  }
}
