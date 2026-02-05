import { ChainId } from './chain';

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

/**
 * Transaction type
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  TOKEN_TRANSFER = 'token_transfer',
  CONTRACT_CALL = 'contract_call',
  CONTRACT_DEPLOY = 'contract_deploy',
}

/**
 * Base transaction request interface
 */
export interface BaseTxRequest {
  /** Chain to send transaction on */
  chainId: ChainId;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Amount in smallest unit (wei, lamports, etc.) */
  value: bigint;
  /** Transaction memo/data */
  data?: string;
}

/**
 * EVM-specific transaction request
 */
export interface EvmTxRequest extends BaseTxRequest {
  /** Gas limit */
  gasLimit?: bigint;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Legacy gas price (pre-EIP-1559) */
  gasPrice?: bigint;
  /** Transaction nonce */
  nonce?: number;
}

/**
 * Solana-specific transaction request
 */
export interface SolanaTxRequest extends BaseTxRequest {
  /** Recent blockhash for transaction */
  recentBlockhash?: string;
  /** Priority fee in micro-lamports */
  priorityFee?: number;
}

/**
 * Union type for all transaction requests
 */
export type TxRequest = EvmTxRequest | SolanaTxRequest;

/**
 * Signed transaction ready for broadcast
 */
export interface SignedTransaction {
  /** Chain ID */
  chainId: ChainId;
  /** Signed transaction data (hex for EVM, base64 for Solana) */
  signedTx: string;
  /** Transaction hash (if known before broadcast) */
  hash?: string;
}

/**
 * Transaction receipt after confirmation
 */
export interface TransactionReceipt {
  /** Transaction hash */
  hash: string;
  /** Chain ID */
  chainId: ChainId;
  /** Block number containing the transaction */
  blockNumber: bigint;
  /** Block hash */
  blockHash: string;
  /** Transaction index in block */
  transactionIndex: number;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Transaction status */
  status: TransactionStatus;
  /** Gas used (EVM) or compute units (Solana) */
  gasUsed: bigint;
  /** Effective gas price (EVM only) */
  effectiveGasPrice?: bigint;
  /** Transaction fee in native token */
  fee: bigint;
  /** Timestamp of the block */
  timestamp?: number;
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
  /** Estimated gas limit */
  gasLimit: bigint;
  /** Suggested max fee per gas */
  maxFeePerGas: bigint;
  /** Suggested max priority fee per gas */
  maxPriorityFeePerGas: bigint;
  /** Estimated total cost in native token */
  estimatedCost: bigint;
}

/**
 * Token transfer request (ERC-20 or SPL)
 */
export interface TokenTransferRequest {
  /** Chain to send on */
  chainId: ChainId;
  /** Token contract address / mint address */
  tokenAddress: string;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Amount in token's smallest unit */
  amount: bigint;
}
