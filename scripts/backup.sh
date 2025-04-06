#!/bin/bash
# Backup Script for Cosmic Community Connect
# This script performs backups of the database, files, and configuration

# Exit on error
set -e

# Configuration
BACKUP_DIR="./tmp/backups"
LOG_DIR="./logs"
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H-%M-%S")
BACKUP_ID="${DATE}_${TIME}"
ENCRYPTION_KEY_FILE="./.backup_key"
RETENTION_DAYS=30
DATABASE_URL=${DATABASE_URL:-"postgres://localhost:5432/cosmicdb"}

# Ensure directories exist
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/files"
mkdir -p "$BACKUP_DIR/config"
mkdir -p "$LOG_DIR"

# Log file
LOG_FILE="$LOG_DIR/backup_${BACKUP_ID}.log"

# Initialize log
echo "Starting backup at $(date)" > "$LOG_FILE"
echo "Backup ID: $BACKUP_ID" >> "$LOG_FILE"

# Encryption key handling
if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
    echo "Generating new encryption key" >> "$LOG_FILE"
    openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
    chmod 600 "$ENCRYPTION_KEY_FILE"
fi

# Function to encrypt a file
encrypt_file() {
    local input_file=$1
    local output_file="${input_file}.enc"
    
    echo "Encrypting $input_file to $output_file" >> "$LOG_FILE"
    openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -pass file:"$ENCRYPTION_KEY_FILE"
    
    # Remove the unencrypted file
    rm "$input_file"
    
    echo "Encryption complete" >> "$LOG_FILE"
}

# Function to backup the database
backup_database() {
    echo "Starting database backup at $(date)" >> "$LOG_FILE"
    
    # Determine if using Neon serverless or standard PostgreSQL
    if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
        echo "Detected Neon serverless PostgreSQL" >> "$LOG_FILE"
        
        # Extract database connection details from DATABASE_URL
        DB_USER=$(echo $DATABASE_URL | awk -F[:@] '{print $2}' | sed 's/\/\///')
        DB_PASS=$(echo $DATABASE_URL | awk -F[:@] '{print $3}')
        DB_HOST=$(echo $DATABASE_URL | awk -F[@:/] '{print $4}')
        DB_PORT=$(echo $DATABASE_URL | awk -F[@:/] '{print $5}')
        DB_NAME=$(echo $DATABASE_URL | awk -F[@:/] '{print $6}')
        
        # Set environment variables for pg_dump
        export PGPASSWORD="$DB_PASS"
        
        # Backup filename
        BACKUP_FILE="$BACKUP_DIR/database/db_${BACKUP_ID}.sql"
        
        echo "Creating database dump from Neon PostgreSQL" >> "$LOG_FILE"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
        
        # Compress the backup
        echo "Compressing database dump" >> "$LOG_FILE"
        gzip -9 "$BACKUP_FILE"
        
        # Encrypt the backup
        encrypt_file "${BACKUP_FILE}.gz"
        
        echo "Neon PostgreSQL database backup completed at $(date)" >> "$LOG_FILE"
    else
        echo "Using standard PostgreSQL connection" >> "$LOG_FILE"
        
        # Extract database connection details from DATABASE_URL
        DB_USER=$(echo $DATABASE_URL | awk -F[:@] '{print $2}' | sed 's/\/\///')
        DB_PASS=$(echo $DATABASE_URL | awk -F[:@] '{print $3}')
        DB_HOST=$(echo $DATABASE_URL | awk -F[@:/] '{print $4}')
        DB_PORT=$(echo $DATABASE_URL | awk -F[@:/] '{print $5}')
        DB_NAME=$(echo $DATABASE_URL | awk -F[@:/] '{print $6}')
        
        # Set environment variables for pg_dump
        export PGPASSWORD="$DB_PASS"
        
        # Backup filename
        BACKUP_FILE="$BACKUP_DIR/database/db_${BACKUP_ID}.sql"
        
        echo "Creating database dump" >> "$LOG_FILE"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
        
        # Compress the backup
        echo "Compressing database dump" >> "$LOG_FILE"
        gzip -9 "$BACKUP_FILE"
        
        # Encrypt the backup
        encrypt_file "${BACKUP_FILE}.gz"
        
        echo "Standard PostgreSQL database backup completed at $(date)" >> "$LOG_FILE"
    fi
    
    # Verify the backup file exists
    if [ -f "${BACKUP_FILE}.gz.enc" ]; then
        echo "Database backup successful" >> "$LOG_FILE"
        echo "Backup saved to ${BACKUP_FILE}.gz.enc" >> "$LOG_FILE"
    else
        echo "ERROR: Database backup failed" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to backup files
backup_files() {
    echo "Starting file backup at $(date)" >> "$LOG_FILE"
    
    # Directories to backup
    UPLOADS_DIR="./uploads"
    STATIC_DIR="./static"
    
    # Backup filename
    BACKUP_FILE="$BACKUP_DIR/files/files_${BACKUP_ID}.tar"
    
    # Check if directories exist
    if [ ! -d "$UPLOADS_DIR" ] && [ ! -d "$STATIC_DIR" ]; then
        echo "No directories to backup" >> "$LOG_FILE"
        return 0
    fi
    
    # Create tar archive
    echo "Creating file archive" >> "$LOG_FILE"
    
    tar_command="tar -cf $BACKUP_FILE"
    
    if [ -d "$UPLOADS_DIR" ]; then
        tar_command="$tar_command $UPLOADS_DIR"
    fi
    
    if [ -d "$STATIC_DIR" ]; then
        tar_command="$tar_command $STATIC_DIR"
    fi
    
    # Execute the tar command
    eval $tar_command
    
    # Compress the backup
    echo "Compressing file archive" >> "$LOG_FILE"
    gzip -9 "$BACKUP_FILE"
    
    # Encrypt the backup
    encrypt_file "${BACKUP_FILE}.gz"
    
    # Verify the backup file exists
    if [ -f "${BACKUP_FILE}.gz.enc" ]; then
        echo "File backup successful" >> "$LOG_FILE"
        echo "Backup saved to ${BACKUP_FILE}.gz.enc" >> "$LOG_FILE"
    else
        echo "ERROR: File backup failed" >> "$LOG_FILE"
        exit 1
    fi
    
    echo "File backup completed at $(date)" >> "$LOG_FILE"
}

# Function to backup configuration
backup_config() {
    echo "Starting configuration backup at $(date)" >> "$LOG_FILE"
    
    # Directories and files to backup
    CONFIG_FILES=".env .replit package.json drizzle.config.ts tsconfig.json"
    CONFIG_DIRS="config"
    
    # Backup filename
    BACKUP_FILE="$BACKUP_DIR/config/config_${BACKUP_ID}.tar"
    
    # Create tar archive
    echo "Creating configuration archive" >> "$LOG_FILE"
    
    tar_command="tar -cf $BACKUP_FILE"
    
    # Add files if they exist
    for file in $CONFIG_FILES; do
        if [ -f "$file" ]; then
            tar_command="$tar_command $file"
        fi
    done
    
    # Add directories if they exist
    for dir in $CONFIG_DIRS; do
        if [ -d "$dir" ]; then
            tar_command="$tar_command $dir"
        fi
    done
    
    # Execute the tar command
    eval $tar_command
    
    # Compress the backup
    echo "Compressing configuration archive" >> "$LOG_FILE"
    gzip -9 "$BACKUP_FILE"
    
    # Encrypt the backup
    encrypt_file "${BACKUP_FILE}.gz"
    
    # Verify the backup file exists
    if [ -f "${BACKUP_FILE}.gz.enc" ]; then
        echo "Configuration backup successful" >> "$LOG_FILE"
        echo "Backup saved to ${BACKUP_FILE}.gz.enc" >> "$LOG_FILE"
    else
        echo "ERROR: Configuration backup failed" >> "$LOG_FILE"
        exit 1
    fi
    
    echo "Configuration backup completed at $(date)" >> "$LOG_FILE"
}

# Function to cleanup old backups
cleanup_old_backups() {
    echo "Cleaning up old backups" >> "$LOG_FILE"
    
    # Find and remove database backups older than RETENTION_DAYS
    find "$BACKUP_DIR/database" -name "*.enc" -type f -mtime +$RETENTION_DAYS -delete
    
    # Find and remove file backups older than RETENTION_DAYS
    find "$BACKUP_DIR/files" -name "*.enc" -type f -mtime +$RETENTION_DAYS -delete
    
    # Find and remove configuration backups older than RETENTION_DAYS
    find "$BACKUP_DIR/config" -name "*.enc" -type f -mtime +$RETENTION_DAYS -delete
    
    echo "Cleanup completed" >> "$LOG_FILE"
}

# Main backup logic
main() {
    local backup_type=$1
    
    case $backup_type in
        "database")
            backup_database
            ;;
        "files")
            backup_files
            ;;
        "config")
            backup_config
            ;;
        "all")
            backup_database
            backup_files
            backup_config
            ;;
        *)
            echo "Usage: $0 {database|files|config|all}" >> "$LOG_FILE"
            echo "Unknown backup type: $backup_type" >> "$LOG_FILE"
            exit 1
            ;;
    esac
    
    # Always cleanup old backups
    cleanup_old_backups
    
    echo "Backup completed successfully at $(date)" >> "$LOG_FILE"
    echo "=====================================" >> "$LOG_FILE"
}

# Execute main function with the first argument
main "${1:-all}"

exit 0