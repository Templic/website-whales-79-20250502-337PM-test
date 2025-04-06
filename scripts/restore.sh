#!/bin/bash
# Restore Script for Cosmic Community Connect
# This script performs restores from backups of the database, files, and configuration

# Exit on error
set -e

# Configuration
BACKUP_DIR="./tmp/backups"
LOG_DIR="./logs"
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H-%M-%S")
RESTORE_ID="${DATE}_${TIME}"
ENCRYPTION_KEY_FILE="./.backup_key"
DATABASE_URL=${DATABASE_URL:-"postgres://localhost:5432/cosmicdb"}

# Ensure directories exist
mkdir -p "$LOG_DIR"

# Log file
LOG_FILE="$LOG_DIR/restore_${RESTORE_ID}.log"

# Initialize log
echo "Starting restoration at $(date)" > "$LOG_FILE"
echo "Restore ID: $RESTORE_ID" >> "$LOG_FILE"

# Check if encryption key exists
if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
    echo "ERROR: Encryption key not found at $ENCRYPTION_KEY_FILE" >> "$LOG_FILE"
    echo "Cannot decrypt backups without the encryption key" >> "$LOG_FILE"
    exit 1
fi

# Function to decrypt a file
decrypt_file() {
    local input_file=$1
    local output_file="${input_file%.enc}"
    
    echo "Decrypting $input_file to $output_file" >> "$LOG_FILE"
    openssl enc -d -aes-256-cbc -in "$input_file" -out "$output_file" -pass file:"$ENCRYPTION_KEY_FILE"
    
    echo "Decryption complete" >> "$LOG_FILE"
    
    # Return the path to the decrypted file
    echo "$output_file"
}

# Function to find the latest backup file
find_latest_backup() {
    local backup_type=$1
    local backup_dir="$BACKUP_DIR/$backup_type"
    
    # Find the most recent backup file
    local latest_backup=$(find "$backup_dir" -name "*.enc" -type f -print0 | xargs -0 ls -t | head -n 1)
    
    if [ -z "$latest_backup" ]; then
        echo "ERROR: No backup found in $backup_dir" >> "$LOG_FILE"
        exit 1
    fi
    
    echo "Latest backup: $latest_backup" >> "$LOG_FILE"
    echo "$latest_backup"
}

# Function to find a specific backup by date
find_backup_by_date() {
    local backup_type=$1
    local backup_date=$2
    local backup_dir="$BACKUP_DIR/$backup_type"
    
    # Find backup files matching the date
    local backup_files=$(find "$backup_dir" -name "*${backup_date}*.enc" -type f)
    
    if [ -z "$backup_files" ]; then
        echo "ERROR: No backup found for date $backup_date in $backup_dir" >> "$LOG_FILE"
        exit 1
    fi
    
    # Get the most recent backup for that date
    local backup_file=$(echo "$backup_files" | xargs ls -t | head -n 1)
    
    echo "Backup for date $backup_date: $backup_file" >> "$LOG_FILE"
    echo "$backup_file"
}

# Function to restore database
restore_database() {
    local backup_specifier=$1
    local backup_file=""
    
    echo "Starting database restoration at $(date)" >> "$LOG_FILE"
    
    # Determine which backup to use
    if [ "$backup_specifier" == "latest" ]; then
        backup_file=$(find_latest_backup "database")
    else
        backup_file=$(find_backup_by_date "database" "$backup_specifier")
    fi
    
    # Decrypt the backup file
    local decrypted_file=$(decrypt_file "$backup_file")
    
    # Uncompress the backup
    echo "Uncompressing backup file" >> "$LOG_FILE"
    gunzip -f "$decrypted_file"
    local uncompressed_file="${decrypted_file%.gz}"
    
    # Determine if using Neon serverless or standard PostgreSQL
    if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
        echo "Detected Neon serverless PostgreSQL" >> "$LOG_FILE"
        
        # Extract database connection details from DATABASE_URL
        DB_USER=$(echo $DATABASE_URL | awk -F[:@] '{print $2}' | sed 's/\/\///')
        DB_PASS=$(echo $DATABASE_URL | awk -F[:@] '{print $3}')
        DB_HOST=$(echo $DATABASE_URL | awk -F[@:/] '{print $4}')
        DB_PORT=$(echo $DATABASE_URL | awk -F[@:/] '{print $5}')
        DB_NAME=$(echo $DATABASE_URL | awk -F[@:/] '{print $6}')
        
        # Set environment variables for psql
        export PGPASSWORD="$DB_PASS"
        
        echo "Restoring database to Neon PostgreSQL" >> "$LOG_FILE"
        
        # First create a backup of current database
        echo "Creating a backup of current database before restoration" >> "$LOG_FILE"
        CURRENT_BACKUP_FILE="$BACKUP_DIR/database/pre_restore_${RESTORE_ID}.sql"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$CURRENT_BACKUP_FILE" || {
            echo "WARNING: Failed to create backup of current database, but proceeding with restore" >> "$LOG_FILE"
        }
        
        # Restore database
        echo "Running database restoration" >> "$LOG_FILE"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$uncompressed_file"
        
        echo "Neon PostgreSQL database restoration completed at $(date)" >> "$LOG_FILE"
    else
        echo "Using standard PostgreSQL connection" >> "$LOG_FILE"
        
        # Extract database connection details from DATABASE_URL
        DB_USER=$(echo $DATABASE_URL | awk -F[:@] '{print $2}' | sed 's/\/\///')
        DB_PASS=$(echo $DATABASE_URL | awk -F[:@] '{print $3}')
        DB_HOST=$(echo $DATABASE_URL | awk -F[@:/] '{print $4}')
        DB_PORT=$(echo $DATABASE_URL | awk -F[@:/] '{print $5}')
        DB_NAME=$(echo $DATABASE_URL | awk -F[@:/] '{print $6}')
        
        # Set environment variables for psql
        export PGPASSWORD="$DB_PASS"
        
        echo "Restoring database to standard PostgreSQL" >> "$LOG_FILE"
        
        # First create a backup of current database
        echo "Creating a backup of current database before restoration" >> "$LOG_FILE"
        CURRENT_BACKUP_FILE="$BACKUP_DIR/database/pre_restore_${RESTORE_ID}.sql"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$CURRENT_BACKUP_FILE" || {
            echo "WARNING: Failed to create backup of current database, but proceeding with restore" >> "$LOG_FILE"
        }
        
        # Restore database
        echo "Running database restoration" >> "$LOG_FILE"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$uncompressed_file"
        
        echo "Standard PostgreSQL database restoration completed at $(date)" >> "$LOG_FILE"
    fi
    
    # Clean up
    echo "Cleaning up temporary files" >> "$LOG_FILE"
    rm -f "$uncompressed_file"
    
    echo "Database restoration completed successfully" >> "$LOG_FILE"
}

# Function to restore files
restore_files() {
    local backup_specifier=$1
    local backup_file=""
    
    echo "Starting file restoration at $(date)" >> "$LOG_FILE"
    
    # Determine which backup to use
    if [ "$backup_specifier" == "latest" ]; then
        backup_file=$(find_latest_backup "files")
    else
        backup_file=$(find_backup_by_date "files" "$backup_specifier")
    fi
    
    # Decrypt the backup file
    local decrypted_file=$(decrypt_file "$backup_file")
    
    # Uncompress the backup
    echo "Uncompressing backup file" >> "$LOG_FILE"
    gunzip -f "$decrypted_file"
    local uncompressed_file="${decrypted_file%.gz}"
    
    # Create backup of current files
    echo "Creating backup of current files before restoration" >> "$LOG_FILE"
    if [ -d "./uploads" ] || [ -d "./static" ]; then
        tar -czf "$BACKUP_DIR/files/pre_restore_${RESTORE_ID}.tar.gz" ./uploads ./static 2>/dev/null || {
            echo "WARNING: Failed to create backup of current files, but proceeding with restore" >> "$LOG_FILE"
        }
    fi
    
    # Extract files to the root directory
    echo "Extracting files from backup" >> "$LOG_FILE"
    tar -xf "$uncompressed_file" -C ./ 
    
    # Clean up
    echo "Cleaning up temporary files" >> "$LOG_FILE"
    rm -f "$uncompressed_file"
    
    echo "File restoration completed successfully" >> "$LOG_FILE"
}

# Function to restore configuration
restore_config() {
    local backup_specifier=$1
    local backup_file=""
    
    echo "Starting configuration restoration at $(date)" >> "$LOG_FILE"
    
    # Determine which backup to use
    if [ "$backup_specifier" == "latest" ]; then
        backup_file=$(find_latest_backup "config")
    else
        backup_file=$(find_backup_by_date "config" "$backup_specifier")
    fi
    
    # Decrypt the backup file
    local decrypted_file=$(decrypt_file "$backup_file")
    
    # Uncompress the backup
    echo "Uncompressing backup file" >> "$LOG_FILE"
    gunzip -f "$decrypted_file"
    local uncompressed_file="${decrypted_file%.gz}"
    
    # Create temporary directory for extraction
    local temp_dir="./tmp/config_restore_${RESTORE_ID}"
    mkdir -p "$temp_dir"
    
    # Extract to temporary directory first
    echo "Extracting configuration files to temporary directory" >> "$LOG_FILE"
    tar -xf "$uncompressed_file" -C "$temp_dir"
    
    # Prompt for confirmation before overwriting configuration
    echo "Configuration files are ready for restoration" >> "$LOG_FILE"
    echo "You should manually review the configuration files in $temp_dir before copying them" >> "$LOG_FILE"
    echo "To complete the restoration, manually copy the files from $temp_dir to their destinations" >> "$LOG_FILE"
    
    # Clean up
    echo "Cleaning up temporary files" >> "$LOG_FILE"
    rm -f "$uncompressed_file"
    
    echo "Configuration restoration preparation completed successfully" >> "$LOG_FILE"
    echo "Final step (manual copy) is pending your review" >> "$LOG_FILE"
}

# Main restore logic
main() {
    local restore_type=$1
    local backup_specifier=${2:-"latest"}
    
    # Validate backup specifier
    if [ "$backup_specifier" != "latest" ] && ! [[ "$backup_specifier" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        echo "ERROR: Invalid backup specifier. Use 'latest' or a date in format YYYY-MM-DD" >> "$LOG_FILE"
        exit 1
    fi
    
    case $restore_type in
        "database")
            restore_database "$backup_specifier"
            ;;
        "files")
            restore_files "$backup_specifier"
            ;;
        "config")
            restore_config "$backup_specifier"
            ;;
        *)
            echo "Usage: $0 {database|files|config} [latest|YYYY-MM-DD]" >> "$LOG_FILE"
            echo "Unknown restore type: $restore_type" >> "$LOG_FILE"
            exit 1
            ;;
    esac
    
    echo "Restoration process completed at $(date)" >> "$LOG_FILE"
    echo "=====================================" >> "$LOG_FILE"
}

# Execute main function with the provided arguments
main "$1" "$2"

exit 0