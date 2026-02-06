import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
  Transport,
  Chain,
  Account,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia, polygon, arbitrum, optimism, base, avalanche, bsc } from 'viem/chains';
import { ChainId, getChainConfig } from '@open-wallet/types';

/**
 * Map ChainId to viem chain
 */
const VIEM_CHAINS: Record<number, Chain> = {
  [ChainId.ETH_MAINNET]: mainnet,
  [ChainId.ETH_SEPOLIA]: sepolia,
  [ChainId.POLYGON_MAINNET]: polygon,
  [ChainId.ARBITRUM_ONE]: arbitrum,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.BASE]: base,
  [ChainId.AVALANCHE]: avalanche,
  [ChainId.BSC]: bsc,
};

/**
 * Get viem chain for a ChainId
 */
export function getViemChain(chainId: ChainId): Chain {
  const chain = VIEM_CHAINS[chainId];
  if (chain) return chain;

  // Create a custom chain definition for unknown chains
  const config = getChainConfig(chainId);
  return defineChain({
    id: chainId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: { http: config.rpcUrls },
    },
    blockExplorers: config.blockExplorerUrls
      ? {
          default: {
            name: 'Explorer',
            url: config.blockExplorerUrls[0],
          },
        }
      : undefined,
    testnet: config.isTestnet,
  });
}

/**
 * EVM client configuration
 */
export interface EvmClientConfig {
  chainId: ChainId;
  rpcUrl?: string;
}

/**
 * EVM client for interacting with EVM chains
 */
export class EvmClient {
  readonly chainId: ChainId;
  readonly chain: Chain;
  readonly publicClient: PublicClient<Transport, Chain>;
  private walletClient: WalletClient<Transport, Chain, Account> | null = null;

  constructor(config: EvmClientConfig) {
    this.chainId = config.chainId;
    this.chain = getViemChain(config.chainId);

    const rpcUrl = config.rpcUrl ?? getChainConfig(config.chainId).rpcUrls[0];

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    });
  }

  /**
   * Connect a wallet (private key) to the client
   */
  connectWallet(privateKey: `0x${string}`): void {
    const account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account,
      chain: this.chain,
      transport: http(),
    });
  }

  /**
   * Disconnect the wallet
   */
  disconnectWallet(): void {
    this.walletClient = null;
  }

  /**
   * Check if a wallet is connected
   */
  isWalletConnected(): boolean {
    return this.walletClient !== null;
  }

  /**
   * Get the connected wallet's address
   */
  getWalletAddress(): `0x${string}` | null {
    return this.walletClient?.account?.address ?? null;
  }

  /**
   * Get balance of an address
   */
  async getBalance(address: `0x${string}`): Promise<bigint> {
    return this.publicClient.getBalance({ address });
  }

  /**
   * Get the current block number
   */
  async getBlockNumber(): Promise<bigint> {
    return this.publicClient.getBlockNumber();
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getNonce(address: `0x${string}`): Promise<number> {
    return this.publicClient.getTransactionCount({ address });
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<bigint> {
    return this.publicClient.getGasPrice();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    from?: `0x${string}`;
  }): Promise<bigint> {
    return this.publicClient.estimateGas(params);
  }

  /**
   * Get the internal wallet client (for advanced usage)
   */
  getWalletClient(): WalletClient<Transport, Chain, Account> | null {
    return this.walletClient;
  }

  /**
   * Get the internal public client (for advanced usage)
   */
  getPublicClient(): PublicClient<Transport, Chain> {
    return this.publicClient;
  }
}

/**
 * Create an EVM client
 */
export function createEvmClient(config: EvmClientConfig): EvmClient {
  return new EvmClient(config);
}
