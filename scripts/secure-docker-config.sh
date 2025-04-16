#!/bin/bash
# Secure Docker Configuration Generator
# This script generates a secure Docker configuration file and setup

# Default values
CONFIG_DIR="/etc/docker"
CONFIG_FILE="daemon.json"
CONFIG_PATH="$CONFIG_DIR/$CONFIG_FILE"
BACKUP_SUFFIX=".bak.$(date +%Y%m%d%H%M%S)"
USER_REMAP="default"
ENABLE_SECCOMP=true
LIVE_RESTORE=true
ENABLE_CONTENT_TRUST=false
EXPERIMENTAL=false
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --config-dir <dir>         Directory for Docker configuration [default: /etc/docker]"
  echo "  --config-file <file>       Configuration filename [default: daemon.json]"
  echo "  --user-remap <string>      User namespace remapping [default: default]"
  echo "  --no-seccomp               Disable seccomp profile"
  echo "  --no-live-restore          Disable live restore capability"
  echo "  --enable-content-trust     Enable Docker Content Trust"
  echo "  --experimental             Enable experimental features"
  echo "  --verbose                  Enable verbose output"
  echo "  --help                     Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --user-remap default --enable-content-trust --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config-dir)
      CONFIG_DIR="$2"
      CONFIG_PATH="$CONFIG_DIR/$CONFIG_FILE"
      shift 2
      ;;
    --config-file)
      CONFIG_FILE="$2"
      CONFIG_PATH="$CONFIG_DIR/$CONFIG_FILE"
      shift 2
      ;;
    --user-remap)
      USER_REMAP="$2"
      shift 2
      ;;
    --no-seccomp)
      ENABLE_SECCOMP=false
      shift
      ;;
    --no-live-restore)
      LIVE_RESTORE=false
      shift
      ;;
    --enable-content-trust)
      ENABLE_CONTENT_TRUST=true
      shift
      ;;
    --experimental)
      EXPERIMENTAL=true
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

# Make sure we're running as root
if [[ $EUID -ne 0 ]]; then
  echo "Error: This script must be run as root"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed"
  exit 1
fi

# Create config directory if it doesn't exist
if [[ ! -d "$CONFIG_DIR" ]]; then
  if [[ "$VERBOSE" == true ]]; then
    echo "Creating Docker configuration directory: $CONFIG_DIR"
  fi
  mkdir -p "$CONFIG_DIR"
fi

# Backup existing config if it exists
if [[ -f "$CONFIG_PATH" ]]; then
  BACKUP_FILE="$CONFIG_PATH$BACKUP_SUFFIX"
  if [[ "$VERBOSE" == true ]]; then
    echo "Backing up existing configuration to: $BACKUP_FILE"
  fi
  cp "$CONFIG_PATH" "$BACKUP_FILE"
fi

# Generate the configuration JSON
if [[ "$VERBOSE" == true ]]; then
  echo "Generating secure Docker configuration..."
fi

# Start building the JSON configuration
CONFIG_JSON='{
  "userns-remap": "'$USER_REMAP'",
  "live-restore": '$LIVE_RESTORE',
  "content-trust": {
    "trust-pinning": {
      "official-images": true
    }
  },
  "experimental": '$EXPERIMENTAL

# Add seccomp profile settings if enabled
if [[ "$ENABLE_SECCOMP" == true ]]; then
  CONFIG_JSON+=',
  "seccomp-profile": "/etc/docker/seccomp-profile.json"'
fi

# Add content trust settings if enabled
if [[ "$ENABLE_CONTENT_TRUST" == true ]]; then
  CONFIG_JSON+=',
  "enable-content-trust": true'
fi

# Add default resource constraints for containers
CONFIG_JSON+=',
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "default-shm-size": "64M",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "icc": false,
  "no-new-privileges": true
}'

# Write the configuration file
echo "$CONFIG_JSON" > "$CONFIG_PATH"

if [[ "$VERBOSE" == true ]]; then
  echo "Configuration file written to: $CONFIG_PATH"
  echo "Configuration contents:"
  cat "$CONFIG_PATH"
fi

# Generate a seccomp profile if enabled
if [[ "$ENABLE_SECCOMP" == true ]]; then
  SECCOMP_PATH="/etc/docker/seccomp-profile.json"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Setting up default seccomp profile at: $SECCOMP_PATH"
  fi
  
  # Use Docker's default seccomp profile
  if [[ -f "/usr/share/docker/seccomp-profiles/default.json" ]]; then
    cp "/usr/share/docker/seccomp-profiles/default.json" "$SECCOMP_PATH"
  else
    if [[ "$VERBOSE" == true ]]; then
      echo "Default seccomp profile not found, downloading from Docker repository"
    fi
    curl -sSL -o "$SECCOMP_PATH" https://raw.githubusercontent.com/docker/engine/master/profiles/seccomp/default.json
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Seccomp profile installed at: $SECCOMP_PATH"
  fi
fi

# Instructions for applying settings
echo ""
echo "====== Docker Security Configuration Applied ======"
echo "The secure Docker configuration has been written to: $CONFIG_PATH"
echo ""
echo "To apply these changes, restart the Docker daemon with:"
echo "  systemctl restart docker"
echo ""
echo "To verify the configuration is applied, run:"
echo "  docker info"
echo ""
if [[ "$USER_REMAP" != "off" && "$USER_REMAP" != "" ]]; then
  echo "Note: User namespace remapping (userns-remap) is enabled."
  echo "This may affect access to volumes and container networking."
  echo "Review Docker documentation if you experience issues."
  echo ""
fi

if [[ "$ENABLE_CONTENT_TRUST" == true ]]; then
  echo "Docker Content Trust is enabled. You may need to set up signing keys."
  echo "See https://docs.docker.com/engine/security/trust/ for more information."
  echo ""
fi

echo "For improved security, consider these additional steps:"
echo "1. Use custom SELinux/AppArmor profiles for critical containers"
echo "2. Set up Docker Bench Security to audit your Docker installation"
echo "3. Implement a container vulnerability scanning solution"
echo "4. Configure proper network segmentation using Docker networks"
echo ""
echo "======================================================"

# Exit successfully
exit 0