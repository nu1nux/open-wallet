import { ChainFamily } from './chain';

/**
 * Represents a blockchain account/address
 */
export interface Account {
  /** Unique identifier for this account */
  id: string;
  /** Human-readable name for the account */
  name: string;
  /** The blockchain address */
  address: string;
  /** Chain family this account belongs to */
  chainFamily: ChainFamily;
  /** HD derivation path used to derive this account */
  derivationPath: string;
  /** Index in the derivation path */
  index: number;
  /** Optional public key (hex encoded) */
  publicKey?: string;
  /** Account creation timestamp */
  createdAt: number;
}

/**
 * Account with extended information including balance
 */
export interface AccountWithBalance extends Account {
  /** Native token balance in smallest unit (wei, lamports, etc.) */
  balance: bigint;
  /** Formatted balance in human-readable form */
  formattedBalance: string;
}

/**
 * Options for creating a new account
 */
export interface CreateAccountOptions {
  /** Human-readable name for the account */
  name?: string;
  /** Chain family (EVM or Solana) */
  chainFamily: ChainFamily;
  /** Account index for derivation */
  index?: number;
  /** Custom derivation path (overrides default) */
  derivationPath?: string;
}

/**
 * Standard BIP-44 derivation paths
 */
export const DERIVATION_PATHS = {
  /** Ethereum: m/44'/60'/0'/0/x */
  EVM: "m/44'/60'/0'/0",
  /** Solana: m/44'/501'/x'/0' */
  SOLANA: "m/44'/501'",
} as const;

/**
 * Generate a derivation path for an account index
 */
export function getDerivationPath(chainFamily: ChainFamily, index: number): string {
  switch (chainFamily) {
    case ChainFamily.EVM:
      return `${DERIVATION_PATHS.EVM}/${index}`;
    case ChainFamily.SOLANA:
      return `${DERIVATION_PATHS.SOLANA}/${index}'/0'`;
    default:
      throw new Error(`Unsupported chain family: ${chainFamily}`);
  }
}
