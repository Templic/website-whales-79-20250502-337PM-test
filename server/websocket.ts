
import { WebSocket, WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { type Server } from 'http';
import { log } from './vite';

export function setupWebSockets(httpServer: Server) {
  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws: WebSocket) => {
    log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      log(`WebSocket message received: ${message}`);
      ws.send(`Echo: ${message}`);
    });

    ws.on('close', () => {
      log('WebSocket client disconnected');
    });
  });

  // Socket.IO setup
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    log('Socket.IO client connected');

    socket.on('message', (message) => {
      log(`Socket.IO message received: ${message}`);
      socket.emit('message', `Echo: ${message}`);
    });

    socket.on('disconnect', () => {
      log('Socket.IO client disconnected');
    });
  });

  return { wss, io };
}
