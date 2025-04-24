/**
 * Database Type Definitions
 * 
 * This file defines database-related types used throughout the application.
 * These types provide structure for database operations, connection management,
 * and query building.
 */

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  max?: number; // Maximum number of clients in the pool
  idleTimeoutMillis?: number; // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis?: number; // How long to wait for a connection to become available
  statement_timeout?: number; // Timeout for statements in milliseconds
  query_timeout?: number; // Timeout for queries in milliseconds
}

/**
 * Database connection pool statistics
 */
export interface PoolStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
  size: number;
  available: number;
  max: number;
}

/**
 * Basic query options
 */
export interface QueryOptions {
  timeout?: number;
  onCancel?: () => void;
  useMaster?: boolean;
  skipCache?: boolean;
  returnStream?: boolean;
  metaData?: Record<string, any>;
}

/**
 * Transaction isolation levels
 */
export type IsolationLevel = 
  | 'READ UNCOMMITTED'
  | 'READ COMMITTED'
  | 'REPEATABLE READ'
  | 'SERIALIZABLE';

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
  deferrable?: boolean;
  timeout?: number;
  name?: string;
}

/**
 * Database transaction context
 */
export interface Transaction {
  id: string;
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  query<T = any>(sql: string, params?: any[], options?: QueryOptions): Promise<T>;
  release(): void;
  isActive: boolean;
  isFinished: boolean;
  isFailed: boolean;
  startTime: number;
  savepoint(name: string): Promise<void>;
  rollbackTo(name: string): Promise<void>;
  releaseSavepoint(name: string): Promise<void>;
}

/**
 * Query result metadata
 */
export interface QueryResultMeta {
  command: string;
  rowCount: number;
  oid: number;
  fields: Array<{
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
  }>;
  duration: number;
  executedAt: number;
}

/**
 * Query result with metadata
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  meta: QueryResultMeta;
}

/**
 * Database error details
 */
export interface DatabaseErrorDetails {
  severity: string;
  code: string;
  detail: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: number;
  routine?: string;
}

/**
 * SQL query builder parameter
 */
export type QueryParam = 
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Buffer
  | Array<string | number | boolean | Date | null | Buffer>
  | Record<string, any>
  | any[];

/**
 * Select query options
 */
export interface SelectOptions {
  distinct?: boolean;
  distinctOn?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string | string[] | Record<string, 'asc' | 'desc' | 'ASC' | 'DESC'>;
  groupBy?: string | string[];
  having?: string;
  forUpdate?: boolean;
  forShare?: boolean;
  noWait?: boolean;
  skipLocked?: boolean;
}

/**
 * Insert query options
 */
export interface InsertOptions {
  returning?: string | string[] | '*';
  onConflict?: {
    columns: string[];
    action: 'doNothing' | 'doUpdate';
    updateColumns?: string[];
    where?: string;
  };
}

/**
 * Update query options
 */
export interface UpdateOptions {
  returning?: string | string[] | '*';
  where: string | Record<string, any>;
  limit?: number;
}

/**
 * Delete query options
 */
export interface DeleteOptions {
  returning?: string | string[] | '*';
  where: string | Record<string, any>;
  limit?: number;
}

/**
 * Column definition for schema
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable?: boolean;
  default?: any;
  primary?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
  };
  check?: string;
  comment?: string;
}

/**
 * Table definition for schema
 */
export interface TableDefinition {
  name: string;
  schema?: string;
  columns: ColumnDefinition[];
  indexes?: Array<{
    name?: string;
    columns: string[];
    unique?: boolean;
    type?: 'btree' | 'hash' | 'gist' | 'gin';
    where?: string;
  }>;
  constraints?: Array<{
    name?: string;
    type: 'primary' | 'unique' | 'foreign' | 'check';
    columns: string[];
    references?: {
      table: string;
      columns: string[];
      onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
      onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
    };
    check?: string;
  }>;
  comment?: string;
}

/**
 * Migration definition
 */
export interface MigrationDefinition {
  name: string;
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
}

/**
 * Migration entry in database
 */
export interface MigrationRecord {
  id: number;
  name: string;
  applied_at: Date;
  hash: string;
  is_current: boolean;
}

/**
 * Database health check result
 */
export interface DatabaseHealth {
  isConnected: boolean;
  responseTimeMs: number;
  poolStats: PoolStats;
  version?: string;
  uptime?: number;
  errors?: string[];
}

/**
 * Type guards and utilities
 */

/**
 * Type guard to check if a value is a QueryResult
 */
export function isQueryResult<T = any>(value: unknown): value is QueryResult<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'rows' in value &&
    'rowCount' in value &&
    'meta' in value
  );
}

/**
 * Type guard to check if a value is a Transaction
 */
export function isTransaction(value: unknown): value is Transaction {
  return (
    value !== null &&
    typeof value === 'object' &&
    'begin' in value &&
    'commit' in value &&
    'rollback' in value &&
    'query' in value
  );
}

/**
 * Converts a JavaScript value to a SQL-safe string
 */
export function toSqlString(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (Array.isArray(value)) {
    return `ARRAY[${value.map(v => toSqlString(v)).join(', ')}]`;
  }
  
  if (Buffer.isBuffer(value)) {
    return `E'\\x${value.toString('hex')}'`;
  }
  
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  
  // Default string escaping
  return `'${String(value).replace(/'/g, "''")}'`;
}