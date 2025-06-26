import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

// Use Supabase JWT secret for all token verification
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }
  const token = authHeader.substring(7);
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET not set');

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    return next();
  };
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (authHeader && authHeader.startsWith('Bearer ') && secret) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore errors, continue unauthenticated
  }
  return next();
};

export const verifySupabaseToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'SUPABASE_JWT_SECRET not set' });
  }
  try {
    const decoded = jwt.verify(token, secret as string);
    req.user = decoded;
    return next();
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};