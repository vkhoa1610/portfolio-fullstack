import { Response, CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Secure cookie configuration for authentication tokens.
 * - HttpOnly: Prevents JavaScript access (XSS protection)
 * - Secure: Only sent over HTTPS (in production)
 * - SameSite: Strict to prevent CSRF attacks
 */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
};

/** Cookie names for authentication tokens */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  ID_TOKEN: 'id_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/** Cookie expiration times in milliseconds */
export const COOKIE_MAX_AGE = {
  ACCESS_TOKEN: 1 * 60 * 60 * 1000, // 1 hour
  ID_TOKEN: 1 * 60 * 60 * 1000, // 1 hour
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Clears all authentication cookies
 * Used during logout or session invalidation
 */
export const clearAuthCookies = (res: Response): void => {
  Object.values(COOKIE_NAMES).forEach((name) => {
    res.clearCookie(name, { path: '/' });
  });
};

/**
 * Sets authentication tokens in HttpOnly cookies
 * All tokens are stored securely and not accessible to JavaScript
 */
export const setAuthCookies = (
  res: Response,
  tokens: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  },
): void => {
  if (tokens.accessToken) {
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE.ACCESS_TOKEN,
    });
  }

  if (tokens.idToken) {
    res.cookie(COOKIE_NAMES.ID_TOKEN, tokens.idToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE.ID_TOKEN,
    });
  }

  if (tokens.refreshToken) {
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE.REFRESH_TOKEN,
    });
  }
};

/**
 * Extracts authentication tokens from cookies
 * Returns null if any required token is missing
 */
export const getAuthCookies = (
  cookies: Record<string, string>,
): { accessToken: string; idToken: string; refreshToken: string } | null => {
  const accessToken = cookies[COOKIE_NAMES.ACCESS_TOKEN];
  const idToken = cookies[COOKIE_NAMES.ID_TOKEN];
  const refreshToken = cookies[COOKIE_NAMES.REFRESH_TOKEN];

  if (!accessToken || !idToken) {
    return null;
  }

  return { accessToken, idToken, refreshToken };
};
