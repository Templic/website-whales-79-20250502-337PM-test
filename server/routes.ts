import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSubscriberSchema,
  insertPostSchema,
  insertCommentSchema,
  insertCategorySchema
} from "@shared/schema";
import { createTransport } from "nodemailer";
import { hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const posts = await storage.getPosts();
      // Only return approved posts for non-admin users
      if (!req.isAuthenticated() || req.user?.role === 'user') {
        res.json(posts.filter(post => post.approved));
      } else {
        res.json(posts);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts" });
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

  // Create HTTP server with the Express app
  const httpServer = createServer(app);
  return httpServer;
}