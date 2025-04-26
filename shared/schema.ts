/**
 * Database schema for the TypeScript Error Management System with E-commerce functionality
 */

import { pgTable, serial, text, timestamp, integer, jsonb, boolean, pgEnum, varchar, decimal, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============== User-related Enums ==============
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'admin',
  'super_admin'
]);

// ============== Error Management Enums ==============
export const errorSeverityEnum = pgEnum('error_severity', [
  'critical',
  'high',
  'medium',
  'low'
]);

export const errorStatusEnum = pgEnum('error_status', [
  'detected',
  'in_progress',
  'fixed',
  'ignored',
  'false_positive'
]);

export const errorCategoryEnum = pgEnum('error_category', [
  'type_mismatch',
  'missing_type',
  'import_error',
  'null_reference',
  'interface_mismatch',
  'generic_constraint',
  'declaration_error',
  'syntax_error',
  'other'
]);

export const fixResultEnum = pgEnum('fix_result', [
  'success',
  'partial',
  'failure'
]);

export const fixMethodEnum = pgEnum('fix_method', [
  'manual',
  'automated',
  'ai_assisted',
  'pattern_based'
]);

export const analysisStatusEnum = pgEnum('analysis_status', [
  'in_progress',
  'completed',
  'failed'
]);

// ============== User Tables ==============
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  bio: text('bio'),
  profileImageUrl: varchar('profile_image_url', { length: 255 }),
  role: userRoleEnum('role').notNull().default('user'),
  isBanned: boolean('is_banned').notNull().default(false),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// ============== Error Management Tables ==============
export const typescriptErrors = pgTable('typescript_errors', {
  id: serial('id').primaryKey(),
  errorCode: text('error_code').notNull(),
  errorMessage: text('error_message').notNull(),
  filePath: text('file_path').notNull(),
  lineNumber: integer('line_number').notNull(),
  columnNumber: integer('column_number').notNull(),
  errorContext: text('error_context'),
  category: errorCategoryEnum('category').notNull().default('other'),
  severity: errorSeverityEnum('severity').notNull().default('medium'),
  status: errorStatusEnum('status').notNull().default('detected'),
  patternId: integer('pattern_id'),
  occurrenceCount: integer('occurrence_count').notNull().default(1),
  lastFixId: integer('last_fix_id'),
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  firstDetectedAt: timestamp('first_detected_at').notNull().defaultNow(),
  lastOccurrenceAt: timestamp('last_occurrence_at').notNull().defaultNow(),
  fixedAt: timestamp('fixed_at'),
  metadata: jsonb('metadata')
});

export const errorPatterns = pgTable('error_patterns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  regex: text('regex'),
  category: errorCategoryEnum('category').notNull().default('other'),
  severity: errorSeverityEnum('severity').notNull().default('medium'),
  detectionRules: jsonb('detection_rules'),
  autoFixable: boolean('auto_fixable').notNull().default(false),
  fixCount: integer('fix_count').notNull().default(0),
  successRate: integer('success_rate').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const errorFixes = pgTable('error_fixes', {
  id: serial('id').primaryKey(),
  patternId: integer('pattern_id'),
  errorId: integer('error_id'),
  fixTitle: text('fix_title').notNull(),
  fixDescription: text('fix_description').notNull(),
  fixType: text('fix_type').notNull().default('code_change'),
  fixTemplate: text('fix_template'),
  fixCode: text('fix_code'),
  beforeCode: text('before_code'),
  afterCode: text('after_code'),
  appliedCount: integer('applied_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by'),
  metadata: jsonb('metadata')
});

export const errorFixHistory = pgTable('error_fix_history', {
  id: serial('id').primaryKey(),
  errorId: integer('error_id').notNull(),
  fixId: integer('fix_id'),
  fixedBy: text('fixed_by'),
  fixMethod: fixMethodEnum('fix_method').notNull().default('manual'),
  fixResult: fixResultEnum('fix_result').notNull().default('success'),
  beforeCode: text('before_code'),
  afterCode: text('after_code'),
  fixNotes: text('fix_notes'),
  fixedAt: timestamp('fixed_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const projectAnalyses = pgTable('project_analyses', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id'),
  projectName: text('project_name'),
  status: analysisStatusEnum('status').notNull().default('in_progress'),
  totalErrors: integer('total_errors').notNull().default(0),
  criticalErrors: integer('critical_errors').notNull().default(0),
  highErrors: integer('high_errors').notNull().default(0),
  mediumErrors: integer('medium_errors').notNull().default(0),
  lowErrors: integer('low_errors').notNull().default(0),
  errorsByCategory: jsonb('errors_by_category'),
  errorsByFile: jsonb('errors_by_file'),
  rootCauseErrors: integer('root_cause_errors').notNull().default(0),
  cascadingErrors: integer('cascading_errors').notNull().default(0),
  patternsDetected: integer('patterns_detected').notNull().default(0),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  executedBy: text('executed_by'),
  analysisOptions: jsonb('analysis_options'),
  analysisResults: jsonb('analysis_results'),
  metadata: jsonb('metadata')
});

export const projectFiles = pgTable('project_files', {
  id: serial('id').primaryKey(),
  filePath: text('file_path').notNull().unique(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // ts, tsx, js, jsx, etc.
  loc: integer('loc').default(0), // lines of code
  errorCount: integer('error_count').default(0),
  lastScannedAt: timestamp('last_scanned_at'),
  lastModifiedAt: timestamp('last_modified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  gitBlame: jsonb('git_blame'), // information about who authored each line
  dependencies: jsonb('dependencies'), // list of files this file depends on
  dependents: jsonb('dependents'), // list of files that depend on this file
  metadata: jsonb('metadata')
});

// ============== E-commerce Enums ==============
export const productTypeEnum = pgEnum('product_type', [
  'physical',
  'digital',
  'subscription',
  'service'
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'completed',
  'shipped',
  'cancelled',
  'refunded'
]);

// ============== Content Management Tables ==============
export const contentItems = pgTable('content_items', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  page: varchar('page', { length: 100 }),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const contentHistory = pgTable('content_history', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  changeDescription: text('change_description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const contentUsage = pgTable('content_usage', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id),
  location: varchar('location', { length: 255 }).notNull(),
  path: varchar('path', { length: 255 }).notNull(),
  count: integer('count').notNull().default(1),
  firstUsedAt: timestamp('first_used_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const contentWorkflowHistory = pgTable('content_workflow_history', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id),
  fromStatus: varchar('from_status', { length: 50 }).notNull(),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  performedBy: integer('performed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  performedAt: timestamp('performed_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const workflowNotifications = pgTable('workflow_notifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  contentId: integer('content_id').references(() => contentItems.id),
  contentTitle: text('content_title'),
  userId: integer('user_id').notNull().references(() => users.id),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const mediaFiles = pgTable('media_files', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  originalFileName: text('original_file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  fileType: text('file_type').notNull(), // image, video, audio, document, etc.
  userId: integer('user_id').references(() => users.id),
  title: text('title'),
  description: text('description'),
  tags: text('tags').array(),
  isPublic: boolean('is_public').default(true).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata')
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featuredImage: text('featured_image'),
  published: boolean('published').notNull().default(false),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  authorId: integer('author_id').references(() => users.id)
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description')
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id),
  userId: integer('user_id').references(() => users.id),
  authorName: text('author_name'),
  authorEmail: text('author_email'),
  content: text('content').notNull(),
  approved: boolean('approved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  phone: text('phone'),
  status: text('status').default('unread').notNull(), // unread, read, replied, archived
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  repliedAt: timestamp('replied_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata')
});

export const subscribers = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  status: text('status').default('active').notNull(), // active, unsubscribed, bounced, complained
  confirmedAt: timestamp('confirmed_at'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  source: text('source'), // form, import, api
  interests: jsonb('interests'),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata')
});

export const newsletters = pgTable('newsletters', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: text('status').default('draft').notNull(), // draft, scheduled, sent, canceled
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Music-related tables
export const albums = pgTable('albums', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  releaseDate: timestamp('release_date'),
  coverImage: text('cover_image'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  albumId: integer('album_id').references(() => albums.id),
  duration: text('duration'),
  audioUrl: text('audio_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============== E-commerce Tables ==============

// Product Categories
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  parentId: integer('parent_id'),
  imageUrl: varchar('image_url', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  price: integer('price').notNull(), // Price in cents
  salePrice: integer('sale_price'),
  inventory: integer('inventory').notNull().default(0),
  categoryId: integer('category_id').references(() => productCategories.id),
  imageUrl: varchar('image_url', { length: 255 }),
  galleryImages: jsonb('gallery_images'),
  type: productTypeEnum('type').notNull().default('physical'),
  sku: varchar('sku', { length: 50 }),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  dimensions: jsonb('dimensions'),
  taxable: boolean('taxable').notNull().default(true),
  taxClass: varchar('tax_class', { length: 100 }),
  digitalFileUrl: varchar('digital_file_url', { length: 255 }),
  downloadLimit: integer('download_limit'),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Carts
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Cart Items
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull().references(() => carts.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  status: orderStatusEnum('status').notNull().default('pending'),
  subtotal: integer('subtotal').notNull(), // Amount in cents
  tax: integer('tax').notNull().default(0), // Amount in cents
  shipping: integer('shipping').notNull().default(0), // Amount in cents
  discount: integer('discount').notNull().default(0), // Amount in cents
  total: integer('total').notNull(), // Amount in cents
  couponId: integer('coupon_id'),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  paymentMethod: varchar('payment_method', { length: 100 }),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Order Items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  price: integer('price').notNull(), // Price in cents
  subtotal: integer('subtotal').notNull(), // Amount in cents
  discount: integer('discount').notNull().default(0), // Amount in cents
  tax: integer('tax').notNull().default(0), // Amount in cents
  total: integer('total').notNull(), // Amount in cents
  metadata: jsonb('metadata')
});

// Coupons
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 20 }).notNull(), // percentage, fixed_amount
  discountValue: integer('discount_value').notNull(), // Amount in cents for fixed_amount, or percentage value for percentage
  minimumOrderAmount: integer('minimum_order_amount').default(0), // Minimum order amount in cents
  maximumDiscountAmount: integer('maximum_discount_amount'), // Maximum discount in cents
  usageLimit: integer('usage_limit'), // Maximum number of times this coupon can be used
  usageCount: integer('usage_count').notNull().default(0), // Number of times the coupon has been used
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  isForAllProducts: boolean('is_for_all_products').notNull().default(true),
  applicableProductIds: jsonb('applicable_product_ids'), // Array of product IDs
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// ============== Types ==============
// User Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Content Management Types
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;

export type ContentHistory = typeof contentHistory.$inferSelect;
export type InsertContentHistory = typeof contentHistory.$inferInsert;

export type ContentUsage = typeof contentUsage.$inferSelect;
export type InsertContentUsage = typeof contentUsage.$inferInsert;

export type ContentWorkflowHistory = typeof contentWorkflowHistory.$inferSelect;
export type InsertContentWorkflowHistory = typeof contentWorkflowHistory.$inferInsert;

export type WorkflowNotification = typeof workflowNotifications.$inferSelect;
export type InsertWorkflowNotification = typeof workflowNotifications.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = typeof newsletters.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

// Music-related types
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = typeof albums.$inferInsert;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

// Error Management Types
export type TypeScriptError = typeof typescriptErrors.$inferSelect;
export type InsertTypeScriptError = typeof typescriptErrors.$inferInsert;

export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type InsertErrorPattern = typeof errorPatterns.$inferInsert;

export type ErrorFix = typeof errorFixes.$inferSelect;
export type InsertErrorFix = typeof errorFixes.$inferInsert;

export type ErrorFixHistory = typeof errorFixHistory.$inferSelect;
export type InsertErrorFixHistory = typeof errorFixHistory.$inferInsert;

export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;
export type InsertProjectAnalysis = typeof projectAnalyses.$inferInsert;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;

// E-commerce Types
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ============== Zod Schemas ==============
// User Schemas
export const insertUserSchema = createInsertSchema(users);

// Content Management Schemas
export const insertContentItemSchema = createInsertSchema(contentItems);
export const insertContentHistorySchema = createInsertSchema(contentHistory);
export const insertContentUsageSchema = createInsertSchema(contentUsage);
export const insertContentWorkflowHistorySchema = createInsertSchema(contentWorkflowHistory);
export const insertWorkflowNotificationSchema = createInsertSchema(workflowNotifications);
export const insertMediaFileSchema = createInsertSchema(mediaFiles);
export const insertPostSchema = createInsertSchema(posts);
export const insertCategorySchema = createInsertSchema(categories);
export const insertCommentSchema = createInsertSchema(comments);
export const insertContactSchema = createInsertSchema(contactMessages);
export const insertNewsletterSchema = createInsertSchema(newsletters);
export const insertSubscriberSchema = createInsertSchema(subscribers);
export const insertAlbumSchema = createInsertSchema(albums);
export const insertTrackSchema = createInsertSchema(tracks);

// Error Management Schemas
export const insertTypeScriptErrorSchema = createInsertSchema(typescriptErrors);
export const insertErrorPatternSchema = createInsertSchema(errorPatterns);
export const insertErrorFixSchema = createInsertSchema(errorFixes);
export const insertErrorFixHistorySchema = createInsertSchema(errorFixHistory);
export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses);
export const insertProjectFileSchema = createInsertSchema(projectFiles);

// E-commerce Schemas
export const insertProductCategorySchema = createInsertSchema(productCategories);
export const insertProductSchema = createInsertSchema(products);
export const insertCartSchema = createInsertSchema(carts);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertCouponSchema = createInsertSchema(coupons);

// Export all schema elements
export default {
  users,
  contentItems,
  contentHistory,
  contentUsage,
  contentWorkflowHistory,
  workflowNotifications,
  mediaFiles,
  posts,
  categories,
  comments,
  contactMessages,
  newsletters,
  subscribers,
  albums,
  tracks,
  typescriptErrors,
  errorPatterns,
  errorFixes,
  errorFixHistory,
  projectAnalyses,
  projectFiles,
  productCategories,
  products,
  carts,
  cartItems,
  orders,
  orderItems,
  coupons,
  userRoleEnum,
  errorSeverityEnum,
  errorStatusEnum,
  errorCategoryEnum,
  fixResultEnum,
  fixMethodEnum,
  analysisStatusEnum,
  productTypeEnum,
  orderStatusEnum
};