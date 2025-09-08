import type { StorageAdapter } from '../types';

/**
 * Browser localStorage implementation with namespacing support
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly namespace: string;

  constructor(namespace = 'ai-sdk-model-picker') {
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : undefined;
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set item in localStorage: ${key}`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
      throw error;
    }
  }

  /**
   * Clear all items with this adapter's namespace
   */
  async clear(): Promise<void> {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.namespace}:`)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) localStorage.removeItem(key);
  }

  /**
   * Get all keys for this namespace
   */
  async getKeys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = `${this.namespace}:`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key.slice(prefix.length));
      }
    }

    return keys;
  }
}

/**
 * In-memory storage implementation for testing or SSR environments
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, any>();
  private readonly namespace: string;

  constructor(namespace = 'ai-sdk-model-picker') {
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.storage.get(this.getKey(key));
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.storage.set(this.getKey(key), value);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(this.getKey(key));
  }

  /**
   * Clear all items with this adapter's namespace
   */
  async clear(): Promise<void> {
    const prefix = `${this.namespace}:`;
    const keysToDelete: string[] = [];

    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) this.storage.delete(key);
  }

  /**
   * Get all keys for this namespace
   */
  async getKeys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = `${this.namespace}:`;

    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key.slice(prefix.length));
      }
    }

    return keys;
  }

  /**
   * Get the size of the storage
   */
  size(): number {
    let count = 0;
    const prefix = `${this.namespace}:`;

    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        count++;
      }
    }

    return count;
  }
}

/**
 * Session storage implementation (data persists only for the session)
 */
export class SessionStorageAdapter implements StorageAdapter {
  private readonly namespace: string;

  constructor(namespace = 'ai-sdk-model-picker') {
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : undefined;
    } catch (error) {
      console.warn(`Failed to get item from sessionStorage: ${key}`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set item in sessionStorage: ${key}`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Failed to remove item from sessionStorage: ${key}`, error);
      throw error;
    }
  }

  /**
   * Clear all items with this adapter's namespace
   */
  async clear(): Promise<void> {
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(`${this.namespace}:`)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) sessionStorage.removeItem(key);
  }
}

/**
 * Factory function to create appropriate storage adapter based on environment
 */
export function createStorageAdapter(
  type: 'local' | 'session' | 'memory' = 'local',
  namespace?: string
): StorageAdapter {
  switch (type) {
    case 'local': {
      return new LocalStorageAdapter(namespace);
    }
    case 'session': {
      return new SessionStorageAdapter(namespace);
    }
    case 'memory': {
      return new MemoryStorageAdapter(namespace);
    }
    default: {
      return new LocalStorageAdapter(namespace);
    }
  }
}

/**
 * Check if localStorage is available in the current environment
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is available in the current environment
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the best available storage adapter for the current environment
 */
export function getBestStorageAdapter(namespace?: string): StorageAdapter {
  if (isLocalStorageAvailable()) {
    return new LocalStorageAdapter(namespace);
  } else if (isSessionStorageAvailable()) {
    return new SessionStorageAdapter(namespace);
  } else {
    return new MemoryStorageAdapter(namespace);
  }
}
