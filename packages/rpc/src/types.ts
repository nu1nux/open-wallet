/**
 * JSON-RPC request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown[];
}

/**
 * JSON-RPC response
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: JsonRpcError;
}

/**
 * JSON-RPC error
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * RPC endpoint configuration
 */
export interface RpcEndpoint {
  /** Endpoint URL */
  url: string;
  /** Optional API key to include in headers */
  apiKey?: string;
  /** Weight for load balancing (higher = more traffic) */
  weight?: number;
  /** Maximum requests per second */
  rateLimit?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * RPC client configuration
 */
export interface RpcClientConfig {
  /** List of endpoints (primary + fallbacks) */
  endpoints: RpcEndpoint[];
  /** Default request timeout in milliseconds */
  timeout?: number;
  /** Number of retries on failure */
  retries?: number;
  /** Enable automatic failover to healthy endpoints */
  failover?: boolean;
  /** Health check interval in milliseconds */
  healthCheckInterval?: number;
}

/**
 * Endpoint health status
 */
export interface EndpointHealth {
  url: string;
  healthy: boolean;
  latencyMs: number;
  lastChecked: number;
  errorCount: number;
  successRate: number;
}

/**
 * RPC error class
 */
export class RpcError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'RpcError';
  }

  static fromJsonRpcError(error: JsonRpcError): RpcError {
    return new RpcError(error.message, error.code, error.data);
  }
}

/**
 * Standard JSON-RPC error codes
 */
export const RPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Server errors
  SERVER_ERROR_START: -32000,
  SERVER_ERROR_END: -32099,
} as const;
