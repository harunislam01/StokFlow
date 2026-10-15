import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Routes that don't need CSRF protection (auth endpoints require credentials, not CSRF-vulnerable)
const CSRF_EXEMPT_PATHS = ['/api/login', '/api/refresh-token', '/api/logout'];

export const doubleSubmitCookieCSRF = (req: Request, res: Response, next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  const existingToken = req.cookies?.csrfToken;

  // Generate and set CSRF cookie if it doesn't exist
  if (!existingToken) {
    const csrfToken = crypto.randomBytes(24).toString('hex');
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // Must be readable by JS for double-submit pattern
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Safe HTTP methods don't require CSRF validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt auth-related paths from CSRF (they require credentials anyway)
  if (CSRF_EXEMPT_PATHS.some(path => req.path === path || req.originalUrl.startsWith(path))) {
    return next();
  }

  // Requests authenticated via Bearer token in Authorization header are immune to CSRF
  // (Browsers never automatically send Authorization Bearer headers on cross-site requests)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Güvenlik Hatası: Geçersiz veya eksik CSRF token' });
  }

  next();
};

