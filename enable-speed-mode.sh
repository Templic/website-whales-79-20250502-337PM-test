#!/bin/bash

# Script to enable speed mode for the server
# This sets environment variables for maximum startup performance

echo "⚡ Enabling SPEED MODE for fastest server startup..."

# Update .env file
cat > .env << 'EOL'
ENABLE_SPEED_MODE=true
ENABLE_FULL_SECURITY=false
STARTUP_PRIORITY=quickstart
STARTUP_MODE=minimal
ENABLE_SECURITY_SCANS=false
ENABLE_BACKGROUND_TASKS=false
ENABLE_DATABASE_OPTIMIZATION=false
ENABLE_RATE_LIMITING=false
EXTRA_LOGGING=false
ENABLE_COMPRESSION=false
SESSION_SECRET=typescript-error-management-secure-secret-$(openssl rand -hex 16)
EOL

# Create or touch the flag file that signals speed mode
touch .speed_mode_enabled

# Make sure we have the proper speed mode configuration
cat > config/speed_mode.json << 'EOL'
{
  "environment": "speed_mode",
  "startupPriority": "quickstart",
  "deferBackgroundServices": true,
  "enableCompression": false,
  "csrfProtection": false,
  "features": {
    "enableDatabaseOptimization": false,
    "enableSecurityScans": false,
    "enableBackgroundTasks": false,
    "enableBackgroundServices": false,
    "enableRateLimiting": false,
    "enableContentFiltering": false,
    "enableCodeAnalysis": false,
    "enableInputSanitization": false,
    "enableTrustedTypes": false,
    "enableCSRF": false,
    "enableHSTS": false,
    "enableCSP": false,
    "enableXSS": false,
    "enableFrameOptions": false,
    "enableContentTypeOptions": false,
    "enableReferrerPolicy": false,
    "enableDNSPrefetch": false,
    "enablePermissionsPolicy": false,
    "enableCaching": false,
    "enableDeepSecurityScanning": false,
    "enableContinuousMonitoring": false,
    "enableThreatIntelligence": false,
    "enableAnomalyDetection": false,
    "enableWebSockets": true,
    "enableExtraLogging": false,
    "enableContentScheduling": false
  },
  "security": {
    "scanMode": "none"
  },
  "maintenanceDelay": 300000,
  "backgroundServicesDelay": 120000,
  "securityScanDelay": 900000
}
EOL

# Modify default memory setting
echo "export NODE_OPTIONS=--max-old-space-size=256" >> .bashrc

echo "✅ Speed mode enabled successfully!"
echo "The server will now start with the fastest possible configuration."
echo "All non-essential features are disabled for maximum performance."
echo ""
echo "To disable speed mode, run: ./disable-speed-mode.sh"