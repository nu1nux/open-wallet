/**
 * Supported blockchain networks
 */
export enum ChainId {
  // EVM Chains
  ETH_MAINNET = 1,
  ETH_SEPOLIA = 11155111,
  POLYGON_MAINNET = 137,
  POLYGON_MUMBAI = 80001,
  ARBITRUM_ONE = 42161,
  OPTIMISM = 10,
  BASE = 8453,
  AVALANCHE = 43114,
  BSC = 56,
  LOCAL_EVM = 31337,

  // Solana
  SOLANA_MAINNET = 101,
  SOLANA_DEVNET = 102,
  SOLANA_TESTNET = 103,
  SOLANA_LOCALNET = 104,
}

/**
 * Chain family classification
 */
export enum ChainFamily {
  EVM = 'evm',
  SOLANA = 'solana',
}

/**
 * Configuration for a blockchain network
 */
export interface ChainConfig {
  chainId: ChainId;
  family: ChainFamily;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  isTestnet: boolean;
}

/**
 * Predefined chain configurations
 */
export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  [ChainId.ETH_MAINNET]: {
    chainId: ChainId.ETH_MAINNET,
    family: ChainFamily.EVM,
    name: 'Ethereum Mainnet',
    shortName: 'eth',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    isTestnet: false,
  },
  [ChainId.ETH_SEPOLIA]: {
    chainId: ChainId.ETH_SEPOLIA,
    family: ChainFamily.EVM,
    name: 'Ethereum Sepolia',
    shortName: 'sep',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    isTestnet: true,
  },
  [ChainId.POLYGON_MAINNET]: {
    chainId: ChainId.POLYGON_MAINNET,
    family: ChainFamily.EVM,
    name: 'Polygon Mainnet',
    shortName: 'matic',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    isTestnet: false,
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    family: ChainFamily.EVM,
    name: 'Polygon Mumbai',
    shortName: 'maticmum',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    isTestnet: true,
  },
  [ChainId.ARBITRUM_ONE]: {
    chainId: ChainId.ARBITRUM_ONE,
    family: ChainFamily.EVM,
    name: 'Arbitrum One',
    shortName: 'arb1',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    isTestnet: false,
  },
  [ChainId.OPTIMISM]: {
    chainId: ChainId.OPTIMISM,
    family: ChainFamily.EVM,
    name: 'Optimism',
    shortName: 'oeth',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    isTestnet: false,
  },
  [ChainId.BASE]: {
    chainId: ChainId.BASE,
    family: ChainFamily.EVM,
    name: 'Base',
    shortName: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    isTestnet: false,
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    family: ChainFamily.EVM,
    name: 'Avalanche C-Chain',
    shortName: 'avax',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    isTestnet: false,
  },
  [ChainId.BSC]: {
    chainId: ChainId.BSC,
    family: ChainFamily.EVM,
    name: 'BNB Smart Chain',
    shortName: 'bnb',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    isTestnet: false,
  },
  [ChainId.LOCAL_EVM]: {
    chainId: ChainId.LOCAL_EVM,
    family: ChainFamily.EVM,
    name: 'Local EVM (Anvil)',
    shortName: 'local',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:8545'],
    isTestnet: true,
  },
  [ChainId.SOLANA_MAINNET]: {
    chainId: ChainId.SOLANA_MAINNET,
    family: ChainFamily.SOLANA,
    name: 'Solana Mainnet',
    shortName: 'sol',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: ['https://api.mainnet-beta.solana.com'],
    blockExplorerUrls: ['https://explorer.solana.com'],
    isTestnet: false,
  },
  [ChainId.SOLANA_DEVNET]: {
    chainId: ChainId.SOLANA_DEVNET,
    family: ChainFamily.SOLANA,
    name: 'Solana Devnet',
    shortName: 'soldev',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: ['https://api.devnet.solana.com'],
    blockExplorerUrls: ['https://explorer.solana.com?cluster=devnet'],
    isTestnet: true,
  },
  [ChainId.SOLANA_TESTNET]: {
    chainId: ChainId.SOLANA_TESTNET,
    family: ChainFamily.SOLANA,
    name: 'Solana Testnet',
    shortName: 'soltest',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: ['https://api.testnet.solana.com'],
    blockExplorerUrls: ['https://explorer.solana.com?cluster=testnet'],
    isTestnet: true,
  },
  [ChainId.SOLANA_LOCALNET]: {
    chainId: ChainId.SOLANA_LOCALNET,
    family: ChainFamily.SOLANA,
    name: 'Solana Localnet',
    shortName: 'sollocal',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: ['http://127.0.0.1:8899'],
    isTestnet: true,
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: ChainId): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }
  return config;
}

/**
 * Check if a chain ID is an EVM chain
 */
export function isEvmChain(chainId: ChainId): boolean {
  return getChainConfig(chainId).family === ChainFamily.EVM;
}

/**
 * Check if a chain ID is a Solana chain
 */
export function isSolanaChain(chainId: ChainId): boolean {
  return getChainConfig(chainId).family === ChainFamily.SOLANA;
}
