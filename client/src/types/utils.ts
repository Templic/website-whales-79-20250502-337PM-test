/**
 * Type Utilities
 * 
 * This file contains utility types and type helpers used throughout the application.
 * These types help improve type safety and reduce code repetition.
 */

/**
 * Makes all properties of T optional and nullable
 * @example
 * type UserPartial = Nullable<User>;
 * // All properties of User are now optional and can be null
 */
export type Nullable<T> = {
  [P in keyof T]?: T[P] | null;
};

/**
 * Makes all properties of T required and non-nullable
 * @example
 * type RequiredUser = Required<User>;
 * // All properties of User are now required
 */
export type NonNullable<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Picks a subset of properties from T
 * @example
 * type UserNameAndEmail = Pick<User, 'name' | 'email'>;
 * // Only has name and email properties from User
 */
// This is redundant as it's built into TypeScript, but included for documentation
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Omits specified properties from T
 * @example
 * type UserWithoutId = Omit<User, 'id'>;
 * // Has all properties of User except id
 */
// This is redundant as it's built into TypeScript, but included for documentation
export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

/**
 * Branded type for creating nominal type safety
 * @example
 * type UserId = Branded<string, 'UserId'>;
 * // UserId is now a unique type that cannot be confused with other string types
 */
export type Branded<T, Brand> = T & { readonly _brand: Brand };

/**
 * Commonly used branded types
 */
export type UserId = Branded<string, 'UserId'>;
export type ProductId = Branded<string, 'ProductId'>;
export type OrderId = Branded<string, 'OrderId'>;
export type BlogPostId = Branded<string, 'BlogPostId'>;
export type MusicId = Branded<number, 'MusicId'>;

/**
 * Record with specific keys
 * @example
 * type CategoryProducts = RecordWithKeys<'clothing' | 'accessories', Product[]>;
 * // { clothing: Product[], accessories: Product[] }
 */
export type RecordWithKeys<K extends string | number | symbol, T> = {
  [P in K]: T;
};

/**
 * Deep partial type - makes all properties and nested properties optional
 * @example
 * type DeepPartialUser = DeepPartial<User>;
 * // All properties and nested properties of User are now optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Function type helpers
 */
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithParams<P, T = void> = (params: P) => Promise<T>;

/**
 * Pagination helpers
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
}

/**
 * Sort and filter helpers
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | null;
}

/**
 * Type safe event handler
 * @example
 * const handleClick: EventHandler<'click', HTMLButtonElement> = (event) => {
 *   // event is properly typed as React.MouseEvent<HTMLButtonElement>
 * };
 */
export type EventHandler<E extends keyof React.SyntheticEvent, T = Element> = 
  (event: React.SyntheticEvent<T, Event> & { type: E }) => void;