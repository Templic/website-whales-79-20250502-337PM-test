#!/bin/bash

# Database and Application Restoration Script
# This script restores the application and database from a backup
# Created as part of the security implementation plan

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
  echo -e "${GREEN}[RESTORE] ${NC}$1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING] ${NC}$1"
}

print_error() {
  echo -e "${RED}[ERROR] ${NC}$1"
}

# Usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "  Options:"
  echo "    -b, --backup BACKUP_FILE  Specify the backup archive to restore (required)"
  echo "    -d, --db-only            Restore only the database"
  echo "    -a, --app-only           Restore only the application files"
  echo "    -f, --force              Force restoration without confirmation"
  echo "    -h, --help               Display this help message"
  echo ""
  echo "  Example: $0 -b backups/backup-20250406-123045.tar.gz"
  exit 1
}

# Parse command line arguments
BACKUP_FILE=""
DB_ONLY=false
APP_ONLY=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--backup)
      BACKUP_FILE="$2"
      shift 2
      ;;
    -d|--db-only)
      DB_ONLY=true
      shift
      ;;
    -a|--app-only)
      APP_ONLY=true
      shift
      ;;
    -f|--force)
      FORCE=true
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

# Check if backup file is specified
if [ -z "$BACKUP_FILE" ]; then
  print_error "Backup file must be specified with -b or --backup"
  usage
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  print_error "Backup file does not exist: $BACKUP_FILE"
  exit 1
fi

# Extract backup file information
BACKUP_FILENAME=$(basename "$BACKUP_FILE")
BACKUP_TIMESTAMP=${BACKUP_FILENAME#backup-}
BACKUP_TIMESTAMP=${BACKUP_TIMESTAMP%.tar.gz}
TEMP_EXTRACT_DIR="tmp/restore_${BACKUP_TIMESTAMP}"

print_message "Preparing to restore from backup: $BACKUP_FILENAME"
print_message "Timestamp: $BACKUP_TIMESTAMP"

# Confirm restoration if not forced
if [ "$FORCE" = false ]; then
  echo ""
  print_warning "This will overwrite existing data. Are you sure you want to continue? (y/n)"
  read -r CONFIRM
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_message "Restoration cancelled by user"
    exit 0
  fi
fi

# Create temporary directory for extraction
mkdir -p "$TEMP_EXTRACT_DIR"

# Extract the backup archive
print_message "Extracting backup archive..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_EXTRACT_DIR"

if [ $? -ne 0 ]; then
  print_error "Failed to extract backup archive"
  rm -rf "$TEMP_EXTRACT_DIR"
  exit 1
fi

# Find the actual backup directory within the extracted archive
BACKUP_DIR=$(find "$TEMP_EXTRACT_DIR" -type d -name "$BACKUP_TIMESTAMP" | head -1)

if [ -z "$BACKUP_DIR" ]; then
  print_error "Could not find backup directory within the archive"
  rm -rf "$TEMP_EXTRACT_DIR"
  exit 1
fi

print_message "Backup extracted to: $BACKUP_DIR"

# Check for backup metadata
if [ ! -f "$BACKUP_DIR/backup_info.json" ]; then
  print_warning "Backup metadata not found. This might not be a complete backup."
else
  print_message "Backup metadata found. Proceeding with restoration."
  # Display backup info
  echo "Backup information:"
  cat "$BACKUP_DIR/backup_info.json" | grep -v "encryptionKeyFile"
fi

# Restore database if not app-only
if [ "$APP_ONLY" = false ]; then
  print_message "Preparing to restore database..."
  
  # Check for encrypted database backup
  if [ -f "$BACKUP_DIR/database_backup.sql.enc" ]; then
    print_message "Found encrypted database backup. Decrypting..."
    
    # Check for encryption key
    if [ ! -f "$BACKUP_DIR/db_encrypt_key.txt" ]; then
      print_error "Database encryption key not found. Cannot proceed with database restoration."
    else
      # Get encryption key
      ENCRYPT_PASS=$(cat "$BACKUP_DIR/db_encrypt_key.txt")
      
      # Decrypt the database backup
      openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_DIR/database_backup.sql.enc" -out "$BACKUP_DIR/database_backup.sql" -pass pass:"$ENCRYPT_PASS"
      
      if [ $? -ne 0 ]; then
        print_error "Failed to decrypt database backup"
      else
        print_message "Database backup decrypted successfully"
        
        # Parse the DATABASE_URL to extract connection details
        if [ -z "$DATABASE_URL" ]; then
          print_error "DATABASE_URL environment variable is not set"
          exit 1
        fi
        
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
        
        print_message "Restoring database $DB_NAME..."
        print_warning "This will overwrite all data in the database. Press Ctrl+C now to abort."
        sleep 5
        
        # Restore the database
        PGPASSWORD="$DB_PASS" psql $PG_CONN_OPTS -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        PGPASSWORD="$DB_PASS" psql $PG_CONN_OPTS -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_DIR/database_backup.sql"
        
        if [ $? -ne 0 ]; then
          print_error "Database restoration failed"
        else
          print_message "Database restored successfully"
        fi
        
        # Cleanup decrypted database file
        rm "$BACKUP_DIR/database_backup.sql"
      fi
    fi
  else
    print_warning "No encrypted database backup found in the archive"
  fi
fi

# Restore application files if not db-only
if [ "$DB_ONLY" = false ]; then
  print_message "Preparing to restore application files..."
  
  # Check for application backup directory
  if [ -d "$BACKUP_DIR/application" ]; then
    print_message "Found application backup. Restoring..."
    
    # Get a list of important directories to preserve
    PRESERVE_DIRS=(
      ".git"
      "node_modules"
      "backups"
      "logs"
    )
    
    # Create temporary directory for preserved directories
    PRESERVE_TMP="tmp/preserve_${BACKUP_TIMESTAMP}"
    mkdir -p "$PRESERVE_TMP"
    
    # Preserve important directories
    for dir in "${PRESERVE_DIRS[@]}"; do
      if [ -d "$dir" ]; then
        print_message "Preserving directory: $dir"
        cp -r "$dir" "$PRESERVE_TMP/"
      fi
    done
    
    # Confirm application restoration
    if [ "$FORCE" = false ]; then
      echo ""
      print_warning "This will overwrite application files. Continue? (y/n)"
      read -r CONFIRM
      if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        print_message "Application restoration cancelled by user"
        rm -rf "$TEMP_EXTRACT_DIR" "$PRESERVE_TMP"
        exit 0
      fi
    fi
    
    # Create list of files/dirs to not overwrite
    EXCLUDE_ARGS=""
    for dir in "${PRESERVE_DIRS[@]}"; do
      EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude='$dir'"
    done
    
    # Restore application files
    RESTORE_CMD="rsync -av --delete $EXCLUDE_ARGS $BACKUP_DIR/application/ ./"
    eval $RESTORE_CMD
    
    if [ $? -ne 0 ]; then
      print_error "Application restoration failed"
    else
      print_message "Application files restored successfully"
      
      # Restore preserved directories
      for dir in "${PRESERVE_DIRS[@]}"; do
        if [ -d "$PRESERVE_TMP/$dir" ]; then
          print_message "Restoring preserved directory: $dir"
          cp -r "$PRESERVE_TMP/$dir" ./
        fi
      done
    fi
  else
    print_warning "No application backup found in the archive"
  fi
fi

# Cleanup
print_message "Cleaning up temporary files..."
rm -rf "$TEMP_EXTRACT_DIR" "$PRESERVE_TMP"

print_message "Restoration completed at $(date)"

# Print restoration summary
echo ""
echo "========================================================"
echo -e "${GREEN}Restoration Summary${NC}"
echo "========================================================"
echo "Timestamp: $(date)"
echo "Restored from: $BACKUP_FILE"
if [ "$APP_ONLY" = false ]; then
  echo "Database: Restored"
fi
if [ "$DB_ONLY" = false ]; then
  echo "Application files: Restored"
fi
echo "========================================================"
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Restart the application to apply changes"
echo "2. Verify that the application is functioning correctly"
echo "3. Run any necessary database migrations or updates"
echo "========================================================"

exit 0