import { Request, Response } from 'express';
import { respondToMfaChallenge } from '@common/config/cognito-service.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';
import { API_ENDPOINTS } from '@common/config/api-endpoints.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { UserProfile } from '@common/api/get-user.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { MfaRequest, MfaSuccessResponse } from './bff.type.js';

// Cookie options for security
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

/**
 * POST /api/auth/mfa
 * Handles MFA verification step to complete login
 */
export const handle = async (
  req: Request<{}, {}, MfaRequest>,
  res: Response<MfaSuccessResponse | ErrorResponse>,
) => {
  try {
    const { otp, session } = req.body;
    const username = req.headers['x-cognito-username'] as string;

    // Validate input
    if (!otp || !session) {
      console.log('❌ Missing otp or session');
      throwBffError('OTP and session are required', 400);
    }

    if (!username) {
      console.log('❌ Missing x-cognito-username header');
      throwBffError('Username header is required', 400);
    }

    // TS hint: variables are checked now
    const validOtp = otp as string;
    const validSession = session as string;

    console.log('🔐 MFA verification attempt for:', username);

    // Call Cognito RespondToAuthChallenge
    const cognitoResponse = await respondToMfaChallenge(username, validOtp, validSession);

    // Process authentication result
    if (cognitoResponse.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

      console.log('✅ MFA verification successful, setting cookies');

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
        const javaResponse = await apiClientGet<UserProfile>(API_ENDPOINTS.GET_USER, {
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
      const response: MfaSuccessResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message: ['MFA verification successful'],
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
    console.error('❌ Unexpected Cognito MFA response:', cognitoResponse);
    throwBffError('MFA failed');
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
