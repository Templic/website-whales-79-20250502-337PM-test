import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["user", "admin", "super_admin"] }).notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Existing subscribers table
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Blog posts table with author relation
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  published: boolean("published").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  authorId: integer("author_id").notNull().references(() => users.id)
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description")
});

// Post categories junction table
export const postCategories = pgTable("post_categories", {
  postId: integer("post_id").notNull(),
  categoryId: integer("category_id").notNull()
});

// Comments table with author relation
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

export const insertSubscriberSchema = createInsertSchema(subscribers)
  .pick({
    email: true,
    name: true
  })
  .extend({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters")
  });

export const insertPostSchema = createInsertSchema(posts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    categories: z.array(z.number()).optional()
  });

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

export const insertCommentSchema = createInsertSchema(comments)
  .omit({ id: true, createdAt: true })
  .extend({
    approved: z.boolean().default(false)
  });

// Music tracks table
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumId: integer("album_id"),
  duration: text("duration"),
  audioUrl: text("audio_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Music albums table
export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  releaseDate: timestamp("release_date"),
  coverImage: text("cover_image"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Insert schemas for new tables
export const insertTrackSchema = createInsertSchema(tracks)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAlbumSchema = createInsertSchema(albums)
  .omit({ id: true, createdAt: true, updatedAt: true });

//Added Music Uploads Table
export const musicUploads = pgTable("music_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filetype: text("filetype").notNull(),
  targetPage: text("target_page").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow()
});

// Insert schema for music uploads
export const insertMusicUploadSchema = createInsertSchema(musicUploads).omit({id: true, uploadedAt: true});


// Types for new tables
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albums.$inferSelect;

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertMusicUpload = z.infer<typeof insertMusicUploadSchema>;
export type MusicUpload = typeof musicUploads.$inferSelect;