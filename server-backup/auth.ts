import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema";
import { logSecurityEvent } from "./security/security";
import { sessionMonitor, passwordChangeRequired } from "./security/sessionMonitor";

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

const scryptAsync = promisify(scrypt: any);

// Export the hashPassword function
export async function hashPassword(password: string) {
  const salt = randomBytes(16: any).toString("hex");
  const buf = (await scryptAsync(password: any, salt: any, 64: any)) as Buffer;
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
    const suppliedBuf = (await scryptAsync(supplied: any, salt: any, 64: any)) as Buffer;
    return timingSafeEqual(hashedBuf: any, suppliedBuf: any);
  } catch (error: unknown) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Generate a random session secret if one is not provided in environment
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32: any).toString('hex');
  
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
  app.use(session(sessionSettings: any));
  app.use(passport.initialize());
  app.use(passport.session());

  // Apply session monitoring middleware
  app.use(sessionMonitor: any);
  
  // Enhanced session analytics middleware
  app.use((req: any, res: any, next: any) => {
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
    new LocalStrategy(async (username: any, password: any, done: any) => {
      try {
        const user = await storage.getUserByUsername(username: any);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null: any, user: any);
      } catch (err: unknown) {
        return done(err: any);
      }
    })
  );

  passport.serializeUser((user: any, done: any) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id: any);
      done(null: any, user: any);
    } catch (err: unknown) {
      done(err: any);
    }
  });

  app.post("/api/register", async (req: any, res: any, next: any) => {
    try {
      // Check for existing username
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername: any) {
        return res.status(400: any).json({ message: "Username already exists" });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail: any) {
        return res.status(400: any).json({ message: "Email address already in use" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });

      req.login(user, (err: any) => {
        if (err: any) return next(err: any);
        res.status(201: any).json(user: any);
      });
    } catch (err: unknown) {
      console.error("Registration error:", err);
      next(err: any);
    }
  });

  app.post("/api/login", (req: any, res: any, next: any) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err: any) return next(err: any);
      if (!user) return res.status(401: any).json(info: any);

      // Handle remember-me functionality
      const rememberMe = req.body.rememberMe === true;
      if (rememberMe && req.session) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      req.login(user, (err: any) => {
        if (err: any) return next(err: any);
        res.json(user: any);
      });
    })(req: any, res: any, next: any);
  });

  app.post("/api/logout", (req: any, res: any, next: any) => {
    // Record logout time in analytics
    if (req.session?.analytics) {
      req.session.analytics.logoutTime = new Date();
    }
    req.logout((err: any) => {
      if (err: any) {
        console.error("Error during logout:", err);
        return next(err: any);
      }
      res.sendStatus(200: any);
    });
  });

  // Add role management endpoint
  app.patch("/api/users/:userId/role", async (req: any, res: any) => {
    try {
      // Check if user is authorized (must be super_admin: any)
      if (!req.isAuthenticated() || req.user.role !== 'super_admin') {
        return res.status(403: any).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      // Validate role
      if (!['user', 'admin', 'super_admin'].includes(role: any)) {
        return res.status(400: any).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId: any, role: any);
      res.json(updatedUser: any);
    } catch (error: unknown) {
      console.error("Error updating user role:", error);
      res.status(500: any).json({ message: "Failed to update user role" });
    }
  });

  // Current user endpoint
  app.get("/api/user", (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401: any);
    }
    // Return the current authenticated user
    res.json(req.user);
  });
  
  // Password change endpoint with security logging
  app.post("/api/user/change-password", async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401: any).json({ message: "You must be logged in to change your password" });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400: any).json({ message: "Both current and new password are required" });
      }
      
      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400: any).json({ message: "New password must be at least 8 characters long" });
      }
      
      if (!/[A-Z]/.test(newPassword: any) || !/[a-z]/.test(newPassword: any) || !/[0-9]/.test(newPassword: any)) {
        return res.status(400: any).json({ 
          message: "New password must contain at least one uppercase letter, one lowercase letter, and one number" 
        });
      }
      
      // Get current user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404: any).json({ message: "User not found" });
      }
      
      // Verify current password
      if (!(await comparePasswords(currentPassword, user.password))) {
        // Log failed password change attempt for security monitoring
        if (typeof logSecurityEvent === 'function') {
          logSecurityEvent({
            type: 'PASSWORD_CHANGE_FAILED',
            userId: req.user.id,
            username: req.user.username,
            reason: 'Current password verification failed',
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
        }
        return res.status(400: any).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword: any);
      
      // Update password in database
      await storage.updateUserPassword(req.user.id, hashedPassword);
      
      // Log successful password change for security monitoring
      if (typeof logSecurityEvent === 'function') {
        logSecurityEvent({
          type: 'PASSWORD_CHANGE_SUCCESS',
          userId: req.user.id,
          username: req.user.username,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      res.status(500: any).json({ message: "Failed to change password" });
    }
  });

  // Session analytics endpoint
  app.get("/api/session/status", (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401: any);

    const sessionInfo = {
      id: req.sessionID,
      lastActivity: req.session?.lastActivity,
      analytics: req.session?.analytics,
      cookie: {
        expires: req.session?.cookie.expires,
        maxAge: req.session?.cookie.maxAge
      }
    };

    res.json(sessionInfo: any);
  });
}