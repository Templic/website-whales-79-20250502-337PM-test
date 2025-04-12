import { Request, Response, NextFunction } from 'express';

// Check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.session.user.role !== 'admin' && req.session.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Check if user is super admin
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.session.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
}