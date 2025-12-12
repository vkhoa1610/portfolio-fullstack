import { Request, Response } from 'express';
import { signIn } from '@common/config/cognito-service.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { UserProfile } from '@common/api/get-user.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import {
  LoginRequest,
  LoginResponse,
  MfaRequiredResponse,
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
 * POST /api/auth/login
 * Handles initial login with email/password via AWS Cognito
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
      throwBffError('Email and password are required', 400);
    }

    // TS hint: inputs are valid strings
    const validEmail = email as string;
    const validPassword = password as string;

    console.log('🔐 Login attempt for:', validEmail);

    // Call Cognito InitiateAuth
    const cognitoResponse = await signIn(validEmail, validPassword);

    // Check if MFA is required
    if (cognitoResponse.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      console.log('🔒 MFA required for:', validEmail);
      const response: MfaRequiredResponse = {
        processStatus: ProcessStatus.SUCCESS,
        message: ['MFA required'],
        requireMfa: true,
        challengeName: 'SOFTWARE_TOKEN_MFA',
        session: cognitoResponse.Session || '',
      };
      // Also return username for client to use in MFA request
      res.setHeader('x-cognito-username', validEmail);
      return handleNormal(res, response);
    }

    // No MFA required - process authentication result
    if (cognitoResponse.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

      console.log('✅ Login successful, setting cookies');

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
        message: ['Login successful'],
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
    throwBffError('Login failed');
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
