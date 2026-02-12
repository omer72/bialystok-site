import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bialystok-jwt-secret';

export interface AuthRequest extends Request {
  isAdmin?: boolean;
}

export function verifyAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role === 'admin') {
      req.isAdmin = true;
      next();
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(): string {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}
