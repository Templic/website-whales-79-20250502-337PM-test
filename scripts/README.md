# Scripts Directory

This directory contains utility scripts for the Cosmic Community Connect platform.

## Backup and Restore Scripts

### `backup.sh`

A comprehensive backup script that handles:
- Database backups (schema-only for large databases)
- File backups (uploads and static content)
- Configuration backups
- Automatic encryption of backups
- Retention policy management

Usage:
```bash
# Full backup
./backup.sh all

# Database backup only
./backup.sh database

# Files backup only
./backup.sh files

# Configuration backup only
./backup.sh config
```

### `restore.sh`

Script for restoring backups:
- Safely restores database schema
- Restores file content
- Prepares configuration files for review
- Includes pre-restore safeguards

Usage:
```bash
# Restore latest database backup
./restore.sh database latest

# Restore specific date database backup
./restore.sh database 2025-04-01

# Restore latest files backup
./restore.sh files latest

# Prepare configuration restoration
./restore.sh config latest
```

### `check_db_connection.sh`

Diagnostic script for testing database connectivity:
- Verifies PostgreSQL client installation
- Tests connection to the database
- Displays database information (version, size)
- Lists tables in the database
- Special handling for Neon serverless PostgreSQL

Usage:
```bash
./check_db_connection.sh
```

## Execution Requirements

All scripts require executable permissions:

```bash
chmod +x backup.sh restore.sh check_db_connection.sh
```

## Documentation

For more detailed information, please refer to the backup and restore guide:

[../docs/backup_restore_guide.md](../docs/backup_restore_guide.md)