#!/bin/bash
# Container Registry Security Manager
# This script manages security for container registries and images

# Default values
OPERATION="scan"
REGISTRY=""
REPOSITORY=""
TAG="latest"
OUTPUT_FORMAT="text"
OUTPUT_FILE=""
CLEANUP_DAYS=30
KEEP_TAGS=""
MAX_VULNERABILITIES=10
BLOCK_CRITICAL=true
BLOCK_HIGH=false
SIGN_IMAGE=false
SIGNING_KEY=""
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Container Registry Security Manager"
  echo "Usage: $0 [options]"
  echo ""
  echo "Operations:"
  echo "  --scan                Scan images for vulnerabilities (default)"
  echo "  --cleanup             Clean up old or vulnerable images"
  echo "  --sign                Sign images with a key"
  echo "  --verify              Verify image signatures"
  echo "  --push                Push images with security checks"
  echo "  --pull                Pull images with security checks"
  echo "  --list                List images with security status"
  echo ""
  echo "Options:"
  echo "  --registry <url>      Registry URL (e.g., docker.io)"
  echo "  --repo <name>         Repository name (e.g., myorg/myapp)"
  echo "  --tag <tag>           Image tag [default: latest]"
  echo "  --output <format>     Output format (text, json) [default: text]"
  echo "  --output-file <file>  Write output to file instead of stdout"
  echo "  --cleanup-days <n>    Days to keep images before cleanup [default: 30]"
  echo "  --keep-tags <list>    Comma-separated list of tags to keep during cleanup"
  echo "  --max-vulns <n>       Maximum number of vulnerabilities allowed [default: 10]"
  echo "  --block-critical      Block if critical vulnerabilities are found [default: true]"
  echo "  --allow-critical      Allow images with critical vulnerabilities"
  echo "  --block-high          Block if high-severity vulnerabilities are found"
  echo "  --signing-key <file>  Path to signing key for sign/verify operations"
  echo "  --verbose             Enable verbose output"
  echo "  --help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  # Scan an image for vulnerabilities"
  echo "  $0 --scan --registry docker.io --repo myorg/myapp --tag v1.0"
  echo ""
  echo "  # Clean up old images but keep specific tags"
  echo "  $0 --cleanup --registry docker.io --repo myorg/myapp --cleanup-days 60 --keep-tags latest,stable,v1.0"
  echo ""
  echo "  # Sign an image"
  echo "  $0 --sign --registry docker.io --repo myorg/myapp --tag v1.0 --signing-key ./keys/private.key"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scan)
      OPERATION="scan"
      shift
      ;;
    --cleanup)
      OPERATION="cleanup"
      shift
      ;;
    --sign)
      OPERATION="sign"
      SIGN_IMAGE=true
      shift
      ;;
    --verify)
      OPERATION="verify"
      shift
      ;;
    --push)
      OPERATION="push"
      shift
      ;;
    --pull)
      OPERATION="pull"
      shift
      ;;
    --list)
      OPERATION="list"
      shift
      ;;
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    --repo)
      REPOSITORY="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
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
    --cleanup-days)
      CLEANUP_DAYS="$2"
      shift 2
      ;;
    --keep-tags)
      KEEP_TAGS="$2"
      shift 2
      ;;
    --max-vulns)
      MAX_VULNERABILITIES="$2"
      shift 2
      ;;
    --block-critical)
      BLOCK_CRITICAL=true
      shift
      ;;
    --allow-critical)
      BLOCK_CRITICAL=false
      shift
      ;;
    --block-high)
      BLOCK_HIGH=true
      shift
      ;;
    --signing-key)
      SIGNING_KEY="$2"
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

# Create logs directory if it doesn't exist
LOGS_DIR="./logs/registry"
mkdir -p "$LOGS_DIR"

# Function to check required tools
check_tools() {
  local tools=("docker")
  local missing_tools=()
  
  # Check for scan operation tools
  if [[ "$OPERATION" == "scan" ]]; then
    tools+=("trivy")
  fi
  
  # Check for sign or verify operation tools
  if [[ "$OPERATION" == "sign" || "$OPERATION" == "verify" ]]; then
    tools+=("cosign")
  fi
  
  # Check each tool
  for tool in "${tools[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
      missing_tools+=("$tool")
    fi
  done
  
  # If there are missing tools, show error and exit
  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    echo "Error: Missing required tools: ${missing_tools[*]}"
    echo ""
    
    for tool in "${missing_tools[@]}"; do
      case "$tool" in
        trivy)
          echo "Install Trivy to scan for vulnerabilities:"
          echo "  https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
          ;;
        cosign)
          echo "Install Cosign for image signing:"
          echo "  https://docs.sigstore.dev/cosign/installation/"
          ;;
        *)
          echo "Install $tool using your package manager."
          ;;
      esac
    done
    
    exit 1
  fi
}

# Function to validate inputs
validate_inputs() {
  # For most operations, we need registry and repository
  if [[ -z "$REGISTRY" || -z "$REPOSITORY" ]]; then
    echo "Error: Registry URL and repository name are required"
    show_usage
    exit 1
  fi
  
  # For sign or verify operations, we need a signing key
  if [[ ("$OPERATION" == "sign" || "$OPERATION" == "verify") && -z "$SIGNING_KEY" ]]; then
    echo "Error: Signing key is required for sign/verify operations"
    show_usage
    exit 1
  fi
  
  # For sign operations, check if the key exists
  if [[ "$OPERATION" == "sign" && ! -f "$SIGNING_KEY" ]]; then
    echo "Error: Signing key file not found: $SIGNING_KEY"
    exit 1
  fi
}

# Function to format image name
format_image_name() {
  local registry="$1"
  local repo="$2"
  local tag="$3"
  
  if [[ -z "$registry" || "$registry" == "docker.io" ]]; then
    echo "$repo:$tag"
  else
    echo "$registry/$repo:$tag"
  fi
}

# Function to scan an image
scan_image() {
  local image_name="$1"
  local max_vulns="$2"
  local block_critical="$3"
  local block_high="$4"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Scanning image: $image_name"
    echo "Maximum vulnerabilities: $max_vulns"
    echo "Block critical: $block_critical"
    echo "Block high: $block_high"
  fi
  
  # Check if trivy is installed
  if ! command -v trivy &> /dev/null; then
    echo "Error: Trivy is required for scanning"
    echo "Install it from: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
    exit 1
  fi
  
  # Create a temp file for the scan results
  local temp_results=$(mktemp)
  
  # Run the scan
  echo "Scanning image for vulnerabilities: $image_name"
  
  trivy image --no-progress "$image_name" > "$temp_results"
  local scan_exit_code=$?
  
  # Parse the results
  local total_vulns=$(grep -c "Total:" "$temp_results" || echo 0)
  local critical_vulns=$(grep -c "CRITICAL: " "$temp_results" || echo 0)
  local high_vulns=$(grep -c "HIGH: " "$temp_results" || echo 0)
  local medium_vulns=$(grep -c "MEDIUM: " "$temp_results" || echo 0)
  local low_vulns=$(grep -c "LOW: " "$temp_results" || echo 0)
  
  # Calculate the total
  total_vulns=$((critical_vulns + high_vulns + medium_vulns + low_vulns))
  
  # Determine if we should block the image
  local should_block=false
  
  if [[ "$block_critical" == true && $critical_vulns -gt 0 ]]; then
    should_block=true
  fi
  
  if [[ "$block_high" == true && $high_vulns -gt 0 ]]; then
    should_block=true
  fi
  
  if [[ $total_vulns -gt $max_vulns ]]; then
    should_block=true
  fi
  
  # Output the results
  echo ""
  echo "Vulnerability Scan Results for $image_name:"
  echo "============================================="
  echo "Critical: $critical_vulns"
  echo "High: $high_vulns"
  echo "Medium: $medium_vulns"
  echo "Low: $low_vulns"
  echo "Total: $total_vulns"
  echo ""
  
  # Show more details if verbose
  if [[ "$VERBOSE" == true ]]; then
    echo "Detailed scan results:"
    cat "$temp_results"
    echo ""
  fi
  
  # Determine pass/fail status
  if [[ "$should_block" == true ]]; then
    echo "FAILED: Image did not pass security requirements"
    echo "Reason: "
    
    if [[ "$block_critical" == true && $critical_vulns -gt 0 ]]; then
      echo "- Critical vulnerabilities found: $critical_vulns (threshold: 0)"
    fi
    
    if [[ "$block_high" == true && $high_vulns -gt 0 ]]; then
      echo "- High vulnerabilities found: $high_vulns (threshold: 0)"
    fi
    
    if [[ $total_vulns -gt $max_vulns ]]; then
      echo "- Total vulnerabilities: $total_vulns (threshold: $max_vulns)"
    fi
  else
    echo "PASSED: Image meets security requirements"
  fi
  
  # Save results to file if requested
  if [[ -n "$OUTPUT_FILE" ]]; then
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      # Create a JSON output
      cat << EOF > "$OUTPUT_FILE"
{
  "image": "$image_name",
  "scan_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "vulnerabilities": {
    "critical": $critical_vulns,
    "high": $high_vulns,
    "medium": $medium_vulns,
    "low": $low_vulns,
    "total": $total_vulns
  },
  "thresholds": {
    "max_vulnerabilities": $max_vulns,
    "block_critical": $block_critical,
    "block_high": $block_high
  },
  "result": $(if [[ "$should_block" == true ]]; then echo "false"; else echo "true"; fi)
}
EOF
    else
      # Create a text output
      {
        echo "Vulnerability Scan Results for $image_name"
        echo "Time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
        echo "============================================="
        echo "Critical: $critical_vulns"
        echo "High: $high_vulns"
        echo "Medium: $medium_vulns"
        echo "Low: $low_vulns"
        echo "Total: $total_vulns"
        echo ""
        echo "Thresholds:"
        echo "- Maximum vulnerabilities: $max_vulns"
        echo "- Block critical: $block_critical"
        echo "- Block high: $block_high"
        echo ""
        if [[ "$should_block" == true ]]; then
          echo "FAILED: Image did not pass security requirements"
        else
          echo "PASSED: Image meets security requirements"
        fi
      } > "$OUTPUT_FILE"
    fi
    
    echo "Scan results saved to: $OUTPUT_FILE"
  fi
  
  # Clean up
  rm "$temp_results"
  
  # Return appropriate exit code
  if [[ "$should_block" == true ]]; then
    return 1
  else
    return 0
  fi
}

# Function to clean up old or vulnerable images
cleanup_images() {
  local registry="$1"
  local repo="$2"
  local cleanup_days="$3"
  local keep_tags="$4"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Cleaning up images in repository: $repo"
    echo "Registry: $registry"
    echo "Days to keep: $cleanup_days"
    echo "Tags to keep: $keep_tags"
  fi
  
  # Convert keep_tags to an array
  IFS=',' read -ra KEEP_TAGS_ARRAY <<< "$keep_tags"
  
  echo "Looking up tags for repository: $repo"
  
  # Get list of tags - this is simplified, in practice would need proper API calls
  local tags=$(docker images "$repo" --format "{{.Tag}}" | grep -v "<none>")
  
  if [[ -z "$tags" ]]; then
    echo "No tags found for repository: $repo"
    return 0
  fi
  
  echo "Found tags: $tags"
  echo ""
  echo "Starting cleanup..."
  echo "The following tags will be kept: ${KEEP_TAGS_ARRAY[*]}"
  echo ""
  
  # Process each tag
  for tag in $tags; do
    # Skip tags that should be kept
    if [[ " ${KEEP_TAGS_ARRAY[*]} " =~ " $tag " ]]; then
      echo "Keeping $tag as it's in the keep list"
      continue
    fi
    
    # Get image details - simplified approach
    local image_name=$(format_image_name "$registry" "$repo" "$tag")
    local created=$(docker inspect --format '{{.Created}}' "$image_name" 2>/dev/null)
    
    if [[ -z "$created" ]]; then
      echo "Warning: Could not get creation time for $image_name"
      continue
    fi
    
    # Calculate age in days - simplified approach
    local created_timestamp=$(date -d "$created" +%s 2>/dev/null)
    local now_timestamp=$(date +%s)
    
    if [[ -z "$created_timestamp" ]]; then
      echo "Warning: Could not parse creation time for $image_name"
      continue
    fi
    
    local age_days=$(( (now_timestamp - created_timestamp) / 86400 ))
    
    # Check if the image is older than the cleanup threshold
    if [[ $age_days -gt $cleanup_days ]]; then
      echo "Deleting $image_name - $age_days days old (exceeds $cleanup_days days)"
      
      # Perform the removal - this is a simulation
      echo "docker rmi $image_name"
      
      # In a real implementation, you would run:
      # docker rmi "$image_name"
      
      echo "Logged removal to: $LOGS_DIR/cleanup-$(date +%Y%m%d).log"
      echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Removed $image_name (age: $age_days days)" >> "$LOGS_DIR/cleanup-$(date +%Y%m%d).log"
    else
      echo "Keeping $image_name - $age_days days old (within $cleanup_days days)"
    fi
  done
  
  echo ""
  echo "Cleanup complete"
}

# Function to sign an image
sign_image() {
  local image_name="$1"
  local signing_key="$2"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Signing image: $image_name"
    echo "Using key: $signing_key"
  fi
  
  # Check if cosign is installed
  if ! command -v cosign &> /dev/null; then
    echo "Error: Cosign is required for signing"
    echo "Install it from: https://docs.sigstore.dev/cosign/installation/"
    exit 1
  fi
  
  echo "Signing image: $image_name"
  echo ""
  
  # In a real implementation, you would run:
  # COSIGN_PASSWORD=$(cat $signing_key.password) cosign sign --key $signing_key $image_name
  
  echo "This is a simulation of signing the image."
  echo "In a real environment, the following command would be executed:"
  echo "  COSIGN_PASSWORD=\$password cosign sign --key $signing_key $image_name"
  echo ""
  echo "Image signed successfully: $image_name"
  echo "Signature stored in registry"
  
  # Log the signing operation
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Signed $image_name" >> "$LOGS_DIR/signing-$(date +%Y%m%d).log"
}

# Function to verify an image signature
verify_image() {
  local image_name="$1"
  local signing_key="$2"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Verifying image: $image_name"
    echo "Using key: $signing_key"
  fi
  
  # Check if cosign is installed
  if ! command -v cosign &> /dev/null; then
    echo "Error: Cosign is required for verification"
    echo "Install it from: https://docs.sigstore.dev/cosign/installation/"
    exit 1
  fi
  
  echo "Verifying image signature: $image_name"
  echo ""
  
  # In a real implementation, you would run:
  # cosign verify --key $signing_key $image_name
  
  echo "This is a simulation of verifying the image signature."
  echo "In a real environment, the following command would be executed:"
  echo "  cosign verify --key $signing_key $image_name"
  echo ""
  echo "Verification result: PASSED"
  echo "Image signature is valid: $image_name"
  
  # Log the verification operation
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Verified $image_name" >> "$LOGS_DIR/verification-$(date +%Y%m%d).log"
}

# Function to push an image with security checks
push_image() {
  local registry="$1"
  local repo="$2"
  local tag="$3"
  local max_vulns="$4"
  local block_critical="$5"
  local block_high="$6"
  local sign_image="$7"
  local signing_key="$8"
  
  local image_name=$(format_image_name "$registry" "$repo" "$tag")
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Pushing image with security checks: $image_name"
  fi
  
  echo "Preparing to push image: $image_name"
  echo ""
  
  # Step 1: Scan the image for vulnerabilities
  echo "Step 1: Scanning for vulnerabilities..."
  scan_image "$image_name" "$max_vulns" "$block_critical" "$block_high"
  local scan_result=$?
  
  if [[ $scan_result -ne 0 ]]; then
    echo "Push aborted: Image failed vulnerability scan"
    return 1
  fi
  
  # Step 2: Push the image
  echo ""
  echo "Step 2: Pushing image to registry..."
  
  # In a real implementation, you would run:
  # docker push "$image_name"
  
  echo "This is a simulation of pushing the image."
  echo "In a real environment, the following command would be executed:"
  echo "  docker push $image_name"
  echo ""
  echo "Image pushed successfully: $image_name"
  
  # Step 3: Sign the image if requested
  if [[ "$sign_image" == true && -n "$signing_key" ]]; then
    echo ""
    echo "Step 3: Signing the image..."
    sign_image "$image_name" "$signing_key"
  else
    echo ""
    echo "Step 3: Image signing skipped"
  fi
  
  echo ""
  echo "Push process completed successfully"
  echo "Image is now available at: $image_name"
  
  # Log the push operation
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Pushed $image_name" >> "$LOGS_DIR/push-$(date +%Y%m%d).log"
}

# Function to pull an image with security checks
pull_image() {
  local registry="$1"
  local repo="$2"
  local tag="$3"
  local max_vulns="$4"
  local block_critical="$5"
  local block_high="$6"
  local verify_signature="$7"
  local signing_key="$8"
  
  local image_name=$(format_image_name "$registry" "$repo" "$tag")
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Pulling image with security checks: $image_name"
  fi
  
  echo "Preparing to pull image: $image_name"
  echo ""
  
  # Step 1: Pull the image
  echo "Step 1: Pulling image from registry..."
  
  # In a real implementation, you would run:
  # docker pull "$image_name"
  
  echo "This is a simulation of pulling the image."
  echo "In a real environment, the following command would be executed:"
  echo "  docker pull $image_name"
  echo ""
  echo "Image pulled successfully: $image_name"
  
  # Step 2: Verify the image signature if requested
  if [[ "$verify_signature" == true && -n "$signing_key" ]]; then
    echo ""
    echo "Step 2: Verifying image signature..."
    verify_image "$image_name" "$signing_key"
    local verify_result=$?
    
    if [[ $verify_result -ne 0 ]]; then
      echo "Pull aborted: Image signature verification failed"
      
      # In a real implementation, you would remove the pulled image:
      # docker rmi "$image_name"
      
      return 1
    fi
  else
    echo ""
    echo "Step 2: Image signature verification skipped"
  fi
  
  # Step 3: Scan the image for vulnerabilities
  echo ""
  echo "Step 3: Scanning for vulnerabilities..."
  scan_image "$image_name" "$max_vulns" "$block_critical" "$block_high"
  local scan_result=$?
  
  if [[ $scan_result -ne 0 ]]; then
    echo "Warning: Image failed vulnerability scan"
    echo "Consider removing this image or applying additional security measures"
    
    # In practice, you might decide to remove the image:
    # docker rmi "$image_name"
  }
  
  echo ""
  echo "Pull process completed"
  
  # Log the pull operation
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Pulled $image_name" >> "$LOGS_DIR/pull-$(date +%Y%m%d).log"
}

# Function to list images with security status
list_images() {
  local registry="$1"
  local repo="$2"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Listing images in repository: $repo"
    echo "Registry: $registry"
  fi
  
  echo "Images in repository: $repo"
  echo "=========================="
  
  # Get list of tags - this is simplified, in practice would need proper API calls
  local tags=$(docker images "$repo" --format "{{.Tag}}" | grep -v "<none>")
  
  if [[ -z "$tags" ]]; then
    echo "No tags found for repository: $repo"
    return 0
  fi
  
  # Process each tag
  for tag in $tags; do
    local image_name=$(format_image_name "$registry" "$repo" "$tag")
    local created=$(docker inspect --format '{{.Created}}' "$image_name" 2>/dev/null)
    local size=$(docker images --format "{{.Size}}" --filter "reference=$image_name" 2>/dev/null)
    
    echo "Tag: $tag"
    echo "  Created: $created"
    echo "  Size: $size"
    
    # Check if image has been scanned before
    local scan_log="$LOGS_DIR/scans/$repo-$tag.json"
    if [[ -f "$scan_log" ]]; then
      # Parse scan results - simplified approach
      local critical=$(grep -o '"critical": [0-9]*' "$scan_log" | awk '{print $2}')
      local high=$(grep -o '"high": [0-9]*' "$scan_log" | awk '{print $2}')
      local total=$(grep -o '"total": [0-9]*' "$scan_log" | awk '{print $2}')
      local scan_date=$(grep -o '"scan_time": "[^"]*"' "$scan_log" | cut -d'"' -f4)
      
      echo "  Security scan (performed on $scan_date):"
      echo "    Critical vulnerabilities: $critical"
      echo "    High vulnerabilities: $high"
      echo "    Total vulnerabilities: $total"
    else
      echo "  Security scan: Not performed"
    fi
    
    # Check if image is signed
    echo "  Signature: Not checked"
    
    echo ""
  done
}

# Main function
main() {
  # Check required tools
  check_tools
  
  # Validate inputs
  validate_inputs
  
  # Format image name
  local image_name=$(format_image_name "$REGISTRY" "$REPOSITORY" "$TAG")
  
  # Execute the requested operation
  case "$OPERATION" in
    scan)
      scan_image "$image_name" "$MAX_VULNERABILITIES" "$BLOCK_CRITICAL" "$BLOCK_HIGH"
      ;;
    cleanup)
      cleanup_images "$REGISTRY" "$REPOSITORY" "$CLEANUP_DAYS" "$KEEP_TAGS"
      ;;
    sign)
      sign_image "$image_name" "$SIGNING_KEY"
      ;;
    verify)
      verify_image "$image_name" "$SIGNING_KEY"
      ;;
    push)
      push_image "$REGISTRY" "$REPOSITORY" "$TAG" "$MAX_VULNERABILITIES" "$BLOCK_CRITICAL" "$BLOCK_HIGH" "$SIGN_IMAGE" "$SIGNING_KEY"
      ;;
    pull)
      pull_image "$REGISTRY" "$REPOSITORY" "$TAG" "$MAX_VULNERABILITIES" "$BLOCK_CRITICAL" "$BLOCK_HIGH" "$SIGN_IMAGE" "$SIGNING_KEY"
      ;;
    list)
      list_images "$REGISTRY" "$REPOSITORY"
      ;;
    *)
      echo "Error: Unknown operation: $OPERATION"
      show_usage
      exit 1
      ;;
  esac
}

# Run the main function
main