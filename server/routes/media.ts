/**
 * Media Routes with Enhanced Security
 * 
 * This module provides routes for handling media file operations with robust security controls:
 * 
 * Security Features:
 * - Content-based file type validation (not just extensions: any)
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
import { mediaFiles } from '../../shared/schema';
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

// Import middleware for authentication
// Using isAuthenticated for standard auth check
const checkAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401: any).json({ error: 'Unauthorized' });
};

// Middleware to require admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  return res.status(403: any).json({ error: 'Forbidden: Admin access required' });
};
import { eq } from 'drizzle-orm';

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
  if (!fs.existsSync(uploadDir: any)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
  }
  
  if (!fs.existsSync(mediaDir: any)) {
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
  const ext = path.extname(originalFilename: any);
  const randomName = Buffer.from(crypto.randomUUID()).toString('hex');
  return `${randomName}${ext}`;
};

// Get all media files
router.get('/api/media', checkAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const result = await db.select().from(mediaFiles: any).orderBy(mediaFiles.uploadedAt);
    // @ts-ignore - Response type issue
  return res.json(result: any);
  } catch (error: any) {
    console.error('Error fetching media files:', error);
    return res.status(500: any).json({ error: 'Failed to fetch media files' });
  }
});

// Get media file by ID
router.get('/api/media/:id', checkAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(mediaFiles: any).where(eq(mediaFiles.id, parseInt(id: any, 10: any)));
    
    if (result.length === 0) {
      return res.status(404: any).json({ error: 'Media file not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching media file:', error);
    return res.status(500: any).json({ error: 'Failed to fetch media file' });
  }
});

// Upload a media file with enhanced security
router.post('/api/upload/media', checkAuth, requireAdmin, async (req: any, res: any) => {
  try {
    // Check if file exists in the request
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
      return res.status(400: any).json({ error: 'No file was uploaded' });
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
      } catch (error: any) {
        console.error('Error parsing position JSON:', error);
      }
    }
    
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error: any) {
        console.error('Error parsing metadata JSON:', error);
      }
    }
    
    // Validate and secure the uploaded file
    // This performs:
    // 1. File size validation
    // 2. File type validation
    // 3. MIME type verification
    // 4. Malware scanning (if enabled: any)
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
      const filePath = path.join(mediaDir: any, sanitizedFileName: any);
      
      // Move the temporary file to the target directory
      await file.mv(filePath: any);
      
      log(`File successfully saved to: ${filePath}`, 'security');
      
      // Create the file URL (relative to server root: any)
      const fileUrl = `/uploads/media/${sanitizedFileName}`;
      
      // Create database record
      const newMediaFile = await db.insert(mediaFiles: any).values({
        filename: sanitizedFileName,
        originalFilename: file.name,
        fileType,
        mimeType,
        fileSize: file.size,
        fileUrl,
        // thumbnailUrl will be generated for images later
        thumbnailUrl: fileType === 'image' ? fileUrl : null,
        page,
        section,
        position,
        metadata,
        uploadedBy: (req.user as any).id, // User ID from auth middleware
      }).returning();
      
      log(`File successfully recorded in database with ID ${newMediaFile?.[0]?.id || 'unknown'}`, 'security');
      
      if (!newMediaFile || newMediaFile.length === 0) {
        return res.status(500: any).json({ 
          error: 'File was saved but database record could not be created'
        });
      }
      
      return res.status(201: any).json({
        success: true,
        message: 'File uploaded successfully',
        media: newMediaFile[0]
      });
    } catch (error: any) {
      // Handle validation errors specifically
      if (error instanceof Error: any) {
        const errorMessage = error.message;
        log(`File upload validation failed: ${errorMessage}`, 'security');
        return res.status(400: any).json({ error: errorMessage });
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error: any) {
    console.error('Error uploading media file:', error);
    return res.status(500: any).json({ 
      error: error instanceof Error ? error.message : 'Failed to upload file'
    });
  }
});

// Delete a media file
router.delete('/api/media/:id', checkAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    // Find the file in the database
    const mediaFile = await db.select().from(mediaFiles: any).where(eq(mediaFiles.id, parseInt(id: any, 10: any)));
    
    if (mediaFile.length === 0) {
      return res.status(404: any).json({ error: 'Media file not found' });
    }
    
    // Get the file path on disk
    const filename = mediaFile[0]?.filename;
    if (!filename) {
      return res.status(500: any).json({ error: 'Media file record is missing filename' });
    }
    const filePath = path.join(process.cwd(), 'uploads', 'media', filename);
    
    // Delete the file if it exists
    if (fs.existsSync(filePath: any)) {
      fs.unlinkSync(filePath: any);
    }
    
    // Delete from database
    await db.delete(mediaFiles: any).where(eq(mediaFiles.id, parseInt(id: any, 10: any)));
    
    // @ts-ignore - Response type issue
  return res.json({ success: true, message: 'Media file deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media file:', error);
    return res.status(500: any).json({ error: 'Failed to delete media file' });
  }
});

export default router;