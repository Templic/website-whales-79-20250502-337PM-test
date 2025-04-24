/**
 * Query Type Definitions
 * 
 * This file defines query-related types for database operations.
 * These types ensure type safety for queries, filters, and query builders.
 */

import { EntityModel } from './model-types';

/**
 * Operators for field filtering
 */
export enum FilterOperator {
  // Equality operators
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  
  // Comparison operators
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  
  // Array operators
  IN = 'in',
  NOT_IN = 'nin',
  
  // String operators
  LIKE = 'like',
  NOT_LIKE = 'nlike',
  STARTS_WITH = 'starts',
  ENDS_WITH = 'ends',
  CONTAINS = 'contains',
  
  // Null operators
  IS_NULL = 'isnull',
  IS_NOT_NULL = 'notnull',
  
  // Logical operators
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  
  // Special operators
  EXISTS = 'exists',
  NOT_EXISTS = 'nexists',
  BETWEEN = 'between',
  JSONB_CONTAINS = 'jsonb_contains',
  ARRAY_CONTAINS = 'array_contains',
  ARRAY_OVERLAPS = 'array_overlaps',
  FULLTEXT = 'fulltext'
}

/**
 * Order direction for sorting
 */
export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Simple field filter
 */
export interface FieldFilter {
  field: string;
  operator: FilterOperator | keyof typeof FilterOperator | string;
  value: any;
}

/**
 * Composite filter for complex filtering
 */
export interface CompositeFilter {
  operator: FilterOperator.AND | FilterOperator.OR | FilterOperator.NOT | 'and' | 'or' | 'not';
  filters: Array<FieldFilter | CompositeFilter>;
}

/**
 * Type guard for field filter
 */
export function isFieldFilter(filter: any): filter is FieldFilter {
  return filter && 'field' in filter && 'operator' in filter && 'value' in filter;
}

/**
 * Type guard for composite filter
 */
export function isCompositeFilter(filter: any): filter is CompositeFilter {
  return filter && 'operator' in filter && 'filters' in filter && Array.isArray(filter.filters);
}

/**
 * Filter type for query builders
 */
export type Filter = FieldFilter | CompositeFilter;

/**
 * Field order for sorting
 */
export interface FieldOrder {
  field: string;
  direction: OrderDirection | keyof typeof OrderDirection | 'asc' | 'desc';
}

/**
 * Order type for query builders
 */
export type Order = FieldOrder | FieldOrder[] | string | string[] | Record<string, OrderDirection | 'asc' | 'desc'>;

/**
 * Pagination parameters
 */
export interface Pagination {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Query options for find operations
 */
export interface FindOptions {
  select?: string[];
  where?: Filter | Filter[];
  orderBy?: Order;
  groupBy?: string | string[];
  having?: Filter | Filter[];
  limit?: number;
  offset?: number;
  page?: number;
  withDeleted?: boolean;
  relations?: string[];
  cache?: boolean | number;
  lock?: {
    mode: 'pessimistic_read' | 'pessimistic_write' | 'optimistic';
    version?: number;
    tables?: string[];
  };
  transaction?: any;
  timeout?: number;
  skip?: number;
  take?: number;
  projection?: Record<string, 0 | 1>;
  hint?: string | Record<string, any>;
  explain?: boolean;
  maxTimeMS?: number;
  comment?: string;
}

/**
 * Count options for count operations
 */
export interface CountOptions {
  where?: Filter | Filter[];
  withDeleted?: boolean;
  transaction?: any;
  timeout?: number;
}

/**
 * Create options for create operations
 */
export interface CreateOptions {
  returning?: boolean | string[];
  transaction?: any;
  timeout?: number;
  onConflict?: {
    fields: string[];
    action: 'nothing' | 'update';
    updateFields?: string[];
    where?: Filter;
  };
}

/**
 * Update options for update operations
 */
export interface UpdateOptions {
  where?: Filter | Filter[];
  returning?: boolean | string[];
  transaction?: any;
  timeout?: number;
}

/**
 * Delete options for delete operations
 */
export interface DeleteOptions {
  where?: Filter | Filter[];
  returning?: boolean | string[];
  transaction?: any;
  timeout?: number;
  soft?: boolean;
}

/**
 * Aggregate functions for aggregate operations
 */
export enum AggregateFunction {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max'
}

/**
 * Aggregate field
 */
export interface AggregateField {
  function: AggregateFunction | keyof typeof AggregateFunction | string;
  field: string;
  alias?: string;
}

/**
 * Aggregate options for aggregate operations
 */
export interface AggregateOptions {
  where?: Filter | Filter[];
  groupBy?: string | string[];
  having?: Filter | Filter[];
  orderBy?: Order;
  limit?: number;
  offset?: number;
  transaction?: any;
  timeout?: number;
}

/**
 * Join condition for joins
 */
export interface JoinCondition {
  leftField: string;
  rightField: string;
  operator?: '=' | '<>' | '>' | '>=' | '<' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE';
}

/**
 * Join options for joins
 */
export interface JoinOptions {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  alias?: string;
  conditions: JoinCondition[];
}

/**
 * Raw SQL query options
 */
export interface RawQueryOptions {
  params?: any[];
  transaction?: any;
  timeout?: number;
}

/**
 * Repository interface for entity operations
 */
export interface Repository<T extends EntityModel> {
  find(options?: FindOptions): Promise<T[]>;
  findOne(options?: FindOptions): Promise<T | null>;
  findById(id: string, options?: FindOptions): Promise<T | null>;
  count(options?: CountOptions): Promise<number>;
  create(data: Partial<T>, options?: CreateOptions): Promise<T>;
  createMany(data: Partial<T>[], options?: CreateOptions): Promise<T[]>;
  update(data: Partial<T>, options?: UpdateOptions): Promise<T | T[] | number>;
  updateById(id: string, data: Partial<T>, options?: UpdateOptions): Promise<T | null>;
  delete(options?: DeleteOptions): Promise<T | T[] | number>;
  deleteById(id: string, options?: DeleteOptions): Promise<T | null>;
  restore(options?: UpdateOptions): Promise<T | T[] | number>;
  restoreById(id: string, options?: UpdateOptions): Promise<T | null>;
  aggregate(fields: AggregateField[], options?: AggregateOptions): Promise<Record<string, any>[]>;
  raw<R = any>(sql: string, options?: RawQueryOptions): Promise<R>;
  transaction<R = any>(callback: (transaction: any) => Promise<R>): Promise<R>;
}

/**
 * Query result metadata
 */
export interface QueryMetadata {
  executionTime: number;
  totalCount?: number;
  affectedRows?: number;
  returnedCount?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Paginated result for queries
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: QueryMetadata;
}

/**
 * QueryResult type
 */
export type QueryResult<T> = T[] | T | number | PaginatedResult<T> | null;

/**
 * Database transaction context
 */
export interface TransactionContext {
  transaction: any;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
  getRepository<T extends EntityModel>(entityName: string): Repository<T>;
}

/**
 * Utilities
 */

/**
 * Creates a field filter
 */
export function createFieldFilter(
  field: string, 
  operator: FilterOperator | keyof typeof FilterOperator | string, 
  value: any
): FieldFilter {
  return { field, operator, value };
}

/**
 * Creates a composite filter
 */
export function createCompositeFilter(
  operator: FilterOperator.AND | FilterOperator.OR | FilterOperator.NOT | 'and' | 'or' | 'not',
  filters: Array<FieldFilter | CompositeFilter>
): CompositeFilter {
  return { operator, filters };
}

/**
 * Creates an AND filter
 */
export function and(...filters: Array<FieldFilter | CompositeFilter>): CompositeFilter {
  return createCompositeFilter(FilterOperator.AND, filters);
}

/**
 * Creates an OR filter
 */
export function or(...filters: Array<FieldFilter | CompositeFilter>): CompositeFilter {
  return createCompositeFilter(FilterOperator.OR, filters);
}

/**
 * Creates a NOT filter
 */
export function not(filter: FieldFilter | CompositeFilter): CompositeFilter {
  return createCompositeFilter(FilterOperator.NOT, [filter]);
}

/**
 * Creates a field order
 */
export function createFieldOrder(
  field: string, 
  direction: OrderDirection | keyof typeof OrderDirection | 'asc' | 'desc' = OrderDirection.ASC
): FieldOrder {
  return { field, direction };
}

/**
 * Creates an aggregate field
 */
export function createAggregateField(
  func: AggregateFunction | keyof typeof AggregateFunction | string,
  field: string,
  alias?: string
): AggregateField {
  return { function: func, field, alias };
}