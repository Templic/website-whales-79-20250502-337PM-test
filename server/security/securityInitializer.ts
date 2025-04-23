/**
 * Security Initializer
 * 
 * This module provides a single entrypoint for initializing all security components
 * and connecting them together into an integrated security system.
 */

import * as express from 'express';
import { initializeSecurity } from './index';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from './advanced/blockchain/ImmutableSecurityLogs';
import { mlEngine } from './advanced/analytics/MachineLearningEngine';
import { maximumSecurityScanner } from './maximumSecurityScan';
import { quantumCrypto } from './advanced/crypto/QuantumResistantCrypto';

/**
 * Initialize security systems with maximum protection
 */
export async function initializeSecuritySystems(app: express.Application): Promise<void> {
  console.log('[SecurityInitializer] Starting security system initialization...');
  
  try {
    // Initialize blockchain-based security logs
    console.log('[SecurityInitializer] Initializing immutable security audit logs...');
    await securityBlockchain.initialize();
    
    // Log initialization event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SYSTEM,
      message: 'Security systems initialization started'
    });
    
    // Initialize main security system with advanced features
    console.log('[SecurityInitializer] Initializing main security systems...');
    await initializeSecurity(app, {
      advanced: true,
      mode: 'maximum'
    });
    
    // Train machine learning models
    console.log('[SecurityInitializer] Training machine learning models...');
    await mlEngine.trainModels();
    
    // Run initial security scan
    console.log('[SecurityInitializer] Running initial security scan...');
    await maximumSecurityScanner.scan();
    
    // Generate quantum-resistant master keys
    console.log('[SecurityInitializer] Generating quantum-resistant cryptographic keys...');
    const masterKeyPair = quantumCrypto.generateKeyPair();
    console.log('[SecurityInitializer] Quantum-resistant master keys generated successfully');
    
    // Log successful initialization
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SYSTEM,
      message: 'Security systems initialized successfully',
      metadata: {
        securityMode: 'maximum',
        quantum: true,
        machineLeaning: true,
        blockchain: true
      }
    });
    
    console.log('[SecurityInitializer] All security systems initialized successfully');
    
    // Schedule periodic security tasks
    schedulePeriodicSecurityTasks();
  } catch (error) {
    console.error('[SecurityInitializer] Error initializing security systems:', error);
    
    // Log initialization failure
    try {
      await securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.CRITICAL,
        category: SecurityEventCategory.SYSTEM,
        message: 'Security systems initialization failed',
        metadata: { error: error.message }
      });
    } catch (logError) {
      console.error('[SecurityInitializer] Failed to log initialization error:', logError);
    }
    
    throw error;
  }
}

/**
 * Schedule periodic security tasks
 */
function schedulePeriodicSecurityTasks(): void {
  console.log('[SecurityInitializer] Scheduling periodic security tasks...');
  
  // Schedule full security scan every 12 hours
  const scanIntervalHours = 12;
  console.log(`[SecurityInitializer] Scheduling security scan every ${scanIntervalHours} hours`);
  setInterval(async () => {
    try {
      console.log('[SecurityScheduler] Running scheduled security scan...');
      await maximumSecurityScanner.scan();
      console.log('[SecurityScheduler] Scheduled security scan completed');
    } catch (error) {
      console.error('[SecurityScheduler] Error in scheduled security scan:', error);
    }
  }, scanIntervalHours * 60 * 60 * 1000);
  
  // Retrain machine learning models every 24 hours
  const mlTrainingIntervalHours = 24;
  console.log(`[SecurityInitializer] Scheduling ML model training every ${mlTrainingIntervalHours} hours`);
  setInterval(async () => {
    try {
      console.log('[SecurityScheduler] Running scheduled ML model training...');
      await mlEngine.trainModels();
      console.log('[SecurityScheduler] Scheduled ML model training completed');
    } catch (error) {
      console.error('[SecurityScheduler] Error in scheduled ML model training:', error);
    }
  }, mlTrainingIntervalHours * 60 * 60 * 1000);
  
  // Validate blockchain integrity every 6 hours
  const blockchainValidationIntervalHours = 6;
  console.log(`[SecurityInitializer] Scheduling blockchain validation every ${blockchainValidationIntervalHours} hours`);
  setInterval(async () => {
    try {
      console.log('[SecurityScheduler] Running scheduled blockchain validation...');
      const validationResult = await securityBlockchain.validateChain();
      
      if (!validationResult.valid) {
        console.error('[SecurityScheduler] Blockchain validation failed:', validationResult.errors);
        
        // Log validation failure
        await securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.CRITICAL,
          category: SecurityEventCategory.SYSTEM,
          message: 'Security audit log integrity validation failed',
          metadata: {
            errors: validationResult.errors,
            invalidBlocks: validationResult.invalidBlocks
          }
        });
      } else {
        console.log('[SecurityScheduler] Blockchain validation completed successfully');
      }
    } catch (error) {
      console.error('[SecurityScheduler] Error in scheduled blockchain validation:', error);
    }
  }, blockchainValidationIntervalHours * 60 * 60 * 1000);
  
  console.log('[SecurityInitializer] Periodic security tasks scheduled successfully');
}

/**
 * Shut down security systems
 */
export async function shutdownSecuritySystems(): Promise<void> {
  console.log('[SecurityInitializer] Shutting down security systems...');
  
  try {
    // Log shutdown event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SYSTEM,
      message: 'Security systems shutdown initiated'
    });
    
    // Shut down blockchain
    await securityBlockchain.shutdown();
    
    console.log('[SecurityInitializer] Security systems shut down successfully');
  } catch (error) {
    console.error('[SecurityInitializer] Error shutting down security systems:', error);
    throw error;
  }
}