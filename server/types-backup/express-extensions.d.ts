// Express extensions to fix TypeScript errors
import { Response } from 'express';

// Extend Express Response to ensure return values are properly typed
declare module 'express' {
  interface Response {
    status(code: number): TypedResponse<any>;
    json(body?: any): TypedResponse<any>;
    send(body?: any): TypedResponse<any>;
    redirect(url: string): TypedResponse<any>;
  }

  // TypedResponse interface to ensure Response methods return proper type
  interface TypedResponse<T> extends Response {
    json(body?: T): TypedResponse<T>;
    status(code: number): TypedResponse<T>;
    send(body?: T): TypedResponse<T>;
  }
}