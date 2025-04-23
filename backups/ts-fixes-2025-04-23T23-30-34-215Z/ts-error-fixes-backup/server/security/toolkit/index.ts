/**
 * Security Toolkit Index
 * 
 * This file exports all the security toolkit components for easy importing.
 */

// Export Security Toolkit
export {
  SecurityToolkit,
  SecurityLevel,
  type SecurityProfile,
  createSecurityToolkit,
  default as securityToolkit
} from './SecurityToolkit';

// Export Security Helpers
export {
  secure,
  secureController,
  securityHeaders,
  validateRequest,
  verifyBlockchainIntegrity,
  validators,
  type SecurityDecoratorOptions
} from './SecurityHelpers';

// Export core security components for advanced usage
export { securityBlockchain } from '../advanced/blockchain/ImmutableSecurityLogs';
export { 
  SecurityEventCategory, 
  SecurityEventSeverity,
  type SecurityEvent,
  type SecurityEventMetadata
} from '../advanced/blockchain/SecurityEventTypes';

// Export anomaly detection components
export {
  detectAnomaly,
  createAnomalyDetectionMiddleware,
  type AnomalyDetectionOptions,
  type AnomalyDetectionResult
} from '../advanced/ml/AnomalyDetection';

// Export security middleware components
export {
  applySecurityMiddleware,
  createCustomSecurityMiddleware,
  createSecureRouter,
  type SecureRouterOptions
} from '../../middleware/securityMiddleware';