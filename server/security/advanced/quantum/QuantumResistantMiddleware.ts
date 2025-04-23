/**
 * Quantum-Resistant Middleware
 * 
 * This middleware provides quantum-resistant protection for sensitive data in
 * HTTP requests and responses. It uses the quantum-resistant cryptography
 * module to encrypt sensitive data in transit and verify signatures.
 */

import { Request, Response, NextFunction } from 'express';
import { quantumResistantCrypto, QuantumResistantAlgorithm } from './QuantumResistantCrypto';
import { logSecurityEvent } from '../../security';
import { SecurityEventSeverity, SecurityEventCategory } from '../blockchain/SecurityEventTypes';

/**
 * Configuration for quantum-resistant middleware
 */
export interface QuantumResistantMiddlewareConfig {
  /**
   * Whether to encrypt response data
   */
  encryptResponses: boolean;
  
  /**
   * Whether to verify request signatures
   */
  verifyRequestSignatures: boolean;
  
  /**
   * List of paths that should be protected
   */
  protectedPaths: string[];
  
  /**
   * List of paths that should be exempt from protection
   */
  exemptPaths: string[];
  
  /**
   * Whether to bypass protection in development mode
   */
  bypassInDevelopment: boolean;
  
  /**
   * Fields that should be protected in responses
   */
  sensitiveResponseFields: string[];
  
  /**
   * Algorithm to use for encryption
   */
  encryptionAlgorithm: QuantumResistantAlgorithm;
  
  /**
   * Algorithm to use for signatures
   */
  signatureAlgorithm: QuantumResistantAlgorithm;
}

// Default configuration
const DEFAULT_CONFIG: QuantumResistantMiddlewareConfig = {
  encryptResponses: false, // Disabled by default as it requires client support
  verifyRequestSignatures: false, // Disabled by default as it requires client support
  protectedPaths: [
    '/api/user',
    '/api/auth',
    '/api/security',
    '/api/payment',
    '/api/admin'
  ],
  exemptPaths: [
    '/api/health',
    '/api/public'
  ],
  bypassInDevelopment: true,
  sensitiveResponseFields: [
    'password',
    'token',
    'key',
    'secret',
    'ssn',
    'creditCard',
    'bankAccount'
  ],
  encryptionAlgorithm: QuantumResistantAlgorithm.HYBRID_RSA_KYBER,
  signatureAlgorithm: QuantumResistantAlgorithm.HYBRID_ECDSA_DILITHIUM
};

// Store key pairs for the middleware (in a real system, these would be stored securely)
let serverKeyPair: {
  publicKey: string;
  privateKey: string;
} | null = null;

/**
 * Generate a new key pair for the server
 */
function generateServerKeyPair() {
  // Generate a new key pair for the server
  serverKeyPair = quantumResistantCrypto.generateKeyPair({
    algorithm: DEFAULT_CONFIG.encryptionAlgorithm,
    keyType: 'ENCRYPTION' as any
  });
  
  logSecurityEvent({
    severity: SecurityEventSeverity.INFO,
    category: SecurityEventCategory.QUANTUM_CRYPTO,
    title: 'Server Quantum-Resistant Key Pair Generated',
    description: `Generated a new server key pair for quantum-resistant encryption`
  });
  
  return serverKeyPair;
}

/**
 * Get the server's public key
 */
export function getServerPublicKey(): string {
  if (!serverKeyPair) {
    generateServerKeyPair();
  }
  
  return serverKeyPair!.publicKey;
}

/**
 * Create middleware for quantum-resistant protection
 */
export function createQuantumResistantMiddleware(
  config: Partial<QuantumResistantMiddlewareConfig> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  // Merge with default config
  const mergedConfig: QuantumResistantMiddlewareConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  
  // Generate server key pair if needed
  if (!serverKeyPair) {
    generateServerKeyPair();
  }
  
  // Log initialization
  logSecurityEvent({
    severity: SecurityEventSeverity.INFO,
    category: SecurityEventCategory.QUANTUM_CRYPTO,
    title: 'Quantum-Resistant Middleware Initialized',
    description: `Initialized with configuration: encryptResponses=${mergedConfig.encryptResponses}, verifyRequestSignatures=${mergedConfig.verifyRequestSignatures}`
  });
  
  // Return the middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if we should bypass protection in development mode
    if (mergedConfig.bypassInDevelopment && process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Check if the path is exempt
    const path = req.path;
    if (mergedConfig.exemptPaths.some(exemptPath => path.startsWith(exemptPath))) {
      return next();
    }
    
    // Check if the path should be protected
    const shouldProtect = mergedConfig.protectedPaths.some(protectedPath => 
      path.startsWith(protectedPath)
    );
    
    if (!shouldProtect) {
      return next();
    }
    
    // Process the request
    try {
      // Extract the quantum header if present
      const clientPublicKey = req.headers['x-quantum-public-key'] as string;
      const signatureHeader = req.headers['x-quantum-signature'] as string;
      
      // Verify request signature if enabled and signature is present
      if (mergedConfig.verifyRequestSignatures && signatureHeader && clientPublicKey) {
        // Reconstruct the data that was signed (path + body)
        const dataToVerify = `${req.method}:${req.path}:${JSON.stringify(req.body)}`;
        
        // Verify the signature
        const isValid = quantumResistantCrypto.verify(
          dataToVerify,
          signatureHeader,
          clientPublicKey
        );
        
        if (!isValid) {
          logSecurityEvent({
            severity: SecurityEventSeverity.HIGH,
            category: SecurityEventCategory.QUANTUM_CRYPTO,
            title: 'Invalid Quantum-Resistant Signature',
            description: `Invalid signature for request to ${req.path}`
          });
          
          return res.status(403).json({
            error: 'Invalid signature',
            message: 'The request signature failed validation'
          });
        }
        
        // Log successful verification
        logSecurityEvent({
          severity: SecurityEventSeverity.INFO,
          category: SecurityEventCategory.QUANTUM_CRYPTO,
          title: 'Quantum-Resistant Signature Verified',
          description: `Verified signature for request to ${req.path}`
        });
      }
      
      // Modify the response.json method to encrypt sensitive fields if configured
      if (mergedConfig.encryptResponses && clientPublicKey) {
        const originalJson = res.json;
        
        res.json = function(body: any) {
          // Process the response body to encrypt sensitive fields
          const processedBody = processResponseBody(
            body,
            clientPublicKey,
            mergedConfig.sensitiveResponseFields,
            mergedConfig.encryptionAlgorithm
          );
          
          // Add the server's public key to the response headers
          res.setHeader('X-Quantum-Public-Key', serverKeyPair!.publicKey);
          
          // Call the original json method with the processed body
          return originalJson.call(this, processedBody);
        };
      }
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Log the error
      logSecurityEvent({
        severity: SecurityEventSeverity.ERROR,
        category: SecurityEventCategory.QUANTUM_CRYPTO,
        title: 'Quantum-Resistant Middleware Error',
        description: `Error in quantum-resistant middleware: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      // Pass the error to the next middleware
      next(error);
    }
  };
}

/**
 * Process a response body to encrypt sensitive fields
 */
function processResponseBody(
  body: any,
  clientPublicKey: string,
  sensitiveFields: string[],
  algorithm: QuantumResistantAlgorithm
): any {
  // If body is not an object, return it as is
  if (typeof body !== 'object' || body === null) {
    return body;
  }
  
  // Create a copy of the body
  const result = Array.isArray(body) ? [...body] : { ...body };
  
  // Process each key in the body
  for (const key in body) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const value = body[key];
      
      // If the key is a sensitive field and the value is a string, encrypt it
      if (sensitiveFields.includes(key) && typeof value === 'string') {
        // Encrypt the value
        const encryptedValue = quantumResistantCrypto.encrypt(value, clientPublicKey);
        
        // Replace the original value with the encrypted one
        if (Array.isArray(result)) {
          result[parseInt(key)] = {
            __encrypted: true,
            algorithm,
            value: encryptedValue
          };
        } else {
          result[key] = {
            __encrypted: true,
            algorithm,
            value: encryptedValue
          };
        }
      }
      // If the value is an object or array, recursively process it
      else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(result)) {
          result[parseInt(key)] = processResponseBody(value, clientPublicKey, sensitiveFields, algorithm);
        } else {
          result[key] = processResponseBody(value, clientPublicKey, sensitiveFields, algorithm);
        }
      }
    }
  }
  
  return result;
}

/**
 * Create a middleware that provides the server's public key
 */
export function createPublicKeyEndpointMiddleware() {
  return (req: Request, res: Response) => {
    // Generate server key pair if needed
    if (!serverKeyPair) {
      generateServerKeyPair();
    }
    
    // Return the server's public key
    res.json({
      publicKey: serverKeyPair!.publicKey,
      algorithm: DEFAULT_CONFIG.encryptionAlgorithm,
      signatureAlgorithm: DEFAULT_CONFIG.signatureAlgorithm
    });
  };
}

/**
 * Regenerate the server's key pair
 */
export function regenerateServerKeyPair(): typeof serverKeyPair {
  return generateServerKeyPair();
}

// Make sure we have a server key pair
generateServerKeyPair();