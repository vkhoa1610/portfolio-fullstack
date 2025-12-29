import { Request, Response } from 'express';
import { signIn } from '@common/config/cognito-service.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { setAuthCookies } from '@common/config/cookie-config.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { fetchUserProfile, buildUISession, getRedirectUrl } from '@common/util/auth-utils.js';
import {
  LoginRequest,
  LoginResponse,
  MfaRequiredResponse,
  LoginSuccessResponse,
  NewPasswordRequiredResponse,
  maskEmail,
} from '@common/types/auth-types.js';

/**
 * POST /api/auth/login
 * Handles initial login with email/password via AWS Cognito
 *
 * Possible outcomes:
 * 1. Success (no MFA): Sets HttpOnly cookies, returns UI session
 * 2. MFA Required: Returns session token for MFA verification
 * 3. New Password Required: Returns session token for password change
 * 4. Error: Invalid credentials, etc.
 */
export const handle = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response<LoginResponse | ErrorResponse>,
) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return throwBffError('Email and password are required', 400);
    }

    // TS hint: inputs are valid strings
    const validEmail = email as string;
    const validPassword = password as string;

    console.log('🔐 Login attempt for:', validEmail);

    // Call Cognito InitiateAuth
    const cognitoResponse = await signIn(validEmail, validPassword);

    // ─────────────────────────────────────────────────────────────────
    // Case 1: MFA Required
    // ─────────────────────────────────────────────────────────────────
    if (cognitoResponse.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      console.log('🔒 MFA required for:', validEmail);

      const response: MfaRequiredResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message: ['MFA required'],
        authenticated: false,
        mfaRequired: true,
        challengeName: 'SOFTWARE_TOKEN_MFA',
        session: cognitoResponse.Session || '',
        maskedEmail: maskEmail(validEmail),
      };

      return handleNormal(res, response);
    }

    // ─────────────────────────────────────────────────────────────────
    // Case 2: New Password Required (first login with temp password)
    // ─────────────────────────────────────────────────────────────────
    if (cognitoResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      console.log('🔑 New password required for:', validEmail);

      const response: NewPasswordRequiredResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message: ['New password required'],
        authenticated: false,
        newPasswordRequired: true,
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: cognitoResponse.Session || '',
        username: validEmail,
      };

      return handleNormal(res, response);
    }

    // ─────────────────────────────────────────────────────────────────
    // Case 3: Login Success (no MFA)
    // ─────────────────────────────────────────────────────────────────
    if (cognitoResponse.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

      console.log('✅ Login successful, setting HttpOnly cookies');

      // Set HttpOnly cookies (tokens NEVER go to frontend!)
      setAuthCookies(res, {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
      });

      // Fetch user profile from Java backend
      const userProfile = await fetchUserProfile(IdToken!);

      // Build frontend-safe UI session
      const uiSession = buildUISession(userProfile, validEmail);
      const redirectTo = getRedirectUrl(userProfile);

      const response: LoginSuccessResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message: ['Login successful'],
        authenticated: true,
        session: uiSession,
        redirectTo,
      };

      return handleNormal(res, response);
    }

    // ─────────────────────────────────────────────────────────────────
    // Case 4: Unexpected response from Cognito
    // ─────────────────────────────────────────────────────────────────
    console.error('❌ Unexpected Cognito response:', cognitoResponse);
    return throwBffError('Login failed');
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
