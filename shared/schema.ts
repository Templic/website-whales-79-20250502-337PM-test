import { pgTable, text, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing subscribers table
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true)
});

// Enhanced Blog posts table with image metadata
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  thumbnailImage: text("thumbnail_image"), // New: Optimized thumbnail version
  imageMetadata: jsonb("image_metadata"), // New: Store image dimensions, alt text, etc.
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  authorId: integer("author_id").notNull().default(1)
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

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Enhanced Insert schemas
export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  email: true
});

export const insertPostSchema = createInsertSchema(posts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    categories: z.array(z.number()).optional(),
    authorId: z.number().default(1),
    imageMetadata: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      altText: z.string().optional(),
      caption: z.string().optional()
    }).optional()
  });

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

export const insertCommentSchema = createInsertSchema(comments)
  .omit({ id: true, createdAt: true, approved: true });

// Types
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;