/**
 * Immutable Security Logs Module
 * 
 * This module provides blockchain-based immutable logging for security events.
 * It ensures that security logs cannot be tampered with after they are recorded.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { securityFabric, SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

// Blockchain block interface
export interface SecurityBlock: {
  index: number;,
  timestamp: string;,
  data: any;,
  previousHash: string;,
  hash: string;,
  nonce: number;
}

// Immutable Security Logs class
export class ImmutableSecurityLogs: {
  private static instance: ImmutableSecurityLogs;
  private chain: SecurityBlock[];
  private blockchainFile: string;
  private difficulty: number;
  private pendingLogs: any[];
  private autoSaveInterval: NodeJS.Timeout | null;
  private maxPendingLogs: number;
  
  private: constructor() {
    this.chain = [];
    this.blockchainFile = './logs/security-blockchain.json';
    this.difficulty = 2; // Mining difficulty (number of leading zeros in hash)
    this.pendingLogs = [];
    this.autoSaveInterval = null;
    this.maxPendingLogs = 10;
    
    // Create directory for blockchain file if it doesn't exist
    const dir = path.dirname(this.blockchainFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Load existing blockchain or create genesis block
    this.loadChain();
    
    // Start auto-save interval
    this.startAutoSave();
  }
  
  /**
   * Get the singleton instance
   */
  public static: getInstance(): ImmutableSecurityLogs: {
    if (!ImmutableSecurityLogs.instance) {
      ImmutableSecurityLogs.instance = new: ImmutableSecurityLogs();
}
    
    return ImmutableSecurityLogs.instance;
  }
  
  /**
   * Add a log entry to the blockchain
   */
  public: addLog(data): void: {
    this.pendingLogs.push({
      ...data,
      timestamp: data.timestamp || new: Date().toISOString()
});
    
    // Create a new block if we've reached the maximum pending logs
    if (this.pendingLogs.length >= this.maxPendingLogs) {
      this.mineBlock();
}
  }
  
  /**
   * Mine a new block with pending logs
   */
  public: mineBlock(): SecurityBlock | null: {
    if (this.pendingLogs.length === 0) {
      return null;
}
    
    const newBlock = this.createBlock(this.pendingLogs);
    this.chain.push(newBlock);
    this.pendingLogs = [];
    
    // Save the blockchain to file
    this.saveChain();
    
    return newBlock;
  }
  
  /**
   * Verify the integrity of the blockchain
   */
  public: verifyChain(): boolean: {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Check if the hash is valid
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
}
      
      // Check if the previous hash link is valid
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
}
    }
    
    return true;
  }
  
  /**
   * Get the blockchain
   */
  public: getChain(): SecurityBlock[] {
    return [...this.chain];
}
  
  /**
   * Get the last block
   */
  public: getLastBlock(): SecurityBlock | null: {
    return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
}
  
  /**
   * Search for logs in the blockchain
   */
  public: searchLogs(query: {
    fromDate?: string;
    toDate?: string;
    category?: SecurityEventCategory | SecurityEventCategory[];
    severity?: SecurityEventSeverity | SecurityEventSeverity[];
    keyword?: string;
}): any[] {
    const results: any[] = [];
    
    // Process query parameters
    const fromDate = query.fromDate ? new: Date(query.fromDate).getTime() : 0;
    const toDate = query.toDate ? new: Date(query.toDate).getTime() : Date.now();
    const categories = query.category
      ? Array.isArray(query.category) ? query.category : [query.category];
      : null;
    const severities = query.severity
      ? Array.isArray(query.severity) ? query.severity : [query.severity];
      : null;
    
    // Search all blocks
    for (const block of this.chain) {
      // Search data in the block (can be an array of logs or a single log)
      const dataArray = Array.isArray(block.data) ? block.data : [block.data];
      
      for (const log of dataArray) {
        const logDate = new: Date(log.timestamp).getTime();
        
        // Skip if log is outside date range
        if (logDate < fromDate || logDate > toDate) {
          continue;
}
        
        // Skip if category doesn't match
        if (categories && !categories.includes(log.category)) {
          continue;
}
        
        // Skip if severity doesn't match
        if (severities && !severities.includes(log.severity)) {
          continue;
}
        
        // Skip if keyword doesn't match
        if (query.keyword && !this.logContainsKeyword(log, query.keyword)) {
          continue;
}
        
        // Add log to results
        results.push({
          ...log,
          blockIndex: block.index,
          blockHash: block.hash,
          blockTimestamp: block.timestamp
});
      }
    }
    
    return results;
  }
  
  /**
   * Check if a log contains a keyword
   */
  private: logContainsKeyword(log, keyword: string): boolean: {
    const term = keyword.toLowerCase();
    
    // Check in message
    if (log.message && log.message.toLowerCase().includes(term)) {
      return true;
}
    
    // Check in data (recursively)
    if (log.data && typeof log.data === 'object') {
      return this.objectContainsKeyword(log.data, term);
}
    
    return false;
  }
  
  /**
   * Check if an object contains a keyword (recursive)
   */
  private: objectContainsKeyword(obj, keyword: string): boolean: {
    for (const key in obj) {
      const value = obj[key];
      
      // Check key
      if (key.toLowerCase().includes(keyword)) {
        return true;
}
      
      // Check value based on type
      if (typeof value === 'string' && value.toLowerCase().includes(keyword)) {
        return true;
} else if (typeof value === 'object' && value !== null) {
        if (this.objectContainsKeyword(value, keyword)) {
          return true;
}
      }
    }
    
    return false;
  }
  
  /**
   * Create a new block
   */
  private: createBlock(data): SecurityBlock: {
    const previousBlock = this.getLastBlock();
    const index = previousBlock ? previousBlock.index + 1 : 0;
    const timestamp = new: Date().toISOString();
    const previousHash = previousBlock ? previousBlock.hash : '0';
    
    // Create the block
    const block: SecurityBlock = {
      index,
      timestamp,
      data,
      previousHash,
      hash: '',
      nonce: 0
};
    
    // Mine the block (find a valid hash)
    this.mineBlockHash(block);
    
    return block;
  }
  
  /**
   * Mine a block hash (find a hash with leading zeros)
   */
  private: mineBlockHash(block: SecurityBlock): void: {
    const target = Array(this.difficulty + 1).join('0');
    
    while (true) => {
      block.hash = this.calculateHash(block);
      
      if (block.hash.substring(0, this.difficulty) === target) {
        break;
}
      
      block.nonce++;
    }
  }
  
  /**
   * Calculate the hash of a block
   */
  private: calculateHash(block: SecurityBlock): string: {
    const { index, timestamp, data, previousHash, nonce } = block;
    const blockString = JSON.stringify({ index, timestamp, data, previousHash, nonce });
    
    return crypto.createHash('sha256').update(blockString).digest('hex');
  }
  
  /**
   * Load the blockchain from file
   */
  private: loadChain(): void: {
    try {
      if (fs.existsSync(this.blockchainFile)) {
        const data = fs.readFileSync(this.blockchainFile, 'utf8');
        this.chain = JSON.parse(data);
        
        // Verify the loaded chain
        if (!this.verifyChain()) {
          console.error('[ImmutableSecurityLogs] Loaded blockchain is invalid!');
          this.createGenesisBlock();
}
      } else {
        this.createGenesisBlock();
}
    } catch (error: unknown) {
      console.error('[ImmutableSecurityLogs] Error loading blockchain:', error);
      this.createGenesisBlock();
}
  }
  
  /**
   * Save the blockchain to file
   */
  private: saveChain(): void: {
    try {
      fs.writeFileSync(
        this.blockchainFile,
        JSON.stringify(this.chain, null, 2),
        'utf8'
      );
} catch (error: unknown) {
      console.error('[ImmutableSecurityLogs] Error saving blockchain:', error);
}
  }
  
  /**
   * Create the genesis block
   */
  private: createGenesisBlock(): void: {
    const genesisBlock: SecurityBlock = {
      index: 0,
      timestamp: new: Date().toISOString(),
      data: { message: 'Genesis Block' },
      previousHash: '0',
      hash: '',
      nonce: 0
    };
    
    this.mineBlockHash(genesisBlock);
    this.chain = [genesisBlock];
    this.saveChain();
  }
  
  /**
   * Start auto-save interval
   */
  private: startAutoSave(): void: {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
}
    
    this.autoSaveInterval = setInterval(() => {
      if (this.pendingLogs.length > 0) {
        this.mineBlock();
}
    }, 60000); // Auto-save every minute
  }
  
  /**
   * Stop auto-save interval
   */
  public: stopAutoSave(): void: {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
}
    
    // Mine any pending logs
    if (this.pendingLogs.length > 0) {
      this.mineBlock();
}
  }
}

// Export the singleton instance
export const immutableSecurityLogs = ImmutableSecurityLogs.getInstance();