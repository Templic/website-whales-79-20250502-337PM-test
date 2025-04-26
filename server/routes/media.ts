/**
 * Media Routes with Enhanced Security
 * 
 * This module provides routes for handling media file operations with robust security controls:
 * 
 * Security Features:
 * - Content-based file type validation (not just extensions)
 * - Secure random filename generation to prevent path traversal attacks
 * - MIME type verification using file content analysis
 * - File size validation
 * - Comprehensive error handling and logging
 * - Protection against malicious file uploads
 * - Null safety checks to prevent runtime errors
 * 
 * All file uploads are verified using the fileUploadSecurity module, which implements
 * best practices for secure file handling in web applications.
 */

import express from 'express';
import { db } from '../db';
import { pgTable, serial, text, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import { 
  validateUploadedFile, 
  sanitizeFileName, 
  initFileUploadSecurity 
} from '../security/fileUploadSecurity';
import { log } from '../vite';
import crypto from 'crypto';

// Define mediaFiles locally since it's not in shared/schema.ts
const mediaFiles = pgTable('media_files', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  uploadedBy: integer('uploaded_by'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  altText: text('alt_text')
});

// Import middleware for authentication
// Using isAuthenticated for standard auth check
const checkAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
};

// Initialize file upload security module
initFileUploadSecurity();

const router = express.Router();

// Set up file upload middleware with specific limits and configurations
router.use(fileUpload({
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'tmp'),
  debug: false,
}));

// Create the uploads directory if it doesn't exist
const ensureDirectoriesExist = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const mediaDir = path.join(uploadDir, 'media');
  
  // Create directories if they don't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
  }
  
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    console.log('Created media directory');
  }
  
  return { uploadDir, mediaDir };
};

// Ensure upload directories exist
ensureDirectoriesExist();

// Utility function to generate a random filename with the original extension
// Note: This function is used as a fallback but our new security module provides a more robust sanitizeFileName function
const generateFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename);
  const randomName = Buffer.from(crypto.randomUUID()).toString('hex');
  return `${randomName}${ext}`;
};

// Get all media files
router.get('/api/media', checkAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.select().from(mediaFiles).orderBy(mediaFiles.uploadedAt);
    // @ts-ignore - Response type issue
  return res.json(result);
  } catch (error) {
    console.error('Error fetching media files:', error);
    return res.status(500).json({ error: 'Failed to fetch media files' });
  }
});

// Get media file by ID
router.get('/api/media/:id', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(mediaFiles).where(eq(mediaFiles.id, parseInt(id, 10)));
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json(result[0]);
  } catch (error) {
    console.error('Error fetching media file:', error);
    return res.status(500).json({ error: 'Failed to fetch media file' });
  }
});

// Upload a media file with enhanced security
router.post('/api/upload/media', checkAuth, requireAdmin, async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    // Get the uploaded file
    const file = req.files.file as fileUpload.UploadedFile;
    
    // Get form fields
    const page = req.body.page || 'global';
    const section = req.body.section || 'default';
    
    // Process optional fields
    let position = undefined;
    let metadata = undefined;
    
    if (req.body.position) {
      try {
        position = JSON.parse(req.body.position);
      } catch (error) {
        console.error('Error parsing position JSON:', error);
      }
    }
    
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        console.error('Error parsing metadata JSON:', error);
      }
    }
    
    // Validate and secure the uploaded file
    // This performs:
    // 1. File size validation
    // 2. File type validation
    // 3. MIME type verification
    // 4. Malware scanning (if enabled)
    // 5. Filename sanitization
    log(`Validating uploaded file: ${file.name} (${file.size} bytes, ${file.mimetype})`, 'security');
    
    // Get allowed categories based on the page
    const allowedCategories: ('image' | 'video' | 'audio' | 'document' | 'other')[] = ['image', 'video', 'audio', 'document'];
    
    try {
      // Validate the file with our security module
      const { sanitizedFileName } = await validateUploadedFile(file, {
        allowedCategories: allowedCategories
      });
      
      // Determine file type from mime type
      const mimeType = file.mimetype || 'application/octet-stream';
      let fileType = 'other';
      
      if (mimeType.startsWith('image/')) {
        fileType = 'image';
      } else if (mimeType.startsWith('video/')) {
        fileType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        fileType = 'audio';
      } else if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) {
        fileType = 'document';
      }
      
      // Create full path with sanitized filename
      const { mediaDir } = ensureDirectoriesExist();
      const filePath = path.join(mediaDir, sanitizedFileName);
      
      // Move the temporary file to the target directory
      await file.mv(filePath);
      
      log(`File successfully saved to: ${filePath}`, 'security');
      
      // Create the file URL (relative to server root)
      const fileUrl = `/uploads/media/${sanitizedFileName}`;
      
      // Create database record
      const newMediaFile = await db.insert(mediaFiles).values({
        filename: sanitizedFileName,
        originalFilename: file.name,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        uploadedBy: (req.user as any).id, // User ID from auth middleware
        description: req.body.description || null,
        status: 'active',
        altText: req.body.altText || null
      }).returning();
      
      log(`File successfully recorded in database with ID ${newMediaFile?.[0]?.id || 'unknown'}`, 'security');
      
      if (!newMediaFile || newMediaFile.length === 0) {
        return res.status(500).json({ 
          error: 'File was saved but database record could not be created'
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        media: newMediaFile[0]
      });
    } catch (error) {
      // Handle validation errors specifically
      if (error instanceof Error) {
        const errorMessage = error.message;
        log(`File upload validation failed: ${errorMessage}`, 'security');
        return res.status(400).json({ error: errorMessage });
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Error uploading media file:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to upload file'
    });
  }
});

// Delete a media file
router.delete('/api/media/:id', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the file in the database
    const mediaFile = await db.select().from(mediaFiles).where(eq(mediaFiles.id, parseInt(id, 10)));
    
    if (mediaFile.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Get the file path on disk
    const filename = mediaFile[0]?.filename;
    if (!filename) {
      return res.status(500).json({ error: 'Media file record is missing filename' });
    }
    const filePath = path.join(process.cwd(), 'uploads', 'media', filename);
    
    // Delete the file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await db.delete(mediaFiles).where(eq(mediaFiles.id, parseInt(id, 10)));
    
    // @ts-ignore - Response type issue
  return res.json({ success: true, message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Error deleting media file:', error);
    return res.status(500).json({ error: 'Failed to delete media file' });
  }
});

export default router;