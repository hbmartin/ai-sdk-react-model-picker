/* eslint-disable @typescript-eslint/require-await */
import type { StorageAdapter } from '../types';

/**
 * In-memory storage implementation for testing or SSR environments
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private readonly storage = new Map<string, Record<string, string>>();
  private readonly namespace: string;

  constructor(namespace = 'ai-sdk-model-picker') {
    this.namespace = namespace;
  }

  async get(key: string): Promise<Record<string, string> | undefined> {
    const stored = this.storage.get(this.getKey(key));
    return stored ? { ...stored } : undefined;
  }

  async set(key: string, value: Record<string, string>): Promise<void> {
    this.storage.set(this.getKey(key), { ...value });
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

    for (const key of keysToDelete) {
      this.storage.delete(key);
    }
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

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}
