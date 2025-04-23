/**
 * Immutable Security Logs
 * 
 * This module implements a blockchain-based immutable security logging system
 * that ensures the integrity and non-repudiation of security events.
 */

import * as crypto from 'crypto';
import { SecurityEvent, SecurityEventWithBlockchainData, SecurityEventFilter } from './SecurityEventTypes';
import { securityFabric } from '../SecurityFabric';

/**
 * Block in the security blockchain
 */
interface SecurityBlock {
  /**
   * Block ID
   */
  blockId: string;
  
  /**
   * Previous block hash
   */
  previousHash: string;
  
  /**
   * Block timestamp
   */
  timestamp: number;
  
  /**
   * Events in the block
   */
  events: SecurityEventWithBlockchainData[];
  
  /**
   * Merkle root of the events
   */
  merkleRoot: string;
  
  /**
   * Nonce for proof of work
   */
  nonce: number;
  
  /**
   * Hash of the block
   */
  hash: string;
}

/**
 * Security blockchain class
 * Implements a blockchain for immutable security event logging
 */
class SecurityBlockchain {
  /**
   * Blocks in the blockchain
   */
  private blocks: SecurityBlock[] = [];
  
  /**
   * Unconfirmed events waiting to be added to a block
   */
  private unconfirmedEvents: SecurityEventWithBlockchainData[] = [];
  
  /**
   * Number of events in a block
   */
  private blockSize: number = 10;
  
  /**
   * Difficulty for proof of work
   */
  private difficulty: number = 2;
  
  /**
   * Interval for block creation (ms)
   */
  private blockInterval: number = 60000; // 1 minute
  
  /**
   * Block creation timer
   */
  private blockTimer: NodeJS.Timeout | null = null;
  
  /**
   * Flag indicating whether the blockchain is initialized
   */
  private initialized: boolean = false;
  
  /**
   * Create a new security blockchain
   */
  constructor() {
    this.init();
  }
  
  /**
   * Initialize the blockchain
   */
  private async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Create the genesis block if no blocks exist
    if (this.blocks.length === 0) {
      await this.createGenesisBlock();
    }
    
    // Start the block creation timer
    this.startBlockTimer();
    
    this.initialized = true;
    
    console.log('[SECURITY-BLOCKCHAIN] Initialized');
  }
  
  /**
   * Create the genesis block
   */
  private async createGenesisBlock(): Promise<void> {
    const genesisBlock: SecurityBlock = {
      blockId: '0',
      previousHash: '0'.repeat(64),
      timestamp: Date.now(),
      events: [],
      merkleRoot: '0'.repeat(64),
      nonce: 0,
      hash: '0'.repeat(64)
    };
    
    // Add a genesis event
    const genesisEvent: SecurityEventWithBlockchainData = {
      id: crypto.randomUUID(),
      severity: 'info' as any,
      category: 'system' as any,
      message: 'Genesis block created',
      timestamp: Date.now(),
      hash: '',
      blockId: genesisBlock.blockId,
      index: 0
    };
    
    // Compute the hash of the event
    genesisEvent.hash = this.hashEvent(genesisEvent);
    
    // Add the event to the block
    genesisBlock.events.push(genesisEvent);
    
    // Compute the merkle root
    genesisBlock.merkleRoot = this.computeMerkleRoot(genesisBlock.events);
    
    // Compute the block hash
    genesisBlock.hash = this.hashBlock(genesisBlock);
    
    // Add the block to the blockchain
    this.blocks.push(genesisBlock);
    
    console.log('[SECURITY-BLOCKCHAIN] Genesis block created');
  }
  
  /**
   * Start the block creation timer
   */
  private startBlockTimer(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }
    
    this.blockTimer = setInterval(() => {
      this.createBlock().catch(error => {
        console.error('[SECURITY-BLOCKCHAIN] Error creating block:', error);
      });
    }, this.blockInterval);
  }
  
  /**
   * Add a security event to the blockchain
   */
  public async addSecurityEvent(event: SecurityEvent): Promise<SecurityEventWithBlockchainData> {
    await this.init();
    
    // Generate an ID for the event
    const eventId = crypto.randomUUID();
    
    // Create a blockchain event
    const blockchainEvent: SecurityEventWithBlockchainData = {
      ...event,
      id: eventId,
      hash: '',
      blockId: '',
      index: 0
    };
    
    // Compute the hash of the event
    blockchainEvent.hash = this.hashEvent(blockchainEvent);
    
    // Add the event to the unconfirmed events
    this.unconfirmedEvents.push(blockchainEvent);
    
    // Emit an event
    securityFabric.emit('security:blockchain:event-added', {
      eventId,
      timestamp: Date.now()
    });
    
    // If there are enough unconfirmed events, create a new block
    if (this.unconfirmedEvents.length >= this.blockSize) {
      await this.createBlock();
    }
    
    return blockchainEvent;
  }
  
  /**
   * Create a new block
   */
  private async createBlock(): Promise<void> {
    // If there are no unconfirmed events, do nothing
    if (this.unconfirmedEvents.length === 0) {
      return;
    }
    
    // Get the events for the new block
    const events = this.unconfirmedEvents.splice(0, this.blockSize);
    
    // Get the previous block
    const previousBlock = this.blocks[this.blocks.length - 1];
    
    // Create a new block
    const block: SecurityBlock = {
      blockId: String(this.blocks.length),
      previousHash: previousBlock.hash,
      timestamp: Date.now(),
      events,
      merkleRoot: '',
      nonce: 0,
      hash: ''
    };
    
    // Assign block ID and index to events
    for (let i = 0; i < events.length; i++) {
      events[i].blockId = block.blockId;
      events[i].index = i;
    }
    
    // Compute the merkle root
    block.merkleRoot = this.computeMerkleRoot(events);
    
    // Perform proof of work
    await this.mineBlock(block);
    
    // Add the block to the blockchain
    this.blocks.push(block);
    
    // Emit an event
    securityFabric.emit('security:blockchain:block-created', {
      blockId: block.blockId,
      timestamp: Date.now(),
      eventsCount: events.length
    });
    
    console.log(`[SECURITY-BLOCKCHAIN] Created block #${block.blockId} with ${events.length} events`);
  }
  
  /**
   * Mine a block (perform proof of work)
   */
  private async mineBlock(block: SecurityBlock): Promise<void> {
    const target = '0'.repeat(this.difficulty);
    
    while (true) {
      // Compute the hash of the block
      block.hash = this.hashBlock(block);
      
      // Check if the hash meets the difficulty requirement
      if (block.hash.startsWith(target)) {
        break;
      }
      
      // Increment the nonce
      block.nonce++;
      
      // Yield to the event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  /**
   * Compute the merkle root of a list of events
   */
  private computeMerkleRoot(events: SecurityEventWithBlockchainData[]): string {
    // If there are no events, return a default hash
    if (events.length === 0) {
      return '0'.repeat(64);
    }
    
    // If there is only one event, return its hash
    if (events.length === 1) {
      return events[0].hash;
    }
    
    // Create a list of leaf nodes (event hashes)
    let nodes = events.map(event => event.hash);
    
    // If the number of nodes is odd, duplicate the last node
    if (nodes.length % 2 !== 0) {
      nodes.push(nodes[nodes.length - 1]);
    }
    
    // Build the merkle tree
    while (nodes.length > 1) {
      const newNodes = [];
      
      // Process nodes in pairs
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = nodes[i + 1];
        
        // Combine the hashes of the left and right nodes
        const combined = this.hashPair(left, right);
        
        newNodes.push(combined);
      }
      
      nodes = newNodes;
      
      // If the number of nodes is odd, duplicate the last node
      if (nodes.length % 2 !== 0 && nodes.length > 1) {
        nodes.push(nodes[nodes.length - 1]);
      }
    }
    
    // Return the root of the merkle tree
    return nodes[0];
  }
  
  /**
   * Hash a pair of hashes
   */
  private hashPair(left: string, right: string): string {
    const data = left + right;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Hash an event
   */
  private hashEvent(event: SecurityEventWithBlockchainData): string {
    // Create a copy of the event without the hash field
    const { hash, ...eventWithoutHash } = event;
    
    // Convert the event to a string
    const data = JSON.stringify(eventWithoutHash);
    
    // Compute the hash
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Hash a block
   */
  private hashBlock(block: SecurityBlock): string {
    // Create a copy of the block without the hash field
    const { hash, ...blockWithoutHash } = block;
    
    // Convert the block to a string
    const data = JSON.stringify(blockWithoutHash);
    
    // Compute the hash
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Verify the integrity of the blockchain
   */
  public async verifyBlockchain(): Promise<boolean> {
    // Loop through all blocks except the genesis block
    for (let i = 1; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const previousBlock = this.blocks[i - 1];
      
      // Verify the previous hash
      if (block.previousHash !== previousBlock.hash) {
        console.error(`[SECURITY-BLOCKCHAIN] Invalid previous hash in block #${block.blockId}`);
        return false;
      }
      
      // Verify the block hash
      const blockHash = this.hashBlock(block);
      if (blockHash !== block.hash) {
        console.error(`[SECURITY-BLOCKCHAIN] Invalid block hash in block #${block.blockId}`);
        return false;
      }
      
      // Verify the merkle root
      const merkleRoot = this.computeMerkleRoot(block.events);
      if (merkleRoot !== block.merkleRoot) {
        console.error(`[SECURITY-BLOCKCHAIN] Invalid merkle root in block #${block.blockId}`);
        return false;
      }
      
      // Verify each event
      for (const event of block.events) {
        const eventHash = this.hashEvent(event);
        if (eventHash !== event.hash) {
          console.error(`[SECURITY-BLOCKCHAIN] Invalid event hash in block #${block.blockId}, event ${event.id}`);
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get a security event by ID
   */
  public getEventById(eventId: string): SecurityEventWithBlockchainData | null {
    for (const block of this.blocks) {
      for (const event of block.events) {
        if (event.id === eventId) {
          return event;
        }
      }
    }
    
    // Check unconfirmed events
    for (const event of this.unconfirmedEvents) {
      if (event.id === eventId) {
        return event;
      }
    }
    
    return null;
  }
  
  /**
   * Get all security events
   */
  public getAllEvents(): SecurityEventWithBlockchainData[] {
    const events: SecurityEventWithBlockchainData[] = [];
    
    // Add events from confirmed blocks
    for (const block of this.blocks) {
      events.push(...block.events);
    }
    
    // Add unconfirmed events
    events.push(...this.unconfirmedEvents);
    
    return events;
  }
  
  /**
   * Get security events by filter
   */
  public getEventsByFilter(filter: SecurityEventFilter): SecurityEventWithBlockchainData[] {
    let events = this.getAllEvents();
    
    // Filter by severity
    if (filter.severities && filter.severities.length > 0) {
      events = events.filter(event => 
        filter.severities!.includes(event.severity as any)
      );
    }
    
    // Filter by category
    if (filter.categories && filter.categories.length > 0) {
      events = events.filter(event => 
        filter.categories!.includes(event.category as any)
      );
    }
    
    // Filter by timestamp
    if (filter.startTimestamp) {
      const startTime = typeof filter.startTimestamp === 'number' ? 
        filter.startTimestamp : 
        new Date(filter.startTimestamp).getTime();
      
      events = events.filter(event => {
        const eventTime = typeof event.timestamp === 'number' ? 
          event.timestamp : 
          (event.timestamp ? new Date(event.timestamp).getTime() : 0);
        
        return eventTime >= startTime;
      });
    }
    
    if (filter.endTimestamp) {
      const endTime = typeof filter.endTimestamp === 'number' ? 
        filter.endTimestamp : 
        new Date(filter.endTimestamp).getTime();
      
      events = events.filter(event => {
        const eventTime = typeof event.timestamp === 'number' ? 
          event.timestamp : 
          (event.timestamp ? new Date(event.timestamp).getTime() : 0);
        
        return eventTime <= endTime;
      });
    }
    
    // Filter by user ID
    if (filter.userIds && filter.userIds.length > 0) {
      events = events.filter(event => 
        event.userId && filter.userIds!.includes(event.userId)
      );
    }
    
    // Filter by IP address
    if (filter.ipAddresses && filter.ipAddresses.length > 0) {
      events = events.filter(event => 
        event.ipAddress && filter.ipAddresses!.includes(event.ipAddress)
      );
    }
    
    // Filter by text search
    if (filter.query) {
      const query = filter.query.toLowerCase();
      events = events.filter(event => 
        event.message.toLowerCase().includes(query) ||
        (event.metadata && JSON.stringify(event.metadata).toLowerCase().includes(query))
      );
    }
    
    // Apply limit
    if (filter.limit && filter.limit > 0) {
      events = events.slice(0, filter.limit);
    }
    
    return events;
  }
  
  /**
   * Get all blocks in the blockchain
   */
  public getAllBlocks(): SecurityBlock[] {
    return [...this.blocks];
  }
  
  /**
   * Get the number of blocks in the blockchain
   */
  public getBlockCount(): number {
    return this.blocks.length;
  }
  
  /**
   * Get the number of unconfirmed events
   */
  public getUnconfirmedEventCount(): number {
    return this.unconfirmedEvents.length;
  }
  
  /**
   * Get the total number of events
   */
  public getTotalEventCount(): number {
    let count = this.unconfirmedEvents.length;
    
    for (const block of this.blocks) {
      count += block.events.length;
    }
    
    return count;
  }
  
  /**
   * Get the blockchain stats
   */
  public getStats(): {
    blockCount: number;
    unconfirmedEventCount: number;
    totalEventCount: number;
    averageEventsPerBlock: number;
    lastBlockTime: number | null;
  } {
    const blockCount = this.getBlockCount();
    const unconfirmedEventCount = this.getUnconfirmedEventCount();
    const totalEventCount = this.getTotalEventCount();
    
    // Calculate average events per block
    let totalEventsInBlocks = 0;
    for (const block of this.blocks) {
      totalEventsInBlocks += block.events.length;
    }
    
    const averageEventsPerBlock = blockCount > 0 ? totalEventsInBlocks / blockCount : 0;
    
    // Get the timestamp of the last block
    const lastBlockTime = this.blocks.length > 0 ? this.blocks[this.blocks.length - 1].timestamp : null;
    
    return {
      blockCount,
      unconfirmedEventCount,
      totalEventCount,
      averageEventsPerBlock,
      lastBlockTime
    };
  }
}

/**
 * Global security blockchain instance
 */
export const securityBlockchain = new SecurityBlockchain();