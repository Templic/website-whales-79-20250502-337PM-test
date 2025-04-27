/**
 * @file ImmutableSecurityLogs.ts
 * @description Implements a blockchain-inspired immutable storage for security logs
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for log entry
 */
export interface LogEntry {
    /**
     * Unique identifier for the log entry
     */
    id: string;

    /**
     * Timestamp when the log was created
     */
    timestamp: number;

    /**
     * Type of log entry
     */
    type: string;

    /**
     * Additional details or context for the log entry
     */
    details?: any;
}

/**
 * Interface for block in the blockchain
 */
interface Block {
    /**
     * Index of the block in the chain
     */
    index: number;

    /**
     * Timestamp when the block was created
     */
    timestamp: number;

    /**
     * List of log entries in this block
     */
    data: LogEntry[];

    /**
     * Hash of the previous block
     */
    previousHash: string;

    /**
     * Hash of this block
     */
    hash: string;

    /**
     * Used for proof of work and additional security
     */
    nonce: number;
}

/**
 * Immutable Security Logs
 * 
 * Implements a simplified blockchain to store security logs in an immutable manner.
 * This provides tamper-evident logging for security events.
 */
class ImmutableSecurityLogsImpl {
    private blockchain: Block[] = [];
    private pendingLogs: LogEntry[] = [];
    private maxLogsPerBlock: number = 10;
    private blockCreationIntervalMs: number = 60000; // 1 minute
    private blockCreationInterval: NodeJS.Timeout | null = null;
    private initialized: boolean = false;

    /**
     * Initialize the blockchain
     */
    public initialize(): void {
        if (this.initialized) {
            return;
        }

        // Create the genesis block if the blockchain is empty
        if (this.blockchain.length === 0) {
            this.createGenesisBlock();
        }

        // Start block creation interval
        this.blockCreationInterval = setInterval(() => {
            this.createBlockFromPendingLogs();
        }, this.blockCreationIntervalMs);

        this.initialized = true;
        console.log('[IMMUTABLE-LOGS] Immutable security logs initialized');
    }

    /**
     * Create the genesis block
     */
    private createGenesisBlock(): void {
        const genesisBlock: Block = {
            index: 0,
            timestamp: Date.now(),
            data: [
                {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    type: 'GENESIS',
                    details: { message: 'Genesis Block' }
                }
            ],
            previousHash: '0',
            hash: '0',
            nonce: 0
        };

        // Calculate the hash for the genesis block
        genesisBlock.hash = this.calculateHash(genesisBlock);

        // Add to blockchain
        this.blockchain.push(genesisBlock);
        console.log('[IMMUTABLE-LOGS] Genesis block created');
    }

    /**
     * Calculate hash for a block
     */
    private calculateHash(block: Omit<Block, 'hash'>): string {
        // Create a string representation of the block
        const blockString = JSON.stringify({
            index: block.index,
            timestamp: block.timestamp,
            data: block.data,
            previousHash: block.previousHash,
            nonce: block.nonce
        });

        // Calculate SHA-256 hash
        return createHash('sha256').update(blockString).digest('hex');
    }

    /**
     * Create a new block from pending logs
     */
    private createBlockFromPendingLogs(): void {
        // Skip if no pending logs
        if (this.pendingLogs.length === 0) {
            return;
        }

        // Get the latest block
        const previousBlock = this.getLatestBlock();

        // Create new block
        const newBlock: Omit<Block, 'hash'> = {
            index: previousBlock.index + 1,
            timestamp: Date.now(),
            data: [...this.pendingLogs], // Take all pending logs
            previousHash: previousBlock.hash,
            nonce: 0
        };

        // Mine the block (simplified proof-of-work)
        const minedBlock = this.mineBlock(newBlock);

        // Add to blockchain
        this.blockchain.push(minedBlock);

        // Clear pending logs
        this.pendingLogs = [];

        console.log(`[IMMUTABLE-LOGS] New block created: #${minedBlock.index} with ${minedBlock.data.length} logs`);
    }

    /**
     * Mine a block (simplified proof-of-work)
     */
    private mineBlock(block: Omit<Block, 'hash'>): Block {
        const difficulty = 2;
        const target = '0'.repeat(difficulty);

        let hash = '';
        let nonce = 0;

        // Mine until hash starts with target (simplified proof-of-work)
        do {
            nonce++;
            const blockWithNonce = { ...block, nonce };
            hash = this.calculateHash(blockWithNonce);
        } while (hash.slice(0, difficulty) !== target);

        // Return the mined block
        return {
            ...block,
            nonce,
            hash
        };
    }

    /**
     * Get the latest block in the chain
     */
    private getLatestBlock(): Block {
        return this.blockchain[this.blockchain.length - 1];
    }

    /**
     * Add a log entry to the immutable store
     */
    public addLog(log: Omit<LogEntry, 'id' | 'timestamp'>): string {
        if (!this.initialized) {
            this.initialize();
        }

        // Create full log entry
        const fullLog: LogEntry = {
            id: uuidv4(),
            timestamp: Date.now(),
            ...log
        };

        // Add to pending logs
        this.pendingLogs.push(fullLog);

        // If we've reached max logs per block, create a new block immediately
        if (this.pendingLogs.length >= this.maxLogsPerBlock) {
            this.createBlockFromPendingLogs();
        }

        return fullLog.id;
    }

    /**
     * Search for logs matching criteria
     */
    public searchLogs(options: {
        types?: string[];
        startTime?: number;
        endTime?: number;
        limit?: number;
        offset?: number;
    }): LogEntry[] {
        if (!this.initialized) {
            this.initialize();
        }

        const { types, startTime, endTime, limit = 100, offset = 0 } = options;

        // Get all logs from all blocks
        let allLogs: LogEntry[] = [];
        
        // Add logs from blockchain
        for (const block of this.blockchain) {
            allLogs = allLogs.concat(block.data);
        }
        
        // Add pending logs
        allLogs = allLogs.concat(this.pendingLogs);
        
        // Filter logs by criteria
        let filteredLogs = allLogs.filter(log => {
            let matches = true;
            
            if (types && types.length > 0 && !types.includes(log.type)) {
                matches = false;
            }
            
            if (startTime && log.timestamp < startTime) {
                matches = false;
            }
            
            if (endTime && log.timestamp > endTime) {
                matches = false;
            }
            
            return matches;
        });
        
        // Sort by timestamp (newest first)
        filteredLogs = filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply pagination
        return filteredLogs.slice(offset, offset + limit);
    }

    /**
     * Get a specific log by ID
     */
    public getLog(id: string): LogEntry | null {
        if (!this.initialized) {
            this.initialize();
        }

        // Check pending logs
        const pendingLog = this.pendingLogs.find(log => log.id === id);
        if (pendingLog) {
            return pendingLog;
        }

        // Check logs in the blockchain
        for (const block of this.blockchain) {
            const blockLog = block.data.find(log => log.id === id);
            if (blockLog) {
                return blockLog;
            }
        }

        return null;
    }

    /**
     * Verify the integrity of the blockchain
     */
    public verifyIntegrity(): { valid: boolean; invalidBlocks: number[] } {
        if (!this.initialized) {
            this.initialize();
        }

        const invalidBlocks: number[] = [];

        // Loop through all blocks (except genesis) and verify hashes
        for (let i = 1; i < this.blockchain.length; i++) {
            const currentBlock = this.blockchain[i];
            const previousBlock = this.blockchain[i - 1];

            // Verify hash
            const calculatedHash = this.calculateHash({
                index: currentBlock.index,
                timestamp: currentBlock.timestamp,
                data: currentBlock.data,
                previousHash: currentBlock.previousHash,
                nonce: currentBlock.nonce
            });

            // Verify previous hash reference
            if (currentBlock.previousHash !== previousBlock.hash ||
                currentBlock.hash !== calculatedHash) {
                invalidBlocks.push(i);
            }
        }

        return {
            valid: invalidBlocks.length === 0,
            invalidBlocks
        };
    }

    /**
     * Get statistics about the blockchain
     */
    public getStats(): any {
        if (!this.initialized) {
            this.initialize();
        }

        let totalLogs = 0;
        for (const block of this.blockchain) {
            totalLogs += block.data.length;
        }

        return {
            blockchainLength: this.blockchain.length,
            totalLogs,
            pendingLogs: this.pendingLogs.length,
            lastBlockTimestamp: this.getLatestBlock().timestamp
        };
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        if (this.blockCreationInterval) {
            clearInterval(this.blockCreationInterval);
            this.blockCreationInterval = null;
        }

        // Force create a final block if there are pending logs
        if (this.pendingLogs.length > 0) {
            this.createBlockFromPendingLogs();
        }

        this.initialized = false;
        console.log('[IMMUTABLE-LOGS] Immutable security logs cleaned up');
    }
}

// Export singleton instance
export const immutableSecurityLogs = new ImmutableSecurityLogsImpl();