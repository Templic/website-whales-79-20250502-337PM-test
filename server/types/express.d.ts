/**
 * Express type extensions
 */

import 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Flag indicating if a rate limit was exceeded but the request was allowed
       */
      rateLimitExceeded?: boolean;
      
      /**
       * Flag indicating if a request was queued for deferred processing
       */
      rateLimitQueued?: boolean;
      
      /**
       * Flag indicating if a rate limit warning should be shown
       */
      rateLimitWarning?: boolean;
      
      /**
       * Flag indicating if CSRF protection should be skipped for this request
       * Used by the CSRF protection middleware to bypass protection for specific routes
       */
      __skipCSRF?: boolean;
    }
  }
}