import { WebSocket, WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { type Server } from 'http';
import { log } from './vite';

// Define message types
interface WebSocketMessage {
  type: 'file_upload' | 'file_delete' | 'status_update';
  payload: any;
}

// Extend WebSocket to include isAlive property
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

export function setupWebSockets(httpServer: Server) {
  // WebSocket setup with proper configuration
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
host: '0.0.0.0',
port: 5000,
    perMessageDeflate: false,
    maxPayload: 64 * 1024 // 64kb
  });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    // Setup heartbeat
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('message', (message) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'file_upload':
            // Handle file upload notifications
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'file_upload',
                  payload: data.payload
                }));
              }
            });
            break;

          case 'file_delete':
            // Handle file deletion notifications
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'file_delete',
                  payload: data.payload
                }));
              }
            });
            break;

          case 'status_update':
            // Handle status updates
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'status_update',
                  payload: data.payload
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: 'Invalid message format'
        }));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      try {
        ws.close();
      } catch (e) {
        console.error('Error closing WebSocket:', e);
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
    });

    ws.on('pong', () => {
      // Handle pong response
      ws.isAlive = true;
    });
  });

  // Socket.IO setup with proper configuration
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling']
  });

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    socket.on('file_event', (data) => {
      // Broadcast to all other clients
      socket.broadcast.emit('file_event', data);
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    socket.on('disconnect', () => {
      // Cleanup on disconnect if needed
    });
  });

  // Error handling for both servers
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  return { wss, io };
}