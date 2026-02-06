import {
  parseEther,
  formatEther,
  keccak256,
} from 'viem';
import { signTransaction } from 'viem/accounts';
import {
  EvmTxRequest,
  SignedTransaction,
  TransactionReceipt,
  TransactionStatus,
  Result,
  ok,
  err,
  ErrorCode,
} from '@open-wallet/types';
import { createLogger } from '@open-wallet/utils';
import { EvmClient } from './client';
import { estimateGasWithBuffer } from './gas';

const logger = createLogger('chains-evm:transaction');

/**
 * Build an EVM transaction
 */
export async function buildTransaction(
  client: EvmClient,
  request: EvmTxRequest
): Promise<Result<EvmTxRequest>> {
  try {
    const from = request.from as `0x${string}`;
    const to = request.to as `0x${string}`;

    // Get nonce if not provided
    const nonce = request.nonce ?? await client.getNonce(from);

    // Estimate gas if not provided
    let gasLimit = request.gasLimit;
    if (!gasLimit) {
      const estimated = await estimateGasWithBuffer(client, {
        from,
        to,
        value: request.value,
        data: request.data as `0x${string}` | undefined,
      });
      if (!estimated.ok) return estimated;
      gasLimit = estimated.value.gasLimit;
    }

    // Get gas prices if not provided (EIP-1559)
    let maxFeePerGas = request.maxFeePerGas;
    let maxPriorityFeePerGas = request.maxPriorityFeePerGas;

    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      const block = await client.getPublicClient().getBlock();
      const baseFee = block.baseFeePerGas ?? 0n;
      maxPriorityFeePerGas = maxPriorityFeePerGas ?? 1_500_000_000n; // 1.5 gwei
      maxFeePerGas = maxFeePerGas ?? baseFee * 2n + maxPriorityFeePerGas;
    }

    return ok({
      ...request,
      nonce,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  } catch (error) {
    return err(
      ErrorCode.INVALID_INPUT,
      error instanceof Error ? error.message : 'Failed to build transaction',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Sign an EVM transaction
 */
export async function signEvmTransaction(
  request: EvmTxRequest,
  privateKey: string
): Promise<Result<SignedTransaction>> {
  try {
    const pk = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;

    // Sign the transaction
    const signedTx = await signTransaction({
      privateKey: pk,
      transaction: {
        chainId: request.chainId,
        nonce: request.nonce,
        to: request.to as `0x${string}`,
        value: request.value,
        data: request.data as `0x${string}` | undefined,
        maxFeePerGas: request.maxFeePerGas,
        maxPriorityFeePerGas: request.maxPriorityFeePerGas,
        gas: request.gasLimit,
      },
    });

    // Calculate transaction hash
    const hash = keccak256(signedTx);

    return ok({
      chainId: request.chainId,
      signedTx,
      hash,
    });
  } catch (error) {
    return err(
      ErrorCode.SIGNING_FAILED,
      error instanceof Error ? error.message : 'Failed to sign transaction',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Send a signed transaction
 */
export async function sendSignedTransaction(
  client: EvmClient,
  signedTx: SignedTransaction
): Promise<Result<string>> {
  try {
    const hash = await client.getPublicClient().sendRawTransaction({
      serializedTransaction: signedTx.signedTx as `0x${string}`,
    });

    logger.info(`Transaction sent: ${hash}`);
    return ok(hash);
  } catch (error) {
    return err(
      ErrorCode.BROADCAST_FAILED,
      error instanceof Error ? error.message : 'Failed to broadcast transaction',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Wait for transaction receipt
 */
export async function waitForTransaction(
  client: EvmClient,
  hash: string,
  confirmations = 1
): Promise<Result<TransactionReceipt>> {
  try {
    const receipt = await client.getPublicClient().waitForTransactionReceipt({
      hash: hash as `0x${string}`,
      confirmations,
    });

    const status =
      receipt.status === 'success'
        ? TransactionStatus.CONFIRMED
        : TransactionStatus.FAILED;

    return ok({
      hash: receipt.transactionHash,
      chainId: client.chainId,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.transactionIndex,
      from: receipt.from,
      to: receipt.to ?? '',
      status,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      fee: receipt.gasUsed * receipt.effectiveGasPrice,
    });
  } catch (error) {
    return err(
      ErrorCode.TRANSACTION_TIMEOUT,
      error instanceof Error ? error.message : 'Failed to get transaction receipt',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Send a transaction (build, sign, send, wait)
 */
export async function sendTransaction(
  client: EvmClient,
  request: EvmTxRequest,
  privateKey: string,
  waitForConfirmation = true
): Promise<Result<TransactionReceipt>> {
  // Build transaction
  const built = await buildTransaction(client, request);
  if (!built.ok) return built;

  // Sign transaction
  const signed = await signEvmTransaction(built.value, privateKey);
  if (!signed.ok) return signed;

  // Send transaction
  const sendResult = await sendSignedTransaction(client, signed.value);
  if (!sendResult.ok) return sendResult;

  if (!waitForConfirmation) {
    return ok({
      hash: sendResult.value,
      chainId: client.chainId,
      blockNumber: 0n,
      blockHash: '',
      transactionIndex: 0,
      from: request.from,
      to: request.to,
      status: TransactionStatus.PENDING,
      gasUsed: 0n,
      fee: 0n,
    });
  }

  // Wait for confirmation
  return waitForTransaction(client, sendResult.value);
}

/**
 * Parse ETH amount from string
 */
export function parseEthAmount(amount: string): bigint {
  return parseEther(amount);
}

/**
 * Format ETH amount to string
 */
export function formatEthAmount(amount: bigint): string {
  return formatEther(amount);
}
