import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Commitment,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { ChainId, getChainConfig } from '@open-wallet/types';
import { decodeBase58 } from '@open-wallet/keyring';

/**
 * Map ChainId to Solana cluster
 */
type SolanaCluster = 'mainnet-beta' | 'testnet' | 'devnet';

function chainIdToCluster(chainId: ChainId): SolanaCluster | null {
  switch (chainId) {
    case ChainId.SOLANA_MAINNET:
      return 'mainnet-beta';
    case ChainId.SOLANA_TESTNET:
      return 'testnet';
    case ChainId.SOLANA_DEVNET:
      return 'devnet';
    default:
      return null;
  }
}

/**
 * Solana client configuration
 */
export interface SolanaClientConfig {
  chainId: ChainId;
  rpcUrl?: string;
  commitment?: Commitment;
}

/**
 * Solana client for interacting with Solana
 */
export class SolanaClient {
  readonly chainId: ChainId;
  readonly connection: Connection;
  private keypair: Keypair | null = null;

  constructor(config: SolanaClientConfig) {
    this.chainId = config.chainId;

    let rpcUrl = config.rpcUrl;
    if (!rpcUrl) {
      const cluster = chainIdToCluster(config.chainId);
      if (cluster) {
        rpcUrl = clusterApiUrl(cluster);
      } else {
        rpcUrl = getChainConfig(config.chainId).rpcUrls[0];
      }
    }

    this.connection = new Connection(rpcUrl, {
      commitment: config.commitment ?? 'confirmed',
    });
  }

  /**
   * Connect a wallet (secret key) to the client
   */
  connectWallet(secretKey: Uint8Array | string): void {
    if (typeof secretKey === 'string') {
      // Assume base58 encoded
      const decoded = decodeBase58(secretKey);
      // If it's 64 bytes (seed + pubkey), use only the seed
      const seed = decoded.length === 64 ? decoded.slice(0, 32) : decoded;
      this.keypair = Keypair.fromSeed(seed);
    } else {
      if (secretKey.length === 64) {
        this.keypair = Keypair.fromSecretKey(secretKey);
      } else if (secretKey.length === 32) {
        this.keypair = Keypair.fromSeed(secretKey);
      } else {
        throw new Error('Invalid secret key length');
      }
    }
  }

  /**
   * Disconnect the wallet
   */
  disconnectWallet(): void {
    this.keypair = null;
  }

  /**
   * Check if a wallet is connected
   */
  isWalletConnected(): boolean {
    return this.keypair !== null;
  }

  /**
   * Get the connected wallet's public key
   */
  getWalletPublicKey(): PublicKey | null {
    return this.keypair?.publicKey ?? null;
  }

  /**
   * Get the connected wallet's address (base58)
   */
  getWalletAddress(): string | null {
    return this.keypair?.publicKey.toBase58() ?? null;
  }

  /**
   * Get the connected keypair
   */
  getKeypair(): Keypair | null {
    return this.keypair;
  }

  /**
   * Get balance of an address in lamports
   */
  async getBalance(address: string | PublicKey): Promise<bigint> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const balance = await this.connection.getBalance(pubkey);
    return BigInt(balance);
  }

  /**
   * Get balance in SOL
   */
  async getBalanceInSol(address: string | PublicKey): Promise<number> {
    const lamports = await this.getBalance(address);
    return Number(lamports) / LAMPORTS_PER_SOL;
  }

  /**
   * Get the current slot
   */
  async getSlot(): Promise<number> {
    return this.connection.getSlot();
  }

  /**
   * Get the current blockhash
   */
  async getRecentBlockhash(): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    return blockhash;
  }

  /**
   * Get minimum balance for rent exemption
   */
  async getMinimumBalanceForRentExemption(dataLength: number): Promise<bigint> {
    const balance = await this.connection.getMinimumBalanceForRentExemption(dataLength);
    return BigInt(balance);
  }

  /**
   * Request airdrop (devnet/testnet only)
   */
  async requestAirdrop(address: string | PublicKey, lamports: number): Promise<string> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const signature = await this.connection.requestAirdrop(pubkey, lamports);
    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * Check if an account exists
   */
  async accountExists(address: string | PublicKey): Promise<boolean> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const info = await this.connection.getAccountInfo(pubkey);
    return info !== null;
  }
}

/**
 * Create a Solana client
 */
export function createSolanaClient(config: SolanaClientConfig): SolanaClient {
  return new SolanaClient(config);
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
