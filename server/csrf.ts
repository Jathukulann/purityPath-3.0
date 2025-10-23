import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Function to set CSRF token in response
export function setCsrfToken(res: Response): string {
  const token = generateToken();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Frontend needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

// Middleware to set CSRF token in cookie
export function csrfTokenProvider(req: Request, res: Response, next: NextFunction) {
  // Only generate token for authenticated users and if not already present
  const isAuth = typeof (req as any).isAuthenticated === 'function' ? (req as any).isAuthenticated() : false;
  if (isAuth && !req.cookies[CSRF_COOKIE_NAME]) {
    const token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Frontend needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
  next();
}

// Middleware to verify CSRF token for state-changing requests
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods and unauthenticated users
  const isAuth = typeof (req as any).isAuthenticated === 'function' ? (req as any).isAuthenticated() : false;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !isAuth) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Both tokens must be present and match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
}