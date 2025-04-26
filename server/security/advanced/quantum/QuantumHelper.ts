/**
 * Quantum-Resistant Cryptography Helper
 * 
 * This module provides high-level helpers for using quantum-resistant cryptography
 * in applications without dealing with the low-level details.
 */

import * as qrc from './QuantumResistantCrypto';
import { immutableSecurityLogs as securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../blockchain/SecurityEventTypes';

// Store key pairs for different security levels
const keyPairCache: Record<string, {
  keyPair: qrc.KeyPair;
  timestamp: number;
}> = {};

// Key cache expiration time (24 hours)
const KEY_CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Get or generate a key pair for the specified security level
 * 
 * @param algorithm Algorithm to use
 * @param strength Security strength level
 * @returns Promise resolving to key pair
 */
export async function getKeyPair(
  algorithm: qrc.QRCOptions['algorithm'] = 'kyber',
  strength: qrc.QRCOptions['strength'] = 'high'
): Promise<qrc.KeyPair> {
  const cacheKey = `${algorithm}-${strength}`;
  const now = Date.now();
  
  // Check if we have a cached key that hasn't expired
  if (keyPairCache[cacheKey] && (now - keyPairCache[cacheKey].timestamp) < KEY_CACHE_EXPIRATION) {
    return keyPairCache[cacheKey].keyPair;
  }
  
  // Generate a new key pair
  const keyPair = await qrc.generateKeyPair({ algorithm, strength });
  
  // Cache the key pair
  keyPairCache[cacheKey] = {
    keyPair,
    timestamp: now
  };
  
  return keyPair;
}

/**
 * Secure data for transmission
 * This encrypts the data and optionally signs it
 * 
 * @param data Data to secure
 * @param recipientPublicKey Recipient's public key
 * @param options Options for securing the data
 * @returns Promise resolving to secured data result
 */
export async function secureData(
  data: string | object,
  recipientPublicKey: string,
  options: {
    sign?: boolean;
    algorithm?: qrc.QRCOptions['algorithm'];
    strength?: qrc.QRCOptions['strength'];
    encoding?: qrc.QRCOptions['encoding'];
  } = {}
): Promise<{
  encryptedData: qrc.EncryptionResult;
  signature?: string;
  publicKey?: string;
}> {
  const { sign = true, algorithm = 'kyber', strength = 'high', encoding = 'base64' } = options;
  
  try {
    // Convert data to string if it's an object
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt the data
    const encryptedData = await qrc.encrypt(dataStr, recipientPublicKey, { algorithm, strength, encoding });
    
    // Sign the data if requested
    let signature;
    let publicKey;
    
    if (sign) {
      // Get a key pair for signing
      const keyPair = await getKeyPair(algorithm, strength);
      
      // Sign the data
      const signResult = await qrc.sign(dataStr, keyPair.privateKey, { algorithm, strength, encoding });
      
      signature = signResult.signature;
      publicKey = signResult.publicKey;
    }
    
    // Log the operation
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.INFO,
      message: `Data secured with quantum-resistant cryptography`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        signed: sign,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      encryptedData,
      signature,
      publicKey
    };
  } catch (error) {
    // Log the error
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.ERROR,
      message: `Failed to secure data: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
    
    throw new Error(`Failed to secure data: ${error.message}`);
  }
}

/**
 * Process secured data
 * This verifies the signature (if present) and decrypts the data
 * 
 * @param encryptedData Encrypted data
 * @param privateKey Private key for decryption
 * @param options Options for processing the data
 * @returns Promise resolving to the original data and verification result
 */
export async function processSecuredData(
  encryptedData: qrc.EncryptionResult,
  privateKey: string,
  options: {
    signature?: string;
    publicKey?: string;
    requireSignature?: boolean;
    algorithm?: qrc.QRCOptions['algorithm'];
    strength?: qrc.QRCOptions['strength'];
    encoding?: qrc.QRCOptions['encoding'];
  } = {}
): Promise<{
  data: string;
  verified: boolean;
  verificationReason?: string;
}> {
  const { 
    signature, 
    publicKey, 
    requireSignature = false,
    algorithm = 'kyber', 
    strength = 'high', 
    encoding = 'base64' 
  } = options;
  
  try {
    // Decrypt the data
    const decryptedData = await qrc.decrypt(encryptedData, privateKey, { algorithm, strength, encoding });
    
    // Convert to string if it's a buffer
    const dataStr = Buffer.isBuffer(decryptedData) ? decryptedData.toString() : decryptedData;
    
    // Verify signature if provided
    let verified = false;
    let verificationReason;
    
    if (signature && publicKey) {
      const verificationResult = await qrc.verify(dataStr, signature, publicKey, { algorithm, strength, encoding });
      verified = verificationResult.valid;
      verificationReason = verificationResult.reason;
      
      // If signature verification is required and failed, throw an error
      if (requireSignature && !verified) {
        throw new Error(`Signature verification failed: ${verificationReason}`);
      }
    } else if (requireSignature) {
      throw new Error('Signature required but not provided');
    }
    
    // Log the operation
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.INFO,
      message: `Secured data processed successfully`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        signatureProvided: !!signature,
        signatureVerified: verified,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      data: dataStr,
      verified,
      verificationReason
    };
  } catch (error) {
    // Log the error
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.ERROR,
      message: `Failed to process secured data: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
    
    throw new Error(`Failed to process secured data: ${error.message}`);
  }
}

/**
 * Create a secure hash of data using quantum-resistant algorithms
 * 
 * @param data Data to hash
 * @param options Hashing options
 * @returns Promise resolving to the hash
 */
export async function secureHash(
  data: string | object | Buffer,
  options: {
    algorithm?: qrc.QRCOptions['algorithm'];
    strength?: qrc.QRCOptions['strength'];
    encoding?: qrc.QRCOptions['encoding'];
  } = {}
): Promise<string> {
  const { algorithm = 'kyber', strength = 'high', encoding = 'base64' } = options;
  
  try {
    // Convert data to appropriate format
    const dataToHash = typeof data === 'string' ? data :
                       Buffer.isBuffer(data) ? data :
                       JSON.stringify(data);
    
    // Create hash
    const hash = await qrc.hash(dataToHash, { algorithm, strength, encoding });
    
    // Log the operation
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.INFO,
      message: `Data hashed with quantum-resistant algorithm`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        timestamp: new Date().toISOString()
      }
    });
    
    return hash;
  } catch (error) {
    // Log the error
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.ERROR,
      message: `Failed to hash data: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
    
    throw new Error(`Failed to hash data: ${error.message}`);
  }
}

/**
 * Create a secure token using quantum-resistant algorithms
 * 
 * @param payload Token payload
 * @param privateKey Private key for signing
 * @param options Token options
 * @returns Promise resolving to the secure token
 */
export async function createSecureToken(
  payload: Record<string, unknown>,
  privateKey: string,
  options: {
    expiresIn?: number; // milliseconds
    algorithm?: qrc.QRCOptions['algorithm'];
    strength?: qrc.QRCOptions['strength'];
    encoding?: qrc.QRCOptions['encoding'];
  } = {}
): Promise<string> {
  const { 
    expiresIn = 3600000, // 1 hour default
    algorithm = 'kyber', 
    strength = 'high', 
    encoding = 'base64' 
  } = options;
  
  try {
    // Add expiration to payload
    const tokenPayload = {
      ...payload,
      exp: Date.now() + expiresIn,
      iat: Date.now()
    };
    
    // Convert payload to string
    const payloadStr = JSON.stringify(tokenPayload);
    
    // Sign the payload
    const signResult = await qrc.sign(payloadStr, privateKey, { algorithm, strength, encoding });
    
    // Create token (payload + signature)
    const token = Buffer.from(JSON.stringify({
      payload: Buffer.from(payloadStr).toString('base64'),
      signature: signResult.signature,
      publicKey: signResult.publicKey,
      algorithm,
      strength
    })).toString('base64');
    
    // Log the operation
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.INFO,
      message: `Secure token created with quantum-resistant algorithm`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        expiresIn,
        timestamp: new Date().toISOString()
      }
    });
    
    return token;
  } catch (error) {
    // Log the error
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.ERROR,
      message: `Failed to create secure token: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
    
    throw new Error(`Failed to create secure token: ${error.message}`);
  }
}

/**
 * Verify and decode a secure token
 * 
 * @param token Token to verify
 * @param options Verification options
 * @returns Promise resolving to the token payload if valid
 */
export async function verifySecureToken(
  token: string,
  options: {
    checkExpiration?: boolean;
    algorithm?: qrc.QRCOptions['algorithm'];
    strength?: qrc.QRCOptions['strength'];
    encoding?: qrc.QRCOptions['encoding'];
  } = {}
): Promise<{
  payload: Record<string, unknown>;
  valid: boolean;
  expired?: boolean;
  reason?: string;
}> {
  const { 
    checkExpiration = true,
    algorithm = 'kyber', 
    strength = 'high', 
    encoding = 'base64' 
  } = options;
  
  try {
    // Decode token
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Extract components
    const { payload: encodedPayload, signature, publicKey } = tokenData;
    
    // Decode payload
    const payloadStr = Buffer.from(encodedPayload, 'base64').toString();
    const payload = JSON.parse(payloadStr);
    
    // Verify token hasn't been tampered with
    const verificationResult = await qrc.verify(payloadStr, signature, publicKey, { 
      algorithm: tokenData.algorithm || algorithm,
      strength: tokenData.strength || strength,
      encoding
    });
    
    // Check expiration if requested
    let expired = false;
    if (checkExpiration && payload.exp && payload.exp < Date.now()) {
      expired = true;
    }
    
    // Log the operation
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: verificationResult.valid ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
      message: `Secure token verification ${verificationResult.valid ? 'succeeded' : 'failed'}`,
      timestamp: Date.now(),
      metadata: {
        algorithm: tokenData.algorithm || algorithm,
        strength: tokenData.strength || strength,
        valid: verificationResult.valid,
        expired,
        reason: verificationResult.reason,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      payload,
      valid: verificationResult.valid && !expired,
      expired,
      reason: expired ? 'Token expired' : verificationResult.reason
    };
  } catch (error) {
    // Log the error
    await securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY as any,
      severity: SecurityEventSeverity.ERROR,
      message: `Failed to verify secure token: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        algorithm,
        strength,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      payload: {},
      valid: false,
      reason: `Token verification error: ${error.message}`
    };
  }
}