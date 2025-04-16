/**
 * Secure API Routes
 * 
 * This file demonstrates how to use the API security middleware
 * to create secure and properly protected API endpoints.
 */

import express from 'express';
import { z } from 'zod';
import { 
  verifyApiAuthentication, 
  enforceApiRateLimit, 
  verifyApiAuthorization,
  validateApiRequest 
} from '../middleware/apiSecurity';
import { preventAlgorithmConfusionAttack } from '../middleware/jwtAuth';
import { storage } from '../storage';

const router = express.Router();

// Define validation schemas
const userCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['user', 'admin', 'super_admin']).optional().default('user')
});

const userUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin', 'super_admin']).optional()
});

// Apply security middleware to all routes in this router
router.use(preventAlgorithmConfusionAttack);

// Public endpoint with rate limiting
router.get(
  '/status', 
  enforceApiRateLimit('public'),
  (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is operational'
    });
  }
);

// Protected endpoint with authentication and standard rate limiting
router.get(
  '/profile',
  enforceApiRateLimit(),
  verifyApiAuthentication,
  async (req, res) => {
    try {
      // JWT payload should contain the user ID in the 'sub' field
      const userId = parseInt(req.jwtPayload?.sub || '0');
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Return user data without sensitive fields
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json({
        success: true,
        data: safeUser
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error retrieving user profile'
      });
    }
  }
);

// Admin protected endpoint with role-based authorization
router.get(
  '/users',
  enforceApiRateLimit('admin'),
  verifyApiAuthentication,
  verifyApiAuthorization(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Map users to safe objects without sensitive data
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      res.json({
        success: true,
        data: safeUsers
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error retrieving users'
      });
    }
  }
);

// Creating a new user (admin only) with input validation
router.post(
  '/users',
  enforceApiRateLimit('admin'),
  verifyApiAuthentication,
  verifyApiAuthorization(['admin', 'super_admin']),
  validateApiRequest(userCreateSchema),
  async (req, res) => {
    try {
      // The request body has already been validated by the middleware
      const { username, email, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
      
      // Create the user
      const newUser = await storage.createUser({
        username,
        email,
        password, // In a real app, this would be hashed
        role
      });
      
      // Return the new user without sensitive data
      const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };
      
      res.status(201).json({
        success: true,
        data: safeUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error creating user'
      });
    }
  }
);

// Updating a user with input validation
router.patch(
  '/users/:userId',
  enforceApiRateLimit('admin'),
  verifyApiAuthentication,
  verifyApiAuthorization(['admin', 'super_admin']),
  validateApiRequest(userUpdateSchema),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Return the updated user without sensitive data
      const safeUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      res.json({
        success: true,
        data: safeUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }
  }
);

// Deleting a user (super_admin only)
router.delete(
  '/users/:userId',
  enforceApiRateLimit('admin'),
  verifyApiAuthentication,
  verifyApiAuthorization(['super_admin']),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Delete the user
      await storage.deleteUser(userId);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  }
);

export default router;