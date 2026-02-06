import { formatGwei, parseGwei } from 'viem';
import { GasEstimate, Result, ok, err, ErrorCode } from '@open-wallet/types';
import { EvmClient } from './client';

/**
 * Gas buffer multiplier (add 20% to estimated gas)
 */
const GAS_BUFFER_MULTIPLIER = 1.2;

/**
 * Priority fee tiers
 */
export const PRIORITY_FEE_TIERS = {
  slow: parseGwei('1'),
  standard: parseGwei('1.5'),
  fast: parseGwei('3'),
  instant: parseGwei('5'),
} as const;

export type PriorityFeeTier = keyof typeof PRIORITY_FEE_TIERS;

/**
 * Estimate gas for a transaction with buffer
 */
export async function estimateGasWithBuffer(
  client: EvmClient,
  params: {
    from?: `0x${string}`;
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
  }
): Promise<Result<{ gasLimit: bigint; rawEstimate: bigint }>> {
  try {
    const rawEstimate = await client.estimateGas(params);
    const gasLimit = BigInt(Math.ceil(Number(rawEstimate) * GAS_BUFFER_MULTIPLIER));

    return ok({ gasLimit, rawEstimate });
  } catch (error) {
    return err(
      ErrorCode.GAS_ESTIMATION_FAILED,
      error instanceof Error ? error.message : 'Failed to estimate gas',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get current gas prices (EIP-1559)
 */
export async function getGasPrices(
  client: EvmClient,
  priorityTier: PriorityFeeTier = 'standard'
): Promise<Result<GasEstimate>> {
  try {
    const block = await client.getPublicClient().getBlock();
    const baseFee = block.baseFeePerGas ?? 0n;

    const maxPriorityFeePerGas = PRIORITY_FEE_TIERS[priorityTier];
    // Max fee = 2x base fee + priority fee (covers 2 full blocks of base fee increase)
    const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

    return ok({
      gasLimit: 21000n, // Default gas limit for simple transfer
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedCost: 21000n * maxFeePerGas,
    });
  } catch (error) {
    return err(
      ErrorCode.GAS_ESTIMATION_FAILED,
      error instanceof Error ? error.message : 'Failed to get gas prices',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Estimate total transaction cost
 */
export async function estimateTransactionCost(
  client: EvmClient,
  params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
  },
  priorityTier: PriorityFeeTier = 'standard'
): Promise<Result<GasEstimate>> {
  // Estimate gas
  const gasEstimate = await estimateGasWithBuffer(client, params);
  if (!gasEstimate.ok) return gasEstimate;

  // Get gas prices
  const gasPrices = await getGasPrices(client, priorityTier);
  if (!gasPrices.ok) return gasPrices;

  const gasLimit = gasEstimate.value.gasLimit;
  const { maxFeePerGas, maxPriorityFeePerGas } = gasPrices.value;
  const estimatedCost = gasLimit * maxFeePerGas;

  return ok({
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    estimatedCost,
  });
}

/**
 * Format gas price for display
 */
export function formatGasPrice(weiAmount: bigint): string {
  return `${formatGwei(weiAmount)} gwei`;
}

/**
 * Format estimated cost for display
 */
export function formatEstimatedCost(weiAmount: bigint): string {
  const eth = Number(weiAmount) / 1e18;
  if (eth < 0.0001) {
    return `<0.0001 ETH`;
  }
  return `~${eth.toFixed(4)} ETH`;
}

/**
 * Check if user has enough balance for transaction
 */
export async function hasEnoughBalance(
  client: EvmClient,
  address: `0x${string}`,
  value: bigint,
  estimatedGasCost: bigint
): Promise<boolean> {
  const balance = await client.getBalance(address);
  return balance >= value + estimatedGasCost;
}
