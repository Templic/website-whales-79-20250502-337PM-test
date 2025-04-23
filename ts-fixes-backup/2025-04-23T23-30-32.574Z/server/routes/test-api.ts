/**
 * Test API Routes
 * 
 * WARNING: These routes are for testing purposes only and have CSRF protection disabled.
 * These endpoints should NEVER be exposed in production.
 */

import express, { Request, Response } from 'express';
import * as qrc from '../security/advanced/quantum/QuantumResistantCrypto';
import { immutableSecurityLogs as securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';
import { bypassCsrfForTesting } from '../security/middleware/bypassCsrfForTesting';

// Create a router
const router = express.Router();

// Apply CSRF bypass middleware for all routes in this router
router.use(bypassCsrfForTesting());

/**
 * Test endpoint for quantum key generation
 */
router.post('/quantum/generate-keys', async (req: Request, res: Response) => {
  try {
    // Get key generation parameters
    const { algorithm = 'kyber', strength = 'high' } = req.body;
    
    // Generate key pair
    const keyPair = await qrc.generateKeyPair({
      algorithm,
      strength
    });
    
    // Log key generation to blockchain
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.INFO,
      message: 'Quantum-resistant key pair generated (TEST)',
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
        isTestEndpoint: true
      }
    });
    
    // Return key pair
    res.json({
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      isTestEndpoint: true
    });
  } catch (error: unknown) {
    console.error('Error in test quantum key generation endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate quantum-resistant key pair',
      isTestEndpoint: true
    });
  }
});

/**
 * Test endpoint for quantum encryption
 */
router.post('/quantum/encrypt', async (req: Request, res: Response) => {
  try {
    // Get encryption parameters
    const { data, publicKey, algorithm = 'kyber' } = req.body;
    
    // Validate parameters
    if (!data || !publicKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameters: data and publicKey',
        isTestEndpoint: true
      });
    }
    
    // Encrypt data
    const encrypted = await qrc.encrypt(data, publicKey, {
      algorithm
    });
    
    // Log encryption to blockchain
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.INFO,
      message: 'Data encrypted with quantum-resistant algorithm (TEST)',
      timestamp: Date.now(),
      metadata: {
        algorithm,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
        timestamp: new Date().toISOString(),
        isTestEndpoint: true
      }
    });
    
    // Return encrypted data
    res.json({
      encrypted,
      algorithm,
      isTestEndpoint: true
    });
  } catch (error: unknown) {
    console.error('Error in test quantum encryption endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to encrypt data',
      isTestEndpoint: true
    });
  }
});

/**
 * Test endpoint for quantum decryption
 */
router.post('/quantum/decrypt', async (req: Request, res: Response) => {
  try {
    // Get decryption parameters
    const { encrypted, privateKey, algorithm = 'kyber' } = req.body;
    
    // Validate parameters
    if (!encrypted || !privateKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameters: encrypted and privateKey',
        isTestEndpoint: true
      });
    }
    
    // Decrypt data
    const decrypted = await qrc.decrypt(encrypted, privateKey, {
      algorithm
    });
    
    // Log decryption to blockchain
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.INFO,
      message: 'Data decrypted with quantum-resistant algorithm (TEST)',
      timestamp: Date.now(),
      metadata: {
        algorithm,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
        isTestEndpoint: true
      }
    });
    
    // Return decrypted data
    res.json({
      decrypted,
      algorithm,
      isTestEndpoint: true
    });
  } catch (error: unknown) {
    console.error('Error in test quantum decryption endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to decrypt data',
      isTestEndpoint: true
    });
  }
});

export default router;