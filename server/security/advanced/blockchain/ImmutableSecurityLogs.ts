/**
 * Immutable Security Logs
 * 
 * This module provides blockchain-based immutable logging for security events.
 * It ensures that security logs cannot be tampered with, providing a
 * trustworthy audit trail for forensic analysis.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { 
  SecurityEvent, 
  SecurityEventFilter,
  SecurityEventQueryOptions 
} from './SecurityEventTypes';

/**
 * Block in the security blockchain
 */
export interface SecurityBlock {
  // Block index
  index: number;
  
  // Timestamp (milliseconds since epoch)
  timestamp: number;
  
  // Security events in this block
  events: SecurityEvent[];
  
  // Hash of the previous block
  previousHash: string;
  
  // Hash of this block
  hash: string;
  
  // Proof of work
  nonce: number;
}

/**
 * Interface for the security blockchain
 */
export interface SecurityBlockchain {
  /**
   * Add a security event to the blockchain
   * 
   * @param event Security event to add
   * @returns Promise resolving to the block containing the event
   */
  addSecurityEvent(event: SecurityEvent): Promise<SecurityBlock>;
  
  /**
   * Get security events matching the filter
   * 
   * @param filter Filter for security events
   * @param options Query options
   * @returns Promise resolving to matching security events
   */
  getSecurityEvents(
    filter?: SecurityEventFilter,
    options?: SecurityEventQueryOptions
  ): Promise<SecurityEvent[]>;
  
  /**
   * Get a specific block from the blockchain
   * 
   * @param index Block index
   * @returns Promise resolving to the block
   */
  getBlock(index: number): Promise<SecurityBlock | null>;
  
  /**
   * Get the latest block in the blockchain
   * 
   * @returns Promise resolving to the latest block
   */
  getLatestBlock(): Promise<SecurityBlock>;
  
  /**
   * Check if the blockchain is valid
   * 
   * @returns Promise resolving to a boolean indicating validity
   */
  isValid(): Promise<boolean>;
  
  /**
   * Get the current chain length
   * 
   * @returns Promise resolving to the chain length
   */
  getLength(): Promise<number>;
}

/**
 * Implementation of the security blockchain
 */
export class ImmutableSecurityLogs implements SecurityBlockchain {
  // Path to store the blockchain
  private storagePath: string;
  
  // In-memory cache of the blockchain
  private chain: SecurityBlock[] = [];
  
  // Pending events to be added to the next block
  private pendingEvents: SecurityEvent[] = [];
  
  // Maximum events per block
  private maxEventsPerBlock: number;
  
  // Auto-save interval (milliseconds)
  private autoSaveInterval: number;
  
  // Timer for auto-saving
  private autoSaveTimer: NodeJS.Timeout | null = null;
  
  // Difficulty for proof of work
  private difficulty: number;
  
  /**
   * Create a new immutable security logs blockchain
   * 
   * @param options Options for the blockchain
   */
  constructor(options: {
    storagePath?: string;
    maxEventsPerBlock?: number;
    autoSaveInterval?: number;
    difficulty?: number;
  } = {}) {
    this.storagePath = options.storagePath || path.join(process.cwd(), 'security-blockchain');
    this.maxEventsPerBlock = options.maxEventsPerBlock || 100;
    this.autoSaveInterval = options.autoSaveInterval || 60000; // 1 minute
    this.difficulty = options.difficulty || 2;
    
    // Initialize the blockchain
    this.init().catch(console.error);
  }
  
  /**
   * Initialize the blockchain
   */
  private async init(): Promise<void> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storagePath, { recursive: true });
      
      // Try to load existing blockchain
      try {
        const data = await fs.readFile(
          path.join(this.storagePath, 'blockchain.json'),
          'utf8'
        );
        this.chain = JSON.parse(data);
        
        // Verify the loaded blockchain
        if (!await this.isValid()) {
          console.warn('Loaded blockchain is invalid, creating a new one');
          this.chain = [];
        }
      } catch (error) {
        // No existing blockchain, create a new one
        console.log('No existing blockchain found, creating a new one');
      }
      
      // If chain is empty, create genesis block
      if (this.chain.length === 0) {
        const genesisBlock = this.createGenesisBlock();
        this.chain.push(genesisBlock);
        await this.saveChain();
      }
      
      // Start auto-save timer
      this.startAutoSave();
      
      console.log(`Blockchain initialized with ${this.chain.length} blocks`);
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Start the auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.saveChain()
        .then(() => {
          if (this.pendingEvents.length >= this.maxEventsPerBlock) {
            return this.createNewBlock();
          }
        })
        .catch(console.error);
    }, this.autoSaveInterval);
  }
  
  /**
   * Stop the auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  /**
   * Save the blockchain to disk
   */
  private async saveChain(): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.storagePath, 'blockchain.json'),
        JSON.stringify(this.chain, null, 2)
      );
    } catch (error) {
      console.error('Failed to save blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Create the genesis block
   */
  private createGenesisBlock(): SecurityBlock {
    const genesisBlock: SecurityBlock = {
      index: 0,
      timestamp: Date.now(),
      events: [{
        category: 'system' as any,
        severity: 'info' as any,
        message: 'Genesis block created',
        timestamp: Date.now(),
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString()
        }
      }],
      previousHash: '0'.repeat(64),
      nonce: 0,
      hash: ''
    };
    
    // Calculate the hash
    genesisBlock.hash = this.calculateHash(genesisBlock);
    
    return genesisBlock;
  }
  
  /**
   * Calculate the hash of a block
   * 
   * @param block Block to calculate hash for
   * @returns Hash of the block
   */
  private calculateHash(block: Omit<SecurityBlock, 'hash'>): string {
    const data = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      events: block.events,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  /**
   * Mine a new block
   * 
   * @param events Events to include in the block
   * @returns The mined block
   */
  private mineBlock(events: SecurityEvent[]): SecurityBlock {
    const latestBlock = this.getLatestBlockSync();
    
    // Create new block
    const newBlock: Omit<SecurityBlock, 'hash'> = {
      index: latestBlock.index + 1,
      timestamp: Date.now(),
      events,
      previousHash: latestBlock.hash,
      nonce: 0
    };
    
    // Mine the block (proof of work)
    let hash = this.calculateHash(newBlock);
    while (hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
      newBlock.nonce++;
      hash = this.calculateHash(newBlock);
    }
    
    // Create the final block
    const minedBlock: SecurityBlock = {
      ...newBlock,
      hash
    };
    
    return minedBlock;
  }
  
  /**
   * Create a new block with pending events
   */
  private async createNewBlock(): Promise<void> {
    if (this.pendingEvents.length === 0) {
      return;
    }
    
    // Take events for this block
    const eventsForBlock = this.pendingEvents.slice(0, this.maxEventsPerBlock);
    this.pendingEvents = this.pendingEvents.slice(this.maxEventsPerBlock);
    
    // Mine the block
    const newBlock = this.mineBlock(eventsForBlock);
    
    // Add to chain
    this.chain.push(newBlock);
    
    // Save the chain
    await this.saveChain();
  }
  
  /**
   * Get the latest block synchronously
   */
  private getLatestBlockSync(): SecurityBlock {
    return this.chain[this.chain.length - 1];
  }
  
  /**
   * Check if a block is valid
   * 
   * @param block Block to check
   * @param previousBlock Previous block
   * @returns Whether the block is valid
   */
  private isBlockValid(block: SecurityBlock, previousBlock: SecurityBlock): boolean {
    // Check index
    if (block.index !== previousBlock.index + 1) {
      console.warn(`Invalid block index: ${block.index} vs ${previousBlock.index + 1}`);
      return false;
    }
    
    // Check previous hash
    if (block.previousHash !== previousBlock.hash) {
      console.warn(`Invalid previous hash: ${block.previousHash} vs ${previousBlock.hash}`);
      return false;
    }
    
    // Check block hash
    const calculatedHash = this.calculateHash({
      index: block.index,
      timestamp: block.timestamp,
      events: block.events,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    
    if (calculatedHash !== block.hash) {
      console.warn(`Invalid block hash: ${calculatedHash} vs ${block.hash}`);
      return false;
    }
    
    // Check proof of work
    if (block.hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
      console.warn(`Invalid proof of work: ${block.hash.substring(0, this.difficulty)} vs ${'0'.repeat(this.difficulty)}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Add a security event to the blockchain
   * 
   * @param event Security event to add
   * @returns Promise resolving to the block containing the event
   */
  public async addSecurityEvent(event: SecurityEvent): Promise<SecurityBlock> {
    // Add to pending events
    this.pendingEvents.push(event);
    
    // Create a new block if we have enough events
    if (this.pendingEvents.length >= this.maxEventsPerBlock) {
      await this.createNewBlock();
      return this.getLatestBlockSync();
    }
    
    // Return the latest block
    return this.getLatestBlockSync();
  }
  
  /**
   * Get security events matching the filter
   * 
   * @param filter Filter for security events
   * @param options Query options
   * @returns Promise resolving to matching security events
   */
  public async getSecurityEvents(
    filter?: SecurityEventFilter,
    options?: SecurityEventQueryOptions
  ): Promise<SecurityEvent[]> {
    // Get all events from the chain
    const allEvents: SecurityEvent[] = [];
    for (const block of this.chain) {
      allEvents.push(...block.events);
    }
    
    // Add pending events
    allEvents.push(...this.pendingEvents);
    
    // Apply filters
    let filteredEvents = allEvents;
    
    if (filter) {
      // Filter by categories
      if (filter.categories && filter.categories.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          filter.categories!.includes(event.category)
        );
      }
      
      // Filter by severities
      if (filter.severities && filter.severities.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          filter.severities!.includes(event.severity)
        );
      }
      
      // Filter by time range
      if (filter.timeRange) {
        if (filter.timeRange.start) {
          filteredEvents = filteredEvents.filter(event => 
            event.timestamp >= filter.timeRange!.start!
          );
        }
        
        if (filter.timeRange.end) {
          filteredEvents = filteredEvents.filter(event => 
            event.timestamp <= filter.timeRange!.end!
          );
        }
      }
      
      // Filter by search terms
      if (filter.searchTerms && filter.searchTerms.length > 0) {
        filteredEvents = filteredEvents.filter(event => {
          const eventText = JSON.stringify(event).toLowerCase();
          return filter.searchTerms!.some(term => 
            eventText.includes(term.toLowerCase())
          );
        });
      }
      
      // Filter by metadata
      if (filter.metadata) {
        filteredEvents = filteredEvents.filter(event => {
          if (!event.metadata) return false;
          
          for (const [key, value] of Object.entries(filter.metadata!)) {
            if (event.metadata[key] !== value) {
              return false;
            }
          }
          
          return true;
        });
      }
    }
    
    // Apply sorting
    if (options?.sort) {
      filteredEvents.sort((a, b) => {
        const field = options.sort!.field;
        const direction = options.sort!.direction === 'asc' ? 1 : -1;
        
        if (a[field] < b[field]) {
          return -1 * direction;
        }
        
        if (a[field] > b[field]) {
          return 1 * direction;
        }
        
        return 0;
      });
    } else {
      // Default sort: newest first
      filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // Apply pagination
    if (options?.skip || options?.limit) {
      const skip = options.skip || 0;
      const limit = options.limit || filteredEvents.length;
      
      filteredEvents = filteredEvents.slice(skip, skip + limit);
    }
    
    return filteredEvents;
  }
  
  /**
   * Get a specific block from the blockchain
   * 
   * @param index Block index
   * @returns Promise resolving to the block
   */
  public async getBlock(index: number): Promise<SecurityBlock | null> {
    if (index < 0 || index >= this.chain.length) {
      return null;
    }
    
    return this.chain[index];
  }
  
  /**
   * Get the latest block in the blockchain
   * 
   * @returns Promise resolving to the latest block
   */
  public async getLatestBlock(): Promise<SecurityBlock> {
    return this.getLatestBlockSync();
  }
  
  /**
   * Check if the blockchain is valid
   * 
   * @returns Promise resolving to a boolean indicating validity
   */
  public async isValid(): Promise<boolean> {
    // Chain with only genesis block is valid
    if (this.chain.length === 1) {
      return true;
    }
    
    // Check each block in the chain
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      if (!this.isBlockValid(currentBlock, previousBlock)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get the current chain length
   * 
   * @returns Promise resolving to the chain length
   */
  public async getLength(): Promise<number> {
    return this.chain.length;
  }
  
  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    this.stopAutoSave();
    
    // Save any pending events
    if (this.pendingEvents.length > 0) {
      await this.createNewBlock();
    }
    
    // Save the chain
    await this.saveChain();
  }
}

// Create and export a singleton instance
export const securityBlockchain = new ImmutableSecurityLogs();