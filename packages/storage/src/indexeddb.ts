import { openDB, IDBPDatabase } from 'idb';
import { IStorage, StorageConfig } from './interface';

const DEFAULT_DB_NAME = 'wallet-suite';
const DEFAULT_STORE_NAME = 'keyval';

/**
 * IndexedDB storage configuration
 */
export interface IndexedDBStorageConfig extends StorageConfig {
  /** Database name */
  dbName?: string;
  /** Object store name */
  storeName?: string;
}

/**
 * IndexedDB storage implementation
 * Suitable for web applications with larger storage needs
 */
export class IndexedDBStorage implements IStorage {
  private db: IDBPDatabase | null = null;
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly prefix: string;
  private initPromise: Promise<void> | null = null;

  constructor(config: IndexedDBStorageConfig = {}) {
    this.dbName = config.dbName ?? DEFAULT_DB_NAME;
    this.storeName = config.storeName ?? DEFAULT_STORE_NAME;
    this.prefix = config.namespace ? `${config.namespace}:` : '';
  }

  private async init(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doInit();
    await this.initPromise;
  }

  private async doInit(): Promise<void> {
    const storeName = this.storeName;
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    });
  }

  private prefixKey(key: string): string {
    return this.prefix + key;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    const value = await this.db!.get(this.storeName, this.prefixKey(key));
    return value !== undefined ? (value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.init();
    await this.db!.put(this.storeName, value, this.prefixKey(key));
  }

  async delete(key: string): Promise<boolean> {
    await this.init();
    const exists = (await this.db!.get(this.storeName, this.prefixKey(key))) !== undefined;
    if (exists) {
      await this.db!.delete(this.storeName, this.prefixKey(key));
    }
    return exists;
  }

  async has(key: string): Promise<boolean> {
    await this.init();
    const value = await this.db!.get(this.storeName, this.prefixKey(key));
    return value !== undefined;
  }

  async keys(): Promise<string[]> {
    await this.init();
    const allKeys = (await this.db!.getAllKeys(this.storeName)) as string[];

    if (!this.prefix) {
      return allKeys;
    }

    return allKeys
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length));
  }

  async clear(): Promise<void> {
    await this.init();

    if (!this.prefix) {
      await this.db!.clear(this.storeName);
      return;
    }

    // Only clear keys with our prefix
    const keys = await this.keys();
    const tx = this.db!.transaction(this.storeName, 'readwrite');
    await Promise.all([
      ...keys.map((k) => tx.store.delete(this.prefixKey(k))),
      tx.done,
    ]);
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    await this.init();
    const result = new Map<string, T>();
    const tx = this.db!.transaction(this.storeName, 'readonly');

    const values = await Promise.all(
      keys.map((k) => tx.store.get(this.prefixKey(k)))
    );

    keys.forEach((key, i) => {
      if (values[i] !== undefined) {
        result.set(key, values[i] as T);
      }
    });

    return result;
  }

  async setMany<T>(entries: Map<string, T> | Array<[string, T]>): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(this.storeName, 'readwrite');
    const iterable = entries instanceof Map ? entries.entries() : entries;

    const promises: Promise<unknown>[] = [];
    for (const [key, value] of iterable) {
      promises.push(tx.store.put(value, this.prefixKey(key)));
    }
    promises.push(tx.done);

    await Promise.all(promises);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(this.storeName, 'readwrite');

    await Promise.all([
      ...keys.map((k) => tx.store.delete(this.prefixKey(k))),
      tx.done,
    ]);
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db?.close();
    this.db = null;
    this.initPromise = null;
  }
}

/**
 * Create a new IndexedDB storage instance
 */
export function createIndexedDBStorage(config?: IndexedDBStorageConfig): IStorage {
  return new IndexedDBStorage(config);
}
