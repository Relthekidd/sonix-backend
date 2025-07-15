// src/middleware/authMiddleware.ts

import { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const getRequiredEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
};

/**
 * Validate JWT, look up user, then attach { id, role } to req.user
 */
export const authenticate: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const token = header.slice(7);
  try {
    const secret = getRequiredEnv('SUPABASE_JWT_SECRET');
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    const supabaseId = (decoded.sub || decoded.userId || decoded.id) as string;
    if (!supabaseId) {
      res.status(401).json({ success: false, message: 'Invalid token payload' });
      return;
    }

    const userDoc = await UserModel.findById(supabaseId);
    if (!userDoc) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    authReq.user = {
      id: userDoc.id.toString(),
      role: userDoc.role,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Restrict access to certain roles
 */
export const authorize = (...roles: string[]): RequestHandler => {
  return (req, res, next) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
