import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import {
  insertSubscriberSchema,
  insertPostSchema,
  insertCommentSchema,
  insertCategorySchema
} from "@shared/schema";
import { createTransport } from "nodemailer";
import { hashPassword } from "./auth";

export async function registerRoutes(app: express.Application): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
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

  // Music upload route
  app.post("/api/upload/music", async (req, res) => {
    if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const NodeClam = require('clamav.js');
    const ClamScan = new NodeClam().init({
        removeInfected: true,
        quarantineInfected: false,
        scanLog: null,
        debugMode: false,
        fileList: null,
        scanRecursively: true,
        clamscan: {
            path: '/usr/bin/clamscan',
            db: null,
            scanArchives: true,
            active: true
        },
        preference: 'clamscan'
    });

    const file = req.files.file;
    const targetPage = req.body.page;
    const allowedPages = ['new_music', 'music_archive', 'blog', 'home', 'about', 'newsletter'];
    const allowedTypes = new Set(['mp3', 'mp4', 'aac', 'flac', 'wav', 'aiff', 'avi', 'wmv', 'mov']);

    // Scan file for viruses
    try {
        const {isInfected, viruses} = await ClamScan.isInfected(file.tempFilePath);
        if (isInfected) {
            return res.status(400).json({ 
                message: "File is infected with malware",
                viruses: viruses 
            });
        }
    } catch (err) {
        console.error("Virus scan error:", err);
        return res.status(500).json({ message: "Error scanning file" });
    }
    const allowedMimeTypes = new Set([
      'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac', 
      'audio/wav', 'audio/aiff', 'video/avi', 'video/x-ms-wmv', 
      'video/quicktime', 'video/mp4'
    ]);
    
    // Sanitize filename to prevent path traversal
    const sanitizeFilename = (filename: string): string => {
      return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    };

    if (!allowedPages.includes(targetPage)) {
      return res.status(400).json({ message: "Invalid target page" });
    }

    // Enhanced file validation
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return res.status(400).json({ message: "Invalid file type. Allowed types: " + allowedTypes.join(', ') });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return res.status(400).json({ message: "File too large. Maximum size: 50MB" });
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac', 
      'audio/wav', 'audio/aiff', 'video/avi', 'video/x-ms-wmv', 
      'video/quicktime', 'video/mp4'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: "Invalid file MIME type. Allowed types: " + allowedMimeTypes.join(', ') });
    }

    try {
      const result = await storage.uploadMusic({
        file: file,
        targetPage: targetPage,
        uploadedBy: req.user.id,
        userRole: req.user.role as 'admin' | 'super_admin'
      });
      res.json(result);
    } catch (error) {
      console.error("Error uploading music file:", error);
      res.status(500).json({ message: "Failed to upload file" });
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

  //This route was duplicated in the original code.  Removing the duplicate.

  // Create HTTP server with the Express app
  const httpServer = createServer(app);
  return httpServer;
}