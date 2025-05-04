#!/bin/bash

# This script disables all test routes and validation bypass features for production use

echo "Disabling test routes and validation bypass features for production use..."

# Create a backup of the .env file
cp .env .env.test-backup

# Update environment variables in .env
sed -i 's/API_VALIDATION_TEST_MODE=true/API_VALIDATION_TEST_MODE=false/' .env
sed -i 's/API_VALIDATION_BYPASS_SECURITY=true/API_VALIDATION_BYPASS_SECURITY=false/' .env
sed -i 's/ENABLE_DIRECT_VALIDATION=true/ENABLE_DIRECT_VALIDATION=false/' .env
sed -i 's/CSRF_PROTECTION=false/CSRF_PROTECTION=true/' .env
sed -i 's/SECURITY_TEST_ROUTES=true/SECURITY_TEST_ROUTES=false/' .env
sed -i 's/ENABLE_NO_CSRF_ROUTES=true/ENABLE_NO_CSRF_ROUTES=false/' .env
sed -i 's/ENABLE_VALIDATION_BYPASS=true/ENABLE_VALIDATION_BYPASS=false/' .env

echo "Test routes disabled. The system is now configured for production use."
echo "A backup of the previous configuration was saved to .env.test-backup"