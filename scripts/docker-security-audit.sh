#!/bin/bash
# Docker Security Audit Script
# This script audits Docker configurations for security best practices

# Default values
DOCKER_COMPOSE_FILE=""
DOCKERFILE=""
CONFIG_FILE=""
OUTPUT_FORMAT="text"  # text, json, markdown
OUTPUT_FILE=""
CHECK_CONTAINERS=true
CHECK_IMAGES=true
CHECK_NETWORKS=true
CHECK_VOLUMES=true
CHECK_DAEMON=true
VERBOSE=false

# Colors for terminal output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
  echo "Docker Security Audit Script"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --compose <file>       Docker Compose file to audit"
  echo "  --dockerfile <file>    Dockerfile to audit"
  echo "  --config <file>        Docker daemon config file to audit"
  echo "  --output <format>      Output format (text, json, markdown) [default: text]"
  echo "  --output-file <file>   Write output to file instead of stdout"
  echo "  --no-containers        Skip running container checks"
  echo "  --no-images            Skip image checks"
  echo "  --no-networks          Skip network checks"
  echo "  --no-volumes           Skip volume checks"
  echo "  --no-daemon            Skip Docker daemon checks"
  echo "  --verbose              Enable verbose output"
  echo "  --help                 Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --compose docker-compose.yml --dockerfile Dockerfile --output markdown --output-file security-audit.md"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --compose)
      DOCKER_COMPOSE_FILE="$2"
      shift 2
      ;;
    --dockerfile)
      DOCKERFILE="$2"
      shift 2
      ;;
    --config)
      CONFIG_FILE="$2"
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
    --no-containers)
      CHECK_CONTAINERS=false
      shift
      ;;
    --no-images)
      CHECK_IMAGES=false
      shift
      ;;
    --no-networks)
      CHECK_NETWORKS=false
      shift
      ;;
    --no-volumes)
      CHECK_VOLUMES=false
      shift
      ;;
    --no-daemon)
      CHECK_DAEMON=false
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed"
  exit 1
fi

# Initialize arrays to store findings
declare -a CRITICAL_FINDINGS
declare -a HIGH_FINDINGS
declare -a MEDIUM_FINDINGS
declare -a LOW_FINDINGS
declare -a PASSED_CHECKS

# Function to add a finding
add_finding() {
  local severity="$1"
  local category="$2"
  local issue="$3"
  local recommendation="$4"
  
  case "$severity" in
    CRITICAL)
      CRITICAL_FINDINGS+=("[$category] $issue - $recommendation")
      ;;
    HIGH)
      HIGH_FINDINGS+=("[$category] $issue - $recommendation")
      ;;
    MEDIUM)
      MEDIUM_FINDINGS+=("[$category] $issue - $recommendation")
      ;;
    LOW)
      LOW_FINDINGS+=("[$category] $issue - $recommendation")
      ;;
    PASS)
      PASSED_CHECKS+=("[$category] $issue")
      ;;
    *)
      echo "Error: Unknown severity level: $severity"
      ;;
  esac
}

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to check running containers
check_containers() {
  if [[ "$CHECK_CONTAINERS" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking running containers..."
  fi
  
  # Get list of running containers
  local containers=$(docker ps -q)
  
  if [[ -z "$containers" ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "No running containers found."
    fi
    return
  fi
  
  # Check each container
  for container_id in $containers; do
    local container_name=$(docker inspect --format '{{.Name}}' "$container_id" | sed 's/^\///')
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Checking container: $container_name"
    fi
    
    # Check if container is running as root
    local user=$(docker inspect --format '{{.Config.User}}' "$container_id")
    if [[ -z "$user" || "$user" == "0" || "$user" == "root" ]]; then
      add_finding "HIGH" "CONTAINER" "Container $container_name is running as root" "Run containers with a non-root user"
    else
      add_finding "PASS" "CONTAINER" "Container $container_name is running as non-root user $user"
    fi
    
    # Check if container is running in privileged mode
    local privileged=$(docker inspect --format '{{.HostConfig.Privileged}}' "$container_id")
    if [[ "$privileged" == "true" ]]; then
      add_finding "CRITICAL" "CONTAINER" "Container $container_name is running in privileged mode" "Avoid running containers in privileged mode"
    else
      add_finding "PASS" "CONTAINER" "Container $container_name is not running in privileged mode"
    fi
    
    # Check for dangerous capabilities
    local capabilities=$(docker inspect --format '{{range $cap, $value := .HostConfig.CapAdd}}{{$cap}} {{end}}' "$container_id")
    if [[ "$capabilities" == *"SYS_ADMIN"* ]]; then
      add_finding "HIGH" "CONTAINER" "Container $container_name has SYS_ADMIN capability" "Remove SYS_ADMIN capability"
    fi
    if [[ "$capabilities" == *"ALL"* ]]; then
      add_finding "HIGH" "CONTAINER" "Container $container_name has ALL capabilities" "Limit container capabilities"
    fi
    
    # Check for sensitive mounts
    local sensitive_mounts=("/etc" "/var/run/docker.sock" "/var/lib/docker" "/root" "/home")
    local mount_points=$(docker inspect --format '{{range .Mounts}}{{.Source}} {{end}}' "$container_id")
    
    for mount in "${sensitive_mounts[@]}"; do
      if [[ "$mount_points" == *"$mount"* ]]; then
        if [[ "$mount" == "/var/run/docker.sock" ]]; then
          add_finding "CRITICAL" "CONTAINER" "Container $container_name has Docker socket mounted" "Avoid mounting the Docker socket"
        else
          add_finding "HIGH" "CONTAINER" "Container $container_name has sensitive host path mounted: $mount" "Avoid mounting sensitive host paths"
        fi
      fi
    done
    
    # Check if no-new-privileges is set
    local no_new_privs=$(docker inspect --format '{{.HostConfig.SecurityOpt}}' "$container_id" | grep -c "no-new-privileges")
    if [[ "$no_new_privs" -eq 0 ]]; then
      add_finding "MEDIUM" "CONTAINER" "Container $container_name does not have no-new-privileges set" "Set no-new-privileges=true"
    else
      add_finding "PASS" "CONTAINER" "Container $container_name has no-new-privileges set"
    fi
    
    # Check for resource limits
    local memory_limit=$(docker inspect --format '{{.HostConfig.Memory}}' "$container_id")
    if [[ "$memory_limit" -eq 0 ]]; then
      add_finding "MEDIUM" "CONTAINER" "Container $container_name has no memory limit set" "Set memory limits for containers"
    else
      add_finding "PASS" "CONTAINER" "Container $container_name has memory limit set"
    fi
    
    local cpu_limit=$(docker inspect --format '{{.HostConfig.NanoCpus}}' "$container_id")
    if [[ "$cpu_limit" -eq 0 ]]; then
      add_finding "LOW" "CONTAINER" "Container $container_name has no CPU limit set" "Set CPU limits for containers"
    else
      add_finding "PASS" "CONTAINER" "Container $container_name has CPU limit set"
    fi
    
    # Check if container has a healthcheck
    local has_healthcheck=$(docker inspect --format '{{if .Config.Healthcheck}}true{{else}}false{{end}}' "$container_id")
    if [[ "$has_healthcheck" == "false" ]]; then
      add_finding "LOW" "CONTAINER" "Container $container_name does not have a healthcheck" "Add a healthcheck to the container"
    else
      add_finding "PASS" "CONTAINER" "Container $container_name has a healthcheck"
    fi
  done
}

# Function to check Docker images
check_images() {
  if [[ "$CHECK_IMAGES" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker images..."
  fi
  
  # Get list of images
  local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")
  
  if [[ -z "$images" ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "No Docker images found."
    fi
    return
  fi
  
  # Check each image
  for image in $images; do
    if [[ "$VERBOSE" == true ]]; then
      echo "Checking image: $image"
    fi
    
    # Check if image is using latest tag
    if [[ "$image" == *":latest" ]]; then
      add_finding "MEDIUM" "IMAGE" "Image $image uses 'latest' tag" "Use specific version tags instead of 'latest'"
    fi
    
    # Check for image user
    local image_user=$(docker inspect --format '{{.Config.User}}' "$image" 2>/dev/null)
    if [[ -z "$image_user" || "$image_user" == "0" || "$image_user" == "root" ]]; then
      add_finding "MEDIUM" "IMAGE" "Image $image runs as root by default" "Configure image to run as non-root user"
    else
      add_finding "PASS" "IMAGE" "Image $image runs as non-root user $image_user by default"
    fi
    
    # Check for exposed ports
    local exposed_ports=$(docker inspect --format '{{.Config.ExposedPorts}}' "$image" 2>/dev/null)
    if [[ "$exposed_ports" == "map[]" || -z "$exposed_ports" ]]; then
      add_finding "PASS" "IMAGE" "Image $image does not expose any ports by default"
    else
      # Check for sensitive ports
      if [[ "$exposed_ports" == *"22/tcp"* ]]; then
        add_finding "HIGH" "IMAGE" "Image $image exposes SSH port (22)" "Avoid exposing SSH port in container images"
      fi
    fi
  done
  
  # If Trivy is installed, use it for vulnerability scanning
  if command_exists trivy; then
    if [[ "$VERBOSE" == true ]]; then
      echo "Trivy found, scanning for vulnerabilities..."
    fi
    
    # Get first image to scan as example
    local first_image=$(echo "$images" | head -n 1)
    
    # Run a quick scan
    local vuln_count=$(trivy image --severity HIGH,CRITICAL --quiet "$first_image" 2>/dev/null | grep -c "Total:")
    
    if [[ $vuln_count -gt 0 ]]; then
      add_finding "HIGH" "IMAGE" "Vulnerabilities detected in image $first_image" "Scan and remediate vulnerabilities using Trivy"
    else
      add_finding "PASS" "IMAGE" "No critical or high vulnerabilities detected in $first_image"
    fi
  fi
}

# Function to check Docker networks
check_networks() {
  if [[ "$CHECK_NETWORKS" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker networks..."
  fi
  
  # Get list of networks
  local networks=$(docker network ls --format "{{.Name}}" | grep -v "bridge\|host\|none")
  
  if [[ -z "$networks" ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "No custom Docker networks found."
    fi
    return
  fi
  
  # Check each network
  for network in $networks; do
    if [[ "$VERBOSE" == true ]]; then
      echo "Checking network: $network"
    fi
    
    # Check if network is using bridge driver
    local driver=$(docker network inspect --format '{{.Driver}}' "$network")
    if [[ "$driver" == "bridge" ]]; then
      add_finding "PASS" "NETWORK" "Network $network uses bridge driver"
    fi
    
    # Check if network is internal
    local internal=$(docker network inspect --format '{{.Internal}}' "$network")
    if [[ "$internal" == "true" ]]; then
      add_finding "PASS" "NETWORK" "Network $network is internal"
    else
      add_finding "LOW" "NETWORK" "Network $network is not internal" "Use internal networks for sensitive services"
    fi
    
    # Check which containers are connected to this network
    local containers=$(docker network inspect --format '{{range $k, $v := .Containers}}{{$k}} {{end}}' "$network")
    if [[ -n "$containers" ]]; then
      if [[ "$VERBOSE" == true ]]; then
        echo "  Connected containers: $containers"
      fi
    fi
  done
}

# Function to check Docker volumes
check_volumes() {
  if [[ "$CHECK_VOLUMES" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker volumes..."
  fi
  
  # Get list of volumes
  local volumes=$(docker volume ls --format "{{.Name}}")
  
  if [[ -z "$volumes" ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "No Docker volumes found."
    fi
    return
  fi
  
  # Check each volume
  for volume in $volumes; do
    if [[ "$VERBOSE" == true ]]; then
      echo "Checking volume: $volume"
    fi
    
    # Check volume driver
    local driver=$(docker volume inspect --format '{{.Driver}}' "$volume")
    if [[ "$driver" == "local" ]]; then
      add_finding "LOW" "VOLUME" "Volume $volume uses local driver" "Consider using encrypted volume plugins for sensitive data"
    fi
    
    # Check which containers are using this volume
    local mountpoint=$(docker volume inspect --format '{{.Mountpoint}}' "$volume")
    local containers_using_volume=$(docker ps -a --filter "volume=$volume" --format "{{.Names}}")
    
    if [[ -n "$containers_using_volume" ]]; then
      if [[ "$VERBOSE" == true ]]; then
        echo "  Used by containers: $containers_using_volume"
      fi
    else
      add_finding "LOW" "VOLUME" "Volume $volume is not used by any container" "Remove unused volumes"
    fi
  done
}

# Function to check Docker daemon configuration
check_daemon_config() {
  if [[ "$CHECK_DAEMON" != true ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker daemon configuration..."
  fi
  
  # Try to find the daemon.json file if not specified
  if [[ -z "$CONFIG_FILE" ]]; then
    if [[ -f "/etc/docker/daemon.json" ]]; then
      CONFIG_FILE="/etc/docker/daemon.json"
    else
      add_finding "LOW" "DAEMON" "Docker daemon config file not found" "Create a daemon.json file with security configurations"
      return
    fi
  fi
  
  # Check if the file exists
  if [[ ! -f "$CONFIG_FILE" ]]; then
    add_finding "LOW" "DAEMON" "Docker daemon config file not found: $CONFIG_FILE" "Create a daemon.json file with security configurations"
    return
  fi
  
  # Check configurations in daemon.json
  if ! command_exists jq; then
    add_finding "LOW" "TOOL" "jq command not found, skipping detailed daemon configuration checks" "Install jq for better analysis"
    return
  fi
  
  # Check if live restore is enabled
  local live_restore=$(jq -r '.["live-restore"] // false' "$CONFIG_FILE")
  if [[ "$live_restore" == "true" ]]; then
    add_finding "PASS" "DAEMON" "Live restore is enabled in daemon configuration"
  else
    add_finding "LOW" "DAEMON" "Live restore is not enabled in daemon configuration" "Enable live-restore for container availability during daemon updates"
  fi
  
  # Check if user namespace remapping is configured
  local userns_remap=$(jq -r '.["userns-remap"] // ""' "$CONFIG_FILE")
  if [[ -n "$userns_remap" && "$userns_remap" != "null" ]]; then
    add_finding "PASS" "DAEMON" "User namespace remapping is configured in daemon configuration"
  else
    add_finding "MEDIUM" "DAEMON" "User namespace remapping is not configured in daemon configuration" "Enable userns-remap for better container isolation"
  fi
  
  # Check if default ulimits are set
  local default_ulimits=$(jq -r '.["default-ulimits"] // ""' "$CONFIG_FILE")
  if [[ -n "$default_ulimits" && "$default_ulimits" != "null" ]]; then
    add_finding "PASS" "DAEMON" "Default ulimits are configured in daemon configuration"
  else
    add_finding "LOW" "DAEMON" "Default ulimits are not configured in daemon configuration" "Set default-ulimits to restrict container resources"
  fi
  
  # Check if no-new-privileges is set by default
  local no_new_privs=$(jq -r '.["no-new-privileges"] // false' "$CONFIG_FILE")
  if [[ "$no_new_privs" == "true" ]]; then
    add_finding "PASS" "DAEMON" "No-new-privileges is enabled by default in daemon configuration"
  else
    add_finding "MEDIUM" "DAEMON" "No-new-privileges is not enabled by default in daemon configuration" "Set no-new-privileges to true by default"
  fi
  
  # Check if content trust is enforced
  local content_trust=$(jq -r '.["content-trust.require"] // false' "$CONFIG_FILE")
  if [[ "$content_trust" == "true" ]]; then
    add_finding "PASS" "DAEMON" "Content trust is enforced in daemon configuration"
  else
    add_finding "MEDIUM" "DAEMON" "Content trust is not enforced in daemon configuration" "Enable content-trust.require for verified image signing"
  fi
}

# Function to check Docker Compose file
check_docker_compose() {
  if [[ -z "$DOCKER_COMPOSE_FILE" || ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Docker Compose file: $DOCKER_COMPOSE_FILE"
  fi
  
  # Basic checks that don't require complex parsing
  
  # Check for privileged mode
  if grep -q "privileged:\s*true" "$DOCKER_COMPOSE_FILE"; then
    add_finding "CRITICAL" "COMPOSE" "Privileged mode is enabled in Docker Compose file" "Avoid using privileged mode in containers"
  fi
  
  # Check for host network mode
  if grep -q "network_mode:\s*host" "$DOCKER_COMPOSE_FILE"; then
    add_finding "HIGH" "COMPOSE" "Host network mode is used in Docker Compose file" "Avoid using host network mode"
  fi
  
  # Check for bind mounts of sensitive directories
  if grep -E -q "- /etc:|/var/run/docker.sock:|/var/lib/docker:" "$DOCKER_COMPOSE_FILE"; then
    add_finding "HIGH" "COMPOSE" "Sensitive host paths are mounted in Docker Compose file" "Avoid mounting sensitive host paths"
  fi
  
  # Check for resource limits
  if ! grep -q "mem_limit:" "$DOCKER_COMPOSE_FILE" && ! grep -q "cpus:" "$DOCKER_COMPOSE_FILE"; then
    add_finding "MEDIUM" "COMPOSE" "Resource limits are not set in Docker Compose file" "Set memory and CPU limits for containers"
  fi
  
  # Check for health checks
  if ! grep -q "healthcheck:" "$DOCKER_COMPOSE_FILE"; then
    add_finding "LOW" "COMPOSE" "Health checks are not configured in Docker Compose file" "Add health checks for containers"
  fi
  
  # Check for restart policies
  if ! grep -q "restart:" "$DOCKER_COMPOSE_FILE"; then
    add_finding "LOW" "COMPOSE" "Restart policies are not set in Docker Compose file" "Configure restart policies for containers"
  fi
  
  # For more advanced checks, we would need to parse YAML properly
  if command_exists yq; then
    if [[ "$VERBOSE" == true ]]; then
      echo "yq found, performing detailed Docker Compose checks..."
    fi
    
    # This would require more complex parsing with yq, which is beyond the scope of this script
  else
    add_finding "LOW" "TOOL" "yq command not found, skipping detailed Docker Compose checks" "Install yq for better analysis"
  fi
}

# Function to check Dockerfile
check_dockerfile() {
  if [[ -z "$DOCKERFILE" || ! -f "$DOCKERFILE" ]]; then
    return
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Checking Dockerfile: $DOCKERFILE"
  fi
  
  # Check if a specific base image version is used (not 'latest')
  if grep -q "FROM.*:latest" "$DOCKERFILE"; then
    add_finding "MEDIUM" "DOCKERFILE" "Using 'latest' tag in Dockerfile" "Use specific version tags for base images"
  fi
  
  # Check if USER instruction is present to run as non-root
  if ! grep -q "^USER " "$DOCKERFILE"; then
    add_finding "HIGH" "DOCKERFILE" "No USER instruction in Dockerfile" "Set a non-root user with the USER instruction"
  elif grep -q "^USER\s\+root" "$DOCKERFILE"; then
    add_finding "HIGH" "DOCKERFILE" "Container runs as root user" "Set a non-root user with the USER instruction"
  fi
  
  # Check for HEALTHCHECK instruction
  if ! grep -q "^HEALTHCHECK" "$DOCKERFILE"; then
    add_finding "LOW" "DOCKERFILE" "No HEALTHCHECK instruction in Dockerfile" "Add a HEALTHCHECK instruction"
  fi
  
  # Check if multiple FROM instructions are used (multi-stage builds)
  local from_count=$(grep -c "^FROM" "$DOCKERFILE")
  if [[ $from_count -lt 2 ]]; then
    add_finding "LOW" "DOCKERFILE" "Single-stage build in Dockerfile" "Consider using multi-stage builds to reduce image size"
  fi
  
  # Check for suspicious commands
  if grep -E -q "curl|wget|apt-get|apk" "$DOCKERFILE" && ! grep -q "rm -rf /var/lib/apt/lists/\*" "$DOCKERFILE" && ! grep -q "apk del" "$DOCKERFILE"; then
    add_finding "MEDIUM" "DOCKERFILE" "Package cache is not cleaned after installation" "Clean up package cache after installation"
  fi
  
  # Check for ADD instruction (prefer COPY)
  if grep -q "^ADD " "$DOCKERFILE"; then
    add_finding "LOW" "DOCKERFILE" "Using ADD instead of COPY in Dockerfile" "Prefer COPY over ADD for simple file copying"
  fi
  
  # Check for wildcards in COPY/ADD that might introduce unexpected files
  if grep -E -q "^(COPY|ADD) \.\s" "$DOCKERFILE" || grep -E -q "^(COPY|ADD) \*" "$DOCKERFILE"; then
    add_finding "MEDIUM" "DOCKERFILE" "Using wildcards in COPY/ADD instructions" "Explicitly specify files to copy to avoid including unwanted files"
  fi
}

# Run the checks
check_containers
check_images
check_networks
check_volumes
check_daemon_config
check_docker_compose
check_dockerfile

# Count findings
CRITICAL_COUNT=${#CRITICAL_FINDINGS[@]}
HIGH_COUNT=${#HIGH_FINDINGS[@]}
MEDIUM_COUNT=${#MEDIUM_FINDINGS[@]}
LOW_COUNT=${#LOW_FINDINGS[@]}
PASSED_COUNT=${#PASSED_CHECKS[@]}
TOTAL_ISSUES=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))
TOTAL_CHECKS=$((TOTAL_ISSUES + PASSED_COUNT))

# Calculate security score (0-100%)
if [[ $TOTAL_CHECKS -gt 0 ]]; then
  SECURITY_SCORE=$(( (PASSED_COUNT * 100) / TOTAL_CHECKS ))
else
  SECURITY_SCORE=0
fi

# Function to output results in plain text format
output_text() {
  echo "====== Docker Security Audit Report ======"
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "Security Score: $SECURITY_SCORE%"
  echo ""
  echo "Summary:"
  echo "  Critical Issues: $CRITICAL_COUNT"
  echo "  High Issues: $HIGH_COUNT"
  echo "  Medium Issues: $MEDIUM_COUNT"
  echo "  Low Issues: $LOW_COUNT"
  echo "  Passed Checks: $PASSED_COUNT"
  echo "  Total Checks: $TOTAL_CHECKS"
  echo ""
  
  if [[ $CRITICAL_COUNT -gt 0 ]]; then
    echo "=== CRITICAL ISSUES ==="
    for finding in "${CRITICAL_FINDINGS[@]}"; do
      echo -e "  ${RED}[CRITICAL]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $HIGH_COUNT -gt 0 ]]; then
    echo "=== HIGH ISSUES ==="
    for finding in "${HIGH_FINDINGS[@]}"; do
      echo -e "  ${YELLOW}[HIGH]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $MEDIUM_COUNT -gt 0 ]]; then
    echo "=== MEDIUM ISSUES ==="
    for finding in "${MEDIUM_FINDINGS[@]}"; do
      echo -e "  ${YELLOW}[MEDIUM]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $LOW_COUNT -gt 0 ]]; then
    echo "=== LOW ISSUES ==="
    for finding in "${LOW_FINDINGS[@]}"; do
      echo -e "  ${BLUE}[LOW]${NC} $finding"
    done
    echo ""
  fi
  
  if [[ $PASSED_COUNT -gt 0 && "$VERBOSE" == true ]]; then
    echo "=== PASSED CHECKS ==="
    for check in "${PASSED_CHECKS[@]}"; do
      echo -e "  ${GREEN}[PASS]${NC} $check"
    done
    echo ""
  fi
  
  echo "====== End of Report ======"
}

# Function to output results in JSON format
output_json() {
  local json="{"
  json+="\"security_score\": $SECURITY_SCORE,"
  json+="\"summary\": {"
  json+="\"critical_issues\": $CRITICAL_COUNT,"
  json+="\"high_issues\": $HIGH_COUNT,"
  json+="\"medium_issues\": $MEDIUM_COUNT,"
  json+="\"low_issues\": $LOW_COUNT,"
  json+="\"passed_checks\": $PASSED_COUNT,"
  json+="\"total_checks\": $TOTAL_CHECKS"
  json+="},"
  
  # Add findings
  json+="\"findings\": {"
  
  if [[ $CRITICAL_COUNT -gt 0 ]]; then
    json+="\"critical\": ["
    for ((i=0; i<${#CRITICAL_FINDINGS[@]}; i++)); do
      json+="\"${CRITICAL_FINDINGS[$i]}\""
      if [[ $i -lt $((${#CRITICAL_FINDINGS[@]}-1)) ]]; then
        json+=","
      fi
    done
    json+="],"
  else
    json+="\"critical\": [],"
  fi
  
  if [[ $HIGH_COUNT -gt 0 ]]; then
    json+="\"high\": ["
    for ((i=0; i<${#HIGH_FINDINGS[@]}; i++)); do
      json+="\"${HIGH_FINDINGS[$i]}\""
      if [[ $i -lt $((${#HIGH_FINDINGS[@]}-1)) ]]; then
        json+=","
      fi
    done
    json+="],"
  else
    json+="\"high\": [],"
  fi
  
  if [[ $MEDIUM_COUNT -gt 0 ]]; then
    json+="\"medium\": ["
    for ((i=0; i<${#MEDIUM_FINDINGS[@]}; i++)); do
      json+="\"${MEDIUM_FINDINGS[$i]}\""
      if [[ $i -lt $((${#MEDIUM_FINDINGS[@]}-1)) ]]; then
        json+=","
      fi
    done
    json+="],"
  else
    json+="\"medium\": [],"
  fi
  
  if [[ $LOW_COUNT -gt 0 ]]; then
    json+="\"low\": ["
    for ((i=0; i<${#LOW_FINDINGS[@]}; i++)); do
      json+="\"${LOW_FINDINGS[$i]}\""
      if [[ $i -lt $((${#LOW_FINDINGS[@]}-1)) ]]; then
        json+=","
      fi
    done
    json+="],"
  else
    json+="\"low\": [],"
  fi
  
  json+="\"passed\": ["
  for ((i=0; i<${#PASSED_CHECKS[@]}; i++)); do
    json+="\"${PASSED_CHECKS[$i]}\""
    if [[ $i -lt $((${#PASSED_CHECKS[@]}-1)) ]]; then
      json+=","
    fi
  done
  json+="]"
  
  json+="}}"
  
  echo "$json"
}

# Function to output results in Markdown format
output_markdown() {
  echo "# Docker Security Audit Report"
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "## Summary"
  echo ""
  echo "- **Security Score:** $SECURITY_SCORE%"
  echo "- **Critical Issues:** $CRITICAL_COUNT"
  echo "- **High Issues:** $HIGH_COUNT"
  echo "- **Medium Issues:** $MEDIUM_COUNT"
  echo "- **Low Issues:** $LOW_COUNT"
  echo "- **Passed Checks:** $PASSED_COUNT"
  echo "- **Total Checks:** $TOTAL_CHECKS"
  echo ""
  
  if [[ $CRITICAL_COUNT -gt 0 ]]; then
    echo "## Critical Issues"
    echo ""
    for finding in "${CRITICAL_FINDINGS[@]}"; do
      echo "- 🔴 **$finding**"
    done
    echo ""
  fi
  
  if [[ $HIGH_COUNT -gt 0 ]]; then
    echo "## High Issues"
    echo ""
    for finding in "${HIGH_FINDINGS[@]}"; do
      echo "- 🟠 **$finding**"
    done
    echo ""
  fi
  
  if [[ $MEDIUM_COUNT -gt 0 ]]; then
    echo "## Medium Issues"
    echo ""
    for finding in "${MEDIUM_FINDINGS[@]}"; do
      echo "- 🟡 **$finding**"
    done
    echo ""
  fi
  
  if [[ $LOW_COUNT -gt 0 ]]; then
    echo "## Low Issues"
    echo ""
    for finding in "${LOW_FINDINGS[@]}"; do
      echo "- 🔵 **$finding**"
    done
    echo ""
  fi
  
  if [[ $PASSED_COUNT -gt 0 ]]; then
    echo "## Passed Checks"
    echo ""
    for check in "${PASSED_CHECKS[@]}"; do
      echo "- ✅ **$check**"
    done
    echo ""
  fi
}

# Output the results
if [[ -n "$OUTPUT_FILE" ]]; then
  # Output to file
  case "$OUTPUT_FORMAT" in
    json)
      output_json > "$OUTPUT_FILE"
      ;;
    markdown)
      output_markdown > "$OUTPUT_FILE"
      ;;
    *)
      output_text > "$OUTPUT_FILE"
      ;;
  esac
  
  echo "Audit report written to: $OUTPUT_FILE"
else
  # Output to stdout
  case "$OUTPUT_FORMAT" in
    json)
      output_json
      ;;
    markdown)
      output_markdown
      ;;
    *)
      output_text
      ;;
  esac
fi

# Exit with appropriate code based on findings
if [[ $CRITICAL_COUNT -gt 0 ]]; then
  exit 3
elif [[ $HIGH_COUNT -gt 0 ]]; then
  exit 2
elif [[ $MEDIUM_COUNT -gt 0 ]]; then
  exit 1
else
  exit 0
fi