import { Request, Response } from 'express';
import { signIn } from '@common/config/auth0-service.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { setAuthCookies } from '@common/config/cookie-config.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { fetchUserProfile, fetchUserPermissions, fetchUserFunctions, fetchUserAdminStatus, buildUISession, getRedirectUrl } from '@common/util/auth-utils.js';
import {
  LoginRequest,
  LoginResponse,
  MfaRequiredResponse,
  LoginSuccessResponse,
  maskEmail,
} from '@common/types/auth-types.js';

/**
 * POST /api/auth/login
 * Handles initial login with email/password via Auth0
 *
 * Possible outcomes:
 * 1. Success (no MFA): Sets HttpOnly cookies, returns UI session
 * 2. MFA Required: Returns mfa_token for MFA verification step
 * 4. Error: Invalid credentials, etc.
 */
export const handle = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response<LoginResponse | ErrorResponse>,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return throwBffError('Email and password are required', 400);
    }

    const validEmail    = email as string;
    const validPassword = password as string;

    console.log('🔐 Login attempt for:', validEmail);

    const result = await signIn(validEmail, validPassword);

    // ── MFA Required ─────────────────────────────────────────────────────────
    if (result.type === 'mfa_required') {
      console.log('🔒 MFA required for:', validEmail);

      const response: MfaRequiredResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message:       ['MFA required'],
        authenticated: false,
        mfaRequired:   true,
        challengeName: 'MFA_REQUIRED',
        session:       result.mfaToken, // carries Auth0 mfa_token (opaque to frontend)
        maskedEmail:   maskEmail(validEmail),
      };

      return handleNormal(res, response);
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (result.type === 'error') {
      console.log('❌ Login failed:', result.message);
      return throwBffError(result.message, 401);
    }

    // ── Success ───────────────────────────────────────────────────────────────
    const { access_token, id_token, refresh_token } = result.data;

    console.log('✅ Login successful, setting HttpOnly cookies');

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

    const uiSession  = buildUISession(userProfile, validEmail, permissions, functions, isAdmin);
    const redirectTo = getRedirectUrl(userProfile, isAdmin);

    const response: LoginSuccessResponse = {
      processStatus: ProcessStatus.SUCCESS,
      message:       ['Login successful'],
      authenticated: true,
      session:       uiSession,
      redirectTo,
    };

    return handleNormal(res, response);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
