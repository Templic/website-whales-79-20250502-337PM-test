/**
 * RASP Module
 * 
 * This module exports the RASP (Runtime Application Self-Protection) manager 
 * and other related components for application security.
 */

import { RASPManager, RASPProtectionLevel, RASPProtectionCategory } from './RASPManager';

// Create a singleton instance of the RASP manager
const raspManager = new RASPManager({
  protectionLevel: RASPProtectionLevel.PREVENTION,
  blockRequests: true,
  logEvents: true,
  excludePaths: [
    '/api/health',
    '/api/webhooks', 
    '/api/external-callbacks',
    '/api/stripe-webhook'
  ]
});

// Export the RASP manager, classes and enums
export {
  raspManager,
  RASPManager,
  RASPProtectionLevel,
  RASPProtectionCategory
};