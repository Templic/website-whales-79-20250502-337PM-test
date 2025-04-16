
import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../security/security';

// Configure CSRF protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// CSRF error handler
export const handleCsrfError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  logSecurityEvent({
    type: 'CSRF_VALIDATION_FAILURE',
    details: 'Invalid CSRF token',
    severity: 'high'
  });
  
  res.status(403).json({
    error: 'Invalid CSRF token. Please try again.'
  });
};

export default csrfProtection;
