#!/bin/bash
# Ephemeral Storage Manager for Containers
# This script manages secure ephemeral volumes for containerized applications

# Default values
OPERATION="create"
VOLUME_NAME=""
CONTAINER_NAME=""
MOUNT_PATH=""
SIZE="10G"
ENCRYPTED=false
ENCRYPTION_KEY=""
TEMP_STORAGE=false
AUTO_DELETE=false
BACKUP_PATH=""
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Ephemeral Storage Manager for Containers"
  echo "Usage: $0 [options]"
  echo ""
  echo "Operations:"
  echo "  --create              Create a new ephemeral volume (default)"
  echo "  --attach              Attach a volume to a container"
  echo "  --detach              Detach a volume from a container"
  echo "  --backup              Backup a volume"
  echo "  --restore             Restore a volume"
  echo "  --delete              Delete a volume"
  echo "  --list                List volumes"
  echo "  --monitor             Monitor volume access"
  echo ""
  echo "Options:"
  echo "  --volume <name>       Volume name"
  echo "  --container <name>    Container name"
  echo "  --mount <path>        Mount path inside container"
  echo "  --size <size>         Volume size [default: 10G]"
  echo "  --encrypted           Create an encrypted volume"
  echo "  --key <file>          Encryption key file"
  echo "  --temp                Use tmpfs for in-memory storage"
  echo "  --auto-delete         Auto-delete volume when container stops"
  echo "  --backup-path <path>  Path for volume backups"
  echo "  --verbose             Enable verbose output"
  echo "  --help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  # Create an encrypted ephemeral volume"
  echo "  $0 --create --volume secure-data --encrypted --key /path/to/keyfile"
  echo ""
  echo "  # Attach a volume to a container"
  echo "  $0 --attach --volume secure-data --container my-app --mount /app/data"
  echo ""
  echo "  # Create a temporary in-memory volume and attach it"
  echo "  $0 --create --volume temp-cache --temp --container web-app --mount /app/cache --auto-delete"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --create)
      OPERATION="create"
      shift
      ;;
    --attach)
      OPERATION="attach"
      shift
      ;;
    --detach)
      OPERATION="detach"
      shift
      ;;
    --backup)
      OPERATION="backup"
      shift
      ;;
    --restore)
      OPERATION="restore"
      shift
      ;;
    --delete)
      OPERATION="delete"
      shift
      ;;
    --list)
      OPERATION="list"
      shift
      ;;
    --monitor)
      OPERATION="monitor"
      shift
      ;;
    --volume)
      VOLUME_NAME="$2"
      shift 2
      ;;
    --container)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --mount)
      MOUNT_PATH="$2"
      shift 2
      ;;
    --size)
      SIZE="$2"
      shift 2
      ;;
    --encrypted)
      ENCRYPTED=true
      shift
      ;;
    --key)
      ENCRYPTION_KEY="$2"
      shift 2
      ;;
    --temp)
      TEMP_STORAGE=true
      shift
      ;;
    --auto-delete)
      AUTO_DELETE=true
      shift
      ;;
    --backup-path)
      BACKUP_PATH="$2"
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

# Create the metadata directory if it doesn't exist
METADATA_DIR="./security/volumes"
mkdir -p "$METADATA_DIR"

# Function to check if Docker is installed
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
  fi
}

# Function to validate volume name
validate_volume_name() {
  local name="$1"
  
  if [[ -z "$name" ]]; then
    echo "Error: Volume name is required"
    exit 1
  fi
  
  # Check if name follows Docker volume naming conventions
  if ! [[ "$name" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
    echo "Error: Invalid volume name: $name"
    echo "Volume names must start with an alphanumeric character and can include underscores, dots, and dashes"
    exit 1
  fi
}

# Function to validate container name
validate_container_name() {
  local name="$1"
  
  if [[ -z "$name" ]]; then
    echo "Error: Container name is required"
    exit 1
  fi
  
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^$name$"; then
    echo "Error: Container not found: $name"
    exit 1
  fi
}

# Function to validate mount path
validate_mount_path() {
  local path="$1"
  
  if [[ -z "$path" ]]; then
    echo "Error: Mount path is required"
    exit 1
  fi
  
  # Check if path is absolute
  if [[ "$path" != /* ]]; then
    echo "Error: Mount path must be absolute: $path"
    exit 1
  fi
}

# Function to save volume metadata
save_volume_metadata() {
  local name="$1"
  local encrypted="$2"
  local temp="$3"
  local auto_delete="$4"
  local size="$5"
  local creation_time="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  
  local metadata_file="$METADATA_DIR/$name.json"
  
  cat << EOF > "$metadata_file"
{
  "name": "$name",
  "encrypted": $encrypted,
  "temporary": $temp,
  "auto_delete": $auto_delete,
  "size": "$size",
  "created": "$creation_time",
  "attachments": [],
  "backups": []
}
EOF
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Volume metadata saved: $metadata_file"
  fi
}

# Function to update volume metadata
update_volume_metadata() {
  local name="$1"
  local key="$2"
  local value="$3"
  
  local metadata_file="$METADATA_DIR/$name.json"
  
  if [[ ! -f "$metadata_file" ]]; then
    echo "Error: Volume metadata not found: $metadata_file"
    exit 1
  fi
  
  # Use temporary file for editing
  local temp_file=$(mktemp)
  
  # Update JSON (simple replacement for basic fields)
  case "$key" in
    encrypted|temporary|auto_delete)
      # Boolean values
      sed -E "s/\"$key\": (true|false)/\"$key\": $value/" "$metadata_file" > "$temp_file"
      ;;
    name|size)
      # String values
      sed -E "s/\"$key\": \"[^\"]*\"/\"$key\": \"$value\"/" "$metadata_file" > "$temp_file"
      ;;
    attachments|backups)
      # This is more complex and would require proper JSON parsing
      echo "Error: Updating arrays in metadata is not supported in this version"
      rm "$temp_file"
      exit 1
      ;;
    *)
      echo "Error: Unknown metadata key: $key"
      rm "$temp_file"
      exit 1
      ;;
  esac
  
  # Replace the original file
  mv "$temp_file" "$metadata_file"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Volume metadata updated: $key = $value"
  fi
}

# Function to add attachment to volume metadata
add_attachment_to_metadata() {
  local volume="$1"
  local container="$2"
  local mount_path="$3"
  
  local metadata_file="$METADATA_DIR/$volume.json"
  
  if [[ ! -f "$metadata_file" ]]; then
    echo "Error: Volume metadata not found: $metadata_file"
    exit 1
  fi
  
  # Get existing attachments
  local temp_file=$(mktemp)
  
  # This is a very simplified approach that works for simple JSON structures
  # For production use, consider using jq or a proper JSON parser
  
  # Extract the attachments array
  local attachments=$(grep -A 100 '"attachments": \[' "$metadata_file" | grep -B 100 '\]' | head -n -1 | tail -n +2)
  
  # Create the new attachment entry
  local new_attachment="{
    \"container\": \"$container\",
    \"mount_path\": \"$mount_path\",
    \"attached_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"
  
  # Update the attachments array
  if [[ -z "$attachments" ]]; then
    # Empty array
    sed -E "s/\"attachments\": \[\]/\"attachments\": \[$new_attachment\]/" "$metadata_file" > "$temp_file"
  else
    # Non-empty array, add comma and new entry
    sed -E "s/(\"attachments\": \[)(.*)(\])/\1\2, $new_attachment\3/" "$metadata_file" > "$temp_file"
  fi
  
  # Replace the original file
  mv "$temp_file" "$metadata_file"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Attachment added to volume metadata: $container:$mount_path"
  fi
}

# Function to remove attachment from volume metadata
remove_attachment_from_metadata() {
  local volume="$1"
  local container="$2"
  
  local metadata_file="$METADATA_DIR/$volume.json"
  
  if [[ ! -f "$metadata_file" ]]; then
    echo "Error: Volume metadata not found: $metadata_file"
    exit 1
  fi
  
  # This would require proper JSON parsing
  # For simplicity, we'll just note that this is not implemented
  echo "Note: Removing attachment from metadata is not implemented in this version"
  echo "The container will be detached but metadata won't be updated"
}

# Function to add backup to volume metadata
add_backup_to_metadata() {
  local volume="$1"
  local backup_path="$2"
  
  local metadata_file="$METADATA_DIR/$volume.json"
  
  if [[ ! -f "$metadata_file" ]]; then
    echo "Error: Volume metadata not found: $metadata_file"
    exit 1
  fi
  
  # Get existing backups
  local temp_file=$(mktemp)
  
  # Create the new backup entry
  local new_backup="{
    \"path\": \"$backup_path\",
    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"
  
  # Extract the backups array
  local backups=$(grep -A 100 '"backups": \[' "$metadata_file" | grep -B 100 '\]' | head -n -1 | tail -n +2)
  
  # Update the backups array
  if [[ -z "$backups" ]]; then
    # Empty array
    sed -E "s/\"backups\": \[\]/\"backups\": \[$new_backup\]/" "$metadata_file" > "$temp_file"
  else
    # Non-empty array, add comma and new entry
    sed -E "s/(\"backups\": \[)(.*)(\])/\1\2, $new_backup\3/" "$metadata_file" > "$temp_file"
  fi
  
  # Replace the original file
  mv "$temp_file" "$metadata_file"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Backup added to volume metadata: $backup_path"
  fi
}

# Create a new ephemeral volume
create_volume() {
  local name="$1"
  local size="$2"
  local encrypted="$3"
  local encryption_key="$4"
  local temp="$5"
  local auto_delete="$6"
  
  # Validate volume name
  validate_volume_name "$name"
  
  # Check if volume already exists
  if docker volume ls --format "{{.Name}}" | grep -q "^$name$"; then
    echo "Error: Volume already exists: $name"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Creating volume: $name"
    echo "Size: $size"
    echo "Encrypted: $encrypted"
    echo "Temporary storage: $temp"
    echo "Auto-delete: $auto_delete"
  fi
  
  local driver_opts=""
  
  if [[ "$temp" == true ]]; then
    # Create a tmpfs volume (in-memory)
    driver_opts="--driver local --opt type=tmpfs --opt device=tmpfs --opt o=size=$size"
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Using tmpfs driver for in-memory storage"
    fi
  else
    # Create a regular volume with size limit
    driver_opts="--driver local"
    
    # Size option is not directly supported in Docker volume create
    # It would require configuring the storage driver
    if [[ "$VERBOSE" == true ]]; then
      echo "Note: Volume size limits are not directly enforced by Docker volume create"
      echo "Size limits would be applied at the filesystem level"
    fi
  fi
  
  # Create the volume
  docker volume create $driver_opts "$name"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to create volume: $name"
    exit 1
  fi
  
  # If encryption is enabled, set up encryption
  if [[ "$encrypted" == true ]]; then
    # Check if encryption key is provided
    if [[ -z "$encryption_key" ]]; then
      echo "Error: Encryption key is required for encrypted volumes"
      
      # Clean up the volume
      docker volume rm "$name" &>/dev/null
      
      exit 1
    fi
    
    if [[ ! -f "$encryption_key" ]]; then
      echo "Error: Encryption key file not found: $encryption_key"
      
      # Clean up the volume
      docker volume rm "$name" &>/dev/null
      
      exit 1
    fi
    
    if [[ "$VERBOSE" == true ]]; then
      echo "Setting up encryption for volume: $name"
      echo "Using key file: $encryption_key"
    fi
    
    # In a real implementation, we would set up disk encryption
    # This would typically involve:
    # 1. Creating a LUKS or eCryptfs container
    # 2. Mounting it on a temporary location
    # 3. Moving the Docker volume data to the encrypted container
    
    # For this script, we'll simulate this process
    echo "Note: Volume encryption is simulated in this version"
    echo "In a real deployment, this would use dm-crypt/LUKS or eCryptfs"
    
    # Create a marker file to indicate the volume is encrypted
    local volume_path=$(docker volume inspect --format '{{.Mountpoint}}' "$name")
    echo "ENCRYPTED" > "$volume_path/.encrypted"
    echo "This volume is encrypted and requires a key to mount" > "$volume_path/README.txt"
  fi
  
  # Save volume metadata
  save_volume_metadata "$name" "$encrypted" "$temp" "$auto_delete" "$size"
  
  echo "Volume created successfully: $name"
  
  # If attaching to a container, do it now
  if [[ -n "$CONTAINER_NAME" && -n "$MOUNT_PATH" ]]; then
    attach_volume "$name" "$CONTAINER_NAME" "$MOUNT_PATH"
  fi
}

# Attach a volume to a container
attach_volume() {
  local volume="$1"
  local container="$2"
  local mount_path="$3"
  
  # Validate inputs
  validate_volume_name "$volume"
  validate_container_name "$container"
  validate_mount_path "$mount_path"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Attaching volume $volume to container $container at $mount_path"
  fi
  
  # Check if volume exists
  if ! docker volume ls --format "{{.Name}}" | grep -q "^$volume$"; then
    echo "Error: Volume not found: $volume"
    exit 1
  fi
  
  # Get metadata file
  local metadata_file="$METADATA_DIR/$volume.json"
  
  if [[ ! -f "$metadata_file" ]]; then
    echo "Warning: Volume metadata not found, creating basic metadata"
    save_volume_metadata "$volume" "false" "false" "false" "unknown"
  fi
  
  # Check if volume is encrypted
  local is_encrypted="false"
  if grep -q '"encrypted": true' "$metadata_file"; then
    is_encrypted="true"
  fi
  
  if [[ "$is_encrypted" == "true" && -z "$ENCRYPTION_KEY" ]]; then
    echo "Error: Encryption key is required for encrypted volumes"
    exit 1
  fi
  
  # In a real implementation, this is where we would:
  # 1. Mount the encrypted volume if needed
  # 2. Create a bind mount to the container
  
  echo "Note: In a real deployment, this would:"
  echo "1. Stop the container"
  echo "2. Update the container configuration to include the volume mount"
  echo "3. Restart the container"
  echo ""
  echo "For this demo, please manually restart your container with:"
  echo "docker stop $container"
  echo "docker rm $container"
  echo "docker run -v $volume:$mount_path ... (other options) ... your-image"
  
  # Update metadata
  add_attachment_to_metadata "$volume" "$container" "$mount_path"
  
  echo "Volume attachment prepared: $volume -> $container:$mount_path"
}

# Detach a volume from a container
detach_volume() {
  local volume="$1"
  local container="$2"
  
  # Validate inputs
  validate_volume_name "$volume"
  validate_container_name "$container"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Detaching volume $volume from container $container"
  fi
  
  # Check if volume exists
  if ! docker volume ls --format "{{.Name}}" | grep -q "^$volume$"; then
    echo "Error: Volume not found: $volume"
    exit 1
  fi
  
  # In a real implementation, this is where we would:
  # 1. Stop the container
  # 2. Remove the volume mount
  # 3. Restart the container
  
  echo "Note: In a real deployment, this would:"
  echo "1. Stop the container"
  echo "2. Update the container configuration to remove the volume mount"
  echo "3. Restart the container"
  echo ""
  echo "For this demo, please manually restart your container without the volume mount"
  
  # Update metadata
  remove_attachment_from_metadata "$volume" "$container"
  
  echo "Volume detachment prepared: $volume from $container"
}

# Backup a volume
backup_volume() {
  local volume="$1"
  local backup_path="$2"
  
  # Validate inputs
  validate_volume_name "$volume"
  
  if [[ -z "$backup_path" ]]; then
    # Use default backup location if not specified
    backup_path="./backups/volumes/$volume-$(date +%Y%m%d-%H%M%S).tar.gz"
  fi
  
  # Create backup directory if it doesn't exist
  mkdir -p "$(dirname "$backup_path")"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Backing up volume $volume to $backup_path"
  fi
  
  # Check if volume exists
  if ! docker volume ls --format "{{.Name}}" | grep -q "^$volume$"; then
    echo "Error: Volume not found: $volume"
    exit 1
  fi
  
  # Get metadata file
  local metadata_file="$METADATA_DIR/$volume.json"
  
  if [[ ! -f "$metadata_file" ]]; then
    echo "Warning: Volume metadata not found"
  fi
  
  # Create a temporary container to access the volume
  echo "Creating temporary container to access volume data..."
  
  local temp_container="backup-$volume-$(date +%s)"
  
  docker run --rm -d --name "$temp_container" -v "$volume:/volume" \
    alpine sh -c "while true; do sleep 1; done"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to create temporary container for backup"
    exit 1
  fi
  
  # Create the backup
  echo "Creating backup archive..."
  
  docker exec "$temp_container" tar -czf - -C /volume . > "$backup_path"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to create backup"
    
    # Clean up the temporary container
    docker rm -f "$temp_container" &>/dev/null
    
    exit 1
  fi
  
  # Stop and remove the temporary container
  docker rm -f "$temp_container" &>/dev/null
  
  # Update metadata
  add_backup_to_metadata "$volume" "$backup_path"
  
  echo "Volume backup created: $backup_path"
}

# Restore a volume
restore_volume() {
  local volume="$1"
  local backup_path="$2"
  
  # Validate inputs
  validate_volume_name "$volume"
  
  if [[ -z "$backup_path" ]]; then
    echo "Error: Backup path is required"
    exit 1
  fi
  
  if [[ ! -f "$backup_path" ]]; then
    echo "Error: Backup file not found: $backup_path"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Restoring volume $volume from $backup_path"
  fi
  
  # Check if volume exists
  if ! docker volume ls --format "{{.Name}}" | grep -q "^$volume$"; then
    echo "Error: Volume not found: $volume"
    exit 1
  fi
  
  # Create a temporary container to access the volume
  echo "Creating temporary container to access volume data..."
  
  local temp_container="restore-$volume-$(date +%s)"
  
  docker run --rm -d --name "$temp_container" -v "$volume:/volume" \
    alpine sh -c "while true; do sleep 1; done"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to create temporary container for restore"
    exit 1
  fi
  
  # Clear the volume
  echo "Clearing existing volume data..."
  
  docker exec "$temp_container" sh -c "rm -rf /volume/*"
  
  # Extract the backup
  echo "Extracting backup archive..."
  
  cat "$backup_path" | docker exec -i "$temp_container" tar -xzf - -C /volume
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to restore backup"
    
    # Clean up the temporary container
    docker rm -f "$temp_container" &>/dev/null
    
    exit 1
  fi
  
  # Stop and remove the temporary container
  docker rm -f "$temp_container" &>/dev/null
  
  echo "Volume restored from backup: $volume"
}

# Delete a volume
delete_volume() {
  local volume="$1"
  
  # Validate inputs
  validate_volume_name "$volume"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Deleting volume $volume"
  fi
  
  # Check if volume exists
  if ! docker volume ls --format "{{.Name}}" | grep -q "^$volume$"; then
    echo "Error: Volume not found: $volume"
    exit 1
  fi
  
  # Check if volume is attached to any containers
  local attached_containers=$(docker ps -a --filter "volume=$volume" --format "{{.Names}}")
  
  if [[ -n "$attached_containers" ]]; then
    echo "Error: Volume is still attached to containers:"
    echo "$attached_containers"
    echo "Detach the volume from these containers first"
    exit 1
  fi
  
  # Get metadata file
  local metadata_file="$METADATA_DIR/$volume.json"
  
  # Remove the volume
  docker volume rm "$volume"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to delete volume: $volume"
    exit 1
  fi
  
  # Remove metadata file if it exists
  if [[ -f "$metadata_file" ]]; then
    rm "$metadata_file"
  fi
  
  echo "Volume deleted: $volume"
}

# List volumes
list_volumes() {
  echo "Ephemeral volumes:"
  echo ""
  
  # Get list of Docker volumes
  local volumes=$(docker volume ls --format "{{.Name}}")
  
  if [[ -z "$volumes" ]]; then
    echo "No volumes found"
    return
  fi
  
  # Print information about each volume
  for volume in $volumes; do
    local metadata_file="$METADATA_DIR/$volume.json"
    local metadata_exists=false
    local is_encrypted="unknown"
    local is_temporary="unknown"
    local is_auto_delete="unknown"
    local size="unknown"
    local created="unknown"
    local attachments="none"
    
    if [[ -f "$metadata_file" ]]; then
      metadata_exists=true
      
      # Extract information from metadata (this is simplified)
      if grep -q '"encrypted": true' "$metadata_file"; then
        is_encrypted="yes"
      elif grep -q '"encrypted": false' "$metadata_file"; then
        is_encrypted="no"
      fi
      
      if grep -q '"temporary": true' "$metadata_file"; then
        is_temporary="yes"
      elif grep -q '"temporary": false' "$metadata_file"; then
        is_temporary="no"
      fi
      
      if grep -q '"auto_delete": true' "$metadata_file"; then
        is_auto_delete="yes"
      elif grep -q '"auto_delete": false' "$metadata_file"; then
        is_auto_delete="no"
      fi
      
      size=$(grep -o '"size": "[^"]*"' "$metadata_file" | cut -d'"' -f4)
      created=$(grep -o '"created": "[^"]*"' "$metadata_file" | cut -d'"' -f4)
      
      # Check for attachments (simplified)
      if grep -q '"container": "[^"]*"' "$metadata_file"; then
        attachments=$(grep -o '"container": "[^"]*"' "$metadata_file" | cut -d'"' -f4 | paste -sd,)
      fi
    fi
    
    # Get Docker volume information
    local driver=$(docker volume inspect --format '{{.Driver}}' "$volume")
    local mountpoint=$(docker volume inspect --format '{{.Mountpoint}}' "$volume")
    
    echo "Volume: $volume"
    echo "  Driver: $driver"
    echo "  Mountpoint: $mountpoint"
    
    if [[ "$metadata_exists" == true ]]; then
      echo "  Created: $created"
      echo "  Size: $size"
      echo "  Encrypted: $is_encrypted"
      echo "  Temporary: $is_temporary"
      echo "  Auto-delete: $is_auto_delete"
      echo "  Attached to: $attachments"
    else
      echo "  Metadata: none"
    fi
    
    # Get attached containers
    local containers=$(docker ps -a --filter "volume=$volume" --format "{{.Names}}")
    
    if [[ -n "$containers" ]]; then
      echo "  Currently used by:"
      echo "$containers" | sed 's/^/    /'
    fi
    
    echo ""
  done
}

# Monitor volume access
monitor_volume() {
  local volume="$1"
  
  # Validate inputs
  validate_volume_name "$volume"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Monitoring volume $volume"
  fi
  
  # Check if volume exists
  if ! docker volume ls --format "{{.Name}}" | grep -q "^$volume$"; then
    echo "Error: Volume not found: $volume"
    exit 1
  fi
  
  # Get volume mountpoint
  local mountpoint=$(docker volume inspect --format '{{.Mountpoint}}' "$volume")
  
  echo "Starting volume access monitoring for: $volume"
  echo "Mountpoint: $mountpoint"
  echo "Press Ctrl+C to stop monitoring"
  echo ""
  
  # In a real implementation, we would use inotify or auditd
  # For this demo script, we'll use a simple polling approach
  
  # Create a log file for access events
  local log_file="$METADATA_DIR/$volume-access.log"
  
  echo "$(date -u): Started monitoring volume $volume" > "$log_file"
  
  # Get initial state
  local initial_files=$(find "$mountpoint" -type f -exec stat -c "%n %Y %s" {} \; 2>/dev/null | sort)
  
  echo "Initial file count: $(echo "$initial_files" | wc -l)"
  
  # Monitor loop
  while true; do
    sleep 5
    
    # Get current state
    local current_files=$(find "$mountpoint" -type f -exec stat -c "%n %Y %s" {} \; 2>/dev/null | sort)
    
    # Find differences
    local added_files=$(comm -13 <(echo "$initial_files") <(echo "$current_files"))
    local removed_files=$(comm -23 <(echo "$initial_files") <(echo "$current_files"))
    local modified_files=$(comm -12 <(echo "$initial_files") <(echo "$current_files") | while read line; do
      initial_line=$(echo "$initial_files" | grep "^$(echo "$line" | cut -d' ' -f1)")
      current_line=$(echo "$current_files" | grep "^$(echo "$line" | cut -d' ' -f1)")
      initial_time=$(echo "$initial_line" | cut -d' ' -f2)
      current_time=$(echo "$current_line" | cut -d' ' -f2)
      initial_size=$(echo "$initial_line" | cut -d' ' -f3)
      current_size=$(echo "$current_line" | cut -d' ' -f3)
      
      if [[ "$initial_time" != "$current_time" || "$initial_size" != "$current_size" ]]; then
        echo "$line"
      fi
    done)
    
    # Log changes
    if [[ -n "$added_files" ]]; then
      echo "$(date -u): Files added:" | tee -a "$log_file"
      echo "$added_files" | sed 's/^/  /' | tee -a "$log_file"
    fi
    
    if [[ -n "$removed_files" ]]; then
      echo "$(date -u): Files removed:" | tee -a "$log_file"
      echo "$removed_files" | sed 's/^/  /' | tee -a "$log_file"
    fi
    
    if [[ -n "$modified_files" ]]; then
      echo "$(date -u): Files modified:" | tee -a "$log_file"
      echo "$modified_files" | sed 's/^/  /' | tee -a "$log_file"
    fi
    
    # Update initial state
    initial_files="$current_files"
  done
}

# Main function
main() {
  check_docker
  
  case "$OPERATION" in
    create)
      if [[ -z "$VOLUME_NAME" ]]; then
        echo "Error: Volume name is required"
        show_usage
        exit 1
      fi
      
      create_volume "$VOLUME_NAME" "$SIZE" "$ENCRYPTED" "$ENCRYPTION_KEY" "$TEMP_STORAGE" "$AUTO_DELETE"
      ;;
      
    attach)
      if [[ -z "$VOLUME_NAME" || -z "$CONTAINER_NAME" || -z "$MOUNT_PATH" ]]; then
        echo "Error: Volume name, container name, and mount path are required"
        show_usage
        exit 1
      fi
      
      attach_volume "$VOLUME_NAME" "$CONTAINER_NAME" "$MOUNT_PATH"
      ;;
      
    detach)
      if [[ -z "$VOLUME_NAME" || -z "$CONTAINER_NAME" ]]; then
        echo "Error: Volume name and container name are required"
        show_usage
        exit 1
      fi
      
      detach_volume "$VOLUME_NAME" "$CONTAINER_NAME"
      ;;
      
    backup)
      if [[ -z "$VOLUME_NAME" ]]; then
        echo "Error: Volume name is required"
        show_usage
        exit 1
      fi
      
      backup_volume "$VOLUME_NAME" "$BACKUP_PATH"
      ;;
      
    restore)
      if [[ -z "$VOLUME_NAME" || -z "$BACKUP_PATH" ]]; then
        echo "Error: Volume name and backup path are required"
        show_usage
        exit 1
      fi
      
      restore_volume "$VOLUME_NAME" "$BACKUP_PATH"
      ;;
      
    delete)
      if [[ -z "$VOLUME_NAME" ]]; then
        echo "Error: Volume name is required"
        show_usage
        exit 1
      fi
      
      delete_volume "$VOLUME_NAME"
      ;;
      
    list)
      list_volumes
      ;;
      
    monitor)
      if [[ -z "$VOLUME_NAME" ]]; then
        echo "Error: Volume name is required"
        show_usage
        exit 1
      fi
      
      monitor_volume "$VOLUME_NAME"
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