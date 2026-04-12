import { Request, Response } from 'express';
import { respondToMfaChallenge } from '@common/config/auth0-service.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { setAuthCookies } from '@common/config/cookie-config.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { fetchUserProfile, fetchUserPermissions, fetchUserFunctions, fetchUserAdminStatus, buildUISession, getRedirectUrl } from '@common/util/auth-utils.js';
import { MfaVerifyRequest, MfaVerifyResponse } from '@common/types/auth-types.js';

/**
 * POST /api/auth/mfa
 * Handles MFA OTP verification after initial login
 *
 * Flow:
 * 1. Receives OTP + mfa_token (as `session` field) + email from client
 * 2. Calls Auth0 /oauth/token with grant_type=mfa-otp
 * 3. On success: Sets HttpOnly cookies, returns UI session
 */
export const handle = async (
  req: Request<{}, {}, MfaVerifyRequest>,
  res: Response<MfaVerifyResponse | ErrorResponse>,
) => {
  try {
    const { otp, session, email } = req.body;

    if (!otp || !session || !email) {
      return throwBffError('OTP, session, and email are required', 400);
    }

    console.log('🔐 MFA verification for:', email);

    // `session` carries the Auth0 mfa_token (set by com-001)
    const result = await respondToMfaChallenge(session, otp);

    if (result.type === 'error') {
      console.error('❌ MFA verification failed:', result.message);
      return throwBffError(result.message, 401);
    }

    const { access_token, id_token, refresh_token } = result.data;

    console.log('✅ MFA verification successful, setting cookies');

    setAuthCookies(res, {
      accessToken:  access_token,
      idToken:      id_token,
      refreshToken: refresh_token,
    });

    const [userProfile, permissions, functions, isAdmin] = await Promise.all([
      fetchUserProfile(id_token),
      fetchUserPermissions(id_token),
      fetchUserFunctions(id_token),
      fetchUserAdminStatus(id_token),
    ]);

    const uiSession  = buildUISession(userProfile, email, permissions, functions, isAdmin);
    const redirectTo = getRedirectUrl(userProfile, isAdmin);

    const response: MfaVerifyResponse = {
      processStatus: ProcessStatus.SUCCESS,
      message:       ['MFA verification successful'],
      authenticated: true,
      session:       uiSession,
      redirectTo,
    };

    return handleNormal(res, response);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
