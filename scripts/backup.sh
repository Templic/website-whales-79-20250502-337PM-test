#!/bin/bash

# Database and Application Backup Script
# This script creates a comprehensive backup of the application and database
# Created as part of the security implementation plan

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
  echo -e "${GREEN}[BACKUP] ${NC}$1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING] ${NC}$1"
}

print_error() {
  echo -e "${RED}[ERROR] ${NC}$1"
}

# Default configuration
CONFIG_FILE="config/backup_config.json"
BACKUP_DIR="backups"
ENCRYPT_DB=true
COMPRESS_LEVEL="high"
MAX_BACKUPS=10
EXCLUDE_PATTERNS=(".git" "node_modules" "tmp" "*.log" "*.tmp" "uploads/temp" "__pycache__" "*.pyc" ".env")

# Usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "  Options:"
  echo "    -c, --config FILE       Path to configuration file (default: $CONFIG_FILE)"
  echo "    -o, --output DIR        Output directory for backups (default: $BACKUP_DIR)"
  echo "    -n, --no-encrypt        Do not encrypt the database backup"
  echo "    -d, --db-only           Backup only the database"
  echo "    -a, --app-only          Backup only the application files"
  echo "    -h, --help              Display this help message"
  echo ""
  echo "  Example: $0 -o custom_backups -n"
  exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    -o|--output)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -n|--no-encrypt)
      ENCRYPT_DB=false
      shift
      ;;
    -d|--db-only)
      DB_ONLY=true
      shift
      ;;
    -a|--app-only)
      APP_ONLY=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      print_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Check if both db-only and app-only are specified
if [ "$DB_ONLY" = true ] && [ "$APP_ONLY" = true ]; then
  print_error "Cannot specify both --db-only and --app-only"
  exit 1
fi

# Timestamp for the backup
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="backup-$TIMESTAMP"
TEMP_DIR="tmp/$BACKUP_NAME"

# Create backup and temp directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$TEMP_DIR/application"
mkdir -p logs

# Load configuration if available
if [ -f "$CONFIG_FILE" ]; then
  print_message "Loading configuration from $CONFIG_FILE"
  
  # Extract configuration using 'jq' if available
  if command -v jq &> /dev/null; then
    CONFIG_ENABLED=$(jq -r '.backupSettings.enabled' "$CONFIG_FILE")
    AUTO_BACKUPS=$(jq -r '.backupSettings.automaticBackups' "$CONFIG_FILE")
    COMPRESS_LEVEL=$(jq -r '.backupSettings.compressionLevel' "$CONFIG_FILE")
    ENCRYPT_DB=$(jq -r '.backupSettings.encryptDatabase' "$CONFIG_FILE")
    MAX_BACKUPS=$(jq -r '.backupSettings.maxBackups' "$CONFIG_FILE")
    
    # Process exclude patterns
    if jq -e '.backupSettings.excludePatterns' "$CONFIG_FILE" > /dev/null; then
      readarray -t EXCLUDE_PATTERNS < <(jq -r '.backupSettings.excludePatterns[]' "$CONFIG_FILE")
    fi
    
    # Check if backups are disabled
    if [ "$CONFIG_ENABLED" = "false" ]; then
      print_warning "Backups are disabled in configuration. Set 'enabled: true' to enable."
      # Continue anyway since this was manually triggered
    fi
  else
    print_warning "jq is not installed. Using default configuration."
  fi
else
  print_warning "Configuration file not found: $CONFIG_FILE. Using default settings."
fi

# Begin backup process
print_message "Starting backup process at $(date)"
print_message "Creating backup: $BACKUP_NAME"

# Log file for the backup process
LOG_FILE="logs/backup-$TIMESTAMP.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Backup database if not app-only
if [ "$APP_ONLY" != true ]; then
  print_message "Backing up database..."
  
  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set. Database backup will be skipped."
  else
    # Parse the DATABASE_URL to extract connection details
    # Format could be postgresql://user:password@host:port/dbname or postgresql://user:password@host/dbname?options
    # Handle either postgres:// or postgresql:// prefix
    if [[ "$DATABASE_URL" == postgresql://* ]]; then
      DB_URL="${DATABASE_URL#postgresql://}"
    else
      DB_URL="${DATABASE_URL#postgres://}"
    fi
    DB_USER="${DB_URL%%:*}"
    DB_URL="${DB_URL#*:}"
    DB_PASS="${DB_URL%%@*}"
    DB_URL="${DB_URL#*@*}"
    
    # Check if the connection string has a port specified
    if [[ "$DB_URL" == *":"*"/"* ]]; then
      # Format: host:port/dbname
      DB_HOST="${DB_URL%%:*}"
      DB_URL="${DB_URL#*:}"
      DB_PORT="${DB_URL%%/*}"
      DB_NAME="${DB_URL#*/}"
    else
      # Format: host/dbname (no port)
      DB_HOST="${DB_URL%%/*}"
      DB_PORT="5432" # Use default PostgreSQL port
      DB_NAME="${DB_URL#*/}"
    fi
    
    # Remove any query parameters from DB_NAME and DB_HOST
    DB_NAME="${DB_NAME%%\?*}"
    
    # Handle special case for Neon databases which may have project name in hostname
    if [[ "$DB_HOST" == *".neon.tech" ]]; then
      print_message "Detected Neon serverless database"
      # Use full host as connection string for Neon with SSL required
      export PGSSLMODE=require
      PG_CONN_OPTS="-h $DB_HOST --no-password"
      # For Neon, don't use -p parameter as it's part of the hostname
    else
      PG_CONN_OPTS="-h $DB_HOST -p $DB_PORT"
    fi
    
    print_message "Backing up database: $DB_NAME"
    
    # Export database schema and data
    PGPASSWORD="$DB_PASS" pg_dump $PG_CONN_OPTS -U "$DB_USER" -d "$DB_NAME" -f "$TEMP_DIR/database_backup.sql"
    
    if [ $? -ne 0 ]; then
      print_error "Database backup failed"
    else
      print_message "Database backed up successfully"
      
      # Check database backup size
      DB_BACKUP_SIZE=$(du -h "$TEMP_DIR/database_backup.sql" | cut -f1)
      print_message "Database backup size: $DB_BACKUP_SIZE"
      
      # Encrypt database backup if enabled
      if [ "$ENCRYPT_DB" = true ]; then
        print_message "Encrypting database backup..."
        
        # Generate a random encryption key
        ENCRYPT_PASS=$(openssl rand -base64 32)
        
        # Save the encryption key
        echo "$ENCRYPT_PASS" > "$TEMP_DIR/db_encrypt_key.txt"
        
        # Encrypt the database backup
        openssl enc -aes-256-cbc -pbkdf2 -salt -in "$TEMP_DIR/database_backup.sql" -out "$TEMP_DIR/database_backup.sql.enc" -pass pass:"$ENCRYPT_PASS"
        
        if [ $? -ne 0 ]; then
          print_error "Database encryption failed"
        else
          print_message "Database encrypted successfully"
          # Remove the unencrypted backup
          rm "$TEMP_DIR/database_backup.sql"
        fi
      fi
    fi
  fi
fi

# Backup application files if not db-only
if [ "$DB_ONLY" != true ]; then
  print_message "Backing up application files..."
  
  # Create rsync exclude arguments
  EXCLUDE_ARGS=""
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude='$pattern'"
  done
  
  # Additional hardcoded excludes for safety
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude='$BACKUP_DIR' --exclude='$TEMP_DIR' --exclude='tmp'"
  
  # Copy application files to temp directory
  RSYNC_CMD="rsync -a $EXCLUDE_ARGS ./ $TEMP_DIR/application/"
  eval $RSYNC_CMD
  
  if [ $? -ne 0 ]; then
    print_error "Application backup failed"
  else
    print_message "Application files backed up successfully"
    
    # Check application backup size
    APP_BACKUP_SIZE=$(du -sh "$TEMP_DIR/application" | cut -f1)
    print_message "Application backup size: $APP_BACKUP_SIZE"
  fi
fi

# Create backup info file
cat > "$TEMP_DIR/backup_info.json" << EOF
{
  "timestamp": "$(date)",
  "backupName": "$BACKUP_NAME",
  "databaseIncluded": $([ "$APP_ONLY" != true ] && echo "true" || echo "false"),
  "applicationIncluded": $([ "$DB_ONLY" != true ] && echo "true" || echo "false"),
  "encryptedDatabase": $([ "$ENCRYPT_DB" = true ] && [ "$APP_ONLY" != true ] && echo "true" || echo "false"),
  "compressionLevel": "$COMPRESS_LEVEL",
  "encryptionKeyFile": "$([ "$ENCRYPT_DB" = true ] && [ "$APP_ONLY" != true ] && echo "db_encrypt_key.txt" || echo "none")",
  "hostname": "$(hostname)",
  "creator": "backup.sh script",
  "appVersion": "$(grep -oP '"version": "\K[^"]+' package.json 2>/dev/null || echo "unknown")"
}
EOF

# Create a tarball of the backup
print_message "Creating compressed archive..."

# Set compression level
case "$COMPRESS_LEVEL" in
  "low")
    COMPRESSION="-z"
    ;;
  "medium")
    COMPRESSION="-z"
    ;;
  "high")
    COMPRESSION="--zstd"
    ;;
  *)
    COMPRESSION="-z"
    ;;
esac

# Create tar archive
tar $COMPRESSION -cf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$(dirname "$TEMP_DIR")" "$(basename "$TEMP_DIR")"

if [ $? -ne 0 ]; then
  print_error "Archive creation failed"
else
  ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)
  print_message "Archive created successfully: $BACKUP_DIR/$BACKUP_NAME.tar.gz (Size: $ARCHIVE_SIZE)"
  
  # Calculate SHA256 checksum
  if command -v sha256sum &> /dev/null; then
    sha256sum "$BACKUP_DIR/$BACKUP_NAME.tar.gz" > "$BACKUP_DIR/$BACKUP_NAME.sha256"
    print_message "SHA256 checksum created: $BACKUP_DIR/$BACKUP_NAME.sha256"
  fi
fi

# Clean up temporary files
print_message "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Implement backup rotation (remove old backups if exceeding MAX_BACKUPS)
if [ "$MAX_BACKUPS" -gt 0 ]; then
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | wc -l)
  
  if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    print_message "Removing old backups to maintain maximum of $MAX_BACKUPS backups..."
    ls -t "$BACKUP_DIR"/backup-*.tar.gz | tail -n +$((MAX_BACKUPS+1)) | xargs rm -f
    ls -t "$BACKUP_DIR"/backup-*.sha256 2>/dev/null | tail -n +$((MAX_BACKUPS+1)) | xargs rm -f
  fi
fi

# List current backups
print_message "Current backups:"
ls -lh "$BACKUP_DIR" | grep "backup-"

# Print backup summary
echo ""
echo "========================================================"
echo -e "${GREEN}Backup Summary${NC}"
echo "========================================================"
echo "Timestamp: $(date)"
echo "Backup Name: $BACKUP_NAME"
echo "Archive Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "Archive Size: $ARCHIVE_SIZE"
if [ "$APP_ONLY" != true ]; then
  echo "Database: Included $([ "$ENCRYPT_DB" = true ] && echo "(Encrypted)")"
fi
if [ "$DB_ONLY" != true ]; then
  echo "Application: Included (Size: $APP_BACKUP_SIZE)"
fi
echo "Log File: $LOG_FILE"
echo "========================================================"
echo -e "${YELLOW}Restore Command:${NC}"
echo "./scripts/restore.sh -b $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "========================================================"

print_message "Backup process completed at $(date)"
exit 0