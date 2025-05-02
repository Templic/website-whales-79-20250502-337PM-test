/**
 * Security Initialization Script
 * 
 * This script ensures security settings are properly configured at startup.
 * It sets the security level to MONITOR by default to prevent aggressive blocking
 * while still tracking potential threats.
 */

import { securityConfig } from './security/advanced/config/SecurityConfig';

// Set the initial security level to MONITOR
// This prevents aggressive blocking while still allowing threat detection
securityConfig.setSecurityLevel('MONITOR')
  .then(success => {
    if (success) {
      console.log('[Security] Security level set to MONITOR mode');
      console.log('[Security] In this mode, threats are detected but not blocked');
    } else {
      console.error('[Security] Failed to set security level to MONITOR mode');
    }
  })
  .catch(error => {
    console.error('[Security] Error setting security level:', error);
  });

// Export the module to ensure it's loaded
export default securityConfig;