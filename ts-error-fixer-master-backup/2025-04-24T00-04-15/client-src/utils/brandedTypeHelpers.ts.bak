/**
 * Branded Type Helpers
 * 
 * This file contains utility functions for working with branded types.
 * Branded types add compile-time type safety to primitive types like strings and numbers.
 */

import {
  Branded,
  ProductId,
  OrderId,
  UserId,
  BlogPostId,
  CommentId,
  CategoryId,
  TrackId,
  AlbumId,
  TourDateId,
  InvoiceId,
  SubscriptionId,
  FileId
} from '@/types/utils';

/**
 * Creates a new branded ID
 * @param value Raw string value
 * @returns Branded ID
 */
export function createBrandedId<T extends string>(value: string): Branded<string, T> {
  return value as Branded<string, T>;
}

/**
 * Creates a new Product ID
 * @param id Raw string ID
 * @returns Product ID
 */
export function createProductId(id: string): ProductId {
  return id as ProductId;
}

/**
 * Creates a new Order ID
 * @param id Raw string ID
 * @returns Order ID
 */
export function createOrderId(id: string): OrderId {
  return id as OrderId;
}

/**
 * Creates a new User ID
 * @param id Raw string ID
 * @returns User ID
 */
export function createUserId(id: string): UserId {
  return id as UserId;
}

/**
 * Creates a new Blog Post ID
 * @param id Raw string ID
 * @returns Blog Post ID
 */
export function createBlogPostId(id: string): BlogPostId {
  return id as BlogPostId;
}

/**
 * Creates a new Comment ID
 * @param id Raw string ID
 * @returns Comment ID
 */
export function createCommentId(id: string): CommentId {
  return id as CommentId;
}

/**
 * Creates a new Category ID
 * @param id Raw string ID
 * @returns Category ID
 */
export function createCategoryId(id: string): CategoryId {
  return id as CategoryId;
}

/**
 * Creates a new Track ID
 * @param id Raw string ID
 * @returns Track ID
 */
export function createTrackId(id: string): TrackId {
  return id as TrackId;
}

/**
 * Creates a new Album ID
 * @param id Raw string ID
 * @returns Album ID
 */
export function createAlbumId(id: string): AlbumId {
  return id as AlbumId;
}

/**
 * Creates a new Tour Date ID
 * @param id Raw string ID
 * @returns Tour Date ID
 */
export function createTourDateId(id: string): TourDateId {
  return id as TourDateId;
}

/**
 * Creates a new Invoice ID
 * @param id Raw string ID
 * @returns Invoice ID
 */
export function createInvoiceId(id: string): InvoiceId {
  return id as InvoiceId;
}

/**
 * Creates a new Subscription ID
 * @param id Raw string ID
 * @returns Subscription ID
 */
export function createSubscriptionId(id: string): SubscriptionId {
  return id as SubscriptionId;
}

/**
 * Creates a new File ID
 * @param id Raw string ID
 * @returns File ID
 */
export function createFileId(id: string): FileId {
  return id as FileId;
}

/**
 * Extracts the raw string value from a branded type
 * @param brandedValue Branded type value
 * @returns Raw string value
 */
export function extractRawId<T extends string>(brandedValue: Branded<string, T>): string {
  return brandedValue;
}

/**
 * Generates a unique ID string
 * This is a helper for creating new IDs (consider using UUIDs in production)
 * @returns Unique ID string
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Safely converts a potentially undefined branded ID to a raw string
 * @param brandedId Branded ID that might be undefined
 * @returns Raw string or undefined
 */
export function safeExtractRawId<T extends string>(
  brandedId?: Branded<string, T>
): string | undefined {
  return brandedId ? extractRawId(brandedId) : undefined;
}

/**
 * Creates an array of branded IDs from raw string IDs
 * @param rawIds Array of raw string IDs
 * @param createId Function to create a specific branded ID type
 * @returns Array of branded IDs
 */
export function createBrandedIdArray<T extends Branded<string, any>>(
  rawIds: string[],
  createId: (id: string) => T
): T[] {
  return rawIds.map(id => createId(id));
}

/**
 * Compares two branded IDs for equality
 * @param a First branded ID
 * @param b Second branded ID
 * @returns True if the IDs are equal
 */
export function compareBrandedIds<T extends string, U extends string>(
  a: Branded<string, T>,
  b: Branded<string, U>
): boolean {
  return a === b;
}