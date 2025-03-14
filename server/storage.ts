declare module 'connect-pg-simple' {
  import session from 'express-session';
  export default function connectPgSimple(session: typeof import('express-session')): new (options: any) => session.Store;
}

import { type Subscriber, type InsertSubscriber, type Post, type InsertPost, type Category, type InsertCategory, type Comment, type InsertComment, type User, type InsertUser, subscribers, posts, categories, comments, users } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { randomBytes } from 'crypto';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>; // Added method

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

  // Password recovery methods
  createPasswordResetToken(userId: number): Promise<string>;
  validatePasswordResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User>;

  // Admin methods for content moderation
  approvePost(id: number): Promise<Post>;
  getUnapprovedPosts(): Promise<Post[]>;
  getUnapprovedComments(): Promise<Comment[]>;
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
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
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
}

// Export an instance of PostgresStorage
export const storage = new PostgresStorage();