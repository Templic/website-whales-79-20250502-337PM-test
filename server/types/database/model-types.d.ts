/**
 * Model Type Definitions
 * 
 * This file defines the types for database models and their relationships.
 * These types ensure type safety when interacting with database entities.
 */

import { BaseEntity, AuditableEntity, SoftDeletableEntity } from '../core/common-types';

/**
 * Base entity model that all database models extend
 */
export interface EntityModel extends BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User model for authentication and authorization
 */
export interface UserModel extends EntityModel, AuditableEntity, SoftDeletableEntity {
  username: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  roles: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
  // Relationships
  profile?: ProfileModel;
  settings?: UserSettingsModel;
  sessions?: SessionModel[];
  auditLogs?: AuditLogModel[];
}

/**
 * User profile model for additional user information
 */
export interface ProfileModel extends EntityModel {
  userId: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  birthdate?: Date;
  gender?: string;
  interests?: string[];
  skills?: string[];
  socialLinks?: Record<string, string>;
  // Relationships
  user?: UserModel;
}

/**
 * User settings model for user preferences
 */
export interface UserSettingsModel extends EntityModel {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  customSettings?: Record<string, any>;
  // Relationships
  user?: UserModel;
}

/**
 * Session model for user sessions
 */
export interface SessionModel extends EntityModel {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: Date;
  isRevoked: boolean;
  metadata?: Record<string, any>;
  // Relationships
  user?: UserModel;
}

/**
 * Role model for authorization
 */
export interface RoleModel extends EntityModel, AuditableEntity {
  name: string;
  description?: string;
  isSystem: boolean;
  // Relationships
  permissions?: PermissionModel[];
  users?: UserModel[];
}

/**
 * Permission model for fine-grained access control
 */
export interface PermissionModel extends EntityModel {
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  // Relationships
  roles?: RoleModel[];
}

/**
 * Audit log model for tracking changes
 */
export interface AuditLogModel extends EntityModel {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  // Relationships
  user?: UserModel;
}

/**
 * File model for uploaded files
 */
export interface FileModel extends EntityModel, AuditableEntity, SoftDeletableEntity {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  bucket?: string;
  isPublic: boolean;
  metadata?: Record<string, any>;
  // Relationships
  uploader?: UserModel;
}

/**
 * Tag model for categorization
 */
export interface TagModel extends EntityModel {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  // Relationships
  resources?: Record<string, any>[];
}

/**
 * Category model for hierarchical organization
 */
export interface CategoryModel extends EntityModel, AuditableEntity, SoftDeletableEntity {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  order?: number;
  // Relationships
  parent?: CategoryModel;
  children?: CategoryModel[];
  resources?: Record<string, any>[];
}

/**
 * Notification model for user notifications
 */
export interface NotificationModel extends EntityModel {
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  // Relationships
  user?: UserModel;
}

/**
 * Comment model for user comments
 */
export interface CommentModel extends EntityModel, AuditableEntity, SoftDeletableEntity {
  userId: string;
  resourceType: string;
  resourceId: string;
  content: string;
  isApproved: boolean;
  parentId?: string;
  // Relationships
  user?: UserModel;
  parent?: CommentModel;
  replies?: CommentModel[];
}

/**
 * Content model for managed content
 */
export interface ContentModel extends EntityModel, AuditableEntity, SoftDeletableEntity {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  featuredImageId?: string;
  metadata?: Record<string, any>;
  // Relationships
  author?: UserModel;
  featuredImage?: FileModel;
  tags?: TagModel[];
  categories?: CategoryModel[];
  comments?: CommentModel[];
}

/**
 * Message model for user-to-user messages
 */
export interface MessageModel extends EntityModel {
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  // Relationships
  sender?: UserModel;
  receiver?: UserModel;
  conversation?: ConversationModel;
}

/**
 * Conversation model for grouping messages
 */
export interface ConversationModel extends EntityModel {
  title?: string;
  lastMessageAt: Date;
  metadata?: Record<string, any>;
  // Relationships
  participants?: UserModel[];
  messages?: MessageModel[];
}

/**
 * Feature flag model for feature toggles
 */
export interface FeatureFlagModel extends EntityModel, AuditableEntity {
  name: string;
  description?: string;
  isEnabled: boolean;
  rules?: {
    userIds?: string[];
    userRoles?: string[];
    percentage?: number;
    startDate?: Date;
    endDate?: Date;
    environments?: string[];
    conditions?: Record<string, any>;
  };
  // Relationships
  createdBy?: UserModel;
}

/**
 * Activity model for user activity tracking
 */
export interface ActivityModel extends EntityModel {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  // Relationships
  user?: UserModel;
}

/**
 * Webhook model for external integrations
 */
export interface WebhookModel extends EntityModel, AuditableEntity {
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
  // Relationships
  createdBy?: UserModel;
}

/**
 * API Key model for API authentication
 */
export interface ApiKeyModel extends EntityModel, AuditableEntity {
  name: string;
  key: string;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isRevoked: boolean;
  scopes?: string[];
  metadata?: Record<string, any>;
  // Relationships
  createdBy?: UserModel;
}

/**
 * Event model for event sourcing
 */
export interface EventModel extends EntityModel {
  type: string;
  payload: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
  // Relationships
  user?: UserModel;
}

/**
 * Type guards
 */

/**
 * Type guard to check if a value is a UserModel
 */
export function isUserModel(value: unknown): value is UserModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'username' in value &&
    'email' in value &&
    'passwordHash' in value
  );
}

/**
 * Type guard to check if a value is a ContentModel
 */
export function isContentModel(value: unknown): value is ContentModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'slug' in value &&
    'content' in value &&
    'status' in value
  );
}

/**
 * Type guard to check if a value is a FileModel
 */
export function isFileModel(value: unknown): value is FileModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'originalName' in value &&
    'mimeType' in value &&
    'size' in value &&
    'path' in value
  );
}