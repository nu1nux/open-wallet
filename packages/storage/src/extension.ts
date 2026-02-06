import { IStorage, StorageConfig } from './interface';

/**
 * Storage area type for browser extensions
 */
export type StorageArea = 'local' | 'sync' | 'session';

/**
 * Browser extension storage configuration
 */
export interface ExtensionStorageConfig extends StorageConfig {
  /** Storage area to use */
  area?: StorageArea;
}

/**
 * Browser extension storage API interface
 * Compatible with Chrome's chrome.storage and Firefox's browser.storage
 */
interface BrowserStorageArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

interface BrowserStorage {
  local: BrowserStorageArea;
  sync: BrowserStorageArea;
  session?: BrowserStorageArea;
}

/**
 * Get the browser storage API
 */
function getBrowserStorage(): BrowserStorage | null {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage as unknown as BrowserStorage;
  }
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage as unknown as BrowserStorage;
  }
  return null;
}

// Declare browser global for Firefox
declare const chrome: { storage: BrowserStorage } | undefined;
declare const browser: { storage: BrowserStorage } | undefined;

/**
 * Browser extension storage implementation
 * Works with Chrome, Firefox, and other Chromium-based browsers
 */
export class ExtensionStorage implements IStorage {
  private readonly storage: BrowserStorageArea;
  private readonly prefix: string;

  constructor(config: ExtensionStorageConfig = {}) {
    const browserStorage = getBrowserStorage();
    if (!browserStorage) {
      throw new Error('Browser storage API not available');
    }

    const area = config.area ?? 'local';
    const storageArea = browserStorage[area];

    if (!storageArea) {
      throw new Error(`Storage area "${area}" not available`);
    }

    this.storage = storageArea;
    this.prefix = config.namespace ? `${config.namespace}:` : '';
  }

  private prefixKey(key: string): string {
    return this.prefix + key;
  }

  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);
    const result = await this.storage.get(prefixedKey);
    return result[prefixedKey] !== undefined ? (result[prefixedKey] as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.storage.set({ [this.prefixKey(key)]: value });
  }

  async delete(key: string): Promise<boolean> {
    const exists = await this.has(key);
    if (exists) {
      await this.storage.remove(this.prefixKey(key));
    }
    return exists;
  }

  async has(key: string): Promise<boolean> {
    const result = await this.storage.get(this.prefixKey(key));
    return this.prefixKey(key) in result;
  }

  async keys(): Promise<string[]> {
    const result = await this.storage.get(null);
    const allKeys = Object.keys(result);

    if (!this.prefix) {
      return allKeys;
    }

    return allKeys
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length));
  }

  async clear(): Promise<void> {
    if (!this.prefix) {
      await this.storage.clear();
      return;
    }

    // Only clear keys with our prefix
    const keys = await this.keys();
    if (keys.length > 0) {
      await this.storage.remove(keys.map((k) => this.prefixKey(k)));
    }
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const prefixedKeys = keys.map((k) => this.prefixKey(k));
    const result = await this.storage.get(prefixedKeys);

    const map = new Map<string, T>();
    for (const key of keys) {
      const prefixedKey = this.prefixKey(key);
      if (result[prefixedKey] !== undefined) {
        map.set(key, result[prefixedKey] as T);
      }
    }
    return map;
  }

  async setMany<T>(entries: Map<string, T> | Array<[string, T]>): Promise<void> {
    const items: Record<string, unknown> = {};
    const iterable = entries instanceof Map ? entries.entries() : entries;

    for (const [key, value] of iterable) {
      items[this.prefixKey(key)] = value;
    }

    await this.storage.set(items);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await this.storage.remove(keys.map((k) => this.prefixKey(k)));
  }
}

/**
 * Create a new extension storage instance
 */
export function createExtensionStorage(config?: ExtensionStorageConfig): IStorage {
  return new ExtensionStorage(config);
}

/**
 * Check if browser extension storage is available
 */
export function isExtensionStorageAvailable(): boolean {
  return getBrowserStorage() !== null;
}
