/**
 * Immutable Security Logs
 * 
 * This module implements a blockchain-based immutable logging system for
 * critical security events. It ensures that security logs cannot be
 * tampered with after they are created.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Log storage directory
const LOG_STORAGE_DIR = './logs/security/blockchain';

// Interface for security log blocks
export interface SecurityLogBlock {
  index: number;
  timestamp: string;
  logs: Record<string, any>[];
  previousHash: string;
  hash: string;
  nonce: number;
}

// Interface for security log chain
export interface SecurityLogChain {
  chain: SecurityLogBlock[];
  pendingLogs: Record<string, any>[];
}

/**
 * Security event interface (for addSecurityEvent method)
 */
export interface SecurityEventData {
  severity: string;
  category: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Immutable Security Logs class
 */
class ImmutableSecurityLogs {
  private chain: SecurityLogBlock[];
  private pendingLogs: Record<string, any>[];
  private blockSize: number;
  private difficulty: number;
  private initialized: boolean;
  
  constructor() {
    this.chain = [];
    this.pendingLogs = [];
    this.blockSize = 10; // Number of logs per block
    this.difficulty = 2; // Proof of work difficulty (number of leading zeros)
    this.initialized = false;
    
    // Create the log directory if it doesn't exist
    if (!fs.existsSync(LOG_STORAGE_DIR)) {
      fs.mkdirSync(LOG_STORAGE_DIR, { recursive: true });
    }
    
    // Initialize the blockchain
    this.initialize();
  }
  
  /**
   * Initialize the blockchain
   */
  private initialize(): void {
    if (this.initialized) {
      return;
    }
    
    try {
      // Try to load existing chain
      const chainPath = path.join(LOG_STORAGE_DIR, 'chain.json');
      
      if (fs.existsSync(chainPath)) {
        const data = JSON.parse(fs.readFileSync(chainPath, 'utf8'));
        this.chain = data.chain || [];
        this.pendingLogs = data.pendingLogs || [];
        
        console.log(`[SECURITY] Loaded existing security log chain with ${this.chain.length} blocks and ${this.pendingLogs.length} pending logs`);
      } else {
        // Create genesis block
        this.createGenesisBlock();
        console.log('[SECURITY] Created new security log chain with genesis block');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[SECURITY] Error initializing security log chain:', error);
      // Create genesis block as fallback
      this.createGenesisBlock();
      this.initialized = true;
    }
  }
  
  /**
   * Create the genesis block
   */
  private createGenesisBlock(): void {
    const genesisBlock: SecurityLogBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      logs: [{ type: 'genesis', message: 'Genesis Block' }],
      previousHash: '0',
      hash: '0',
      nonce: 0
    };
    
    // Calculate hash for genesis block
    genesisBlock.hash = this.calculateHash(genesisBlock);
    
    // Add genesis block to chain
    this.chain.push(genesisBlock);
    
    // Save chain
    this.saveChain();
  }
  
  /**
   * Calculate hash for a block
   */
  private calculateHash(block: SecurityLogBlock): string {
    const blockData = block.index + block.timestamp + JSON.stringify(block.logs) + block.previousHash + block.nonce;
    return crypto.createHash('sha256').update(blockData).digest('hex');
  }
  
  /**
   * Mine a new block
   */
  private mineBlock(block: SecurityLogBlock): SecurityLogBlock {
    const difficultyPrefix = '0'.repeat(this.difficulty);
    
    while (!block.hash.startsWith(difficultyPrefix)) {
      block.nonce++;
      block.hash = this.calculateHash(block);
    }
    
    return block;
  }
  
  /**
   * Add a log to the pending logs
   */
  public addLog(log: Record<string, any>): void {
    // Add timestamp if not present
    if (!log.timestamp) {
      log.timestamp = new Date().toISOString();
    }
    
    // Add the log to pending logs
    this.pendingLogs.push(log);
    
    // Save chain
    this.saveChain();
    
    // Create a new block if we have enough pending logs
    if (this.pendingLogs.length >= this.blockSize) {
      this.createBlock();
    }
  }
  
  /**
   * Create a new block from pending logs
   */
  private createBlock(): void {
    const lastBlock = this.getLatestBlock();
    const logs = this.pendingLogs.slice(0, this.blockSize);
    
    // Create new block
    const newBlock: SecurityLogBlock = {
      index: lastBlock.index + 1,
      timestamp: new Date().toISOString(),
      logs,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0
    };
    
    // Mine the block
    const minedBlock = this.mineBlock(newBlock);
    
    // Add block to chain
    this.chain.push(minedBlock);
    
    // Remove used logs from pending logs
    this.pendingLogs = this.pendingLogs.slice(this.blockSize);
    
    // Save chain
    this.saveChain();
    
    console.log(`[SECURITY] Created new block #${minedBlock.index} with ${minedBlock.logs.length} logs`);
  }
  
  /**
   * Get the latest block in the chain
   */
  private getLatestBlock(): SecurityLogBlock {
    return this.chain[this.chain.length - 1];
  }
  
  /**
   * Validate the chain
   */
  public validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Validate hash
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        console.error(`[SECURITY] Invalid hash in block #${currentBlock.index}`);
        return false;
      }
      
      // Validate previous hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`[SECURITY] Invalid previous hash in block #${currentBlock.index}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get the chain
   */
  public getChain(): SecurityLogBlock[] {
    return [...this.chain];
  }
  
  /**
   * Get pending logs
   */
  public getPendingLogs(): Record<string, any>[] {
    return [...this.pendingLogs];
  }
  
  /**
   * Save the chain to disk
   */
  private saveChain(): void {
    try {
      const chainData: SecurityLogChain = {
        chain: this.chain,
        pendingLogs: this.pendingLogs
      };
      
      const chainPath = path.join(LOG_STORAGE_DIR, 'chain.json');
      fs.writeFileSync(chainPath, JSON.stringify(chainData, null, 2));
    } catch (error) {
      console.error('[SECURITY] Error saving security log chain:', error);
    }
  }
  
  /**
   * Force creation of a new block even if we don't have enough pending logs
   */
  public forceCreateBlock(): void {
    if (this.pendingLogs.length > 0) {
      this.createBlock();
    }
  }
  
  /**
   * Record a security event
   */
  public recordEvent(event: {
    severity: string;
    category: string;
    title: string;
    description: string;
    sourceIp?: string;
    action?: string;
    userId?: string;
    resource?: string;
    timestamp?: Date;
  }): void {
    // Convert the event to a log entry
    const logEntry = {
      type: 'security_event',
      timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
      severity: event.severity,
      category: event.category,
      title: event.title,
      description: event.description,
      sourceIp: event.sourceIp,
      action: event.action,
      userId: event.userId,
      resource: event.resource
    };
    
    // Add the log
    this.addLog(logEntry);
  }
  
  /**
   * Add a security event to the blockchain log
   */
  public async addSecurityEvent(event: SecurityEventData): Promise<void> {
    // Convert the event to a log entry
    const logEntry = {
      type: 'security_event',
      timestamp: new Date().toISOString(),
      severity: event.severity,
      category: event.category,
      title: event.title,
      description: event.description,
      metadata: event.metadata || {}
    };
    
    // Add the log
    this.addLog(logEntry);
    
    // Return a resolved promise
    return Promise.resolve();
  }
  
  /**
   * Query events from the blockchain
   */
  public queryEvents(options: {
    severity?: string;
    category?: string;
    titleContains?: string;
    descriptionContains?: string;
    fromDate?: Date;
    toDate?: Date;
    maxResults?: number;
  } = {}): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    
    // Combine events from chain and pending logs
    const allLogs = [
      ...this.pendingLogs.map(log => ({ ...log, pending: true })),
      ...this.chain.flatMap(block => 
        block.logs.map(log => ({ 
          ...log, 
          blockIndex: block.index,
          blockHash: block.hash
        }))
      )
    ].filter(log => log.type === 'security_event');
    
    // Apply filters
    const filteredLogs = allLogs.filter(log => {
      // Filter by severity
      if (options.severity && log.severity !== options.severity) {
        return false;
      }
      
      // Filter by category
      if (options.category && log.category !== options.category) {
        return false;
      }
      
      // Filter by title
      if (options.titleContains && (!log.title || !log.title.includes(options.titleContains))) {
        return false;
      }
      
      // Filter by description
      if (options.descriptionContains && (!log.description || !log.description.includes(options.descriptionContains))) {
        return false;
      }
      
      // Filter by date range
      if (options.fromDate || options.toDate) {
        const logDate = new Date(log.timestamp);
        
        if (options.fromDate && logDate < options.fromDate) {
          return false;
        }
        
        if (options.toDate && logDate > options.toDate) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by timestamp (newest first)
    const sortedLogs = filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply limit
    const limitedLogs = options.maxResults 
      ? sortedLogs.slice(0, options.maxResults) 
      : sortedLogs;
    
    return limitedLogs;
  }
  
  /**
   * Get blocks from the blockchain
   */
  public getBlocks(): SecurityLogBlock[] {
    return [...this.chain];
  }
  
  /**
   * Verify the integrity of the chain
   */
  public verifyChain(): boolean {
    return this.validateChain();
  }
  
  /**
   * Search logs for specific criteria
   */
  public searchLogs(criteria: Record<string, any>): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    
    // Search in chain
    for (const block of this.chain) {
      for (const log of block.logs) {
        let match = true;
        
        for (const [key, value] of Object.entries(criteria)) {
          if (log[key] !== value) {
            match = false;
            break;
          }
        }
        
        if (match) {
          results.push({
            ...log,
            blockIndex: block.index,
            blockHash: block.hash
          });
        }
      }
    }
    
    // Search in pending logs
    for (const log of this.pendingLogs) {
      let match = true;
      
      for (const [key, value] of Object.entries(criteria)) {
        if (log[key] !== value) {
          match = false;
          break;
        }
      }
      
      if (match) {
        results.push({
          ...log,
          pending: true
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const immutableSecurityLogs = new ImmutableSecurityLogs();

export default immutableSecurityLogs;