# Server Startup Modes

This document describes the different startup modes available for the server and how to use them effectively.

## Available Startup Modes

The server supports several startup modes, each optimized for different scenarios:

### 1. Quickstart Mode

**Purpose:** Fastest possible startup with minimal features
**Use Case:** Development, testing, when you need the server to start instantly

**Features:**
- Minimal background services
- No security scans
- No database optimization
- No rate limiting
- Reduced logging
- No content scheduling
- WebSockets enabled
- Compression disabled
- CSRF protection disabled

### 2. Minimal Mode

**Purpose:** Fast startup with essential features
**Use Case:** Development and testing with some essential features

**Features:**
- Minimal background services (with short delay)
- No security scans
- No database optimization
- No rate limiting
- Reduced logging
- No content scheduling
- WebSockets enabled
- Compression enabled
- CSRF protection optional

### 3. Standard Mode 

**Purpose:** Balanced startup with most features
**Use Case:** Default for production with balanced feature set

**Features:**
- All background services enabled (with delay)
- Security scans enabled
- Database optimization enabled
- Rate limiting enabled
- Standard logging
- Content scheduling enabled
- WebSockets enabled
- Compression enabled
- CSRF protection enabled

### 4. Full Mode

**Purpose:** Complete feature set
**Use Case:** Production with all security and optimization features

**Features:**
- All background services enabled
- Deep security scans enabled
- Enhanced database optimization
- Strict rate limiting
- Enhanced logging
- Content scheduling enabled
- WebSockets enabled
- Compression enabled
- CSRF protection enabled
- Maximum security settings

## How to Configure Startup Modes

### Using Environment Variables

You can configure the startup mode by setting the following environment variables in your `.env` file:

```
STARTUP_PRIORITY=quickstart|minimal|standard|full
STARTUP_MODE=minimal|standard|full
```

### Using Configuration Scripts

For convenience, we provide scripts to easily switch between modes:

#### Enable Speed Mode (Quickstart)

This script configures the server for the fastest possible startup:

```bash
node scripts/enable-speed-mode.js
```

#### Disable Speed Mode (Return to Standard)

This script restores the standard balanced configuration:

```bash
node scripts/disable-speed-mode.js
```

## Performance Impact

Each mode has different performance characteristics:

| Mode | Startup Time | Memory Usage | CPU Usage | Feature Set |
|------|--------------|--------------|-----------|-------------|
| Quickstart | Fastest (< 500ms) | Lowest | Lowest | Minimal |
| Minimal | Fast (< 1s) | Low | Low | Basic |
| Standard | Moderate (1-2s) | Moderate | Moderate | Comprehensive |
| Full | Slow (2-5s) | High | High | Complete |

## Recommendations

- **Development**: Use Quickstart or Minimal mode for the fastest development experience
- **Testing**: Use Minimal or Standard mode to test with realistic features
- **Staging**: Use Standard mode to match production environment
- **Production**: Use Standard or Full mode depending on security requirements

## Troubleshooting

If the server is starting too slowly:
1. Check if all background services are necessary
2. Consider using Quickstart mode during development
3. Review database optimization settings
4. Check for unnecessary security scans

If features aren't working:
1. Ensure you're not in Quickstart or Minimal mode, which disable some features
2. Check specific feature flags in the configuration