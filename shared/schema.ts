/**
 * Shared database schema and types
 * 
 * Contains schema definitions for:
 * 1. Core application tables (users, products, orders, etc.)
 * 2. TypeScript error management system tables
 */
import { relations } from 'drizzle-orm';
import {
  serial,
  text,
  varchar,
  timestamp,
  pgTable,
  integer,
  boolean,
  json,
  pgEnum,
  numeric,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// ===================================================================
// Core Application Schema
// ===================================================================

// Blog posts and comments tables
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  category: text("category"),
  slug: text("slug").notNull().unique(),
  coverImage: text("cover_image"),
  published: boolean("published").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Users table with role-based authentication
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  role: text("role", { enum: ["user", "admin", "super_admin"] }).notNull().default("user"),
  isBanned: boolean("is_banned").notNull().default(false),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  lastLogin: timestamp("last_login"),
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

// Product categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
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
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Cart table
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id),
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
  discountType: text("discount_type", { enum: ["percentage", "fixed_amount"] }).notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }),
  maxUsage: integer("max_usage"),
  usedCount: integer("used_count").notNull().default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// ===================================================================
// TypeScript Error Management Schema
// ===================================================================

// Enums
export enum ErrorCategory {
  TYPE_MISMATCH = 'type_mismatch',
  MISSING_TYPE = 'missing_type',
  IMPORT_ERROR = 'import_error',
  NULL_REFERENCE = 'null_reference',
  INTERFACE_MISMATCH = 'interface_mismatch',
  GENERIC_CONSTRAINT = 'generic_constraint',
  DECLARATION_ERROR = 'declaration_error',
  SYNTAX_ERROR = 'syntax_error',
  OTHER = 'other',
}

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ErrorStatus {
  PENDING = 'pending',
  FIXED = 'fixed',
  IGNORED = 'ignored',
}

export enum FixMethod {
  AUTOMATIC = 'automatic',
  AI = 'ai',
  PATTERN = 'pattern',
  MANUAL = 'manual',
}

// Create Postgres enums
export const errorCategoryEnum = pgEnum('error_category', [
  'type_mismatch', 'missing_type', 'import_error', 'null_reference',
  'interface_mismatch', 'generic_constraint', 'declaration_error', 'syntax_error', 'other'
]);
export const errorSeverityEnum = pgEnum('error_severity', ['critical', 'high', 'medium', 'low']);
export const errorStatusEnum = pgEnum('error_status', ['pending', 'fixed', 'ignored']);
export const fixMethodEnum = pgEnum('fix_method', ['automatic', 'ai', 'pattern', 'manual']);

// Tables
export const typeScriptErrors = pgTable('typescript_errors', {
  id: serial('id').primaryKey(),
  error_code: text('error_code').notNull(),
  file_path: text('file_path').notNull(),
  line_number: integer('line_number').notNull(),
  column_number: integer('column_number').notNull(),
  error_message: text('error_message').notNull(),
  error_context: text('error_context').notNull(),
  category: errorCategoryEnum('category').notNull(),
  severity: errorSeverityEnum('severity').notNull(),
  status: errorStatusEnum('status').notNull().default(ErrorStatus.PENDING),
  detected_at: timestamp('detected_at').defaultNow().notNull(),
  resolved_at: timestamp('resolved_at'),
  fix_id: integer('fix_id'),
  pattern_id: integer('pattern_id'),
  user_id: integer('user_id'),
  metadata: json('metadata'),
  first_detected_at: timestamp('first_detected_at').defaultNow().notNull(),
  occurrence_count: integer('occurrence_count').notNull().default(1),
  last_occurrence_at: timestamp('last_occurrence_at').defaultNow().notNull(),
});

export const errorPatterns = pgTable('error_patterns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  regex: text('regex'),
  category: errorCategoryEnum('category').notNull(),
  severity: errorSeverityEnum('severity').notNull(),
  detection_rules: json('detection_rules'),
  auto_fixable: boolean('auto_fixable').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
  created_by: integer('created_by'),
});

export const errorFixes = pgTable('error_fixes', {
  id: serial('id').primaryKey(),
  pattern_id: integer('pattern_id'),
  fix_title: text('fix_title').notNull(),
  fix_description: text('fix_description').notNull(),
  fix_code: text('fix_code').notNull(),
  fix_type: text('fix_type').notNull(),
  fix_priority: integer('fix_priority').notNull().default(1),
  success_rate: numeric('success_rate'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
  created_by: integer('created_by')
});

export const errorAnalysis = pgTable('error_analysis', {
  id: serial('id').primaryKey(),
  error_id: integer('error_id').notNull().references(() => typeScriptErrors.id),
  analysis_type: text('analysis_type').notNull(),
  analysis_data: json('analysis_data').notNull(),
  confidence_score: integer('confidence_score').notNull().default(0),
  suggested_fix: text('suggested_fix'),
  is_ai_generated: boolean('is_ai_generated').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: integer('created_by')
});

export const scanResults = pgTable('scan_results', {
  id: serial('id').primaryKey(),
  scan_date: timestamp('scan_date').defaultNow().notNull(),
  scan_type: text('scan_type').notNull(),
  total_errors: integer('total_errors').notNull(),
  critical_errors: integer('critical_errors').notNull(),
  high_errors: integer('high_errors').notNull(),
  medium_errors: integer('medium_errors').notNull(),
  low_errors: integer('low_errors').notNull(),
  scan_duration_ms: integer('scan_duration_ms').notNull(),
  is_deep_scan: boolean('is_deep_scan').notNull().default(false),
  is_ai_enhanced: boolean('is_ai_enhanced').notNull().default(false),
  scan_metadata: json('scan_metadata'),
  created_by: integer('created_by')
});

// ===================================================================
// Relations
// ===================================================================

// Core application relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  posts: many(posts),
  comments: many(comments)
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id]
  }),
  comments: many(comments)
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id]
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id]
  })
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id]
  }),
  orderItems: many(orderItems)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id]
  }),
  items: many(cartItems)
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  })
}));

// TypeScript error management relations
export const typeScriptErrorsRelations = relations(typeScriptErrors, ({ many }) => ({
  analyses: many(errorAnalysis),
}));

export const errorFixesRelations = relations(errorFixes, ({ one }) => ({
  pattern: one(errorPatterns, {
    fields: [errorFixes.pattern_id],
    references: [errorPatterns.id],
  }),
}));

export const errorPatternsRelations = relations(errorPatterns, ({ many }) => ({
  fixes: many(errorFixes)
}));

export const errorAnalysisRelations = relations(errorAnalysis, ({ one }) => ({
  error: one(typeScriptErrors, {
    fields: [errorAnalysis.error_id],
    references: [typeScriptErrors.id],
  }),
}));

// Error Fix History table
export const errorFixHistory = pgTable('error_fix_history', {
  id: serial('id').primaryKey(),
  error_id: integer('error_id').notNull().references(() => typeScriptErrors.id),
  fix_id: integer('fix_id').references(() => errorFixes.id),
  fixed_by: integer('fixed_by'),
  fixed_at: timestamp('fixed_at').defaultNow().notNull(),
  fix_method: fixMethodEnum('fix_method').notNull(),
  fix_details: text('fix_details'),
  is_successful: boolean('is_successful').notNull().default(true),
  applied_code: text('applied_code'),
  fix_duration_ms: integer('fix_duration_ms'),
  metadata: json('metadata')
});

// Project Analysis table
export const projectAnalyses = pgTable('project_analyses', {
  id: serial('id').primaryKey(),
  analysis_date: timestamp('analysis_date').defaultNow().notNull(),
  analysis_type: text('analysis_type').notNull(),
  total_files: integer('total_files').notNull(),
  total_lines: integer('total_lines').notNull(),
  error_count: integer('error_count').notNull(),
  critical_count: integer('critical_count').notNull(),
  high_count: integer('high_count').notNull(),
  medium_count: integer('medium_count').notNull(),
  low_count: integer('low_count').notNull(),
  analysis_duration_ms: integer('analysis_duration_ms').notNull(),
  is_deep_analysis: boolean('is_deep_analysis').notNull().default(false),
  metadata: json('metadata'),
  created_by: integer('created_by')
});

// Project File table
export const projectFiles = pgTable('project_files', {
  id: serial('id').primaryKey(),
  file_path: text('file_path').notNull().unique(),
  file_type: text('file_type').notNull(),
  line_count: integer('line_count').notNull(),
  char_count: integer('char_count').notNull(),
  last_analyzed: timestamp('last_analyzed').defaultNow().notNull(),
  last_modified: timestamp('last_modified'),
  error_count: integer('error_count').notNull().default(0),
  is_generated: boolean('is_generated').notNull().default(false),
  is_test_file: boolean('is_test_file').notNull().default(false),
  dependency_count: integer('dependency_count'),
  complexity_score: integer('complexity_score'),
  metadata: json('metadata')
});

// Content management tables
export const contentItems = pgTable('content_items', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  type: text('type').notNull(), // e.g., 'text', 'image', 'html', 'json'
  title: text('title').notNull(),
  content: text('content').notNull(),
  page: text('page').notNull(),
  section: text('section').notNull(),
  imageUrl: text('image_url'),
  status: text('status').notNull().default('draft'), // draft, review, approved, published, archived
  version: integer('version').notNull().default(1),
  reviewerId: integer('reviewer_id'),
  reviewStatus: text('review_status'),
  reviewStartedAt: timestamp('review_started_at'),
  reviewCompletedAt: timestamp('review_completed_at'),
  reviewNotes: text('review_notes'),
  scheduledPublishAt: timestamp('scheduled_publish_at'),
  expirationDate: timestamp('expiration_date'),
  lastModifiedBy: integer('last_modified_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata')
});

export const contentHistory = pgTable('content_history', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id),
  version: integer('version').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  page: text('page'),
  section: text('section'),
  imageUrl: text('image_url'),
  modifiedAt: timestamp('modified_at').defaultNow().notNull(),
  modifiedBy: integer('modified_by'),
  changeDescription: text('change_description')
});

export const contentUsage = pgTable('content_usage', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id),
  location: text('location').notNull(), // e.g., 'homepage', 'blog', 'product'
  path: text('path').notNull(), // URL path
  views: integer('views').notNull().default(0),
  lastViewed: timestamp('last_viewed').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const contentWorkflowHistory = pgTable('content_workflow_history', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id),
  fromStatus: text('from_status').notNull(),
  toStatus: text('to_status').notNull(),
  actorId: integer('actor_id').notNull(),
  actionAt: timestamp('action_at').defaultNow().notNull(),
  comments: text('comments')
});

// Simple track and album tables for the music section
export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  duration: text('duration').notNull(),
  audioUrl: text('audio_url').notNull(),
  published: boolean('published').default(false).notNull(),
  albumId: integer('album_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const albums = pgTable('albums', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  coverImage: text('cover_image'),
  releaseDate: timestamp('release_date'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ===================================================================
// Insert Schemas
// ===================================================================

// Core application insert schemas
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript error management insert schemas
export const insertTypeScriptErrorSchema = createInsertSchema(typeScriptErrors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorPatternSchema = createInsertSchema(errorPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorFixSchema = createInsertSchema(errorFixes).omit({
  id: true,
  createdAt: true,
});

export const insertErrorAnalysisSchema = createInsertSchema(errorAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertScanResultSchema = createInsertSchema(scanResults).omit({
  id: true,
  createdAt: true,
});

// Additional insert schemas for the new tables
export const insertErrorFixHistorySchema = createInsertSchema(errorFixHistory).omit({
  id: true,
  fixed_at: true,
});

export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses).omit({
  id: true,
  analysis_date: true,
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  last_analyzed: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentHistorySchema = createInsertSchema(contentHistory).omit({
  id: true,
  modifiedAt: true,
});

export const insertContentUsageSchema = createInsertSchema(contentUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentWorkflowHistorySchema = createInsertSchema(contentWorkflowHistory).omit({
  id: true,
  actionAt: true,
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ===================================================================
// Types
// ===================================================================

// Core application types
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;

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

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

// TypeScript error management types
export type TypeScriptError = typeof typeScriptErrors.$inferSelect;
export type InsertTypeScriptError = z.infer<typeof insertTypeScriptErrorSchema>;

export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type InsertErrorPattern = z.infer<typeof insertErrorPatternSchema>;

export type ErrorFix = typeof errorFixes.$inferSelect;
export type InsertErrorFix = z.infer<typeof insertErrorFixSchema>;

export type ErrorAnalysis = typeof errorAnalysis.$inferSelect;
export type InsertErrorAnalysis = z.infer<typeof insertErrorAnalysisSchema>;

export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = z.infer<typeof insertScanResultSchema>;

// Types for the new tables
export type ErrorFixHistory = typeof errorFixHistory.$inferSelect;
export type InsertErrorFixHistory = z.infer<typeof insertErrorFixHistorySchema>;

export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;
export type InsertProjectAnalysis = z.infer<typeof insertProjectAnalysisSchema>;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;

export type ContentHistory = typeof contentHistory.$inferSelect;
export type InsertContentHistory = z.infer<typeof insertContentHistorySchema>;

export type ContentUsage = typeof contentUsage.$inferSelect;
export type InsertContentUsage = z.infer<typeof insertContentUsageSchema>;

export type ContentWorkflowHistory = typeof contentWorkflowHistory.$inferSelect;
export type InsertContentWorkflowHistory = z.infer<typeof insertContentWorkflowHistorySchema>;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;