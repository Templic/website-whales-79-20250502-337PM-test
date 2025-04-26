/**
 * Security Toolkit Usage Example
 * 
 * This file demonstrates how to use the Security Toolkit in a real-world scenario.
 */

import express, { Request, Response, NextFunction } from 'express';
import {
  SecurityLevel,
  securityToolkit,
  createSecurityToolkit,
  secure,
  secureController,
  securityHeaders,
  validateRequest,
  validators
} from '../toolkit';

// Create an Express app
const app = express();

// Parse JSON bodies
app.use(express.json());

// Apply security headers to all responses
app.use(securityHeaders());

// Apply standard security middleware to all routes
app.use(securityToolkit.createMiddleware());

// Simple route with basic security
app.get('/api/public', (req: Request, res: Response) => {
  res.json({
    message: 'This is a public endpoint with standard security',
    timestamp: new Date().toISOString()
  });
});

// Route with high security
const highSecurityToolkit = createSecurityToolkit(SecurityLevel.HIGH);
app.get('/api/secure',
  highSecurityToolkit.createMiddleware(),
  (req: Request, res: Response) => {
    res.json({
      message: 'This is a highly secure endpoint',
      timestamp: new Date().toISOString()
    });
  }
);

// Protected route requiring authentication
app.get('/api/protected',
  securityToolkit.protectRoute(),
  (req: Request, res: Response) => {
    res.json({
      message: 'This is a protected endpoint requiring authentication',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  }
);

// Route with request validation
app.post('/api/submit',
  validateRequest({
    name: validators.required,
    email: validators.email,
    age: validators.number
  }),
  (req: Request, res: Response) => {
    res.json({
      message: 'Form submitted successfully',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  }
);

// Example controller using the decorator approach
@secureController(SecurityLevel.STANDARD)
class UserController {
  // Standard security method
  public getUsers(req: Request, res: Response) {
    res.json({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // Method with custom security
  @secure({
    level: SecurityLevel.HIGH,
    requireAuth: true,
    logActivity: true,
    blockHighRisk: true
  })
  public updateUser(req: Request, res: Response) {
    res.json({
      message: 'User updated successfully',
      user: { id: req.params.id, ...req.body },
      timestamp: new Date().toISOString()
    });
  }
  
  // Maximum security method
  @secure({ level: SecurityLevel.MAXIMUM })
  public deleteUser(req: Request, res: Response) {
    res.json({
      message: 'User deleted successfully',
      id: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
}

// Create controller instance
const userController = new UserController();

// Register controller routes
app.get('/api/users', userController.getUsers.bind(userController));
app.put('/api/users/:id', userController.updateUser.bind(userController));
app.delete('/api/users/:id', userController.deleteUser.bind(userController));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Log error to security blockchain
  securityToolkit.logSecurityEvent(
    'API_ERROR' as unknown,
    'ERROR' as unknown,
    'API error occurred',
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    }
  ).catch(console.error);
  
  // Return error response
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Start the server
if (require.main === module) {
  const port = 3002;
  app.listen(port, () => {
    console.log(`Security Toolkit example running on port ${port}`);
    console.log(`Try these endpoints:`);
    console.log(`- GET http://localhost:${port}/api/public`);
    console.log(`- GET http://localhost:${port}/api/secure`);
    console.log(`- GET http://localhost:${port}/api/protected`);
    console.log(`- POST http://localhost:${port}/api/submit`);
    console.log(`- GET http://localhost:${port}/api/users`);
    console.log(`- PUT http://localhost:${port}/api/users/1`);
    console.log(`- DELETE http://localhost:${port}/api/users/1`);
  });
}

// Export the app for testing
export default app;