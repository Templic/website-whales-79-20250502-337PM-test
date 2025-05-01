/**
 * User Security Controller
 * 
 * Provides API endpoints for administrators to manage security-related aspects
 * of user accounts through the Admin Portal.
 */

import { Request, Response } from 'express';
import * as UserSecurityService from './UserSecurityService';

/**
 * Get users with security status
 */
export async function getUsersWithSecurityStatus(req: Request, res: Response): Promise<void> {
  try {
    const users = UserSecurityService.getUsersWithSecurityStatus();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users with security status:', error);
    res.status(500).json({
      error: 'Failed to fetch users with security status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get detailed security info for a specific user
 */
export async function getUserSecurityDetails(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userDetails = UserSecurityService.getUserSecurityDetails(userId);
    res.status(200).json(userDetails);
  } catch (error) {
    console.error('Error fetching user security details:', error);
    res.status(500).json({
      error: 'Failed to fetch user security details',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Reset MFA for a user
 */
export async function resetUserMFA(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get admin ID from authenticated user
    const adminId = (req.user as any)?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = UserSecurityService.resetUserMFA(userId, adminId, req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error resetting user MFA:', error);
    res.status(500).json({
      error: 'Failed to reset user MFA',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Unlock a user's account
 */
export async function unlockUserAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get admin ID from authenticated user
    const adminId = (req.user as any)?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = UserSecurityService.unlockUserAccount(userId, adminId, req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error unlocking user account:', error);
    res.status(500).json({
      error: 'Failed to unlock user account',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Enforce MFA for a user
 */
export async function enforceMFA(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { enforce } = req.body;
    if (typeof enforce !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'enforce must be a boolean value'
      });
    }
    
    // Get admin ID from authenticated user
    const adminId = (req.user as any)?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = UserSecurityService.enforceMFA(userId, enforce, adminId, req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error enforcing MFA for user:', error);
    res.status(500).json({
      error: 'Failed to enforce MFA for user',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Terminate all active sessions for a user
 */
export async function terminateUserSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get admin ID from authenticated user
    const adminId = (req.user as any)?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = UserSecurityService.terminateUserSessions(userId, adminId, req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    res.status(500).json({
      error: 'Failed to terminate user sessions',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export default {
  getUsersWithSecurityStatus,
  getUserSecurityDetails,
  resetUserMFA,
  unlockUserAccount,
  enforceMFA,
  terminateUserSessions
};