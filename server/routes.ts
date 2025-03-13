import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSubscriberSchema,
  insertPostSchema,
  insertCommentSchema,
  insertCategorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(Number(req.params.id));
      if (!post) {
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
        postId: Number(req.params.postId)
      });
      const comment = await storage.createComment(data);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(Number(req.params.postId));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  // Create HTTP server with the Express app
  const httpServer = createServer(app);
  return httpServer;
}