import { Request, Response } from 'express';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { getAuthCookies, clearAuthCookies } from '@common/config/cookie-config.js';
import { revokeToken } from '@common/config/auth0-service.js';
import { handleNormal, handleBackendError } from '@common/util/response-handler.js';
import { LogoutResponse } from '@common/types/auth-types.js';

/**
 * POST /api/auth/logout
 * Revokes Auth0 refresh token and clears all auth cookies.
 * Local logout (clearing cookies) always happens even if revoke fails.
 */
export const handle = async (req: Request, res: Response<LogoutResponse | ErrorResponse>) => {
  try {
    console.log('🚪 Logout request received');

    const tokens = getAuthCookies(req.cookies || {});

    // Revoke refresh token in Auth0 (best effort — non-blocking)
    if (tokens?.refreshToken) {
      await revokeToken(tokens.refreshToken);
    }

    // ALWAYS clear cookies
    clearAuthCookies(res);
    console.log('✅ Auth cookies cleared');

    const response: LogoutResponse = {
      processStatus: ProcessStatus.SUCCESS,
      message:       ['Logged out successfully'],
      authenticated: false,
    };

    return handleNormal(res, response);
  } catch (err: any) {
    clearAuthCookies(res);
    return handleBackendError(res, err);
  }
};
