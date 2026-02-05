import { IStorage, StorageConfig } from './interface';

/**
 * In-memory storage implementation
 * Useful for testing and server-side usage
 */
export class MemoryStorage implements IStorage {
  private store = new Map<string, unknown>();
  private readonly prefix: string;

  constructor(config: StorageConfig = {}) {
    this.prefix = config.namespace ? `${config.namespace}:` : '';
  }

  private prefixKey(key: string): string {
    return this.prefix + key;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(this.prefixKey(key));
    return value !== undefined ? (value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(this.prefixKey(key), value);
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(this.prefixKey(key));
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(this.prefixKey(key));
  }

  async keys(): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    if (!this.prefix) {
      return allKeys;
    }
    return allKeys
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length));
  }

  async clear(): Promise<void> {
    if (!this.prefix) {
      this.store.clear();
      return;
    }

    // Only clear keys with our prefix
    for (const key of this.store.keys()) {
      if (key.startsWith(this.prefix)) {
        this.store.delete(key);
      }
    }
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    return result;
  }

  async setMany<T>(entries: Map<string, T> | Array<[string, T]>): Promise<void> {
    const iterable = entries instanceof Map ? entries.entries() : entries;
    for (const [key, value] of iterable) {
      await this.set(key, value);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }

  /**
   * Get the size of the storage (number of keys)
   */
  size(): number {
    if (!this.prefix) {
      return this.store.size;
    }
    return Array.from(this.store.keys()).filter((k) => k.startsWith(this.prefix)).length;
  }

  /**
   * Get all entries as a plain object (for debugging)
   */
  toObject(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.store) {
      if (!this.prefix || key.startsWith(this.prefix)) {
        const cleanKey = this.prefix ? key.slice(this.prefix.length) : key;
        result[cleanKey] = value;
      }
    }
    return result;
  }
}

/**
 * Create a new memory storage instance
 */
export function createMemoryStorage(config?: StorageConfig): IStorage {
  return new MemoryStorage(config);
}
