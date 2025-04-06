# Backup and Restore Guide for the Application

This document provides instructions on how to use the backup and restore scripts for the application.

## Overview

The backup solution includes:

1. **Comprehensive Backup**: Can backup both application files and database.
2. **Configurable Options**: Various options for customization.
3. **Security Features**: Database encryption, checksums, and secure restoration.
4. **Neon Serverless Database Support**: Special handling for Neon PostgreSQL databases.

## Backup Script

The backup script (`scripts/backup.sh`) allows you to create backups of your application and database.

### Usage:

```bash
./scripts/backup.sh [options]
```

### Options:

- `-a`: Backup application files only (no database)
- `-d`: Backup database only (no application files)
- `-e`: Encrypt database backup (default for full backups)
- `-c <level>`: Compression level (low, medium, high)
- `-o <dir>`: Output directory for backups
- `-h`: Display help information

### Examples:

```bash
# Full backup (application and database)
./scripts/backup.sh

# Application-only backup
./scripts/backup.sh -a

# Database-only backup
./scripts/backup.sh -d

# High compression, application-only backup
./scripts/backup.sh -a -c high
```

## Restore Script

The restore script (`scripts/restore.sh`) allows you to restore from a previously created backup.

### Usage:

```bash
./scripts/restore.sh [options]
```

### Options:

- `-b <file>`: Backup file to restore from (required)
- `-a`: Restore application files only (no database)
- `-d`: Restore database only (no application files)
- `-f`: Force restore (skip confirmation prompts)
- `-h`: Display help information

### Examples:

```bash
# Restore from a specific backup file
./scripts/restore.sh -b backups/backup-20250406-193254.tar.gz

# Restore only the application files
./scripts/restore.sh -b backups/backup-20250406-193254.tar.gz -a

# Restore only the database
./scripts/restore.sh -b backups/backup-20250406-193254.tar.gz -d

# Force restore without prompts
./scripts/restore.sh -b backups/backup-20250406-193254.tar.gz -f
```

## Configuration

The backup and restore scripts use a configuration file located at `config/backup_config.json`. This configuration includes settings for:

- Backup frequency
- Maximum number of backups to retain
- Compression level
- Database encryption
- Files/directories to exclude
- Retention policy

## Database Support

The scripts are specially configured to work with Neon serverless PostgreSQL databases. When using Neon:

1. The scripts automatically detect the Neon hostname pattern (*.neon.tech)
2. SSL connections are enforced (PGSSLMODE=require)
3. PostgreSQL connection options are adjusted for Neon's requirements

## Best Practices

1. **Regular Backups**: Schedule regular backups using cron or another scheduler.
2. **Multiple Backup Locations**: Store backups in multiple locations for redundancy.
3. **Test Restores**: Periodically test the restore process to ensure backups are valid.
4. **Secure Storage**: Keep backup archives and especially database encryption keys secure.
5. **Monitoring**: Monitor the backup process for failures and address issues promptly.

## Troubleshooting

### Common Issues:

1. **Permission Denied**: Ensure the scripts are executable with `chmod +x scripts/backup.sh scripts/restore.sh`.
2. **Database Connection Errors**: Verify that DATABASE_URL is correctly set in your environment.
3. **Backup Fails with PostgreSQL Error**: Check database credentials and connectivity.
4. **Restore Fails**: Verify that the backup archive is not corrupted and the checksum is valid.

## Notes for Replit Environment

When running in Replit:

1. Make sure the database connection string (DATABASE_URL) is properly set in Secrets.
2. Database backups might time out if the database is large or connection is slow.
3. Consider using application-only backups (`-a` option) for routine use.
4. For database migrations or significant changes, ensure a full backup is created first.