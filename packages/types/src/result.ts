/**
 * Error codes for wallet operations
 */
export enum ErrorCode {
  // General errors
  UNKNOWN = 'UNKNOWN',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Crypto errors
  INVALID_MNEMONIC = 'INVALID_MNEMONIC',
  INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
  DERIVATION_FAILED = 'DERIVATION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',

  // Transaction errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  SIGNING_FAILED = 'SIGNING_FAILED',
  BROADCAST_FAILED = 'BROADCAST_FAILED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',

  // Network errors
  RPC_ERROR = 'RPC_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',

  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_NOT_FOUND = 'STORAGE_NOT_FOUND',

  // Wallet errors
  WALLET_LOCKED = 'WALLET_LOCKED',
  WALLET_NOT_INITIALIZED = 'WALLET_NOT_INITIALIZED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
}

/**
 * Structured error with code and context
 */
export class WalletError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WalletError';
    Error.captureStackTrace?.(this, WalletError);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      cause: this.cause?.message,
    };
  }
}

/**
 * Success result type
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * Error result type
 */
export interface Err {
  ok: false;
  error: WalletError;
}

/**
 * Result type for operations that can fail
 * Inspired by Rust's Result<T, E>
 */
export type Result<T> = Ok<T> | Err;

/**
 * Create a success result
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function err(
  code: ErrorCode,
  message: string,
  cause?: Error,
  context?: Record<string, unknown>
): Err {
  return {
    ok: false,
    error: new WalletError(code, message, cause, context),
  };
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value for errors
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Map a success value to a new value
 */
export function mapResult<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  return result.ok ? ok(fn(result.value)) : result;
}

/**
 * Chain results together (flatMap)
 */
export function andThen<T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Type guard for success result
 */
export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok;
}

/**
 * Type guard for error result
 */
export function isErr<T>(result: Result<T>): result is Err {
  return !result.ok;
}
