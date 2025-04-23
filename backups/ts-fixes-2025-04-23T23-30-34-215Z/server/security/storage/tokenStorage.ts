/**
 * Token Storage Module for CSRF Protection
 * 
 * This module provides storage mechanisms for CSRF tokens with support for
 * both in-memory storage and distributed storage (Redis).
 * 
 * The distributed storage option improves security and scalability in multi-server environments.
 */

import crypto from 'crypto';
import { logSecurityEvent } from '../utils/securityUtils';
import { SecurityLogLevel } from '../types/securityTypes';

// Token store type options
export type TokenStoreType = 'memory' | 'redis';

// Token data interface
interface TokenData {
  token: string;
  expires: Date;
  nonce?: string;
}

/**
 * Serialize token and nonce into a single string
 * 
 * @param token CSRF token
 * @param nonce Optional nonce for additional verification
 * @returns Serialized token data
 */
export function serializeTokenData(token: string, nonce?: string): string {
  if (!nonce) return token;
  return `${token}.${nonce}`;
}

/**
 * Deserialize token data from string
 * 
 * @param serialized Serialized token data
 * @returns Deserialized token and nonce
 */
export function deserializeTokenData(serialized: string): { token: string; nonce?: string } {
  if (!serialized.includes('.')) return { token: serialized };
  
  const [token, nonce] = serialized.split('.');
  return { token, nonce };
}

/**
 * Interface for token storage providers
 */
interface TokenStore {
  getToken(sessionId: string): TokenData | null;
  setToken(sessionId: string, token: string, expires: Date, nonce?: string): void;
  deleteToken(sessionId: string): void;
  cleanupExpiredTokens(): void;
}

/**
 * In-memory implementation of token storage
 */
class MemoryTokenStore implements TokenStore {
  private store: Record<string, TokenData> = {};
  
  constructor() {
    // Set up periodic cleanup
    setInterval(() => this.cleanupExpiredTokens(), 15 * 60 * 1000);
  }
  
  getToken(sessionId: string): TokenData | null {
    return this.store[sessionId] || null;
  }
  
  setToken(sessionId: string, token: string, expires: Date, nonce?: string): void {
    this.store[sessionId] = { token, expires, nonce };
  }
  
  deleteToken(sessionId: string): void {
    delete this.store[sessionId];
  }
  
  cleanupExpiredTokens(): void {
    const now = new Date();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].expires < now) {
        delete this.store[key];
      }
    });
  }
}

/**
 * Redis implementation of token storage
 * Uses Redis for distributed token storage in multi-server environments
 */
class RedisTokenStore implements TokenStore {
  private client: any; // Redis client
  private prefix: string = 'csrf:token:';
  private isConnected: boolean = false;
  
  constructor() {
    try {
      // Dynamic import for Redis to avoid dependency when not using Redis
      import('redis').then(redis => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        this.client = redis.createClient({
          url: redisUrl
        });
        
        this.client.on('error', (err: Error) => {
          console.error('Redis connection error:', err);
          logSecurityEvent('REDIS_CONNECTION_ERROR', {
            error: err.message,
            timestamp: new Date()
          }, SecurityLogLevel.ERROR);
          this.isConnected = false;
        });
        
        this.client.on('connect', () => {
          this.isConnected = true;
          logSecurityEvent('REDIS_CONNECTED', {
            timestamp: new Date()
          }, SecurityLogLevel.INFO);
        });
        
        this.client.connect().catch((err: Error) => {
          console.error('Failed to connect to Redis:', err);
          logSecurityEvent('REDIS_CONNECTION_FAILED', {
            error: err.message,
            timestamp: new Date()
          }, SecurityLogLevel.ERROR);
        });
        
        // Set up periodic cleanup
        setInterval(() => this.cleanupExpiredTokens(), 30 * 60 * 1000);
      }).catch(err => {
        console.error('Failed to import Redis module:', err);
        logSecurityEvent('REDIS_IMPORT_FAILED', {
          error: err.message,
          timestamp: new Date()
        }, SecurityLogLevel.ERROR);
      });
    } catch (error: Error) {
      console.error('Error initializing Redis token store:', error);
    }
  }
  
  /**
   * Get token data from Redis
   */
  async getToken(sessionId: string): Promise<TokenData | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }
    
    try {
      const key = this.prefix + sessionId;
      const data = await this.client.get(key);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error: Error) {
      console.error('Error getting token from Redis:', error);
      return null;
    }
  }
  
  /**
   * Store token data in Redis with expiration
   */
  async setToken(sessionId: string, token: string, expires: Date, nonce?: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    
    try {
      const key = this.prefix + sessionId;
      const data = JSON.stringify({ token, expires, nonce });
      
      // Calculate TTL in seconds
      const ttl = Math.floor((expires.getTime() - Date.now()) / 1000);
      
      if (ttl <= 0) return; // Don't store expired tokens
      
      await this.client.set(key, data, { EX: ttl });
    } catch (error: Error) {
      console.error('Error setting token in Redis:', error);
    }
  }
  
  /**
   * Delete token from Redis
   */
  async deleteToken(sessionId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    
    try {
      const key = this.prefix + sessionId;
      await this.client.del(key);
    } catch (error: Error) {
      console.error('Error deleting token from Redis:', error);
    }
  }
  
  /**
   * Redis automatically expires keys, but we can still scan for any that might not have TTL
   */
  async cleanupExpiredTokens(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    
    try {
      let cursor = '0';
      const pattern = `${this.prefix}*`;
      const now = new Date();
      
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        
        cursor = nextCursor;
        
        // Process keys in batches
        for (const key of keys) {
          const data = await this.client.get(key);
          if (data) {
            const tokenData = JSON.parse(data);
            if (new Date(tokenData.expires) < now) {
              await this.client.del(key);
            }
          }
        }
      } while (cursor !== '0');
    } catch (error: Error) {
      console.error('Error cleaning up tokens in Redis:', error);
    }
  }
}

// Store instances (lazy initialization)
let memoryStoreInstance: MemoryTokenStore | null = null;
let redisStoreInstance: RedisTokenStore | null = null;

/**
 * Get the appropriate token store based on configuration
 * 
 * @returns Token store instance
 */
export function getDistributedTokenStore(): TokenStore {
  const useRedis = process.env.USE_DISTRIBUTED_TOKEN_STORAGE === 'true';
  
  if (useRedis) {
    if (!redisStoreInstance) {
      redisStoreInstance = new RedisTokenStore();
    }
    return redisStoreInstance;
  } else {
    if (!memoryStoreInstance) {
      memoryStoreInstance = new MemoryTokenStore();
    }
    return memoryStoreInstance;
  }
}

/**
 * Generate a token with enhanced security for CSRF protection
 * 
 * @returns A cryptographically secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}