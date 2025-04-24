/**
 * Quantum-Resistant Cryptography Module Index
 * 
 * This file exports all quantum-resistant cryptography components for easy importing.
 */

// Export the core cryptography functions
export * from './QuantumResistantCrypto';

// Export the middleware
export { 
  createQuantumMiddleware,
  type QuantumMiddlewareOptions 
} from './QuantumMiddleware';

// Export the helper functions
export { 
  getKeyPair,
  secureData,
  processSecuredData,
  secureHash,
  createSecureToken,
  verifySecureToken
} from './QuantumHelper';

// Export a default object for convenient access to all components
import * as QuantumResistantCrypto from './QuantumResistantCrypto';
import { createQuantumMiddleware } from './QuantumMiddleware';
import * as QuantumHelper from './QuantumHelper';

export default {
  ...QuantumResistantCrypto,
  createMiddleware: createQuantumMiddleware,
  ...QuantumHelper
};