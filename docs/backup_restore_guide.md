# Backup and Restore Guide for Cosmic Community Connect

This document explains how to use the backup and restore scripts to manage data for the Cosmic Community Connect platform.

## Overview

The backup system provides a comprehensive solution for backing up and restoring three types of data:

1. **Database** - PostgreSQL database backup (schema or full data)
2. **Files** - User uploads and static content
3. **Configuration** - Environment variables and system configuration files

All backups are compressed with gzip and encrypted with AES-256-CBC encryption for security.

## Requirements

- PostgreSQL client tools (`pg_dump` and `psql`)
- OpenSSL for encryption/decryption
- A valid `.backup_key` file for encryption/decryption (auto-generated on first run)
- Appropriate permissions to read/write to the backup directories
- Valid DATABASE_URL environment variable (for database operations)

## Backup Process

### Directory Structure

Backups are organized in the following directory structure:

```
./tmp/backups/
├── database/   # Database SQL dumps
├── files/      # File archives from static and uploads directories
└── config/     # Configuration file archives
```

### Running Backups

The backup script can be run in various modes:

```bash
# Full backup of all components
./scripts/backup.sh all

# Database backup only
./scripts/backup.sh database

# Files backup only
./scripts/backup.sh files

# Configuration backup only
./scripts/backup.sh config
```

### Backup Schedule

The recommended backup schedule is:

- **Daily**: Database backups
- **Weekly**: File backups
- **Monthly**: Configuration backups

### Database Backup Special Cases

For Neon serverless PostgreSQL connections, database backups use a specialized approach:

1. Connection testing is performed before backup attempts
2. Schema-only backups are taken to avoid timeout issues
3. If a full backup is needed, consider scheduling during low-traffic periods

## Restoration Process

### Running Restores

The restore script can be run in various modes:

```bash
# Restore latest database backup
./scripts/restore.sh database latest

# Restore latest file backup
./scripts/restore.sh files latest

# Restore latest configuration backup
./scripts/restore.sh config latest

# Restore from a specific date (format: YYYY-MM-DD)
./scripts/restore.sh database 2025-04-01
```

### Database Restoration Notes

- Database restoration will attempt to drop and recreate the public schema
- A pre-restore backup is automatically created before any restoration
- If the schema reset fails, the script will attempt to restore without resetting
- For schema-only backups, only the database structure will be restored (no data)

### Configuration Restoration Notes

Configuration files are extracted to a temporary directory and must be manually reviewed and copied to their final destinations to prevent accidental overrides.

## Retention Policy

Backups are automatically managed with a retention policy:

- By default, backups older than 30 days are automatically removed
- This value can be adjusted by changing the `RETENTION_DAYS` variable in the backup script

## Security

- All backups are encrypted using AES-256-CBC encryption with PBKDF2 key derivation
- The PBKDF2 method provides enhanced security against brute force attacks
- The encryption key is stored in the `.backup_key` file in the project root
- For production deployments, store the backup key in a secure location
- Consider using cloud key management services for better security in production
- Backup file encryption is mandatory and cannot be disabled

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure the scripts have execute permissions:
   ```bash
   chmod +x ./scripts/backup.sh ./scripts/restore.sh
   ```

2. **Database Connection Errors**:
   - Verify the DATABASE_URL environment variable is correctly set
   - Check network connectivity to the database server
   - Test the connection manually with `psql "$DATABASE_URL" -c "SELECT 1;"`

3. **Timeout Errors**:
   - For large databases, consider using schema-only backups
   - For frequent timeouts, adjust the timeout values in the script
   - Split database operations into smaller chunks

4. **Encryption Key Missing**:
   - If `.backup_key` is missing, a new one will be generated on the first backup
   - Ensure this key is preserved for restoring previous backups

### Checking Log Files

All backup and restore operations are logged in the `./logs` directory. Check these logs for detailed information about each operation.

## Best Practices

1. **Regular Testing**: Regularly test the restore process to ensure backups are valid
2. **Secure Key Storage**: Store the encryption key securely, separate from the backups
3. **Off-site Backups**: Copy encrypted backups to an off-site location regularly
4. **Monitoring**: Monitor backup logs for any errors or warnings
5. **Documentation**: Keep this documentation updated with any changes to the backup process

## Script Enhancements

The backup and restore scripts include several enhancements for reliability:

1. **Connection Testing**: Database connections are tested before operations
2. **Timeout Management**: Operations have timeouts to prevent hanging
3. **Placeholder Backups**: If a backup operation fails, a placeholder file is created
4. **Pre-restore Backups**: Current state is backed up before restoration
5. **Schema-Only Option**: Database schema can be backed up without data

## Recent Changes

- Upgraded encryption implementation to use PBKDF2 key derivation (addressing OpenSSL deprecation warnings)
- Added improved error handling for database operations
- Enhanced timeouts and connection verification
- Added support for schema-only backups for large databases
- Implemented fallback mechanisms for various failure scenarios
- Updated logging for better visibility into the backup process
- Added detailed security documentation