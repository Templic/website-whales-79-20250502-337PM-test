declare module 'connect-pg-simple' {
  import session from 'express-session';
  export default function connectPgSimple(session: typeof import('express-session')): new (options: any) => session.Store;
}

import { type Subscriber, type InsertSubscriber, type Post, type InsertPost, type Category, type InsertCategory, type Comment, type InsertComment, type User, type InsertUser, type Track, type Album, type Newsletter, type InsertNewsletter, type ContentItem, type InsertContentItem, subscribers, posts, categories, comments, users, tracks, albums, newsletters, contentItems } from "@shared/schema";
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
  uploadMusic(params: { file: any; targetPage: string; uploadedBy: number; userRole: 'admin' | 'super_admin' }): Promise<Track>;
  deleteMusic(trackId: number, userId: number, userRole: 'admin' | 'super_admin'): Promise<void>;

  // Session management methods
  cleanupExpiredSessions(): Promise<void>;
  getSessionAnalytics(userId: number): Promise<any>;
  updateSessionActivity(sessionId: string, data: any): Promise<void>;

  // Advanced admin methods
  updateUserRole(userId: number, role: 'user' | 'admin' | 'super_admin'): Promise<User>;
  banUser(userId: number): Promise<User>;
  unbanUser(userId: number): Promise<User>;
  getSystemSettings(): Promise<any>;
  updateSystemSettings(settings: any): Promise<void>;
  getAdminAnalytics(fromDate?: string, toDate?: string): Promise<any>;
  getUserActivity(userId: number): Promise<any>;
  
  // Content management methods
  getAllContentItems(): Promise<ContentItem[]>;
  getContentItemById(id: number): Promise<ContentItem | null>;
  getContentItemByKey(key: string): Promise<ContentItem | null>;
  createContentItem(contentItem: any): Promise<ContentItem>;
  updateContentItem(contentItem: any): Promise<ContentItem>;
  deleteContentItem(id: number): Promise<void>;
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
      
      // Delete post category associations using raw SQL
      // (postCategories is a junction table)
      await db.execute(sql`
        DELETE FROM post_categories 
        WHERE post_id = ${id}
      `);
      
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

      // Initialize blog categories
      const existingCategories = await db.select().from(categories);
      if (existingCategories.length === 0) {
        console.log("Initializing blog categories...");
        await db.insert(categories).values([
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
      }

      // Initialize blog posts
      const existingPosts = await db.select().from(posts);
      if (existingPosts.length === 0) {
        console.log("Initializing blog posts...");
        
        // The categories should be available now
        const blogCategories = await db.select().from(categories);
        const categoryMap = blogCategories.reduce((map, category) => {
          map[category.slug] = category.id;
          return map;
        }, {} as Record<string, number>);

        // Insert blog posts
        await db.insert(posts).values([
          {
            title: "The Cosmic Symphony: Where Music Meets the Universe",
            content: `<p>In the vast expanse of the cosmos, there exists a harmony that transcends our understanding. As a musician who draws inspiration from both the depths of the ocean and the mysteries of space, I've always been fascinated by the cosmic symphony that surrounds us.</p>
            
            <p>Recent discoveries in astrophysics have revealed that celestial bodies emit frequencies that can be translated into sound. These "cosmic melodies" have inspired my latest album, where I attempt to weave together the sounds of distant stars with the songs of the ocean's gentle giants.</p>
            
            <p>When we listen closely to the universe, we find that rhythm is not just a human invention—it's a fundamental property of existence itself. From the pulsing of neutron stars to the oscillations of gas in distant nebulae, the cosmos is constantly creating its own music.</p>
            
            <p>My journey to capture these sounds has taken me to remote observatories and deep-sea expeditions. The resulting compositions blend astronomical data sonification with whale songs recorded in the Pacific, creating a bridge between cosmic and oceanic realms.</p>
            
            <p>Join me on this journey as we explore the universal language of vibration and harmony. My upcoming live performance at the Cosmic Ocean Concert will feature these new works, accompanied by stunning visualizations of the astronomical phenomena that inspired them.</p>`,
            excerpt: "Exploring the intersection of cosmic sounds and oceanic rhythms in my latest musical project.",
            featuredImage: "https://images.unsplash.com/photo-1515462277126-2dd0c162007a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            published: true,
            approved: true,
            authorId: 1, // admin user
            createdAt: new Date("2025-03-10"),
            updatedAt: new Date("2025-03-10")
          },
          {
            title: "Ocean Conservation Efforts: Making Waves for Change",
            content: `<p>The oceans are the lifeblood of our planet, covering more than 70% of Earth's surface and providing a home to countless species. Yet, our marine ecosystems face unprecedented threats from pollution, overfishing, and climate change.</p>
            
            <p>As someone who has found inspiration in the ocean's depths, I feel a profound responsibility to protect these precious waters. That's why I'm excited to announce our partnership with the Global Ocean Trust, a nonprofit organization dedicated to marine conservation.</p>
            
            <p>Through this collaboration, a portion of all proceeds from my upcoming "Blue Planet" tour will go directly toward conservation efforts, including coral reef restoration and marine wildlife protection programs.</p>
            
            <p>We're also launching a series of educational workshops at each tour location, where attendees can learn about local marine ecosystems and how to contribute to their preservation. These interactive sessions will feature marine biologists and conservation experts who will share their knowledge and passion for ocean protection.</p>
            
            <p>Music has the power to move hearts and minds. By combining my artistic platform with concrete action, I hope to inspire a wave of change that extends far beyond the concert hall.</p>
            
            <p>Join us in this vital mission. Together, we can ensure that the ocean's symphony continues to play for generations to come.</p>`,
            excerpt: "Announcing new partnerships and initiatives to protect our ocean ecosystems.",
            featuredImage: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            published: true,
            approved: true,
            authorId: 2, // superadmin user
            createdAt: new Date("2025-02-15"),
            updatedAt: new Date("2025-02-15")
          },
          {
            title: "Behind the Music: The Making of 'Cosmic Depths'",
            content: `<p>Creating an album is always a journey of discovery, but "Cosmic Depths" took me further than I ever imagined—from the ocean floor to the outer reaches of the universe.</p>
            
            <p>The production process began almost a year ago, when I embarked on a deep-sea expedition with a team of marine biologists. Equipped with specialized hydrophones, we captured the haunting songs of humpback whales and the mysterious clicks and whistles of other marine creatures.</p>
            
            <p>These recordings formed the foundation of the album, but I wanted to take the concept further. Working with astrophysicists from the National Observatory, we translated data from radio telescopes into audible frequencies, creating "portraits" of distant galaxies, pulsars, and even the cosmic microwave background radiation—echoes of the Big Bang itself.</p>
            
            <p>In the studio, I combined these elements with traditional instruments and electronic production, creating a sound palette that moves seamlessly between oceanic and cosmic environments. Each track on the album represents a different stage in this journey from the deepest seas to the farthest stars.</p>
            
            <p>The mixing process presented unique challenges, as we worked to preserve the authentic character of our unusual sound sources while creating music that resonates on a human level. The result is something I'm incredibly proud of—a collection that invites listeners to experience the wonder of realms beyond our everyday perception.</p>
            
            <p>"Cosmic Depths" will be released next month, accompanied by an immersive visual experience that will be available both online and at select planetariums worldwide.</p>`,
            excerpt: "A behind-the-scenes look at the unique production process for my latest album.",
            featuredImage: "https://images.unsplash.com/photo-1520690214124-2405c5217036?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            published: true,
            approved: true,
            authorId: 1, // admin user
            createdAt: new Date("2025-01-20"),
            updatedAt: new Date("2025-01-20")
          }
        ]);

        // Get the inserted posts to link them with categories
        const insertedPosts = await db.select().from(posts);
        
        // Link posts to categories (post_categories junction table)
        if (insertedPosts.length > 0) {
          // First post categories: Music, Cosmic Exploration
          await db.execute(sql`
            INSERT INTO post_categories (post_id, category_id)
            VALUES 
              (${insertedPosts[0].id}, ${categoryMap['music']}),
              (${insertedPosts[0].id}, ${categoryMap['cosmic-exploration']})
          `);
          
          // Second post categories: Ocean Conservation, Events
          await db.execute(sql`
            INSERT INTO post_categories (post_id, category_id)
            VALUES 
              (${insertedPosts[1].id}, ${categoryMap['ocean-conservation']}),
              (${insertedPosts[1].id}, ${categoryMap['events']})
          `);
          
          // Third post categories: Music
          await db.execute(sql`
            INSERT INTO post_categories (post_id, category_id)
            VALUES 
              (${insertedPosts[2].id}, ${categoryMap['music']})
          `);
        }
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

  async getAdminAnalytics(fromDate?: string, toDate?: string): Promise<any> {
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

      userRolesResult.rows.forEach((row: any) => {
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

      userActivityData.rows.forEach((row: any) => {
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

  async getUserActivity(userId: number): Promise<any> {
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

  // Content management methods
  async getAllContentItems(): Promise<ContentItem[]> {
    try {
      return await db.select().from(contentItems).orderBy(sql`updated_at DESC`);
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

  async createContentItem(contentData: any): Promise<ContentItem> {
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

  async updateContentItem(contentData: any): Promise<ContentItem> {
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

      await db.delete(contentItems).where(eq(contentItems.id, id));
    } catch (error) {
      console.error(`Error deleting content item with ID ${id}:`, error);
      throw error;
    }
  }
}

// Export an instance of PostgresStorage
export const storage = new PostgresStorage();