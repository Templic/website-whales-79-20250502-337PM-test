#!/bin/bash

#
# MAXIMUM SECURITY SCAN RUNNER
#
# This script runs a comprehensive security scan of all codebase components including:
# - Deep dependency analysis for malicious code, backdoors, and vulnerabilities
# - Pattern matching for common security threats
# - Static code analysis for vulnerable patterns
# - Configuration file security audit
# - Network endpoint security analysis
# - Database security verification
#
# This is the most thorough security scan available and may take longer
# than the standard security scan.
#

echo "=========================================================="
echo "             MAXIMUM SECURITY SCAN                        "  
echo "                ALL SHIELDS UP                            "
echo "=========================================================="
echo ""
echo "This security scan performs an exhaustive analysis of all"
echo "system components, taking extra time to ensure the most"
echo "thorough security audit possible."
echo ""
echo "Scan components:"
echo "✓ Deep package dependency analysis"
echo "✓ Malicious code detection"
echo "✓ Supply chain attack vectors"
echo "✓ Known vulnerabilities"
echo "✓ Code obfuscation checks"
echo "✓ Network security"
echo "✓ Configuration security"
echo "✓ API endpoint security"
echo "✓ Database security"
echo ""
echo "Starting scan..."
echo "=========================================================="

# Make sure reports directory exists
mkdir -p reports/security

# Get the number of files in codebase
FILE_COUNT=$(find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" | wc -l)
PACKAGE_COUNT=$(node -e "try { const pkg = require('./package.json'); const count = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length; console.log(count); } catch (e) { console.log(0); }")

echo "Found ${FILE_COUNT} files and ${PACKAGE_COUNT} packages to scan."

# Run the scan
node --max-old-space-size=4096 ./maximum-security-scan.js --report --deep --verbose

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================================="
    echo "             SECURITY SCAN COMPLETE                       "
    echo "=========================================================="
    echo ""
    echo "Review the security reports in reports/security/"
    echo ""
else
    echo ""
    echo "=========================================================="
    echo "             SECURITY SCAN FAILED                         "
    echo "=========================================================="
    echo ""
    echo "The security scan encountered errors."
    echo "Please review the output above for more information."
    echo ""
    exit 1
fi