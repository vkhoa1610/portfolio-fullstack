import { Request, Response } from 'express';
import { handleNormal, handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientPost } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';

/**
 * POST /api/expenses/scan
 * Nhận { fileUrl } từ frontend → forward đến backend → Mock OCR response
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { fileUrl } = req.body;
    const response = await apiClientPost('/api/v1/expenses/scan', { fileUrl }, {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });

    return handleNormal(res, response.data);
  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
