#!/bin/bash
# Container Image Signing Script
# This script implements Docker Content Trust for image signing and verification

# Default values
IMAGE_NAME=""
KEY_NAME=""
SIGNER_NAME=""
KEY_DIR="$HOME/.docker/trust/private"
OPERATION="sign"
REGISTRY=""
VERIFY_ONLY=false
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Container Image Signing Script"
  echo "Usage: $0 [options] <image:tag>"
  echo ""
  echo "Operations:"
  echo "  --init          Initialize signing keys (default: use existing keys)"
  echo "  --sign          Sign the specified image (default operation)"
  echo "  --verify        Verify the signature of the specified image"
  echo ""
  echo "Options:"
  echo "  --key <name>      Key name to use for signing [default: derived from image name]"
  echo "  --signer <name>   Signer name to use [default: derived from image name]"
  echo "  --registry <url>  Docker registry URL (for private registries)"
  echo "  --key-dir <dir>   Directory for storing keys [default: $KEY_DIR]"
  echo "  --verify-only     Only verify, don't sign (equivalent to --verify)"
  echo "  --verbose         Enable verbose output"
  echo "  --help            Show this help message"
  echo ""
  echo "Example:"
  echo "  # Initialize signing keys for an image"
  echo "  $0 --init --key cosmic-app-key cosmic-app:latest"
  echo ""
  echo "  # Sign an image"
  echo "  $0 --sign cosmic-app:latest"
  echo ""
  echo "  # Verify an image"
  echo "  $0 --verify cosmic-app:latest"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --init)
      OPERATION="init"
      shift
      ;;
    --sign)
      OPERATION="sign"
      shift
      ;;
    --verify)
      OPERATION="verify"
      shift
      ;;
    --key)
      KEY_NAME="$2"
      shift 2
      ;;
    --signer)
      SIGNER_NAME="$2"
      shift 2
      ;;
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    --key-dir)
      KEY_DIR="$2"
      shift 2
      ;;
    --verify-only)
      VERIFY_ONLY=true
      OPERATION="verify"
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
    -*)
      echo "Error: Unknown option: $1"
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

# Check for required arguments
if [[ -z "$IMAGE_NAME" ]]; then
  echo "Error: Image name is required"
  show_usage
  exit 1
fi

# Set default key and signer names if not provided
if [[ -z "$KEY_NAME" ]]; then
  # Extract repository name from image and use as key name
  KEY_NAME="${IMAGE_NAME%%:*}-key"
  KEY_NAME="${KEY_NAME##*/}"
fi

if [[ -z "$SIGNER_NAME" ]]; then
  # Extract repository name from image and use as signer name
  SIGNER_NAME="${IMAGE_NAME%%:*}-signer"
  SIGNER_NAME="${SIGNER_NAME##*/}"
fi

# Function to check if Docker is installed
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
  fi
}

# Function to check if Docker Content Trust is enabled
check_dct() {
  # Check if DOCKER_CONTENT_TRUST is set
  if [[ -z "${DOCKER_CONTENT_TRUST}" ]]; then
    export DOCKER_CONTENT_TRUST=1
    if [[ "$VERBOSE" == true ]]; then
      echo "Docker Content Trust enabled for this session (DOCKER_CONTENT_TRUST=1)"
    fi
  fi
}

# Function to initialize signing keys
init_keys() {
  check_docker
  check_dct
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Initializing signing keys for $IMAGE_NAME"
    echo "Key name: $KEY_NAME"
    echo "Signer name: $SIGNER_NAME"
  fi
  
  # Create key directory if it doesn't exist
  mkdir -p "$KEY_DIR"
  
  # Generate a new key pair
  if docker trust key generate "$KEY_NAME" --dir "$KEY_DIR"; then
    if [[ "$VERBOSE" == true ]]; then
      echo "Successfully generated key: $KEY_NAME"
    fi
    
    # Add the signer to the repository
    if docker trust signer add --key "$KEY_DIR/$KEY_NAME.pub" "$SIGNER_NAME" "$IMAGE_NAME"; then
      echo "Successfully added signer '$SIGNER_NAME' for $IMAGE_NAME"
      echo "Keys stored in: $KEY_DIR"
      
      # Display key locations
      echo "Private key: $KEY_DIR/$KEY_NAME.key"
      echo "Public key: $KEY_DIR/$KEY_NAME.pub"
      
      # Security notice
      echo ""
      echo "IMPORTANT: Keep your private keys secure!"
      echo "The security of your container images depends on the security of these keys."
    else
      echo "Error: Failed to add signer to repository"
      exit 1
    fi
  else
    echo "Error: Failed to generate key pair"
    exit 1
  fi
}

# Function to sign an image
sign_image() {
  check_docker
  check_dct
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Signing image: $IMAGE_NAME"
  fi
  
  # For private registries, we need to login first
  if [[ -n "$REGISTRY" ]]; then
    if [[ "$VERBOSE" == true ]]; then
      echo "Logging in to registry: $REGISTRY"
    fi
    
    docker login "$REGISTRY"
    
    if [[ $? -ne 0 ]]; then
      echo "Error: Failed to login to registry: $REGISTRY"
      exit 1
    fi
  fi
  
  # Sign the image
  if docker trust sign "$IMAGE_NAME"; then
    echo "Successfully signed image: $IMAGE_NAME"
    
    # Verify after signing if requested
    if [[ "$VERBOSE" == true ]]; then
      echo "Verifying signature..."
      docker trust inspect --pretty "$IMAGE_NAME"
    fi
  else
    echo "Error: Failed to sign image: $IMAGE_NAME"
    echo ""
    echo "Possible causes:"
    echo "1. The image doesn't exist locally or in the registry"
    echo "2. You don't have permission to sign the image"
    echo "3. The signing keys are not properly configured"
    echo ""
    echo "Try initializing keys first with:"
    echo "$0 --init $IMAGE_NAME"
    exit 1
  fi
}

# Function to verify an image
verify_image() {
  check_docker
  check_dct
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Verifying image: $IMAGE_NAME"
  fi
  
  # Verify the image signature
  if docker trust inspect --pretty "$IMAGE_NAME"; then
    echo "Image verification successful: $IMAGE_NAME"
    return 0
  else
    echo "Error: Image verification failed: $IMAGE_NAME"
    echo ""
    echo "Possible causes:"
    echo "1. The image is not signed"
    echo "2. The signature is invalid"
    echo "3. The signing keys are not available"
    return 1
  fi
}

# Execute the requested operation
case "$OPERATION" in
  init)
    init_keys
    ;;
  sign)
    sign_image
    ;;
  verify)
    verify_image
    exit $?
    ;;
  *)
    echo "Error: Unknown operation: $OPERATION"
    show_usage
    exit 1
    ;;
esac

exit 0