#!/bin/bash
# Docker Network Security Setup
# This script sets up secure Docker networks for application components

# Default values
NETWORK_PREFIX="cosmic"
FRONTEND_NETWORK="${NETWORK_PREFIX}_frontend"
BACKEND_NETWORK="${NETWORK_PREFIX}_backend"
DB_NETWORK="${NETWORK_PREFIX}_db"
MONITORING_NETWORK="${NETWORK_PREFIX}_monitoring"
EXTERNAL_NETWORK="${NETWORK_PREFIX}_external"
CLEANUP=false
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --prefix <name>      Network name prefix [default: cosmic]"
  echo "  --cleanup            Remove existing networks with the same name before creating"
  echo "  --verbose            Enable verbose output"
  echo "  --help               Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --prefix myapp --cleanup --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)
      NETWORK_PREFIX="$2"
      FRONTEND_NETWORK="${NETWORK_PREFIX}_frontend"
      BACKEND_NETWORK="${NETWORK_PREFIX}_backend"
      DB_NETWORK="${NETWORK_PREFIX}_db"
      MONITORING_NETWORK="${NETWORK_PREFIX}_monitoring"
      EXTERNAL_NETWORK="${NETWORK_PREFIX}_external"
      shift 2
      ;;
    --cleanup)
      CLEANUP=true
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

# Create network function
create_network() {
  local network_name="$1"
  local network_driver="$2"
  local network_subnet="$3"
  local network_options="$4"
  
  # Check if network already exists
  if docker network inspect "$network_name" &> /dev/null; then
    if [[ "$CLEANUP" == true ]]; then
      if [[ "$VERBOSE" == true ]]; then
        echo "Removing existing network: $network_name"
      fi
      docker network rm "$network_name" > /dev/null
    else
      if [[ "$VERBOSE" == true ]]; then
        echo "Network already exists, skipping: $network_name"
      fi
      return
    fi
  fi
  
  # Build network creation command
  local cmd="docker network create --driver $network_driver"
  
  if [[ -n "$network_subnet" ]]; then
    cmd="$cmd --subnet $network_subnet"
  fi
  
  if [[ -n "$network_options" ]]; then
    cmd="$cmd $network_options"
  fi
  
  cmd="$cmd $network_name"
  
  # Create the network
  if [[ "$VERBOSE" == true ]]; then
    echo "Creating network: $network_name"
    echo "Command: $cmd"
  fi
  
  eval "$cmd"
  
  if [[ $? -eq 0 ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "Successfully created network: $network_name"
    fi
  else
    echo "Error: Failed to create network: $network_name"
  fi
}

# Create the networks
echo "Setting up secure Docker networks for $NETWORK_PREFIX application..."

# Frontend network (public-facing services)
create_network "$FRONTEND_NETWORK" "bridge" "172.20.0.0/24" "--opt com.docker.network.bridge.name=br-frontend --opt encrypted=true"

# Backend network (internal application services)
create_network "$BACKEND_NETWORK" "bridge" "172.20.1.0/24" "--opt com.docker.network.bridge.name=br-backend --opt encrypted=true --internal"

# Database network (database services)
create_network "$DB_NETWORK" "bridge" "172.20.2.0/24" "--opt com.docker.network.bridge.name=br-db --opt encrypted=true --internal"

# Monitoring network (for logging and monitoring services)
create_network "$MONITORING_NETWORK" "bridge" "172.20.3.0/24" "--opt com.docker.network.bridge.name=br-monitoring --opt encrypted=true --internal"

# External network (for services that need external access)
create_network "$EXTERNAL_NETWORK" "bridge" "172.20.4.0/24" "--opt com.docker.network.bridge.name=br-external --opt encrypted=true"

# Display network information
echo ""
echo "====== Docker Network Setup Complete ======"
echo "The following secure networks have been created:"
echo ""
echo "1. $FRONTEND_NETWORK"
echo "   - Purpose: Public-facing services (web, API gateway)"
echo "   - Use with: Frontend containers, load balancers"
echo ""
echo "2. $BACKEND_NETWORK"
echo "   - Purpose: Internal application services (isolated from public)"
echo "   - Use with: API servers, application containers"
echo ""
echo "3. $DB_NETWORK"
echo "   - Purpose: Database services (isolated from public)"
echo "   - Use with: Database containers, data storage"
echo ""
echo "4. $MONITORING_NETWORK"
echo "   - Purpose: Monitoring and logging services"
echo "   - Use with: Prometheus, Grafana, log aggregators"
echo ""
echo "5. $EXTERNAL_NETWORK"
echo "   - Purpose: Services requiring external access"
echo "   - Use with: Services that need to call external APIs"
echo ""
echo "==== Container Launch Examples ===="
echo ""
echo "# Run a web frontend container"
echo "docker run --name web --network $FRONTEND_NETWORK myapp-web:latest"
echo ""
echo "# Run an API container with access to both frontend and backend"
echo "docker run --name api --network $BACKEND_NETWORK myapp-api:latest"
echo "docker network connect $FRONTEND_NETWORK api"
echo ""
echo "# Run a database container in the isolated DB network"
echo "docker run --name db --network $DB_NETWORK postgres:13"
echo ""
echo "# Connect API to the database network"
echo "docker network connect $DB_NETWORK api"
echo ""
echo "======================================="

# List created networks
if [[ "$VERBOSE" == true ]]; then
  echo ""
  echo "Docker networks list:"
  docker network ls | grep "$NETWORK_PREFIX"
fi

exit 0