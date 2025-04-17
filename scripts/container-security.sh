#!/bin/bash
# Container Security Suite
# Central entry point for all containerization security tools

# Default values
OPERATION=""
SCRIPT_DIR=$(dirname "$(realpath "$0")")
VERBOSE=false

# Colors for terminal output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display banner
show_banner() {
  echo "==================================================================="
  echo "                   Container Security Suite                         "
  echo "            Comprehensive protection for containers                 "
  echo "==================================================================="
  echo ""
}

# Function to display usage
show_usage() {
  echo "Usage: $0 [operation] [options]"
  echo ""
  echo "Operations:"
  echo "  scan-image        Scan a container image for vulnerabilities"
  echo "  sign-image        Sign a container image for verification"
  echo "  verify-image      Verify a container image signature"
  echo "  benchmark         Run CIS Docker benchmark checks"
  echo "  runtime           Manage runtime protection (AppArmor/seccomp)"
  echo "  network           Configure zero-trust networking"
  echo "  storage           Manage secure storage for containers"
  echo "  scan-files        Scan IaC files for security issues"
  echo "  registry          Manage container registry security"
  echo "  observe           Set up container observability"
  echo "  audit             Run a comprehensive security audit"
  echo "  help              Show this help message"
  echo ""
  echo "General Options:"
  echo "  --verbose         Enable verbose output"
  echo "  --help            Show help for the selected operation"
  echo ""
  echo "Examples:"
  echo "  $0 scan-image --repo myorg/myapp --tag latest"
  echo "  $0 benchmark --output-file benchmark-report.txt"
  echo "  $0 runtime --create --profile web-app-seccomp --app-type web"
  echo "  $0 audit --full"
  echo ""
  echo "For help on specific operations, use: $0 [operation] --help"
}

# Function to check if a script exists
check_script() {
  local script="$1"
  
  if [[ ! -f "$SCRIPT_DIR/$script" ]]; then
    echo -e "${RED}Error: Required script not found: $SCRIPT_DIR/$script${NC}"
    echo "Make sure all security scripts are in the scripts directory"
    exit 1
  fi
  
  if [[ ! -x "$SCRIPT_DIR/$script" ]]; then
    echo -e "${YELLOW}Warning: Script is not executable: $SCRIPT_DIR/$script${NC}"
    echo "Making script executable..."
    chmod +x "$SCRIPT_DIR/$script"
  fi
}

# Function to run a script with arguments
run_script() {
  local script="$1"
  shift
  
  check_script "$script"
  
  if [[ "$VERBOSE" == true ]]; then
    echo -e "${BLUE}Running: $SCRIPT_DIR/$script $@${NC}"
  fi
  
  "$SCRIPT_DIR/$script" "$@"
  return $?
}

# Parse command line arguments
if [[ $# -eq 0 ]]; then
  show_banner
  show_usage
  exit 0
fi

OPERATION="$1"
shift

# Check for common options
for arg in "$@"; do
  case "$arg" in
    --verbose)
      VERBOSE=true
      ;;
    --help)
      SHOW_HELP=true
      ;;
  esac
done

# Execute the requested operation
case "$OPERATION" in
  scan-image)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "container-image-signing.sh" "--help"
    else
      run_script "container-image-signing.sh" "--scan" "$@"
    fi
    ;;
    
  sign-image)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "container-image-signing.sh" "--help"
    else
      run_script "container-image-signing.sh" "--sign" "$@"
    fi
    ;;
    
  verify-image)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "container-image-signing.sh" "--help"
    else
      run_script "container-image-signing.sh" "--verify" "$@"
    fi
    ;;
    
  benchmark)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "cis-docker-benchmark.sh" "--help"
    else
      run_script "cis-docker-benchmark.sh" "$@"
    fi
    ;;
    
  runtime)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "runtime-protection.sh" "--help"
    else
      run_script "runtime-protection.sh" "$@"
    fi
    ;;
    
  network)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "zero-trust-networking.sh" "--help"
    else
      run_script "zero-trust-networking.sh" "$@"
    fi
    ;;
    
  storage)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "ephemeral-storage-manager.sh" "--help"
    else
      run_script "ephemeral-storage-manager.sh" "$@"
    fi
    ;;
    
  scan-files)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "iac-security-scanner.sh" "--help"
    else
      run_script "iac-security-scanner.sh" "$@"
    fi
    ;;
    
  registry)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "registry-security-manager.sh" "--help"
    else
      run_script "registry-security-manager.sh" "$@"
    fi
    ;;
    
  observe)
    if [[ "$SHOW_HELP" == true ]]; then
      run_script "container-observability.sh" "--help"
    else
      run_script "container-observability.sh" "$@"
    fi
    ;;
    
  audit)
    # For audit, we run multiple security checks
    run_audit "$@"
    ;;
    
  help)
    show_banner
    show_usage
    ;;
    
  *)
    echo -e "${RED}Error: Unknown operation: $OPERATION${NC}"
    show_usage
    exit 1
    ;;
esac

# Function to run a comprehensive security audit
run_audit() {
  local full_check=false
  local output_format="text"
  local output_file=""
  
  # Parse arguments
  for arg in "$@"; do
    case "$arg" in
      --full)
        full_check=true
        ;;
      --output)
        output_format="$2"
        shift
        ;;
      --output-file)
        output_file="$2"
        shift
        ;;
    esac
    shift
  done
  
  # Create output directory
  local timestamp=$(date +%Y%m%d%H%M%S)
  local reports_dir="./reports/security"
  mkdir -p "$reports_dir"
  
  if [[ -z "$output_file" ]]; then
    output_file="$reports_dir/audit-report-$timestamp.txt"
  fi
  
  show_banner
  echo "Running comprehensive security audit..."
  echo "Output file: $output_file"
  echo ""
  
  # Initialize the report
  cat << EOF > "$output_file"
===============================================================
                CONTAINER SECURITY AUDIT REPORT
                      $(date +"%Y-%m-%d %H:%M:%S")
===============================================================

EOF
  
  # Run Docker benchmark
  echo "1. Running CIS Docker benchmark..."
  echo "===============================================================" >> "$output_file"
  echo "1. CIS DOCKER BENCHMARK RESULTS" >> "$output_file"
  echo "===============================================================" >> "$output_file"
  echo "" >> "$output_file"
  
  if [[ "$VERBOSE" == true ]]; then
    run_script "cis-docker-benchmark.sh" "--output" "$output_format" "--remediate" | tee -a "$output_file"
  else
    run_script "cis-docker-benchmark.sh" "--output" "$output_format" "--remediate" >> "$output_file"
  fi
  
  # Scan IaC files
  echo "2. Scanning infrastructure as code files..."
  echo "" >> "$output_file"
  echo "===============================================================" >> "$output_file"
  echo "2. INFRASTRUCTURE AS CODE SCAN RESULTS" >> "$output_file"
  echo "===============================================================" >> "$output_file"
  echo "" >> "$output_file"
  
  if [[ "$VERBOSE" == true ]]; then
    run_script "iac-security-scanner.sh" "--dir" "." "--output" "$output_format" | tee -a "$output_file"
  else
    run_script "iac-security-scanner.sh" "--dir" "." "--output" "$output_format" >> "$output_file"
  fi
  
  # If running full check, scan images too
  if [[ "$full_check" == true ]]; then
    echo "3. Scanning container images..."
    echo "" >> "$output_file"
    echo "===============================================================" >> "$output_file"
    echo "3. CONTAINER IMAGE SCAN RESULTS" >> "$output_file"
    echo "===============================================================" >> "$output_file"
    echo "" >> "$output_file"
    
    # Get list of local images
    local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")
    
    if [[ -z "$images" ]]; then
      echo "No container images found to scan." | tee -a "$output_file"
    else
      # Scan each image
      for image in $images; do
        echo "Scanning image: $image" | tee -a "$output_file"
        echo "" >> "$output_file"
        
        if [[ "$VERBOSE" == true ]]; then
          run_script "container-image-signing.sh" "--scan" "--image" "$image" "--output" "$output_format" | tee -a "$output_file"
        else
          run_script "container-image-signing.sh" "--scan" "--image" "$image" "--output" "$output_format" >> "$output_file"
        fi
        
        echo "" >> "$output_file"
      done
    fi
    
    # Check running containers
    echo "4. Checking running containers..."
    echo "" >> "$output_file"
    echo "===============================================================" >> "$output_file"
    echo "4. RUNNING CONTAINER SECURITY CHECK" >> "$output_file"
    echo "===============================================================" >> "$output_file"
    echo "" >> "$output_file"
    
    local containers=$(docker ps --format "{{.Names}}")
    
    if [[ -z "$containers" ]]; then
      echo "No running containers found to check." | tee -a "$output_file"
    else
      # Check each container
      for container in $containers; do
        echo "Analyzing container: $container" | tee -a "$output_file"
        echo "" >> "$output_file"
        
        if [[ "$VERBOSE" == true ]]; then
          run_script "container-observability.sh" "--analyze" "--container" "$container" "--output" "$output_format" | tee -a "$output_file"
        else
          run_script "container-observability.sh" "--analyze" "--container" "$container" "--output" "$output_format" >> "$output_file"
        fi
        
        echo "" >> "$output_file"
      done
    fi
  fi
  
  # Summary
  echo "" >> "$output_file"
  echo "===============================================================" >> "$output_file"
  echo "SUMMARY AND RECOMMENDATIONS" >> "$output_file"
  echo "===============================================================" >> "$output_file"
  echo "" >> "$output_file"
  echo "The security audit has been completed. Review the findings above" >> "$output_file"
  echo "and address any issues according to their severity." >> "$output_file"
  echo "" >> "$output_file"
  echo "For more information on container security best practices, refer to:" >> "$output_file"
  echo "- NIST Application Container Security Guide" >> "$output_file"
  echo "- CIS Docker Benchmark" >> "$output_file"
  echo "- OWASP Docker Security Cheat Sheet" >> "$output_file"
  echo "" >> "$output_file"
  echo "Audit completed at: $(date +"%Y-%m-%d %H:%M:%S")" >> "$output_file"
  
  echo ""
  echo -e "${GREEN}Security audit completed successfully!${NC}"
  echo "Report saved to: $output_file"
  echo ""
  echo "Review the report and address any security issues identified."
}

exit 0