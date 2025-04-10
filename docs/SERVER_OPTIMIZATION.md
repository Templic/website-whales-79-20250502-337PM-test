# Server Optimization Guide

This document outlines the server optimization strategies implemented in the Dale the Whale web application to improve startup time, resource utilization, and overall system performance.

## Table of Contents

1. [Configuration System](#configuration-system)
2. [Staged Initialization](#staged-initialization)
3. [Database Optimization](#database-optimization)
4. [Background Services](#background-services)
5. [Security Scans](#security-scans)
6. [Environment-Specific Settings](#environment-specific-settings)
7. [Startup Modes](#startup-modes)
8. [Performance Metrics](#performance-metrics)

## Configuration System

The server uses a centralized configuration system that supports different environments, startup modes, and feature toggles. This allows for fine-grained control over how the server behaves without code changes.

### Key Features

- **Environment Detection**: Automatically detects and applies the correct configuration for development, staging, production, or test environments.
- **Feature Toggles**: Enable or disable specific server features through configuration.
- **Priority Settings**: Configure startup behavior by setting priority between speed and maintenance.
- **Environment Variables**: Override configuration through environment variables.

```typescript
// Example of setting startup priority and mode
process.env.STARTUP_PRIORITY = 'speed'; // Options: 'speed', 'balanced', 'maintenance'
process.env.STARTUP_MODE = 'minimal';   // Options: 'minimal', 'standard', 'full'
```

## Staged Initialization

The server implements a staged initialization approach that significantly improves startup time by:

1. **Essential Services First**: Critical services like database connection start immediately.
2. **Early Listener Start**: HTTP server starts listening as early as possible.
3. **Deferred Non-Critical Services**: Background tasks, maintenance, and security scans are deferred.

### Benefits

- **Faster API Availability**: Server is ready to handle requests in ~500ms vs. several seconds.
- **Better Resource Management**: Resource-intensive operations are spread out over time.
- **Improved Reliability**: Critical services start even if non-critical services fail.

## Database Optimization

Intelligent database maintenance improves performance and reduces resource consumption.

### Features

- **Intelligent VACUUM**: Only vacuums tables with high dead tuple counts.
- **Targeted Reindexing**: Only reindexes fragmented indices.
- **Scheduled Maintenance**: Performs major maintenance during off-peak hours (3 AM).
- **Performance Metrics**: Collects and stores database performance metrics.

### Configuration Options

- Enable/disable database optimization: `config.features.enableDatabaseOptimization`
- Set maintenance delay: `config.maintenanceDelay`
- Control maintenance mode: Based on `startupPriority` ('maintenance' = full, 'speed' = minimal)

## Background Services

Background services are managed efficiently to reduce startup impact while ensuring all required tasks run.

### Included Services

- **Session Cleanup**: Automatically removes expired sessions.
- **Metrics Collection**: Gathers system and database metrics.
- **System Heartbeat**: Monitors memory usage and uptime.

### Configuration Options

- Enable/disable background tasks: `config.features.enableBackgroundTasks`
- Set background services delay: `config.backgroundServicesDelay`

## Security Scans

Security scanning is configurable to balance between security and performance.

### Features

- **Scheduled Scans**: Performs full security scans on a schedule.
- **Issue Tracking**: Tracks and reports security issues.
- **Different Scan Types**: Supports 'quick', 'full', and 'targeted' scans.

### Configuration Options

- Enable/disable security scans: `config.features.enableSecurityScans`
- Set security scan delay: `config.securityScanDelay`

## Environment-Specific Settings

The server provides different default settings optimized for each environment:

### Development

- Faster startup with minimal background services
- Debug-level logging
- Disabled rate limiting and caching
- Smaller connection pool (5 connections)

### Production

- Balanced settings with focus on reliability
- Warning-level logging (reduced verbosity)
- Full feature set enabled
- Larger connection pool (20 connections)
- HTTPS enabled
- Stricter CORS configuration

### Test

- Minimal feature set for fast testing
- Error-level logging only
- No background services or security scans
- Minimal connection pool (2 connections)

## Startup Modes

The server supports different startup modes to control which features are enabled:

### Minimal Mode

- Only essential services
- No background tasks, security scans, analytics, database optimization
- Fastest possible startup

### Standard Mode

- Default mode with balanced features
- Includes background tasks, security scans, analytics, database optimization
- Moderate startup speed

### Full Mode

- All features enabled
- Includes caching, rate limiting, and all optimization features
- Slowest startup but most complete feature set

## Performance Metrics

The server tracks and reports startup and runtime performance metrics:

- Total startup time
- Database connection time
- Active feature set
- Memory usage over time
- Database performance statistics

These metrics can be used to further optimize the server configuration.

---

## Usage Recommendations

1. **Development**: Use `speed` priority and `standard` mode for fast startup with basic features.
2. **Testing**: Use `speed` priority and `minimal` mode for fastest possible startup.
3. **Production**: Use `balanced` priority and `full` mode for complete feature set with reasonable startup time.
4. **Maintenance**: Use `maintenance` priority and `full` mode when performing system maintenance.

## Adding New Services

When adding new services to the server:

1. Make the service configurable through the central configuration system.
2. Support deferred initialization if the service is non-critical.
3. Add appropriate logging with the 'log' utility.
4. Consider the impact on startup time and resource usage.
5. Implement graceful startup and shutdown behavior.