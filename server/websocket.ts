
import { WebSocket, WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { type Server } from 'http';
import { log } from './vite';

export function setupWebSockets(httpServer: Server) {
  // WebSocket setup
  const wss = new WebSocketServer({ 
    server: httpServer,
    perMessageDeflate: false,
    maxPayload: 64 * 1024, // 64kb
    skipUTF8Validation: true
  });
  
  wss.on('connection', (ws: WebSocket) => {
    log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = message.toString();
        log(`WebSocket message received: ${data}`);
        ws.send(`Echo: ${data}`);
      } catch (error) {
        console.error('WebSocket message error:', error);
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
      log('WebSocket client disconnected');
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
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
