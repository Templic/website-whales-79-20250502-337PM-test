# Speed Mode Documentation

This document describes how to enable and use Speed Mode for the fastest possible server startup.

## Overview

Speed Mode is a specialized configuration that minimizes startup time by:
- Disabling all non-essential security features
- Deferring background tasks and services
- Skipping database optimization
- Using minimal middleware
- Disabling logging and monitoring

## Usage

### Enable Speed Mode

To enable Speed Mode, run:
```bash
bash enable-speed-mode.sh
```

This will:
1. Update environment variables in `.env`
2. Create a `.speed_mode_enabled` flag file
3. Set up `config/speed_mode.json` with optimized settings

### Disable Speed Mode

To return to standard mode, run:
```bash
bash disable-speed-mode.sh
```

### Direct Execution

For the fastest possible startup, use the direct execution script:
```bash
node start-speed-mode.js
```

This bypasses the regular configuration system and starts with minimal features.

## Configuration

Speed Mode uses the following settings:

- `startupPriority`: quickstart
- `deferBackgroundServices`: true
- `enableCompression`: false
- `csrfProtection`: false
- All security features: disabled
- All background tasks: disabled
- All database optimization: disabled

## Environment Variables

The following environment variables control Speed Mode:

- `ENABLE_SPEED_MODE=true` - Activates speed mode configuration
- `STARTUP_PRIORITY=quickstart` - Sets quickstart priority
- `ENABLE_SECURITY_SCANS=false` - Disables security scanning
- `ENABLE_BACKGROUND_TASKS=false` - Disables background tasks
- `ENABLE_DATABASE_OPTIMIZATION=false` - Disables database optimization
- `EXTRA_LOGGING=false` - Disables extra logging
- `ENABLE_COMPRESSION=false` - Disables response compression

## Performance Implications

While Speed Mode offers the fastest possible startup time, it does so by disabling important security and optimization features. It should only be used during development or in environments where security is not a concern.

In production environments, consider using `standard` mode instead which offers a balance of performance and security.