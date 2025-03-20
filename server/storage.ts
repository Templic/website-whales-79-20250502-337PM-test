declare module 'connect-pg-simple' {
  import session from 'express-session';
  export default function connectPgSimple(session: typeof import('express-session')): new (options: any) => session.Store;
}

import { type Subscriber, type InsertSubscriber, type Post, type InsertPost, type Category, type InsertCategory, type Comment, type InsertComment, type User, type InsertUser, type Track, type Album, subscribers, posts, categories, comments, users, tracks, albums } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';


const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Subscriber methods
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;

  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<Post[]>;
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
  getAlbums(): Promise<Album[]>;
  uploadMusic(params: { file: any; targetPage: string; uploadedBy: number; userRole: 'admin' | 'super_admin' }): Promise<Track>;
  deleteMusic(trackId: number, userId: number, userRole: 'admin' | 'super_admin'): Promise<void>;

  // Session management methods
  cleanupExpiredSessions(): Promise<void>;
  getSessionAnalytics(userId: number): Promise<any>;
  updateSessionActivity(sessionId: string, data: any): Promise<void>;

  // Advanced admin methods
  updateUserRole(userId: number, role: 'user' | 'admin' | 'super_admin'): Promise<User>;
  banUser(userId: number): Promise<void>;
  unbanUser(userId: number): Promise<void>;
  getSystemSettings(): Promise<any>;
  updateSystemSettings(settings: any): Promise<void>;
  getAdminAnalytics(): Promise<any>;
  getUserActivity(userId: number): Promise<any>;
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

    // Initialize sample music data
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error: any) {
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  // Subscriber methods
  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const result = await db.insert(subscribers).values(insertSubscriber).returning();
    return result[0];
  }

  // Post methods
  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(sql`created_at DESC`);
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
  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db.select()
      .from(comments)
      .where(sql`post_id = ${postId} AND approved = true`)
      .orderBy(sql`created_at DESC`);
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
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    await db.execute(sql`
      INSERT INTO password_reset_tokens (user_id, token, expires, used)
      VALUES (${userId}, ${token}, ${expires}, false)
    `);

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<User | undefined> {
    const result = await db.execute(sql`
      SELECT u.* FROM users u
      JOIN password_reset_tokens t ON u.id = t.user_id
      WHERE t.token = ${token}
      AND t.expires > NOW()
      AND t.used = false
    `);

    return result.rows[0];
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    // Mark any existing reset tokens as used
    await db.execute(sql`
      UPDATE password_reset_tokens
      SET used = true
      WHERE user_id = ${userId}
    `);

    return updatedUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async approvePost(id: number): Promise<Post> {
    const result = await db.update(posts)
      .set({ approved: true, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  async getUnapprovedPosts(): Promise<Post[]> {
    return await db.select()
      .from(posts)
      .where(sql`approved = false`)
      .orderBy(sql`created_at DESC`);
  }

  async getUnapprovedComments(): Promise<Comment[]> {
    console.log('Attempting to fetch unapproved comments...');
    try {
      const results = await db.select()
        .from(comments)
        .where(eq(comments.approved, false))
        .orderBy(sql`created_at DESC`);

      console.log('Fetched unapproved comments:', results);
      return results;
    } catch (error) {
      console.error('Error fetching unapproved comments:', error);
      throw error;
    }
  }

  // Music methods
  async getTracks(): Promise<Track[]> {
    return await db.select().from(tracks).orderBy(sql`created_at DESC`);
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums).orderBy(sql`release_date DESC`);
  }

  async deleteMusic(trackId: number, userId: number, userRole: 'admin' | 'super_admin'): Promise<void> {
    // Verify user has required role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      throw new Error('Unauthorized - requires admin privileges');
    }

    // Get track info before deletion
    const [track] = await db.select().from(tracks).where(eq(tracks.id, trackId));
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
    await db.delete(tracks).where(eq(tracks.id, trackId));
  }

  async uploadMusic({ file, targetPage, uploadedBy, userRole }: { 
    file: any, 
    targetPage: string,
    uploadedBy: number,
    userRole: 'admin' | 'super_admin'
  }): Promise<Track> {
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
    const [track] = await db.insert(tracks).values({
      title: file.name,
      artist: "Dale the Whale", // Could be made dynamic
      audioUrl: fileName, //Store relative path
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return track;
  }

  async initializeSampleData() {
    try {
      // Check if sample data already exists
      const existingTracks = await db.select().from(tracks);
      if (existingTracks.length === 0) {
        // Add sample tracks
        await db.insert(tracks).values([
          {
            title: "Oceanic Dreams",
            artist: "Dale The Whale",
            duration: "4:35",
            releaseDate: new Date("2025-01-15"),
            genre: "Ambient Electronic",
            isNewRelease: false,
            audioUrl: "oceanic-dreams.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: "Feels So Good",
            artist: "Dale The Whale ft. AC3-2085",
            duration: "3:45",
            audioUrl: "feels-so-good.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: "Cosmic Echoes", 
            artist: "Dale The Whale",
            duration: "5:20",
            audioUrl: "cosmic-echoes.mp3",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        await db.insert(albums).values([
          {
            title: "Oceanic Collection",
            artist: "Dale The Whale",
            releaseDate: new Date("2025-01-15"),
            coverArt: "/static/images/oceanic-collection.jpg",
            tracksCount: 12
          },
          {
            title: "Cosmic Journeys",
            artist: "Dale The Whale",
            releaseDate: new Date("2024-12-01"),
            coverArt: "/static/images/cosmic-journeys.jpg",
            tracksCount: 10
          }
        ]);
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Session cleanup method
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await db.execute(sql`
        DELETE FROM "session"
        WHERE expire < NOW()
      `);
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      throw error;
    }
  }

  // Session analytics methods
  async getSessionAnalytics(userId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT s.*
        FROM "session" s
        JOIN "users" u ON s.sess->>'passport'->>'user' = u.id::text
        WHERE u.id = ${userId}
        ORDER BY s.expire DESC
      `);
      return result.rows;
    } catch (error) {
      console.error("Error fetching session analytics:", error);
      throw error;
    }
  }

  async updateSessionActivity(sessionId: string, data: any): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE "session"
        SET sess = jsonb_set(sess::jsonb, '{analytics}', ${JSON.stringify(data)}::jsonb)
        WHERE sid = ${sessionId}
      `);
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

  async banUser(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          isBanned: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  }

  async unbanUser(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          isBanned: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error unbanning user:", error);
      throw error;
    }
  }

  async getSystemSettings(): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT *
        FROM system_settings
        LIMIT 1
      `);
      return result.rows[0] || {
        enableRegistration: true,
        requireEmailVerification: false,
        autoApproveContent: false
      };
    } catch (error) {
      console.error("Error fetching system settings:", error);
      throw error;
    }
  }

  async updateSystemSettings(settings: any): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO system_settings ${sql.raw(Object.keys(settings).join(', '))}
        VALUES ${sql.raw(Object.values(settings).map(v => typeof v === 'boolean' ? v : `'${v}'`).join(', '))}
        ON CONFLICT (id) DO UPDATE
        SET ${sql.raw(Object.entries(settings).map(([k, v]) => `${k} = ${typeof v === 'boolean' ? v : `'${v}'`}`).join(', '))}
      `);
    } catch (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
  }

  async getAdminAnalytics(): Promise<any> {
    try {
      const [activeUsers] = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`last_activity > now() - interval '24 hours'`);

      const [newRegistrations] = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`created_at > now() - interval '7 days'`);

      const [contentReports] = await db.select({ count: sql<number>`count(*)` })
        .from('content_reports')
        .where(sql`created_at > now() - interval '24 hours'`);

      return {
        activeUsers: activeUsers?.count || 0,
        newRegistrations: newRegistrations?.count || 0,
        contentReports: contentReports?.count || 0,
        systemHealth: 'Good' // You can implement more sophisticated health checks
      };
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      throw error;
    }
  }

  async getUserActivity(userId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT 
          u.username,
          u.last_activity,
          COUNT(DISTINCT p.id) as post_count,
          COUNT(DISTINCT c.id) as comment_count
        FROM users u
        LEFT JOIN posts p ON p.author_id = u.id
        LEFT JOIN comments c ON c.author_id = u.id
        WHERE u.id = ${userId}
        GROUP BY u.id, u.username, u.last_activity
      `);
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching user activity:", error);
      throw error;
    }
  }
}

// Export an instance of PostgresStorage
export const storage = new PostgresStorage();