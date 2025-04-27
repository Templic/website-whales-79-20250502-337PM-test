/**
 * Homomorphic Encryption API Routes
 * 
 * This file contains the API routes for managing homomorphic encryption operations.
 */

import { Router } from 'express';
import { 
  homomorphicEncryption, 
  HomomorphicOperationType, 
  HomomorphicSecurityLevel, 
  HomomorphicConfig, 
  HomomorphicCiphertext 
} from '../../../security/advanced/homomorphic';
import { logSecurityEvent } from '../../../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../../../security/advanced/SecurityFabric';

// Create router for homomorphic encryption routes
export const homomorphicRoutes = Router();

/**
 * Generate a new homomorphic encryption key pair
 * 
 * @route POST /api/security/homomorphic/keys/generate
 */
homomorphicRoutes.post('/keys/generate', (req, res) => {
  try {
    const config: Partial<HomomorphicConfig> = req.body;
    
    // Validate config
    if (config.operationType && !Object.values(HomomorphicOperationType).includes(config.operationType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation type',
        message: `Valid types are: ${Object.values(HomomorphicOperationType).join(', ')}`
      });
    }
    
    if (config.securityLevel && !Object.values(HomomorphicSecurityLevel).includes(config.securityLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid security level',
        message: `Valid levels are: ${Object.values(HomomorphicSecurityLevel).join(', ')}`
      });
    }
    
    // Generate key pair
    const keyPair = homomorphicEncryption.generateKeyPair(config);
    
    // Remove secret key from response
    const { secretKey, ...publicKeyData } = keyPair;
    
    res.status(201).json({
      success: true,
      message: 'Homomorphic encryption key pair generated successfully',
      data: publicKeyData
    });
  } catch (error) {
    console.error('Error generating homomorphic encryption key pair:', error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error generating homomorphic encryption key pair',
      data: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate homomorphic encryption key pair'
    });
  }
});

/**
 * Get all homomorphic encryption key pairs
 * 
 * @route GET /api/security/homomorphic/keys
 */
homomorphicRoutes.get('/keys', (req, res) => {
  try {
    const keyPairs = homomorphicEncryption.listKeyPairs();
    
    // Remove secret keys from response
    const publicKeyPairs = keyPairs.map(({ secretKey, ...publicKeyData }) => publicKeyData);
    
    res.json({
      success: true,
      count: publicKeyPairs.length,
      data: publicKeyPairs
    });
  } catch (error) {
    console.error('Error fetching homomorphic encryption key pairs:', error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching homomorphic encryption key pairs',
      data: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch homomorphic encryption key pairs'
    });
  }
});

/**
 * Delete a homomorphic encryption key pair
 * 
 * @route DELETE /api/security/homomorphic/keys/:id
 */
homomorphicRoutes.delete('/keys/:id', (req, res) => {
  try {
    const keyId = req.params.id;
    
    // Check if key exists
    const keyPair = homomorphicEncryption.getKeyPair(keyId);
    if (!keyPair) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Homomorphic encryption key pair with ID ${keyId} not found`
      });
    }
    
    // Delete key pair
    const deleted = homomorphicEncryption.deleteKeyPair(keyId);
    
    res.json({
      success: deleted,
      message: deleted 
        ? `Homomorphic encryption key pair with ID ${keyId} deleted successfully` 
        : `Failed to delete homomorphic encryption key pair with ID ${keyId}`
    });
  } catch (error) {
    console.error(`Error deleting homomorphic encryption key pair ${req.params.id}:`, error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error deleting homomorphic encryption key pair',
      data: {
        keyId: req.params.id,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete homomorphic encryption key pair'
    });
  }
});

/**
 * Encrypt data using homomorphic encryption
 * 
 * @route POST /api/security/homomorphic/encrypt/:keyId
 */
homomorphicRoutes.post('/encrypt/:keyId', (req, res) => {
  try {
    const keyId = req.params.keyId;
    const data = req.body.data;
    
    // Validate required fields
    if (data === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required field: data'
      });
    }
    
    // Check if key exists
    const keyPair = homomorphicEncryption.getKeyPair(keyId);
    if (!keyPair) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Homomorphic encryption key pair with ID ${keyId} not found`
      });
    }
    
    // Encrypt data
    const ciphertext = homomorphicEncryption.encrypt(data, keyId);
    
    res.json({
      success: true,
      message: 'Data encrypted successfully',
      data: ciphertext
    });
  } catch (error) {
    console.error(`Error encrypting data with homomorphic encryption key ${req.params.keyId}:`, error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error encrypting data with homomorphic encryption',
      data: {
        keyId: req.params.keyId,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to encrypt data'
    });
  }
});

/**
 * Decrypt homomorphically encrypted data
 * 
 * @route POST /api/security/homomorphic/decrypt
 */
homomorphicRoutes.post('/decrypt', (req, res) => {
  try {
    const ciphertext: HomomorphicCiphertext = req.body;
    
    // Validate required fields
    if (!ciphertext || !ciphertext.data || !ciphertext.publicKeyId || !ciphertext.originalType) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Invalid ciphertext format'
      });
    }
    
    // Decrypt data
    const plaintext = homomorphicEncryption.decrypt(ciphertext);
    
    res.json({
      success: true,
      message: 'Data decrypted successfully',
      data: plaintext
    });
  } catch (error) {
    console.error('Error decrypting homomorphically encrypted data:', error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error decrypting homomorphically encrypted data',
      data: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to decrypt data'
    });
  }
});

/**
 * Perform a homomorphic addition operation
 * 
 * @route POST /api/security/homomorphic/add
 */
homomorphicRoutes.post('/add', (req, res) => {
  try {
    const { ciphertext1, ciphertext2 } = req.body;
    
    // Validate required fields
    if (!ciphertext1 || !ciphertext2) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required fields: ciphertext1 and ciphertext2'
      });
    }
    
    // Perform addition
    const result = homomorphicEncryption.add(ciphertext1, ciphertext2);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Operation failed',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Homomorphic addition performed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error performing homomorphic addition:', error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error performing homomorphic addition',
      data: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to perform homomorphic addition'
    });
  }
});

/**
 * Perform a homomorphic multiplication operation
 * 
 * @route POST /api/security/homomorphic/multiply
 */
homomorphicRoutes.post('/multiply', (req, res) => {
  try {
    const { ciphertext1, ciphertext2 } = req.body;
    
    // Validate required fields
    if (!ciphertext1 || !ciphertext2) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required fields: ciphertext1 and ciphertext2'
      });
    }
    
    // Perform multiplication
    const result = homomorphicEncryption.multiply(ciphertext1, ciphertext2);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Operation failed',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Homomorphic multiplication performed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error performing homomorphic multiplication:', error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error performing homomorphic multiplication',
      data: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to perform homomorphic multiplication'
    });
  }
});

/**
 * Perform an arbitrary homomorphic operation
 * 
 * @route POST /api/security/homomorphic/compute
 */
homomorphicRoutes.post('/compute', (req, res) => {
  try {
    const { ciphertexts, operation } = req.body;
    
    // Validate required fields
    if (!ciphertexts || !Array.isArray(ciphertexts) || ciphertexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing or invalid required field: ciphertexts'
      });
    }
    
    if (!operation || typeof operation !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing or invalid required field: operation'
      });
    }
    
    // Perform arbitrary operation
    const result = homomorphicEncryption.compute(ciphertexts, operation);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Operation failed',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Arbitrary homomorphic operation performed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error performing arbitrary homomorphic operation:', error);
    
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTO,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error performing arbitrary homomorphic operation',
      data: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to perform arbitrary homomorphic operation'
    });
  }
});