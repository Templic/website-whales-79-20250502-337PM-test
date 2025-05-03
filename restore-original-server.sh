#!/bin/bash

# Script to restore the original server files after using speed mode patch

echo "🔄 Restoring original server files..."

# Check if backup exists
if [ -f "server/index.ts.backup" ]; then
  # Restore from backup
  cp server/index.ts.backup server/index.ts
  rm server/index.ts.backup
  
  echo "✅ Original server files restored successfully!"
else
  echo "❌ No backup file found at server/index.ts.backup"
  echo "Cannot restore original server files."
fi

# Remove speed mode flag file
rm -f .speed_mode_enabled

# Reset environment to standard mode
cat > .env << 'EOL'
ENABLE_SPEED_MODE=false
ENABLE_FULL_SECURITY=false
STARTUP_PRIORITY=standard
STARTUP_MODE=standard
ENABLE_SECURITY_SCANS=true
ENABLE_BACKGROUND_TASKS=true
ENABLE_DATABASE_OPTIMIZATION=true
EXTRA_LOGGING=false
SESSION_SECRET=typescript-error-management-secure-secret-$(openssl rand -hex 16)
EOL

echo "✅ Environment reset to standard mode"