import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { nanoid } from 'nanoid';
import { validate } from './middlewares/validationMiddleware';
import { body } from 'express-validator'; // Add body to imports
import { validateDatabaseQuery, sanitizeDatabaseParams } from './middleware/databaseQueryValidator';
import { 
  contactValidation, 
  newsletterValidation, 
  productValidation,
  postValidation,
  commentValidation,
  userValidation,
  tourDateValidation,
  musicValidation,
  orderValidation,
  paginationValidation,
  categoryValidation,
  passwordRecoveryValidation,
  passwordResetValidation
} from './validation';
import { publicRouter, authenticatedRouter, adminRouter } from './routes/secureApiRoutes';
import auditSecurityRoutes from './routes/auditSecurityRoutes';
import { verifyApiSecurity } from './security/apiSecurityVerification';
import {
  insertSubscriberSchema,
  insertPostSchema,
  insertCommentSchema,
  insertCategorySchema,
  insertNewsletterSchema,
  contactMessages,
  comments,
  users,
  User
} from "@shared/schema";

// Function to create a safe user object without sensitive fields
function createSafeUser(user: User | null | undefined) {
  if (!user) {
    return null;
  }
  
  // Log input and output for debugging
  console.log("Creating safe user from:", user.username);
  
  // Return only the safe fields
  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  console.log("Returning safe user:", safeUser.username);
  return safeUser;
}
import { hashPassword } from "./auth";
import { createTransport } from "nodemailer";
import dbMonitorRoutes from './routes/db-monitor';
import databaseSecurityRoutes from './routes/databaseSecurityRoutes';
import shopRoutes from './shop-routes';
import paymentRoutes from './payment-routes';
import { logSecurityEvent } from './security';
// TODO: Fix missing security functions
import { runSecurityScan } from './securityScan';
import { runAuthSecurityScan } from './security/authSecurityScan';
import { getSecuritySettings, updateSecuritySetting, type SecuritySettings } from './settings';
import { securityRouter, testSecurityRouter } from './securityRoutes';
import authRoutes from './routes/authRoutes';
import jwtAuthRoutes from './routes/jwtAuthRoutes';
import contentRoutes from './routes/content';
import contentWorkflowRoutes from './routes/content-workflow';
import notificationsRoutes from './routes/notifications';
import mediaRoutes from './routes/media';
import searchRoutes from './routes/search/index';
import { preventAlgorithmConfusionAttack } from './middleware/jwtAuth';

// Email transporter for nodemailer
const transporter = createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

export async function registerRoutes(app: express.Application): Promise<Server> {
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Use authRoutes for all /api/auth routes
  app.use('/api/auth', authRoutes);
  
  // Use JWT auth routes for token-based API authentication
  app.use('/api/jwt', jwtAuthRoutes);
  
  // Use search routes
  app.use('/api/search', searchRoutes);
  
  // Use media routes
  app.use(mediaRoutes);
  
  // Use secure API routes with comprehensive security checks
  app.use('/api/secure/public', publicRouter);
  app.use('/api/secure/auth', authenticatedRouter);
  app.use('/api/secure/admin', adminRouter);
  
  // Register API security verification endpoint (admin only)
  app.get('/api/security/verify-api', async (req, res) => {
    // Only allow admins to run the verification
    if (!req.isAuthenticated || !req.isAuthenticated() || 
        (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    try {
      // Run the API security verification
      const results = await verifyApiSecurity();
      
      res.json({
        success: true,
        results: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error running API security verification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error running API security verification'
      });
    }
  });

  // Get current user endpoint
  app.get('/api/user', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      // Use the safe user creator to return only non-sensitive fields
      const safeUser = createSafeUser(req.user);
      res.json(safeUser);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
  
  // Direct login endpoint for testing (in addition to the auth routes)
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      console.log("Attempting login for user:", username);
      
      // First, try to use a direct database query to get full user information
      // This bypasses any caching or middleware that might interfere
      let fullUserRecord = null;
      
      try {
        // Direct database query to get user
        const userRows = await db.select().from(users).where(eq(users.username, username));
        console.log(`Direct DB query for ${username} found ${userRows.length} rows`);
        
        if (userRows.length > 0) {
          fullUserRecord = userRows[0];
        }
      } catch (dbError) {
        console.error("Database query error:", dbError);
      }
      
      // If we didn't find the user with direct query, try the storage method
      if (!fullUserRecord) {
        fullUserRecord = await storage.getUserByUsername(username);
      }
      
      // User exists in database
      if (fullUserRecord) {
        console.log("User found in database:", fullUserRecord.username);
        
        // For demo purposes, using hardcoded password verification
        // In a real app, we'd use bcrypt to compare against stored hash
        if ((username === 'admin' && password === 'admin123') || 
            (username === 'superadmin' && password === 'superadmin123') || 
            (username === 'user' && password === 'user123')) {
          
          // IMPORTANT: Create a sanitized user object without sensitive fields
          const sanitizedUser = {
            id: fullUserRecord.id,
            username: fullUserRecord.username,
            email: fullUserRecord.email,
            role: fullUserRecord.role,
            isBanned: fullUserRecord.isBanned,
            twoFactorEnabled: fullUserRecord.twoFactorEnabled,
            lastLogin: fullUserRecord.lastLogin,
            createdAt: fullUserRecord.createdAt,
            updatedAt: fullUserRecord.updatedAt
          };
          
          console.log("Sanitized login response for:", sanitizedUser.username);
          
          // Set user in session if authentication is successful
          if (req.session) {
            console.log("Setting user in session");
            req.session.user = sanitizedUser;
          }
          
          // Return sanitized user data
          return res.json(sanitizedUser);
        }
      } else {
        console.log("User not found in database, checking mock users");
        
        // For demo only - hardcoded users
        const mockUsers = {
          'admin': {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            isBanned: false,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString()
          },
          'superadmin': {
            id: 2,
            username: 'superadmin',
            email: 'superadmin@example.com',
            role: 'super_admin',
            isBanned: false,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString()
          },
          'user': {
            id: 3,
            username: 'user',
            email: 'user@example.com',
            role: 'user',
            isBanned: false,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString()
          }
        };
        
        // Simple test account validation
        if (username === 'admin' && password === 'admin123') {
          if (req.session) {
            req.session.user = mockUsers.admin;
          }
          return res.json(mockUsers.admin);
        } else if (username === 'superadmin' && password === 'superadmin123') {
          if (req.session) {
            req.session.user = mockUsers.superadmin;
          }
          return res.json(mockUsers.superadmin);
        } else if (username === 'user' && password === 'user123') {
          if (req.session) {
            req.session.user = mockUsers.user;
          }
          return res.json(mockUsers.user);
        }
      }
      
      // Incorrect credentials
      res.status(401).json({ message: 'Invalid username or password' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Serve public images
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

  // Get subscribers list
  app.get("/api/subscribers", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      console.log("Fetching all subscribers...");
      const subscribers = await storage.getAllSubscribers();
      console.log("Found subscribers:", subscribers);
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Error fetching subscribers" });
    }
  });

  // Admin Stats API
  app.get("/api/admin/stats", async (req, res) => {
    // Allow development bypass for testing
    const bypassAuth = process.env.NODE_ENV !== 'production';

    if (!bypassAuth && (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin'))) {
      console.log('Authentication failed for admin stats endpoint');
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      console.log('Fetching admin statistics...');
      
      // Get system stats
      const users = await storage.getAllUsers();
      const pendingComments = await storage.getUnapprovedComments();
      const pendingPosts = await storage.getUnapprovedPosts();
      
      // Get content stats
      const posts = await storage.getAllPosts();
      const tracks = await storage.getAllTracks();
      const products = await storage.getAllProducts();
      
      // Calculate active users - users who have logged in within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = users.filter(user => 
        user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo
      ).length;

      // Calculate new users - registered within the last 30 days
      const newUsers = users.filter(user => 
        user.createdAt && new Date(user.createdAt) > thirtyDaysAgo
      ).length;

      // Calculate user role distribution
      const userRolesDistribution = {
        user: users.filter(user => user.role === 'user').length,
        admin: users.filter(user => user.role === 'admin').length,
        super_admin: users.filter(user => user.role === 'super_admin').length
      };

      // Get total pending reviews (comments + posts)
      const pendingReviews = pendingComments.length + pendingPosts.length;

      // Calculate approval rate (if any reviews have been done)
      const approvedComments = await db.select({ count: sql`count(*)` })
        .from(comments)
        .where(eq(comments.approved, true));

      const rejectedComments = await db.select({ count: sql`count(*)` })
        .from(comments)
        .where(eq(comments.approved, false));

      const totalReviewed = parseInt(approvedComments[0]?.count.toString() || '0') + 
                            parseInt(rejectedComments[0]?.count.toString() || '0');

      const approvalRate = totalReviewed > 0 
        ? Math.round((parseInt(approvedComments[0]?.count.toString() || '0') / totalReviewed) * 100)
        : 0;

      // Determine system health based on pending reviews and other factors
      let systemHealth = "Optimal";
      if (pendingReviews > 50) {
        systemHealth = "Critical";
      } else if (pendingReviews > 20) {
        systemHealth = "Warning";
      }

      // Generate recent activities (placeholder for now)
      const recentActivities = [];
      
      // Simulating recent activities by taking newest users and generating activities
      const newestUsers = [...users]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);
        
      newestUsers.forEach((user, index) => {
        recentActivities.push({
          id: index + 1,
          action: 'User Registration',
          timestamp: user.createdAt || new Date().toISOString(),
          user: user.username
        });
      });

      // Return consolidated stats with all fields needed by frontend
      res.json({
        totalUsers: users.length,
        activeUsers: activeUsers,
        newUsers: newUsers,
        newRegistrations: newUsers, // Alias for newUsers to support both naming conventions
        pendingReviews,
        systemHealth,
        approvalRate,
        totalPosts: posts.length,
        totalProducts: products.length,
        totalMusic: tracks.length,
        userRolesDistribution,
        recentActivities
      });
      
      console.log('Admin stats successfully retrieved');
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Error fetching admin stats" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const users = await storage.getAllUsers();
      // Map each user to a safe user object without sensitive fields
      const safeUsers = users.map(user => createSafeUser(user));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // User update endpoint
  app.patch("/api/users/:userId", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const { action } = req.body;

      // Handle different actions based on the request
      switch (action) {
        case 'promote':
          if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only super admins can promote users" });
          }
          const promotedUser = await storage.updateUserRole(userId, 'admin');
          return res.json(createSafeUser(promotedUser));

        case 'demote':
          if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only super admins can demote users" });
          }
          const demotedUser = await storage.updateUserRole(userId, 'user');
          return res.json(createSafeUser(demotedUser));

        case 'delete':
          // Check if user is trying to delete themselves
          if (userId === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
          }

          // Get user to delete and perform role checks
          const userToDelete = await storage.getUser(userId);
          if (!userToDelete) {
            return res.status(404).json({ message: "User not found" });
          }

          // Prevent deletion of super_admin by non-super_admin
          if (userToDelete.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only super admins can delete super admin accounts" });
          }

          // Prevent admin from deleting other admins
          if (userToDelete.role === 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only super admins can delete admin accounts" });
          }

          await storage.deleteUser(userId);
          return res.json({ success: true, message: "User deleted successfully" });
          
        case 'ban':
          // Check if user is trying to ban themselves
          if (userId === req.user.id) {
            return res.status(400).json({ message: "You cannot ban your own account" });
          }

          // Get user to ban and perform role checks
          const userToBan = await storage.getUser(userId);
          if (!userToBan) {
            return res.status(404).json({ message: "User not found" });
          }

          // Prevent banning of super_admin
          if (userToBan.role === 'super_admin') {
            return res.status(403).json({ message: "Super admin accounts cannot be banned" });
          }

          // Prevent admin from banning other admins
          if (userToBan.role === 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only super admins can ban admin accounts" });
          }

          const bannedUser = await storage.banUser(userId);
          return res.json(createSafeUser(bannedUser));
          
        case 'unban':
          // Get user to unban and perform role checks
          const userToUnban = await storage.getUser(userId);
          if (!userToUnban) {
            return res.status(404).json({ message: "User not found" });
          }

          // Prevent admin from unbanning other admins
          if (userToUnban.role === 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only super admins can unban admin accounts" });
          }

          const unbannedUser = await storage.unbanUser(userId);
          return res.json(createSafeUser(unbannedUser));

        default:
          return res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Existing subscriber route with added validation
  app.post("/api/subscribe", newsletterValidation, validate, async (req, res) => {
    try {
      console.log("Received subscription request:", req.body);
      // Input validation performed by express-validator middleware
      const data = insertSubscriberSchema.parse(req.body);
      const subscriber = await storage.createSubscriber(data);
      console.log("Created new subscriber:", subscriber);

      // Send welcome email if SMTP is configured
      if (transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@example.com',
            to: data.email,
            subject: "Welcome to Dale Loves Whales Newsletter!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #4A90E2; text-align: center;">Welcome to the Cosmic Journey, ${data.name}! 🐋</h2>
                <p style="font-size: 16px; line-height: 1.5;">Thank you for joining Dale the Whale's musical universe! Get ready for an extraordinary journey through sound and spirit.</p>
                <h3 style="color: #4A90E2; margin-top: 20px;">What to Expect:</h3>
                <ul style="list-style-type: none; padding: 0;">
                  <li style="margin: 10px 0; padding-left: 20px;">🎵 First access to new releases and exclusive tracks</li>
                  <li style="margin: 10px 0; padding-left: 20px;">🎪 Early announcements about upcoming shows and events</li>
                  <li style="margin: 10px 0; padding-left: 20px;">🌟 Behind-the-scenes content and personal stories</li>
                  <li style="margin: 10px 0; padding-left: 20px;">🎁 Special subscriber-only offers and experiences</li>
                </ul>
                <p style="font-size: 16px; line-height: 1.5; margin-top: 20px;">Stay tuned for your first newsletter, coming soon with some cosmic vibes!</p>
                <div style="text-align: center; margin-top: 30px; font-style: italic; color: #666;">
                  <p>"Let the music guide your soul through the celestial waves"</p>
                  <p style="margin-top: 20px;">- Dale 🐋</p>
                </div>
              </div>
            `
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }

      res.json({ 
        message: "Successfully subscribed!", 
        subscriber 
      });

    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        res.status(400).json({ message: "This email is already subscribed" });
      } else if (error.errors) { // Zod validation error
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error("Subscription error:", error);
        res.status(500).json({ message: "Failed to process subscription" });
      }
    }
  });

  // Check if email exists in subscribers
  app.get("/api/subscribers/check/:email", async (req, res) => {
    try {
      const subscriber = await storage.findSubscriberByEmail(req.params.email);
      res.json({ exists: !!subscriber });
    } catch (error) {
      res.status(500).json({ message: "Error checking subscriber" });
    }
  });

  // Content management endpoints for Admin

  // Get unapproved posts
  app.get("/api/admin/posts/unapproved", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const posts = await storage.getUnapprovedPosts();

      // Enhance posts with author usernames
      const enhancedPosts = await Promise.all(posts.map(async (post) => {
        let authorName = 'Unknown';
        try {
          const author = await storage.getUser(post.authorId);
          authorName = author?.username || 'Unknown';
        } catch (error) {
          console.error(`Error fetching author for post ${post.id}:`, error);
        }

        return {
          ...post,
          authorName
        };
      }));

      res.json(enhancedPosts);
    } catch (error) {
      console.error("Error fetching unapproved posts:", error);
      res.status(500).json({ message: "Error fetching unapproved posts" });
    }
  });

  // Newsletter management endpoints
  // Get all newsletters
  app.get("/api/newsletters", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const newsletters = await storage.getAllNewsletters();
      res.json(newsletters);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      res.status(500).json({ message: "Error fetching newsletters" });
    }
  });

  // Test endpoint - public API for newsletters (for testing purposes only)
  app.get("/api/test/newsletters", async (req, res) => {
    try {
      const newsletters = await storage.getAllNewsletters();
      res.json(newsletters);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      res.status(500).json({ message: "Error fetching newsletters" });
    }
  });
  
  // Test endpoint for safe user data (for testing purposes only)
  app.get("/api/test/safe-user", async (req, res) => {
    try {
      const user = await storage.getUserByUsername('admin');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a safe version of the user object
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt
      };
      
      // Return both the full user (for debugging) and safe user
      res.json({
        fullUser: user,
        safeUser
      });
    } catch (error) {
      console.error("Error fetching safe user:", error);
      res.status(500).json({ message: "Error fetching safe user" });
    }
  });

  // Test endpoint - initialize security settings (for testing purposes only)
  app.get("/api/test/security/init", (req, res) => {
    try {
      const settings = getSecuritySettings();
      res.json({ 
        message: "Security settings initialized successfully",
        settings
      });
    } catch (error) {
      console.error("Error initializing security settings:", error);
      res.status(500).json({ message: "Error initializing security settings" });
    }
  });

  // Test endpoint - update security settings (for testing purposes only)
  app.post("/api/test/security/settings", (req, res) => {
    try {
      const { setting, enabled } = req.body;

      // Validate inputs
      if (!setting || typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'Invalid input. Requires setting name and boolean enabled value' });
      }

      // Check if setting is valid
      const validSettings = Object.keys(getSecuritySettings());
      if (!validSettings.includes(setting)) {
        return res.status(400).json({ message: `Invalid setting: ${setting}. Valid options are: ${validSettings.join(', ')}` });
      }

      // Update the setting
      const success = updateSecuritySetting(
        setting as keyof SecuritySettings, 
        enabled,
        999, // Fake user ID for testing
        'super_admin' // Fake role for testing
      );

      if (!success) {
        return res.status(500).json({ message: 'Failed to update security setting' });
      }

      res.json({ 
        message: `Security setting ${setting} ${enabled ? 'enabled' : 'disabled'} successfully`,
        setting,
        enabled,
        settings: getSecuritySettings()
      });
    } catch (error) {
      console.error('Error updating security setting:', error);
      res.status(500).json({ message: 'Failed to update security setting' });
    }
  });

  // Test endpoint - view security settings (for testing purposes only)
  app.get("/api/test/security/settings", (req, res) => {
    try {
      const settings = getSecuritySettings();
      res.json({
        message: 'Security settings retrieved successfully',
        settings
      });
    } catch (error) {
      console.error('Error retrieving security settings:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve security settings', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Test endpoint - simulate unauthorized access (for testing purposes only)
  app.get("/api/test/security/simulate-unauthorized", (req, res) => {
    try {
      // Log the unauthorized access attempt
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'API_ACCESS',
        timestamp: new Date().toISOString(),
        ip: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'Unknown',
        path: '/api/test/security/simulate-unauthorized',
        method: 'GET'
      });

      res.status(401).json({
        message: 'Unauthorized access attempt logged successfully',
        details: 'This endpoint simulates an unauthorized access attempt to test security logging'
      });
    } catch (error) {
      console.error('Error simulating unauthorized access:', error);
      res.status(500).json({ 
        message: 'Failed to simulate unauthorized access', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Test endpoint - get security statistics (for testing purposes only)
  app.get("/api/test/security/stats", (req, res) => {
    try {
      // Create the logs directory structure if it doesn't exist
      const logsDir = path.join(process.cwd(), 'logs', 'security');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
        return res.json({ 
          message: 'No security statistics available yet',
          stats: {
            total: 0,
            byType: {},
            bySetting: {},
            recentEvents: []
          }
        });
      }

      const logFilePath = path.join(logsDir, 'security.log');

      // Check if the file exists, and create it if it doesn't
      if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '', 'utf8');
        return res.json({ 
          message: 'No security statistics available yet',
          stats: {
            total: 0,
            byType: {},
            bySetting: {},
            recentEvents: []
          }
        });
      }

      // Read the log file
      const logData = fs.readFileSync(logFilePath, 'utf8');

      // If log file is empty, return empty stats
      if (!logData.trim()) {
        return res.json({ 
          message: 'No security statistics available yet',
          stats: {
            total: 0,
            byType: {},
            bySetting: {},
            recentEvents: []
          }
        });
      }

      // Parse the log entries
      const logEntries = logData
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return { rawLog: line, parseError: true };
          }
        });

      // Calculate statistics
      const stats = {
        total: logEntries.length,
        byType: {},
        bySetting: {},
        recentEvents: logEntries.slice(-5).reverse() // Get the 5 most recent events
      };

      // Count events by type and setting
      logEntries.forEach(entry => {
        // Count by type
        const type = entry.type || 'UNKNOWN';
        if (!stats.byType[type]) {
          stats.byType[type] = 1;
        } else {
          stats.byType[type]++;
        }

        // Count by setting
        if (entry.setting) {
          const setting = entry.setting;
          if (!stats.bySetting[setting]) {
            stats.bySetting[setting] = 1;
          } else {
            stats.bySetting[setting]++;
          }
        }
      });

      res.json({ 
        message: 'Security statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Error retrieving security statistics:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve security statistics', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Test endpoint - view security logs (for testing purposes only)
  app.get("/api/test/security/logs", (req, res) => {
    try {
      // Create the logs directory structure if it doesn't exist
      const logsDir = path.join(process.cwd(), 'logs', 'security');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const logFilePath = path.join(logsDir, 'security.log');

      // Check if the file exists, and create it if it doesn't
      if (!fs.existsSync(logFilePath)) {
        // Create an empty log file
        fs.writeFileSync(logFilePath, '', 'utf8');
        return res.json({ 
          message: 'Security log file created',
          logs: [],
          count: 0
        });
      }

      // Read the log file
      const logData = fs.readFileSync(logFilePath, 'utf8');

      // If log file is empty, return empty array
      if (!logData.trim()) {
        return res.json({ 
          message: 'Security log file is empty',
          logs: [],
          count: 0
        });
      }

      // Parse the log entries and format them
      const logEntries = logData
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return { rawLog: line, parseError: true };
          }
        });

      res.json({ 
        message: 'Security logs retrieved successfully',
        logs: logEntries,
        count: logEntries.length
      });
    } catch (error) {
      console.error('Error retrieving security logs:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve security logs', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // General security scan endpoint
  app.get("/api/security/scan", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'SECURITY_SCAN',
        timestamp: new Date().toISOString(),
        ip: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'Unknown',
        path: '/api/security/scan',
        method: 'GET'
      });
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const scanResults = await runSecurityScan();

      res.json({
        message: 'Security scan completed successfully',
        timestamp: scanResults.timestamp,
        summary: {
          totalIssues: scanResults.totalIssues,
          criticalIssues: scanResults.criticalIssues,
          highIssues: scanResults.highIssues,
          mediumIssues: scanResults.mediumIssues,
          lowIssues: scanResults.lowIssues
        },
        vulnerabilities: scanResults.vulnerabilities
      });
    } catch (error) {
      console.error('Error running security scan:', error);
      res.status(500).json({
        message: 'Failed to run security scan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Authentication security scan endpoint
  app.get("/api/security/auth-scan", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'AUTH_SECURITY_SCAN',
        timestamp: new Date().toISOString(),
        ip: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'Unknown',
        path: '/api/security/auth-scan',
        method: 'GET'
      });
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const authScanResults = await runAuthSecurityScan();

      res.json({
        message: 'Authentication security scan completed successfully',
        timestamp: authScanResults.timestamp,
        summary: {
          totalIssues: authScanResults.totalIssues,
          criticalIssues: authScanResults.criticalIssues,
          highIssues: authScanResults.highIssues,
          mediumIssues: authScanResults.mediumIssues,
          lowIssues: authScanResults.lowIssues
        },
        vulnerabilities: authScanResults.vulnerabilities,
        securityRating: authScanResults.criticalIssues === 0 ? 
          (authScanResults.highIssues === 0 ? 'A' : 'B') : 'C'
      });
    } catch (error) {
      console.error('Error running authentication security scan:', error);
      res.status(500).json({
        message: 'Failed to run authentication security scan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test security scan endpoint (for testing purposes)
  app.get("/api/test/security/scan", async (req, res) => {
    try {
      const scanResults = await runSecurityScan();

      res.json({
        message: 'Security scan completed successfully',
        timestamp: scanResults.timestamp,
        summary: {
          totalIssues: scanResults.totalIssues,
          criticalIssues: scanResults.criticalIssues,
          highIssues: scanResults.highIssues,
          mediumIssues: scanResults.mediumIssues,
          lowIssues: scanResults.lowIssues
        },
        vulnerabilities: scanResults.vulnerabilities
      });
    } catch (error) {
      console.error('Error running security scan:', error);
      res.status(500).json({
        message: 'Failed to run security scan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get a single newsletter by ID
  app.get("/api/newsletters/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const newsletter = await storage.getNewsletterById(id);

      if (!newsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      res.json(newsletter);
    } catch (error) {
      console.error(`Error fetching newsletter:`, error);
      res.status(500).json({ message: "Error fetching newsletter" });
    }
  });

  // Create a new newsletter with validation
  app.post("/api/newsletters", [
    // Authentication check
    (req, res, next) => {
      if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      next();
    },
    // Basic validation using express-validator
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters').escape(),
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
    body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ min: 3, max: 100 }).withMessage('Subject must be between 3 and 100 characters').escape(),
    validate
  ], async (req, res) => {
    try {
      // After passing validation middleware, parse schema
      const data = insertNewsletterSchema.parse(req.body);
      const newsletter = await storage.createNewsletter(data);

      res.status(201).json(newsletter);
    } catch (error) {
      console.error("Error creating newsletter:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid newsletter data", details: error.message });
      } else {
        res.status(400).json({ message: "Invalid newsletter data" });
      }
    }
  });

  // Update an existing newsletter
  app.patch("/api/newsletters/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const data = req.body;

      // Prevent updating sent newsletters
      const existingNewsletter = await storage.getNewsletterById(id);
      if (!existingNewsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      if (existingNewsletter.status === 'sent') {
        return res.status(400).json({ message: "Cannot update a newsletter that has already been sent" });
      }

      const updatedNewsletter = await storage.updateNewsletter(id, data);
      res.json(updatedNewsletter);
    } catch (error) {
      console.error("Error updating newsletter:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid newsletter data", details: error.message });
      } else {
        res.status(400).json({ message: "Invalid newsletter data" });
      }
    }
  });

  // Send a newsletter
  app.post("/api/newsletters/:id/send", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const id = parseInt(req.params.id);

      // Check if newsletter exists and is not already sent
      const newsletter = await storage.getNewsletterById(id);
      if (!newsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      if (newsletter.status === 'sent') {
        return res.status(400).json({ message: "Newsletter has already been sent" });
      }

      // Get all active subscribers
      const subscribers = await storage.getAllSubscribers();
      const activeSubscribers = subscribers.filter(sub => sub.active);

      if (activeSubscribers.length === 0) {
        return res.status(400).json({ message: "No active subscribers to send to" });
      }

      // Send newsletter to all active subscribers (in a real app, this would use a queue)
      if (transporter) {
        try {
          // Send newsletter (just to the first subscriber for demo purposes)
          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@example.com',
            to: activeSubscribers[0].email, // In production, use BCC for all subscribers
            subject: newsletter.title,
            html: newsletter.content
          });
        } catch (emailError) {
          console.error("Failed to send newsletter:", emailError);
          return res.status(500).json({ message: "Failed to send newsletter email" });
        }
      }

      // Update newsletter status to sent
      const sentNewsletter = await storage.sendNewsletter(id);
      res.json({ message: "Newsletter sent successfully", newsletter: sentNewsletter });
    } catch (error) {
      console.error("Error sending newsletter:", error);
      res.status(500).json({ message: "Error sending newsletter" });
    }
  });

  // Get unapproved comments
  app.get("/api/admin/comments/unapproved", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const comments = await storage.getUnapprovedComments();

      // Enhance comments with author names and post titles
      const enhancedComments = await Promise.all(comments.map(async (comment) => {
        let authorName = 'Unknown';
        let postTitle = 'Unknown Post';

        try {
          const author = await storage.getUser(comment.authorId);
          authorName = author?.username || 'Unknown';
        } catch (error) {
          console.error(`Error fetching author for comment ${comment.id}:`, error);
        }

        try {
          const post = await storage.getPostById(comment.postId);
          postTitle = post?.title || 'Unknown Post';
        } catch (error) {
          console.error(`Error fetching post for comment ${comment.id}:`, error);
        }

        return {
          ...comment,
          authorName,
          postTitle
        };
      }));

      res.json(enhancedComments);
    } catch (error) {
      console.error("Error fetching unapproved comments:", error);
      res.status(500).json({ message: "Error fetching unapproved comments" });
    }
  });

  // Get recent tracks for review
  app.get("/api/admin/tracks/recent", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const tracks = await storage.getTracks();

      // Sort tracks by creation date (newest first) and take the most recent 10
      const recentTracks = [...tracks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      // Add uploader information if available
      const enhancedTracks = await Promise.all(recentTracks.map(async (track) => {
        let uploadedByName = 'Unknown';

        if (track.uploadedById) {
          try {
            const uploader = await storage.getUser(track.uploadedById);
            uploadedByName = uploader?.username || 'Unknown';
          } catch (error) {
            console.error(`Error fetching uploader for track ${track.id}:`, error);
          }
        }

        return {
          ...track,
          uploadedByName
        };
      }));

      res.json(enhancedTracks);
    } catch (error) {
      console.error("Error fetching recent tracks:", error);
      res.status(500).json({ message: "Error fetching recent tracks" });
    }
  });

  // Approve a post
  app.post("/api/admin/posts/:postId/approve", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const postId = parseInt(req.params.postId);
      const approvedPost = await storage.approvePost(postId);
      res.json(approvedPost);
    } catch (error) {
      console.error(`Error approving post:`, error);
      res.status(500).json({ message: "Error approving post" });
    }
  });

  // Approve a comment
  app.post("/api/admin/comments/:commentId/approve", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const commentId = parseInt(req.params.commentId);
      const approvedComment = await storage.approveComment(commentId);
      res.json(approvedComment);
    } catch (error) {
      console.error(`Error approving comment:`, error);
      res.status(500).json({ message: "Error approving comment" });
    }
  });

  // Reject a comment
  app.post("/api/admin/comments/:commentId/reject", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const commentId = parseInt(req.params.commentId);
      const rejectedComment = await storage.rejectComment(commentId);
      res.json(rejectedComment);
    } catch (error) {
      console.error(`Error rejecting comment:`, error);
      res.status(500).json({ message: "Error rejecting comment" });
    }
  });

  // Delete a track
  app.delete("/api/admin/tracks/:trackId", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const trackId = parseInt(req.params.trackId);
      await storage.deleteMusic(trackId, req.user.id, req.user.role as 'admin' | 'super_admin');
      res.json({ success: true, message: "Track deleted successfully" });
    } catch (error) {
      console.error(`Error deleting track:`, error);
      res.status(500).json({ message: "Error deleting track" });
    }
  });

  // Blog post routes
  app.get("/api/posts", async (req, res) => {
    try {
      console.log("Fetching all posts...");
      const posts = await storage.getPosts();
      console.log(`Found ${posts.length} posts`);

      // Only return approved posts for non-admin users
      // Check if authentication function exists
      const isAuthenticated = typeof req.isAuthenticated === 'function' 
        ? req.isAuthenticated() 
        : false;
      
      const isAdmin = isAuthenticated && req.user?.role && ['admin', 'super_admin'].includes(req.user.role);
      
      // During development, return all posts
      const filteredPosts = process.env.NODE_ENV === 'production' && !isAdmin
        ? posts.filter(post => post.approved)
        : posts;

      res.json(filteredPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ 
        message: "Error fetching posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/posts/unapproved", async (req, res) => {
    // Check if authentication function exists
    const isAuthenticated = typeof req.isAuthenticated === 'function' 
      ? req.isAuthenticated() 
      : false;
    
    const isAdmin = isAuthenticated && req.user?.role && ['admin', 'super_admin'].includes(req.user.role);
    
    // During development, allow access to unapproved posts
    if (process.env.NODE_ENV === 'production' && (!isAuthenticated || !isAdmin)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const posts = await storage.getUnapprovedPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching unapproved posts" });
    }
  });

  app.post("/api/posts/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const post = await storage.approvePost(Number(req.params.id));
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Error approving post" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(Number(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      // Only allow viewing unapproved posts if user is admin
      if (!post.approved && (!req.isAuthenticated() || req.user?.role === 'user')) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  app.post("/api/posts", postValidation.create, validate, async (req, res) => {
    try {
      // Input is already validated by express-validator middleware
      const data = insertPostSchema.parse(req.body);
      const post = await storage.createPost(data);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid post data", details: error.message });
      } else {
        res.status(400).json({ message: "Invalid post data" });
      }
    }
  });
  
  app.patch("/api/posts/:id", async (req, res) => {
    // Check authentication and authorization
    if (!req.isAuthenticated()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const postId = parseInt(req.params.id);
      const existingPost = await storage.getPostById(postId);
      
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user is authorized to edit this post
      const isAuthor = existingPost.authorId === req.user.id;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
      
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized to edit this post" });
      }
      
      // Update the post
      const updatedData = req.body;
      const updatedPost = await storage.updatePost(postId, updatedData);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Error updating post" });
    }
  });
  
  app.delete("/api/posts/:id", async (req, res) => {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const postId = parseInt(req.params.id);
      const existingPost = await storage.getPostById(postId);
      
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user is authorized to delete this post
      const isAuthor = existingPost.authorId === req.user.id;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
      
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized to delete this post" });
      }
      
      // Delete the post
      await storage.deletePost(postId);
      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Error deleting post" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/categories", categoryValidation, validate, async (req, res) => {
    try {
      // Input is already validated by express-validator middleware
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid category data", details: error.message });
      } else {
        res.status(400).json({ message: "Invalid category data" });
      }
    }
  });

  // Comment routes
  app.post("/api/posts/:postId/comments", commentValidation, validate, async (req, res) => {
    try {
      // Auto-approve comments from admin users
      const isAdmin = req.isAuthenticated() && (req.user?.role === 'admin' || req.user?.role === 'super_admin');

      // Input is already validated by express-validator middleware
      const data = insertCommentSchema.parse({
        ...req.body,
        postId: Number(req.params.postId),
        approved: isAdmin // Auto-approve if admin
      });

      console.log("Creating comment with data:", data);
      const comment = await storage.createComment(data);
      console.log("Created comment:", comment);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof Error) {
        res.status(400).json({ 
          message: "Invalid comment data", 
          details: error.message 
        });
      } else {
        res.status(400).json({ message: "Invalid comment data" });
      }
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = Number(req.params.postId);
      // Only show approved comments to non-admin users
      const onlyApproved = !req.isAuthenticated() || req.user?.role === 'user';
      console.log(`Fetching comments for post ${postId}, onlyApproved: ${onlyApproved}, user: ${req.user?.username || 'guest'}`);

      const comments = await storage.getCommentsByPostId(postId, onlyApproved);
      console.log(`Returning ${comments.length} comments for post ${postId}`);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  app.get("/api/posts/comments/unapproved", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      console.log('Unauthorized access attempt to unapproved comments');
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      console.log("Fetching unapproved comments");
      const comments = await storage.getUnapprovedComments();
      console.log("Found unapproved comments:", comments);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching unapproved comments:", error);
      res.status(500).json({ message: "Error fetching unapproved comments" });
    }
  });

  app.post("/api/posts/comments/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const comment = await storage.approveComment(Number(req.params.id));
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Error approving comment" });
    }
  });

  app.post("/api/contact", contactValidation, validate, async (req, res) => {
  try {
    // Input is already validated by our middleware
    const { insertContactSchema } = await import("@shared/schema");
    const data = insertContactSchema.parse(req.body);

    // Create database entry
    const message = await db.insert(contactMessages).values(data).returning();

    // Send success response
    res.json({ 
      message: "Message sent successfully!", 
      data: message[0] 
    });
  } catch (error) {
    console.error("Contact form error:", error);
    if (error instanceof Error) {
      res.status(400).json({ 
        message: error.message || "Failed to send message" 
      });
    } else {
      res.status(400).json({ 
        message: "Failed to send message" 
      });
    }
  }
});

app.post("/api/posts/comments/:id/reject", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const comment = await storage.rejectComment(Number(req.params.id));
      res.json(comment);
    } catch (error) {
      console.error("Error rejecting comment:", error);
      res.status(500).json({ message: "Error rejecting comment" });
    }
  });

  // Password recovery routes
  app.post("/api/recover-password", passwordRecoveryValidation, validate, async (req, res) => {
    try {
      // Email is already validated by our middleware
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account exists with this email, you will receive a recovery link." });
      }

      const token = await storage.createPasswordResetToken(user.id);
      const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Password Recovery",
        text: `Click this link to reset your password: ${resetLink}`,
        html: `
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
        `,
      });

      res.json({ message: "If an account exists with this email, you will receive a recovery link." });
    } catch (error) {
      console.error("Password recovery error:", error);
      res.status(500).json({ message: "Failed to process recovery request" });
    }
  });

  app.post("/api/reset-password", passwordResetValidation, validate, async (req, res) => {
    try {
      // Input is already validated by our middleware
      const { token, newPassword } = req.body;
      const user = await storage.validatePasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      if (error instanceof Error) {
        res.status(500).json({ 
          message: "Failed to reset password",
          details: error.message 
        });
      } else {
        res.status(500).json({ message: "Failed to reset password" });
      }
    }
  });

  // Music upload route
  app.post("/api/upload/music", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file;
    const targetPage = req.body.page;
    const allowedPages = ['new_music', 'music_archive', 'blog', 'home', 'about', 'newsletter'];
    const allowedTypes = ['mp3', 'mp4', 'aac', 'flac', 'wav', 'aiff', 'avi', 'wmv', 'mov'];

    if (!allowedPages.includes(targetPage)) {
      return res.status(400).json({ message: "Invalid target page" });
    }

    // Enhanced file validation
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return res.status(400).json({ message: "Invalid file type. Allowed types: " + allowedTypes.join(', ') });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return res.status(400).json({ message: "File too large. Maximum size: 50MB" });
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac', 
      'audio/wav', 'audio/aiff', 'video/avi', 'video/x-ms-wmv', 
      'video/quicktime', 'video/mp4'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: "Invalid file MIME type. Allowed types: " + allowedMimeTypes.join(', ') });
    }

    try {
      const result = await storage.uploadMusic({
        file: file,
        targetPage: targetPage,
        uploadedBy: req.user.id,
        userRole: req.user.role as 'admin' | 'super_admin'
      });
      res.json(result);
    } catch (error) {
      console.error("Error uploading music file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Music routes 
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getTracks();
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      res.status(500).json({ 
        message: "Error fetching tracks",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      res.json(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ 
        message: "Error fetching albums",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete music endpoint
  app.delete("/api/tracks/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const trackId = Number(req.params.id);
      await storage.deleteMusic(trackId, req.user.id, req.user.role as 'admin' | 'super_admin');
      res.json({ message: "Track deleted successfully" });
    } catch (error) {
      console.error("Error deleting track:", error);
      res.status(error.message === 'Track not found' ? 404 : 500)
        .json({ message: error.message || "Failed to delete track" });
    }
  });

  //This route was duplicated in the original code.  Removing the duplicate.

    // Admin analytics endpoint
  app.get("/api/admin/analytics/detailed", async (req, res) => {
    // Check for BYPASS_AUTHENTICATION variable from protected-route.tsx
    const bypassAuth = process.env.NODE_ENV !== 'production';

    if (!bypassAuth && (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin'))) {
      console.log('Authentication failed for analytics endpoint');
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      console.log('Fetching admin analytics data...');

      // Extract date range parameters from query
      const fromDate = req.query.from as string || undefined;
      const toDate = req.query.to as string || undefined;

      // Log the date range for debugging
      console.log(`Date range for analytics: from=${fromDate}, to=${toDate}`);

      // Get analytics data from storage interface with error handling
      let analyticsData;
      try {
        analyticsData = await storage.getAdminAnalytics(fromDate, toDate);
        console.log('Base analytics data retrieved:', analyticsData);
      } catch (analyticError) {
        console.error('Error retrieving base analytics:', analyticError);
        analyticsData = {
          activeUsers: 0,
          newRegistrations: 0,
          contentReports: 0,
          systemHealth: 'Error'
        };
      }

      // Generate time-series data from database if possible, otherwise use realistic patterns
      // This represents data that would be calculated from actual database records
      let activeUsersOverTime = [0, 0, 0, 0, 0, 0];
      let newRegistrationsOverTime = [0, 0, 0, 0, 0, 0];

      if (analyticsData && analyticsData.activeUsers) {
        // Generate realistic data patterns based on current metrics
        const baseActiveUsers = analyticsData.activeUsers;
        activeUsersOverTime = [
          Math.max(0, Math.floor(baseActiveUsers * 0.7)),
          Math.max(0, Math.floor(baseActiveUsers * 0.8)),
          Math.max(0, Math.floor(baseActiveUsers * 0.85)),
          Math.max(0, Math.floor(baseActiveUsers * 0.9)),
          Math.max(0, Math.floor(baseActiveUsers * 0.95)),
          baseActiveUsers
        ];
      }

      if (analyticsData && analyticsData.newRegistrations) {
        // Generate realistic data patterns based on current metrics
        const baseNewRegistrations = analyticsData.newRegistrations;
        newRegistrationsOverTime = [
          Math.max(0, Math.floor(baseNewRegistrations * 0.4)),
          Math.max(0, Math.floor(baseNewRegistrations * 0.5)),
          Math.max(0, Math.floor(baseNewRegistrations * 0.6)),
          Math.max(0, Math.floor(baseNewRegistrations * 0.7)),
          Math.max(0, Math.floor(baseNewRegistrations * 0.8)),
          baseNewRegistrations
        ];
      }

      // User role distribution with error handling
      let userRolesDistribution = {
        user: 0,
        admin: 0,
        super_admin: 0
      };

      try {
        // Fetch users to calculate user role distribution
        const users = await storage.getAllUsers();
        console.log(`Retrieved ${users.length} users for role distribution`);

        // Count users by role
        users.forEach(user => {
          if (user.role && user.role in userRolesDistribution) {
            userRolesDistribution[user.role as keyof typeof userRolesDistribution]++;
          }
        });
      } catch (userError) {
        console.error('Error retrieving user data:', userError);
      }

      // Content distribution with error handling
      let contentDistribution = {
        posts: 0,
        comments: 0,
        tracks: 0
      };

      try {
        // Get content counts
        const posts = await storage.getPosts();
        contentDistribution.posts = posts.length;
        console.log(`Retrieved ${posts.length} posts`);
      } catch (postsError) {
        console.error('Error retrieving posts:', postsError);
      }

      try {
        const comments = await storage.getUnapprovedComments();
        contentDistribution.comments = comments.length;
        console.log(`Retrieved ${comments.length} comments`);
      } catch (commentsError) {
        console.error('Error retrieving comments:', commentsError);
      }

      try {
        const tracks = await storage.getTracks();
        contentDistribution.tracks = tracks.length;
        console.log(`Retrieved ${tracks.length} tracks`);
      } catch (tracksError) {
        console.error('Error retrieving tracks:', tracksError);
      }

      // Build the complete response
      const response = {
        ...analyticsData,
        activeUsersOverTime,
        newRegistrationsOverTime,
        contentDistribution,
        userRolesDistribution
      };

      console.log('Sending analytics response:', JSON.stringify(response));
      res.json(response);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ 
        message: "Error fetching analytics data",
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Database monitoring routes
  app.use('/api/admin/db-monitor', (req, res, next) => {
    // Check authentication and admin role
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    next();
  }, dbMonitorRoutes);
  
  // Database security routes
  // Main database security routes (authenticated)
  app.use('/api/admin/database-security', (req, res, next) => {
    // Check authentication and admin role
    if (!req.isAuthenticated || !req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    next();
  }, databaseSecurityRoutes);
  
  // Special route for testing database validation without authentication or CSRF
  app.use('/api/test/database-security', databaseSecurityRoutes);
  
  // Apply database security middleware globally
  app.use(validateDatabaseQuery);
  app.use(sanitizeDatabaseParams);

  // Shop routes
  const router = express.Router();
  // Forward /api/products to /api/shop/products for compatibility
  app.get('/api/products', (req, res, next) => {
    res.redirect('/api/shop/products');
  });
  
  // Test page route
  app.get('/test-shop', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'test-page.html'));
  });

  app.use('/api/shop', shopRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/content/workflow', contentWorkflowRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use(mediaRoutes); // Adding media routes for file uploads and management

  // Security routes
  app.use('/api/security', securityRouter);
  app.use('/api/security/audit', auditSecurityRoutes);
  app.use('/api/test', testSecurityRouter);

  // Create HTTP server with the Express app
  const httpServer = createServer(app);
  // Contact form submission
  // Import contactValidation & validate from our new modules (added at the top of the file)
  app.post('/api/contact/submit', contactValidation, validate, async (req, res) => {
    try {
      const { name, email, message } = req.body;

      // Input has been validated by our middleware
      await db.insert(contactMessages).values({
        name,
        email, 
        message
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to save contact form:', error);
      res.status(500).json({ error: 'Failed to save contact form' });
    }
  });

  // Security log endpoint
  app.post('/api/security/log', (req, res) => {
    try {
      // Log the security event from the request body
      logSecurityEvent(req.body);
      res.json({ success: true, message: 'Security event logged successfully' });
    } catch (error) {
      console.error('Error logging security event:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to log security event',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get security settings (admin only)
  app.get('/api/security/settings', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const settings = getSecuritySettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching security settings:', error);
      res.status(500).json({ message: 'Failed to fetch security settings' });
    }
  });

  // Update a security setting (admin only)
  app.post('/api/security/settings', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { setting, enabled } = req.body;

      // Validate inputs
      if (!setting || typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'Invalid input. Requires setting name and boolean enabled value' });
      }

      // Check if setting is valid
      const validSettings = Object.keys(getSecuritySettings());
      if (!validSettings.includes(setting)) {
        return res.status(400).json({ message: `Invalid setting: ${setting}. Valid options are: ${validSettings.join(', ')}` });
      }

      // Update the setting
      const success = updateSecuritySetting(
        setting as keyof SecuritySettings, 
        enabled,
        req.user?.id,
        req.user?.role
      );

      if (!success) {
        return res.status(500).json({ message: 'Failed to update security setting' });
      }

      res.json({ 
        message: `Security setting ${setting} ${enabled ? 'enabled' : 'disabled'} successfully`,
        setting,
        enabled
      });
    } catch (error) {
      console.error('Error updating security setting:', error);
      res.status(500).json({ message: 'Failed to update security setting' });
    }
  });

  // Get security logs (admin only)
  // Enhanced Admin Content Management API
  app.get("/api/admin/content", async (req, res) => {
    try {
      // Check if user is authenticated and has admin privileges
      if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get status filter from query parameter
      const statusFilter = req.query.status as string;
      
      // Fetch content items based on status filter
      let contentItems = await storage.getAllContentItems();
      
      // Apply status filter if provided
      if (statusFilter && statusFilter !== 'all') {
        contentItems = contentItems.filter(item => item.status === statusFilter);
      }
      
      // Enhance content items with user information
      const users = await storage.getAllUsers();
      const enhancedItems = contentItems.map(item => {
        const createdByUser = item.createdBy ? users.find(u => u.id === item.createdBy) : null;
        const reviewerUser = item.reviewerId ? users.find(u => u.id === item.reviewerId) : null;
        
        return {
          ...item,
          createdByName: createdByUser ? createdByUser.username : undefined,
          reviewerName: reviewerUser ? reviewerUser.username : undefined
        };
      });
      
      res.json(enhancedItems);
    } catch (error) {
      console.error("Error fetching admin content items:", error);
      res.status(500).json({ message: "Error fetching content items" });
    }
  });

  // Get workflow history for a content item
  app.get("/api/admin/content/:id/history", async (req, res) => {
    try {
      // Check if user is authenticated and has admin privileges
      if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const contentId = parseInt(req.params.id);
      
      // Fetch workflow history
      const history = await storage.getContentWorkflowHistory(contentId);
      
      // Enhance history with user information
      const users = await storage.getAllUsers();
      const enhancedHistory = history.map(entry => {
        const actor = entry.actorId ? users.find(u => u.id === entry.actorId) : null;
        
        return {
          ...entry,
          actorName: actor ? actor.username : undefined
        };
      });
      
      res.json(enhancedHistory);
    } catch (error) {
      console.error("Error fetching content workflow history:", error);
      res.status(500).json({ message: "Error fetching workflow history" });
    }
  });

  // Update content workflow status
  app.patch("/api/admin/content/:id/status", async (req, res) => {
    try {
      // Check if user is authenticated and has admin privileges
      if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const contentId = parseInt(req.params.id);
      const { status, reviewNotes, scheduledPublishAt, expirationDate } = req.body;
      
      // Get current content status
      const currentContent = await storage.getContentItemById(contentId);
      if (!currentContent) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Update content item status
      const updatedContent = await storage.updateContentStatus(
        contentId, 
        status, 
        req.user.id, 
        { 
          reviewNotes,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : undefined,
          expirationDate: expirationDate ? new Date(expirationDate) : undefined
        }
      );
      
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating content status:", error);
      res.status(500).json({ message: "Error updating content status" });
    }
  });

  app.get('/api/security/logs', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const securityLogsDir = path.join(process.cwd(), 'logs', 'security');
      const securityLogFile = path.join(securityLogsDir, 'security.log');

      if (!fs.existsSync(securityLogFile)) {
        return res.json({ logs: [] });
      }

      // Read the log file (in a production app, you might want to paginate this)
      const logContent = fs.readFileSync(securityLogFile, 'utf8');
      const logs = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return { raw: line, error: 'Failed to parse log entry' };
          }
        });

      res.json({ logs });
    } catch (error) {
      console.error('Error fetching security logs:', error);
      res.status(500).json({ message: 'Failed to fetch security logs' });
    }
  });

  // Schedule periodic security log rotation (every 24 hours)
  setInterval(() => {
    try {
      // Temporary implementation until proper security logs module is fixed
      console.log('Security logs rotation scheduled (temporarily disabled)');
      // TODO: Re-implement rotateSecurityLogs() from security module
    } catch (error) {
      console.error('Error rotating security logs:', error);
    }
  }, 24 * 60 * 60 * 1000);

  // Let Vite handle frontend routes in development mode
  if (process.env.NODE_ENV === 'production') {
    app.get('/*', (req, res) => {
      const indexPath = path.resolve(path.dirname(__dirname), 'client/index.html');
      res.sendFile(indexPath, err => {
        if (err) {
          res.status(500).send(err);
        }
      });
    });
  }

  return httpServer;
}