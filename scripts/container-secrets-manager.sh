#!/bin/bash
# Container Secrets Management
# This script helps manage secrets for containerized applications

# Default values
SECRETS_DIR="./.secrets"
ENV_FILE="./.env.secrets"
OPERATION="help"
SECRET_NAME=""
SECRET_VALUE=""
SECRET_FILE=""
CONTAINER_NAME=""
USE_ENV_FILE=false
ENCRYPT_SECRETS=false
ENCRYPTION_KEY=""
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Container Secrets Manager"
  echo "Usage: $0 <operation> [options]"
  echo ""
  echo "Operations:"
  echo "  add       Add a new secret"
  echo "  remove    Remove a secret"
  echo "  list      List all secrets"
  echo "  apply     Apply secrets to a container"
  echo "  help      Show this help message"
  echo ""
  echo "Options:"
  echo "  --name <name>           Secret name"
  echo "  --value <value>         Secret value (for 'add' operation)"
  echo "  --file <file>           Read secret value from file (for 'add' operation)"
  echo "  --container <name>      Container name (for 'apply' operation)"
  echo "  --secrets-dir <dir>     Directory to store secrets [default: ./.secrets]"
  echo "  --env-file              Use env file instead of Docker secrets"
  echo "  --encrypt               Encrypt secrets (requires ENCRYPTION_KEY)"
  echo "  --encryption-key <key>  Key for encrypting/decrypting secrets"
  echo "  --verbose               Enable verbose output"
  echo ""
  echo "Examples:"
  echo "  # Add a new secret"
  echo "  $0 add --name DB_PASSWORD --value 'my-secure-password'"
  echo ""
  echo "  # Add a new secret from file"
  echo "  $0 add --name CERT_DATA --file ./cert.pem"
  echo ""
  echo "  # List all secrets"
  echo "  $0 list"
  echo ""
  echo "  # Apply secrets to a container"
  echo "  $0 apply --container my-api-container"
  echo ""
  echo "  # Apply secrets using env file"
  echo "  $0 apply --container my-api-container --env-file"
  echo ""
  echo "  # Add encrypted secret"
  echo "  $0 add --name API_KEY --value 'secret-key' --encrypt --encryption-key 'mykey123'"
}

# Parse the operation
if [[ $# -gt 0 ]]; then
  OPERATION="$1"
  shift
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      SECRET_NAME="$2"
      shift 2
      ;;
    --value)
      SECRET_VALUE="$2"
      shift 2
      ;;
    --file)
      SECRET_FILE="$2"
      shift 2
      ;;
    --container)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --secrets-dir)
      SECRETS_DIR="$2"
      shift 2
      ;;
    --env-file)
      USE_ENV_FILE=true
      shift
      ;;
    --encrypt)
      ENCRYPT_SECRETS=true
      shift
      ;;
    --encryption-key)
      ENCRYPTION_KEY="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Error: Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Check if Docker is installed for apply operation
if [[ "$OPERATION" == "apply" ]] && ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed"
  exit 1
fi

# Ensure encryption key is provided if encryption is enabled
if [[ "$ENCRYPT_SECRETS" == true && -z "$ENCRYPTION_KEY" ]]; then
  echo "Error: Encryption key is required when using encryption"
  exit 1
fi

# Create secrets directory if it doesn't exist
if [[ ! -d "$SECRETS_DIR" ]]; then
  if [[ "$VERBOSE" == true ]]; then
    echo "Creating secrets directory: $SECRETS_DIR"
  fi
  mkdir -p "$SECRETS_DIR"
  chmod 700 "$SECRETS_DIR"
fi

# Function to encrypt a string
encrypt_string() {
  local value="$1"
  local key="$2"
  echo "$value" | openssl enc -aes-256-cbc -a -salt -pass pass:"$key" 2>/dev/null
}

# Function to decrypt a string
decrypt_string() {
  local value="$1"
  local key="$2"
  echo "$value" | openssl enc -aes-256-cbc -a -d -salt -pass pass:"$key" 2>/dev/null
}

# Function to add a secret
add_secret() {
  if [[ -z "$SECRET_NAME" ]]; then
    echo "Error: Secret name is required"
    exit 1
  fi
  
  # Validate secret name (alphanumeric, underscore, no spaces)
  if ! [[ "$SECRET_NAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
    echo "Error: Secret name must contain only letters, numbers, and underscores"
    exit 1
  fi
  
  # Get the secret value from file or command line
  local value=""
  
  if [[ -n "$SECRET_FILE" ]]; then
    if [[ ! -f "$SECRET_FILE" ]]; then
      echo "Error: Secret file not found: $SECRET_FILE"
      exit 1
    fi
    
    value=$(cat "$SECRET_FILE")
    
    if [[ -z "$value" ]]; then
      echo "Error: Secret file is empty: $SECRET_FILE"
      exit 1
    fi
  elif [[ -n "$SECRET_VALUE" ]]; then
    value="$SECRET_VALUE"
  else
    echo "Error: Either --value or --file is required for add operation"
    exit 1
  fi
  
  # Encrypt the value if needed
  if [[ "$ENCRYPT_SECRETS" == true ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "Encrypting secret: $SECRET_NAME"
    fi
    
    value=$(encrypt_string "$value" "$ENCRYPTION_KEY")
    
    if [[ -z "$value" ]]; then
      echo "Error: Encryption failed"
      exit 1
    fi
  fi
  
  # Save the secret to file
  local secret_path="$SECRETS_DIR/$SECRET_NAME"
  echo "$value" > "$secret_path"
  chmod 600 "$secret_path"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Secret added: $SECRET_NAME"
  fi
  
  # Update env file if using it
  if [[ "$USE_ENV_FILE" == true ]]; then
    # Remove existing entry if any
    sed -i "/^$SECRET_NAME=.*$/d" "$ENV_FILE" 2>/dev/null || true
    
    # Add new entry
    echo "$SECRET_NAME='$value'" >> "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Secret added to env file: $SECRET_NAME"
    fi
  fi
}

# Function to remove a secret
remove_secret() {
  if [[ -z "$SECRET_NAME" ]]; then
    echo "Error: Secret name is required"
    exit 1
  fi
  
  local secret_path="$SECRETS_DIR/$SECRET_NAME"
  
  if [[ ! -f "$secret_path" ]]; then
    echo "Error: Secret not found: $SECRET_NAME"
    exit 1
  fi
  
  rm "$secret_path"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Secret removed: $SECRET_NAME"
  fi
  
  # Update env file if using it
  if [[ "$USE_ENV_FILE" == true && -f "$ENV_FILE" ]]; then
    sed -i "/^$SECRET_NAME=.*$/d" "$ENV_FILE" 2>/dev/null || true
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Secret removed from env file: $SECRET_NAME"
    fi
  fi
}

# Function to list all secrets
list_secrets() {
  if [[ ! -d "$SECRETS_DIR" || -z "$(ls -A "$SECRETS_DIR" 2>/dev/null)" ]]; then
    echo "No secrets found in: $SECRETS_DIR"
    return
  fi
  
  echo "Secrets:"
  for secret_file in "$SECRETS_DIR"/*; do
    local name=$(basename "$secret_file")
    local value="<hidden>"
    
    if [[ "$VERBOSE" == true ]]; then
      if [[ "$ENCRYPT_SECRETS" == true && -n "$ENCRYPTION_KEY" ]]; then
        value=$(decrypt_string "$(cat "$secret_file")" "$ENCRYPTION_KEY")
        value="${value:0:3}...${value: -3}"
      else
        value="$(cat "$secret_file")"
        value="${value:0:3}...${value: -3}"
      fi
    fi
    
    echo "  - $name: $value"
  done
}

# Function to apply secrets to a container
apply_secrets() {
  if [[ -z "$CONTAINER_NAME" ]]; then
    echo "Error: Container name is required"
    exit 1
  fi
  
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    echo "Error: Container not found: $CONTAINER_NAME"
    exit 1
  fi
  
  if [[ ! -d "$SECRETS_DIR" || -z "$(ls -A "$SECRETS_DIR" 2>/dev/null)" ]]; then
    echo "No secrets found in: $SECRETS_DIR"
    return
  fi
  
  if [[ "$USE_ENV_FILE" == true ]]; then
    # Apply secrets via env file
    if [[ ! -f "$ENV_FILE" ]]; then
      echo "Error: Env file not found: $ENV_FILE"
      exit 1
    fi
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Applying secrets from env file to container: $CONTAINER_NAME"
    fi
    
    docker run --env-file "$ENV_FILE" "$CONTAINER_NAME"
  else
    # Apply secrets via Docker secrets (mounted files)
    local mount_args=""
    
    for secret_file in "$SECRETS_DIR"/*; do
      local name=$(basename "$secret_file")
      mount_args="$mount_args -v $secret_file:/run/secrets/$name:ro"
      
      if [[ "$VERBOSE" == true ]]; then
        echo "Mounting secret: $name"
      fi
    done
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Applying secrets to container: $CONTAINER_NAME"
      echo "Command: docker run $mount_args $CONTAINER_NAME"
    fi
    
    eval "docker run $mount_args $CONTAINER_NAME"
  fi
}

# Execute the requested operation
case "$OPERATION" in
  add)
    add_secret
    ;;
  remove)
    remove_secret
    ;;
  list)
    list_secrets
    ;;
  apply)
    apply_secrets
    ;;
  help|*)
    show_usage
    exit 0
    ;;
esac

exit 0