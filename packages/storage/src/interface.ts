/**
 * Abstract storage interface
 * Implementations can be backed by IndexedDB, localStorage, extension storage, etc.
 */
export interface IStorage {
  /**
   * Get a value by key
   * @returns The value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value by key
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Delete a value by key
   * @returns true if the key existed and was deleted
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;

  /**
   * Clear all stored data
   */
  clear(): Promise<void>;

  /**
   * Get multiple values by keys
   */
  getMany<T>(keys: string[]): Promise<Map<string, T>>;

  /**
   * Set multiple values
   */
  setMany<T>(entries: Map<string, T> | Array<[string, T]>): Promise<void>;

  /**
   * Delete multiple values by keys
   */
  deleteMany(keys: string[]): Promise<void>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage namespace/prefix */
  namespace?: string;
  /** Version for migrations */
  version?: number;
}

/**
 * Storage events
 */
export interface StorageEvents {
  /** Fired when a value changes */
  change: (key: string, oldValue: unknown, newValue: unknown) => void;
  /** Fired when storage is cleared */
  clear: () => void;
}

/**
 * Storage with event support
 */
export interface IStorageWithEvents extends IStorage {
  /**
   * Subscribe to storage events
   */
  on<K extends keyof StorageEvents>(event: K, callback: StorageEvents[K]): () => void;
}
