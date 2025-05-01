/**
 * Admin Content Management API Routes
 * 
 * Provides endpoints for managing blog posts, comments, and other content
 */
import express from 'express';
import { db } from '../../db';
import { storage } from '../../storage';
import { posts, comments, users, contentItems, contentHistory } from '../../../shared/schema';
import { eq, and, desc, asc, sql, like } from 'drizzle-orm';

const router = express.Router();

// Authentication middleware for admin-only access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // @ts-ignore: User role property should exist
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  
  next();
};

/**
 * GET /api/admin/posts
 * 
 * Retrieve all blog posts with pagination and filtering
 */
router.get('/posts', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const published = req.query.published ? req.query.published === 'true' : undefined;
    const approved = req.query.approved ? req.query.approved === 'true' : undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    
    // Build the query
    let query = db.select({
      ...posts,
      authorName: users.username
    }).from(posts)
      .leftJoin(users, eq(posts.authorId, users.id));
    
    // Apply filters
    if (published !== undefined) {
      query = query.where(eq(posts.published, published));
    }
    
    if (approved !== undefined) {
      query = query.where(eq(posts.approved, approved));
    }
    
    if (category) {
      query = query.where(eq(posts.category, category));
    }
    
    if (search) {
      query = query.where(
        sql`lower(${posts.title}) LIKE lower(${'%' + search + '%'}) OR 
            lower(${posts.content}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(() => {
        const conditions = [];
        if (published !== undefined) conditions.push(eq(posts.published, published));
        if (approved !== undefined) conditions.push(eq(posts.approved, approved));
        if (category) conditions.push(eq(posts.category, category));
        if (search) {
          conditions.push(
            sql`lower(${posts.title}) LIKE lower(${'%' + search + '%'}) OR 
                lower(${posts.content}) LIKE lower(${'%' + search + '%'})`
          );
        }
        return conditions.length > 0 ? sql.and(...conditions) : undefined;
      });
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(posts.createdAt));
    } else if (sortField === 'title') {
      query = query.orderBy(sortOrder(posts.title));
    } else if (sortField === 'author') {
      query = query.orderBy(sortOrder(users.username));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const postsList = await query;
    
    // Return posts with pagination metadata
    res.json({
      posts: postsList,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/admin/posts/:id
 * 
 * Retrieve a specific post by ID
 */
router.get('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Get comments for this post
    const postComments = await storage.getCommentsByPostId(postId);
    
    // Return the post with its comments
    res.json({
      ...post,
      comments: postComments
    });
  } catch (error) {
    console.error(`Error fetching post with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * PUT /api/admin/posts/:id/approve
 * 
 * Approve or reject a post
 */
router.put('/posts/:id/approve', requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { approved } = req.body;
    
    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved field must be a boolean' });
    }
    
    // Update the post
    const [updatedPost] = await db
      .update(posts)
      .set({ 
        approved,
        updatedAt: new Date()
      })
      .where(eq(posts.id, postId))
      .returning();
    
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error(`Error updating approval status for post with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update post approval status' });
  }
});

/**
 * GET /api/admin/comments
 * 
 * Retrieve all comments with pagination and filtering
 */
router.get('/comments', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const approved = req.query.approved ? req.query.approved === 'true' : undefined;
    const postId = req.query.postId ? parseInt(req.query.postId as string) : undefined;
    const search = req.query.search as string | undefined;
    
    // Build the query
    let query = db.select({
      ...comments,
      authorName: users.username,
      postTitle: posts.title
    }).from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .leftJoin(posts, eq(comments.postId, posts.id));
    
    // Apply filters
    if (approved !== undefined) {
      query = query.where(eq(comments.approved, approved));
    }
    
    if (postId !== undefined) {
      query = query.where(eq(comments.postId, postId));
    }
    
    if (search) {
      query = query.where(
        sql`lower(${comments.content}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(() => {
        const conditions = [];
        if (approved !== undefined) conditions.push(eq(comments.approved, approved));
        if (postId !== undefined) conditions.push(eq(comments.postId, postId));
        if (search) {
          conditions.push(
            sql`lower(${comments.content}) LIKE lower(${'%' + search + '%'})`
          );
        }
        return conditions.length > 0 ? sql.and(...conditions) : undefined;
      });
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(comments.createdAt));
    } else if (sortField === 'author') {
      query = query.orderBy(sortOrder(users.username));
    } else if (sortField === 'post') {
      query = query.orderBy(sortOrder(posts.title));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const commentsList = await query;
    
    // Return comments with pagination metadata
    res.json({
      comments: commentsList,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * PUT /api/admin/comments/:id/approve
 * 
 * Approve or reject a comment
 */
router.put('/comments/:id/approve', requireAdmin, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { approved } = req.body;
    
    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved field must be a boolean' });
    }
    
    // Update the comment
    const [updatedComment] = await db
      .update(comments)
      .set({ 
        approved,
        updatedAt: new Date()
      })
      .where(eq(comments.id, commentId))
      .returning();
    
    if (!updatedComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json(updatedComment);
  } catch (error) {
    console.error(`Error updating approval status for comment with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update comment approval status' });
  }
});

/**
 * DELETE /api/admin/comments/:id
 * 
 * Delete a comment
 */
router.delete('/comments/:id', requireAdmin, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    
    // Delete the comment
    await db.delete(comments).where(eq(comments.id, commentId));
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(`Error deleting comment with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

/**
 * GET /api/admin/content
 * 
 * Retrieve all content items with pagination and filtering
 */
router.get('/content', requireAdmin, async (req, res) => {
  try {
    const contentItems = await storage.getAllContentItems();
    res.json(contentItems);
  } catch (error) {
    console.error('Error fetching content items:', error);
    res.status(500).json({ error: 'Failed to fetch content items' });
  }
});

/**
 * POST /api/admin/content
 * 
 * Create a new content item
 */
router.post('/content', requireAdmin, async (req, res) => {
  try {
    const contentItem = req.body;
    
    // @ts-ignore: User ID property should exist
    const createdBy = req.user.id;
    
    // Add creator information
    contentItem.createdBy = createdBy;
    
    const newContentItem = await storage.createContentItem(contentItem);
    res.status(201).json(newContentItem);
  } catch (error) {
    console.error('Error creating content item:', error);
    res.status(500).json({ error: 'Failed to create content item' });
  }
});

/**
 * GET /api/admin/content/:id
 * 
 * Retrieve a specific content item
 */
router.get('/content/:id', requireAdmin, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const contentItem = await storage.getContentItemById(contentId);
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    
    // Get version history for this content item
    const contentHistory = await storage.getContentHistory(contentId);
    
    // Return the content item with its version history
    res.json({
      ...contentItem,
      history: contentHistory
    });
  } catch (error) {
    console.error(`Error fetching content item with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch content item' });
  }
});

/**
 * PUT /api/admin/content/:id
 * 
 * Update a content item
 */
router.put('/content/:id', requireAdmin, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const contentUpdates = req.body;
    
    // Check if content item exists
    const existingItem = await storage.getContentItemById(contentId);
    
    if (!existingItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    
    // @ts-ignore: User ID property should exist
    const updatedBy = req.user.id;
    
    // Add updater information
    contentUpdates.updatedBy = updatedBy;
    contentUpdates.id = contentId;
    
    const updatedContent = await storage.updateContentItem(contentUpdates);
    
    // Create new version in content history
    await storage.createContentVersion(
      contentId,
      (existingItem.version || 0) + 1,
      updatedBy,
      contentUpdates.changeDescription || 'Content updated'
    );
    
    res.json(updatedContent);
  } catch (error) {
    console.error(`Error updating content item with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update content item' });
  }
});

/**
 * POST /api/admin/comments/export
 * 
 * Export comments to CSV
 */
router.post('/comments/export', requireAdmin, async (req, res) => {
  try {
    // Get all comments with related data
    const allComments = await db.select({
      id: comments.id,
      postId: comments.postId,
      postTitle: posts.title,
      authorId: comments.authorId,
      authorName: users.username,
      content: comments.content,
      approved: comments.approved,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt
    }).from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .leftJoin(posts, eq(comments.postId, posts.id));
    
    // Create CSV header
    const header = ['ID', 'Post ID', 'Post Title', 'Author ID', 'Author', 'Content', 'Approved', 'Created At', 'Updated At'];
    
    // Create CSV rows
    const rows = allComments.map(comment => [
      comment.id,
      comment.postId,
      comment.postTitle || '',
      comment.authorId,
      comment.authorName || '',
      // Escape any commas in the content
      `"${comment.content.replace(/"/g, '""')}"`,
      comment.approved ? 'true' : 'false',
      comment.createdAt ? new Date(comment.createdAt).toISOString() : '',
      comment.updatedAt ? new Date(comment.updatedAt).toISOString() : ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=comments.csv');
    
    // Return CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting comments:', error);
    res.status(500).json({ error: 'Failed to export comments' });
  }
});

/**
 * POST /api/admin/posts/export
 * 
 * Export posts to CSV
 */
router.post('/posts/export', requireAdmin, async (req, res) => {
  try {
    // Get all posts with related data
    const allPosts = await db.select({
      id: posts.id,
      title: posts.title,
      authorId: posts.authorId,
      authorName: users.username,
      category: posts.category,
      slug: posts.slug,
      published: posts.published,
      approved: posts.approved,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt
    }).from(posts)
      .leftJoin(users, eq(posts.authorId, users.id));
    
    // Create CSV header
    const header = ['ID', 'Title', 'Author ID', 'Author', 'Category', 'Slug', 'Published', 'Approved', 'Created At', 'Updated At'];
    
    // Create CSV rows
    const rows = allPosts.map(post => [
      post.id,
      // Escape any commas in the title
      `"${post.title.replace(/"/g, '""')}"`,
      post.authorId,
      post.authorName || '',
      post.category || '',
      post.slug,
      post.published ? 'true' : 'false',
      post.approved ? 'true' : 'false',
      post.createdAt ? new Date(post.createdAt).toISOString() : '',
      post.updatedAt ? new Date(post.updatedAt).toISOString() : ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=posts.csv');
    
    // Return CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting posts:', error);
    res.status(500).json({ error: 'Failed to export posts' });
  }
});

export default router;