#!/bin/bash
# Security Tools Runner
# This script provides a simple interface to run various security tools

# Ensure the script is executable
# chmod +x security.sh

# Create necessary directories
mkdir -p logs/security-scans
mkdir -p reports/audits

# Help function
show_help() {
  echo "Security Tools Runner"
  echo "Usage: ./security.sh [command] [options]"
  echo ""
  echo "Commands:"
  echo "  scan           Run security scan"
  echo "  audit          Run security audit"
  echo "  scheduled      Run scheduled security scan"
  echo "  report         Generate security reports"
  echo "  help           Show this help message"
  echo ""
  echo "Options for scan:"
  echo "  --quick        Run quick scan"
  echo "  --full         Run full scan (default)"
  echo "  --fix          Attempt to fix detected issues"
  echo "  --report       Generate a report"
  echo ""
  echo "Options for audit:"
  echo "  --owasp        Focus on OWASP Top 10"
  echo "  --compliance   Include compliance checks"
  echo "  --detailed     Include detailed information"
  echo ""
  echo "Options for scheduled:"
  echo "  --notify       Send notifications"
  echo "  --compare      Compare with previous scan"
  echo "  --stats        Update security statistics"
  echo ""
  echo "Options for report:"
  echo "  --executive    Generate executive summary"
  echo "  --technical    Generate technical report (default)"
  echo "  --compliance   Generate compliance report"
  echo "  --trends       Generate trends report"
  echo "  --period=X     Time period (day, week, month, quarter, year)"
  echo ""
  echo "Examples:"
  echo "  ./security.sh scan"
  echo "  ./security.sh scan --quick --report"
  echo "  ./security.sh audit --owasp"
  echo "  ./security.sh report --executive --period=month"
}

# Check if we have arguments
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

# Get the command
CMD=$1
shift

case $CMD in
  scan)
    echo "Running security scan..."
    node scripts/security-scan.js "$@"
    ;;
  audit)
    echo "Running security audit..."
    node scripts/security-audit.js "$@"
    ;;
  scheduled)
    echo "Running scheduled security scan..."
    node scripts/scheduled-security-scan.js "$@"
    ;;
  report)
    echo "Generating security reports..."
    node scripts/security-report-generator.js "$@"
    ;;
  setup)
    # Make all scripts executable
    chmod +x scripts/security-scan.js
    chmod +x scripts/security-audit.js
    chmod +x scripts/scheduled-security-scan.js
    chmod +x scripts/security-report-generator.js
    echo "Security scripts are now executable"
    ;;
  help|*)
    show_help
    ;;
esac

exit 0