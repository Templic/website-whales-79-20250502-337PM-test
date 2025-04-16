#!/bin/bash
# Secure Deployment Checker
# A comprehensive tool to validate security of containerized deployments

# Default values
SCRIPT_DIR=$(dirname "$(realpath "$0")")
BASE_DIR=$(realpath "$SCRIPT_DIR/..")
DOCKER_COMPOSE_FILE="$BASE_DIR/templates/docker-compose.secure.yml"
DOCKERFILE="$BASE_DIR/templates/Dockerfile.secure"
CONFIG_FILE="/etc/docker/daemon.json"
LOGS_DIR="$BASE_DIR/logs/security"
REPORT_DIR="$BASE_DIR/reports/security"
VERBOSE=false
FULL_CHECK=false
REMEDIATE=false
OUTPUT_FORMAT="text"

# Function to display usage
show_usage() {
  echo "Secure Deployment Checker"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --compose <file>      Docker Compose file to check [default: templates/docker-compose.secure.yml]"
  echo "  --dockerfile <file>   Dockerfile to check [default: templates/Dockerfile.secure]"
  echo "  --config <file>       Docker daemon config file [default: /etc/docker/daemon.json]"
  echo "  --logs-dir <dir>      Directory for logs [default: logs/security]"
  echo "  --report-dir <dir>    Directory for reports [default: reports/security]"
  echo "  --output <format>     Output format (text, json, markdown) [default: text]"
  echo "  --full-check          Run all available checks"
  echo "  --remediate           Attempt to fix common issues automatically"
  echo "  --verbose             Enable verbose output"
  echo "  --help                Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --compose docker-compose.yml --dockerfile Dockerfile --verbose"
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
    --logs-dir)
      LOGS_DIR="$2"
      shift 2
      ;;
    --report-dir)
      REPORT_DIR="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    --full-check)
      FULL_CHECK=true
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

# Create directories if they don't exist
mkdir -p "$LOGS_DIR"
mkdir -p "$REPORT_DIR"

# Generate timestamp for output files
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOGS_DIR/secure-deployment-check-$TIMESTAMP.log"
REPORT_FILE="$REPORT_DIR/secure-deployment-report-$TIMESTAMP.$OUTPUT_FORMAT"

# Function to log messages
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  
  if [[ "$VERBOSE" == true || "$level" == "ERROR" ]]; then
    if [[ "$level" == "ERROR" ]]; then
      echo -e "\e[31m[$timestamp] [$level] $message\e[0m"
    elif [[ "$level" == "WARNING" ]]; then
      echo -e "\e[33m[$timestamp] [$level] $message\e[0m"
    elif [[ "$level" == "SUCCESS" ]]; then
      echo -e "\e[32m[$timestamp] [$level] $message\e[0m"
    else
      echo "[$timestamp] [$level] $message"
    fi
  fi
}

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to display check status
print_check() {
  local name="$1"
  local result="$2"
  
  if [[ "$result" == "PASS" ]]; then
    log "SUCCESS" "✅ $name: PASS"
  elif [[ "$result" == "FAIL" ]]; then
    log "ERROR" "❌ $name: FAIL"
  elif [[ "$result" == "WARNING" ]]; then
    log "WARNING" "⚠️  $name: WARNING"
  else
    log "INFO" "ℹ️  $name: $result"
  fi
}

# Check if Docker is installed
check_docker_installed() {
  log "INFO" "Checking if Docker is installed..."
  
  if command_exists docker; then
    docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_check "Docker installation" "PASS"
    log "INFO" "Docker version: $docker_version"
    return 0
  else
    print_check "Docker installation" "FAIL"
    log "ERROR" "Docker is not installed"
    return 1
  fi
}

# Check if Docker Compose is installed
check_docker_compose_installed() {
  log "INFO" "Checking if Docker Compose is installed..."
  
  if command_exists docker-compose; then
    compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    print_check "Docker Compose installation" "PASS"
    log "INFO" "Docker Compose version: $compose_version"
    return 0
  else
    # Check if compose is available via docker compose command
    if docker compose version &>/dev/null; then
      compose_version=$(docker compose version --short)
      print_check "Docker Compose installation" "PASS"
      log "INFO" "Docker Compose version: $compose_version (via docker compose)"
      return 0
    else
      print_check "Docker Compose installation" "WARNING"
      log "WARNING" "Docker Compose is not installed"
      return 1
    fi
  fi
}

# Check Docker configuration
check_docker_configuration() {
  log "INFO" "Checking Docker configuration..."
  
  # Check if daemon.json exists
  if [[ -f "$CONFIG_FILE" ]]; then
    log "INFO" "Docker daemon config found: $CONFIG_FILE"
    
    # Basic checks without jq dependency
    if grep -q "userns-remap" "$CONFIG_FILE"; then
      print_check "User namespace remapping" "PASS"
    else
      print_check "User namespace remapping" "WARNING"
      log "WARNING" "User namespace remapping is not configured in daemon.json"
      
      if [[ "$REMEDIATE" == true ]]; then
        log "INFO" "Attempting to configure user namespace remapping..."
        # This would modify the config file and requires root permissions
        log "INFO" "Remediation requires root access and daemon restart - skipping automatic remediation"
      fi
    fi
    
    if grep -q "live-restore" "$CONFIG_FILE"; then
      print_check "Live restore" "PASS"
    else
      print_check "Live restore" "WARNING"
      log "WARNING" "Live restore is not configured in daemon.json"
    fi
    
    # More detailed checks if jq is available
    if command_exists jq; then
      log "INFO" "Running detailed configuration checks with jq..."
      
      # Check default runtime
      local default_runtime=$(jq -r '.["default-runtime"] // "runc"' "$CONFIG_FILE")
      if [[ "$default_runtime" == "runc" ]]; then
        print_check "Default runtime" "WARNING"
        log "WARNING" "Default runtime is set to runc - consider using a more secure runtime"
      else
        print_check "Default runtime" "PASS"
        log "INFO" "Default runtime is set to $default_runtime"
      fi
      
      # Check network settings
      local icc=$(jq -r '.["icc"] // true' "$CONFIG_FILE")
      if [[ "$icc" == "false" ]]; then
        print_check "Inter-container communication" "PASS"
      else
        print_check "Inter-container communication" "WARNING"
        log "WARNING" "Inter-container communication (icc) is enabled"
      fi
    else
      log "WARNING" "jq is not installed - skipping detailed configuration checks"
    fi
  else
    print_check "Docker daemon config" "WARNING"
    log "WARNING" "Docker daemon config file not found: $CONFIG_FILE"
  fi
}

# Check Docker security features
check_docker_security_features() {
  log "INFO" "Checking Docker security features..."
  
  # Check if Seccomp is enabled for Docker
  if docker info 2>/dev/null | grep -q "seccomp"; then
    print_check "Seccomp" "PASS"
  else
    print_check "Seccomp" "WARNING"
    log "WARNING" "Seccomp might not be enabled for Docker"
  fi
  
  # Check if AppArmor is enabled
  if docker info 2>/dev/null | grep -q "apparmor"; then
    print_check "AppArmor" "PASS"
  else
    print_check "AppArmor" "WARNING"
    log "WARNING" "AppArmor might not be enabled for Docker"
  fi
  
  # Check if user namespaces are enabled
  if docker info 2>/dev/null | grep -q "userns"; then
    print_check "User Namespaces" "PASS"
  else
    print_check "User Namespaces" "WARNING"
    log "WARNING" "User namespaces might not be enabled for Docker"
  fi
}

# Run Docker Bench Security if available
run_docker_bench() {
  log "INFO" "Checking for Docker Bench Security..."
  
  if [[ -d "$BASE_DIR/docker-bench-security" ]]; then
    log "INFO" "Running Docker Bench Security..."
    
    # Run Docker Bench Security and capture output
    "$BASE_DIR/docker-bench-security/docker-bench-security.sh" -c host -c container > "$REPORT_DIR/docker-bench-$TIMESTAMP.txt"
    
    print_check "Docker Bench Security" "PASS"
    log "INFO" "Docker Bench Security completed - report saved to $REPORT_DIR/docker-bench-$TIMESTAMP.txt"
  else
    print_check "Docker Bench Security" "SKIPPED"
    log "INFO" "Docker Bench Security not found - skipping check"
    
    if [[ "$FULL_CHECK" == true ]]; then
      log "INFO" "You can install Docker Bench Security for more comprehensive checks:"
      log "INFO" "git clone https://github.com/docker/docker-bench-security.git $BASE_DIR/docker-bench-security"
    fi
  fi
}

# Check Dockerfile for security best practices
check_dockerfile() {
  log "INFO" "Checking Dockerfile for security best practices: $DOCKERFILE"
  
  if [[ ! -f "$DOCKERFILE" ]]; then
    print_check "Dockerfile" "FAIL"
    log "ERROR" "Dockerfile not found: $DOCKERFILE"
    return 1
  fi
  
  # Check if the Dockerfile uses a root user
  if ! grep -q "USER" "$DOCKERFILE"; then
    print_check "Dockerfile: Non-root user" "FAIL"
    log "ERROR" "No USER instruction found in Dockerfile - containers might run as root"
  elif grep -q "USER\s\+root" "$DOCKERFILE"; then
    print_check "Dockerfile: Non-root user" "FAIL"
    log "ERROR" "Dockerfile explicitly sets user to root"
  else
    print_check "Dockerfile: Non-root user" "PASS"
  fi
  
  # Check for multi-stage builds
  if [[ $(grep -c "FROM" "$DOCKERFILE") -gt 1 ]]; then
    print_check "Dockerfile: Multi-stage build" "PASS"
  else
    print_check "Dockerfile: Multi-stage build" "WARNING"
    log "WARNING" "Dockerfile does not use multi-stage builds - consider optimizing"
  fi
  
  # Check for HEALTHCHECK instruction
  if grep -q "HEALTHCHECK" "$DOCKERFILE"; then
    print_check "Dockerfile: Healthcheck" "PASS"
  else
    print_check "Dockerfile: Healthcheck" "WARNING"
    log "WARNING" "No HEALTHCHECK instruction found in Dockerfile"
  fi
  
  # Check for latest tag in base images
  if grep -q "FROM.*:latest" "$DOCKERFILE"; then
    print_check "Dockerfile: Specific version tags" "FAIL"
    log "ERROR" "Dockerfile uses 'latest' tag for base images - use specific version tags"
  else
    print_check "Dockerfile: Specific version tags" "PASS"
  fi
  
  # Check for package cache cleanup
  if grep -E -q "apt-get|apk add" "$DOCKERFILE" && ! grep -E -q "rm -rf.*/var/lib/apt/lists/\*|apk del" "$DOCKERFILE"; then
    print_check "Dockerfile: Package cache cleanup" "WARNING"
    log "WARNING" "Dockerfile installs packages but might not clean up package cache"
  else
    print_check "Dockerfile: Package cache cleanup" "PASS"
  fi
}

# Check Docker Compose file for security best practices
check_docker_compose() {
  log "INFO" "Checking Docker Compose file for security best practices: $DOCKER_COMPOSE_FILE"
  
  if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    print_check "Docker Compose file" "FAIL"
    log "ERROR" "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    return 1
  fi
  
  # Check for privileged mode
  if grep -q "privileged:\s*true" "$DOCKER_COMPOSE_FILE"; then
    print_check "Docker Compose: Privileged mode" "FAIL"
    log "ERROR" "Docker Compose file uses privileged mode - this gives containers full access to the host"
  else
    print_check "Docker Compose: Privileged mode" "PASS"
  fi
  
  # Check for host network mode
  if grep -q "network_mode:\s*host" "$DOCKER_COMPOSE_FILE"; then
    print_check "Docker Compose: Host network mode" "WARNING"
    log "WARNING" "Docker Compose file uses host network mode - this gives containers full access to the host network"
  else
    print_check "Docker Compose: Host network mode" "PASS"
  fi
  
  # Check for resource limits
  if grep -q "cpu\|memory\|memswap\|mem_limit" "$DOCKER_COMPOSE_FILE"; then
    print_check "Docker Compose: Resource limits" "PASS"
  else
    print_check "Docker Compose: Resource limits" "WARNING"
    log "WARNING" "Docker Compose file does not set resource limits for containers"
  fi
  
  # Check for exposed ports
  if grep -q "ports:" "$DOCKER_COMPOSE_FILE"; then
    local exposed_ports=$(grep -A 10 "ports:" "$DOCKER_COMPOSE_FILE" | grep -v "ports:" | grep -v "^#" | grep -v "^$" | grep -E "^\s*-" | tr -d " \t-\"'" | grep -E "^[0-9]+" | sort -u)
    log "INFO" "Exposed ports found: $exposed_ports"
    
    # Check for sensitive ports
    for port in $exposed_ports; do
      case $port in
        22*|2222*)
          print_check "Docker Compose: Exposed SSH port ($port)" "FAIL"
          log "ERROR" "Docker Compose exposes SSH port $port - this is a security risk"
          ;;
        3306*|5432*)
          print_check "Docker Compose: Exposed database port ($port)" "WARNING"
          log "WARNING" "Docker Compose exposes database port $port - consider using internal networks"
          ;;
      esac
    done
  fi
  
  # Check for volume mounts
  if grep -q "volumes:" "$DOCKER_COMPOSE_FILE"; then
    # Check for sensitive host paths
    if grep -E -q "/etc/|/var/run/docker.sock|/var/lib/docker" "$DOCKER_COMPOSE_FILE"; then
      print_check "Docker Compose: Sensitive volume mounts" "FAIL"
      log "ERROR" "Docker Compose mounts sensitive host paths - this is a security risk"
    else
      print_check "Docker Compose: Sensitive volume mounts" "PASS"
    fi
    
    # Check for read-only mounts
    if grep -q "read_only: true" "$DOCKER_COMPOSE_FILE" || grep -q ":ro" "$DOCKER_COMPOSE_FILE"; then
      print_check "Docker Compose: Read-only mounts" "PASS"
    else
      print_check "Docker Compose: Read-only mounts" "WARNING"
      log "WARNING" "Docker Compose does not use read-only volume mounts - consider making appropriate volumes read-only"
    fi
  fi
  
  # Check for security options
  if grep -q "security_opt:" "$DOCKER_COMPOSE_FILE"; then
    print_check "Docker Compose: Security options" "PASS"
  else
    print_check "Docker Compose: Security options" "WARNING"
    log "WARNING" "Docker Compose does not set security options for containers"
  fi
  
  # Check for network configuration
  if grep -q "networks:" "$DOCKER_COMPOSE_FILE"; then
    # Check for internal networks
    if grep -q "internal: true" "$DOCKER_COMPOSE_FILE"; then
      print_check "Docker Compose: Internal networks" "PASS"
    else
      print_check "Docker Compose: Internal networks" "WARNING"
      log "WARNING" "Docker Compose does not use internal networks - consider isolating sensitive services"
    fi
  fi
}

# Check for container security tools
check_security_tools() {
  log "INFO" "Checking for container security tools..."
  
  # Check for Trivy
  if command_exists trivy; then
    print_check "Trivy installation" "PASS"
    log "INFO" "Trivy version: $(trivy --version 2>&1 | head -n 1)"
  else
    print_check "Trivy installation" "WARNING"
    log "WARNING" "Trivy is not installed - consider installing for container vulnerability scanning"
    
    if [[ "$REMEDIATE" == true ]]; then
      log "INFO" "Installation instructions for Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
    fi
  fi
  
  # Check for Falco
  if command_exists falco; then
    print_check "Falco installation" "PASS"
    log "INFO" "Falco version: $(falco --version 2>&1)"
  else
    print_check "Falco installation" "WARNING"
    log "WARNING" "Falco is not installed - consider installing for runtime security monitoring"
    
    if [[ "$REMEDIATE" == true ]]; then
      log "INFO" "Installation instructions for Falco: https://falco.org/docs/getting-started/installation/"
    fi
  fi
}

# Check for deployment optimizations
check_deployment_optimizations() {
  log "INFO" "Checking for deployment optimizations..."
  
  # Check for Docker Buildx
  if docker buildx version &>/dev/null; then
    print_check "Buildx installation" "PASS"
    log "INFO" "Buildx is installed for optimized builds"
  else
    print_check "Buildx installation" "WARNING"
    log "WARNING" "Docker Buildx is not installed - consider installing for optimized builds"
  fi
  
  # Check for container resource usage
  local containers=$(docker ps -q)
  if [[ -n "$containers" ]]; then
    log "INFO" "Checking container resource usage..."
    
    # Calculate total memory usage
    local total_memory=$(docker stats --no-stream --format "{{.MemUsage}}" $containers | awk '{print $1}' | sed 's/MiB//' | awk '{s+=$1} END {print s}')
    log "INFO" "Total container memory usage: $total_memory MiB"
    
    # Check if any container is using excessive resources
    for container in $containers; do
      local container_name=$(docker inspect --format '{{.Name}}' "$container" | sed 's/^\///')
      local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" | sed 's/%//')
      local mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" "$container" | sed 's/%//')
      
      if [[ $(echo "$cpu_usage > 80" | bc -l) -eq 1 ]]; then
        print_check "Container resource usage: $container_name CPU" "WARNING"
        log "WARNING" "Container $container_name is using high CPU: ${cpu_usage}%"
      fi
      
      if [[ $(echo "$mem_usage > 80" | bc -l) -eq 1 ]]; then
        print_check "Container resource usage: $container_name memory" "WARNING"
        log "WARNING" "Container $container_name is using high memory: ${mem_usage}%"
      fi
    done
  else
    log "INFO" "No running containers to check for resource usage"
  fi
}

# Run security audit script if available
run_security_audit() {
  log "INFO" "Checking for Docker security audit script..."
  
  local audit_script="$SCRIPT_DIR/docker-security-audit.sh"
  
  if [[ -f "$audit_script" ]]; then
    log "INFO" "Running Docker security audit script..."
    
    # Make sure the script is executable
    chmod +x "$audit_script"
    
    # Run the audit script with appropriate parameters
    "$audit_script" --output markdown --output-file "$REPORT_DIR/docker-audit-$TIMESTAMP.md"
    
    # Check the exit code
    if [[ $? -eq 0 ]]; then
      print_check "Docker security audit" "PASS"
    else
      print_check "Docker security audit" "WARNING"
      log "WARNING" "Docker security audit found issues - see report for details"
    fi
    
    log "INFO" "Docker security audit completed - report saved to $REPORT_DIR/docker-audit-$TIMESTAMP.md"
  else
    print_check "Docker security audit" "SKIPPED"
    log "INFO" "Docker security audit script not found - skipping audit"
  fi
}

# Generate final report
generate_report() {
  log "INFO" "Generating final report..."
  
  # Determine report format and extension
  local extension="txt"
  case "$OUTPUT_FORMAT" in
    json)
      extension="json"
      ;;
    markdown)
      extension="md"
      ;;
    *)
      extension="txt"
      ;;
  esac
  
  local report_file="$REPORT_DIR/deployment-security-report-$TIMESTAMP.$extension"
  
  # Extract findings from log
  local critical_count=$(grep -c "\[ERROR\]" "$LOG_FILE" || echo 0)
  local warning_count=$(grep -c "\[WARNING\]" "$LOG_FILE" || echo 0)
  local pass_count=$(grep -c "\[SUCCESS\]" "$LOG_FILE" || echo 0)
  local total_checks=$((critical_count + warning_count + pass_count))
  
  # Calculate security score
  local security_score=0
  if [[ $total_checks -gt 0 ]]; then
    security_score=$(( (pass_count * 100) / total_checks ))
  fi
  
  # Generate report in the appropriate format
  case "$OUTPUT_FORMAT" in
    json)
      # Generate JSON report
      echo "{" > "$report_file"
      echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$report_file"
      echo "  \"security_score\": $security_score," >> "$report_file"
      echo "  \"summary\": {" >> "$report_file"
      echo "    \"critical_issues\": $critical_count," >> "$report_file"
      echo "    \"warnings\": $warning_count," >> "$report_file"
      echo "    \"passed_checks\": $pass_count," >> "$report_file"
      echo "    \"total_checks\": $total_checks" >> "$report_file"
      echo "  }," >> "$report_file"
      
      # Extract findings
      echo "  \"critical_issues\": [" >> "$report_file"
      grep "\[ERROR\]" "$LOG_FILE" | sed 's/.*\[ERROR\] //' | awk '{print "    \"" $0 "\","}' | sed '$ s/,$//' >> "$report_file"
      echo "  ]," >> "$report_file"
      
      echo "  \"warnings\": [" >> "$report_file"
      grep "\[WARNING\]" "$LOG_FILE" | sed 's/.*\[WARNING\] //' | awk '{print "    \"" $0 "\","}' | sed '$ s/,$//' >> "$report_file"
      echo "  ]," >> "$report_file"
      
      echo "  \"passed_checks\": [" >> "$report_file"
      grep "\[SUCCESS\]" "$LOG_FILE" | sed 's/.*\[SUCCESS\] //' | awk '{print "    \"" $0 "\","}' | sed '$ s/,$//' >> "$report_file"
      echo "  ]" >> "$report_file"
      echo "}" >> "$report_file"
      ;;
      
    markdown)
      # Generate Markdown report
      echo "# Container Deployment Security Report" > "$report_file"
      echo "" >> "$report_file"
      echo "**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$report_file"
      echo "" >> "$report_file"
      echo "## Summary" >> "$report_file"
      echo "" >> "$report_file"
      echo "* **Security Score:** $security_score%" >> "$report_file"
      echo "* **Critical Issues:** $critical_count" >> "$report_file"
      echo "* **Warnings:** $warning_count" >> "$report_file"
      echo "* **Passed Checks:** $pass_count" >> "$report_file"
      echo "* **Total Checks:** $total_checks" >> "$report_file"
      echo "" >> "$report_file"
      
      if [[ $critical_count -gt 0 ]]; then
        echo "## Critical Issues" >> "$report_file"
        echo "" >> "$report_file"
        grep "\[ERROR\]" "$LOG_FILE" | sed 's/.*\[ERROR\] //' | awk '{print "* 🔴 " $0}' >> "$report_file"
        echo "" >> "$report_file"
      fi
      
      if [[ $warning_count -gt 0 ]]; then
        echo "## Warnings" >> "$report_file"
        echo "" >> "$report_file"
        grep "\[WARNING\]" "$LOG_FILE" | sed 's/.*\[WARNING\] //' | awk '{print "* ⚠️ " $0}' >> "$report_file"
        echo "" >> "$report_file"
      fi
      
      echo "## Passed Checks" >> "$report_file"
      echo "" >> "$report_file"
      grep "\[SUCCESS\]" "$LOG_FILE" | sed 's/.*\[SUCCESS\] //' | awk '{print "* ✅ " $0}' >> "$report_file"
      echo "" >> "$report_file"
      
      echo "## Recommendations" >> "$report_file"
      echo "" >> "$report_file"
      echo "Based on the findings, consider implementing these security improvements:" >> "$report_file"
      echo "" >> "$report_file"
      
      if grep -q "privileged mode" "$LOG_FILE"; then
        echo "* **Remove privileged mode** - Running containers in privileged mode grants them extensive access to the host system." >> "$report_file"
      fi
      
      if grep -q "run as root" "$LOG_FILE"; then
        echo "* **Use non-root users** - Run containers as non-root users to minimize the impact of container breakouts." >> "$report_file"
      fi
      
      if grep -q "user namespace" "$LOG_FILE"; then
        echo "* **Enable user namespace remapping** - This adds an extra layer of security by mapping container user IDs to unprivileged host IDs." >> "$report_file"
      fi
      
      if grep -q "resource limit" "$LOG_FILE"; then
        echo "* **Set resource limits** - Define CPU and memory limits for all containers to prevent resource exhaustion attacks." >> "$report_file"
      fi
      
      if grep -q "security option" "$LOG_FILE"; then
        echo "* **Add security options** - Use security options like no-new-privileges, seccomp profiles, and AppArmor to restrict container capabilities." >> "$report_file"
      fi
      
      if grep -q "network" "$LOG_FILE" && grep -q "internal" "$LOG_FILE"; then
        echo "* **Improve network isolation** - Use internal networks for sensitive services to isolate them from the public internet." >> "$report_file"
      fi
      
      if grep -q "latest tag" "$LOG_FILE"; then
        echo "* **Use specific version tags** - Avoid using 'latest' tags and specify exact version numbers for better control and reproducibility." >> "$report_file"
      fi
      
      if grep -q "health" "$LOG_FILE"; then
        echo "* **Add health checks** - Implement health checks for all containers to ensure they are functioning properly." >> "$report_file"
      fi
      ;;
      
    *)
      # Generate plain text report
      echo "Container Deployment Security Report" > "$report_file"
      echo "==================================" >> "$report_file"
      echo "" >> "$report_file"
      echo "Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$report_file"
      echo "" >> "$report_file"
      echo "Summary:" >> "$report_file"
      echo "--------" >> "$report_file"
      echo "Security Score: $security_score%" >> "$report_file"
      echo "Critical Issues: $critical_count" >> "$report_file"
      echo "Warnings: $warning_count" >> "$report_file"
      echo "Passed Checks: $pass_count" >> "$report_file"
      echo "Total Checks: $total_checks" >> "$report_file"
      echo "" >> "$report_file"
      
      if [[ $critical_count -gt 0 ]]; then
        echo "Critical Issues:" >> "$report_file"
        echo "---------------" >> "$report_file"
        grep "\[ERROR\]" "$LOG_FILE" | sed 's/.*\[ERROR\] //' | awk '{print "! " $0}' >> "$report_file"
        echo "" >> "$report_file"
      fi
      
      if [[ $warning_count -gt 0 ]]; then
        echo "Warnings:" >> "$report_file"
        echo "---------" >> "$report_file"
        grep "\[WARNING\]" "$LOG_FILE" | sed 's/.*\[WARNING\] //' | awk '{print "* " $0}' >> "$report_file"
        echo "" >> "$report_file"
      fi
      
      echo "Passed Checks:" >> "$report_file"
      echo "--------------" >> "$report_file"
      grep "\[SUCCESS\]" "$LOG_FILE" | sed 's/.*\[SUCCESS\] //' | awk '{print "+ " $0}' >> "$report_file"
      echo "" >> "$report_file"
      ;;
  esac
  
  log "INFO" "Final report generated: $report_file"
  
  # Print summary to terminal
  echo ""
  echo "==== Deployment Security Check Complete ===="
  echo "Security Score: $security_score%"
  echo "Critical Issues: $critical_count"
  echo "Warnings: $warning_count"
  echo "Passed Checks: $pass_count"
  echo "Total Checks: $total_checks"
  echo ""
  echo "Log file: $LOG_FILE"
  echo "Report file: $report_file"
  echo "=========================================="
  
  # Return exit code based on findings
  if [[ $critical_count -gt 0 ]]; then
    return 2
  elif [[ $warning_count -gt 0 ]]; then
    return 1
  else
    return 0
  fi
}

# Main function
main() {
  log "INFO" "Starting secure deployment check..."
  
  check_docker_installed
  check_docker_compose_installed
  check_docker_configuration
  check_docker_security_features
  check_dockerfile
  check_docker_compose
  check_security_tools
  
  if [[ "$FULL_CHECK" == true ]]; then
    run_docker_bench
    check_deployment_optimizations
    run_security_audit
  fi
  
  generate_report
  return $?
}

# Run main function
main
exit $?