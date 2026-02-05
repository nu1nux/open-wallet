/**
 * Assertion error with context
 */
export class AssertionError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * Assert a condition is truthy
 */
export function assert(condition: unknown, message: string, context?: Record<string, unknown>): asserts condition {
  if (!condition) {
    throw new AssertionError(message, context);
  }
}

/**
 * Assert a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  context?: Record<string, unknown>
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AssertionError(message, context);
  }
}

/**
 * Assert a value is a string
 */
export function assertString(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new AssertionError(message, { type: typeof value });
  }
}

/**
 * Assert a value is a number
 */
export function assertNumber(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new AssertionError(message, { type: typeof value, isNaN: Number.isNaN(value) });
  }
}

/**
 * Assert a value is a bigint
 */
export function assertBigInt(value: unknown, message: string): asserts value is bigint {
  if (typeof value !== 'bigint') {
    throw new AssertionError(message, { type: typeof value });
  }
}

/**
 * Assert a value is an array
 */
export function assertArray<T>(value: unknown, message: string): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new AssertionError(message, { type: typeof value });
  }
}

/**
 * Assert code path should never be reached
 */
export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new AssertionError(message, { value });
}

/**
 * Type guard that also asserts
 */
export function ensure<T>(value: T | null | undefined, message: string): T {
  assertDefined(value, message);
  return value;
}
