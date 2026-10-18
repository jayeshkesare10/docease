import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'docease_dev_secret_key_8f7b2c9d1e4a6f8b0c2d4e6a8f1b3c5d';

export interface AuthUser {
  id: number;
  email: string | null;
  mobile: string | null;
  role: 'citizen' | 'official' | 'admin';
  full_name: string;
  preferred_language: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(computedHash, storedBuffer);
  } catch (err) {
    return false;
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      full_name: user.full_name,
      preferred_language: user.preferred_language
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user still exists in database
    const userRow = db.prepare('SELECT id, email, mobile, role, full_name, preferred_language, is_verified FROM users WHERE id = ?').get(decoded.id) as any;
    if (!userRow) {
      res.status(401).json({ error: 'User account not found or has been revoked.' });
      return;
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      mobile: userRow.mobile,
      role: userRow.role,
      full_name: userRow.full_name,
      preferred_language: userRow.preferred_language || 'en'
    };

    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
    return;
  }
}

export function requireRole(allowedRoles: Array<'citizen' | 'official' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Access forbidden. Required role: ${allowedRoles.join(' or ')}.` });
      return;
    }

    next();
  };
}

// In-memory basic rate limiter for OTP / Login to prevent brute-force attacks
const requestCounts = new Map<string, { count: number; firstRequestTime: number }>();

export function rateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = requestCounts.get(key);
    if (!record) {
      requestCounts.set(key, { count: 1, firstRequestTime: now });
      next();
      return;
    }

    if (now - record.firstRequestTime > windowMs) {
      requestCounts.set(key, { count: 1, firstRequestTime: now });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please try again after 1 minute.' });
      return;
    }

    record.count++;
    next();
  };
}
