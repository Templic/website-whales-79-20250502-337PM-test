/**
 * Secure WebSocket Client
 * 
 * This class provides a secure wrapper around the native WebSocket API with:
 * - Authentication integration
 * - CSRF protection
 * - Automatic reconnection with exponential backoff
 * - Token refresh
 * - Message queuing during disconnects
 * - Health check handling
 * - Comprehensive error handling
 * 
 * @author Your Name
 * @version 1.0.0
 */

// Types for WebSocket messages
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp?: number;
  csrfToken?: string;
}

// Type for callback functions
export type MessageCallback = (message: WebSocketMessage) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (event: Event) => void;

// Configuration options
export interface SecureWebSocketOptions {
  url: string;
  authToken: string;
  protocols?: string | string[];
  debug?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  tokenRefreshThreshold?: number;
  onOpen?: ConnectionCallback;
  onClose?: ConnectionCallback;
  onMessage?: MessageCallback;
  onError?: ErrorCallback;
}

// Default options values
const DEFAULT_OPTIONS: Partial<SecureWebSocketOptions> = {
  debug: false,
  reconnect: true,
  maxReconnectAttempts: 10,
  reconnectInterval: 1000, // Start with 1 second
  maxReconnectInterval: 30000, // Maximum of 30 seconds
  reconnectDecay: 1.5, // Exponential backoff factor
  tokenRefreshThreshold: 300000, // 5 minutes before token expiration
};

// List of message types that don't require CSRF tokens
const CSRF_EXEMPT_MESSAGE_TYPES = ['health-check', 'token_refresh', 'ack'];

// Constants
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const TOKEN_REFRESH_TYPE = 'token_refresh';
const HEALTH_CHECK_TYPE = 'health-check';
const PING_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100; // Maximum number of queued messages

export class SecureWebSocket {
  private ws: WebSocket | null = null;
  private options: SecureWebSocketOptions;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private csrfToken: string | null = null;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private lastActivity = 0;
  private closed = false;

  /**
   * Creates a new secure WebSocket connection
   * @param options Configuration options
   */
  constructor(options: SecureWebSocketOptions) {
    // Merge provided options with defaults
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Validate required options
    if (!this.options.url) {
      throw new Error('SecureWebSocket requires a URL');
    }
    
    if (!this.options.authToken) {
      throw new Error('SecureWebSocket requires an authentication token');
    }
    
    // Initialize the connection
    this.connect();
  }

  /**
   * Establishes a WebSocket connection with security features
   */
  private connect(): void {
    if (this.isConnecting || this.closed) return;
    
    this.isConnecting = true;
    this.log('Connecting to WebSocket server...');
    
    try {
      // Create a new WebSocket connection
      this.ws = new WebSocket(this.options.url, this.options.protocols);
      
      // Set up connection timeout
      this.connectionTimeoutTimer = setTimeout(() => {
        this.log('Connection timeout');
        this.ws?.close();
      }, CONNECTION_TIMEOUT);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.log('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Handles WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.log('WebSocket connection established');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.lastActivity = Date.now();
    
    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    
    // Authenticate with the server
    this.authenticate();
    
    // Start ping interval
    this.startPingInterval();
    
    // Notify consumer
    if (this.options.onOpen) {
      this.options.onOpen();
    }
    
    // Process queued messages
    this.processQueue();
  }

  /**
   * Authenticates the connection with the server
   */
  private authenticate(): void {
    const authMessage: WebSocketMessage = {
      type: 'authentication',
      payload: {
        token: this.options.authToken
      },
      timestamp: Date.now()
    };
    
    this.sendRaw(authMessage);
  }

  /**
   * Handles WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    this.isConnecting = false;
    this.ws = null;
    
    // Clear timers
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    
    // Notify consumer
    if (this.options.onClose) {
      this.options.onClose();
    }
    
    // Attempt to reconnect if not explicitly closed by the user
    if (!this.closed && this.options.reconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handles WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    this.lastActivity = Date.now();
    
    try {
      // Parse the message
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Process CSRF token if present in the message
      if (message.type === 'authentication_success' && message.payload && message.payload.csrfToken) {
        this.csrfToken = message.payload.csrfToken;
        this.log('Received CSRF token');
        
        // Schedule token refresh if expiration provided
        if (message.payload.tokenExpires) {
          this.scheduleTokenRefresh(message.payload.tokenExpires);
        }
      }
      
      // Health check messages don't need to be propagated to the consumer
      if (message.type === HEALTH_CHECK_TYPE) {
        this.sendAcknowledgement(message);
        return;
      }
      
      // Notify consumer of the message
      if (this.options.onMessage) {
        this.options.onMessage(message);
      }
    } catch (error) {
      this.log('Error handling message:', error);
    }
  }

  /**
   * Handles WebSocket error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
    
    // Notify consumer
    if (this.options.onError) {
      this.options.onError(event);
    }
  }

  /**
   * Sends a WebSocket message with CSRF protection
   * @param message The message to send
   * @returns Promise that resolves when the message is sent
   */
  public async send(message: WebSocketMessage): Promise<void> {
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }
    
    // Add CSRF token if available and message type requires it
    if (this.csrfToken && !CSRF_EXEMPT_MESSAGE_TYPES.includes(message.type)) {
      message.csrfToken = this.csrfToken;
    }
    
    // Check if connection is open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendRaw(message);
      return;
    }
    
    // Queue the message for later if connection is not open
    if (this.messageQueue.length < MAX_QUEUE_SIZE) {
      this.log(`Connection not open, queuing message of type ${message.type}`);
      this.messageQueue.push(message);
    } else {
      throw new Error('Message queue is full, cannot send message');
    }
  }

  /**
   * Sends a raw message over the WebSocket
   * @param message The message to send
   */
  private sendRaw(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message, connection not open');
      return;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      this.lastActivity = Date.now();
    } catch (error) {
      this.log('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Processes the queued messages after connection is established
   */
  private processQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.log(`Processing ${this.messageQueue.length} queued messages`);
    
    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.sendRaw(message);
        } catch (error) {
          this.log('Error sending queued message:', error);
          // Re-queue the message at the front
          this.messageQueue.unshift(message);
          // Stop processing and try again later
          setTimeout(() => this.processQueue(), 1000);
          return;
        }
      }
    }
  }

  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.closed) return;
    
    this.reconnectAttempts += 1;
    
    // Check if we've exceeded maximum reconnect attempts
    if (this.options.maxReconnectAttempts !== undefined && 
        this.reconnectAttempts > this.options.maxReconnectAttempts) {
      this.log('Maximum reconnect attempts reached');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.options.reconnectInterval! * Math.pow(this.options.reconnectDecay!, this.reconnectAttempts - 1),
      this.options.maxReconnectInterval!
    );
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Starts the periodic ping interval to keep the connection alive
   */
  private startPingInterval(): void {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
    }
    
    this.pingTimer = setInterval(() => {
      // If no activity for a while, send a ping
      if (Date.now() - this.lastActivity > PING_INTERVAL) {
        this.sendHealthCheck();
      }
    }, PING_INTERVAL);
  }

  /**
   * Sends a health check ping message
   */
  private sendHealthCheck(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const healthCheckMessage: WebSocketMessage = {
      type: HEALTH_CHECK_TYPE,
      payload: {
        clientTimestamp: Date.now()
      }
    };
    
    try {
      this.sendRaw(healthCheckMessage);
    } catch (error) {
      this.log('Error sending health check:', error);
    }
  }

  /**
   * Sends acknowledgement for received message
   * @param originalMessage The message to acknowledge
   */
  private sendAcknowledgement(originalMessage: WebSocketMessage): void {
    const ackMessage: WebSocketMessage = {
      type: 'ack',
      payload: {
        originalType: originalMessage.type,
        originalTimestamp: originalMessage.timestamp,
        receivedAt: Date.now()
      }
    };
    
    try {
      this.sendRaw(ackMessage);
    } catch (error) {
      this.log('Error sending acknowledgement:', error);
    }
  }

  /**
   * Schedules a token refresh before the current token expires
   * @param expiresAt Timestamp when the token expires
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    const now = Date.now();
    const refreshTime = expiresAt - this.options.tokenRefreshThreshold!;
    
    // If token is already expired or will expire soon, refresh immediately
    if (refreshTime <= now) {
      this.refreshToken();
      return;
    }
    
    const delay = refreshTime - now;
    this.log(`Scheduling token refresh in ${Math.floor(delay / 1000)} seconds`);
    
    this.tokenRefreshTimer = setTimeout(() => {
      this.tokenRefreshTimer = null;
      this.refreshToken();
    }, delay);
  }

  /**
   * Refreshes the authentication token
   */
  private refreshToken(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.log('Refreshing authentication token');
    
    const refreshMessage: WebSocketMessage = {
      type: TOKEN_REFRESH_TYPE,
      payload: {
        currentToken: this.options.authToken
      },
      timestamp: Date.now()
    };
    
    try {
      this.sendRaw(refreshMessage);
    } catch (error) {
      this.log('Error refreshing token:', error);
    }
  }

  /**
   * Updates the authentication token
   * @param newToken The new authentication token
   */
  public updateToken(newToken: string): void {
    this.options.authToken = newToken;
    this.log('Authentication token updated');
  }

  /**
   * Closes the WebSocket connection
   */
  public close(): void {
    this.closed = true;
    
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    
    // Close the connection if it's open
    if (this.ws) {
      try {
        this.ws.close(1000, 'Normal closure');
      } catch (error) {
        this.log('Error closing WebSocket:', error);
      }
      this.ws = null;
    }
    
    this.log('WebSocket connection closed by user');
  }

  /**
   * Returns whether the WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Returns the current connection state
   * @returns Connection state as string
   */
  public getState(): string {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Utility method for logging
   * @param message Log message
   * @param data Additional data to log
   */
  private log(message: string, data?: any): void {
    if (this.options.debug) {
      if (data) {
        console.log(`[SecureWebSocket] ${message}`, data);
      } else {
        console.log(`[SecureWebSocket] ${message}`);
      }
    }
  }
}