/**
 * Unified Quantum Security Architecture
 * 
 * This file implements a unified security architecture that integrates:
 * 
 * 1. Fixed quantum-resistant cryptography with timestamp standardization
 * 2. Verifiable Secret Sharing for key distribution
 * 3. Forward-Secure Digital Signatures
 * 4. Zero-Knowledge Proofs for privacy
 * 5. Blockchain security logging
 * 6. ML-based anomaly detection
 * 
 * All components use standardized interfaces, consistent error handling,
 * and unified timestamp formats (Date.now()).
 */

import { 
  quantumCrypto, 
  QuantumAlgorithmType,
  KeyPair,
  EncryptionResult,
  SignatureResult
} from './QuantumResistantCrypto';

import {
  verifiableSecretSharing,
  forwardSecureSignature,
  zeroKnowledgeProof,
  SecretShare,
  VerifiableSecretSharing,
  ForwardSecureSignature,
  ZeroKnowledgeProof
} from './OpenStandardMethods';

import { ImmutableSecurityLogger, SecurityEventType } from '../blockchain/SecurityLogger';
import { detectAnomaly } from '../ml/AnomalyDetection';

// Central logger for the unified security architecture
const logger = new ImmutableSecurityLogger('QUANTUM-SECURITY');

/**
 * Unified Quantum Security provides a simplified interface to the underlying
 * security components with consistent error handling and logging.
 */
export class UnifiedQuantumSecurity {
  /**
   * Generate a quantum-resistant key pair
   */
  public static generateKeyPair(
    algorithm: QuantumAlgorithmType = QuantumAlgorithmType.LATTICE_NTRU,
    keySize: number = 4096
  ): KeyPair {
    try {
      logger.info('Generating quantum-resistant key pair', {
        algorithm,
        keySize,
        timestamp: Date.now()
      });
      
      // Extract features for anomaly detection
      const startTime = performance.now();
      
      // Generate the key pair
      const keyPair = quantumCrypto.generateKeyPair(algorithm, keySize);
      
      // Calculate performance metrics for anomaly detection
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Check for anomalies in key generation
      const anomalyResult = detectAnomaly('KEY_GENERATION', {
        algorithm,
        keySize,
        duration,
        timestamp: keyPair.generatedAt
      });
      
      if (anomalyResult.isAnomaly) {
        logger.warn('Anomaly detected in key generation', {
          algorithm,
          keySize,
          anomalyScore: anomalyResult.score,
          timestamp: Date.now()
        });
      }
      
      return keyPair;
    } catch (error) {
      logger.error('Key generation failed', {
        algorithm,
        keySize,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Distribute a quantum-resistant key using Verifiable Secret Sharing
   */
  public static distributeKey(
    keyPair: KeyPair,
    totalShares: number,
    threshold: number
  ): VerifiableSecretSharing {
    try {
      logger.info('Distributing quantum-resistant key', {
        algorithm: keyPair.algorithm,
        totalShares,
        threshold,
        timestamp: Date.now()
      });
      
      // Create shares of the private key
      const vss = verifiableSecretSharing.createShares(
        keyPair.privateKey,
        totalShares,
        threshold
      );
      
      return vss;
    } catch (error) {
      logger.error('Key distribution failed', {
        algorithm: keyPair.algorithm,
        totalShares,
        threshold,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Reconstruct a private key from shares
   */
  public static reconstructKey(
    shares: SecretShare[],
    threshold: number
  ): string {
    try {
      logger.info('Reconstructing key from shares', {
        sharesProvided: shares.length,
        threshold,
        timestamp: Date.now()
      });
      
      // Reconstruct the private key
      const privateKey = verifiableSecretSharing.reconstructSecret(shares, threshold);
      
      return privateKey;
    } catch (error) {
      logger.error('Key reconstruction failed', {
        sharesProvided: shares.length,
        threshold,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Encrypt data with quantum-resistant encryption
   */
  public static encrypt(
    data: string,
    publicKey: string,
    algorithm: QuantumAlgorithmType = QuantumAlgorithmType.LATTICE_NTRU
  ): EncryptionResult {
    try {
      logger.info('Encrypting data', {
        algorithm,
        dataLength: data.length,
        timestamp: Date.now()
      });
      
      // Extract features for anomaly detection
      const startTime = performance.now();
      
      // Encrypt the data
      const encryptionResult = quantumCrypto.encrypt(data, publicKey, algorithm);
      
      // Calculate performance metrics for anomaly detection
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Check for anomalies in encryption
      const anomalyResult = detectAnomaly('ENCRYPTION', {
        algorithm,
        dataLength: data.length,
        duration,
        ciphertextLength: encryptionResult.ciphertext.length,
        timestamp: encryptionResult.timestamp
      });
      
      if (anomalyResult.isAnomaly) {
        logger.warn('Anomaly detected in encryption', {
          algorithm,
          dataLength: data.length,
          anomalyScore: anomalyResult.score,
          timestamp: Date.now()
        });
      }
      
      return encryptionResult;
    } catch (error) {
      logger.error('Encryption failed', {
        algorithm,
        dataLength: data?.length || 0,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Decrypt data with quantum-resistant encryption
   */
  public static decrypt(
    encryptionResult: EncryptionResult,
    privateKey: string
  ): string {
    try {
      logger.info('Decrypting data', {
        algorithm: encryptionResult.algorithm,
        ciphertextLength: encryptionResult.ciphertext.length,
        timestamp: Date.now()
      });
      
      // Extract features for anomaly detection
      const startTime = performance.now();
      
      // Decrypt the data
      const decryptedData = quantumCrypto.decrypt(encryptionResult, privateKey);
      
      // Calculate performance metrics for anomaly detection
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Check for anomalies in decryption
      const anomalyResult = detectAnomaly('DECRYPTION', {
        algorithm: encryptionResult.algorithm,
        duration,
        ciphertextLength: encryptionResult.ciphertext.length,
        decryptedLength: decryptedData.length,
        timestamp: Date.now()
      });
      
      if (anomalyResult.isAnomaly) {
        logger.warn('Anomaly detected in decryption', {
          algorithm: encryptionResult.algorithm,
          ciphertextLength: encryptionResult.ciphertext.length,
          anomalyScore: anomalyResult.score,
          timestamp: Date.now()
        });
      }
      
      return decryptedData;
    } catch (error) {
      logger.error('Decryption failed', {
        algorithm: encryptionResult?.algorithm,
        ciphertextLength: encryptionResult?.ciphertext?.length || 0,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Sign data with both quantum-resistant and forward-secure signatures
   */
  public static sign(
    data: string,
    privateKey: string,
    algorithm: QuantumAlgorithmType = QuantumAlgorithmType.HASH_SPHINCS,
    forwardSecureKey?: { privateKey: string, publicKey: string, period: number }
  ): { quantumSignature: SignatureResult, forwardSecureSignature?: ForwardSecureSignature } {
    try {
      logger.info('Signing data', {
        algorithm,
        dataLength: data.length,
        useForwardSecure: !!forwardSecureKey,
        timestamp: Date.now()
      });
      
      // Create a quantum-resistant signature
      const quantumSignature = quantumCrypto.sign(data, privateKey, algorithm);
      
      // Create a forward-secure signature if keys are provided
      let forwardSecureSignature: ForwardSecureSignature | undefined;
      
      if (forwardSecureKey) {
        forwardSecureSignature = forwardSecureSignature.sign(
          data,
          forwardSecureKey.privateKey,
          forwardSecureKey.publicKey,
          forwardSecureKey.period
        );
      }
      
      return {
        quantumSignature,
        forwardSecureSignature
      };
    } catch (error) {
      logger.error('Signing failed', {
        algorithm,
        dataLength: data?.length || 0,
        useForwardSecure: !!forwardSecureKey,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Verify signatures
   */
  public static verify(
    signatureResult: SignatureResult,
    publicKey: string,
    forwardSecureSignature?: ForwardSecureSignature
  ): { isQuantumValid: boolean, isForwardSecureValid?: boolean } {
    try {
      logger.info('Verifying signatures', {
        algorithm: signatureResult.algorithm,
        messageLength: signatureResult.message.length,
        hasForwardSecure: !!forwardSecureSignature,
        timestamp: Date.now()
      });
      
      // Verify the quantum-resistant signature
      const isQuantumValid = quantumCrypto.verify(signatureResult, publicKey);
      
      // Verify the forward-secure signature if provided
      let isForwardSecureValid: boolean | undefined;
      
      if (forwardSecureSignature) {
        isForwardSecureValid = forwardSecureSignature.verify(forwardSecureSignature);
      }
      
      // Check for anomalies in verification results
      const anomalyResult = detectAnomaly('SIGNATURE_VERIFICATION', {
        algorithm: signatureResult.algorithm,
        messageLength: signatureResult.message.length,
        signatureTimestamp: signatureResult.timestamp,
        verificationTimestamp: Date.now(),
        isQuantumValid,
        isForwardSecureValid
      });
      
      if (anomalyResult.isAnomaly) {
        logger.warn('Anomaly detected in signature verification', {
          algorithm: signatureResult.algorithm,
          anomalyScore: anomalyResult.score,
          timestamp: Date.now()
        });
      }
      
      return {
        isQuantumValid,
        isForwardSecureValid
      };
    } catch (error) {
      logger.error('Verification failed', {
        algorithm: signatureResult?.algorithm,
        messageLength: signatureResult?.message?.length || 0,
        hasForwardSecure: !!forwardSecureSignature,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Create a privacy-preserving range proof
   */
  public static createRangeProof(
    value: number,
    min: number,
    max: number
  ): ZeroKnowledgeProof {
    try {
      logger.info('Creating range proof', {
        range: `[${min}, ${max}]`,
        timestamp: Date.now()
      });
      
      // Create the range proof
      const proof = zeroKnowledgeProof.createRangeProof(value, min, max);
      
      return proof;
    } catch (error) {
      logger.error('Range proof creation failed', {
        range: `[${min}, ${max}]`,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Verify a privacy-preserving range proof
   */
  public static verifyRangeProof(
    proof: ZeroKnowledgeProof,
    min: number,
    max: number
  ): boolean {
    try {
      logger.info('Verifying range proof', {
        range: `[${min}, ${max}]`,
        timestamp: Date.now()
      });
      
      // Verify the range proof
      const isValid = zeroKnowledgeProof.verifyRangeProof(proof, min, max);
      
      return isValid;
    } catch (error) {
      logger.error('Range proof verification failed', {
        range: `[${min}, ${max}]`,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Generate a forward-secure key pair for temporal security
   */
  public static generateForwardSecureKeyPair(
    periods: number = 100
  ): { publicKey: string, privateKeys: string[], timestamp: number } {
    try {
      logger.info('Generating forward-secure key pair', {
        periods,
        timestamp: Date.now()
      });
      
      // Generate the forward-secure key pair
      const keyPair = forwardSecureSignature.generateKeyPair(periods);
      
      return keyPair;
    } catch (error) {
      logger.error('Forward-secure key generation failed', {
        periods,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Update a forward-secure key to the next period
   */
  public static updateForwardSecureKey(
    privateKeys: string[],
    currentPeriod: number
  ): string[] {
    try {
      logger.info('Updating forward-secure key', {
        currentPeriod,
        timestamp: Date.now()
      });
      
      // Update the key to the next period
      const updatedKeys = forwardSecureSignature.updateKey(privateKeys, currentPeriod);
      
      return updatedKeys;
    } catch (error) {
      logger.error('Forward-secure key update failed', {
        currentPeriod,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Process a high-security transaction with privacy preservation
   * 
   * This method demonstrates the integration of multiple security techniques:
   * 1. Zero-knowledge proofs for transaction amount validation
   * 2. Quantum-resistant encryption for data protection
   * 3. Forward-secure signatures for temporal security
   * 4. ML-based anomaly detection for security monitoring
   */
  public static processSecureTransaction(
    transaction: {
      id: string;
      amount: number;
      sender: string;
      recipient: string;
      timestamp: number;
    },
    keys: {
      quantumKeyPair: KeyPair;
      forwardSecureKeys: { publicKey: string, privateKeys: string[], currentPeriod: number };
    },
    limits: {
      minAmount: number;
      maxAmount: number;
    }
  ): {
    success: boolean;
    encryptedTransaction?: EncryptionResult;
    signatures?: { quantum: SignatureResult, forwardSecure: ForwardSecureSignature };
    rangeProof?: ZeroKnowledgeProof;
  } {
    try {
      logger.info('Processing secure transaction', {
        transactionId: transaction.id,
        timestamp: Date.now()
      });
      
      // 1. Create a range proof to verify the amount is within limits
      const rangeProof = this.createRangeProof(
        transaction.amount,
        limits.minAmount,
        limits.maxAmount
      );
      
      // 2. Verify the range proof
      const isValidAmount = this.verifyRangeProof(
        rangeProof,
        limits.minAmount,
        limits.maxAmount
      );
      
      if (!isValidAmount) {
        logger.warn('Transaction amount outside allowed range', {
          transactionId: transaction.id,
          range: `[${limits.minAmount}, ${limits.maxAmount}]`,
          timestamp: Date.now()
        });
        
        return { success: false };
      }
      
      // 3. Encrypt the transaction details
      const transactionJson = JSON.stringify(transaction);
      const encryptedTransaction = this.encrypt(
        transactionJson,
        keys.quantumKeyPair.publicKey,
        keys.quantumKeyPair.algorithm
      );
      
      // 4. Sign the encrypted transaction with both signature methods
      const quantumSignature = quantumCrypto.sign(
        encryptedTransaction.ciphertext,
        keys.quantumKeyPair.privateKey,
        QuantumAlgorithmType.HASH_SPHINCS
      );
      
      const forwardSecureSig = forwardSecureSignature.sign(
        encryptedTransaction.ciphertext,
        keys.forwardSecureKeys.privateKeys[keys.forwardSecureKeys.currentPeriod],
        keys.forwardSecureKeys.publicKey,
        keys.forwardSecureKeys.currentPeriod
      );
      
      // 5. Update the forward-secure key to the next period
      this.updateForwardSecureKey(
        keys.forwardSecureKeys.privateKeys,
        keys.forwardSecureKeys.currentPeriod
      );
      
      // 6. Log the successful transaction to the blockchain
      logger.info('Transaction processed successfully', {
        transactionId: transaction.id,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        encryptedTransaction,
        signatures: {
          quantum: quantumSignature,
          forwardSecure: forwardSecureSig
        },
        rangeProof
      };
    } catch (error) {
      logger.error('Transaction processing failed', {
        transactionId: transaction.id,
        error: (error as Error).message,
        timestamp: Date.now()
      });
      
      return { success: false };
    }
  }
}

// Export a singleton instance for easy access
export const unifiedQuantumSecurity = new UnifiedQuantumSecurity();