import { parseAbi, formatUnits, parseUnits } from 'viem';
import { Token, TokenBalance, TokenStandard, Result, ok, err, ErrorCode } from '@open-wallet/types';
import { EvmClient } from './client';
import { signEvmTransaction, sendSignedTransaction } from './transaction';

/**
 * ERC-20 ABI (minimal)
 */
const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]);

/**
 * Get ERC-20 token metadata
 */
export async function getTokenMetadata(
  client: EvmClient,
  tokenAddress: `0x${string}`
): Promise<Result<Token>> {
  try {
    const publicClient = client.getPublicClient();

    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    return ok({
      address: tokenAddress,
      name,
      symbol,
      decimals,
      chainId: client.chainId,
      standard: TokenStandard.ERC20,
    });
  } catch (error) {
    return err(
      ErrorCode.RPC_ERROR,
      error instanceof Error ? error.message : 'Failed to get token metadata',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get ERC-20 token balance
 */
export async function getTokenBalance(
  client: EvmClient,
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}`
): Promise<Result<TokenBalance>> {
  try {
    // Get token metadata
    const metadata = await getTokenMetadata(client, tokenAddress);
    if (!metadata.ok) return metadata;

    // Get balance
    const balance = await client.getPublicClient().readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress],
    });

    const formattedBalance = formatUnits(balance, metadata.value.decimals);

    return ok({
      token: metadata.value,
      balance,
      formattedBalance,
    });
  } catch (error) {
    return err(
      ErrorCode.RPC_ERROR,
      error instanceof Error ? error.message : 'Failed to get token balance',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get ERC-20 allowance
 */
export async function getTokenAllowance(
  client: EvmClient,
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}`,
  spenderAddress: `0x${string}`
): Promise<Result<bigint>> {
  try {
    const allowance = await client.getPublicClient().readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress, spenderAddress],
    });

    return ok(allowance);
  } catch (error) {
    return err(
      ErrorCode.RPC_ERROR,
      error instanceof Error ? error.message : 'Failed to get token allowance',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Build ERC-20 transfer transaction data
 */
export function buildTransferData(
  to: `0x${string}`,
  amount: bigint
): `0x${string}` {
  // transfer(address,uint256) selector = 0xa9059cbb
  const selector = '0xa9059cbb';
  const paddedTo = to.slice(2).padStart(64, '0');
  const paddedAmount = amount.toString(16).padStart(64, '0');
  return `${selector}${paddedTo}${paddedAmount}` as `0x${string}`;
}

/**
 * Build ERC-20 approve transaction data
 */
export function buildApproveData(
  spender: `0x${string}`,
  amount: bigint
): `0x${string}` {
  // approve(address,uint256) selector = 0x095ea7b3
  const selector = '0x095ea7b3';
  const paddedSpender = spender.slice(2).padStart(64, '0');
  const paddedAmount = amount.toString(16).padStart(64, '0');
  return `${selector}${paddedSpender}${paddedAmount}` as `0x${string}`;
}

/**
 * Transfer ERC-20 tokens
 */
export async function transferToken(
  client: EvmClient,
  tokenAddress: `0x${string}`,
  from: `0x${string}`,
  to: `0x${string}`,
  amount: bigint,
  privateKey: string
): Promise<Result<string>> {
  try {
    // Build transfer data
    const data = buildTransferData(to, amount);

    // Estimate gas
    const gasLimit = await client.estimateGas({
      from,
      to: tokenAddress,
      data,
    });

    // Get gas prices
    const block = await client.getPublicClient().getBlock();
    const baseFee = block.baseFeePerGas ?? 0n;
    const maxPriorityFeePerGas = 1_500_000_000n;
    const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

    // Get nonce
    const nonce = await client.getNonce(from);

    // Sign transaction
    const signed = await signEvmTransaction(
      {
        chainId: client.chainId,
        from,
        to: tokenAddress,
        value: 0n,
        data,
        gasLimit: BigInt(Math.ceil(Number(gasLimit) * 1.2)),
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
      },
      privateKey
    );

    if (!signed.ok) return signed;

    // Send transaction
    const result = await sendSignedTransaction(client, signed.value);
    return result;
  } catch (error) {
    return err(
      ErrorCode.BROADCAST_FAILED,
      error instanceof Error ? error.message : 'Failed to transfer tokens',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Approve ERC-20 token spending
 */
export async function approveToken(
  client: EvmClient,
  tokenAddress: `0x${string}`,
  from: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint,
  privateKey: string
): Promise<Result<string>> {
  try {
    // Build approve data
    const data = buildApproveData(spender, amount);

    // Estimate gas
    const gasLimit = await client.estimateGas({
      from,
      to: tokenAddress,
      data,
    });

    // Get gas prices
    const block = await client.getPublicClient().getBlock();
    const baseFee = block.baseFeePerGas ?? 0n;
    const maxPriorityFeePerGas = 1_500_000_000n;
    const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

    // Get nonce
    const nonce = await client.getNonce(from);

    // Sign transaction
    const signed = await signEvmTransaction(
      {
        chainId: client.chainId,
        from,
        to: tokenAddress,
        value: 0n,
        data,
        gasLimit: BigInt(Math.ceil(Number(gasLimit) * 1.2)),
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
      },
      privateKey
    );

    if (!signed.ok) return signed;

    // Send transaction
    return sendSignedTransaction(client, signed.value);
  } catch (error) {
    return err(
      ErrorCode.BROADCAST_FAILED,
      error instanceof Error ? error.message : 'Failed to approve tokens',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Format token amount to string
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

/**
 * Max uint256 for unlimited approval
 */
export const MAX_UINT256 = 2n ** 256n - 1n;
