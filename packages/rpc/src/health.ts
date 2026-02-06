import { createLogger } from '@open-wallet/utils';
import { RpcEndpoint, EndpointHealth } from './types';

const logger = createLogger('rpc:health');

/**
 * Health checker for RPC endpoints
 */
export class HealthChecker {
  private health: Map<string, EndpointHealth> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly endpoints: RpcEndpoint[],
    private readonly intervalMs: number = 30000
  ) {
    // Initialize health status for all endpoints
    for (const endpoint of endpoints) {
      this.health.set(endpoint.url, {
        url: endpoint.url,
        healthy: true, // Assume healthy until proven otherwise
        latencyMs: 0,
        lastChecked: 0,
        errorCount: 0,
        successRate: 1,
      });
    }
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) return;

    // Do initial check
    this.checkAll();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => this.checkAll(), this.intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check health of all endpoints
   */
  async checkAll(): Promise<void> {
    await Promise.all(this.endpoints.map((ep) => this.check(ep)));
  }

  /**
   * Check health of a single endpoint
   */
  async check(endpoint: RpcEndpoint): Promise<EndpointHealth> {
    const startTime = performance.now();
    let healthy = false;

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'net_version', // EVM method, for Solana use 'getHealth'
          params: [],
        }),
        signal: AbortSignal.timeout(endpoint.timeout ?? 5000),
      });

      if (response.ok) {
        const data = await response.json();
        healthy = !data.error;
      }
    } catch (error) {
      logger.debug(`Health check failed for ${endpoint.url}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const latencyMs = performance.now() - startTime;
    const existing = this.health.get(endpoint.url)!;

    // Update health status with exponential moving average
    const newSuccessRate = healthy
      ? existing.successRate * 0.9 + 0.1
      : existing.successRate * 0.9;

    const updatedHealth: EndpointHealth = {
      url: endpoint.url,
      healthy: newSuccessRate > 0.5, // Consider healthy if >50% success rate
      latencyMs: existing.latencyMs * 0.7 + latencyMs * 0.3, // Smoothed latency
      lastChecked: Date.now(),
      errorCount: healthy ? 0 : existing.errorCount + 1,
      successRate: newSuccessRate,
    };

    this.health.set(endpoint.url, updatedHealth);

    if (!healthy && existing.healthy) {
      logger.warn(`Endpoint unhealthy: ${endpoint.url}`);
    } else if (healthy && !existing.healthy) {
      logger.info(`Endpoint recovered: ${endpoint.url}`);
    }

    return updatedHealth;
  }

  /**
   * Get health status for an endpoint
   */
  getHealth(url: string): EndpointHealth | undefined {
    return this.health.get(url);
  }

  /**
   * Get all healthy endpoints sorted by latency
   */
  getHealthyEndpoints(): EndpointHealth[] {
    return Array.from(this.health.values())
      .filter((h) => h.healthy)
      .sort((a, b) => a.latencyMs - b.latencyMs);
  }

  /**
   * Record a successful request
   */
  recordSuccess(url: string, latencyMs: number): void {
    const existing = this.health.get(url);
    if (!existing) return;

    this.health.set(url, {
      ...existing,
      healthy: true,
      latencyMs: existing.latencyMs * 0.7 + latencyMs * 0.3,
      errorCount: 0,
      successRate: existing.successRate * 0.9 + 0.1,
    });
  }

  /**
   * Record a failed request
   */
  recordFailure(url: string): void {
    const existing = this.health.get(url);
    if (!existing) return;

    const errorCount = existing.errorCount + 1;
    const successRate = existing.successRate * 0.9;

    this.health.set(url, {
      ...existing,
      healthy: successRate > 0.5 && errorCount < 5,
      errorCount,
      successRate,
    });
  }

  /**
   * Mark endpoint as temporarily unavailable
   */
  markUnavailable(url: string): void {
    const existing = this.health.get(url);
    if (!existing) return;

    this.health.set(url, {
      ...existing,
      healthy: false,
      errorCount: existing.errorCount + 1,
    });
  }
}
