#!/bin/bash

# API Validation Test Routes Disabler
# This script disables all test validation routes for production deployment

# Define the .env file path
ENV_FILE=".env"
BACKUP_FILE=".env.bak"

# Create a backup
cp "$ENV_FILE" "$BACKUP_FILE" 2>/dev/null || true

# Function to update environment variable in .env file
update_env_var() {
  local var_name="$1"
  local var_value="$2"
  
  if grep -q "^$var_name=" "$ENV_FILE" 2>/dev/null; then
    # Update existing variable
    sed -i "s/^$var_name=.*/$var_name=$var_value/" "$ENV_FILE"
    echo "Updated $var_name to $var_value"
  else
    # Add new variable
    echo "$var_name=$var_value" >> "$ENV_FILE"
    echo "Added $var_name=$var_value"
  fi
}

# Disable all test-related environment variables
echo "Disabling API validation test routes..."
update_env_var "API_VALIDATION_TEST_MODE" "false"
update_env_var "API_VALIDATION_BYPASS_SECURITY" "false"
update_env_var "ENABLE_DIRECT_VALIDATION" "false"
update_env_var "CSRF_PROTECTION" "true"
update_env_var "RATE_LIMITING" "true"
update_env_var "SECURITY_SCAN_ENABLED" "true"

echo ""
echo "All test routes have been disabled."
echo "The application is now configured for production deployment."
echo ""
echo "If you need to re-enable test routes for development, run:"
echo "cp $BACKUP_FILE $ENV_FILE"
echo "or manually update the variables in .env"