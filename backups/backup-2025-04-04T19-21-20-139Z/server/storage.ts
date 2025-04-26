declare module 'connect-pg-simple' {
  import session from 'express-session';
  export default function connectPgSimple(session: typeof import('express-session')): new ((options: any): unknown) => session.Store;
}

import { type Subscriber, type InsertSubscriber, type Post, type InsertPost, type Category, type InsertCategory, type Comment, type InsertComment, type User, type InsertUser, type Track, type Album, type Newsletter, type InsertNewsletter, subscribers, posts, categories, comments, users, tracks, albums, newsletters } from "@shared/schema";
import { sql, eq, and } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword } from './auth';


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
  deleteUser(id: number): Promise<void>;

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
  uploadMusic(params: { file: unknown; targetPage: string; uploadedBy: number; userRole: 'admin' | 'super_admin' }): Promise<Track>;
  deleteMusic(trackId: number, userId: number, userRole: 'admin' | 'super_admin'): Promise<void>;

  // Session management methods
  cleanupExpiredSessions(): Promise<void>;
  getSessionAnalytics(userId: number): Promise<unknown>;
  updateSessionActivity(sessionId: string, data: any): Promise<void>;

  // Advanced admin methods
  updateUserRole(userId: number, role: 'user' | 'admin' | 'super_admin'): Promise<User>;
  banUser(userId: number): Promise<void>;
  unbanUser(userId: number): Promise<void>;
  getSystemSettings(): Promise<unknown>;
  updateSystemSettings(settings: any): Promise<void>;
  getAdminAnalytics(fromDate?: string, toDate?: string): Promise<unknown>;
  getUserActivity(userId: number): Promise<unknown>;
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
    } catch (error: unknown) {
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
    return await db.select().from(newsletters).orderBy(sql`created_at DESC`);
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

  async getCommentsByPostId(postId: number, onlyApproved: boolean = false): Promise<Comment[]> {
    console.log(`Fetching comments for post ID: ${postId}, onlyApproved: ${onlyApproved}`);

    // Build the SQL query based on the parameters
    let query;
    if (onlyApproved) {
      query = sql`
        SELECT * FROM comments 
        WHERE post_id = ${postId} AND approved = true
        ORDER BY created_at DESC
      `;
    } else {
      query = sql`
        SELECT * FROM comments 
        WHERE post_id = ${postId}
        ORDER BY created_at DESC
      `;
    }

    const result = await db.execute(query);
    console.log(`Found ${result.rowCount} comments for post ID ${postId}`);
    return result.rows as Comment[];
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

  async deleteUser(id: number): Promise<void> {
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

  async createInitialUsers() {
    try {
      const initialUsers = [
        { username: 'admin', password: await hashPassword('admin123'), email: 'admin@example.com', role: 'admin' },
        { username: 'superadmin', password: await hashPassword('superadmin123'), email: 'superadmin@example.com', role: 'super_admin' },
        { username: 'user', password: await hashPassword('user123'), email: 'user@example.com', role: 'user' }
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
    try {
      // Initialize subscribers
      const existingSubscribers = await db.select().from(subscribers);
      if (existingSubscribers.length === 0) {
        await db.insert(subscribers).values([
          {
            name: "Emily Johnson",
            email: "emily.j@example.com",
            active: true,
            createdAt: new Date("2024-01-15")
          },
          {
            name: "Michael Chen",
            email: "m.chen@example.com",
            active: true,
            createdAt: new Date("2024-01-16")
          },
          {
            name: "Sarah Williams",
            email: "sarah.w@example.com",
            active: true,
            createdAt: new Date("2024-01-17")
          }
        ]);
      }
      
      // Initialize sample newsletters
      const existingNewsletters = await db.select().from(newsletters);
      if (existingNewsletters.length === 0) {
        await db.insert(newsletters).values([
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
      }

      // Initialize collaboration proposals
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS collaboration_proposals (
          id SERIAL PRIMARY KEY,
          artist_name TEXT NOT NULL,
          email TEXT NOT NULL,
          proposal_type TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const existingProposals = await db.execute(sql`SELECT * FROM collaboration_proposals`);
      if (existingProposals.rowCount === 0) {
        await db.execute(sql`
          INSERT INTO collaboration_proposals (artist_name, email, proposal_type, description, status)
          VALUES 
            ('Luna Echo', 'luna@example.com', 'Music Collaboration', 'Interested in creating a cosmic ambient track together', 'pending'),
            ('DJ Starlight', 'djstar@example.com', 'Live Performance', 'Would love to collaborate for an ocean-themed event', 'pending'),
            ('The Wave Riders', 'wave@example.com', 'Album Feature', 'Proposing a joint EP focused on marine conservation', 'pending')
        `);
      }

      // Initialize patrons
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS patrons (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          tier TEXT NOT NULL,
          subscription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          active BOOLEAN DEFAULT true
        )
      `);

      const existingPatrons = await db.execute(sql`SELECT * FROM patrons`);
      if (existingPatrons.rowCount === 0) {
        await db.execute(sql`
          INSERT INTO patrons (name, email, tier)
          VALUES 
            ('Alex Thompson', 'alex@example.com', 'Whale Guardian'),
            ('Maria Garcia', 'maria@example.com', 'Ocean Protector'),
            ('James Wilson', 'james@example.com', 'Wave Rider')
        `);
      }

      // Initialize tour dates
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tour_dates (
          id SERIAL PRIMARY KEY,
          venue TEXT NOT NULL,
          city TEXT NOT NULL,
          date TIMESTAMP NOT NULL,
          ticket_link TEXT,
          status TEXT DEFAULT 'upcoming'
        )
      `);

      const existingTours = await db.execute(sql`SELECT * FROM tour_dates`);
      if (existingTours.rowCount === 0) {
        await db.execute(sql`
          INSERT INTO tour_dates (venue, city, date, ticket_link, status)
          VALUES 
            ('Ocean Sound Arena', 'Miami', '2024-04-15 20:00:00', 'https://tickets.example.com/miami', 'upcoming'),
            ('Cosmic Waves Theater', 'Los Angeles', '2024-05-01 19:30:00', 'https://tickets.example.com/la', 'upcoming'),
            ('Blue Note Jazz Club', 'New York', '2024-05-15 21:00:00', 'https://tickets.example.com/ny', 'upcoming'),
            ('Marine Gardens', 'Seattle', '2024-06-01 20:00:00', 'https://tickets.example.com/seattle', 'upcoming')
        `);
      }

      // Check if sample tracks exist and maintain "Feels So Good" at the top
      const existingTracks = await db.select().from(tracks);
      if (existingTracks.length === 0) {
        // Add sample tracks
        await db.insert(tracks).values([
          {
            title: "Feels So Good",
            artist: "Dale The Whale ft. AC3-2085",
            duration: "3:45",
            audioUrl: "feels-so-good.mp3",
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
            coverImage: "/static/images/oceanic-collection.jpg",
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
  async getSessionAnalytics(userId: number): Promise<unknown> {
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

  async getSystemSettings(): Promise<unknown> {
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

      // Get user roles distribution
      const userRolesResult = await db.execute(sql`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);

      const userRolesDistribution = {
        user: 0,
        admin: 0,
        super_admin: 0
      };

      userRolesResult.rows.forEach(((row: any): unknown) => {
        if (row.role && userRolesDistribution.hasOwnProperty(row.role)) {
          userRolesDistribution[row.role as keyof typeof userRolesDistribution] = parseInt(row.count);
        }
      });

      // Generate monthly user data for charts (last 6 months)
      const userActivityData = await db.execute(sql`
        SELECT 
          to_char(date_trunc('month', created_at), 'Mon') as month,
          COUNT(*) as count
        FROM users
        WHERE created_at > now() - interval '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
      `);

      // Extract months and counts for charts
      const months: string[] = [];
      const activeUsersOverTime: number[] = [];

      userActivityData.rows.forEach(((row: any): unknown) => {
        months.push(row.month);
        activeUsersOverTime.push(parseInt(row.count));
      });

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
      const result = await db.execute(sql`
        SELECT 
          u.username,
          u.created_at,
          u.updated_at,
          COUNT(DISTINCT p.id) as post_count,
          COUNT(DISTINCT c.id) as comment_count
        FROM users u
        LEFT JOIN posts p ON p.author_id = u.id
        LEFT JOIN comments c ON c.author_id = u.id
        WHERE u.id = ${userId}
        GROUP BY u.id, u.username, u.created_at, u.updated_at
      `);
      return result.rows[0] || {
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
}

// Export an instance of PostgresStorage
export const storage = new PostgresStorage();