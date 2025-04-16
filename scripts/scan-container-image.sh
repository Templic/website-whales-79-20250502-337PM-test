#!/bin/bash
# Container Image Security Scanner
# This script scans a container image for security vulnerabilities

# Default values
IMAGE_NAME=""
SCAN_TOOL="trivy"
SEVERITY="HIGH,CRITICAL"
OUTPUT_FORMAT="table"
OUTPUT_FILE=""
EXIT_ON_FAILURE=false
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Usage: $0 [options] <image-name>"
  echo "Options:"
  echo "  -t, --tool <tool>        Scanning tool to use (trivy, clair, snyk) [default: trivy]"
  echo "  -s, --severity <levels>  Comma-separated list of severity levels to report (LOW,MEDIUM,HIGH,CRITICAL) [default: HIGH,CRITICAL]"
  echo "  -f, --format <format>    Output format (table, json) [default: table]"
  echo "  -o, --output <file>      Write results to file instead of stdout"
  echo "  -e, --exit-on-failure    Exit with non-zero code if vulnerabilities are found"
  echo "  -v, --verbose            Enable verbose output"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 -t trivy -s HIGH,CRITICAL -f json -o scan-results.json -e myapp:latest"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--tool)
      SCAN_TOOL="$2"
      shift 2
      ;;
    -s|--severity)
      SEVERITY="$2"
      shift 2
      ;;
    -f|--format)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -e|--exit-on-failure)
      EXIT_ON_FAILURE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
    *)
      if [[ -z "$IMAGE_NAME" ]]; then
        IMAGE_NAME="$1"
      else
        echo "Error: Multiple image names specified"
        show_usage
        exit 1
      fi
      shift
      ;;
  esac
done

# Validate required arguments
if [[ -z "$IMAGE_NAME" ]]; then
  echo "Error: Image name is required"
  show_usage
  exit 1
fi

# Display scan information if verbose
if [[ "$VERBOSE" == true ]]; then
  echo "Scanning image: $IMAGE_NAME"
  echo "Using tool: $SCAN_TOOL"
  echo "Severity levels: $SEVERITY"
  echo "Output format: $OUTPUT_FORMAT"
  if [[ -n "$OUTPUT_FILE" ]]; then
    echo "Output file: $OUTPUT_FILE"
  fi
  echo "Exit on failure: $EXIT_ON_FAILURE"
  echo ""
  echo "Starting scan..."
fi

# Function to check if a tool is installed
is_installed() {
  if command -v "$1" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Execute scan based on selected tool
scan_result=0
case "$SCAN_TOOL" in
  trivy)
    if ! is_installed trivy; then
      echo "Error: Trivy is not installed. Please install it first."
      exit 1
    fi

    # Build trivy command
    TRIVY_CMD="trivy image --severity $SEVERITY"
    
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      TRIVY_CMD="$TRIVY_CMD -f json"
    fi
    
    if [[ -n "$OUTPUT_FILE" ]]; then
      TRIVY_CMD="$TRIVY_CMD -o $OUTPUT_FILE"
    fi
    
    if [[ "$EXIT_ON_FAILURE" == true ]]; then
      TRIVY_CMD="$TRIVY_CMD --exit-code 1"
    fi
    
    # Execute trivy command
    if [[ "$VERBOSE" == true ]]; then
      echo "Executing: $TRIVY_CMD $IMAGE_NAME"
    fi
    
    $TRIVY_CMD $IMAGE_NAME
    scan_result=$?
    ;;
    
  clair)
    echo "Error: Clair scanner integration is not implemented yet."
    exit 1
    ;;
    
  snyk)
    if ! is_installed snyk; then
      echo "Error: Snyk is not installed. Please install it first."
      exit 1
    fi
    
    # Build snyk command
    SNYK_CMD="snyk container test"
    
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      SNYK_CMD="$SNYK_CMD --json"
    fi
    
    if [[ -n "$OUTPUT_FILE" ]]; then
      SNYK_CMD="$SNYK_CMD > $OUTPUT_FILE"
    fi
    
    # Execute snyk command
    if [[ "$VERBOSE" == true ]]; then
      echo "Executing: $SNYK_CMD $IMAGE_NAME"
    fi
    
    eval "$SNYK_CMD $IMAGE_NAME"
    scan_result=$?
    ;;
    
  *)
    echo "Error: Unsupported scanning tool: $SCAN_TOOL"
    exit 1
    ;;
esac

# Report scan completion
if [[ "$VERBOSE" == true ]]; then
  if [[ $scan_result -eq 0 ]]; then
    echo "Scan completed successfully with no vulnerabilities found."
  else
    echo "Scan completed with vulnerabilities found."
  fi
fi

# Exit with appropriate code
if [[ "$EXIT_ON_FAILURE" == true ]]; then
  exit $scan_result
else
  exit 0
fi