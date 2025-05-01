import express from 'express';
import { db } from '../../db';
import { posts, users, insertPostSchema, type InsertPost } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Extend the insert post schema with additional validation for admin interface
const postSchema = insertPostSchema.extend({
  meta_description: z.string().max(160).optional(),
  tags: z.array(z.string()).optional(),
  publish_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
});

// POST: Create a new post
router.post('/', async (req, res) => {
  try {
    // Authentication check
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate post data
    const validationResult = postSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid post data', 
        errors: validationResult.error.format() 
      });
    }

    const postData = validationResult.data;
    
    // Add user and date info
    const now = new Date();
    const newPost = {
      ...postData,
      authorId: req.user.id.toString()
    };

    // Insert post into database
    const [createdPost] = await db.insert(posts).values(newPost).returning();
    
    return res.status(201).json(createdPost);
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Failed to create post' });
  }
});

// GET: Get all posts
router.get('/', async (req, res) => {
  try {
    // Fetch all posts from database
    const allPosts = await db.select().from(posts).orderBy(desc(posts.id));
    
    return res.status(200).json(allPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// GET: Get a specific post by ID
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    // Fetch post from database
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    return res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ message: 'Failed to fetch post' });
  }
});

// PUT: Update a post
router.put('/:id', async (req, res) => {
  try {
    // Authentication check
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    // Validate post data
    const validationResult = postSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid post data', 
        errors: validationResult.error.format() 
      });
    }
    
    const postData = validationResult.data;
    
    // Check if post exists
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, postId));
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is authorized to update this post
    if (existingPost.authorId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - You cannot update posts created by other users' });
    }
    
    // Update post
    const updatedPostData = {
      ...postData
    };
    
    const [updatedPost] = await db
      .update(posts)
      .set(updatedPostData)
      .where(eq(posts.id, postId))
      .returning();
    
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ message: 'Failed to update post' });
  }
});

// PATCH: Update post status
router.patch('/:id', async (req, res) => {
  try {
    // Authentication check
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    // Basic validation for status fields
    const statusSchema = z.object({
      published: z.boolean().optional(),
      approved: z.boolean().optional(),
    });
    
    const validationResult = statusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid status data', 
        errors: validationResult.error.format() 
      });
    }
    
    const statusData = validationResult.data;
    
    // Check if post exists
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, postId));
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Only admin or post author can change published status
    // Only admin can change approved status
    if (
      (statusData.published !== undefined && 
        existingPost.authorId !== req.user.id.toString() && 
        req.user.role !== 'admin') ||
      (statusData.approved !== undefined && req.user.role !== 'admin')
    ) {
      return res.status(403).json({ message: 'Forbidden - You do not have permission to update this post status' });
    }
    
    // Update status fields
    const updateData = {
      ...statusData
    };
    
    const [updatedPost] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .returning();
    
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating post status:', error);
    return res.status(500).json({ message: 'Failed to update post status' });
  }
});

// DELETE: Delete a post
router.delete('/:id', async (req, res) => {
  try {
    // Authentication check
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    // Check if post exists
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, postId));
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is authorized to delete this post
    if (existingPost.authorId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - You cannot delete posts created by other users' });
    }
    
    // Delete post
    await db.delete(posts).where(eq(posts.id, postId));
    
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
});

export default router;