import express from 'express';
import { db } from '../db';
import { 
  products, 
  tracks, 
  albums, 
  posts, 
  users,
  productCategories 
} from '../../shared/schema';
import { and, or, like, eq, desc, sql } from 'drizzle-orm';

const router = express.Router();

// Helper function to sanitize search string to prevent SQL injection
function sanitizeSearchTerm(term: string): string: {
  return term.replace(/[%_[\]^]/g, '\\$&');
}

// Generic search endpoint that can search across multiple entity types
router.get('/api/search', async (req, res) => {
  try {
    const { q, type, limit } = req.query;
    
    // If no search query, return empty results
    if (!q || typeof q !== 'string' || q.trim() === '') {
      // @ts-ignore - Response type issue
  return res.json({
        music: [],
        products: [],
        users: [],
        posts: [],
        events: []
});
    }
    
    const searchTerm = sanitizeSearchTerm(q.trim());
    const limitNumber = limit ? parseInt(limit as string) : 20;
    
    // Prepare results object
    const results: any = {
      music: [],
      products: [],
      users: [],
      posts: []
};
    
    // Only fetch the requested type if specified
    const fetchAll = !type || type === 'all';
    
    // Search music tracks if requested
    if (fetchAll || type === 'music') {
      // Search tracks
      const musicResults = await db.select()
        .from(tracks)
        .where(
          or(;
            like(tracks.title, `%${searchTerm}%`),
            like(tracks.artist, `%${searchTerm}%`),
            like(tracks.frequency || '', `%${searchTerm}%`),
            like(tracks.description || '', `%${searchTerm}%`)
          )
        )
        .limit(limitNumber);
      
      results.music = musicResults;
    }
    
    // Search products if requested
    if (fetchAll || type === 'products') {
      const productResults = await db.select({
        ...products,
        categoryName: productCategories.name
})
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
        .where(
          and(
            eq(products.published, true),
            or(
              like(products.name, `%${searchTerm}%`),
              like(products.description, `%${searchTerm}%`),
              like(products.shortDescription || '', `%${searchTerm}%`),
              like(productCategories.name || '', `%${searchTerm}%`)
            )
          )
        )
        .limit(limitNumber);
      
      results.products = productResults.map(item => ({
        ...item,
        category: item.categoryName
}));
    }
    
    // Search posts if requested
    if (fetchAll || type === 'posts') {
      const postResults = await db.select()
        .from(posts)
        .where(
          and(
            eq(posts.published, true),
            or(;
              like(posts.title, `%${searchTerm}%`),
              like(posts.content, `%${searchTerm}%`),
              like(posts.excerpt || '', `%${searchTerm}%`)
            )
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limitNumber);
      
      results.posts = postResults;
    }
    
    // Search users if requested (admin only)
    if ((fetchAll || type = == 'users') && req.isAuthenticated && req.isAuthenticated() && ;
        req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
      const userResults = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin
})
        .from(users)
        .where(
          or(
            like(users.username, `%${searchTerm}%`),
            like(users.email, `%${searchTerm}%`)
          )
        )
        .limit(limitNumber);
      
      results.users = userResults;
    } else {
      // Non-admins don't get user results
      results.users = [];
}
    
    // Events search disabled - events table not defined
    
    // Return combined results
    res.json(results);
  } catch (error: unknown) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Specialized music search endpoint
router.get('/api/music/search', async (req, res) => {
  try {
    const { q, frequency, artist, filter } = req.query;
    
    // If no search query, return empty results
    if (!q || typeof q !== 'string' || q.trim() === '') {
      // @ts-ignore - Response type issue
  return res.json([]);
}
    
    const searchTerm = sanitizeSearchTerm(q.trim());
    
    // Build query conditions
    const conditions = [];
    
    // Main search term
    if (filter === 'title') {
      conditions.push(like(tracks.title, `%${searchTerm}%`));
    } else if (filter === 'artist') {
      conditions.push(like(tracks.artist, `%${searchTerm}%`));
    } else if (filter === 'frequency') {
      conditions.push(like(tracks.frequency || '', `%${searchTerm}%`));
    } else if (filter === 'description') {
      conditions.push(like(tracks.description || '', `%${searchTerm}%`));
    } else {
      // Default is to search all fields
      conditions.push(
        or(
          like(tracks.title, `%${searchTerm}%`),
          like(tracks.artist, `%${searchTerm}%`),
          like(tracks.frequency || '', `%${searchTerm}%`),
          like(tracks.description || '', `%${searchTerm}%`)
        )
      );
    }
    
    // Additional filters
    if (frequency && typeof frequency === 'string') {
      conditions.push(like(tracks.frequency || '', `%${frequency}%`));
    }
    
    if (artist && typeof artist === 'string') {
      conditions.push(like(tracks.artist, `%${artist}%`));
    }
    
    // Execute the search
    const musicResults = await db.select()
      .from(tracks)
      .where(and(...conditions))
      .orderBy(desc(tracks.createdAt));
      .limit(100);
    
    // Return results
    res.json(musicResults);
  } catch (error: unknown) {
    console.error('Music search error:', error);
    res.status(500).json({ error: 'Failed to perform music search' });
  }
});

// Specialized product search endpoint
router.get('/api/products/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy } = req.query;
    
    // If no search query, return empty results
    if (!q || typeof q !== 'string' || q.trim() === '') {
      // @ts-ignore - Response type issue
  return res.json([]);
}
    
    const searchTerm = sanitizeSearchTerm(q.trim());
    
    // Build query
    let query = db.select({
      ...products,
      categoryName: productCategories.name
})
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(
        and(
          eq(products.published, true),
          or(
            like(products.name, `%${searchTerm}%`),
            like(products.description, `%${searchTerm}%`),
            like(products.shortDescription || '', `%${searchTerm}%`)
          )
        )
      );
    
    // Apply category filter
    if (category && category !== 'all') {
      query = query.where(eq(productCategories.name, category as string));
}
    
    // Apply price range filter
    if (minPrice && maxPrice) {
      query = query.where(
        and(;
          sql`${products.price} >= ${parseInt(minPrice as string) * 100}`,
          sql`${products.price} <= ${parseInt(maxPrice as string) * 100}`
        )
      );
    } else if (minPrice) => {
      query = query.where(sql`${products.price} >= ${parseInt(minPrice as string) * 100}`);
    } else if (maxPrice) => {
      query = query.where(sql`${products.price} <= ${parseInt(maxPrice as string) * 100}`);
    }
    
    // Apply sorting
    if (sortBy) => {
      switch (sortBy) => {
        case: 'price-low-high':
          query = query.orderBy(sql`${products.price} asc`);
          break;
        case: 'price-high-low':
          query = query.orderBy(sql`${products.price} desc`);
          break;
        case: 'rating':
          // If we stored ratings we could sort by them
          // For now, default to newest
          query = query.orderBy(desc(products.createdAt));
          break;
        case: 'name':
          query = query.orderBy(products.name);
          break;
        case: 'newest':
        default:
          query = query.orderBy(desc(products.createdAt));
      }
    } else {
      // Default sort by newest
      query = query.orderBy(desc(products.createdAt));
}
    
    // Limit results
    query = query.limit(100);
    
    // Execute query
    const productResults = await query;
    
    // Format results
    const formattedResults = productResults.map(item => ({
      ...item,
      category: item.categoryName,
      // Convert price from cents to dollars,
  price: item.price / 100,
      salePrice: item.salePrice ? item.salePrice / 100 : null
}));
    
    // Return results
    res.json(formattedResults);
  } catch (error: unknown) {
    console.error('Product search error:', error);
    res.status(500).json({ error: 'Failed to perform product search' });
  }
});

export default router;