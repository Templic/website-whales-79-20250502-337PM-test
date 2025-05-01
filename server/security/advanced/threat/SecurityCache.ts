/**
 * LRU Cache Implementation for Security Services
 * 
 * A memory-efficient cache implementation with time-based expiration
 * and least-recently-used eviction policy.
 */

export default class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  private ttl: number;
  private timestamps = new Map<K, number>();
  private accessOrder = new Map<K, number>();
  private accessCounter = 0;
  
  /**
   * Create a new LRU Cache
   * @param maxSize Maximum number of items in the cache (default: 1000)
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(maxSize: number = 1000, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   */
  set(key: K, value: V): void {
    // Check if cache is full and this is a new key
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      // Evict least recently used entry
      this.evictLRU();
    }
    
    // Store the value
    this.cache.set(key, value);
    
    // Update timestamps and access order
    this.timestamps.set(key, Date.now());
    this.accessOrder.set(key, ++this.accessCounter);
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      // Check if entry has expired
      const timestamp = this.timestamps.get(key) || 0;
      if (Date.now() - timestamp > this.ttl) {
        // Remove expired entry
        this.delete(key);
        return undefined;
      }
      
      // Update access order to mark as recently used
      this.accessOrder.set(key, ++this.accessCounter);
      return value;
    }
    
    return undefined;
  }
  
  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  delete(key: K): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.accessOrder.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }
  
  /**
   * Get the number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Return all keys in the cache
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Return all values in the cache
   */
  values(): V[] {
    return Array.from(this.cache.values());
  }
  
  /**
   * Return all entries in the cache
   */
  entries(): [K, V][] {
    return Array.from(this.cache.entries());
  }
  
  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    let lruKey: K | null = null;
    let lowestAccess = Infinity;
    
    // Find the entry with the lowest access count
    for (const [key, accessCount] of this.accessOrder.entries()) {
      if (accessCount < lowestAccess) {
        lowestAccess = accessCount;
        lruKey = key;
      }
    }
    
    // Remove the LRU entry
    if (lruKey !== null) {
      this.delete(lruKey);
    }
  }
  
  /**
   * Remove all expired entries
   * @returns Number of entries removed
   */
  purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Check if key exists and is not expired
   * @param key Cache key
   * @returns true if key exists and is not expired
   */
  has(key: K): boolean {
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Check if entry has expired
    const timestamp = this.timestamps.get(key) || 0;
    if (Date.now() - timestamp > this.ttl) {
      // Remove expired entry
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Update TTL for a specific key
   * @param key Cache key
   * @param ttlMs New TTL in milliseconds
   * @returns true if key exists and TTL was updated
   */
  updateTTL(key: K, ttlMs: number): boolean {
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Reset the timestamp with the new TTL in mind
    this.timestamps.set(key, Date.now());
    return true;
  }
}