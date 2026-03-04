import { Request, Response } from 'express';
import { respondToMfaChallenge } from '@common/config/cognito-service.js';
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
 * 1. Receives OTP, Cognito session, and email from client
 * 2. Calls Cognito RespondToAuthChallenge
 * 3. On success: Sets HttpOnly cookies with tokens
 * 4. Fetches user profile from Java backend
 * 5. Returns frontend-safe UI session (NO TOKENS!)
 */
export const handle = async (
  req: Request<{}, {}, MfaVerifyRequest>,
  res: Response<MfaVerifyResponse | ErrorResponse>,
) => {
  try {
    const { otp, session, email } = req.body;

    // Validate input
    if (!otp || !session || !email) {
      console.log('❌ Missing OTP, session, or email');
      throwBffError('OTP, session, and email are required', 400);
    }

    // TS hint: inputs are valid strings
    const validOtp = otp as string;
    const validSession = session as string;
    const validEmail = email as string;

    console.log('🔐 MFA verification for:', validEmail);

    // Call Cognito RespondToAuthChallenge
    const cognitoResponse = await respondToMfaChallenge(validEmail, validOtp, validSession);

    // Check if we got authentication tokens
    if (!cognitoResponse.AuthenticationResult) {
      console.error('❌ MFA verification failed - no auth result');
      return throwBffError('MFA verification failed', 401);
    }

    const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

    console.log('✅ MFA verification successful, setting cookies');

    // Set HttpOnly cookies (tokens NEVER go to frontend!)
    setAuthCookies(res, {
      accessToken: AccessToken,
      idToken: IdToken,
      refreshToken: RefreshToken,
    });

    // Fetch user profile + permissions + functions + admin status from Java backend
    const [userProfile, permissions, functions, isAdmin] = await Promise.all([
      fetchUserProfile(IdToken!),
      fetchUserPermissions(IdToken!),
      fetchUserFunctions(IdToken!),
      fetchUserAdminStatus(IdToken!),
    ]);

    // Build frontend-safe UI session
    const uiSession = buildUISession(userProfile, validEmail, permissions, functions, isAdmin);
    const redirectTo = getRedirectUrl(userProfile, isAdmin);

    const response: MfaVerifyResponse = {
      processStatus: ProcessStatus.SUCCESS,
      message: ['MFA verification successful'],
      authenticated: true,
      session: uiSession,
      redirectTo,
    };

    return handleNormal(res, response);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
