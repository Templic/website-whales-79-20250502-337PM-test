/**
 * Secure API Routes
 * 
 * This module provides secure API endpoints protected by our advanced security architecture,
 * including quantum-resistant cryptography, blockchain-based audit logging, and
 * input validation.
 */

import express, { Request, Response } from 'express';
import { immutableSecurityLogs as securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventTypes } from '../security/advanced/blockchain/SecurityEventTypes';
import * as qrc from '../security/advanced/quantum/QuantumResistantCrypto';

// Create a router
const router = express.Router();

/**
 * Get the server's security status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Log access to blockchain
    await securityBlockchain.addLog({
      type: SecurityEventTypes.API_REQUEST,
      details: {
        message: 'Security status accessed',
        timestamp: Date.now(),
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        timestamp_iso: new Date().toISOString()
      }
    });
    
    // Return security status
    res.json({
      status: 'active',
      version: '2.0.0',
      quantumProtectionEnabled: true,
      blockchainLoggingEnabled: true,
      timestamp: new Date().toISOString(),
      components: {
        quantumResistantCrypto: 'active',
        blockchainLogging: 'active',
        anomalyDetection: 'active',
        inputValidation: 'active',
        apiSecurity: 'active'
      }
    });
  } catch (error) {
    console.error('Error in security status endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve security status'
    });
  }
});

/**
 * Get information about the security architecture
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    // Return security architecture information
    res.json({
      name: 'Advanced Security Architecture',
      description: 'A comprehensive security framework that provides protection against conventional and quantum threats',
      features: [
        'Quantum-resistant cryptography',
        'Blockchain-based immutable audit logging',
        'Machine learning-based anomaly detection',
        'Runtime Application Self-Protection (RASP)',
        'API security and input validation',
        'Security fabric for inter-component communication'
      ],
      quantumAlgorithms: [
        { name: 'Kyber', type: 'Key Exchange' },
        { name: 'Dilithium', type: 'Digital Signature' },
        { name: 'SPHINCS+', type: 'Digital Signature' },
        { name: 'NewHope', type: 'Key Exchange' },
        { name: 'FrodoKEM', type: 'Key Exchange' }
      ],
      blockchainFeatures: [
        'Immutable event storage',
        'Cryptographic proof of integrity',
        'Distributed verification',
        'Tamper-evident logging'
      ]
    });
  } catch (error) {
    console.error('Error in security info endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve security information'
    });
  }
});

/**
 * Generate a quantum-resistant key pair
 */
router.post('/generate-keys', async (req: Request, res: Response) => {
  try {
    // Get key generation parameters
    const { algorithm = 'kyber', strength = 'high' } = req.body;
    
    // Generate key pair
    const keyPair = await qrc.generateKeyPair({
      algorithm,
      strength
    });
    
    // Log key generation to blockchain
    await securityBlockchain.addLog({
      type: SecurityEventTypes.QUANTUM_RESISTANT_KEY_GENERATED,
      details: {
        message: 'Quantum-resistant key pair generated',
        algorithm,
        strength,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    });
    
    // Return key pair
    res.json({
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    });
  } catch (error) {
    console.error('Error generating quantum-resistant key pair:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate quantum-resistant key pair'
    });
  }
});

/**
 * Encrypt data using quantum-resistant algorithm
 */
router.post('/encrypt', async (req: Request, res: Response) => {
  try {
    // Get encryption parameters
    const { data, publicKey, algorithm = 'kyber' } = req.body;
    
    // Validate parameters
    if (!data || !publicKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameters: data and publicKey'
      });
    }
    
    // Encrypt data
    const encrypted = await qrc.encrypt(data, publicKey, {
      algorithm
    });
    
    // Log encryption to blockchain
    await securityBlockchain.addLog({
      type: SecurityEventTypes.HOMOMORPHIC_ENCRYPTION_OPERATION,
      details: {
        message: 'Data encrypted with quantum-resistant algorithm',
        algorithm,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
        timestamp: new Date().toISOString()
      }
    });
    
    // Return encrypted data
    res.json({
      encrypted,
      algorithm
    });
  } catch (error) {
    console.error('Error encrypting data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to encrypt data'
    });
  }
});

/**
 * Decrypt data using quantum-resistant algorithm
 */
router.post('/decrypt', async (req: Request, res: Response) => {
  try {
    // Get decryption parameters
    const { encrypted, privateKey, algorithm = 'kyber' } = req.body;
    
    // Validate parameters
    if (!encrypted || !privateKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameters: encrypted and privateKey'
      });
    }
    
    // Decrypt data
    const decrypted = await qrc.decrypt(encrypted, privateKey, {
      algorithm
    });
    
    // Log decryption to blockchain
    await securityBlockchain.addLog({
      type: SecurityEventTypes.HOMOMORPHIC_ENCRYPTION_OPERATION,
      details: {
        message: 'Data decrypted with quantum-resistant algorithm',
        algorithm,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    });
    
    // Return decrypted data
    res.json({
      decrypted,
      algorithm
    });
  } catch (error) {
    console.error('Error decrypting data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to decrypt data'
    });
  }
});

/**
 * Sign data using quantum-resistant algorithm
 */
router.post('/sign', async (req: Request, res: Response) => {
  try {
    // Get signing parameters
    const { data, privateKey, algorithm = 'dilithium' } = req.body;
    
    // Validate parameters
    if (!data || !privateKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameters: data and privateKey'
      });
    }
    
    // Sign data
    const signature = await qrc.sign(data, privateKey, {
      algorithm
    });
    
    // Log signing to blockchain
    await securityBlockchain.addLog({
      type: SecurityEventTypes.QUANTUM_RESISTANT_SIGNATURE_GENERATED,
      details: {
        message: 'Data signed with quantum-resistant algorithm',
        algorithm,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
        timestamp: new Date().toISOString()
      }
    });
    
    // Return signature
    res.json({
      signature,
      algorithm
    });
  } catch (error) {
    console.error('Error signing data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sign data'
    });
  }
});

/**
 * Verify signature using quantum-resistant algorithm
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    // Get verification parameters
    const { data, signature, publicKey, algorithm = 'dilithium' } = req.body;
    
    // Validate parameters
    if (!data || !signature || !publicKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameters: data, signature, and publicKey'
      });
    }
    
    // Verify signature
    const result = await qrc.verify(data, signature, publicKey, {
      algorithm
    });
    
    // Log verification to blockchain
    await securityBlockchain.addLog({
      type: SecurityEventTypes.QUANTUM_RESISTANT_SIGNATURE_VERIFIED,
      details: {
        message: `Signature verification ${result.valid ? 'succeeded' : 'failed'}`,
        algorithm,
        valid: result.valid,
        reason: result.reason,
        user: req.user?.id || 'anonymous',
        ip: req.ip || req.connection.remoteAddress,
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
        timestamp: new Date().toISOString()
      }
    });
    
    // Return verification result
    res.json({
      valid: result.valid,
      reason: result.reason,
      algorithm
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify signature'
    });
  }
});

// Export the router
export default router;