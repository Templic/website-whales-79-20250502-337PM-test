#!/bin/bash
# CIS Docker Benchmark Checker
# This script checks Docker configuration against CIS Benchmarks

# Default values
BENCHMARK_VERSION="1.3.1"
OUTPUT_FORMAT="text"
OUTPUT_FILE=""
CHECK_LEVEL=1  # Level 1 or 2
CHECK_HOST=true
CHECK_DAEMON=true
CHECK_CONTAINERS=true
CHECK_IMAGES=true
VERBOSE=false
REMEDIATE=false

# Colors for terminal output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
  echo "CIS Docker Benchmark Checker"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --level <n>          Check level (1 or 2) [default: 1]"
  echo "  --output <format>    Output format (text, json, csv) [default: text]"
  echo "  --output-file <file> Write output to file instead of stdout"
  echo "  --no-host            Skip host configuration checks"
  echo "  --no-daemon          Skip Docker daemon configuration checks"
  echo "  --no-containers      Skip container configuration checks"
  echo "  --no-images          Skip Docker image checks"
  echo "  --remediate          Show remediation steps for failed checks"
  echo "  --verbose            Enable verbose output"
  echo "  --help               Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --level 2 --output json --output-file benchmark-results.json --remediate"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --level)
      CHECK_LEVEL="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    --output-file)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --no-host)
      CHECK_HOST=false
      shift
      ;;
    --no-daemon)
      CHECK_DAEMON=false
      shift
      ;;
    --no-containers)
      CHECK_CONTAINERS=false
      shift
      ;;
    --no-images)
      CHECK_IMAGES=false
      shift
      ;;
    --remediate)
      REMEDIATE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate arguments
if [[ "$CHECK_LEVEL" != "1" && "$CHECK_LEVEL" != "2" ]]; then
  echo "Error: Check level must be 1 or 2"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed"
  exit 1
fi

# Initialize arrays to store findings
declare -a PASS_FINDINGS
declare -a FAIL_FINDINGS
declare -a INFO_FINDINGS
declare -a WARNING_FINDINGS
declare -a REMEDIATION_STEPS

# Function to add a finding
add_finding() {
  local check_id="$1"
  local status="$2"
  local description="$3"
  local details="$4"
  local level="$5"
  local remediation="$6"
  
  local finding="[$check_id] $description"
  
  case "$status" in
    PASS)
      PASS_FINDINGS+=("$finding")
      ;;
    FAIL)
      FAIL_FINDINGS+=("$finding - $details")
      if [[ -n "$remediation" ]]; then
        REMEDIATION_STEPS+=("[$check_id] $remediation")
      fi
      ;;
    INFO)
      INFO_FINDINGS+=("$finding - $details")
      ;;
    WARNING)
      WARNING_FINDINGS+=("$finding - $details")
      if [[ -n "$remediation" ]]; then
        REMEDIATION_STEPS+=("[$check_id] $remediation")
      fi
      ;;
    *)
      echo "Error: Unknown status: $status"
      ;;
  esac
}

# Function to print check status
print_check() {
  local check_id="$1"
  local status="$2"
  local description="$3"
  
  if [[ "$VERBOSE" == true ]]; then
    case "$status" in
      PASS)
        echo -e "${GREEN}[PASS]${NC} $check_id: $description"
        ;;
      FAIL)
        echo -e "${RED}[FAIL]${NC} $check_id: $description"
        ;;
      INFO)
        echo -e "${BLUE}[INFO]${NC} $check_id: $description"
        ;;
      WARNING)
        echo -e "${YELLOW}[WARN]${NC} $check_id: $description"
        ;;
      *)
        echo "[$status] $check_id: $description"
        ;;
    esac
  fi
}

# Function to run a command and return its output
run_command() {
  local cmd="$1"
  local output
  
  output=$(eval "$cmd" 2>&1)
  echo "$output"
}

# Check host configuration
check_host_configuration() {
  if [[ "$CHECK_HOST" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking host configuration..."
  fi
  
  # 1.1.1 - Ensure a separate partition for containers has been created
  local docker_root=$(docker info 2>/dev/null | grep "Docker Root Dir" | awk '{print $4}')
  local mount_point=$(df -P "$docker_root" | awk 'NR==2 {print $6}')
  
  if [[ "$mount_point" == "$docker_root" || "$mount_point" == "/" ]]; then
    add_finding "1.1.1" "FAIL" "Ensure a separate partition for containers has been created" "Docker root directory is not on a separate partition" "1" "Create a separate partition for the Docker root directory"
    print_check "1.1.1" "FAIL" "Ensure a separate partition for containers has been created"
  else
    add_finding "1.1.1" "PASS" "Ensure a separate partition for containers has been created" "" "1" ""
    print_check "1.1.1" "PASS" "Ensure a separate partition for containers has been created"
  fi
  
  # 1.1.2 - Ensure only trusted users are allowed to control Docker daemon
  local docker_group=$(getent group docker 2>/dev/null | cut -d: -f4 | tr ',' '\n' | wc -l)
  
  if [[ "$docker_group" -gt 0 ]]; then
    add_finding "1.1.2" "WARNING" "Ensure only trusted users are allowed to control Docker daemon" "$docker_group users in the docker group" "1" "Limit users in the docker group to only those that require it"
    print_check "1.1.2" "WARNING" "Ensure only trusted users are allowed to control Docker daemon"
  else
    add_finding "1.1.2" "PASS" "Ensure only trusted users are allowed to control Docker daemon" "" "1" ""
    print_check "1.1.2" "PASS" "Ensure only trusted users are allowed to control Docker daemon"
  fi
  
  # 1.1.3 - Ensure auditing is configured for the Docker daemon
  if [[ -f "/etc/audit/rules.d/docker.rules" ]] || run_command "auditctl -l" | grep -q docker; then
    add_finding "1.1.3" "PASS" "Ensure auditing is configured for the Docker daemon" "" "1" ""
    print_check "1.1.3" "PASS" "Ensure auditing is configured for the Docker daemon"
  else
    add_finding "1.1.3" "FAIL" "Ensure auditing is configured for the Docker daemon" "No audit rules found for Docker daemon" "1" "Add Docker daemon audit rules to /etc/audit/rules.d/docker.rules"
    print_check "1.1.3" "FAIL" "Ensure auditing is configured for the Docker daemon"
  fi
  
  # 1.1.4 - Ensure auditing is configured for Docker files and directories - /var/lib/docker
  if run_command "auditctl -l" | grep -q /var/lib/docker; then
    add_finding "1.1.4" "PASS" "Ensure auditing is configured for Docker files and directories" "" "1" ""
    print_check "1.1.4" "PASS" "Ensure auditing is configured for Docker files and directories"
  else
    add_finding "1.1.4" "FAIL" "Ensure auditing is configured for Docker files and directories" "No audit rules found for /var/lib/docker" "1" "Add audit rules for /var/lib/docker"
    print_check "1.1.4" "FAIL" "Ensure auditing is configured for Docker files and directories"
  fi
}

# Check Docker daemon configuration
check_daemon_configuration() {
  if [[ "$CHECK_DAEMON" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker daemon configuration..."
  fi
  
  # 2.1 - Ensure network traffic is restricted between containers on the default bridge
  local icc=$(docker info 2>/dev/null | grep "Inter Container Communication" | awk '{print $NF}')
  
  if [[ "$icc" == "false" ]]; then
    add_finding "2.1" "PASS" "Ensure network traffic is restricted between containers" "" "1" ""
    print_check "2.1" "PASS" "Ensure network traffic is restricted between containers"
  else
    add_finding "2.1" "FAIL" "Ensure network traffic is restricted between containers" "Inter-container communication is enabled" "1" "Set --icc=false in Docker daemon configuration"
    print_check "2.1" "FAIL" "Ensure network traffic is restricted between containers"
  fi
  
  # 2.2 - Ensure the logging level is set to 'info'
  local log_level=$(docker info 2>/dev/null | grep "Logging Driver" | awk '{print $3}')
  
  if [[ -n "$log_level" ]]; then
    add_finding "2.2" "INFO" "Docker logging configuration" "Logging driver: $log_level" "1" ""
    print_check "2.2" "INFO" "Docker logging configuration"
  else
    add_finding "2.2" "WARNING" "Docker logging configuration" "Logging driver not found" "1" "Configure Docker logging"
    print_check "2.2" "WARNING" "Docker logging configuration"
  fi
  
  # 2.3 - Ensure Docker is allowed to make changes to iptables
  local iptables=$(docker info 2>/dev/null | grep "iptables" | awk '{print $NF}')
  
  if [[ "$iptables" == "true" ]]; then
    add_finding "2.3" "PASS" "Ensure Docker is allowed to make changes to iptables" "" "1" ""
    print_check "2.3" "PASS" "Ensure Docker is allowed to make changes to iptables"
  else
    add_finding "2.3" "FAIL" "Ensure Docker is allowed to make changes to iptables" "Docker is not allowed to modify iptables" "1" "Do not set --iptables=false in Docker daemon"
    print_check "2.3" "FAIL" "Ensure Docker is allowed to make changes to iptables"
  fi
  
  # 2.4 - Ensure insecure registries are not used
  local insecure_registries=$(docker info 2>/dev/null | grep "Insecure Registries" -A 1 | grep -v "Insecure Registries")
  
  if [[ "$insecure_registries" == *"0.0.0.0/0"* ]]; then
    add_finding "2.4" "FAIL" "Ensure insecure registries are not used" "Insecure registries configured: $insecure_registries" "1" "Remove insecure registries from Docker daemon configuration"
    print_check "2.4" "FAIL" "Ensure insecure registries are not used"
  else
    add_finding "2.4" "PASS" "Ensure insecure registries are not used" "" "1" ""
    print_check "2.4" "PASS" "Ensure insecure registries are not used"
  fi
  
  # 2.5 - Ensure aufs storage driver is not used
  local storage_driver=$(docker info 2>/dev/null | grep "Storage Driver" | awk '{print $3}')
  
  if [[ "$storage_driver" == "aufs" ]]; then
    add_finding "2.5" "FAIL" "Ensure aufs storage driver is not used" "Current storage driver: aufs" "1" "Use a different storage driver (overlay2 recommended)"
    print_check "2.5" "FAIL" "Ensure aufs storage driver is not used"
  else
    add_finding "2.5" "PASS" "Ensure aufs storage driver is not used" "Current storage driver: $storage_driver" "1" ""
    print_check "2.5" "PASS" "Ensure aufs storage driver is not used"
  fi
  
  # 2.6 - Ensure TLS authentication for Docker daemon is configured
  local tls_verify=$(ps -ef | grep dockerd | grep tlsverify | grep -v grep | wc -l)
  
  if [[ "$tls_verify" -gt 0 ]]; then
    add_finding "2.6" "PASS" "Ensure TLS authentication for Docker daemon is configured" "" "1" ""
    print_check "2.6" "PASS" "Ensure TLS authentication for Docker daemon is configured"
  else
    add_finding "2.6" "WARNING" "Ensure TLS authentication for Docker daemon is configured" "TLS verification not enabled" "1" "Configure TLS certificates and enable --tlsverify"
    print_check "2.6" "WARNING" "Ensure TLS authentication for Docker daemon is configured"
  fi
  
  # 2.7 - Ensure the default ulimit is configured appropriately
  local ulimit=$(ps -ef | grep dockerd | grep "default-ulimit" | grep -v grep | wc -l)
  
  if [[ "$ulimit" -gt 0 ]]; then
    add_finding "2.7" "PASS" "Ensure the default ulimit is configured appropriately" "" "1" ""
    print_check "2.7" "PASS" "Ensure the default ulimit is configured appropriately"
  else
    add_finding "2.7" "WARNING" "Ensure the default ulimit is configured appropriately" "Default ulimit not configured" "1" "Set appropriate default ulimit in Docker daemon"
    print_check "2.7" "WARNING" "Ensure the default ulimit is configured appropriately"
  fi
  
  # 2.8 - Enable user namespace support
  local userns=$(docker info 2>/dev/null | grep -i "userns" | awk '{print $NF}')
  
  if [[ "$userns" == "true" ]]; then
    add_finding "2.8" "PASS" "Enable user namespace support" "" "1" ""
    print_check "2.8" "PASS" "Enable user namespace support"
  else
    add_finding "2.8" "WARNING" "Enable user namespace support" "User namespace not enabled" "1" "Enable user namespace support in Docker daemon"
    print_check "2.8" "WARNING" "Enable user namespace support"
  fi
}

# Check container configuration
check_container_configuration() {
  if [[ "$CHECK_CONTAINERS" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking container configuration..."
  fi
  
  # Get list of running containers
  local containers=$(docker ps -q)
  
  if [[ -z "$containers" ]]; then
    add_finding "4.0" "INFO" "Container checks" "No running containers found" "1" ""
    print_check "4.0" "INFO" "Container checks"
    return
  fi
  
  # Check each container
  for container_id in $containers; do
    local container_name=$(docker inspect --format '{{.Name}}' "$container_id" | sed 's/^\///')
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Checking container: $container_name"
    fi
    
    # 4.1 - Ensure a user for the container has been created
    local user=$(docker inspect --format '{{.Config.User}}' "$container_id")
    
    if [[ -z "$user" || "$user" == "0" || "$user" == "root" ]]; then
      add_finding "4.1" "FAIL" "Ensure a user for the container has been created" "Container $container_name is running as root" "1" "Use USER instruction in Dockerfile or --user in docker run"
      print_check "4.1" "FAIL" "Ensure a user for the container has been created"
    else
      add_finding "4.1" "PASS" "Ensure a user for the container has been created" "Container $container_name is running as $user" "1" ""
      print_check "4.1" "PASS" "Ensure a user for the container has been created"
    fi
    
    # 4.2 - Ensure that containers use trusted base images
    local image=$(docker inspect --format '{{.Config.Image}}' "$container_id")
    
    add_finding "4.2" "INFO" "Ensure that containers use trusted base images" "Container $container_name uses image $image" "1" "Ensure the image is from a trusted source"
    print_check "4.2" "INFO" "Ensure that containers use trusted base images"
    
    # 4.3 - Ensure unnecessary packages are not installed in the container
    add_finding "4.3" "INFO" "Ensure unnecessary packages are not installed in the container" "Manual verification required for container $container_name" "1" "Use multi-stage builds and minimal base images"
    print_check "4.3" "INFO" "Ensure unnecessary packages are not installed in the container"
    
    # 4.4 - Ensure images are scanned and rebuilt to include security patches
    add_finding "4.4" "INFO" "Ensure images are scanned and rebuilt to include security patches" "Manual verification required for container $container_name" "1" "Implement regular image scanning and updates"
    print_check "4.4" "INFO" "Ensure images are scanned and rebuilt to include security patches"
    
    # 4.5 - Ensure Content trust for Docker is Enabled
    local content_trust=$(env | grep DOCKER_CONTENT_TRUST | wc -l)
    
    if [[ "$content_trust" -gt 0 ]]; then
      add_finding "4.5" "PASS" "Ensure Content trust for Docker is Enabled" "" "1" ""
      print_check "4.5" "PASS" "Ensure Content trust for Docker is Enabled"
    else
      add_finding "4.5" "WARNING" "Ensure Content trust for Docker is Enabled" "DOCKER_CONTENT_TRUST not set to 1" "1" "Enable Docker Content Trust by setting DOCKER_CONTENT_TRUST=1"
      print_check "4.5" "WARNING" "Ensure Content trust for Docker is Enabled"
    fi
    
    # 4.6 - Ensure health check instructions have been added to container images
    local has_healthcheck=$(docker inspect --format '{{if .Config.Healthcheck}}true{{else}}false{{end}}' "$container_id")
    
    if [[ "$has_healthcheck" == "true" ]]; then
      add_finding "4.6" "PASS" "Ensure health check instructions have been added" "Container $container_name has a health check" "1" ""
      print_check "4.6" "PASS" "Ensure health check instructions have been added"
    else
      add_finding "4.6" "WARNING" "Ensure health check instructions have been added" "Container $container_name has no health check" "1" "Add HEALTHCHECK instruction to Dockerfile"
      print_check "4.6" "WARNING" "Ensure health check instructions have been added"
    fi
    
    # 4.7 - Ensure update instructions are not used alone in the Dockerfile
    add_finding "4.7" "INFO" "Ensure update instructions are not used alone in the Dockerfile" "Manual verification required" "1" "Combine update and install instructions in Dockerfile"
    print_check "4.7" "INFO" "Ensure update instructions are not used alone in the Dockerfile"
    
    # 4.8 - Ensure setuid and setgid permissions are removed in the images
    add_finding "4.8" "INFO" "Ensure setuid and setgid permissions are removed" "Manual verification required" "1" "Find and remove setuid/setgid binaries or reset their permissions"
    print_check "4.8" "INFO" "Ensure setuid and setgid permissions are removed"
    
    # 4.9 - Ensure COPY is used instead of ADD in Dockerfile
    add_finding "4.9" "INFO" "Ensure COPY is used instead of ADD in Dockerfile" "Manual verification required" "1" "Replace ADD with COPY in Dockerfile where appropriate"
    print_check "4.9" "INFO" "Ensure COPY is used instead of ADD in Dockerfile"
    
    # 4.10 - Ensure secrets are not stored in Dockerfiles
    add_finding "4.10" "INFO" "Ensure secrets are not stored in Dockerfiles" "Manual verification required" "1" "Use build arguments or secrets management"
    print_check "4.10" "INFO" "Ensure secrets are not stored in Dockerfiles"
    
    # 4.11 - Ensure only necessary ports are open on the container
    local ports=$(docker inspect --format '{{range $p, $conf := .NetworkSettings.Ports}} {{$p}} {{end}}' "$container_id")
    
    if [[ -z "$ports" ]]; then
      add_finding "4.11" "PASS" "Ensure only necessary ports are open" "Container $container_name exposes no ports" "1" ""
      print_check "4.11" "PASS" "Ensure only necessary ports are open"
    else
      add_finding "4.11" "INFO" "Ensure only necessary ports are open" "Container $container_name exposes: $ports" "1" "Verify these ports are necessary and restrict them"
      print_check "4.11" "INFO" "Ensure only necessary ports are open"
    fi
  done
}

# Check Docker image configuration
check_image_configuration() {
  if [[ "$CHECK_IMAGES" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker image configuration..."
  fi
  
  # Get list of images
  local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")
  
  if [[ -z "$images" ]]; then
    add_finding "5.0" "INFO" "Image checks" "No Docker images found" "1" ""
    print_check "5.0" "INFO" "Image checks"
    return
  fi
  
  # Check each image
  for image in $images; do
    if [[ "$VERBOSE" == true ]]; then
      echo "Checking image: $image"
    fi
    
    # 5.1 - Ensure that, when using the COPY instruction, files are verified against a checksum
    add_finding "5.1" "INFO" "Ensure files are verified against a checksum" "Manual verification required for $image" "2" "Implement file verification in your build process"
    print_check "5.1" "INFO" "Ensure files are verified against a checksum"
    
    # 5.2 - Ensure that container applications are not run as privileged or have all capabilities
    add_finding "5.2" "INFO" "Ensure container applications are not run as privileged" "Manual verification required for $image" "1" "Don't use --privileged flag"
    print_check "5.2" "INFO" "Ensure container applications are not run as privileged"
    
    # 5.3 - Ensure that Docker security hardening is implemented
    add_finding "5.3" "INFO" "Ensure that Docker security hardening is implemented" "Manual verification required for $image" "2" "Implement security options and restrict capabilities"
    print_check "5.3" "INFO" "Ensure that Docker security hardening is implemented"
    
    # Check if image is using latest tag
    if [[ "$image" == *":latest" ]]; then
      add_finding "5.4" "WARNING" "Avoid using 'latest' tag" "Image $image uses 'latest' tag" "1" "Use specific version tags instead of 'latest'"
      print_check "5.4" "WARNING" "Avoid using 'latest' tag"
    else
      add_finding "5.4" "PASS" "Avoid using 'latest' tag" "Image $image uses specific tag" "1" ""
      print_check "5.4" "PASS" "Avoid using 'latest' tag"
    fi
    
    # Check for image user
    local image_user=$(docker inspect --format '{{.Config.User}}' "$image" 2>/dev/null)
    if [[ -z "$image_user" || "$image_user" == "0" || "$image_user" == "root" ]]; then
      add_finding "5.5" "WARNING" "Ensure images use non-root user" "Image $image runs as root by default" "1" "Add a non-root user in Dockerfile"
      print_check "5.5" "WARNING" "Ensure images use non-root user"
    else
      add_finding "5.5" "PASS" "Ensure images use non-root user" "Image $image uses user: $image_user" "1" ""
      print_check "5.5" "PASS" "Ensure images use non-root user"
    fi
  done
}

# Function to output results in text format
output_text() {
  local pass_count=${#PASS_FINDINGS[@]}
  local fail_count=${#FAIL_FINDINGS[@]}
  local info_count=${#INFO_FINDINGS[@]}
  local warning_count=${#WARNING_FINDINGS[@]}
  local total_count=$((pass_count + fail_count + info_count + warning_count))
  
  echo "====== CIS Docker Benchmark Report ======"
  echo "Benchmark Version: $BENCHMARK_VERSION"
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "Summary:"
  echo "  PASS: $pass_count"
  echo "  FAIL: $fail_count"
  echo "  WARNING: $warning_count"
  echo "  INFO: $info_count"
  echo "  Total Checks: $total_count"
  echo ""
  
  if [[ $fail_count -gt 0 ]]; then
    echo "=== FAILED CHECKS ==="
    for finding in "${FAIL_FINDINGS[@]}"; do
      echo -e "  ${RED}[FAIL]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $warning_count -gt 0 ]]; then
    echo "=== WARNINGS ==="
    for finding in "${WARNING_FINDINGS[@]}"; do
      echo -e "  ${YELLOW}[WARNING]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $info_count -gt 0 ]]; then
    echo "=== INFORMATIONAL ==="
    for finding in "${INFO_FINDINGS[@]}"; do
      echo -e "  ${BLUE}[INFO]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $pass_count -gt 0 ]]; then
    echo "=== PASSED CHECKS ==="
    for finding in "${PASS_FINDINGS[@]}"; do
      echo -e "  ${GREEN}[PASS]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ "$REMEDIATE" == true && ${#REMEDIATION_STEPS[@]} -gt 0 ]]; then
    echo "=== REMEDIATION STEPS ==="
    for step in "${REMEDIATION_STEPS[@]}"; do
      echo -e "  $step"
    done
    echo ""
  fi
  
  echo "====== End of Report ======"
}

# Function to output results in JSON format
output_json() {
  local json="{"
  json+="\"benchmark_version\": \"$BENCHMARK_VERSION\","
  json+="\"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  json+="\"summary\": {"
  json+="\"pass\": ${#PASS_FINDINGS[@]},"
  json+="\"fail\": ${#FAIL_FINDINGS[@]},"
  json+="\"warning\": ${#WARNING_FINDINGS[@]},"
  json+="\"info\": ${#INFO_FINDINGS[@]},"
  json+="\"total\": $((${#PASS_FINDINGS[@]} + ${#FAIL_FINDINGS[@]} + ${#WARNING_FINDINGS[@]} + ${#INFO_FINDINGS[@]}))"
  json+="},"
  
  # Add findings
  json+="\"findings\": {"
  
  # Failed checks
  json+="\"fail\": ["
  for ((i=0; i<${#FAIL_FINDINGS[@]}; i++)); do
    json+="\"${FAIL_FINDINGS[$i]}\""
    if [[ $i -lt $((${#FAIL_FINDINGS[@]}-1)) ]]; then
      json+=","
    fi
  done
  json+="],"
  
  # Warnings
  json+="\"warning\": ["
  for ((i=0; i<${#WARNING_FINDINGS[@]}; i++)); do
    json+="\"${WARNING_FINDINGS[$i]}\""
    if [[ $i -lt $((${#WARNING_FINDINGS[@]}-1)) ]]; then
      json+=","
    fi
  done
  json+="],"
  
  # Info findings
  json+="\"info\": ["
  for ((i=0; i<${#INFO_FINDINGS[@]}; i++)); do
    json+="\"${INFO_FINDINGS[$i]}\""
    if [[ $i -lt $((${#INFO_FINDINGS[@]}-1)) ]]; then
      json+=","
    fi
  done
  json+="],"
  
  # Passed checks
  json+="\"pass\": ["
  for ((i=0; i<${#PASS_FINDINGS[@]}; i++)); do
    json+="\"${PASS_FINDINGS[$i]}\""
    if [[ $i -lt $((${#PASS_FINDINGS[@]}-1)) ]]; then
      json+=","
    fi
  done
  json+="]"
  
  json+="}"
  
  # Add remediation steps if requested
  if [[ "$REMEDIATE" == true && ${#REMEDIATION_STEPS[@]} -gt 0 ]]; then
    json+=","
    json+="\"remediation\": ["
    for ((i=0; i<${#REMEDIATION_STEPS[@]}; i++)); do
      json+="\"${REMEDIATION_STEPS[$i]}\""
      if [[ $i -lt $((${#REMEDIATION_STEPS[@]}-1)) ]]; then
        json+=","
      fi
    done
    json+="]"
  fi
  
  json+="}"
  
  echo "$json"
}

# Function to output results in CSV format
output_csv() {
  echo "Status,Check ID,Description,Details"
  
  for finding in "${PASS_FINDINGS[@]}"; do
    # Extract check ID and description
    local check_id=$(echo "$finding" | grep -oP '\[\K[^\]]+')
    local description=$(echo "$finding" | sed -E 's/\[[^]]+\] //')
    echo "PASS,$check_id,\"$description\",\"\""
  done
  
  for finding in "${FAIL_FINDINGS[@]}"; do
    # Extract check ID, description, and details
    local check_id=$(echo "$finding" | grep -oP '\[\K[^\]]+')
    local rest=$(echo "$finding" | sed -E 's/\[[^]]+\] //')
    local description=$(echo "$rest" | sed -E 's/ - .*$//')
    local details=$(echo "$rest" | sed -E 's/^[^-]+ - //')
    echo "FAIL,$check_id,\"$description\",\"$details\""
  done
  
  for finding in "${WARNING_FINDINGS[@]}"; do
    # Extract check ID, description, and details
    local check_id=$(echo "$finding" | grep -oP '\[\K[^\]]+')
    local rest=$(echo "$finding" | sed -E 's/\[[^]]+\] //')
    local description=$(echo "$rest" | sed -E 's/ - .*$//')
    local details=$(echo "$rest" | sed -E 's/^[^-]+ - //')
    echo "WARNING,$check_id,\"$description\",\"$details\""
  done
  
  for finding in "${INFO_FINDINGS[@]}"; do
    # Extract check ID, description, and details
    local check_id=$(echo "$finding" | grep -oP '\[\K[^\]]+')
    local rest=$(echo "$finding" | sed -E 's/\[[^]]+\] //')
    local description=$(echo "$rest" | sed -E 's/ - .*$//')
    local details=$(echo "$rest" | sed -E 's/^[^-]+ - //')
    echo "INFO,$check_id,\"$description\",\"$details\""
  done
  
  if [[ "$REMEDIATE" == true && ${#REMEDIATION_STEPS[@]} -gt 0 ]]; then
    echo ""
    echo "Remediation Steps"
    for step in "${REMEDIATION_STEPS[@]}"; do
      local check_id=$(echo "$step" | grep -oP '\[\K[^\]]+')
      local recommendation=$(echo "$step" | sed -E 's/\[[^]]+\] //')
      echo "REMEDIATE,$check_id,\"$recommendation\",\"\""
    done
  fi
}

# Run the checks
check_host_configuration
check_daemon_configuration
check_container_configuration
check_image_configuration

# Output the results
if [[ -n "$OUTPUT_FILE" ]]; then
  # Output to file
  case "$OUTPUT_FORMAT" in
    json)
      output_json > "$OUTPUT_FILE"
      ;;
    csv)
      output_csv > "$OUTPUT_FILE"
      ;;
    *)
      output_text > "$OUTPUT_FILE"
      ;;
  esac
  
  echo "Report written to: $OUTPUT_FILE"
else
  # Output to stdout
  case "$OUTPUT_FORMAT" in
    json)
      output_json
      ;;
    csv)
      output_csv
      ;;
    *)
      output_text
      ;;
  esac
fi

# Exit with appropriate code based on findings
if [[ ${#FAIL_FINDINGS[@]} -gt 0 ]]; then
  exit 1
else
  exit 0
fi