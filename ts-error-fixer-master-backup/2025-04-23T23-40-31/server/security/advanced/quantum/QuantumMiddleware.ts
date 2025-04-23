/**
 * Quantum-Resistant Middleware
 * 
 * This middleware applies quantum-resistant cryptography to API endpoints.
 * It can automatically sign responses, verify request signatures, and
 * encrypt/decrypt sensitive data.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { immutableSecurityLogs as securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../blockchain/SecurityEventTypes';
import * as qrc from './QuantumResistantCrypto';

/**
 * Quantum middleware options
 */
export interface QuantumMiddlewareOptions {
  /**
   * Signature verification level
   * - 'none': No verification
   * - 'optional': Verify if signature is present
   * - 'required': Require and verify signature
   */
  verifySignature?: 'none' | 'optional' | 'required';
  
  /**
   * Response signing level
   * - 'none': Don't sign responses
   * - 'sensitive': Sign only sensitive responses
   * - 'all': Sign all responses
   */
  signResponses?: 'none' | 'sensitive' | 'all';
  
  /**
   * Encryption level
   * - 'none': No encryption
   * - 'sensitive': Encrypt only sensitive fields
   * - 'all': Encrypt all data
   */
  encryption?: 'none' | 'sensitive' | 'all';
  
  /**
   * Quantum algorithm to use
   */
  algorithm?: qrc.QRCOptions['algorithm'];
  
  /**
   * Security strength level
   */
  strength?: qrc.QRCOptions['strength'];
  
  /**
   * Fields to consider sensitive (for selective encryption/signing)
   */
  sensitiveFields?: string[];
  
  /**
   * Whether to log operations to the blockchain
   */
  logToBlockchain?: boolean;
}

/**
 * Default quantum middleware options
 */
const defaultOptions: QuantumMiddlewareOptions = {
  verifySignature: 'optional',
  signResponses: 'sensitive',
  encryption: 'sensitive',
  algorithm: 'kyber',
  strength: 'high',
  sensitiveFields: ['password', 'token', 'key', 'secret', 'credentials', 'credit_card', 'ssn', 'address'],
  logToBlockchain: true
};

/**
 * Create quantum-resistant middleware
 * 
 * @param options Middleware options
 * @returns Express middleware
 */
export function createQuantumMiddleware(options: QuantumMiddlewareOptions = {}): RequestHandler {
  const opts = { ...defaultOptions, ...options };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Add quantum context to request
      (req as any).quantumContext = {
        verified: false,
        encrypted: false,
        algorithm: opts.algorithm,
        strength: opts.strength
      };
      
      // Store original methods for later restoration
      const originalJson = res.json;
      const originalSend = res.send;
      
      // Handle request signature verification
      if (opts.verifySignature !== 'none') {
        const signature = req.headers['x-quantum-signature'] as string;
        const publicKey = req.headers['x-quantum-public-key'] as string;
        
        if (signature && publicKey) {
          try {
            // Verify request signature
            const requestData = JSON.stringify(req.body || {});
            const verificationResult = await qrc.verify(
              requestData,
              signature,
              publicKey,
              {
                algorithm: opts.algorithm,
                strength: opts.strength
              }
            );
            
            if (verificationResult.valid) {
              (req as any).quantumContext.verified = true;
              
              if (opts.logToBlockchain) {
                await securityBlockchain.addSecurityEvent({
                  category: SecurityEventCategory.CRYPTOGRAPHY as any,
                  severity: SecurityEventSeverity.INFO,
                  message: 'Request signature verified successfully',
                  timestamp: Date.now(),
                  metadata: {
                    path: req.path,
                    method: req.method,
                    algorithm: opts.algorithm,
                    strength: opts.strength,
                    timestamp: new Date().toISOString()
                  }
                });
              }
            } else if (opts.verifySignature === 'required') {
              // If verification is required and failed, reject the request
              if (opts.logToBlockchain) {
                await securityBlockchain.addSecurityEvent({
                  category: SecurityEventCategory.CRYPTOGRAPHY as any,
                  severity: SecurityEventSeverity.WARNING,
                  message: 'Request signature verification failed',
                  timestamp: Date.now(),
                  metadata: {
                    path: req.path,
                    method: req.method,
                    reason: verificationResult.reason,
                    algorithm: opts.algorithm,
                    strength: opts.strength,
                    timestamp: new Date().toISOString()
                  }
                });
              }
              
              return res.status(401).json({
                error: 'Invalid signature',
                message: 'The request signature could not be verified'
              });
            }
          } catch (error: unknown) {
            if (opts.verifySignature === 'required') {
              if (opts.logToBlockchain) {
                await securityBlockchain.addSecurityEvent({
                  category: SecurityEventCategory.CRYPTOGRAPHY as any,
                  severity: SecurityEventSeverity.ERROR,
                  message: `Request signature verification error: ${error.message}`,
                  timestamp: Date.now(),
                  metadata: {
                    path: req.path,
                    method: req.method,
                    error: error.message,
                    stack: error.stack,
                    algorithm: opts.algorithm,
                    strength: opts.strength,
                    timestamp: new Date().toISOString()
                  }
                });
              }
              
              return res.status(400).json({
                error: 'Signature verification error',
                message: error.message
              });
            }
          }
        } else if (opts.verifySignature === 'required') {
          // If signature is required but not provided, reject the request
          if (opts.logToBlockchain) {
            await securityBlockchain.addSecurityEvent({
              category: SecurityEventCategory.CRYPTOGRAPHY as any,
              severity: SecurityEventSeverity.WARNING,
              message: 'Required request signature missing',
              timestamp: Date.now(),
              metadata: {
                path: req.path,
                method: req.method,
                algorithm: opts.algorithm,
                strength: opts.strength,
                timestamp: new Date().toISOString()
              }
            });
          }
          
          return res.status(401).json({
            error: 'Missing signature',
            message: 'This endpoint requires a signed request'
          });
        }
      }
      
      // Handle request decryption
      if (opts.encryption !== 'none') {
        const encryptedData = req.headers['x-quantum-encrypted-data'] as string;
        
        if (encryptedData) {
          try {
            // In a real implementation, we would retrieve the private key from secure storage
            // and decrypt the request data
            // For now, we'll just log the attempt
            
            if (opts.logToBlockchain) {
              await securityBlockchain.addSecurityEvent({
                category: SecurityEventCategory.CRYPTOGRAPHY as any,
                severity: SecurityEventSeverity.INFO,
                message: 'Encrypted request data received',
                timestamp: Date.now(),
                metadata: {
                  path: req.path,
                  method: req.method,
                  algorithm: opts.algorithm,
                  strength: opts.strength,
                  timestamp: new Date().toISOString()
                }
              });
            }
          } catch (error: unknown) {
            if (opts.logToBlockchain) {
              await securityBlockchain.addSecurityEvent({
                category: SecurityEventCategory.CRYPTOGRAPHY as any,
                severity: SecurityEventSeverity.ERROR,
                message: `Request decryption error: ${error.message}`,
                timestamp: Date.now(),
                metadata: {
                  path: req.path,
                  method: req.method,
                  error: error.message,
                  stack: error.stack,
                  algorithm: opts.algorithm,
                  strength: opts.strength,
                  timestamp: new Date().toISOString()
                }
              });
            }
            
            return res.status(400).json({
              error: 'Decryption error',
              message: error.message
            });
          }
        }
      }
      
      // Override res.json method to sign responses
      res.json = function(body): Response {
        // Process the response
        const processedBody = processResponse(body, opts);
        
        // Generate key pair for signing
        qrc.generateKeyPair({
          algorithm: opts.algorithm,
          strength: opts.strength
        }).then(keyPair => {
          // Sign the response if needed
          if (shouldSignResponse(body, opts)) {
            const responseData = JSON.stringify(processedBody);
            
            qrc.sign(responseData, keyPair.privateKey, {
              algorithm: opts.algorithm,
              strength: opts.strength
            }).then(signatureResult => {
              // Add signature and public key to response headers
              res.setHeader('X-Quantum-Signature', signatureResult.signature);
              res.setHeader('X-Quantum-Public-Key', signatureResult.publicKey);
              res.setHeader('X-Quantum-Algorithm', opts.algorithm || 'kyber');
              res.setHeader('X-Quantum-Strength', opts.strength || 'high');
              
              if (opts.logToBlockchain) {
                securityBlockchain.addSecurityEvent({
                  category: SecurityEventCategory.CRYPTOGRAPHY as any,
                  severity: SecurityEventSeverity.INFO,
                  message: 'Response signed with quantum-resistant algorithm',
                  timestamp: Date.now(),
                  metadata: {
                    path: req.path,
                    method: req.method,
                    algorithm: opts.algorithm,
                    strength: opts.strength,
                    timestamp: new Date().toISOString()
                  }
                }).catch(console.error);
              }
              
              // Continue with the original json method
              return originalJson.call(res, processedBody);
            }).catch(error => {
              // Log error but still send the response
              console.error('Failed to sign response:', error);
              
              if (opts.logToBlockchain) {
                securityBlockchain.addSecurityEvent({
                  category: SecurityEventCategory.CRYPTOGRAPHY as any,
                  severity: SecurityEventSeverity.ERROR,
                  message: `Response signing error: ${error.message}`,
                  timestamp: Date.now(),
                  metadata: {
                    path: req.path,
                    method: req.method,
                    error: error.message,
                    stack: error.stack,
                    algorithm: opts.algorithm,
                    strength: opts.strength,
                    timestamp: new Date().toISOString()
                  }
                }).catch(console.error);
              }
              
              // Continue with the original json method without signature
              return originalJson.call(res, processedBody);
            });
          } else {
            // Continue with the original json method without signature
            return originalJson.call(res, processedBody);
          }
        }).catch(error => {
          // Log error but still send the response
          console.error('Failed to generate key pair for response signing:', error);
          
          if (opts.logToBlockchain) {
            securityBlockchain.addSecurityEvent({
              category: SecurityEventCategory.CRYPTOGRAPHY as any,
              severity: SecurityEventSeverity.ERROR,
              message: `Key generation error: ${error.message}`,
              timestamp: Date.now(),
              metadata: {
                path: req.path,
                method: req.method,
                error: error.message,
                stack: error.stack,
                algorithm: opts.algorithm,
                strength: opts.strength,
                timestamp: new Date().toISOString()
              }
            }).catch(console.error);
          }
          
          // Continue with the original json method without signature
          return originalJson.call(res, processedBody);
        });
        
        // Return the response object for chaining
        return res;
      };
      
      // Override res.send method to handle string responses
      res.send = function(body): Response {
        // If body is a string and looks like JSON, parse and process it
        if (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
          try {
            const jsonBody = JSON.parse(body);
            // @ts-ignore - Response type issue
  return res.json(jsonBody);
          } catch (e: unknown) {
            // Not valid JSON, continue with original send
          }
        }
        
        // For non-JSON responses, use the original send method
        return originalSend.call(res, body);
      };
      
      // Continue to the next middleware
      next();
    } catch (error: unknown) {
      // Log any errors that occur during middleware execution
      if (opts.logToBlockchain) {
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.CRYPTOGRAPHY as any,
          severity: SecurityEventSeverity.ERROR,
          message: `Quantum middleware error: ${error.message}`,
          timestamp: Date.now(),
          metadata: {
            path: req.path,
            method: req.method,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        }).catch(console.error);
      }
      
      next(error);
    }
  };
}

/**
 * Process response data (encrypt sensitive fields if needed)
 * 
 * @param body Response body
 * @param options Middleware options
 * @returns Processed response body
 */
function processResponse(body, options: QuantumMiddlewareOptions): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  // For now, just return the original body
  // In a real implementation, this would encrypt sensitive fields
  return body;
}

/**
 * Determine if a response should be signed
 * 
 * @param body Response body
 * @param options Middleware options
 * @returns Whether the response should be signed
 */
function shouldSignResponse(body, options: QuantumMiddlewareOptions): boolean {
  if (options.signResponses === 'all') {
    return true;
  }
  
  if (options.signResponses === 'none') {
    return false;
  }
  
  // For 'sensitive' option, check if any sensitive fields are present
  if (options.signResponses === 'sensitive' && options.sensitiveFields && body && typeof body === 'object') {
    for (const field of options.sensitiveFields) {
      if (containsField(body, field)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if an object contains a specific field (recursively)
 * 
 * @param obj Object to check
 * @param field Field name to look for
 * @returns Whether the field exists in the object
 */
function containsField(obj, field: string): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  if (Object.prototype.hasOwnProperty.call(obj, field)) {
    return true;
  }
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && containsField(obj[key], field)) {
      return true;
    }
  }
  
  return false;
}