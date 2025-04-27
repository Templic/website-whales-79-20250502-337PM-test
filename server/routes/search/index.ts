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
// @ts-ignore - Express router typing issues
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
      music: unknown[];
      products: unknown[];
      posts: unknown[];
      users: unknown[];
      newsletters?: unknown[];
      suggestions?: unknown[];
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
        !['q', 'type', 'limit', '_'].includes(key) && 
        req.query[key] !== undefined
      ) {
        searchParams[key] = req.query[key];
      }
    });
    
    // Build search queries for each content type
    const promises: Promise<unknown>[] = [];
    
    if (type === 'all' || type === 'music') {
      promises.push(searchMusic(query, limit, searchParams));
    }
    
    if (type === 'all' || type === 'products') {
      promises.push(searchProducts(query, limit, searchParams));
    }
    
    if (type === 'all' || type === 'posts') {
      promises.push(searchPosts(query, limit, searchParams));
    }
    
    if (type === 'all' || type === 'users') {
      promises.push(searchUsers(query, limit, searchParams));
    }
    
    if (type === 'all' || type === 'newsletters') {
      promises.push(searchNewsletters(query, limit, searchParams));
    }
    
    if (type === 'all' || type === 'suggestions') {
      promises.push(searchCommunitySuggestions(query, limit, searchParams));
    }
    
    // Execute all search queries in parallel
    const results_array = await Promise.all(promises);
    
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
    if (musicIndex !== -1) results.music = results_array[musicIndex] as unknown[] || [];
    if (productsIndex !== -1) results.products = results_array[productsIndex] as unknown[] || [];
    if (postsIndex !== -1) results.posts = results_array[postsIndex] as unknown[] || [];
    if (usersIndex !== -1) results.users = results_array[usersIndex] as unknown[] || [];
    if (newslettersIndex !== -1) results.newsletters = results_array[newslettersIndex] as unknown[] || [];
    if (suggestionsIndex !== -1) results.suggestions = results_array[suggestionsIndex] as unknown[] || [];
    
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
    })}, duration=${duration.toFixed(2)}ms`);
    
    // Return the search results
    // @ts-ignore - Response type issue
    return res.json(results);
  } catch (error) {
    logger.error('Search error:', error);
    return res.status(500).json({ error: 'An error occurred while searching' });
  }
});

/**
 * Search for music tracks
 */
async function searchMusic(query: string, limit: number, params: Record<string, unknown> = {}): Promise<unknown[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all tracks from storage
    const tracks = await storage.getAllTracks();
    
    // Filter tracks by search terms
    let filteredTracks = tracks.filter((track: unknown) => {
      const trackObj = track as Record<string, unknown>;
      // Check if track matches search terms
      const title = String(trackObj.title || '').toLowerCase();
      const artist = String(trackObj.artist || '').toLowerCase();
      const description = String(trackObj.description || '').toLowerCase();
      const frequency = String(trackObj.frequency || '').toLowerCase();
      
      // Match any term against track data
      return searchTerms.some(term => 
        title.includes(term) || 
        artist.includes(term) || 
        description.includes(term) ||
        frequency.includes(term)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.frequency) {
      const frequencyParam = String(params.frequency);
      filteredTracks = filteredTracks.filter((track: unknown) => {
        const trackObj = track as Record<string, unknown>;
        return trackObj.frequency && String(trackObj.frequency).includes(frequencyParam);
      });
    }
    
    if (params.artist) {
      const artistParam = String(params.artist);
      filteredTracks = filteredTracks.filter((track: unknown) => {
        const trackObj = track as Record<string, unknown>;
        return trackObj.artist && String(trackObj.artist).toLowerCase().includes(artistParam.toLowerCase());
      });
    }
    
    if (params.year) {
      const yearParam = String(params.year);
      filteredTracks = filteredTracks.filter((track: unknown) => {
        const trackObj = track as Record<string, unknown>;
        const releaseDate = trackObj.releaseDate || trackObj.createdAt || '1970-01-01';
        return String(releaseDate).includes(yearParam);
      });
    }
    
    // Return limited results
    return filteredTracks.slice(0, limit);
  } catch (error) {
    logger.error('Error searching music:', error);
    return [];
  }
}

/**
 * Search for products
 */
async function searchProducts(query: string, limit: number, params: Record<string, unknown> = {}): Promise<unknown[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all products from storage
    const products = await storage.getAllProducts();
    
    // Filter products by search terms
    let filteredProducts = products.filter((product: unknown) => {
      const productObj = product as Record<string, unknown>;
      // Check if product matches search terms
      const name = String(productObj.name || '').toLowerCase();
      const description = String(productObj.description || '').toLowerCase();
      const category = String(productObj.categoryId || '').toLowerCase();
      
      // Match any term against product data
      return searchTerms.some(term => 
        name.includes(term) || 
        description.includes(term) || 
        category.includes(term)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.category && params.category !== 'all') {
      const categoryParam = String(params.category);
      filteredProducts = filteredProducts.filter((product: unknown) => {
        const productObj = product as Record<string, unknown>;
        return productObj.categoryId && String(productObj.categoryId).toLowerCase() === categoryParam.toLowerCase();
      });
    }
    
    if (params.minPrice !== undefined) {
      const minPrice = parseFloat(String(params.minPrice));
      if (!isNaN(minPrice)) {
        filteredProducts = filteredProducts.filter((product: unknown) => {
          const productObj = product as Record<string, unknown>;
          return Number(String(productObj.price || 0)) >= minPrice;
        });
      }
    }
    
    if (params.maxPrice !== undefined) {
      const maxPrice = parseFloat(String(params.maxPrice));
      if (!isNaN(maxPrice)) {
        filteredProducts = filteredProducts.filter((product: unknown) => {
          const productObj = product as Record<string, unknown>;
          return Number(String(productObj.price || 0)) <= maxPrice;
        });
      }
    }
    
    if (params.inStock !== undefined) {
      const inStock = String(params.inStock) === 'true';
      filteredProducts = filteredProducts.filter((product: unknown) => {
        const productObj = product as Record<string, unknown>;
        return Boolean(productObj.inventory && Number(String(productObj.inventory)) > 0) === inStock;
      });
    }
    
    // Return limited results
    return filteredProducts.slice(0, limit);
  } catch (error) {
    logger.error('Error searching products:', error);
    return [];
  }
}

/**
 * Search for blog posts
 */
async function searchPosts(query: string, limit: number, params: Record<string, unknown> = {}): Promise<unknown[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all posts from storage
    const posts = await storage.getAllPosts();
    
    // Filter posts by search terms
    let filteredPosts = posts.filter((post: unknown) => {
      const postObj = post as Record<string, unknown>;
      // Check if post matches search terms
      const title = String(postObj.title || '').toLowerCase();
      const content = String(postObj.content || '').toLowerCase();
      const summary = String(postObj.summary || '').toLowerCase(); // Using summary instead of excerpt which doesn't exist
      const category = String(postObj.category || '').toLowerCase(); // Using category as a fallback for tags
      
      // Match any term against post data
      return searchTerms.some(term => 
        title.includes(term) || 
        content.includes(term) || 
        summary.includes(term) ||
        category.includes(term)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.tags) {
      // Handle tag filtering using category as a fallback since tags aren't available
      const searchParam = String(params.tags);
      if (searchParam) {
        const searchCategories = searchParam.split(',').map(cat => cat.trim().toLowerCase());
        filteredPosts = filteredPosts.filter((post: unknown) => {
          const postObj = post as Record<string, unknown>;
          const category = String(postObj.category || '').toLowerCase();
          return searchCategories.some(cat => category.includes(cat));
        });
      }
    }
    
    if (params.dateFrom) {
      const dateFromParam = String(params.dateFrom);
      const fromDate = new Date(dateFromParam).getTime();
      if (!isNaN(fromDate)) {
        filteredPosts = filteredPosts.filter((post: unknown) => {
          const postObj = post as Record<string, unknown>;
          const postDate = new Date(String(postObj.createdAt || 0)).getTime();
          return postDate >= fromDate;
        });
      }
    }
    
    if (params.dateTo) {
      const dateToParam = String(params.dateTo);
      const toDate = new Date(dateToParam).getTime();
      if (!isNaN(toDate)) {
        filteredPosts = filteredPosts.filter((post: unknown) => {
          const postObj = post as Record<string, unknown>;
          const postDate = new Date(String(postObj.createdAt || 0)).getTime();
          return postDate <= toDate;
        });
      }
    }
    
    // Return limited results
    return filteredPosts.slice(0, limit);
  } catch (error) {
    logger.error('Error searching posts:', error);
    return [];
  }
}

/**
 * Search for users
 */
async function searchUsers(query: string, limit: number, params: Record<string, unknown> = {}): Promise<unknown[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all users from storage
    const users = await storage.getAllUsers();
    
    // Filter and sanitize user data (never include sensitive information like passwords)
    const filteredUsers = users
      .filter((user: unknown) => {
        const userObj = user as Record<string, unknown>;
        // Check if user matches search terms
        const firstName = String(userObj.firstName || '');
        const lastName = String(userObj.lastName || '');
        const name = `${firstName} ${lastName}`.toLowerCase();
        const username = String(userObj.username || '').toLowerCase();
        const email = String(userObj.email || '').toLowerCase();
        const bio = String(userObj.bio || '').toLowerCase();
        
        // Match any term against user data
        return searchTerms.some(term => 
          name.includes(term) || 
          username.includes(term) || 
          email.includes(term) ||
          bio.includes(term)
        );
      })
      .map((user: unknown) => {
        const userObj = user as Record<string, unknown>;
        const firstName = String(userObj.firstName || '');
        const lastName = String(userObj.lastName || '');
        return {
          id: userObj.id,
          username: userObj.username,
          displayName: String(userObj.firstName || '') + ' ' + String(userObj.lastName || '').trim(),
          avatar: userObj.profileImageUrl, // Using profileImageUrl instead of avatar
          bio: userObj.bio,
          joinedAt: userObj.createdAt,
          // Never include email, password, or other sensitive information
        };
      });
    
    // Return limited results
    return filteredUsers.slice(0, limit);
  } catch (error) {
    logger.error('Error searching users:', error);
    return [];
  }
}

/**
 * Search for newsletters
 */
async function searchNewsletters(query: string, limit: number, params: Record<string, unknown> = {}): Promise<unknown[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all newsletters from storage
    const newsletters = await storage.getAllNewsletters();
    
    // Filter newsletters by search terms
    let filteredNewsletters = newsletters.filter((newsletter: unknown) => {
      const newsletterObj = newsletter as Record<string, unknown>;
      // Check if newsletter matches search terms
      const title = String(newsletterObj.title || '').toLowerCase();
      const content = String(newsletterObj.content || '').toLowerCase();
      const status = String(newsletterObj.status || '').toLowerCase();
      
      // Match any term against newsletter data
      return searchTerms.some(term => 
        title.includes(term) || 
        content.includes(term) || 
        status.includes(term)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.category && params.category !== 'all') {
      const categoryParam = String(params.category);
      filteredNewsletters = filteredNewsletters.filter((newsletter: unknown) => {
        const newsletterObj = newsletter as Record<string, unknown>;
        // Use status as a fallback since category doesn't exist
        return String(newsletterObj.status || '').toLowerCase() === categoryParam.toLowerCase();
      });
    }
    
    if (params.sent !== undefined) {
      const isSent = params.sent === 'sent' || params.sent === 'true';
      filteredNewsletters = filteredNewsletters.filter((newsletter: unknown) => {
        const newsletterObj = newsletter as Record<string, unknown>;
        return isSent ? !!newsletterObj.sentAt : !newsletterObj.sentAt;
      });
    }
    
    if (params.dateFrom) {
      const dateFromParam = String(params.dateFrom);
      const fromDate = new Date(dateFromParam).getTime();
      if (!isNaN(fromDate)) {
        filteredNewsletters = filteredNewsletters.filter((newsletter: unknown) => {
          const newsletterObj = newsletter as Record<string, unknown>;
          const sentAt = newsletterObj.sentAt || newsletterObj.createdAt || 0;
          const newsDate = new Date(String(sentAt)).getTime();
          return newsDate >= fromDate;
        });
      }
    }
    
    if (params.dateTo) {
      const dateToParam = String(params.dateTo);
      const toDate = new Date(dateToParam).getTime();
      if (!isNaN(toDate)) {
        filteredNewsletters = filteredNewsletters.filter((newsletter: unknown) => {
          const newsletterObj = newsletter as Record<string, unknown>;
          const sentAt = newsletterObj.sentAt || newsletterObj.createdAt || 0;
          const newsDate = new Date(String(sentAt)).getTime();
          return newsDate <= toDate;
        });
      }
    }
    
    if (params.minOpenRate !== undefined) {
      const minOpenRateParam = String(params.minOpenRate);
      const minOpenRate = parseInt(minOpenRateParam);
      if (!isNaN(minOpenRate)) {
        filteredNewsletters = filteredNewsletters.filter((newsletter: unknown) => {
          const newsletterObj = newsletter as Record<string, unknown>;
          // Use a metric like 'viewCount' or 'readCount' if available as fallback
          const metrics = newsletterObj.metrics as Record<string, unknown> || {};
          const openRate = Number(metrics.openRate || newsletterObj.openRate || 0);
          return openRate >= minOpenRate;
        });
      }
    }
    
    if (params.maxOpenRate !== undefined) {
      const maxOpenRateParam = String(params.maxOpenRate);
      const maxOpenRate = parseInt(maxOpenRateParam);
      if (!isNaN(maxOpenRate)) {
        filteredNewsletters = filteredNewsletters.filter((newsletter: unknown) => {
          const newsletterObj = newsletter as Record<string, unknown>;
          // Use a metric like 'viewCount' or 'readCount' if available as fallback
          const metrics = newsletterObj.metrics as Record<string, unknown> || {};
          const openRate = Number(metrics.openRate || newsletterObj.openRate || 0);
          return openRate <= maxOpenRate;
        });
      }
    }
    
    // Sort newsletters based on parameters
    if (params.sort) {
      switch (params.sort) {
        case 'newest':
          filteredNewsletters.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            const aDate = new Date(String(bObj.sentAt || bObj.createdAt || 0)).getTime();
            const bDate = new Date(String(aObj.sentAt || aObj.createdAt || 0)).getTime();
            return aDate - bDate;
          });
          break;
        case 'oldest':
          filteredNewsletters.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            const aDate = new Date(String(aObj.sentAt || aObj.createdAt || 0)).getTime();
            const bDate = new Date(String(bObj.sentAt || bObj.createdAt || 0)).getTime();
            return aDate - bDate;
          });
          break;
        case 'most-opened':
          filteredNewsletters.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            // Use metrics as fallback
            const aMetrics = aObj.metrics as Record<string, unknown> || {};
            const bMetrics = bObj.metrics as Record<string, unknown> || {};
            const aOpenRate = Number(bMetrics.openRate || bObj.openRate || 0);
            const bOpenRate = Number(aMetrics.openRate || aObj.openRate || 0);
            return aOpenRate - bOpenRate;
          });
          break;
        case 'most-clicked':
          filteredNewsletters.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            // Use metrics as fallback
            const aMetrics = aObj.metrics as Record<string, unknown> || {};
            const bMetrics = bObj.metrics as Record<string, unknown> || {};
            const aClickRate = Number(bMetrics.clickRate || bObj.clickRate || 0);
            const bClickRate = Number(aMetrics.clickRate || aObj.clickRate || 0);
            return aClickRate - bClickRate;
          });
          break;
        default:
          break;
      }
    }
    
    // Return limited results
    return filteredNewsletters.slice(0, limit);
  } catch (error) {
    logger.error('Error searching newsletters:', error);
    return [];
  }
}

/**
 * Search for community suggestions
 */
async function searchCommunitySuggestions(query: string, limit: number, params: Record<string, unknown> = {}): Promise<unknown[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get all community suggestions from storage with fallback if method doesn't exist
    let suggestions: unknown[] = [];
    try {
      // Use type assertion with storage as unknown first to avoid TypeScript errors
      const dynamicStorage = storage as unknown as {
        getAllCommunitySuggestions?: () => Promise<unknown[]>;
        getAllSuggestions?: () => Promise<unknown[]>;
      };
      
      // Check if the method exists
      if (typeof dynamicStorage.getAllCommunitySuggestions === 'function') {
        suggestions = await dynamicStorage.getAllCommunitySuggestions();
      } else if (typeof dynamicStorage.getAllSuggestions === 'function') {
        // Try alternate function name
        suggestions = await dynamicStorage.getAllSuggestions();
      } else {
        // Fallback to empty array with log message
        logger.warn('Community suggestions storage method not found');
      }
    } catch (error: unknown) {
      logger.error('Error retrieving community suggestions:', error);
      // Continue with empty array
    }
    
    // Filter suggestions by search terms
    let filteredSuggestions = suggestions.filter((suggestion: unknown) => {
      // Check if suggestion matches search terms
      const suggestionObj = suggestion as Record<string, unknown>;
      const title = (String(suggestionObj.title || '')).toLowerCase();
      const description = (String(suggestionObj.description || '')).toLowerCase();
      const category = (String(suggestionObj.category || '')).toLowerCase();
      const status = (String(suggestionObj.status || '')).toLowerCase();
      
      // Match any term against suggestion data
      return searchTerms.some(term => 
        title.includes(term) || 
        description.includes(term) || 
        category.includes(term) ||
        status.includes(term)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.category && params.category !== 'all') {
      const categoryParam = String(params.category);
      filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
        const suggestionObj = suggestion as Record<string, unknown>;
        return suggestionObj.category && String(suggestionObj.category).toLowerCase() === categoryParam.toLowerCase();
      });
    }
    
    if (params.status && params.status !== 'all') {
      const statusParam = String(params.status);
      filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
        const suggestionObj = suggestion as Record<string, unknown>;
        return suggestionObj.status && String(suggestionObj.status).toLowerCase() === statusParam.toLowerCase();
      });
    }
    
    if (params.dateFrom) {
      const dateFromParam = String(params.dateFrom);
      const fromDate = new Date(dateFromParam).getTime();
      if (!isNaN(fromDate)) {
        filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
          const suggestionObj = suggestion as Record<string, unknown>;
          const createdAt = suggestionObj.createdAt || '1970-01-01';
          const sugDate = new Date(String(createdAt)).getTime();
          return sugDate >= fromDate;
        });
      }
    }
    
    if (params.dateTo) {
      const dateToParam = String(params.dateTo);
      const toDate = new Date(dateToParam).getTime();
      if (!isNaN(toDate)) {
        filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
          const suggestionObj = suggestion as Record<string, unknown>;
          const createdAt = suggestionObj.createdAt || '1970-01-01';
          const sugDate = new Date(String(createdAt)).getTime();
          return sugDate <= toDate;
        });
      }
    }
    
    if (params.hideImplemented === 'true') {
      filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
        const suggestionObj = suggestion as Record<string, unknown>;
        return String(suggestionObj.status) !== 'completed';
      });
    }
    
    if (params.hideDeclined === 'true') {
      filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
        const suggestionObj = suggestion as Record<string, unknown>;
        return String(suggestionObj.status) !== 'declined';
      });
    }
    
    if (params.minVotes !== undefined) {
      const minVotesParam = String(params.minVotes);
      const minVotes = parseInt(minVotesParam);
      if (!isNaN(minVotes)) {
        filteredSuggestions = filteredSuggestions.filter((suggestion: unknown) => {
          const suggestionObj = suggestion as Record<string, unknown>;
          const votesCount = Number(suggestionObj.votesCount || 0);
          return votesCount >= minVotes;
        });
      }
    }
    
    // Sort suggestions based on parameters
    if (params.sort) {
      switch (params.sort) {
        case 'most-votes':
          filteredSuggestions.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            return Number(bObj.votesCount || 0) - Number(aObj.votesCount || 0);
          });
          break;
        case 'newest':
          filteredSuggestions.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            return new Date(String(bObj.createdAt || '1970-01-01')).getTime() - 
                   new Date(String(aObj.createdAt || '1970-01-01')).getTime();
          });
          break;
        case 'oldest':
          filteredSuggestions.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            return new Date(String(aObj.createdAt || '1970-01-01')).getTime() - 
                   new Date(String(bObj.createdAt || '1970-01-01')).getTime();
          });
          break;
        case 'most-comments':
          filteredSuggestions.sort((a: unknown, b: unknown) => {
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            return Number(bObj.commentsCount || 0) - Number(aObj.commentsCount || 0);
          });
          break;
        default:
          break;
      }
    }
    
    // Return limited results
    return filteredSuggestions.slice(0, limit);
  } catch (error) {
    logger.error('Error searching community suggestions:', error);
    return [];
  }
}

export default router;