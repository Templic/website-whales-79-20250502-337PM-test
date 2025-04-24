/**
 * Database Type Definitions
 * 
 * This file contains type definitions for database models and operations.
 */

import { ID, Timestamp } from '../core/common-types';

/**
 * Base model with common fields
 */
interface BaseModel {
  /** Primary key ID */
  id: ID;
  
  /** Creation timestamp */
  createdAt: Timestamp;
  
  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Soft-deletable model
 */
interface SoftDeletableModel extends BaseModel {
  /** Deletion timestamp, null if not deleted */
  deletedAt: Timestamp | null;
  
  /** Whether the model is deleted */
  isDeleted: boolean;
}

/**
 * User model
 */
interface User extends SoftDeletableModel {
  /** Username */
  username: string;
  
  /** User's email */
  email: string;
  
  /** Hashed password */
  passwordHash: string;
  
  /** User's first name */
  firstName?: string;
  
  /** User's last name */
  lastName?: string;
  
  /** User's profile picture URL */
  profilePicture?: string;
  
  /** Whether the email is verified */
  isEmailVerified: boolean;
  
  /** Email verification token */
  emailVerificationToken?: string;
  
  /** Last login timestamp */
  lastLoginAt?: Timestamp;
  
  /** Whether the account is active */
  isActive: boolean;
  
  /** User's roles */
  roles: string[];
  
  /** Password reset token */
  passwordResetToken?: string;
  
  /** Password reset token expiration */
  passwordResetExpires?: Timestamp;
  
  /** Account lockout until timestamp */
  accountLockedUntil?: Timestamp;
  
  /** Failed login attempts count */
  failedLoginAttempts: number;
}

/**
 * Session model
 */
interface Session extends BaseModel {
  /** Session ID */
  sid: string;
  
  /** Associated user ID */
  userId?: ID;
  
  /** Session data */
  data: string;
  
  /** Expiration timestamp */
  expiresAt: Timestamp;
  
  /** IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Whether the session is active */
  isActive: boolean;
  
  /** Last activity timestamp */
  lastActivityAt: Timestamp;
}

/**
 * Post model
 */
interface Post extends SoftDeletableModel {
  /** Post title */
  title: string;
  
  /** Post slug */
  slug: string;
  
  /** Post content */
  content: string;
  
  /** Post excerpt */
  excerpt?: string;
  
  /** Featured image URL */
  featuredImage?: string;
  
  /** Author user ID */
  authorId: ID;
  
  /** Publication status */
  status: 'draft' | 'published' | 'archived';
  
  /** Publication timestamp */
  publishedAt?: Timestamp;
  
  /** Category IDs */
  categoryIds: ID[];
  
  /** View count */
  viewCount: number;
  
  /** Like count */
  likeCount: number;
  
  /** Comment count */
  commentCount: number;
  
  /** Whether comments are allowed */
  allowComments: boolean;
  
  /** Meta title for SEO */
  metaTitle?: string;
  
  /** Meta description for SEO */
  metaDescription?: string;
  
  /** Keywords for SEO */
  keywords?: string[];
}

/**
 * Category model
 */
interface Category extends BaseModel {
  /** Category name */
  name: string;
  
  /** Category slug */
  slug: string;
  
  /** Category description */
  description?: string;
  
  /** Parent category ID */
  parentId?: ID;
  
  /** Category icon */
  icon?: string;
  
  /** Category order */
  order?: number;
}

/**
 * Track model (music track)
 */
interface Track extends BaseModel {
  /** Track title */
  title: string;
  
  /** Artist */
  artist: string;
  
  /** Album ID */
  albumId?: ID;
  
  /** Duration in seconds */
  duration: number;
  
  /** File URL */
  fileUrl: string;
  
  /** Cover image URL */
  coverImageUrl?: string;
  
  /** Release date */
  releaseDate?: Timestamp;
  
  /** Track genres */
  genres: string[];
  
  /** Lyrics */
  lyrics?: string;
  
  /** Play count */
  playCount: number;
  
  /** Whether the track is featured */
  isFeatured: boolean;
  
  /** Whether the track is premium */
  isPremium: boolean;
  
  /** Track order in album */
  trackOrder?: number;
}

/**
 * Album model
 */
interface Album extends BaseModel {
  /** Album title */
  title: string;
  
  /** Album artist */
  artist: string;
  
  /** Release date */
  releaseDate: Timestamp;
  
  /** Cover image URL */
  coverImageUrl: string;
  
  /** Album description */
  description?: string;
  
  /** Album genres */
  genres: string[];
  
  /** Track count */
  trackCount: number;
  
  /** Total duration in seconds */
  totalDuration: number;
  
  /** Whether the album is featured */
  isFeatured: boolean;
}

/**
 * Tour date model
 */
interface TourDate extends BaseModel {
  /** Event name */
  eventName: string;
  
  /** Event date */
  eventDate: Timestamp;
  
  /** Venue name */
  venue: string;
  
  /** City */
  city: string;
  
  /** State/Province */
  state?: string;
  
  /** Country */
  country: string;
  
  /** Ticket URL */
  ticketUrl?: string;
  
  /** Event description */
  description?: string;
  
  /** Event image URL */
  imageUrl?: string;
  
  /** Whether the event is sold out */
  isSoldOut: boolean;
  
  /** Start time */
  startTime?: string;
  
  /** End time */
  endTime?: string;
  
  /** Supporting acts */
  supportingActs?: string[];
}

/**
 * Newsletter subscriber model
 */
interface Subscriber extends BaseModel {
  /** Email address */
  email: string;
  
  /** First name */
  firstName?: string;
  
  /** Last name */
  lastName?: string;
  
  /** Subscription status */
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  
  /** Confirmation token */
  confirmationToken?: string;
  
  /** Confirmation sent timestamp */
  confirmationSentAt?: Timestamp;
  
  /** Confirmed timestamp */
  confirmedAt?: Timestamp;
  
  /** Unsubscribed timestamp */
  unsubscribedAt?: Timestamp;
  
  /** Subscription preferences */
  preferences?: {
    newsletters: boolean;
    tourUpdates: boolean;
    newReleases: boolean;
    specialOffers: boolean;
  };
  
  /** Source of subscription */
  source?: string;
  
  /** User's timezone */
  timezone?: string;
}

/**
 * Database query options
 */
interface QueryOptions {
  /** Whether to include soft-deleted items */
  withDeleted?: boolean;
  
  /** Fields to select */
  select?: string[];
  
  /** Order by field and direction */
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  
  /** Limit results */
  limit?: number;
  
  /** Offset results */
  offset?: number;
  
  /** Result page number */
  page?: number;
  
  /** Relations to include */
  include?: string[];
  
  /** Whether to return count */
  count?: boolean;
  
  /** Grouping */
  groupBy?: string[];
  
  /** Transaction reference */
  transaction?: any;
}

/**
 * Database batch operation result
 */
interface BatchOperationResult {
  /** Number of affected rows */
  affectedRows: number;
  
  /** Number of changed rows */
  changedRows?: number;
  
  /** Last insert ID */
  lastInsertId?: string | number;
  
  /** Successful item count */
  successful: number;
  
  /** Failed item count */
  failed: number;
  
  /** Errors by item ID */
  errors?: Record<string, string>;
}

// Export types for use in other files
export {
  BaseModel,
  SoftDeletableModel,
  User,
  Session,
  Post,
  Category,
  Track,
  Album,
  TourDate,
  Subscriber,
  QueryOptions,
  BatchOperationResult
};