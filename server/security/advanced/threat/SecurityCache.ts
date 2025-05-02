/**
 * LRU Cache for security-related data
 * 
 * A simple LRU (Least Recently Used) cache implementation 
 * for security data with TTL (Time To Live) support
 */

/**
 * LRU Cache entry
 */
interface CacheEntry<T> {
  value: T;
  expiry: number; // Timestamp when entry expires
  lastAccessed: number; // Timestamp of last access
}

/**
 * LRU Cache with time-based expiry
 */
class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private maxSize: number;
  private defaultTtl: number;
  
  /**
   * Create a new LRU cache
   * 
   * @param maxSize Maximum number of items to keep in cache
   * @param defaultTtl Default time-to-live in milliseconds
   */
  constructor(maxSize: number = 1000, defaultTtl: number = 3600000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key The key to look up
   * @returns The cached value or undefined if not found
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key The key to store
   * @param value The value to store
   * @param ttl TTL in milliseconds (optional, uses default if not specified)
   */
  set(key: K, value: V, ttl?: number): void {
    // If we're at capacity, remove the least recently used item
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.findLeastRecentlyUsed();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    
    // Set the new value with expiry
    const expiry = Date.now() + (ttl || this.defaultTtl);
    this.cache.set(key, {
      value,
      expiry,
      lastAccessed: Date.now()
    });
  }
  
  /**
   * Check if a key exists and hasn't expired
   * 
   * @param key The key to check
   * @returns Whether the key exists
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a key from the cache
   * 
   * @param key The key to delete
   */
  delete(key: K): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the current size of the cache
   * 
   * @returns Number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Find all keys in the cache
   * 
   * @returns Array of keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get all values in the cache
   * 
   * @returns Array of values
   */
  values(): V[] {
    const now = Date.now();
    const result: V[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiry) {
        result.push(entry.value);
      } else {
        // Clean up expired entries as we go
        this.cache.delete(key);
      }
    }
    
    return result;
  }
  
  /**
   * Clean up expired entries
   * 
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Find the least recently used key
   * 
   * @returns The least recently used key or undefined if cache is empty
   */
  private findLeastRecentlyUsed(): K | undefined {
    let lruKey: K | undefined = undefined;
    let lruTime = Number.MAX_SAFE_INTEGER;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruKey = key;
        lruTime = entry.lastAccessed;
      }
    }
    
    return lruKey;
  }
}

export default LRUCache;