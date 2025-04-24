// Type definitions for csurf
declare module 'csurf' {
  import { RequestHandler } from 'express';

  interface CsurfOptions {
    value?: (req) => string;
    cookie?: boolean | {
      key?: string;
      path?: string;
      domain?: string;
      secure?: boolean;
      maxAge?: number;
      httpOnly?: boolean;
      sameSite?: boolean | 'strict' | 'lax' | 'none';
    };
    ignoreMethods?: string[];
    sessionKey?: string;
  }

  function csurf(options?: CsurfOptions): RequestHandler;

  export = csurf;
}

// Extend Express Request to include csrfToken method
declare namespace Express {
  interface Request {
    csrfToken(): string;
  }
}
declare module 'csurf' {
  import { RequestHandler } from 'express';
  
  function csurf(options?: {
    cookie?: boolean | Object;
    ignoreMethods?: string[];
    sessionKey?: string;
    value?: (req) => string;
  }): RequestHandler;
  
  export = csurf;
}
