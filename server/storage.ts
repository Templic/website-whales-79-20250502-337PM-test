import { type Subscriber, type InsertSubscriber, type Post, type InsertPost, type Category, type InsertCategory, type Comment, type InsertComment, subscribers, posts, categories, comments } from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
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
}

export class PostgresStorage implements IStorage {
  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const result = await db.insert(subscribers).values(insertSubscriber).returning();
    return result[0];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(sql`created_at DESC`);
  }

  async getPostById(id: number): Promise<Post | null> {
    const result = await db.select().from(posts).where(sql`id = ${id}`);
    return result[0] || null;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    const result = await db.update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(sql`id = ${id}`)
      .returning();
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

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
      .where(sql`id = ${id}`)
      .returning();
    return result[0];
  }
}

// Export an instance of PostgresStorage instead of MemStorage
export const storage = new PostgresStorage();