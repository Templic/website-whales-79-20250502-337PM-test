/**
 * Security Routes Module
 * 
 * This module sets up routes for security features including:
 * - MFA setup and verification
 * - Security dashboard API endpoints
 * - Security testing endpoints
 */

import express from 'express';
import { createSecureApiRouter, createPublicApiRouter } from './secureApiRouter';
import mfaRoutes from './api/security/mfa';
import dashboardRoutes from './api/security/dashboard';
import realtimeRoutes, { setupSecurityWebSockets } from './api/security/realtime';
import { zeroKnowledgeRoutes } from './api/security/zero-knowledge';
import { homomorphicRoutes } from './api/security/homomorphic';
import { requireMFAVerification, initializeMFAVerification, verifyMFAResponse, generateMFAChallenge } from '../auth/mfaIntegration';
import { logSecurityEvent } from '../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';
import { startMetricsCollection } from '../security/monitoring/MetricsCollector';
import { initializeEventsCollector } from '../security/monitoring/EventsCollector';
import http from 'http';

// Create router
const router = express.Router();

// Setup security dashboard API routes
const securityApiRouter = createSecureApiRouter({
  requireMFA: true,
  quantumProtection: true
});

// Security dashboard API routes
securityApiRouter.use('/dashboard', dashboardRoutes);
securityApiRouter.use('/realtime', realtimeRoutes);

// MFA API routes
securityApiRouter.use('/mfa', mfaRoutes);

// Zero-Knowledge Security Proofs API routes
securityApiRouter.use('/zero-knowledge', zeroKnowledgeRoutes);

// Homomorphic Encryption API routes
securityApiRouter.use('/homomorphic', homomorphicRoutes);

// Register security API routes
router.use('/api/security', securityApiRouter);

// MFA verification routes
const authRouter = express.Router();

// MFA setup page
authRouter.get('/setup-mfa', (req, res) => {
  if (!req.isAuthenticated()) {
    // @ts-ignore - Response type issue
  return res.redirect('/auth');
  }
  
  res.render('auth/mfa-setup', {
    user: req.user
  });
});

// MFA verification page
authRouter.get('/mfa', (req, res) => {
  if (!req.isAuthenticated()) {
    // @ts-ignore - Response type issue
  return res.redirect('/auth');
  }
  
  // Check if MFA is already verified
  if (req.session.mfa?.state === 'verified') {
    // @ts-ignore - Response type issue
  return res.redirect('/');
  }
  
  // Initialize MFA verification if not already done
  if (!req.session.mfa) {
    initializeMFAVerification(req, (req.user as unknown).id);
  }
  
  res.render('auth/mfa-verify', {
    user: req.user
  });
});

// MFA verification POST endpoint
authRouter.post('/mfa/verify', async (req, res) => {
  if (!req.isAuthenticated()) {
    // @ts-ignore - Response type issue
  return res.redirect('/auth');
  }
  
  const { code, method } = req.body;
  
  // Generate challenge if method is provided
  if (method && !code) {
    const success = await generateMFAChallenge(req, res, method);
    
    if (success) {
      // @ts-ignore - Response type issue
  return res.json({ success: true, message: 'Challenge generated' });
    } else {
      return res.status(400).json({ success: false, message: 'Failed to generate challenge' });
    }
  }
  
  // Verify MFA response
  if (code) {
    const success = await verifyMFAResponse(req, res, code);
    
    if (success) {
      // @ts-ignore - Response type issue
  return res.json({ success: true, message: 'MFA verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
  }
  
  res.status(400).json({ success: false, message: 'Missing verification code' });
});

// Register auth routes
router.use('/auth', authRouter);

/**
 * Initialize security components and routes
 */
export function initializeSecurity(app: express.Express, server: http.Server): void {
  // Register security routes
  app.use(router);
  
  // Start security metrics collection
  startMetricsCollection();
  
  // Initialize events collector
  initializeEventsCollector();
  
  // Setup WebSocket server for real-time security updates
  setupSecurityWebSockets(server);
  
  logSecurityEvent({
    category: SecurityEventCategory.SYSTEM,
    severity: SecurityEventSeverity.INFO,
    message: 'Security routes and components initialized',
    data: { timestamp: new Date().toISOString() }
  });
}

export default router;