import {
  PublicKey,
  Keypair,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Token, TokenBalance, TokenStandard, Result, ok, err, ErrorCode } from '@open-wallet/types';
import { createLogger } from '@open-wallet/utils';
import { SolanaClient } from './client';
import { signSolanaTransaction, sendSignedTransaction, waitForTransaction } from './transaction';

const logger = createLogger('chains-solana:spl-token');

/**
 * Get SPL token metadata
 */
export async function getTokenMetadata(
  client: SolanaClient,
  mintAddress: string
): Promise<Result<Token>> {
  try {
    const mint = new PublicKey(mintAddress);
    const mintInfo = await getMint(client.connection, mint);

    // Note: SPL tokens don't have on-chain name/symbol
    // In a real implementation, you'd fetch this from a token registry
    return ok({
      address: mintAddress,
      name: mintAddress.slice(0, 8) + '...',
      symbol: 'SPL',
      decimals: mintInfo.decimals,
      chainId: client.chainId,
      standard: TokenStandard.SPL,
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
 * Get associated token address for an owner
 */
export async function getTokenAccountAddress(
  mint: string | PublicKey,
  owner: string | PublicKey
): Promise<PublicKey> {
  const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
  const ownerPubkey = typeof owner === 'string' ? new PublicKey(owner) : owner;

  return getAssociatedTokenAddress(
    mintPubkey,
    ownerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/**
 * Get SPL token balance
 */
export async function getTokenBalance(
  client: SolanaClient,
  mintAddress: string,
  ownerAddress: string
): Promise<Result<TokenBalance>> {
  try {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerAddress);

    // Get token metadata
    const metadata = await getTokenMetadata(client, mintAddress);
    if (!metadata.ok) return metadata;

    // Get associated token account
    const tokenAccount = await getTokenAccountAddress(mint, owner);

    try {
      const accountInfo = await getAccount(client.connection, tokenAccount);
      const balance = accountInfo.amount;

      const formattedBalance = formatTokenAmount(balance, metadata.value.decimals);

      return ok({
        token: metadata.value,
        balance,
        formattedBalance,
      });
    } catch {
      // Account doesn't exist, balance is 0
      return ok({
        token: metadata.value,
        balance: 0n,
        formattedBalance: '0',
      });
    }
  } catch (error) {
    return err(
      ErrorCode.RPC_ERROR,
      error instanceof Error ? error.message : 'Failed to get token balance',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Check if an associated token account exists
 */
export async function tokenAccountExists(
  client: SolanaClient,
  mintAddress: string,
  ownerAddress: string
): Promise<boolean> {
  try {
    const tokenAccount = await getTokenAccountAddress(mintAddress, ownerAddress);
    const info = await client.connection.getAccountInfo(tokenAccount);
    return info !== null;
  } catch {
    return false;
  }
}

/**
 * Transfer SPL tokens
 */
export async function transferToken(
  client: SolanaClient,
  mintAddress: string,
  from: string,
  to: string,
  amount: bigint,
  keypair: Keypair
): Promise<Result<string>> {
  try {
    const mint = new PublicKey(mintAddress);
    const fromPubkey = new PublicKey(from);
    const toPubkey = new PublicKey(to);

    // Get source token account
    const sourceAccount = await getTokenAccountAddress(mint, fromPubkey);

    // Get or create destination token account
    const destAccount = await getTokenAccountAddress(mint, toPubkey);

    // Get recent blockhash
    const recentBlockhash = await client.getRecentBlockhash();

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash,
      feePayer: keypair.publicKey,
    });

    // Check if destination account exists
    const destExists = await tokenAccountExists(client, mintAddress, to);
    if (!destExists) {
      // Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          keypair.publicKey,
          destAccount,
          toPubkey,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceAccount,
        destAccount,
        fromPubkey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Sign transaction
    const signed = signSolanaTransaction(transaction, keypair);
    if (!signed.ok) return signed;

    // Send transaction
    return sendSignedTransaction(client, signed.value.signedTx);
  } catch (error) {
    return err(
      ErrorCode.BROADCAST_FAILED,
      error instanceof Error ? error.message : 'Failed to transfer tokens',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Create an associated token account
 */
export async function createTokenAccount(
  client: SolanaClient,
  mintAddress: string,
  ownerAddress: string,
  payerKeypair: Keypair
): Promise<Result<string>> {
  try {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerAddress);

    const tokenAccount = await getTokenAccountAddress(mint, owner);

    // Check if already exists
    const exists = await tokenAccountExists(client, mintAddress, ownerAddress);
    if (exists) {
      return ok(tokenAccount.toBase58());
    }

    // Get recent blockhash
    const recentBlockhash = await client.getRecentBlockhash();

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash,
      feePayer: payerKeypair.publicKey,
    });

    transaction.add(
      createAssociatedTokenAccountInstruction(
        payerKeypair.publicKey,
        tokenAccount,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    // Sign and send
    const signed = signSolanaTransaction(transaction, payerKeypair);
    if (!signed.ok) return signed;

    const sendResult = await sendSignedTransaction(client, signed.value.signedTx);
    if (!sendResult.ok) return sendResult;

    // Wait for confirmation
    await waitForTransaction(client, sendResult.value);

    return ok(tokenAccount.toBase58());
  } catch (error) {
    return err(
      ErrorCode.BROADCAST_FAILED,
      error instanceof Error ? error.message : 'Failed to create token account',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Format token amount
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.replace(/0+$/, '');
  return `${whole}.${trimmed}`;
}

/**
 * Parse token amount
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}
