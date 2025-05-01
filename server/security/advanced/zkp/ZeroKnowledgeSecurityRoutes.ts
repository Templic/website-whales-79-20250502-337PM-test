/**
 * Zero-Knowledge Security Routes
 * 
 * Defines API endpoints for the zero-knowledge security features.
 * These routes handle challenge generation, proof verification, and secure operations
 * using zero-knowledge proofs.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';
import { 
  createOperationChallenge, 
  verifyOperationProof,
  zkpProtectedOperation,
  createZkpChallenge,
  ProtectedOperationType
} from './ZeroKnowledgeAuthService';
import {
  generateUserHomomorphicKeys,
  encryptUserData,
  decryptUserData,
  performHomomorphicOperation,
  secureDataAggregate
} from './HomomorphicDataService';

// Create router
const router = Router();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Log unauthorized access attempt
  logSecurityEvent({
    category: SecurityEventCategory.AUTHORIZATION,
    severity: SecurityEventSeverity.MEDIUM,
    message: 'Unauthorized access attempt to zero-knowledge security endpoint',
    data: {
      path: req.path,
      method: req.method,
      ip: req.ip
    }
  });
  
  return res.status(401).json({
    error: 'Authentication required',
    message: 'You must be authenticated to access this endpoint'
  });
}

// Middleware to ensure user has admin role
function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && (req.user as any).role === 'ADMIN') {
    return next();
  }
  
  // Log unauthorized access attempt
  logSecurityEvent({
    category: SecurityEventCategory.AUTHORIZATION,
    severity: SecurityEventSeverity.MEDIUM,
    message: 'Non-admin user attempted to access admin-only endpoint',
    data: {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id || 'unknown'
    }
  });
  
  return res.status(403).json({
    error: 'Admin access required',
    message: 'You must have admin privileges to access this endpoint'
  });
}

/**
 * Generate a challenge for a protected operation
 * 
 * POST /api/security/zkp/challenge
 */
router.post('/challenge', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const { operationType } = req.body;
    
    // Validate operation type
    if (!operationType || !Object.values(ProtectedOperationType).includes(operationType)) {
      return res.status(400).json({
        error: 'Invalid operation type',
        message: 'The specified operation type is not valid',
        validOperationTypes: Object.values(ProtectedOperationType)
      });
    }
    
    // Generate challenge
    const userId = req.user?.id || 'unknown';
    const challenge = createOperationChallenge(userId, operationType as ProtectedOperationType, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Return challenge
    return res.status(200).json({
      challengeId: challenge.challengeId,
      challenge: challenge.challenge,
      expiresAt: challenge.expiresAt,
      operationType
    });
  } catch (error) {
    // Log error
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Error generating zero-knowledge challenge',
      data: {
        userId: req.user?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return res.status(500).json({
      error: 'Challenge generation failed',
      message: 'An unexpected error occurred while generating the challenge'
    });
  }
});

/**
 * Verify a proof for a protected operation
 * 
 * POST /api/security/zkp/verify
 */
router.post('/verify', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const { challengeId, proofResponse, operationType } = req.body;
    
    // Validate required parameters
    if (!challengeId || !proofResponse || !operationType) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'challengeId, proofResponse, and operationType are required'
      });
    }
    
    // Verify proof (in a real implementation, get the secret from a secure source)
    // For demonstration purposes, we're using a simplified approach
    const userId = req.user?.id || 'unknown';
    const mockSecret = `secret-${userId}-${operationType}`;
    
    const isValid = verifyOperationProof(
      challengeId,
      proofResponse,
      mockSecret,
      userId,
      operationType as ProtectedOperationType
    );
    
    if (isValid) {
      // Generate authorization token or session data
      const authToken = {
        token: Buffer.from(`${userId}:${operationType}:${Date.now()}`).toString('base64'),
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
      };
      
      return res.status(200).json({
        verified: true,
        operationType,
        authToken
      });
    } else {
      return res.status(403).json({
        verified: false,
        error: 'Invalid proof',
        message: 'The provided proof is invalid or expired'
      });
    }
  } catch (error) {
    // Log error
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Error verifying zero-knowledge proof',
      data: {
        userId: req.user?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return res.status(500).json({
      error: 'Verification failed',
      message: 'An unexpected error occurred during verification'
    });
  }
});

/**
 * Generate homomorphic encryption keys for a user
 * 
 * POST /api/security/zkp/keys/generate
 */
router.post('/keys/generate', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 'unknown';
    
    // Generate keys
    const result = generateUserHomomorphicKeys(userId);
    
    // Log key generation
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.CRYPTOGRAPHY,
      'homomorphic_keys',
      {
        action: 'generate'
      },
      req,
      userId
    );
    
    return res.status(200).json({
      publicKey: result.publicKey,
      message: 'Homomorphic encryption keys generated successfully'
    });
  } catch (error) {
    // Log error
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Error generating homomorphic encryption keys',
      data: {
        userId: req.user?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return res.status(500).json({
      error: 'Key generation failed',
      message: 'An unexpected error occurred while generating encryption keys'
    });
  }
});

/**
 * Encrypt data using homomorphic encryption
 * 
 * POST /api/security/zkp/data/encrypt
 */
router.post('/data/encrypt', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const userId = req.user?.id || 'unknown';
    
    // Validate data
    if (!data) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'The data parameter is required'
      });
    }
    
    // Encrypt data
    const encryptedData = encryptUserData(userId, data);
    
    if (!encryptedData) {
      return res.status(400).json({
        error: 'Encryption failed',
        message: 'Failed to encrypt data. Make sure you have generated encryption keys.'
      });
    }
    
    return res.status(200).json({
      encryptedData,
      message: 'Data encrypted successfully'
    });
  } catch (error) {
    // Log error
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Error encrypting data',
      data: {
        userId: req.user?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return res.status(500).json({
      error: 'Encryption failed',
      message: 'An unexpected error occurred during encryption'
    });
  }
});

/**
 * Decrypt data using homomorphic encryption
 * 
 * POST /api/security/zkp/data/decrypt
 */
router.post('/data/decrypt', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const { encryptedData } = req.body;
    const userId = req.user?.id || 'unknown';
    
    // Validate data
    if (!encryptedData) {
      return res.status(400).json({
        error: 'Missing encryptedData',
        message: 'The encryptedData parameter is required'
      });
    }
    
    // Decrypt data
    const decryptedData = decryptUserData(userId, encryptedData);
    
    if (decryptedData === null) {
      return res.status(400).json({
        error: 'Decryption failed',
        message: 'Failed to decrypt data. Make sure you have generated encryption keys.'
      });
    }
    
    return res.status(200).json({
      decryptedData,
      message: 'Data decrypted successfully'
    });
  } catch (error) {
    // Log error
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Error decrypting data',
      data: {
        userId: req.user?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return res.status(500).json({
      error: 'Decryption failed',
      message: 'An unexpected error occurred during decryption'
    });
  }
});

/**
 * Perform a homomorphic operation on encrypted data
 * 
 * POST /api/security/zkp/data/operation
 */
router.post('/data/operation', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const { operation, encryptedData } = req.body;
    const userId = req.user?.id || 'unknown';
    
    // Validate parameters
    if (!operation || !encryptedData || !Array.isArray(encryptedData)) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'operation and encryptedData (array) are required'
      });
    }
    
    // Validate operation
    if (!['sum', 'average', 'count'].includes(operation)) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Supported operations: sum, average, count'
      });
    }
    
    // Perform operation
    const result = performHomomorphicOperation(
      operation as 'sum' | 'average' | 'count',
      encryptedData,
      userId
    );
    
    if (!result) {
      return res.status(400).json({
        error: 'Operation failed',
        message: 'Failed to perform homomorphic operation'
      });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    // Log error
    logSecurityEvent({
      category: SecurityEventCategory.CRYPTOGRAPHY,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Error performing homomorphic operation',
      data: {
        userId: req.user?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return res.status(500).json({
      error: 'Operation failed',
      message: 'An unexpected error occurred during the operation'
    });
  }
});

/**
 * Compute a secure aggregate on sensitive data
 * 
 * POST /api/security/zkp/data/aggregate
 */
router.post('/data/aggregate', 
  ensureAuthenticated,
  zkpProtectedOperation(ProtectedOperationType.SENSITIVE_DATA_ACCESS),
  (req: Request, res: Response) => {
    try {
      const { operation, dataKey, records } = req.body;
      const userId = req.user?.id || 'unknown';
      
      // Validate parameters
      if (!operation || !dataKey || !records || !Array.isArray(records)) {
        return res.status(400).json({
          error: 'Invalid parameters',
          message: 'operation, dataKey, and records (array) are required'
        });
      }
      
      // Validate operation
      if (!['sum', 'average', 'count', 'min', 'max'].includes(operation)) {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'Supported operations: sum, average, count, min, max'
        });
      }
      
      // Compute aggregate
      const result = secureDataAggregate(
        userId,
        operation as 'sum' | 'average' | 'count' | 'min' | 'max',
        dataKey,
        records
      );
      
      if (!result) {
        return res.status(400).json({
          error: 'Aggregation failed',
          message: 'Failed to compute secure data aggregate'
        });
      }
      
      return res.status(200).json(result);
    } catch (error) {
      // Log error
      logSecurityEvent({
        category: SecurityEventCategory.DATA_ACCESS,
        severity: SecurityEventSeverity.MEDIUM,
        message: 'Error computing secure data aggregate',
        data: {
          userId: req.user?.id || 'unknown',
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      return res.status(500).json({
        error: 'Aggregation failed',
        message: 'An unexpected error occurred during aggregation'
      });
    }
  }
);

/**
 * Create a challenge for administrative actions
 * 
 * POST /api/security/zkp/admin/challenge
 */
router.post('/admin/challenge', 
  ensureAuthenticated, 
  ensureAdmin,
  (req: Request, res: Response) => {
    try {
      const { operationType } = req.body;
      const userId = req.user?.id || 'unknown';
      
      // Validate operation type
      if (!operationType || !Object.values(ProtectedOperationType).includes(operationType)) {
        return res.status(400).json({
          error: 'Invalid operation type',
          message: 'The specified operation type is not valid',
          validOperationTypes: Object.values(ProtectedOperationType)
        });
      }
      
      // Create challenge
      return createZkpChallenge(operationType as ProtectedOperationType)(req, res);
    } catch (error) {
      // Log error
      logSecurityEvent({
        category: SecurityEventCategory.AUTHORIZATION,
        severity: SecurityEventSeverity.MEDIUM,
        message: 'Error creating admin challenge',
        data: {
          userId: req.user?.id || 'unknown',
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      return res.status(500).json({
        error: 'Challenge creation failed',
        message: 'An unexpected error occurred during challenge creation'
      });
    }
  }
);

// Export router
export default router;