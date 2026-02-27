import { Request, Response } from 'express';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

interface ProfileSetupRequest {
  languageCode: string;
}

interface ProfileSetupResponse {
  processStatus: ProcessStatus;
  message: string[];
}

/**
 * POST /api/onboarding/profile
 * Lưu ngôn ngữ user chọn → tạo user_profiles record → onboardingStatus = DONE
 *
 * Flow:
 * 1. Validate languageCode
 * 2. Forward đến backend POST /api/v1/onboarding/profile
 * 3. Return success
 */
export const handle = async (
  req: Request<{}, {}, ProfileSetupRequest>,
  res: Response<ProfileSetupResponse | ErrorResponse>,
) => {
  try {
    const { languageCode } = req.body;

    if (!languageCode) {
      return throwBffError('languageCode is required', 400);
    }

    const idToken = req.authTokens?.idToken;
    if (!idToken) {
      return throwBffError('Authentication required', 401);
    }

    await apiClientPost(
      '/api/v1/onboarding/profile',
      { languageCode },
      {
        baseURL: JAVA_API_URL,
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );

    console.log('✅ Profile saved, onboarding complete');

    return handleNormal(res, {
      processStatus: ProcessStatus.SUCCESS,
      message: ['Profile saved'],
    });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
