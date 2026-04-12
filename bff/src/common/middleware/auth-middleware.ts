import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { COOKIE_NAMES, getAuthCookies } from '../config/cookie-config.js';
import { ProcessStatus } from '../config/common-types.js';

// ============================================================================
// TYPE EXTENSIONS
// ============================================================================

/**
 * Extend Express Request with authentication data
 */
declare global {
  namespace Express {
    interface Request {
      /** Raw tokens extracted from HttpOnly cookies */
      authTokens?: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
      };
      /** Decoded ID token claims (without cryptographic verification) */
      decodedToken?: {
        email: string;
        sub: string;
        exp: number;
        iat: number;
        [key: string]: unknown;
      };
    }
  }
}

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Extracts authentication tokens from HttpOnly cookies
 * This middleware runs on all routes and populates req.authTokens
 * 
 * SECURITY NOTE: 
 * - Tokens are ONLY extracted from HttpOnly cookies
 * - No tokens are read from headers, query params, or body
 * - This prevents token theft via XSS
 */
export const extractTokens = (req: Request, _res: Response, next: NextFunction): void => {
  const tokens = getAuthCookies(req.cookies || {});

  if (tokens) {
    req.authTokens = tokens;

    // Decode ID token to extract user claims
    // Note: We're just decoding, not verifying - Cognito already validated the token
    try {
      const decoded = jwt.decode(tokens.idToken) as Record<string, unknown> | null;
      if (decoded) {
        req.decodedToken = {
          email: (decoded.email as string) || '',
          sub: (decoded.sub as string) || '',
          exp: (decoded.exp as number) || 0,
          iat: (decoded.iat as number) || 0,
          ...decoded,
        };
      }
    } catch (err) {
      // Token decode failed - will be handled by requireAuth if needed
      console.warn('⚠️ Failed to decode ID token:', err);
    }
  }

  next();
};

/**
 * Requires authentication - rejects request if no valid tokens
 * Use this middleware to protect routes that need authentication
 * 
 * Usage: router.get('/protected', requireAuth, handler)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.authTokens || !req.decodedToken) {
    res.status(401).json({
      processStatus: ProcessStatus.ERROR,
      message: ['Authentication required'],
      authenticated: false,
    });
    return;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (req.decodedToken.exp && req.decodedToken.exp < now) {
    res.status(401).json({
      processStatus: ProcessStatus.ERROR,
      message: ['Token expired'],
      authenticated: false,
    });
    return;
  }

  next();
};

/**
 * Optional authentication - populates auth data if available, but doesn't require it
 * Use for routes where authentication is optional
 * 
 * Usage: router.get('/public-or-private', optionalAuth, handler)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  // extractTokens already handles the extraction, this is just a semantic alias
  extractTokens(req, res, next);
};

/**
 * Requires a specific role
 * Must be used AFTER requireAuth middleware
 * 
 * Usage: router.get('/admin', requireAuth, requireRole('ADMIN'), handler)
 */
export const requireRole =
  (role: 'USER' | 'ADMIN') =>
  (req: Request, res: Response, next: NextFunction): void => {
    // Get role from decoded token — Auth0 namespaced claim (set via Auth0 Action)
    const userRole = req.decodedToken?.['https://portfolio.app/role'] as string | undefined;

    if (!userRole || userRole !== role) {
      res.status(403).json({
        processStatus: ProcessStatus.ERROR,
        message: ['Insufficient permissions'],
        authenticated: true,
      });
      return;
    }

    next();
  };
