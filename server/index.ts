import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "./vite";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { pgPool } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Add error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error('Error:', err);
  res.status(status).json({ message });
});

// ALWAYS serve the app on port 5000
const port = 5000;

async function startServer() {
  console.log('Starting server initialization...');

  try {
    const httpServer = await registerRoutes(app);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite in development mode...');
      await setupVite(app, httpServer);
    } else {
      app.use(express.static(path.resolve(__dirname, "../templates")));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(__dirname, "../templates/home_page.html"));
      });
    }

    console.log(`Attempting to start server on port ${port}...`);
    await new Promise((resolve, reject) => {
      httpServer.listen(port, "0.0.0.0", (err?: Error) => {
        if (err) {
          console.error('Server startup error:', err);
          reject(err);
          return;
        }
        console.log(`Server successfully listening on port ${port}`);
        log(`Server listening on port ${port}`);
        resolve(true);
      });
    });

    // Setup graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      try {
        await new Promise<void>((resolve) => {
          httpServer.close(() => {
            console.log('HTTP server closed');
            resolve();
          });
        });

        console.log('Closing database pool...');
        await pgPool.end();
        console.log('Database pool closed');

        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();