#!/bin/bash

# Script to disable speed mode and return to standard mode
# This sets environment variables for balanced performance and security

echo "🔄 Disabling SPEED MODE and returning to STANDARD mode..."

# Update .env file
sed -i 's/ENABLE_SPEED_MODE=.*/ENABLE_SPEED_MODE=false/' .env
sed -i 's/STARTUP_PRIORITY=.*/STARTUP_PRIORITY=standard/' .env
sed -i 's/STARTUP_MODE=.*/STARTUP_MODE=standard/' .env
sed -i 's/ENABLE_SECURITY_SCANS=.*/ENABLE_SECURITY_SCANS=true/' .env
sed -i 's/EXTRA_LOGGING=.*/EXTRA_LOGGING=false/' .env

# Remove the flag file
rm -f .speed_mode_enabled

echo "✅ Standard mode enabled!"
echo "The server will now start with a balanced configuration."
echo "Security scans and other standard features are now enabled."
echo ""
echo "To re-enable speed mode, run: ./enable-speed-mode.sh"