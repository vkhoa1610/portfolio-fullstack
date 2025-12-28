import { Request, Response } from 'express';
import { respondToNewPasswordChallenge } from '@common/config/cognito-service.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { UserProfile } from '@common/api/get-user.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import {
  NewPasswordRequest,
  NewPasswordResponse,
  LoginSuccessResponse,
} from '@product/product-003/bff.type.js';

// Cookie options for security
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

/**
 * POST /api/auth/new-password
 * Handles NEW_PASSWORD_REQUIRED challenge from Cognito
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
      throwBffError('Username, new password, and session are required', 400);
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
    if (cognitoResponse.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

      console.log('✅ New password set successfully, setting cookies');

      // Set HttpOnly + Secure cookies
      res.cookie('access_token', AccessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
      });
      res.cookie('id_token', IdToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
      });
      res.cookie('refresh_token', RefreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Sync profile from Java backend
      let userProfile: UserProfile = {};
      try {
        console.log('📡 Fetching user profile from Java backend');
        const javaResponse = await apiClientGet<UserProfile>('/api/v1/users/me', {
          baseURL: JAVA_API_URL,
          headers: {
            Authorization: `Bearer ${IdToken}`,
          },
        });
        userProfile = javaResponse.data;
        console.log('✅ User profile fetched:', userProfile);
      } catch (javaError: any) {
        console.warn('⚠️ Failed to fetch user profile from Java:', javaError.message);
        // Continue without profile data - user can still access the app
      }

      const firstLogin = userProfile.onboardingStatus === 'PENDING';
      const response: LoginSuccessResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message: ['Password updated successfully'],
        user: {
          role: userProfile.role,
          budget: userProfile.budget,
          firstLogin,
        },
        redirectUrl: firstLogin ? '/onboarding' : '/dashboard',
      };

      return handleNormal(res, response);
    }

    // Unexpected response from Cognito
    console.error('❌ Unexpected Cognito response:', cognitoResponse);
    throwBffError('Failed to set new password');
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
