/**
 * Security Configuration Controller
 * 
 * Provides API endpoints for administrators to configure security settings
 * through the Admin Portal.
 */

import { Request, Response } from 'express';
// Import from SecurityConfigService instead where we've created temporary types
import * as SecurityConfigService from './SecurityConfigService';
import { SecurityMode, SecurityFeatures } from './SecurityConfigService';

/**
 * Get current security configuration
 */
export async function getSecurityConfiguration(req: Request, res: Response): Promise<void> {
  try {
    const config = SecurityConfigService.getSecurityConfiguration();
    res.status(200).json(config);
  } catch (error) {
    console.error('Error fetching security configuration:', error);
    res.status(500).json({
      error: 'Failed to fetch security configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Set security mode
 */
export async function setSecurityMode(req: Request, res: Response): Promise<void> {
  try {
    const { mode } = req.body;
    
    // Validate the mode
    if (!Object.values(SecurityMode).includes(mode)) {
      return res.status(400).json({
        error: 'Invalid security mode',
        validModes: Object.values(SecurityMode)
      });
    }
    
    // Get user ID from authenticated user
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Set the security mode
    const result = SecurityConfigService.setSecurityMode(mode, userId, req);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error setting security mode:', error);
    res.status(500).json({
      error: 'Failed to set security mode',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Set security feature
 */
export async function setSecurityFeature(req: Request, res: Response): Promise<void> {
  try {
    const { featureName, enabled } = req.body;
    
    // Validate the feature name
    if (!featureName || typeof featureName !== 'string') {
      return res.status(400).json({
        error: 'Invalid feature name',
        message: 'Feature name must be a valid string'
      });
    }
    
    // Validate the enabled value
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid enabled value',
        message: 'Enabled must be a boolean value'
      });
    }
    
    // Get user ID from authenticated user
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Set the security feature
    const result = SecurityConfigService.setSecurityFeature(
      featureName as keyof SecurityFeatures,
      enabled,
      userId,
      req
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error setting security feature:', error);
    res.status(500).json({
      error: 'Failed to set security feature',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get configuration history
 */
export async function getConfigurationHistory(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const history = SecurityConfigService.getConfigurationHistory(limit);
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching configuration history:', error);
    res.status(500).json({
      error: 'Failed to fetch configuration history',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Reset security configuration to defaults
 */
export async function resetSecurityConfiguration(req: Request, res: Response): Promise<void> {
  try {
    // Get user ID from authenticated user
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Reset the security configuration
    const result = SecurityConfigService.resetSecurityConfiguration(userId, req);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error resetting security configuration:', error);
    res.status(500).json({
      error: 'Failed to reset security configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Apply recommended security configuration
 */
export async function applyRecommendedConfiguration(req: Request, res: Response): Promise<void> {
  try {
    const { systemSize, sensitiveData, regulatory } = req.body;
    
    // Validate inputs
    if (!['small', 'medium', 'large'].includes(systemSize)) {
      return res.status(400).json({
        error: 'Invalid system size',
        validSizes: ['small', 'medium', 'large']
      });
    }
    
    if (typeof sensitiveData !== 'boolean' || typeof regulatory !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input parameters',
        message: 'sensitiveData and regulatory must be boolean values'
      });
    }
    
    // Get user ID from authenticated user
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Apply the recommended configuration
    const result = SecurityConfigService.applyRecommendedConfiguration(
      systemSize as 'small' | 'medium' | 'large',
      sensitiveData,
      regulatory,
      userId,
      req
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error applying recommended security configuration:', error);
    res.status(500).json({
      error: 'Failed to apply recommended security configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export default {
  getSecurityConfiguration,
  setSecurityMode,
  setSecurityFeature,
  getConfigurationHistory,
  resetSecurityConfiguration,
  applyRecommendedConfiguration
};