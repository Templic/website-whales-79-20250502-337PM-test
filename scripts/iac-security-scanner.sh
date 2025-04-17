#!/bin/bash
# Infrastructure as Code Security Scanner
# This script scans Docker and Kubernetes configuration files for security issues

# Default values
SCAN_DIR="."
OUTPUT_FORMAT="text"
OUTPUT_FILE=""
RULES_FILE="./security/iac/rules.yaml"
VERBOSE=false
CHECK_DOCKER=true
CHECK_KUBERNETES=true
CHECK_TERRAFORM=false
IGNORE_FILE=".iacsecignore"

# Colors for terminal output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
  echo "Infrastructure as Code Security Scanner"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --dir <path>          Directory to scan [default: current directory]"
  echo "  --output <format>     Output format (text, json, csv) [default: text]"
  echo "  --output-file <file>  Write output to file instead of stdout"
  echo "  --rules <file>        Custom rules file [default: ./security/iac/rules.yaml]"
  echo "  --no-docker           Skip Docker file checks"
  echo "  --no-kubernetes       Skip Kubernetes file checks"
  echo "  --terraform           Include Terraform file checks"
  echo "  --ignore <file>       Specify a custom ignore file [default: .iacsecignore]"
  echo "  --verbose             Enable verbose output"
  echo "  --help                Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --dir ./my-project --output json --output-file security-scan.json"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      SCAN_DIR="$2"
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
    --rules)
      RULES_FILE="$2"
      shift 2
      ;;
    --no-docker)
      CHECK_DOCKER=false
      shift
      ;;
    --no-kubernetes)
      CHECK_KUBERNETES=false
      shift
      ;;
    --terraform)
      CHECK_TERRAFORM=true
      shift
      ;;
    --ignore)
      IGNORE_FILE="$2"
      shift 2
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

# Initialize arrays to store findings
declare -a CRITICAL_FINDINGS
declare -a HIGH_FINDINGS
declare -a MEDIUM_FINDINGS
declare -a LOW_FINDINGS
declare -a INFO_FINDINGS

# Function to add a finding
add_finding() {
  local severity="$1"
  local type="$2"
  local rule="$3"
  local file="$4"
  local line="$5"
  local description="$6"
  local recommendation="$7"
  
  local finding="[$rule] $description in $file${line:+:$line} ($type)"
  
  case "$severity" in
    CRITICAL)
      CRITICAL_FINDINGS+=("$finding | $recommendation")
      ;;
    HIGH)
      HIGH_FINDINGS+=("$finding | $recommendation")
      ;;
    MEDIUM)
      MEDIUM_FINDINGS+=("$finding | $recommendation")
      ;;
    LOW)
      LOW_FINDINGS+=("$finding | $recommendation")
      ;;
    INFO)
      INFO_FINDINGS+=("$finding | $recommendation")
      ;;
    *)
      echo "Error: Unknown severity level: $severity"
      ;;
  esac
  
  if [[ "$VERBOSE" == true ]]; then
    case "$severity" in
      CRITICAL)
        echo -e "${RED}[CRITICAL]${NC} $finding"
        ;;
      HIGH)
        echo -e "${RED}[HIGH]${NC} $finding"
        ;;
      MEDIUM)
        echo -e "${YELLOW}[MEDIUM]${NC} $finding"
        ;;
      LOW)
        echo -e "${BLUE}[LOW]${NC} $finding"
        ;;
      INFO)
        echo -e "[INFO] $finding"
        ;;
    esac
  fi
}

# Function to check if a file should be ignored
should_ignore_file() {
  local file="$1"
  
  # If ignore file exists, check against it
  if [[ -f "$IGNORE_FILE" ]]; then
    while IFS= read -r pattern; do
      # Skip comments and empty lines
      [[ "$pattern" =~ ^# || -z "$pattern" ]] && continue
      
      # Check if file matches pattern
      if [[ "$file" == $pattern ]]; then
        return 0
      fi
    done < "$IGNORE_FILE"
  fi
  
  return 1
}

# Function to scan Dockerfile
scan_dockerfile() {
  local file="$1"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Scanning Dockerfile: $file"
  fi
  
  # Check for FROM using latest tag
  if grep -q "FROM.*:latest" "$file"; then
    local line=$(grep -n "FROM.*:latest" "$file" | cut -d':' -f1)
    add_finding "MEDIUM" "DOCKER" "DOCKER-001" "$file" "$line" "Using latest tag" \
      "Use specific version tags for base images instead of latest"
  fi
  
  # Check for running as root user
  if ! grep -q "USER " "$file"; then
    add_finding "HIGH" "DOCKER" "DOCKER-002" "$file" "" "No USER instruction found" \
      "Add USER instruction to run container as non-root user"
  elif grep -q "USER\s\+root" "$file"; then
    local line=$(grep -n "USER\s\+root" "$file" | cut -d':' -f1)
    add_finding "HIGH" "DOCKER" "DOCKER-003" "$file" "$line" "Container runs as root user" \
      "Use a non-root user for running the container"
  fi
  
  # Check for no HEALTHCHECK
  if ! grep -q "HEALTHCHECK" "$file"; then
    add_finding "LOW" "DOCKER" "DOCKER-004" "$file" "" "No HEALTHCHECK instruction" \
      "Add HEALTHCHECK instruction to enable container health monitoring"
  fi
  
  # Check for secrets in ENV instructions
  if grep -iE "ENV.*(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL).*=" "$file"; then
    local line=$(grep -in "ENV.*(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL).*=" "$file" | cut -d':' -f1)
    add_finding "HIGH" "DOCKER" "DOCKER-005" "$file" "$line" "Potential secret in ENV instruction" \
      "Never store secrets in Dockerfile. Use build args or secret mounting instead"
  fi
  
  # Check for ADD instead of COPY
  if grep -q "^ADD " "$file"; then
    local line=$(grep -n "^ADD " "$file" | cut -d':' -f1)
    add_finding "LOW" "DOCKER" "DOCKER-006" "$file" "$line" "Using ADD instead of COPY" \
      "Use COPY instead of ADD for simple file copying to reduce attack surface"
  fi
  
  # Check for apt-get without cleanup
  if grep -q "apt-get install" "$file" && ! grep -q "rm -rf /var/lib/apt/lists/\*" "$file"; then
    add_finding "LOW" "DOCKER" "DOCKER-007" "$file" "" "apt-get without cleanup" \
      "Clean up apt cache after installation to reduce image size and attack surface"
  fi
  
  # Check for sudo usage
  if grep -q "sudo " "$file"; then
    local line=$(grep -n "sudo " "$file" | cut -d':' -f1)
    add_finding "MEDIUM" "DOCKER" "DOCKER-008" "$file" "$line" "Using sudo in container" \
      "Avoid using sudo in containers; set appropriate permissions instead"
  fi
  
  # Check for curl piped to shell
  if grep -q "curl.*| \?sh" "$file" || grep -q "wget.*| \?sh" "$file"; then
    local line=$(grep -n "curl.*| \?sh\|wget.*| \?sh" "$file" | cut -d':' -f1)
    add_finding "HIGH" "DOCKER" "DOCKER-009" "$file" "$line" "Executing scripts directly from internet" \
      "Download scripts first, verify them, then execute them"
  fi
  
  # Check for exposed ports
  local exposed_ports=$(grep -E "^EXPOSE\s+([0-9]+)" "$file" | grep -oE "[0-9]+")
  
  # Check for specific sensitive ports
  for port in $exposed_ports; do
    case $port in
      22)
        local line=$(grep -n "EXPOSE.*$port" "$file" | cut -d':' -f1)
        add_finding "HIGH" "DOCKER" "DOCKER-010" "$file" "$line" "Exposing SSH port (22)" \
          "Avoid exposing SSH in containers; use Docker exec instead"
        ;;
      3306|5432|27017|6379)
        local line=$(grep -n "EXPOSE.*$port" "$file" | cut -d':' -f1)
        add_finding "MEDIUM" "DOCKER" "DOCKER-011" "$file" "$line" "Exposing database port ($port)" \
          "Consider not exposing database ports directly; use container networking instead"
        ;;
    esac
  done
  
  # Check for multi-stage builds
  if [[ $(grep -c "^FROM " "$file") -lt 2 ]]; then
    add_finding "LOW" "DOCKER" "DOCKER-012" "$file" "" "Not using multi-stage builds" \
      "Use multi-stage builds to reduce final image size and attack surface"
  fi
}

# Function to scan Docker Compose file
scan_docker_compose() {
  local file="$1"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Scanning Docker Compose file: $file"
  fi
  
  # Check for privileged mode
  if grep -q "privileged:\s*true" "$file"; then
    local line=$(grep -n "privileged:\s*true" "$file" | cut -d':' -f1)
    add_finding "CRITICAL" "DOCKER-COMPOSE" "COMPOSE-001" "$file" "$line" "Container running in privileged mode" \
      "Avoid using privileged mode; use specific capabilities instead"
  fi
  
  # Check for host network mode
  if grep -q "network_mode:\s*host" "$file"; then
    local line=$(grep -n "network_mode:\s*host" "$file" | cut -d':' -f1)
    add_finding "HIGH" "DOCKER-COMPOSE" "COMPOSE-002" "$file" "$line" "Container using host network mode" \
      "Avoid using host network mode; use bridge networks and expose specific ports"
  fi
  
  # Check for bind mounts of sensitive directories
  if grep -E "- /etc/|/var/run/docker.sock:|/var/lib/docker:|/root/|/home/" "$file"; then
    local line=$(grep -n -E "- /etc/|/var/run/docker.sock:|/var/lib/docker:|/root/|/home/" "$file" | cut -d':' -f1)
    add_finding "HIGH" "DOCKER-COMPOSE" "COMPOSE-003" "$file" "$line" "Mounting sensitive host paths" \
      "Avoid mounting sensitive host paths inside containers"
  fi
  
  # Specific check for docker.sock
  if grep -q "/var/run/docker.sock" "$file"; then
    local line=$(grep -n "/var/run/docker.sock" "$file" | cut -d':' -f1)
    add_finding "CRITICAL" "DOCKER-COMPOSE" "COMPOSE-004" "$file" "$line" "Mounting Docker socket" \
      "Mounting the Docker socket gives container full access to Docker daemon"
  fi
  
  # Check for missing resource limits
  if ! grep -q "mem_limit:\|memory:" "$file" && ! grep -q "cpus:\|cpu_quota:" "$file"; then
    add_finding "MEDIUM" "DOCKER-COMPOSE" "COMPOSE-005" "$file" "" "Missing resource limits" \
      "Set memory and CPU limits to prevent resource exhaustion attacks"
  fi
  
  # Check for missing restart policy (production concern)
  if ! grep -q "restart:" "$file"; then
    add_finding "LOW" "DOCKER-COMPOSE" "COMPOSE-006" "$file" "" "Missing restart policy" \
      "Configure restart policy for container availability"
  fi
  
  # Check for latest tag in image
  if grep -q "image:.*:latest" "$file"; then
    local line=$(grep -n "image:.*:latest" "$file" | cut -d':' -f1)
    add_finding "MEDIUM" "DOCKER-COMPOSE" "COMPOSE-007" "$file" "$line" "Using latest tag" \
      "Use specific version tags for images instead of latest"
  fi
  
  # Check for environment variables containing secrets
  if grep -i -E "environment:|env_file:" -A 20 "$file" | grep -i -E "(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL)[=:]"; then
    local line=$(grep -i -E "environment:|env_file:" -A 20 "$file" | grep -i -n -E "(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL)[=:]" | cut -d':' -f1)
    add_finding "HIGH" "DOCKER-COMPOSE" "COMPOSE-008" "$file" "$line" "Potential hardcoded secrets in environment variables" \
      "Use environment files, Docker secrets, or a secure secrets manager instead"
  fi
  
  # Check for missing healthcheck
  if ! grep -q "healthcheck:" "$file"; then
    add_finding "LOW" "DOCKER-COMPOSE" "COMPOSE-009" "$file" "" "Missing healthcheck configuration" \
      "Add health checks to detect and recover from failures"
  fi
  
  # Check for missing networks section
  if ! grep -q "networks:" "$file"; then
    add_finding "LOW" "DOCKER-COMPOSE" "COMPOSE-010" "$file" "" "Missing network configuration" \
      "Define custom networks for proper segmentation"
  else
    # If networks are defined, check if any are marked as internal
    if ! grep -q "internal: true" "$file"; then
      add_finding "MEDIUM" "DOCKER-COMPOSE" "COMPOSE-011" "$file" "" "No internal networks defined" \
        "Use internal networks for sensitive services that don't need external access"
    fi
  fi
  
  # Check for security_opt settings
  if ! grep -q "security_opt:" "$file"; then
    add_finding "MEDIUM" "DOCKER-COMPOSE" "COMPOSE-012" "$file" "" "Missing security options" \
      "Use security_opt to apply seccomp filters and limit container capabilities"
  fi
}

# Function to scan Kubernetes YAML files
scan_kubernetes() {
  local file="$1"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Scanning Kubernetes file: $file"
  fi
  
  # Check for privileged containers
  if grep -q "privileged: true" "$file"; then
    local line=$(grep -n "privileged: true" "$file" | cut -d':' -f1)
    add_finding "CRITICAL" "KUBERNETES" "K8S-001" "$file" "$line" "Container running in privileged mode" \
      "Avoid using privileged containers; use specific capabilities instead"
  fi
  
  # Check for hostNetwork
  if grep -q "hostNetwork: true" "$file"; then
    local line=$(grep -n "hostNetwork: true" "$file" | cut -d':' -f1)
    add_finding "HIGH" "KUBERNETES" "K8S-002" "$file" "$line" "Pod using host network" \
      "Avoid using host network; use services and expose specific ports"
  fi
  
  # Check for hostPID or hostIPC
  if grep -q "hostPID: true" "$file" || grep -q "hostIPC: true" "$file"; then
    local line=$(grep -n "hostPID: true\|hostIPC: true" "$file" | cut -d':' -f1)
    add_finding "HIGH" "KUBERNETES" "K8S-003" "$file" "$line" "Pod sharing host PID/IPC namespace" \
      "Avoid sharing host namespaces to maintain isolation"
  fi
  
  # Check for missing resource limits
  if grep -q "resources:" "$file" && ! grep -q "limits:" "$file"; then
    add_finding "MEDIUM" "KUBERNETES" "K8S-004" "$file" "" "Missing resource limits" \
      "Set memory and CPU limits to prevent resource exhaustion attacks"
  fi
  
  # Check for securityContext
  if ! grep -q "securityContext:" "$file"; then
    add_finding "MEDIUM" "KUBERNETES" "K8S-005" "$file" "" "Missing securityContext" \
      "Configure securityContext to set security-related options"
  else
    # Check if running as non-root
    if ! grep -q "runAsNonRoot: true" "$file"; then
      add_finding "HIGH" "KUBERNETES" "K8S-006" "$file" "" "Not configured to run as non-root user" \
        "Set runAsNonRoot: true and specify a non-zero user ID"
    fi
    
    # Check for allowPrivilegeEscalation
    if ! grep -q "allowPrivilegeEscalation: false" "$file"; then
      add_finding "HIGH" "KUBERNETES" "K8S-007" "$file" "" "Privilege escalation not disabled" \
        "Set allowPrivilegeEscalation: false to prevent privilege escalation"
    fi
  }
  
  # Check for latest tag in image
  if grep -q "image:.*:latest" "$file"; then
    local line=$(grep -n "image:.*:latest" "$file" | cut -d':' -f1)
    add_finding "MEDIUM" "KUBERNETES" "K8S-008" "$file" "$line" "Using latest tag" \
      "Use specific version tags for images instead of latest"
  fi
  
  # Check for missing liveness/readiness probes
  if ! grep -q "livenessProbe:" "$file" && ! grep -q "readinessProbe:" "$file"; then
    add_finding "LOW" "KUBERNETES" "K8S-009" "$file" "" "Missing health probes" \
      "Configure liveness and readiness probes for better reliability"
  fi
  
  # Check for hostPath volumes
  if grep -q "hostPath:" "$file"; then
    local line=$(grep -n "hostPath:" "$file" | cut -d':' -f1)
    add_finding "HIGH" "KUBERNETES" "K8S-010" "$file" "$line" "Using hostPath volume" \
      "Avoid using hostPath which allows access to host filesystem"
  fi
  
  # Check for secrets in environment variables
  if grep -q "env:" -A 50 "$file" | grep -i -E "(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL)"; then
    local line=$(grep -q "env:" -A 50 "$file" | grep -i -n -E "(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL)" | cut -d':' -f1)
    add_finding "HIGH" "KUBERNETES" "K8S-011" "$file" "$line" "Potential hardcoded secrets in environment variables" \
      "Use Secret resources and SecretKeyRef instead of hardcoding"
  fi
  
  # Check for network policies
  if ! grep -q "NetworkPolicy" "$file" && ! grep -q "kind: NetworkPolicy" "$file"; then
    add_finding "MEDIUM" "KUBERNETES" "K8S-012" "$file" "" "No NetworkPolicy found" \
      "Define NetworkPolicies to restrict pod communication"
  fi
}

# Function to scan Terraform files
scan_terraform() {
  local file="$1"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Scanning Terraform file: $file"
  fi
  
  # Check for AWS S3 buckets without encryption
  if grep -q "resource \"aws_s3_bucket\"" "$file" && ! grep -q "server_side_encryption_configuration" "$file"; then
    add_finding "HIGH" "TERRAFORM" "TF-001" "$file" "" "S3 bucket without encryption" \
      "Enable server-side encryption for S3 buckets"
  fi
  
  # Check for unsafe Docker options
  if grep -q "\"docker_container\"" "$file" && grep -q "privileged = true" "$file"; then
    local line=$(grep -n "privileged = true" "$file" | cut -d':' -f1)
    add_finding "CRITICAL" "TERRAFORM" "TF-002" "$file" "$line" "Docker container with privileged mode" \
      "Avoid using privileged mode for Docker containers"
  fi
  
  # Check for public IP exposure
  if grep -q "\"aws_instance\"" "$file" && grep -q "associate_public_ip_address = true" "$file"; then
    local line=$(grep -n "associate_public_ip_address = true" "$file" | cut -d':' -f1)
    add_finding "MEDIUM" "TERRAFORM" "TF-003" "$file" "$line" "EC2 instance with public IP" \
      "Limit public IP assignment to necessary instances only"
  fi
  
  # Check for hardcoded secrets
  if grep -i -E "(password|secret|key|token|credential) = \"[^\"]+\"" "$file"; then
    local line=$(grep -i -n -E "(password|secret|key|token|credential) = \"[^\"]+\"" "$file" | cut -d':' -f1)
    add_finding "CRITICAL" "TERRAFORM" "TF-004" "$file" "$line" "Hardcoded secrets" \
      "Use variables or a secrets management solution instead of hardcoding"
  fi
  
  # Check for open security groups
  if grep -q "\"aws_security_group_rule\"" "$file" && grep -q "cidr_blocks = \\[\"0.0.0.0/0\"\\]" "$file"; then
    local line=$(grep -n "cidr_blocks = \\[\"0.0.0.0/0\"\\]" "$file" | cut -d':' -f1)
    add_finding "HIGH" "TERRAFORM" "TF-005" "$file" "$line" "Security group open to the world" \
      "Restrict security group rules to specific IP ranges"
  fi
  
  # Check for missing encryption
  if grep -q "\"aws_rds_instance\"" "$file" && ! grep -q "storage_encrypted = true" "$file"; then
    add_finding "HIGH" "TERRAFORM" "TF-006" "$file" "" "RDS instance without encryption" \
      "Enable storage_encrypted for RDS instances"
  fi
  
  # Check for public access blocks
  if grep -q "\"aws_s3_bucket_public_access_block\"" "$file" && grep -q "block_public_acls = false" "$file"; then
    local line=$(grep -n "block_public_acls = false" "$file" | cut -d':' -f1)
    add_finding "HIGH" "TERRAFORM" "TF-007" "$file" "$line" "S3 bucket with public ACLs allowed" \
      "Set block_public_acls to true"
  fi
  
  # Check for unencrypted EBS volumes
  if grep -q "\"aws_ebs_volume\"" "$file" && ! grep -q "encrypted = true" "$file"; then
    add_finding "MEDIUM" "TERRAFORM" "TF-008" "$file" "" "Unencrypted EBS volume" \
      "Set encrypted = true for EBS volumes"
  fi
}

# Function to find all relevant files
find_files() {
  local dir="$1"
  
  if [[ ! -d "$dir" ]]; then
    echo "Error: Directory not found: $dir"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Scanning directory: $dir"
  fi
  
  # Find Dockerfiles
  if [[ "$CHECK_DOCKER" == true ]]; then
    local dockerfiles=$(find "$dir" -type f -name "Dockerfile*" -not -path "*/node_modules/*" -not -path "*/\.*" 2>/dev/null)
    dockerfiles+=" "$(find "$dir" -type f -name "*.dockerfile" -not -path "*/node_modules/*" -not -path "*/\.*" 2>/dev/null)
    
    for file in $dockerfiles; do
      if should_ignore_file "$file"; then
        if [[ "$VERBOSE" == true ]]; then
          echo "Skipping ignored file: $file"
        fi
        continue
      fi
      
      scan_dockerfile "$file"
    done
    
    # Find Docker Compose files
    local composefiles=$(find "$dir" -type f -name "docker-compose*.yml" -o -name "docker-compose*.yaml" -not -path "*/node_modules/*" -not -path "*/\.*" 2>/dev/null)
    
    for file in $composefiles; do
      if should_ignore_file "$file"; then
        if [[ "$VERBOSE" == true ]]; then
          echo "Skipping ignored file: $file"
        fi
        continue
      fi
      
      scan_docker_compose "$file"
    done
  fi
  
  # Find Kubernetes files
  if [[ "$CHECK_KUBERNETES" == true ]]; then
    local k8sfiles=$(find "$dir" -type f -name "*.yaml" -o -name "*.yml" -not -path "*/node_modules/*" -not -path "*/\.*" 2>/dev/null | xargs grep -l "apiVersion:\|kind:" 2>/dev/null)
    
    for file in $k8sfiles; do
      if should_ignore_file "$file"; then
        if [[ "$VERBOSE" == true ]]; then
          echo "Skipping ignored file: $file"
        fi
        continue
      fi
      
      # Check if this is actually a Kubernetes file
      if grep -q "apiVersion:" "$file" && grep -q "kind:" "$file"; then
        scan_kubernetes "$file"
      fi
    done
  fi
  
  # Find Terraform files
  if [[ "$CHECK_TERRAFORM" == true ]]; then
    local tffiles=$(find "$dir" -type f -name "*.tf" -not -path "*/node_modules/*" -not -path "*/\.*" 2>/dev/null)
    
    for file in $tffiles; do
      if should_ignore_file "$file"; then
        if [[ "$VERBOSE" == true ]]; then
          echo "Skipping ignored file: $file"
        fi
        continue
      fi
      
      scan_terraform "$file"
    done
  fi
}

# Function to output results in text format
output_text() {
  echo "====== Infrastructure as Code Security Scan ======"
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Scanned directory: $SCAN_DIR"
  echo ""
  
  local critical_count=${#CRITICAL_FINDINGS[@]}
  local high_count=${#HIGH_FINDINGS[@]}
  local medium_count=${#MEDIUM_FINDINGS[@]}
  local low_count=${#LOW_FINDINGS[@]}
  local info_count=${#INFO_FINDINGS[@]}
  local total_count=$((critical_count + high_count + medium_count + low_count + info_count))
  
  echo "Summary:"
  echo "  Critical Issues: $critical_count"
  echo "  High Issues: $high_count"
  echo "  Medium Issues: $medium_count"
  echo "  Low Issues: $low_count"
  echo "  Info: $info_count"
  echo "  Total Issues: $total_count"
  echo ""
  
  if [[ $critical_count -gt 0 ]]; then
    echo "=== CRITICAL ISSUES ==="
    for finding in "${CRITICAL_FINDINGS[@]}"; do
      local description=$(echo "$finding" | cut -d '|' -f1)
      local recommendation=$(echo "$finding" | cut -d '|' -f2)
      echo -e "${RED}[CRITICAL]${NC} $description"
      echo "           $recommendation"
      echo ""
    done
  fi
  
  if [[ $high_count -gt 0 ]]; then
    echo "=== HIGH ISSUES ==="
    for finding in "${HIGH_FINDINGS[@]}"; do
      local description=$(echo "$finding" | cut -d '|' -f1)
      local recommendation=$(echo "$finding" | cut -d '|' -f2)
      echo -e "${RED}[HIGH]${NC} $description"
      echo "       $recommendation"
      echo ""
    done
  fi
  
  if [[ $medium_count -gt 0 ]]; then
    echo "=== MEDIUM ISSUES ==="
    for finding in "${MEDIUM_FINDINGS[@]}"; do
      local description=$(echo "$finding" | cut -d '|' -f1)
      local recommendation=$(echo "$finding" | cut -d '|' -f2)
      echo -e "${YELLOW}[MEDIUM]${NC} $description"
      echo "        $recommendation"
      echo ""
    done
  fi
  
  if [[ $low_count -gt 0 ]]; then
    echo "=== LOW ISSUES ==="
    for finding in "${LOW_FINDINGS[@]}"; do
      local description=$(echo "$finding" | cut -d '|' -f1)
      local recommendation=$(echo "$finding" | cut -d '|' -f2)
      echo -e "${BLUE}[LOW]${NC} $description"
      echo "     $recommendation"
      echo ""
    done
  fi
  
  if [[ $info_count -gt 0 ]]; then
    echo "=== INFORMATIONAL ==="
    for finding in "${INFO_FINDINGS[@]}"; do
      local description=$(echo "$finding" | cut -d '|' -f1)
      local recommendation=$(echo "$finding" | cut -d '|' -f2)
      echo "[INFO] $description"
      echo "      $recommendation"
      echo ""
    done
  fi
  
  echo "====== End of Report ======"
}

# Function to output results in JSON format
output_json() {
  echo "{"
  echo "  \"scan_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," 
  echo "  \"scanned_directory\": \"$SCAN_DIR\","
  
  local critical_count=${#CRITICAL_FINDINGS[@]}
  local high_count=${#HIGH_FINDINGS[@]}
  local medium_count=${#MEDIUM_FINDINGS[@]}
  local low_count=${#LOW_FINDINGS[@]}
  local info_count=${#INFO_FINDINGS[@]}
  
  echo "  \"summary\": {"
  echo "    \"critical\": $critical_count,"
  echo "    \"high\": $high_count,"
  echo "    \"medium\": $medium_count,"
  echo "    \"low\": $low_count,"
  echo "    \"info\": $info_count,"
  echo "    \"total\": $((critical_count + high_count + medium_count + low_count + info_count))"
  echo "  },"
  
  echo "  \"findings\": {"
  
  # Critical findings
  echo "    \"critical\": ["
  for ((i=0; i<${#CRITICAL_FINDINGS[@]}; i++)); do
    local description=$(echo "${CRITICAL_FINDINGS[$i]}" | cut -d '|' -f1 | sed 's/"/\\"/g')
    local recommendation=$(echo "${CRITICAL_FINDINGS[$i]}" | cut -d '|' -f2 | sed 's/"/\\"/g')
    echo "      {"
    echo "        \"description\": \"$description\","
    echo "        \"recommendation\": \"$recommendation\""
    echo "      }$(if [[ $i -lt $((${#CRITICAL_FINDINGS[@]}-1)) ]]; then echo ','; fi)"
  done
  echo "    ],"
  
  # High findings
  echo "    \"high\": ["
  for ((i=0; i<${#HIGH_FINDINGS[@]}; i++)); do
    local description=$(echo "${HIGH_FINDINGS[$i]}" | cut -d '|' -f1 | sed 's/"/\\"/g')
    local recommendation=$(echo "${HIGH_FINDINGS[$i]}" | cut -d '|' -f2 | sed 's/"/\\"/g')
    echo "      {"
    echo "        \"description\": \"$description\","
    echo "        \"recommendation\": \"$recommendation\""
    echo "      }$(if [[ $i -lt $((${#HIGH_FINDINGS[@]}-1)) ]]; then echo ','; fi)"
  done
  echo "    ],"
  
  # Medium findings
  echo "    \"medium\": ["
  for ((i=0; i<${#MEDIUM_FINDINGS[@]}; i++)); do
    local description=$(echo "${MEDIUM_FINDINGS[$i]}" | cut -d '|' -f1 | sed 's/"/\\"/g')
    local recommendation=$(echo "${MEDIUM_FINDINGS[$i]}" | cut -d '|' -f2 | sed 's/"/\\"/g')
    echo "      {"
    echo "        \"description\": \"$description\","
    echo "        \"recommendation\": \"$recommendation\""
    echo "      }$(if [[ $i -lt $((${#MEDIUM_FINDINGS[@]}-1)) ]]; then echo ','; fi)"
  done
  echo "    ],"
  
  # Low findings
  echo "    \"low\": ["
  for ((i=0; i<${#LOW_FINDINGS[@]}; i++)); do
    local description=$(echo "${LOW_FINDINGS[$i]}" | cut -d '|' -f1 | sed 's/"/\\"/g')
    local recommendation=$(echo "${LOW_FINDINGS[$i]}" | cut -d '|' -f2 | sed 's/"/\\"/g')
    echo "      {"
    echo "        \"description\": \"$description\","
    echo "        \"recommendation\": \"$recommendation\""
    echo "      }$(if [[ $i -lt $((${#LOW_FINDINGS[@]}-1)) ]]; then echo ','; fi)"
  done
  echo "    ],"
  
  # Info findings
  echo "    \"info\": ["
  for ((i=0; i<${#INFO_FINDINGS[@]}; i++)); do
    local description=$(echo "${INFO_FINDINGS[$i]}" | cut -d '|' -f1 | sed 's/"/\\"/g')
    local recommendation=$(echo "${INFO_FINDINGS[$i]}" | cut -d '|' -f2 | sed 's/"/\\"/g')
    echo "      {"
    echo "        \"description\": \"$description\","
    echo "        \"recommendation\": \"$recommendation\""
    echo "      }$(if [[ $i -lt $((${#INFO_FINDINGS[@]}-1)) ]]; then echo ','; fi)"
  done
  echo "    ]"
  
  echo "  }"
  echo "}"
}

# Function to output results in CSV format
output_csv() {
  echo "Severity,Rule,Description,Recommendation"
  
  for finding in "${CRITICAL_FINDINGS[@]}"; do
    local rule=$(echo "$finding" | cut -d '|' -f1 | grep -o '\[[A-Z0-9-]*\]' | tr -d '[]')
    local description=$(echo "$finding" | cut -d '|' -f1 | sed "s/\[$rule\] //")
    local recommendation=$(echo "$finding" | cut -d '|' -f2 | sed 's/^ //')
    echo "CRITICAL,\"$rule\",\"$description\",\"$recommendation\""
  done
  
  for finding in "${HIGH_FINDINGS[@]}"; do
    local rule=$(echo "$finding" | cut -d '|' -f1 | grep -o '\[[A-Z0-9-]*\]' | tr -d '[]')
    local description=$(echo "$finding" | cut -d '|' -f1 | sed "s/\[$rule\] //")
    local recommendation=$(echo "$finding" | cut -d '|' -f2 | sed 's/^ //')
    echo "HIGH,\"$rule\",\"$description\",\"$recommendation\""
  done
  
  for finding in "${MEDIUM_FINDINGS[@]}"; do
    local rule=$(echo "$finding" | cut -d '|' -f1 | grep -o '\[[A-Z0-9-]*\]' | tr -d '[]')
    local description=$(echo "$finding" | cut -d '|' -f1 | sed "s/\[$rule\] //")
    local recommendation=$(echo "$finding" | cut -d '|' -f2 | sed 's/^ //')
    echo "MEDIUM,\"$rule\",\"$description\",\"$recommendation\""
  done
  
  for finding in "${LOW_FINDINGS[@]}"; do
    local rule=$(echo "$finding" | cut -d '|' -f1 | grep -o '\[[A-Z0-9-]*\]' | tr -d '[]')
    local description=$(echo "$finding" | cut -d '|' -f1 | sed "s/\[$rule\] //")
    local recommendation=$(echo "$finding" | cut -d '|' -f2 | sed 's/^ //')
    echo "LOW,\"$rule\",\"$description\",\"$recommendation\""
  done
  
  for finding in "${INFO_FINDINGS[@]}"; do
    local rule=$(echo "$finding" | cut -d '|' -f1 | grep -o '\[[A-Z0-9-]*\]' | tr -d '[]')
    local description=$(echo "$finding" | cut -d '|' -f1 | sed "s/\[$rule\] //")
    local recommendation=$(echo "$finding" | cut -d '|' -f2 | sed 's/^ //')
    echo "INFO,\"$rule\",\"$description\",\"$recommendation\""
  done
}

# Create default rules directory and file if they don't exist
create_default_rules() {
  local rules_dir=$(dirname "$RULES_FILE")
  
  if [[ ! -d "$rules_dir" ]]; then
    mkdir -p "$rules_dir"
  fi
  
  if [[ ! -f "$RULES_FILE" ]]; then
    cat << EOF > "$RULES_FILE"
# IaC Security Scanner Rules
# Format: Each rule has an ID, severity, description, and recommendation

rules:
  docker:
    - id: DOCKER-001
      severity: MEDIUM
      description: "Using latest tag"
      recommendation: "Use specific version tags for base images instead of latest"
    
    - id: DOCKER-002
      severity: HIGH
      description: "No USER instruction found"
      recommendation: "Add USER instruction to run container as non-root user"
    
    # More rules can be added here...

  compose:
    - id: COMPOSE-001
      severity: CRITICAL
      description: "Container running in privileged mode"
      recommendation: "Avoid using privileged mode; use specific capabilities instead"
    
    # More rules can be added here...

  kubernetes:
    - id: K8S-001
      severity: CRITICAL
      description: "Container running in privileged mode"
      recommendation: "Avoid using privileged containers; use specific capabilities instead"
    
    # More rules can be added here...

  terraform:
    - id: TF-001
      severity: HIGH
      description: "S3 bucket without encryption"
      recommendation: "Enable server-side encryption for S3 buckets"
    
    # More rules can be added here...
EOF
  fi
}

# Main function
main() {
  # Create default rules if they don't exist
  create_default_rules
  
  # Run the scan
  find_files "$SCAN_DIR"
  
  # Count findings
  local critical_count=${#CRITICAL_FINDINGS[@]}
  local high_count=${#HIGH_FINDINGS[@]}
  local medium_count=${#MEDIUM_FINDINGS[@]}
  local low_count=${#LOW_FINDINGS[@]}
  local info_count=${#INFO_FINDINGS[@]}
  local total_count=$((critical_count + high_count + medium_count + low_count + info_count))
  
  # Output the results
  if [[ -n "$OUTPUT_FILE" ]]; then
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
    
    echo "Scan completed. Found $total_count issues."
    echo "Report written to: $OUTPUT_FILE"
  else
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
  
  # Return exit code based on findings
  if [[ $critical_count -gt 0 ]]; then
    exit 3
  elif [[ $high_count -gt 0 ]]; then
    exit 2
  elif [[ $medium_count -gt 0 ]]; then
    exit 1
  else
    exit 0
  fi
}

# Run the main function
main