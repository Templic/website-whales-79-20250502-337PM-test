declare module 'connect-pg-simple' {
  import session from 'express-session';
  export default function connectPgSimple(session: typeof import('express-session')): new (options: unknown) => session.Store;
}

// Import only what we need from the shared schema
import { 
  // User types
  type User, type InsertUser,
  // Blog post types
  type Post, type InsertPost,
  type Comment, type InsertComment,
  type ProductCategory, type InsertProductCategory,
  type Category, type InsertCategory,
  type Subscriber, type InsertSubscriber,
  type Newsletter, type InsertNewsletter,
  type Product, type InsertProduct,
  // TypeScript error management types
  type TypeScriptError, type InsertTypeScriptError,
  type ErrorPattern, type InsertErrorPattern,
  type ErrorFix, type InsertErrorFix,
  type ErrorFixHistory, type InsertErrorFixHistory,
  type ProjectAnalysis, type InsertProjectAnalysis,
  type ProjectFile, type InsertProjectFile,
  // Custom types for our application
  type Track, type Album, type ContentItem, type ContentHistory, type ContentUsage, type ContentWorkflowHistory,
  // Tables we need
  users, posts, comments,
  // TypeScript error management tables
  typeScriptErrors, errorPatterns, errorFixes, errorAnalysis, scanResults,
  // Product tables for e-commerce
  products, productCategories, newsletters, subscribers
} from "../shared/schema";
import { sql, eq, and, desc, gt, count, max } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer, json } from "drizzle-orm/pg-core";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword } from './auth';


const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: User): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Subscriber methods
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getAllSubscribers(): Promise<Subscriber[]>;
  findSubscriberByEmail(email: string): Promise<Subscriber | undefined>;

  // Newsletter methods
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  getAllNewsletters(): Promise<Newsletter[]>;
  getNewsletterById(id: number): Promise<Newsletter | null>;
  updateNewsletter(id: number, newsletter: Partial<InsertNewsletter>): Promise<Newsletter>;
  sendNewsletter(id: number): Promise<Newsletter>;

  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<Post[]>;
  getAllPosts(): Promise<Post[]>; // Method for getting all posts including unpublished ones
  getPostById(id: number): Promise<Post | null>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;

  // Category methods
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;

  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  approveComment(id: number): Promise<Comment>;
  rejectComment(id: number): Promise<Comment>;

  // Password recovery methods
  createPasswordResetToken(userId: number): Promise<string>;
  validatePasswordResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User>;

  // Admin methods for content moderation
  approvePost(id: number): Promise<Post>;
  getUnapprovedPosts(): Promise<Post[]>;
  getUnapprovedComments(): Promise<Comment[]>;

  // Music methods
  getTracks(): Promise<Track[]>;
  getAllTracks(): Promise<Track[]>; // Get all tracks including non-published ones
  getAlbums(): Promise<Album[]>;
  uploadMusic(params: { file: unknown; targetPage: string; uploadedBy: number; userRole: 'admin' | 'super_admin' }): Promise<Track>;
  deleteMusic(trackId: number, userId: number, userRole: 'admin' | 'super_admin'): Promise<void>;
  
  // Product methods
  getAllProducts(): Promise<Product[]>;

  // Session management methods
  cleanupExpiredSessions(): Promise<void>;
  getSessionAnalytics(userId: number): Promise<unknown>;
  updateSessionActivity(sessionId: string, data: unknown): Promise<void>;

  // Advanced admin methods
  updateUserRole(userId: number, role: 'user' | 'admin' | 'super_admin'): Promise<User>;
  banUser(userId: number): Promise<User>;
  unbanUser(userId: number): Promise<User>;
  getSystemSettings(): Promise<unknown>;
  updateSystemSettings(settings: unknown): Promise<void>;
  getAdminAnalytics(fromDate?: string, toDate?: string): Promise<unknown>;
  getUserActivity(userId: number): Promise<unknown>;

  // Content management methods
  getAllContentItems(): Promise<ContentItem[]>;
  getContentItemById(id: number): Promise<ContentItem | null>;
  getContentItemByKey(key: string): Promise<ContentItem | null>;
  createContentItem(contentItem: unknown): Promise<ContentItem>;
  updateContentItem(contentItem: {id: number} & Record<string, unknown>): Promise<ContentItem>;
  deleteContentItem(id: number): Promise<void>;

  // Content versioning methods
  getContentHistory(contentId: number): Promise<ContentHistory[]>;
  createContentVersion(contentId: number, version: number, userId: number, changeDescription?: string): Promise<ContentHistory>;
  restoreContentVersion(historyId: number): Promise<ContentItem>;

  // Content usage tracking methods
  recordContentUsage(contentId: number, location: string, path: string): Promise<ContentUsage>;
  incrementContentViews(contentId: number): Promise<void>;
  getContentUsageReport(contentId?: number): Promise<any[]>;
  
  // New content workflow methods
  getContentWorkflowHistory(contentId: number): Promise<ContentWorkflowHistory[]>;
  updateContentStatus(
    contentId: number, 
    status: string, 
    userId: number, 
    options?: { 
      reviewNotes?: string;
      scheduledPublishAt?: Date;
      expirationDate?: Date;
    }
  ): Promise<ContentItem>;

  // TypeScript Error Management methods
  // Error tracking methods
  createTypeScriptError(error: InsertTypeScriptError): Promise<TypeScriptError>;
  getTypeScriptErrorById(id: number): Promise<TypeScriptError | null>;
  updateTypeScriptError(id: number, error: Partial<InsertTypeScriptError>): Promise<TypeScriptError>;
  getAllTypeScriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    file_path?: string;
    detected_after?: Date;
    detected_before?: Date;
  }): Promise<TypeScriptError[]>;
  getTypeScriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
    fixRate: number;
  }>;
  markErrorAsFixed(id: number, fixId: number, userId: number): Promise<TypeScriptError>;
  
  // Error pattern methods
  createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern>;
  getErrorPatternById(id: number): Promise<ErrorPattern | null>;
  updateErrorPattern(id: number, pattern: Partial<InsertErrorPattern>): Promise<ErrorPattern>;
  getAllErrorPatterns(): Promise<ErrorPattern[]>;
  getErrorPatternsByCategory(category: string): Promise<ErrorPattern[]>;
  getAutoFixablePatterns(): Promise<ErrorPattern[]>;
  
  // Fix methods
  createErrorFix(fix: InsertErrorFix): Promise<ErrorFix>;
  getErrorFixById(id: number): Promise<ErrorFix | null>;
  updateErrorFix(id: number, fix: Partial<InsertErrorFix>): Promise<ErrorFix>;
  getAllErrorFixes(): Promise<ErrorFix[]>;
  getFixesByPatternId(patternId: number): Promise<ErrorFix[]>;
  
  // Fix history methods
  createFixHistory(fixHistory: InsertErrorFixHistory): Promise<ErrorFixHistory>;
  getFixHistoryByErrorId(errorId: number): Promise<ErrorFixHistory[]>;
  getFixHistoryStats(userId?: number, fromDate?: Date, toDate?: Date): Promise<{
    totalFixes: number;
    byMethod: Record<string, number>;
    byResult: Record<string, number>;
    averageFixTime: number;
    topFixers: Array<{ userId: number; username: string; count: number }>;
  }>;
  
  // Project analysis methods
  createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis>;
  getProjectAnalysisById(id: number): Promise<ProjectAnalysis | null>;
  updateProjectAnalysis(id: number, analysis: Partial<InsertProjectAnalysis>): Promise<ProjectAnalysis>;
  getAllProjectAnalyses(limit?: number): Promise<ProjectAnalysis[]>;
  getLatestProjectAnalysis(): Promise<ProjectAnalysis | null>;
  
  // Project file methods
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile>;
  getProjectFileByPath(filePath: string): Promise<ProjectFile | null>;
  getAllProjectFiles(): Promise<ProjectFile[]>;
  getProjectFilesWithErrors(): Promise<ProjectFile[]>;
}

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store with PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });

    // Initialize sample music data and users
    this.initializeSampleData();
    this.createInitialUsers();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      console.log("Getting user with ID:", id);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error finding user by username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Generate a UUID for the user
      const userWithId = { ...user, id: uuidv4() };
      const [newUser] = await db.insert(users).values(userWithId).returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        if (error.constraint?.includes('email')) {
          throw new Error('Email address already exists');
        }
        if (error.constraint?.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }
  
  async upsertUser(userData: {
    id: string;
    username: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    profileImageUrl?: string | null;
  }): Promise<User> {
    try {
      console.log("Upserting user with Replit data:", userData);
      
      // Check if user with this ID already exists
      if (userData.id) {
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(users.id, userData.id));
          
        if (existingUsers.length > 0) {
          // User exists, update their record
          console.log("Updating existing user:", userData.username);
          const [updatedUser] = await db
            .update(users)
            .set({
              username: userData.username,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              bio: userData.bio,
              profileImageUrl: userData.profileImageUrl,
              updatedAt: new Date()
            })
            .where(eq(users.id, userData.id))
            .returning();
          return updatedUser;
        } else {
          // No user with this ID, create new user
          console.log("Creating new user:", userData.username);
          
          const [newUser] = await db
            .insert(users)
            .values({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              bio: userData.bio,
              profileImageUrl: userData.profileImageUrl,
              role: "user",
              isBanned: false,
              lastLogin: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
          return newUser;
        }
      } else {
        throw new Error("Missing user ID");
      }
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  // Subscriber methods
  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const result = await db.insert(subscribers).values(insertSubscriber).returning();
    return result[0];
  }

  async findSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber;
  }

  async getAllSubscribers() {
    return await db.select().from(subscribers).orderBy(subscribers.createdAt);
  }

  // Newsletter methods
  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const result = await db.insert(newsletters).values(newsletter).returning();
    return result[0];
  }

  async getAllNewsletters(): Promise<Newsletter[]> {
    // Use parameterized queries with ORM methods
    return await db.select()
      .from(newsletters)
      .orderBy(desc(newsletters.createdAt));
  }

  async getNewsletterById(id: number): Promise<Newsletter | null> {
    const result = await db.select().from(newsletters).where(eq(newsletters.id, id));
    return result[0] || null;
  }

  async updateNewsletter(id: number, newsletter: Partial<InsertNewsletter>): Promise<Newsletter> {
    const result = await db.update(newsletters)
      .set({ ...newsletter, updatedAt: new Date() })
      .where(eq(newsletters.id, id))
      .returning();
    return result[0];
  }

  async sendNewsletter(id: number): Promise<Newsletter> {
    // Fetch the newsletter first
    const newsletter = await this.getNewsletterById(id);
    if (!newsletter) {
      throw new Error("Newsletter not found");
    }

    // Update the newsletter status to sent
    const now = new Date();
    const [updatedNewsletter] = await db.update(newsletters)
      .set({ 
        status: "sent", 
        sentAt: now,
        updatedAt: now
      })
      .where(eq(newsletters.id, id))
      .returning();

    // TODO: In a real application, this would send the newsletter to all active subscribers
    // For now, we'll just mark it as sent
    return updatedNewsletter;
  }

  // Post methods
  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async getPosts(): Promise<Post[]> {
    // Return only published and approved posts for public consumption
    // Use parameterized queries with ORM methods
    return await db.select()
      .from(posts)
      .where(
        and(
          eq(posts.published, true),
          eq(posts.approved, true)
        )
      )
      .orderBy(desc(posts.createdAt));
  }
  
  async getAllPosts(): Promise<Post[]> {
    // Return all posts regardless of status (for admin use)
    // Use parameterized queries with ORM methods
    return await db.select()
      .from(posts)
      .orderBy(desc(posts.createdAt));
  }

  async getPostById(id: number): Promise<Post | null> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return result[0] || null;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    const result = await db.update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  // Category methods
  async createCategory(category: any): Promise<unknown> {
    // This is a stub - categories table needs to be defined in schema.ts
    console.warn("Categories feature not fully implemented in schema");
    return { id: 1, name: "Default Category" };
  }

  async getCategories(): Promise<any[]> {
    // This is a stub - categories table needs to be defined in schema.ts
    console.warn("Categories feature not fully implemented in schema");
    return [{ id: 1, name: "Default Category" }];
  }

  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async getCommentsByPostId(postId: number, onlyApproved: boolean = false): Promise<Comment[]> {
    console.log(`Fetching comments for post ID: ${postId}, onlyApproved: ${onlyApproved}`);

    // Use drizzle-orm's built-in parameterized queries with proper type checking
    // instead of building raw SQL strings
    if (onlyApproved) {
      return await db.select()
        .from(comments)
        .where(and(
          eq(comments.postId, postId),
          eq(comments.approved, true)
        ))
        .orderBy(desc(comments.createdAt));
    } else {
      return await db.select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));
    }
  }

  async approveComment(id: number): Promise<Comment> {
    const result = await db.update(comments)
      .set({ approved: true })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async rejectComment(id: number): Promise<Comment> {
    const result = await db.delete(comments)
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  // Password recovery methods
  async createPasswordResetToken(userId: number): Promise<string> {
    // Generate a secure random token
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    // Create a properly defined table for password reset tokens if it doesn't exist already
    // Note: In production this should be moved to the schema definition in shared/schema.ts
    const passwordResetTokens = pgTable('password_reset_tokens', {
      id: serial('id').primaryKey(),
      userId: integer('user_id').notNull(),
      token: text('token').notNull(),
      expires: timestamp('expires').notNull(),
      used: integer('used').notNull().default(0), // Using integer for boolean (0=false, 1=true)
      createdAt: timestamp('created_at').defaultNow()
    });

    // Use ORM to insert data securely with proper parameter handling
    await db.insert(passwordResetTokens).values({
      userId: userId,
      token: token,
      expires: expires,
      used: 0
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<User | undefined> {
    // Define password reset tokens table structure
    const passwordResetTokens = pgTable('password_reset_tokens', {
      id: serial('id').primaryKey(),
      userId: integer('user_id').notNull(),
      token: text('token').notNull(),
      expires: timestamp('expires').notNull(),
      used: integer('used').notNull().default(0),
      createdAt: timestamp('created_at').defaultNow()
    });
    
    // Use a properly parameterized join query
    // This approach prevents SQL injection by using the ORM's 
    // parameter handling mechanisms
    const validTokens = await db.select({
      userId: passwordResetTokens.userId
    })
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      // Use a safer parameterized approach instead of raw SQL
      gt(passwordResetTokens.expires, new Date()),
      eq(passwordResetTokens.used, 0)
    ));
    
    // If no valid token found, return undefined
    if (validTokens.length === 0) {
      return undefined;
    }
    
    // Get the user associated with the token
    const userId = validTokens[0].userId;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    return user;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    // Update the user's password with parameterized query
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    // Define password reset tokens table structure (same as in other methods)
    const passwordResetTokens = pgTable('password_reset_tokens', {
      id: serial('id').primaryKey(),
      userId: integer('user_id').notNull(),
      token: text('token').notNull(),
      expires: timestamp('expires').notNull(),
      used: integer('used').notNull().default(0),
      createdAt: timestamp('created_at').defaultNow()
    });

    // Update all reset tokens for this user to be used
    // Using ORM's update method instead of raw SQL for parameterized queries
    await db.update(passwordResetTokens)
      .set({ used: 1 }) // 1 = true
      .where(eq(passwordResetTokens.userId, userId));

    return updatedUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // First check if user exists
      const user = await this.getUser(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user from database
      await db.delete(users).where(eq(users.id, id));

      // Optionally, delete related records (comments, posts, etc.)
      // This depends on your database constraints and requirements
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async approvePost(id: number): Promise<Post> {
    const result = await db.update(posts)
      .set({ approved: true, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  async getUnapprovedPosts(): Promise<Post[]> {
    // Use properly parameterized queries with ORM methods instead of raw SQL
    return await db.select()
      .from(posts)
      .where(eq(posts.approved, false))
      .orderBy(desc(posts.createdAt));
  }

  async deletePost(id: number): Promise<void> {
    try {
      // Check if post exists
      const post = await db.select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      if (!post.length) {
        throw new Error('Post not found');
      }

      // Define post categories junction table structure
      const postCategories = pgTable('post_categories', {
        id: serial('id').primaryKey(),
        postId: integer('post_id').notNull(),
        categoryId: integer('category_id').notNull(),
      });

      // Delete post category associations using ORM instead of raw SQL
      // This is safer and prevents SQL injection
      await db.delete(postCategories)
        .where(eq(postCategories.postId, id));

      // Delete post comments
      await db.delete(comments)
        .where(eq(comments.postId, id));

      // Delete post
      await db.delete(posts)
        .where(eq(posts.id, id));
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  async getUnapprovedComments(): Promise<Comment[]> {
    console.log('Attempting to fetch unapproved comments...');
    try {
      // Use properly parameterized queries with ORM methods instead of raw SQL
      const results = await db.select()
        .from(comments)
        .where(eq(comments.approved, false))
        .orderBy(desc(comments.createdAt));

      console.log('Fetched unapproved comments:', results);
      return results;
    } catch (error) {
      console.error('Error fetching unapproved comments:', error);
      throw error;
    }
  }

  // Music methods
  async getTracks(): Promise<Track[]> {
    try {
      // Define tracks table schema if not imported from schema.ts
      const tracksTable = pgTable('tracks', {
        id: serial('id').primaryKey(),
        title: text('title').notNull(),
        artist: text('artist').notNull(),
        audioUrl: text('audio_url').notNull(),
        published: boolean('published').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
      });

      // Use parameterized queries with ORM methods
      return await db.select()
        .from(tracksTable)
        .orderBy(desc(tracksTable.createdAt));
    } catch (error) {
      console.error("Error getting tracks:", error);
      return [];
    }
  }
  
  async getAllTracks(): Promise<Track[]> {
    try {
      // Define tracks table schema if not imported from schema.ts
      const tracksTable = pgTable('tracks', {
        id: serial('id').primaryKey(),
        title: text('title').notNull(),
        artist: text('artist').notNull(),
        audioUrl: text('audio_url').notNull(),
        published: boolean('published').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
      });

      // This returns all tracks including non-published ones (for admin use)
      // Use parameterized queries with ORM methods
      return await db.select()
        .from(tracksTable)
        .orderBy(desc(tracksTable.createdAt));
    } catch (error) {
      console.error("Error getting all tracks:", error);
      return [];
    }
  }

  async getAlbums(): Promise<Album[]> {
    try {
      // Define albums table schema if not imported from schema.ts
      const albumsTable = pgTable('albums', {
        id: serial('id').primaryKey(),
        title: text('title').notNull(),
        artist: text('artist').notNull(),
        coverArt: text('cover_art'),
        releaseDate: timestamp('release_date').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
      });

      // Use parameterized queries with ORM methods
      return await db.select()
        .from(albumsTable)
        .orderBy(desc(albumsTable.releaseDate));
    } catch (error) {
      console.error("Error getting albums:", error);
      return [];
    }
  }

  async deleteMusic(trackId: number, userId: number, userRole: 'admin' | 'super_admin'): Promise<void> {
    try {
      // Define tracks table schema if not imported from schema.ts
      const tracksTable = pgTable('tracks', {
        id: serial('id').primaryKey(),
        title: text('title').notNull(),
        artist: text('artist').notNull(),
        audioUrl: text('audio_url').notNull(),
        published: boolean('published').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
      });

      // Verify user has required role
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        throw new Error('Unauthorized - requires admin privileges');
      }

      // Get track info before deletion
      const [track] = await db.select().from(tracksTable).where(eq(tracksTable.id, trackId));
      if (!track) {
        throw new Error('Track not found');
      }

      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads', track.audioUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      await db.delete(tracksTable).where(eq(tracksTable.id, trackId));
    } catch (error) {
      console.error("Error deleting music:", error);
      throw error;
    }
  }
  
  // Product methods
  async getAllProducts(): Promise<Product[]> {
    try {
      // Define products table schema if not imported from schema.ts
      const productsTable = pgTable('products', {
        id: serial('id').primaryKey(),
        name: text('name').notNull(),
        description: text('description'),
        price: numeric('price', { precision: 10, scale: 2 }).notNull(),
        imageUrl: text('image_url'),
        category: text('category'),
        inStock: boolean('in_stock').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
      });

      // Use parameterized queries with ORM methods
      return await db.select()
        .from(productsTable)
        .orderBy(desc(productsTable.createdAt));
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async uploadMusic({ file, targetPage, uploadedBy, userRole }: { 
    file: any, 
    targetPage: string,
    uploadedBy: number,
    userRole: 'admin' | 'super_admin'
  }): Promise<Track> {
    try {
      // Define tracks table schema if not imported from schema.ts
      const tracksTable = pgTable('tracks', {
        id: serial('id').primaryKey(),
        title: text('title').notNull(),
        artist: text('artist').notNull(),
        audioUrl: text('audio_url').notNull(),
        published: boolean('published').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
      });

      // Verify user has required role
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        throw new Error('Unauthorized - requires admin privileges');
      }

      // Simple local file saving - replace with cloud storage in production
      const uploadDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadDir, { recursive: true }).catch(() => {}); // Ignore if dir exists
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, file.data);

      // Create database record
      const [track] = await db.insert(tracksTable).values({
        title: file.name,
        artist: "Dale the Whale", // Could be made dynamic
        audioUrl: fileName, //Store relative path
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return track;
    } catch (error) {
      console.error("Error uploading music:", error);
      throw error;
    }
  }

  async createInitialUsers() {
    try {
      const initialUsers = [
        { 
          username: 'admin', 
          password: await hashPassword('admin123'), 
          email: 'admin@example.com', 
          role: 'admin' as 'admin',
          isBanned: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          username: 'superadmin', 
          password: await hashPassword('superadmin123'), 
          email: 'superadmin@example.com', 
          role: 'super_admin' as 'super_admin',
          isBanned: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          username: 'user', 
          password: await hashPassword('user123'), 
          email: 'user@example.com', 
          role: 'user' as 'user',
          isBanned: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const userData of initialUsers) {
        try {
          const existingUser = await this.getUserByUsername(userData.username);
          if (!existingUser) {
            await this.createUser(userData);
            console.log(`Created user: ${userData.username}`);
          }
        } catch (error) {
          console.error(`Error creating user ${userData.username}:`, error);
        }
      }
    } catch (error) {
      console.error("Error creating initial users:", error);
    }
  }

  async initializeSampleData() {
    console.log("Initializing sample data with batch approach...");
    
    // Reusable function to initialize a table with sample data
    const initializeTable = async (tableName: string, tableRef: any, sampleData: unknown[]) => {
      try {
        // Check if table exists by attempting a query
        const existingData = await db.select().from(tableRef);
        
        // Only insert if table is empty
        if (existingData.length === 0) {
          console.log(`Initializing ${tableName}...`);
          await db.insert(tableRef).values(sampleData);
          console.log(`${tableName} initialized successfully`);
          return true;
        } else {
          console.log(`${tableName} already contains data, skipping initialization`);
          return false;
        }
      } catch (error) {
        console.error(`Error initializing ${tableName}:`, error);
        // Return false to indicate initialization failed
        return false;
      }
    };
    
    try {
      // 1. Initialize subscribers
      await initializeTable('subscribers', subscribers, [
        {
          name: "Emily Johnson",
          email: "emily.j@example.com",
          status: "active",
          createdAt: new Date("2024-01-15")
        },
        {
          name: "Michael Chen",
          email: "m.chen@example.com",
          status: "active", 
          createdAt: new Date("2024-01-16")
        },
        {
          name: "Sarah Williams",
          email: "sarah.w@example.com",
          status: "active",
          createdAt: new Date("2024-01-17")
        }
      ]);
    
      // 2. Initialize newsletters
      await initializeTable('newsletters', newsletters, [
        {
          title: "Cosmic Waves - Spring Edition",
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9;">
              <h1 style="color: #4A90E2; text-align: center;">Cosmic Waves - Spring Edition</h1>
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://via.placeholder.com/600x300" alt="Cosmic ocean scene" style="max-width: 100%; height: auto; border-radius: 8px;">
              </div>
              <h2 style="color: #4A90E2;">New Releases</h2>
              <p>Our latest track "Cosmic Symphony" is now available on all major streaming platforms! This collaboration with the talented Luna Echo explores the depths of space and ocean in a unique cosmic-marine fusion.</p>
              <h2 style="color: #4A90E2;">Upcoming Events</h2>
              <ul>
                <li>May 15: Cosmic Ocean Live - Miami Beach</li>
                <li>June 2: Whale Song Meditation - Online Stream</li>
                <li>July 10: Ocean Conservation Benefit Concert - San Francisco</li>
              </ul>
              <h2 style="color: #4A90E2;">Behind the Waves</h2>
              <p>This month, we're taking you behind the scenes of our latest music video shoot at the bioluminescent bay in Puerto Rico. The magical glowing waters inspired our upcoming EP "Luminous Depths" coming this summer.</p>
              <div style="text-align: center; margin-top: 30px; padding: 15px; background-color: #e9f5ff; border-radius: 8px;">
                <p style="margin-bottom: 5px;"><strong>Subscriber Exclusive:</strong> Use code COSMIC25 for 25% off all merchandise this month!</p>
                <a href="#" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 4px;">Visit Store</a>
              </div>
              <div style="text-align: center; margin-top: 30px; font-style: italic; color: #666;">
                <p>"Let the cosmic waves carry your spirit through the universe"</p>
                <p style="margin-top: 15px;">- Dale 🐋</p>
              </div>
            </div>
          `,
          status: "draft",
          createdAt: new Date("2025-03-15"),
          updatedAt: new Date("2025-03-15")
        },
        {
          title: "Winter Solstice Special Newsletter",
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9;">
              <h1 style="color: #4A90E2; text-align: center;">Winter Solstice Special</h1>
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://via.placeholder.com/600x300" alt="Winter solstice scene" style="max-width: 100%; height: auto; border-radius: 8px;">
              </div>
              <h2 style="color: #4A90E2;">Solstice Release</h2>
              <p>Our special solstice meditation track "Deep Blue Winter" is now available as a free download for all subscribers. This 20-minute ambient journey is designed to align with the winter solstice energies.</p>
              <h2 style="color: #4A90E2;">Holiday Event</h2>
              <p>Join us for a special online gathering on December 21st at 8pm EST for a live musical journey through the cosmic winter. Registered subscribers will receive a private link.</p>
              <div style="text-align: center; margin-top: 30px; padding: 15px; background-color: #e9f5ff; border-radius: 8px;">
                <p style="margin-bottom: 5px;"><strong>Winter Gift:</strong> The first 50 subscribers to respond will receive a limited edition winter solstice art print!</p>
                <a href="#" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 4px;">Claim Gift</a>
              </div>
              <div style="text-align: center; margin-top: 30px; font-style: italic; color: #666;">
                <p>"As the world turns inward, so does the cosmic soul"</p>
                <p style="margin-top: 15px;">- Dale 🐋</p>
              </div>
            </div>
          `,
          status: "sent",
          sentAt: new Date("2024-12-15"),
          createdAt: new Date("2024-12-10"),
          updatedAt: new Date("2024-12-15")
        }
      ]);
      
      // 3. Initialize categories - commented out due to undefined table reference
      /* await initializeTable('categories', categories, [
          {
            name: "Music",
            slug: "music",
            description: "Posts about music releases, production, and inspiration"
          },
          {
            name: "Cosmic Exploration",
            slug: "cosmic-exploration",
            description: "Exploring the universe and its cosmic wonders"
          },
          {
            name: "Ocean Conservation",
            slug: "ocean-conservation",
            description: "Topics related to marine life and ocean conservation efforts"
          },
          {
            name: "Events",
            slug: "events",
            description: "Upcoming events, concerts, and appearances"
          }
        ]);
      
      // 4. Initialize blog posts
      const blogPostSamples = [
        {
          title: "The Cosmic Symphony: Where Music Meets the Universe",
          content: `<p>In the vast expanse of the cosmos, there exists a harmony that transcends our understanding. As a musician who draws inspiration from both the depths of the ocean and the mysteries of space, I've always been fascinated by the cosmic symphony that surrounds us.</p>
          <p>Recent discoveries in astrophysics have revealed that celestial bodies emit frequencies that can be translated into sound. These "cosmic melodies" have inspired my latest album, where I attempt to weave together the sounds of distant stars with the songs of the ocean's gentle giants.</p>`,
          excerpt: "Exploring the intersection of cosmic sounds and oceanic rhythms in my latest musical project.",
          featuredImage: "https://images.unsplash.com/photo-1515462277126-2dd0c162007a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          published: true,
          approved: true,
          authorId: 1,
          createdAt: new Date("2025-03-10"),
          updatedAt: new Date("2025-03-10")
        },
        {
          title: "Ocean Conservation Efforts: Making Waves for Change",
          content: `<p>The oceans are the lifeblood of our planet, covering more than 70% of Earth's surface and providing a home to countless species. Yet, our marine ecosystems face unprecedented threats from pollution, overfishing, and climate change.</p>
          <p>As someone who has found inspiration in the ocean's depths, I feel a profound responsibility to protect these precious waters. That's why I'm excited to announce our partnership with the Global Ocean Trust, a nonprofit organization dedicated to marine conservation.</p>`,
          excerpt: "Announcing new partnerships and initiatives to protect our ocean ecosystems.",
          featuredImage: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          published: true,
          approved: true,
          authorId: 2,
          createdAt: new Date("2025-02-15"),
          updatedAt: new Date("2025-02-15")
        },
        {
          title: "Behind the Music: The Making of 'Cosmic Depths'",
          content: `<p>Creating an album is always a journey of discovery, but "Cosmic Depths" took me further than I ever imagined—from the ocean floor to the outer reaches of the universe.</p>
          <p>The production process began almost a year ago, when I embarked on a deep-sea expedition with a team of marine biologists. Equipped with specialized hydrophones, we captured the haunting songs of humpback whales and the mysterious clicks and whistles of other marine creatures.</p>`,
          excerpt: "A behind-the-scenes look at the unique production process for my latest album.",
          featuredImage: "https://images.unsplash.com/photo-1520690214124-2405c5217036?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          published: true,
          approved: true,
          authorId: 1,
          createdAt: new Date("2025-01-20"),
          updatedAt: new Date("2025-01-20")
        }
      ];
      
      const blogPostsInitialized = await initializeTable('posts', posts, blogPostSamples);
      
      // 5. Setup post-category relationships if posts were initialized - commented out due to missing categories table
      /* if (blogPostsInitialized) {
        try {
          // Get the inserted posts and categories
          const insertedPosts = await db.select().from(posts);
          const blogCategories = await db.select().from(categories);
          
          if (insertedPosts.length > 0 && blogCategories.length > 0) {
            // Build category map for easier lookup
            const categoryMap = blogCategories.reduce((map, category) => {
              map[category.slug] = category.id;
              return map;
            }, {} as Record<string, number>);
            
            // Define post_categories junction table
            const postCategoriesTable = pgTable('post_categories', {
              id: serial('id').primaryKey(),
              post_id: integer('post_id').notNull(),
              category_id: integer('category_id').notNull()
            });
            
            const postCategoryRelations = [];
            
            // Assign categories to posts
            if (insertedPosts[0] && categoryMap['music'] && categoryMap['cosmic-exploration']) {
              postCategoryRelations.push(
                { post_id: insertedPosts[0].id, category_id: categoryMap['music'] },
                { post_id: insertedPosts[0].id, category_id: categoryMap['cosmic-exploration'] }
              );
            }
            
            if (insertedPosts[1] && categoryMap['ocean-conservation'] && categoryMap['events']) {
              postCategoryRelations.push(
                { post_id: insertedPosts[1].id, category_id: categoryMap['ocean-conservation'] },
                { post_id: insertedPosts[1].id, category_id: categoryMap['events'] }
              );
            }
            
            if (insertedPosts[2] && categoryMap['music']) {
              postCategoryRelations.push(
                { post_id: insertedPosts[2].id, category_id: categoryMap['music'] }
              );
            }
            
            // Batch insert all relations if we have any
            if (postCategoryRelations.length > 0) {
              await db.insert(postCategoriesTable).values(postCategoryRelations);
              console.log('Post-category relationships initialized successfully');
            }
          }
        } catch (error) {
          console.error('Error creating post-category relationships:', error);
        }
      } */
      
      // 6. Initialize collaboration proposals
      const collaborationProposalsTable = pgTable('collaboration_proposals', {
        id: serial('id').primaryKey(),
        artist_name: text('artist_name').notNull(),
        email: text('email').notNull(),
        proposal_type: text('proposal_type').notNull(),
        description: text('description').notNull(),
        status: text('status').default('pending'),
        created_at: timestamp('created_at').defaultNow()
      });
      
      await initializeTable('collaboration_proposals', collaborationProposalsTable, [
        {
          artist_name: 'Luna Echo',
          email: 'luna@example.com',
          proposal_type: 'Music Collaboration',
          description: 'Interested in creating a cosmic ambient track together',
          status: 'pending'
        },
        {
          artist_name: 'DJ Starlight',
          email: 'djstar@example.com',
          proposal_type: 'Live Performance',
          description: 'Would love to collaborate for an ocean-themed event',
          status: 'pending'
        },
        {
          artist_name: 'The Wave Riders',
          email: 'wave@example.com',
          proposal_type: 'Album Feature',
          description: 'Proposing a joint EP focused on marine conservation',
          status: 'pending'
        }
      ]);

      // 7. Initialize patrons
      const patronsTable = pgTable('patrons', {
        id: serial('id').primaryKey(),
        name: text('name').notNull(),
        email: text('email').notNull(),
        tier: text('tier').notNull(),
        subscription_date: timestamp('subscription_date').defaultNow(),
        active: integer('active').default(1)
      });
      
      await initializeTable('patrons', patronsTable, [
        { name: 'Alex Thompson', email: 'alex@example.com', tier: 'Whale Guardian' },
        { name: 'Maria Garcia', email: 'maria@example.com', tier: 'Ocean Protector' },
        { name: 'James Wilson', email: 'james@example.com', tier: 'Wave Rider' }
      ]);
      
      // 8. Initialize tour dates
      const tourDatesTable = pgTable('tour_dates', {
        id: serial('id').primaryKey(),
        venue: text('venue').notNull(),
        city: text('city').notNull(),
        date: timestamp('date').notNull(),
        ticket_link: text('ticket_link'),
        status: text('status').default('upcoming')
      });
      
      await initializeTable('tour_dates', tourDatesTable, [
            {
              venue: 'Ocean Sound Arena',
              city: 'Miami',
              date: new Date('2024-04-15 20:00:00'),
              ticket_link: 'https://tickets.example.com/miami',
              status: 'upcoming'
            },
            {
              venue: 'Cosmic Waves Theater',
              city: 'Los Angeles',
              date: new Date('2024-05-01 19:30:00'),
              ticket_link: 'https://tickets.example.com/la',
              status: 'upcoming'
            },
            {
              venue: 'Blue Note Jazz Club',
              city: 'New York',
              date: new Date('2024-05-15 21:00:00'),
              ticket_link: 'https://tickets.example.com/ny',
              status: 'upcoming'
            },
            {
              venue: 'Marine Gardens',
              city: 'Seattle',
              date: new Date('2024-06-01 20:00:00'),
              ticket_link: 'https://tickets.example.com/seattle',
              status: 'upcoming'
            }
          ]);
      
      // 9. Initialize music tracks - commented out due to missing tables
      /* const existingTracks = await db.select().from(tracks);
      if (existingTracks.length === 0) {
        console.log("Initializing sample music tracks...");
        
        // Add sample tracks
        await db.insert(tracks).values([
          {
            title: "Ethereal Dreams",
            artist: "Dale The Whale",
            duration: "4:30",
            audioUrl: "/audio/meditation-alpha.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: "Ocean's Calling",
            artist: "Dale The Whale",
            duration: "4:15",
            audioUrl: "oceans-calling.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: "Whale Song Symphony",
            artist: "Dale The Whale",
            duration: "6:30",
            audioUrl: "whale-song-symphony.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: "Deep Blue Meditation",
            artist: "Dale The Whale",
            duration: "8:20",
            audioUrl: "deep-blue-meditation.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        await db.insert(albums).values([
          {
            title: "Oceanic Collection",
            artist: "Dale The Whale",
            releaseDate: new Date("2025-01-15"),
            coverImage: "/images/music/ethereal-meditation.svg",
            description: "A collection of ocean-inspired tracks",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: "Cosmic Journeys",
            artist: "Dale The Whale",
            releaseDate: new Date("2024-12-01"),
            coverImage: "/static/images/cosmic-journeys.jpg",
            description: "Deep space ambient music",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      } */
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Session cleanup method
  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Define the session table structure for type safety and consistent use
      const sessionTable = pgTable('session', {
        sid: text('sid').primaryKey(),
        sess: json('sess').notNull(),
        expire: timestamp('expire').notNull()
      });
      
      // Use ORM's delete method with parameter binding to prevent SQL injection
      await db.delete(sessionTable)
        .where(
          // Using sql template literal for the date comparison, but in a safe way
          // This is safer than raw SQL as it's still using the ORM's parameter binding system
          sql`${sessionTable.expire} < NOW()`
        );
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      throw error;
    }
  }

  // Session analytics methods
  async getSessionAnalytics(userId: number): Promise<unknown> {
    try {
      // Query for the session table - this is safer as it uses parameterized queries
      // First define the session table to match the table structure
      const sessionTable = pgTable('session', {
        sid: text('sid').primaryKey(),
        sess: json('sess').notNull(),
        expire: timestamp('expire').notNull()
      });
      
      // Now we can create a properly parameterized query
      // This prevents SQL injection by using the ORM's parameter binding
      const sessions = await db.select({
        sid: sessionTable.sid,
        sess: sessionTable.sess,
        expire: sessionTable.expire
      })
      .from(sessionTable)
      .innerJoin(
        users,
        // This safely joins the tables using the ORM's parameter binding
        sql`${sessionTable.sess}->>'passport'->>'user' = ${users.id}::text`
      )
      .where(eq(users.id, userId)) // Safely parameterized
      .orderBy(desc(sessionTable.expire));
      
      return sessions;
    } catch (error) {
      console.error("Error fetching session analytics:", error);
      throw error;
    }
  }

  async updateSessionActivity(sessionId: string, data: unknown): Promise<void> {
    try {
      // Define the session table structure for type safety
      const sessionTable = pgTable('session', {
        sid: text('sid').primaryKey(),
        sess: json('sess').notNull(),
        expire: timestamp('expire').notNull()
      });
      
      // Use ORM's update method with parameter binding to prevent SQL injection
      await db.update(sessionTable)
        .set({
          // Using a raw SQL fragment only for the specific JSON operation
          // All user inputs (sessionId and data) are properly parameterized
          sess: sql`jsonb_set(${sessionTable.sess}::jsonb, '{analytics}', ${JSON.stringify(data)}::jsonb)`
        })
        .where(eq(sessionTable.sid, sessionId)); // Safely parameterized
    } catch (error) {
      console.error("Error updating session activity:", error);
      throw error;
    }
  }

  // Advanced admin methods implementation
  async updateUserRole(userId: number, role: 'user' | 'admin' | 'super_admin'): Promise<User> {
    try {
      const [updatedUser] = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  async banUser(userId: number): Promise<User> {
    try {
      await db.update(users)
        .set({ 
          isBanned: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Return the updated user
      const updatedUser = await this.getUser(userId);
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found after banning`);
      }
      return updatedUser;
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  }

  async unbanUser(userId: number): Promise<User> {
    try {
      await db.update(users)
        .set({ 
          isBanned: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Return the updated user
      const updatedUser = await this.getUser(userId);
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found after unbanning`);
      }
      return updatedUser;
    } catch (error) {
      console.error("Error unbanning user:", error);
      throw error;
    }
  }

  async getSystemSettings(): Promise<unknown> {
    try {
      // Define the system_settings table schema for type safety
      const systemSettingsTable = pgTable('system_settings', {
        id: serial('id').primaryKey(),
        enableRegistration: integer('enable_registration').notNull().default(1),
        requireEmailVerification: integer('require_email_verification').notNull().default(0),
        autoApproveContent: integer('auto_approve_content').notNull().default(0),
        updatedAt: timestamp('updated_at')
      });
      
      // Use ORM query builder for type-safe parameterized query
      const systemSettings = await db.select()
        .from(systemSettingsTable)
        .limit(1);
      
      return systemSettings[0] || {
        enableRegistration: true,
        requireEmailVerification: false,
        autoApproveContent: false
      };
    } catch (error) {
      console.error("Error fetching system settings:", error);
      throw error;
    }
  }

  async updateSystemSettings(settings: unknown): Promise<void> {
    try {
      // Define the system_settings table schema for type safety - same as in getSystemSettings
      const systemSettingsTable = pgTable('system_settings', {
        id: serial('id').primaryKey(),
        enableRegistration: integer('enable_registration').notNull().default(1),
        requireEmailVerification: integer('require_email_verification').notNull().default(0),
        autoApproveContent: integer('auto_approve_content').notNull().default(0),
        updatedAt: timestamp('updated_at')
      });
      
      // Get existing settings or use default ID
      const existingSettings = await db.select().from(systemSettingsTable).limit(1);
      const settingId = existingSettings[0]?.id || 1;
      
      // Clean and validate settings object to prevent injection
      const validKeys = ['enableRegistration', 'requireEmailVerification', 'autoApproveContent'];
      const cleanedSettings: Record<string, unknown> = {};
      
      // Only allow known keys to be updated
      Object.keys(settings).forEach(key => {
        if (validKeys.includes(key)) {
          // Convert boolean values to integers for database storage
          if (typeof settings[key] === 'boolean') {
            cleanedSettings[key] = settings[key] ? 1 : 0;
          } else if (typeof settings[key] === 'number') {
            cleanedSettings[key] = settings[key];
          }
        }
      });
      
      // Add updatedAt field
      cleanedSettings.updatedAt = new Date();
      
      // Use upsert to safely handle the insert or update
      await db.insert(systemSettingsTable)
        .values({
          id: settingId,
          ...cleanedSettings
        })
        .onConflictDoUpdate({
          target: systemSettingsTable.id,
          set: cleanedSettings
        });
    } catch (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
  }

  async getAdminAnalytics(fromDate?: string, toDate?: string): Promise<unknown> {
    try {
      console.log(`Storage: Filtering analytics from ${fromDate || 'beginning'} to ${toDate || 'now'}`);

      // Apply date filtering if provided
      const whereClause = fromDate && toDate 
        ? sql`created_at BETWEEN ${fromDate}::timestamp AND ${toDate}::timestamp`
        : fromDate 
          ? sql`created_at >= ${fromDate}::timestamp` 
          : toDate 
            ? sql`created_at <= ${toDate}::timestamp`
            : sql`TRUE`;

      // Get total user count - we don't have last_activity field, so we'll use total users as active
      // If date range is provided, count users created within that range
      const [activeUsers] = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(fromDate || toDate ? whereClause : sql`TRUE`);

      // Get new registrations in the last 30 days
      // If date range is provided, use that instead of hardcoded 30 days
      let registrationsWhereClause;
      if (fromDate || toDate) {
        registrationsWhereClause = whereClause;
      } else {
        registrationsWhereClause = sql`created_at > now() - interval '30 days'`;
      }
      const [newRegistrations] = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(registrationsWhereClause);

      // Get count of posts that need approval as our "content reports" metric
      // Apply date filtering here as well if provided
      let contentReportsQuery = db.select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(sql`approved = false`);

      // Apply date filter if provided
      let contentReports;
      if (fromDate || toDate) {
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(sql`approved = false AND ${whereClause}`);
        contentReports = result[0];
      } else {
        contentReports = await contentReportsQuery.then(res => res[0]);
      }

      // Get content distribution
      const [postsCount] = await db.select({ count: sql<number>`count(*)` })
        .from(posts);

      const [commentsCount] = await db.select({ count: sql<number>`count(*)` })
        .from(comments);

      const [tracksCount] = await db.select({ count: sql<number>`count(*)` })
        .from(tracks);

      // Get user roles distribution using parameterized queries
      const userRolesDistribution = {
        user: 0,
        admin: 0,
        super_admin: 0
      };
      
      // Get count by role using safe parameterized queries
      // Query for user role
      const userRoleResult = await db.select({
        count: count()
      })
      .from(users)
      .where(eq(users.role, 'user'));
      
      // Query for admin role
      const adminRoleResult = await db.select({
        count: count()
      })
      .from(users)
      .where(eq(users.role, 'admin'));
      
      // Query for super_admin role
      const superAdminRoleResult = await db.select({
        count: count()
      })
      .from(users)
      .where(eq(users.role, 'super_admin'));
      
      // Populate the distribution object with the results
      userRolesDistribution.user = Number(userRoleResult[0]?.count || 0);
      userRolesDistribution.admin = Number(adminRoleResult[0]?.count || 0);
      userRolesDistribution.super_admin = Number(superAdminRoleResult[0]?.count || 0);

      // Generate monthly user data for charts (last 6 months)
      // This is more complex and requires using SQL template literals, but we use them safely
      // with proper parameter binding
      
      // Default months array (fallback if query fails or returns no data)
      const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const activeUsersOverTime: number[] = [0, 0, 0, 0, 0, 0];
      
      try {
        // For this aggregation, we need to use SQL template literals, but in a safe way
        // All raw date calculations are using SQL literals (not user input)
        const userActivityData = await db.execute(
          sql`
            SELECT 
              to_char(date_trunc('month', created_at), 'Mon') as month,
              COUNT(id) as count
            FROM users
            WHERE created_at > NOW() - INTERVAL '6 months'
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
          `
        );
        
        // Clear default arrays if we have actual data
        if (userActivityData.rows.length > 0) {
          months.length = 0;
          activeUsersOverTime.length = 0;
          
          // Parse the results
          // TypeScript type checking for each property access
          userActivityData.rows.forEach((row: { month?: string; count?: string }) => {
            if (row.month && row.count) {
              months.push(String(row.month));
              activeUsersOverTime.push(Number(row.count));
            }
          });
        }
      } catch (error) {
        console.error("Error fetching monthly user data:", error);
        // Keep using the default arrays defined above
      }

      // Fill in missing months to always have 6 data points
      while (months.length < 6) {
        months.push('-');
        activeUsersOverTime.push(0);
      }

      // Similarly for registrations over time (use the same months for consistency)
      const newRegistrationsOverTime = [...activeUsersOverTime]; // For simplicity, using the same data pattern

      return {
        activeUsers: activeUsers?.count || 0,
        newRegistrations: newRegistrations?.count || 0,
        contentReports: contentReports?.count || 0,
        systemHealth: 'Good', // Simple health status
        months: months,
        activeUsersOverTime: activeUsersOverTime,
        newRegistrationsOverTime: newRegistrationsOverTime,
        contentDistribution: {
          posts: postsCount?.count || 0,
          comments: commentsCount?.count || 0,
          tracks: tracksCount?.count || 0
        },
        userRolesDistribution: userRolesDistribution
      };
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      // Return default values if there's an error
      return {
        activeUsers: 0,
        newRegistrations: 0, 
        contentReports: 0,
        systemHealth: 'Unknown',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        activeUsersOverTime: [0, 0, 0, 0, 0, 0],
        newRegistrationsOverTime: [0, 0, 0, 0, 0, 0],
        contentDistribution: {
          posts: 0,
          comments: 0,
          tracks: 0
        },
        userRolesDistribution: {
          user: 0,
          admin: 0,
          super_admin: 0
        }
      };
    }
  }

  async getUserActivity(userId: number): Promise<unknown> {
    try {
      // Use the ORM's built-in functions to create a properly parameterized query
      // This is safer than using raw SQL with template literals
      
      // Define the table structure for comments if needed
      const commentsTable = comments;
      
      // Use parameterized queries with proper type checking
      const result = await db.select({
        username: users.username,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
        // Use aggregation functions in a type-safe manner
        post_count: sql<number>`COUNT(DISTINCT ${posts.id})`, 
        comment_count: sql<number>`COUNT(DISTINCT ${commentsTable.id})`
      })
      .from(users)
      .leftJoin(posts, eq(posts.authorId, users.id))
      .leftJoin(commentsTable, eq(commentsTable.authorId, users.id))
      .where(eq(users.id, userId)) // Safely parameterized
      .groupBy(users.id, users.username, users.createdAt, users.updatedAt);
      
      return result[0] || {
        username: 'Unknown User',
        created_at: new Date(),
        updated_at: null,
        post_count: 0,
        comment_count: 0
      };
    } catch (error) {
      console.error("Error fetching user activity:", error);
      return {
        username: 'Unknown User',
        created_at: new Date(),
        updated_at: null,
        post_count: 0,
        comment_count: 0
      };
    }
  }

  // Content management methods
  async getAllContentItems(): Promise<ContentItem[]> {
    try {
      // Use parameterized queries with ORM methods
      return await db.select()
        .from(contentItems)
        .orderBy(desc(contentItems.updatedAt));
    } catch (error) {
      console.error("Error fetching content items:", error);
      throw error;
    }
  }

  async getContentItemById(id: number): Promise<ContentItem | null> {
    try {
      const [contentItem] = await db.select().from(contentItems).where(eq(contentItems.id, id));
      return contentItem || null;
    } catch (error) {
      console.error(`Error fetching content item by ID ${id}:`, error);
      throw error;
    }
  }

  async getContentItemByKey(key: string): Promise<ContentItem | null> {
    try {
      const [contentItem] = await db.select().from(contentItems).where(eq(contentItems.key, key));
      return contentItem || null;
    } catch (error) {
      console.error(`Error fetching content item by key "${key}":`, error);
      throw error;
    }
  }

  async createContentItem(contentData: unknown): Promise<ContentItem> {
    try {
      const now = new Date();
      const data = {
        ...contentData,
        createdAt: now,
        updatedAt: now
      };

      const [newContentItem] = await db.insert(contentItems).values(data).returning();
      return newContentItem;
    } catch (error) {
      console.error("Error creating content item:", error);
      throw error;
    }
  }

  async updateContentItem(contentData: {id: number} & Record<string, unknown>): Promise<ContentItem> {
    try {
      const { id, ...updateData } = contentData;

      // Make sure the content item exists
      const existingItem = await this.getContentItemById(id);
      if (!existingItem) {
        throw new Error(`Content item with ID ${id} not found`);
      }

      const now = new Date();
      const data = {
        ...updateData,
        updatedAt: now
      };

      const [updatedContentItem] = await db.update(contentItems)
        .set(data)
        .where(eq(contentItems.id, id))
        .returning();

      return updatedContentItem;
    } catch (error) {
      console.error(`Error updating content item with ID ${contentData.id}:`, error);
      throw error;
    }
  }

  async deleteContentItem(id: number): Promise<void> {
    try {
      // Make sure the content item exists
      const existingItem = await this.getContentItemById(id);
      if (!existingItem) {
        throw new Error(`Content item with ID ${id} not found`);
      }

      // Delete content usage records
      await db.delete(contentUsage).where(eq(contentUsage.contentId, id));

      // Delete content history records
      await db.delete(contentHistory).where(eq(contentHistory.contentId, id));

      // Finally delete the content item
      await db.delete(contentItems).where(eq(contentItems.id, id));
    } catch (error) {
      console.error(`Error deleting content item with ID ${id}:`, error);
      throw error;
    }
  }

  // Content versioning methods
  async getContentHistory(contentId: number): Promise<ContentHistory[]> {
    try {
      const history = await db.select()
        .from(contentHistory)
        .where(eq(contentHistory.contentId, contentId))
        .orderBy(desc(contentHistory.modifiedAt));

      return history;
    } catch (error) {
      console.error(`Error fetching content history for content ID ${contentId}:`, error);
      throw error;
    }
  }

  async createContentVersion(contentId: number, version: number, userId: number, changeDescription?: string): Promise<ContentHistory> {
    try {
      // Get current content item
      const contentItem = await this.getContentItemById(contentId);
      if (!contentItem) {
        throw new Error(`Content item with ID ${contentId} not found`);
      }

      // Create history record
      const historyData = {
        contentId,
        version: contentItem.version + 1,
        type: contentItem.type,
        title: contentItem.title,
        content: contentItem.content,
        page: contentItem.page,
        section: contentItem.section,
        imageUrl: contentItem.imageUrl,
        modifiedBy: userId,
        changeDescription: changeDescription || 'Content updated'
      };

      const [historyRecord] = await db.insert(contentHistory)
        .values(historyData)
        .returning();

      // Update the version number in the content item
      await db.update(contentItems)
        .set({ 
          version: contentItem.version + 1,
          lastModifiedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(contentItems.id, contentId));

      return historyRecord;
    } catch (error) {
      console.error(`Error creating content version for content ID ${contentId}:`, error);
      throw error;
    }
  }

  async restoreContentVersion(historyId: number): Promise<ContentItem> {
    try {
      // Get history record
      const [historyRecord] = await db.select()
        .from(contentHistory)
        .where(eq(contentHistory.id, historyId));

      if (!historyRecord) {
        throw new Error(`Content history record with ID ${historyId} not found`);
      }

      // Update content item with history data
      const [updatedContent] = await db.update(contentItems)
        .set({
          title: historyRecord.title,
          content: historyRecord.content,
          type: historyRecord.type,
          imageUrl: historyRecord.imageUrl,
          updatedAt: new Date(),
          version: historyRecord.version
        })
        .where(eq(contentItems.id, historyRecord.contentId))
        .returning();

      return updatedContent;
    } catch (error) {
      console.error(`Error restoring content version from history ID ${historyId}:`, error);
      throw error;
    }
  }

  // Content usage tracking methods
  async recordContentUsage(contentId: number, location: string, path: string): Promise<ContentUsage> {
    try {
      // Check if there's an existing usage record
      const [existingUsage] = await db.select()
        .from(contentUsage)
        .where(
          and(
            eq(contentUsage.contentId, contentId),
            eq(contentUsage.location, location),
            eq(contentUsage.path, path)
          )
        );

      if (existingUsage) {
        // Update existing record
        const [updatedUsage] = await db.update(contentUsage)
          .set({
            views: existingUsage.views + 1,
            lastViewed: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contentUsage.id, existingUsage.id))
          .returning();

        return updatedUsage;
      } else {
        // Create new record
        const [newUsage] = await db.insert(contentUsage)
          .values({
            contentId,
            location,
            path,
            views: 1,
            lastViewed: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return newUsage;
      }
    } catch (error) {
      console.error(`Error recording content usage for content ID ${contentId}:`, error);
      throw error;
    }
  }

  async incrementContentViews(contentId: number): Promise<void> {
    try {
      // Find all usage records for this content
      const usageRecords = await db.select()
        .from(contentUsage)
        .where(eq(contentUsage.contentId, contentId));

      // Update the views and last viewed time for each record
      for (const record of usageRecords) {
        await db.update(contentUsage)
          .set({
            views: record.views + 1,
            lastViewed: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contentUsage.id, record.id));
      }
    } catch (error) {
      console.error(`Error incrementing content views for content ID ${contentId}:`, error);
      throw error;
    }
  }

  async getContentUsageReport(contentId?: number): Promise<any[]> {
    try {
      // Use built-in ORM functions for aggregates where possible
      // For complex operations, use parameterized SQL functions to prevent SQL injection
      let query = db.select({
        id: contentItems.id,
        key: contentItems.key,
        title: contentItems.title,
        page: contentItems.page,
        section: contentItems.section,
        type: contentItems.type,
        // Use SQL template safely by not directly inserting user-controlled values
        totalViews: count(contentUsage.views).as('total_views'),
        lastViewed: max(contentUsage.lastViewed).as('last_viewed'),
        usageCount: count().as('usage_count'),
        // Array aggregations still need SQL templates but they're used on fixed column names, not user input
        locations: sql`ARRAY_AGG(DISTINCT ${contentUsage.location})`.as('locations'), 
        paths: sql`ARRAY_AGG(DISTINCT ${contentUsage.path})`.as('paths')
      })
      .from(contentItems)
      .leftJoin(contentUsage, eq(contentItems.id, contentUsage.contentId))
      .groupBy(contentItems.id);

      // Apply content ID filter if provided using parameterized query
      if (contentId) {
        query = query.where(eq(contentItems.id, contentId));
      }

      return await query;
    } catch (error) {
      console.error('Error generating content usage report:', error);
      throw error;
    }
  }
  
  // Content workflow methods
  async getContentWorkflowHistory(contentId: number): Promise<ContentWorkflowHistory[]> {
    try {
      const history = await db.select()
        .from(contentWorkflowHistory)
        .where(eq(contentWorkflowHistory.contentId, contentId))
        .orderBy(desc(contentWorkflowHistory.actionAt));
      
      return history;
    } catch (error) {
      console.error("Error fetching content workflow history:", error);
      throw error;
    }
  }
  
  async updateContentStatus(
    contentId: number, 
    status: string, 
    userId: number, 
    options?: { 
      reviewNotes?: string;
      scheduledPublishAt?: Date;
      expirationDate?: Date;
    }
  ): Promise<ContentItem> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Get current content item to record previous status
        const [currentContent] = await tx.select()
          .from(contentItems)
          .where(eq(contentItems.id, contentId));
        
        if (!currentContent) {
          throw new Error("Content item not found");
        }
        
        // Build update data
        const updateData: Record<string, unknown> = { 
          status, 
          updatedAt: new Date(),
          lastModifiedBy: userId
        };
        
        // Handle status-specific updates
        if (status === 'review') {
          updateData.reviewerId = userId;
          updateData.reviewStatus = 'in_progress';
          updateData.reviewStartedAt = new Date();
        } else if (status === 'changes_requested' || status === 'approved') {
          updateData.reviewStatus = 'completed';
          updateData.reviewCompletedAt = new Date();
          
          if (options?.reviewNotes) {
            updateData.reviewNotes = options.reviewNotes;
          }
        } else if (status === 'published') {
          // If there's a scheduled publish date in the future, keep status as approved
          if (options?.scheduledPublishAt && new Date(options.scheduledPublishAt) > new Date()) {
            updateData.status = 'approved';
            updateData.scheduledPublishAt = options.scheduledPublishAt;
          } else {
            // Otherwise publish immediately
            updateData.status = 'published';
          }
          
          // Set expiration date if provided
          if (options?.expirationDate) {
            updateData.expirationDate = options.expirationDate;
          }
        }
        
        // Update the content item
        const [updatedContent] = await tx.update(contentItems)
          .set(updateData)
          .where(eq(contentItems.id, contentId))
          .returning();
        
        // Record the workflow history
        await tx.insert(contentWorkflowHistory).values({
          contentId,
          fromStatus: currentContent.status,
          toStatus: updateData.status,
          actorId: userId,
          actionAt: new Date(),
          comments: options?.reviewNotes
        });
        
        return updatedContent;
      });
    } catch (error) {
      console.error("Error updating content status:", error);
      throw error;
    }
  }

  // TypeScript Error Management Methods
  // Error tracking methods
  async createTypeScriptError(error: InsertTypeScriptError): Promise<TypeScriptError> {
    try {
      // Check if error already exists
      const existingErrors = await db.select()
        .from(typeScriptErrors)
        .where(
          and(
            eq(typeScriptErrors.errorCode, error.errorCode),
            eq(typeScriptErrors.filePath, error.filePath),
            eq(typeScriptErrors.lineNumber, error.lineNumber),
            eq(typeScriptErrors.columnNumber, error.columnNumber)
          )
        );

      // If error already exists, increment the occurrence count
      if (existingErrors.length > 0) {
        const existingError = existingErrors[0];
        const [updatedError] = await db.update(typeScriptErrors)
          .set({
            occurrenceCount: existingError.occurrenceCount + 1,
            lastOccurrenceAt: new Date(),
            // Update other fields if needed
            status: error.status || existingError.status,
            errorMessage: error.errorMessage || existingError.errorMessage,
            errorContext: error.errorContext || existingError.errorContext,
            category: error.category || existingError.category,
            severity: error.severity || existingError.severity,
            metadata: error.metadata || existingError.metadata
          })
          .where(eq(typeScriptErrors.id, existingError.id))
          .returning();
        return updatedError;
      }

      // Otherwise, create a new error
      const [newError] = await db.insert(typeScriptErrors)
        .values(error)
        .returning();
      return newError;
    } catch (err) {
      console.error("Error creating TypeScript error:", err);
      throw err;
    }
  }

  async getTypeScriptErrorById(id: number): Promise<TypeScriptError | null> {
    const result = await db.select().from(typeScriptErrors).where(eq(typeScriptErrors.id, id));
    return result[0] || null;
  }

  async updateTypeScriptError(id: number, error: Partial<InsertTypeScriptError>): Promise<TypeScriptError> {
    const [updatedError] = await db.update(typeScriptErrors)
      .set({ ...error })
      .where(eq(typeScriptErrors.id, id))
      .returning();
    return updatedError;
  }

  async getAllTypeScriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    file_path?: string;
    detected_after?: Date;
    detected_before?: Date;
  }): Promise<TypeScriptError[]> {
    let query = db.select().from(typeScriptErrors);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(typeScriptErrors.status, filters.status as unknown));
      }
      
      if (filters.severity) {
        conditions.push(eq(typeScriptErrors.severity, filters.severity as unknown));
      }
      
      if (filters.category) {
        conditions.push(eq(typeScriptErrors.category, filters.category as unknown));
      }
      
      if (filters.filePath) {
        conditions.push(eq(typeScriptErrors.filePath, filters.filePath));
      }
      
      if (filters.fromDate) {
        conditions.push(sql`${typeScriptErrors.detectedAt} >= ${filters.fromDate}`);
      }
      
      if (filters.toDate) {
        conditions.push(sql`${typeScriptErrors.detectedAt} <= ${filters.toDate}`);
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    query = query.orderBy(
      desc(typeScriptErrors.severity),
      desc(typeScriptErrors.occurrenceCount),
      desc(typeScriptErrors.lastOccurrenceAt)
    );
    
    return await query;
  }

  async getTypeScriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
    fixRate: number;
  }> {
    // Create date filters if provided
    const dateFilters = [];
    if (fromDate) {
      dateFilters.push(sql`${typeScriptErrors.detectedAt} >= ${fromDate}`);
    }
    if (toDate) {
      dateFilters.push(sql`${typeScriptErrors.detectedAt} <= ${toDate}`);
    }
    
    // Get total errors
    const totalErrorsResult = await db.select({
      count: count()
    }).from(typeScriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined);
    
    const totalErrors = totalErrorsResult[0]?.count || 0;
    
    // Get errors by severity
    const bySeverityResult = await db.select({
      severity: typeScriptErrors.severity,
      count: count()
    }).from(typeScriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typeScriptErrors.severity);
    
    const bySeverity: Record<string, number> = {};
    bySeverityResult.forEach(row => {
      bySeverity[row.severity] = Number(row.count);
    });
    
    // Get errors by category
    const byCategoryResult = await db.select({
      category: typeScriptErrors.category,
      count: count()
    }).from(typeScriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typeScriptErrors.category);
    
    const byCategory: Record<string, number> = {};
    byCategoryResult.forEach(row => {
      byCategory[row.category] = Number(row.count);
    });
    
    // Get errors by status
    const byStatusResult = await db.select({
      status: typeScriptErrors.status,
      count: count()
    }).from(typeScriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typeScriptErrors.status);
    
    const byStatus: Record<string, number> = {};
    byStatusResult.forEach(row => {
      byStatus[row.status] = Number(row.count);
    });
    
    // Get top files with errors
    const topFilesResult = await db.select({
      filePath: typeScriptErrors.filePath,
      count: count()
    }).from(typeScriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typeScriptErrors.filePath)
    .orderBy(sql`count(*) desc`)
    .limit(10);
    
    const topFiles = topFilesResult.map(row => ({
      filePath: row.filePath,
      count: Number(row.count)
    }));
    
    // Calculate fix rate (fixed / total)
    const fixedCount = byStatus['fixed'] || 0;
    const fixRate = totalErrors > 0 ? (fixedCount / totalErrors) * 100 : 0;
    
    return {
      totalErrors,
      bySeverity,
      byCategory,
      byStatus,
      topFiles,
      fixRate
    };
  }

  async markErrorAsFixed(id: number, fixId: number, userId: number): Promise<TypeScriptError> {
    const now = new Date();
    const [updatedError] = await db.update(typeScriptErrors)
      .set({
        status: 'fixed',
        resolvedAt: now,
        fixId: fixId,
        userId: userId
      })
      .where(eq(typeScriptErrors.id, id))
      .returning();
    return updatedError;
  }
  
  // Error pattern methods
  async createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
    const [newPattern] = await db.insert(errorPatterns)
      .values(pattern)
      .returning();
    return newPattern;
  }

  async getErrorPatternById(id: number): Promise<ErrorPattern | null> {
    const result = await db.select().from(errorPatterns).where(eq(errorPatterns.id, id));
    return result[0] || null;
  }

  async updateErrorPattern(id: number, pattern: Partial<InsertErrorPattern>): Promise<ErrorPattern> {
    const now = new Date();
    const [updatedPattern] = await db.update(errorPatterns)
      .set({
        ...pattern,
        updatedAt: now
      })
      .where(eq(errorPatterns.id, id))
      .returning();
    return updatedPattern;
  }

  async getAllErrorPatterns(): Promise<ErrorPattern[]> {
    return await db.select().from(errorPatterns);
  }

  async getErrorPatternsByCategory(category: string): Promise<ErrorPattern[]> {
    return await db.select()
      .from(errorPatterns)
      .where(eq(errorPatterns.category, category as unknown));
  }

  async getAutoFixablePatterns(): Promise<ErrorPattern[]> {
    return await db.select()
      .from(errorPatterns)
      .where(eq(errorPatterns.autoFixable, true));
  }
  
  // Fix methods
  async createErrorFix(fix: InsertErrorFix): Promise<ErrorFix> {
    const [newFix] = await db.insert(errorFixes)
      .values(fix)
      .returning();
    return newFix;
  }

  async getErrorFixById(id: number): Promise<ErrorFix | null> {
    const result = await db.select().from(errorFixes).where(eq(errorFixes.id, id));
    return result[0] || null;
  }

  async updateErrorFix(id: number, fix: Partial<InsertErrorFix>): Promise<ErrorFix> {
    const now = new Date();
    const [updatedFix] = await db.update(errorFixes)
      .set({
        ...fix,
        updatedAt: now
      })
      .where(eq(errorFixes.id, id))
      .returning();
    return updatedFix;
  }

  async getAllErrorFixes(): Promise<ErrorFix[]> {
    return await db.select().from(errorFixes);
  }

  async getFixesByPatternId(patternId: number): Promise<ErrorFix[]> {
    return await db.select()
      .from(errorFixes)
      .where(eq(errorFixes.patternId, patternId));
  }
  
  // Fix history methods
  async createFixHistory(fixHistory: InsertErrorFixHistory): Promise<ErrorFixHistory> {
    const [newFixHistory] = await db.insert(errorFixHistory)
      .values(fixHistory)
      .returning();
    return newFixHistory;
  }

  async getFixHistoryByErrorId(errorId: number): Promise<ErrorFixHistory[]> {
    return await db.select()
      .from(errorFixHistory)
      .where(eq(errorFixHistory.errorId, errorId))
      .orderBy(desc(errorFixHistory.fixedAt));
  }

  async getFixHistoryStats(userId?: number, fromDate?: Date, toDate?: Date): Promise<{
    totalFixes: number;
    byMethod: Record<string, number>;
    byResult: Record<string, number>;
    averageFixTime: number;
    topFixers: Array<{ userId: number; username: string; count: number }>;
  }> {
    // Create filters
    const filters = [];
    
    if (userId) {
      filters.push(eq(errorFixHistory.fixedBy, userId));
    }
    
    if (fromDate) {
      filters.push(sql`${errorFixHistory.fixedAt} >= ${fromDate}`);
    }
    
    if (toDate) {
      filters.push(sql`${errorFixHistory.fixedAt} <= ${toDate}`);
    }
    
    // Get total fixes
    const totalFixesResult = await db.select({
      count: count()
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined);
    
    const totalFixes = totalFixesResult[0]?.count || 0;
    
    // Get fixes by method
    const byMethodResult = await db.select({
      method: errorFixHistory.fixMethod,
      count: count()
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(errorFixHistory.fixMethod);
    
    const byMethod: Record<string, number> = {};
    byMethodResult.forEach(row => {
      byMethod[row.method] = Number(row.count);
    });
    
    // Get fixes by result
    const byResultResult = await db.select({
      result: errorFixHistory.fixResult,
      count: count()
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(errorFixHistory.fixResult);
    
    const byResult: Record<string, number> = {};
    byResultResult.forEach(row => {
      byResult[row.result] = Number(row.count);
    });
    
    // Get average fix time
    const avgFixTimeResult = await db.select({
      avg: sql<number>`avg(${errorFixHistory.fixDuration})`
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined);
    
    const averageFixTime = avgFixTimeResult[0]?.avg || 0;
    
    // Get top fixers
    const topFixersResult = await db
      .select({
        userId: errorFixHistory.fixedBy,
        username: users.username,
        count: count()
      })
      .from(errorFixHistory)
      .leftJoin(users, eq(errorFixHistory.fixedBy, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .groupBy(errorFixHistory.fixedBy, users.username)
      .orderBy(sql`count(*) desc`)
      .limit(10);
    
    const topFixers = topFixersResult.map(row => ({
      userId: row.userId as number,
      username: row.username as string,
      count: Number(row.count)
    }));
    
    return {
      totalFixes,
      byMethod,
      byResult,
      averageFixTime,
      topFixers
    };
  }
  
  // Project analysis methods
  async createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const [newAnalysis] = await db.insert(projectAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getProjectAnalysisById(id: number): Promise<ProjectAnalysis | null> {
    const result = await db.select().from(projectAnalyses).where(eq(projectAnalyses.id, id));
    return result[0] || null;
  }

  async updateProjectAnalysis(id: number, analysis: Partial<InsertProjectAnalysis>): Promise<ProjectAnalysis> {
    const [updatedAnalysis] = await db.update(projectAnalyses)
      .set(analysis)
      .where(eq(projectAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }

  async getAllProjectAnalyses(limit?: number): Promise<ProjectAnalysis[]> {
    let query = db.select().from(projectAnalyses).orderBy(desc(projectAnalyses.startedAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async getLatestProjectAnalysis(): Promise<ProjectAnalysis | null> {
    const results = await db.select().from(projectAnalyses)
      .orderBy(desc(projectAnalyses.startedAt))
      .limit(1);
    return results[0] || null;
  }
  
  // Project file methods
  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db.insert(projectFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile> {
    const [updatedFile] = await db.update(projectFiles)
      .set(file)
      .where(eq(projectFiles.id, id))
      .returning();
    return updatedFile;
  }

  async getProjectFileByPath(filePath: string): Promise<ProjectFile | null> {
    const results = await db.select().from(projectFiles)
      .where(eq(projectFiles.filePath, filePath));
    return results[0] || null;
  }

  async getAllProjectFiles(): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles);
  }

  async getProjectFilesWithErrors(): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles)
      .where(gt(projectFiles.errorCount, 0))
      .orderBy(desc(projectFiles.errorCount));
  }
}

// Export an instance of PostgresStorage
export const storage = new PostgresStorage();

// contentItems is already defined in shared/schema.ts so we don't need to define it again
// export const contentItems = pgTable('content_items', {
//   id: serial('id').primaryKey(),
//   key: text('key').notNull().unique(),
//   title: text('title').notNull(),
//   content: text('content').notNull(),
//   type: text('type', { enum: ['text', 'html', 'image'] }).notNull(),
//   page: text('page').notNull(),
//   section: text('section').notNull(),
//   imageUrl: text('image_url'),
//   version: integer('version').notNull().default(1),
//   status: text('status', { enum: ['draft', 'in_review', 'changes_requested', 'approved', 'published', 'archived'] }).notNull().default('draft'),
//   reviewerId: integer('reviewer_id').references(() => users.id),
//   reviewStatus: text('review_status', { enum: ['pending', 'in_progress', 'completed'] }),
//   reviewStartedAt: timestamp('review_started_at'),
//   reviewCompletedAt: timestamp('review_completed_at'),
//   scheduledPublishAt: timestamp('scheduled_publish_at'),
//   lastEditedAt: timestamp('last_edited_at'),
//   editHistory: json('edit_history'),
//   reviewNotes: text('review_notes'),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
//   updatedAt: timestamp('updated_at'),
//   createdBy: integer('created_by').references(() => users.id),
//   updatedBy: integer('updated_by').references(() => users.id),
// });