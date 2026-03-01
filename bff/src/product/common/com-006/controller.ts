import { Request, Response } from 'express';
import { ProcessStatus, ErrorResponse } from '@common/config/common-types.js';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

interface ConsentRequest {
  policyIds: number[];
}

interface ConsentResponse {
  processStatus: ProcessStatus;
  message: string[];
}

/**
 * POST /api/onboarding/consent
 * Ghi nhận user đồng ý với GDPR và Terms of Service
 *
 * Flow:
 * 1. Validate request (policyIds required)
 * 2. Lấy IP và UserAgent từ request headers
 * 3. Forward đến backend POST /api/v1/onboarding/consent
 * 4. Return success
 */
export const handle = async (
  req: Request<{}, {}, ConsentRequest>,
  res: Response<ConsentResponse | ErrorResponse>,
) => {
  try {
    const { policyIds } = req.body;

    if (!policyIds || !Array.isArray(policyIds) || policyIds.length === 0) {
      return throwBffError('policyIds is required', 400);
    }

    const idToken = req.authTokens?.idToken;
    if (!idToken) {
      return throwBffError('Authentication required', 401);
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    await apiClientPost(
      '/api/v1/onboarding/consent',
      { policyIds, ipAddress, userAgent },
      {
        baseURL: JAVA_API_URL,
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );

    console.log('✅ Consent recorded for user');

    return handleNormal(res, {
      processStatus: ProcessStatus.SUCCESS,
      message: ['Consent recorded'],
    });
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
