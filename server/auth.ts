import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { logSecurityEvent } from "./security/security";
import { sessionMonitor, passwordChangeRequired } from "./security/sessionMonitor";
import { rateLimitingSystem } from "./security/advanced/threat/RateLimitingSystem";

// Extend session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    lastActivity?: number;
    analytics?: {
      lastAccess: Date;
      userAgent?: string;
      ip?: string;
      logoutTime?: Date;
    };
    // For multi-factor authentication
    twoFactorAuth?: {
      userId: number;
      twoFactorPending: boolean;
      rememberDevice?: boolean;
    };
    // For two-factor setup
    twoFactorSetup?: {
      secret: string;
      backupCodes: string[];
    };
    // For security monitoring
    securityContext?: {
      loginTime: Date;
      lastPasswordChange?: Date;
      passwordExpiry?: Date;
      securityEvents: Array<{
        type: string;
        timestamp: Date;
        details?: string;
      }>;
    };
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Export the hashPassword function
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Export comparePasswords to be used by other modules
export async function comparePasswords(supplied: string, stored: string) {
  // Handle empty passwords or malformed hash
  if (!supplied || !stored || !stored.includes('.')) {
    return false;
  }
  
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// Import our centralized auth utilities and config
import { 
  isAuthenticated,
  isAdmin,
  isSuperAdmin
} from './utils/auth-utils';
import { UserRole, authErrorMessages } from './utils/auth-config';

export function setupAuth(app: Express) {
  // Generate a random session secret if one is not provided in environment
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  
  // Enhanced session settings with additional security options
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Require HTTPS in production
      sameSite: "strict", // Enhanced protection against CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
      path: "/",
      httpOnly: true, // Prevent client-side JS from reading cookie
      domain: process.env.NODE_ENV === 'production' ? '.replit.app' : undefined, // Scope cookies to domain in production
    },
    name: 'cosmic_session', // Custom session ID name, not revealing our stack
    proxy: true, // Trust the reverse proxy
    rolling: true, // Force cookie to be set on every response
    unset: 'destroy', // Makes sure session is truly destroyed on req.session = null
  };
  
  // Log the use of a dynamic session secret
  if (!process.env.SESSION_SECRET) {
    console.log('Generated dynamic session secret for this instance');
    
    // Log security warning about using a dynamic secret in production
    if (process.env.NODE_ENV === 'production') {
      logSecurityEvent({
        type: 'DYNAMIC_SECRET_WARNING',
        details: 'Using a dynamically generated session secret in production. Sessions will be invalidated on server restart.',
        severity: 'high'
      });
    }
  }

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Apply session monitoring middleware
  app.use(sessionMonitor);
  
  // Enhanced session analytics middleware
  app.use((req, res, next) => {
    if (req.session) {
      // Update last activity timestamp
      req.session.lastActivity = Date.now();

      // Record analytics if session is authenticated
      if (req.isAuthenticated()) {
        // Initialize security context if not present
        if (!req.session.securityContext) {
          req.session.securityContext = {
            loginTime: new Date(),
            securityEvents: []
          };
        }
        
        // Check if password change is required
        if (passwordChangeRequired(req.user)) {
          // Add a security event to notify about required password change
          req.session.securityContext.securityEvents.push({
            type: 'PASSWORD_CHANGE_REQUIRED',
            timestamp: new Date(),
            details: 'Password change required due to age or policy'
          });
        }
        
        req.session.analytics = {
          ...req.session.analytics,
          lastAccess: new Date(),
          userAgent: req.headers['user-agent'],
          ip: req.ip
        };
      }
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Create a dedicated rate limiter for auth endpoints
  const authRateLimiter = rateLimitingSystem.createAuthLimiter();
  
  // Add rate limiting to registration endpoint
  app.post("/api/register", authRateLimiter, async (req, res, next) => {
    try {
      // Log registration attempt
      logSecurityEvent({
        type: 'REGISTRATION_ATTEMPT',
        details: `Registration attempt with username ${req.body.username}`,
        severity: 'info',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Enhanced password strength validation
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ 
          message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
        });
      }
      
      // Additional special character requirement
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return res.status(400).json({ 
          message: "Password must contain at least one special character" 
        });
      }
      
      // Check for existing username
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        logSecurityEvent({
          type: 'REGISTRATION_FAILED',
          details: `Registration failed - username ${req.body.username} already exists`,
          severity: 'low',
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        logSecurityEvent({
          type: 'REGISTRATION_FAILED',
          details: `Registration failed - email ${req.body.email} already in use`,
          severity: 'low',
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        return res.status(400).json({ message: "Email address already in use" });
      }

      // Hash password with scrypt
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user with enhanced security
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Log successful registration
        logSecurityEvent({
          type: 'REGISTRATION_SUCCESS',
          details: `Successfully registered user ${user.username}`,
          severity: 'info',
          userId: user.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("Registration error:", err);
      
      // Log registration error
      logSecurityEvent({
        type: 'REGISTRATION_ERROR',
        details: `Registration error: ${err}`,
        severity: 'medium',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      next(err);
    }
  });

  // Apply rate limiting to login endpoint
  app.post("/api/login", authRateLimiter, (req, res, next) => {
    // Record login attempt for security monitoring
    logSecurityEvent({
      type: 'LOGIN_ATTEMPT',
      details: `Login attempt for user ${req.body.username}`,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err) return next(err);
      
      if (!user) {
        // Log failed login attempt
        logSecurityEvent({
          type: 'LOGIN_FAILED',
          details: `Failed login attempt for user ${req.body.username}`,
          severity: 'medium',
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        return res.status(401).json(info);
      }

      // Handle remember-me functionality
      const rememberMe = req.body.rememberMe === true;
      if (rememberMe && req.session) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Log successful login
        logSecurityEvent({
          type: 'LOGIN_SUCCESS',
          details: `Successful login for user ${user.username}`,
          severity: 'info',
          userId: user.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Record logout time in analytics
    if (req.session?.analytics) {
      req.session.analytics.logoutTime = new Date();
    }
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  // Add role management endpoint - using centralized isSuperAdmin middleware
  app.patch("/api/users/:userId/role", isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      // Validate role against our centralized UserRole enum
      if (!Object.values(UserRole).includes(role as UserRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Log role change event
      logSecurityEvent({
        type: 'USER_ROLE_CHANGE',
        details: `User ID ${userId} role changed to ${role} by user ${req.user?.username}`,
        severity: 'medium',
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Current user endpoint
  app.get("/api/user", isAuthenticated, (req, res) => {
    // Return the current authenticated user
    res.json(req.user);
  });
  
  // Password change endpoint with security logging
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new password are required" });
      }
      
      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      
      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ 
          message: "New password must contain at least one uppercase letter, one lowercase letter, and one number" 
        });
      }
      
      // Get current user
      if (!req.user?.id) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      if (!(await comparePasswords(currentPassword, user.password))) {
        // Log failed password change attempt for security monitoring
        if (typeof logSecurityEvent === 'function' && req.user?.id && req.user?.username) {
          logSecurityEvent({
            type: 'PASSWORD_CHANGE_FAILED',
            userId: req.user.id,
            details: `Failed password change attempt for user ${req.user.username}`,
            severity: 'medium',
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
        }
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password in database
      await storage.updateUserPassword(req.user.id, hashedPassword);
      
      // Log successful password change for security monitoring
      if (typeof logSecurityEvent === 'function' && req.user?.id && req.user?.username) {
        logSecurityEvent({
          type: 'PASSWORD_CHANGE_SUCCESS',
          userId: req.user.id,
          details: `Password successfully changed for user ${req.user.username}`,
          severity: 'low',
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Session analytics endpoint
  app.get("/api/session/status", isAuthenticated, (req, res) => {
    const sessionInfo = {
      id: req.sessionID,
      lastActivity: req.session?.lastActivity,
      analytics: req.session?.analytics,
      cookie: {
        expires: req.session?.cookie.expires,
        maxAge: req.session?.cookie.maxAge
      }
    };

    res.json(sessionInfo);
  });
}