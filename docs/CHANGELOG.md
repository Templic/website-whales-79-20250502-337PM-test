# Changelog

## 2025-04-07
- Improved Backup and Restore System
  - Enhanced encryption security by implementing PBKDF2 key derivation
  - Addressed OpenSSL deprecation warnings
  - Optimized database backup process for Neon serverless PostgreSQL
  - Added schema-only backup option to avoid timeout issues
  - Implemented smart connection detection for different PostgreSQL providers
  - Created comprehensive documentation in `docs/backup_restore_guide.md`
  - Added diagnostic tools for database connectivity checking
  - Improved error handling and logging
  - Created structured directory organization for backups
  - Set retention policy (30 days by default)
  
## 2025-04-06
- Initial implementation of the Backup and Restore System
  - Basic database backup functionality
  - File backup capability
  - Configuration backup capability
  - Simple encryption with AES-256-CBC