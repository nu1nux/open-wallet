import { Account, CreateAccountOptions } from './account';
import { ChainId } from './chain';
import { Result } from './result';
import { SignedTransaction, TransactionReceipt, TxRequest } from './transaction';

/**
 * Wallet state
 */
export enum WalletState {
  UNINITIALIZED = 'uninitialized',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
}

/**
 * Wallet type
 */
export enum WalletType {
  /** Local wallet with encrypted keyring */
  LOCAL = 'local',
  /** MPC wallet with distributed key shares */
  MPC = 'mpc',
  /** Hardware wallet (Ledger, Trezor) */
  HARDWARE = 'hardware',
}

/**
 * Wallet metadata
 */
export interface WalletMetadata {
  /** Wallet unique identifier */
  id: string;
  /** User-defined wallet name */
  name: string;
  /** Wallet type */
  type: WalletType;
  /** Creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActiveAt: number;
}

/**
 * Options for initializing a new wallet
 */
export interface InitWalletOptions {
  /** Wallet name */
  name?: string;
  /** Password for encryption */
  password: string;
  /** Optional existing mnemonic (for recovery) */
  mnemonic?: string;
  /** Mnemonic word count (12, 15, 18, 21, 24) */
  wordCount?: 12 | 15 | 18 | 21 | 24;
}

/**
 * Core wallet interface
 */
export interface IWallet {
  /** Get wallet metadata */
  getMetadata(): WalletMetadata;

  /** Get current wallet state */
  getState(): WalletState;

  /** Initialize a new wallet */
  initialize(options: InitWalletOptions): Promise<Result<void>>;

  /** Unlock wallet with password */
  unlock(password: string): Promise<Result<void>>;

  /** Lock wallet and clear sensitive data */
  lock(): Promise<void>;

  /** Check if wallet is unlocked */
  isUnlocked(): boolean;

  /** Get all accounts */
  getAccounts(): Promise<Result<Account[]>>;

  /** Get account by address */
  getAccount(address: string): Promise<Result<Account | null>>;

  /** Create a new account */
  createAccount(options: CreateAccountOptions): Promise<Result<Account>>;

  /** Sign a transaction */
  signTransaction(request: TxRequest): Promise<Result<SignedTransaction>>;

  /** Sign a message */
  signMessage(address: string, message: string): Promise<Result<string>>;

  /** Get balance for an address */
  getBalance(address: string, chainId: ChainId): Promise<Result<bigint>>;

  /** Send a transaction */
  sendTransaction(request: TxRequest): Promise<Result<TransactionReceipt>>;

  /** Export mnemonic (requires password verification) */
  exportMnemonic(password: string): Promise<Result<string>>;

  /** Change wallet password */
  changePassword(currentPassword: string, newPassword: string): Promise<Result<void>>;

  /** Destroy wallet and clear all data */
  destroy(): Promise<void>;
}

/**
 * Events emitted by the wallet
 */
export interface WalletEvents {
  stateChanged: (state: WalletState) => void;
  accountCreated: (account: Account) => void;
  accountRemoved: (address: string) => void;
  transactionSent: (receipt: TransactionReceipt) => void;
  error: (error: Error) => void;
}
