#!/bin/bash

# XSS Vulnerability Automated Remediation Script
# This script attempts to automatically fix XSS vulnerabilities in the codebase

echo "┌──────────────────────────────────────────────────────┐"
echo "│         XSS VULNERABILITY REMEDIATION                 │"
echo "└──────────────────────────────────────────────────────┘"

# Navigate to the root directory
cd "$(dirname "$0")/../.."

# Process command line arguments
DRY_RUN=""
SEVERITY=""
DIRECTORIES=""

for arg in "$@"
do
  if [ "$arg" == "--dry-run" ]; then
    DRY_RUN="--dry-run"
    echo "Running in dry-run mode (no changes will be applied)"
  elif [ "$arg" == "--critical-only" ]; then
    SEVERITY="--critical-only"
    echo "Fixing critical vulnerabilities only"
  elif [ "$arg" == "--high-only" ]; then
    SEVERITY="--high-only"
    echo "Fixing high and critical vulnerabilities only"
  elif [ "${arg:0:1}" != "-" ]; then
    DIRECTORIES="$DIRECTORIES $arg"
  fi
done

# Make sure dompurify is installed
if [ -f "node_modules/dompurify/dist/purify.min.js" ]; then
  echo "DOMPurify is installed. Proceeding..."
else
  echo "Installing DOMPurify..."
  npm install dompurify @types/dompurify
  if [ $? -ne 0 ]; then
    echo "Failed to install DOMPurify. Aborting."
    exit 1
  fi
fi

# Run the XSS vulnerability remediation tool
echo "Running XSS vulnerability remediation..."
npx tsx server/tools/fixXssVulnerabilities.ts $DIRECTORIES $DRY_RUN $SEVERITY

# Check if the remediation was successful
if [ $? -eq 0 ]; then
    echo "✅ XSS vulnerability remediation completed. Check the output for details on fixes applied."
else
    echo "❌ XSS vulnerability remediation failed. Check the logs for details."
    exit 1
fi

echo ""
echo "XSS Vulnerability Remediation Complete"
echo "-------------------------------------"
echo "To ensure all vulnerabilities are properly fixed:"
echo "  1. Run the detect-xss.sh script to verify remaining issues"
echo "  2. Manually review and fix any remaining vulnerabilities"
echo "  3. Update your code to use the XSS prevention components"
echo "  4. Add the XSS middleware to your Express application"
echo ""
echo "For manual fixes, consider using:"
echo "  - DOMPurify.sanitize() for HTML content"
echo "  - textContent instead of innerHTML for text-only content"
echo "  - SafeHtml React component for rendering HTML"
echo "  - encodeURI() or encodeURIComponent() for URL parameters"
echo ""