import { ChainId } from './chain';

/**
 * Token standard
 */
export enum TokenStandard {
  /** ERC-20 token on EVM chains */
  ERC20 = 'ERC20',
  /** SPL token on Solana */
  SPL = 'SPL',
  /** Native token (ETH, SOL, etc.) */
  NATIVE = 'NATIVE',
}

/**
 * Token metadata
 */
export interface Token {
  /** Token contract address (or 'native' for native tokens) */
  address: string;
  /** Token symbol (e.g., 'USDC') */
  symbol: string;
  /** Token name (e.g., 'USD Coin') */
  name: string;
  /** Number of decimals */
  decimals: number;
  /** Chain this token is on */
  chainId: ChainId;
  /** Token standard */
  standard: TokenStandard;
  /** Optional logo URI */
  logoUri?: string;
}

/**
 * Token balance
 */
export interface TokenBalance {
  /** Token information */
  token: Token;
  /** Balance in smallest unit */
  balance: bigint;
  /** Formatted balance string */
  formattedBalance: string;
  /** USD value (if available) */
  usdValue?: number;
}

/**
 * Well-known token addresses
 */
export const WELL_KNOWN_TOKENS: Record<string, Partial<Record<ChainId, string>>> = {
  USDC: {
    [ChainId.ETH_MAINNET]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [ChainId.POLYGON_MAINNET]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    [ChainId.ARBITRUM_ONE]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    [ChainId.OPTIMISM]: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    [ChainId.BASE]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  USDT: {
    [ChainId.ETH_MAINNET]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [ChainId.POLYGON_MAINNET]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    [ChainId.ARBITRUM_ONE]: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  WETH: {
    [ChainId.ETH_MAINNET]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    [ChainId.POLYGON_MAINNET]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    [ChainId.ARBITRUM_ONE]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    [ChainId.OPTIMISM]: '0x4200000000000000000000000000000000000006',
    [ChainId.BASE]: '0x4200000000000000000000000000000000000006',
  },
};

/**
 * Get token address for a well-known token on a specific chain
 */
export function getTokenAddress(symbol: string, chainId: ChainId): string | undefined {
  return WELL_KNOWN_TOKENS[symbol]?.[chainId];
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number, maxDecimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.slice(0, maxDecimals).replace(/0+$/, '');

  return trimmed ? `${wholePart}.${trimmed}` : wholePart.toString();
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}
