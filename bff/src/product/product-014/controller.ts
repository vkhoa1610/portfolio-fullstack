import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /api/expenses/scan
 * Upload receipt file → Mock OCR response
 * (file nhận qua multipart/form-data, BFF forward đến backend)
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const response = await apiClientPost('/api/v1/expenses/scan', {}, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
