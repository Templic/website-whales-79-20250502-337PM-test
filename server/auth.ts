import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
      path: "/",
      httpOnly: true,
    },
    name: 'sid', // Custom session ID name
    proxy: true // Trust the reverse proxy
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Session analytics middleware
  app.use((req, res, next) => {
    if (req.session) {
      // Update last activity timestamp
      req.session.lastActivity = Date.now();

      // Record analytics if session is authenticated
      if (req.isAuthenticated()) {
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

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check for existing username
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json(info);

      // Handle remember-me functionality
      const rememberMe = req.body.rememberMe === true;
      if (rememberMe && req.session) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      req.login(user, (err) => {
        if (err) return next(err);
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

  // Add role management endpoint
  app.patch("/api/users/:userId/role", async (req, res) => {
    try {
      // Check if user is authorized (must be super_admin)
      if (!req.isAuthenticated() || req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      // Validate role
      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Session analytics endpoint
  app.get("/api/session/status", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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