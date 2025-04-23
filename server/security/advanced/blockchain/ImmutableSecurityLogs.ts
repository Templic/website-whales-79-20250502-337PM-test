/**
 * Immutable Security Logs
 * 
 * This module implements a blockchain-based immutable security log
 * that provides tamper-proof audit trails for security events.
 */

import { createHash } from 'crypto';
import { SecurityEvent, SecurityEventSeverity, SecurityEventCategory } from './SecurityEventTypes';

/**
 * Block structure
 */
interface Block {
  /**
   * Block index
   */
  index: number;
  
  /**
   * Block timestamp
   */
  timestamp: Date;
  
  /**
   * Block data
   */
  data: SecurityEvent[];
  
  /**
   * Previous block hash
   */
  previousHash: string;
  
  /**
   * Block hash
   */
  hash: string;
  
  /**
   * Block nonce
   */
  nonce: number;
}

/**
 * Security blockchain class
 */
class SecurityBlockchain {
  private chain: Block[] = [];
  private pendingData: SecurityEvent[] = [];
  private maxDataPerBlock: number = 10;
  private miningDifficulty: number = 2;
  private miningInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  
  /**
   * Create a new blockchain
   */
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the blockchain
   */
  private initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    // Create genesis block
    const genesisBlock: Block = {
      index: 0,
      timestamp: new Date(),
      data: [],
      previousHash: '0'.repeat(64),
      hash: '',
      nonce: 0
    };
    
    // Create a valid hash for the genesis block
    genesisBlock.hash = this.calculateHash(genesisBlock);
    
    // Add the genesis block to the chain
    this.chain.push(genesisBlock);
    
    console.log('[SECURITY-BLOCKCHAIN] Genesis block created');
    
    // Start mining interval
    this.miningInterval = setInterval(() => this.mineNextBlock(), 10000);
    
    this.isInitialized = true;
  }
  
  /**
   * Add a security event to the blockchain
   */
  public async recordEvent(event: SecurityEvent): Promise<void> {
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date();
    }
    
    // Add the event to the pending data
    this.pendingData.push(event);
    
    // Mine a new block if we have enough data
    if (this.pendingData.length >= this.maxDataPerBlock) {
      this.mineNextBlock();
    }
  }
  
  /**
   * Get all blocks
   */
  public getBlocks(): Block[] {
    return [...this.chain];
  }
  
  /**
   * Get the latest block
   */
  public getLatestBlock(): Block | undefined {
    return this.chain[this.chain.length - 1];
  }
  
  /**
   * Calculate the hash of a block
   */
  private calculateHash(block: Block): string {
    return createHash('sha256')
      .update(
        block.index +
        block.timestamp.toISOString() +
        JSON.stringify(block.data) +
        block.previousHash +
        block.nonce
      )
      .digest('hex');
  }
  
  /**
   * Mine a new block with pending data
   */
  private mineNextBlock(): void {
    if (this.pendingData.length === 0) {
      return;
    }
    
    // Get the data to include in the new block
    const data = this.pendingData.slice(0, this.maxDataPerBlock);
    
    // Remove the data from the pending data
    this.pendingData = this.pendingData.slice(this.maxDataPerBlock);
    
    // Get the latest block
    const lastBlock = this.getLatestBlock();
    if (!lastBlock) return;
    
    // Create a new block
    const newBlock: Block = {
      index: lastBlock.index + 1,
      timestamp: new Date(),
      data,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0
    };
    
    // Mine the block
    this.mineBlock(newBlock);
    
    // Add the block to the chain
    this.chain.push(newBlock);
    
    console.log(`[SECURITY-BLOCKCHAIN] Block ${newBlock.index} mined with ${newBlock.data.length} events`);
  }
  
  /**
   * Mine a block
   */
  private mineBlock(block: Block): void {
    const difficultyPattern = '0'.repeat(this.miningDifficulty);
    
    let hash = this.calculateHash(block);
    while (!hash.startsWith(difficultyPattern)) {
      block.nonce++;
      hash = this.calculateHash(block);
    }
    
    block.hash = hash;
  }
  
  /**
   * Verify blockchain integrity
   */
  public verifyChain(): boolean {
    // Check each block
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Check hash validity
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        console.error(`[SECURITY-BLOCKCHAIN] Block ${currentBlock!.index} hash is invalid`);
        return false;
      }
      
      // Check previous hash validity
      if (currentBlock!.previousHash !== previousBlock!.hash) {
        console.error(`[SECURITY-BLOCKCHAIN] Block ${currentBlock!.index} previous hash is invalid`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Export blockchain to JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(this.chain, null, 2);
  }
  
  /**
   * Query the blockchain for events
   */
  public queryEvents(options: {
    severity?: SecurityEventSeverity;
    category?: SecurityEventCategory;
    titleContains?: string;
    descriptionContains?: string;
    fromDate?: Date;
    toDate?: Date;
    maxResults?: number;
  } = {}): SecurityEvent[] {
    const {
      severity,
      category,
      titleContains,
      descriptionContains,
      fromDate,
      toDate,
      maxResults = 100
    } = options;
    
    // Collect all events from all blocks
    const allEvents: SecurityEvent[] = [];
    for (const block of this.chain) {
      allEvents.push(...block.data);
    }
    
    // Filter the events
    const filteredEvents = allEvents.filter(event => {
      if (severity && event.severity !== severity) {
        return false;
      }
      
      if (category && event.category !== category) {
        return false;
      }
      
      if (titleContains && (!event.title || !event.title.includes(titleContains))) {
        return false;
      }
      
      if (descriptionContains && (!event.description || !event.description.includes(descriptionContains))) {
        return false;
      }
      
      if (fromDate && event.timestamp && event.timestamp < fromDate) {
        return false;
      }
      
      if (toDate && event.timestamp && event.timestamp > toDate) {
        return false;
      }
      
      return true;
    });
    
    // Sort by timestamp, newest first
    filteredEvents.sort((a, b) => {
      const aTime = a.timestamp ? a.timestamp.getTime() : 0;
      const bTime = b.timestamp ? b.timestamp.getTime() : 0;
      return bTime - aTime;
    });
    
    // Limit the number of results
    return filteredEvents.slice(0, maxResults);
  }
}

// Export singleton instance
export const securityBlockchain = new SecurityBlockchain();