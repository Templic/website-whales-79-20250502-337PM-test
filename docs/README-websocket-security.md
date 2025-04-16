# WebSocket Security Implementation

This repository includes a comprehensive security implementation for WebSockets that follows industry best practices. Our implementation is designed to protect against common WebSocket vulnerabilities and attacks.

## Features

- ✅ Authentication and authorization
- ✅ Input validation and sanitization
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Transport security
- ✅ Session management
- ✅ Anomaly detection
- ✅ Health monitoring
- ✅ Comprehensive logging
- ✅ Client-side security wrapper
- ✅ Security audit tools
- ✅ Health check testing

## Directory Structure

```
├── server/
│   ├── websocket.ts             # Main WebSocket server implementation
│   └── index.ts                 # Server entry point
├── client/
│   └── src/
│       ├── utils/
│       │   └── secureWebSocket.ts   # Client-side security wrapper
│       └── examples/
│           └── websocket-example.tsx # Example React component
├── scripts/
│   ├── test-websocket-health.js     # Basic health check testing
│   ├── websocket-security-audit.js  # Comprehensive security audit
│   └── setup-websocket-security.js  # Setup script for new projects
└── docs/
    ├── websocket-security.md        # Detailed documentation
    └── README-websocket-security.md # This file
```

## Server-Side Implementation

The server-side implementation in `server/websocket.ts` includes:

1. **Authentication**: Token-based authentication for all connections
2. **Input Validation**: Zod schema validation for all incoming messages
3. **CSRF Protection**: Token-based CSRF protection for all non-exempt messages
4. **Rate Limiting**: Multi-layer rate limiting with progressive penalties
5. **Anomaly Detection**: Behavioral analysis with anomaly scoring
6. **Connection Monitoring**: Advanced health checks and statistics tracking
7. **Session Management**: Secure session handling with auto-expiration
8. **Logging**: Comprehensive security-focused logging
9. **Error Handling**: Graceful error handling with minimal information exposure

## Client-Side Implementation

The client-side security wrapper in `client/src/utils/secureWebSocket.ts` provides:

1. **Automatic Authentication**: Adds authentication tokens to connections
2. **CSRF Protection**: Automatically includes CSRF tokens in messages
3. **Token Refresh**: Handles token refresh before expiration
4. **Automatic Reconnection**: Reconnects on connection loss with exponential backoff
5. **Message Queue**: Queues messages when disconnected for reliable delivery
6. **Health Checks**: Sends periodic health check pings to ensure connection health
7. **Robust Error Handling**: Comprehensive error handling and recovery
8. **Debug Logging**: Optional detailed logging for troubleshooting

## Usage

### Server-Side

The WebSocket server is automatically initialized in the main server startup:

```typescript
// This is already set up in server/index.ts
import { setupWebSockets } from './websocket';
const server = createServer(app);
setupWebSockets(server);
```

### Client-Side

Import and use the SecureWebSocket class:

```typescript
import { SecureWebSocket } from '../utils/secureWebSocket';

// Create a new secure WebSocket connection
const socket = new SecureWebSocket({
  url: 'wss://example.com/ws',
  authToken: 'your-auth-token',
  debug: true,
  onMessage: (message) => {
    console.log('Received message:', message);
  }
});

// Send a message with automatic CSRF protection
socket.send({
  type: 'chat',
  payload: { message: 'Hello, world!' }
}).catch(error => {
  console.error('Failed to send message:', error);
});

// Close when done
socket.close();
```

A complete React example is provided in `client/src/examples/websocket-example.tsx`.

## Testing and Auditing

### Health Check Testing

Test basic WebSocket health with our comprehensive testing script:

```bash
node scripts/test-websocket-health.js --url=wss://example.com/ws --token=your_auth_token
```

This script tests:
- Connection establishment
- Authentication
- Ping/pong latency
- Automatic reconnection
- Security features (CSRF tokens, rate limiting, etc.)

Command line options:
- `--url=URL`: WebSocket server URL (default: ws://localhost:3000/ws)
- `--token=TOKEN`: Authentication token (default: test_token)
- `--verbose`: Enable verbose output
- `--help`: Show help message

### Security Audit

Run a comprehensive security audit to identify potential vulnerabilities:

```bash
node scripts/websocket-security-audit.js --url=wss://example.com/ws --token=your_auth_token
```

This script performs:
- Transport security checks
- Authentication mechanism validation
- CSRF protection verification
- Rate limiting assessment
- Input validation testing
- Error handling analysis
- Session management verification
- Monitoring capabilities check

The audit generates a detailed report in both JSON and Markdown formats in the `reports/websocket-security` directory.

Command line options:
- `--url=URL`: WebSocket server URL (default: ws://localhost:3000/ws)
- `--token=TOKEN`: Authentication token (default: test_token)
- `--verbose`: Enable verbose output
- `--full`: Perform full audit including performance and stress tests
- `--help`: Show help message

### Implementation in New Projects

To implement WebSocket security in a new project, use our setup script:

```bash
node scripts/setup-websocket-security.js
```

This script helps set up WebSocket security measures by:
1. Creating necessary directories
2. Setting up security files
3. Installing required dependencies
4. Configuring WebSocket security settings

Command line options:
- `--help`: Show help message
- `--force`: Overwrite existing files without prompting
- `--verbose`: Display detailed information during setup

## Security Best Practices

1. **Always use HTTPS/WSS in production**: Enforced by the implementation
2. **Validate all input**: Implemented with Zod schema validation
3. **Limit message sizes**: 64KB limit for all WebSocket messages
4. **Use proper authentication**: Token-based authentication required
5. **Implement CSRF protection**: Automatic token-based protection
6. **Rate limit aggressively**: Multi-layer rate limiting with progressive penalties
7. **Monitor for anomalies**: Anomaly scoring and detection
8. **Implement proper logging**: Detailed security event logging
9. **Regular security audits**: Built-in security audit script
10. **Session management**: Secure session handling with auto-expiration
11. **Message sanitization**: Protection against prototype pollution and XSS
12. **Error handling**: Minimal exposure of sensitive information

## Further Reading

For more detailed information about the security implementation, including threat models and individual security features, see [websocket-security.md](./websocket-security.md).

## License

This implementation is part of the main project and is subject to the same license terms.