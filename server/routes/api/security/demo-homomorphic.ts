/**
 * Homomorphic Encryption Demo API Routes
 * 
 * This file contains API routes for demonstrating homomorphic encryption functionality
 * without requiring authentication.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { homomorphicEncryption, HomomorphicConfig, HomomorphicCiphertext } from '../../../security/advanced/homomorphic/HomomorphicEncryptionBridge';
import { logSecurityEvent } from '../../../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../../../security/advanced/SecurityFabric';

export const demoHomomorphicRoutes = Router();

// Log all demo route access for security auditing
demoHomomorphicRoutes.use('/', (req: Request, res: Response, next: NextFunction) => {
  logSecurityEvent({
    category: SecurityEventCategory.ACCESS_CONTROL,
    severity: SecurityEventSeverity.INFO,
    message: 'Demo homomorphic encryption route accessed',
    data: {
      route: req.path,
      method: req.method,
      ip: req.ip
    }
  });
  
  next();
});

/**
 * Generate a new homomorphic encryption key pair
 * 
 * @route POST /api/security/demo/homomorphic/keys/generate
 */
demoHomomorphicRoutes.post('/keys/generate', (req: Request, res: Response) => {
  try {
    const config: Partial<HomomorphicConfig> = req.body;
    
    // Generate a new key pair
    const keyPair = homomorphicEncryption.generateKeyPair(config);
    
    res.json({
      success: true,
      data: keyPair
    });
  } catch (error) {
    console.error('Error generating homomorphic key pair:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate homomorphic key pair'
    });
  }
});

/**
 * Get all homomorphic encryption key pairs
 * 
 * @route GET /api/security/demo/homomorphic/keys
 */
demoHomomorphicRoutes.get('/keys', (req: Request, res: Response) => {
  try {
    // Get all key pairs
    const keyPairs = homomorphicEncryption.listKeyPairs();
    
    res.json({
      success: true,
      data: keyPairs
    });
  } catch (error) {
    console.error('Error getting homomorphic key pairs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get homomorphic key pairs'
    });
  }
});

/**
 * Delete a homomorphic encryption key pair
 * 
 * @route DELETE /api/security/demo/homomorphic/keys/:id
 */
demoHomomorphicRoutes.delete('/keys/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete the key pair
    const success = homomorphicEncryption.deleteKeyPair(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Homomorphic key pair deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Homomorphic key pair not found'
      });
    }
  } catch (error) {
    console.error('Error deleting homomorphic key pair:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete homomorphic key pair'
    });
  }
});

/**
 * Encrypt data using homomorphic encryption
 * 
 * @route POST /api/security/demo/homomorphic/encrypt/:keyId
 */
demoHomomorphicRoutes.post('/encrypt/:keyId', (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { data } = req.body;
    
    // Encrypt the data
    const ciphertext = homomorphicEncryption.encrypt(data, keyId);
    
    res.json({
      success: true,
      data: ciphertext
    });
  } catch (error) {
    console.error('Error encrypting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt data'
    });
  }
});

/**
 * Decrypt homomorphically encrypted data
 * 
 * @route POST /api/security/demo/homomorphic/decrypt
 */
demoHomomorphicRoutes.post('/decrypt', (req: Request, res: Response) => {
  try {
    const ciphertext: HomomorphicCiphertext = req.body;
    
    // Decrypt the data
    const decrypted = homomorphicEncryption.decrypt(ciphertext);
    
    res.json({
      success: true,
      data: decrypted
    });
  } catch (error) {
    console.error('Error decrypting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decrypt data'
    });
  }
});

/**
 * Perform a homomorphic addition operation
 * 
 * @route POST /api/security/demo/homomorphic/add
 */
demoHomomorphicRoutes.post('/add', (req: Request, res: Response) => {
  try {
    const { ciphertext1, ciphertext2 } = req.body;
    
    // Perform addition
    const result = homomorphicEncryption.add(ciphertext1, ciphertext2);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error performing homomorphic addition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform homomorphic addition'
    });
  }
});

/**
 * Perform a homomorphic multiplication operation
 * 
 * @route POST /api/security/demo/homomorphic/multiply
 */
demoHomomorphicRoutes.post('/multiply', (req: Request, res: Response) => {
  try {
    const { ciphertext1, ciphertext2 } = req.body;
    
    // Perform multiplication
    const result = homomorphicEncryption.multiply(ciphertext1, ciphertext2);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error performing homomorphic multiplication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform homomorphic multiplication'
    });
  }
});

/**
 * Perform an arbitrary homomorphic operation
 * 
 * @route POST /api/security/demo/homomorphic/compute
 */
demoHomomorphicRoutes.post('/compute', (req: Request, res: Response) => {
  try {
    const { ciphertexts, operation } = req.body;
    
    // Perform computation
    const result = homomorphicEncryption.compute(ciphertexts, operation);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error performing homomorphic computation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform homomorphic computation'
    });
  }
});