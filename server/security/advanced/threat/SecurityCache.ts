/**
 * LRU Cache Implementation
 * 
 * A simple Least Recently Used (LRU) cache for storing frequently accessed data:
 * - Limited size to prevent memory leaks
 * - TTL-based expiration for stale data
 * - Automatic cleanup of expired entries
 * - Thread-safe operations
 * 
 * Used for caching IP blocks, rate limit data, and other security-related information
 * that needs fast access without hitting the database for every check.
 */

interface CacheEntry<T> {
  value: T;
  lastAccessed: number;
  expiry: number | null; // null means no expiration
}

export default class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTtl: number | null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new LRU cache
   * 
   * @param maxSize Maximum number of entries in the cache
   * @param defaultTtl Default time-to-live in milliseconds for entries (null for no expiration)
   * @param cleanupIntervalMs Interval in milliseconds to cleanup expired entries (default: 60s)
   */
  constructor(maxSize: number, defaultTtl: number | null = null, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    
    // Set up periodic cleanup of expired entries
    if (cleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(() => {
        this.removeExpiredEntries();
      }, cleanupIntervalMs);
      
      // Make sure the interval doesn't prevent Node from exiting
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get a value from the cache
   * 
   * @param key The key to look up
   * @returns The value or undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if expired
    if (entry.expiry !== null && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Update last accessed time and move to the end (most recently used)
    entry.lastAccessed = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  /**
   * Set a value in the cache
   * 
   * @param key The key to set
   * @param value The value to store
   * @param ttl Time-to-live in milliseconds, overrides the default
   */
  set(key: K, value: V, ttl?: number | null): void {
    // Remove oldest entry if cache is full and this is a new entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.removeOldestEntry();
    }
    
    // Calculate expiration time
    const ttlValue = ttl !== undefined ? ttl : this.defaultTtl;
    const expiry = ttlValue !== null ? Date.now() + ttlValue : null;
    
    // Set the entry
    this.cache.set(key, {
      value,
      lastAccessed: Date.now(),
      expiry
    });
  }

  /**
   * Check if a key exists in the cache (and is not expired)
   * 
   * @param key The key to check
   * @returns True if the key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expiry !== null && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * 
   * @param key The key to delete
   * @returns True if an entry was deleted
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    this.removeExpiredEntries();
    return this.cache.size;
  }

  /**
   * Get all keys in the cache
   * 
   * @returns Array of keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all entries in the cache
   * 
   * @returns Array of [key, value] tuples
   */
  entries(): [K, V][] {
    const result: [K, V][] = [];
    
    this.cache.forEach((entry, key) => {
      // Skip expired entries
      if (entry.expiry === null || entry.expiry >= Date.now()) {
        result.push([key, entry.value]);
      }
    });
    
    return result;
  }

  /**
   * Remove expired entries from the cache
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (entry.expiry !== null && entry.expiry < now) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Remove the oldest (least recently used) entry
   */
  private removeOldestEntry(): void {
    let oldestKey: K | null = null;
    let oldestTime = Infinity;
    
    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestKey = key;
        oldestTime = entry.lastAccessed;
      }
    });
    
    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up resources when the cache is no longer needed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.cache.clear();
  }
}