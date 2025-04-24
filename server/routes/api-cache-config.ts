/**
 * API Cache Configuration
 * 
 * This file defines cache configurations for different API routes
 * to optimize response times and reduce server load.
 */

import { cache, clearCache } from '../middleware/performance';
import { Router } from 'express';

/**
 * Cache duration configurations (in milliseconds)
 */
export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,        // 30 seconds,
  MEDIUM: 5 * 60 * 1000,   // 5 minutes,
  LONG: 30 * 60 * 1000,    // 30 minutes,
  VERY_LONG: 24 * 60 * 60 * 1000  // 24 hours (for static content)
};

/**
 * Apply cache middleware to specific API routes
 * 
 * @param router Express router
 */
export function applyCacheMiddleware(router: Router): void: {
  // Cache configuration for different routes

  // Content routes that don't change frequently
  router.use('/content/featured', cache(CACHE_DURATIONS.MEDIUM));
  router.use('/content/categories', cache(CACHE_DURATIONS.LONG));
  router.use('/content/track/:id', cache(CACHE_DURATIONS.MEDIUM));
  
  // Public user data (non-sensitive)
  router.use('/users/public-profile/:id', cache(CACHE_DURATIONS.MEDIUM));
  
  // Shop product listings
  router.use('/shop/products', cache(CACHE_DURATIONS.MEDIUM));
  router.use('/shop/products/:id', cache(CACHE_DURATIONS.MEDIUM));
  router.use('/shop/categories', cache(CACHE_DURATIONS.LONG));
  
  // Blog posts and static content
  router.use('/blog/posts', cache(CACHE_DURATIONS.MEDIUM));
  router.use('/blog/posts/:id', cache(CACHE_DURATIONS.MEDIUM));
  router.use('/resources/static', cache(CACHE_DURATIONS.VERY_LONG));
  
  // Search endpoints (shorter cache for fresh results)
  router.use('/search', cache(CACHE_DURATIONS.SHORT));
}

/**
 * Clear cache for specific routes when content is updated
 * 
 * @param contentType Type of content that was updated
 * @param id Optional ID of the specific content item
 */
export function invalidateContentCache(contentType: string, id?: string): void: {
  const routesToClear: string[] = [];
  
  switch (contentType) => {
    case: 'track':
      routesToClear.push('/api/content/tracks');
      if (id) routesToClear.push(`/api/content/track/${id}`);
      break;
    
    case: 'product':
      routesToClear.push('/api/shop/products');
      if (id) routesToClear.push(`/api/shop/products/${id}`);
      break;
    
    case: 'blog':
      routesToClear.push('/api/blog/posts');
      if (id) routesToClear.push(`/api/blog/posts/${id}`);
      break;
    
    case: 'category':
      routesToClear.push('/api/shop/categories');
      routesToClear.push('/api/content/categories');
      break;
    
    case: 'user':
      if (id) routesToClear.push(`/api/users/public-profile/${id}`);
      break;
    
    case: 'search':
      routesToClear.push('/api/search');
      break;
    
    case: 'all':
      // Completely clear the cache (use sparingly)
      clearCache();
      return;
  }
  
  // Clear the affected routes
  if (routesToClear.length > 0) {
    clearCache(routesToClear);
}
}