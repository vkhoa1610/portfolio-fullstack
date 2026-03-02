import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { getAuthCookies, clearAuthCookies, setAuthCookies } from '@common/config/cookie-config.js';
import { refreshTokens } from '@common/config/cognito-service.js';
import { handleNormal, handleBackendError } from '@common/util/response-handler.js';
import { fetchUserProfile, fetchUserPermissions, fetchUserFunctions, buildUISession } from '@common/util/auth-utils.js';
import { SessionResponse } from '@common/types/auth-types.js';

/**
 * GET /api/auth/session
 * Re-hydrates UI session from HttpOnly cookies after page refresh
 *
 * Flow:
 * 1. Extract tokens from HttpOnly cookies
 * 2. If no tokens: return { authenticated: false }
 * 3. If tokens expired: try refresh
 * 4. Fetch user profile from Java backend
 * 5. Return frontend-safe UI session
 *
 * This enables ZERO LOADING FLASH after page refresh
 */
export const handle = async (req: Request, res: Response<SessionResponse | ErrorResponse>) => {
  try {
    // Extract tokens from cookies
    const tokens = getAuthCookies(req.cookies || {});

    // No tokens = not authenticated
    if (!tokens) {
      console.log('📭 No auth cookies found');
      return handleNormal(res, {
        processStatus: ProcessStatus.SUCCESS,
        message: ['No active session'],
        authenticated: false,
      });
    }

    // Decode ID token to get user info and expiration
    interface DecodedToken {
      email: string;
      exp: number;
      sub: string;
    }

    let decoded: DecodedToken | null = null;
    try {
      const decodedResult = jwt.decode(tokens.idToken);
      if (decodedResult && typeof decodedResult === 'object') {
        decoded = decodedResult as DecodedToken;
      }
    } catch {
      console.warn('⚠️ Failed to decode ID token');
      clearAuthCookies(res);
      return handleNormal(res, {
        processStatus: ProcessStatus.SUCCESS,
        message: ['Invalid session'],
        authenticated: false,
      });
    }

    if (!decoded || !decoded.email || !decoded.exp) {
      clearAuthCookies(res);
      return handleNormal(res, {
        processStatus: ProcessStatus.SUCCESS,
        message: ['Invalid session'],
        authenticated: false,
      });
    }

    const email = decoded.email;
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < now;
    const isNearExpiry = decoded.exp - now < 5 * 60; // 5 minutes buffer

    // Try to refresh if expired or near expiry
    if ((isExpired || isNearExpiry) && tokens.refreshToken) {
      console.log('🔄 Token expired or near expiry, attempting refresh');

      try {
        const refreshResponse = await refreshTokens(tokens.refreshToken, email);

        if (refreshResponse.AuthenticationResult) {
          const authResult = refreshResponse.AuthenticationResult;

          // Update cookies with new tokens (refresh token stays the same)
          setAuthCookies(res, {
            accessToken: authResult.AccessToken,
            idToken: authResult.IdToken,
          });

          console.log('✅ Token refresh successful');

          // Use the new ID token
          if (authResult.IdToken) {
            tokens.idToken = authResult.IdToken;
          }
        }
      } catch (refreshError: any) {
        console.warn('⚠️ Token refresh failed:', refreshError.message);

        // If token is already expired and refresh failed, clear session
        if (isExpired) {
          clearAuthCookies(res);
          return handleNormal(res, {
            processStatus: ProcessStatus.SUCCESS,
            message: ['Session expired'],
            authenticated: false,
          });
        }
        // If near expiry but not expired, continue with current token
      }
    }

    // Fetch fresh user profile + permissions + functions from Java backend
    const [userProfile, permissions, functions] = await Promise.all([
      fetchUserProfile(tokens.idToken),
      fetchUserPermissions(tokens.idToken),
      fetchUserFunctions(tokens.idToken),
    ]);

    // Build frontend-safe UI session
    const uiSession = buildUISession(userProfile, email, permissions, functions);

    console.log('✅ Session hydration successful for:', email);

    return handleNormal(res, {
      processStatus: ProcessStatus.SUCCESS,
      message: ['Session valid'],
      authenticated: true,
      session: uiSession,
    });
  } catch (err: any) {
    // On any unexpected error, clear cookies and return unauthenticated
    clearAuthCookies(res);
    return handleBackendError(res, err);
  }
};
