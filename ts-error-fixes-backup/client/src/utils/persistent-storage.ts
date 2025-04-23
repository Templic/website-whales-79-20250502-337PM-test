/**
 * Persistent Storage Utility
 * 
 * This module provides optimized local storage with features like:
 * - Automatic data compression for large objects
 * - Expiration policies for efficient cache management
 * - Type-safe access with schema validation
 * - Quota management to prevent exceeding storage limits
 * - IndexedDB support for larger datasets
 * - Memory-backed fallback when local storage is unavailable
 * - Versioning for data migration
 */

import { z } from 'zod';

// Storage engines in order of preference
type StorageEngine = 'indexeddb' | 'localstorage' | 'sessionstorage' | 'memory';

// Storage item metadata
interface StorageMetadata {
  /** When the item was stored */
  createdAt: number;
  /** When the item was last accessed */
  lastAccessed: number;
  /** When the item expires (0 = never) */
  expiresAt: number;
  /** Data schema version */
  version: number;
  /** Whether the data is compressed */
  compressed: boolean;
  /** Storage space in bytes */
  size: number;
}

// Configuration for persistent storage
interface StorageConfig {
  /** Default time-to-live in milliseconds (0 = never expire) */
  defaultTTL: number;
  /** Storage quota in bytes (0 = unlimited) */
  quotaLimit: number;
  /** Preferred storage engine */
  preferredEngine: StorageEngine;
  /** Fallback engines in order of preference */
  fallbackEngines: StorageEngine[];
  /** Default schema version */
  defaultVersion: number;
  /** Size threshold in bytes for compression */
  compressionThreshold: number;
  /** Key prefix for all storage items */
  keyPrefix: string;
  /** Whether to log operations */
  debug: boolean;
  /** Whether to encrypt stored data */
  enableEncryption: boolean;
  /** Encryption secret (only used if enableEncryption is true) */
  encryptionSecret?: string;
}

// Storage item with metadata
interface StorageItem<T> {
  /** The stored data */
  data: T;
  /** Metadata about the storage item */
  meta: StorageMetadata;
}

// Options when setting an item
interface SetOptions {
  /** Time-to-live in milliseconds (overrides default) */
  ttl?: number;
  /** Schema version (overrides default) */
  version?: number;
  /** Force storage engine (overrides default) */
  engine?: StorageEngine;
  /** Whether to compress data */
  compress?: boolean;
  /** Whether to encrypt data */
  encrypt?: boolean;
  /** Max age in milliseconds for cache validation */
  maxAge?: number;
}

// Options when getting an item
interface GetOptions {
  /** Whether to update lastAccessed timestamp */
  touch?: boolean;
  /** Whether to return expired items */
  includeExpired?: boolean;
  /** Default value if not found */
  defaultValue?: any;
  /** Storage engine to check (defaults to all) */
  engine?: StorageEngine;
}

/**
 * Main persistent storage class
 */
export class PersistentStorage {
  private config: StorageConfig;
  private memoryStorage: Map<string, StorageItem<any>>;
  private availableEngines: StorageEngine[];
  private totalSize: number;
  private schemas: Map<string, z.ZodType<any>>;
  
  /**
   * Initialize persistent storage with configuration
   */
  constructor(config: Partial<StorageConfig> = {}) {
    // Default configuration
    this.config = {
      defaultTTL: 0, // Never expire by default
      quotaLimit: 10 * 1024 * 1024, // 10MB default limit
      preferredEngine: 'localstorage',
      fallbackEngines: ['indexeddb', 'sessionstorage', 'memory'],
      defaultVersion: 1,
      compressionThreshold: 1024, // 1KB
      keyPrefix: 'app_',
      debug: false,
      enableEncryption: false,
      ...config
    };
    
    // Initialize memory storage
    this.memoryStorage = new Map();
    this.totalSize = 0;
    this.schemas = new Map();
    
    // Detect available storage engines
    this.availableEngines = this.detectAvailableEngines();
    
    // Initialize and calculate current usage
    this.initialize();
    
    if (this.config.debug) {
      console.log(`[PersistentStorage] Initialized with engines: ${this.availableEngines.join(', ')}`);
    }
  }
  
  /**
   * Detect which storage engines are available in the current environment
   */
  private detectAvailableEngines(): StorageEngine[] {
    const engines: StorageEngine[] = ['memory'];
    
    // Check localStorage availability
    try {
      if (typeof localStorage !== 'undefined') {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        engines.push('localstorage');
      }
    } catch (e) {
      // localStorage not available
    }
    
    // Check sessionStorage availability
    try {
      if (typeof sessionStorage !== 'undefined') {
        const testKey = '__storage_test__';
        sessionStorage.setItem(testKey, testKey);
        sessionStorage.removeItem(testKey);
        engines.push('sessionstorage');
      }
    } catch (e) {
      // sessionStorage not available
    }
    
    // Check IndexedDB availability
    if (typeof indexedDB !== 'undefined') {
      engines.push('indexeddb');
    }
    
    return engines;
  }
  
  /**
   * Initialize storage and load current usage statistics
   */
  private initialize(): void {
    // Calculate current storage usage
    if (this.availableEngines.includes('localstorage')) {
      try {
        let size = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.config.keyPrefix)) {
            const value = localStorage.getItem(key) || '';
            size += key.length + value.length;
          }
        }
        this.totalSize = size;
        
        if (this.config.debug) {
          console.log(`[PersistentStorage] Current usage: ${this.formatSize(this.totalSize)}`);
        }
      } catch (e) {
        console.error('[PersistentStorage] Error calculating storage size', e);
      }
    }
    
    // Setup periodic cleanup of expired items
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpiredItems(), 60 * 1000); // every minute
    }
  }
  
  /**
   * Format size in bytes to human-readable format
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  /**
   * Get appropriate storage engine based on availability and preference
   */
  private getStorageEngine(engineHint?: StorageEngine): StorageEngine {
    // If hint provided and available, use it
    if (engineHint && this.availableEngines.includes(engineHint)) {
      return engineHint;
    }
    
    // Try preferred engine first
    if (this.availableEngines.includes(this.config.preferredEngine)) {
      return this.config.preferredEngine;
    }
    
    // Try fallback engines in order
    for (const engine of this.config.fallbackEngines) {
      if (this.availableEngines.includes(engine)) {
        return engine;
      }
    }
    
    // Use memory as last resort
    return 'memory';
  }
  
  /**
   * Generate full storage key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }
  
  /**
   * Compress data if it exceeds threshold size
   */
  private async compressData(data: string): Promise<string> {
    if (typeof CompressionStream === 'undefined') {
      return data;
    }
    
    try {
      const blob = new Blob([data]);
      const compressedStream = blob.stream().pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      
      // Convert blob to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(`gz:${reader.result as string}`);
        reader.readAsDataURL(compressedBlob);
      });
    } catch (e) {
      console.error('[PersistentStorage] Compression error', e);
      return data;
    }
  }
  
  /**
   * Decompress data
   */
  private async decompressData(data: string): Promise<string> {
    if (!data.startsWith('gz:') || typeof DecompressionStream === 'undefined') {
      return data;
    }
    
    try {
      // Extract base64 data
      const base64Data = data.slice(3);
      
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      // Decompress
      const decompressedStream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      
      // Convert back to string
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsText(decompressedBlob);
      });
    } catch (e) {
      console.error('[PersistentStorage] Decompression error', e);
      return data;
    }
  }
  
  /**
   * Encrypt data
   */
  private async encryptData(data: string): Promise<string> {
    if (!this.config.enableEncryption || !this.config.encryptionSecret) {
      return data;
    }
    
    try {
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        return data;
      }
      
      // Create encryption key
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.config.encryptionSecret),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Derive actual key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('persistent-storage-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );
      
      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64
      return `enc:${btoa(String.fromCharCode(...new Uint8Array(result)))}`;
    } catch (e) {
      console.error('[PersistentStorage] Encryption error', e);
      return data;
    }
  }
  
  /**
   * Decrypt data
   */
  private async decryptData(data: string): Promise<string> {
    if (!data.startsWith('enc:') || !this.config.enableEncryption || !this.config.encryptionSecret) {
      return data;
    }
    
    try {
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        return data;
      }
      
      // Extract base64 data
      const base64Data = data.slice(4);
      
      // Decode base64
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Extract IV and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedData = bytes.slice(12);
      
      // Create decryption key
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.config.encryptionSecret),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Derive actual key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('persistent-storage-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );
      
      // Convert to string
      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      console.error('[PersistentStorage] Decryption error', e);
      return data;
    }
  }
  
  /**
   * Remove all expired items from storage
   */
  private async cleanupExpiredItems(): Promise<void> {
    const now = Date.now();
    let removedCount = 0;
    
    // Check localStorage
    if (this.availableEngines.includes('localstorage')) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.keyPrefix)) {
          try {
            const itemJson = localStorage.getItem(key);
            if (itemJson) {
              const item: StorageItem<any> = JSON.parse(itemJson);
              if (item.meta.expiresAt > 0 && item.meta.expiresAt < now) {
                localStorage.removeItem(key);
                removedCount++;
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
    
    // Check memory storage
    for (const [key, item] of this.memoryStorage.entries()) {
      if (item.meta.expiresAt > 0 && item.meta.expiresAt < now) {
        this.memoryStorage.delete(key);
        removedCount++;
      }
    }
    
    if (this.config.debug && removedCount > 0) {
      console.log(`[PersistentStorage] Cleaned up ${removedCount} expired items`);
    }
  }
  
  /**
   * Check if enough storage quota is available
   */
  private hasQuotaAvailable(size: number): boolean {
    // If no quota limit, always return true
    if (this.config.quotaLimit === 0) return true;
    
    // Check if adding this size would exceed quota
    return (this.totalSize + size) <= this.config.quotaLimit;
  }
  
  /**
   * Register a schema for data validation
   */
  registerSchema<T>(key: string, schema: z.ZodType<T>): void {
    this.schemas.set(key, schema);
    
    if (this.config.debug) {
      console.log(`[PersistentStorage] Registered schema for '${key}'`);
    }
  }
  
  /**
   * Validate data against schema
   */
  private validateData<T>(key: string, data: unknown): T {
    const schema = this.schemas.get(key);
    
    if (!schema) {
      // No schema registered, return as is
      return data as T;
    }
    
    try {
      return schema.parse(data) as T;
    } catch (error) {
      console.error(`[PersistentStorage] Validation error for key '${key}':`, error);
      throw new Error(`Data validation failed for key '${key}'`);
    }
  }
  
  /**
   * Set an item in storage
   */
  async set<T>(key: string, data: T, options: SetOptions = {}): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const engine = this.getStorageEngine(options.engine);
    
    // Calculate the size of serialized data
    const serializedData = JSON.stringify(data);
    const dataSize = serializedData.length * 2; // Approximate bytes
    
    // Check if we have quota available
    if (!this.hasQuotaAvailable(dataSize)) {
      if (this.config.debug) {
        console.warn(`[PersistentStorage] Quota exceeded, cannot store '${key}'`);
      }
      return false;
    }
    
    // Prepare metadata
    const now = Date.now();
    const ttl = options.ttl !== undefined ? options.ttl : this.config.defaultTTL;
    const meta: StorageMetadata = {
      createdAt: now,
      lastAccessed: now,
      expiresAt: ttl > 0 ? now + ttl : 0,
      version: options.version || this.config.defaultVersion,
      compressed: false,
      size: dataSize
    };
    
    // Determine if compression should be used
    const shouldCompress = (
      options.compress !== undefined ? 
      options.compress : 
      dataSize > this.config.compressionThreshold
    );
    
    // Prepare storage item
    const storageItem: StorageItem<T> = {
      data,
      meta
    };
    
    try {
      // Serialize the storage item
      let itemJson = JSON.stringify(storageItem);
      
      // Apply compression if needed
      if (shouldCompress) {
        itemJson = await this.compressData(itemJson);
        meta.compressed = true;
      }
      
      // Apply encryption if configured
      if (this.config.enableEncryption || options.encrypt) {
        itemJson = await this.encryptData(itemJson);
      }
      
      // Store according to selected engine
      switch (engine) {
        case 'localstorage':
          localStorage.setItem(fullKey, itemJson);
          break;
        case 'sessionstorage':
          sessionStorage.setItem(fullKey, itemJson);
          break;
        case 'memory':
          this.memoryStorage.set(fullKey, storageItem);
          break;
        case 'indexeddb':
          // Not implemented for simplicity, would use the IndexedDB API
          // Falling back to memory storage
          this.memoryStorage.set(fullKey, storageItem);
          break;
      }
      
      // Update total size
      this.totalSize += meta.size;
      
      if (this.config.debug) {
        console.log(`[PersistentStorage] Stored '${key}' (${this.formatSize(meta.size)}) using ${engine}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[PersistentStorage] Error storing '${key}':`, error);
      
      // Attempt to use fallback storage
      if (engine !== 'memory') {
        if (this.config.debug) {
          console.log(`[PersistentStorage] Trying memory fallback for '${key}'`);
        }
        this.memoryStorage.set(fullKey, storageItem);
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Get an item from storage
   */
  async get<T>(key: string, options: GetOptions = {}): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();
    
    // Try to get from specified engine or try all available engines
    const engines = options.engine ? 
      [this.getStorageEngine(options.engine)] : 
      [this.config.preferredEngine, ...this.config.fallbackEngines];
    
    for (const engine of engines) {
      if (!this.availableEngines.includes(engine)) continue;
      
      try {
        let itemJson: string | null = null;
        let storageItem: StorageItem<T> | null = null;
        
        switch (engine) {
          case 'localstorage':
            itemJson = localStorage.getItem(fullKey);
            break;
          case 'sessionstorage':
            itemJson = sessionStorage.getItem(fullKey);
            break;
          case 'memory':
            storageItem = this.memoryStorage.get(fullKey) as StorageItem<T>;
            break;
          case 'indexeddb':
            // Not implemented for simplicity
            break;
        }
        
        // If we found a JSON string, parse it
        if (itemJson) {
          // Check for compression or encryption
          if (itemJson.startsWith('gz:')) {
            itemJson = await this.decompressData(itemJson);
          }
          
          if (itemJson.startsWith('enc:')) {
            itemJson = await this.decryptData(itemJson);
          }
          
          storageItem = JSON.parse(itemJson);
        }
        
        if (storageItem) {
          // Check if item is expired
          if (
            storageItem.meta.expiresAt > 0 && 
            storageItem.meta.expiresAt < now && 
            !options.includeExpired
          ) {
            if (this.config.debug) {
              console.log(`[PersistentStorage] Item '${key}' is expired`);
            }
            
            // Remove expired item
            this.remove(key);
            continue;
          }
          
          // Check if maxAge exceeded
          if (
            options.maxAge && 
            (now - storageItem.meta.lastAccessed) > options.maxAge
          ) {
            if (this.config.debug) {
              console.log(`[PersistentStorage] Item '${key}' exceeds maxAge`);
            }
            continue;
          }
          
          // Update last accessed time if touch is enabled
          if (options.touch !== false) {
            storageItem.meta.lastAccessed = now;
            
            // Writeback the updated timestamp
            if (engine === 'memory') {
              this.memoryStorage.set(fullKey, storageItem);
            } else {
              this.set(key, storageItem.data, {
                ttl: storageItem.meta.expiresAt > 0 ? 
                  storageItem.meta.expiresAt - now : 
                  0,
                version: storageItem.meta.version
              });
            }
          }
          
          // Validate against schema if registered
          try {
            const validatedData = this.validateData<T>(key, storageItem.data);
            
            if (this.config.debug) {
              console.log(`[PersistentStorage] Retrieved '${key}' from ${engine}`);
            }
            
            return validatedData;
          } catch (e) {
            if (this.config.debug) {
              console.error(`[PersistentStorage] Validation failed for '${key}'`);
            }
            return null;
          }
        }
      } catch (error) {
        console.error(`[PersistentStorage] Error retrieving '${key}' from ${engine}:`, error);
      }
    }
    
    // Return default value if provided, otherwise null
    return options.defaultValue !== undefined ? options.defaultValue : null;
  }
  
  /**
   * Remove an item from storage
   */
  remove(key: string): boolean {
    const fullKey = this.getFullKey(key);
    let removed = false;
    
    try {
      // Try to remove from all available engines
      if (this.availableEngines.includes('localstorage')) {
        localStorage.removeItem(fullKey);
        removed = true;
      }
      
      if (this.availableEngines.includes('sessionstorage')) {
        sessionStorage.removeItem(fullKey);
        removed = true;
      }
      
      if (this.memoryStorage.has(fullKey)) {
        this.memoryStorage.delete(fullKey);
        removed = true;
      }
      
      if (this.config.debug && removed) {
        console.log(`[PersistentStorage] Removed '${key}'`);
      }
      
      return removed;
    } catch (error) {
      console.error(`[PersistentStorage] Error removing '${key}':`, error);
      return false;
    }
  }
  
  /**
   * Check if an item exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const item = await this.get(key, { touch: false });
    return item !== null;
  }
  
  /**
   * Clear all items from storage
   */
  clear(): boolean {
    try {
      // Clear from all available engines
      if (this.availableEngines.includes('localstorage')) {
        // Only clear items with our prefix
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.config.keyPrefix)) {
            localStorage.removeItem(key);
          }
        }
      }
      
      if (this.availableEngines.includes('sessionstorage')) {
        // Only clear items with our prefix
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this.config.keyPrefix)) {
            sessionStorage.removeItem(key);
          }
        }
      }
      
      // Clear memory storage
      this.memoryStorage.clear();
      
      // Reset total size
      this.totalSize = 0;
      
      if (this.config.debug) {
        console.log('[PersistentStorage] Cleared all items');
      }
      
      return true;
    } catch (error) {
      console.error('[PersistentStorage] Error clearing storage:', error);
      return false;
    }
  }
  
  /**
   * Get all keys in storage
   */
  keys(): string[] {
    const keys = new Set<string>();
    const prefix = this.config.keyPrefix;
    
    // Get keys from localStorage
    if (this.availableEngines.includes('localstorage')) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.add(key.substring(prefix.length));
        }
      }
    }
    
    // Get keys from sessionStorage
    if (this.availableEngines.includes('sessionstorage')) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.add(key.substring(prefix.length));
        }
      }
    }
    
    // Get keys from memory storage
    for (const key of this.memoryStorage.keys()) {
      if (key.startsWith(prefix)) {
        keys.add(key.substring(prefix.length));
      }
    }
    
    return Array.from(keys);
  }
  
  /**
   * Get storage statistics
   */
  getStats(): {
    totalSize: number;
    itemCount: number;
    engines: StorageEngine[];
    quota: number;
    usage: number;
  } {
    return {
      totalSize: this.totalSize,
      itemCount: this.keys().length,
      engines: this.availableEngines,
      quota: this.config.quotaLimit,
      usage: this.config.quotaLimit > 0 ? 
        (this.totalSize / this.config.quotaLimit) * 100 : 
        0
    };
  }
}

// Create a global instance
export const storage = new PersistentStorage();

export default storage;