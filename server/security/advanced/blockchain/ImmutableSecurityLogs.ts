/**
 * Immutable Security Logs with Blockchain-like Structure
 * 
 * This module implements a blockchain-inspired immutable logging system for security events.
 * It provides tamper-evident logs that can detect any modifications to the security audit trail.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Security event severity level
 */
export enum SecurityEventSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Security event categories
 */
export enum SecurityEventCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  ATTACK_ATTEMPT = 'attack_attempt',
  DATA_ACCESS = 'data_access',
  CONFIGURATION_CHANGE = 'configuration_change',
  RESOURCE_ACCESS = 'resource_access',
  ADMINISTRATIVE = 'administrative',
  SYSTEM = 'system',
  API = 'api',
  USER_ACTIVITY = 'user_activity',
  CRYPTO = 'crypto',
  NETWORK = 'network',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  /**
   * Unique event ID
   */
  id: string;
  
  /**
   * Event timestamp
   */
  timestamp: Date;
  
  /**
   * Event severity
   */
  severity: SecurityEventSeverity;
  
  /**
   * Event category
   */
  category: SecurityEventCategory;
  
  /**
   * Event message
   */
  message: string;
  
  /**
   * User that triggered the event (if applicable)
   */
  user?: string;
  
  /**
   * IP address associated with the event
   */
  ipAddress?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether the event is verified
   */
  verified?: boolean;
}

/**
 * Block of security events
 */
export interface SecurityBlock {
  /**
   * Block number
   */
  blockNumber: number;
  
  /**
   * Block timestamp
   */
  timestamp: Date;
  
  /**
   * Hash of the previous block
   */
  previousBlockHash: string;
  
  /**
   * Merkle root of events
   */
  merkleRoot: string;
  
  /**
   * Events in this block
   */
  events: SecurityEvent[];
  
  /**
   * Nonce for proof of work
   */
  nonce: number;
  
  /**
   * Block hash
   */
  hash: string;
  
  /**
   * Validator signatures
   */
  signatures: Array<{
    /**
     * Validator ID
     */
    validatorId: string;
    
    /**
     * Signature
     */
    signature: string;
  }>;
}

/**
 * Chain validation result
 */
export interface ChainValidationResult {
  /**
   * Whether the chain is valid
   */
  valid: boolean;
  
  /**
   * Errors found during validation
   */
  errors: string[];
  
  /**
   * Block numbers with invalid hashes
   */
  invalidBlocks: number[];
  
  /**
   * Block numbers with invalid events
   */
  invalidEvents: number[];
  
  /**
   * Block numbers with invalid signatures
   */
  invalidSignatures: number[];
}

/**
 * Security blockchain options
 */
export interface SecurityBlockchainOptions {
  /**
   * Maximum events per block
   */
  maxEventsPerBlock?: number;
  
  /**
   * Block confirmation time in milliseconds
   */
  blockConfirmationTime?: number;
  
  /**
   * Storage directory
   */
  storageDirectory?: string;
  
  /**
   * Storage format ('json' or 'binary')
   */
  storageFormat?: 'json' | 'binary';
  
  /**
   * Whether to compress blocks
   */
  compressBlocks?: boolean;
  
  /**
   * Maximum chain length to keep in memory
   */
  maxChainLength?: number;
  
  /**
   * Validator IDs
   */
  validators?: string[];
  
  /**
   * Difficulty for proof of work
   */
  proofOfWorkDifficulty?: number;
}

/**
 * Security blockchain storage provider
 */
interface SecurityBlockchainStorage {
  /**
   * Save a block
   */
  saveBlock(block: SecurityBlock): Promise<void>;
  
  /**
   * Load a block by number
   */
  loadBlock(blockNumber: number): Promise<SecurityBlock | null>;
  
  /**
   * Get the latest block number
   */
  getLatestBlockNumber(): Promise<number>;
  
  /**
   * List all block numbers
   */
  listBlockNumbers(): Promise<number[]>;
  
  /**
   * Check if a block exists
   */
  blockExists(blockNumber: number): Promise<boolean>;
}

/**
 * File-based security blockchain storage
 */
class FileSecurityBlockchainStorage implements SecurityBlockchainStorage {
  /**
   * Storage directory
   */
  private storageDirectory: string;
  
  /**
   * Storage format
   */
  private storageFormat: 'json' | 'binary';
  
  /**
   * Whether to compress blocks
   */
  private compressBlocks: boolean;
  
  /**
   * Create a new file-based storage
   */
  constructor(options: {
    storageDirectory: string;
    storageFormat: 'json' | 'binary';
    compressBlocks: boolean;
  }) {
    this.storageDirectory = options.storageDirectory;
    this.storageFormat = options.storageFormat;
    this.compressBlocks = options.compressBlocks;
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDirectory)) {
      fs.mkdirSync(this.storageDirectory, { recursive: true });
    }
  }
  
  /**
   * Save a block
   */
  public async saveBlock(block: SecurityBlock): Promise<void> {
    const blockPath = this.getBlockPath(block.blockNumber);
    
    try {
      let data: string | Buffer;
      
      if (this.storageFormat === 'json') {
        // Convert dates to ISO strings for JSON serialization
        const serializedBlock = this.serializeBlockForJson(block);
        data = JSON.stringify(serializedBlock, null, 2);
      } else {
        // Binary format (would implement custom binary serialization)
        data = Buffer.from(JSON.stringify(block)); // Simplified for now
      }
      
      // Compress if needed (simplified)
      if (this.compressBlocks) {
        // In a real implementation, would use zlib or similar
        // For now, just use the uncompressed data
      }
      
      // Write to file
      fs.writeFileSync(blockPath, data);
    } catch (error) {
      console.error(`[SecurityBlockchain] Error saving block ${block.blockNumber}:`, error);
      throw error;
    }
  }
  
  /**
   * Load a block by number
   */
  public async loadBlock(blockNumber: number): Promise<SecurityBlock | null> {
    const blockPath = this.getBlockPath(blockNumber);
    
    if (!fs.existsSync(blockPath)) {
      return null;
    }
    
    try {
      const data = fs.readFileSync(blockPath);
      
      // Decompress if needed (simplified)
      const decompressedData = data; // Would implement actual decompression
      
      // Parse block
      if (this.storageFormat === 'json') {
        const parsedBlock = JSON.parse(decompressedData.toString());
        return this.deserializeBlockFromJson(parsedBlock);
      } else {
        // Binary format (would implement custom binary deserialization)
        return JSON.parse(decompressedData.toString());
      }
    } catch (error) {
      console.error(`[SecurityBlockchain] Error loading block ${blockNumber}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the latest block number
   */
  public async getLatestBlockNumber(): Promise<number> {
    try {
      const blockNumbers = await this.listBlockNumbers();
      
      if (blockNumbers.length === 0) {
        return -1; // No blocks yet
      }
      
      return Math.max(...blockNumbers);
    } catch (error) {
      console.error('[SecurityBlockchain] Error getting latest block number:', error);
      throw error;
    }
  }
  
  /**
   * List all block numbers
   */
  public async listBlockNumbers(): Promise<number[]> {
    try {
      const files = fs.readdirSync(this.storageDirectory);
      
      const blockNumbers = files
        .filter(file => file.endsWith(this.storageFormat === 'json' ? '.json' : '.bin'))
        .map(file => {
          const match = file.match(/^block_(\d+)\./);
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter(num => num >= 0);
      
      return blockNumbers.sort((a, b) => a - b);
    } catch (error) {
      console.error('[SecurityBlockchain] Error listing block numbers:', error);
      throw error;
    }
  }
  
  /**
   * Check if a block exists
   */
  public async blockExists(blockNumber: number): Promise<boolean> {
    const blockPath = this.getBlockPath(blockNumber);
    return fs.existsSync(blockPath);
  }
  
  /**
   * Get the path to a block file
   */
  private getBlockPath(blockNumber: number): string {
    const extension = this.storageFormat === 'json' ? '.json' : '.bin';
    return path.join(this.storageDirectory, `block_${blockNumber}${extension}`);
  }
  
  /**
   * Serialize a block for JSON storage
   */
  private serializeBlockForJson(block: SecurityBlock): any {
    return {
      ...block,
      timestamp: block.timestamp.toISOString(),
      events: block.events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString()
      }))
    };
  }
  
  /**
   * Deserialize a block from JSON storage
   */
  private deserializeBlockFromJson(jsonBlock: any): SecurityBlock {
    return {
      ...jsonBlock,
      timestamp: new Date(jsonBlock.timestamp),
      events: jsonBlock.events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }))
    };
  }
}

/**
 * Security blockchain implementation
 */
export class SecurityBlockchain {
  /**
   * Chain options
   */
  private options: SecurityBlockchainOptions;
  
  /**
   * Storage provider
   */
  private storage: SecurityBlockchainStorage;
  
  /**
   * Current chain (in memory)
   */
  private chain: SecurityBlock[] = [];
  
  /**
   * Pending events
   */
  private pendingEvents: SecurityEvent[] = [];
  
  /**
   * Interval for creating blocks
   */
  private blockCreationInterval: NodeJS.Timeout | null = null;
  
  /**
   * Validator keys (in a real implementation, these would be stored securely)
   */
  private validatorKeys: Map<string, { publicKey: string; privateKey: string }> = new Map();
  
  /**
   * Create a new security blockchain
   */
  constructor(options: SecurityBlockchainOptions = {}) {
    this.options = {
      maxEventsPerBlock: 100,
      blockConfirmationTime: 60000, // 1 minute
      storageDirectory: 'data/security-blockchain',
      storageFormat: 'json',
      compressBlocks: false,
      maxChainLength: 1000,
      validators: ['validator1', 'validator2', 'validator3'],
      proofOfWorkDifficulty: 2,
      ...options
    };
    
    // Initialize storage
    this.storage = new FileSecurityBlockchainStorage({
      storageDirectory: this.options.storageDirectory!,
      storageFormat: this.options.storageFormat!,
      compressBlocks: this.options.compressBlocks!
    });
    
    // Initialize validator keys (in a real implementation, would load actual keys)
    for (const validatorId of this.options.validators || []) {
      // Generate some deterministic keys for simulation
      const seed = crypto.createHash('sha256').update(validatorId).digest();
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      this.validatorKeys.set(validatorId, { publicKey, privateKey });
    }
  }
  
  /**
   * Initialize the blockchain
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[SecurityBlockchain] Initializing security blockchain...');
      
      // Load the latest blocks into memory
      await this.loadLatestBlocks();
      
      // Start block creation interval
      this.startBlockCreation();
      
      console.log('[SecurityBlockchain] Security blockchain initialized successfully');
    } catch (error) {
      console.error('[SecurityBlockchain] Error initializing security blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Shut down the blockchain
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('[SecurityBlockchain] Shutting down security blockchain...');
      
      // Stop block creation interval
      if (this.blockCreationInterval) {
        clearInterval(this.blockCreationInterval);
        this.blockCreationInterval = null;
      }
      
      // Create a final block with any pending events
      if (this.pendingEvents.length > 0) {
        await this.createNewBlock();
      }
      
      console.log('[SecurityBlockchain] Security blockchain shut down successfully');
    } catch (error) {
      console.error('[SecurityBlockchain] Error shutting down security blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Add a security event to the blockchain
   */
  public async addSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'verified'>): Promise<SecurityEvent> {
    try {
      // Create a full event with ID and timestamp
      const fullEvent: SecurityEvent = {
        id: crypto.randomBytes(16).toString('hex'),
        timestamp: new Date(),
        verified: false,
        ...event
      };
      
      // Add to pending events
      this.pendingEvents.push(fullEvent);
      
      // Create a new block if we've reached the maximum events per block
      if (this.pendingEvents.length >= (this.options.maxEventsPerBlock || 100)) {
        await this.createNewBlock();
      }
      
      return fullEvent;
    } catch (error) {
      console.error('[SecurityBlockchain] Error adding security event:', error);
      throw error;
    }
  }
  
  /**
   * Create a new block with pending events
   */
  private async createNewBlock(): Promise<SecurityBlock> {
    if (this.pendingEvents.length === 0) {
      throw new Error('No pending events to create a block');
    }
    
    try {
      // Get the latest block
      const latestBlockNumber = await this.storage.getLatestBlockNumber();
      const previousBlock = latestBlockNumber >= 0 ? 
        await this.storage.loadBlock(latestBlockNumber) : 
        null;
      
      // Generate block number and previous hash
      const blockNumber = latestBlockNumber + 1;
      const previousBlockHash = previousBlock ? previousBlock.hash : '0'.repeat(64);
      
      // Verify events
      const verifiedEvents = this.pendingEvents.map(event => ({
        ...event,
        verified: true
      }));
      
      // Calculate merkle root
      const merkleRoot = this.calculateMerkleRoot(verifiedEvents);
      
      // Create the new block
      const newBlock: SecurityBlock = {
        blockNumber,
        timestamp: new Date(),
        previousBlockHash,
        merkleRoot,
        events: verifiedEvents,
        nonce: 0,
        hash: '',
        signatures: []
      };
      
      // Perform proof of work
      const difficulty = this.options.proofOfWorkDifficulty || 2;
      await this.performProofOfWork(newBlock, difficulty);
      
      // Sign the block using validators
      await this.signBlock(newBlock);
      
      // Save the block
      await this.storage.saveBlock(newBlock);
      
      // Add to in-memory chain
      this.chain.push(newBlock);
      
      // Trim in-memory chain if needed
      this.trimChain();
      
      // Clear pending events
      this.pendingEvents = [];
      
      console.log(`[SecurityBlockchain] Created block #${blockNumber} with ${verifiedEvents.length} events`);
      
      return newBlock;
    } catch (error) {
      console.error('[SecurityBlockchain] Error creating new block:', error);
      throw error;
    }
  }
  
  /**
   * Sign a block with validator keys
   */
  private async signBlock(block: SecurityBlock): Promise<void> {
    try {
      // Calculate block hash
      const blockData = this.serializeBlockForHashing(block);
      block.hash = crypto.createHash('sha256').update(blockData).digest('hex');
      
      // Sign the block with each validator
      block.signatures = [];
      
      for (const [validatorId, keys] of this.validatorKeys.entries()) {
        const signature = crypto.sign('sha256', Buffer.from(block.hash), {
          key: keys.privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        }).toString('base64');
        
        block.signatures.push({
          validatorId,
          signature
        });
      }
    } catch (error) {
      console.error('[SecurityBlockchain] Error signing block:', error);
      throw error;
    }
  }
  
  /**
   * Perform proof of work
   */
  private async performProofOfWork(block: SecurityBlock, difficulty: number): Promise<void> {
    // Create a string of zeros based on difficulty
    const targetPrefix = '0'.repeat(difficulty);
    
    let nonce = 0;
    let hash = '';
    
    while (true) {
      // Update nonce
      block.nonce = nonce;
      
      // Calculate hash
      const blockData = this.serializeBlockForHashing(block);
      hash = crypto.createHash('sha256').update(blockData).digest('hex');
      
      // Check if hash meets difficulty requirement
      if (hash.startsWith(targetPrefix)) {
        break;
      }
      
      nonce++;
      
      // Yield to event loop periodically
      if (nonce % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Update block with final nonce and hash
    block.nonce = nonce;
    block.hash = hash;
  }
  
  /**
   * Calculate merkle root of events
   */
  private calculateMerkleRoot(events: SecurityEvent[]): string {
    if (events.length === 0) {
      return '0'.repeat(64);
    }
    
    // Calculate leaf hashes
    const leafHashes = events.map(event => {
      const eventData = JSON.stringify(event);
      return crypto.createHash('sha256').update(eventData).digest('hex');
    });
    
    // If only one leaf, return it
    if (leafHashes.length === 1) {
      return leafHashes[0];
    }
    
    // Build merkle tree
    return this.buildMerkleTree(leafHashes);
  }
  
  /**
   * Build merkle tree from leaf hashes
   */
  private buildMerkleTree(hashes: string[]): string {
    if (hashes.length === 0) {
      return '0'.repeat(64);
    }
    
    if (hashes.length === 1) {
      return hashes[0];
    }
    
    const nextLevel: string[] = [];
    
    // Combine pairs of hashes
    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        // Combine pair
        const combined = hashes[i] + hashes[i + 1];
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        nextLevel.push(hash);
      } else {
        // Odd number of hashes, duplicate the last one
        const combined = hashes[i] + hashes[i];
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        nextLevel.push(hash);
      }
    }
    
    // Recursively build the next level
    return this.buildMerkleTree(nextLevel);
  }
  
  /**
   * Serialize a block for hashing
   */
  private serializeBlockForHashing(block: SecurityBlock): string {
    // Create a copy without the hash and signatures
    const blockData = {
      blockNumber: block.blockNumber,
      timestamp: block.timestamp.toISOString(),
      previousBlockHash: block.previousBlockHash,
      merkleRoot: block.merkleRoot,
      events: block.events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString()
      })),
      nonce: block.nonce
    };
    
    return JSON.stringify(blockData);
  }
  
  /**
   * Load the latest blocks into memory
   */
  private async loadLatestBlocks(): Promise<void> {
    try {
      const blockNumbers = await this.storage.listBlockNumbers();
      
      if (blockNumbers.length === 0) {
        // No blocks yet
        return;
      }
      
      // Load the most recent blocks (up to maxChainLength)
      const maxLength = this.options.maxChainLength || 1000;
      const startIndex = Math.max(0, blockNumbers.length - maxLength);
      const blocksToLoad = blockNumbers.slice(startIndex);
      
      this.chain = [];
      
      for (const blockNumber of blocksToLoad) {
        const block = await this.storage.loadBlock(blockNumber);
        if (block) {
          this.chain.push(block);
        }
      }
      
      console.log(`[SecurityBlockchain] Loaded ${this.chain.length} blocks into memory`);
    } catch (error) {
      console.error('[SecurityBlockchain] Error loading latest blocks:', error);
      throw error;
    }
  }
  
  /**
   * Trim the in-memory chain to maxChainLength
   */
  private trimChain(): void {
    const maxLength = this.options.maxChainLength || 1000;
    
    if (this.chain.length > maxLength) {
      this.chain = this.chain.slice(-maxLength);
    }
  }
  
  /**
   * Start the block creation interval
   */
  private startBlockCreation(): void {
    if (this.blockCreationInterval) {
      clearInterval(this.blockCreationInterval);
    }
    
    const interval = this.options.blockConfirmationTime || 60000;
    
    this.blockCreationInterval = setInterval(async () => {
      try {
        if (this.pendingEvents.length > 0) {
          await this.createNewBlock();
        }
      } catch (error) {
        console.error('[SecurityBlockchain] Error in block creation interval:', error);
      }
    }, interval);
    
    console.log(`[SecurityBlockchain] Block creation scheduled every ${interval}ms`);
  }
  
  /**
   * Validate the blockchain
   */
  public async validateChain(): Promise<ChainValidationResult> {
    const result: ChainValidationResult = {
      valid: true,
      errors: [],
      invalidBlocks: [],
      invalidEvents: [],
      invalidSignatures: []
    };
    
    try {
      // Get all block numbers
      const blockNumbers = await this.storage.listBlockNumbers();
      
      if (blockNumbers.length === 0) {
        return result;
      }
      
      // Validate each block
      let previousBlockHash = '0'.repeat(64);
      
      for (const blockNumber of blockNumbers) {
        const block = await this.storage.loadBlock(blockNumber);
        
        if (!block) {
          result.valid = false;
          result.errors.push(`Block #${blockNumber} not found`);
          result.invalidBlocks.push(blockNumber);
          continue;
        }
        
        // Validate block number
        if (block.blockNumber !== blockNumber) {
          result.valid = false;
          result.errors.push(`Block #${blockNumber} has incorrect block number: ${block.blockNumber}`);
          result.invalidBlocks.push(blockNumber);
        }
        
        // Validate previous block hash
        if (block.previousBlockHash !== previousBlockHash) {
          result.valid = false;
          result.errors.push(`Block #${blockNumber} has incorrect previous block hash`);
          result.invalidBlocks.push(blockNumber);
        }
        
        // Validate merkle root
        const calculatedMerkleRoot = this.calculateMerkleRoot(block.events);
        if (block.merkleRoot !== calculatedMerkleRoot) {
          result.valid = false;
          result.errors.push(`Block #${blockNumber} has incorrect merkle root`);
          result.invalidEvents.push(blockNumber);
        }
        
        // Validate block hash
        const blockData = this.serializeBlockForHashing(block);
        const calculatedHash = crypto.createHash('sha256').update(blockData).digest('hex');
        
        if (block.hash !== calculatedHash) {
          result.valid = false;
          result.errors.push(`Block #${blockNumber} has incorrect hash`);
          result.invalidBlocks.push(blockNumber);
        }
        
        // Validate proof of work
        const difficulty = this.options.proofOfWorkDifficulty || 2;
        const targetPrefix = '0'.repeat(difficulty);
        
        if (!block.hash.startsWith(targetPrefix)) {
          result.valid = false;
          result.errors.push(`Block #${blockNumber} does not meet proof of work requirement`);
          result.invalidBlocks.push(blockNumber);
        }
        
        // Validate signatures
        for (const { validatorId, signature } of block.signatures) {
          const validatorKeys = this.validatorKeys.get(validatorId);
          
          if (!validatorKeys) {
            result.valid = false;
            result.errors.push(`Block #${blockNumber} has signature from unknown validator: ${validatorId}`);
            result.invalidSignatures.push(blockNumber);
            continue;
          }
          
          const isValid = crypto.verify(
            'sha256',
            Buffer.from(block.hash),
            {
              key: validatorKeys.publicKey,
              padding: crypto.constants.RSA_PKCS1_PSS_PADDING
            },
            Buffer.from(signature, 'base64')
          );
          
          if (!isValid) {
            result.valid = false;
            result.errors.push(`Block #${blockNumber} has invalid signature from validator: ${validatorId}`);
            result.invalidSignatures.push(blockNumber);
          }
        }
        
        // Update previous block hash for next iteration
        previousBlockHash = block.hash;
      }
      
      return result;
    } catch (error) {
      console.error('[SecurityBlockchain] Error validating chain:', error);
      result.valid = false;
      result.errors.push(`Validation error: ${error}`);
      return result;
    }
  }
  
  /**
   * Query events from the blockchain
   */
  public async queryEvents(options: {
    fromBlock?: number;
    toBlock?: number;
    startTime?: Date;
    endTime?: Date;
    category?: SecurityEventCategory;
    severity?: SecurityEventSeverity;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SecurityEvent[]> {
    try {
      // Default values
      const fromBlock = options.fromBlock || 0;
      const toBlock = options.toBlock || Number.MAX_SAFE_INTEGER;
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      let events: SecurityEvent[] = [];
      let eventCount = 0;
      let skipCount = 0;
      
      // Get block numbers in range
      const blockNumbers = await this.storage.listBlockNumbers();
      const filteredBlockNumbers = blockNumbers.filter(num => num >= fromBlock && num <= toBlock);
      
      // Load blocks and collect events
      for (const blockNumber of filteredBlockNumbers) {
        const block = await this.storage.loadBlock(blockNumber);
        
        if (!block) {
          continue;
        }
        
        // Filter events
        const filteredEvents = block.events.filter(event => {
          // Filter by time range
          if (options.startTime && event.timestamp < options.startTime) {
            return false;
          }
          
          if (options.endTime && event.timestamp > options.endTime) {
            return false;
          }
          
          // Filter by category
          if (options.category && event.category !== options.category) {
            return false;
          }
          
          // Filter by severity
          if (options.severity && event.severity !== options.severity) {
            return false;
          }
          
          // Filter by user ID
          if (options.userId && event.user !== options.userId) {
            return false;
          }
          
          return true;
        });
        
        // Apply offset and limit
        for (const event of filteredEvents) {
          if (skipCount < offset) {
            skipCount++;
            continue;
          }
          
          if (eventCount < limit) {
            events.push(event);
            eventCount++;
          }
          
          if (eventCount >= limit) {
            break;
          }
        }
        
        if (eventCount >= limit) {
          break;
        }
      }
      
      return events;
    } catch (error) {
      console.error('[SecurityBlockchain] Error querying events:', error);
      throw error;
    }
  }
  
  /**
   * Get chain statistics
   */
  public async getChainStats(): Promise<{
    blockCount: number;
    eventCount: number;
    averageEventsPerBlock: number;
    oldestBlockTimestamp: Date | null;
    newestBlockTimestamp: Date | null;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
  }> {
    try {
      const blockNumbers = await this.storage.listBlockNumbers();
      let eventCount = 0;
      let oldestTimestamp: Date | null = null;
      let newestTimestamp: Date | null = null;
      const eventsByCategory: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      
      // Process each block
      for (const blockNumber of blockNumbers) {
        const block = await this.storage.loadBlock(blockNumber);
        
        if (!block) {
          continue;
        }
        
        // Update timestamps
        if (!oldestTimestamp || block.timestamp < oldestTimestamp) {
          oldestTimestamp = block.timestamp;
        }
        
        if (!newestTimestamp || block.timestamp > newestTimestamp) {
          newestTimestamp = block.timestamp;
        }
        
        // Count events
        eventCount += block.events.length;
        
        // Count by category and severity
        for (const event of block.events) {
          eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
          eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        }
      }
      
      return {
        blockCount: blockNumbers.length,
        eventCount,
        averageEventsPerBlock: blockNumbers.length > 0 ? eventCount / blockNumbers.length : 0,
        oldestBlockTimestamp: oldestTimestamp,
        newestBlockTimestamp: newestTimestamp,
        eventsByCategory,
        eventsBySeverity
      };
    } catch (error) {
      console.error('[SecurityBlockchain] Error getting chain stats:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
export const securityBlockchain = new SecurityBlockchain({
  maxEventsPerBlock: 100,
  blockConfirmationTime: 60000, // 1 minute
  storageDirectory: 'data/security-blockchain',
  storageFormat: 'json',
  compressBlocks: false,
  maxChainLength: 1000,
  validators: ['validator1', 'validator2', 'validator3'],
  proofOfWorkDifficulty: 2
});