import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import fileUpload from 'express-fileupload';
import { insertSubscriberSchema, insertPostSchema, insertCommentSchema, insertCategorySchema } from "@shared/schema";
import { createTransport } from "nodemailer";
import { hashPassword } from "./auth";
import fs from 'fs';
import * as NodeClamModule from 'clamav.js';

// Configure express-fileupload middleware
const fileUploadMiddleware = fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true,
  safeFileNames: true,
  preserveExtension: true,
  abortOnLimit: true,
  uploadTimeout: 0, // Disable timeout
  createParentPath: true
});

// Secure filename sanitization using sanitize-filename package
import sanitizeFilename from 'sanitize-filename';
const secureFilename = (filename: string): string => {
  return sanitizeFilename(filename);
};

// Additional validation for uploaded files
const validateUploadedFile = (file: fileUpload.UploadedFile) => {
  // Check file size
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
  }

  // Validate mime type
  const allowedMimeTypes = new Set([
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac',
    'audio/wav', 'audio/aiff', 'video/avi', 'video/x-ms-wmv',
    'video/quicktime', 'video/mp4'
  ]);

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${Array.from(allowedMimeTypes).join(', ')}`);
  }

  return true;
};

// Initialize ClamAV scanner with detailed logging
const initClamAV = async () => {
  try {
    console.log('Initializing ClamAV scanner...');
    console.log('NodeClam module structure:', NodeClamModule);

    // The module exports an object with initialization methods
    const clamav = NodeClamModule.default;

    if (!clamav) {
      console.error('Failed to import ClamAV module');
      return null;
    }

    // Check if ClamAV binary exists
    const clamPath = '/nix/store/4s7jsmyxy0nn45qv0s32pbp8c6z05gnq-clamav-1.3.1/bin/clamscan';
    if (!fs.existsSync(clamPath)) {
      console.error(`ClamAV binary not found at ${clamPath}`);
      return null;
    }

    console.log('Configuring ClamAV scanner...');

    // Initialize scanner with configuration
    const scanner = await clamav.createScanner({
      removeInfected: true,
      quarantineInfected: false,
      scanLog: null,
      debugMode: true,
      fileList: null,
      scanRecursively: true,
      clamscan: {
        path: clamPath,
        db: null,
        scanArchives: true,
        active: true
      },
      preference: 'clamscan'
    });

    console.log('ClamAV scanner initialized successfully');
    return scanner;
  } catch (error) {
    console.error('Failed to initialize ClamAV:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    return null;
  }
};

export async function registerRoutes(app: express.Application): Promise<Server> {
  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'private_storage/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Initialize ClamAV scanner
  const clamAV = await initClamAV();

  // Apply file upload middleware with custom error handling
  app.use(fileUploadMiddleware);

  // Music upload route with virus scanning
  app.post("/api/upload/music", async (
    req: express.Request & { 
      files?: fileUpload.FileArray;
      user?: { id: number; role: string; }
      isAuthenticated(): boolean;
    },
    res: express.Response
  ) => {
    console.log('Processing music upload request...');

    try {
      // Authentication check
      if (!req.isAuthenticated() || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        console.error('Unauthorized upload attempt');
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get the uploaded file
      const uploadedFile = req.files?.file;
      if (!uploadedFile || Array.isArray(uploadedFile)) {
        console.error('No file in request or multiple files received');
        return res.status(400).json({ message: "No file uploaded or multiple files received" });
      }

      // Validate target page
      const targetPage = req.body.page;
      const allowedPages = ['new_music', 'music_archive', 'blog', 'home', 'about', 'newsletter'];

      if (!targetPage || !allowedPages.includes(targetPage)) {
        console.error(`Invalid target page: ${targetPage}`);
        return res.status(400).json({ message: "Invalid target page" });
      }

      // Validate the uploaded file
      try {
        validateUploadedFile(uploadedFile);
      } catch (validationError) {
        console.error('File validation error:', validationError);
        return res.status(400).json({ message: validationError instanceof Error ? validationError.message : 'File validation failed' });
      }

      console.log('Upload request details:', {
        filename: uploadedFile.name,
        size: uploadedFile.size,
        targetPage,
        tempFilePath: uploadedFile.tempFilePath,
        mimetype: uploadedFile.mimetype
      });

      // Virus scan using ClamAV
      let scanResult: { isInfected: boolean; viruses?: string[] } = { isInfected: false };

      if (clamAV) {
        try {
          console.log(`Scanning file for viruses: ${uploadedFile.tempFilePath}`);
          scanResult = await clamAV.isInfected(uploadedFile.tempFilePath);
          console.log('Scan result:', scanResult);

          if (scanResult.isInfected) {
            return res.status(400).json({
              message: "File is infected with malware",
              viruses: scanResult.viruses
            });
          }
        } catch (scanError) {
          console.error("ClamAV scan error:", scanError);
          // Log the error but continue with upload
        }
      } else {
        console.warn("ClamAV not available - skipping virus scan");
      }

      // Upload the file using storage interface
      const result = await storage.uploadMusic({
        file: {
          name: uploadedFile.name,
          size: uploadedFile.size,
          tempFilePath: uploadedFile.tempFilePath,
          mimetype: uploadedFile.mimetype
        },
        targetPage: targetPage,
        uploadedBy: req.user.id,
        userRole: req.user.role as 'admin' | 'super_admin'
      });

      console.log('Upload successful:', result);

      res.json({
        ...result,
        scanned: !!clamAV,
        clean: !scanResult.isInfected
      });
    } catch (error) {
      console.error("Error in music file upload:", error);
      res.status(500).json({
        message: "Failed to upload file",
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Secure file serving endpoint
  app.get('/media/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'private_storage/uploads', filename);

    // Validate the file path
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.join(process.cwd(), 'private_storage/uploads'))) {
      return res.status(403).json({ message: "Invalid file path" });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Get file stats for content length
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Get file extension and set content type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.mp4': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      '.wav': 'audio/wav',
      '.aiff': 'audio/aiff',
      '.avi': 'video/avi',
      '.wmv': 'video/x-ms-wmv',
      '.mov': 'video/quicktime'
    };

    const contentType = mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream';

    // Parse Range header
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      // Create read stream for the range
      const stream = fs.createReadStream(filePath, { start, end });

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Handle stream errors
      stream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming file" });
        }
      });

      // Pipe the stream to response
      stream.pipe(res);
    } else {
      // Set headers for full content
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Create read stream for entire file
      const stream = fs.createReadStream(filePath);

      // Handle stream errors
      stream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming file" });
        }
      });

      // Pipe the stream to response
      stream.pipe(res);
    }
  });
  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Existing subscriber route
  app.post("/api/subscribe", async (req, res) => {
    try {
      const data = insertSubscriberSchema.parse(req.body);
      const subscriber = await storage.createSubscriber(data);
      res.json(subscriber);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });

  // Blog post routes
  app.get("/api/posts", async (req, res) => {
    try {
      console.log("Fetching all posts...");
      const posts = await storage.getPosts();
      console.log(`Found ${posts.length} posts`);

      // Only return approved posts for non-admin users
      const filteredPosts = (!req.isAuthenticated() || req.user?.role === 'user')
        ? posts.filter(post => post.approved)
        : posts;

      res.json(filteredPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({
        message: "Error fetching posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/posts/unapproved", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const posts = await storage.getUnapprovedPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching unapproved posts" });
    }
  });

  app.post("/api/posts/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const post = await storage.approvePost(Number(req.params.id));
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Error approving post" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(Number(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      // Only allow viewing unapproved posts if user is admin
      if (!post.approved && (!req.isAuthenticated() || req.user?.role === 'user')) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const data = insertPostSchema.parse(req.body);
      const post = await storage.createPost(data);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid post data" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Comment routes
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const data = insertCommentSchema.parse({
        ...req.body,
        postId: Number(req.params.postId),
        approved: false  // All new comments start as unapproved
      });
      console.log("Creating comment with data:", data);
      const comment = await storage.createComment(data);
      console.log("Created comment:", comment);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(Number(req.params.postId));
      // Only return approved comments for non-admin users
      if (!req.isAuthenticated() || req.user?.role === 'user') {
        res.json(comments.filter(comment => comment.approved));
      } else {
        res.json(comments);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  app.get("/api/posts/comments/unapproved", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      console.log('Unauthorized access attempt to unapproved comments');
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      console.log("Fetching unapproved comments");
      const comments = await storage.getUnapprovedComments();
      console.log("Found unapproved comments:", comments);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching unapproved comments:", error);
      res.status(500).json({ message: "Error fetching unapproved comments" });
    }
  });

  app.post("/api/posts/comments/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const comment = await storage.approveComment(Number(req.params.id));
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Error approving comment" });
    }
  });

  app.post("/api/posts/comments/:id/reject", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const comment = await storage.rejectComment(Number(req.params.id));
      res.json(comment);
    } catch (error) {
      console.error("Error rejecting comment:", error);
      res.status(500).json({ message: "Error rejecting comment" });
    }
  });

  // Password recovery routes
  app.post("/api/recover-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: "If an account exists with this email, you will receive a recovery link." });
      }

      const token = await storage.createPasswordResetToken(user.id);
      const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Password Recovery",
        text: `Click this link to reset your password: ${resetLink}`,
        html: `
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
        `,
      });

      res.json({ message: "If an account exists with this email, you will receive a recovery link." });
    } catch (error) {
      console.error("Password recovery error:", error);
      res.status(500).json({ message: "Failed to process recovery request" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const user = await storage.validatePasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });


  // Music routes 
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getTracks();
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      res.status(500).json({
        message: "Error fetching tracks",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      res.json(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({
        message: "Error fetching albums",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete music endpoint
  app.delete("/api/tracks/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate CSRF token
    if (!req.csrfToken || req.get('CSRF-Token') !== req.csrfToken()) {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }

    try {
      const trackId = Number(req.params.id);
      await storage.deleteMusic(trackId, req.user.id, req.user.role as 'admin' | 'super_admin');
      res.json({ message: "Track deleted successfully" });
    } catch (error) {
      console.error("Error deleting track:", error);
      res.status(error.message === 'Track not found' ? 404 : 500)
        .json({ message: error.message || "Failed to delete track" });
    }
  });

  // Create HTTP server with the Express app
  const httpServer = createServer(app);
  return httpServer;
}