/**
 * Quantum-Resistant Middleware
 * 
 * This middleware provides quantum-resistant protection for sensitive data in
 * HTTP requests and responses. It uses the quantum-resistant cryptography
 * module to encrypt sensitive data in transit and verify signatures.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as qrc from './QuantumResistantCrypto';
import { securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../blockchain/SecurityEventTypes';

// Define the quantum-resistant algorithm enum - matching our implementation
export enum QuantumResistantAlgorithm {
  KYBER = 'kyber',
  DILITHIUM = 'dilithium',
  SPHINCS = 'sphincs',
  NEWHOPE = 'newhope',
  FRODO = 'frodo',
  HYBRID_RSA_KYBER = 'hybrid_rsa_kyber',
  HYBRID_ECDSA_DILITHIUM = 'hybrid_ecdsa_dilithium'
}

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
  encryptionAlgorithm: QuantumResistantAlgorithm.KYBER,
  signatureAlgorithm: QuantumResistantAlgorithm.DILITHIUM
};

// Store key pairs for the middleware (in a real system, these would be stored securely)
let serverKeyPair: {
  publicKey: string;
  privateKey: string;
} | null = null;

/**
 * Generate a new key pair for the server
 */
async function generateServerKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  try {
    // Generate a new key pair for the server
    const generatedKeyPair = await qrc.generateKeyPair({
      algorithm: DEFAULT_CONFIG.encryptionAlgorithm as any,
      strength: 'high'
    });
    
    serverKeyPair = {
      publicKey: generatedKeyPair.publicKey,
      privateKey: generatedKeyPair.privateKey
    };
    
    // Log event to blockchain
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.INFO,
      message: 'Server Quantum-Resistant Key Pair Generated',
      timestamp: Date.now(),
      metadata: {
        algorithm: DEFAULT_CONFIG.encryptionAlgorithm,
        timestamp: new Date().toISOString()
      }
    });
    
    return serverKeyPair;
  } catch (error) {
    console.error('Error generating quantum-resistant key pair:', error);
    // Create a fallback key pair for development purposes
    const fallbackKeyPair = {
      publicKey: 'FALLBACK_PUBLIC_KEY_FOR_DEVELOPMENT',
      privateKey: 'FALLBACK_PRIVATE_KEY_FOR_DEVELOPMENT'
    };
    
    serverKeyPair = fallbackKeyPair;
    return fallbackKeyPair;
  }
}

/**
 * Get the server's public key
 */
export async function getServerPublicKey(): Promise<string> {
  if (!serverKeyPair) {
    await generateServerKeyPair();
  }
  
  return serverKeyPair!.publicKey;
}

/**
 * Create middleware for quantum-resistant protection
 */
export function createQuantumResistantMiddleware(
  config: Partial<QuantumResistantMiddlewareConfig> = {}
): RequestHandler {
  // Merge with default config
  const mergedConfig: QuantumResistantMiddlewareConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  
  // Ensure server key pair is generated (async)
  generateServerKeyPair().catch(console.error);
  
  // Log initialization (async)
  securityBlockchain.addSecurityEvent({
    category: SecurityEventCategory.CRYPTOGRAPHY,
    severity: SecurityEventSeverity.INFO,
    message: 'Quantum-Resistant Middleware Initialized',
    timestamp: Date.now(),
    metadata: {
      encryptResponses: mergedConfig.encryptResponses,
      verifyRequestSignatures: mergedConfig.verifyRequestSignatures,
      timestamp: new Date().toISOString()
    }
  }).catch(console.error);
  
  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if we should bypass protection in development mode
    if (mergedConfig.bypassInDevelopment && process.env.NODE_ENV === 'development') {
      next();
      return;
    }
    
    // Check if the path is exempt
    const path = req.path;
    if (mergedConfig.exemptPaths.some(exemptPath => path.startsWith(exemptPath))) {
      next();
      return;
    }
    
    // Check if the path should be protected
    const shouldProtect = mergedConfig.protectedPaths.some(protectedPath => 
      path.startsWith(protectedPath)
    );
    
    if (!shouldProtect) {
      next();
      return;
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
        
        try {
          // Verify the signature
          const verificationResult = await qrc.verify(
            dataToVerify,
            signatureHeader,
            clientPublicKey
          );
          
          if (!verificationResult.valid) {
            // Log invalid signature
            await securityBlockchain.addSecurityEvent({
              category: SecurityEventCategory.CRYPTOGRAPHY,
              severity: SecurityEventSeverity.WARNING,
              message: 'Invalid Quantum-Resistant Signature',
              timestamp: Date.now(),
              metadata: {
                path: req.path,
                method: req.method,
                reason: verificationResult.reason,
                timestamp: new Date().toISOString()
              }
            });
            
            return res.status(403).json({
              error: 'Invalid signature',
              message: 'The request signature failed validation'
            });
          }
          
          // Log successful verification
          await securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.CRYPTOGRAPHY,
            severity: SecurityEventSeverity.INFO,
            message: 'Quantum-Resistant Signature Verified',
            timestamp: Date.now(),
            metadata: {
              path: req.path,
              method: req.method,
              timestamp: new Date().toISOString()
            }
          });
        } catch (verifyError) {
          // Log verification error
          await securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.CRYPTOGRAPHY,
            severity: SecurityEventSeverity.ERROR,
            message: 'Signature Verification Error',
            timestamp: Date.now(),
            metadata: {
              path: req.path,
              method: req.method,
              error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
          });
          
          return res.status(400).json({
            error: 'Signature verification error',
            message: 'An error occurred while verifying the request signature'
          });
        }
      }
      
      // Modify the response.json method to encrypt sensitive fields if configured
      if (mergedConfig.encryptResponses && clientPublicKey) {
        const originalJson = res.json;
        
        res.json = function(body: any) {
          // Process the response body to encrypt sensitive fields
          processResponseBody(
            body,
            clientPublicKey,
            mergedConfig.sensitiveResponseFields,
            mergedConfig.encryptionAlgorithm
          ).then(processedBody => {
            // Add the server's public key to the response headers
            if (serverKeyPair) {
              res.setHeader('X-Quantum-Public-Key', serverKeyPair.publicKey);
            }
            
            // Call the original json method with the processed body
            return originalJson.call(this, processedBody);
          }).catch(error => {
            // Log encryption error but still send unencrypted response
            console.error('Error encrypting response:', error);
            securityBlockchain.addSecurityEvent({
              category: SecurityEventCategory.CRYPTOGRAPHY,
              severity: SecurityEventSeverity.ERROR,
              message: 'Response Encryption Error',
              timestamp: Date.now(),
              metadata: {
                path: req.path,
                method: req.method,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
              }
            }).catch(console.error);
            
            // Send original unencrypted body
            return originalJson.call(this, body);
          });
          
          // Return res for chaining
          return res;
        };
      }
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Log the error
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.CRYPTOGRAPHY,
        severity: SecurityEventSeverity.ERROR,
        message: 'Quantum-Resistant Middleware Error',
        timestamp: Date.now(),
        metadata: {
          path: req.path,
          method: req.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      }).catch(console.error);
      
      // Pass the error to the next middleware
      next(error);
    }
  };
}

/**
 * Process a response body to encrypt sensitive fields
 */
async function processResponseBody(
  body: any,
  clientPublicKey: string,
  sensitiveFields: string[],
  algorithm: QuantumResistantAlgorithm
): Promise<any> {
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
        try {
          // Encrypt the value
          const encryptionResult = await qrc.encrypt(value, clientPublicKey, {
            algorithm: algorithm as any
          });
          
          // Replace the original value with the encrypted one
          if (Array.isArray(result)) {
            result[parseInt(key)] = {
              __encrypted: true,
              algorithm,
              value: encryptionResult
            };
          } else {
            result[key] = {
              __encrypted: true,
              algorithm,
              value: encryptionResult
            };
          }
        } catch (error) {
          console.error(`Error encrypting field '${key}':`, error);
          // Keep the original value if encryption fails
        }
      }
      // If the value is an object or array, recursively process it
      else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(result)) {
          result[parseInt(key)] = await processResponseBody(value, clientPublicKey, sensitiveFields, algorithm);
        } else {
          result[key] = await processResponseBody(value, clientPublicKey, sensitiveFields, algorithm);
        }
      }
    }
  }
  
  return result;
}

/**
 * Create a middleware that provides the server's public key
 */
export function createPublicKeyEndpointMiddleware(): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      // Generate server key pair if needed
      if (!serverKeyPair) {
        await generateServerKeyPair();
      }
      
      // Return the server's public key
      res.json({
        publicKey: serverKeyPair!.publicKey,
        algorithm: DEFAULT_CONFIG.encryptionAlgorithm,
        signatureAlgorithm: DEFAULT_CONFIG.signatureAlgorithm
      });
    } catch (error) {
      console.error('Error in public key endpoint:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while retrieving the server public key'
      });
    }
  };
}

/**
 * Regenerate the server's key pair
 */
export async function regenerateServerKeyPair(): Promise<typeof serverKeyPair> {
  return await generateServerKeyPair();
}

// Initialize the server key pair
generateServerKeyPair().catch(console.error);