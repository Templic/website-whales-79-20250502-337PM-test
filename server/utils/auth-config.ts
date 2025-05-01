/**
 * Centralized Authentication Configuration
 * 
 * This file contains all the authentication settings for the application,
 * ensuring consistency across all components.
 */

// Routes that should be exempt from CSRF protection
export const csrfExemptRoutes = [
  '/api/health',
  '/api/webhooks',
  '/api/external-callbacks',
  '/api/stripe-webhook',
  '/api/login',
  '/api/register',
  '/api/callback',
  '/api/logout',
  '/api/auth/user',
  '/api/auth', 
  '/api/auth/*',  // Wildcard to exempt all auth routes
  '/api/auth/jwt/login',
  '/api/auth/jwt/register',
  '/api/auth/jwt/refresh',
  '/api/auth/jwt/verify',
  '/api/auth/jwt/logout',
  '/api/jwt/login',
  '/api/jwt/refresh',
  '/api/jwt/logout',
  '/api/jwt/*',   // Wildcard to exempt all JWT routes
  '/api/user',    // Current user endpoint
  '/api/admin/*', // Admin API endpoints
  '/api/search/*', // Search endpoints
  '/api/secure/*'  // Secure API endpoints
];

// Define the role hierarchy
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2
};

// Define the minimum role required for each protected route
export const routePermissions: Record<string, UserRole> = {
  // Admin routes
  '/api/admin': UserRole.ADMIN,
  '/api/admin/users': UserRole.ADMIN,
  '/api/admin/content': UserRole.ADMIN,
  '/api/admin/posts': UserRole.ADMIN,
  '/api/admin/music': UserRole.ADMIN,
  '/api/admin/media': UserRole.ADMIN,
  '/api/admin/shop': UserRole.ADMIN,
  '/api/admin/comments': UserRole.ADMIN,
  '/api/admin/newsletter': UserRole.ADMIN,
  '/api/admin/settings': UserRole.ADMIN,
  
  // Super admin routes
  '/api/admin/database': UserRole.SUPER_ADMIN,
  '/api/admin/security': UserRole.SUPER_ADMIN,
  
  // Default - if a route isn't specified, it requires at least a USER role
  'default': UserRole.USER
};

// Authentication error messages
export const authErrorMessages = {
  unauthorized: 'You must be logged in to access this resource',
  forbidden: 'You do not have permission to access this resource',
  csrfFailed: 'Invalid CSRF token detected',
  invalidCredentials: 'Invalid username or password',
  accountLocked: 'Your account has been locked due to multiple failed login attempts',
  sessionExpired: 'Your session has expired, please log in again'
};

// Authentication settings
export const authSettings = {
  jwtTokenExpiry: '1h',
  refreshTokenExpiry: '7d',
  sessionTimeout: 3600000, // 1 hour in milliseconds
  maxLoginAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
};