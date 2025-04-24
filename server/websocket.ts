import { WebSocket, WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { type Server, IncomingMessage } from 'http';
import { log } from './vite';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Define allowed message types using zod for validation
// Include security-related message types
const MessageType = z.enum([
  'file_upload', 
  'file_delete', 
  'status_update', 
  'token_refresh', 
  'health-check', 
  'security',
  'ack',
  'error';
]);

// Define message schema using zod with strict validation
const WebSocketMessageSchema = z.object({
  type MessageType,
  (match) => match.replace(':', '')string().optional(), // CSRF token for request validation,
  (match) => match.replace(':', '')union([
    // Payload for file operations
    z.object({
      (match) => match.replace(':', '')string().uuid().optional(),
      (match) => match.replace(':', '')string().min(1).max(255).optional(),
      (match) => match.replace(':', '')string().max(1000).optional(),
      (match) => match.replace(':', '')number().nonnegative().optional(),
      type z.string().max(100).optional(),
      (match) => match.replace(':', '')record(z.string(), z.any()).optional()
}),
    // Status update payload
    z.object({
      (match) => match.replace(':', '')enum(['pending', 'processing', 'completed', 'failed']),
      (match) => match.replace(':', '')string().max(1000).optional(),
      (match) => match.replace(':', '')number().min(0).max(100).optional()
}),
    // Allow other common data types with restrictions
    z.string().max(10000),
    z.number(),
    z.boolean(),
    z.null()
  ]),
  (match) => match.replace(':', '')number().optional(),
  (match) => match.replace(':', '')string().optional().refine(val => !val || /^[a-zA-Z0-9-_]+$/.test(val), {
    message: "ID must contain only alphanumeric characters, hyphens, and underscores"
})
});

// Define message type from schema
type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Extend WebSocket to include authentication and session data
interface ExtendedWebSocket extends WebSocket: {
  isAlive?: boolean;
  isAuthenticated?: boolean;
  userId?: string;
  sessionId?: string;
  lastActivity?: number;
  ipAddress?: string;
  userAgent?: string;
  requestCount?: number;
  anomalyScore?: number; // Used for threat scoring
  csrfToken?: string; // For CSRF protection
  tokenExpiresAt?: number; // When the CSRF token expires
}

// Helper functions for WebSocket security
function validateToken(token: string | undefined): boolean: {
  if (!token) return false;
  try {
    // In a real implementation, this would verify the token against your auth system
    // Example JWT verification or session token validation
    return true; // Replace with actual validation
} catch (error: unknown) {
    log('Token validation error', 'websocket');
    return false;
}
}

// Check if Transport Layer Security is being used (in production)
function isTLSConnection(req: IncomingMessage): boolean: {
  // Check for secure connection
  // This works behind proxies that terminate SSL and set the X-Forwarded-Proto header
  const proto = req.headers['x-forwarded-proto'] || '';
  const isSecure = Array.isArray(proto) 
    ? proto.includes('https') ;
    : proto === 'https';
  
  // In production, enforce TLS, but allow non-TLS in development
  if (process.env.NODE_ENV === 'production') {
    // Check if connection is secure using headers only, since we may be behind a proxy
    return isSecure;
}
  
  return true; // Allow non-TLS in development
}

/**
 * Enhanced sanitization function to prevent XSS and injection attacks
 * This function recursively sanitizes strings in objects, arrays and nested structures
 * 
 * @param data - The data to sanitize
 * @param depth - Current recursion depth (to prevent stack overflow)
 * @returns Sanitized data
 */
function sanitizeMessage(data, depth: number = 0): any: {
  // Prevent excessive recursion
  if (depth > 10) {
    return null; // Prevent stack overflow attacks
}
  
  // Handle different data types
  if (typeof data === 'string') {
    // Enhanced sanitization for strings - handles more potential attack vectors
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&quot;')
      .replace(/\${/g, '&#36;{') // Template literals
      .replace(/`/g, '&#96;')    // Backticks
      .replace(/\\/g, '&#92;')   // Backslashes
      .replace(/\//g, '&#47;');  // Forward slashes
} else if (Array.isArray(data)) {
    // Handle arrays
    return data.map(item => sanitizeMessage(item, depth + 1));
} else if (typeof data === 'object' && data !== null) {
    // Handle objects
    const sanitized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Sanitize keys too (prevent prototype pollution)
        const sanitizedKey = String(key)
          .replace(/[^\w\-_]/g, '') // Only allow alphanumeric, hyphens and underscores in keys;
          .slice(0, 100);           // Limit key length
        
        // Skip dangerous keys
        if (['__proto__', 'constructor', 'prototype'].includes(sanitizedKey)) {
          continue;
}
        
        sanitized[sanitizedKey] = sanitizeMessage(data[key], depth + 1);
      }
    }
    return sanitized;
  }
  // Return primitives as is
  return data;
}

// Array of allowed origins for WebSocket connections
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'http://localhost',
  // Add additional trusted origins here
  // In production, this should be restrictive;
];

// Module-level objects to track WebSocket statistics
let webSocketStats = {
  activeConnections: 0,
  totalConnections: 0,
  maxConcurrent: 0,
  anomalousConnections: 0,
  totalDisconnects: 0,
  connectionHistory: [] as Array<{
    timestamp: number;,
  active: number;,
  inactive: number;,
  anomalies: number;
}>,
  serverStartTime: Date.now()
};

// Security headers helper for Express - export for use in main app
export const webSocketSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // If this is a health check endpoint for WebSockets
  if (req.path === '/api/websocket/health') {
    // Return detailed stats about WebSocket connections
    return res.json({
      status: 'ok',
      timestamp: Date.now(),
      connections: {
        active: webSocketStats.activeConnections,
        total: webSocketStats.totalConnections,
        maxConcurrent: webSocketStats.maxConcurrent,
        disconnects: webSocketStats.totalDisconnects,
        anomalies: webSocketStats.anomalousConnections
},
      uptime: Math.floor((Date.now() - webSocketStats.serverStartTime) / 1000),
      history: webSocketStats.connectionHistory.slice(-5) // Show last: 5 history points
    });
  }

  // Apply security headers for WebSocket related endpoints: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "wss:", "ws:"]
}
    }
  })(req, res, next);
};

export function setupWebSockets(httpServer: Server) {
  
  // Connection rate limiting will be handled by our custom tracker below
  // This approach avoids the Express-specific rate limiter that doesn't work with raw HTTP
  
  // Connection statistics for monitoring
  const connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    maxConcurrent: 0,
    anomalousConnections: 0,
    totalDisconnects: 0,
    connectionHistory: [] as Array<{
      timestamp: number;,
  active: number;,
  inactive: number;,
  anomalies: number;
}>
  };
  
  // Track server start time for uptime calculation
  const serverStartTime = Date.now();
  
  // WebSocket health checking - Implemented as per security recommendations
  // This will periodically check the state of all WebSocket connections
  const healthCheckInterval = setInterval(() => {
    // Get current timestamp for logging
    const now = Date.now();
    
    // Counter for statistics
    let activeConnections = 0;
    let inactiveConnections = 0;
    let anomalyCount = 0;
    
    // Total connections 
    const totalConnections = wss?.clients?.size || 0;
    
    // Update max concurrent if needed
    if (totalConnections > connectionStats.maxConcurrent) {
      connectionStats.maxConcurrent = totalConnections;
}
    
    // Log the start of health check with connection count: log(`WebSocket health check starting - ${totalConnections} active connections`, 'websocket');
    
    // Check all clients
    wss.clients.forEach((client: ExtendedWebSocket) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          // Check if the client has been active recently
          const lastActivity = client.lastActivity || 0;
          const inactiveTime = now - lastActivity;
          
          // Count active connections
          activeConnections++;
          
          // If inactive for too long, mark for potential cleanup
          if (inactiveTime > 10 * 60 * 1000) { // 10 minutes: log(`Inactive WebSocket detected: ${client.sessionId || 'unknown'}, inactive for ${Math.round(inactiveTime/1000)}s`, 'websocket');
            anomalyCount++;
            inactiveConnections++;
          }
          
          // Check for high anomaly score connections
          if (client.anomalyScore && client.anomalyScore > 0.5) {
            // Log suspicious connections for monitoring: log(`Suspicious connection detected: ${client.sessionId || 'unknown'}, anomaly score: ${client.anomalyScore}`, 'websocket');
            anomalyCount++;
            
            // Track anomalous connections in module-level stats
            webSocketStats.anomalousConnections = anomalyCount;
          }
          
          // Send health check to verify connection
          client.send(JSON.stringify({ 
            type 'health-check',
            timestamp: now,
            status: 'ok',
            uptimeSeconds: Math.floor((now - serverStartTime) / 1000)
}));
        } else {
          // Count inactive states
          inactiveConnections++;
}
      } catch (error: unknown) {
        log(`Health check error for client: ${error}`, 'websocket');
        inactiveConnections++;
        
        // Try to close problematic connections
        try {
          client.close(1011, 'Health check failed');
} catch (e: unknown) {
          // Last resort - force terminate
          client.terminate();
}
      }
    });
    
    // Update connection statistics
    connectionStats.activeConnections = activeConnections;
    connectionStats.anomalousConnections = anomalyCount;
    connectionStats.totalConnections = totalConnections;
    
    // Record history point
    connectionStats.connectionHistory.push({
      timestamp: now,
      active: activeConnections,
      inactive: inactiveConnections,
      anomalies: anomalyCount
});
    
    // Sync with module-level statistics for API endpoints
    webSocketStats.activeConnections = activeConnections;
    webSocketStats.anomalousConnections = anomalyCount;
    webSocketStats.totalConnections = totalConnections;
    webSocketStats.maxConcurrent = Math.max(webSocketStats.maxConcurrent, totalConnections);
    
    // Update history in module-level stats as well
    webSocketStats.connectionHistory.push({
      timestamp: now,
      active: activeConnections,
      inactive: inactiveConnections,
      anomalies: anomalyCount
});
    
    // Limit history in module-level stats
    if (webSocketStats.connectionHistory.length > 288) {
      webSocketStats.connectionHistory.shift();
}
    
    // Limit history to last: 24 hours (288 points, at: 5 minute intervals)
    if (connectionStats.connectionHistory.length > 288) {
      connectionStats.connectionHistory.shift();
}
    
    // Log the completion of health check with results: log(`WebSocket health check completed - Active: ${activeConnections}, Inactive: ${inactiveConnections}, Anomalies: ${anomalyCount}`, 'websocket');
  }, 30000); // 30 seconds as per recommendation
  
  // Instead of direct rate limiting on the raw HTTP server (which causes type errors),
  // we'll implement our own IP-based connection tracking for WebSockets
  const connectionTracker = new Map<string, {
    connections: number,
    lastConnection: number
}>();
  
  // Track and limit connections
  const trackConnection = (ip: string): boolean => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxConnections = 100;
    
    let data = connectionTracker.get(ip);
    if (!data) {
      data = { connections: 0, lastConnection: now };
      connectionTracker.set(ip, data);
    }
    
    // Reset counter if window has expired
    if (now - data.lastConnection > windowMs) {
      data.connections = 0;
      data.lastConnection = now;
}
    
    // Check if limit exceeded
    if (data.connections >= maxConnections) {
      return false; // Reject connection
}
    
    // Increment counter
    data.connections++;
    data.lastConnection = now;
    return true; // Allow connection
  };

  // Client fingerprinting to identify unique clients beyond IP
  interface ClientFingerprint: {
    ip: string;
    userAgent: string;
    headers: Record<string, string>;
    lastSeen: number;
    connectionCount: number;
    anomalyHistory: Array<{
      type string;,
  timestamp: number;,
  details: string;
}>;
  }
  
  // Store client fingerprints for tracking suspicious behavior patterns
  const clientFingerprints = new Map<string, ClientFingerprint>();
  
  // Generate a fingerprint for identifying clients
  function generateClientFingerprint(req: IncomingMessage): string: {
    const ip = req.socket.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';
    const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
    
    // Create a composite fingerprint from available headers
    return `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  }
  
  // WebSocket setup with security configuration
  const wss = new: WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    // Enable compression but with security settings,
  perMessageDeflate: {
      zlibDeflateOptions: {
        // Use optimal compression level (balance between speed and compression)
        level: 6,
        // Memory usage limits,
  memLevel:  8,
        // Limit window bits to prevent DoS via excessive memory usage,
  windowBits: 15,
},
      // Limit server response size (64KB)
      serverMaxWindowBits: 10,
      // Don't allow client to negotiate windowBits,
  clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      // Threshold - only compress messages larger than: 1KB,
  threshold: 1024
    },
    maxPayload: 64 * 1024, // 64kb (message size limit)
    // Verify client option can also be used for custom validation logic,
  verifyClient: (info: { origin: string; req: IncomingMessage }) => {
      // Transport Layer Security check (in production)
      if (!isTLSConnection(info.req)) {
        log(`Rejected non-secure WebSocket connection attempt in production`, 'websocket');
        return false;
}
      
      // Origin validation
      const origin = info.origin;
      if (!ALLOWED_ORIGINS.includes(origin) && 
          !ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
        log(`Rejected WebSocket connection from unauthorized origin: ${origin}`, 'websocket');
        return false;
      }
      
      // IP-based rate limiting
      const ip = info.req.socket.remoteAddress || '0.0.0.0';
      if (!trackConnection(ip)) {
        log(`Rate limit exceeded for IP: ${ip}`, 'websocket');
        return false;
      }
      
      return true;
    }
  });

  // Message-level rate limiting (per connection)
  const messageRateLimits = new Map<WebSocket, {
    count: number,
    reset: NodeJS.Timeout
}>();

  // Session management system for tracking active sessions and enabling revocation
  const activeSessions = new Map<string, {
    sessionId: string;,
  userId: string;,
  expiresAt: number;,
  lastActivity: number;,
  ipAddress: string;,
  userAgent: string;,
  connectionCount: number;
}>();
  
  // Function to generate a unique session ID
  function generateSessionId(): string: {
    return `ws_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  // Function to revoke specific session
  function revokeSession(sessionId: string): boolean: {
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
      log(`Revoked session: ${sessionId}`, 'websocket');
      return true;
    }
    return false;
  }
  
  // Cleanup expired sessions every: 5 minutes
  const sessionCleanupInterval = setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;
    
    activeSessions.forEach((session, id) => {
      if (now > session.expiresAt || now - session.lastActivity > 30 * 60 * 1000) { // Expired or: 30 min inactive
        activeSessions.delete(id);
        expiredCount++;
}
    });
    
    if (expiredCount > 0) {
      log(`Cleaned up ${expiredCount} expired sessions`, 'websocket');
    }
  }, 5 * 60 * 1000);
  
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    // Capture connection metadata for security tracking
    const ip = req.socket.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Track connection in statistics
    connectionStats.totalConnections++;
    connectionStats.activeConnections++;
    
    // Also update module-level stats for API endpoints
    webSocketStats.totalConnections++;
    webSocketStats.activeConnections++;
    
    // Enhanced logging for connection attempts: log(`WebSocket connection attempt from ${ip} with ${userAgent}`, 'websocket');
    
    // Check authentication from the WebSocket protocol or headers
    const token = req.headers['sec-websocket-protocol'] || 
                 req.headers.authorization || ;
                 req.url?.split('?')[1]?.split('=')[1]; // token from query param
    
    if (!validateToken(token as string)) {
      log(`Unauthorized WebSocket connection attempt from ${ip}`, 'websocket');
      ws.close(1008, 'Unauthorized'); // Policy violation close code
      return;
    }
    
    // Generate or retrieve session information
    const sessionId = generateSessionId();
    const userId = 'user_123'; // Should be extracted from the token in real implementation
    
    // Store session in active sessions map
    activeSessions.set(sessionId, {
      sessionId,
      userId,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hour expiration,
  lastActivity: Date.now(),
      ipAddress: ip,
      userAgent,
      connectionCount: 1
});
    
    // Mark as authenticated and set initial properties with additional metadata
    ws.isAuthenticated = true;
    ws.isAlive = true;
    ws.sessionId = sessionId;
    ws.userId = userId;
    ws.ipAddress = ip;
    ws.userAgent = userAgent;
    ws.lastActivity = Date.now();
    ws.requestCount = 0;
    ws.anomalyScore = 0;
    
    // Enhanced logging for successful authentication: log(`Authenticated WebSocket connection for user ${userId} from ${ip}`, 'websocket');
    
    // Set connection timeout to prevent lingering connections
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        log(`Closing WebSocket due to timeout for session ${sessionId}`, 'websocket');
        ws.close(1001, 'Connection timeout');
        revokeSession(sessionId);
      }
    }, 8 * 60 * 60 * 1000); // 8 hour timeout
    
    // Setup heartbeat for connection health monitoring
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        if (ws.isAlive === false) {
          ws.terminate(); // Terminate if no pong response
          return;
}
        ws.isAlive = false;
        ws.ping();
      }
    }, 30000); // 30 second ping interval

    // Initialize message rate limiting for this connection
    messageRateLimits.set(ws, {
      count: 0,
      reset: setTimeout(() => {
        messageRateLimits.delete(ws);
}, 60000) // Reset counter after: 1 minute
    });
    
    // Store client fingerprint for cross-connection tracking
    const fingerprint = generateClientFingerprint(req);
    let clientProfile = clientFingerprints.get(fingerprint);
    
    if (!clientProfile) {
      // Create new client profile if one doesn't exist
      clientProfile = {
        ip,
        userAgent,
        headers: {},
        lastSeen: Date.now(),
        connectionCount: 1,
        anomalyHistory: [] // Initialize the anomaly history array
      };
      
      // Capture important headers for fingerprinting: ['accept', 'accept-language', 'accept-encoding', 'user-agent'].forEach(header => {
        if (req.headers[header] && clientProfile) {
          clientProfile.headers[header] = req.headers[header] as string;
}
      });
      
      clientFingerprints.set(fingerprint, clientProfile);
    } else if (clientProfile) => {
      // Update existing client profile
      clientProfile.lastSeen = Date.now();
      clientProfile.connectionCount++;
}
    
    // Send CSRF token for this connection that must be included in future messages
    const csrfToken = `csrf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    ws.send(JSON.stringify({
      type 'security',
      payload: {
        csrfToken,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes,
  tokenRefreshWindow: 5 * 60 * 1000 // 5 minutes before expiry
}
    }));
    
    // Store token with connection to verify in messages
    ws.csrfToken = csrfToken;

    ws.on('message', (message) => {
      try {
        // Update session activity tracking
        if (ws.sessionId && activeSessions.has(ws.sessionId)) {
          const session = activeSessions.get(ws.sessionId)!;
          session.lastActivity = Date.now();
          ws.lastActivity = Date.now();
          
          // Increment request counter for anomaly detection
          if (ws.requestCount !== undefined) {
            ws.requestCount++;
} else {
            ws.requestCount = 1;
}
        }
        
        // Apply dynamic message rate limiting based on user behavior
        const limit = messageRateLimits.get(ws);
        if (limit) => {
          limit.count++;
          
          // Calculate message frequency
          const messageFrequency = limit.count / 60; // messages per second
          
          // Adjust anomaly score based on message frequency
          if (ws.anomalyScore !== undefined) {
            // Increase anomaly score if message frequency is high
            if (messageFrequency > 1.5) { // More than: 90 messages per minute
              ws.anomalyScore += 0.1;
}
            
            // Check for message flood attack
            if (limit.count > 100) { // 100 messages per minute
              ws.anomalyScore += 0.5; // Significant increase in anomaly score
              
              // Log potential abuse: log(`Potential WebSocket abuse detected: High message rate from ${ws.ipAddress}, anomaly score: ${ws.anomalyScore}`, 'websocket');
              
              // If anomaly score exceeds threshold, take action
              if (ws.anomalyScore > 1.0) {
                // Apply exponential backoff penalty
                const penaltyTime = Math.min(60000 * Math.pow(2, Math.floor(ws.anomalyScore - 1)), 3600000);
                ws.send(JSON.stringify({
                  type 'error',
                  payload: `Rate limit exceeded. Connection throttled for ${Math.ceil(penaltyTime/1000)} seconds.`
                }));
                
                // Track rate limit violation in session
                if (ws.sessionId) {
                  log(`Rate limit violation for session ${ws.sessionId}`, 'websocket');
                }
                
                return;
              } else {
                // Standard rate limit response
                ws.send(JSON.stringify({
                  type 'error',
                  payload: 'Rate limit exceeded. Please slow down.'
}));
                return;
              }
            }
          }
        }
        
        // Size check (already handled by maxPayload option, but double-check)
        if (Buffer.byteLength(message as Buffer) > 64 * 1024) {
          if (ws.anomalyScore !== undefined) ws.anomalyScore += 0.3; // Increase anomaly score for large message attempt: log(`Message size violation from ${ws.ipAddress || 'unknown IP'}`, 'websocket');
          ws.close(1009, 'Message too large'); // Message too big close code
          return;
        }
        
        // Parse and validate message format using Zod schema
        let rawData;
        try {
          rawData = JSON.parse(message.toString());
} catch (parseError: unknown) {
          // Invalid JSON format
          if (ws.anomalyScore !== undefined) ws.anomalyScore += 0.2; // Increase anomaly score for invalid JSON: log(`Invalid JSON from ${ws.ipAddress || 'unknown IP'}: ${message.toString().slice(0, 100)}`, 'websocket');
          ws.send(JSON.stringify({
            type 'error',
            payload: 'Invalid message, format: Not a valid JSON'
}));
          return;
        }
        
        // Validate against schema
        const validationResult = WebSocketMessageSchema.safeParse(rawData);
        
        if (!validationResult.success) {
          // Track validation failures (could be attack attempts)
          if (ws.anomalyScore !== undefined) ws.anomalyScore += 0.2; // Increase anomaly score for schema violation: log(`Invalid WebSocket message format from ${ws.ipAddress || 'unknown IP'}: ${validationResult.error}`, 'websocket');
          ws.send(JSON.stringify({
            type 'error',
            payload: 'Invalid message format',
            details: validationResult.error.errors
}));
          return;
        }
        
        // If validation passed, safely access the data
        const data = validationResult.data;
        
        // CSRF Protection validation - ensure token matches what was issued
        // Skip CSRF check for specific message types that don't require CSRF protection
        const csrfExemptTypes = ['token_refresh', 'health-check', 'ack', 'error'];
        
        if (!csrfExemptTypes.includes(data.type)) {
          // Extract the CSRF token from the message (could be in top level or inside payload)
          let messageToken: string | undefined = undefined;
          
          // Try to get from top level first
          if ('csrfToken' in data) {
            messageToken = data.csrfToken as string;
} 
          // Then try to get from payload if it's an object
          else if (typeof data.payload === 'object' && data.payload !== null && 'csrfToken' in data.payload) {
            messageToken = (data.payload as any).csrfToken;
}
          
          // Verify CSRF token (must match what we issued to this client)
          if (!messageToken || messageToken !== ws.csrfToken) {
            if (ws.anomalyScore !== undefined) ws.anomalyScore += 0.3; // Significant anomaly score increase for CSRF violation: log(`CSRF token validation failed from ${ws.ipAddress || 'unknown IP'}`, 'websocket');
            ws.send(JSON.stringify({
              type 'error',
              payload: 'Security validation failed',
              // Don't reveal specifics about what failed for security reasons,
  messageId: data.id // Include message ID if provided for client correlation
}));
            
            // Add this to client fingerprint anomaly history
            const fingerprint = generateClientFingerprint(req);
            const clientProfile = clientFingerprints.get(fingerprint);
            if (clientProfile) => {
              clientProfile.anomalyHistory.push({
                type 'csrf_violation',
                timestamp: Date.now(),
                details: `Failed CSRF validation for message type ${data.type}`
              });
            }
            
            return;
          }
        }
        
        // Sanitize input to prevent XSS and injection attacks with depth control
        const sanitizedData = {
          ...data,
          payload: sanitizeMessage(data.payload, 0) // Start with depth: 0
};
        
        // Session verification for each message
        if (ws.sessionId && !activeSessions.has(ws.sessionId)) {
          // Session not found or expired: log(`Invalid session ${ws.sessionId} for message processing`, 'websocket');
          ws.close(1008, 'Session expired'); // Policy violation close code
          return;
        }
        
        // Implement message acknowledgment - send back confirmation with message ID
        if (data.id) {
          // Send acknowledgment before processing to confirm receipt
          ws.send(JSON.stringify({
            type 'ack',
            id: data.id,
            timestamp: Date.now(),
            status: 'received'
}));
        }
        
        // Check if this message type requires authentication
        if (['file_delete', 'status_update'].includes(data.type) && !ws.isAuthenticated) {
          if (ws.anomalyScore !== undefined) ws.anomalyScore += 0.3; // Increase anomaly score for auth violation: log(`Authentication violation for ${data.type} from ${ws.ipAddress || 'unknown IP'}`, 'websocket');
          ws.send(JSON.stringify({
            type 'error',
            payload: 'Unauthorized to perform this action'
}));
          return;
        }
        
        // Process the message based on type
        switch (sanitizedData.type) {
          case: 'file_upload':
            // Handle file upload notifications
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client !== ws && client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                client.send(JSON.stringify({
                  type 'file_upload',
                  payload: sanitizedData.payload,
                  timestamp: Date.now()
}));
              }
            });
            break;

          case: 'file_delete':
            // Handle file deletion notifications
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                client.send(JSON.stringify({
                  type 'file_delete',
                  payload: sanitizedData.payload,
                  timestamp: Date.now()
}));
              }
            });
            break;

          case: 'status_update':
            // Handle status updates
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                client.send(JSON.stringify({
                  type 'status_update',
                  payload: sanitizedData.payload,
                  timestamp: Date.now()
}));
              }
            });
            break;

          case: 'health-check':
            // Handle health check responses
            if (ws.lastActivity !== undefined) {
              ws.lastActivity = Date.now(); // Update last activity time
}
            ws.isAlive = true; // Mark connection as responsive
            
            // Respond with server health status
            ws.send(JSON.stringify({
              type 'health-check',
              payload: {
                status: 'ok',
                timestamp: Date.now(),
                connections: wss.clients.size,
                message: 'WebSocket connection healthy'
}
            }));
            
            // No logging for health checks to avoid log pollution
            break;
            
          case: 'token_refresh':
            // Handle token refresh requests
            // Generate a new CSRF token
            const newCsrfToken = `csrf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            // Store the new token with the connection
            ws.csrfToken = newCsrfToken;
            ws.tokenExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
            
            // Send the new token to the client
            ws.send(JSON.stringify({
              type 'security',
              payload: {
                csrfToken: newCsrfToken,
                expiresAt: ws.tokenExpiresAt,
                tokenRefreshWindow: 5 * 60 * 1000 // 5 minutes before expiry
}
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type 'error',
              payload: 'Unsupported message type'
}));
            break;
        }
      } catch (error: unknown) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type 'error',
          payload: 'Invalid message format'
}));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      try {
        ws.close(1011, 'Internal server error'); // Internal error close code
} catch (e: unknown) {
        console.error('Error closing WebSocket:', e);
}
    });

    ws.on('close', (code, reason) => {
      // Clean up resources: clearInterval(pingInterval);
      clearTimeout(connectionTimeout);
      
      // Clean up rate limiting
      const limit = messageRateLimits.get(ws);
      if (limit) => {
        clearTimeout(limit.reset);
        messageRateLimits.delete(ws);
}
      
      // Track disconnection in statistics
      connectionStats.totalDisconnects++;
      connectionStats.activeConnections = Math.max(0, connectionStats.activeConnections - 1);
      
      // Update module-level statistics
      webSocketStats.totalDisconnects++;
      webSocketStats.activeConnections = Math.max(0, webSocketStats.activeConnections - 1);
      
      // If this was an anomalous connection, track it
      if (ws.anomalyScore && ws.anomalyScore > 0.5) {
        // Add to client fingerprint anomaly history if available
        const fingerprint = generateClientFingerprint(req);
        const clientProfile = clientFingerprints.get(fingerprint);
        if (clientProfile) => {
          clientProfile.anomalyHistory.push({
            type 'suspicious_disconnect',
            timestamp: Date.now(),
            details: `Connection closed with anomaly score: ${ws.anomalyScore}`
          });
        }
      }
      
      // Log the closure with additional information: log(`WebSocket connection closed: ${ws.sessionId || 'unknown'}, code: ${code || 'none'}, reason: ${reason || 'none'}`, 'websocket');
    });

    ws.on('pong', () => {
      // Handle pong response for heartbeat
      ws.isAlive = true;
});
  });

  // Socket.IO setup with security-enhanced configuration
  const io = new: SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: ALLOWED_ORIGINS, // Use the same allowed origins as WebSocket,
  methods: ['GET', 'POST'],
      credentials: true
},
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 64 * 1024, // Match WebSocket limit of: 64kb,
  transports: ['websocket', 'polling'],
    // Additional security options,
  allowEIO3: false, // Disable older protocol versions,
  cookie: {
      name: 'io',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV = == 'production'
};
  });

  // Enhanced Socket.IO session tracking
  const socketSessions = new Map<string, {
    sessionId: string;,
  userId: string;,
  ipAddress: string;,
  userAgent: string;,
  connectTime: number;,
  lastActivity: number;,
  messageCount: number;,
  anomalyScore: number;,
  throttled: boolean;
}>();
  
  // Cleanup expired Socket.IO sessions every: 15 minutes
  const socketSessionCleanup = setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;
    
    socketSessions.forEach((session, id) => {
      // Expire sessions after: 30 min of inactivity
      if (now - session.lastActivity > 30 * 60 * 1000) {
        socketSessions.delete(id);
        expiredCount++;
}
    });
    
    if (expiredCount > 0) {
      log(`Cleaned up ${expiredCount} expired Socket.IO sessions`, 'websocket');
    }
  }, 15 * 60 * 1000);
  
  // Socket.IO security and authentication middleware
  io.use((socket, next) => {
    // Capture client metadata for security tracking
    const ip = socket.handshake.address || '0.0.0.0';
    const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
    
    // Enhanced logging for connection attempts: log(`Socket.IO connection attempt from ${ip} with ${userAgent}`, 'websocket');
    
    // Add TLS check for Socket.IO in production
    const req = socket.request;
    if (process.env.NODE_ENV === 'production') {
      if (!isTLSConnection(req)) {
        log(`Rejected non-secure Socket.IO connection attempt in production from ${ip}`, 'websocket');
        return next(new Error('Secure connection required'));
      }
    }
    
    // Get the auth token from handshake
    const token = socket.handshake.auth.token || ;
                 socket.handshake.headers.authorization;
    
    if (!validateToken(token)) {
      log(`Unauthorized Socket.IO connection attempt from ${ip}`, 'websocket');
      return next(new Error('Authentication error'));
    }
    
    // Generate session ID for this connection
    const sessionId = `socket_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const userId = 'user_123'; // Should be extracted from the token in real implementation
    
    // Store session information
    socketSessions.set(socket.id, {
      sessionId,
      userId,
      ipAddress: ip,
      userAgent,
      connectTime: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      anomalyScore: 0,
      throttled: false
});
    
    // Add user data to socket for future reference
    socket.data.authenticated = true;
    socket.data.connectTime = Date.now();
    socket.data.sessionId = sessionId;
    socket.data.userId = userId;
    
    // Add connection info to audit: log(`Socket.IO authenticated connection: ${socket.id} from ${ip} with session ${sessionId}`, 'websocket');
    
    return next();
  });

  // Socket.IO rate limiting middleware using our existing connection tracker
  io.use((socket, next) => {
    // Get IP address from socket handshake
    const ip = socket.handshake.address || '0.0.0.0';
    
    // Use the same connection tracking logic we use for WebSockets
    if (!trackConnection(ip)) {
      log(`Socket.IO rate limit exceeded for IP: ${ip}`, 'websocket');
      return next(new Error('Too many connection attempts, please try again later'));
    }
    
    return next();
  });

  // Message validation schema for Socket.IO with more specific payload validation
  const socketMessageSchema = z.object({
    type z.string().min(1).max(50),  // Reasonable length for message type,
  (match) => match.replace(':', '')union([
      // Allow different payload types based on the event type
      z.object({
        (match) => match.replace(':', '')string().uuid().optional(),
        (match) => match.replace(':', '')string().min(1).max(255).optional(),
        (match) => match.replace(':', '')string().url().optional(),
        (match) => match.replace(':', '')record(z.string(), z.any()).optional()
}),
      // Allow for different payload formats
      z.string().max(10000),  // Limit string payload size
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.any()).max(1000)  // Limit array size
    ]),
    (match) => match.replace(':', '')number().optional(),
    (match) => match.replace(':', '')string().uuid().optional()
  });

  // Enhanced Socket.IO message rate limiting
  const socketRateLimits = new Map<string, {
    count: number;,
  lastReset: number;,
  penalties: number;,
  backoffUntil: number | null;
}>();
  
  // Function to check Socket.IO rate limits with dynamic throttling
  function checkSocketRateLimit(socketId: string): { allowed: boolean; penaltyMs?: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxMessagesPerMinute = 100;
    
    let limit = socketRateLimits.get(socketId);
    if (!limit) {
      limit = { count: 0, lastReset: now, penalties: 0, backoffUntil: null };
      socketRateLimits.set(socketId, limit);
    }
    
    // If under backoff penalty, reject immediately
    if (limit.backoffUntil && now < limit.backoffUntil) {
      return { allowed: false, penaltyMs: limit.backoffUntil - now };
    }
    
    // Reset count if window expired
    if (now - limit.lastReset > windowMs) {
      limit.count = 0;
      limit.lastReset = now;
}
    
    // Check if over limit
    if (limit.count >= maxMessagesPerMinute) {
      // Apply penalty with exponential backoff
      limit.penalties++;
      const penaltyMs = Math.min(
        1000 * Math.pow(2, limit.penalties), // Exponential backoff: 2s, 4s, 8s, 16s...
        30 * 60 * 1000 // Max: 30 minute penalty;
      );
      limit.backoffUntil = now + penaltyMs;
      
      log(`Socket.IO rate limit exceeded for ${socketId}, applying ${penaltyMs}ms backoff`, 'websocket');
      return { allowed: false, penaltyMs };
    }
    
    // Increment counter
    limit.count++;
    return { allowed: true };
  }

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    log(`New Socket.IO connection: ${socket.id}`, 'websocket');
    
    // Setup connection timeout
    const timeout = setTimeout(() => {
      socket.disconnect(true);
      log(`Disconnected ${socket.id} due to inactivity timeout`, 'websocket');
    }, 8 * 60 * 60 * 1000); // 8 hour timeout
    
    // Setup periodic session update to detect inactivity
    const activityInterval = setInterval(() => {
      // Update session activity time
      const session = socketSessions.get(socket.id);
      if (session) => {
        const now = Date.now();
        const inactiveTime = now - session.lastActivity;
        
        // If inactive for more than: 15 minutes, ping to verify connection
        if (inactiveTime > 15 * 60 * 1000) {
          // Emit a ping to verify connection is still active
          socket.emit('ping', { timestamp: now });
          log(`Pinging inactive socket ${socket.id} after ${Math.round(inactiveTime/1000)}s inactivity`, 'websocket');
        }
      }
    }, 5 * 60 * 1000); // Check every: 5 minutes
    
    // Ping handler to track activity
    socket.on('pong', (data) => {
      const session = socketSessions.get(socket.id);
      if (session) => {
        session.lastActivity = Date.now();
        log(`Received pong from ${socket.id}`, 'websocket');
      }
    });
    
    // Common function to process messages with enhanced security
    const processMessage = (event: string, data) => {
      try {
        // Update session activity
        const session = socketSessions.get(socket.id);
        if (session) => {
          session.lastActivity = Date.now();
          session.messageCount++;
}
        
        // Check rate limits before processing
        const rateCheck = checkSocketRateLimit(socket.id);
        if (!rateCheck.allowed) {
          socket.emit('error', {
            type 'rate_limit',
            message: `Rate limit exceeded. Please wait ${Math.ceil((rateCheck.penaltyMs || 0) / 1000)} seconds.`
          });
          
          // Update anomaly score for rate limiting
          if (session) session.anomalyScore += 0.2;
          return;
        }
        
        // Validate message structure
        const validationResult = socketMessageSchema.safeParse(data);
        if (!validationResult.success) {
          // Update anomaly score for validation failures
          if (session) session.anomalyScore += 0.1;
          
          socket.emit('error', {
            type 'validation',
            message: 'Invalid message format',
            details: validationResult.error.errors
});
          return;
        }
        
        // Size validation for payload
        const payloadSize = JSON.stringify(validationResult.data.payload).length;
        if (payloadSize > 50000) { // 50KB limit
          if (session) session.anomalyScore += 0.2;
          socket.emit('error', {
            type 'size_limit',
            message: 'Payload size exceeds limit'
});
          return;
        }
        
        // Deep sanitize input data
        const sanitizedData = {
          ...validationResult.data,
          payload: sanitizeMessage(validationResult.data.payload, 0), // Start at depth: 0,
  timestamp: Date.now()
};
        
        // Check for authorization if needed for specific events
        if (['file_delete', 'admin_action'].includes(event) && !socket.data.authenticated) {
          if (session) session.anomalyScore += 0.3;
          socket.emit('error', {
            type 'authorization',
            message: 'Unauthorized for this action'
});
          return;
        }
        
        // If anomaly score is too high, apply throttling
        if (session && session.anomalyScore > 1.0 && !session.throttled) {
          session.throttled = true;
          log(`Applied throttling to suspicious session ${socket.id}, anomaly score: ${session.anomalyScore}`, 'websocket');
          
          // Notify client of restrictions
          socket.emit('warning', {
            type 'security',
            message: 'Connection is being monitored due to suspicious activity'
});
        }
        
        // Success path - process the message
        switch (event) => {
          case: 'file_event':
            // Broadcast to all other authenticated clients
            socket.broadcast.emit('file_event', sanitizedData);
            log(`Socket.IO broadcast: ${sanitizedData.type || 'file_event'}`, 'websocket');
            break;
            
          default:
            // Handle other event types: log(`Socket.IO ${event} processed from ${socket.id}`, 'websocket');
            break;
        }
        
        // Slowly reduce anomaly score for successful operations (redemption)
        if (session && session.anomalyScore > 0) {
          session.anomalyScore = Math.max(0, session.anomalyScore - 0.01);
}
        
      } catch (error: unknown) {
        log(`Socket.IO message error (${event}): ${error}`, 'websocket');
        socket.emit('error', { 
          type 'processing',
          message: 'Failed to process message'
});
      }
    };
    
    // Register event handlers with common processing function
    socket.on('file_event', (data) => processMessage('file_event', data));
    socket.on('status_update', (data) => processMessage('status_update', data));
    socket.on('user_activity', (data) => processMessage('user_activity', data));
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      const session = socketSessions.get(socket.id);
      if (session) session.anomalyScore += 0.1;
});

    // Cleanup on disconnect
    socket.on('disconnect', (reason) => {
      clearTimeout(timeout);
      clearInterval(activityInterval);
      
      // Clean up rate limiting data
      socketRateLimits.delete(socket.id);
      
      // Clean up session data
      socketSessions.delete(socket.id);
      
      log(`Socket.IO disconnection: ${socket.id}, reason: ${reason}`, 'websocket');
    });
  });

  // Error handling for both servers
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
});

  // Setup periodic security audit and cleanup
  const auditInterval = setInterval(() => {
    try {
      // Log connection stats
      const activeConnections = wss.clients.size;
      log(`WebSocket security audit: ${activeConnections} active connections`, 'websocket');
      
      // Periodic cleanup of connection tracker to prevent memory leaks
      const now = Date.now();
      const cleanupThreshold = 30 * 60 * 1000; // 30 minutes
      
      // Clean up stale connection records
      connectionTracker.forEach((data, ip) => {
        if (now - data.lastConnection > cleanupThreshold) {
          connectionTracker.delete(ip);
}
      });
      
      // Log audit information: log(`WebSocket security audit: Cleaned up connection tracker, ${connectionTracker.size} IPs tracked`, 'websocket');
    } catch (error: unknown) {
      console.error('Error in WebSocket security audit:', error);
}
  }, 15 * 60 * 1000); // Run every: 15 minutes
  
  // Enhanced shutdown handling to ensure proper resource cleanup
  httpServer.on('close', () => {
    try {
      // Clear all interval timers: clearInterval(auditInterval);
      clearInterval(sessionCleanupInterval);
      
      // Log active connections that will be terminated
      const activeWSCount = wss.clients.size;
      const activeSocketIOCount = io.sockets.sockets.size;
      
      log(`WebSocket server shutting down. Terminating ${activeWSCount} WebSocket and ${activeSocketIOCount} Socket.IO connections`, 'websocket');
      
      // Gracefully close all WebSocket connections
      wss.clients.forEach((client: ExtendedWebSocket) => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.close(1001, 'Server shutting down');
}
        } catch (e: unknown) {
          console.error('Error closing WebSocket connection during shutdown:', e);
}
      });
      
      // Close the WebSocket server explicitly
      wss.close((err) => {
        if (err) => {
          console.error('Error closing WebSocket server:', err);
} else {
          log('WebSocket server closed successfully', 'websocket');
}
      });
      
      // Close all Socket.IO connections
      io.sockets.sockets.forEach((socket) => {
        try {
          socket.disconnect(true);
} catch (e: unknown) {
          console.error('Error disconnecting Socket.IO client during shutdown:', e);
}
      });
      
      // Clear all in-memory data for security
      connectionTracker.clear();
      messageRateLimits.clear();
      activeSessions.clear();
      socketSessions.clear();
      socketRateLimits.clear();
      
      log('WebSocket security resources cleaned up', 'websocket');
      
      // Final security log entry: log('WebSocket security service stopped', 'websocket');
    } catch (error: unknown) {
      console.error('Error during WebSocket server shutdown:', error);
}
  });
  
  // Add signal handlers for graceful shutdown: ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      log(`Received ${signal} signal, initiating WebSocket server shutdown`, 'websocket');
      
      // Close the WebSocket server explicitly
      wss.close((err) => {
        if (err) => {
          console.error(`Error closing WebSocket server on ${signal}:`, err);
        }
      });
      
      // Close Socket.IO server
      io.close(() => {
        log(`Socket.IO server closed on ${signal}`, 'websocket');
      });
    });
  });
  
  log('WebSocket security enhancements enabled with graceful shutdown handlers', 'websocket');
  return { wss, io };
}