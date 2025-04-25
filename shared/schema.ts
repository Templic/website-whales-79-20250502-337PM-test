import { pgTable, text, serial, boolean, timestamp, integer, numeric, pgEnum, varchar, json, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role", { enum: ["user", "admin", "super_admin"] }).notNull().default("user"),
  isBanned: boolean("is_banned").notNull().default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Existing subscribers table
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Newsletters table
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "sent"] }).notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
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
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertSubscriberSchema = createInsertSchema(subscribers)
  .pick({
    email: true,
    name: true
  })
  .extend({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters")
  });

export const insertNewsletterSchema = createInsertSchema(newsletters)
  .omit({ id: true, createdAt: true, updatedAt: true, sentAt: true })
  .extend({
    content: z.string().min(10, "Content must be at least 10 characters"),
    title: z.string().min(3, "Title must be at least 3 characters")
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
export type UpsertUser = typeof users.$inferInsert;

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletters.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertMusicUpload = z.infer<typeof insertMusicUploadSchema>;
export type MusicUpload = typeof musicUploads.$inferSelect;

// Media files table for comprehensive media management
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileType: text("file_type").notNull(), // image, video, audio, document, etc.
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  page: text("page").notNull(), // Target page (home, about, blog, etc.)
  section: text("section"), // Section within the page
  position: jsonb("position").$type<{
    x: number;
    y: number;
    size: number;
    zIndex: number;
  }>(),
  metadata: jsonb("metadata").$type<{
    title?: string;
    description?: string;
    alt?: string;
    width?: number;
    height?: number;
    duration?: number;
  }>(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow()
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles)
  .omit({ id: true, uploadedAt: true })
  .extend({
    position: z.object({
      x: z.number().min(0).max(100).default(50),
      y: z.number().min(0).max(100).default(50),
      size: z.number().min(10).max(200).default(100),
      zIndex: z.number().default(0)
    }).optional(),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      alt: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional()
    }).optional()
  });

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

export const insertContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Shop related tables

// Product categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  sku: text("sku").notNull().unique(),
  inventory: integer("inventory").notNull().default(0),
  weight: numeric("weight", { precision: 6, scale: 2 }),
  dimensions: json("dimensions").$type<{
    length: number;
    width: number;
    height: number;
    unit: string;
  }>(),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(false),
  categoryId: integer("category_id").notNull().references(() => productCategories.id),
  images: text("images").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "pending", 
  "processing", 
  "completed", 
  "canceled", 
  "refunded"
]);

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }),
  shipping: numeric("shipping", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  customerNote: text("customer_note"),
  billingAddress: json("billing_address").$type<{
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
  }>(),
  shippingAddress: json("shipping_address").$type<{
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
  }>(),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  productPrice: numeric("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Cart table
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull().default("percentage"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumAmount: numeric("minimum_amount", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Insert schemas for shop tables
export const insertProductCategorySchema = createInsertSchema(productCategories)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true, createdAt: true });

export const insertCartSchema = createInsertSchema(carts)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertCartItemSchema = createInsertSchema(cartItems)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertCouponSchema = createInsertSchema(coupons)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Types for shop tables
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Tour dates table
export const tourDates = pgTable("tour_dates", {
  id: serial("id").primaryKey(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  date: timestamp("date").notNull(),
  ticket_link: text("ticket_link"),
  status: text("status").default("upcoming")
});

export const insertTourDateSchema = createInsertSchema(tourDates)
  .omit({ id: true });

export type TourDate = typeof tourDates.$inferSelect;
export type InsertTourDate = z.infer<typeof insertTourDateSchema>;

// Patrons table
export const patrons = pgTable("patrons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  tier: text("tier").notNull(),
  subscription_date: timestamp("subscription_date").defaultNow(),
  active: integer("active").default(1)
});

export const insertPatronSchema = createInsertSchema(patrons)
  .omit({ id: true, subscription_date: true });

export type Patron = typeof patrons.$inferSelect;
export type InsertPatron = z.infer<typeof insertPatronSchema>;

// Collaboration proposals table
export const collaborationProposals = pgTable("collaboration_proposals", {
  id: serial("id").primaryKey(),
  artist_name: text("artist_name").notNull(),
  email: text("email").notNull(),
  proposal_type: text("proposal_type").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending"),
  created_at: timestamp("created_at").defaultNow()
});

export const insertCollaborationProposalSchema = createInsertSchema(collaborationProposals)
  .omit({ id: true, created_at: true });

export type CollaborationProposal = typeof collaborationProposals.$inferSelect;
export type InsertCollaborationProposal = z.infer<typeof insertCollaborationProposalSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

// Content management table
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["text", "image", "html"] }).notNull(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  page: text("page").notNull(),
  section: text("section").notNull(),
  imageUrl: text("image_url"),
  // Workflow fields
  status: text("status", { enum: ["draft", "review", "changes_requested", "approved", "published", "archived"] }).notNull().default("draft"),
  reviewerId: integer("reviewer_id").references(() => users.id),
  reviewStatus: text("review_status", { enum: ["pending", "in_progress", "completed"] }),
  reviewStartedAt: timestamp("review_started_at"),
  reviewCompletedAt: timestamp("review_completed_at"),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  expirationDate: timestamp("expiration_date"),
  reviewNotes: text("review_notes"),
  // Original fields
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  version: integer("version").notNull().default(1),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id)
});

// Content analytics tracking
export const contentAnalytics = pgTable("content_analytics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metricsType: text("metrics_type").notNull(), // scheduling_performance, content_engagement, workflow_metrics
  metricsData: jsonb("metrics_data").notNull().$type<{
    totalScheduled?: number;
    totalPublished?: number;
    publishedRatio?: number;
    contentId?: number;
    engagementType?: string;
    workflowMetric?: string;
    value?: number;
    timestamp?: Date;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Content version history table
// Content version history table (replaces contentHistory with more explicit name)
export const contentVersions = pgTable("content_versions", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => contentItems.id),
  version: integer("version").notNull(),
  type: text("type", { enum: ["text", "image", "html"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  page: text("page").notNull(),
  section: text("section").notNull(),
  imageUrl: text("image_url"),
  modifiedAt: timestamp("modified_at").notNull().defaultNow(),
  modifiedBy: integer("modified_by").references(() => users.id),
  changeDescription: text("change_description")
});

// Alias for backward compatibility
export const contentHistory = contentVersions;

// Content workflow audit trail table
export const contentWorkflowHistory = pgTable("content_workflow_history", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => contentItems.id),
  fromStatus: text("from_status", { 
    enum: ["draft", "review", "changes_requested", "approved", "published", "archived"] 
  }),
  toStatus: text("to_status", { 
    enum: ["draft", "review", "changes_requested", "approved", "published", "archived"] 
  }).notNull(),
  actorId: integer("actor_id").references(() => users.id),
  actionAt: timestamp("action_at").notNull().defaultNow(),
  comments: text("comments"),
  version: integer("version").notNull()
});

// Content usage tracking table
export const contentUsage = pgTable("content_usage", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => contentItems.id),
  location: text("location").notNull(), // Path or component where content is used
  path: text("path").notNull(), // URL path where content is displayed
  views: integer("views").notNull().default(0),
  lastViewed: timestamp("last_viewed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Workflow notifications table
export const workflowNotifications = pgTable("workflow_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["approval", "changes", "publish", "info"] }).notNull(),
  contentId: integer("content_id").references(() => contentItems.id),
  contentTitle: text("content_title"),
  userId: integer("user_id").references(() => users.id),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertContentItemSchema = createInsertSchema(contentItems)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    version: true,
    createdBy: true,
    lastModifiedBy: true,
    reviewerId: true,
    reviewStartedAt: true,
    reviewCompletedAt: true 
  });
  
export const insertContentHistorySchema = createInsertSchema(contentHistory)
  .omit({ id: true, modifiedAt: true });
  
export const insertContentUsageSchema = createInsertSchema(contentUsage)
  .omit({ id: true, createdAt: true, updatedAt: true, views: true, lastViewed: true });

export const insertWorkflowNotificationSchema = createInsertSchema(workflowNotifications)
  .omit({ id: true, createdAt: true, isRead: true });

export const insertContentAnalyticsSchema = createInsertSchema(contentAnalytics)
  .omit({ id: true, createdAt: true });

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;

export type ContentVersions = typeof contentVersions.$inferSelect;
export type ContentHistory = typeof contentHistory.$inferSelect;
export type InsertContentHistory = z.infer<typeof insertContentHistorySchema>;

export type ContentWorkflowHistory = typeof contentWorkflowHistory.$inferSelect;
export const insertContentWorkflowHistorySchema = createInsertSchema(contentWorkflowHistory)
  .omit({ id: true, actionAt: true });
export type InsertContentWorkflowHistory = z.infer<typeof insertContentWorkflowHistorySchema>;

export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = z.infer<typeof insertContentAnalyticsSchema>;

export type ContentUsage = typeof contentUsage.$inferSelect;
export type InsertContentUsage = z.infer<typeof insertContentUsageSchema>;

export type WorkflowNotification = typeof workflowNotifications.$inferSelect;
export type InsertWorkflowNotification = z.infer<typeof insertWorkflowNotificationSchema>;

// TypeScript Error Management System Tables

// Error severity enum
export const errorSeverityEnum = pgEnum("error_severity", [
  "critical", 
  "high", 
  "medium", 
  "low", 
  "info"
]);

// Error status enum
export const errorStatusEnum = pgEnum("error_status", [
  "detected", 
  "analyzing", 
  "fixed", 
  "ignored", 
  "in_progress",
  "needs_review"
]);

// Error category enum
export const errorCategoryEnum = pgEnum("error_category", [
  "type_mismatch", 
  "missing_type", 
  "undefined_variable", 
  "null_reference", 
  "interface_mismatch",
  "import_error",
  "syntax_error",
  "generic_constraint",
  "declaration_error",
  "other"
]);

// TypeScript errors table
export const typescriptErrors = pgTable("typescript_errors", {
  id: serial("id").primaryKey(),
  errorCode: text("error_code").notNull(),
  filePath: text("file_path").notNull(),
  lineNumber: integer("line_number").notNull(),
  columnNumber: integer("column_number").notNull(),
  errorMessage: text("error_message").notNull(),
  errorContext: text("error_context").notNull(),
  category: errorCategoryEnum("category").notNull(),
  severity: errorSeverityEnum("severity").notNull(),
  status: errorStatusEnum("status").notNull().default("detected"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  fixId: integer("fix_id"),
  patternId: integer("pattern_id"),
  userId: integer("user_id"),
  metadata: jsonb("metadata").$type<{
    tscVersion?: string;
    nodeVersion?: string;
    compiler_options?: Record<string, any>;
    stack_trace?: string;
    related_errors?: number[];
  }>(),
  firstDetectedAt: timestamp("first_detected_at").notNull().defaultNow(),
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  lastOccurrenceAt: timestamp("last_occurrence_at").notNull().defaultNow(),
});

// Error patterns table - for categorizing similar errors
export const errorPatterns = pgTable("error_patterns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  regex: text("regex"),
  category: errorCategoryEnum("category").notNull(),
  severity: errorSeverityEnum("severity").notNull(),
  detectionRules: jsonb("detection_rules").$type<{
    code_patterns?: string[];
    message_patterns?: string[];
    context_clues?: string[];
  }>(),
  autoFixable: boolean("auto_fixable").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
});

// Error fixes table
export const errorFixes = pgTable("error_fixes", {
  id: serial("id").primaryKey(),
  patternId: integer("pattern_id").references(() => errorPatterns.id),
  fixTitle: text("fix_title").notNull(),
  fixDescription: text("fix_description").notNull(),
  fixCode: text("fix_code").notNull(),
  fixType: text("fix_type", { enum: ["automatic", "semi-automatic", "manual"] }).notNull(),
  fixPriority: integer("fix_priority").notNull().default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
});

// Error fix history table
export const errorFixHistory = pgTable("error_fix_history", {
  id: serial("id").primaryKey(),
  errorId: integer("error_id").notNull().references(() => typescriptErrors.id),
  fixId: integer("fix_id").references(() => errorFixes.id),
  originalCode: text("original_code").notNull(),
  fixedCode: text("fixed_code").notNull(),
  fixedAt: timestamp("fixed_at").notNull().defaultNow(),
  fixedBy: integer("fixed_by").references(() => users.id),
  fixDuration: integer("fix_duration"), // in milliseconds
  fixMethod: text("fix_method", { enum: ["automatic", "assisted", "manual"] }).notNull(),
  fixResult: text("fix_result", { enum: ["success", "partial", "failure"] }).notNull(),
  notes: text("notes"),
});

// Project analysis records
export const projectAnalyses = pgTable("project_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorCount: integer("error_count"),
  warningCount: integer("warning_count"),
  fixedCount: integer("fixed_count"),
  analysisData: jsonb("analysis_data"),
  status: text("status", { enum: ["in_progress", "completed", "failed"] }).notNull().default("in_progress"),
  duration: integer("duration"), // in milliseconds
  executedBy: integer("executed_by").references(() => users.id),
});

// Project files
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
  errorCount: integer("error_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  lastModifiedAt: timestamp("last_modified_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas for TypeScript error management tables
export const insertTypescriptErrorSchema = createInsertSchema(typescriptErrors)
  .omit({ id: true, detectedAt: true, firstDetectedAt: true, lastOccurrenceAt: true });

export const insertErrorPatternSchema = createInsertSchema(errorPatterns)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertErrorFixSchema = createInsertSchema(errorFixes)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertErrorFixHistorySchema = createInsertSchema(errorFixHistory)
  .omit({ id: true, fixedAt: true });

export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses)
  .omit({ id: true, startedAt: true, completedAt: true });

export const insertProjectFileSchema = createInsertSchema(projectFiles)
  .omit({ id: true, lastCheckedAt: true, createdAt: true });

// Types for TypeScript error management tables
export type TypescriptError = typeof typescriptErrors.$inferSelect;
export type InsertTypescriptError = z.infer<typeof insertTypescriptErrorSchema>;

export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type InsertErrorPattern = z.infer<typeof insertErrorPatternSchema>;

export type ErrorFix = typeof errorFixes.$inferSelect;
export type InsertErrorFix = z.infer<typeof insertErrorFixSchema>;

export type ErrorFixHistory = typeof errorFixHistory.$inferSelect;
export type InsertErrorFixHistory = z.infer<typeof insertErrorFixHistorySchema>;

export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;
export type InsertProjectAnalysis = z.infer<typeof insertProjectAnalysisSchema>;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;

// Content relations
export const contentItemRelations = relations(contentItems, ({ one, many }) => ({
  history: many(contentHistory),
  versions: many(contentVersions),
  workflowHistory: many(contentWorkflowHistory),
  usages: many(contentUsage),
  creator: one(users, {
    fields: [contentItems.createdBy],
    references: [users.id],
  }),
  lastModifier: one(users, {
    fields: [contentItems.lastModifiedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [contentItems.reviewerId],
    references: [users.id],
  })
}));

export const contentHistoryRelations = relations(contentHistory, ({ one }) => ({
  content: one(contentItems, {
    fields: [contentHistory.contentId],
    references: [contentItems.id],
  }),
  modifier: one(users, {
    fields: [contentHistory.modifiedBy],
    references: [users.id],
  })
}));

export const contentUsageRelations = relations(contentUsage, ({ one }) => ({
  content: one(contentItems, {
    fields: [contentUsage.contentId],
    references: [contentItems.id],
  })
}));

export const workflowNotificationRelations = relations(workflowNotifications, ({ one }) => ({
  content: one(contentItems, {
    fields: [workflowNotifications.contentId],
    references: [contentItems.id],
  }),
  user: one(users, {
    fields: [workflowNotifications.userId],
    references: [users.id],
  })
}));

// Define the schema relations
export const productRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems)
}));

export const productCategoryRelations = relations(productCategories, ({ one, many }) => ({
  products: many(products),
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.id],
  }),
  children: many(productCategories, {
    relationName: "parent"
  })
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems)
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  })
}));

export const cartRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems)
}));

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  })
}));

// TypeScript error management relations
export const typescriptErrorRelations = relations(typescriptErrors, ({ one, many }) => ({
  pattern: one(errorPatterns, {
    fields: [typescriptErrors.patternId],
    references: [errorPatterns.id],
  }),
  fixHistory: many(errorFixHistory),
  user: one(users, {
    fields: [typescriptErrors.userId],
    references: [users.id],
  })
}));

export const errorPatternRelations = relations(errorPatterns, ({ one, many }) => ({
  errors: many(typescriptErrors),
  fixes: many(errorFixes),
  creator: one(users, {
    fields: [errorPatterns.createdBy],
    references: [users.id],
  })
}));

export const errorFixRelations = relations(errorFixes, ({ one, many }) => ({
  pattern: one(errorPatterns, {
    fields: [errorFixes.patternId],
    references: [errorPatterns.id],
  }),
  fixHistory: many(errorFixHistory),
  creator: one(users, {
    fields: [errorFixes.createdBy],
    references: [users.id],
  })
}));

export const errorFixHistoryRelations = relations(errorFixHistory, ({ one }) => ({
  error: one(typescriptErrors, {
    fields: [errorFixHistory.errorId],
    references: [typescriptErrors.id],
  }),
  fix: one(errorFixes, {
    fields: [errorFixHistory.fixId],
    references: [errorFixes.id],
  }),
  user: one(users, {
    fields: [errorFixHistory.fixedBy],
    references: [users.id],
  })
}));

export const projectAnalysisRelations = relations(projectAnalyses, ({ one }) => ({
  executor: one(users, {
    fields: [projectAnalyses.executedBy],
    references: [users.id],
  })
}));