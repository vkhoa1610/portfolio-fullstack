import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { getAuthCookies, clearAuthCookies, setAuthCookies } from '@common/config/cookie-config.js';
import { refreshTokens } from '@common/config/auth0-service.js';
import { handleNormal, handleBackendError } from '@common/util/response-handler.js';
import { fetchUserProfile, fetchUserPermissions, fetchUserFunctions, fetchUserAdminStatus, buildUISession } from '@common/util/auth-utils.js';
import { SessionResponse } from '@common/types/auth-types.js';

/**
 * GET /api/auth/session
 * Re-hydrates UI session from HttpOnly cookies after page refresh
 */
export const handle = async (req: Request, res: Response<SessionResponse | ErrorResponse>) => {
  try {
    const tokens = getAuthCookies(req.cookies || {});

    if (!tokens) {
      console.log('📭 No auth cookies found');
      return handleNormal(res, {
        processStatus: ProcessStatus.SUCCESS,
        message:       ['No active session'],
        authenticated: false,
      });
    }

    interface DecodedToken { email: string; exp: number; sub: string; }

    let decoded: DecodedToken | null = null;
    try {
      const raw = jwt.decode(tokens.idToken);
      if (raw && typeof raw === 'object') decoded = raw as DecodedToken;
    } catch {
      clearAuthCookies(res);
      return handleNormal(res, { processStatus: ProcessStatus.SUCCESS, message: ['Invalid session'], authenticated: false });
    }

    if (!decoded?.email || !decoded?.exp) {
      clearAuthCookies(res);
      return handleNormal(res, { processStatus: ProcessStatus.SUCCESS, message: ['Invalid session'], authenticated: false });
    }

    const email        = decoded.email;
    const now          = Math.floor(Date.now() / 1000);
    const isExpired    = decoded.exp < now;
    const isNearExpiry = decoded.exp - now < 5 * 60;

    if ((isExpired || isNearExpiry) && tokens.refreshToken) {
      console.log('🔄 Token expired or near expiry, attempting Auth0 refresh');

      try {
        const result = await refreshTokens(tokens.refreshToken);

        if (result.type === 'success') {
          setAuthCookies(res, {
            accessToken: result.data.access_token,
            idToken:     result.data.id_token,
          });
          tokens.idToken = result.data.id_token;
          console.log('✅ Token refresh successful');
        } else {
          throw new Error(result.message);
        }
      } catch (refreshError: any) {
        console.warn('⚠️ Token refresh failed:', refreshError.message);
        if (isExpired) {
          clearAuthCookies(res);
          return handleNormal(res, { processStatus: ProcessStatus.SUCCESS, message: ['Session expired'], authenticated: false });
        }
      }
    }

    const [userProfile, permissions, functions, isAdmin] = await Promise.all([
      fetchUserProfile(tokens.idToken),
      fetchUserPermissions(tokens.idToken),
      fetchUserFunctions(tokens.idToken),
      fetchUserAdminStatus(tokens.idToken),
    ]);

    const uiSession = buildUISession(userProfile, email, permissions, functions, isAdmin);

    console.log('✅ Session hydration successful for:', email);

    return handleNormal(res, {
      processStatus: ProcessStatus.SUCCESS,
      message:       ['Session valid'],
      authenticated: true,
      session:       uiSession,
    });
  } catch (err: any) {
    clearAuthCookies(res);
    return handleBackendError(res, err);
  }
};
