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
    }
  }
}