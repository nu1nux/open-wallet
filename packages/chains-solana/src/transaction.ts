import {
  Transaction,
  SystemProgram,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  ChainId,
  SolanaTxRequest,
  SignedTransaction,
  TransactionReceipt,
  TransactionStatus,
  Result,
  ok,
  err,
  ErrorCode,
} from '@open-wallet/types';
import { createLogger } from '@open-wallet/utils';
import { SolanaClient, solToLamports, lamportsToSol } from './client';

const logger = createLogger('chains-solana:transaction');

/**
 * Build a SOL transfer transaction
 */
export async function buildTransferTransaction(
  client: SolanaClient,
  request: SolanaTxRequest
): Promise<Result<Transaction>> {
  try {
    const fromPubkey = new PublicKey(request.from);
    const toPubkey = new PublicKey(request.to);

    // Get recent blockhash
    const recentBlockhash =
      request.recentBlockhash ?? (await client.getRecentBlockhash());

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash,
      feePayer: fromPubkey,
    });

    // Add priority fee if specified
    if (request.priorityFee) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: request.priorityFee,
        })
      );
    }

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Number(request.value),
      })
    );

    return ok(transaction);
  } catch (error) {
    return err(
      ErrorCode.INVALID_INPUT,
      error instanceof Error ? error.message : 'Failed to build transaction',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Sign a Solana transaction
 */
export function signSolanaTransaction(
  transaction: Transaction,
  keypair: Keypair
): Result<SignedTransaction> {
  try {
    transaction.sign(keypair);

    const signedTx = transaction
      .serialize()
      .toString('base64');

    return ok({
      chainId: ChainId.SOLANA_MAINNET, // Will be overridden by actual chain
      signedTx,
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
  client: SolanaClient,
  signedTx: string
): Promise<Result<string>> {
  try {
    const buffer = Buffer.from(signedTx, 'base64');
    const signature = await client.connection.sendRawTransaction(buffer, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    logger.info(`Transaction sent: ${signature}`);
    return ok(signature);
  } catch (error) {
    return err(
      ErrorCode.BROADCAST_FAILED,
      error instanceof Error ? error.message : 'Failed to send transaction',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  client: SolanaClient,
  signature: string
): Promise<Result<TransactionReceipt>> {
  try {
    const confirmation = await client.connection.confirmTransaction(
      signature,
      'confirmed'
    );

    if (confirmation.value.err) {
      return ok({
        hash: signature,
        chainId: client.chainId,
        blockNumber: 0n,
        blockHash: '',
        transactionIndex: 0,
        from: '',
        to: '',
        status: TransactionStatus.FAILED,
        gasUsed: 0n,
        fee: 0n,
      });
    }

    // Get transaction details
    const tx = await client.connection.getTransaction(signature, {
      commitment: 'confirmed',
    });

    return ok({
      hash: signature,
      chainId: client.chainId,
      blockNumber: BigInt(tx?.slot ?? 0),
      blockHash: tx?.transaction.message.recentBlockhash ?? '',
      transactionIndex: 0,
      from: tx?.transaction.message.accountKeys[0]?.toBase58() ?? '',
      to: tx?.transaction.message.accountKeys[1]?.toBase58() ?? '',
      status: TransactionStatus.CONFIRMED,
      gasUsed: BigInt(tx?.meta?.computeUnitsConsumed ?? 0),
      fee: BigInt(tx?.meta?.fee ?? 0),
      timestamp: tx?.blockTime ?? undefined,
    });
  } catch (error) {
    return err(
      ErrorCode.TRANSACTION_TIMEOUT,
      error instanceof Error ? error.message : 'Failed to confirm transaction',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Send a SOL transfer
 */
export async function sendTransfer(
  client: SolanaClient,
  to: string,
  amount: bigint,
  keypair: Keypair,
  priorityFee?: number
): Promise<Result<TransactionReceipt>> {
  // Build transaction
  const buildResult = await buildTransferTransaction(client, {
    chainId: client.chainId,
    from: keypair.publicKey.toBase58(),
    to,
    value: amount,
    priorityFee,
  });

  if (!buildResult.ok) return buildResult;

  // Sign transaction
  const signResult = signSolanaTransaction(buildResult.value, keypair);
  if (!signResult.ok) return signResult;

  // Send transaction
  const sendResult = await sendSignedTransaction(client, signResult.value.signedTx);
  if (!sendResult.ok) return sendResult;

  // Wait for confirmation
  return waitForTransaction(client, sendResult.value);
}

/**
 * Send a transaction using the connected wallet
 */
export async function sendTransaction(
  client: SolanaClient,
  request: SolanaTxRequest
): Promise<Result<TransactionReceipt>> {
  const keypair = client.getKeypair();
  if (!keypair) {
    return err(ErrorCode.WALLET_LOCKED, 'No wallet connected');
  }

  return sendTransfer(
    client,
    request.to,
    request.value,
    keypair,
    request.priorityFee
  );
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  client: SolanaClient,
  transaction: Transaction
): Promise<Result<bigint>> {
  try {
    const fee = await transaction.getEstimatedFee(client.connection);
    return ok(BigInt(fee ?? 5000)); // Default to 5000 lamports if unknown
  } catch (error) {
    return err(
      ErrorCode.GAS_ESTIMATION_FAILED,
      error instanceof Error ? error.message : 'Failed to estimate fee',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Format lamports for display
 */
export function formatLamports(lamports: bigint): string {
  const sol = lamportsToSol(lamports);
  if (sol < 0.0001) {
    return `${lamports} lamports`;
  }
  return `${sol.toFixed(4)} SOL`;
}
