import { Result, ok, err, ErrorCode } from '@open-wallet/types';
import { createLogger, RateLimiter, retry, RetryConfig } from '@open-wallet/utils';
import {
  RpcClientConfig,
  RpcEndpoint,
  JsonRpcRequest,
  JsonRpcResponse,
  RpcError,
} from './types';
import { HealthChecker } from './health';

const logger = createLogger('rpc:client');

/**
 * Default RPC client configuration
 */
const DEFAULT_CONFIG: Partial<RpcClientConfig> = {
  timeout: 30000,
  retries: 3,
  failover: true,
  healthCheckInterval: 30000,
};

/**
 * RPC client with failover, rate limiting, and health checks
 */
export class RpcClient {
  private readonly config: RpcClientConfig;
  private readonly healthChecker: HealthChecker;
  private readonly rateLimiters: Map<string, RateLimiter> = new Map();
  private requestId = 0;

  constructor(config: RpcClientConfig) {
    if (!config.endpoints.length) {
      throw new Error('At least one RPC endpoint is required');
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.healthChecker = new HealthChecker(
      this.config.endpoints,
      this.config.healthCheckInterval
    );

    // Initialize rate limiters for each endpoint
    for (const endpoint of this.config.endpoints) {
      if (endpoint.rateLimit) {
        this.rateLimiters.set(
          endpoint.url,
          new RateLimiter(endpoint.rateLimit, endpoint.rateLimit)
        );
      }
    }
  }

  /**
   * Start health monitoring
   */
  start(): void {
    this.healthChecker.start();
  }

  /**
   * Stop health monitoring and cleanup
   */
  stop(): void {
    this.healthChecker.stop();
  }

  /**
   * Get the next available endpoint
   */
  private getEndpoint(): RpcEndpoint | null {
    if (!this.config.failover) {
      return this.config.endpoints[0];
    }

    const healthyEndpoints = this.healthChecker.getHealthyEndpoints();

    for (const health of healthyEndpoints) {
      const endpoint = this.config.endpoints.find((e) => e.url === health.url);
      if (endpoint) {
        // Check rate limiter
        const limiter = this.rateLimiters.get(endpoint.url);
        if (!limiter || limiter.tryAcquire()) {
          return endpoint;
        }
      }
    }

    // Fallback to first endpoint if all are rate limited
    return this.config.endpoints[0];
  }

  /**
   * Make a raw JSON-RPC request
   */
  private async rawRequest<T>(
    endpoint: RpcEndpoint,
    method: string,
    params: unknown[] = []
  ): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };

    const startTime = performance.now();

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : {}),
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(endpoint.timeout ?? this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: JsonRpcResponse<T> = await response.json();

    const latencyMs = performance.now() - startTime;
    this.healthChecker.recordSuccess(endpoint.url, latencyMs);

    if (data.error) {
      throw RpcError.fromJsonRpcError(data.error);
    }

    return data.result as T;
  }

  /**
   * Make a JSON-RPC call with failover and retries
   */
  async call<T>(method: string, params: unknown[] = []): Promise<Result<T>> {
    const retryConfig: Partial<RetryConfig> = {
      maxAttempts: this.config.retries,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      isRetryable: (error) => {
        // Don't retry invalid params or method not found
        if (error instanceof RpcError) {
          return error.code !== -32602 && error.code !== -32601;
        }
        return true;
      },
    };

    let lastEndpoint: RpcEndpoint | null = null;
    let attempt = 0;

    try {
      const result = await retry(async () => {
        attempt++;
        const endpoint = this.getEndpoint();

        if (!endpoint) {
          throw new Error('No available RPC endpoints');
        }

        // If we failed on this endpoint before, try a different one
        if (lastEndpoint && lastEndpoint.url === endpoint.url && attempt > 1) {
          this.healthChecker.markUnavailable(endpoint.url);
          const newEndpoint = this.getEndpoint();
          if (newEndpoint && newEndpoint.url !== endpoint.url) {
            lastEndpoint = newEndpoint;
            return this.rawRequest<T>(newEndpoint, method, params);
          }
        }

        lastEndpoint = endpoint;

        try {
          return await this.rawRequest<T>(endpoint, method, params);
        } catch (error) {
          this.healthChecker.recordFailure(endpoint.url);
          throw error;
        }
      }, retryConfig);

      return ok(result);
    } catch (error) {
      logger.error(`RPC call failed: ${method}`, {
        error: error instanceof Error ? error.message : String(error),
        params,
      });

      if (error instanceof RpcError) {
        return err(ErrorCode.RPC_ERROR, error.message, error);
      }

      return err(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Make a batch JSON-RPC call
   */
  async batch<T extends unknown[]>(
    requests: Array<{ method: string; params?: unknown[] }>
  ): Promise<Result<T>> {
    const endpoint = this.getEndpoint();
    if (!endpoint) {
      return err(ErrorCode.NETWORK_ERROR, 'No available RPC endpoints');
    }

    const batchRequest = requests.map((req) => ({
      jsonrpc: '2.0' as const,
      id: ++this.requestId,
      method: req.method,
      params: req.params ?? [],
    }));

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : {}),
        },
        body: JSON.stringify(batchRequest),
        signal: AbortSignal.timeout(endpoint.timeout ?? this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: JsonRpcResponse[] = await response.json();
      const results: unknown[] = [];

      for (const item of data) {
        if (item.error) {
          throw RpcError.fromJsonRpcError(item.error);
        }
        results.push(item.result);
      }

      return ok(results as T);
    } catch (error) {
      return err(
        ErrorCode.RPC_ERROR,
        error instanceof Error ? error.message : 'Batch request failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get health status of all endpoints
   */
  getHealthStatus() {
    return this.healthChecker.getHealthyEndpoints();
  }
}

/**
 * Create an RPC client
 */
export function createRpcClient(config: RpcClientConfig): RpcClient {
  return new RpcClient(config);
}

/**
 * Create an RPC client for a single URL
 */
export function createSimpleRpcClient(url: string, options?: Partial<RpcEndpoint>): RpcClient {
  return new RpcClient({
    endpoints: [{ url, ...options }],
  });
}
