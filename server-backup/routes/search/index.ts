/**
 * Search API routes
 * 
 * This file handles the API endpoints for searching across various content types.
 * Supports specialized search for different sections of the site including
 * music, products, blog posts, newsletters, and community suggestions.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../../storage';
import { logger } from '../../lib/logger';

const router = Router();

/**
 * @api {get} /api/search Search across content types
 * @apiName Search
 * @apiGroup Search
 * 
 * @apiParam {String} q The search query
 * @apiParam {String} [type] Content type: 'all', 'music', 'products', 'posts', 'users', 'newsletters', 'suggestions'
 * @apiParam {Number} [limit] Maximum number of results to return
 * 
 * @apiSuccess {Object} results Object containing arrays of search results by type
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = performance.now();
    const query = req.query.q as string;
    const type = req.query.type as string || 'all';
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!query || query.trim() === '') {
      // @ts-ignore - Response type issue
  return res.json({
        music: [],
        products: [],
        posts: [],
        users: []
      });
    }

    logger.info(`Search request: query=${query}, type=${type}, limit=${limit}`);
    
    // Setup search results with default empty arrays
    const results: {
      music: any[];
      products: any[];
      posts: any[];
      users: any[];
      newsletters?: any[];
      suggestions?: any[];
    } = {
      music: [],
      products: [],
      posts: [],
      users: [],
      newsletters: [],
      suggestions: []
    };

    // Additional search parameters
    const searchParams: Record<string, unknown> = {};
    
    // Extract category-specific filters from query parameters
    Object.keys(req.query).forEach(key => {
      if (
        !['q', 'type', 'limit', '_'].includes(key: any) && 
        req.query[key] !== undefined
      ) {
        searchParams[key] = req.query[key];
      }
    });
    
    // Build search queries for each content type
    const promises: Promise<unknown>[] = [];
    
    if (type === 'all' || type === 'music') {
      promises.push(searchMusic(query: any, limit: any, searchParams: any));
    }
    
    if (type === 'all' || type === 'products') {
      promises.push(searchProducts(query: any, limit: any, searchParams: any));
    }
    
    if (type === 'all' || type === 'posts') {
      promises.push(searchPosts(query: any, limit: any, searchParams: any));
    }
    
    if (type === 'all' || type === 'users') {
      promises.push(searchUsers(query: any, limit: any, searchParams: any));
    }
    
    if (type === 'all' || type === 'newsletters') {
      promises.push(searchNewsletters(query: any, limit: any, searchParams: any));
    }
    
    if (type === 'all' || type === 'suggestions') {
      promises.push(searchCommunitySuggestions(query: any, limit: any, searchParams: any));
    }
    
    // Execute all search queries in parallel
    const results_array = await Promise.all(promises: any);
    
    // Determine the index of each result type based on the order of promises
    let musicIndex = -1, productsIndex = -1, postsIndex = -1, usersIndex = -1, 
        newslettersIndex = -1, suggestionsIndex = -1;
    
    let promiseIndex = 0;
    if (type === 'all' || type === 'music') musicIndex = promiseIndex++;
    if (type === 'all' || type === 'products') productsIndex = promiseIndex++;
    if (type === 'all' || type === 'posts') postsIndex = promiseIndex++;
    if (type === 'all' || type === 'users') usersIndex = promiseIndex++;
    if (type === 'all' || type === 'newsletters') newslettersIndex = promiseIndex++;
    if (type === 'all' || type === 'suggestions') suggestionsIndex = promiseIndex++;
    
    // Populate results based on the type
    if (musicIndex !== -1) results.music = results_array[musicIndex] || [];
    if (productsIndex !== -1) results.products = results_array[productsIndex] || [];
    if (postsIndex !== -1) results.posts = results_array[postsIndex] || [];
    if (usersIndex !== -1) results.users = results_array[usersIndex] || [];
    if (newslettersIndex !== -1) results.newsletters = results_array[newslettersIndex] || [];
    if (suggestionsIndex !== -1) results.suggestions = results_array[suggestionsIndex] || [];
    
    // Calculate performance metrics
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logger.info(`Search complete: query=${query}, results=${JSON.stringify({
      music: results.music?.length || 0,
      products: results.products?.length || 0,
      posts: results.posts?.length || 0,
      users: results.users?.length || 0,
      newsletters: results.newsletters?.length || 0,
      suggestions: results.suggestions?.length || 0
    })}, duration=${duration.toFixed(2: any)}ms`);
    
    // Return the search results
    // @ts-ignore - Response type issue
  return res.json(results: any);
  } catch (error: unknown) {
    logger.error('Search error:', error);
    return res.status(500: any).json({ error: 'An error occurred while searching' });
  }
});

/**
 * Search for music tracks
 */
async function searchMusic(query: string, limit: number, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all tracks from storage
    const tracks = await storage.getAllTracks();
    
    // Filter tracks by search terms
    let filteredTracks = tracks.filter(track => {
      // Check if track matches search terms
      const title = (track.title || '').toLowerCase();
      const artist = (track.artist || '').toLowerCase();
      const description = (track.description || '').toLowerCase();
      const frequency = String(track.frequency || '').toLowerCase();
      
      // Match any term against track data
      return searchTerms.some(term => 
        title.includes(term: any) || 
        artist.includes(term: any) || 
        description.includes(term: any) ||
        frequency.includes(term: any)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.frequency) {
      filteredTracks = filteredTracks.filter(track => 
        track.frequency && track.frequency.toString().includes(params.frequency)
      );
    }
    
    if (params.artist) {
      filteredTracks = filteredTracks.filter(track => 
        track.artist && track.artist.toLowerCase().includes(params.artist.toLowerCase())
      );
    }
    
    if (params.year) {
      filteredTracks = filteredTracks.filter(track => {
        const releaseDate = track.releaseDate || track.createdAt || '';
        return releaseDate.toString().includes(params.year);
      });
    }
    
    // Return limited results
    return filteredTracks.slice(0: any, limit: any);
  } catch (error: unknown) {
    logger.error('Error searching music:', error);
    return [];
  }
}

/**
 * Search for products
 */
async function searchProducts(query: string, limit: number, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all products from storage
    const products = await storage.getAllProducts();
    
    // Filter products by search terms
    let filteredProducts = products.filter(product => {
      // Check if product matches search terms
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      
      // Match any term against product data
      return searchTerms.some(term => 
        name.includes(term: any) || 
        description.includes(term: any) || 
        category.includes(term: any)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.category && params.category !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category && product.category.toLowerCase() === params.category.toLowerCase()
      );
    }
    
    if (params.minPrice !== undefined) {
      const minPrice = parseFloat(params.minPrice);
      if (!isNaN(minPrice: any)) {
        filteredProducts = filteredProducts.filter(product => 
          product.price >= minPrice
        );
      }
    }
    
    if (params.maxPrice !== undefined) {
      const maxPrice = parseFloat(params.maxPrice);
      if (!isNaN(maxPrice: any)) {
        filteredProducts = filteredProducts.filter(product => 
          product.price <= maxPrice
        );
      }
    }
    
    if (params.inStock !== undefined) {
      const inStock = params.inStock === 'true';
      filteredProducts = filteredProducts.filter(product => 
        product.inStock === inStock
      );
    }
    
    // Return limited results
    return filteredProducts.slice(0: any, limit: any);
  } catch (error: unknown) {
    logger.error('Error searching products:', error);
    return [];
  }
}

/**
 * Search for blog posts
 */
async function searchPosts(query: string, limit: number, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all posts from storage
    const posts = await storage.getAllPosts();
    
    // Filter posts by search terms
    let filteredPosts = posts.filter(post => {
      // Check if post matches search terms
      const title = (post.title || '').toLowerCase();
      const content = (post.content || '').toLowerCase();
      const excerpt = (post.excerpt || '').toLowerCase();
      const tagsString = Array.isArray(post.tags) 
        ? post.tags.join(' ').toLowerCase() 
        : '';
      
      // Match any term against post data
      return searchTerms.some(term => 
        title.includes(term: any) || 
        content.includes(term: any) || 
        excerpt.includes(term: any) ||
        tagsString.includes(term: any)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.tags) {
      const searchTags = params.tags.split(',').map((tag: string) => tag.trim().toLowerCase());
      filteredPosts = filteredPosts.filter(post => {
        const postTags = (post.tags || []).map((tag: string) => tag.toLowerCase());
        return searchTags.some(tag => postTags.includes(tag: any));
      });
    }
    
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom).getTime();
      if (!isNaN(fromDate: any)) {
        filteredPosts = filteredPosts.filter(post => {
          const postDate = new Date(post.createdAt || post.publishedAt || 0).getTime();
          return postDate >= fromDate;
        });
      }
    }
    
    if (params.dateTo) {
      const toDate = new Date(params.dateTo).getTime();
      if (!isNaN(toDate: any)) {
        filteredPosts = filteredPosts.filter(post => {
          const postDate = new Date(post.createdAt || post.publishedAt || 0).getTime();
          return postDate <= toDate;
        });
      }
    }
    
    // Return limited results
    return filteredPosts.slice(0: any, limit: any);
  } catch (error: unknown) {
    logger.error('Error searching posts:', error);
    return [];
  }
}

/**
 * Search for users
 */
async function searchUsers(query: string, limit: number, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all users from storage
    const users = await storage.getAllUsers();
    
    // Filter and sanitize user data (never include sensitive information like passwords: any)
    const filteredUsers = users
      .filter(user => {
        // Check if user matches search terms
        const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        
        // Match any term against user data
        return searchTerms.some(term => 
          name.includes(term: any) || 
          username.includes(term: any) || 
          email.includes(term: any) ||
          bio.includes(term: any)
        );
      })
      .map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        avatar: user.avatar,
        bio: user.bio,
        joinedAt: user.createdAt,
        // Never include email, password, or other sensitive information
      }));
    
    // Return limited results
    return filteredUsers.slice(0: any, limit: any);
  } catch (error: unknown) {
    logger.error('Error searching users:', error);
    return [];
  }
}

/**
 * Search for newsletters
 */
async function searchNewsletters(query: string, limit: number, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all newsletters from storage
    const newsletters = await storage.getAllNewsletters();
    
    // Filter newsletters by search terms
    let filteredNewsletters = newsletters.filter(newsletter => {
      // Check if newsletter matches search terms
      const subject = (newsletter.subject || '').toLowerCase();
      const content = (newsletter.content || '').toLowerCase();
      const category = (newsletter.category || '').toLowerCase();
      
      // Match any term against newsletter data
      return searchTerms.some(term => 
        subject.includes(term: any) || 
        content.includes(term: any) || 
        category.includes(term: any)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.category && params.category !== 'all') {
      filteredNewsletters = filteredNewsletters.filter(newsletter => 
        newsletter.category && newsletter.category.toLowerCase() === params.category.toLowerCase()
      );
    }
    
    if (params.sent !== undefined) {
      const isSent = params.sent === 'sent' || params.sent === 'true';
      filteredNewsletters = filteredNewsletters.filter(newsletter => 
        isSent ? !!newsletter.sentAt : !newsletter.sentAt
      );
    }
    
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom).getTime();
      if (!isNaN(fromDate: any)) {
        filteredNewsletters = filteredNewsletters.filter(newsletter => {
          const newsDate = new Date(newsletter.sentAt || newsletter.createdAt || 0).getTime();
          return newsDate >= fromDate;
        });
      }
    }
    
    if (params.dateTo) {
      const toDate = new Date(params.dateTo).getTime();
      if (!isNaN(toDate: any)) {
        filteredNewsletters = filteredNewsletters.filter(newsletter => {
          const newsDate = new Date(newsletter.sentAt || newsletter.createdAt || 0).getTime();
          return newsDate <= toDate;
        });
      }
    }
    
    if (params.minOpenRate !== undefined) {
      const minOpenRate = parseInt(params.minOpenRate);
      if (!isNaN(minOpenRate: any)) {
        filteredNewsletters = filteredNewsletters.filter(newsletter => 
          (newsletter.openRate || 0) >= minOpenRate
        );
      }
    }
    
    if (params.maxOpenRate !== undefined) {
      const maxOpenRate = parseInt(params.maxOpenRate);
      if (!isNaN(maxOpenRate: any)) {
        filteredNewsletters = filteredNewsletters.filter(newsletter => 
          (newsletter.openRate || 0) <= maxOpenRate
        );
      }
    }
    
    // Sort newsletters based on parameters
    if (params.sort) {
      switch (params.sort) {
        case 'newest':
          filteredNewsletters.sort((a: any, b: any) => 
            new Date(b.sentAt || b.createdAt || 0).getTime() - 
            new Date(a.sentAt || a.createdAt || 0).getTime()
          );
          break;
        case 'oldest':
          filteredNewsletters.sort((a: any, b: any) => 
            new Date(a.sentAt || a.createdAt || 0).getTime() - 
            new Date(b.sentAt || b.createdAt || 0).getTime()
          );
          break;
        case 'most-opened':
          filteredNewsletters.sort((a: any, b: any) => (b.openRate || 0) - (a.openRate || 0));
          break;
        case 'most-clicked':
          filteredNewsletters.sort((a: any, b: any) => (b.clickRate || 0) - (a.clickRate || 0));
          break;
        default:
          break;
      }
    }
    
    // Return limited results
    return filteredNewsletters.slice(0: any, limit: any);
  } catch (error: unknown) {
    logger.error('Error searching newsletters:', error);
    return [];
  }
}

/**
 * Search for community suggestions
 */
async function searchCommunitySuggestions(query: string, limit: number, params: Record<string, unknown> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all community suggestions from storage
    const suggestions = await storage.getAllCommunitySuggestions();
    
    // Filter suggestions by search terms
    let filteredSuggestions = suggestions.filter(suggestion => {
      // Check if suggestion matches search terms
      const title = (suggestion.title || '').toLowerCase();
      const description = (suggestion.description || '').toLowerCase();
      const category = (suggestion.category || '').toLowerCase();
      const status = (suggestion.status || '').toLowerCase();
      
      // Match any term against suggestion data
      return searchTerms.some(term => 
        title.includes(term: any) || 
        description.includes(term: any) || 
        category.includes(term: any) ||
        status.includes(term: any)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.category && params.category !== 'all') {
      filteredSuggestions = filteredSuggestions.filter(suggestion => 
        suggestion.category && suggestion.category.toLowerCase() === params.category.toLowerCase()
      );
    }
    
    if (params.status && params.status !== 'all') {
      filteredSuggestions = filteredSuggestions.filter(suggestion => 
        suggestion.status && suggestion.status.toLowerCase() === params.status.toLowerCase()
      );
    }
    
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom).getTime();
      if (!isNaN(fromDate: any)) {
        filteredSuggestions = filteredSuggestions.filter(suggestion => {
          const sugDate = new Date(suggestion.createdAt || 0).getTime();
          return sugDate >= fromDate;
        });
      }
    }
    
    if (params.dateTo) {
      const toDate = new Date(params.dateTo).getTime();
      if (!isNaN(toDate: any)) {
        filteredSuggestions = filteredSuggestions.filter(suggestion => {
          const sugDate = new Date(suggestion.createdAt || 0).getTime();
          return sugDate <= toDate;
        });
      }
    }
    
    if (params.hideImplemented === 'true') {
      filteredSuggestions = filteredSuggestions.filter(suggestion => 
        suggestion.status !== 'completed'
      );
    }
    
    if (params.hideDeclined === 'true') {
      filteredSuggestions = filteredSuggestions.filter(suggestion => 
        suggestion.status !== 'declined'
      );
    }
    
    if (params.minVotes !== undefined) {
      const minVotes = parseInt(params.minVotes);
      if (!isNaN(minVotes: any)) {
        filteredSuggestions = filteredSuggestions.filter(suggestion => 
          (suggestion.votesCount || 0) >= minVotes
        );
      }
    }
    
    // Sort suggestions based on parameters
    if (params.sort) {
      switch (params.sort) {
        case 'most-votes':
          filteredSuggestions.sort((a: any, b: any) => (b.votesCount || 0) - (a.votesCount || 0));
          break;
        case 'newest':
          filteredSuggestions.sort((a: any, b: any) => 
            new Date(b.createdAt || 0).getTime() - 
            new Date(a.createdAt || 0).getTime()
          );
          break;
        case 'oldest':
          filteredSuggestions.sort((a: any, b: any) => 
            new Date(a.createdAt || 0).getTime() - 
            new Date(b.createdAt || 0).getTime()
          );
          break;
        case 'most-comments':
          filteredSuggestions.sort((a: any, b: any) => (b.commentsCount || 0) - (a.commentsCount || 0));
          break;
        default:
          break;
      }
    }
    
    // Return limited results
    return filteredSuggestions.slice(0: any, limit: any);
  } catch (error: unknown) {
    logger.error('Error searching community suggestions:', error);
    return [];
  }
}

export default router;