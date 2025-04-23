# SQL Injection Prevention Guide

This document provides comprehensive guidance on preventing SQL injection vulnerabilities in your application using the security tools we've developed.

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Detailed Usage Guide](#detailed-usage-guide)
4. [Tool Reference](#tool-reference)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Security Monitoring](#security-monitoring)

## Introduction

SQL injection is a critical security vulnerability that occurs when untrusted data is used to construct SQL queries. Our SQL injection prevention system provides multiple layers of protection:

1. **Safe Database Wrapper**: Provides secure methods for database operations
2. **SQL Monitor**: Runtime monitoring and enforcement of secure database practices
3. **Automatic Detection and Fixing**: Tools to detect and remediate existing vulnerabilities
4. **Security Logging**: Immutable blockchain-based security event logging

## Quick Start

### 1. Secure Your Database Connection

```typescript
import { secureDatabase } from './security/preventSqlInjection';
import { pool } from './database'; // Your database connection

// Create a secure database wrapper
const db = secureDatabase(pool);

// Now use the secure methods for all database operations
const users = await db.select('users', ['id', 'username'], { active: true });
```

### 2. Run the SQL Injection Detector

```bash
# Run in detection mode only
./server/tools/runSQLSecurityScan.sh

# Run with automatic fixing
./server/tools/runSQLSecurityScan.sh --fix
```

## Detailed Usage Guide

### Using the Safe Database API

The `SafeDatabase` wrapper provides secure methods for all common database operations:

```typescript
import { secureDatabase } from './security/preventSqlInjection';
import { pool } from './database';

const db = secureDatabase(pool);

// SELECT with conditions, ordering, and pagination
const users = await db.select(
  'users',                           // table name
  ['id', 'username', 'email'],       // columns to select
  { role: 'admin', active: true },   // WHERE conditions
  'created_at DESC',                 // ORDER BY
  10,                                // LIMIT
  20                                 // OFFSET
);

// INSERT with returning
const newUser = await db.insert('users', {
  username: 'johndoe',
  email: 'john@example.com',
  password_hash: hashedPassword
});

// UPDATE with conditions
const updatedUsers = await db.update(
  'users',                  // table name
  { active: false },        // SET values
  { last_login: null }      // WHERE conditions
);

// DELETE with conditions
const deletedUsers = await db.delete(
  'users',                 // table name
  { deactivated_at: { '<': new Date() } }  // WHERE conditions
);

// Transaction support
const result = await db.transaction(async (txDb) => {
  const user = await txDb.insert('users', { username: 'alice' });
  await txDb.insert('user_profiles', { 
    user_id: user.id, 
    display_name: 'Alice' 
  });
  return user;
});

// Count query
const userCount = await db.count('users', { active: true });
```

### Migrating Existing Code

If you have existing database code that uses raw queries, migrate it as follows:

#### Before:

```typescript
// Unsafe: Using template literals in SQL queries
const userId = req.params.id;
const query = `SELECT * FROM users WHERE id = ${userId}`;
const user = await db.query(query);

// Unsafe: String concatenation
const status = req.query.status;
const query2 = "SELECT * FROM orders WHERE status = '" + status + "'";
const orders = await db.query(query2);
```

#### After:

```typescript
// Safe: Using parameterized queries
const userId = req.params.id;
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Safe: Using helper methods
const status = req.query.status;
const orders = await db.select('orders', ['*'], { status });
```

### Automatic Detection and Fixing

To scan your codebase for SQL injection vulnerabilities and fix them automatically:

```bash
# Run the detector to find issues
npx tsx server/tools/sqlInjectionDetector.ts

# Run the fixer in dry-run mode
npx tsx server/tools/sqlInjectionFixer.ts --dry-run

# Apply fixes automatically
npx tsx server/tools/sqlInjectionFixer.ts

# Or use the combined tool
./server/tools/runSQLSecurityScan.sh --fix
```

## Tool Reference

### SafeDatabase

The `SafeDatabase` class provides a secure wrapper around your database connection:

| Method | Description |
|--------|-------------|
| `query(sql, params)` | Execute a parameterized query |
| `select(table, columns, where, orderBy, limit, offset)` | Safely select records |
| `insert(table, data)` | Safely insert a record |
| `update(table, data, where)` | Safely update records |
| `delete(table, where)` | Safely delete records |
| `count(table, where)` | Count records |
| `transaction(callback)` | Execute operations in a transaction |
| `getSQLMonitor()` | Get the SQL monitor instance |
| `getConnection()` | Get the raw database connection (use with caution) |

### SQLMonitor

The `SQLMonitor` class provides runtime monitoring of database queries:

| Method | Description |
|--------|-------------|
| `checkQuery(sql, params, source)` | Check if a query is safe |
| `getQueryLog()` | Get the query history log |
| `clearQueryLog()` | Clear the query history log |
| `wrapConnection(db)` | Wrap a database connection with monitoring |

### SQLInjectionPrevention

The `SQLInjectionPrevention` class is the main entry point for all prevention mechanisms:

| Method | Description |
|--------|-------------|
| `secureDatabase(db, name)` | Secure a database connection |
| `getDatabase(name)` | Get a secured database connection |
| `secureAllDatabases(dbModule)` | Register and secure all database connections from a module |
| `generateSecurityReport()` | Generate a security report |
| `runSecurityScan()` | Run a security scan of the database system |

## Best Practices

1. **Always use parameterized queries**: Never build SQL queries using string concatenation or template literals.

2. **Always validate and sanitize user input**: Even with parameterized queries, validate input data before using it in database operations.

3. **Use the helper methods**: Instead of writing raw SQL, use the helper methods provided by SafeDatabase (`select`, `insert`, etc.).

4. **Apply least privilege**: Database users should have the minimum permissions needed.

5. **Enable strict mode**: Keep strict mode enabled to enforce all security rules.

6. **Run regular security scans**: Use the scanning tools regularly to detect new vulnerabilities.

7. **Monitor query logs**: Check the query logs for suspicious patterns.

8. **Use transactions for multi-step operations**: When multiple operations need to be atomic, use transactions.

9. **Update the security tools**: Keep the security tools updated with the latest versions.

10. **Educate developers**: Ensure all developers understand SQL injection risks and prevention strategies.

## Troubleshooting

### Common Issues

1. **Query rejected by SQL monitor**

   If a query is rejected by the SQL monitor, it likely contains a pattern that resembles a SQL injection attack. Review the query and use parameterized methods.

   ```typescript
   // Instead of:
   const query = `SELECT * FROM users WHERE username LIKE '%${search}%'`;
   
   // Use:
   const users = await db.query(
     'SELECT * FROM users WHERE username LIKE $1',
     [`%${search}%`]
   );
   ```

2. **Error: UPDATE/DELETE requires WHERE conditions**

   For safety, UPDATE and DELETE operations require WHERE conditions. If you need to update or delete all records (which is rare), you can use a workaround:

   ```typescript
   // To update all records:
   await db.update('users', { active: true }, { id: { '>=': 0 } });
   ```

3. **Performance concerns with security checks**

   If you notice performance issues with the security checks, you can adjust the configuration:

   ```typescript
   import { createSQLInjectionPrevention } from './security/preventSqlInjection';
   
   const sqlPrevention = createSQLInjectionPrevention({
     strictMode: false,       // Less strict checks
     monitorQueries: false,   // Disable query monitoring
     generateReports: false   // Disable report generation
   });
   
   const db = sqlPrevention.secureDatabase(pool);
   ```

## Security Monitoring

The SQL injection prevention system includes comprehensive security monitoring:

1. **Query logging**: All database queries are logged and can be reviewed.

2. **Security reports**: Generate security reports to review database usage patterns.

3. **Blockchain-based event logging**: Security events are logged to an immutable blockchain, ensuring audit trails cannot be tampered with.

4. **Real-time monitoring**: The SQL monitor provides real-time monitoring of database interactions.

To generate a security report:

```typescript
import { sqlInjectionPrevention } from './security/preventSqlInjection';

// Generate a report
const report = sqlInjectionPrevention.generateSecurityReport();
console.log(report);

// Run a security scan
await sqlInjectionPrevention.runSecurityScan();
```

---

By following this guide and using the provided tools, you can effectively protect your application against SQL injection vulnerabilities.