#!/bin/bash

# Script to directly patch the server/index.ts file for speed mode
# This approach bypasses the configuration system entirely

echo "⚡ Applying SPEED MODE patches to server files..."

# Back up the original server/index.ts file
cp server/index.ts server/index.ts.backup

# Patch server/index.ts to disable security features
sed -i 's/import { runDeferredSecurityScan } from .\/securityScan/\/\/ import { runDeferredSecurityScan } from .\/securityScan/' server/index.ts
sed -i 's/import { enableMaximumSecurity } from .\/security\/enableMaximumSecurity/\/\/ import { enableMaximumSecurity } from .\/security\/enableMaximumSecurity/' server/index.ts
sed -i 's/import { scheduleIntelligentMaintenance } from .\/db-maintenance/\/\/ import { scheduleIntelligentMaintenance } from .\/db-maintenance/' server/index.ts
sed -i 's/import { initBackgroundServices, stopBackgroundServices } from .\/background-services/\/\/ import { initBackgroundServices, stopBackgroundServices } from .\/background-services/' server/index.ts
sed -i 's/import { AdvancedAPIValidation } from .\/security\/advanced\/apiValidation_new/\/\/ import { AdvancedAPIValidation } from .\/security\/advanced\/apiValidation_new/' server/index.ts
sed -i 's/import { RASPCore } from .\/security\/advanced\/rasp\/RASPCore/\/\/ import { RASPCore } from .\/security\/advanced\/rasp\/RASPCore/' server/index.ts
sed -i 's/import { SecurityMonitor } from .\/security\/advanced\/monitoring\/SecurityMonitor/\/\/ import { SecurityMonitor } from .\/security\/advanced\/monitoring\/SecurityMonitor/' server/index.ts

# Disable security monitor initialization
sed -i 's/SecurityMonitor.getInstance();/\/\/ SecurityMonitor.getInstance();/' server/index.ts

# Disable all non-critical services in the initializeNonCriticalServices function
cat > temp_function.txt << 'EOL'
/**
 * Initialize all non-critical services with deferred timing
 */
function initializeNonCriticalServices() {
  console.log('⚡ SPEED MODE: Non-critical services disabled');
  // All services disabled for maximum startup speed
}
EOL

# Replace the function with our speed-optimized version
sed -i '/function initializeNonCriticalServices/,/^}/c\\
/**\
 * Initialize all non-critical services with deferred timing - SPEED MODE VERSION\
 */\
function initializeNonCriticalServices() {\
  console.log("⚡ SPEED MODE: Non-critical services disabled");\
  // All services disabled for maximum startup speed\
}' server/index.ts

# Disable the initializeAllServices function too
sed -i '/async function initializeAllServices/,/^}/c\\
/**\
 * Initialize all services immediately - SPEED MODE VERSION\
 */\
async function initializeAllServices() {\
  console.log("⚡ SPEED MODE: All immediate services disabled");\
  // All services disabled for maximum startup speed\
}' server/index.ts

# Update the .env file to make sure we're in speed mode
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

# Create a flag file to indicate we're in speed mode
touch .speed_mode_enabled

echo "✅ Server files patched for SPEED MODE!"
echo "The server will now start with the fastest possible configuration."
echo "To restore original server files, run: ./restore-original-server.sh"
echo ""
echo "Remember: This is a TEMPORARY modification for development only."
echo "DO NOT use this in production environments."