#!/bin/bash
# Container Runtime Security Monitoring
# This script implements basic runtime security monitoring for Docker containers

# Default values
MONITOR_INTERVAL=30  # seconds
LOG_DIR="logs/security"
LOG_FILE="$LOG_DIR/container-security-$(date +%Y%m%d).log"
RESOURCE_THRESHOLD=90  # percentage
RUNTIME_LIMIT=0  # minutes, 0 means no limit
CHECK_NETWORK=true
CHECK_MOUNTS=true
CHECK_PROCESSES=true
CHECK_RESOURCES=true
CHECK_PRIVILEGES=true
ALERT_COMMAND=""
CONTAINERS_TO_MONITOR="all"
VERBOSE=false
DAEMONIZE=false

# Function to display usage
show_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --interval <seconds>     Monitoring interval in seconds [default: 30]"
  echo "  --log-dir <directory>    Directory for logs [default: logs/security]"
  echo "  --resource-threshold <n> Alert threshold for resource usage % [default: 90]"
  echo "  --runtime-limit <mins>   Max container runtime in minutes (0=no limit) [default: 0]"
  echo "  --alert-command <cmd>    Command to run when an alert is triggered"
  echo "  --containers <list>      Comma-separated list of containers to monitor [default: all]"
  echo "  --no-network-check       Disable network connection monitoring"
  echo "  --no-mount-check         Disable mount point monitoring"
  echo "  --no-process-check       Disable process monitoring"
  echo "  --no-resource-check      Disable resource usage monitoring"
  echo "  --no-privilege-check     Disable privilege escalation monitoring"
  echo "  --daemonize              Run in background as a daemon"
  echo "  --verbose                Enable verbose output"
  echo "  --help                   Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --interval 60 --resource-threshold 80 --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --interval)
      MONITOR_INTERVAL="$2"
      shift 2
      ;;
    --log-dir)
      LOG_DIR="$2"
      LOG_FILE="$LOG_DIR/container-security-$(date +%Y%m%d).log"
      shift 2
      ;;
    --resource-threshold)
      RESOURCE_THRESHOLD="$2"
      shift 2
      ;;
    --runtime-limit)
      RUNTIME_LIMIT="$2"
      shift 2
      ;;
    --alert-command)
      ALERT_COMMAND="$2"
      shift 2
      ;;
    --containers)
      CONTAINERS_TO_MONITOR="$2"
      shift 2
      ;;
    --no-network-check)
      CHECK_NETWORK=false
      shift
      ;;
    --no-mount-check)
      CHECK_MOUNTS=false
      shift
      ;;
    --no-process-check)
      CHECK_PROCESSES=false
      shift
      ;;
    --no-resource-check)
      CHECK_RESOURCES=false
      shift
      ;;
    --no-privilege-check)
      CHECK_PRIVILEGES=false
      shift
      ;;
    --daemonize)
      DAEMONIZE=true
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

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log function
log_message() {
  local level="$1"
  local message="$2"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "[$timestamp] [$level] $message"
  fi
  
  # If it's an alert, run the alert command if specified
  if [[ "$level" == "ALERT" && -n "$ALERT_COMMAND" ]]; then
    eval "$ALERT_COMMAND \"$message\""
  fi
}

# Function to check if a container is in the monitoring list
should_monitor_container() {
  local container="$1"
  
  if [[ "$CONTAINERS_TO_MONITOR" == "all" ]]; then
    return 0
  fi
  
  if [[ "$CONTAINERS_TO_MONITOR" == *"$container"* ]]; then
    return 0
  fi
  
  return 1
}

# Function to check container network connections
check_network_connections() {
  local container="$1"
  
  if [[ "$CHECK_NETWORK" != true ]]; then
    return
  fi
  
  log_message "INFO" "Checking network connections for container: $container"
  
  # Get container's PID namespace
  local container_pid=$(docker inspect --format '{{.State.Pid}}' "$container")
  
  if [[ -z "$container_pid" || "$container_pid" == 0 ]]; then
    log_message "ERROR" "Failed to get PID for container: $container"
    return
  fi
  
  # Check for unusual network connections
  local suspicious_ports="21 22 23 25 3389"
  local netstat_output=$(nsenter -t "$container_pid" -n netstat -tulpn 2>/dev/null)
  
  for port in $suspicious_ports; do
    if echo "$netstat_output" | grep -q ":$port "; then
      log_message "ALERT" "Container $container has a suspicious network connection on port $port"
    fi
  done
  
  # Check for excessive number of connections
  local connection_count=$(echo "$netstat_output" | grep "ESTABLISHED" | wc -l)
  if [[ $connection_count -gt 100 ]]; then
    log_message "ALERT" "Container $container has an unusually high number of connections: $connection_count"
  fi
}

# Function to check container mount points
check_mount_points() {
  local container="$1"
  
  if [[ "$CHECK_MOUNTS" != true ]]; then
    return
  fi
  
  log_message "INFO" "Checking mount points for container: $container"
  
  # Check for sensitive host mounts
  local sensitive_mounts=("/etc" "/var/run/docker.sock" "/var/lib/docker" "/root" "/home")
  local mount_info=$(docker inspect --format '{{range .Mounts}}{{.Source}} {{.Destination}} {{.Mode}}{{println}}{{end}}' "$container")
  
  for mount in "${sensitive_mounts[@]}"; do
    if echo "$mount_info" | grep -q "^$mount "; then
      log_message "ALERT" "Container $container has a sensitive host mount: $mount"
    fi
  done
  
  # Check for writable mount modes on sensitive container paths
  if echo "$mount_info" | grep -E "(\/etc|\/bin|\/sbin|\/usr)" | grep -q "rw"; then
    log_message "ALERT" "Container $container has writable mounts on sensitive system directories"
  fi
}

# Function to check container processes
check_processes() {
  local container="$1"
  
  if [[ "$CHECK_PROCESSES" != true ]]; then
    return
  fi
  
  log_message "INFO" "Checking processes for container: $container"
  
  # Get container's PID namespace
  local container_pid=$(docker inspect --format '{{.State.Pid}}' "$container")
  
  if [[ -z "$container_pid" || "$container_pid" == 0 ]]; then
    log_message "ERROR" "Failed to get PID for container: $container"
    return
  fi
  
  # Check for suspicious processes
  local suspicious_processes=("nc" "ncat" "netcat" "wget" "curl" "nmap" "tcpdump" "ssh" "sshd" "telnet" "ftp" "tftp")
  local process_list=$(nsenter -t "$container_pid" -p ps -eo comm 2>/dev/null)
  
  for process in "${suspicious_processes[@]}"; do
    if echo "$process_list" | grep -q "^$process$"; then
      log_message "ALERT" "Container $container is running a suspicious process: $process"
    fi
  done
  
  # Check for process count
  local process_count=$(echo "$process_list" | wc -l)
  if [[ $process_count -gt 50 ]]; then
    log_message "ALERT" "Container $container has an unusually high number of processes: $process_count"
  fi
}

# Function to check container resource usage
check_resource_usage() {
  local container="$1"
  
  if [[ "$CHECK_RESOURCES" != true ]]; then
    return
  fi
  
  log_message "INFO" "Checking resource usage for container: $container"
  
  # Check CPU usage
  local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" | sed 's/%//')
  
  if [[ $(echo "$cpu_usage > $RESOURCE_THRESHOLD" | bc -l) -eq 1 ]]; then
    log_message "ALERT" "Container $container has high CPU usage: ${cpu_usage}%"
  fi
  
  # Check memory usage
  local mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" "$container" | sed 's/%//')
  
  if [[ $(echo "$mem_usage > $RESOURCE_THRESHOLD" | bc -l) -eq 1 ]]; then
    log_message "ALERT" "Container $container has high memory usage: ${mem_usage}%"
  fi
}

# Function to check for privileged containers
check_privileges() {
  local container="$1"
  
  if [[ "$CHECK_PRIVILEGES" != true ]]; then
    return
  fi
  
  log_message "INFO" "Checking privileges for container: $container"
  
  # Check if the container is running in privileged mode
  local is_privileged=$(docker inspect --format '{{.HostConfig.Privileged}}' "$container")
  
  if [[ "$is_privileged" == "true" ]]; then
    log_message "ALERT" "Container $container is running in privileged mode"
  fi
  
  # Check for unusual capabilities
  local capabilities=$(docker inspect --format '{{range $cap, $value := .HostConfig.CapAdd}}{{$cap}} {{end}}' "$container")
  local dangerous_caps=("SYS_ADMIN" "SYS_PTRACE" "SYS_MODULE" "NET_ADMIN" "ALL")
  
  for cap in "${dangerous_caps[@]}"; do
    if [[ "$capabilities" == *"$cap"* ]]; then
      log_message "ALERT" "Container $container has dangerous capability: $cap"
    fi
  done
  
  # Check container runtime
  if [[ $RUNTIME_LIMIT -gt 0 ]]; then
    local start_time=$(docker inspect --format '{{.State.StartedAt}}' "$container")
    local start_unix=$(date -d "$start_time" +%s)
    local now_unix=$(date +%s)
    local runtime_minutes=$(( (now_unix - start_unix) / 60 ))
    
    if [[ $runtime_minutes -gt $RUNTIME_LIMIT ]]; then
      log_message "ALERT" "Container $container exceeds runtime limit: ${runtime_minutes}m > ${RUNTIME_LIMIT}m"
    fi
  fi
}

# Main monitoring loop
monitor_containers() {
  log_message "INFO" "Starting container security monitoring"
  log_message "INFO" "Monitor interval: ${MONITOR_INTERVAL}s"
  log_message "INFO" "Log file: $LOG_FILE"
  
  while true; do
    log_message "INFO" "Running security checks..."
    
    # Get list of running containers
    local containers=$(docker ps --format '{{.Names}}')
    
    if [[ -z "$containers" ]]; then
      log_message "INFO" "No running containers found"
    else
      for container in $containers; do
        if should_monitor_container "$container"; then
          log_message "INFO" "Checking container: $container"
          
          check_network_connections "$container"
          check_mount_points "$container"
          check_processes "$container"
          check_resource_usage "$container"
          check_privileges "$container"
        fi
      done
    fi
    
    sleep "$MONITOR_INTERVAL"
  done
}

# Run in daemon mode if requested
if [[ "$DAEMONIZE" == true ]]; then
  log_message "INFO" "Starting monitor in daemon mode"
  monitor_containers &
  echo "Container security monitoring started in background. Log file: $LOG_FILE"
  echo "PID: $!"
else
  monitor_containers
fi

exit 0