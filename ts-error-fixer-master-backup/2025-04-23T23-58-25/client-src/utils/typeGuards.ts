/**
 * Type Guards
 * 
 * This file contains type guard functions for safely checking types at runtime.
 * Type guards are functions that return a boolean and have a type predicate return type.
 */

import { 
  Product, 
  User, 
  Order, 
  CartItem, 
  BlogPost, 
  Track, 
  Album,
  TourDate,
  Address
} from '@/types';

/**
 * Type guard for Product
 * @param value Any value to check
 * @returns True if value is a Product
 */
export function isProduct(value: any): value is Product {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.price === 'number' &&
    Array.isArray(value.images) &&
    typeof value.description === 'string'
  );
}

/**
 * Type guard for User
 * @param value Any value to check
 * @returns True if value is a User
 */
export function isUser(value: any): value is User {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.firstName === 'string' &&
    typeof value.lastName === 'string' &&
    (value.role === 'user' || value.role === 'admin' || value.role === 'artist' || value.role === 'moderator') &&
    typeof value.isActive === 'boolean'
  );
}

/**
 * Type guard for CartItem
 * @param value Any value to check
 * @returns True if value is a CartItem
 */
export function isCartItem(value: any): value is CartItem {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    isProduct(value.product) &&
    typeof value.quantity === 'number' &&
    typeof value.price === 'number' &&
    typeof value.totalPrice === 'number'
  );
}

/**
 * Type guard for Order
 * @param value Any value to check
 * @returns True if value is an Order
 */
export function isOrder(value: any): value is Order {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    Array.isArray(value.items) &&
    typeof value.subtotal === 'number' &&
    typeof value.total === 'number' &&
    typeof value.createdAt === 'string' &&
    isAddress(value.billingAddress) &&
    isAddress(value.shippingAddress)
  );
}

/**
 * Type guard for Address
 * @param value Any value to check
 * @returns True if value is an Address
 */
export function isAddress(value: any): value is Address {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.firstName === 'string' &&
    typeof value.lastName === 'string' &&
    typeof value.addressLine1 === 'string' &&
    typeof value.city === 'string' &&
    typeof value.state === 'string' &&
    typeof value.postalCode === 'string' &&
    typeof value.country === 'string' &&
    typeof value.phone === 'string'
  );
}

/**
 * Type guard for BlogPost
 * @param value Any value to check
 * @returns True if value is a BlogPost
 */
export function isBlogPost(value: any): value is BlogPost {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.content === 'string' &&
    typeof value.excerpt === 'string' &&
    typeof value.authorId === 'string' &&
    typeof value.authorName === 'string' &&
    Array.isArray(value.categories) &&
    Array.isArray(value.tags) &&
    typeof value.createdAt === 'string'
  );
}

/**
 * Type guard for Track
 * @param value Any value to check
 * @returns True if value is a Track
 */
export function isTrack(value: any): value is Track {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    typeof value.duration === 'number' &&
    typeof value.audioUrl === 'string' &&
    typeof value.createdAt === 'string'
  );
}

/**
 * Type guard for Album
 * @param value Any value to check
 * @returns True if value is an Album
 */
export function isAlbum(value: any): value is Album {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    typeof value.coverImage === 'string' &&
    typeof value.releaseDate === 'string' &&
    Array.isArray(value.tracks) &&
    typeof value.duration === 'number' &&
    typeof value.createdAt === 'string'
  );
}

/**
 * Type guard for TourDate
 * @param value Any value to check
 * @returns True if value is a TourDate
 */
export function isTourDate(value: any): value is TourDate {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.venue === 'string' &&
    typeof value.city === 'string' &&
    typeof value.country === 'string' &&
    typeof value.date === 'string' &&
    typeof value.start === 'string' &&
    typeof value.isSoldOut === 'boolean' &&
    typeof value.createdAt === 'string'
  );
}

/**
 * Generic type guard for arrays of a specific type
 * @param value Any value to check
 * @param itemGuard Type guard function for individual items
 * @returns True if value is an array of the specified type
 */
export function isArrayOf<T>(value: any, itemGuard: (item: any) => item is T): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}