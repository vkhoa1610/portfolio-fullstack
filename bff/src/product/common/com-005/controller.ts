import { Request, Response } from 'express';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { getAuthCookies, clearAuthCookies } from '@common/config/cookie-config.js';
import { globalSignOut } from '@common/config/cognito-service.js';
import { handleNormal, handleBackendError } from '@common/util/response-handler.js';
import { LogoutResponse } from '@common/types/auth-types.js';

/**
 * POST /api/auth/logout
 * Securely logs out the user
 *
 * Flow:
 * 1. Try to invalidate tokens in Cognito (GlobalSignOut)
 * 2. Clear all auth cookies regardless of Cognito result
 * 3. Return { authenticated: false }
 *
 * IMPORTANT: Local logout (clearing cookies) happens even if
 * Cognito GlobalSignOut fails. This ensures the user is always
 * logged out from the client's perspective.
 */
export const handle = async (req: Request, res: Response<LogoutResponse | ErrorResponse>) => {
  try {
    console.log('🚪 Logout request received');

    // Extract current tokens from cookies
    const tokens = getAuthCookies(req.cookies || {});

    // Try to invalidate tokens in Cognito (best effort)
    if (tokens?.accessToken) {
      try {
        await globalSignOut(tokens.accessToken);
        console.log('✅ Cognito GlobalSignOut successful');
      } catch (cognitoError: any) {
        // Log but don't fail - local logout is more important
        console.warn('⚠️ Cognito GlobalSignOut failed:', cognitoError.message);
        // Common reasons:
        // - Token already expired
        // - Token already revoked
        // - Network issues
        // User will still be logged out locally
      }
    }

    // ALWAYS clear cookies - this is the critical step
    clearAuthCookies(res);
    console.log('✅ Auth cookies cleared');

    const response: LogoutResponse = {
      processStatus: ProcessStatus.SUCCESS,
      message: ['Logged out successfully'],
      authenticated: false,
    };

    return handleNormal(res, response);
  } catch (err: any) {
    // Even on error, try to clear cookies
    clearAuthCookies(res);
    return handleBackendError(res, err);
  }
};
