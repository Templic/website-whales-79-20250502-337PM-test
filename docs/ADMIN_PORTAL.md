# Admin Portal: Comprehensive Data Management Utilities

This document provides an overview of the Admin Portal's utilities for comprehensive data management, including audit logs, repair capabilities, import/export tools, batch operations, schema migrations, and auto fixes.

## Overview

The Admin Portal provides a suite of utilities to help administrators manage application data effectively:

1. **Data Audit Logs**: Track all changes to data with detailed audit trails
2. **Data Repair Tasks**: Identify and fix data issues with a structured approach
3. **Import/Export Jobs**: Manage bulk data import and export operations
4. **Batch Operations**: Run batch updates and deletes with transaction support
5. **Schema Migrations**: Manage database schema changes with versioning
6. **Data Auto Fixes**: Automate common data repair patterns

## Architecture

The Admin Utilities are built on a layered architecture:

1. **Database Layer**: PostgreSQL tables with appropriate schemas and indexes
2. **Storage Layer**: `DatabaseStorage` class implementing the admin operations
3. **API Layer**: RESTful endpoints in `admin-routes.ts` for accessing the utilities
4. **Security Layer**: All endpoints protected with authentication and admin role checks
5. **UI Layer**: React components for interacting with the utilities (coming soon)

## Admin Utilities API

All APIs are available under the `/api/admin/utilities` prefix and require authentication with admin role.

### Data Audit Logs

Track all changes made to data with detailed information:

- `GET /api/admin/utilities/audit-logs`: Get all audit logs (with optional filters)
- `GET /api/admin/utilities/audit-logs/:id`: Get a specific audit log by ID
- `POST /api/admin/utilities/audit-logs`: Create a new audit log entry

Audit logs automatically capture:
- User who made the change
- Action performed (create, update, delete, etc.)
- Table affected
- Record ID
- Old and new values
- IP address and user agent
- Timestamp

### Data Repair Tasks

Manage data repair operations with tracking:

- `GET /api/admin/utilities/repair-tasks`: Get all repair tasks (with optional filters)
- `GET /api/admin/utilities/repair-tasks/:id`: Get a specific repair task by ID
- `POST /api/admin/utilities/repair-tasks`: Create a new repair task
- `PUT /api/admin/utilities/repair-tasks/:id`: Update a repair task
- `POST /api/admin/utilities/repair-tasks/:id/assign`: Assign a repair task to a user
- `POST /api/admin/utilities/repair-tasks/:id/status`: Change the status of a repair task

### Import/Export Jobs

Manage data import and export operations:

- `GET /api/admin/utilities/import-export-jobs`: Get all import/export jobs (with optional filters)
- `GET /api/admin/utilities/import-export-jobs/:id`: Get a specific import/export job by ID
- `POST /api/admin/utilities/import-export-jobs`: Create a new import/export job
- `PUT /api/admin/utilities/import-export-jobs/:id/status`: Update the status of an import/export job

### Batch Operations

Run operations on multiple records at once:

- `GET /api/admin/utilities/batch-operations`: Get all batch operations (with optional filters)
- `GET /api/admin/utilities/batch-operations/:id`: Get a specific batch operation by ID
- `POST /api/admin/utilities/batch-operations`: Create a new batch operation
- `PUT /api/admin/utilities/batch-operations/:id/status`: Update the status of a batch operation

### Schema Migrations

Manage database schema changes:

- `GET /api/admin/utilities/schema-migrations`: Get all schema migrations (with optional filters)
- `GET /api/admin/utilities/schema-migrations/:id`: Get a specific schema migration by ID
- `POST /api/admin/utilities/schema-migrations`: Create a new schema migration
- `PUT /api/admin/utilities/schema-migrations/:id`: Update a schema migration
- `POST /api/admin/utilities/schema-migrations/:id/apply`: Apply a schema migration

### Data Auto Fixes

Automate common data repair patterns:

- `GET /api/admin/utilities/auto-fixes`: Get all auto fixes (with optional filters)
- `GET /api/admin/utilities/auto-fixes/:id`: Get a specific auto fix by ID
- `POST /api/admin/utilities/auto-fixes`: Create a new auto fix
- `PUT /api/admin/utilities/auto-fixes/:id`: Update an auto fix
- `PUT /api/admin/utilities/auto-fixes/:id/toggle`: Enable or disable an auto fix
- `POST /api/admin/utilities/auto-fixes/:id/run-result`: Record the result of an auto fix run

## Database Schema

The database schema for admin utilities includes the following tables:

1. **data_audit_logs**: Stores detailed audit logs of all data changes
2. **data_repair_tasks**: Manages tasks for repairing data issues
3. **data_import_export_jobs**: Tracks import and export operations
4. **batch_operations**: Manages operations performed on multiple records
5. **schema_migrations**: Stores database schema migration scripts
6. **data_auto_fixes**: Defines automated data repair rules

## Security Considerations

The Admin Utilities implement several security measures:

1. **Authentication**: All endpoints require authentication
2. **Authorization**: All endpoints require admin role
3. **Audit Logging**: All actions are logged for accountability
4. **Input Validation**: All inputs are validated to prevent injection attacks
5. **Transaction Support**: Batch operations use transactions for data integrity
6. **Error Handling**: Proper error handling to prevent information leakage

## Future Enhancements

Planned improvements for the Admin Utilities:

1. **UI Components**: React components for interacting with the utilities
2. **Advanced Search**: More powerful search and filtering capabilities
3. **Scheduled Operations**: Run batch operations on a schedule
4. **Export Templates**: Customize export formats with templates
5. **Data Quality Rules**: Define rules for automated data quality checks
6. **Custom Reports**: Generate custom reports based on audit logs
7. **Multi-tenancy Support**: Support for multi-tenant data management
8. **Workflow Automation**: Define workflows for data management tasks
9. **Role-based Access Control**: More granular control over admin capabilities
10. **Integration with External Systems**: Import/export data from/to external systems

## API Examples

### Create an Audit Log

```http
POST /api/admin/utilities/audit-logs
Content-Type: application/json

{
  "action": "update",
  "tableAffected": "users",
  "recordId": "123",
  "oldValues": {
    "username": "old_username",
    "email": "old_email@example.com"
  },
  "newValues": {
    "username": "new_username",
    "email": "new_email@example.com"
  },
  "details": "Updated user profile information"
}
```

### Create a Repair Task

```http
POST /api/admin/utilities/repair-tasks
Content-Type: application/json

{
  "tableAffected": "products",
  "issueType": "missing_data",
  "issueDescription": "Products missing category information",
  "recordIds": ["100", "101", "102"],
  "priority": 2,
  "solution": "Assign default category 'Uncategorized' to products with null category"
}
```

### Create an Import Job

```http
POST /api/admin/utilities/import-export-jobs
Content-Type: application/json

{
  "jobType": "import",
  "tableAffected": "subscribers",
  "format": "csv",
  "filePath": "/uploads/subscribers.csv",
  "config": {
    "delimiter": ",",
    "hasHeader": true,
    "columns": ["email", "firstName", "lastName", "subscribed"]
  }
}
```

### Create a Batch Operation

```http
POST /api/admin/utilities/batch-operations
Content-Type: application/json

{
  "operationType": "update",
  "tableAffected": "products",
  "recordIds": ["200", "201", "202", "203"],
  "changes": {
    "isDiscounted": true,
    "discountPercentage": 10
  },
  "isRollbackable": true
}
```