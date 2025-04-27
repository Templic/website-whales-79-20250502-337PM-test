/**
 * Standalone Homomorphic Encryption Demo API Server
 * 
 * This server runs independently of the main application
 * to provide API endpoints for demonstrating homomorphic encryption
 * without authentication.
 */

import express from 'express';
import cors from 'cors';
// Import or define types for the demo
import { homomorphicEncryption } from './security/advanced/homomorphic/HomomorphicEncryptionBridge';
import { logSecurityEvent } from './security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from './security/advanced/SecurityFabric';

// Define types for homomorphic encryption
interface HomomorphicConfig {
  securityLevel: 'normal' | 'high';
  operationType: 'additive' | 'multiplicative' | 'both';
}

interface HomomorphicKey {
  id: string;
  publicKey: string;
  privateKey: string;
  config: HomomorphicConfig;
}

interface HomomorphicCiphertext {
  data: any;
  keyId: string;
  encoding: string;
}

// Create Express app
const app = express();

// Enable JSON body parsing
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Create API router
const router = express.Router();

// Log all route access
router.use((req, res, next) => {
  console.log(`[DEMO API] ${req.method} ${req.path}`);
  logSecurityEvent({
    category: SecurityEventCategory.API_SECURITY,
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
 * @route POST /keys/generate
 */
router.post('/keys/generate', (req, res) => {
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
 * @route GET /keys
 */
router.get('/keys', (req, res) => {
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
 * @route DELETE /keys/:id
 */
router.delete('/keys/:id', (req, res) => {
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
 * @route POST /encrypt/:keyId
 */
router.post('/encrypt/:keyId', (req, res) => {
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
 * @route POST /decrypt
 */
router.post('/decrypt', (req, res) => {
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
 * @route POST /add
 */
router.post('/add', (req, res) => {
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
 * @route POST /multiply
 */
router.post('/multiply', (req, res) => {
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
 * @route POST /compute
 */
router.post('/compute', (req, res) => {
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

// Mount the router at /api
app.use('/api/homomorphic', router);

// Add static file serving for demo HTML
app.use(express.static('public'));

// Server port
const PORT = process.env.DEMO_PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Homomorphic Encryption Demo API Server running on port ${PORT}`);
});