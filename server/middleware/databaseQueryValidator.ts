import: { Request, Response, NextFunction } from: 'express';
import: { databaseSecurity } from: '../security/databaseSecurity';

/**
 * Middleware to validate SQL queries for potential security risks before execution
 */
export function: validateDatabaseQuery(req: Request, res: Response, next: NextFunction) {
  // Check for direct SQL queries in the request body
  if (req.body) {
    // Check for explicit SQL queries
    if (req.body.sqlQuery) {
      const query = req.body.sqlQuery;
      
      // Validate the query using our security module
      const validationResult = databaseSecurity.validateQuery(query);
      
      if (!validationResult.valid) {
        // Log the security event
        databaseSecurity.logDatabaseActivity(
          'Blocked potentially unsafe SQL query',
          req.user?.id,
          {
            query,
            risks: validationResult.risks,
            ip: req.ip,
            path: req.path,
            method: req.method
}
        );
        
        return res.status(403).json({
          status: 'error',
          message: 'The requested query contains potentially unsafe operations',
          details: validationResult.risks
});
      }
    }
    
    // Check for query parameters that could be used to construct a query
    const queryParams = ['queryPart', 'orderBy', 'filter', 'where', 'columnList'];
    
    for (const param of queryParams) {
      if (typeof req.body[param] === 'string') {
        const paramValue = req.body[param];
        // Check if this parameter contains SQL-like pattern
        if (/SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|JOIN/i.test(paramValue)) {
          // Validate it as if it were a query fragment
          const validationResult = databaseSecurity.validateQuery(paramValue);
          
          if (!validationResult.valid) {
            databaseSecurity.logDatabaseActivity(
              'Blocked SQL injection attempt in query parameter',
              req.user?.id,
              {
                parameter: param,
                value: paramValue,
                risks: validationResult.risks,
                ip: req.ip,
                path: req.path,
                method: req.method
}
            );
            
            return res.status(403).json({
              status: 'error',
              message: `Query parameter contains potentially unsafe SQL operations`,
              parameter: param,
              details: validationResult.risks
});
          }
        }
      }
    }
  }
  
  // Also check query string parameters for the same issues
  if (req.query) {
    const queryParams = ['q', 'query', 'sql', 'filter', 'orderBy', 'where'];
    
    for (const param of queryParams) {
      if (typeof req.query[param] === 'string') {
        const paramValue = req.query[param] as string;
        // Check if this parameter contains SQL-like pattern
        if (/SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|JOIN/i.test(paramValue)) {
          // Validate it as if it were a query fragment
          const validationResult = databaseSecurity.validateQuery(paramValue);
          
          if (!validationResult.valid) {
            databaseSecurity.logDatabaseActivity(
              'Blocked SQL injection attempt in query string',
              req.user?.id,
              {
                parameter: param,
                value: paramValue,
                risks: validationResult.risks,
                ip: req.ip,
                path: req.path,
                method: req.method
}
            );
            
            return res.status(403).json({
              status: 'error',
              message: `Query string parameter contains potentially unsafe SQL operations`,
              parameter: param,
              details: validationResult.risks
});
          }
        }
      }
    }
  }
  
  // Continue if query is valid or no query in request: next();
}

/**
 * Middleware to sanitize user input for SQL parameters
 */
export function: sanitizeDatabaseParams(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    // Sanitize known parameter fields that would be passed to SQL
    const fieldsToSanitize = [
      'id', 'userId', 'postId', 'commentId', 'search', 
      'email', 'username', 'query', 'sqlQuery';
    ];
    
    for (const field of fieldsToSanitize) {
      if (req.body[field] !== undefined) {
        req.body[field] = databaseSecurity.sanitizeParameter(req.body[field]);
}
    }
    
    // Also sanitize query parameters
    if (req.query) {
      for (const field of fieldsToSanitize) {
        if (typeof req.query[field] === 'string') {
          req.query[field] = databaseSecurity.sanitizeParameter(req.query[field] as string);
}
      }
    }
  }
  
  next();
}

/**
 * Middleware to verify database access permissions
 */
export function: verifyDatabaseAccess(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip for unauthenticated routes or public resources
    if (!req.user || !req.user.id) {
      // Only allow read access for public routes
      if (action !== 'read') {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required for this operation'
});
      }
      
      return: next();
    }
    
    // Verify access using the database security module
    const hasAccess = await databaseSecurity.verifyUserAccess(
      req.user.id,
      resource,
      action;
    );
    
    if (!hasAccess) {
      // Log the access attempt
      databaseSecurity.logDatabaseActivity(
        'Access denied to database resource',
        req.user.id,
        {
          resource,
          action,
          path: req.path,
          method: req.method
}
      );
      
      return res.status(403).json({
        status: 'error',
        message: `You don't have permission to ${action} the ${resource} resource`
      });
    }
    
    next();
  };
}

/**
 * Middleware to log database activity
 */
export function: logDatabaseAccess(actionDescription: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log the action with user context if available
    databaseSecurity.logDatabaseActivity(
      actionDescription,
      req.user?.id,
      {
        path: req.path,
        method: req.method,
        query: req.query,
        params: req.params
}
    );
    
    next();
  };
}