import { Request, Response } from 'express';
import { respondToNewPasswordChallenge } from '@common/config/cognito-service.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { setAuthCookies } from '@common/config/cookie-config.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { fetchUserProfile, fetchUserPermissions, fetchUserFunctions, fetchUserAdminStatus, buildUISession, getRedirectUrl } from '@common/util/auth-utils.js';
import { NewPasswordRequest, NewPasswordResponse } from '@common/types/auth-types.js';

/**
 * POST /api/auth/new-password
 * Handles NEW_PASSWORD_REQUIRED challenge from Cognito
 *
 * This is triggered on first login when a user was created with a temporary password
 */
export const handle = async (
  req: Request<{}, {}, NewPasswordRequest>,
  res: Response<NewPasswordResponse | ErrorResponse>,
) => {
  try {
    const { username, newPassword, session } = req.body;

    // Validate input
    if (!username || !newPassword || !session) {
      console.log('❌ Missing username, newPassword, or session');
      return throwBffError('Username, new password, and session are required', 400);
    }

    // TS hint: inputs are valid strings
    const validUsername = username as string;
    const validNewPassword = newPassword as string;
    const validSession = session as string;

    console.log('🔑 New password challenge for:', validUsername);

    // Call Cognito RespondToAuthChallenge
    const cognitoResponse = await respondToNewPasswordChallenge(
      validUsername,
      validNewPassword,
      validSession,
    );

    // Process authentication result
    if (!cognitoResponse.AuthenticationResult) {
      console.error('❌ New password challenge failed - no auth result');
      return throwBffError('Failed to set new password', 401);
    }

    const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

    console.log('✅ New password set successfully, setting HttpOnly cookies');

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
    const uiSession = buildUISession(userProfile, validUsername, permissions, functions, isAdmin);
    const redirectTo = getRedirectUrl(userProfile, isAdmin);

    const response: NewPasswordResponse = {
      processStatus: ProcessStatus.SUCCESS,
      message: ['Password updated successfully'],
      authenticated: true,
      session: uiSession,
      redirectTo,
    };

    return handleNormal(res, response);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
