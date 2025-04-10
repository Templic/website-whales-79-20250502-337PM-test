/**
 * Utility Types
 * 
 * This file contains reusable type utilities for the application.
 * These types provide enhanced type safety and DX improvements.
 */

// Type-safe ID branding to prevent string IDs from being used interchangeably
export type Branded<K, T> = K & { __brand: T };

// Domain-specific ID types (branded strings)
export type ProductId = Branded<string, 'ProductId'>;
export type UserId = Branded<string, 'UserId'>;
export type OrderId = Branded<string, 'OrderId'>;
export type BlogPostId = Branded<string, 'BlogPostId'>;
export type TrackId = Branded<string, 'TrackId'>;
export type AlbumId = Branded<string, 'AlbumId'>;
export type CommentId = Branded<string, 'CommentId'>;
export type TourDateId = Branded<string, 'TourDateId'>;

/**
 * Partial<T> but with specific keys made required
 */
export type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make specific properties in type T optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties in type T required
 */
export type Required<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P];
};

/**
 * Omit properties from type T where values have type U
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Pick properties from type T where values have type U
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * Deep partial type (makes all nested properties optional)
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Ensures all properties in a type are non-nullable (not null or undefined)
 */
export type NonNullableProps<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Type for record with specific keys and values
 */
export type RecordWithKeys<K extends string | number | symbol, V> = {
  [P in K]: V;
};

/**
 * Creates a type for a discriminated union based on a key
 */
export type Discriminate<T, K extends keyof T, V extends T[K]> = T extends {
  [key in K]: V;
}
  ? T
  : never;

/**
 * Type for function with explicit parameters and return type
 */
export type Func<Args extends any[], Return> = (...args: Args) => Return;

/**
 * Type for asyncronous function
 */
export type AsyncFunc<Args extends any[], Return> = (
  ...args: Args
) => Promise<Return>;

/**
 * Type that extracts the parameters from a function type
 */
export type Parameters<T extends (...args: any[]) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

/**
 * Type that extracts the return type from a function type
 */
export type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : any;

/**
 * React-specific utility types
 */
export type EventHandler<E extends React.SyntheticEvent> = (
  event: E
) => void | Promise<void>;

/**
 * Readonly array type
 */
export type ReadonlyArray<T> = readonly T[];

/**
 * A deep readonly version of a type (makes all nested properties readonly)
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Type for a component that accepts all HTML attributes for a given element
 */
export type HTMLAttributes<T extends keyof JSX.IntrinsicElements> = React.ComponentPropsWithoutRef<T>;

/**
 * Type-safe object keys
 */
export type ObjectKeys<T extends object> = Extract<keyof T, string>[];

/**
 * Type-safe string enums
 */
export type StringEnum<T extends string> = { [K in T]: K };

/**
 * Creates a union type from an array type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Helper for JSON parsing with type safety
 */
export type JSONParse<T> = (text: string) => T;

/**
 * Helper for type-safe environment variables
 */
export type EnvVar<T extends string> = T | undefined;

/**
 * Helper for status types
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Helper for async operation state
 */
export type AsyncState<T, E = Error> = {
  status: Status;
  data?: T;
  error?: E;
};