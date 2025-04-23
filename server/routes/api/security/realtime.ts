/**
 * Real-time Security Monitoring API
 * 
 * This module provides API endpoints for real-time security monitoring,
 * connecting the security dashboard to live data from security systems.
 */

import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import { logSecurityEvent } from '../../../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../../../security/advanced/SecurityFabric';
import { getLatestSecurityMetrics } from '../../../security/monitoring/MetricsCollector';
import { getSecurityEventsHistory } from '../../../security/monitoring/EventsCollector';

// Create an Express router for security monitoring
const router = express.Router();

/**
 * Get current security metrics summary
 * GET /api/security/realtime/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // Get latest metrics from the security system
    const metrics = await getLatestSecurityMetrics();
    
    res.json(metrics);
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error retrieving security metrics',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ message: 'Failed to retrieve security metrics' });
  }
});

/**
 * Get security events history
 * GET /api/security/realtime/events
 */
router.get('/events', async (req, res) => {
  try {
    // Parse query parameters
    const timeRange = req.query.timeRange as string || '24h';
    const category = req.query.category as string || 'all';
    const type = req.query.type as string || 'all';
    const limit = parseInt(req.query.limit as string || '100');
    
    // Get events history from the security system
    const events = await getSecurityEventsHistory(timeRange, category, type, limit);
    
    res.json(events);
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error retrieving security events history',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ message: 'Failed to retrieve security events history' });
  }
});

/**
 * Setup WebSocket server for real-time security updates
 */
export function setupSecurityWebSockets(server: http.Server): void {
  const wss = new WebSocket.Server({
    server,
    path: '/api/security/realtime/ws'
  });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  // Listen for WebSocket connections
  wss.on('connection', (ws) => {
    // Add client to the set
    clients.add(ws);
    
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: 'Security WebSocket client connected',
      data: { clientsCount: clients.size }
    });
    
    // Handshake with client
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString(),
      message: 'Connected to security monitoring system'
    }));
    
    // Handle client disconnection
    ws.on('close', () => {
      // Remove client from the set
      clients.delete(ws);
      
      logSecurityEvent({
        category: SecurityEventCategory.SYSTEM,
        severity: SecurityEventSeverity.INFO,
        message: 'Security WebSocket client disconnected',
        data: { clientsCount: clients.size }
      });
    });
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Validate message type
        if (data.type === 'heartbeat') {
          // Respond to heartbeat
          ws.send(JSON.stringify({
            type: 'heartbeat_ack',
            timestamp: new Date().toISOString()
          }));
        } else if (data.type === 'subscribe') {
          // Handle subscription request
          handleSubscription(ws, data);
        }
      } catch (error) {
        logSecurityEvent({
          category: SecurityEventCategory.SYSTEM,
          severity: SecurityEventSeverity.WARNING,
          message: 'Error processing security WebSocket message',
          data: { error: (error as Error).message, message: message.toString() }
        });
      }
    });
  });
  
  // Periodically broadcast security metrics to all clients
  setInterval(() => {
    broadcastSecurityMetrics(clients);
  }, 10000); // Every 10 seconds
  
  logSecurityEvent({
    category: SecurityEventCategory.SYSTEM,
    severity: SecurityEventSeverity.INFO,
    message: 'Security WebSocket server initialized',
    data: { path: '/api/security/realtime/ws' }
  });
}

/**
 * Handle WebSocket subscription requests
 */
function handleSubscription(ws: WebSocket, data: any): void {
  const channel = data.channel;
  
  logSecurityEvent({
    category: SecurityEventCategory.SYSTEM,
    severity: SecurityEventSeverity.INFO,
    message: 'Security WebSocket subscription request',
    data: { channel }
  });
  
  // Acknowledge subscription
  ws.send(JSON.stringify({
    type: 'subscription_ack',
    channel,
    timestamp: new Date().toISOString(),
    message: `Subscribed to ${channel}`
  }));
}

/**
 * Broadcast security metrics to all connected clients
 */
async function broadcastSecurityMetrics(clients: Set<WebSocket>): Promise<void> {
  if (clients.size === 0) {
    return; // No clients connected
  }
  
  try {
    // Get latest metrics
    const metrics = await getLatestSecurityMetrics();
    
    // Prepare message
    const message = JSON.stringify({
      type: 'metrics_update',
      timestamp: new Date().toISOString(),
      metrics
    });
    
    // Broadcast to all clients
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error broadcasting security metrics',
      data: { error: (error as Error).message, clientsCount: clients.size }
    });
  }
}

export default router;