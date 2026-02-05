import { createLogger } from './logger';

const logger = createLogger('retry');

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of attempts (including the first one) */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Add random jitter to delays */
  jitter: boolean;
  /** Function to determine if an error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Callback when a retry occurs */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Calculate delay for a given attempt
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  if (config.jitter) {
    // Add random jitter between 0% and 25% of the delay
    const jitterRange = cappedDelay * 0.25;
    return cappedDelay + Math.random() * jitterRange;
  }

  return cappedDelay;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt === fullConfig.maxAttempts) {
        break;
      }

      if (fullConfig.isRetryable && !fullConfig.isRetryable(lastError)) {
        break;
      }

      // Calculate delay and wait
      const delayMs = calculateDelay(attempt, fullConfig);

      logger.debug(`Attempt ${attempt} failed, retrying in ${delayMs}ms`, {
        error: lastError.message,
        attempt,
        maxAttempts: fullConfig.maxAttempts,
      });

      fullConfig.onRetry?.(lastError, attempt, delayMs);

      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of a function
 */
export function withRetry<T extends (...args: Parameters<T>) => Promise<ReturnType<T>>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return ((...args: Parameters<T>) => retry(() => fn(...args), config)) as T;
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly fn: () => Promise<T>,
    private readonly config: {
      failureThreshold: number;
      resetTimeoutMs: number;
      retryConfig?: Partial<RetryConfig>;
    }
  ) {}

  async execute(): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.config.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await retry(this.fn, this.config.retryConfig);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}
